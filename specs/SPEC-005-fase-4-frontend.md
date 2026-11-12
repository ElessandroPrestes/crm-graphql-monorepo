# SPEC: Fase 4 — front-end do Nexo CRM

## Metadados

| Campo                      | Valor                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ID                         | SPEC-005                                                                                                                      |
| Status                     | Approved                                                                                                                      |
| Responsável                | Engenharia de front-end                                                                                                       |
| Revisores                  | Produto / Design / Engenharia / QA / Segurança / Acessibilidade                                                               |
| Criado                     | 2026-11-11                                                                                                                    |
| Atualizado                 | 2026-11-11                                                                                                                    |
| Lançamento alvo            | Fase 4                                                                                                                        |
| Briefing de UX relacionado | `docs/ux-brief-fase-4.md` (UXB-001)                                                                                           |
| Especificação de design    | `docs/design-spec-fase-4.md` (DS-001)                                                                                         |
| ADRs relacionadas          | ADR-002, ADR-003, ADR-004, ADR-005, ADR-008                                                                                   |
| Refs:                      | Discovery: `docs/discovery-fase-4.md`; UX: UXB-001; Design: DS-001; ADR: ADR-008; TASK: TASK-005-01, TASK-005-02, TASK-005-03 |

## Problema e resultado

As fases anteriores entregaram API, autenticação, funil, atividades, tempo real,
WhatsApp e LGPD, mas não existe interface de produto. Um vendedor não consegue
consultar a carteira, registrar uma atividade, mover um negócio, responder uma
conversa ou acompanhar o funil no navegador. O shell atual é uma página estática
sem sessão, dados ou acessibilidade de fluxo completo.

Resultado esperado: `SELLER` e `ADMIN` entram no Nexo CRM, encontram contatos com
busca e filtros, abrem a visão 360°, movem negócios no kanban, conversam no
inbox em tempo real e acompanham métricas, com tema claro/escuro, textos em
pt-BR e acessibilidade WCAG 2.2 AA. A autorização continua integralmente no
servidor.

Nenhuma implementação começa antes da aprovação humana do discovery, do
briefing de UX, da especificação de design, da ADR-008, desta SPEC e da
TASK-005-01.

## Escopo

### No escopo

- Sessão no navegador: login, logout, bootstrap por refresh, renovação
  single-flight, expiração, rota protegida e retorno à rota original.
- Cliente GraphQL tipado para HTTP e WebSocket, com codegen, cache, paginação
  por cursor, tratamento normalizado de erros e limpeza no logout.
- Shell responsivo com navegação, link de salto, anúncio de rota, tema
  claro/escuro/sistema e catálogo de textos pt-BR.
- Dashboard em `/` com métricas por etapa e período.
- Contatos em `/contacts`: busca, filtro por empresa, paginação incremental e
  criação de contato.
- Visão 360° em `/contacts/:contactId`: cadastro, empresa, negócios,
  atividades, conversas, criação de atividade/negócio, exportação e exclusão.
- Kanban em `/pipeline`: colunas por etapa, cards, filtros por etapa, drag and
  drop com dnd-kit e alternativa completa por teclado/menu.
- Inbox em `/inbox` e `/inbox/:conversationId`: lista, histórico paginado,
  envio de mensagem e atualização por `messageReceived`.
- Extensões aditivas no schema GraphQL para busca e filtros de contatos,
  negócios e conversas, com autorização por propriedade.
- Testes de unidade, componentes e fluxos no `apps/web`, testes de contrato da
  API, verificação automatizada de acessibilidade e checklist manual.
- Atualização de schema/codegen, `PROJECT.md`, `ROADMAP.md`, `docs/a11y.md`,
  `docs/architecture.md`, `docs/security.md`, knowledge e rastreabilidade.

### Fora do escopo

- Novos domínios ou mutações além das extensões de filtro e das ações já
  existentes.
- Edição/exclusão de atividades, anexos, mídia, templates e mensagens
  interativas.
- Webhooks de status, confirmação de leitura, presença e “digitando”.
- CRUD de `WhatsAppAccount`, times, compartilhamento e multilocação.
- Busca full-text, tolerância a acentuação, ranking e sugestões.
- Analytics de produto, telemetria, consentimento, feature flags e A/B testing.
- PWA, offline real, push, aplicativo nativo e notificações do sistema.
- Playwright E2E, benchmark k6, persisted queries e rate limit (Fase 5).
- Redesenho visual fora dos tokens e componentes de DS-001.

