/* Chuteira Cansada — UI (frontend) + persistência via API (backend) */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

const STORAGE_KEY = 'chuteiraCansada.v1';

const ADMIN_SESSION_KEY = 'chuteiraCansada.adminSession.v1';
const ADMIN_TOKEN_KEY = 'chuteiraCansada.adminToken.v1';

const LOCAL_FALLBACK_NOTICE_KEY = 'chuteiraCansada.localFallbackNotice.v1';
const COMMENT_FALLBACK_NOTICE_KEY = 'chuteiraCansada.commentFallbackNotice.v1';

const CONFIG_AUTOSAVE_TOAST_KEY = 'chuteiraCansada.configAutosaveToast.v1';

const API_BASE = '/api';

const MENSALIDADE = 30;

const INADIMPLENCIA_MIN_START_YM = '2026-01';

const CAMPEONATO_MAX_RODADAS = 10;
const CAMPEONATO_JOGOS_POR_RODADA = 3;
const CAMPEONATO_HORARIOS_PADRAO = ['19:30', '20:30', '21:30'];

const XLSX_CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

const ASSOCIADOS_PAGE_SIZE = 10;
let associadosCurrentPage = 1;

const INADIMPLENTES_PAGE_SIZE = 10;
let inadimplentesCurrentPage = 1;

const GASTOS_PAGE_SIZE = 10;
let gastosCurrentPage = 1;

const MONTHS = [
  { key: 'jan', label: 'Jan' },
  { key: 'fev', label: 'Fev' },
  { key: 'mar', label: 'Mar' },
  { key: 'abr', label: 'Abr' },
  { key: 'mai', label: 'Mai' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'ago', label: 'Ago' },
  { key: 'set', label: 'Set' },
  { key: 'out', label: 'Out' },
  { key: 'nov', label: 'Nov' },
  { key: 'dez', label: 'Dez' },
];

const DEFAULT_DATA = {
  config: {
    // Início padrão da cobrança/controle de inadimplência: Jan/2026
    cobrancaInicio: '2026-01',
    // Lista de feriados (YYYY-MM-DD) que não contam como dia útil
    feriados: [],
  },
  associados: [
    { nome: 'Adenildo Batista dos Santos', apelido: 'Guilito', pagamentosByYear: { '2026': seedPayments('Pendente') } },
    { nome: 'Adilson Jose dos Santos', apelido: 'Dica', pagamentosByYear: { '2026': seedPayments('Pendente') } },
    { nome: 'Adolfo Gabriel', apelido: 'Adolfo', pagamentosByYear: { '2026': seedPayments('D') } },
    { nome: 'Alan Celestino Pereira', apelido: 'Messi', pagamentosByYear: { '2026': seedPayments('Pendente') } },
    { nome: 'Albert Paulo', apelido: 'N9', pagamentosByYear: { '2026': seedPayments('Pendente') } },
    { nome: 'Aldo de Jesus da Encarnação', apelido: 'Aldo', pagamentosByYear: { '2026': seedPayments('Pendente') } },
  ],
  jogadores: [
    { nome: 'Jogador Exemplo', time: 'Brasil', gols: 2, amarelos: 1, vermelhos: 0, suspensoes: 0 },
  ],
  gastos: [
    { mes: 'Jan', data: '2026-01-05', descricao: 'Água / gelo', valor: 20 },
  ],
  entradas: [
    { mes: 'Jan', data: '2026-01-05', origem: 'Doação', valor: 60 },
  ],
  times: [
    { time: 'Brasil', pg: 15, j: 5, v: 5, e: 0, der: 0, gf: 15, gs: 5, sg: 10, ca: 10, cv: 1 },
    { time: 'Argentina', pg: 12, j: 5, v: 4, e: 0, der: 2, gf: 16, gs: 8, sg: 8, ca: 18, cv: 3 },
    { time: 'França', pg: 9, j: 5, v: 3, e: 0, der: 2, gf: 18, gs: 9, sg: 9, ca: 22, cv: 5 },
    { time: 'Marrocos', pg: 7, j: 5, v: 2, e: 1, der: 2, gf: 10, gs: 5, sg: 5, ca: 10, cv: 2 },
    { time: 'Colombia', pg: 6, j: 5, v: 2, e: 0, der: 3, gf: 5, gs: 18, sg: -13, ca: 19, cv: 0 },
    { time: 'Peru', pg: 3, j: 5, v: 0, e: 3, der: 2, gf: 3, gs: 19, sg: -16, ca: 26, cv: 5 },
  ],
  campeonato: {
    jogos: [
      {
        rodada: '1',
        data: '2026-01-05',
        hora: '19:30',
        casa: 'Brasil',
        placar: '2-1',
        fora: 'Argentina',
        local: 'Campo principal',
      },
    ],
    videos: [
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    ],
    imagens: [
      { url: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=60', legenda: 'Melhores momentos' },
    ],
    posts: [
      {
        id: 'post-1',
        rodada: '1',
        titulo: 'Resumo da rodada',
        texto: 'Jogaços, muita emoção e disputa acirrada na tabela.',
        criadoEm: new Date().toISOString(),
        comentarios: [
          { nome: 'Visitante', texto: 'Que rodada boa!', criadoEm: new Date().toISOString() },
        ],
      },
    ],
  },
};

function isAdmin() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

function setAdminToken(token) {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

function setAdminSession(on) {
  if (on) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function applyAdminGate() {
  const admin = isAdmin();
  document.documentElement.classList.toggle('is-admin', admin);
  document.querySelectorAll('[data-admin-only="1"]').forEach((el) => {
    el.hidden = !admin;
  });

  const btn = document.getElementById('admin-btn');
  if (btn) {
    btn.textContent = admin ? 'Sair (Admin)' : 'Entrar (Admin)';
    btn.title = admin ? 'Sair do modo administrador' : 'Entrar no modo administrador';
  }
}

function currentYear() {
  return new Date().getFullYear();
}

function pad2(n) {
  const v = String(Math.trunc(Number(n) || 0));
  return v.length === 1 ? `0${v}` : v;
}

function parseYearMonth(s) {
  const m = String(s || '').trim().match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mm) || mm < 1 || mm > 12) return null;
  return { year: y, month: mm };
}

function compareYearMonth(aYM, bYM) {
  const a = parseYearMonth(aYM);
  const b = parseYearMonth(bYM);
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return (a.year - b.year) || (a.month - b.month);
}

function clampInadimplenciaStartYM(ym) {
  const parsed = parseYearMonth(ym);
  if (!parsed) return INADIMPLENCIA_MIN_START_YM;
  return compareYearMonth(ym, INADIMPLENCIA_MIN_START_YM) < 0 ? INADIMPLENCIA_MIN_START_YM : ym;
}

function normalizeHolidayIsoDate(s) {
  const m = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  const d = new Date(y, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== y || (d.getMonth() + 1) !== mm || d.getDate() !== dd) return null;
  return `${y}-${pad2(mm)}-${pad2(dd)}`;
}

function parseFeriadosList(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  const parts = raw
    .split(/[\n,;]+/g)
    .map((x) => String(x).trim())
    .filter(Boolean);
  const set = new Set();
  for (const p of parts) {
    const iso = normalizeHolidayIsoDate(p);
    if (iso) set.add(iso);
  }
  return [...set].sort();
}

function feriadosToText(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list.map((x) => String(x)).join(',');
}

function isBusinessDay(d, holidaySet) {
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  if (holidaySet && holidaySet.has(fmtIsoDate(d))) return false;
  return true;
}

function fmtIsoDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fifthBusinessDayOfMonth(year, month, holidaySet) {
  const y = Math.trunc(Number(year) || currentYear());
  const m = Math.max(1, Math.min(12, Math.trunc(Number(month) || 1)));
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(y, m - 1, day);
    if (d.getMonth() !== (m - 1)) break;
    if (isBusinessDay(d, holidaySet)) {
      count++;
      if (count === 5) return d;
    }
  }
  return null;
}

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function inadimplenciaEndYMForNow(nowDate = new Date(), holidaySet) {
  const now = nowDate instanceof Date ? nowDate : new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const fifth = fifthBusinessDayOfMonth(y, m, holidaySet);

  // Só considera o mês atual como "em atraso" após o 5º dia útil.
  if (fifth && startOfLocalDay(now).getTime() < startOfLocalDay(fifth).getTime()) {
    const prev = new Date(y, m - 2, 1);
    return fmtYearMonth(prev.getFullYear(), prev.getMonth() + 1);
  }
  return fmtYearMonth(y, m);
}

function fmtYearMonth(year, month) {
  return `${Math.trunc(Number(year) || currentYear())}-${pad2(month)}`;
}

function monthKeyFromNumber(month) {
  const idx = Math.max(1, Math.min(12, Math.trunc(Number(month) || 1))) - 1;
  return MONTHS[idx].key;
}

function monthLabelFromNumber(month) {
  const idx = Math.max(1, Math.min(12, Math.trunc(Number(month) || 1))) - 1;
  return MONTHS[idx].label;
}

function iterateMonthsInclusive(startYM, endYM) {
  const out = [];
  const start = parseYearMonth(startYM);
  const end = parseYearMonth(endYM);
  if (!start || !end) return out;
  let y = start.year;
  let m = start.month;
  while (y < end.year || (y === end.year && m <= end.month)) {
    out.push({ year: y, month: m, key: monthKeyFromNumber(m), label: monthLabelFromNumber(m) });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (out.length > 240) break;
  }
  return out;
}

function ensureAssociadoPaymentsByYear(a) {
  if (!a || typeof a !== 'object') return;
  if (!a.pagamentosByYear || typeof a.pagamentosByYear !== 'object') {
    a.pagamentosByYear = {};
  }
  const hasLegacy = a.pagamentos && typeof a.pagamentos === 'object';
  const hasAnyYear = Object.keys(a.pagamentosByYear || {}).length > 0;
  if (hasLegacy && !hasAnyYear) {
    a.pagamentosByYear[String(currentYear())] = a.pagamentos;
    delete a.pagamentos;
  }
}

function getPagamentoRaw(a, year, monthKey) {
  if (!a) return '';
  ensureAssociadoPaymentsByYear(a);
  const y = String(year ?? currentYear());
  const bucket = a.pagamentosByYear?.[y];
  return bucket?.[monthKey];
}

function setPagamentoRaw(a, year, monthKey, raw) {
  if (!a) return;
  ensureAssociadoPaymentsByYear(a);
  const y = String(year ?? currentYear());
  if (!a.pagamentosByYear[y]) a.pagamentosByYear[y] = seedPayments('');
  a.pagamentosByYear[y][monthKey] = raw;
}

