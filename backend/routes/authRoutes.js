const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, home_address, tax_id } = req.body;

    // Create user via Supabase Auth (email_confirm: true skips email verification)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) return res.status(400).json({ error: error.message });

    // Save extra profile info
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name, home_address, tax_id })
      .eq('id', data.user.id);

    if (profileError) return res.status(400).json({ error: profileError.message });

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login and get access token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || '',
        role: profile?.role || 'customer',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
