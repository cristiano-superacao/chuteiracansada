# Chuteira Cansada

Site responsivo e profissional para gestão do campeonato e do caixa (Associados, Jogadores, Gastos, Saldo, Classificação e Campeonato).

Agora também funciona como **PWA** (pode instalar no celular) e mantém layout otimizado para telas pequenas.

## Visão geral

- **Frontend**: HTML/CSS/JS (arquivos na raiz + `assets/`).
- **Backend**: Node.js + Express (pasta `server/`).
- **Banco**: Postgres (Railway compatível) usando `DATABASE_URL`.
- **Admin**: login por senha via API, com JWT (rotas de escrita protegidas).
- **PWA**: `manifest.json`, `service-worker.js` e ícones em `assets/`.

## Requisitos

- Node.js 18+ (recomendado)
- Um Postgres (local ou Railway)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz (use `.env.example` como base):

- `DATABASE_URL` = URL do Postgres
- `ADMIN_PASSWORD` = senha do admin (você define)
- `ADMIN_JWT_SECRET` = segredo do JWT (string longa)
- `PORT` = (opcional) porta do servidor

> Dica: se `DATABASE_URL` ficar vazio, o servidor sobe em **modo fallback** (sem Postgres). Nesse modo, os endpoints de dados retornam `503` e o site usa **localStorage** como armazenamento.

## Rodar localmente

No diretório do projeto:

- Instalar dependências: `npm install`
- Subir servidor (com watch): `npm run dev`
- Subir servidor (produção): `npm start`
- Abrir: `http://localhost:3000`

O servidor:

- Roda migrações automaticamente na inicialização (`server/schema.sql`).
- Serve o site estático (HTML/CSS/JS) e expõe a API em `/api/*`.

## Como usar (rápido)

### Visitante

- Pode visualizar todas as páginas.
- Pode comentar nos posts do Campeonato.

### Administrador

- Clique em **“Entrar (Admin)”** no topo e informe a senha.
- Ações de edição ficam disponíveis (Adicionar, Remover, Salvar, Importar, etc).

## Endpoints principais

- `GET /api/health` → saúde do servidor
- `POST /api/auth/login` → login admin (retorna token)
- `GET /api/auth/me` → valida token
- `GET /api/data` → carrega todos os dados
- `PUT /api/data` → salva todos os dados (admin-only)
- `POST /api/campeonato/posts/:id/comentarios` → cria comentário público

> Existem também endpoints por módulo (ex.: `/api/associados`, `/api/gastos`, etc.).

## Mobile + instalação (PWA)

### Layout mobile

O CSS já vem com ajustes para telas pequenas:

- Topo (brand + botões) empilha em coluna.
- Menu vira uma barra com scroll horizontal.
- Ações e filtros viram “1 por linha” para facilitar toque.

### Instalar no celular

Requisitos comuns:

- A instalação funciona melhor em **HTTPS** (Railway já fornece). Em `localhost` também funciona para testes.

Android/Chrome:

- Abra o site → menu do navegador → **Instalar app** / **Adicionar à tela inicial**.

iPhone/iPad (Safari):

- Abra o site → botão **Compartilhar** → **Adicionar à Tela de Início**.

### Cache do PWA

- O `service-worker.js` faz cache de páginas e arquivos estáticos.
- Chamadas em `/api/*` **não são cacheadas** para evitar dados desatualizados.

## Deploy no Railway (recomendado)

1. Crie um projeto no Railway e adicione um **Postgres**.
2. Configure as variáveis no Railway:
   - `DATABASE_URL` (Railway fornece)
   - `ADMIN_PASSWORD`
   - `ADMIN_JWT_SECRET`
3. Conecte o Railway ao repositório GitHub (Deploy via GitHub).
4. Railway detecta Node automaticamente e usa `npm start`.

> Observação: o deploy “automático” geralmente é via integração GitHub↔Railway.

## Segurança (importante)

- Sem backend, “admin” seria só visual (não seguro). Aqui, as rotas de escrita ficam protegidas por JWT.
- Não comite `.env`.
- Se uma senha/segredo vazar, **troque imediatamente** e gere um novo `ADMIN_JWT_SECRET`.
