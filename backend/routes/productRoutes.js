const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// Get all products - supports search, sort and category filter
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { search, sort, category } = req.query;

    let query = `
      SELECT 
        id, name, category, description, price,
        image_url AS image,
        quantity = 0 AS isSoldOut,
        is_limited AS isLimited,
        old_price AS oldPrice,
        quantity, model, serial_number, warranty_status, distributor_info
      FROM products WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (sort === 'price_asc')  query += ' ORDER BY price ASC';
    if (sort === 'price_desc') query += ' ORDER BY price DESC';
    if (sort === 'popularity') query += ' ORDER BY popularity DESC';

    const [products] = await db.query(query, params);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product by id
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.query(
      `SELECT 
        id, name, category, description, price,
        image_url AS image,
        quantity = 0 AS isSoldOut,
        is_limited AS isLimited,
        old_price AS oldPrice,
        quantity, model, serial_number, warranty_status, distributor_info
       FROM products WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;