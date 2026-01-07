# Railway Deploy - Chuteira Cansada

Este arquivo configura o deploy automático no Railway.

## Variáveis de Ambiente Necessárias

Configure no Railway Dashboard:

- `DATABASE_URL` - URL do PostgreSQL (fornecida automaticamente pelo Railway)
- `ADMIN_PASSWORD` - Senha do administrador
- `ADMIN_JWT_SECRET` - Chave secreta para JWT (string longa e aleatória)
- `PORT` - (opcional) Railway define automaticamente

## Deploy Automático

O Railway detecta automaticamente:
- `package.json` para instalar dependências
- Script `start` para rodar a aplicação
- Migrations SQL são executadas na inicialização

## Primeiro Deploy

1. Conecte o repositório GitHub ao Railway
2. Adicione um PostgreSQL database
3. Configure as variáveis de ambiente
4. O deploy acontece automaticamente no push para `main`

## Verificação

Após o deploy, verifique:
- URL do app fornecida pelo Railway
- Logs de inicialização (migrations, servidor)
- Health check em `/api/health`
