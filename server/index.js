require('dotenv').config();

const express = require('express');
const path = require('path');
const { migrate } = require('./migrate');
const { authRouter } = require('./routes/auth');
const { dataRouter } = require('./routes/data');

const app = express();

app.use(express.json({ limit: '2mb' }));

// Evita 404 no favicon (polimento)
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
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
  try {
    await migrate();
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Falha ao iniciar:', err);
    process.exit(1);
  }
})();
