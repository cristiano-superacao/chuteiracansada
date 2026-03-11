# 🚀 Guia Rápido: Testar Sistema Localmente

## Opção 1: PostgreSQL Local com Docker (Mais Rápido) ⚡

### 1. Instalar Docker Desktop
- Baixe: https://www.docker.com/products/docker-desktop/
- Instale e inicie o Docker Desktop

### 2. Criar Container PostgreSQL

```powershell
# Criar e iniciar PostgreSQL em container
docker run --name chuteira-postgres `
  -e POSTGRES_PASSWORD=postgres123 `
  -e POSTGRES_DB=chuteiracansada `
  -p 5432:5432 `
  -d postgres:16-alpine

# Verificar se está rodando
docker ps
```

### 3. Configurar .env

Edite o arquivo `.env` e adicione:

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/chuteiracansada
ADMIN_PASSWORD=admin123
ADMIN_JWT_SECRET=um-segredo-muito-longo-e-aleatorio-aqui-123456789
SESSION_SECRET=outro-segredo-muito-longo-para-sessoes-987654321
NODE_ENV=development
PORT=3000
```

### 4. Popular banco de dados

```powershell
# Instalar dependências (se não fez ainda)
npm install

# Executar seed
npm run seed
```

### 5. Iniciar servidor

```powershell
npm start
```

### 6. Acessar sistema

Abra no navegador: **http://localhost:3000/login.html**

**Credenciais Admin:**
- Email: `(valor de ADMIN_EMAIL no .env)`
- Senha: `admin123`

**Credenciais Associado (exemplo):**
- Email: `carlos.silva@gmail.com`
- Senha: `123456`

---

## Opção 2: Railway (Produção) 🚂

### 1. Criar projeto no Railway
1. Acesse: https://railway.app/
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Provision PostgreSQL"
5. Copie a `DATABASE_URL` gerada

### 2. Configurar variáveis no Railway
No painel do Railway, adicione:
```
DATABASE_URL=(copiado automaticamente)
ADMIN_PASSWORD=admin123
ADMIN_JWT_SECRET=gere-um-segredo-forte-aqui
SESSION_SECRET=gere-outro-segredo-forte-aqui
NODE_ENV=production
```

### 3. Deploy
Conecte seu repositório GitHub ao Railway e faça deploy automático.

### 4. Popular banco (após deploy)
Acesse o terminal do Railway e execute:
```bash
npm run seed
```

---

## Opção 3: PostgreSQL Local (Windows) 💻

### 1. Instalar PostgreSQL
- Baixe: https://www.postgresql.org/download/windows/
- Versão recomendada: 16.x
- Durante instalação, defina senha: `postgres123`
- Porta padrão: `5432`

### 2. Criar banco de dados

Abra **pgAdmin 4** (instalado junto) ou **psql** e execute:

```sql
CREATE DATABASE chuteiracansada;
```

### 3. Configurar .env

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/chuteiracansada
ADMIN_PASSWORD=admin123
ADMIN_JWT_SECRET=um-segredo-muito-longo-e-aleatorio-aqui-123456789
SESSION_SECRET=outro-segredo-muito-longo-para-sessoes-987654321
NODE_ENV=development
PORT=3000
```

### 4. Popular e iniciar
```powershell
npm run seed
npm start
```

---

## ⚠️ Comandos Úteis Docker

```powershell
# Parar container
docker stop chuteira-postgres

# Iniciar container novamente
docker start chuteira-postgres

# Ver logs
docker logs chuteira-postgres

# Remover container (apaga dados!)
docker rm -f chuteira-postgres

# Conectar ao PostgreSQL do container
docker exec -it chuteira-postgres psql -U postgres -d chuteiracansada
```

---

## 📊 Dados do Seed

Após executar o seed, você terá:

- **15 associados** com emails de Gmail
- **15 jogadores** distribuídos em 5 times
- **5 times** na classificação
- **8 gastos** registrados
- **6 entradas** de receita
- **16 jogos** do campeonato
- **3 vídeos** de melhores momentos
- **4 imagens** de jogos
- **3 posts** com comentários
- **180 pagamentos** (15 associados × 12 meses)

---

## 🔍 Solução de Problemas

### Erro: "Banco não configurado"
- Verifique se `DATABASE_URL` está no `.env`
- Teste conexão: `node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"`

### Erro: "ECONNREFUSED"
- PostgreSQL não está rodando
- Docker: `docker start chuteira-postgres`
- Local: Inicie o serviço PostgreSQL

### Erro: "database does not exist"
- Crie o banco: `CREATE DATABASE chuteiracansada;`

### Porta 5432 em uso
- Outro PostgreSQL rodando
- Mude a porta no Docker: `-p 5433:5432`
- Atualize DATABASE_URL: `...@localhost:5433/...`

---

## ✅ Checklist de Teste

Após popular o banco e iniciar o servidor, teste:

- [ ] Login admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD` configurados)
- [ ] Dashboard admin carrega
- [ ] Página de Associados lista 15 pessoas
- [ ] Página de Jogadores lista 15 jogadores
- [ ] Classificação mostra 5 times
- [ ] Gastos mostra 8 registros
- [ ] Saldo calcula corretamente (entradas - gastos)
- [ ] Campeonato mostra 16 jogos
- [ ] Vídeos e imagens carregam
- [ ] Posts aparecem com comentários
- [ ] Logout funciona
- [ ] Login associado (`carlos.silva@gmail.com` / `123456`)
- [ ] Dashboard associado carrega com dados
- [ ] Todas as páginas são responsivas (testar no mobile)

---

**Recomendação:** Use a **Opção 1 (Docker)** - é a mais rápida e fácil! 🐳
