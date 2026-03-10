# 🚀 Configurar Banco de Dados SEM Docker

## 📋 Situação Atual

Seu sistema está **quase pronto**! Falta apenas configurar o banco de dados PostgreSQL.

Como o Docker não está instalado, vou mostrar **2 opções gratuitas e rápidas**:

---

## 🆓 OPÇÃO 1: Railway (Recomendada - 2 minutos)

Railway oferece PostgreSQL gratuito e é perfeito para testes.

### Passo 1: Criar Conta

1. Acesse: https://railway.app/
2. Clique em **"Start a New Project"**
3. Faça login com GitHub
4. Você ganha **$5 grátis** por mês (suficiente para testes)

### Passo 2: Criar Banco PostgreSQL

1. No dashboard do Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Aguarde 10-20 segundos (Railway está criando seu banco)
4. O banco estará pronto quando aparecer o ícone verde

### Passo 3: Copiar DATABASE_URL

1. Clique no serviço **PostgreSQL** que acabou de criar
2. Vá na aba **"Connect"**
3. Copie o valor de **"Postgres Connection URL"**
   
   Exemplo:
   ```
   postgresql://postgres:senha123abc@roundhouse.proxy.rlwy.net:12345/railway
   ```

### Passo 4: Configurar .env

Abra o arquivo `.env` na raiz do projeto e adicione:

```env
DATABASE_URL=postgresql://postgres:senha123abc@roundhouse.proxy.rlwy.net:12345/railway

# Adicione também (gere um valor aleatório longo)
SESSION_SECRET=seu-secret-muito-longo-e-aleatorio-aqui-123456789abcdef
```

**💡 Dica:** Para gerar o SESSION_SECRET, use este comando no PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Passo 5: Popular Banco e Testar

```powershell
# 1. Verificar conexão
node server/test-system.js

# 2. Popular banco com dados de teste (460+ registros)
node server/seed-database.js

# 3. Iniciar servidor
npm start
```

### Passo 6: Acessar Sistema

Abra o navegador em: **http://localhost:3000/login.html**

**Credenciais:**
- Admin: `admin@admin` / `(valor de ADMIN_PASSWORD no .env)`
- Associado: `carlos.silva@gmail.com` / `123456`

---

## 🌐 OPÇÃO 2: Neon (PostgreSQL Gratuito)

Neon é outro serviço gratuito de PostgreSQL na nuvem.

### Passo 1: Criar Conta

1. Acesse: https://neon.tech/
2. Clique em **"Sign Up"**
3. Faça login com GitHub ou Google
4. **Plano Free:** 0.5 GB (suficiente para seu projeto)

### Passo 2: Criar Projeto

1. No dashboard, clique em **"Create a project"**
2. **Project name:** `chuteira-cansada`
3. **PostgreSQL version:** 16 (mais recente)
4. **Region:** Escolha a mais próxima (ex: São Paulo)
5. Clique em **"Create Project"**

### Passo 3: Copiar Connection String

1. Na página do projeto, clique em **"Connection Details"**
2. Copie o **"Connection string"**
   
   Exemplo:
   ```
   postgresql://neondb_owner:senha@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Passo 4: Configurar .env

```env
DATABASE_URL=postgresql://neondb_owner:senha@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

SESSION_SECRET=gere-um-valor-aleatorio-longo-aqui
```

### Passo 5: Popular e Testar

```powershell
node server/test-system.js
node server/seed-database.js
npm start
```

---

## 🐘 OPÇÃO 3: ElephantSQL (Simples)

Outra alternativa gratuita com 20 MB (suficiente para testes).

### Passo 1: Criar Conta

1. Acesse: https://www.elephantsql.com/
2. Clique em **"Get a managed database today"**
3. Faça login com GitHub ou Google
4. Plano **"Tiny Turtle"** (FREE)

### Passo 2: Criar Instância

1. Clique em **"Create New Instance"**
2. **Name:** `chuteira-cansada`
3. **Plan:** Tiny Turtle (FREE)
4. **Region:** Escolha a mais próxima
5. Clique em **"Create instance"**

### Passo 3: Copiar URL

1. Clique na instância criada
2. Copie o valor de **"URL"**
   
   Exemplo:
   ```
   postgres://usuario:senha@ziggy.db.elephantsql.com/usuario
   ```

### Passo 4: Configurar e Testar

No arquivo `.env`:
```env
DATABASE_URL=postgres://usuario:senha@ziggy.db.elephantsql.com/usuario

