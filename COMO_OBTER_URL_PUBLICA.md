# 🔍 COMO OBTER A URL PÚBLICA DO POSTGRESQL

## ⚠️ IMPORTANTE: Você está no lugar errado!

Na imagem que você mostrou, você está vendo as variáveis do serviço **chuteiracansada** (sua aplicação).

Para obter a URL pública do banco, você precisa acessar o **serviço PostgreSQL**.

---

## 📋 PASSO A PASSO CORRETO

### 1️⃣ Volte para a visualização do projeto

No dashboard do Railway, clique no nome do projeto no topo esquerdo ou use o link:
```
https://railway.app
```

### 2️⃣ Procure o card/serviço PostgreSQL

Você verá **2 serviços**:
- 🟣 **chuteiracansada** (sua aplicação)
- 🐘 **Postgres** (o banco de dados)

**CLIQUE NO CARD DO POSTGRES** (não no chuteiracansada)

### 3️⃣ Acesse a aba "Connect"

Dentro do serviço PostgreSQL, você verá várias abas:
- Deployments
- Variables
- Settings
- **Connect** ← CLIQUE AQUI

### 4️⃣ Copie a URL pública

Na aba Connect, você verá:

**🔒 Private Networking**
- Postgres Connection URL (só funciona dentro do Railway)

**🌐 Public Networking** ← VOCÊ QUER ESTA!
- **Postgres Connection URL** (funciona de qualquer lugar)

A URL pública terá o formato:
```
postgresql://postgres:SENHA_LONGA@roundhouse.proxy.rlwy.net:12345/railway
```

**Copie esta URL pública!**

---

## 🚀 DEPOIS DE COPIAR A URL

Cole a URL aqui no chat ou execute:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\setup-db.ps1
```

E cole a URL quando solicitado.

---

## ❓ E se não tiver o serviço PostgreSQL?

Se você só vê o serviço **chuteiracansada** mas não vê o **Postgres**, você precisa adicionar:

1. No projeto, clique em **[+ New]**
2. Selecione **Database**
3. Clique em **Add PostgreSQL**
4. Aguarde a criação (1-2 minutos)
5. Depois siga os passos acima para obter a URL pública

---

## 🔗 Links Rápidos

- **Projeto Railway**: https://railway.app
- **Dashboard Principal**: https://railway.app/dashboard