## Experiência do usuário

### Usuário principal e contexto

- Grupos: `SELLER` e `ADMIN` de um time pequeno de vendas; Demo/QA para
  validação local.
- Objetivos: priorizar a carteira, registrar interações, mover negócios,
  responder conversas e acompanhar o funil.
- Contexto: uso principal em desktop, com suporte funcional a mobile; dados
  fictícios; provider Mock no ambiente local.
- Restrições: a autorização é do servidor; o access token vive em memória; a
  interface não pode depender de dados de produção.

### Fluxo do usuário

1. A aplicação tenta restaurar a sessão com `POST /auth/refresh`.
2. Sem sessão, `/login` recebe e-mail e senha; em sucesso, o access token fica
   em memória e o usuário vai para `returnTo` ou `/`.
3. O usuário navega pelo shell e escolhe dashboard, contatos, pipeline ou
   inbox.
4. Em contatos, busca/filtra, pagina, cria contato e abre a visão 360°.
5. Na visão 360°, consulta dados e registra atividade/negócio, exporta ou
   exclui o contato com confirmação.
6. No pipeline, move cards por drag and drop ou pelo menu “Mover para…”.
7. No inbox, seleciona conversa, envia mensagem e recebe novas mensagens por
   subscription.
8. Em qualquer chamada, sessão expirada dispara um refresh; se falhar, a UI
   limpa o estado privado e volta ao login.

### Estados de interface

Cada tela deve implementar os estados de DS-001: inicial, carregando, vazio,
sem resultado de filtro, erro recuperável, erro fatal, sessão expirada,
permissão negada, offline/timeout, conflito, sucesso e dados desatualizados.
Formulários preservam entrada após erro e focam o primeiro campo inválido.
Listas mantêm dados já carregados ao falhar uma página seguinte.

### Comportamento responsivo e compatibilidade

- Viewports: 320 px, 375 px, 768 px, 1024 px, 1280 px e 1440 px.
- 320–639 px: uma coluna, menu retrátil, inbox em rotas separadas e kanban com
  seletor de etapa ou rolagem horizontal indicada.
- 640–1023 px: shell compacto, contatos em cartões, kanban com rolagem.
- 1024 px ou mais: navegação lateral, tabelas, kanban completo e inbox em duas
  colunas.
- Zoom de 200% e reflow em 320 px sem perda de conteúdo ou rolagem horizontal
  da página inteira.
- Navegadores: últimas duas versões de Chrome, Firefox, Safari e Edge.
- Entrada por mouse, teclado e toque; nenhuma ação depende de hover.

### Sistema de design

Usar DS-001: tokens CSS semânticos, componentes internos, Tailwind, dnd-kit
para o kanban, react-hook-form + zod para formulários e nenhuma biblioteca de
componentes visuais. Temas claro/escuro/sistema preservam contraste AA.

### Acessibilidade

Baseline WCAG 2.2 AA: landmarks, headings sem saltos, foco visível, navegação
completa por teclado, `aria-current`, nomes acessíveis, erros associados aos
campos, diálogos com foco contido, contraste AA, alvos de 24 px, reflow, zoom,
`prefers-reduced-motion`, anúncios `aria-live` sem roubo de foco e alternativa
completa ao drag and drop.

### Conteúdo

Todo texto visível vem do catálogo pt-BR. Rótulos, erros, confirmações e estados
vazios seguem DS-001. Datas, números e moeda usam `Intl` em pt-BR/BRL, com
timezone `America/Sao_Paulo`.

### Análises e feedback

N/A — não há analytics de produto nesta fase, por decisão de privacidade. O
feedback é inline, por toasts acessíveis e por estado de conexão. Nenhum
token, cookie, corpo de mensagem ou PII é registrado no console ou em
ferramenta externa.

## Comportamento funcional

### Sessão e navegação

- A aplicação chama `POST /auth/refresh` com `credentials: 'include'` no
  bootstrap. Sucesso guarda o access token em memória; falha leva a `/login`.
- `POST /auth/login` envia e-mail e senha, recebe `accessToken`, `expiresIn` e
  `user`, e não persiste o token fora da memória.
