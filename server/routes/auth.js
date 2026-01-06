const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  const password = String(req.body?.password ?? '');
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!expected || !secret) {
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  if (password !== expected) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h' });
  return res.json({ token });
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!token || !secret) return res.json({ admin: false });

  try {
    const payload = jwt.verify(token, secret);
    return res.json({ admin: payload?.role === 'admin' });
  } catch {
    return res.json({ admin: false });
  }
});

module.exports = { authRouter: router };
