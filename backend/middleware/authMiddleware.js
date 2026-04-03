const { supabase } = require('../db');

// Checks if the user has a valid Supabase token
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
}

// Checks if the user has the required role (stored in profiles table)
function requireRole(...roles) {
  return async (req, res, next) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!profile || !roles.includes(profile.role))
      return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

module.exports = { authMiddleware, requireRole };
