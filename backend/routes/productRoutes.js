const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Get all products - supports search, sort and category filter
router.get('/', async (req, res) => {
  try {
    const { search, sort, category } = req.query;

    let query = supabase
      .from('products')
      .select('id, name, category, description, price, image_url, quantity, is_limited, old_price, model, serial_number, warranty_status, distributor_info, popularity');

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (sort === 'price_asc')  query = query.order('price', { ascending: true });
    if (sort === 'price_desc') query = query.order('price', { ascending: false });
    if (sort === 'popularity') query = query.order('popularity', { ascending: false });

    const { data: products, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const mapped = products.map(p => ({
      ...p,
      image: p.image_url,
      isSoldOut: p.quantity === 0,
      isLimited: p.is_limited,
      oldPrice: p.old_price,
    }));

    res.json({ products: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product by id
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, category, description, price, image_url, quantity, is_limited, old_price, model, serial_number, warranty_status, distributor_info')
      .eq('id', req.params.id)
      .single();

    if (error || !product) return res.status(404).json({ error: 'Product not found' });

    res.json({
      ...product,
      image: product.image_url,
      isSoldOut: product.quantity === 0,
      isLimited: product.is_limited,
      oldPrice: product.old_price,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — admin only
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, category, description, price, image_url, quantity, is_limited, old_price, model, serial_number, warranty_status, distributor_info } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([{ name, category, description, price, image_url, quantity, is_limited, old_price, model, serial_number, warranty_status, distributor_info }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/products/:id — admin only (used by the stock manager)
// Only allow whitelisted columns to keep this endpoint focused.
router.patch('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const allowed = ['name', 'category', 'description', 'price', 'image_url',
      'quantity', 'is_limited', 'old_price', 'model', 'serial_number',
      'warranty_status', 'distributor_info', 'popularity'];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied.' });
    }

    if (updates.quantity !== undefined) {
      const q = Number(updates.quantity);
      if (!Number.isFinite(q) || q < 0) {
        return res.status(400).json({ error: 'Quantity must be a non-negative number.' });
      }
      updates.quantity = q;
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error)   return res.status(500).json({ error: error.message });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