- Um único refresh pode estar em andamento. Requisições que recebam 401 ou
  `UNAUTHENTICATED` aguardam esse refresh e são repetidas uma única vez; em
  falha, o estado privado é limpo e o usuário volta ao login com `returnTo`.
- Rotas de produto exigem sessão; `/login` é pública e redireciona usuários
  autenticados para `/`.
- `POST /auth/logout` é chamado com credenciais; o cliente limpa token, cache
  Apollo, subscriptions e dados derivados antes de navegar.
- O WebSocket conecta com `Authorization: Bearer <token>` em
  `connectionParams`; após renovação ou logout, a conexão é reaberta ou
  encerrada de forma controlada.
- A UI nunca trata o guard de rota como autorização; erros `FORBIDDEN` e
  `NOT_FOUND` são exibidos sem revelar a existência de recursos de outro dono.

### Dashboard

- `/` consulta `dashboardMetrics` sem período por padrão e permite período
  explícito em UTC.
- Exibe negócios abertos, ganhos, perdidos, valores e contagem/valor por etapa.
- Mutações de negócio/atividade que afetem as métricas invalidam a consulta e
  recarregam os dados.
- Falha de cache não é erro de UI; se a consulta falhar, mostra erro acionável.

### Contatos

- `/contacts` consulta `contacts` com `search`, `companyId`, `first` e `after`.
- Busca é aplicada no servidor, com `trim`, máximo de 100 caracteres, sem
  diferenciar maiúsculas/minúsculas, sobre primeiro nome, sobrenome, e-mail e
  telefone. Acentuação não é normalizada nesta fase.
- Filtro por empresa usa `companies` para popular as opções e é combinável com
  a busca; filtros ficam na URL.
- A lista pagina com “Carregar mais”, mantém a ordem do servidor e não duplica
  nós ao concatenar páginas.
- Criação usa `createContact`; erros de validação aparecem no campo e conflito
  de e-mail/telefone aparece como erro acionável.
- Estados vazio e “sem resultado” são distintos e oferecem limpar filtros.

### Visão 360°

- `/contacts/:contactId` consulta `contact`, `deals(contactId)`,
  `activities(contactId)` e `conversations(contactId)`.
- Exibe cadastro, empresa, negócios, atividades e conversas; cada seção tem
  estado vazio e link para a ação correspondente.
- Cria atividade via `createActivity` e negócio via `createDeal`, com validação
  e atualização das listas.
- Exportação usa `exportContactData` e baixa um JSON com os dados retornados,
  sem enviar o conteúdo para terceiros.
- Exclusão usa `deleteContact` após diálogo com nome e consequências; em
  sucesso, remove o contato do cache e navega para `/contacts`.
- Erros de autorização não distinguem “não existe” de “não pertence a você”.

### Kanban

- `/pipeline` consulta negócios abertos (`LEAD`, `QUALIFIED`, `PROPOSAL`,
  `NEGOTIATION`) com filtros de etapa, contato, empresa e busca.
- Colunas são ordenadas por etapa; cada coluna exibe contagem e valor total;
  `WON`/`LOST` aparecem em resumo fora do quadro.
- Drag and drop usa dnd-kit; cada card tem menu “Mover para etapa” com todas as
  etapas permitidas, acessível por teclado.
- Mover envia `updateDeal` com `expectedVersion`; em sucesso, atualiza o card e
  os totais; em `CONFLICT`, recarrega o quadro, preserva a seleção e explica o
  conflito.
- Falha de rede mantém o card na posição original e oferece repetir.
- A interface não permite reabrir `WON`/`LOST` nesta fase.

### Inbox

- `/inbox` lista conversas autorizadas por `lastMessageAt DESC`; busca filtra
  por nome/telefone do contato no servidor.
- `/inbox/:conversationId` carrega a conversa e o histórico paginado de
  mensagens; mensagens mais antigas carregam sob demanda.
- Envio usa `sendMessage` com `clientMessageId` gerado no cliente; a mensagem
  aparece como pendente e vira `SENT` ou `FAILED` conforme a resposta. Repetir
  usa o mesmo `clientMessageId`.
- `messageReceived` insere mensagens recebidas, atualiza a ordem da lista e o
  último horário. A subscription é filtrada por conversa quando aberta.
- Novas mensagens são anunciadas em região `aria-live="polite"` sem mover o
  foco do composer. A lista indica conversas não lidas.
- Estados de reconexão e perda de tempo real são visíveis e não impedem o
  reenvio manual nem a consulta do histórico.

