const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// GET /api/categories — public list (storefront filter + admin dropdowns)
router.get('/', async (_req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, created_at')
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories — product manager adds a category (Req 12)
router.post('/', authMiddleware, requireRole('admin', 'product_manager'), async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const { data: category, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505')
        return res.status(409).json({ error: `Category "${name}" already exists` });
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id — product manager removes a category (Req 12).
// Products in the category are kept but become uncategorised, so they stay
// searchable and purchasable.
router.delete('/:id', authMiddleware, requireRole('admin', 'product_manager'), async (req, res) => {
  try {
    const { data: category, error: fetchErr } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !category) return res.status(404).json({ error: 'Category not found' });

    const { error: clearErr } = await supabase
      .from('products')
      .update({ category: null })
      .ilike('category', category.name);
    if (clearErr) return res.status(500).json({ error: clearErr.message });

    const { error: delErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);
    if (delErr) return res.status(500).json({ error: delErr.message });

    res.json({ message: `Category "${category.name}" deleted; its products are now uncategorised` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
