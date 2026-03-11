const bcrypt = require('bcrypt');
const { pool, dbEnabled } = require('./db');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function buildFallbackEmail(associado) {
  const id = Number(associado?.id) || 0;
  const base = String(associado?.apelido || associado?.nome || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 40);
  const localPart = base || `associado.${id}`;
  const domain = String(process.env.ASSOCIADO_EMAIL_DOMAIN || 'associado.chuteira.local').trim().toLowerCase();
  return `${localPart}.${id}@${domain}`;
}

function resolvePassword(associado) {
  const explicit = String(associado?.senha || associado?.password || '').trim();
  if (explicit) return explicit;
  return String(process.env.ASSOCIADO_DEFAULT_PASSWORD || '123456').trim() || '123456';
}

async function syncAssociadosUsers() {
  if (!dbEnabled) {
    throw new Error('DATABASE_URL ausente. Configure o banco antes de sincronizar usuários.');
  }

  const client = await pool.connect();
  try {
    const associados = (await client.query(
      'SELECT id, nome, apelido, email FROM associados WHERE ativo = TRUE ORDER BY id ASC'
    )).rows;

    let created = 0;
    let updated = 0;

    for (const a of associados) {
      const email = normalizeEmail(a.email) || buildFallbackEmail(a);
      const passwordHash = await bcrypt.hash(resolvePassword(a), 10);

      const existedBefore = await client.query('SELECT 1 FROM users WHERE associado_id = $1 LIMIT 1', [a.id]);

      await client.query(
        `INSERT INTO users (email, password_hash, role, associado_id, ativo)
         VALUES ($1, $2, 'associado', $3, TRUE)
         ON CONFLICT (email)
         DO UPDATE SET password_hash = EXCLUDED.password_hash,
                       role = 'associado',
                       associado_id = EXCLUDED.associado_id,
                       ativo = TRUE,
                       email = EXCLUDED.email
         RETURNING id`,
        [email, passwordHash, a.id]
      );

      if (!normalizeEmail(a.email)) {
        await client.query('UPDATE associados SET email = $1 WHERE id = $2', [email, a.id]);
      }

      if (existedBefore.rowCount > 0) updated += 1;
      else created += 1;

      console.log(`${a.nome} -> ${email}`);
    }

    console.log(`Sincronização concluída. Associados: ${associados.length}, criados: ${created}, atualizados: ${updated}.`);
  } finally {
    client.release();
    await pool.end();
  }
}

syncAssociadosUsers().catch((err) => {
  console.error('Erro ao sincronizar usuários de associados:', err.message || err);
  process.exit(1);
});
