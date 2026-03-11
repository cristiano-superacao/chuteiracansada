/**
 * Script de Configuração Rápida do .env
 * 
 * Execute: node setup-env.js
 * 
 * Este script ajuda a configurar o arquivo .env de forma interativa
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

async function checkDocker() {
  log('\n🐳 Verificando Docker...', 'blue');
  
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync('docker --version');
    log('   ✅ Docker está instalado', 'green');
    
    try {
      const { stdout } = await execAsync('docker ps --format "{{.Names}}" 2>nul');
      const containers = stdout.split('\n').filter(Boolean);
      
      if (containers.includes('chuteira-postgres')) {
        log('   ✅ Container "chuteira-postgres" já existe e está rodando', 'green');
        return 'running';
      } else {
        // Verificar se existe mas está parado
        const { stdout: allContainers } = await execAsync('docker ps -a --format "{{.Names}}" 2>nul');
        const allContainersList = allContainers.split('\n').filter(Boolean);
        
        if (allContainersList.includes('chuteira-postgres')) {
          log('   ⚠️  Container "chuteira-postgres" existe mas está parado', 'yellow');
          return 'stopped';
        } else {
          log('   ℹ️  Container "chuteira-postgres" não existe ainda', 'cyan');
          return 'not-created';
        }
      }
    } catch (err) {
      log('   ℹ️  Nenhum container PostgreSQL encontrado', 'cyan');
      return 'not-created';
    }
  } catch (err) {
    log('   ❌ Docker não está instalado ou não está no PATH', 'red');
    log('   💡 Baixe em: https://docs.docker.com/desktop/install/windows-install/', 'cyan');
    return 'not-installed';
  }
}

async function startDockerContainer(status) {
  if (status === 'running') {
    log('\n✅ Container PostgreSQL já está rodando!', 'green');
    return true;
  }
  
  if (status === 'stopped') {
    log('\n🔄 Iniciando container PostgreSQL existente...', 'blue');
    const start = await question('   Deseja iniciar o container? (s/N): ');
    
    if (start.toLowerCase() === 's') {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      try {
        await execAsync('docker start chuteira-postgres');
        log('   ✅ Container iniciado com sucesso!', 'green');
        
        // Aguardar 2 segundos para o PostgreSQL inicializar
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      } catch (err) {
        log('   ❌ Erro ao iniciar container:', 'red');
        log(`   ${err.message}`, 'red');
        return false;
      }
    }
    return false;
  }
  
  if (status === 'not-created') {
    log('\n🚀 Criando novo container PostgreSQL...', 'blue');
    const create = await question('   Deseja criar um container PostgreSQL com Docker? (S/n): ');
    
    if (create.toLowerCase() !== 'n') {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const dockerCommand = `docker run --name chuteira-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=chuteiracansada -p 5432:5432 -d postgres:16-alpine`;
      
      log('   Executando comando Docker...', 'cyan');
      log(`   ${dockerCommand}`, 'yellow');
      
      try {
        await execAsync(dockerCommand);
        log('   ✅ Container criado e iniciado com sucesso!', 'green');
        
        // Aguardar 3 segundos para o PostgreSQL inicializar
        log('   ⏳ Aguardando PostgreSQL inicializar...', 'cyan');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        log('   ✅ PostgreSQL pronto!', 'green');
        return true;
      } catch (err) {
        log('   ❌ Erro ao criar container:', 'red');
        log(`   ${err.message}`, 'red');
        
        if (err.message.includes('port is already allocated')) {
          log('   💡 A porta 5432 já está em uso. PostgreSQL já está rodando?', 'yellow');
        }
        
        return false;
      }
    }
    return false;
  }
  
  return false;
}

function readExistingEnv() {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

function writeEnvFile(config) {
  const envPath = path.join(__dirname, '.env');
  
  const content = `# Configuração do Sistema - Chuteira Cansada
# Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}

# ==============================================
# BANCO DE DADOS (OBRIGATÓRIO)
# ==============================================
DATABASE_URL=${config.DATABASE_URL}

# ==============================================
# AUTENTICAÇÃO (OBRIGATÓRIO)
# ==============================================
ADMIN_PASSWORD=${config.ADMIN_PASSWORD}
ADMIN_JWT_SECRET=${config.ADMIN_JWT_SECRET}
SESSION_SECRET=${config.SESSION_SECRET}

# ==============================================
# SERVIDOR
# ==============================================
NODE_ENV=${config.NODE_ENV}
PORT=${config.PORT}

# ==============================================
# GOOGLE OAUTH (OPCIONAL)
# ==============================================
# Descomente e configure se quiser usar login com Google
# Consulte GOOGLE_OAUTH.md para instruções
${config.GOOGLE_CLIENT_ID ? `GOOGLE_CLIENT_ID=${config.GOOGLE_CLIENT_ID}` : '# GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com'}
${config.GOOGLE_CLIENT_SECRET ? `GOOGLE_CLIENT_SECRET=${config.GOOGLE_CLIENT_SECRET}` : '# GOOGLE_CLIENT_SECRET=seu-client-secret'}
${config.GOOGLE_CALLBACK_URL ? `GOOGLE_CALLBACK_URL=${config.GOOGLE_CALLBACK_URL}` : '# GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback'}
`;
  
  fs.writeFileSync(envPath, content, 'utf8');
  log(`\n✅ Arquivo .env criado com sucesso!`, 'green');
  log(`   📁 Local: ${envPath}`, 'cyan');
}

async function configureEnv(dockerStatus) {
  log('\n⚙️  Configurando variáveis de ambiente...', 'blue');
  
  const existing = readExistingEnv();
  const config = {};
  
  // DATABASE_URL
  if (dockerStatus === 'running' || dockerStatus === 'stopped') {
    config.DATABASE_URL = 'postgresql://postgres:postgres123@localhost:5432/chuteiracansada';
    log('\n   ✅ DATABASE_URL configurado automaticamente', 'green');
  } else if (existing.DATABASE_URL && existing.DATABASE_URL !== '') {
    log(`\n   📝 DATABASE_URL atual: ${existing.DATABASE_URL}`, 'cyan');
    const keep = await question('   Manter este valor? (S/n): ');
    
    if (keep.toLowerCase() === 'n') {
      const newUrl = await question('   Digite o novo DATABASE_URL: ');
      config.DATABASE_URL = newUrl;
    } else {
      config.DATABASE_URL = existing.DATABASE_URL;
    }
  } else {
    log('\n   ⚠️  DATABASE_URL não configurado', 'yellow');
    const url = await question('   Digite o DATABASE_URL (ou pressione Enter para pular): ');
    config.DATABASE_URL = url || '';
  }
  
  // ADMIN_PASSWORD
  if (existing.ADMIN_PASSWORD && existing.ADMIN_PASSWORD !== '') {
    config.ADMIN_PASSWORD = existing.ADMIN_PASSWORD;
    log(`\n   ✅ ADMIN_PASSWORD: ***${existing.ADMIN_PASSWORD.slice(-4)}`, 'green');
  } else {
    log('\n   🔐 Configurando senha do administrador...', 'cyan');
    const password = await question('   Digite a senha do admin (ou pressione Enter para "admin123"): ');
    config.ADMIN_PASSWORD = password || 'admin123';
  }
  
  // ADMIN_JWT_SECRET
  if (existing.ADMIN_JWT_SECRET && existing.ADMIN_JWT_SECRET.length >= 32) {
    config.ADMIN_JWT_SECRET = existing.ADMIN_JWT_SECRET;
    log(`\n   ✅ ADMIN_JWT_SECRET: ***${existing.ADMIN_JWT_SECRET.slice(-8)}`, 'green');
  } else {
    log('\n   🔑 Gerando ADMIN_JWT_SECRET...', 'cyan');
    config.ADMIN_JWT_SECRET = generateSecret(64);
    log(`   ✅ Gerado: ***${config.ADMIN_JWT_SECRET.slice(-8)}`, 'green');
  }
  
  // SESSION_SECRET
  if (existing.SESSION_SECRET && existing.SESSION_SECRET.length >= 32) {
    config.SESSION_SECRET = existing.SESSION_SECRET;
    log(`\n   ✅ SESSION_SECRET: ***${existing.SESSION_SECRET.slice(-8)}`, 'green');
  } else {
    log('\n   🔑 Gerando SESSION_SECRET...', 'cyan');
    config.SESSION_SECRET = generateSecret(64);
    log(`   ✅ Gerado: ***${config.SESSION_SECRET.slice(-8)}`, 'green');
  }
  
  // NODE_ENV
  config.NODE_ENV = existing.NODE_ENV || 'development';
  log(`\n   ✅ NODE_ENV: ${config.NODE_ENV}`, 'green');
  
  // PORT
  config.PORT = existing.PORT || '3000';
  log(`   ✅ PORT: ${config.PORT}`, 'green');
  
  // Google OAuth (opcional)
  log('\n   📱 Google OAuth (opcional):', 'cyan');
  const configOAuth = await question('   Deseja configurar Google OAuth agora? (s/N): ');
  
  if (configOAuth.toLowerCase() === 's') {
    const clientId = await question('   GOOGLE_CLIENT_ID: ');
    const clientSecret = await question('   GOOGLE_CLIENT_SECRET: ');
    const callbackUrl = await question('   GOOGLE_CALLBACK_URL (Enter para padrão): ');
    
    if (clientId) config.GOOGLE_CLIENT_ID = clientId;
    if (clientSecret) config.GOOGLE_CLIENT_SECRET = clientSecret;
    config.GOOGLE_CALLBACK_URL = callbackUrl || 'http://localhost:3000/api/oauth/google/callback';
  } else {
    log('   ℹ️  Pule por agora. Configure depois em GOOGLE_OAUTH.md', 'cyan');
  }
  
  return config;
}

async function testConnection(config) {
  if (!config.DATABASE_URL || config.DATABASE_URL === '') {
    log('\n   ⚠️  DATABASE_URL não configurado, pulando teste de conexão', 'yellow');
    return false;
  }
  
  log('\n🔌 Testando conexão com banco de dados...', 'blue');
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: config.DATABASE_URL });
    
    const result = await pool.query('SELECT NOW()');
    log('   ✅ Conexão bem-sucedida!', 'green');
    log(`   ⏰ Horário do banco: ${result.rows[0].now}`, 'cyan');
    
    await pool.end();
    return true;
  } catch (err) {
    log('   ❌ Erro ao conectar:', 'red');
    log(`   ${err.message}`, 'red');
    
    if (err.message.includes('ECONNREFUSED')) {
      log('   💡 PostgreSQL não está rodando ou não está na porta correta', 'yellow');
    } else if (err.message.includes('authentication failed')) {
      log('   💡 Senha incorreta. Verifique o DATABASE_URL', 'yellow');
    } else if (err.message.includes('does not exist')) {
      log('   💡 Banco de dados não existe. Será criado automaticamente', 'yellow');
    }
    
    return false;
  }
}

async function showNextSteps(hasConnection) {
  log('\n' + '='.repeat(60), 'cyan');
  log('✅ CONFIGURAÇÃO CONCLUÍDA!', 'green');
  log('='.repeat(60), 'cyan');
  
  log('\n🚀 Próximos Passos:', 'blue');
  
  if (hasConnection) {
    log('   1️⃣  Popular o banco com dados de exemplo:', 'cyan');
    log('      npm run seed', 'yellow');
    log('');
    log('   2️⃣  Iniciar o servidor:', 'cyan');
    log('      npm start', 'yellow');
    log('');
    log('   3️⃣  Acessar o sistema:', 'cyan');
    log('      http://localhost:3000/login.html', 'yellow');
    log('');
    log('   4️⃣  Fazer login:', 'cyan');
    log('      Admin: (valor de ADMIN_EMAIL) / (sua senha ADMIN_PASSWORD)', 'yellow');
  } else {
    log('   1️⃣  Configure o PostgreSQL:', 'cyan');
    log('      Consulte INICIO_RAPIDO.md ou TESTAR_LOCALMENTE.md', 'yellow');
    log('');
    log('   2️⃣  Atualize DATABASE_URL no .env', 'cyan');
    log('');
    log('   3️⃣  Execute este script novamente:', 'cyan');
    log('      node setup-env.js', 'yellow');
  }
  
  log('\n📖 Documentação:', 'blue');
  log('   • INICIO_RAPIDO.md - Guia de início rápido', 'cyan');
  log('   • TESTAR_LOCALMENTE.md - Configuração detalhada', 'cyan');
  log('   • AUTH_README.md - Sistema de autenticação', 'cyan');
  log('   • GOOGLE_OAUTH.md - Login com Google', 'cyan');
  
  log('\n🔍 Para verificar o status do sistema:', 'blue');
  log('   node server/test-system.js', 'yellow');
  
  log('');
}

async function main() {
  log('🎯 CONFIGURAÇÃO RÁPIDA - CHUTEIRA CANSADA', 'magenta');
  log('='.repeat(60), 'cyan');
  log('Este script irá configurar automaticamente o arquivo .env\n', 'cyan');
  
  // Verificar Docker
  const dockerStatus = await checkDocker();
  
  // Iniciar container se necessário
  const dockerStarted = await startDockerContainer(dockerStatus);
  
  // Configurar .env
  const config = await configureEnv(dockerStarted ? 'running' : dockerStatus);
  
  // Salvar .env
  writeEnvFile(config);
  
  // Testar conexão
  const hasConnection = await testConnection(config);
  
  // Mostrar próximos passos
  await showNextSteps(hasConnection);
  
  rl.close();
}

main().catch(err => {
  log('\n❌ Erro inesperado:', 'red');
  console.error(err);
  rl.close();
  process.exit(1);
});