### Tema e i18n

- O tema inicial segue `prefers-color-scheme`; a escolha explícita
  `light`/`dark`/`system` é persistida e aplicada antes da pintura.
- A troca de tema não recarrega a página nem perde estado de formulário.
- Textos visíveis vêm do catálogo pt-BR; datas, números e moeda usam `Intl`.
- Nenhum texto de produto fica embutido em componente.

## Requisitos não-funcionais

- Segurança e privacidade: access token somente em memória; refresh em cookie
  `HttpOnly`; nenhum token em storage; cache limpo no logout; autorização no
  servidor; sem `dangerouslySetInnerHTML`; sem PII em logs/console; CORS e
  WebSocket autenticados.
- Desempenho e capacidade: code splitting por rota; busca com debounce de
  300 ms; páginas de 20 a 50 itens; dashboard interativo em até 3 s no ambiente
  local com seed; nenhuma tela baixa todas as páginas para filtrar no cliente.
- Confiabilidade e recuperação: erros de rede preservam dados; retry explícito;
  refresh single-flight; reconexão de WebSocket; nenhuma mutação otimista sem
  rollback visível.
- Acessibilidade: WCAG 2.2 AA; verificação automatizada e checklist manual;
  nenhuma violação crítica ou séria nos fluxos principais.
- Compatibilidade: viewports e navegadores definidos; zoom 200%; reflow 320 px;
  teclado e toque.
- Observabilidade: erros normalizados no cliente sem dados sensíveis; estado de
  conexão visível; nenhuma telemetria externa.

## Critérios de aceitação

### AC-501: Bootstrap restaura sessão ou leva ao login

```gherkin
Dado que o usuário possui refresh cookie válido
Quando a aplicação inicia
Então o access token é mantido apenas em memória e o usuário acessa a rota inicial
E sem refresh válido a aplicação mostra /login sem expor erro interno
```

Evidência necessária: automatizada.

### AC-502: Login, logout e expiração tratam a sessão

```gherkin
Dado que o usuário informa credenciais válidas
Quando confirma o login
Então é levado à rota original ou ao dashboard
E ao sair o token, o cache e as subscriptions são limpos
E uma chamada com sessão expirada tenta um único refresh antes de voltar ao login
```

Evidência necessária: automatizada.

### AC-503: Rotas protegidas preservam o destino

```gherkin
Dado que o usuário não está autenticado
Quando tenta abrir /contacts
Então é levado a /login com returnTo=/contacts
E após entrar retorna a /contacts
```

Evidência necessária: automatizada.

### AC-504: Shell, navegação e título são acessíveis

```gherkin
Dado que o usuário navega entre dashboard, contatos, pipeline e inbox
Quando usa teclado e leitor de tela
Então há landmarks, link de salto, foco visível, aria-current e um h1 por rota
E a mudança de rota é anunciada sem mover o foco
```

Evidência necessária: automatizada e manual de acessibilidade.

### AC-505: Contatos buscam e filtram no servidor

```gherkin
Dado que existem contatos de donos diferentes
Quando um SELLER busca por nome, e-mail, telefone ou filtra por empresa
Então recebe apenas seus contatos correspondentes, com paginação estável
E um ADMIN recebe os contatos de todos os donos
```

Evidência necessária: automatizada de API e componente.

### AC-506: Contato é criado com validação e erro acionável

```gherkin
Dado que o usuário abre a criação de contato
Quando envia dados inválidos
Então o primeiro campo inválido recebe foco e a entrada é preservada
Quando envia dados válidos
Então o contato aparece na lista e o diálogo fecha
```

Evidência necessária: automatizada de componente.

### AC-507: Visão 360° reúne os dados do contato

```gherkin
Dado um contato com empresa, negócios, atividades e conversas
Quando o usuário abre /contacts/:id
Então vê as quatro seções com dados autorizados
E contato sem dados mostra estados vazios com ações
E um contato de outro dono retorna estado de não encontrado
```

Evidência necessária: automatizada de API e componente.

### AC-508: Exportação e exclusão LGPD funcionam na UI

```gherkin
Dado um contato autorizado
Quando o usuário exporta os dados
Então recebe um JSON com contato, empresa, negócios, atividades e conversas
Quando confirma a exclusão
Então o contato e os dependentes somem da UI e da lista
E cancelar a confirmação não altera nada
```