function normalizeDataModel(data) {
  if (!data || typeof data !== 'object') return data;
  if (!data.config || typeof data.config !== 'object') data.config = {};
  data.config.cobrancaInicio = clampInadimplenciaStartYM(data.config.cobrancaInicio || INADIMPLENCIA_MIN_START_YM);
  if (!Array.isArray(data.config.feriados)) data.config.feriados = [];
  data.config.feriados = data.config.feriados
    .map(normalizeHolidayIsoDate)
    .filter(Boolean);
  data.config.feriados = [...new Set(data.config.feriados)].sort();

  if (!Array.isArray(data.associados)) data.associados = [];
  if (!Array.isArray(data.jogadores)) data.jogadores = [];
  if (!Array.isArray(data.gastos)) data.gastos = [];
  if (!Array.isArray(data.entradas)) data.entradas = [];
  if (!Array.isArray(data.times)) data.times = [];

  for (const a of data.associados ?? []) ensureAssociadoPaymentsByYear(a);

  // Limpa espaços e remove itens vazios/duplicados (conservador: duplicatas idênticas)
  data.associados.forEach((a) => {
    if (!a || typeof a !== 'object') return;
    a.nome = trimText(a.nome);
    a.apelido = trimText(a.apelido);
  });
  data.associados = dedupeByKey(
    data.associados.filter(Boolean),
    (a) => `${normalizeText(a?.nome)}|${normalizeText(a?.apelido)}`
  );

  data.jogadores.forEach((j) => {
    if (!j || typeof j !== 'object') return;
    j.nome = trimText(j.nome);
    j.time = trimText(j.time);
    j.gols = Number(j.gols) || 0;
    j.amarelos = Number(j.amarelos) || 0;
    j.vermelhos = Number(j.vermelhos) || 0;
    j.suspensoes = Number(j.suspensoes) || 0;
  });
  data.jogadores = dedupeByKey(
    data.jogadores.filter((j) => !isBlankJogador(j)),
    (j) => `${normalizeText(j?.nome)}|${normalizeText(j?.time)}|${j?.gols || 0}|${j?.amarelos || 0}|${j?.vermelhos || 0}|${j?.suspensoes || 0}`
  );

  data.gastos.forEach((g) => {
    if (!g || typeof g !== 'object') return;
    g.mes = trimText(g.mes) || '—';
    g.data = trimText(g.data);
    g.descricao = trimText(g.descricao);
    g.valor = parseMoney(g.valor);
  });
  data.gastos = dedupeByKey(
    data.gastos.filter((g) => !isBlankGasto(g)),
    (g) => `${trimText(g?.mes)}|${trimText(g?.data)}|${trimText(g?.descricao)}|${parseMoney(g?.valor)}`
  );

  data.entradas.forEach((e) => {
    if (!e || typeof e !== 'object') return;
    e.mes = trimText(e.mes) || '—';
    e.data = trimText(e.data);
    e.origem = trimText(e.origem);
    e.valor = parseMoney(e.valor);
  });
  data.entradas = dedupeByKey(
    data.entradas.filter((e) => !isBlankEntrada(e)),
    (e) => `${trimText(e?.mes)}|${trimText(e?.data)}|${trimText(e?.origem)}|${parseMoney(e?.valor)}`
  );

  data.times.forEach((t) => {
    if (!t || typeof t !== 'object') return;
    t.time = trimText(t.time);
  });
  data.times = dedupeByKey(
    data.times.filter((t) => isMeaningfulText(t?.time)),
    (t) => `${normalizeText(t?.time)}|${t?.pg || 0}|${t?.j || 0}|${t?.v || 0}|${t?.e || 0}|${t?.der || 0}|${t?.gf || 0}|${t?.gs || 0}|${t?.sg || 0}|${t?.ca || 0}|${t?.cv || 0}`
  );

  if (!data.campeonato || typeof data.campeonato !== 'object') data.campeonato = { jogos: [], videos: [], imagens: [], posts: [] };
  if (!Array.isArray(data.campeonato.jogos)) data.campeonato.jogos = [];
  if (!Array.isArray(data.campeonato.videos)) data.campeonato.videos = [];
  if (!Array.isArray(data.campeonato.imagens)) data.campeonato.imagens = [];
  if (!Array.isArray(data.campeonato.posts)) data.campeonato.posts = [];

  data.campeonato.jogos.forEach((j) => {
    if (!j || typeof j !== 'object') return;
    j.rodada = trimText(j.rodada) || '—';
    j.data = trimText(j.data);
    j.hora = trimText(j.hora);
    j.casa = trimText(j.casa);
    j.placar = trimText(j.placar);
    j.fora = trimText(j.fora);
    j.local = trimText(j.local);
  });
  data.campeonato.jogos = dedupeByKey(
    data.campeonato.jogos.filter((j) => !isBlankJogo(j)),
    (j) => `${trimText(j?.rodada)}|${trimText(j?.data)}|${trimText(j?.hora)}|${normalizeText(j?.casa)}|${trimText(j?.placar)}|${normalizeText(j?.fora)}|${normalizeText(j?.local)}`
  );

  data.campeonato.videos.forEach((v) => {
    if (!v || typeof v !== 'object') return;
    v.url = trimText(v.url);
  });
  data.campeonato.videos = dedupeByKey(
    data.campeonato.videos.filter((v) => isMeaningfulText(v?.url)),
    (v) => normalizeText(v?.url)
  );

  data.campeonato.imagens.forEach((img) => {
    if (!img || typeof img !== 'object') return;
    img.url = trimText(img.url);
    img.legenda = trimText(img.legenda);
  });
  data.campeonato.imagens = dedupeByKey(
    data.campeonato.imagens.filter((img) => isMeaningfulText(img?.url)),
    (img) => normalizeText(img?.url)
  );

  data.campeonato.posts.forEach((p) => {
    if (!p || typeof p !== 'object') return;
    p.id = trimText(p.id) || p.id;
    p.rodada = trimText(p.rodada) || '—';
    p.titulo = trimText(p.titulo);
    p.texto = trimText(p.texto);
    if (!Array.isArray(p.comentarios)) p.comentarios = [];
    p.comentarios = p.comentarios
      .filter(Boolean)
      .map((c) => ({
        nome: trimText(c?.nome) || 'Visitante',
        texto: trimText(c?.texto),
        criadoEm: c?.criadoEm,
      }))
      .filter((c) => isMeaningfulText(c.texto));
  });
  data.campeonato.posts = dedupeByKey(
    data.campeonato.posts.filter((p) => isMeaningfulText(p?.titulo) || isMeaningfulText(p?.texto) || (p?.comentarios?.length || 0) > 0),
    (p) => String(p?.id || '')
  );
  return data;
}

async function apiFetchJson(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const json = text
    ? (() => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })()
    : null;

  if (!res.ok) {
    const err = new Error((json && json.error) ? String(json.error) : `http_${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function refreshAdminFromToken() {
  const token = getAdminToken();
  if (!token) {
    setAdminSession(false);
    applyAdminGate();
    return;
  }

  try {
    const me = await apiFetchJson('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (me && me.admin) {
      setAdminSession(true);
    } else {
      setAdminSession(false);
      setAdminToken('');
    }
  } catch {
    setAdminSession(false);
  }

  applyAdminGate();
}

async function apiLoginWithPassword(password) {
  const json = await apiFetchJson('/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
  const token = String(json?.token || '');
  if (!token) throw new Error('invalid_token');
  setAdminToken(token);
  await refreshAdminFromToken();
}

async function apiLoadAllData() {
  const json = await apiFetchJson('/data', { method: 'GET' });
  return normalizeDataModel(mergeDefaults(json, DEFAULT_DATA));
}

async function apiSaveAllData(data) {
  const token = getAdminToken();
  if (!token) {
    const err = new Error('not_logged_in');
    err.code = 'NOT_LOGGED_IN';
    throw err;
  }
  await apiFetchJson('/data', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

async function apiAddComment(postId, nome, texto) {
  return apiFetchJson(`/campeonato/posts/${encodeURIComponent(String(postId))}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ nome, texto }),
  });
}

async function loadDataPreferApi() {
  try {
    const data = normalizeDataModel(await apiLoadAllData());
    setData(data);
    return data;
  } catch (err) {
    if (err?.status === 503 || String(err?.message || '') === 'db_unavailable') {
      console.warn('API indisponível (banco não configurado). Usando dados locais.', err);
    } else {
      console.warn('Falha ao carregar via API, usando dados locais.', err);
    }
    return normalizeDataModel(getData());
  }
}

async function saveDataPreferApi(state) {
  try {
    state.data = normalizeDataModel(state.data);
    await apiSaveAllData(state.data);
    setData(state.data);
    toast('Salvo');
    return true;
  } catch (err) {
    console.error('Falha ao salvar via API.', err);
    setData(state.data);
    if (err?.status === 503 || String(err?.message || '') === 'db_unavailable') {
      toastOncePerSession(
        LOCAL_FALLBACK_NOTICE_KEY,
        'Servidor sem Postgres configurado: os dados ficam salvos neste navegador.'
      );
    } else {
      toastOncePerSession(
        LOCAL_FALLBACK_NOTICE_KEY,
        'Não consegui salvar no servidor: os dados ficam salvos neste navegador.'
      );
    }
    toast('Salvo localmente');
    return false;
  }
}

function isMensalidadeEntrada(item) {
  const origem = normalizeText(item?.origem ?? '');
  return origem.includes('mensalidade');
}

function bindAdminControls(state) {
  const btn = document.getElementById('admin-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (isAdmin()) {
      setAdminSession(false);
      setAdminToken('');
      applyAdminGate();
      renderPage(state);
      toast('Modo admin desativado');
      return;
    }

    const pass = prompt('Senha do administrador:');
    if (pass == null) return;
    try {
      await apiLoginWithPassword(pass);
      renderPage(state);
      toast('Modo admin ativado');
    } catch (err) {
      console.error(err);
      const code = String(err?.message || '');
      if (code === 'server_misconfigured') {
        alert('Servidor sem configuração de admin (ADMIN_PASSWORD / ADMIN_JWT_SECRET).');
      } else if (code === 'invalid_credentials' || err?.status === 401) {
        alert('Senha incorreta.');
      } else {
        alert('Não consegui fazer login agora.\n\nSe você está em modo local, inicie o servidor (npm run dev).');
      }
    }
  });

  applyAdminGate();
}

const CLASSIFICACAO_CRITERIOS = [
  { ordem: 'Primeiro', sigla: 'PG', campo: 'pg', descricao: 'Pontos ganhos', direcao: 'desc' },
  { ordem: 'Segundo', sigla: 'V', campo: 'v', descricao: 'Vitórias', direcao: 'desc' },
  { ordem: 'Terceiro', sigla: 'SG', campo: 'sg', descricao: 'Saldo de gols', direcao: 'desc' },
  { ordem: 'Quarto', sigla: 'GF', campo: 'gf', descricao: 'Gols feitos', direcao: 'desc' },
  { ordem: 'Quinto', sigla: 'CA', campo: 'ca', descricao: 'Cartões amarelos', direcao: 'asc' },
  { ordem: 'Sexto', sigla: 'CV', campo: 'cv', descricao: 'Cartões vermelhos', direcao: 'asc' },
];

function seedPayments(value) {
  const obj = {};
  for (const m of MONTHS) obj[m.key] = value;
  return obj;
}

