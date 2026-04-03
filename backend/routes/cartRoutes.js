const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

// Add product to cart (works without login)
router.post('/add', async (req, res) => {
  try {
    const { product_id, quantity, session_id } = req.body;
    const user_id = req.body.user_id || null;

    // Check if product exists and is in stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, quantity')
      .eq('id', product_id)
      .single();

    if (productError || !product)
      return res.status(404).json({ error: 'Product not found' });
    if (product.quantity === 0)
      return res.status(400).json({ error: 'Product is out of stock' });

    const { error } = await supabase.from('cart_items').insert({
      user_id,
      product_id,
      quantity: quantity || 1,
      session_id,
    });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Product added to cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cart items by session id
router.get('/:session_id', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('cart_items')
      .select('*, products(name, price, quantity, image_url)')
      .eq('session_id', req.params.session_id);

    if (error) return res.status(500).json({ error: error.message });

    const mapped = items.map(item => ({
      ...item,
      name: item.products?.name,
      price: item.products?.price,
      stock: item.products?.quantity,
      image_url: item.products?.image_url,
      products: undefined,
    }));

    res.json({ items: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove item from cart
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
