# Chuteira Cansada

Sistema completo e profissional para gestão de campeonato de futebol e controle financeiro. Interface moderna, responsiva e acessível com tema claro/escuro, progress indicators e experiência otimizada para mobile.

## ✨ Funcionalidades

### Gestão
- **Associados**: controle de mensalidades por mês, filtros avançados e exportação PDF
- **Jogadores**: estatísticas completas (gols, cartões, suspensões)
- **Financeiro**: gastos, entradas e saldo consolidado
- **Classificação**: tabela com critérios de desempate
- **Campeonato**: jogos, vídeos, imagens e sistema de comentários

### UX Profissional
- 🎨 **Temas**: Claro, Escuro e Sistema (automático)
- ⏳ **Progress Bar**: feedback visual em todas as requisições
- ♿ **Acessibilidade**: ARIA labels, foco visível, skip-links, suporte a `prefers-reduced-motion`
- 📱 **Mobile-first**: layout responsivo com touch targets de 44px
- ✨ **Animações**: transições suaves em cards e botões, skeleton loading
- 📊 **Tabelas**: primeira e última colunas fixas, listras para leitura, scroll hints

### PWA (Progressive Web App)
- 📦 **Instalável**: adicione à tela inicial (Android/iOS)
- ⚡ **Cache inteligente**: carregamento rápido offline
- 🔄 **Service Worker**: atualizações automáticas

### 🔐 Autenticação e Controle de Acesso
- **Dois tipos de usuário**: Admin e Associado
- **Login tradicional**: Email + senha com bcrypt
- **Login com Google OAuth**: Associados podem entrar com Gmail do celular
- **JWT tokens**: Sessões seguras de 8 horas
- **Dashboards separados**: Interface específica por role
- **Proteção de rotas**: Verificação de autenticação em todas as páginas

### Login individual por associado

- Cada associado pode ter login próprio com role `associado`.
- O associado tem acesso apenas à área de visualização (`inicio.html`) e aos próprios pagamentos.
- O admin mantém acesso completo de edição.

Sincronizar/gerar credenciais de todos os associados já cadastrados:

- Comando: `npm run sync:associados`
- Senha padrão gerada para associados sem senha explícita: `ASSOCIADO_DEFAULT_PASSWORD` (ou `123456` se não definida)
- Quando o associado não possui email cadastrado, o sistema gera email técnico automaticamente com domínio configurável em `ASSOCIADO_EMAIL_DOMAIN`.

Variáveis opcionais relacionadas:

- `ASSOCIADO_DEFAULT_PASSWORD` = senha padrão para associados
- `ASSOCIADO_EMAIL_DOMAIN` = domínio usado para email técnico quando faltar email no cadastro

> 📖 **Documentação completa**: 
> - [AUTH_README.md](AUTH_README.md) - Autenticação tradicional
> - [GOOGLE_OAUTH.md](GOOGLE_OAUTH.md) - Configurar login com Google

## Visão geral

- **Frontend**: HTML/CSS/JS (arquivos na raiz + `assets/`).
- **Backend**: Node.js + Express (pasta `server/`).
- **Banco**: Postgres (Railway compatível) usando `DATABASE_URL`.
- **Admin**: login por senha via API, com JWT (rotas de escrita protegidas).
- **PWA**: `manifest.json`, `service-worker.js` e ícones em `assets/`.

## 🎨 Design System

