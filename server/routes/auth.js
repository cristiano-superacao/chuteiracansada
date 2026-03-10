const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool, dbEnabled } = require('../db');

const router = express.Router();

// Login (suporta admin legado OU usuários do banco)
router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  // Login admin legado (mantém compatibilidade)
  if (email === 'admin@admin' && process.env.ADMIN_PASSWORD) {
    if (password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ userId: 0, role: 'admin', email: 'admin@admin' }, secret, { expiresIn: '8h' });
      return res.json({ 
        token, 
        user: { id: 0, email: 'admin@admin', role: 'admin', nome: 'Administrador' } 
      });
    }
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  // Login de usuário do banco
  if (!dbEnabled || !email || !password) {
    return res.status(400).json({ error: 'missing_credentials' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.associado_id, a.nome, a.apelido
       FROM users u
       LEFT JOIN associados a ON u.associado_id = a.id
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

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email, associadoId: user.associado_id }, 
      secret, 
      { expiresIn: '8h' }
    );

    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        nome: user.nome || user.apelido || user.email.split('@')[0],
        associadoId: user.associado_id 
      } 
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Obter informações do usuário atual
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  const secret = process.env.ADMIN_JWT_SECRET;
  
  if (!token || !secret) {
    return res.json({ authenticated: false, user: null });
  }

  try {
    const payload = jwt.verify(token, secret);
    
    // Admin legado
    if (payload.role === 'admin' && payload.userId === 0) {
      return res.json({ 
        authenticated: true, 
        user: { id: 0, email: 'admin@admin', role: 'admin', nome: 'Administrador' } 
      });
    }

    // Usuário do banco
    if (dbEnabled) {
      const result = await pool.query(
        `SELECT u.id, u.email, u.role, u.associado_id, a.nome, a.apelido
         FROM users u
         LEFT JOIN associados a ON u.associado_id = a.id
         WHERE u.id = $1 AND u.ativo = TRUE`,
        [payload.userId]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        return res.json({ 
          authenticated: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            nome: user.nome || user.apelido || user.email.split('@')[0],
            associadoId: user.associado_id 
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
