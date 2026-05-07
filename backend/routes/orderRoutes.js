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
