const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'server_misconfigured' });

  try {
    const payload = jwt.verify(token, secret);
    if (payload?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

module.exports = { requireAdmin };
