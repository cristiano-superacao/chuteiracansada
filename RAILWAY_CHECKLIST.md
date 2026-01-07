# ✅ Checklist de Deploy no Railway

**Status Atual:** Código 100% pronto, falta apenas conectar o Postgres ao app no Railway.

---

## 🔍 Diagnóstico Rápido

O site está no ar (`https://chuteiracansada.up.railway.app`), mas o Postgres **NÃO** está conectado:

- `/api/health` retorna: `{"ok":true,"db":{"enabled":false,"connected":false}}`
- `/api/data` retorna: **503 Service Unavailable**

**Causa:** O serviço do app (`chuteiracansada`) não tem a variável `DATABASE_URL` configurada ou está usando apenas a URL interna (`postgres.railway.internal`) sem fallback público.

---

## 🛠️ Como Corrigir (Passo a Passo)

### 1. Acessar o Railway
- Entre em: https://railway.app
- Abra o projeto **"Gerente de Campeonato"** (ou nome do seu projeto)

### 2. Identificar os Serviços
Você deve ter 2 serviços:
- **Postgres** (banco de dados)
- **chuteiracansada** (aplicação Node.js)

### 3. Configurar Variáveis no App

#### 3.1 Conectar ao Postgres
1. Clique no serviço **`chuteiracansada`** (NÃO no Postgres)
2. Vá em **Variáveis** (Variables)
3. Clique em **"+ Nova variável"** ou **"Adicionar referência"**
4. Configure:
  - **Nome**: `DATABASE_PUBLIC_URL` (recomendado)
  - **Valor**: **"Adicionar referência de variável"** → Serviço **Postgres** → **`DATABASE_PUBLIC_URL`** (proxy público)
  - Opcional: também adicione `DATABASE_URL` referenciando **`DATABASE_URL`** (interno)
  - Se ocorrer `ETIMEDOUT` usando a URL interna, prefira a variável pública

#### 3.2 Criar Variáveis de Segurança
No mesmo serviço `chuteiracansada`, adicione:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `ADMIN_PASSWORD` | `sua-senha-forte` | Senha para login admin |
| `ADMIN_JWT_SECRET` | `string-aleatoria-40-caracteres-ou-mais` | Segredo JWT (gere em: https://randomkeygen.com) |
| `NODE_ENV` | `production` | (Opcional) Define ambiente de produção |

#### 3.3 Exemplo de Valores
```
# Preferir a URL pública como fallback universal
DATABASE_PUBLIC_URL=${{Postgres.DATABASE_PUBLIC_URL}}
# (Opcional) manter também a interna
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_PASSWORD=MinhaSenh@Forte123
ADMIN_JWT_SECRET=a8f5f167f44f4964e6c998dee827110c
NODE_ENV=production
```

### 4. Redeploy
1. Ainda no serviço `chuteiracansada`, vá em **Implantações** (Deployments)
2. Clique nos 3 pontinhos do último deploy → **Redeploy**
3. Aguarde o build finalizar (1-3 minutos)
4. Se ver erros `ETIMEDOUT` para Postgres nos logs, confira se `DATABASE_PUBLIC_URL` está configurada no serviço do app e tente redeploy

---

## ✅ Como Validar que Funcionou

### Teste 1: Health Check
Acesse: https://chuteiracansada.up.railway.app/api/health

**✅ Esperado:**
```json
{
  "ok": true,
  "db": {
    "enabled": true,
    "connected": true
  }
}
```

### Teste 2: API de Dados
Acesse: https://chuteiracansada.up.railway.app/api/data

**✅ Esperado:** JSON com dados (não 503)

### Teste 3: Login Admin
1. Abra: https://chuteiracansada.up.railway.app
2. Clique em **"Entrar (Admin)"**
3. Digite a senha que você configurou em `ADMIN_PASSWORD`
4. Deve aparecer: **"✅ Login feito com sucesso"**

### Teste 4: Salvar Dados
1. Estando logado como admin, edite algo (ex.: adicione um time na Classificação)
2. Clique em **"Salvar alterações"**
3. Deve aparecer: **"✅ Salvo com sucesso"**
4. Recarregue a página (F5) → os dados devem permanecer
5. Abra em outro dispositivo/navegador → deve ver os mesmos dados

---

## 🐛 Troubleshooting

### Problema: Ainda dá 503 após redeploy
**Causa:** Variável `DATABASE_URL` não foi configurada corretamente.

**Solução:**
1. Verifique se a variável existe em `chuteiracansada` → Variáveis
2. Teste o valor: copie a URL e tente conectar via `psql` ou DBeaver
3. Se necessário, copie `URL_PUBLICA_DO_BANCO_DE_DADOS` do Postgres e cole manualmente

### Problema: Login admin não funciona
**Causa:** `ADMIN_PASSWORD` ou `ADMIN_JWT_SECRET` não configurados.

**Solução:**
1. Confira se as variáveis existem em `chuteiracansada` → Variáveis
2. Se criou agora, faça **Redeploy**
3. Teste com a senha exata (case-sensitive)

### Problema: Deploy falha
**Causa:** Erro no código ou dependências.

**Solução:**
1. Vá em **Implantações** → clique no deploy que falhou
2. Leia os logs para identificar o erro
3. Se for `npm install`, pode ser falta de memória → tente redeploy novamente

---

## 📊 Arquitetura Técnica

### Tabelas Criadas Automaticamente
Ao conectar o Postgres, o app roda `server/schema.sql` e cria:

- `app_config` (configurações globais: inadimplência, feriados)
- `associados` + `associados_pagamentos` (1 associado → 12 meses)
- `jogadores` (nome, time, gols, cartões, suspensões)
- `gastos` e `entradas` (controle financeiro)
- `times` (classificação do campeonato)
- `campeonato_jogos`, `campeonato_videos`, `campeonato_imagens`, `campeonato_posts`, `campeonato_comentarios`

### Rotas da API
- `POST /api/auth/login` → gera JWT (8h)
- `GET /api/auth/me` → valida token
- `GET /api/data` → carrega tudo (público)
- `PUT /api/data` → salva tudo (admin-only)
- `POST /api/campeonato/posts/:id/comentarios` → cria comentário (público)
- CRUD individual: `/api/associados`, `/api/jogadores`, etc. (admin-only)

---

## 🎯 Próximos Passos (Opcional)

1. **Backup:** Configure backup automático no Railway (Settings → Backups)
2. **Domínio:** Adicione domínio próprio (Settings → Domains)
3. **Monitoramento:** Ative alertas de uptime/downtime
4. **Seed Data:** Importe dados iniciais via "Importar Excel" na página Associados

---

## 📞 Suporte

Se precisar de ajuda, compartilhe:
- Screenshot da tela **Variáveis** do serviço `chuteiracansada`
- Logs do último deploy (se houver erro)
- URL do endpoint `/api/health`
