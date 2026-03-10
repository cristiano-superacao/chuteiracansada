const path = require('path');
// Garante carregar o .env da raiz do projeto, mesmo se o processo iniciar com cwd diferente
require('dotenv').config({ override: true, path: path.join(__dirname, '..', '.env') });

const http = require('http');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { migrateWithRetry } = require('./migrate');
const { pool, dbEnabled } = require('./db');
const { authRouter } = require('./routes/auth');
const { dataRouter } = require('./routes/data');
const oauthRouter = require('./routes/oauth');

const app = express();

// Log seguro (sem expor senha) para diagnosticar config do banco em runtime
try {
  const raw = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || '';
  const host = raw ? new URL(raw).hostname : null;
  console.log('[db] runtime', { dbEnabled, hasDatabaseUrl: Boolean(raw), host, cwd: process.cwd() });
} catch {
  console.log('[db] runtime', { dbEnabled, hasDatabaseUrl: Boolean(process.env.DATABASE_URL) });
}

app.use(express.json({ limit: '2mb' }));

// Configuração de sessão (necessária para o Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.ADMIN_JWT_SECRET || 'default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializa Passport
app.use(passport.initialize());
app.use(passport.session());

// Evita 404 no favicon (polimento)
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.get('/api/health', async (_req, res) => {
  const base = { ok: true };

  if (!dbEnabled) {
    return res.json({ ...base, db: { enabled: false, connected: false } });
  }

  try {
    await pool.query('SELECT 1');
    return res.json({ ...base, db: { enabled: true, connected: true } });
  } catch {
    return res.json({ ...base, db: { enabled: true, connected: false } });
  }
});
app.use('/api/auth', authRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api', dataRouter);

// Bloqueia acesso a pastas sensíveis via estáticos
app.use((req, res, next) => {
  const p = req.path || '';
  if (p.startsWith('/server') || p.startsWith('/node_modules') || p.startsWith('/.git')) {
    return res.status(404).end();
  }
  next();
});

const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir, { index: false, extensions: ['html'] }));

app.get('/', (_req, res) => res.sendFile(path.join(rootDir, 'index.html')));

const basePort = Number(process.env.PORT) || 3000;

// Em produção (ex.: Railway), a plataforma espera que o app escute exatamente em PORT.
// Em desenvolvimento, permitir fallback (3000, 3001, 3002...) evita falhas intermitentes de EADDRINUSE.
const hasPortEnv = Object.prototype.hasOwnProperty.call(process.env, 'PORT') && String(process.env.PORT).trim() !== '';
const isProd = process.env.NODE_ENV === 'production';
const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
const isPortPinned = process.env.PORT_PINNED === 'true' || (hasPortEnv && (isProd || isRailway));

function listenAsync(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    const onError = (err) => {
      server.removeListener('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve({ server, port });
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port);
  });
}

(async () => {
  // Sobe o servidor imediatamente para responder health/status
  const maxAttempts = isPortPinned ? 1 : 10;

  let started;
  for (let i = 0; i < maxAttempts; i++) {
    const tryPort = basePort + i;
    try {
      started = await listenAsync(tryPort);
      break;
    } catch (err) {
      if (err && err.code === 'EADDRINUSE' && !isPortPinned) {
        console.warn(`Porta ${tryPort} em uso; tentando ${tryPort + 1}...`);
        continue;
      }
      if (err && err.code === 'EADDRINUSE' && isPortPinned) {
        console.error(`PORTA EM USO: a porta ${tryPort} já está ocupada. Finalize o processo que está usando a porta ou escolha outra (ex.: defina PORT=3001).`);
        process.exit(1);
      }
      throw err;
    }
  }

  if (!started) {
    console.error(`Não foi possível iniciar o servidor. Todas as portas de ${basePort} até ${basePort + maxAttempts - 1} estão em uso.`);
    process.exit(1);
  }

  const { port } = started;
  console.log(`Servidor rodando em http://localhost:${port}`);
  if (!isPortPinned && port !== basePort) {
    console.log(`(Nota) Porta ${basePort} estava em uso; usando ${port}.`);
  }

  // Executa migrações em background com retry para evitar crashloop enquanto o Postgres sobe
  try {
    await migrateWithRetry({ retries: 20, delayMs: 2000 });
  } catch (err) {
    console.error('Migrações falharam após várias tentativas. A API seguirá executando, mas operações de dados podem falhar até corrigir a conexão ao banco.', err);
  }
})();
