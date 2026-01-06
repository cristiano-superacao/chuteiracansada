const { Pool } = require('pg');

function makePool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL não definido. Configure no Railway e/ou .env local.');
  }

  const isProd = process.env.NODE_ENV === 'production';

  return new Pool({
    connectionString,
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
  });
}

const pool = makePool();

module.exports = { pool };
