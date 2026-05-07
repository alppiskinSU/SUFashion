const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// Add a review (login required)
// Rating is immediately active; comment awaits admin approval
router.post('/:product_id', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    const { error } = await supabase.from('reviews').insert({
      user_id: req.user.id,
      product_id: req.params.product_id,
      rating,
      comment: comment || null,
      approved: false,
    });

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({
      message: 'Your rating is live. Your comment will appear after approval.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reviews for a product
// avg_rating is computed from ALL ratings (immediately active)
// comment text is only returned for approved reviews
router.get('/:product_id', async (req, res) => {
  try {
    // Service role bypasses RLS — reads all reviews regardless of approved status
    const { data: allReviews, error } = await supabase
      .from('reviews')
      .select('*, profiles(name)')
      .eq('product_id', req.params.product_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // avg_rating from ALL submitted ratings (not just approved)
    const avg_rating =
      allReviews.length > 0
        ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
        : null;

    // Only expose reviews whose comments have been approved
    const approvedReviews = allReviews
      .filter(r => r.approved)
      .map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        user_name: r.profiles?.name || 'Anonymous',
      }));

    res.json({
      avg_rating,
      review_count: allReviews.length,
      reviews: approvedReviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
