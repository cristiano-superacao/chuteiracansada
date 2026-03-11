const jwt = require('jsonwebtoken');

const DEFAULT_ADMIN_EMAIL = 'admin@admin';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getConfiguredAdminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
}

function getJwtSecret() {
  return String(process.env.ADMIN_JWT_SECRET || '').trim();
}

function getConfiguredAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || '');
}

function getBearerToken(req) {
  const auth = String(req.headers?.authorization || '');
  return auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
}

function makeServerMisconfiguredError() {
  const err = new Error('server_misconfigured');
  err.code = 'SERVER_MISCONFIGURED';
  return err;
}

function verifyAuthToken(token) {
  const secret = getJwtSecret();
  if (!secret) throw makeServerMisconfiguredError();
  return jwt.verify(String(token || ''), secret);
}

function signAuthToken(payload, options = {}) {
  const secret = getJwtSecret();
  if (!secret) throw makeServerMisconfiguredError();
  return jwt.sign(payload, secret, { expiresIn: '8h', ...options });
}

module.exports = {
  DEFAULT_ADMIN_EMAIL,
  getBearerToken,
  getConfiguredAdminEmail,
  getConfiguredAdminPassword,
  getJwtSecret,
  makeServerMisconfiguredError,
  normalizeEmail,
  signAuthToken,
  verifyAuthToken,
};