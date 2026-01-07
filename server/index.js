require('dotenv').config();

const express = require('express');
const path = require('path');
const { migrateWithRetry } = require('./migrate');
const { pool, dbEnabled } = require('./db');
const { authRouter } = require('./routes/auth');
const { dataRouter } = require('./routes/data');

const app = express();

app.use(express.json({ limit: '2mb' }));

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

const port = Number(process.env.PORT) || 3000;

(async () => {
  // Sobe o servidor imediatamente para responder health/status
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
  // Executa migrações em background com retry para evitar crashloop enquanto o Postgres sobe
  try {
    await migrateWithRetry({ retries: 20, delayMs: 2000 });
  } catch (err) {
    console.error('Migrações falharam após várias tentativas. A API seguirá executando, mas operações de dados podem falhar até corrigir a conexão ao banco.', err);
  }
})();
