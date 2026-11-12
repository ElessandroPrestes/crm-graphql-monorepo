# Discovery — Fase 4: front-end

## Metadados

| Campo       | Valor                                                                                |
| ----------- | ------------------------------------------------------------------------------------ |
| Status      | Aceito em 2026-11-11                                                                 |
| Responsável | Descoberta de produto/UX e engenharia                                                |
| Criado      | 2026-11-11                                                                           |
| Atualizado  | 2026-11-11                                                                           |
| SPEC alvo   | SPEC-005                                                                             |
| Fontes      | `PROJECT.md`, `ROADMAP.md`, `docs/a11y.md`, ADR-002, ADR-004, código das Fases 1 a 3 |

## Fatos conhecidos

- `apps/web` é um shell React 19.3.1 + Vite 8.3.7 + React Router 7.18.5 +
  Tailwind CSS 4.3.5, servido em `http://localhost:5217` com `strictPort`.
- O shell atual tem uma única rota (`/`), link de salto, landmarks, título por
  rota e anúncio de navegação. Não há autenticação, cliente GraphQL, estado de
  servidor, formulários, tabelas, kanban, inbox, i18n ou tema claro.
- A API expõe autenticação REST em `/auth/login`, `/auth/refresh`,
  `/auth/logout` e `/auth/me`, com access token JWT curto (15 min por padrão)
  e refresh opaco em cookie `HttpOnly`, `SameSite=Strict`, `path=/auth`.
- GraphQL HTTP e subscriptions `graphql-ws` usam o mesmo caminho `/graphql`; a
  conexão WebSocket autentica pelo `connection_init` com `Authorization:
Bearer <access token>`.
- CORS padrão aceita `http://localhost:5217`, com `credentials: true`,
  métodos `GET`/`POST`/`OPTIONS` e headers `Content-Type`, `Authorization`,
  `X-Request-Id` e `X-CSRF-Token`.
- O schema GraphQL já entrega contatos, empresas, negócios, atividades,
  conversas, mensagens, métricas, `sendMessage`, `dealMoved` e
  `messageReceived`.
- A autorização por propriedade é aplicada no servidor; `ADMIN` acessa todos os
  registros e `SELLER` apenas os próprios.
- `TASK-004-01` encerrou a Fase 3 com API e worker completos, mas não há
  nenhuma tela de produto para validar os fluxos ponta a ponta.
- O roadmap da Fase 4 exige login/sessão, lista de contatos com busca e
  filtros, visão 360°, kanban acessível, inbox em tempo real e dashboard com
  i18n pt-BR e temas claro/escuro.

## Lacunas entre o schema atual e a Fase 4

| Necessidade de UI                    | Situação atual no schema/API                            | Impacto                                                               |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Busca e filtros de contatos          | `contacts` só aceita `first` e `after`                  | Busca precisaria baixar todas as páginas no cliente                   |
| Negócios de um contato na visão 360° | `deals` não aceita `contactId`                          | A tela não consegue montar a lista sem varrer todas as páginas        |
| Colunas do kanban por etapa          | `deals` não aceita filtro de etapa                      | O kanban precisaria baixar o funil inteiro e agrupar no cliente       |
| Inbox por contato                    | `conversations` não aceita `contactId`                  | A visão 360° não consegue abrir a conversa do contato de forma direta |
| Filtro de empresa                    | `contacts` não aceita `companyId`                       | Filtro dependeria de junção no cliente                                |
| Identificação do usuário na sessão   | REST `/auth/me` e GraphQL `me` retornam o mesmo usuário | Existe duplicidade de contrato; a UI deve escolher uma fonte canônica |

Essas lacunas exigem extensão aditiva do schema GraphQL na Fase 4; não é
aceitável resolver busca, filtros e colunas carregando o banco inteiro no
navegador.

## Usuários e trabalhos

| Grupo    | Objetivo principal                                       | Necessidade mínima                                      |
| -------- | -------------------------------------------------------- | ------------------------------------------------------- |
| `SELLER` | Trabalhar a carteira no navegador                        | Ver e operar apenas seus contatos, negócios e conversas |
| `ADMIN`  | Acompanhar o time e apoiar vendedores                    | Ver e operar todos os registros, com filtros claros     |
| Demo/QA  | Validar os fluxos sem dados reais ou dependência da Meta | Seed fictício, Mock de WhatsApp e estados reproduzíveis |

