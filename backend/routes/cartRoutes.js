const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// Add product to cart (works without login)
router.post('/add', async (req, res) => {
  try {
    const db = getDB();
    const { product_id, quantity, session_id } = req.body;
    const user_id = req.body.user_id || null;

    // Check if product exists and is in stock
    const [product] = await db.query(
      'SELECT * FROM products WHERE id = ?', [product_id]
    );
    if (!product.length)
      return res.status(404).json({ error: 'Product not found' });
    if (product[0].quantity === 0)
      return res.status(400).json({ error: 'Product is out of stock' });

    await db.query(
      'INSERT INTO cart_items (user_id, product_id, quantity, session_id) VALUES (?,?,?,?)',
      [user_id, product_id, quantity || 1, session_id]
    );
    res.json({ message: 'Product added to cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cart items by session id
router.get('/:session_id', async (req, res) => {
  try {
    const db = getDB();
    const [items] = await db.query(
      `SELECT ci.*, p.name, p.price, p.quantity as stock, p.image_url
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.session_id = ?`,
      [req.params.session_id]
    );
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove item from cart
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    await db.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;