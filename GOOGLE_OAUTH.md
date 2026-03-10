# 🔐 Configuração do Login com Google OAuth

Este documento explica como configurar o login com Google OAuth para permitir que associados façam login usando suas contas do Gmail.

## ℹ️ Visão Geral

O sistema agora suporta **duas formas de login**:

1. **Login Tradicional**: Email + senha (para admin e associados)
2. **Login com Google**: Apenas para associados (usando Gmail cadastrado)

### Fluxo de Autenticação

```
Usuário clica "Entrar com Google"
    ↓
Redireciona para Google OAuth
    ↓
Usuário faz login no Google
    ↓
Google redireciona para /api/oauth/google/callback
    ↓
Sistema verifica se existe usuário com aquele email
    ↓
Se existe: gera JWT e redireciona para /inicio.html
Se não existe: redireciona para /login.html com erro
```

## 📋 Pré-requisitos

- Conta no Google Cloud Console
- Domínio configurado (produção) ou localhost (desenvolvimento)
- Variáveis de ambiente configuradas no Railway ou .env

## 🚀 Configuração Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Select a project"** → **"New Project"**
3. Nome do projeto: `Chuteira Cansada` (ou nome desejado)
4. Clique em **"Create"**

### 2. Ativar Google+ API

1. No menu lateral, vá em **"APIs & Services"** → **"Library"**
2. Pesquise por **"Google+ API"**
3. Clique em **"Enable"**

### 3. Configurar OAuth Consent Screen

1. No menu lateral, vá em **"APIs & Services"** → **"OAuth consent screen"**
2. Selecione **"External"** (para permitir qualquer conta Google)
3. Clique em **"Create"**

**Preencha os campos:**
- **App name**: `Chuteira Cansada`
- **User support email**: Seu email
- **App logo**: (opcional) Faça upload do logo do sistema
- **Authorized domains**: 
  - Produção: `seu-dominio.com`
  - Railway: `up.railway.app`
- **Developer contact information**: Seu email

4. Clique em **"Save and Continue"**

**Scopes (Escopos):**
1. Clique em **"Add or Remove Scopes"**
2. Selecione:
   - `userinfo.email` (para obter email)
   - `userinfo.profile` (para obter nome e foto)
3. Clique em **"Update"** → **"Save and Continue"**

**Test Users (Usuários de teste):**
- Durante o desenvolvimento, adicione os emails dos associados
- Em produção, publique o app (botão "Publish App")

5. Clique em **"Save and Continue"** → **"Back to Dashboard"**

### 4. Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **"APIs & Services"** → **"Credentials"**
2. Clique em **"Create Credentials"** → **"OAuth client ID"**
3. Selecione **"Web application"**

**Preencha os campos:**
- **Name**: `Chuteira Cansada Web Client`

**Authorized JavaScript origins:**
```
http://localhost:3000
https://seu-dominio.com
https://seu-app.up.railway.app
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/oauth/google/callback
https://seu-dominio.com/api/oauth/google/callback
https://seu-app.up.railway.app/api/oauth/google/callback
```

4. Clique em **"Create"**
5. **COPIE** o `Client ID` e `Client Secret` (você vai usar no próximo passo)

### 5. Configurar Variáveis de Ambiente

#### Desenvolvimento Local (.env)

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
# Configurações existentes
DATABASE_URL=sua-url-do-banco
ADMIN_PASSWORD=sua-senha-admin
ADMIN_JWT_SECRET=seu-segredo-jwt
SESSION_SECRET=um-segredo-diferente-para-sessoes

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback
```

#### Produção (Railway)

No painel do Railway:
1. Selecione seu projeto
2. Vá em **"Variables"**
3. Adicione as variáveis:

```
GOOGLE_CLIENT_ID = 123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL = https://seu-app.up.railway.app/api/oauth/google/callback
SESSION_SECRET = gere-um-segredo-forte-com-openssl-rand-hex-32
```

4. Clique em **"Deploy"** para aplicar as mudanças

### 6. Cadastrar Associado com Gmail

Para que um associado possa fazer login com Google, **o email dele no sistema deve ser o mesmo do Gmail**.

**Opção 1: Via SQL**
```sql
-- Criar associado
INSERT INTO associados (nome, apelido, email, telefone, ativo)
VALUES ('João Silva', 'João', 'joao.silva@gmail.com', '11999999999', TRUE);

