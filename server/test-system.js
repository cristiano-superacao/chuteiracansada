/**
 * Script de Teste Rápido - Verifica configuração do sistema
 * 
 * Execute: node server/test-system.js
 */

require('dotenv').config();
const { pool, dbEnabled } = require('./db');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

async function testDatabaseConnection() {
  log('\n🔌 Testando conexão com banco de dados...', 'blue');
  
  if (!dbEnabled) {
    log('   ❌ Banco de dados NÃO configurado', 'red');
    log('   ℹ️  DATABASE_URL não encontrado no .env', 'yellow');
    return false;
  }
  
  try {
    const result = await pool.query('SELECT NOW()');
    log('   ✅ Conexão bem-sucedida!', 'green');
    log(`   ⏰ Horário do banco: ${result.rows[0].now}`, 'cyan');
    return true;
  } catch (err) {
    log('   ❌ Erro ao conectar:', 'red');
    log(`   ${err.message}`, 'red');
    return false;
  }
}

async function testTables() {
  log('\n📋 Verificando tabelas...', 'blue');
  
  const tables = [
    'associados',
    'users',
    'associados_pagamentos',
    'jogadores',
    'times',
    'gastos',
    'entradas',
    'campeonato_jogos',
    'campeonato_videos',
    'campeonato_imagens',
    'campeonato_posts',
    'campeonato_comentarios'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) FROM ${table}`
      );
      const count = parseInt(result.rows[0].count);
      
      if (count > 0) {
        log(`   ✅ ${table.padEnd(30)} (${count} registros)`, 'green');
      } else {
        log(`   ⚠️  ${table.padEnd(30)} (vazia)`, 'yellow');
      }
    } catch (err) {
      log(`   ❌ ${table.padEnd(30)} (não existe)`, 'red');
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testEnvironmentVariables() {
  log('\n🔐 Verificando variáveis de ambiente...', 'blue');
  
  const required = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'ADMIN_PASSWORD': process.env.ADMIN_PASSWORD,
    'ADMIN_JWT_SECRET': process.env.ADMIN_JWT_SECRET,
    'SESSION_SECRET': process.env.SESSION_SECRET
  };
  
  const optional = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'GOOGLE_CALLBACK_URL': process.env.GOOGLE_CALLBACK_URL,
    'PORT': process.env.PORT,
    'NODE_ENV': process.env.NODE_ENV
  };
  
  let allRequired = true;
  
  log('   Obrigatórias:', 'cyan');
  for (const [key, value] of Object.entries(required)) {
    if (value) {
      const display = key === 'ADMIN_PASSWORD' || key.includes('SECRET') 
        ? '***' + value.slice(-4) 
        : value.substring(0, 30) + (value.length > 30 ? '...' : '');
      log(`   ✅ ${key.padEnd(25)} = ${display}`, 'green');
    } else {
      log(`   ❌ ${key.padEnd(25)} = (não definida)`, 'red');
      allRequired = false;
    }
  }
  
  log('\n   Opcionais:', 'cyan');
  for (const [key, value] of Object.entries(optional)) {
    if (value) {
      const display = value.substring(0, 30) + (value.length > 30 ? '...' : '');
      log(`   ✅ ${key.padEnd(25)} = ${display}`, 'green');
    } else {
      log(`   ⚠️  ${key.padEnd(25)} = (não definida)`, 'yellow');
    }
  }
  
  return allRequired;
}

async function testUsers() {
  log('\n👥 Verificando usuários do sistema...', 'blue');
  
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.role, u.ativo, a.nome
      FROM users u
      LEFT JOIN associados a ON u.associado_id = a.id
      ORDER BY u.role, u.id
      LIMIT 20
    `);
    
    if (result.rows.length === 0) {
      log('   ⚠️  Nenhum usuário encontrado no banco', 'yellow');
      log('   💡 Execute: node server/seed-database.js', 'cyan');
      return false;
    }
    
    const admins = result.rows.filter(u => u.role === 'admin');
    const associados = result.rows.filter(u => u.role === 'associado');
    
    log(`   👮 Admins: ${admins.length}`, 'cyan');
    admins.forEach(u => {
      log(`      ${u.ativo ? '✅' : '❌'} ${u.email} (ID: ${u.id})`, 'green');
    });
    
    log(`\n   👤 Associados: ${associados.length}`, 'cyan');
    associados.slice(0, 5).forEach(u => {
      log(`      ${u.ativo ? '✅' : '❌'} ${u.email} - ${u.nome}`, 'green');
    });
    
    if (associados.length > 5) {
      log(`      ... e mais ${associados.length - 5} associados`, 'cyan');
    }
    
    return true;
  } catch (err) {
    log('   ❌ Erro ao buscar usuários:', 'red');
    log(`   ${err.message}`, 'red');
    return false;
  }
}