function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return mergeDefaults(parsed, DEFAULT_DATA);
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function setData(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function mergeDefaults(obj, defaults) {
  if (obj == null || typeof obj !== 'object') return structuredClone(defaults);
  const out = Array.isArray(defaults) ? [] : {};
  if (Array.isArray(defaults)) {
    return Array.isArray(obj) ? obj : structuredClone(defaults);
  }
  for (const k of Object.keys(defaults)) {
    if (typeof defaults[k] === 'object' && defaults[k] !== null && !Array.isArray(defaults[k])) {
      out[k] = mergeDefaults(obj[k], defaults[k]);
    } else {
      out[k] = obj[k] ?? structuredClone(defaults[k]);
    }
  }
  return out;
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseMoney(raw) {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const s = String(raw).trim();
  if (!s) return 0;
  // aceita "R$ 1.234,56" ou "1234.56" ou "1234,56"
  const cleaned = s
    .replace(/R\$\s?/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizeText(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function trimText(s) {
  return String(s ?? '').trim();
}

function isPlaceholderText(s) {
  const t = trimText(s);
  return !t || t === '—' || t === '-';
}

function isMeaningfulText(s) {
  return !isPlaceholderText(s);
}

function dedupeByKey(list, keyFn) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const key = String(keyFn(item) ?? '');
    if (!key) {
      out.push(item);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function isBlankJogo(j) {
  if (!j || typeof j !== 'object') return true;
  return (
    isPlaceholderText(j.rodada) &&
    !isMeaningfulText(j.data) &&
    !isMeaningfulText(j.hora) &&
    !isMeaningfulText(j.casa) &&
    !isMeaningfulText(j.fora) &&
    !isMeaningfulText(j.placar) &&
    !isMeaningfulText(j.local)
  );
}

function isVisibleJogoForVisitor(j) {
  if (!j || typeof j !== 'object') return false;
  return isMeaningfulText(j.casa) && isMeaningfulText(j.fora);
}

function sanitizeScoreText(s) {
  const raw = String(s ?? '').trim();
  if (!raw) return '';
  const digits = raw.replace(/[^0-9]/g, '');
  return digits.slice(0, 2);
}

function parsePlacarParts(placar) {
  const s = String(placar ?? '').trim();
  if (!s) return { a: '', b: '' };

  // formatos aceitos: "2-1", "2 x 1", "2X1" etc.
  const m = s.match(/(\d{1,2})\s*[-xX]\s*(\d{1,2})/);
  if (m) return { a: sanitizeScoreText(m[1]), b: sanitizeScoreText(m[2]) };

  const only = s.replace(/\s+/g, '');
  const m2 = only.match(/^(\d{1,2})(\d{1,2})$/);
  if (m2) return { a: sanitizeScoreText(m2[1]), b: sanitizeScoreText(m2[2]) };

  return { a: '', b: '' };
}

function formatPlacarFromParts(a, b) {
  const aa = sanitizeScoreText(a);
  const bb = sanitizeScoreText(b);
  if (!aa && !bb) return '';
  return `${aa || '0'}-${bb || '0'}`;
}

function isBlankGasto(g) {
  if (!g || typeof g !== 'object') return true;
  const valor = parseMoney(g.valor);
  return isPlaceholderText(g.mes) && !isMeaningfulText(g.data) && !isMeaningfulText(g.descricao) && valor === 0;
}

function isBlankEntrada(e) {
  if (!e || typeof e !== 'object') return true;
  const valor = parseMoney(e.valor);
  return isPlaceholderText(e.mes) && !isMeaningfulText(e.data) && !isMeaningfulText(e.origem) && valor === 0;
}

function isBlankJogador(j) {
  if (!j || typeof j !== 'object') return true;
  const nome = trimText(j.nome);
  const time = trimText(j.time);
  const gols = Number(j.gols) || 0;
  const amarelos = Number(j.amarelos) || 0;
  const vermelhos = Number(j.vermelhos) || 0;
  const suspensoes = Number(j.suspensoes) || 0;
  return !nome && !time && gols === 0 && amarelos === 0 && vermelhos === 0 && suspensoes === 0;
}

function decodeArrayBufferSafe(buffer, encoding) {
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(new Uint8Array(buffer));
  } catch {
    return null;
  }
}

function countReplacementChars(s) {
  const m = String(s || '').match(/\uFFFD/g);
  return m ? m.length : 0;
}

async function readFileTextSmart(file) {
  // Alguns CSVs exportados do Excel (Windows) vêm em ANSI/Windows-1252.
  // Se lidos como UTF-8, viram "ENCARNA��O" etc. Aqui tentamos UTF-8 e
  // caímos para Windows-1252 quando houver muitos caracteres de substituição.
  const buf = await file.arrayBuffer();
  const utf8 = decodeArrayBufferSafe(buf, 'utf-8') ?? '';
  const utf8Bad = countReplacementChars(utf8);
  if (utf8Bad === 0) return utf8;

  const win1252 =
    decodeArrayBufferSafe(buf, 'windows-1252') ??
    decodeArrayBufferSafe(buf, 'iso-8859-1');
  if (!win1252) return utf8;

  return countReplacementChars(win1252) < utf8Bad ? win1252 : utf8;
}

function normalizePagamentoCell(raw) {
  if (raw == null) return 'Pendente';
  if (typeof raw === 'number') {
    return raw > 0 ? money(raw) : 'Pendente';
  }

  const s = String(raw).trim();
  if (!s) return 'Pendente';

  const norm = normalizeText(s);
  if (norm === 'd' || norm === '-' || norm === '—' || norm === 'r$ -' || norm === 'r$-' || norm === 'r$') {
    return 'Pendente';
  }
  if (norm.includes('pendente')) return 'Pendente';
  if (norm.includes('pago')) return 'Pago';

  const m = parseMoney(s);
  if (m <= 0) return 'Pendente';
  return money(m);
}

function paymentAmount(raw) {
  const norm = normalizeText(raw);
  if (!norm) return 0;
  if (norm === 'd') return 0;
  if (norm.includes('pendente')) return 0;
  if (norm.includes('pago')) return MENSALIDADE;
  const m = parseMoney(raw);
  return m > 0 ? m : 0;
}

function isPaymentPending(raw) {
  return paymentAmount(raw) <= 0;
}

function computeMensalidadeByMonth(associados) {
  const y = currentYear();
  const byMonth = new Map();
  for (const m of MONTHS) byMonth.set(m.label, 0);
  for (const a of associados ?? []) {
    for (const m of MONTHS) {
      const val = getPagamentoRaw(a, y, m.key);
      byMonth.set(m.label, (byMonth.get(m.label) || 0) + paymentAmount(val));
    }
  }
  return byMonth;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('data-')) node.setAttribute(k, v);
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.appendChild(c);
  return node;
}

function iconTrash() {
  return '🗑️';
}

function loadScriptOnce(url, id) {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }

    const s = document.createElement('script');
    if (id) s.id = id;
    s.src = url;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Falha ao carregar script: ${url}`));
    document.head.appendChild(s);
  });
}

async function ensureXlsxLoaded() {
  if (typeof XLSX !== 'undefined') return;

  let lastErr;
  for (let i = 0; i < XLSX_CDN_URLS.length; i++) {
    const url = XLSX_CDN_URLS[i];
    try {
      await Promise.race([
        loadScriptOnce(url, `xlsx-cdn-${i}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout carregando XLSX')), 6000)),
      ]);
      if (typeof XLSX !== 'undefined') return;
    } catch (e) {
      lastErr = e;
    }
  }

  const err = lastErr ?? new Error('XLSX indisponível');
  err.code = 'XLSX_LOAD_FAILED';
  throw err;
}

function buildCampeonatoJogosSkeleton(rodadas = CAMPEONATO_MAX_RODADAS) {
  const jogos = [];
  for (let r = 1; r <= rodadas; r++) {
    for (let i = 0; i < CAMPEONATO_JOGOS_POR_RODADA; i++) {
      jogos.push({
        rodada: String(r),
        data: '',
        hora: CAMPEONATO_HORARIOS_PADRAO[i] || '',
        casa: '',
        placar: '',
        fora: '',
        local: ''
      });
    }
  }
  return jogos;
}

function bindGlobalActions(state) {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');

    const adminOnly = new Set([
      'add-row',
      'remove-row',
      'save',
      'reset',
      'import-jogadores',
      'import-associados',
      'import-gastos',
      'add-gasto-padrao',
      'add-jogo',
      'rebuild-jogos',
      'add-video',
      'add-imagem',
      'add-post',
    ]);

    if (adminOnly.has(action) && !isAdmin()) {
      alert('Somente o administrador pode alterar o site.');
      return;
    }

    if (action === 'add-comment') {
      const postId = btn.getAttribute('data-post-id');
      const nameInput = document.getElementById(`comment-name-${postId}`);
      const textInput = document.getElementById(`comment-text-${postId}`);
      const nome = String(nameInput?.value ?? '').trim() || 'Visitante';
      const texto = String(textInput?.value ?? '').trim();
      if (!texto) {
        alert('Escreva um comentário.');
        return;
      }

      const posts = state.data?.campeonato?.posts ?? [];
      const post = posts.find((p) => String(p.id) === String(postId));
      if (!post) return;
      if (!Array.isArray(post.comentarios)) post.comentarios = [];
      try {
        await apiAddComment(postId, nome, texto);
        post.comentarios.push({ nome, texto, criadoEm: new Date().toISOString() });
        setData(state.data);
        renderPage(state);
        toast('Comentado');
      } catch (err) {
        console.error(err);
        post.comentarios.push({ nome, texto, criadoEm: new Date().toISOString() });
        setData(state.data);
        renderPage(state);
        toastOncePerSession(
          COMMENT_FALLBACK_NOTICE_KEY,
          'Não consegui enviar comentários ao servidor agora. Eles ficam salvos neste navegador.'
        );
        toast('Comentário salvo localmente');
      }
      return;
    }

    if (action === 'add-jogo') {
      if (!state.data.campeonato) state.data.campeonato = { jogos: [], videos: [], imagens: [], posts: [] };
      state.data.campeonato.jogos = state.data.campeonato.jogos ?? [];
      const existing = state.data.campeonato.jogos;
      const rounds = existing
        .map((j) => Number(String(j?.rodada || '').trim()))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map((n) => Math.trunc(n));
      const maxRodada = rounds.length ? Math.max(...rounds) : 0;

      const countByRound = new Map();
      for (const j of existing) {
        const r = Number(String(j?.rodada || '').trim());
        if (!Number.isFinite(r) || r <= 0) continue;
        const key = String(Math.trunc(r));
        countByRound.set(key, (countByRound.get(key) || 0) + 1);
      }

      let target = null;
      for (let r = 1; r <= Math.max(1, maxRodada); r++) {
        const key = String(r);
        const c = countByRound.get(key) || 0;
        if (c < CAMPEONATO_JOGOS_POR_RODADA) {
          target = key;
          break;
        }
      }
      if (!target) target = String(maxRodada + 1);

      const targetNum = Number(target);
      if (!Number.isFinite(targetNum) || targetNum <= 0) {
        toast('Rodada inválida');
        return;
      }
      if (targetNum > CAMPEONATO_MAX_RODADAS) {
        toast(`Limite: ${CAMPEONATO_MAX_RODADAS} rodadas`);
        return;
      }

      const pos = (countByRound.get(target) || 0) % CAMPEONATO_JOGOS_POR_RODADA;
      const horaPadrao = CAMPEONATO_HORARIOS_PADRAO[pos] || '';

      state.data.campeonato.jogos.push({ rodada: target, data: '', hora: horaPadrao, casa: '', placar: '', fora: '', local: '' });
      renderPage(state);
      return;
    }

    if (action === 'rebuild-jogos') {
      const ok = confirm(
        `Isso vai reconstruir a tabela de jogos com ${CAMPEONATO_MAX_RODADAS} rodadas e ${CAMPEONATO_JOGOS_POR_RODADA} jogos por rodada.\n\nOs jogos atuais serão substituídos. Continuar?`
      );
      if (!ok) return;

      if (!state.data.campeonato) state.data.campeonato = { jogos: [], videos: [], imagens: [], posts: [] };
      state.data.campeonato.jogos = buildCampeonatoJogosSkeleton(CAMPEONATO_MAX_RODADAS);
      renderPage(state);
      toast('Tabela reconstruída');
      return;
    }

    if (action === 'add-video') {
      const input = document.getElementById('campeonato-video-url');
      const url = String(input?.value ?? '').trim();
      if (!url) return;
      if (!state.data.campeonato) state.data.campeonato = { jogos: [], videos: [], imagens: [], posts: [] };
      state.data.campeonato.videos = state.data.campeonato.videos ?? [];
      const exists = state.data.campeonato.videos.some((v) => normalizeText(v?.url) === normalizeText(url));
      if (exists) {
        toast('Esse vídeo já foi adicionado');
        return;
      }
      state.data.campeonato.videos.unshift({ url });
      if (input) input.value = '';
      renderPage(state);
      return;
    }

    if (action === 'add-imagem') {
      const input = document.getElementById('campeonato-imagem-url');
      const url = String(input?.value ?? '').trim();
      if (!url) return;
      if (!state.data.campeonato) state.data.campeonato = { jogos: [], videos: [], imagens: [], posts: [] };
      state.data.campeonato.imagens = state.data.campeonato.imagens ?? [];
      const exists = state.data.campeonato.imagens.some((img) => normalizeText(img?.url) === normalizeText(url));
      if (exists) {
        toast('Essa imagem já foi adicionada');
        return;
      }
      state.data.campeonato.imagens.unshift({ url, legenda: '' });
      if (input) input.value = '';
      renderPage(state);
      return;
    }

    if (action === 'add-post') {
      const titulo = String(document.getElementById('campeonato-post-titulo')?.value ?? '').trim();
      const rodada = String(document.getElementById('campeonato-post-rodada')?.value ?? '').trim();
      const texto = String(document.getElementById('campeonato-post-texto')?.value ?? '').trim();
      if (!titulo || !texto) {
        alert('Preencha Título e Texto.');
        return;
      }
      if (!state.data.campeonato) state.data.campeonato = { jogos: [], videos: [], imagens: [], posts: [] };
      const id = `post-${Date.now()}`;
      state.data.campeonato.posts = state.data.campeonato.posts ?? [];
      state.data.campeonato.posts.unshift({ id, rodada: rodada || '—', titulo, texto, criadoEm: new Date().toISOString(), comentarios: [] });

      const t = document.getElementById('campeonato-post-titulo');
      const r = document.getElementById('campeonato-post-rodada');
      const x = document.getElementById('campeonato-post-texto');
      if (t) t.value = '';
      if (r) r.value = '';
      if (x) x.value = '';

      renderPage(state);
      return;
    }

    if (action === 'add-row') {
      const table = btn.getAttribute('data-table');
      addRow(state, table);
      renderPage(state);
      return;
    }

    if (action === 'add-gasto-padrao') {
      const select = document.getElementById('gastos-item-padrao');
      const descricao = select?.value || '—';
      const now = new Date();
      const monthLabel = MONTHS[Math.max(0, Math.min(11, now.getMonth()))].label;
      const yyyy = String(now.getFullYear()).padStart(4, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      state.data.gastos.push({ mes: monthLabel, data: `${yyyy}-${mm}-${dd}`, descricao, valor: 0 });
      renderPage(state);
      return;
    }

    if (action === 'remove-row') {
      const table = btn.getAttribute('data-table');
      const idx = Number(btn.getAttribute('data-index'));
      if (table === 'campeonato.jogos') {
        const arr = state.data?.campeonato?.jogos;
        if (Array.isArray(arr) && idx >= 0 && idx < arr.length) arr.splice(idx, 1);
      } else {
        removeRow(state, table, idx);
      }
      renderPage(state);
      return;
    }

    if (action === 'save') {
      await saveDataPreferApi(state);
      return;
    }

    if (action === 'reset') {
      const scope = btn.getAttribute('data-scope');
      if (scope && DEFAULT_DATA[scope]) {
        state.data[scope] = structuredClone(DEFAULT_DATA[scope]);
      } else {
        state.data = structuredClone(DEFAULT_DATA);
      }
      await saveDataPreferApi(state);
      renderPage(state);
      toast('Restaurado');
      return;
    }

    if (action === 'import-jogadores') {
      openJogadoresImportPicker(state);
      return;
    }

    if (action === 'import-associados') {
      openAssociadosImportPicker(state);
      return;
    }

    if (action === 'download-associados-template') {
      downloadAssociadosTemplate();
      return;
    }

    if (action === 'download-gastos-template') {
      downloadGastosTemplate();
      return;
    }

    if (action === 'import-gastos') {
      openGastosImportPicker(state);
      return;
    }

    if (action === 'export-associados-pdf') {
      exportAssociadosPdf(state);
      return;
    }
  });
}

