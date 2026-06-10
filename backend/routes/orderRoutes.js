const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { sendOrderConfirmation } = require('../utils/emailService');

/* ── Helper: restore stock for already-decremented items on batch failure ── */
async function rollbackStocks(rollbacks) {
  for (const { pid, originalQty } of rollbacks) {
    try {
      await supabase.from('products').update({ quantity: originalQty }).eq('id', pid);
    } catch (e) {
      console.error(`[ROLLBACK] Failed to restore stock for product ${pid}:`, e.message);
    }
  }
}

/* ── Status constants ──
 * DB CHECK constraint accepts: processing, shipped, delivered, cancelled
 * Frontend uses "in-transit" as a label → alias mapped to "shipped"
 */
const VALID_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_ALIASES = { 'in-transit': 'shipped' };
const ALLOWED_TRANSITIONS = {
  'processing': ['shipped', 'cancelled'],
  'shipped':    ['delivered', 'cancelled'],
  'delivered':  [],          // terminal state
  'cancelled':  [],          // terminal state
};

// ── Batch order: create multiple order rows under one order_group ──
// POST /api/orders/batch
// Body: { items: [{ product_id, quantity, name }], shipping_address, email, customer_name }
router.post('/batch', authMiddleware, async (req, res) => {
  const { items, shipping_address, email, customer_name } = req.body;
  const user_id = req.user.id;
  console.log('[BATCH] Items received:', items);

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided.' });
  }

  // Generate a unique group id for this checkout
  const order_group = crypto.randomUUID();

  try {
    const createdOrders = [];
    // Tracks original stock values so we can roll back on mid-loop failure.
    const stockRollbacks = [];

    for (const item of items) {
      const { product_id, quantity, name: itemName } = item;

      const pid = parseInt(product_id, 10);
      if (isNaN(pid)) {
        return res.status(400).json({ error: `Invalid product_id: ${product_id}` });
      }

      // 1. Check product exists & get stock/price
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('quantity, price, name')
        .eq('id', pid)
        .single();

      if (fetchError || !product) {
        return res.status(404).json({ error: `Product ${pid} not found` });
      }

      // 2. Check stock (optimistic guard — the atomic update below is the real guard)
      if (product.quantity < quantity) {
        return res.status(400).json({
          error: `Not enough stock for product ${pid}. Available: ${product.quantity}, requested: ${quantity}`,
        });
      }

      // 3. Reduce stock atomically — only updates if quantity is still sufficient,
      //    preventing oversell under concurrent requests.
      const newQty = product.quantity - quantity;
      const { error: updateError, data: updatedRows } = await supabase
        .from('products')
        .update({ quantity: newQty })
        .eq('id', pid)
        .gte('quantity', quantity)
        .select('quantity');

      console.log(`[BATCH] updateError:`, updateError);
      console.log(`[BATCH] updatedRows:`, updatedRows);

      if (updateError) {
        await rollbackStocks(stockRollbacks);
        return res.status(500).json({ error: 'An error occurred while updating stock.' });
      }
      if (!updatedRows || updatedRows.length === 0) {
        await rollbackStocks(stockRollbacks);
        return res.status(400).json({
          error: `Not enough stock for product ${pid}. Please refresh and try again.`,
        });
      }

      // Record original quantity for rollback if a later step fails
      stockRollbacks.push({ pid, originalQty: product.quantity });

      // 4. Create order row — if this fails, roll back all stock decrements
      const total_price = product.price * quantity;
      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert([{
          user_id,
          product_id: pid,
          quantity,
          total_price,
          shipping_address: shipping_address || null,
          order_group,
        }])
        .select('id')
        .single();

      if (insertError) {
        await rollbackStocks(stockRollbacks);
        console.error('[BATCH] Order INSERT failed:', insertError.message);
        return res.status(500).json({ error: 'An error occurred while placing your order.' });
      }

      createdOrders.push({
        order_id: newOrder.id,
        product_id: pid,
        total_price,
        name: product.name || itemName || `Product #${pid}`,
        quantity,
        unit_price: product.price,
      });

      // 5. Update popularity (best-effort, non-critical)
      supabase
        .from('orders')
        .select('id')
        .eq('product_id', pid)
        .neq('status', 'cancelled')
        .then(({ data: orderStats }) => {
          supabase
            .from('products')
            .update({ popularity: (orderStats?.length ?? 0) * 10 })
            .eq('id', pid)
            .catch(() => {});
        })
        .catch(() => {});
    }

    const grandTotal = createdOrders.reduce((s, o) => s + o.total_price, 0);

    res.status(201).json({
      message: 'Order placed successfully!',
      order_group,
      orders: createdOrders,
      total_price: grandTotal,
    });

    // Send confirmation email (non-blocking — order is already confirmed above)
    if (email) {
      const orderDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      sendOrderConfirmation(email, {
        customerName: customer_name || email,
        orderGroup: order_group,
        items: createdOrders,
        shippingAddress: shipping_address || '—',
        grandTotal,
        orderDate,
      }).catch(err => console.error('[Mail] Confirmation failed silently:', err.message));
    }

  } catch (err) {
    console.error('[BATCH] Unexpected error:', err.message);
    res.status(500).json({ error: 'An error occurred while placing your order.' });
  }
});

