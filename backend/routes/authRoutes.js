const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('../middleware/authMiddleware');

// Dedicated client for password sign-in / token refresh. These calls attach
// the resulting user session to the client they run on — if they ran on the
// shared service-role client, every later DB query from any request would
// execute as the last logged-in user (RLS) instead of as service role.
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Validate and sanitize a string field
const sanitize = (val) => (typeof val === 'string' ? val.trim() : '');
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const name     = sanitize(req.body.name);
    const email    = sanitize(req.body.email).toLowerCase();
    const password = sanitize(req.body.password);
    const home_address = sanitize(req.body.home_address);
    const tax_id   = sanitize(req.body.tax_id);

    if (!email || !isValidEmail(email))
      return res.status(400).json({ error: 'A valid email address is required.' });
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (!name)
      return res.status(400).json({ error: 'Name is required.' });

    // Create user via Supabase Auth (email_confirm: true skips email verification)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) return res.status(400).json({ error: error.message });

    // Save extra profile info. A DB trigger on auth.users may already have
    // inserted a profiles row, so use upsert with onConflict to update it
    // rather than fight an RLS-blocked insert. If profile persistence still
    // fails (e.g. RLS policy), the auth user is already created — we log the
    // issue, warn the client, but treat the signup itself as successful so
    // the user isn't left in limbo. Login will lazily backfill the profile.
    const profileData = { id: data.user.id, name, home_address, tax_id, role: 'customer' };

    // Try insert first (no trigger row yet)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (insertError) {
      // Row already exists (trigger created it) — update instead
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ name, home_address, tax_id, role: 'customer' })
        .eq('id', data.user.id);

      if (updateError) {
        console.warn('[register] profile update failed:', updateError.message);
      }
    }

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// Login and get access token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    let { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', data.user.id)
      .single();

    // Lazily create a profile row if signup couldn't persist one earlier.
    // This is a no-op once the row exists.
    if (!profile) {
      await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, name: '', role: 'customer' },
          { onConflict: 'id' }
        );
      profile = { name: '', role: 'customer' };
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || '',
        role: profile?.role || 'customer',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token });
  if (error || !data.session) return res.status(401).json({ error: 'Session expired, please log in again' });

  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

// GET /api/auth/profile — fetch current user's profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, home_address, tax_id, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      profile: {
        id: profile.id,
        name: profile.name || '',
        email: userEmail,
        home_address: profile.home_address || '',
        tax_id: profile.tax_id || '',
        role: profile.role || 'customer',
        created_at: profile.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile — update current user's profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, home_address, tax_id, password } = req.body;

    // Update profile fields in profiles table
    const updates = {};
    if (name !== undefined) updates.name = sanitize(name);
    if (home_address !== undefined) updates.home_address = sanitize(home_address);
    if (tax_id !== undefined) updates.tax_id = sanitize(tax_id);

    if (Object.keys(updates).length > 0) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (profileErr) {
        return res.status(500).json({ error: 'Failed to update profile: ' + profileErr.message });
      }
    }

    // Update password if provided (via Supabase Auth admin API)
    if (password && password.length >= 6) {
      const { error: pwErr } = await supabase.auth.admin.updateUserById(userId, { password });
      if (pwErr) {
        return res.status(400).json({ error: 'Failed to update password: ' + pwErr.message });
      }
    } else if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Also update the name in session storage on the client side
    // by returning the updated profile
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('id, name, home_address, tax_id, role, created_at')
      .eq('id', userId)
      .single();

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        name: updatedProfile.name || '',
        email: req.user.email,
        home_address: updatedProfile.home_address || '',
        tax_id: updatedProfile.tax_id || '',
        role: updatedProfile.role || 'customer',
        created_at: updatedProfile.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
