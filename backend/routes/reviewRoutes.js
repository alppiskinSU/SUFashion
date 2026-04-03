const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// Add a review (login required)
router.post('/:product_id', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    const { error } = await supabase.from('reviews').insert({
      user_id: req.user.id,
      product_id: req.params.product_id,
      rating,
      comment,
    });

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Review submitted, waiting for approval' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get approved reviews for a product
router.get('/:product_id', async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, profiles(name)')
      .eq('product_id', req.params.product_id)
      .eq('approved', true);

    if (error) return res.status(500).json({ error: error.message });

    const mapped = reviews.map(r => ({
      ...r,
      user_name: r.profiles?.name || 'Anonymous',
      profiles: undefined,
    }));

    res.json({ reviews: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