## Escopo mínimo proposto

1. Sessão no front-end: login, bootstrap silencioso por refresh, renovação
   single-flight, logout, expiração, rota protegida e retorno à rota original.
2. Cliente GraphQL tipado com HTTP e WebSocket, tratamento padronizado de
   erros, paginação por cursor e cache consistente com mutações.
3. Shell de produto responsivo com navegação, tema claro/escuro, i18n pt-BR e
   estados de conexão/sessão.
4. Lista de contatos com busca e filtros server-side, paginação incremental,
   estados vazios/erro/carregamento e criação de contato.
5. Visão 360° do contato com dados cadastrais, empresa, negócios, atividades,
   conversas e ações de criação, exportação e exclusão.
6. Kanban com colunas por etapa, drag and drop e alternativa completa por
   teclado/menu, com concorrência otimista e recuperação de conflito.
7. Inbox com lista de conversas, histórico paginado, envio de mensagem,
   atualização por `messageReceived` e anúncios `aria-live` sem roubo de foco.
8. Dashboard com métricas por etapa e período, estados de cache/erro e
   atualização após mutações relevantes.
9. Extensões aditivas no schema: filtros de contatos, negócios e conversas,
   com autorização preservada e testes de IDOR.
10. Testes de componentes/fluxos, acessibilidade automatizada e manual,
    documentação e rastreabilidade.

## Hipóteses a validar

| Hipótese                                                                                            | Impacto se rejeitada                                               |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| O front-end usa Apollo Client para HTTP/WS e mantém o access token apenas em memória                | Cliente, cache, refresh e segurança da sessão mudam                |
| A sessão inicia com `POST /auth/refresh`; `/auth/me` não é chamado no bootstrap                     | Fluxo de carregamento e contrato de identidade mudam               |
| Busca e filtros são server-side via argumentos GraphQL aditivos                                     | Contrato GraphQL, paginação e testes de autorização mudam          |
| Busca de contatos cobre nome, e-mail e telefone, sem acentuação e sem diferenciar caixa             | Estratégia de índice, query e resultados visíveis mudam            |
| O kanban carrega negócios abertos (`LEAD` a `NEGOTIATION`) e mostra `WON`/`LOST` em resumo separado | Colunas, filtros padrão e volume de dados mudam                    |
| Mover negócio no kanban usa `updateDeal` com `expectedVersion`; conflito recarrega o quadro         | Estratégia de concorrência, UX de conflito e testes mudam          |
| A interface oferece ações de teclado equivalentes ao drag and drop em cada card                     | Acessibilidade e aceitação do kanban mudam                         |
| O inbox usa `messageReceived` para inserir mensagens e atualizar a ordenação da lista               | Estratégia de atualização, cache e anúncios muda                   |
| O envio usa `clientMessageId` gerado no cliente para evitar duplicata em retry                      | Idempotência de UI, mensagens pendentes e tratamento de erro mudam |
| i18n é um catálogo tipado em pt-BR com `Intl`, sem biblioteca de runtime nesta fase                 | Estrutura de mensagens, pluralização e dependências mudam          |
| Tema claro/escuro usa tokens CSS e preferência persistida, com fallback do sistema                  | Tokens, contraste e estratégia de flash de tema mudam              |
| A UI usa apenas os primitivos internos e dnd-kit; nenhuma biblioteca de componentes visuais entra   | Consistência, dependências e esforço de implementação mudam        |
| Datas e valores são formatados em pt-BR/BRL, com timezone de apresentação definido                  | Formatação, testes e conteúdo mudam                                |
| Dados fictícios permanecem; não há analytics, telemetria de produto ou consentimento nesta fase     | Escopo de privacidade, eventos e documentação mudam                |

## Fluxos propostos

1. **Entrar**: usuário abre a aplicação; a sessão é tentada via refresh; sem
   sessão, vê o login; credenciais válidas guardam o access token em memória e
   levam à rota original ou ao dashboard.
2. **Trabalhar contatos**: usuário busca/filtra, pagina, abre a visão 360°,
   cria atividade ou negócio, exporta ou exclui com confirmação.
3. **Mover negócio**: usuário arrasta um card ou usa o menu "Mover para"; a UI
   envia `expectedVersion`; em conflito, recarrega e explica sem perder o card.
