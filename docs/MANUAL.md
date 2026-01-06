# Manual de Uso — Chuteira Cansada

Este manual explica como usar o site no dia a dia.

## Mobile e instalação (PWA)

O site é responsivo e foi otimizado para telas pequenas.

### Dicas no celular

- O menu no topo pode ser rolado horizontalmente.
- Filtros e botões ficam em coluna para facilitar toque.
- Tabelas largas podem ser roladas na horizontal.

### Instalar no celular (Adicionar à tela inicial)

Android/Chrome:

- Abra o site → menu do navegador → **Instalar app** / **Adicionar à tela inicial**.

iPhone/iPad (Safari):

- Abra o site → **Compartilhar** → **Adicionar à Tela de Início**.

> Observação: a instalação funciona melhor em HTTPS (Railway). Em `localhost` também funciona para testes.

## Perfis

### Visitante

- Pode visualizar todas as páginas.
- Pode comentar nos posts do Campeonato.
- Não consegue alterar dados.

### Administrador

- Pode cadastrar/editar/remover dados.
- Pode importar planilhas.
- Pode salvar alterações no servidor.

## Entrar como administrador

1. Abra o site.
2. Clique no botão **“Entrar (Admin)”** no topo.
3. Digite a senha configurada no servidor (`ADMIN_PASSWORD`).
4. As ações administrativas aparecem (botões de adicionar, remover, salvar, importar).

Para sair, clique em **“Sair (Admin)”**.

## Página: Associados

- Objetivo: controlar mensalidades por mês (Jan–Dez).
- Use os campos **Nome** e **Apelido** para pesquisar.
- Use o seletor **Mês** + **Somente pendentes** para ver pendências do mês.

### Editar pagamentos (admin)

- Clique em uma célula (mês) e digite:
  - `Pago`
  - `Pendente`
  - ou um valor tipo `R$ 30,00`

> Dica: `Pago` marca a mensalidade padrão; um valor `R$ ...` registra um valor específico.

### Exportar PDF

- Clique em **Exportar PDF**.
- Ele respeita o filtro de mês e a opção “Somente pendentes”.

### Importar planilha (admin)

- Clique em **Importar Excel**.
- Dica: se Excel der problema, exporte como `.CSV` e importe.
- Use **Baixar template** para ver o formato recomendado.

## Página: Jogadores

- Objetivo: acompanhar jogadores e estatísticas.
- (Admin) pode importar lista por planilha e editar na tabela.

## Página: Gastos

- Objetivo: registrar despesas.
- (Admin) pode adicionar itens e importar planilha.

## Página: Saldo

- Objetivo: acompanhar entradas, gastos e total.
- O sistema soma automaticamente e mostra resumo.

## Página: Classificação

- Objetivo: tabela do campeonato por critérios.
- Editar/ajustar dados de times (admin).

## Página: Campeonato

- Objetivo: registrar jogos, vídeos, imagens e posts.
- Visitante: vê tudo e pode comentar.
- Admin: pode adicionar/remover e salvar.

### Comentários

- Visitantes podem comentar nos posts.
- Os comentários ficam salvos no servidor (quando a API estiver online).

## Dicas de operação

- **Salvar alterações**: após editar tabelas, clique em salvar (admin).
- Se o servidor estiver offline, o site pode avisar que salvou apenas localmente (fallback).

## Offline e cache (PWA)

- O app pode abrir mesmo com internet instável graças ao cache de páginas/arquivos.
- Dados do servidor continuam dependendo da API; o cache não guarda respostas de `/api/*`.

## Solução de problemas

- **Não consigo entrar como admin**: verifique se o servidor está rodando e se `ADMIN_PASSWORD`/`ADMIN_JWT_SECRET` estão configurados.
- **Importação falha**: tente exportar a planilha como `.CSV` e importar.
