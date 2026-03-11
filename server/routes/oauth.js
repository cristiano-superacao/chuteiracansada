const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool, dbEnabled } = require('../db');
const { signAuthToken } = require('../auth-utils');

const router = express.Router();

function requestWantsHtml(req) {
  const accept = String(req.headers.accept || '').toLowerCase();
  if (accept.includes('text/html')) return true;

  const secFetchDest = String(req.headers['sec-fetch-dest'] || '').toLowerCase();
  if (secFetchDest === 'document') return true;

  const secFetchMode = String(req.headers['sec-fetch-mode'] || '').toLowerCase();
  if (secFetchMode === 'navigate') return true;

  return false;
}

// Configuração do Passport Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/oauth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        
        if (!email) {
          return done(null, false, { message: 'Email não fornecido pelo Google' });
        }

        // Verifica se existe usuário com esse email
        const result = await pool.query(
          `SELECT u.id, u.email, u.role, u.associado_id, a.nome, a.apelido, a.foto_url
           FROM users u
           LEFT JOIN associados a ON u.associado_id = a.id
           WHERE u.email = $1 AND u.ativo = TRUE`,
          [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
          return done(null, false, { message: 'Usuário não encontrado. Entre em contato com o administrador.' });
        }

        const user = result.rows[0];
        
        // Atualiza foto do Google se não tiver foto
        if (user.associado_id && profile.photos?.[0]?.value) {
          const fotoUrl = profile.photos[0].value;
          await pool.query(
            'UPDATE associados SET foto_url = $1 WHERE id = $2 AND (foto_url IS NULL OR foto_url = \'\')',
            [fotoUrl, user.associado_id]
          );
          user.foto_url = fotoUrl;
        }

        return done(null, user);
      } catch (err) {
        console.error('Erro na autenticação Google:', err);
        return done(err, null);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query(
        `SELECT u.id, u.email, u.role, u.associado_id, a.nome, a.apelido, a.foto_url
         FROM users u
         LEFT JOIN associados a ON u.associado_id = a.id
         WHERE u.id = $1`,
        [id]
      );
      done(null, result.rows[0] || null);
    } catch (err) {
      done(err, null);
    }
  });
}

// Rota de autenticação Google
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    if (requestWantsHtml(req)) {
      return res.redirect(302, '/login.html?error=google_not_configured');
    }

    return res.status(503).json({
      error: 'google_not_configured',
      message: 'Autenticação com Google não configurada. Entre em contato com o administrador.'
    });
  }

  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// Callback do Google OAuth
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login.html?error=google_auth_failed',
    session: false 
  }),
  (req, res) => {
    if (!process.env.ADMIN_JWT_SECRET || !req.user) {
      return res.redirect('/login.html?error=server_error');
    }

    // Gera JWT
    const token = signAuthToken(
      { 
        userId: req.user.id, 
        role: req.user.role, 
        email: req.user.email,
        associadoId: req.user.associado_id || null
      }
    );

    // Prepara dados do usuário
    const userData = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      nome: req.user.nome || req.user.apelido || req.user.email,
      apelido: req.user.apelido,
      associadoId: req.user.associado_id,
      fotoUrl: req.user.foto_url
    };

    // Redireciona com token e dados do usuário via URL (será capturado pelo frontend)
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`/login.html?success=true&token=${token}&user=${userDataEncoded}`);
  }
);

module.exports = router;