### Tema e Cores
- **Light**: fundo claro neutro, textos escuros (paleta estilo portal esportivo)
- **Dark**: fundo escuro (#0c1424), textos claros
- **Sistema**: detecta automaticamente preferência do OS
- Persistência em `localStorage` e atualização de `theme-color` dinâmica

### Tipografia
- Sistema de variáveis CSS para tamanhos consistentes
- Escala: xs (11px) até 3xl (32px)
- Hierarquia clara entre títulos e textos

### Espaçamento e Layout
- Grid responsivo com breakpoints em 720px e 980px
- Cards com elevação e hover effects
- Tabelas com sticky headers e colunas fixas

### Animações
- Transições: fast (150ms), base (250ms), slow (350ms)
- Skeleton loading para feedback de carregamento
- Progress bar global para requisições
- Suporte completo a `prefers-reduced-motion`

## Requisitos

- Node.js 18+ (recomendado)
- Um Postgres (local ou Railway)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz (use `.env.example` como base):

**Obrigatórias:**
- `DATABASE_URL` = URL do Postgres
- `ADMIN_PASSWORD` = senha do admin (você define)
- `ADMIN_JWT_SECRET` = segredo do JWT (string longa)
- `SESSION_SECRET` = segredo para sessões (string longa)

**Opcionais:**
- `PORT` = porta do servidor (padrão: 3000)
- `GOOGLE_CLIENT_ID` = ID do cliente Google OAuth (para login com Gmail)
- `GOOGLE_CLIENT_SECRET` = Secret do cliente Google OAuth
- `GOOGLE_CALLBACK_URL` = URL de callback do OAuth (ex: `https://seu-dominio.com/api/oauth/google/callback`)

> Dica: se `DATABASE_URL` ficar vazio, o servidor sobe em **modo fallback** (sem Postgres). Nesse modo, os endpoints de dados retornam `503` e o site usa **localStorage** como armazenamento.

## Rodar localmente

No diretório do projeto:

- Instalar dependências: `npm install`
- Subir servidor (com watch): `npm run dev`
- Subir servidor (produção): `npm start`
- (Opcional) Aplicar seed no banco (destrutivo): `npm run seed`
- (Recomendado) Smoke test de funcionalidades: `npm run smoke`
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

### Layout mobile aprimorado

O CSS utiliza técnicas modernas de responsividade:

- **Navegação**: barra com scroll horizontal e máscaras visuais nas bordas
- **Touch targets**: botões e ícones com mínimo de 44px (WCAG 2.1)
- **Filtros**: layout em grid 2 colunas para melhor organização
- **Tabelas**: scroll horizontal com colunas fixas e hints visuais
- **Cards**: empilhamento automático em telas pequenas
- **Tipografia**: escala reduzida automaticamente (22px → para títulos)

### Instalar no celular

Requisitos:

- Funciona melhor em **HTTPS** (Railway fornece automaticamente)
- Em `localhost` também funciona para desenvolvimento
- Navegadores modernos com suporte a PWA

**Android/Chrome:**

1. Abra o site
2. Menu do navegador (3 pontos)
3. **"Instalar app"** ou **"Adicionar à tela inicial"**
4. Confirme a instalação

**iPhone/iPad (Safari):**

1. Abra o site
2. Botão **"Compartilhar"** (🔼)
3. **"Adicionar à Tela de Início"**
4. Confirme o nome e adicione

**Vantagens:**
- Ícone na tela inicial
- Abre em tela cheia (sem barras do navegador)
- Notificações push (futuro)
- Funciona offline (páginas cacheadas)

### Cache do PWA

- O `service-worker.js` faz cache de páginas e arquivos estáticos.
- Chamadas em `/api/*` **não são cacheadas** para evitar dados desatualizados.

## Deploy no Railway (recomendado)

### Performance e Otimizações

O sistema já inclui:

- **CSS minificado**: variáveis e classes otimizadas
- **Service Worker**: cache estratégico de assets
- **Lazy loading**: tabelas carregam sob demanda
- **Compressão**: Express com gzip habilitado
- **Skeleton loading**: feedback imediato ao usuário

### Deploy Passo a Passo

1. Crie um projeto no Railway e adicione um **Postgres**.
2. Configure as variáveis no Railway:
   - `DATABASE_URL` (Railway fornece)
   - `ADMIN_PASSWORD`
   - `ADMIN_JWT_SECRET`
3. Conecte o Railway ao repositório GitHub (Deploy via GitHub).
4. Railway detecta Node automaticamente e usa `npm start`.

> Observação: o deploy “automático” geralmente é via integração GitHub↔Railway.

### Acesso de outro computador (dados na nuvem)

- Com deploy no Railway e `DATABASE_URL` configurada, os dados são centralizados no Postgres (nuvem).
- Em outro computador, basta acessar a URL pública e entrar com email/senha do usuário.
- Para garantir que todos os associados tenham credenciais válidas após importações, execute `npm run sync:associados` no ambiente com acesso ao banco.

## Segurança (importante)

- Sem backend, “admin” seria só visual (não seguro). Aqui, as rotas de escrita ficam protegidas por JWT.
- Não comite `.env`.
- Se uma senha/segredo vazar, **troque imediatamente** e gere um novo `ADMIN_JWT_SECRET`.
