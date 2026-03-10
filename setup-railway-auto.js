/**
 * Script de Configuração Automática do Railway
 * 
 * Este script:
 * 1. Obtém a DATABASE_URL do Railway
 * 2. Atualiza o arquivo .env automaticamente
 * 3. Testa a conexão
 * 4. Popula o banco com seed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

function executeCommand(command, description) {
  try {
    log(`\n${description}...`, 'blue');
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log(`✅ ${description} concluído`, 'green');
    return output.trim();
  } catch (err) {
    log(`❌ Erro: ${err.message}`, 'red');
    if (err.stdout) {
      console.log(err.stdout);
    }
    if (err.stderr) {
      console.error(err.stderr);
    }
    return null;
  }
}

async function getDatabaseUrl() {
  log('\n🔍 Obtendo DATABASE_URL do Railway...', 'blue');
  
  try {
    // Tenta obter as variáveis do Railway
    const output = execSync('railway variables', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Procura por DATABASE_URL na saída
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('DATABASE_URL') && line.includes('postgresql://')) {
        const match = line.match(/(postgresql:\/\/[^\s]+)/);
        if (match) {
          const url = match[1];
          log('   ✅ DATABASE_URL encontrado!', 'green');
          log(`   ${url.substring(0, 50)}...`, 'cyan');
          return url;
        }
      }
    }
    
    // Se não encontrou, tenta outro formato
    log('   ⚠️  Tentando método alternativo...', 'yellow');
    
    // Tenta railway run com um comando que printa a variável
    const urlOutput = execSync('railway run echo $DATABASE_URL', { 
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true
    });
    
    const urlMatch = urlOutput.match(/(postgresql:\/\/[^\s]+)/);
    if (urlMatch) {
      const url = urlMatch[1];
      log('   ✅ DATABASE_URL encontrado via railway run!', 'green');
      return url;
    }
    
    throw new Error('DATABASE_URL não encontrado nas variáveis do Railway');
  } catch (err) {
    log('   ❌ Não foi possível obter DATABASE_URL automaticamente', 'red');
    log(`   ${err.message}`, 'red');
    return null;
  }
}

function updateEnvFile(databaseUrl) {
  log('\n📝 Atualizando arquivo .env...', 'blue');
  
  const envPath = path.join(__dirname, '.env');
  
  try {
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Substituir a linha DATABASE_URL=
    const databaseUrlPattern = /^DATABASE_URL=.*$/m;
    
    if (databaseUrlPattern.test(content)) {
      content = content.replace(databaseUrlPattern, `DATABASE_URL=${databaseUrl}`);
    } else {
      // Se não existir, adicionar no início
      content = `DATABASE_URL=${databaseUrl}\n\n` + content;
    }
    
    fs.writeFileSync(envPath, content, 'utf8');
    log('   ✅ Arquivo .env atualizado com sucesso!', 'green');
    log(`   DATABASE_URL configurado`, 'cyan');
    return true;
  } catch (err) {
    log('   ❌ Erro ao atualizar .env:', 'red');
    log(`   ${err.message}`, 'red');
    return false;
  }
}

async function testConnection() {
  log('\n🔌 Testando conexão com banco de dados...', 'blue');
  
  try {
    execSync('node server/test-system.js', { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return true;
  } catch (err) {
    log('   ❌ Erro ao testar conexão', 'red');
    return false;
  }
}

async function runSeed() {
  log('\n🌱 Populando banco de dados com seed...', 'blue');
  log('   (Isso pode levar 10-20 segundos)', 'cyan');
  
  try {
    execSync('node server/seed-database.js', { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return true;
  } catch (err) {
    log('   ❌ Erro ao executar seed', 'red');
    return false;
  }
}

function showNextSteps() {
  log('\n' + '='.repeat(60), 'cyan');
  log('✅ CONFIGURAÇÃO RAILWAY CONCLUÍDA!', 'green');
  log('='.repeat(60), 'cyan');
  
  log('\n🚀 Próximos Passos:', 'blue');
  log('   1️⃣  Iniciar o servidor:', 'cyan');
  log('      npm start', 'yellow');
  log('');
  log('   2️⃣  Acessar o sistema:', 'cyan');
  log('      http://localhost:3000/login.html', 'yellow');
  log('');
  log('   3️⃣  Fazer login:', 'cyan');
  log('      Admin: admin@admin / (senha definida em ADMIN_PASSWORD)', 'yellow');
  log('      Associado: carlos.silva@gmail.com / 123456', 'yellow');
  log('');
  log('📦 Dados no Banco:', 'blue');
  log('   • 15 associados cadastrados', 'cyan');
  log('   • 15 jogadores (5 times)', 'cyan');
  log('   • 180 pagamentos (12 meses)', 'cyan');
  log('   • 16 jogos de campeonato', 'cyan');
  log('   • Posts, vídeos, imagens e comentários', 'cyan');
  log('');
}

async function main() {
  log('🎯 CONFIGURAÇÃO AUTOMÁTICA DO RAILWAY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // 1. Obter DATABASE_URL
  const databaseUrl = await getDatabaseUrl();
  
  if (!databaseUrl) {
    log('\n❌ Não foi possível obter DATABASE_URL automaticamente', 'red');
    log('\n💡 Solução alternativa:', 'yellow');
    log('   1. Acesse: https://railway.app', 'cyan');
    log('   2. Clique no serviço PostgreSQL', 'cyan');
    log('   3. Vá na aba "Connect"', 'cyan');
    log('   4. Copie a "Postgres Connection URL"', 'cyan');
    log('   5. Cole no arquivo .env na linha DATABASE_URL=', 'cyan');
    log('   6. Execute: node server/seed-database.js', 'cyan');
    process.exit(1);
  }
  
  // 2. Atualizar .env
  const envUpdated = updateEnvFile(databaseUrl);
  
  if (!envUpdated) {
    log('\n❌ Não foi possível atualizar .env', 'red');
    process.exit(1);
  }
  
  // 3. Testar conexão
  log('\n⏳ Aguardando 3 segundos para PostgreSQL inicializar...', 'cyan');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const connected = await testConnection();
  
  if (!connected) {
    log('\n⚠️  Não foi possível conectar ao banco', 'yellow');
    log('   O banco pode ainda estar inicializando. Aguarde 1 minuto e tente:', 'cyan');
    log('   node server/test-system.js', 'yellow');
    process.exit(1);
  }
  
  // 4. Popular banco
  const seeded = await runSeed();
  
  if (!seeded) {
    log('\n⚠️  Erro ao popular banco', 'yellow');
    log('   Tente manualmente: node server/seed-database.js', 'cyan');
    process.exit(1);
  }
  
  // 5. Mostrar próximos passos
  showNextSteps();
}

main().catch(err => {
  log('\n❌ Erro inesperado:', 'red');
  console.error(err);
  process.exit(1);
});
