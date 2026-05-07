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