// GET /api/orders/group/:groupId — fetch all orders in a group
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, products(name, price, image_url)')
      .eq('order_group', req.params.groupId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    if (!orders || orders.length === 0) return res.status(404).json({ error: 'Order group not found' });

    const grandTotal = orders.reduce((s, o) => s + Number(o.total_price || 0), 0);

    res.json({ orders, order_group: req.params.groupId, total_price: grandTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create an order and reduce stock
router.post('/', authMiddleware, async (req, res) => {
  const { product_id, quantity, shipping_address } = req.body;
  const user_id = req.user.id; // Comes safely from the authMiddleware

  try {
    // 1. Check if the product exists and get its stock/price
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('quantity, price')
      .eq('id', product_id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Check if there is enough stock
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    const total_price = product.price * quantity;

    // 3. Reduce the stock atomically
    const newQty = product.quantity - quantity;
    const { error: updateError, data: updatedRows } = await supabase
      .from('products')
      .update({ quantity: newQty })
      .eq('id', product_id)
      .gte('quantity', quantity)
      .select('quantity');

    if (updateError) throw updateError;
    if (!updatedRows || updatedRows.length === 0) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // 4. Create the new order
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert([{
        user_id: user_id,
        product_id: product_id,
        quantity: quantity,
        total_price: total_price,
        shipping_address: shipping_address || null,
      }])
      .select('id')
      .single();

    if (insertError) throw insertError;

    // 5. Recalculate product popularity (total non-cancelled orders × 10)
    const { data: orderStats } = await supabase
      .from('orders')
      .select('id')
      .eq('product_id', product_id)
      .neq('status', 'cancelled');

    const orderCount = orderStats?.length ?? 0;
    await supabase
      .from('products')
      .update({ popularity: orderCount * 10 })
      .eq('id', product_id);

    res.status(201).json({ message: 'Order created successfully!', total_price, order_id: newOrder.id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single order by ID (for OrderConfirmation page)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, products(name, price, image_url)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) return res.status(404).json({ error: 'Order not found' });

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders for the logged-in user (for OrderTracking page)
router.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, products(name, price, image_url)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/admin/all — all orders (admin only)
router.get('/admin/all', authMiddleware, requireRole('admin', 'product_manager'), async (_req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, products(name, price, image_url)')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/admin/deliveries — Req 12 delivery list
// Shape per spec: delivery_id, customer_id, product_id, quantity, total_price,
// delivery_address, completed (true once status='delivered').
router.get('/admin/deliveries', authMiddleware, requireRole('admin', 'product_manager'), async (_req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, user_id, product_id, quantity, total_price, shipping_address, status, created_at, products(name)')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Join customer name from profiles (separate call — RLS is service-role here)
    const userIds = [...new Set((orders || []).map(o => o.user_id).filter(Boolean))];
    let nameById = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, home_address')
        .in('id', userIds);
      nameById = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    }

    const deliveries = (orders || []).map(o => ({
      delivery_id:      o.id,
      customer_id:      o.user_id,
      customer_name:    nameById[o.user_id]?.name || 'Anonymous',
      product_id:       o.product_id,
      product_name:     o.products?.name || '—',
      quantity:         o.quantity,
      total_price:      o.total_price,
      delivery_address: o.shipping_address || nameById[o.user_id]?.home_address || '—',
      completed:        o.status === 'delivered',
      status:           o.status,
      created_at:       o.created_at,
    }));

    res.json({ deliveries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/cancel — Req 13 customer cancel
// Allowed only while the order is still 'processing'. Restores stock.
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  const orderId = req.params.id;
  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, user_id, product_id, quantity')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== req.user.id)
      return res.status(403).json({ error: 'Not your order' });
    if (order.status !== 'processing')
      return res.status(400).json({ error: `Cannot cancel an order that is ${order.status}` });

    // Flip status first so it can't be cancelled twice in a race
    const { cancellation_reason } = req.body;
    const { error: updErr } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellation_reason || null,
      })
      .eq('id', orderId)
      .eq('status', 'processing');
    if (updErr) throw updErr;

    // Restore stock
    const { data: product } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', order.product_id)
      .single();
    if (product) {
      await supabase
        .from('products')
        .update({ quantity: (product.quantity || 0) + order.quantity })
        .eq('id', order.product_id);
    }

    // Recompute popularity (non-cancelled order count × 10) to match POST /
    const { data: orderStats } = await supabase
      .from('orders')
      .select('id')
      .eq('product_id', order.product_id)
      .neq('status', 'cancelled');
    await supabase
      .from('products')
      .update({ popularity: (orderStats?.length ?? 0) * 10 })
      .eq('id', order.product_id);

    res.json({ message: 'Order cancelled', order_id: order.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update all orders in a group to the same status ──
// PATCH /api/orders/group/:groupId/status
router.patch('/group/:groupId/status', authMiddleware, requireRole('admin', 'product_manager'), async (req, res) => {
  let { status } = req.body;
  const { groupId } = req.params;

  if (STATUS_ALIASES[status]) status = STATUS_ALIASES[status];
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('order_group', groupId);

    if (fetchError) throw fetchError;
    if (!orders || orders.length === 0)
      return res.status(404).json({ error: 'Order group not found' });

    for (const order of orders) {
      if (order.status === status) continue;
      const allowed = ALLOWED_TRANSITIONS[order.status || 'processing'] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: `Cannot transition order ${order.id} from "${order.status}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}`,
        });
      }
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_group', groupId);

    if (updateError) throw updateError;

    res.json({ message: `Group updated to ${status}`, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── NEW: Update order status ──
// PATCH /api/orders/:id/status
// Body: { "status": "shipped" } or { "status": "in-transit" } (alias)
router.patch('/:id/status', authMiddleware, requireRole('admin', 'product_manager'), async (req, res) => {
  let { status } = req.body;
  const orderId = req.params.id;

  // Normalise frontend alias → DB value
  if (STATUS_ALIASES[status]) {
    status = STATUS_ALIASES[status];
  }

  // 1. Validate incoming status value
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')} (or alias: ${Object.keys(STATUS_ALIASES).join(', ')})`
    });
  }

  try {
    // 2. Fetch the current order to check ownership & current status
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 3. Validate the transition
    const currentStatus = order.status || 'processing';
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from "${currentStatus}" to "${status}". Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`
      });
    }

    // 4. Perform the update
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('id, status, user_id, product_id, quantity, total_price, created_at')
      .single();

    if (updateError) throw updateError;

    res.json({
      message: `Order status updated: ${currentStatus} → ${status}`,
      order: updatedOrder
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