async function showSummary(hasDb, hasEnv, hasTables, hasUsers) {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESUMO DO DIAGNÓSTICO', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\n${hasDb ? '✅' : '❌'} Conexão com banco de dados`, hasDb ? 'green' : 'red');
  log(`${hasEnv ? '✅' : '❌'} Variáveis de ambiente configuradas`, hasEnv ? 'green' : 'red');
  log(`${hasTables ? '✅' : '❌'} Tabelas do banco criadas`, hasTables ? 'green' : 'red');
  log(`${hasUsers ? '✅' : '❌'} Usuários cadastrados`, hasUsers ? 'green' : 'red');
  
  log('\n' + '='.repeat(60), 'cyan');
  
  if (hasDb && hasEnv && hasTables && hasUsers) {
    log('✅ SISTEMA PRONTO PARA USO!', 'green');
    log('\n🚀 Próximos passos:', 'blue');
    log('   1. Inicie o servidor: npm start', 'cyan');
    log('   2. Acesse: http://localhost:3000/login.html', 'cyan');
    log('   3. Login admin: admin@admin / (valor de ADMIN_PASSWORD)', 'cyan');
    log('   4. Ou login associado: carlos.silva@gmail.com / 123456', 'cyan');
  } else {
    log('⚠️  SISTEMA PRECISA DE CONFIGURAÇÃO', 'yellow');
    log('\n🔧 Ações necessárias:', 'blue');
    
    if (!hasDb || !hasEnv) {
      log('   1. Configure o banco de dados PostgreSQL', 'cyan');
      log('   2. Atualize o arquivo .env com DATABASE_URL', 'cyan');
      log('   3. Consulte: TESTAR_LOCALMENTE.md para instruções', 'cyan');
    }
    
    if (!hasTables) {
      log('   4. Execute migrações: npm start (automático)', 'cyan');
    }
    
    if (!hasUsers) {
      log('   5. Popule o banco: node server/seed-database.js', 'cyan');
    }
  }
  
  log('\n📖 Documentação:', 'blue');
  log('   • TESTAR_LOCALMENTE.md - Configuração passo a passo', 'cyan');
  log('   • AUTH_README.md - Sistema de autenticação', 'cyan');
  log('   • GOOGLE_OAUTH.md - Login com Google', 'cyan');
  log('');
}

async function main() {
  log('🔍 DIAGNÓSTICO DO SISTEMA - CHUTEIRA CANSADA', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const hasEnv = await testEnvironmentVariables();
  const hasDb = await testDatabaseConnection();
  
  let hasTables = false;
  let hasUsers = false;
  
  if (hasDb) {
    hasTables = await testTables();
    hasUsers = await testUsers();
  }
  
  await showSummary(hasDb, hasEnv, hasTables, hasUsers);
  
  if (dbEnabled) {
    await pool.end();
  }
}

main().catch(err => {
  log('\n❌ Erro inesperado:', 'red');
  console.error(err);
  process.exit(1);
});
