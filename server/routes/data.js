const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const { requireAuth } = require('../middleware/requireAuth');
const { ensureAdminUser } = require('../user-service');

const MONTH_KEYS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function parseMoney(raw) {
  if (raw == null) return 0;
  // NUMERIC(12,2) => |valor| < 10^10
  const maxAbs = 9_999_999_999.99;

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return 0;
    const clamped = Math.max(-maxAbs, Math.min(maxAbs, raw));
    return Math.round(clamped * 100) / 100;
  }
  const s = String(raw).trim();
  if (!s) return 0;

  // Suporta formatos:
  // - pt-BR: "1.234,56" / "R$ 1.234,56"
  // - en-US/DB: "1234.56" (Postgres NUMERIC costuma vir como string com '.')
  // - números/strings simples: "30", "-10"
  let cleaned = s
    .replace(/R\$\s?/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9,\.\-]/g, '');

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // Assume "." como separador de milhar e "," como decimal.
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
  } else if (hasComma && !hasDot) {
    // Apenas vírgula: vírgula decimal.
    cleaned = cleaned.replace(/,/g, '.');
  } else if (hasDot && !hasComma) {
    // Apenas ponto: pode ser decimal (DB) ou milhar ("1.234.567").
    // Se houver mais de um ponto, mantém só o último como decimal.
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      const last = parts.pop();
      cleaned = parts.join('') + '.' + last;
    }
  }

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;

  if (Math.abs(n) > maxAbs) return 0;
  return Math.round(n * 100) / 100;
}

function normalizePagamentoCell(raw) {
  if (raw == null) return { raw: 'Pendente', valor: 0 };
  if (typeof raw === 'number') {
    const v = parseMoney(raw);
    return v > 0 ? { raw: `R$ ${v.toFixed(2)}`.replace('.', ','), valor: v } : { raw: 'Pendente', valor: 0 };
  }
  const s = String(raw).trim();
  if (!s) return { raw: 'Pendente', valor: 0 };
  const norm = s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  if (norm === 'd') return { raw: 'D', valor: 0 };
  if (norm === '-' || norm === '—' || norm === 'r$ -' || norm === 'r$-' || norm === 'r$') return { raw: 'Pendente', valor: 0 };
  if (norm.includes('pendente')) return { raw: 'Pendente', valor: 0 };
  if (norm.includes('pago')) return { raw: 'Pago', valor: 30 };

  const v = parseMoney(s);
  if (v <= 0) return { raw: 'Pendente', valor: 0 };
  return { raw: s, valor: v };
}

function normalizeOptionalText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeAssociadoEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return email || null;
}

function normalizeJogadorEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return email || null;
}

function getAssociadoDefaultPassword(item) {
  const explicit = String(item?.senha ?? item?.password ?? '').trim();
  if (explicit) return explicit;
  return String(process.env.ASSOCIADO_DEFAULT_PASSWORD || '123456').trim() || '123456';
}

function buildAssociadoFallbackEmail(item, associadoId) {
  const fromName = String(item?.apelido || item?.nome || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 40);
  const localPart = fromName || `associado.${associadoId}`;
  const domain = String(process.env.ASSOCIADO_EMAIL_DOMAIN || 'associado.chuteira.local').trim().toLowerCase();
  return `${localPart}.${associadoId}@${domain}`;
}

function getJogadorDefaultPassword(item) {
  const explicit = String(item?.senha ?? item?.password ?? '').trim();
  if (explicit) return explicit;
  return String(process.env.JOGADOR_DEFAULT_PASSWORD || '123456').trim() || '123456';
}

function buildJogadorFallbackEmail(item, jogadorId) {
  const fromName = String(item?.nome || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 40);
  const localPart = fromName || `jogador.${jogadorId}`;
  const domain = String(process.env.JOGADOR_EMAIL_DOMAIN || 'jogador.chuteira.local').trim().toLowerCase();
  return `${localPart}.${jogadorId}@${domain}`;
}

