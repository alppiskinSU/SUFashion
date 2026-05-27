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

// Helper: has the current user actually purchased this product? Cancelled
// orders don't count as a purchase.
async function userHasReceivedProduct(userId, productId) {
  const pid = parseInt(productId, 10);
  if (isNaN(pid)) return false;
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', pid)
    .eq('status', 'delivered')
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

// GET /api/reviews/can-review/:product_id — returns what review actions the user can still take.
router.get('/can-review/:product_id', authMiddleware, async (req, res) => {
  try {
    const received = await userHasReceivedProduct(req.user.id, req.params.product_id);
    if (!received) {
      return res.json({ canReview: false, canRateOnly: false, canRateWithComment: false });
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id, comment')
      .eq('user_id', req.user.id)
      .eq('product_id', parseInt(req.params.product_id, 10));

    const hasRatingOnly = (existing || []).some(r => !r.comment || r.comment.trim() === '');
    const hasRatingWithComment = (existing || []).some(r => r.comment && r.comment.trim() !== '');

    const canRateOnly = !hasRatingOnly;
    const canRateWithComment = !hasRatingWithComment;

    res.json({ canReview: canRateOnly || canRateWithComment, canRateOnly, canRateWithComment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or update a review (login + purchase required).
//
// Two-right system per (user, product):
//   Right 1 — Submit a star rating (no comment). Row is inserted, approved immediately.
//   Right 2 — Add a comment to that rating. Row is UPDATED (not inserted), sent for moderation.
//
// This design works with the existing UNIQUE(user_id, product_id) DB constraint
// because the second action updates the existing row instead of inserting a new one.
router.post('/:product_id', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    const purchased = await userHasReceivedProduct(req.user.id, req.params.product_id);
    if (!purchased) {
      return res.status(403).json({ error: 'You can only review products you have purchased.' });
    }

    const hasComment = !!(comment && comment.trim().length > 0);
    const productId = parseInt(req.params.product_id, 10);

    // Fetch existing review for this user+product (at most one row due to unique constraint)
    const { data: existingRows } = await supabase
      .from('reviews')
      .select('id, comment')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .limit(1);

    const existing = existingRows?.[0] ?? null;
    const existingHasComment = !!(existing?.comment && existing.comment.trim() !== '');

    if (!existing) {
      // First submission: INSERT
      const { error } = await supabase.from('reviews').insert({
        user_id: req.user.id,
        product_id: productId,
        rating,
        comment: hasComment ? comment.trim() : null,
        approved: !hasComment,
      });
      if (error) return res.status(500).json({ error: error.message });
    } else if (!existingHasComment && hasComment) {
      // Second submission: user is adding a comment to their rating → UPDATE
      const { error } = await supabase
        .from('reviews')
        .update({ rating, comment: comment.trim(), approved: false })
        .eq('id', existing.id);
      if (error) return res.status(500).json({ error: error.message });
    } else if (!existingHasComment && !hasComment) {
      return res.status(400).json({ error: 'You have already submitted a rating for this product.' });
    } else {
      return res.status(400).json({ error: 'You have already submitted a review with a comment for this product.' });
    }

    // Recompute avg_rating-based popularity
    const { data: allRatings } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (allRatings && allRatings.length > 0) {
      const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
      await supabase
        .from('products')
        .update({ popularity: Math.round(avg * 20) })
        .eq('id', productId);
    }

    res.status(201).json({
      message: hasComment
        ? 'Your rating is live. Your comment is awaiting admin approval and will appear once reviewed.'
        : 'Your rating has been submitted and is now live.',
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