function openGastosImportPicker(state) {
  if (document.body.getAttribute('data-page') !== 'gastos') return;
  const input = document.getElementById('import-gastos-file');
  if (!input) {
    alert('Não encontrei o seletor de arquivo desta página.');
    return;
  }
  input.value = '';
  input.click();
}

function downloadTextFile(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function downloadAssociadosTemplate() {
  // Template CSV compatível com Excel (pt-BR): separador ';'
  const headers = ['NOME DOS ASSOCIADOS', 'APELIDO', ...MONTHS.map((m) => m.label.toUpperCase())];
  const example1 = ['Ademir Exemplo', 'Guilito', 'Pago', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
  const example2 = ['Aline Exemplo', 'Dica', 'R$ 30,00', 'R$ 30,00', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
  const lines = [headers, example1, example2].map((row) => row.map(csvEscape).join(';'));
  const csv = lines.join('\r\n') + '\r\n';
  downloadTextFile('template-associados-chuteira-cansada.csv', csv, 'text/csv;charset=utf-8');
}

function downloadGastosTemplate() {
  // Template CSV compatível com Excel (pt-BR): separador ';'
  const headers = ['Mês', 'Data', 'O que foi', 'Valor (R$)'];
  const example1 = ['Jan', '2026-01-05', 'Água / gelo', 'R$ 30,00'];
  const example2 = ['Jan', '2026-01-05', 'Café', '0'];
  const lines = [headers, example1, example2].map((row) => row.map(csvEscape).join(';'));
  const csv = lines.join('\r\n') + '\r\n';
  downloadTextFile('template-gastos-chuteira-cansada.csv', csv, 'text/csv;charset=utf-8');
}

function bindGastosControls(state) {
  if (document.body.getAttribute('data-page') !== 'gastos') return;
  const q = document.getElementById('gastos-search');
  const prev = document.getElementById('gastos-page-prev');
  const next = document.getElementById('gastos-page-next');

  const resetAndRender = () => {
    gastosCurrentPage = 1;
    renderPage(state);
  };

  if (q) q.addEventListener('input', resetAndRender);
  if (prev) {
    prev.addEventListener('click', () => {
      gastosCurrentPage = Math.max(1, gastosCurrentPage - 1);
      renderPage(state);
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      gastosCurrentPage = gastosCurrentPage + 1;
      renderPage(state);
    });
  }
}

function getGastosFilter() {
  const q = document.getElementById('gastos-search');
  return { q: q?.value || '' };
}

function gastosMatchesSearch(g, filter) {
  const q = normalizeText(filter?.q);
  if (!q) return true;
  const desc = normalizeText(g?.descricao);
  return desc.includes(q);
}

function bindGastosImport(state) {
  if (document.body.getAttribute('data-page') !== 'gastos') return;
  const input = document.getElementById('import-gastos-file');
  if (!input) return;

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const imported = await readGastosFromFile(file);
      if (!imported.length) {
        alert('Nenhum gasto encontrado na planilha.' );
        return;
      }

      const replace = confirm(
        `Importei ${imported.length} gasto(s).\n\nOK = Substituir lista atual\nCancelar = Adicionar na lista atual`
      );

      state.data.gastos = replace
        ? imported
        : [...(state.data.gastos ?? []), ...imported];

      await saveDataPreferApi(state);
      renderPage(state);
      toast(`Importado: ${imported.length}`);
    } catch (err) {
      console.error(err);
      if (err?.code === 'XLSX_LOAD_FAILED') {
        alert(
          'Não consegui carregar o leitor de Excel (XLSX).\n\nPossíveis causas: sem internet ou CDN bloqueado.\n\nSolução rápida: exporte a planilha como .CSV e importe.'
        );
      } else {
        const msg = (err && (err.message || String(err))) ? String(err.message || err) : '';
        alert(`Falha ao importar. Tente exportar como .CSV e importar novamente.${msg ? `\n\nDetalhes: ${msg}` : ''}`);
      }
    } finally {
      input.value = '';
    }
  });
}

async function readGastosFromFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await readFileTextSmart(file);
    return readGastosFromCsv(text);
  }

  try {
    await ensureXlsxLoaded();
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array' });
    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
    return readGastosFromGrid(rows);
  } catch (err) {
    // fallback texto/CSV
    try {
      const text = await readFileTextSmart(file);
      const csvParsed = readGastosFromCsv(text);
      if (csvParsed.length) return csvParsed;
    } catch {
      // ignora
    }
    throw err;
  }
}

function readGastosFromCsv(csvText) {
  const lines = String(csvText)
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  const delim = detectCsvDelimiter(lines);
  const grid = lines.map((l) => splitCsvLine(l, delim));
  return readGastosFromGrid(grid);
}

function readGastosFromGrid(grid) {
  if (!Array.isArray(grid) || grid.length === 0) return [];

  const firstRow = grid[0] ?? [];
  const header = firstRow.map(normalizeHeader);
  const headerLooksLike = (key) => header.some((h) => h === key || h.includes(key));
  const hasHeader = headerLooksLike('mes') || headerLooksLike('mês') || headerLooksLike('data') || headerLooksLike('valor') || headerLooksLike('descricao') || headerLooksLike('o que foi');

  const colIndex = (aliases, fallback) => {
    for (const a of aliases) {
      const idx = header.findIndex((h) => h === a || h.includes(a));
      if (idx >= 0) return idx;
    }
    return fallback;
  };

  const map = {
    mes: colIndex(['mes', 'mês'], 0),
    data: colIndex(['data'], 1),
    descricao: colIndex(['descricao', 'descrição', 'o que foi', 'oque foi', 'descricao do gasto'], 2),
    valor: colIndex(['valor', 'valor (r$)', 'r$', 'custo'], 3),
  };

  const start = hasHeader ? 1 : 0;
  const out = [];

  for (let r = start; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const mes = String(row[map.mes] ?? '').trim() || '—';
    const data = String(row[map.data] ?? '').trim();
    const descricao = String(row[map.descricao] ?? '').trim();
    const valor = parseMoney(row[map.valor]);

    const hasAny = mes !== '—' || data || descricao || valor;
    if (!hasAny) continue;
    if (!descricao) continue;

    out.push({ mes, data, descricao, valor });
  }

  return out;
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[";\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function bindAssociadosFilter(state) {
  if (document.body.getAttribute('data-page') !== 'associados') return;
  const ano = document.getElementById('associados-filter-ano');
  const mes = document.getElementById('associados-filter-mes');
  const pend = document.getElementById('associados-filter-pendentes');
  const qNome = document.getElementById('associados-search-nome');
  const qApelido = document.getElementById('associados-search-apelido');
  const prev = document.getElementById('associados-page-prev');
  const next = document.getElementById('associados-page-next');
  if (!mes || !pend) return;

  // default: mês atual
  const now = new Date();
  const idx = Math.max(0, Math.min(11, now.getMonth()));
  if (ano && !String(ano.value || '').trim()) ano.value = String(now.getFullYear());
  mes.value = MONTHS[idx].label;

  const resetAndRender = () => {
    associadosCurrentPage = 1;
    renderPage(state);
  };

  if (ano) ano.addEventListener('change', resetAndRender);
  mes.addEventListener('change', resetAndRender);
  pend.addEventListener('change', resetAndRender);

  if (qNome) qNome.addEventListener('input', resetAndRender);
  if (qApelido) qApelido.addEventListener('input', resetAndRender);

  if (prev) {
    prev.addEventListener('click', () => {
      associadosCurrentPage = Math.max(1, associadosCurrentPage - 1);
      renderPage(state);
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      associadosCurrentPage = associadosCurrentPage + 1;
      renderPage(state);
    });
  }
}

function bindInadimplentesFilter(state) {
  if (document.body.getAttribute('data-page') !== 'associados') return;
  const ano = document.getElementById('inadimplentes-filter-ano');
  const mes = document.getElementById('inadimplentes-filter-mes');
  const feriados = document.getElementById('inadimplentes-config-feriados');
  const prev = document.getElementById('inadimplentes-page-prev');
  const next = document.getElementById('inadimplentes-page-next');
  if (!ano || !mes) return;

  const onChange = () => {
    if (!isAdmin()) return;
    const y = Number(String(ano.value || '').trim());
    let year = Number.isFinite(y) && y > 0 ? Math.trunc(y) : currentYear();
    year = Math.max(2026, year);
    const label = String(mes.value || 'Ago');
    const idx = MONTHS.findIndex((m) => m.label === label);
    const month = idx >= 0 ? (idx + 1) : 8;
    state.data = normalizeDataModel(state.data);
    state.data.config.cobrancaInicio = clampInadimplenciaStartYM(fmtYearMonth(year, month));
    inadimplentesCurrentPage = 1;
    renderPage(state);
    scheduleConfigAutoSave(state);
  };

  ano.addEventListener('change', onChange);
  mes.addEventListener('change', onChange);

  if (feriados) {
    const onHolidaysChange = () => {
      if (!isAdmin()) return;
      state.data = normalizeDataModel(state.data);
      state.data.config.feriados = parseFeriadosList(feriados.value);
      inadimplentesCurrentPage = 1;
      renderPage(state);
      scheduleConfigAutoSave(state);
    };
    feriados.addEventListener('change', onHolidaysChange);
    feriados.addEventListener('blur', onHolidaysChange);
  }

  if (prev) {
    prev.addEventListener('click', () => {
      inadimplentesCurrentPage = Math.max(1, inadimplentesCurrentPage - 1);
      renderPage(state);
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      inadimplentesCurrentPage = inadimplentesCurrentPage + 1;
      renderPage(state);
    });
  }
}

function getAssociadosFilter() {
  const ano = document.getElementById('associados-filter-ano');
  const mes = document.getElementById('associados-filter-mes');
  const pend = document.getElementById('associados-filter-pendentes');
  const qNome = document.getElementById('associados-search-nome');
  const qApelido = document.getElementById('associados-search-apelido');
  const y = Number(String(ano?.value || '').trim());
  return {
    ano: Number.isFinite(y) && y > 0 ? Math.trunc(y) : currentYear(),
    mes: mes?.value || 'Jan',
    pendentesOnly: Boolean(pend?.checked),
    nome: qNome?.value || '',
    apelido: qApelido?.value || '',
  };
}

function getInadimplentesFilter() {
  const ano = document.getElementById('inadimplentes-filter-ano');
  const mes = document.getElementById('inadimplentes-filter-mes');
  const y = Number(String(ano?.value || '').trim());
  return {
    ano: Number.isFinite(y) && y > 0 ? Math.trunc(y) : currentYear(),
    mes: mes?.value || 'Jan',
  };
}

let configAutoSaveTimer = null;
function scheduleConfigAutoSave(state) {
  if (!isAdmin()) return;
  if (configAutoSaveTimer) clearTimeout(configAutoSaveTimer);
  configAutoSaveTimer = setTimeout(async () => {
    configAutoSaveTimer = null;
    const ok = await saveDataPreferApi(state);
    if (ok) toastOncePerSession(CONFIG_AUTOSAVE_TOAST_KEY, 'Configuração de inadimplência salva');
  }, 600);
}

function associadosMatchesSearch(a, filter) {
  const nomeQ = normalizeText(filter?.nome);
  const apelidoQ = normalizeText(filter?.apelido);
  if (nomeQ) {
    const nome = normalizeText(a?.nome);
    if (!nome.includes(nomeQ)) return false;
  }
  if (apelidoQ) {
    const ap = normalizeText(a?.apelido);
    if (!ap.includes(apelidoQ)) return false;
  }
  return true;
}

function openJogadoresImportPicker(state) {
  if (document.body.getAttribute('data-page') !== 'jogadores') return;
  const input = document.getElementById('import-jogadores-file');
  if (!input) {
    alert('Não encontrei o seletor de arquivo desta página.');
    return;
  }
  input.value = '';
  input.click();
}

function openAssociadosImportPicker(state) {
  if (document.body.getAttribute('data-page') !== 'associados') return;
  const input = document.getElementById('import-associados-file');
  if (!input) {
    alert('Não encontrei o seletor de arquivo desta página.');
    return;
  }
  input.value = '';
  input.click();
}

function bindJogadoresImport(state) {
  if (document.body.getAttribute('data-page') !== 'jogadores') return;
  const input = document.getElementById('import-jogadores-file');
  if (!input) return;

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const imported = await readJogadoresFromFile(file);
      if (!imported.length) {
        alert('Nenhum jogador encontrado na planilha.');
        return;
      }

      const replace = confirm(
        `Importei ${imported.length} jogador(es).\n\nOK = Substituir lista atual\nCancelar = Adicionar na lista atual`
      );
      state.data.jogadores = replace
        ? imported
        : [...(state.data.jogadores ?? []), ...imported];

      await saveDataPreferApi(state);
      renderPage(state);
      toast(`Importado: ${imported.length}`);
    } catch (err) {
      console.error(err);
      if (err?.code === 'XLSX_LOAD_FAILED') {
        alert(
          'Não consegui carregar o leitor de Excel (XLSX).\n\nPossíveis causas: sem internet ou CDN bloqueado.\n\nSolução rápida: exporte a planilha como .CSV e importe.'
        );
      } else {
        const msg = (err && (err.message || String(err))) ? String(err.message || err) : '';
        alert(`Falha ao importar. Tente exportar como .CSV e importar novamente.${msg ? `\n\nDetalhes: ${msg}` : ''}`);
      }
    } finally {
      input.value = '';
    }
  });
}

