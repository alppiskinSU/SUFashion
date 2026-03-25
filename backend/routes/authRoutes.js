const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, home_address, tax_id } = req.body;
    const db = getDB();

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (name, email, password, home_address, tax_id) VALUES (?,?,?,?,?)',
      [name, email, hashedPassword, home_address, tax_id]
    );
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(400).json({ error: 'Email already registered' });
  }
});

// Login and get JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();

    // Check if user exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'User not found' });

    // Check if password is correct
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Wrong password' });

    // Create and send token
    const token = jwt.sign(
      { id: rows[0].id, role: rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: rows[0].id, name: rows[0].name, role: rows[0].role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;