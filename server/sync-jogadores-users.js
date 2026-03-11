const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { pool, dbEnabled } = require('./db');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function buildFallbackEmail(jogador) {
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

function resolvePassword(jogador) {
  const explicit = String(jogador?.senha || jogador?.password || '').trim();
  if (explicit) return explicit;
  return String(process.env.JOGADOR_DEFAULT_PASSWORD || '123456').trim() || '123456';
}

async function syncJogadoresUsers() {
  if (!dbEnabled) {
    throw new Error('DATABASE_URL ausente. Configure o banco antes de sincronizar usuários.');
  }

  const args = process.argv.slice(2);
  const preservePasswords = args.includes('--preserve-passwords');
  const exportCsv = args.includes('--export-csv') || args.some((a) => a.startsWith('--csv='));
  const csvArg = args.find((a) => a.startsWith('--csv='));
  const csvPath = csvArg
    ? csvArg.slice('--csv='.length)
    : path.join(process.cwd(), 'exports', 'credenciais-jogadores.csv');

  const client = await pool.connect();
  try {
    const jogadores = (await client.query(
      'SELECT id, nome, email, time FROM jogadores ORDER BY id ASC'
    )).rows;

    let created = 0;
    let updated = 0;
    const credentials = [];

    for (const j of jogadores) {
      const fallbackEmail = buildFallbackEmail(j);
      const email = normalizeEmail(j.email) || fallbackEmail;
      const plainPassword = resolvePassword(j);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const existingByJogador = await client.query(
        'SELECT id, password_hash FROM users WHERE jogador_id = $1 LIMIT 1',
        [j.id]
      );

      if (existingByJogador.rowCount > 0) {
        const current = existingByJogador.rows[0];
        await client.query(
          `UPDATE users
           SET email = $1,
               password_hash = $2,
               role = 'jogador',
               associado_id = NULL,
               jogador_id = $3,
               ativo = TRUE
           WHERE id = $4`,
          [
            email,
            preservePasswords ? current.password_hash : hashedPassword,
            j.id,
            current.id,
          ]
        );
        updated += 1;
      } else {
        await client.query(
          `INSERT INTO users (email, password_hash, role, associado_id, jogador_id, ativo)
           VALUES ($1, $2, 'jogador', NULL, $3, TRUE)
           ON CONFLICT (email)
           DO UPDATE SET password_hash = EXCLUDED.password_hash,
                         role = 'jogador',
                         associado_id = NULL,
                         jogador_id = EXCLUDED.jogador_id,
                         ativo = TRUE`,
          [email, hashedPassword, j.id]
        );
        created += 1;
      }

      if (!normalizeEmail(j.email)) {
        await client.query('UPDATE jogadores SET email = $1 WHERE id = $2', [email, j.id]);
      }

      credentials.push({
        nome: j.nome,
        time: j.time || '',
        email,
        senha: preservePasswords ? '(mantida)' : plainPassword,
      });

      console.log(`${j.nome} -> ${email}`);
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
        'nome;time;email;senha',
        ...credentials.map((c) => [c.nome, c.time, c.email, c.senha].map(escapeCsv).join(';')),
      ];
      fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
      console.log(`CSV de credenciais salvo em: ${csvPath}`);
    }

    console.log(`Sincronização concluída. Jogadores: ${jogadores.length}, criados: ${created}, atualizados: ${updated}.`);
  } finally {
    client.release();
    await pool.end();
  }
}

syncJogadoresUsers().catch((err) => {
  console.error('Erro ao sincronizar usuários de jogadores:', err.message || err);
  process.exit(1);
});