4. **Conversar**: usuário abre o inbox, seleciona uma conversa, lê o histórico,
   envia texto e vê a mensagem pendente; novas mensagens entram por subscription
   e são anunciadas sem mover o foco.
5. **Acompanhar**: usuário vê métricas do período e por etapa; após mutações, os
   dados relevantes são atualizados.
6. **Sessão expirada**: chamada recebe 401/`UNAUTHENTICATED`; a UI tenta um
   refresh único; se falhar, limpa o estado e volta ao login preservando a rota.

## Medidas de sucesso

- Um `SELLER` completa login, busca, visão 360°, kanban e inbox sem enxergar
  dados de outro vendedor; um `ADMIN` enxerga todos.
- Busca e filtros retornam resultados corretos com paginação estável e sem
  carregar todas as páginas no cliente.
- Drag and drop e a alternativa por teclado produzem o mesmo resultado; conflito
  de versão é recuperável e visível.
- Uma mensagem recebida durante o uso aparece no inbox e é anunciada por
  `aria-live` sem deslocar o foco.
- Troca de tema e de rota não perde sessão, filtros ou estado de formulário
  recuperável.
- Navegação completa por teclado, zoom de 200%, reflow em 320 px e contraste AA
  passam nas verificações automatizadas e manuais.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `schema:check`
  passam sem drift.

## Fora de escopo

- Novas funcionalidades de domínio fora dos filtros aditivos necessários à UI.
- Edição/exclusão de atividades, anexos, mídia, templates e mensagens
  interativas.
- Webhooks de status de mensagem, confirmação de leitura e presença/“digitando”.
- CRUD de `WhatsAppAccount`, múltiplos números, times e compartilhamento.
- Analytics de produto, telemetria, consentimento e feature flags.
- Playwright E2E completo, benchmark k6, persisted queries e rate limit
  (Fase 5).
- PWA, offline real, push notifications e aplicativo nativo.
- Redesenho visual fora dos tokens e componentes definidos nesta fase.

## Riscos e questões abertas

| Questão ou risco                                              | Proposta para validação                                                       | Responsável        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------ |
| O refresh cookie `SameSite=Strict` funciona no domínio local? | Portas diferentes em `localhost` são same-site; validar com CORS credenciado  | Engenharia         |
| O access token em memória sobrevive a recarregar a página?    | Não; o bootstrap por refresh repõe a sessão sem persistir token               | Segurança          |
| Como evitar tempestade de refresh com chamadas concorrentes?  | Fila single-flight com uma única chamada e replay das requisições             | Engenharia         |
| O WebSocket reconecta com token expirado?                     | Fechar e reabrir a conexão após renovação; tratar falha como estado visível   | Engenharia         |
| Adicionar filtros GraphQL quebra consumidores existentes?     | Argumentos opcionais e aditivos; schema drift e testes de contrato            | Engenharia/QA      |
| Busca textual exige índice ou full-text?                      | Começar com `contains`/`mode: insensitive`; medir e evoluir se necessário     | Engenharia         |
| O kanban mostra negócios fechados?                            | Carregar abertos por coluna e resumir fechados fora do quadro                 | Produto            |
| O inbox anuncia toda mensagem nova?                           | Apenas mensagens recebidas em conversa visível ou lista, com `polite`         | Produto/A11y       |
| Como confirmar exclusão de contato?                           | Diálogo com nome, consequências e confirmação explícita; sem exclusão em lote | Produto            |
| Qual o alvo mínimo de navegador?                              | Últimas duas versões de Chrome, Firefox, Safari e Edge; sem IE                | Produto/QA         |
| O tema claro atende contraste em todos os tokens?             | Tokens semânticos com pares testados e revisão manual                         | Design/A11y        |
| i18n sem biblioteca limita pluralização e interpolação?       | Catálogo tipado com funções para casos plurais; sem novas línguas nesta fase  | Produto/Engenharia |

## Recomendação

Prosseguir com a SPEC-005, o briefing de UX, a especificação de design e a
ADR-008 (cliente GraphQL, sessão e estado do front-end). Manter as hipóteses
acima explícitas. Nenhuma implementação deve começar antes da aprovação humana
do discovery, dos artefatos de UX/design, da ADR-008, da SPEC-005 e da
TASK-005-01.
