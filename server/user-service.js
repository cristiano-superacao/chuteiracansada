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

function normalizePlayerEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function buildPlayerFallbackEmail(jogador) {
  const id = Number(jogador?.id) || 0;
  const base = String(jogador?.nome || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 40);
  const localPart = base || `jogador.${id}`;
  const domain = String(process.env.JOGADOR_EMAIL_DOMAIN || 'jogador.chuteira.local').trim().toLowerCase();
  return `${localPart}.${id}@${domain}`;
}

async function syncJogadorUsers(options = {}) {
  const client = options.client || pool;
  const defaultPassword = String(process.env.JOGADOR_DEFAULT_PASSWORD || '123456').trim() || '123456';
  const defaultHash = await bcrypt.hash(defaultPassword, 10);

  const jogadoresRes = await client.query('SELECT id, nome, email FROM jogadores ORDER BY id ASC');
  let created = 0;
  let updated = 0;

  for (const jogador of jogadoresRes.rows) {
    const fallbackEmail = buildPlayerFallbackEmail(jogador);
    const preferredEmail = normalizePlayerEmail(jogador.email) || fallbackEmail;

    const byJogador = await client.query('SELECT id FROM users WHERE jogador_id = $1 LIMIT 1', [jogador.id]);

    if (byJogador.rowCount > 0) {
      try {
        await client.query(
          `UPDATE users
           SET email = $1,
               role = 'jogador',
               associado_id = NULL,
               jogador_id = $2,
               ativo = TRUE
           WHERE id = $3`,
          [preferredEmail, jogador.id, byJogador.rows[0].id]
        );
      } catch (err) {
        if (err?.code !== '23505') throw err;
        await client.query(
          `UPDATE users
           SET email = $1,
               role = 'jogador',
               associado_id = NULL,
               jogador_id = $2,
               ativo = TRUE
           WHERE id = $3`,
          [fallbackEmail, jogador.id, byJogador.rows[0].id]
        );
      }
      updated += 1;
    } else {
      try {
        await client.query(
          `INSERT INTO users (email, password_hash, role, associado_id, jogador_id, ativo)
           VALUES ($1, $2, 'jogador', NULL, $3, TRUE)`,
          [preferredEmail, defaultHash, jogador.id]
        );
      } catch (err) {
        if (err?.code !== '23505') throw err;
        await client.query(
          `INSERT INTO users (email, password_hash, role, associado_id, jogador_id, ativo)
           VALUES ($1, $2, 'jogador', NULL, $3, TRUE)`,
          [fallbackEmail, defaultHash, jogador.id]
        );
      }
      created += 1;
    }

    if (!normalizePlayerEmail(jogador.email)) {
      await client.query('UPDATE jogadores SET email = $1 WHERE id = $2', [preferredEmail, jogador.id]);
    }
  }

  return { total: jogadoresRes.rowCount, created, updated };
}

module.exports = {
  ensureAdminUser,
  syncJogadorUsers,
};