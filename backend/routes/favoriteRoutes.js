const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/favorites — all favorites for the current user with product details
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        product_id,
        products (
          id, name, category, description, price, image_url,
          quantity, is_limited, old_price
        )
      `)
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });

    const favorites = data.map(f => ({
      favoriteId: f.id,
      ...f.products,
      image: f.products.image_url,
      isSoldOut: f.products.quantity === 0,
      isLimited: f.products.is_limited,
      oldPrice: f.products.old_price,
    }));

    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/favorites/check/:productId
router.get('/check/:productId', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.productId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ isFavorited: !!data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/favorites/:productId
router.post('/:productId', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: req.user.id, product_id: req.params.productId });

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/favorites/:productId
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.productId);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
