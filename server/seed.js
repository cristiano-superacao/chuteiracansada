const fs = require('fs');
const path = require('path');

// Garante carregar o .env da raiz do projeto
// Não sobrescreve variáveis vindas do ambiente (ex.: Railway).
require('dotenv').config({ override: false, path: path.join(__dirname, '..', '.env') });

const { dbEnabled } = require('./db');
const { replaceAllData } = require('./routes/data');

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    yes: args.has('--yes') || args.has('-y'),
    file: (() => {
      const idx = argv.indexOf('--file');
      if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
      return null;
    })(),
  };
}

async function main() {
  const { yes, file } = parseArgs(process.argv);

  if (!dbEnabled) {
    console.error('[seed] DB está desabilitado (DATABASE_URL ausente).');
    process.exitCode = 2;
    return;
  }

  if (!yes) {
    console.error('[seed] Operação destrutiva: este seed APAGA e recria os dados do banco.');
    console.error('[seed] Para confirmar, rode: node server/seed.js --yes');
    process.exitCode = 3;
    return;
  }

  const seedPath = file
    ? path.isAbsolute(file) ? file : path.join(process.cwd(), file)
    : path.join(__dirname, 'seed.json');

  const raw = fs.readFileSync(seedPath, 'utf8');
  const data = JSON.parse(raw);

  await replaceAllData(data);
  console.log('[seed] OK: seed aplicado com sucesso.');
}

main().catch((err) => {
  console.error('[seed] Falhou:', err);
  process.exitCode = 1;
});
