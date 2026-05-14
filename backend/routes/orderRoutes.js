const express = require('express');
const router = express.Router();
const { supabase } = require('../db'); 
const { authMiddleware, requireRole } = require('../middleware/authMiddleware'); 

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

// Create an order and reduce stock
router.post('/', authMiddleware, async (req, res) => {
  const { product_id, quantity } = req.body;
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

    // 3. Reduce the stock
    const newQty = product.quantity - quantity;
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: newQty })
      .eq('id', product_id);

    if (updateError) throw updateError;

    // 4. Create the new order
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert([{
        user_id: user_id,
        product_id: product_id,
        quantity: quantity,
        total_price: total_price
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
router.get('/admin/all', authMiddleware, requireRole('admin'), async (_req, res) => {
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
router.get('/admin/deliveries', authMiddleware, requireRole('admin'), async (_req, res) => {
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
    const { error: updErr } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
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

// ── NEW: Update order status ──
// PATCH /api/orders/:id/status
// Body: { "status": "shipped" } or { "status": "in-transit" } (alias)
router.patch('/:id/status', authMiddleware, requireRole('admin'), async (req, res) => {
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