-- Criar usuário (sem senha, pois vai usar Google OAuth)
INSERT INTO users (email, password_hash, role, associado_id, ativo)
VALUES (
  'joao.silva@gmail.com',
  'oauth_google', -- placeholder, não será usado
  'associado',
  (SELECT id FROM associados WHERE email = 'joao.silva@gmail.com'),
  TRUE
);
```

**Opção 2: Via Script Node.js**

Edite o arquivo `server/create-user.js` e descomente:
```javascript
createAssociadoUser(
  'João Silva',                  // nome
  'João',                        // apelido
  'joao.silva@gmail.com',       // email (DEVE ser Gmail)
  'senha-temporaria-123',       // senha (opcional para OAuth)
  '11999999999'                 // telefone
);
```

Execute:
```bash
node server/create-user.js
```

### 7. Testar Login com Google

1. Inicie o servidor: `npm start`
2. Acesse: http://localhost:3000/login.html
3. Clique em **"Entrar com Google"**
4. Faça login com a conta do Gmail cadastrada
5. Você será redirecionado para o dashboard de associado (`/inicio.html`)

## 🔒 Segurança

### Boas Práticas

✅ **Client Secret**: Nunca exponha no código front-end (sempre no .env)
✅ **HTTPS em Produção**: O Google exige HTTPS para OAuth em produção
✅ **Sessões Seguras**: Use `SESSION_SECRET` forte (32+ caracteres aleatórios)
✅ **Domínios Autorizados**: Adicione apenas domínios confiáveis
✅ **Validação de Email**: Sistema verifica se email existe no banco antes do login

### Geração de Secrets

```bash
# Gerar SESSION_SECRET forte
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: URL de callback não está autorizada no Google Cloud Console

**Solução**:
1. Vá em Google Cloud Console → Credentials
2. Edite o OAuth Client ID
3. Adicione o callback exato em "Authorized redirect URIs":
   - `http://localhost:3000/api/oauth/google/callback` (dev)
   - `https://seu-dominio.com/api/oauth/google/callback` (prod)

### Erro: "Usuário não encontrado"

**Causa**: Email do Google não está cadastrado no banco de dados

**Solução**:
1. Cadastre o associado no banco usando o mesmo email do Gmail
2. Verifique se `users.email` é exatamente o mesmo do Google (case-insensitive)

### Erro: "google_not_configured"

**Causa**: Variáveis `GOOGLE_CLIENT_ID` ou `GOOGLE_CLIENT_SECRET` não estão configuradas

**Solução**:
1. Verifique se as variáveis estão no `.env` (local) ou Railway (produção)
2. Reinicie o servidor após adicionar variáveis

### Botão "Entrar com Google" não funciona

**Causa**: Cliente JavaScript não autorizado

**Solução**:
1. Vá em Google Cloud Console → Credentials
2. Adicione a origem em "Authorized JavaScript origins":
   - `http://localhost:3000` (dev)
   - `https://seu-dominio.com` (prod)

## 📱 Experiência do Usuário

### Fluxo de Login para Associados

1. **Primeira vez**:
   - Usuário clica "Entrar com Google"
   - Faz login no Google
   - Autoriza o app (tela de consentimento)
   - É redirecionado automaticamente para o dashboard

2. **Logins seguintes**:
   - Usuário clica "Entrar com Google"
   - Já está logado no Google → redirecionamento direto (sem pedir senha)
   - Entra no dashboard automaticamente

### Vantagens do OAuth

✅ **Sem senha para lembrar**: Associados não precisam criar/lembrar senha
✅ **Mais seguro**: Autenticação gerenciada pelo Google
✅ **Rápido**: Login em 1 clique (se já logado no Google)
✅ **Foto de Perfil**: Sistema captura foto do Google automaticamente
✅ **Mobile-friendly**: Integração nativa com app Google no celular

## 📊 Monitoramento

### Logs do Google OAuth

O servidor registra eventos no console:
```
✅ Login Google: joao.silva@gmail.com (role: associado)
❌ Login Google falhou: email não encontrado
⚠️  Google OAuth não configurado - variáveis ausentes
```

### Métricas de Uso

No Google Cloud Console:
1. Vá em **"APIs & Services"** → **"Dashboard"**
2. Visualize:
   - Quantidade de logins por dia
   - Taxa de erro
   - Usuários ativos

## 🔄 Desativar Google OAuth

Se desejar remover o login com Google:

1. Remova as variáveis do `.env` ou Railway:
   ```
   # GOOGLE_CLIENT_ID=...
   # GOOGLE_CLIENT_SECRET=...
   # GOOGLE_CALLBACK_URL=...
   ```

2. O botão "Entrar com Google" continuará visível, mas ao clicar mostrará erro "google_not_configured"

3. **(Opcional)** Remova o botão do `login.html` editando a seção:
   ```html
   <!-- Remover estas linhas -->
   <a href="/api/oauth/google" class="btn-google">...</a>
   ```

## 📚 Referências

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Cloud Console](https://console.cloud.google.com/)

## 📄 Arquivos Modificados

- `package.json` - Adicionadas dependências de OAuth
- `server/index.js` - Configuração de sessão e Passport
- `server/routes/oauth.js` - **NOVO** rotas de OAuth
- `login.html` - Botão "Entrar com Google" + lógica de callback
- `.env.example` - Variáveis de exemplo

---

**Implementado em**: 9 de março de 2026
**Sistema**: Chuteira Cansada v2.0
**Autor**: Cristiano Superação