SESSION_SECRET=seu-secret-longo-aleatorio
```

Execute:
```powershell
node server/test-system.js
node server/seed-database.js
npm start
```

---

## 💻 OPÇÃO 4: PostgreSQL Local (Windows)

Se preferir instalar o PostgreSQL no Windows:

### Passo 1: Baixar e Instalar

1. Acesse: https://www.postgresql.org/download/windows/
2. Baixe o instalador (PostgreSQL 16)
3. Execute o instalador
4. Durante a instalação:
   - **Senha do superusuário:** `postgres123` (anote!)
   - **Porta:** `5432` (padrão)
   - Instale **pgAdmin** (interface gráfica)

### Passo 2: Criar Banco de Dados

**Opção A: Via pgAdmin (interface gráfica)**

1. Abra **pgAdmin**
2. Conecte ao servidor local (senha: `postgres123`)
3. Clique com botão direito em **"Databases"**
4. Selecione **"Create" → "Database"**
5. **Database name:** `chuteiracansada`
6. Clique em **"Save"**

**Opção B: Via terminal (PowerShell)**

```powershell
# Conectar ao PostgreSQL
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres

# No prompt do psql, execute:
CREATE DATABASE chuteiracansada;
\q
```

### Passo 3: Configurar .env

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/chuteiracansada

SESSION_SECRET=gere-um-valor-aleatorio
```

### Passo 4: Popular e Testar

```powershell
node server/test-system.js
node server/seed-database.js
npm start
```

---

## 🔍 Comparação das Opções

| Opção | Tempo Setup | Grátis | Tamanho | Complexidade |
|-------|-------------|--------|---------|--------------|
| **Railway** | 2 min | Sim ($5/mês) | 1 GB | ⭐ Fácil |
| **Neon** | 3 min | Sim | 0.5 GB | ⭐ Fácil |
| **ElephantSQL** | 3 min | Sim | 20 MB | ⭐ Fácil |
| **PostgreSQL Local** | 10 min | Sim | Ilimitado | ⭐⭐ Médio |

**💡 Recomendação:** Use **Railway** se quer rapidez, ou **PostgreSQL Local** se quer controle total.

---

## ✅ Depois de Configurar

Execute esta sequência:

```powershell
# 1. Diagnóstico (deve mostrar ✅ em tudo)
node server/test-system.js

# 2. Popular banco
node server/seed-database.js

# 3. Iniciar servidor
npm start

# 4. Acessar no navegador
# http://localhost:3000/login.html
```

---

## 🎉 Sistema Completo

Após a configuração, você terá:

✅ **15 associados** cadastrados  
✅ **15 jogadores** em 5 times  
✅ **180 pagamentos** (12 meses)  
✅ **16 jogos** de campeonato  
✅ **Sistema financeiro** (gastos + entradas)  
✅ **Campeonato completo** (vídeos, fotos, posts)  
✅ **Autenticação** (admin + associados)  
✅ **Google OAuth** (login com Gmail)  

---

## 🆘 Problemas?

### ❌ "Banco não configurado"
→ Verifique se `DATABASE_URL` está no `.env` sem estar vazio

### ❌ "ECONNREFUSED"
→ O banco não está acessível. Teste a URL em um cliente PostgreSQL

### ❌ "authentication failed"
→ Senha incorreta no `DATABASE_URL`

### ❌ "database does not exist"
→ Crie o banco primeiro (veja opção escolhida acima)

---

## 📖 Próximos Passos

1. **Escolha UMA das opções acima** (Railway é mais rápida)
2. **Configure o DATABASE_URL no .env**
3. **Execute node server/test-system.js** (deve aparecer ✅)
4. **Execute node server/seed-database.js** (popula o banco)
5. **Execute npm start** (inicia o servidor)
6. **Acesse http://localhost:3000/login.html**

---

**🚀 Escolha Railway e estará rodando em 2 minutos!**
