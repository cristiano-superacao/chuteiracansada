const bcrypt = require('bcrypt');

const { pool } = require('./db');
const { getConfiguredAdminEmail, getConfiguredAdminPassword, normalizeEmail } = require('./auth-utils');

async function ensureAdminUser(options = {}) {
  const client = options.client || pool;
  const email = normalizeEmail(options.email || getConfiguredAdminEmail());
  const password = String(options.password || getConfiguredAdminPassword() || '');

  if (!email || !password) {
    return { ensured: false, reason: 'missing_admin_credentials' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await client.query(
    `INSERT INTO users (email, password_hash, role, associado_id, ativo)
     VALUES ($1, $2, 'admin', NULL, TRUE)
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash,
                   role = 'admin',
                   associado_id = NULL,
                   ativo = TRUE
     RETURNING id, email`,
    [email, passwordHash]
  );

  return {
    ensured: true,
    user: result.rows[0] || null,
  };
}

module.exports = {
  ensureAdminUser,
};