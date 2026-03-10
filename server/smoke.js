const path = require('path');
// Não sobrescreve variáveis vindas do ambiente (ex.: Railway).
require('dotenv').config({ override: false, path: path.join(__dirname, '..', '.env') });

function getArg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}

async function main() {
  const baseUrl = (getArg('--baseUrl') || 'http://localhost:3000').replace(/\/$/, '');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!process.env.ADMIN_JWT_SECRET) {
    console.error('[smoke] ADMIN_JWT_SECRET ausente.');
    process.exitCode = 2;
    return;
  }
  if (!adminPassword) {
    console.error('[smoke] ADMIN_PASSWORD ausente (não dá para logar como admin).');
    process.exitCode = 2;
    return;
  }

  const out = { baseUrl, login: null, api: [], notes: [] };

  // 1) Health
  const health = await fetchJson(`${baseUrl}/api/health`);
  out.api.push({ name: 'health', path: '/api/health', status: health.status, ok: health.ok, error: health.json?.error });

  // 2) Login admin
  const login = await fetchJson(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  const token = login.json?.token || '';
  out.login = { ok: login.ok, status: login.status, role: login.json?.user?.role || null, hasToken: Boolean(token) };

  if (!token) {
    out.notes.push('Falha no login admin — não foi possível obter token.');
    console.log(JSON.stringify(out, null, 2));
    process.exitCode = 1;
    return;
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3) Endpoints principais (GET)
  const endpoints = [
    ['me', '/api/auth/me'],
    ['data_all', '/api/data'],
    ['associados', '/api/associados'],
    ['jogadores', '/api/jogadores'],
    ['times', '/api/times'],
    ['campeonato', '/api/campeonato'],
    ['gastos', '/api/gastos'],
    ['entradas', '/api/entradas'],
    ['data_jogadores', '/api/data/jogadores'],
    ['data_times', '/api/data/times'],
    ['data_jogos', '/api/data/campeonato-jogos'],
  ];

  for (const [name, path] of endpoints) {
    const r = await fetchJson(`${baseUrl}${path}`, { headers: authHeaders });
    const kind = Array.isArray(r.json) ? 'array' : (r.json && typeof r.json === 'object' ? 'object' : typeof r.json);
    out.api.push({ name, path, status: r.status, ok: r.ok, kind, len: Array.isArray(r.json) ? r.json.length : undefined, error: r.json?.error });
  }

  // 4) Pagamentos: tenta primeiro associado
  const assoc = await fetchJson(`${baseUrl}/api/associados`, { headers: authHeaders });
  const firstId = Array.isArray(assoc.json) && assoc.json.length ? assoc.json[0].id : null;
  if (firstId) {
    const p = await fetchJson(`${baseUrl}/api/data/associados/${firstId}/pagamentos`, { headers: authHeaders });
    out.api.push({ name: 'pagamentos_first', path: `/api/data/associados/${firstId}/pagamentos`, status: p.status, ok: p.ok, kind: Array.isArray(p.json) ? 'array' : typeof p.json, len: Array.isArray(p.json) ? p.json.length : undefined, error: p.json?.error });
  } else {
    out.notes.push('Sem associados para testar pagamentos.');
  }

  // 5) Comentários públicos: tenta postar em post-1
  const comment = await fetchJson(`${baseUrl}/api/campeonato/posts/post-1/comentarios`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nome: 'SmokeTest', texto: `OK ${new Date().toISOString()}` }),
  });
  out.api.push({ name: 'post_comment', path: '/api/campeonato/posts/post-1/comentarios', status: comment.status, ok: comment.ok, error: comment.json?.error });

  // 6) PUT roundtrip (admin): baixa /api/data e salva igual
  const dataAll = await fetchJson(`${baseUrl}/api/data`, { headers: authHeaders });
  if (dataAll.ok && dataAll.json && typeof dataAll.json === 'object') {
    const put = await fetchJson(`${baseUrl}/api/data`, {
      method: 'PUT',
      headers: { ...authHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(dataAll.json),
    });
    out.api.push({ name: 'put_data_roundtrip', path: '/api/data (PUT)', status: put.status, ok: put.ok, error: put.json?.error });
  } else {
    out.notes.push('Não foi possível baixar /api/data para testar PUT roundtrip.');
  }

  // 7) Static pages check (status/content-type)
  const pages = [
    '/',
    '/index.html',
    '/login.html',
    '/dashboard.html',
    '/jogadores.html',
    '/gastos.html',
    '/saldo.html',
    '/classificacao.html',
    '/campeonato.html',
    '/entreterimento.html',
    '/inicio.html',
    '/assets/styles.css',
    '/assets/app.js',
    '/service-worker.js',
    '/manifest.json',
  ];

  for (const p of pages) {
    const res = await fetch(`${baseUrl}${p}`);
    out.api.push({ name: `static_${p}`, path: p, status: res.status, ok: res.ok, ct: res.headers.get('content-type') || null });
  }

  console.log(JSON.stringify(out, null, 2));

  const failed = out.api.filter((x) => x.ok === false && !String(x.name).startsWith('static_'));
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[smoke] erro:', err);
  process.exitCode = 1;
});