async function upsertAssociadoUser(client, { associadoId, email, passwordHash }) {
  const existingByAssociado = await client.query(
    'SELECT id FROM users WHERE associado_id = $1 LIMIT 1',
    [associadoId]
  );

  if (existingByAssociado.rowCount > 0) {
    await client.query(
      `UPDATE users
       SET email = $1,
           password_hash = $2,
           role = 'associado',
           ativo = TRUE
       WHERE id = $3`,
      [email, passwordHash, existingByAssociado.rows[0].id]
    );
    return;
  }

  await client.query(
    `INSERT INTO users (email, password_hash, role, associado_id, ativo)
     VALUES ($1, $2, 'associado', $3, TRUE)
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash,
                   role = 'associado',
                   associado_id = EXCLUDED.associado_id,
                   ativo = TRUE`,
    [email, passwordHash, associadoId]
  );
}

async function upsertJogadorUser(client, { jogadorId, email, fallbackEmail, passwordHash }) {
  const existingByJogador = await client.query(
    'SELECT id FROM users WHERE jogador_id = $1 LIMIT 1',
    [jogadorId]
  );

  const tryUpdate = async (targetEmail, userId) => {
    await client.query(
      `UPDATE users
       SET email = $1,
           password_hash = $2,
           role = 'jogador',
           associado_id = NULL,
           jogador_id = $3,
           ativo = TRUE
       WHERE id = $4`,
      [targetEmail, passwordHash, jogadorId, userId]
    );
  };

  const tryInsert = async (targetEmail) => {
    await client.query(
      `INSERT INTO users (email, password_hash, role, associado_id, jogador_id, ativo)
       VALUES ($1, $2, 'jogador', NULL, $3, TRUE)`,
      [targetEmail, passwordHash, jogadorId]
    );
  };

  const candidates = [email, fallbackEmail].filter(Boolean);

  if (existingByJogador.rowCount > 0) {
    for (const candidate of candidates) {
      try {
        await tryUpdate(candidate, existingByJogador.rows[0].id);
        return candidate;
      } catch (err) {
        if (err?.code !== '23505') throw err;
      }
    }
    throw new Error('failed_to_update_jogador_user_email');
  }

  for (const candidate of candidates) {
    try {
      await tryInsert(candidate);
      return candidate;
    } catch (err) {
      if (err?.code !== '23505') throw err;
    }
  }

  throw new Error('failed_to_create_jogador_user_email');
}

