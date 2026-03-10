/**
 * Script de Seed - Popular banco de dados com dados de teste
 * 
 * Execute: node server/seed-database.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./db');

// Cores para output no console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

// Dados de seed completos e realistas
const SEED_DATA = {
  associados: [
    { nome: 'Carlos Silva', apelido: 'Carlão', email: 'carlos.silva@gmail.com', telefone: '11987654321' },
    { nome: 'João Pedro Santos', apelido: 'JP', email: 'joao.pedro@gmail.com', telefone: '11987654322' },
    { nome: 'Rafael Oliveira', apelido: 'Rafa', email: 'rafael.oliveira@gmail.com', telefone: '11987654323' },
    { nome: 'Lucas Mendes', apelido: 'Lucão', email: 'lucas.mendes@gmail.com', telefone: '11987654324' },
    { nome: 'Pedro Henrique', apelido: 'Pedrinho', email: 'pedro.henrique@gmail.com', telefone: '11987654325' },
    { nome: 'Gabriel Costa', apelido: 'Gabi', email: 'gabriel.costa@gmail.com', telefone: '11987654326' },
    { nome: 'Matheus Souza', apelido: 'Matheus', email: 'matheus.souza@gmail.com', telefone: '11987654327' },
    { nome: 'Felipe Rodrigues', apelido: 'Pipoca', email: 'felipe.rodrigues@gmail.com', telefone: '11987654328' },
    { nome: 'André Alves', apelido: 'Dedé', email: 'andre.alves@gmail.com', telefone: '11987654329' },
    { nome: 'Bruno Martins', apelido: 'Brunão', email: 'bruno.martins@gmail.com', telefone: '11987654330' },
    { nome: 'Thiago Lima', apelido: 'Thiaguinho', email: 'thiago.lima@gmail.com', telefone: '11987654331' },
    { nome: 'Rodrigo Ferreira', apelido: 'Digão', email: 'rodrigo.ferreira@gmail.com', telefone: '11987654332' },
    { nome: 'Diego Cardoso', apelido: 'Dieguinho', email: 'diego.cardoso@gmail.com', telefone: '11987654333' },
    { nome: 'Vinicius Ribeiro', apelido: 'Vini', email: 'vinicius.ribeiro@gmail.com', telefone: '11987654334' },
    { nome: 'Gustavo Pereira', apelido: 'Guto', email: 'gustavo.pereira@gmail.com', telefone: '11987654335' }
  ],

  jogadores: [
    // Time Brasil
    { nome: 'Carlos Silva', time: 'Brasil', gols: 12, amarelos: 3, vermelhos: 0, suspensoes: 0 },
    { nome: 'João Pedro', time: 'Brasil', gols: 8, amarelos: 5, vermelhos: 1, suspensoes: 1 },
    { nome: 'Rafael Oliveira', time: 'Brasil', gols: 15, amarelos: 2, vermelhos: 0, suspensoes: 0 },
    { nome: 'Lucas Mendes', time: 'Brasil', gols: 3, amarelos: 4, vermelhos: 0, suspensoes: 0 },
    { nome: 'Pedro Henrique', time: 'Brasil', gols: 0, amarelos: 1, vermelhos: 0, suspensoes: 0 },
    
    // Time Argentina
    { nome: 'Gabriel Costa', time: 'Argentina', gols: 10, amarelos: 2, vermelhos: 0, suspensoes: 0 },
    { nome: 'Matheus Souza', time: 'Argentina', gols: 7, amarelos: 6, vermelhos: 0, suspensoes: 1 },
    { nome: 'Felipe Rodrigues', time: 'Argentina', gols: 5, amarelos: 3, vermelhos: 1, suspensoes: 1 },
    { nome: 'André Alves', time: 'Argentina', gols: 2, amarelos: 2, vermelhos: 0, suspensoes: 0 },
    { nome: 'Bruno Martins', time: 'Argentina', gols: 0, amarelos: 1, vermelhos: 0, suspensoes: 0 },
    
    // Time Alemanha
    { nome: 'Thiago Lima', time: 'Alemanha', gols: 9, amarelos: 4, vermelhos: 0, suspensoes: 0 },
    { nome: 'Rodrigo Ferreira', time: 'Alemanha', gols: 11, amarelos: 3, vermelhos: 0, suspensoes: 0 },
    { nome: 'Diego Cardoso', time: 'Alemanha', gols: 6, amarelos: 5, vermelhos: 1, suspensoes: 1 },
    { nome: 'Vinicius Ribeiro', time: 'Alemanha', gols: 4, amarelos: 2, vermelhos: 0, suspensoes: 0 },
    { nome: 'Gustavo Pereira', time: 'Alemanha', gols: 1, amarelos: 1, vermelhos: 0, suspensoes: 0 }
  ],

  times: [
    { time: 'Brasil', pg: 21, j: 8, v: 7, e: 0, der: 1, gf: 28, gs: 12, sg: 16, ca: 15, cv: 1 },
    { time: 'Argentina', pg: 18, j: 8, v: 6, e: 0, der: 2, gf: 22, gs: 15, sg: 7, ca: 14, cv: 1 },
    { time: 'Alemanha', pg: 15, j: 8, v: 5, e: 0, der: 3, gf: 19, gs: 18, sg: 1, ca: 15, cv: 1 },
    { time: 'França', pg: 9, j: 8, v: 3, e: 0, der: 5, gf: 14, gs: 20, sg: -6, ca: 12, cv: 0 },
    { time: 'Espanha', pg: 6, j: 8, v: 2, e: 0, der: 6, gf: 10, gs: 28, sg: -18, ca: 10, cv: 1 }
  ],

  gastos: [
    { mes: 'Jan', data: '2026-01-05', descricao: 'Água mineral e gelo', valor: 45.00 },
    { mes: 'Jan', data: '2026-01-15', descricao: 'Bolas de futebol (2 unidades)', valor: 180.00 },
    { mes: 'Jan', data: '2026-01-20', descricao: 'Coletes para treino', valor: 120.00 },
    { mes: 'Fev', data: '2026-02-03', descricao: 'Manutenção do campo', valor: 350.00 },
    { mes: 'Fev', data: '2026-02-10', descricao: 'Kit de primeiros socorros', valor: 85.00 },
    { mes: 'Fev', data: '2026-02-18', descricao: 'Água e isotônicos', valor: 60.00 },
    { mes: 'Mar', data: '2026-03-05', descricao: 'Troféus para o campeonato', valor: 280.00 },
    { mes: 'Mar', data: '2026-03-08', descricao: 'Lanche pós-jogo', valor: 95.00 }
  ],

  entradas: [
    { mes: 'Jan', data: '2026-01-05', origem: 'Mensalidades', valor: 900.00 },
    { mes: 'Jan', data: '2026-01-15', origem: 'Patrocínio Bar do João', valor: 500.00 },
    { mes: 'Fev', data: '2026-02-05', origem: 'Mensalidades', valor: 900.00 },
    { mes: 'Fev', data: '2026-02-20', origem: 'Venda de camisetas', valor: 420.00 },
    { mes: 'Mar', data: '2026-03-05', origem: 'Mensalidades', valor: 900.00 },
    { mes: 'Mar', data: '2026-03-08', origem: 'Rifa', valor: 650.00 }
  ],

  jogos: [
    { rodada: '1', data: '2026-01-05', hora: '19:30', casa: 'Brasil', placar: '4-2', fora: 'Espanha', local: 'Campo Central' },
    { rodada: '1', data: '2026-01-05', hora: '20:30', casa: 'Argentina', placar: '3-1', fora: 'França', local: 'Campo Central' },
    { rodada: '2', data: '2026-01-12', hora: '19:30', casa: 'Alemanha', placar: '2-2', fora: 'Brasil', local: 'Campo Central' },
    { rodada: '2', data: '2026-01-12', hora: '20:30', casa: 'Espanha', placar: '1-3', fora: 'Argentina', local: 'Campo Central' },
    { rodada: '3', data: '2026-01-19', hora: '19:30', casa: 'Brasil', placar: '5-1', fora: 'França', local: 'Campo Central' },
    { rodada: '3', data: '2026-01-19', hora: '20:30', casa: 'Alemanha', placar: '3-0', fora: 'Espanha', local: 'Campo Central' },
    { rodada: '4', data: '2026-01-26', hora: '19:30', casa: 'Argentina', placar: '4-2', fora: 'Alemanha', local: 'Campo Central' },
    { rodada: '4', data: '2026-01-26', hora: '20:30', casa: 'França', placar: '2-1', fora: 'Espanha', local: 'Campo Central' },
    { rodada: '5', data: '2026-02-02', hora: '19:30', casa: 'Brasil', placar: '3-1', fora: 'Argentina', local: 'Campo Central' },
    { rodada: '5', data: '2026-02-02', hora: '20:30', casa: 'Alemanha', placar: '2-1', fora: 'França', local: 'Campo Central' },
    { rodada: '6', data: '2026-02-09', hora: '19:30', casa: 'Espanha', placar: '1-4', fora: 'Brasil', local: 'Campo Central' },
    { rodada: '6', data: '2026-02-09', hora: '20:30', casa: 'França', placar: '2-3', fora: 'Argentina', local: 'Campo Central' },
    { rodada: '7', data: '2026-02-16', hora: '19:30', casa: 'Brasil', placar: '3-2', fora: 'Alemanha', local: 'Campo Central' },
    { rodada: '7', data: '2026-02-16', hora: '20:30', casa: 'Argentina', placar: '2-1', fora: 'Espanha', local: 'Campo Central' },
    { rodada: '8', data: '2026-02-23', hora: '19:30', casa: 'França', placar: '1-2', fora: 'Brasil', local: 'Campo Central' },
    { rodada: '8', data: '2026-02-23', hora: '20:30', casa: 'Espanha', placar: '0-3', fora: 'Alemanha', local: 'Campo Central' }
  ],

  videos: [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
    { url: 'https://www.youtube.com/watch?v=9bZkp7q19f0' }
  ],

  imagens: [
    { url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', legenda: 'Gol do Brasil na final' },
    { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', legenda: 'Comemoração da Argentina' },
    { url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800', legenda: 'Time da Alemanha' },
    { url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800', legenda: 'Jogadores em ação' }
  ],

  posts: [
    {
      id: 'post-rodada-1',
      rodada: '1',
      titulo: 'Abertura do Campeonato com Jogaços!',
      texto: 'A primeira rodada do nosso campeonato foi emocionante! O Brasil venceu a Espanha por 4-2 em um jogo repleto de gols. A Argentina também começou bem, vencendo a França por 3-1. Destaque para Rafael Oliveira, artilheiro da rodada com 2 gols.',
      comentarios: [
        { nome: 'Carlos Silva', texto: 'Que jogo sensacional! Parabéns ao time do Brasil!' },
        { nome: 'Pedro', texto: 'A Argentina tá muito forte esse ano.' }
      ]
    },
    {
      id: 'post-rodada-3',
      rodada: '3',
      titulo: 'Brasil Goleia e Assume Liderança',
      texto: 'Na terceira rodada, o Brasil não tomou conhecimento da França e aplicou uma goleada de 5-1. A Alemanha também venceu bem, fazendo 3-0 na Espanha. O campeonato está cada vez mais disputado!',
      comentarios: [
        { nome: 'João Pedro', texto: 'Que atuação do Brasil! Time tá voando!' }
      ]
    },
    {
      id: 'post-rodada-5',
      rodada: '5',
      titulo: 'Clássico Brasil vs Argentina',
      texto: 'O grande clássico da rodada teve vitória do Brasil por 3-1. Jogo equilibrado no primeiro tempo, mas o Brasil foi superior na etapa final. Gabriel Costa fez o gol de honra da Argentina.',
      comentarios: [
        { nome: 'Matheus', texto: 'Jogo duro, mas merecemos a vitória!' },
        { nome: 'André', texto: 'Argentina vai se recuperar nas próximas rodadas.' }
      ]
    }
  ]
};

async function clearDatabase() {
  log('\n🗑️  Limpando banco de dados...', 'yellow');
  
  const tables = [
    'campeonato_comentarios',
    'campeonato_posts',
    'campeonato_imagens',
    'campeonato_videos',
    'campeonato_jogos',
    'times',
    'entradas',
    'gastos',
    'jogadores',
    'associados_pagamentos',
    'users',
    'associados'
  ];

  for (const table of tables) {
    await pool.query(`DELETE FROM ${table}`);
    log(`   ✓ Tabela ${table} limpa`, 'cyan');
  }
}

async function seedAssociados() {
  log('\n👥 Criando associados...', 'blue');
  
  const associadoIds = [];
  
  for (const assoc of SEED_DATA.associados) {
    const result = await pool.query(
      `INSERT INTO associados (nome, apelido, email, telefone, ativo)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id`,
      [assoc.nome, assoc.apelido, assoc.email, assoc.telefone]
    );
    
    associadoIds.push(result.rows[0].id);
    log(`   ✓ ${assoc.nome} (ID: ${result.rows[0].id})`, 'green');
  }
  
  return associadoIds;
}

async function seedUsers(associadoIds) {
  log('\n🔐 Criando usuários...', 'blue');
  
  // Admin legado continua funcionando via env
  log('   ✓ Admin: admin@admin (via ADMIN_PASSWORD)', 'green');
  
  // Criar usuários associados (senha padrão: "123456")
  const passwordHash = await bcrypt.hash('123456', 10);
  
  let count = 0;
  for (const assoc of SEED_DATA.associados) {
    const associadoId = associadoIds[count];
    
    await pool.query(
      `INSERT INTO users (email, password_hash, role, associado_id, ativo)
       VALUES ($1, $2, 'associado', $3, TRUE)`,
      [assoc.email, passwordHash, associadoId]
    );
    
    log(`   ✓ Associado: ${assoc.email} (senha: 123456)`, 'green');
    count++;
  }
}

async function seedPagamentos(associadoIds) {
  log('\n💰 Criando pagamentos...', 'blue');
  
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const status = ['Pago', 'Pendente', 'Atrasado'];
  
  for (const associadoId of associadoIds) {
    for (const mes of meses) {
      // 70% pagos, 20% pendentes, 10% atrasados
      const rand = Math.random();
      let statusPgto, valor;
      
      if (rand < 0.7) {
        statusPgto = 'Pago';
        valor = 60.00;
      } else if (rand < 0.9) {
        statusPgto = 'Pendente';
        valor = 0;
      } else {
        statusPgto = 'Atrasado';
        valor = 0;
      }
      
      await pool.query(
        `INSERT INTO associados_pagamentos (associado_id, mes_key, raw, valor)
         VALUES ($1, $2, $3, $4)`,
        [associadoId, mes, statusPgto, valor]
      );
    }
    log(`   ✓ Associado ID ${associadoId} - 12 meses criados`, 'green');
  }
}

async function seedJogadores() {
  log('\n⚽ Criando jogadores...', 'blue');
  
  for (const jogador of SEED_DATA.jogadores) {
    await pool.query(
      `INSERT INTO jogadores (nome, time, gols, amarelos, vermelhos, suspensoes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [jogador.nome, jogador.time, jogador.gols, jogador.amarelos, jogador.vermelhos, jogador.suspensoes]
    );
    log(`   ✓ ${jogador.nome} (${jogador.time}) - ${jogador.gols} gols`, 'green');
  }
}

async function seedTimes() {
  log('\n🏆 Criando classificação...', 'blue');
  
  for (const time of SEED_DATA.times) {
    await pool.query(
      `INSERT INTO times (time, pg, j, v, e, der, gf, gs, sg, ca, cv)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [time.time, time.pg, time.j, time.v, time.e, time.der, time.gf, time.gs, time.sg, time.ca, time.cv]
    );
    log(`   ✓ ${time.time} - ${time.pg} pontos`, 'green');
  }
}

async function seedGastos() {
  log('\n💸 Criando gastos...', 'blue');
  
  for (const gasto of SEED_DATA.gastos) {
    await pool.query(
      `INSERT INTO gastos (mes, data, descricao, valor)
       VALUES ($1, $2, $3, $4)`,
      [gasto.mes, gasto.data, gasto.descricao, gasto.valor]
    );
    log(`   ✓ ${gasto.descricao} - R$ ${gasto.valor.toFixed(2)}`, 'green');
  }
}

async function seedEntradas() {
  log('\n💵 Criando entradas...', 'blue');
  
  for (const entrada of SEED_DATA.entradas) {
    await pool.query(
      `INSERT INTO entradas (mes, data, origem, valor)
       VALUES ($1, $2, $3, $4)`,
      [entrada.mes, entrada.data, entrada.origem, entrada.valor]
    );
    log(`   ✓ ${entrada.origem} - R$ ${entrada.valor.toFixed(2)}`, 'green');
  }
}

async function seedCampeonato() {
  log('\n🏟️  Criando dados do campeonato...', 'blue');
  
  // Jogos
  log('   📅 Jogos:', 'cyan');
  for (const jogo of SEED_DATA.jogos) {
    await pool.query(
      `INSERT INTO campeonato_jogos (rodada, data, hora, casa, placar, fora, local)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [jogo.rodada, jogo.data, jogo.hora, jogo.casa, jogo.placar, jogo.fora, jogo.local]
    );
    log(`      ✓ ${jogo.casa} ${jogo.placar} ${jogo.fora}`, 'green');
  }
  
  // Vídeos
  log('   🎥 Vídeos:', 'cyan');
  for (const video of SEED_DATA.videos) {
    await pool.query(
      `INSERT INTO campeonato_videos (url) VALUES ($1)`,
      [video.url]
    );
    log(`      ✓ ${video.url}`, 'green');
  }
  
  // Imagens
  log('   📸 Imagens:', 'cyan');
  for (const imagem of SEED_DATA.imagens) {
    await pool.query(
      `INSERT INTO campeonato_imagens (url, legenda) VALUES ($1, $2)`,
      [imagem.url, imagem.legenda]
    );
    log(`      ✓ ${imagem.legenda}`, 'green');
  }
  
  // Posts e comentários
  log('   📝 Posts:', 'cyan');
  for (const post of SEED_DATA.posts) {
    await pool.query(
      `INSERT INTO campeonato_posts (id, rodada, titulo, texto, criado_em)
       VALUES ($1, $2, $3, $4, NOW())`,
      [post.id, post.rodada, post.titulo, post.texto]
    );
    log(`      ✓ ${post.titulo}`, 'green');
    
    // Comentários do post
    for (const comentario of post.comentarios) {
      await pool.query(
        `INSERT INTO campeonato_comentarios (post_id, nome, texto, criado_em)
         VALUES ($1, $2, $3, NOW())`,
        [post.id, comentario.nome, comentario.texto]
      );
      log(`         💬 ${comentario.nome}: "${comentario.texto.substring(0, 40)}..."`, 'cyan');
    }
  }
}

async function showSummary() {
  log('\n📊 Resumo dos dados criados:', 'blue');
  
  const counts = await Promise.all([
    pool.query('SELECT COUNT(*) FROM associados'),
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT COUNT(*) FROM associados_pagamentos'),
    pool.query('SELECT COUNT(*) FROM jogadores'),
    pool.query('SELECT COUNT(*) FROM times'),
    pool.query('SELECT COUNT(*) FROM gastos'),
    pool.query('SELECT COUNT(*) FROM entradas'),
    pool.query('SELECT COUNT(*) FROM campeonato_jogos'),
    pool.query('SELECT COUNT(*) FROM campeonato_videos'),
    pool.query('SELECT COUNT(*) FROM campeonato_imagens'),
    pool.query('SELECT COUNT(*) FROM campeonato_posts'),
    pool.query('SELECT COUNT(*) FROM campeonato_comentarios')
  ]);

  log(`   👥 Associados: ${counts[0].rows[0].count}`, 'green');
  log(`   🔐 Usuários: ${counts[1].rows[0].count}`, 'green');
  log(`   💰 Pagamentos: ${counts[2].rows[0].count}`, 'green');
  log(`   ⚽ Jogadores: ${counts[3].rows[0].count}`, 'green');
  log(`   🏆 Times: ${counts[4].rows[0].count}`, 'green');
  log(`   💸 Gastos: ${counts[5].rows[0].count}`, 'green');
  log(`   💵 Entradas: ${counts[6].rows[0].count}`, 'green');
  log(`   🎮 Jogos: ${counts[7].rows[0].count}`, 'green');
  log(`   🎥 Vídeos: ${counts[8].rows[0].count}`, 'green');
  log(`   📸 Imagens: ${counts[9].rows[0].count}`, 'green');
  log(`   📝 Posts: ${counts[10].rows[0].count}`, 'green');
  log(`   💬 Comentários: ${counts[11].rows[0].count}`, 'green');
}

async function main() {
  try {
    log('🌱 SEED DO BANCO DE DADOS - CHUTEIRA CANSADA', 'cyan');
    log('=' .repeat(60), 'cyan');
    
    await clearDatabase();
    
    const associadoIds = await seedAssociados();
    await seedUsers(associadoIds);
    await seedPagamentos(associadoIds);
    await seedJogadores();
    await seedTimes();
    await seedGastos();
    await seedEntradas();
    await seedCampeonato();
    
    await showSummary();
    
    log('\n✅ Seed concluído com sucesso!', 'green');
    log('\n📋 Credenciais de acesso:', 'cyan');
    log('=' .repeat(60), 'cyan');
    log('   🔑 Admin:', 'yellow');
    log('      Email: admin@admin', 'green');
    log('      Senha: (valor de ADMIN_PASSWORD no .env)', 'green');
    log('\n   👤 Associados (todos):', 'yellow');
    log('      Email: (veja os emails acima)', 'green');
    log('      Senha: 123456', 'green');
    log('=' .repeat(60), 'cyan');
    
    log('\n🚀 Inicie o servidor com: npm start', 'blue');
    log('📱 Acesse: http://localhost:3000/login.html\n', 'blue');
    
  } catch (err) {
    log('\n❌ Erro ao executar seed:', 'red');
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
