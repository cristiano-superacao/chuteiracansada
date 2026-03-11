/**
 * Script para criar usuários no sistema
 * 
 * Execute: node server/create-user.js
 */

const bcrypt = require('bcrypt');
const { pool } = require('./db');

/**
 * Cria um novo usuário associado
 * @param {string} nome - Nome completo do associado
 * @param {string} apelido - Apelido (opcional)
 * @param {string} email - Email único
 * @param {string} password - Senha (será criptografada)
 * @param {string} telefone - Telefone (opcional)
 */
async function createAssociadoUser(nome, apelido, email, password, telefone = null) {
  try {
    console.log(`\n🔧 Criando usuário: ${nome} (${email})`);

    // 1. Verificar se email já existe
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('❌ Erro: Email já cadastrado!');
      return;
    }

    // 2. Criptografar senha
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Criar associado
    const assocResult = await pool.query(
      'INSERT INTO associados (nome, apelido, email, telefone, ativo) VALUES ($1, $2, $3, $4, TRUE) RETURNING id',
      [nome, apelido || '', email, telefone]
    );
    const associadoId = assocResult.rows[0].id;
    console.log(`✅ Associado criado com ID: ${associadoId}`);

    // 4. Criar usuário
    await pool.query(
      'INSERT INTO users (email, password_hash, role, associado_id, ativo) VALUES ($1, $2, $3, $4, TRUE)',
      [email, passwordHash, 'associado', associadoId]
    );
    console.log(`✅ Usuário criado com sucesso!`);
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`👤 Role: associado`);

  } catch (err) {
    console.error('❌ Erro ao criar usuário:', err.message);
  } finally {
    await pool.end();
  }
}

/**
 * Cria um novo usuário admin
 * @param {string} email - Email único  
 * @param {string} password - Senha (será criptografada)
 */
async function createAdminUser(email, password) {
  try {
    console.log(`\n🔧 Criando usuário admin: ${email}`);

    // 1. Verificar se email já existe
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('❌ Erro: Email já cadastrado!');
      return;
    }

    // 2. Criptografar senha
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Criar usuário admin (sem associado_id)
    await pool.query(
      'INSERT INTO users (email, password_hash, role, associado_id, ativo) VALUES ($1, $2, $3, NULL, TRUE)',
      [email, passwordHash, 'admin']
    );
    console.log(`✅ Usuário admin criado com sucesso!`);
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`👤 Role: admin`);

  } catch (err) {
    console.error('❌ Erro ao criar usuário:', err.message);
  } finally {
    await pool.end();
  }
}

/**
 * Lista todos os usuários do sistema
 */
async function listUsers() {
  try {
    const result = await pool.query(`
            SELECT u.id, u.email, u.role, u.ativo,
              a.nome AS associado_nome,
              j.nome AS jogador_nome
      FROM users u
      LEFT JOIN associados a ON u.associado_id = a.id
            LEFT JOIN jogadores j ON u.jogador_id = j.id
      ORDER BY u.id ASC
    `);

    console.log('\n📋 Usuários cadastrados:\n');
    console.log('ID | Email                  | Role       | Nome              | Ativo');
    console.log('---|------------------------|------------|-------------------|------');
    
    result.rows.forEach(user => {
      const nome = user.associado_nome || user.jogador_nome || '—';
      const ativo = user.ativo ? '✅' : '❌';
      console.log(
        `${String(user.id).padEnd(2)} | ${user.email.padEnd(22)} | ${user.role.padEnd(10)} | ${nome.padEnd(17)} | ${ativo}`
      );
    });

    console.log(`\nTotal: ${result.rows.length} usuários\n`);

  } catch (err) {
    console.error('❌ Erro ao listar usuários:', err.message);
  } finally {
    await pool.end();
  }
}

// ==================== EXECUTAR FUNÇÕES ====================

// Exemplo 1: Criar usuário associado
// createAssociadoUser(
//   'Carlos Silva',           // nome
//   'Carlão',                 // apelido
//   'carlos@teste.com',       // email
//   '123456',                 // senha
//   '11999999999'            // telefone
// );

// Exemplo 2: Criar usuário admin adicional
// createAdminUser(
//   'admin2@sistema.com',     // email
//   'senha-super-segura'      // senha
// );

// Exemplo 3: Listar todos os usuários
listUsers();

// ==================== INSTRUÇÕES ====================
// 
// 1. Descomente UMA das funções acima
// 2. Preencha os parâmetros
// 3. Execute: node server/create-user.js
// 4. Após criar, comente a função e descomente listUsers() para verificar
//
