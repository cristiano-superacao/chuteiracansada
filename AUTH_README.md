# 🔐 Sistema de Autenticação - Instruções de Uso

## 📋 Visão Geral

O sistema agora possui **autenticação por usuário** com dois tipos de perfis:
- **Admin**: Acesso completo ao sistema (dashboard, gestão de associados, jogadores, etc.)
- **Associado**: Acesso limitado (visualização de estatísticas pessoais, jogos, classificação)

### Formas de Autenticação

1. **Login Tradicional**: Email + senha (admin e associados)
2. **Login com Google OAuth**: Apenas para associados (Gmail cadastrado)

> 📖 **Para configurar Google OAuth**, consulte: [GOOGLE_OAUTH.md](GOOGLE_OAUTH.md)

## 🚀 Como Configurar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Certifique-se de ter um arquivo `.env` com:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/database
ADMIN_PASSWORD=admin123
ADMIN_JWT_SECRET=seu_secret_super_seguro_aqui
```

### 3. Executar Migrações

As migrações são automáticas ao iniciar o servidor:

```bash
npm start
```

### 4. Criar Usuário Admin Inicial

O sistema mantém compatibilidade com login admin legado. Use:

- **Email**: `admin@admin`
- **Senha**: O valor definido em `ADMIN_PASSWORD` (padrão: `admin123`)

## 👥 Como Criar Usuários Associados

### Opção 1: Via SQL Direto

```sql
-- Criar um associado
INSERT INTO associados (nome, apelido, email, telefone, ativo) 
VALUES ('João Silva', 'Joãozinho', 'joao@email.com', '11999999999', TRUE);

-- Criar usuário para o associado (senha: 123456)
INSERT INTO users (email, password_hash, role, associado_id, ativo) 
VALUES (
  'joao@email.com',
  '$2b$10$CwTycUXWue0Thq9StjUM0uJMKT.GVBpReNDZbvwVmKJhKq5qwUm/W',
  'associado',
  (SELECT id FROM associados WHERE email = 'joao@email.com'),
  TRUE
);
```

### Opção 2: Criar Script de Seed

Crie um arquivo `server/seed-users.js`:

```javascript
const bcrypt = require('bcrypt');
const { pool } = require('./db');

async function createUser(email, password, role, associadoId = null) {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (email, password_hash, role, associado_id, ativo) VALUES ($1, $2, $3, $4, TRUE)',
    [email, hash, role, associadoId]
  );
  console.log(`✅ Usuário ${email} criado com sucesso!`);
}

async function seed() {
  try {
    // Criar associados de exemplo
    const assoc1 = await pool.query(
      "INSERT INTO associados (nome, apelido, email) VALUES ('Carlos Teste', 'Carlão', 'carlos@teste.com') RETURNING id"
    );

    // Criar usuário para o associado
    await createUser('carlos@teste.com', '123456', 'associado', assoc1.rows[0].id);

    console.log('✅ Seed concluído!');
  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    process.exit();
  }
}

seed();
```

Execute:
```bash
node server/seed-users.js
```

## 🎯 Fluxo de Autenticação

### Login Admin
1. Acesse `/login.html`
2. Email: `admin@admin`
3. Senha: valor de `ADMIN_PASSWORD`
4. Será redirecionado para `/dashboard.html`

### Login Associado
1. Acesse `/login.html`
2. Email: email do associado cadastrado
3. Senha: senha definida no cadastro
4. Será redirecionado para `/inicio.html` (dashboard do associado)

## 📄 Páginas do Sistema

### Admin (role: admin)
- `/dashboard.html` - Dashboard principal
- `/index.html` - Lista de associados (com pagamentos)
- `/jogadores.html` - Gestão de jogadores
- `/gastos.html` - Gestão de gastos
- `/saldo.html` - Visualização de saldo
- `/classificacao.html` - Classificação dos times
- `/campeonato.html` - Jogos do campeonato
- `/entreterimento.html` - Conteúdo de entretenimento

### Associado (role: associado)
- `/inicio.html` - Dashboard com cards:
  - Próximo Jogo
  - Minhas Estatísticas
  - Meu Time
  - Situação Financeira
- `/jogadores.html` - Ver estatísticas (modo visualização)
- `/classificacao.html` - Ver classificação
- `/campeonato.html` - Ver jogos
- `/saldo.html` - Ver situação financeira pessoal
- `/entreterimento.html` - Conteúdo de entretenimento

## 🔒 Segurança

### Senhas
- Todas as senhas são criptografadas com **bcrypt** (10 rounds)
- Nunca armazene senhas em texto plano no banco

### Tokens JWT
- Tokens expiram em **8 horas**
- Armazenados no `localStorage` com chaves:
  - `cc_token` - Token JWT
  - `cc_user` - Dados do usuário

### Verificação de Acesso
- Todas as páginas verificam autenticação antes de carregar
- Redirecionamento automático para `/login.html` se não autenticado
- Controle de role: admin vs associado

## 🛠️ Desenvolvimento

### Gerar Hash de Senha (Node.js)

```javascript
const bcrypt = require('bcrypt');
const password = '123456';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

### Estrutura do JWT Payload

```json
{
  "userId": 1,
  "role": "admin",
  "email": "admin@admin",
  "associadoId": null,
  "iat": 1234567890,
  "exp": 1234596690
}
```

## 📊 Banco de Dados

### Tabela: users
- `id` - ID do usuário
- `email` - Email único
- `password_hash` - Senha criptografada com bcrypt
- `role` - 'admin' ou 'associado'
- `associado_id` - FK para tabela associados (NULL para admin)
- `ativo` - Status do usuário
- `created_at` - Data de criação

### Tabela: associados
- `id` - ID do associado
- `nome` - Nome completo
- `apelido` - Apelido
- `email` - Email (opcional)
- `telefone` - Telefone (opcional)
- `foto_url` - URL da foto (opcional)
- `ativo` - Status ativo/inativo
- `created_at` - Data de criação

## 🎨 Design

### Cores Principais
- Primary: `#C62828` (vermelho escuro)
- Secondary: `#B71C1C` (vermelho mais escuro)
- Accent: `#EF5350` (vermelho claro)
- Background: `#F5F5F5` (cinza claro)
- Cards: `#FFFFFF` (branco)

### Ícones
- Utilizando **Font Awesome 6.5.1**
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css`

## 🐛 Troubleshooting

### Erro: "bcrypt not found"
```bash
npm install bcrypt
```

### Erro: "invalid_credentials"
- Verifique se email e senha estão corretos
- Para admin, use `admin@admin` com senha do `.env`

### Usuário não consegue acessar após login
- Verificar se role está correto no banco ('admin' ou 'associado')
- Verificar se campo `ativo` está TRUE
- Limpar localStorage e tentar novamente

### Redirecionamento em loop
- Verificar se `ADMIN_JWT_SECRET` está definido no `.env`
- Verificar console do navegador para erros de JWT
- Limpar localStorage completamente

## 📝 Próximos Passos

- [ ] Implementar registro de novos associados pelo admin
- [ ] Adicionar página de perfil para associados editarem seus dados
- [ ] Implementar recuperação de senha por email
- [ ] Adicionar logs de auditoria (quem fez o quê e quando)
- [ ] Implementar níveis de permissão mais granulares
- [ ] Adicionar autenticação de dois fatores (2FA)
