const { Pool } = require('pg');

function makePool() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.URL_DO_BANCO_DE_DADOS ||
    process.env.DATABASE_PRIVATE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PG_DATABASE_URL ||
    process.env.PG_CONNECTION_STRING;
  const hasConnectionString = Boolean(connectionString && String(connectionString).trim());
  if (!hasConnectionString) {
    const makeErr = () => {
      const err = new Error('DATABASE_URL não definido. Configure no Railway e/ou .env local.');
      err.code = 'DB_DISABLED';
      return err;
    };
    return {
      pool: {
        connect: async () => {
          throw makeErr();
        },
        query: async () => {
          throw makeErr();
        },
      },
      dbEnabled: false,
    };
  }

  const isProd = process.env.NODE_ENV === 'production';

  return {
    pool: new Pool({
      connectionString,
      ssl: isProd ? { rejectUnauthorized: false } : undefined,
    }),
    dbEnabled: true,
  };
}

const { pool, dbEnabled } = makePool();

module.exports = { pool, dbEnabled };
