const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// Add a review (login required)
router.post('/:product_id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { rating, comment } = req.body;

    // Rating must be between 1 and 5
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?,?,?,?)',
      [req.user.id, req.params.product_id, rating, comment]
    );
    res.status(201).json({ message: 'Review submitted, waiting for approval' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get approved reviews for a product
router.get('/:product_id', async (req, res) => {
  try {
    const db = getDB();
    const [reviews] = await db.query(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.approved = true`,
      [req.params.product_id]
    );
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;