Evidência necessária: automatizada de componente e API.

### AC-509: Kanban agrupa negócios abertos por etapa

```gherkin
Dado que existem negócios em etapas diferentes para donos diferentes
Quando o usuário abre /pipeline
Então vê somente negócios autorizados nas colunas abertas
E cada coluna mostra contagem e valor total
E WON/LOST aparecem em resumo separado
```

Evidência necessária: automatizada.

### AC-510: Mover card funciona com mouse e teclado

```gherkin
Dado um card em LEAD
Quando o usuário o arrasta para QUALIFIED ou usa "Mover para etapa"
Então o servidor recebe updateDeal com expectedVersion
E o card e os totais são atualizados
E o mesmo movimento é possível apenas com teclado
```

Evidência necessária: automatizada e manual de acessibilidade.

### AC-511: Conflito de versão é recuperável

```gherkin
Dado que outro usuário alterou o mesmo negócio
Quando o usuário tenta movê-lo com versão desatualizada
Então o quadro é recarregado, a seleção é preservada
E uma mensagem explica o conflito sem perder dados
```

Evidência necessária: automatizada.

### AC-512: Inbox lista, pagina e abre conversas

```gherkin
Dado que o usuário possui conversas autorizadas
Quando abre /inbox
Então vê conversas ordenadas por última mensagem
E ao abrir uma conversa vê o histórico paginado
E conversas de outro dono não aparecem
```

Evidência necessária: automatizada de API e componente.

### AC-513: Envio de mensagem é idempotente na UI

```gherkin
Dado que o usuário digita uma mensagem
Quando envia
Então a mensagem aparece pendente e depois SENT ou FAILED
E repetir após falha reutiliza o mesmo clientMessageId
E o histórico não duplica a mensagem
```

Evidência necessária: automatizada.

### AC-514: Tempo real anuncia sem roubar foco

```gherkin
Dado que o usuário está no inbox com o composer focado
Quando chega uma mensagem por messageReceived
Então a mensagem e a lista são atualizadas
E um anúncio aria-live="polite" informa a nova mensagem
E o foco permanece no composer
```

Evidência necessária: automatizada e manual de acessibilidade.

### AC-515: Reconexão é visível e recuperável

```gherkin
Dado que a conexão WebSocket cai
Quando a UI detecta a perda
Então mostra estado de reconexão
E ao voltar, atualiza a conversa e retoma a subscription
E o usuário pode consultar o histórico durante a queda
```

Evidência necessária: automatizada de componente.

### AC-516: Dashboard reflete métricas e período

```gherkin
Dado que existem negócios em várias etapas
Quando o usuário abre o dashboard
Então vê contagens, valores e etapas autorizadas
E ao escolher um período os dados são recalculados
E após mover um negócio as métricas são atualizadas
```

Evidência necessária: automatizada.

### AC-517: Tema claro, escuro e sistema são persistidos

```gherkin
Dado que o usuário escolhe um tema
Quando recarrega a aplicação
Então o tema é aplicado antes da pintura, sem flash
E "sistema" acompanha prefers-color-scheme
E a troca não perde estado de formulário
```

Evidência necessária: automatizada e manual visual.

### AC-518: Textos e formatos são pt-BR

```gherkin
Dado que a aplicação exibe datas, valores e mensagens
Quando o locale é pt-BR
Então os formatos usam Intl e BRL/America/Sao_Paulo
E nenhum texto de produto está embutido em componente
```

Evidência necessária: automatizada.

### AC-519: Layout responde e reflui

```gherkin
Dado viewports de 320 px, 768 px, 1024 px e 1440 px
Quando o usuário navega pelas telas principais
Então não há perda de conteúdo nem rolagem horizontal da página
E com zoom de 200% as ações continuam alcançáveis
```

Evidência necessária: manual e automatizada de componente.

### AC-520: Fluxos principais passam em acessibilidade

```gherkin
Dado login, contatos, visão 360°, kanban, inbox e dashboard
Quando a verificação automatizada e o checklist manual são executados
Então não há violação crítica ou séria de WCAG 2.2 AA
E teclado, foco, nomes, contraste e anúncios funcionam
```

Evidência necessária: automatizada e manual de acessibilidade.

### AC-521: Filtros GraphQL preservam autorização

