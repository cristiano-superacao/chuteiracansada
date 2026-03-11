const { getBearerToken, verifyAuthToken } = require('../auth-utils');

function requireAdmin(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  try {
    const payload = verifyAuthToken(token);
    if (payload?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    req.user = payload;
    next();
  } catch (err) {
    if (err?.code === 'SERVER_MISCONFIGURED') {
      return res.status(500).json({ error: 'server_misconfigured' });
    }
    return res.status(401).json({ error: 'unauthorized' });
  }
}

module.exports = { requireAdmin };
