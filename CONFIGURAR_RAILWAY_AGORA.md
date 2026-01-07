# 🚀 Configure Agora no Railway (2 minutos)

## Passo 1: No navegador que abriu

Você verá o painel do Railway com o projeto **Championship Manager**.

## Passo 2: Clique no serviço **chuteiracansada**

Na tela, você verá 2 caixas:
- **Postgres** (banco de dados) ✅ Já está configurado
- **chuteiracansada** (aplicação) ⚠️ Precisa de ajustes

Clique na caixa **chuteiracansada**.

## Passo 3: Vá em "Variables" (Variáveis)

No menu lateral ou abas superiores, clique em **Variables**.

## Passo 4: Adicionar DATABASE_PUBLIC_URL

1. Clique no botão **"+ New Variable"** ou **"Nova Variável"**
2. No campo **Variable Name**: digite exatamente `DATABASE_PUBLIC_URL`
3. No campo **Value**: clique em **"Add a Reference"** ou **"Adicionar Referência"**
4. Selecione o serviço: **Postgres**
5. Selecione a variável: **DATABASE_PUBLIC_URL**
6. Clique em **"Add"** ou **"Adicionar"**

## Passo 5: Ajustar NODE_ENV

1. Na lista de variáveis, encontre **NODE_ENV**
2. Clique no ícone de **editar** (lápis) ao lado dela
3. Mude o valor de `development` para `production`
4. Clique em **"Update"** ou **"Salvar"**

## Passo 6: Salvar e Redeploy

1. As variáveis são salvas automaticamente
2. Clique na aba **"Deployments"** ou **"Implantações"**
3. Clique no botão **"Deploy"** ou nos 3 pontinhos do último deploy → **"Redeploy"**

## ✅ Pronto!

Aguarde 1-2 minutos o build terminar. Depois eu valido o health automaticamente.

---

## 📋 Resumo das Variáveis (para conferir)

Após a configuração, essas devem estar no serviço **chuteiracansada**:

```
DATABASE_PUBLIC_URL=${{Postgres.DATABASE_PUBLIC_URL}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
ADMIN_PASSWORD=troque-essa-senha
ADMIN_JWT_SECRET=gere-um-segredo-longo
```

---

**Me avise quando o redeploy terminar que eu valido o health e os dados!**
