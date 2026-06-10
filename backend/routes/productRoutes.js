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
      query = query.ilike('category', category);
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

// GET /api/products/admin/pricing — sales manager pricing view (Req 11).
// Includes the purchase cost, which is never exposed on the public endpoints.
router.get('/admin/pricing', authMiddleware, requireRole('admin', 'sales_manager'), async (_req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, category, image_url, price, old_price, cost, quantity')
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — product manager adds products (Req 12)
router.post('/', authMiddleware, requireRole('admin', 'product_manager'), async (req, res) => {
  try {
    const { name, category, description, price, image_url, quantity, is_limited, old_price, model, serial_number, warranty_status, distributor_info, cost } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    // Default purchase cost to 50% of sale price; sales manager can adjust it later
    const resolvedCost = cost ?? Math.round(Number(price) * 50) / 100;

    const { data: product, error } = await supabase
      .from('products')
      .insert([{ name, category, description, price, image_url, quantity, is_limited, old_price, model, serial_number, warranty_status, distributor_info, cost: resolvedCost }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/products/:id — role-scoped product updates (Req 10/11/12):
//   sales_manager   → pricing fields only (sets the prices, Req 11)
//   product_manager → catalog/stock fields, but NOT prices (Req 12)
//   admin           → everything
const PRICING_FIELDS = ['price', 'old_price', 'cost'];
const CATALOG_FIELDS = ['name', 'category', 'description', 'image_url',
  'quantity', 'is_limited', 'model', 'serial_number',
  'warranty_status', 'distributor_info', 'popularity'];

router.patch('/:id', authMiddleware, requireRole('admin', 'sales_manager', 'product_manager'), async (req, res) => {
  try {
    const allowed =
      req.userRole === 'sales_manager'   ? PRICING_FIELDS :
      req.userRole === 'product_manager' ? CATALOG_FIELDS :
      [...CATALOG_FIELDS, ...PRICING_FIELDS];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields supplied that your role may edit.' });
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

// DELETE /api/products/:id — product manager removes products (Req 12)
router.delete('/:id', authMiddleware, requireRole('admin', 'product_manager'), async (req, res) => {
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