function bindAssociadosImport(state) {
  if (document.body.getAttribute('data-page') !== 'associados') return;
  const input = document.getElementById('import-associados-file');
  if (!input) return;

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const imported = await readAssociadosFromFile(file);
      if (!imported.length) {
        alert('Nenhum associado encontrado na planilha.');
        return;
      }

      const replace = confirm(
        `Importei ${imported.length} associado(s).\n\nOK = Substituir lista atual\nCancelar = Adicionar na lista atual`
      );
      state.data.associados = replace
        ? imported
        : [...(state.data.associados ?? []), ...imported];

      await saveDataPreferApi(state);
      renderPage(state);
      toast(`Importado: ${imported.length}`);
    } catch (err) {
      console.error(err);
      if (err?.code === 'XLSX_LOAD_FAILED') {
        alert(
          'Não consegui carregar o leitor de Excel (XLSX).\n\nPossíveis causas: sem internet ou CDN bloqueado.\n\nSolução rápida: exporte a planilha como .CSV e importe.'
        );
      } else {
        alert('Falha ao importar. Tente exportar como .CSV e importar novamente.');
      }
    } finally {
      input.value = '';
    }
  });
}

async function readAssociadosFromFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await readFileTextSmart(file);
    return readAssociadosFromCsv(text);
  }

  try {
    await ensureXlsxLoaded();

    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array' });
    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
    return readAssociadosFromGrid(rows);
  } catch (err) {
    // fallback: alguns arquivos “do Excel” podem estar em texto/CSV
    try {
      const text = await readFileTextSmart(file);
      const csvParsed = readAssociadosFromCsv(text);
      if (csvParsed.length) return csvParsed;
    } catch {
      // ignora
    }
    throw err;
  }
}

function readAssociadosFromCsv(csvText) {
  const lines = String(csvText)
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  const delim = detectCsvDelimiter(lines);
  const grid = lines.map((l) => splitCsvLine(l, delim));
  return readAssociadosFromGrid(grid);
}

function readAssociadosFromGrid(grid) {
  if (!Array.isArray(grid) || grid.length === 0) return [];

  const findHeaderRowIndex = () => {
    const monthKeys = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const maxScan = Math.min(15, grid.length);
    for (let r = 0; r < maxScan; r++) {
      const row = grid[r] ?? [];
      const cells = row.map(normalizeHeader);
      const monthHits = monthKeys.filter((k) => cells.some((c) => c === k || c.startsWith(k))).length;
      const hasNome = cells.some((c) => c.includes('nome'));
      const hasApelido = cells.some((c) => c.includes('apelido'));
      // cabeçalho típico: nome + apelido + meses
      if ((hasNome && hasApelido && monthHits >= 6) || monthHits >= 10) return r;
    }
    return 0;
  };

  const headerRowIndex = findHeaderRowIndex();
  const headerRow = grid[headerRowIndex] ?? [];
  const header = headerRow.map(normalizeHeader);
  const hasHeader = header.some((h) => h === 'nome' || h.includes('nome'));

  const findMonthCol = (aliases, fallback) => {
    for (const a of aliases) {
      const idx = header.findIndex((h) => h === a || h.includes(a));
      if (idx >= 0) return idx;
    }
    return fallback;
  };

  const colNome = findMonthCol(['nome'], 0);
  const colApelido = findMonthCol(['apelido', 'apel', 'apelido/nome'], 1);

  // Meses (aceita “jan”, “janeiro”, etc)
  const monthCols = {
    jan: findMonthCol(['jan', 'janeiro'], 2),
    fev: findMonthCol(['fev', 'fevereiro'], 3),
    mar: findMonthCol(['mar', 'marco', 'março'], 4),
    abr: findMonthCol(['abr', 'abril'], 5),
    mai: findMonthCol(['mai', 'maio'], 6),
    jun: findMonthCol(['jun', 'junho'], 7),
    jul: findMonthCol(['jul', 'julho'], 8),
    ago: findMonthCol(['ago', 'agosto'], 9),
    set: findMonthCol(['set', 'setembro'], 10),
    out: findMonthCol(['out', 'outubro'], 11),
    nov: findMonthCol(['nov', 'novembro'], 12),
    dez: findMonthCol(['dez', 'dezembro'], 13),
  };

  const start = hasHeader ? (headerRowIndex + 1) : headerRowIndex;
  const out = [];

  const normalizePagamento = (raw) => normalizePagamentoCell(raw);

  const getMonthRaw = (row, idx) => {
    if (!Number.isFinite(idx) || idx < 0) return '';
    const a = row?.[idx];
    const b = row?.[idx + 1];

    const aNorm = normalizeText(a);
    // layout comum do Excel: duas colunas por mês ("R$" + valor)
    if (aNorm === 'r$' || aNorm === 'r$-') {
      const bStr = b == null ? '' : String(b).trim();
      if (!bStr || bStr === '-' || normalizeText(bStr) === 'r$') return '';
      return `R$ ${bStr}`;
    }

    // às vezes o mês fica na coluna da esquerda e o valor na próxima
    const aStr = a == null ? '' : String(a).trim();
    const bStr = b == null ? '' : String(b).trim();
    if (!aStr && /[0-9]/.test(bStr)) return bStr;
    return a;
  };

  for (let r = start; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const nome = String(row[colNome] ?? '').trim();
    if (!nome) continue;

    const nomeNorm = normalizeText(nome);
    // ignora linhas de resumo/saldo da planilha
    if (nomeNorm.includes('saldo ano anterior') || nomeNorm === 'saldo' || nomeNorm.includes('saldo anterior')) {
      continue;
    }

    const apelido = String(row[colApelido] ?? '').trim();

    const pagamentos = seedPayments('');
    for (const m of MONTHS) {
      const idx = monthCols[m.key];
      const raw = getMonthRaw(row, idx);
      pagamentos[m.key] = normalizePagamento(raw);
    }

    out.push({ nome, apelido, pagamentos });
  }

  return out;
}

async function readJogadoresFromFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await readFileTextSmart(file);
    return readJogadoresFromCsv(text);
  }

  await ensureXlsxLoaded();

  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array' });
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  return readJogadoresFromGrid(rows);
}

function readJogadoresFromCsv(csvText) {
  const lines = String(csvText)
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  const delim = detectCsvDelimiter(lines);
  const grid = lines.map((l) => splitCsvLine(l, delim));
  return readJogadoresFromGrid(grid);
}