async function fetchData() {
  const client = await pool.connect();
  try {
    const configRes = await client.query('SELECT data FROM app_config WHERE id=1');
    const config = configRes.rows?.[0]?.data && typeof configRes.rows[0].data === 'object' ? configRes.rows[0].data : {};

    const associadosRes = await client.query('SELECT id, nome, apelido, email, telefone, foto_url FROM associados ORDER BY id ASC');
    const pagamentosRes = await client.query('SELECT associado_id, mes_key, raw FROM associados_pagamentos');

    const pagamentosByAssociado = new Map();
    for (const row of pagamentosRes.rows) {
      const id = String(row.associado_id);
      if (!pagamentosByAssociado.has(id)) pagamentosByAssociado.set(id, {});
      pagamentosByAssociado.get(id)[row.mes_key] = row.raw;
    }

    const associados = associadosRes.rows.map((a) => {
      const pagamentos = {};
      for (const mk of MONTH_KEYS) pagamentos[mk] = 'Pendente';
      const merged = pagamentosByAssociado.get(String(a.id)) || {};
      for (const mk of Object.keys(merged)) pagamentos[mk] = merged[mk];
      return {
        id: a.id,
        nome: a.nome,
        apelido: a.apelido,
        email: a.email,
        telefone: a.telefone,
        foto_url: a.foto_url,
        pagamentos,
      };
    });

    const jogadores = (await client.query('SELECT * FROM jogadores ORDER BY id ASC')).rows;
    const gastos = (await client.query('SELECT * FROM gastos ORDER BY id ASC')).rows;
    const entradas = (await client.query('SELECT * FROM entradas ORDER BY id ASC')).rows;
    const times = (await client.query('SELECT * FROM times ORDER BY id ASC')).rows;

    const jogos = (await client.query('SELECT * FROM campeonato_jogos ORDER BY id ASC')).rows;
    const videos = (await client.query('SELECT * FROM campeonato_videos ORDER BY id DESC')).rows;
    const imagens = (await client.query('SELECT * FROM campeonato_imagens ORDER BY id DESC')).rows;
    const posts = (await client.query('SELECT * FROM campeonato_posts ORDER BY criado_em DESC')).rows;
    const comentarios = (await client.query('SELECT * FROM campeonato_comentarios ORDER BY criado_em ASC')).rows;

    const comentariosByPost = new Map();
    for (const c of comentarios) {
      const pid = String(c.post_id);
      if (!comentariosByPost.has(pid)) comentariosByPost.set(pid, []);
      comentariosByPost.get(pid).push({ nome: c.nome, texto: c.texto, criadoEm: c.criado_em });
    }

    const postsOut = posts.map((p) => ({
      id: p.id,
      rodada: p.rodada,
      titulo: p.titulo,
      texto: p.texto,
      criadoEm: p.criado_em,
      comentarios: comentariosByPost.get(String(p.id)) || [],
    }));

    return {
      config,
      associados,
      jogadores,
      gastos,
      entradas,
      times,
      campeonato: {
        jogos: jogos.map((j) => ({
          id: j.id,
          rodada: j.rodada,
          data: j.data,
          hora: j.hora,
          casa: j.casa,
          placar: j.placar,
          fora: j.fora,
          local: j.local,
        })),
        videos: videos.map((v) => ({ id: v.id, url: v.url })),
        imagens: imagens.map((i) => ({ id: i.id, url: i.url, legenda: i.legenda })),
        posts: postsOut,
      },
    };
  } finally {
    client.release();
  }
}

