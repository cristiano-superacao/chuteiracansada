# 🚀 Início Rápido - Chuteira Cansada

## ✅ Status Atual do Sistema

Seu sistema está **QUASE PRONTO**! Só falta configurar o banco de dados.

### O que já está implementado:
- ✅ **Backend completo** (Express + PostgreSQL + JWT)
- ✅ **Autenticação tradicional** (email + senha)
- ✅ **Google OAuth** (login com Gmail)
- ✅ **Seed de dados** (460+ registros prontos)
- ✅ **Frontend responsivo** (todas as páginas)
- ✅ **Sistema de pagamentos** (mensalidades dos associados)
- ✅ **Gestão de campeonato** (jogos, classificação, mídia)

### O que falta:
- ⚠️ **DATABASE_URL** no arquivo `.env`
- ⚠️ **SESSION_SECRET** no arquivo `.env`
- ⚠️ **PostgreSQL** rodando (recomendado: Docker)

---

## 🎯 Configuração em 3 Passos (5 minutos)

### **PASSO 1: Iniciar PostgreSQL com Docker**

Abra o PowerShell e execute:

```powershell
docker run --name chuteira-postgres `
  -e POSTGRES_PASSWORD=postgres123 `
  -e POSTGRES_DB=chuteiracansada `
  -p 5432:5432 `
  -d postgres:16-alpine
```