```gherkin
Dado que um SELLER tenta filtrar por contato, empresa ou etapa de outro dono
Quando consulta contacts, deals ou conversations
Então recebe apenas registros autorizados
E um ADMIN recebe todos
```

Evidência necessária: automatizada de API.

### AC-522: Estados de erro e vazio são distintos

```gherkin
Dado que uma consulta falha ou não retorna resultados
Quando a tela renderiza
Então erro recuperável oferece repetir e preserva dados
E vazio e sem resultado de filtro têm mensagens e ações distintas
```

Evidência necessária: automatizada de componente.

### AC-523: Nenhum segredo ou PII é persistido no cliente

```gherkin
Dado o uso normal da aplicação
Quando inspeciono storage, cookies legíveis e logs do cliente
Então não há access token, refresh token, corpo de mensagem ou PII
E o logout remove dados privados do cache
```

Evidência necessária: automatizada e manual de segurança.

### AC-524: Qualidade e contrato permanecem verdes

```gherkin
Dado o código implementado
Quando executo lint, typecheck, testes, build, format e schema:check
Então todos passam
E não há drift entre schema, tipos gerados e código
```

Evidência necessária: automatizada.

## Abordagem técnica

### Front-end

- `apps/web` recebe Apollo Client, `graphql-ws`, dnd-kit, react-hook-form e zod
  nas versões estáveis compatíveis com React 19 e TypeScript 6, registradas no
  lockfile.
- Estrutura por domínio: `auth`, `shell`, `dashboard`, `contacts`, `pipeline`,
  `inbox`, `appearance`, `i18n`, `graphql` e `ui`.
- Rotas: `/login`, `/`, `/contacts`, `/contacts/:contactId`, `/pipeline`,
  `/inbox`, `/inbox/:conversationId` e `*`.
- Sessão em `SessionStore`; cliente Apollo em provider; cache e links
  configurados em um único módulo; operações em documentos `.graphql` ou
  `gql` tipados por codegen.
- Componentes de DS-001; nenhuma biblioteca visual externa.
- Testes com Vitest, Testing Library, user-event, `MockedProvider` e mock de
  `fetch` para as rotas REST. Verificação de acessibilidade automatizada nos
  fluxos principais.

### API e schema

Mudanças aditivas, sem remoção de campos ou alteração de respostas:

- `contacts(first, after, search, companyId)`:
  - `search`: string opcional, 1–100 caracteres após `trim`;
  - `companyId`: ID opcional;
  - busca `contains` sem diferenciar maiúsculas/minúsculas em `firstName`,
    `lastName`, `email` e `phone`;
  - escopo de dono aplicado antes dos filtros.
- `deals(first, after, contactId, companyId, stages, search)`:
  - `stages`: lista opcional de `DealStage`;
  - `contactId`/`companyId`: IDs opcionais;
  - `search`: título do negócio, 1–100 caracteres;
  - escopo de dono aplicado antes dos filtros.
- `conversations(first, after, contactId, search)`:
  - `contactId`: ID opcional;
  - `search`: nome, sobrenome ou telefone do contato, 1–100 caracteres;
  - escopo de dono aplicado antes dos filtros.
- Argumentos novos são opcionais e preservam paginação por cursor e limites
  atuais. Índices adicionais só entram se medições justificarem; nenhuma
  migration destrutiva é prevista.
- Códigos de erro GraphQL existentes são mantidos; a UI normaliza
  `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` e `BAD_USER_INPUT`.

### Dependências

- Aprovar no início da implementação as versões exatas de `@apollo/client`,
  `graphql-ws`, `dnd-kit`, `react-hook-form` e `zod`, verificando peers com
  React 19, TypeScript 6 e GraphQL 16.
- Atualizar `ADR-003` se alguma versão fixada precisar mudar.
- Nenhuma dependência de componentes visuais, analytics ou i18n runtime.

### Alternativas rejeitadas

- Token em `localStorage`: rejeitado por XSS (ADR-008).
- Filtros no cliente: rejeitado por volume, paginação e custo.
- Polling no inbox: rejeitado porque `messageReceived` já existe.
- Reabrir WON/LOST no kanban: fora do escopo da fase.
- Biblioteca de i18n runtime: desnecessária para um único idioma nesta fase.

## Entrega e operações

- Plano de implantação: entregar por tarefas; a API aditiva pode ir antes do
  front-end; a web entra atrás da mesma origem/CORS já configurada.
