const express = require('express');
const bcrypt = require('bcrypt');
const { pool, dbEnabled } = require('../db');
const {
  getBearerToken,
  getConfiguredAdminEmail,
  getConfiguredAdminPassword,
  signAuthToken,
  verifyAuthToken,
} = require('../auth-utils');

const router = express.Router();

// Login (suporta admin legado OU usuários do banco)
router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const adminEmail = getConfiguredAdminEmail();
  const adminPassword = getConfiguredAdminPassword();
  const isConfiguredAdminEmail = Boolean(email) && email === adminEmail;

  if (!process.env.ADMIN_JWT_SECRET) {
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  // Login admin configurado por ambiente.
  // Se a senha não bater aqui, ainda tentamos o usuário do banco para evitar lockout
  // quando env e tabela users estiverem temporariamente desalinhados.
  if (isConfiguredAdminEmail) {
    if (!adminPassword) {
      return res.status(500).json({ error: 'server_misconfigured' });
    }

    if (password === adminPassword) {
      const token = signAuthToken({ userId: 0, role: 'admin', email: adminEmail });
      return res.json({
        token,
        user: { id: 0, email: adminEmail, role: 'admin', nome: 'Administrador' }
      });
    }
  }

  // Login de usuário do banco
  if (!dbEnabled || !email || !password) {
    return res.status(400).json({ error: 'missing_credentials' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.associado_id, u.jogador_id,
              a.nome AS associado_nome, a.apelido AS associado_apelido,
              j.nome AS jogador_nome, j.time AS jogador_time
       FROM users u
       LEFT JOIN associados a ON u.associado_id = a.id
       LEFT JOIN jogadores j ON u.jogador_id = j.id
       WHERE u.email = $1 AND u.ativo = TRUE`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const displayName = user.role === 'jogador'
      ? (user.jogador_nome || user.email.split('@')[0])
      : (user.associado_nome || user.associado_apelido || user.email.split('@')[0]);

    const token = signAuthToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      associadoId: user.associado_id,
      jogadorId: user.jogador_id,
    });

    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        nome: displayName,
        associadoId: user.associado_id,
        jogadorId: user.jogador_id,
        time: user.jogador_time || null,
      } 
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Obter informações do usuário atual
router.get('/me', async (req, res) => {
  const token = getBearerToken(req);
  const adminEmail = getConfiguredAdminEmail();
  
  if (!token || !process.env.ADMIN_JWT_SECRET) {
    return res.json({ authenticated: false, user: null });
  }

  try {
    const payload = verifyAuthToken(token);
    
    // Admin via env
    if (payload.role === 'admin' && payload.userId === 0) {
      return res.json({ 
        authenticated: true, 
        user: { id: 0, email: String(payload.email || adminEmail), role: 'admin', nome: 'Administrador' } 
      });
    }

    // Usuário do banco
    if (dbEnabled) {
      const result = await pool.query(
        `SELECT u.id, u.email, u.role, u.associado_id, u.jogador_id,
                a.nome AS associado_nome, a.apelido AS associado_apelido,
                j.nome AS jogador_nome, j.time AS jogador_time
         FROM users u
         LEFT JOIN associados a ON u.associado_id = a.id
         LEFT JOIN jogadores j ON u.jogador_id = j.id
         WHERE u.id = $1 AND u.ativo = TRUE`,
        [payload.userId]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const displayName = user.role === 'jogador'
          ? (user.jogador_nome || user.email.split('@')[0])
          : (user.associado_nome || user.associado_apelido || user.email.split('@')[0]);

        return res.json({ 
          authenticated: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            nome: displayName,
            associadoId: user.associado_id,
            jogadorId: user.jogador_id,
            time: user.jogador_time || null,
          } 
        });
      }
    }

    return res.json({ authenticated: false, user: null });
  } catch {
    return res.json({ authenticated: false, user: null });
  }
});

module.exports = { authRouter: router };
