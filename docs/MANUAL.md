# Manual de Uso — Chuteira Cansada

Este manual explica como usar o site no dia a dia.

## ✨ Funcionalidades Principais

### Tema Claro/Escuro/Sistema

**Alternar tema:**
1. Clique no botão de tema no topo (com ícone ☀️/🌙/💻)
2. Escolha entre:
   - **Claro**: tema sempre claro
   - **Escuro**: tema sempre escuro
   - **Sistema**: acompanha a preferência do seu dispositivo

A preferência é salva e mantida entre visitas.

### Feedback Visual

**Progress Bar (barra de progresso):**
- Aparece no topo durante carregamentos
- Indica que a requisição está em andamento
- Desaparece automaticamente ao concluir

**Skeleton Loading:**
- Tabelas mostram um efeito de "shimmer" durante carregamento
- Indica que os dados estão sendo buscados

**Toasts (notificações):**
- Mensagens que aparecem no canto da tela
- Confirmam ações realizadas (salvar, deletar, etc.)
- Desaparecem automaticamente após alguns segundos

### Navegação

- Link ativo destacado automaticamente no menu
- Use `Tab` para navegar pelo teclado
- Link "Pular para conteúdo" (visível ao pressionar `Tab`)

## Mobile e instalação (PWA)

O site é totalmente responsivo e otimizado para telas pequenas.

### Melhorias mobile

**Navegação:**
- Menu pode ser rolado horizontalmente
- Máscaras visuais indicam mais itens disponíveis

**Botões e controles:**
- Touch targets de 44x44px (padrão de acessibilidade)
- Espaçamento adequado para toques precisos

**Tabelas:**
- Scroll horizontal para tabelas largas
- Primeira coluna (nome) fica fixa ao rolar
- Última coluna (ações) também fica fixa
- Listras sutis melhoram a leitura

**Filtros e ações:**
- Layout em grid 2 colunas
- Botões primários ocupam largura total
- Campos organizados verticalmente

**Animações:**
- Reduzidas automaticamente se o sistema tiver `prefers-reduced-motion`

### Instalar no celular (Adicionar à tela inicial)

**Benefícios:**
- Ícone próprio na tela inicial
- Abre em tela cheia (sem barra do navegador)
- Funciona offline (páginas cacheadas)
- Atualizações automáticas

**Android/Chrome:**

1. Abra o site no Chrome
2. Toque no menu (3 pontos verticais)
3. Selecione **"Instalar app"** ou **"Adicionar à tela inicial"**
4. Confirme a instalação
5. O ícone aparecerá na tela inicial

**iPhone/iPad (Safari):**

1. Abra o site no Safari
2. Toque no botão **"Compartilhar"** (🔼 na barra inferior)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Edite o nome se desejar
5. Toque em **"Adicionar"**

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

**Objetivo:** controlar mensalidades por mês (Janeiro a Dezembro).

### Filtros e pesquisa

- **Nome/Apelido**: pesquisa instantânea enquanto digita
- **Ano**: seleciona qual ano visualizar
- **Mês**: filtra pelo mês específico
- **Somente pendentes**: mostra apenas associados com pendências

### Paginação

- Tabela exibe 10 associados por vez
- Use botões **Anterior/Próxima** para navegar
- Filtros afetam todas as páginas

### Lista de Inadimplentes

**Como funciona:**
- Considera apenas meses após o 5º dia útil
- Feriados podem ser configurados (admin)
- Mostra total de meses em aberto
- Calcula valor total devido (R$ 30/mês padrão)

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

**Como funciona:**
- Páginas e arquivos são cacheados automaticamente
- Site abre mesmo com internet instável
- Dados da API continuam precisando de conexão
- Atualizações do site são aplicadas automaticamente

**Indicadores visuais:**
- Progress bar mostra quando está carregando
- Skeleton loading em tabelas durante busca
- Toasts confirmam quando ações são salvas

**Fallback offline:**
- Se o servidor estiver offline, dados são salvos localmente
- Toast avisa "Salvou apenas localmente"
- Sincroniza automaticamente quando voltar online

## ♿ Acessibilidade

### Navegação por teclado

- `Tab`: próximo elemento
- `Shift + Tab`: elemento anterior
- `Enter`: ativar botão/link
- `Esc`: fechar modais (futuro)

### Leitores de tela

- ARIA labels em todos os controles
- Estados de carregamento anunciados
- Toasts são lidos automaticamente
- Tabelas com cabeçalhos descritivos

### Preferências do sistema

- **Tema**: detecta preferência de claro/escuro
- **Movimento**: desabilita animações se configurado
- **Contraste**: segue padrões WCAG 2.1 (nível AA)

## Solução de problemas

- **Não consigo entrar como admin**: verifique se o servidor está rodando e se `ADMIN_PASSWORD`/`ADMIN_JWT_SECRET` estão configurados.
- **Importação falha**: tente exportar a planilha como `.CSV` e importar.
