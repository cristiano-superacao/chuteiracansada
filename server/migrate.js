const fs = require('fs');
const path = require('path');
const { pool, dbEnabled } = require('./db');

async function migrate() {
  if (!dbEnabled) return;
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }
}

async function migrateWithRetry(opts = {}) {
  if (!dbEnabled) return;
  const retries = Number(opts.retries ?? 15);
  const delayMs = Number(opts.delayMs ?? 2000);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await migrate();
      console.log(`Migrações aplicadas (tentativa ${attempt}/${retries}).`);
      return;
    } catch (err) {
      const last = attempt === retries;
      console.warn(`Migração falhou (tentativa ${attempt}/${retries}).`, err?.code || err?.message || err);
      if (last) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

module.exports = { migrate, migrateWithRetry };