- Plano de migração: nenhuma migração de dados obrigatória; seed fictício
  permanece. Se um índice for necessário, criar migration aditiva.
- Plano de rollback: reverter `apps/web` ao shell anterior; argumentos GraphQL
  aditivos podem permanecer sem consumidores. Nenhum dado é apagado.
- Monitoramento e alertas: sem telemetria de produto; erros de cliente são
  visíveis na UI e registrados apenas em desenvolvimento, sem PII.
- Suporte ou impacto operacional: CORS, cookie e WebSocket já existentes;
  validar a origem `http://localhost:5217` e documentar produção na Fase 5.

## Riscos e dependências

| Risco ou dependência                                | Impacto | Probabilidade | Mitigação                                                   | Responsável     |
| --------------------------------------------------- | ------- | ------------- | ----------------------------------------------------------- | --------------- |
| Apollo aumenta o bundle e atrasa a primeira pintura | Médio   | Média         | Code splitting por rota e orçamento de bundle no CI         | Engenharia      |
| Refresh concorrente gera loop ou perda de sessão    | Alto    | Média         | Single-flight, retry único e testes de concorrência         | Engenharia      |
| WebSocket com token expirado fica zumbi             | Alto    | Média         | Reconexão controlada e estado visível                       | Engenharia      |
| Filtros aditivos quebram contrato existente         | Alto    | Baixa         | Argumentos opcionais, codegen e testes de contrato          | Engenharia/QA   |
| Busca `contains` não escala com muitos contatos     | Médio   | Média         | Medir; índice/full-text fica para fase futura               | Engenharia      |
| Kanban acessível não é equivalente ao drag and drop | Alto    | Média         | Menu “Mover para”, testes de teclado e revisão de a11y      | A11y/Engenharia |
| Inbox rouba foco ou anuncia em excesso              | Alto    | Média         | `aria-live` agregado, `polite`, sem foco automático         | A11y/Engenharia |
| Tema claro não atinge contraste AA                  | Médio   | Média         | Tokens testados e revisão visual nos dois temas             | Design/A11y     |
| Sessão expira durante formulário                    | Alto    | Média         | Preservar rascunho e `returnTo`; teste de recuperação       | Engenharia      |
| Testes de componente acoplam ao cache Apollo        | Médio   | Média         | Testar comportamento visível e usar helpers de teste        | QA              |
| Dependências novas têm peers incompatíveis          | Alto    | Baixa         | Validar versões no início e atualizar ADR-003 se necessário | Engenharia      |

## Questões abertas

| Questão                                                         | Responsável | Data limite   | Resolução                              |
| --------------------------------------------------------------- | ----------- | ------------- | -------------------------------------- |
| Pesquisa moderada com usuários será executada antes da entrega? | Produto     | Antes do QA   | Validação futura ou exceção registrada |
| Busca deve ignorar acentuação nesta fase?                       | Produto     | Antes da TASK | Não nesta fase; registrar follow-up    |
| Kanban deve mostrar WON/LOST no quadro ou apenas no resumo?     | Produto     | Antes da TASK | Resumo separado                        |
| Inbox deve abrir a conversa mais recente automaticamente?       | Produto     | Antes da TASK | Não; seleção explícita                 |
| Navegação mobile será barra inferior ou menu lateral?           | Design      | Antes da TASK | Menu lateral retrátil                  |

## Aprovação

| Papel          | Nome                    | Decisão  | Data       | Notas                                                          |
| -------------- | ----------------------- | -------- | ---------- | -------------------------------------------------------------- |
| Produto        | Solicitante humano      | Aprovado | 2026-11-11 | Aprovação explícita dos artefatos da Fase 4                    |
| Design         | Solicitante humano      | Aprovado | 2026-11-11 | Aprova DS-001 como baseline; revisão da implementação pendente |
| Engenharia     | Agente de implementação | Aprovado | 2026-11-11 | Executa TASK-005-01 a TASK-005-03                              |
| QA             | Agente de implementação | Pronto   | 2026-11-11 | QA-001 com evidência por AC                                    |
| Segurança      | Baseline da SPEC        | Aceito   | 2026-11-11 | Validar sessão, tokens, CORS, WebSocket e filtros              |
| Acessibilidade | Baseline da SPEC        | Aceito   | 2026-11-11 | WCAG 2.2 AA; revisão manual no Portão 3                        |
