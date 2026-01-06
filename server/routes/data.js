const express = require('express');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');

const MONTH_KEYS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function parseMoney(raw) {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const cleaned = s
    .replace(/R\$\s?/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizePagamentoCell(raw) {
  if (raw == null) return { raw: 'Pendente', valor: 0 };
  if (typeof raw === 'number') {
    return raw > 0 ? { raw: `R$ ${raw.toFixed(2)}`.replace('.', ','), valor: raw } : { raw: 'Pendente', valor: 0 };
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

async function fetchData() {
  const client = await pool.connect();
  try {
    const associadosRes = await client.query('SELECT id, nome, apelido FROM associados ORDER BY id ASC');
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
      return { id: a.id, nome: a.nome, apelido: a.apelido, pagamentos };
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

    await client.query('DELETE FROM associados_pagamentos');
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

    // Associados + pagamentos
    const associados = Array.isArray(data?.associados) ? data.associados : [];
    for (const a of associados) {
      const nome = String(a?.nome ?? '').trim() || '—';
      const apelido = String(a?.apelido ?? '').trim();
      const ins = await client.query('INSERT INTO associados (nome, apelido) VALUES ($1,$2) RETURNING id', [nome, apelido]);
      const id = ins.rows[0].id;
      const pagamentos = a?.pagamentos && typeof a.pagamentos === 'object' ? a.pagamentos : {};
      for (const mk of MONTH_KEYS) {
        const norm = normalizePagamentoCell(pagamentos[mk]);
        await client.query(
          'INSERT INTO associados_pagamentos (associado_id, mes_key, raw, valor) VALUES ($1,$2,$3,$4)',
          [id, mk, norm.raw, norm.valor]
        );
      }
    }

    // Jogadores
    const jogadores = Array.isArray(data?.jogadores) ? data.jogadores : [];
    for (const j of jogadores) {
      await client.query(
        'INSERT INTO jogadores (nome, time, gols, amarelos, vermelhos, suspensoes) VALUES ($1,$2,$3,$4,$5,$6)',
        [
          String(j?.nome ?? '').trim() || '—',
          String(j?.time ?? '').trim(),
          Number(j?.gols) || 0,
          Number(j?.amarelos) || 0,
          Number(j?.vermelhos) || 0,
          Number(j?.suspensoes) || 0,
        ]
      );
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

router.get('/data', async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_load' });
  }
});

router.get('/associados', async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.associados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_load' });
  }
});

router.get('/jogadores', async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.jogadores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_load' });
  }
});

router.get('/gastos', async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.gastos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_load' });
  }
});

router.get('/entradas', async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.entradas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_load' });
  }
});

router.get('/times', async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.times);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_load' });
  }
});

router.get('/campeonato', async (_req, res) => {
  try {
    const data = await fetchData();
    res.json(data.campeonato);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_load' });
  }
});

router.put('/data', requireAdmin, async (req, res) => {
  try {
    await replaceAllData(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_save' });
  }
});

router.put('/associados', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, associados: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_save' });
  }
});

router.put('/jogadores', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, jogadores: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_save' });
  }
});

router.put('/gastos', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, gastos: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_save' });
  }
});

router.put('/entradas', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, entradas: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_save' });
  }
});

router.put('/times', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, times: Array.isArray(req.body) ? req.body : [] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_save' });
  }
});

router.put('/campeonato', requireAdmin, async (req, res) => {
  try {
    const current = await fetchData();
    await replaceAllData({ ...current, campeonato: req.body && typeof req.body === 'object' ? req.body : {} });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_save' });
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
    res.status(500).json({ error: 'failed_to_comment' });
  }
});

module.exports = { dataRouter: router, fetchData, replaceAllData };
