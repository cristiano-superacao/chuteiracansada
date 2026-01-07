# Arquitetura — Chuteira Cansada

## Visão Geral

Sistema full-stack moderno com frontend estático avançado, API REST e banco PostgreSQL. Arquitetura orientada a progressive enhancement com foco em UX profissional e acessibilidade.

## Componentes

### Frontend (estático)

#### Páginas HTML
- `index.html`: Associados e inadimplência
- `jogadores.html`: Estatísticas de jogadores
- `gastos.html`: Controle de despesas
- `saldo.html`: Resumo financeiro e entradas
- `classificacao.html`: Tabela do campeonato
- `campeonato.html`: Jogos, vídeos, imagens e posts

#### Estilos (`assets/styles.css`)

**Design System:**
- Variáveis CSS para temas (light/dark)
- Sistema tipográfico com escala de tamanhos
- Variáveis de duração de transições
- Paleta de cores semântica (brand, danger, ok, muted)

**Componentes:**
- `.card`: container com shadow e hover elevation
- `.btn`: botões com estados de loading e transições
- `.table`: tabelas com sticky columns, striping e skeleton loading
- `.progress-bar`: indicador global de carregamento
- `.toast`: notificações acessíveis

**Responsividade:**
- Breakpoints: 720px (mobile) e 980px (tablet/desktop)
- Grid adaptativo com fallback
- Touch targets mínimos de 44px
- Scroll hints com CSS masks

**Acessibilidade:**
- `.skip-link`: navegação por teclado
- `:focus-visible`: foco visível consistente
- `prefers-reduced-motion`: desabilita animações
- `prefers-color-scheme`: dark mode automático

#### Lógica (`assets/app.js`)

**Gerenciamento de Estado:**
- Estado global em memória com persistência via API
- Fallback para localStorage quando offline
- Normalização automática de dados

**Funcionalidades Principais:**
- **Tema**: persistência, detecção do sistema, meta theme-color dinâmico
- **Progress Indicator**: `progressStart()`/`progressDone()` integrado em `apiFetchJson()`
- **Navegação Ativa**: detecção automática com `aria-current`
- **Autenticação**: JWT em sessionStorage com refresh automático
- **Renderização**: templates dinâmicos para tabelas e cards
- **Importação**: suporte a XLSX e CSV com detecção de encoding
- **Validação**: inline editing com feedback visual
- **Inadimplência**: cálculo automático considerando dias úteis

**Módulos de Renderização:**
- `renderAssociados()`: tabela paginada com filtros
- `renderInadimplentes()`: cálculo dinâmico de atrasos
- `renderJogadores()`: estatísticas editáveis
- `renderGastos()`/`renderEntradas()`: controle financeiro
- `renderTimes()`: classificação ordenada por critérios
- `renderCampeonato()`: jogos em estilo copa + mídia + comentários

**Utilitários:**
- `toast()`: notificações com ARIA live regions
- `money()`: formatação de moeda BRL
- `parseYearMonth()`: manipulação de datas
- `normalizeText()`: normalização de strings
- `ensureXlsxLoaded()`: carregamento lazy do SheetJS

### PWA (Progressive Web App)

**Manifesto (`manifest.json`):**
- Metadados da aplicação (nome, descrição, ícones)
- Display: standalone (tela cheia)
- Theme color: dinâmico via JavaScript
- Orientation: any (portrait/landscape)

**Service Worker (`service-worker.js`):**
- Cache-first para assets estáticos
- Network-first para `/api/*`
- Precache de páginas HTML e assets críticos
- Atualização automática via `skipWaiting()`

**Ícones:**
- `assets/icon-192.png`: ícone padrão
- `assets/icon-512.png`: ícone alta resolução
- Maskable icons para Android Adaptive Icons

### Backend (API)
- `server/index.js`: Express, rotas `/api/*`, serve arquivos estáticos e roda migrações.
- `server/routes/auth.js`: autenticação admin (senha → JWT).
- `server/routes/data.js`: leitura/gravação dos dados e comentários públicos.
- `server/db.js`: conexão Postgres via `DATABASE_URL`.
- `server/schema.sql`: definição das tabelas.

## Persistência

### Estratégia de Dados

- **Fonte de verdade**: Postgres
- **Fallback**: `localStorage` (quando a API estiver offline)

Fluxo padrão:
1. Ao abrir o site, o frontend tenta `GET /api/data`.
2. Em modo admin, o botão **Salvar** faz `PUT /api/data`.
3. Comentários do Campeonato fazem `POST /api/campeonato/posts/:id/comentarios` (público).

### Sincronização

- Auto-save em configurações (debounced 2s)
- Validação antes de persistência
- Retry automático em falhas de rede
- Feedback visual via progress bar e toasts

## UX e Interação

### Feedback Visual

1. **Progress Bar**: topo da tela, ativado em todas as requisições
2. **Skeleton Loading**: tabelas mostram shimmer durante carregamento
3. **Loading Buttons**: spinner integrado com `data-loading="true"`
4. **Toasts**: notificações acessíveis com `role="status"`
5. **Aria-busy**: indicador de estado para screen readers

### Animações e Transições

- **Cards**: hover elevation (translateY -2px)
- **Botões**: micro-interações (hover/active states)
- **Tema**: transição suave de cores (250ms)
- **Progress bar**: animação de preenchimento
- **Skeleton**: shimmer animado (1.5s loop)

Todas as animações respeitam `prefers-reduced-motion`.

### Acessibilidade (WCAG 2.1)

- **Nível AA**: contraste mínimo 4.5:1
- **Touch targets**: mínimo 44x44px
- **Skip links**: navegação por teclado
- **ARIA**: labels, live regions, current state
- **Focus visible**: outline consistente
- **Sem animações**: suporte a reduced-motion

## Segurança

### Autenticação e Autorização

- Ações de escrita exigem token JWT de admin
- Middleware `requireAdmin` valida token em rotas protegidas
- Token armazenado em sessionStorage (não persiste após fechar)
- Visitantes não conseguem chamar `PUT/POST/DELETE /api/*` sem token

### Headers e CORS

- CORS habilitado para desenvolvimento local
- Content-Type validation
- JSON parsing com limites de tamanho

### Validação

- Server-side: validação de tipos e constraints SQL
- Client-side: validação instantânea com feedback visual
- Sanitização de inputs para prevenir XSS

## Cache (PWA)

Estratégia de cache do Service Worker:

- **Assets estáticos**: cache-first (HTML/CSS/JS, manifest e ícones)
- **API**: network-first para `/api/*` (dados sempre atualizados)
- **Precache**: páginas críticas carregadas na instalação
- **Update**: atualização automática do SW sem bloqueio

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