async function replaceAllData(data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const config = data?.config && typeof data.config === 'object' ? data.config : {};

    await client.query('DELETE FROM associados_pagamentos');
    // Em instalações antigas, a FK users.associado_id pode não ter ON DELETE CASCADE.
    // Deletar users primeiro evita violação de FK ao limpar associados.
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM associados');
    await client.query('DELETE FROM jogadores');
    await client.query('DELETE FROM gastos');
    await client.query('DELETE FROM entradas');
    await client.query('DELETE FROM times');
    await client.query('DELETE FROM campeonato_jogos');
    await client.query('DELETE FROM campeonato_videos');
    await client.query('DELETE FROM campeonato_imagens');
    await client.query('DELETE FROM campeonato_comentarios');
    await client.query('DELETE FROM campeonato_posts');

    await client.query(
      "INSERT INTO app_config (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
      [config]
    );

    // Associados + pagamentos
    const associados = Array.isArray(data?.associados) ? data.associados : [];
    for (const a of associados) {
      const nome = String(a?.nome ?? '').trim() || '—';
      const apelido = String(a?.apelido ?? '').trim();
      const email = normalizeAssociadoEmail(a?.email);
      const telefone = normalizeOptionalText(a?.telefone);
      const fotoUrl = normalizeOptionalText(a?.foto_url ?? a?.fotoUrl);
      const ins = await client.query(
        'INSERT INTO associados (nome, apelido, email, telefone, foto_url) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [nome, apelido, email, telefone, fotoUrl]
      );
      const id = ins.rows[0].id;
      let pagamentos = a?.pagamentos && typeof a.pagamentos === 'object' ? a.pagamentos : {};
      if (a?.pagamentosByYear && typeof a.pagamentosByYear === 'object') {
        const years = Object.keys(a.pagamentosByYear);
        const currentYear = String(new Date().getFullYear());
        const preferredYear = years.includes(currentYear)
          ? currentYear
          : years.sort().slice(-1)[0];
        const bucket = preferredYear ? a.pagamentosByYear?.[preferredYear] : null;
        if (bucket && typeof bucket === 'object') pagamentos = bucket;
      }
      for (const mk of MONTH_KEYS) {
        const norm = normalizePagamentoCell(pagamentos[mk]);
        const safeValor = parseMoney(norm.valor);
        await client.query(
          'INSERT INTO associados_pagamentos (associado_id, mes_key, raw, valor) VALUES ($1,$2,$3,$4)',
          [id, mk, norm.raw, safeValor]
        );
      }

      const ensuredEmail = email || buildAssociadoFallbackEmail(a, id);
      const passwordHash = await bcrypt.hash(getAssociadoDefaultPassword(a), 10);
      await upsertAssociadoUser(client, { associadoId: id, email: ensuredEmail, passwordHash });

      if (!email) {
        await client.query('UPDATE associados SET email = $1 WHERE id = $2', [ensuredEmail, id]);
      }
    }

    // Jogadores
    const jogadores = Array.isArray(data?.jogadores) ? data.jogadores : [];
    for (const j of jogadores) {
      const email = normalizeJogadorEmail(j?.email);
      const ins = await client.query(
        'INSERT INTO jogadores (nome, email, time, gols, amarelos, vermelhos, suspensoes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [
          String(j?.nome ?? '').trim() || '—',
          email,
          String(j?.time ?? '').trim(),
          Number(j?.gols) || 0,
          Number(j?.amarelos) || 0,
          Number(j?.vermelhos) || 0,
          Number(j?.suspensoes) || 0,
        ]
      );

      const jogadorId = ins.rows[0].id;
      const fallbackEmail = buildJogadorFallbackEmail(j, jogadorId);
      const passwordHash = await bcrypt.hash(getJogadorDefaultPassword(j), 10);
      const ensuredEmail = await upsertJogadorUser(client, {
        jogadorId,
        email: email || fallbackEmail,
        fallbackEmail,
        passwordHash,
      });

      if (!email) {
        await client.query('UPDATE jogadores SET email = $1 WHERE id = $2', [ensuredEmail, jogadorId]);
      }
    }

    // Gastos
    const gastos = Array.isArray(data?.gastos) ? data.gastos : [];
    for (const g of gastos) {
      await client.query(
        'INSERT INTO gastos (mes, data, descricao, valor) VALUES ($1,$2,$3,$4)',
        [String(g?.mes ?? '—'), String(g?.data ?? ''), String(g?.descricao ?? ''), parseMoney(g?.valor)]
      );
    }

    // Entradas
    const entradas = Array.isArray(data?.entradas) ? data.entradas : [];
    for (const e of entradas) {
      await client.query(
        'INSERT INTO entradas (mes, data, origem, valor) VALUES ($1,$2,$3,$4)',
        [String(e?.mes ?? '—'), String(e?.data ?? ''), String(e?.origem ?? ''), parseMoney(e?.valor)]
      );
    }

    // Times
    const times = Array.isArray(data?.times) ? data.times : [];
    for (const t of times) {
      await client.query(
        'INSERT INTO times (time, pg, j, v, e, der, gf, gs, sg, ca, cv) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        [
          String(t?.time ?? '—'),
          Number(t?.pg) || 0,
          Number(t?.j) || 0,
          Number(t?.v) || 0,
          Number(t?.e) || 0,
          Number(t?.der) || 0,
          Number(t?.gf) || 0,
          Number(t?.gs) || 0,
          Number(t?.sg) || 0,
          Number(t?.ca) || 0,
          Number(t?.cv) || 0,
        ]
      );
    }

    // Campeonato
    const camp = data?.campeonato ?? {};

    const jogos = Array.isArray(camp?.jogos) ? camp.jogos : [];
    for (const j of jogos) {
      await client.query(
        'INSERT INTO campeonato_jogos (rodada, data, hora, casa, placar, fora, local) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          String(j?.rodada ?? '—'),
          String(j?.data ?? ''),
          String(j?.hora ?? ''),
          String(j?.casa ?? ''),
          String(j?.placar ?? ''),
          String(j?.fora ?? ''),
          String(j?.local ?? ''),
        ]
      );
    }

    const videos = Array.isArray(camp?.videos) ? camp.videos : [];
    for (const v of videos) {
      const url = String(v?.url ?? '').trim();
      if (!url) continue;
      await client.query('INSERT INTO campeonato_videos (url) VALUES ($1)', [url]);
    }

    const imagens = Array.isArray(camp?.imagens) ? camp.imagens : [];
    for (const i of imagens) {
      const url = String(i?.url ?? '').trim();
      if (!url) continue;
      await client.query('INSERT INTO campeonato_imagens (url, legenda) VALUES ($1,$2)', [url, String(i?.legenda ?? '')]);
    }

    const posts = Array.isArray(camp?.posts) ? camp.posts : [];
    for (const p of posts) {
      const id = String(p?.id ?? '').trim() || `post-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      await client.query(
        'INSERT INTO campeonato_posts (id, rodada, titulo, texto, criado_em) VALUES ($1,$2,$3,$4,COALESCE($5::timestamptz, NOW()))',
        [id, String(p?.rodada ?? '—'), String(p?.titulo ?? ''), String(p?.texto ?? ''), p?.criadoEm || null]
      );

      const comentarios = Array.isArray(p?.comentarios) ? p.comentarios : [];
      for (const c of comentarios) {
        const texto = String(c?.texto ?? '').trim();
        if (!texto) continue;
        await client.query(
          'INSERT INTO campeonato_comentarios (post_id, nome, texto, criado_em) VALUES ($1,$2,$3,COALESCE($4::timestamptz, NOW()))',
          [id, String(c?.nome ?? 'Visitante'), texto, c?.criadoEm || null]
        );
      }
    }

    await ensureAdminUser({ client });

    await client.query('COMMIT');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }
}

const router = express.Router();

function sendDbAware(res, err, fallbackStatus, payload) {
  if (err && err.code === 'DB_DISABLED') {
    return res.status(503).json({ error: 'db_unavailable' });
  }
  return res.status(fallbackStatus).json(payload);
}

function parseDateTimeForSort(data, hora) {
  const d = String(data || '').trim();
  const h = String(hora || '').trim();
  const hm = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(h) ? h : '00:00';

  let m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return Date.parse(`${m[1]}-${m[2]}-${m[3]}T${hm}:00`);

  m = d.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/);
  if (m) {
    const year = m[3] || String(new Date().getFullYear());
    return Date.parse(`${year}-${m[2]}-${m[1]}T${hm}:00`);
  }

  return Number.NaN;
}

// ===== Rotas autenticadas para o painel do associado (compat com inicio.html) =====
router.get('/data/jogadores', requireAuth, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.jogadores);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/data/times', requireAuth, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.times);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/data/campeonato-jogos', requireAuth, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.campeonato?.jogos || []);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/data/jogador/me', requireAuth, async (req, res) => {
  const role = String(req.user?.role || '');
  const tokenJogadorId = Number(req.user?.jogadorId || req.user?.jogador_id || 0);
  const queryJogadorId = Number(req.query?.jogadorId || 0);

  if (role !== 'jogador' && role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }

  try {
    let jogadorId = role === 'admin' && queryJogadorId > 0 ? queryJogadorId : tokenJogadorId;
    if ((!Number.isFinite(jogadorId) || jogadorId <= 0) && role === 'admin') {
      const firstJogador = await pool.query('SELECT id FROM jogadores ORDER BY id ASC LIMIT 1');
      jogadorId = Number(firstJogador.rows?.[0]?.id || 0);
    }
    if (!Number.isFinite(jogadorId) || jogadorId <= 0) {
      return res.status(404).json({ error: 'jogador_not_found' });
    }

    const jogadorRes = await pool.query(
      'SELECT id, nome, email, time, gols, amarelos, vermelhos, suspensoes FROM jogadores WHERE id = $1 LIMIT 1',
      [jogadorId]
    );
    if (jogadorRes.rowCount === 0) {
      return res.status(404).json({ error: 'jogador_not_found' });
    }

    const jogador = jogadorRes.rows[0];
    const time = String(jogador.time || '').trim();

    const classRes = time
      ? await pool.query('SELECT * FROM times WHERE LOWER(TRIM(time)) = LOWER(TRIM($1)) LIMIT 1', [time])
      : { rows: [] };

    const jogosRes = time
      ? await pool.query(
        `SELECT id, rodada, data, hora, casa, placar, fora, local
         FROM campeonato_jogos
         WHERE LOWER(TRIM(casa)) = LOWER(TRIM($1))
            OR LOWER(TRIM(fora)) = LOWER(TRIM($1))`,
        [time]
      )
      : { rows: [] };

    const jogosOrdenados = jogosRes.rows
      .slice()
      .sort((a, b) => parseDateTimeForSort(b.data, b.hora) - parseDateTimeForSort(a.data, a.hora));

    const now = Date.now();
    const ultimosJogos = jogosOrdenados
      .filter((j) => {
        const ts = parseDateTimeForSort(j.data, j.hora);
        return Number.isFinite(ts) && ts <= now;
      })
      .slice(0, 10);

    const proximosJogos = jogosOrdenados
      .filter((j) => {
        const ts = parseDateTimeForSort(j.data, j.hora);
        return Number.isFinite(ts) && ts > now;
      })
      .reverse()
      .slice(0, 10);

    return res.json({
      jogador,
      classificacaoTime: classRes.rows?.[0] || null,
      historico: {
        jogosDoTime: jogosOrdenados,
        ultimosJogos,
        proximosJogos,
      },
    });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/data/associados/:id/pagamentos', requireAuth, async (req, res) => {
  const associadoId = Number(req.params.id);
  if (!Number.isFinite(associadoId) || associadoId <= 0) return res.status(400).json({ error: 'invalid_id' });

  const role = String(req.user?.role || '');
  const tokenAssociadoId = Number(req.user?.associadoId || req.user?.associado_id || 0);

  // Associado só pode ver os próprios pagamentos
  if (role !== 'admin' && (role !== 'associado' || tokenAssociadoId !== associadoId)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const rows = (await pool.query(
      'SELECT associado_id, mes_key, raw, valor FROM associados_pagamentos WHERE associado_id=$1 ORDER BY mes_key ASC',
      [associadoId]
    )).rows;
    res.json(rows);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/data', requireAdmin, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/associados', requireAdmin, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.associados);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/jogadores', requireAuth, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.jogadores);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/gastos', requireAdmin, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.gastos);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/entradas', requireAdmin, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.entradas);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/times', requireAuth, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.times);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/campeonato', requireAuth, async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.campeonato);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.put('/data', requireAdmin, async (req, res) => {
  try {
    await replaceAllData(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_save' });
  }
});

router.put('/associados', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, associados: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_save' });
  }
});

router.put('/jogadores', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, jogadores: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_save' });
  }
});

router.put('/gastos', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, gastos: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_save' });
  }
});

router.put('/entradas', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, entradas: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_save' });
  }
});

router.put('/times', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, times: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_save' });
  }
});

router.put('/campeonato', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, campeonato: req.body && typeof req.body === 'object' ? req.body : {} });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_save' });
  }
});

// CRUD por módulo (admin) — útil para integrações futuras
router.post('/associados', requireAdmin, async (req, res) => {
  const nome = String(req.body?.nome ?? '').trim() || '—';
  const apelido = String(req.body?.apelido ?? '').trim();
  const email = normalizeAssociadoEmail(req.body?.email);
  const senha = String(req.body?.senha ?? '').trim();
  const pagamentos = req.body?.pagamentos && typeof req.body.pagamentos === 'object' ? req.body.pagamentos : {};

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ins = await client.query('INSERT INTO associados (nome, apelido, email) VALUES ($1,$2,$3) RETURNING id', [nome, apelido, email]);
    const id = ins.rows[0].id;
    for (const mk of MONTH_KEYS) {
      const norm = normalizePagamentoCell(pagamentos[mk]);
      await client.query(
        'INSERT INTO associados_pagamentos (associado_id, mes_key, raw, valor) VALUES ($1,$2,$3,$4)',
        [id, mk, norm.raw, norm.valor]
      );
    }

    const ensuredEmail = email || buildAssociadoFallbackEmail({ nome, apelido }, id);
    const passwordHash = await bcrypt.hash(senha || getAssociadoDefaultPassword(req.body || {}), 10);
    await upsertAssociadoUser(client, { associadoId: id, email: ensuredEmail, passwordHash });

    if (!email) {
      await client.query('UPDATE associados SET email = $1 WHERE id = $2', [ensuredEmail, id]);
    }

    await client.query('COMMIT');
    res.json({ ok: true, id, email: ensuredEmail });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  } finally {
    client.release();
  }
});

router.delete('/associados/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM associados WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/jogadores', requireAdmin, async (req, res) => {
  try {
    const ins = await pool.query(
      'INSERT INTO jogadores (nome, time, gols, amarelos, vermelhos, suspensoes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [
        String(req.body?.nome ?? '').trim() || '—',
        String(req.body?.time ?? '').trim(),
        Number(req.body?.gols) || 0,
        Number(req.body?.amarelos) || 0,
        Number(req.body?.vermelhos) || 0,
        Number(req.body?.suspensoes) || 0,
      ]
    );
    res.json({ ok: true, id: ins.rows[0].id });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  }
});

router.delete('/jogadores/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM jogadores WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/gastos', requireAdmin, async (req, res) => {
  try {
    const ins = await pool.query(
      'INSERT INTO gastos (mes, data, descricao, valor) VALUES ($1,$2,$3,$4) RETURNING id',
      [
        String(req.body?.mes ?? '—'),
        String(req.body?.data ?? ''),
        String(req.body?.descricao ?? ''),
        parseMoney(req.body?.valor),
      ]
    );
    res.json({ ok: true, id: ins.rows[0].id });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  }
});

router.delete('/gastos/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM gastos WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/entradas', requireAdmin, async (req, res) => {
  try {
    const ins = await pool.query(
      'INSERT INTO entradas (mes, data, origem, valor) VALUES ($1,$2,$3,$4) RETURNING id',
      [
        String(req.body?.mes ?? '—'),
        String(req.body?.data ?? ''),
        String(req.body?.origem ?? ''),
        parseMoney(req.body?.valor),
      ]
    );
    res.json({ ok: true, id: ins.rows[0].id });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  }
});

router.delete('/entradas/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM entradas WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/times', requireAdmin, async (req, res) => {
  try {
    const ins = await pool.query(
      'INSERT INTO times (time, pg, j, v, e, der, gf, gs, sg, ca, cv) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
      [
        String(req.body?.time ?? '—'),
        Number(req.body?.pg) || 0,
        Number(req.body?.j) || 0,
        Number(req.body?.v) || 0,
        Number(req.body?.e) || 0,
        Number(req.body?.der) || 0,
        Number(req.body?.gf) || 0,
        Number(req.body?.gs) || 0,
        Number(req.body?.sg) || 0,
        Number(req.body?.ca) || 0,
        Number(req.body?.cv) || 0,
      ]
    );
    res.json({ ok: true, id: ins.rows[0].id });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  }
});

router.delete('/times/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM times WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/campeonato/jogos', requireAdmin, async (req, res) => {
  try {
    const ins = await pool.query(
      'INSERT INTO campeonato_jogos (rodada, data, hora, casa, placar, fora, local) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [
        String(req.body?.rodada ?? '—'),
        String(req.body?.data ?? ''),
        String(req.body?.hora ?? ''),
        String(req.body?.casa ?? ''),
        String(req.body?.placar ?? ''),
        String(req.body?.fora ?? ''),
        String(req.body?.local ?? ''),
      ]
    );
    res.json({ ok: true, id: ins.rows[0].id });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  }
});

router.delete('/campeonato/jogos/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM campeonato_jogos WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/campeonato/videos', requireAdmin, async (req, res) => {
  const url = String(req.body?.url ?? '').trim();
  if (!url) return res.status(400).json({ error: 'invalid_url' });
  try {
    const ins = await pool.query('INSERT INTO campeonato_videos (url) VALUES ($1) RETURNING id', [url]);
    res.json({ ok: true, id: ins.rows[0].id });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  }
});

router.delete('/campeonato/videos/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM campeonato_videos WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/campeonato/imagens', requireAdmin, async (req, res) => {
  const url = String(req.body?.url ?? '').trim();
  const legenda = String(req.body?.legenda ?? '').trim();
  if (!url) return res.status(400).json({ error: 'invalid_url' });
  try {
    const ins = await pool.query('INSERT INTO campeonato_imagens (url, legenda) VALUES ($1,$2) RETURNING id', [url, legenda]);
    res.json({ ok: true, id: ins.rows[0].id });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  }
});

router.delete('/campeonato/imagens/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM campeonato_imagens WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/campeonato/posts', requireAdmin, async (req, res) => {
  const id = String(req.body?.id ?? '').trim() || `post-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const rodada = String(req.body?.rodada ?? '—');
  const titulo = String(req.body?.titulo ?? '').trim();
  const texto = String(req.body?.texto ?? '').trim();
  if (!titulo || !texto) return res.status(400).json({ error: 'invalid_post' });

  try {
    await pool.query(
      'INSERT INTO campeonato_posts (id, rodada, titulo, texto, criado_em) VALUES ($1,$2,$3,$4,NOW())',
      [id, rodada, titulo, texto]
    );
    res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_create' });
  }
});

