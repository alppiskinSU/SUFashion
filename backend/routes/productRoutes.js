const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { sendDiscountNotification } = require('../utils/emailService');

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

// POST /api/products/admin/discount — sales manager discounts selected items (Req 11).
// Sets old_price to the original price, applies the new price, and notifies
// every user whose wishlist (favorites) contains a discounted product.
// Body: { product_ids: [..], discount_rate: 1-90 }
router.post('/admin/discount', authMiddleware, requireRole('admin', 'sales_manager'), async (req, res) => {
  const { product_ids, discount_rate } = req.body;
  const rate = Number(discount_rate);

  if (!Array.isArray(product_ids) || product_ids.length === 0)
    return res.status(400).json({ error: 'product_ids must be a non-empty array' });
  if (!Number.isFinite(rate) || rate < 1 || rate > 90)
    return res.status(400).json({ error: 'discount_rate must be between 1 and 90 (percent)' });

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, old_price')
      .in('id', product_ids);

    if (error) return res.status(500).json({ error: error.message });
    if (!products?.length) return res.status(404).json({ error: 'No matching products found' });

    const updated = [];
    for (const p of products) {
      // Re-discounting an already-discounted item recalculates from the original price
      const base = p.old_price ?? p.price;
      const newPrice = Math.round(base * (100 - rate)) / 100;
      const { data: row, error: upErr } = await supabase
        .from('products')
        .update({ price: newPrice, old_price: base })
        .eq('id', p.id)
        .select('id, name, price, old_price')
        .single();
      if (upErr) return res.status(500).json({ error: upErr.message });
      updated.push(row);
    }

    // Notify wishlist users (failures logged, never block the discount)
    let notified = 0;
    try {
      const ids = updated.map(p => p.id);
      const { data: favs } = await supabase
        .from('favorites')
        .select('user_id, product_id')
        .in('product_id', ids);

      const byUser = new Map();
      for (const f of favs || []) {
        if (!byUser.has(f.user_id)) byUser.set(f.user_id, new Set());
        byUser.get(f.user_id).add(f.product_id);
      }

      const productById = Object.fromEntries(updated.map(p => [p.id, p]));
      for (const [userId, prodIds] of byUser) {
        const { data: u } = await supabase.auth.admin.getUserById(userId);
        const email = u?.user?.email;
        if (!email) continue;
        const { data: prof } = await supabase
          .from('profiles').select('name').eq('id', userId).single();
        const items = [...prodIds].map(pid => ({
          name:     productById[pid].name,
          oldPrice: productById[pid].old_price,
          newPrice: productById[pid].price,
        }));
        const result = await sendDiscountNotification(email, {
          customerName: prof?.name || 'Valued Customer',
          discountRate: rate,
          items,
        });
        if (result.success) notified++;
      }
    } catch (mailErr) {
      console.error('[Discount] wishlist notification failed:', mailErr.message);
    }

    res.json({
      message: `${rate}% discount applied to ${updated.length} product(s); ${notified} wishlist user(s) notified`,
      products: updated,
      notified,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/admin/discount/clear — sales manager ends a discount.
// Restores price from old_price and clears the sale marker.
router.post('/admin/discount/clear', authMiddleware, requireRole('admin', 'sales_manager'), async (req, res) => {
  const { product_ids } = req.body;

  if (!Array.isArray(product_ids) || product_ids.length === 0)
    return res.status(400).json({ error: 'product_ids must be a non-empty array' });

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, old_price')
      .in('id', product_ids)
      .not('old_price', 'is', null);

    if (error) return res.status(500).json({ error: error.message });
    if (!products?.length)
      return res.status(404).json({ error: 'None of the selected products are on discount' });

    const updated = [];
    for (const p of products) {
      const { data: row, error: upErr } = await supabase
        .from('products')
        .update({ price: p.old_price, old_price: null })
        .eq('id', p.id)
        .select('id, name, price, old_price')
        .single();
      if (upErr) return res.status(500).json({ error: upErr.message });
      updated.push(row);
    }

    res.json({ message: `Discount removed from ${updated.length} product(s)`, products: updated });
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
