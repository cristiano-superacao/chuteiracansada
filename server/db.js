const { Pool } = require('pg');

function makePool() {
  // 1) Tenta variáveis comuns de URL: compatível com Railway/Postgres
  const connectionString =
    process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_URL ||
    process.env.RAILWAY_DATABASE_URL ||
    process.env.URL_DO_BANCO_DE_DADOS ||
    process.env.DATABASE_PRIVATE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PG_DATABASE_URL ||
    process.env.PG_CONNECTION_STRING;

  const isProd = process.env.NODE_ENV === 'production';

  if (connectionString && String(connectionString).trim()) {
    return {
      pool: new Pool({
        connectionString,
        ssl: isProd ? { rejectUnauthorized: false } : undefined,
        keepAlive: true,
        connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 8000),
      }),
      dbEnabled: true,
    };
  }

  // 2) Sem URL? Monta config automaticamente a partir de PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT
  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.PG_DATABASE;
  const port = Number(process.env.PGPORT || process.env.POSTGRES_PORT || '5432');

  const hasDiscreteCreds = Boolean(host && user && password && database);
  if (hasDiscreteCreds) {
    return {
      pool: new Pool({
        host,
        user,
        password,
        database,
        port,
        ssl: isProd ? { rejectUnauthorized: false } : undefined,
        keepAlive: true,
        connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 8000),
      }),
      dbEnabled: true,
    };
  }

  // 3) Sem credenciais: desabilita DB com mensagem clara
  const makeErr = () => {
    const missing = [];
    const add = (k) => { if (!process.env[k]) missing.push(k); };
    ['DATABASE_URL','RAILWAY_DATABASE_URL','PGHOST','PGUSER','PGPASSWORD','PGDATABASE'].forEach(add);
    const err = new Error(`Banco não configurado. Defina DATABASE_URL/RAILWAY_DATABASE_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE no serviço do app. Faltando: ${missing.join(', ')}`);
    err.code = 'DB_DISABLED';
    return err;
  };
  return {
    pool: {
      connect: async () => { throw makeErr(); },
      query: async () => { throw makeErr(); },
    },
    dbEnabled: false,
  };
}

const { pool, dbEnabled } = makePool();

module.exports = { pool, dbEnabled };