router.delete('/campeonato/posts/:id', requireAdmin, async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'invalid_id' });
  try {
    await pool.query('DELETE FROM campeonato_posts WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_delete' });
  }
});

router.post('/campeonato/posts/:id/comentarios', async (req, res) => {
  const postId = String(req.params.id || '').trim();
  const nome = String(req.body?.nome ?? 'Visitante').trim() || 'Visitante';
  const texto = String(req.body?.texto ?? '').trim();
  if (!postId) return res.status(400).json({ error: 'invalid_post' });
  if (!texto) return res.status(400).json({ error: 'empty_comment' });

  try {
    await pool.query(
      'INSERT INTO campeonato_comentarios (post_id, nome, texto) VALUES ($1,$2,$3)',
      [postId, nome, texto]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_comment' });
  }
});

// Endpoints adicionais para dashboard do associado
router.get('/associados/:id/pagamentos', requireAuth, async (req, res) => {
  const associadoId = Number(req.params.id);
  if (!associadoId || isNaN(associadoId)) {
    return res.status(400).json({ error: 'invalid_associado_id' });
  }

  const role = String(req.user?.role || '');
  const tokenAssociadoId = Number(req.user?.associadoId || req.user?.associado_id || 0);
  if (role !== 'admin' && (role !== 'associado' || tokenAssociadoId !== associadoId)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const result = await pool.query(
      'SELECT mes_key, raw, valor FROM associados_pagamentos WHERE associado_id = $1',
      [associadoId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

router.get('/campeonato-jogos', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM campeonato_jogos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    sendDbAware(res, err, 500, { error: 'failed_to_load' });
  }
});

module.exports = { dataRouter: router, fetchData, replaceAllData };