function detectCsvDelimiter(lines) {
  const sample = lines.slice(0, 5).join('\n');
  const commas = (sample.match(/,/g) || []).length;
  const semis = (sample.match(/;/g) || []).length;
  const tabs = (sample.match(/\t/g) || []).length;
  if (tabs > semis && tabs > commas) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function splitCsvLine(line, delimiter = ',') {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

function normalizeHeader(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

function readJogadoresFromGrid(grid) {
  if (!Array.isArray(grid) || grid.length === 0) return [];

  const firstRow = grid[0] ?? [];
  const header = firstRow.map(normalizeHeader);

  const headerLooksLike = (key) => header.some((h) => h === key || h.includes(key));
  const hasHeader = headerLooksLike('nome') || headerLooksLike('jogador') || headerLooksLike('time');

  const colIndex = (aliases, fallback) => {
    for (const a of aliases) {
      const idx = header.findIndex((h) => h === a || h.includes(a));
      if (idx >= 0) return idx;
    }
    return fallback;
  };

  const map = {
    nome: colIndex(['nome', 'jogador'], 0),
    time: colIndex(['time', 'equipe'], 1),
    gols: colIndex(['gols', 'gol'], 2),
    amarelos: colIndex(['amarelos', 'cartao amarelo', 'ca'], 3),
    vermelhos: colIndex(['vermelhos', 'cartao vermelho', 'cv'], 4),
    suspensoes: colIndex(['suspensoes', 'suspensao', 'susp'], 5),
  };

  const start = hasHeader ? 1 : 0;
  const out = [];

  for (let r = start; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const nome = String(row[map.nome] ?? '').trim();
    const time = String(row[map.time] ?? '').trim();
    const gols = toInt(row[map.gols]);
    const amarelos = toInt(row[map.amarelos]);
    const vermelhos = toInt(row[map.vermelhos]);
    const suspensoes = toInt(row[map.suspensoes]);

    const hasAny = nome || time || gols || amarelos || vermelhos || suspensoes;
    if (!hasAny) continue;
    if (!nome) continue;

    out.push({
      nome,
      time,
      gols,
      amarelos,
      vermelhos,
      suspensoes,
    });
  }

  return out;
}

function toInt(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : 0;
  const s = String(value).trim();
  if (!s) return 0;
  const n = Number(s.replace(/[^0-9\-]/g, ''));
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function toast(message) {
  const t = el('div', { class: 'toast', text: message });
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast--show'), 10);
  setTimeout(() => {
    t.classList.remove('toast--show');
    setTimeout(() => t.remove(), 200);
  }, 1200);
}

function toastOncePerSession(key, message) {
  try {
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
  } catch {
    // ignora
  }
  toast(message);
}

function addRow(state, table) {
  switch (table) {
    case 'associados':
      state.data.associados.push({ nome: 'Novo associado', apelido: '', pagamentosByYear: { [String(currentYear())]: seedPayments('') } });
      break;
    case 'jogadores':
      state.data.jogadores.push({ nome: 'Novo jogador', time: '', gols: 0, amarelos: 0, vermelhos: 0, suspensoes: 0 });
      break;
    case 'gastos':
      state.data.gastos.push({ mes: 'Jan', data: '', descricao: '', valor: 0 });
      break;
    case 'entradas':
      state.data.entradas.push({ mes: 'Jan', data: '', origem: '', valor: 0 });
      break;
    case 'times':
      state.data.times.push({ time: 'Novo time', pg: 0, j: 0, v: 0, e: 0, der: 0, gf: 0, gs: 0, sg: 0, ca: 0, cv: 0 });
      break;
    default:
      break;
  }
}

function removeRow(state, table, idx) {
  const arr = state.data[table];
  if (!Array.isArray(arr)) return;
  if (idx < 0 || idx >= arr.length) return;
  arr.splice(idx, 1);
}

function setEditableCell(td, { value, onCommit, validator }) {
  td.textContent = value ?? '';
  if (!isAdmin()) {
    td.removeAttribute('contenteditable');
    return;
  }
  td.setAttribute('contenteditable', 'true');
  td.addEventListener('input', () => td.classList.add('is-edited'));
  td.addEventListener('blur', () => {
    const raw = td.textContent.trim();
    const valid = validator ? validator(raw) : true;
    td.classList.toggle('is-invalid', !valid);
    onCommit(raw);
  });
}

let classificacaoRefreshScheduled = false;
function scheduleClassificacaoRefresh(state) {
  if (document.body.getAttribute('data-page') !== 'classificacao') return;
  if (classificacaoRefreshScheduled) return;
  classificacaoRefreshScheduled = true;
  setTimeout(() => {
    classificacaoRefreshScheduled = false;
    // Re-render para reordenar tabela e recalcular resumo
    renderTimes(state);
  }, 0);
}

let saldoRefreshScheduled = false;
function scheduleSaldoRefresh(state) {
  if (document.body.getAttribute('data-page') !== 'saldo') return;
  if (saldoRefreshScheduled) return;
  saldoRefreshScheduled = true;
  setTimeout(() => {
    saldoRefreshScheduled = false;
    updateEntradasResumo(state);
    summarizeSaldo(state);
  }, 0);
}

function renderAssociados(state) {
  const table = document.querySelector('table[data-table="associados"]');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  state.data = normalizeDataModel(state.data);
  const filter = getAssociadosFilter();
  const year = filter.ano;
  const monthKey = MONTHS.find((m) => m.label === filter.mes)?.key;

  const all = (state.data.associados ?? [])
    .filter((a) => associadosMatchesSearch(a, filter))
    .filter((a) => {
      if (!filter.pendentesOnly) return true;
      if (!monthKey) return true;
      const v = getPagamentoRaw(a, year, monthKey);
      return isPaymentPending(v);
    });

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / ASSOCIADOS_PAGE_SIZE));
  associadosCurrentPage = Math.max(1, Math.min(associadosCurrentPage, totalPages));
  const start = (associadosCurrentPage - 1) * ASSOCIADOS_PAGE_SIZE;
  const end = Math.min(total, start + ASSOCIADOS_PAGE_SIZE);
  const associados = all.slice(start, end);

  const info = document.getElementById('associados-page-info');
  const prev = document.getElementById('associados-page-prev');
  const next = document.getElementById('associados-page-next');
  if (info) {
    const showing = total ? `Mostrando ${start + 1}-${end} de ${total}` : 'Nenhum resultado';
    info.textContent = `${showing} • Página ${associadosCurrentPage} de ${totalPages}`;
  }
  if (prev) prev.disabled = associadosCurrentPage <= 1;
  if (next) next.disabled = associadosCurrentPage >= totalPages;

  associados.forEach((a, visualIdx) => {
    const idx = state.data.associados.indexOf(a);
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.classList.add('col-nome');
    setEditableCell(tdNome, {
      value: a.nome,
      onCommit: (v) => (a.nome = v || '—')
    });

    const tdApelido = document.createElement('td');
    tdApelido.classList.add('col-apelido');
    setEditableCell(tdApelido, {
      value: a.apelido,
      onCommit: (v) => (a.apelido = v)
    });

    tr.appendChild(tdNome);
    tr.appendChild(tdApelido);

    for (const m of MONTHS) {
      const td = document.createElement('td');
      td.classList.add('col-mes');
      const val = normalizePagamentoCell(getPagamentoRaw(a, year, m.key));
      setEditableCell(td, {
        value: val,
        onCommit: (v) => {
          const normalized = normalizePagamentoCell(v);
          setPagamentoRaw(a, year, m.key, normalized);
          td.textContent = normalized;
          // Recalcula classes sem exigir recarregar
          applyPaymentClass(td, normalized);
        }
      });

      applyPaymentClass(td, val);
      tr.appendChild(td);
    }

    const tdActions = document.createElement('td');
    if (isAdmin()) {
      const btn = el('button', {
        class: 'icon-btn',
        type: 'button',
        'data-action': 'remove-row',
        'data-table': 'associados',
        'data-index': String(idx),
        title: 'Remover'
      });
      btn.textContent = iconTrash();
      tdActions.appendChild(btn);
    }
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

function renderInadimplentes(state) {
  const table = document.querySelector('table[data-table="inadimplentes"]');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  const resumo = document.querySelector('[data-slot="inadimplentes-resumo"]');
  const info = document.getElementById('inadimplentes-page-info');
  const prev = document.getElementById('inadimplentes-page-prev');
  const next = document.getElementById('inadimplentes-page-next');
  state.data = normalizeDataModel(state.data);

  const configYM = clampInadimplenciaStartYM(String(state.data?.config?.cobrancaInicio || INADIMPLENCIA_MIN_START_YM));
  const parsed = parseYearMonth(configYM) || { year: 2026, month: 1 };

  const anoEl = document.getElementById('inadimplentes-filter-ano');
  const mesEl = document.getElementById('inadimplentes-filter-mes');
  const feriadosEl = document.getElementById('inadimplentes-config-feriados');
  if (anoEl) {
    anoEl.value = String(parsed.year);
    anoEl.disabled = !isAdmin();
  }
  if (mesEl) {
    mesEl.value = monthLabelFromNumber(parsed.month);
    mesEl.disabled = !isAdmin();
  }
  if (feriadosEl) {
    feriadosEl.value = feriadosToText(state.data?.config?.feriados);
  }

  const holidaySet = new Set((state.data?.config?.feriados || []).map((x) => String(x)));

  const now = new Date();
  const endYM = inadimplenciaEndYMForNow(now, holidaySet);
  const months = compareYearMonth(endYM, configYM) < 0 ? [] : iterateMonthsInclusive(configYM, endYM);

  const itens = (state.data.associados ?? [])
    .map((a) => {
      let firstIdx = -1;
      let mesesEmAberto = 0;
      let totalDevido = 0;

      for (let i = 0; i < months.length; i++) {
        const m = months[i];
        const raw = getPagamentoRaw(a, m.year, m.key);
        const pago = paymentAmount(raw);
        const devido = Math.max(0, MENSALIDADE - pago);
        if (devido > 0) {
          if (firstIdx < 0) firstIdx = i;
          mesesEmAberto++;
          totalDevido += devido;
        }
      }

      if (mesesEmAberto <= 0) return null;
      return {
        nome: a?.nome ?? '—',
        apelido: a?.apelido ?? '',
        desde: firstIdx >= 0 ? `${months[firstIdx].label}/${months[firstIdx].year}` : `${monthLabelFromNumber(parsed.month)}/${parsed.year}`,
        mesesEmAberto,
        totalDevido,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.totalDevido - a.totalDevido) || (b.mesesEmAberto - a.mesesEmAberto) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'));

  let soma = 0;
  for (const it of itens) soma += it.totalDevido;

  const total = itens.length;
  const totalPages = Math.max(1, Math.ceil(total / INADIMPLENTES_PAGE_SIZE));
  inadimplentesCurrentPage = Math.max(1, Math.min(inadimplentesCurrentPage, totalPages));
  const start = (inadimplentesCurrentPage - 1) * INADIMPLENTES_PAGE_SIZE;
  const end = Math.min(total, start + INADIMPLENTES_PAGE_SIZE);
  const pageItems = itens.slice(start, end);

  if (info) {
    const showing = total ? `Mostrando ${start + 1}-${end} de ${total}` : 'Nenhum resultado';
    info.textContent = `${showing} • Página ${inadimplentesCurrentPage} de ${totalPages}`;
  }
  if (prev) prev.disabled = inadimplentesCurrentPage <= 1;
  if (next) next.disabled = inadimplentesCurrentPage >= totalPages;

  for (const it of pageItems) {
    const tr = document.createElement('tr');
    tr.appendChild(el('td', { text: it.nome }));
    tr.appendChild(el('td', { text: it.apelido || '—' }));
    tr.appendChild(el('td', { text: it.desde }));
    tr.appendChild(el('td', { text: String(it.mesesEmAberto) }));
    const tdTotal = el('td', { text: money(it.totalDevido) });
    tdTotal.classList.add('is-bad');
    tr.appendChild(tdTotal);
    tbody.appendChild(tr);
  }

  if (resumo) {
    if (!itens.length) {
      resumo.textContent = `Nenhum inadimplente encontrado a partir de ${monthLabelFromNumber(parsed.month)}/${parsed.year}.`;
    } else {
      resumo.textContent = `Total inadimplentes: ${itens.length} • Total devido: ${money(soma)} • A partir de ${monthLabelFromNumber(parsed.month)}/${parsed.year} • Mensalidade: ${money(MENSALIDADE)}`;
    }
  }
}

function applyPaymentClass(td, raw) {
  td.classList.remove('pay--pendente', 'pay--pago');
  const norm = normalizeText(raw);
  if (!norm) {
    td.classList.add('pay--pendente');
    return;
  }
  if (norm === 'd' || norm.includes('pendente')) {
    td.classList.add('pay--pendente');
    return;
  }
  if (norm.includes('pago') || paymentAmount(raw) > 0) {
    td.classList.add('pay--pago');
  } else {
    td.classList.add('pay--pendente');
  }
}

function exportAssociadosPdf(state) {
  if (document.body.getAttribute('data-page') !== 'associados') return;
  state.data = normalizeDataModel(state.data);
  const filter = getAssociadosFilter();
  const year = filter.ano;
  const month = filter.mes;
  const monthKey = MONTHS.find((m) => m.label === month)?.key;
  const list = (state.data.associados ?? []).filter((a) => {
    if (!filter.pendentesOnly) return true;
    if (!monthKey) return true;
    return isPaymentPending(getPagamentoRaw(a, year, monthKey));
  });

  const pendentes = monthKey
    ? list.filter((a) => isPaymentPending(getPagamentoRaw(a, year, monthKey)))
    : [];

  const totalDevido = pendentes.length * MENSALIDADE;

  const rowsHtml = list
    .map((a) => {
      const nome = escapeHtml(a?.nome ?? '');
      const apelido = escapeHtml(a?.apelido ?? '');
      const status = monthKey ? normalizePagamentoCell(getPagamentoRaw(a, year, monthKey)) : '';
      const pending = monthKey ? isPaymentPending(status) : false;
      return `
        <tr>
          <td>${nome}</td>
          <td>${apelido}</td>
          <td class="${pending ? 'pend' : 'ok'}">${escapeHtml(status || (pending ? 'Pendente' : ''))}</td>
        </tr>`;
    })
    .join('');

  const title = filter.pendentesOnly ? `Pendentes — ${month}/${year}` : `Associados — ${month}/${year}`;
  const subtitle = filter.pendentesOnly
    ? `Total pendentes: ${pendentes.length} • Total devido: ${money(totalDevido)} • Mensalidade: ${money(MENSALIDADE)}`
    : `Mensalidade: ${money(MENSALIDADE)}`;

  const html = `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root{--text:#0b1f3a;--muted:#5b6b80;--border:#d6e3f2;--ok:#1f7a4a;--bad:#d64545;}
    body{font:12px/1.4 system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:24px;color:var(--text)}
    h1{margin:0 0 6px;font-size:18px}
    .sub{color:var(--muted);margin:0 0 14px}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid var(--border);padding:10px 8px;text-align:left;vertical-align:top}
    th{color:var(--muted);font-size:11px}
    .pend{color:var(--bad);font-weight:800}
    .ok{color:var(--ok);font-weight:800}
    @media print{body{margin:12mm} .no-print{display:none}}
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">${escapeHtml(subtitle)}</p>
  <table>
    <thead><tr><th>Nome</th><th>Apelido</th><th>Status (${escapeHtml(month)})</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p class="sub no-print">Dica: no diálogo de impressão, escolha “Salvar como PDF”.</p>
  <script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('Não consegui abrir a janela para exportar. Verifique se o bloqueador de pop-up está ativo.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderJogadores(state) {
  const table = document.querySelector('table[data-table="jogadores"]');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  const list = (state.data.jogadores ?? []);
  const jogadores = isAdmin() ? list : list.filter((j) => !isBlankJogador(j));

  jogadores.forEach((j, idx) => {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    setEditableCell(tdNome, { value: j.nome, onCommit: (v) => (j.nome = v || '—') });

    const tdTime = document.createElement('td');
    setEditableCell(tdTime, { value: j.time, onCommit: (v) => (j.time = v) });

    const numberCell = (key) => {
      const td = document.createElement('td');
      setEditableCell(td, {
        value: String(j[key] ?? 0),
        validator: (raw) => /^-?\d+$/.test(raw),
        onCommit: (raw) => (j[key] = Number(raw) || 0)
      });
      return td;
    };

    tr.appendChild(tdNome);
    tr.appendChild(tdTime);
    tr.appendChild(numberCell('gols'));
    tr.appendChild(numberCell('amarelos'));
    tr.appendChild(numberCell('vermelhos'));
    tr.appendChild(numberCell('suspensoes'));

    const tdActions = document.createElement('td');
    if (isAdmin()) {
      const btn = el('button', {
        class: 'icon-btn',
        type: 'button',
        'data-action': 'remove-row',
        'data-table': 'jogadores',
        'data-index': String(idx),
        title: 'Remover'
      });
      btn.textContent = iconTrash();
      tdActions.appendChild(btn);
    }
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

function renderGastos(state) {
  const table = document.querySelector('table[data-table="gastos"]');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  const filter = getGastosFilter();
  const base = (state.data.gastos ?? []);
  const visible = isAdmin() ? base : base.filter((g) => !isBlankGasto(g));
  const all = visible.filter((g) => gastosMatchesSearch(g, filter));

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / GASTOS_PAGE_SIZE));
  gastosCurrentPage = Math.max(1, Math.min(gastosCurrentPage, totalPages));
  const start = (gastosCurrentPage - 1) * GASTOS_PAGE_SIZE;
  const end = Math.min(total, start + GASTOS_PAGE_SIZE);
  const gastos = all.slice(start, end);

  const info = document.getElementById('gastos-page-info');
  const prev = document.getElementById('gastos-page-prev');
  const next = document.getElementById('gastos-page-next');
  if (info) {
    const showing = total ? `Mostrando ${start + 1}-${end} de ${total}` : 'Nenhum resultado';
    info.textContent = `${showing} • Página ${gastosCurrentPage} de ${totalPages}`;
  }
  if (prev) prev.disabled = gastosCurrentPage <= 1;
  if (next) next.disabled = gastosCurrentPage >= totalPages;

  gastos.forEach((g, visualIdx) => {
    const idx = state.data.gastos.indexOf(g);
    const tr = document.createElement('tr');

    const tdMes = document.createElement('td');
    setEditableCell(tdMes, {
      value: g.mes,
      onCommit: (v) => (g.mes = v || '—')
    });

    const tdData = document.createElement('td');
    setEditableCell(tdData, {
      value: g.data,
      onCommit: (v) => (g.data = v)
    });

    const tdDesc = document.createElement('td');
    setEditableCell(tdDesc, {
      value: g.descricao,
      onCommit: (v) => (g.descricao = v)
    });

    const tdValor = document.createElement('td');
    setEditableCell(tdValor, {
      value: g.valor != null ? money(g.valor) : 'R$ 0,00',
      validator: (raw) => Number.isFinite(parseMoney(raw)),
      onCommit: (raw) => {
        g.valor = parseMoney(raw);
        tdValor.textContent = money(g.valor);
        updateGastosResumo(state);
      }
    });

    tr.appendChild(tdMes);
    tr.appendChild(tdData);
    tr.appendChild(tdDesc);
    tr.appendChild(tdValor);

    const tdActions = document.createElement('td');
    if (isAdmin()) {
      const btn = el('button', {
        class: 'icon-btn',
        type: 'button',
        'data-action': 'remove-row',
        'data-table': 'gastos',
        'data-index': String(idx),
        title: 'Remover'
      });
      btn.textContent = iconTrash();
      tdActions.appendChild(btn);
    }
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  updateGastosResumo(state);
}

function updateGastosResumo(state) {
  const total = (state.data.gastos ?? []).reduce((acc, it) => acc + parseMoney(it.valor), 0);
  const slot = document.querySelector('[data-slot="gastos-resumo"]');
  if (slot) slot.textContent = `Total de gastos: ${money(total)}`;
}

function renderEntradas(state) {
  const table = document.querySelector('table[data-table="entradas"]');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  const base = (state.data.entradas ?? []);
  const entradas = isAdmin() ? base : base.filter((e) => !isBlankEntrada(e));

  entradas.forEach((en, idx) => {
    const tr = document.createElement('tr');

    const tdMes = document.createElement('td');
    setEditableCell(tdMes, {
      value: en.mes,
      onCommit: (v) => {
        en.mes = v || '—';
        scheduleSaldoRefresh(state);
      }
    });

    const tdData = document.createElement('td');
    setEditableCell(tdData, {
      value: en.data,
      onCommit: (v) => {
        en.data = v;
        scheduleSaldoRefresh(state);
      }
    });

    const tdOrigem = document.createElement('td');
    setEditableCell(tdOrigem, {
      value: en.origem,
      onCommit: (v) => {
        en.origem = v;
        scheduleSaldoRefresh(state);
      }
    });

    const tdValor = document.createElement('td');
    setEditableCell(tdValor, {
      value: en.valor != null ? money(en.valor) : 'R$ 0,00',
      validator: (raw) => Number.isFinite(parseMoney(raw)),
      onCommit: (raw) => {
        en.valor = parseMoney(raw);
        tdValor.textContent = money(en.valor);
        scheduleSaldoRefresh(state);
      }
    });

    tr.appendChild(tdMes);
    tr.appendChild(tdData);
    tr.appendChild(tdOrigem);
    tr.appendChild(tdValor);

    const tdActions = document.createElement('td');
    if (isAdmin()) {
      const btn = el('button', {
        class: 'icon-btn',
        type: 'button',
        'data-action': 'remove-row',
        'data-table': 'entradas',
        'data-index': String(idx),
        title: 'Remover'
      });
      btn.textContent = iconTrash();
      tdActions.appendChild(btn);
    }
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  updateEntradasResumo(state);
}

function updateEntradasResumo(state) {
  const total = (state.data.entradas ?? []).reduce((acc, it) => acc + parseMoney(it.valor), 0);
  const slot = document.querySelector('[data-slot="entradas-resumo"]');
  if (slot) slot.textContent = `Total de outras entradas: ${money(total)}`;
}

function pct(pg, j) {
  const max = Number(j) * 3;
  if (!Number.isFinite(max) || max <= 0) return 0;
  const p = (Number(pg) / max) * 100;
  return Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0;
}

function renderTimes(state) {
  const table = document.querySelector('table[data-table="times"]');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  renderCriterios();

  // Ordena por critérios configurados
  const sorted = [...state.data.times].sort((a, b) => {
    for (const c of CLASSIFICACAO_CRITERIOS) {
      const av = Number(a[c.campo]) || 0;
      const bv = Number(b[c.campo]) || 0;
      const d = c.direcao === 'asc' ? (av - bv) : (bv - av);
      if (d !== 0) return d;
    }
    return 0;
  });

  // Mantém o array original sincronizado pela ordem renderizada
  state.data.times = sorted;

  sorted.forEach((t, idx) => {
    const tr = document.createElement('tr');

    const tdTime = document.createElement('td');
    setEditableCell(tdTime, { value: t.time, onCommit: (v) => (t.time = v || '—') });

    const num = (key) => {
      const td = document.createElement('td');
      setEditableCell(td, {
        value: String(t[key] ?? 0),
        validator: (raw) => /^-?\d+$/.test(raw),
        onCommit: (raw) => {
          t[key] = Number(raw) || 0;
          // Atualização automática depois que o administrador inserir/editar
          scheduleClassificacaoRefresh(state);
        }
      });
      return td;
    };

    const tdPct = document.createElement('td');
    tdPct.textContent = `${Math.round(pct(t.pg, t.j))}%`;

    tr.appendChild(tdTime);
    tr.appendChild(num('pg'));
    tr.appendChild(num('j'));
    tr.appendChild(num('v'));
    tr.appendChild(num('e'));
    tr.appendChild(num('der'));
    tr.appendChild(num('gf'));
    tr.appendChild(num('gs'));
    tr.appendChild(num('sg'));
    tr.appendChild(num('ca'));
    tr.appendChild(num('cv'));
    tr.appendChild(tdPct);

    const tdActions = document.createElement('td');
    if (isAdmin()) {
      const btn = el('button', {
        class: 'icon-btn',
        type: 'button',
        'data-action': 'remove-row',
        'data-table': 'times',
        'data-index': String(idx),
        title: 'Remover'
      });
      btn.textContent = iconTrash();
      tdActions.appendChild(btn);
    }
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  renderClassificacaoResumo(state);
}

function renderCriterios() {
  const body = document.querySelector('[data-slot="criterios-body"]');
  if (!body) return;
  body.innerHTML = '';
  for (const c of CLASSIFICACAO_CRITERIOS) {
    const tr = document.createElement('tr');
    tr.appendChild(el('td', { text: c.ordem }));
    tr.appendChild(el('td', { text: c.sigla }));
    tr.appendChild(el('td', { text: c.descricao }));
    body.appendChild(tr);
  }
}

function renderClassificacaoResumo(state) {
  const slot = document.querySelector('[data-slot="classificacao-resumo"]');
  if (!slot) return;
  const totalGols = state.data.times.reduce((acc, t) => acc + (Number(t.gf) || 0), 0);
  const totalAmarelo = state.data.times.reduce((acc, t) => acc + (Number(t.ca) || 0), 0);
  const totalVermelho = state.data.times.reduce((acc, t) => acc + (Number(t.cv) || 0), 0);

  // jogos totais: soma J / 2 (cada jogo conta para 2 times). se der ímpar, arredonda para baixo.
  const somaJ = state.data.times.reduce((acc, t) => acc + (Number(t.j) || 0), 0);
  const jogos = Math.max(0, Math.floor(somaJ / 2));

  const mediaGols = jogos > 0 ? totalGols / jogos : 0;
  const mediaAm = jogos > 0 ? totalAmarelo / jogos : 0;
  const mediaVm = jogos > 0 ? totalVermelho / jogos : 0;

  slot.innerHTML = '';
  slot.appendChild(kpi('Total de gols', String(totalGols)));
  slot.appendChild(kpi('Média de gols', mediaGols.toLocaleString('pt-BR', { maximumFractionDigits: 2 })));
  slot.appendChild(kpi('Total de amarelos', String(totalAmarelo)));
  slot.appendChild(kpi('Média de amarelos', mediaAm.toLocaleString('pt-BR', { maximumFractionDigits: 2 })));
  slot.appendChild(kpi('Total de vermelhos', String(totalVermelho)));
  slot.appendChild(kpi('Média de vermelhos', mediaVm.toLocaleString('pt-BR', { maximumFractionDigits: 2 })));
}

function kpi(label, value, tone) {
  const valueEl = el('div', { class: 'kpi__value', text: value });
  const row = el('div', { class: 'kpi' }, [
    el('div', { class: 'kpi__label', text: label }),
    valueEl,
  ]);
  if (tone === 'ok') row.classList.add('kpi--ok');
  if (tone === 'bad') row.classList.add('kpi--bad');
  return row;
}

function summarizeSaldo(state) {
  const mensalidadeByMonth = computeMensalidadeByMonth(state.data.associados);
  const totalMensalidades = [...mensalidadeByMonth.values()].reduce((a, b) => a + b, 0);

  const totalOutrasEntradas = state.data.entradas
    .filter((it) => !isMensalidadeEntrada(it))
    .reduce((acc, it) => acc + parseMoney(it.valor), 0);
  const totalEntradas = totalMensalidades + totalOutrasEntradas;
  const totalGastos = state.data.gastos.reduce((acc, it) => acc + parseMoney(it.valor), 0);
  const saldo = totalEntradas - totalGastos;

  const slot = document.querySelector('[data-slot="saldo-resumo"]');
  if (slot) {
    slot.innerHTML = '';
    slot.appendChild(kpi('Mensalidades (Associados)', money(totalMensalidades)));
    slot.appendChild(kpi('Outras entradas', money(totalOutrasEntradas)));
    slot.appendChild(kpi('Total arrecadado', money(totalEntradas)));
    slot.appendChild(kpi('Total gasto', money(totalGastos)));
    slot.appendChild(kpi('Saldo', money(saldo), saldo >= 0 ? 'ok' : 'bad'));
  }

  const tbody = document.querySelector('table[data-table="saldo-mensal"] tbody');
  if (tbody) {
    tbody.innerHTML = '';

    const byMonth = new Map();
    for (const m of MONTHS.map(x => x.label)) {
      byMonth.set(m, { mes: m, entradas: 0, gastos: 0 });
    }

    for (const e of state.data.entradas) {
      if (isMensalidadeEntrada(e)) continue;
      const mes = (e.mes || '').trim() || '—';
      if (!byMonth.has(mes)) byMonth.set(mes, { mes, entradas: 0, gastos: 0 });
      byMonth.get(mes).entradas += parseMoney(e.valor);
    }

    // adiciona mensalidades (Associados)
    for (const [mes, valor] of mensalidadeByMonth.entries()) {
      if (!byMonth.has(mes)) byMonth.set(mes, { mes, entradas: 0, gastos: 0 });
      byMonth.get(mes).entradas += valor;
    }

    for (const g of state.data.gastos) {
      const mes = (g.mes || '').trim() || '—';
      if (!byMonth.has(mes)) byMonth.set(mes, { mes, entradas: 0, gastos: 0 });
      byMonth.get(mes).gastos += parseMoney(g.valor);
    }

    const rows = [...byMonth.values()];
    for (const r of rows) {
      const tr = document.createElement('tr');
      const tdMes = el('td', { text: r.mes });
      const tdEn = el('td', { text: money(r.entradas) });
      const tdGa = el('td', { text: money(r.gastos) });
      const s = r.entradas - r.gastos;
      const tdSa = el('td', { text: money(s) });
      tdSa.classList.add(s >= 0 ? 'is-ok' : 'is-bad');
      tr.appendChild(tdMes);
      tr.appendChild(tdEn);
      tr.appendChild(tdGa);
      tr.appendChild(tdSa);
      tbody.appendChild(tr);
    }
  }
}

function renderPage(state) {
  const page = document.body.getAttribute('data-page');
  if (page === 'associados') {
    renderAssociados(state);
    renderInadimplentes(state);
  }
  if (page === 'jogadores') renderJogadores(state);
  if (page === 'gastos') renderGastos(state);
  if (page === 'saldo') {
    renderEntradas(state);
    summarizeSaldo(state);
  }
  if (page === 'classificacao') renderTimes(state);
  if (page === 'campeonato') renderCampeonato(state);
}

function toYouTubeEmbedUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.includes('youtube.com/embed/')) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : s;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : s;
    }
  } catch {
    // ignora
  }
  return s;
}

function fmtDateShort(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function renderCampeonato(state) {
  if (!state.data.campeonato) state.data.campeonato = { jogos: [], videos: [], imagens: [], posts: [] };

  // Jogos (cartelas por rodada)
  const roundsSlot = document.querySelector('[data-slot="campeonato-rounds"]');
  if (roundsSlot) {
    roundsSlot.innerHTML = '';
    const allJogos = state.data.campeonato.jogos ?? [];
    const admin = isAdmin();
    const jogos = admin ? allJogos : allJogos.filter((j) => isVisibleJogoForVisitor(j));

    if (!jogos.length) {
      roundsSlot.appendChild(el('div', { class: 'muted', text: 'Nenhum jogo cadastrado.' }));
    }
    
    // Agrupa por rodada
    const byRound = new Map();
    for (const j of jogos) {
      const r = String(j?.rodada || '—').trim();
      if (!byRound.has(r)) byRound.set(r, []);
      byRound.get(r).push(j);
    }

    const rounds = [...byRound.keys()].sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a).localeCompare(String(b), 'pt-BR');
    });

    const grid = el('div', { class: 'cup-grid' });
    for (const roundKey of rounds) {
      const games = (byRound.get(roundKey) || []).slice().sort((a, b) => {
        // Ordena por Data (y-m-d) e depois Hora
        const ad = String(a?.data || '').localeCompare(String(b?.data || ''));
        if (ad !== 0) return ad;
        return String(a?.hora || '').localeCompare(String(b?.hora || ''));
      });

      // Tenta achar data comum para o cabeçalho
      const dates = [...new Set(games.map(g => g.data).filter(d => d && d !== '—'))];
      const commonDate = dates.length === 1 ? dates[0] : null;

      const card = el('div', { class: 'cup-card' });
      const headerText = commonDate ? `Rodada ${roundKey}º (${commonDate})` : `Rodada ${roundKey}º`;
      const header = el('div', { class: 'cup-card__round' }, [el('strong', { text: headerText })]);
      card.appendChild(header);

      const table = el('table', { class: 'cup-table' });
      const tbody = el('tbody');

      for (const g of games) {
        const idx = allJogos.indexOf(g);
        const tr = el('tr');

        // COLUNA: Hora (e Data se admin ou se divergente)
        const tdTime = el('td', { class: 'cup-col-time' });
        
        // Wrapper para Time e Date
        const timeVal = el('div', { text: g?.hora || '' });
        // Se a data for diferente da comum, ou se não houver comum, mostra.
        // Se for admin, mostra sempre para permitir edição? Ou esconde se igual?
        // Para simplificar a visualização "Imagem 1", mostramos apenas HORA.
        // A Data fica editável abaixo apenas para admin.
        const dateVal = el('div', { text: g?.data || '', style: 'font-size:11px; font-weight:400; margin-top:2px; color:#555' });
        
        // Se Data Comum existe e é igual à data do jogo, e NÃO é admin, esconde a data.
        if (!admin && commonDate && g.data === commonDate) {
            dateVal.style.display = 'none';
        }

        if (admin) {
          timeVal.contentEditable = 'true';
          dateVal.contentEditable = 'true';
          // Placeholder visuals
          if (!timeVal.textContent) timeVal.textContent = 'HH:MM';
          if (!dateVal.textContent) dateVal.textContent = 'AAAA-MM-DD';

          timeVal.addEventListener('blur', () => { g.hora = trimText(timeVal.textContent); });
          dateVal.addEventListener('blur', () => { g.data = trimText(dateVal.textContent); });
          
          timeVal.style.borderBottom = '1px dashed #ccc'; // Hint that they are separate
        } else {
             if (!g.hora) timeVal.textContent = ''; // ou '--:--'
        }
        
        tdTime.appendChild(timeVal);
        tdTime.appendChild(dateVal);
        tr.appendChild(tdTime);

        // COLUNA: Mandante
        const tdHome = el('td', { class: 'cup-col-team team-home' });
        if (admin) {
          tdHome.contentEditable = 'true';
          tdHome.textContent = g?.casa || '';
          tdHome.addEventListener('blur', () => { g.casa = trimText(tdHome.textContent); });
        } else {
          tdHome.textContent = g?.casa || '—';
        }
        tr.appendChild(tdHome);

        // Placar
        const parts = parsePlacarParts(g?.placar);
        // COLUNA: Score 1
        const tdS1 = el('td', { class: 'cup-col-score' });
        // COLUNA: X
        const tdVs = el('td', { class: 'cup-col-x', text: 'x' });
        // COLUNA: Score 2
        const tdS2 = el('td', { class: 'cup-col-score' });

        const commitPlacar = () => {
          g.placar = formatPlacarFromParts(tdS1.textContent, tdS2.textContent);
        };

        if (admin) {
          tdS1.contentEditable = 'true';
          tdS2.contentEditable = 'true';
          tdS1.textContent = parts.a;
          tdS2.textContent = parts.b;
          tdS1.addEventListener('blur', () => {
            tdS1.textContent = sanitizeScoreText(tdS1.textContent);
            commitPlacar();
          });
          tdS2.addEventListener('blur', () => {
            tdS2.textContent = sanitizeScoreText(tdS2.textContent);
            commitPlacar();
          });
        } else {
          tdS1.textContent = parts.a || '';
          tdS2.textContent = parts.b || '';
        }

        tr.appendChild(tdS1);
        tr.appendChild(tdVs);
        tr.appendChild(tdS2);

        // COLUNA: Visitante
        const tdAway = el('td', { class: 'cup-col-team team-away' });
        if (admin) {
          tdAway.contentEditable = 'true';
          tdAway.textContent = g?.fora || '';
          tdAway.addEventListener('blur', () => { g.fora = trimText(tdAway.textContent); });
        } else {
          tdAway.textContent = g?.fora || '—';
        }
        tr.appendChild(tdAway);

        // Ações (Delete)
        if (admin) {
            const tdDel = el('td', { class: 'cup-col-del' });
            const btnDel = el('button', {
             class: 'icon-btn',
             type: 'button',
             'data-action': 'remove-row',
             'data-table': 'campeonato', // verifica se isso bate com a lógica de deleção global
             'data-index': String(idx),
             title: 'Excluir jogo',
             style: 'color: red;' 
            });
            // SVG Icon Trash
            btnDel.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            
            tdDel.appendChild(btnDel);
            tr.appendChild(tdDel);
        }

        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      card.appendChild(table);
      grid.appendChild(card);
    }
    roundsSlot.appendChild(grid);
  }

  // Vídeos
  const videosSlot = document.querySelector('[data-slot="campeonato-videos"]');
  if (videosSlot) {
    videosSlot.innerHTML = '';
    const wrap = el('div', { class: 'media-list' });
    const list = state.data.campeonato.videos ?? [];
    for (const v of list) {
      const embed = toYouTubeEmbedUrl(v?.url);
      if (!embed) continue;
      const frame = el('div', { class: 'media-frame' });
      const iframe = document.createElement('iframe');
      iframe.src = embed;
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);
      wrap.appendChild(frame);
    }
    videosSlot.appendChild(wrap);
  }

  // Imagens
  const imagensSlot = document.querySelector('[data-slot="campeonato-imagens"]');
  if (imagensSlot) {
    imagensSlot.innerHTML = '';
    const grid = el('div', { class: 'img-grid' });
    const list = state.data.campeonato.imagens ?? [];
    for (const img of list) {
      const url = String(img?.url || '').trim();
      if (!url) continue;
      const card = el('div', { class: 'img-card' });
      const im = document.createElement('img');
      im.src = url;
      im.alt = 'Imagem do campeonato';
      im.loading = 'lazy';
      card.appendChild(im);
      const cap = el('div', { class: 'img-cap', text: String(img?.legenda || '').trim() || '—' });
      card.appendChild(cap);
      grid.appendChild(card);
    }
    imagensSlot.appendChild(grid);
  }

  // Posts e comentários
  const postsSlot = document.querySelector('[data-slot="campeonato-posts"]');
  if (postsSlot) {
    postsSlot.innerHTML = '';
    const wrap = el('div', { class: 'posts' });
    const posts = state.data.campeonato.posts ?? [];

    for (const p of posts) {
      const post = el('div', { class: 'post' });

      const head = el('div', { class: 'post__head' }, [
        el('h3', { class: 'post__title', text: p?.titulo || '—' }),
        el('div', { class: 'post__meta', text: `Rodada: ${p?.rodada || '—'} • ${fmtDateShort(p?.criadoEm)}` }),
      ]);
      post.appendChild(head);
      post.appendChild(el('p', { class: 'post__text', text: p?.texto || '' }));

      const comments = el('div', { class: 'comments' });
      const list = Array.isArray(p?.comentarios) ? p.comentarios : [];
      for (const c of list) {
        const item = el('div', { class: 'comment' });
        const who = String(c?.nome || 'Visitante').trim() || 'Visitante';
        item.appendChild(el('div', { class: 'comment__who', text: `${who} • ${fmtDateShort(c?.criadoEm)}` }));
        item.appendChild(el('p', { class: 'comment__txt', text: String(c?.texto || '').trim() }));
        comments.appendChild(item);
      }
      post.appendChild(comments);

      const form = el('div', { class: 'comment-form' });
      const name = el('input', { class: 'input', id: `comment-name-${p.id}`, type: 'text', placeholder: 'Seu nome (opcional)' });
      const text = el('input', { class: 'input', id: `comment-text-${p.id}`, type: 'text', placeholder: 'Escreva um comentário...' });
      const send = el('button', { class: 'btn', type: 'button', 'data-action': 'add-comment', 'data-post-id': String(p.id) });
      send.textContent = 'Comentar';
      form.appendChild(name);
      form.appendChild(text);
      form.appendChild(send);
      post.appendChild(form);

      wrap.appendChild(post);
    }

    postsSlot.appendChild(wrap);
  }
}

function injectToastStyles() {
  const css = `
.toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(10px);opacity:0;
  padding:10px 12px;border-radius:999px;border:1px solid var(--border);
  background:rgba(255,255,255,0.92);backdrop-filter: blur(10px);box-shadow: var(--shadow);
  font-weight:800;color:var(--text);transition:opacity 180ms ease, transform 180ms ease;z-index:60}
.toast--show{opacity:1;transform:translateX(-50%) translateY(0)}
.is-ok{color:var(--ok);font-weight:900}
.is-bad{color:var(--danger);font-weight:900}
`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

(async function init() {
  injectToastStyles();
  const state = { data: structuredClone(DEFAULT_DATA) };
  bindGlobalActions(state);
  bindAdminControls(state);
  bindAssociadosFilter(state);
  bindInadimplentesFilter(state);
  bindGastosControls(state);
  bindJogadoresImport(state);
  bindAssociadosImport(state);
  bindGastosImport(state);
  await refreshAdminFromToken();
  state.data = await loadDataPreferApi();
  renderPage(state);
})();