**Não tem Docker?**
- Windows: [Baixe aqui](https://docs.docker.com/desktop/install/windows-install/)
- Alternativa: [PostgreSQL nativo](https://www.postgresql.org/download/windows/)

---

### **PASSO 2: Configurar Variáveis de Ambiente**

Abra o arquivo `.env` na raiz do projeto e **atualize estas linhas**:

```env
# Banco de dados (OBRIGATÓRIO)
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/chuteiracansada

# Autenticação (OBRIGATÓRIO)
ADMIN_PASSWORD=admin123
ADMIN_JWT_SECRET=seu-segredo-jwt-muito-longo-e-aleatorio-12345
SESSION_SECRET=seu-segredo-de-sessao-muito-longo-e-aleatorio-67890

# Servidor
NODE_ENV=development
PORT=3000

# Google OAuth (OPCIONAL - só se quiser testar login com Google)
# GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=seu-client-secret
# GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback
```

**✨ Dica:** Copie e cole exatamente como está acima. Você pode mudar depois!

---

### **PASSO 3: Popular o Banco e Iniciar**

Execute estes 3 comandos no terminal:

```powershell
# 1. Verificar se está tudo OK
node server/test-system.js

# 2. Popular banco com dados de exemplo
node server/seed-database.js

# 3. Iniciar o servidor
npm start
```

---

## 🎉 Pronto! Testando o Sistema

### **Acesse:** http://localhost:3000/login.html

### **Credenciais de Teste:**

| Tipo | Email | Senha | Descrição |
|------|-------|-------|-----------|
| **Admin** | admin@admin | admin123 | Acesso completo ao sistema |
| **Associado** | carlos.silva@gmail.com | 123456 | Dashboard do associado |
| **Associado** | joao.santos@gmail.com | 123456 | Outro associado |

**💡 Total:** 15 associados disponíveis (todos com senha `123456`)

---

## 📱 Páginas Disponíveis

### **Dashboard Admin** (após login como admin):
- 📊 **Dashboard** - Visão geral com estatísticas
- 👥 **Associados** - Gerenciar membros (15 cadastrados)
- ⚽ **Jogadores** - Gerenciar atletas (15 jogadores)
- 🏆 **Classificação** - Tabela do campeonato (5 times)
- 💰 **Gastos** - Controle de despesas (8 registros)
- 💵 **Saldo** - Balanço financeiro
- 🎯 **Campeonato** - Jogos, vídeos, fotos, posts

### **Dashboard Associado** (após login como associado):
- 💳 **Meus Pagamentos** - Histórico de mensalidades (12 meses)
- 📊 **Resumo** - Status financeiro pessoal
- 🏆 **Campeonato** - Visualizar jogos e classificação
- ⚽ **Jogadores** - Ver estatísticas do time

---

## 🔍 Verificação do Sistema

Execute o diagnóstico a qualquer momento:

```powershell
node server/test-system.js
```

Este script verifica:
- ✅ Conexão com banco de dados
- ✅ Variáveis de ambiente configuradas
- ✅ Tabelas criadas
- ✅ Usuários cadastrados

---

## 📦 Dados Incluídos no Seed

Quando você executar `node server/seed-database.js`, serão criados:

| Tabela | Quantidade | Descrição |
|--------|-----------|-----------|
| **Associados** | 15 | Carlos Silva, João Pedro, Rafael... |
| **Usuários** | 15 | Contas de login (senha: 123456) |
| **Jogadores** | 15 | 5 por time (Brasil, Argentina, Alemanha) |
| **Times** | 5 | Brasil (21 pts), Argentina (18 pts)... |
| **Jogos** | 16 | 8 rodadas completas |
| **Pagamentos** | 180 | 15 associados × 12 meses |
| **Gastos** | 8 | Água, bolas, coletes, troféus... |
| **Entradas** | 6 | Mensalidades, patrocínio, rifas... |
| **Vídeos** | 3 | Melhores momentos (YouTube) |
| **Imagens** | 4 | Fotos dos jogos (Unsplash) |
| **Posts** | 3 | Com 5-7 comentários cada |

**Total:** ~460 registros realistas!

---

## 🐛 Problemas Comuns

### ❌ "Banco não configurado"
**Solução:** Verifique se o Docker está rodando e se `DATABASE_URL` está no `.env`

```powershell
# Verificar se o container está ativo
docker ps

# Se não estiver, inicie:
docker start chuteira-postgres
```

---

### ❌ "ECONNREFUSED ::1:5432"
**Solução:** PostgreSQL não está rodando

```powershell
# Inicie o container Docker
docker start chuteira-postgres

# Ou verifique se a porta está correta
netstat -an | findstr :5432
```

---

### ❌ "password authentication failed"
**Solução:** Senha do PostgreSQL está incorreta

No `.env`, certifique-se que a senha é `postgres123`:
```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/chuteiracansada
```

---

### ⚠️ "database does not exist"
**Solução:** Recrie o banco de dados

```powershell
# Conecte ao PostgreSQL
docker exec -it chuteira-postgres psql -U postgres

# No terminal do psql, execute:
CREATE DATABASE chuteiracansada;
\q
```

---

## 🔐 Google OAuth (Opcional)

O login com Google já está implementado, mas precisa de configuração:

1. **Acesse:** [Google Cloud Console](https://console.cloud.google.com)
2. **Crie um projeto**
3. **Ative** Google+ API
4. **Configure** OAuth Consent Screen
5. **Crie** credenciais OAuth 2.0
6. **Adicione no .env:**
   ```env
   GOOGLE_CLIENT_ID=seu-id-aqui.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=seu-secret-aqui
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback
   ```

**📖 Guia completo:** [GOOGLE_OAUTH.md](GOOGLE_OAUTH.md)

---

## 📖 Documentação Adicional

- **[TESTAR_LOCALMENTE.md](TESTAR_LOCALMENTE.md)** - Opções avançadas de configuração
- **[AUTH_README.md](AUTH_README.md)** - Sistema de autenticação
- **[GOOGLE_OAUTH.md](GOOGLE_OAUTH.md)** - Configuração Google OAuth
- **[README.md](README.md)** - Documentação completa do projeto

---

## 🎯 Checklist de Teste

Após iniciar o sistema, teste:

- [ ] Login admin funciona (admin@admin / admin123)
- [ ] Dashboard admin carrega
- [ ] Página de Associados lista 15 pessoas
- [ ] Página de Jogadores mostra 15 atletas
- [ ] Classificação exibe 5 times ordenados
- [ ] Gastos mostra 8 registros
- [ ] Saldo calcula corretamente
- [ ] Campeonato exibe 16 jogos
- [ ] Logout redireciona para login
- [ ] Login associado funciona (carlos.silva@gmail.com / 123456)
- [ ] Dashboard associado carrega
- [ ] Pagamentos do associado aparecem (12 meses)
- [ ] Layout é responsivo em mobile (F12 > dispositivo móvel)
- [ ] (Opcional) Login com Google funciona

---

## 🆘 Precisa de Ajuda?

1. **Execute o diagnóstico:**
   ```powershell
   node server/test-system.js
   ```

2. **Verifique os logs do Docker:**
   ```powershell
   docker logs chuteira-postgres
   ```

3. **Reinicie tudo:**
   ```powershell
   # Parar servidor (Ctrl+C no terminal do npm start)
   docker restart chuteira-postgres
   npm start
   ```

---

## 🎊 Sucesso!

Se você chegou até aqui e tudo está funcionando:

**🎉 PARABÉNS!** Seu sistema de gestão da Chuteira Cansada está operacional!

Agora você pode:
- ✅ Cadastrar novos associados
- ✅ Gerenciar jogadores e times
- ✅ Controlar pagamentos de mensalidades
- ✅ Registrar gastos e entradas
- ✅ Acompanhar o campeonato
- ✅ Ver relatórios e saldo

**Próximo passo:** Deploy para produção (Railway, Vercel, ou outro serviço)

---

**Desenvolvido com ❤️ para a Chuteira Cansada**
