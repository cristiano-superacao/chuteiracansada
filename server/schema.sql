-- Chuteira Cansada (PostgreSQL) — schema por módulo

-- Configurações globais do app (JSON)
CREATE TABLE IF NOT EXISTS app_config (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Associados
CREATE TABLE IF NOT EXISTS associados (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  apelido TEXT NOT NULL DEFAULT '',
  email TEXT,
  telefone TEXT,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuários (autenticação)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'associado')),
  associado_id BIGINT REFERENCES associados(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS associados_pagamentos (
  id BIGSERIAL PRIMARY KEY,
  associado_id BIGINT NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  mes_key TEXT NOT NULL,
  raw TEXT NOT NULL DEFAULT 'Pendente',
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (associado_id, mes_key)
);

-- Jogadores
CREATE TABLE IF NOT EXISTS jogadores (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  time TEXT NOT NULL DEFAULT '',
  gols INT NOT NULL DEFAULT 0,
  amarelos INT NOT NULL DEFAULT 0,
  vermelhos INT NOT NULL DEFAULT 0,
  suspensoes INT NOT NULL DEFAULT 0
);

ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS jogador_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_jogador_id_fkey'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_jogador_id_fkey
      FOREIGN KEY (jogador_id) REFERENCES jogadores(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_jogador_id_unique_idx
  ON users (jogador_id)
  WHERE jogador_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'associado', 'jogador'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id BIGSERIAL PRIMARY KEY,
  mes TEXT NOT NULL DEFAULT '—',
  data TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  valor NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Entradas (outras arrecadações)
CREATE TABLE IF NOT EXISTS entradas (
  id BIGSERIAL PRIMARY KEY,
  mes TEXT NOT NULL DEFAULT '—',
  data TEXT NOT NULL DEFAULT '',
  origem TEXT NOT NULL DEFAULT '',
  valor NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Classificação / Times
CREATE TABLE IF NOT EXISTS times (
  id BIGSERIAL PRIMARY KEY,
  time TEXT NOT NULL DEFAULT '—',
  pg INT NOT NULL DEFAULT 0,
  j INT NOT NULL DEFAULT 0,
  v INT NOT NULL DEFAULT 0,
  e INT NOT NULL DEFAULT 0,
  der INT NOT NULL DEFAULT 0,
  gf INT NOT NULL DEFAULT 0,
  gs INT NOT NULL DEFAULT 0,
  sg INT NOT NULL DEFAULT 0,
  ca INT NOT NULL DEFAULT 0,
  cv INT NOT NULL DEFAULT 0
);

-- Campeonato
CREATE TABLE IF NOT EXISTS campeonato_jogos (
  id BIGSERIAL PRIMARY KEY,
  rodada TEXT NOT NULL DEFAULT '—',
  data TEXT NOT NULL DEFAULT '',
  hora TEXT NOT NULL DEFAULT '',
  casa TEXT NOT NULL DEFAULT '',
  placar TEXT NOT NULL DEFAULT '',
  fora TEXT NOT NULL DEFAULT '',
  local TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS campeonato_videos (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campeonato_imagens (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  legenda TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS campeonato_posts (
  id TEXT PRIMARY KEY,
  rodada TEXT NOT NULL DEFAULT '—',
  titulo TEXT NOT NULL DEFAULT '',
  texto TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campeonato_comentarios (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES campeonato_posts(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Visitante',
  texto TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
