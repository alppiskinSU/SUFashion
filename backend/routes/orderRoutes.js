const express = require('express');
const router = express.Router();
const { supabase } = require('../db'); 
const { authMiddleware } = require('../middleware/authMiddleware'); 
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
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: product.quantity - quantity })
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

module.exports = router;