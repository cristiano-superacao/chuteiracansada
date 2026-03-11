const { spawnSync } = require('child_process');
const path = require('path');

// Compatibilidade com scripts antigos: delega para o seed oficial.
const result = spawnSync(process.execPath, [path.join(__dirname, 'seed.js'), '--yes'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error('[seed-database] Falhou ao executar o seed oficial:', result.error);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 0;
}
