const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
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

  const args = process.argv.slice(2);
  const preservePasswords = args.includes('--preserve-passwords');
  const exportCsv = args.includes('--export-csv') || args.some((a) => a.startsWith('--csv='));
  const csvArg = args.find((a) => a.startsWith('--csv='));
  const csvPath = csvArg
    ? csvArg.slice('--csv='.length)
    : path.join(process.cwd(), 'exports', 'credenciais-associados.csv');

  const client = await pool.connect();
  try {
    const associados = (await client.query(
      'SELECT id, nome, apelido, email FROM associados WHERE ativo = TRUE ORDER BY id ASC'
    )).rows;

    let created = 0;
    let updated = 0;
    const credentials = [];

    for (const a of associados) {
      const email = normalizeEmail(a.email) || buildFallbackEmail(a);
      const plainPassword = resolvePassword(a);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const existingByAssociado = await client.query(
        'SELECT id, email, password_hash FROM users WHERE associado_id = $1 LIMIT 1',
        [a.id]
      );

      if (existingByAssociado.rowCount > 0) {
        const current = existingByAssociado.rows[0];
        await client.query(
          `UPDATE users
           SET email = $1,
               password_hash = $2,
               role = 'associado',
               ativo = TRUE
           WHERE id = $3`,
          [
            email,
            preservePasswords ? current.password_hash : hashedPassword,
            current.id,
          ]
        );
        updated += 1;
      } else {
        await client.query(
          `INSERT INTO users (email, password_hash, role, associado_id, ativo)
           VALUES ($1, $2, 'associado', $3, TRUE)
           ON CONFLICT (email)
           DO UPDATE SET password_hash = EXCLUDED.password_hash,
                         role = 'associado',
                         associado_id = EXCLUDED.associado_id,
                         ativo = TRUE`,
          [email, hashedPassword, a.id]
        );
        created += 1;
      }

      if (!normalizeEmail(a.email)) {
        await client.query('UPDATE associados SET email = $1 WHERE id = $2', [email, a.id]);
      }

      credentials.push({
        nome: a.nome,
        apelido: a.apelido || '',
        email,
        senha: preservePasswords ? '(mantida)' : plainPassword,
      });

      console.log(`${a.nome} -> ${email}`);
    }

    if (exportCsv) {
      const dir = path.dirname(csvPath);
      fs.mkdirSync(dir, { recursive: true });

      const escapeCsv = (value) => {
        const s = String(value ?? '');
        if (/[";,\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const lines = [
        'nome;apelido;email;senha',
        ...credentials.map((c) => [c.nome, c.apelido, c.email, c.senha].map(escapeCsv).join(';')),
      ];
      fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
      console.log(`CSV de credenciais salvo em: ${csvPath}`);
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
