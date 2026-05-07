const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// ─── STATIC ROUTES FIRST (before :param routes) ───

// GET /api/reviews/pending — list all pending reviews (admin only)
router.get('/pending', authMiddleware, requireRole('admin'), async (_req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, profiles(name), products(name)')
      .eq('approved', false)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const mapped = reviews.map(r => ({
      ...r,
      user_name: r.profiles?.name || 'Anonymous',
      product_name: r.products?.name || 'Unknown Product',
      profiles: undefined,
      products: undefined,
    }));

    res.json({ reviews: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PARAMETERIZED ROUTES ───

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

    res.status(201).json({
      message: 'Rating added immediately. Your comment is awaiting approval.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reviews for a product
// Ratings are visible immediately; comment text is hidden until approved.
router.get('/:product_id', async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', req.params.product_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Fetch the matching profile names in a separate query (no FK between
    // reviews.user_id and profiles.id is defined in this schema).
    const userIds = [...new Set((reviews || []).map(r => r.user_id).filter(Boolean))];
    let nameById = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      nameById = Object.fromEntries((profiles || []).map(p => [p.id, p.name]));
    }

    const mapped = (reviews || []).map(r => ({
      ...r,
      user_name: nameById[r.user_id] || 'Anonymous',
      comment: r.approved ? r.comment : null,
      comment_pending: !r.approved,
    }));

    res.json({ reviews: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reviews/:id/approve — admin only
router.patch('/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ approved: true })
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Review approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reviews/:id/reject — deletes the review (admin only)
router.patch('/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Review rejected and removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
