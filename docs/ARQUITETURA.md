# Arquitetura — Chuteira Cansada

## Componentes
### Frontend (estático)
- Páginas HTML na raiz (`index.html`, `jogadores.html`, `gastos.html`, `saldo.html`, `classificacao.html`, `campeonato.html`).
- Estilos em `assets/styles.css`.
- Lógica em `assets/app.js`.

### PWA (instalável)
- `manifest.json`: metadados do app e ícones.
- `service-worker.js`: cache de páginas/arquivos para melhorar carregamento e tolerância a rede instável.
- Ícones: `assets/icon-192.png` e `assets/icon-512.png`.

### Backend (API)
- `server/index.js`: Express, rotas `/api/*`, serve arquivos estáticos e roda migrações.
- `server/routes/auth.js`: autenticação admin (senha → JWT).
- `server/routes/data.js`: leitura/gravação dos dados e comentários públicos.
- `server/db.js`: conexão Postgres via `DATABASE_URL`.
- `server/schema.sql`: definição das tabelas.

## Persistência
- **Fonte de verdade**: Postgres.
- **Fallback**: `localStorage` (quando a API estiver offline).

Fluxo padrão:
1. Ao abrir o site, o frontend tenta `GET /api/data`.
2. Em modo admin, o botão **Salvar** faz `PUT /api/data`.
3. Comentários do Campeonato fazem `POST /api/campeonato/posts/:id/comentarios` (público).

## Segurança
- Ações de escrita exigem token JWT de admin.
- Visitantes não conseguem chamar `PUT /api/*` sem token.

## Cache (PWA)
- O service worker faz cache de navegação e assets (HTML/CSS/JS, manifest e ícones).
- Requisições para `/api/*` **não são cacheadas** para evitar inconsistência de dados.

## Módulos de dados
- **Associados**: `associados` + `associados_pagamentos` (1 associado → 12 meses).
- **Jogadores**: `jogadores`.
- **Financeiro**: `gastos` e `entradas`.
- **Classificação**: `times`.
- **Campeonato**: jogos (`campeonato_jogos`), vídeos (`campeonato_videos`), imagens (`campeonato_imagens`), posts (`campeonato_posts`) e comentários (`campeonato_comentarios`).

## Observação sobre rotas
O projeto tem um endpoint agregador (`/api/data`) que facilita carregar/salvar o site inteiro de uma vez.
Também existem endpoints por módulo (`/api/associados`, `/api/jogadores`, etc.) para leitura/gravação isolada.

Rotas principais:
- Leitura: `GET /api/data`, `GET /api/associados`, `GET /api/jogadores`, `GET /api/gastos`, `GET /api/entradas`, `GET /api/times`, `GET /api/campeonato`
- Escrita (admin): `PUT /api/data` e `PUT /api/<modulo>`
- CRUD (admin): `POST`/`DELETE` por módulo (ex.: `POST /api/gastos`, `DELETE /api/gastos/:id`)
- Público: `POST /api/campeonato/posts/:id/comentarios`
