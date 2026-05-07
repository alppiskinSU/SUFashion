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
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const userIds    = [...new Set((reviews || []).map(r => r.user_id).filter(Boolean))];
    const productIds = [...new Set((reviews || []).map(r => r.product_id).filter(Boolean))];

    const [{ data: profiles }, { data: products }] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('id, name').in('id', userIds)
        : Promise.resolve({ data: [] }),
      productIds.length
        ? supabase.from('products').select('id, name').in('id', productIds)
        : Promise.resolve({ data: [] }),
    ]);

    const nameById    = Object.fromEntries((profiles || []).map(p => [p.id, p.name]));
    const productById = Object.fromEntries((products || []).map(p => [p.id, p.name]));

    const mapped = (reviews || []).map(r => ({
      ...r,
      user_name:    nameById[r.user_id]       || 'Anonymous',
      product_name: productById[r.product_id] || 'Unknown Product',
    }));

    res.json({ reviews: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PARAMETERIZED ROUTES ───

// Add a review (login required)
// Rating is immediately active; comment awaits admin approval
router.post('/:product_id', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    const hasComment = comment && comment.trim().length > 0;
    const { error } = await supabase.from('reviews').insert({
      user_id: req.user.id,
      product_id: req.params.product_id,
      rating,
<<<<<<< HEAD
      comment: hasComment ? comment : null,
      approved: !hasComment,
=======
      comment: comment || null,
      approved: false,
>>>>>>> 6de41418397e2738934e6f6fd11f91f35cdacc50
    });

    if (error) return res.status(500).json({ error: error.message });

    // Update product popularity = avg_rating across all reviews (rating-based sort)
    const { data: allRatings } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', req.params.product_id);

    if (allRatings && allRatings.length > 0) {
      const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
      await supabase
        .from('products')
        .update({ popularity: Math.round(avg * 20) })
        .eq('id', req.params.product_id);
    }

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
    const { data: allReviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', req.params.product_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const userIds = [...new Set((allReviews || []).map(r => r.user_id).filter(Boolean))];
    let nameById = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      nameById = Object.fromEntries((profiles || []).map(p => [p.id, p.name]));
    }

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
        user_name: nameById[r.user_id] || 'Anonymous',
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
