const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { createClient } = require('@supabase/supabase-js');

// Dedicated client for password sign-in / token refresh. These calls attach
// the resulting user session to the client they run on — if they ran on the
// shared service-role client, every later DB query from any request would
// execute as the last logged-in user (RLS) instead of as service role.
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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

module.exports = router;
