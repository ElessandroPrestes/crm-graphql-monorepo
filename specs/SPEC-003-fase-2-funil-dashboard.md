# SPEC: Fase 2 — Funil de negociações e dashboard

## Metadados

| Campo                      | Valor                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| ID                         | SPEC-003                                                                                     |
| Status                     | Approved                                                                                     |
| Responsável                | Engenharia                                                                                   |
| Revisores                  | Produto / Engenharia / QA / Segurança                                                        |
| Criado                     | 2026-11-11                                                                                   |
| Atualizado                 | 2026-11-11                                                                                   |
| Lançamento alvo            | Fase 2                                                                                       |
| Briefing de UX relacionado | N/A — fase de API, sem interface de produto                                                  |
| Especificação de design    | N/A — fase de API, sem interface de produto                                                  |
| ADRs relacionadas          | ADR-002, ADR-003, ADR-004, ADR-005                                                           |
| Refs:                      | Discovery: `docs/discovery-fase-2.md`; Design: N/A; ADRs: ADR-002, ADR-003, ADR-004, ADR-005 |

## Problema e resultado

A Fase 1 estruturou contatos e empresas, mas o CRM ainda não acompanha
oportunidades nem interações. Sem funil, atividades e métricas, o produto não
responde às perguntas centrais de um time de vendas: em que etapa está cada
negociação, o que aconteceu com o cliente e como está o desempenho do funil.

Resultado esperado: um `SELLER` autenticado gerencia seus negócios e atividades,
recebe eventos de mudança de etapa em tempo real e consulta métricas do próprio
funil; um `ADMIN` faz o mesmo sobre todos os registros. A implementação só
começa após aprovação desta SPEC, da ADR-005, do discovery e da TASK-003-01.

## Escopo

### No escopo

- Prisma 7: `Deal` e `Activity`, enums `DealStage` e `ActivityType`, migration e
  seed fictício.
- CRUD GraphQL de negócios com etapas e encerramento (`WON`/`LOST`).
- Concorrência otimista por `version` com `expectedVersion` no update.
- Linha do tempo de atividades por contato e por negócio, com paginação por
  cursor.
- Subscription `dealMoved` autenticada, entregue via `graphql-ws` e Redis
  pub/sub, com autorização por propriedade.
- `dashboardMetrics` com contagens e valores por etapa, cache Redis com TTL e
  invalidação por evento.
- Testes unitários e de integração com PostgreSQL e Redis via Testcontainers.
- Atualização de `PROJECT.md`, `ROADMAP.md`, `docs/architecture.md`,
  `docs/security.md`, schema e rastreabilidade.

### Fora do escopo

- Conversas, mensagens, WhatsApp, RabbitMQ e worker consumidor (Fase 3).
- Interface web, kanban visual, i18n e temas (Fase 4).
- Reabertura de negócios encerrados, múltiplas moedas e câmbio.
- Edição/exclusão de atividades, anexos e lembretes.
- Rate limit por usuário/IP, persisted queries e benchmark k6 (Fase 5).
- Compartilhamento de negócios por time; permanece RBAC por propriedade.

## Experiência do usuário

### Usuário principal e contexto

- Grupo: `SELLER` e `ADMIN` de um time pequeno de vendas.
- Objetivo: acompanhar negociações, registrar interações e ler o funil.
- Contexto: clientes REST/GraphQL; a interface web só existe na Fase 4.

### Fluxo do usuário

1. O usuário autentica via REST e obtém o access token (Fase 1).
2. Cria um negócio vinculado a contato e/ou empresa e o posiciona em uma etapa.
3. Move o negócio entre etapas; clientes conectados recebem `dealMoved`.
4. Registra atividades e consulta a linha do tempo do contato ou negócio.
5. Consulta `dashboardMetrics` para ver contagens e valores por etapa.
6. Encerra o negócio como `WON` ou `LOST`, o que fixa `closedAt`.

### Estados de interface

N/A — não há interface nesta fase. Os estados observáveis são respostas HTTP,
erros GraphQL padronizados e eventos de subscription.

### Comportamento responsivo e compatibilidade

N/A para UI. A API deve funcionar em Node.js 26, PostgreSQL 18 e Redis 8.

### Sistema de design

N/A.

### Acessibilidade

N/A para UI. Mensagens de erro devem ser claras e não expor detalhes internos.

### Conteúdo

Mensagens genéricas para recursos de outro usuário; mensagens específicas de
validação para campos; `CONFLICT` para versão desatualizada.

### Análises e feedback

N/A — sem analytics nesta fase. Logs de eventos e cache são registrados sem
tokens ou dados pessoais.

## Comportamento funcional

- `Deal` pertence a um `ownerId`; `SELLER` só acessa os próprios negócios;
  `ADMIN` acessa todos.
- `Deal` possui `contactId` e `companyId` opcionais. Quando informados, devem
  existir e pertencer ao mesmo dono (ou o usuário é `ADMIN`).
- Etapas: `LEAD`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`.
- `WON` e `LOST` são terminais na Fase 2: não podem ser movidos de volta nem
  para outra etapa encerrada; reabertura fica fora do escopo.
- Movimento entre etapas abertas (`LEAD` a `NEGOTIATION`) é permitido para
  avanço e retrocesso.
- Ao entrar em `WON` ou `LOST`, `closedAt` é preenchido; ao permanecer em etapa
  aberta, `closedAt` é nulo.
- `valueCents` é inteiro não negativo em centavos, moeda única `BRL`.
- `title` obrigatório, com limite de tamanho; `expectedCloseDate` opcional.
- Update exige `expectedVersion`; se a versão persistida for diferente, a
  operação falha com `CONFLICT` e não sobrescreve dados.
- `Activity` pertence a um `ownerId`, tem `type` (`CALL`, `EMAIL`, `MEETING`,
  `NOTE`), `subject`, `notes` opcional, `occurredAt` e vínculo opcional com
  contato e/ou negócio; ao menos um vínculo deve existir.
- Atividades são imutáveis após criação na Fase 2 (sem update/delete).
- Linha do tempo ordenada por `occurredAt DESC, id DESC`, paginação por cursor
  com `first` padrão 20 e máximo 100; cursor inválido retorna erro de validação.
- `dealMoved(dealId: ID)` entrega o negócio atualizado a assinantes
  autenticados que tenham permissão sobre ele; sem permissão, nenhum evento é
  entregue.
- `dashboardMetrics(periodStart, periodEnd)`: retorna total de negócios abertos,
  contagem e valor por etapa, e totais `WON`/`LOST` no período em UTC.
- Dashboard usa cache Redis com TTL de 30 segundos, invalidado em qualquer
  criação, atualização, movimento ou encerramento de negócio do escopo afetado.
- Se o Redis estiver indisponível, o dashboard recalcula direto do banco e as
  escritas continuam funcionando; a falha é registrada em log.

## Requisitos não-funcionais

- Segurança e privacidade: JWT validado no `connection_init`; autorização por
  propriedade em queries, mutations e eventos; logs redigidos; nenhum dado real
  no seed.
- Desempenho e capacidade: listas e timeline com cursor; DataLoader para
  relações; dashboard com cache de 30 s; sem N+1 no caminho de negócio.
- Confiabilidade e recuperação: pub/sub best-effort; degradação sem cache;
  update concorrente seguro; migration reversível por recriação em
  desenvolvimento.
- Acessibilidade: N/A para UI; erros de API claros.
- Compatibilidade: Node.js 26, PostgreSQL 18, Redis 8, Prisma 7, GraphQL 16 e
  Apollo Server 5.
- Observabilidade: logs de conexão/evento/cache; erros sem stack em produção;
  teste de invalidação de cache.

## Critérios de aceitação

### AC-201: Modelo e seed da Fase 2

```gherkin
Dado o banco com as migrations da Fase 2
Quando o seed fictício for executado
Então existem negócios em todas as etapas e atividades vinculadas
E nenhum dado pessoal real é inserido
```

Evidência necessária: automatizada.

### AC-202: CRUD de negócios

```gherkin
Dado um usuário autenticado
Quando criar, listar, consultar, atualizar e excluir negócios seus
Então os dados são persistidos e validados
E vínculos com contato ou empresa de outro dono são rejeitados
```

Evidência necessária: automatizada.

### AC-203: Concorrência otimista

```gherkin
Dado um negócio na versão N
Quando dois updates concorrentes usarem expectedVersion N
Então o primeiro é aceito e incrementa a versão
E o segundo retorna CONFLICT sem sobrescrever o primeiro
```

Evidência necessária: automatizada.

### AC-204: RBAC e IDOR em negócios e atividades

```gherkin
Dado um negócio ou atividade do SELLER A
Quando o SELLER B tentar ler, editar, mover ou excluir
Então a operação é negada sem revelar se o recurso existe
E o ADMIN consegue acessar o mesmo recurso
```

Evidência necessária: automatizada.

### AC-205: Transições de etapa e encerramento

```gherkin
Dado um negócio em etapa aberta
Quando ele for movido para WON ou LOST
Então closedAt é preenchido
E uma tentativa de movê-lo novamente é rejeitada
```

Evidência necessária: automatizada.

### AC-206: Linha do tempo de atividades

```gherkin
Dado um contato e um negócio com várias atividades
Quando a timeline for consultada com first e after
Então as atividades aparecem por occurredAt e id de forma estável
E o cursor avança sem duplicar ou pular registros
```

Evidência necessária: automatizada.

### AC-207: Subscription dealMoved

```gherkin
Dado um cliente autenticado conectado via graphql-ws
Quando um negócio acessível mudar de etapa
Então o cliente recebe dealMoved com o negócio atualizado
```

Evidência necessária: automatizada.

### AC-208: Autorização em subscription

```gherkin
Dado um cliente autenticado como SELLER A
Quando um negócio do SELLER B mudar de etapa
Então o cliente A não recebe o evento
E uma conexão sem token válido é rejeitada no connection_init
```

Evidência necessária: automatizada.

### AC-209: dashboardMetrics com cache

```gherkin
Dado que o dashboard foi consultado e entrou em cache
Quando um negócio do escopo for criado ou movido
Então o cache do escopo é invalidado
E a próxima consulta reflete o novo estado
```

Evidência necessária: automatizada.

### AC-210: Degradação sem Redis

```gherkin
Dado que o Redis está indisponível
Quando dashboardMetrics for consultado ou um negócio for atualizado
Então o dashboard recalcula do banco e a escrita é concluída
E a falha é registrada sem dados sensíveis
```

Evidência necessária: automatizada.

### AC-211: Paginação e validação de negócios

```gherkin
Dado um conjunto de negócios
Quando a lista for consultada com first e after
Então o limite máximo é respeitado e a ordem é estável
E cursor ou expectedVersion inválidos retornam erro de validação
```

Evidência necessária: automatizada.

### AC-212: Sem N+1 em relações de negócio

```gherkin
Dado vários negócios com contatos e empresas diferentes
Quando a query solicitar negócio, contato e empresa
Então o número de queries não cresce linearmente com o número de negócios
```

Evidência necessária: automatizada.

### AC-213: Schema e drift

```gherkin
Dado o código da API
Quando o schema GraphQL for gerado
Então o arquivo versionado corresponde ao código
E o typecheck dos types gerados passa
```

Evidência necessária: automatizada.

### AC-214: Quality gates

```gherkin
Dado o repositório instalado com Docker
Quando pnpm lint, typecheck, test, build, integração e schema:check forem executados
Então todos passam
```

Evidência necessária: automatizada.

### AC-215: Documentação e rastreabilidade

```gherkin
Dado o fim da implementação
Quando a documentação e a matriz forem revisadas
Então PROJECT, ROADMAP, arquitetura, segurança, SPEC, TASK e matriz refletem a Fase 2
```

Evidência necessária: manual.

## Abordagem técnica

- Prisma 7: `Deal` (`title`, `valueCents`, `stage`, `version`, `closedAt`,
  `expectedCloseDate`, `contactId`, `companyId`, `ownerId`) e `Activity`
  (`type`, `subject`, `notes`, `occurredAt`, `contactId`, `dealId`, `ownerId`),
  com índices de escopo e ordenação (`ownerId`, `createdAt`, `id` e
  `ownerId`, `occurredAt`, `id`).
- Módulos NestJS: `deals`, `activities`, `dashboard`, `realtime` e provider
  Redis; guards reutilizados da Fase 1.
- Concorrência: atualização com filtro por `id` e `version`, incremento atômico
  e detecção de zero linhas afetadas para `CONFLICT`.
- GraphQL: code-first, connection/cursor própria para timeline, DataLoader para
  `Deal.contact` e `Deal.company`.
- Subscriptions: `graphql-ws` no Apollo/NestJS, autenticação no
  `connection_init`, pub/sub Redis por canal de escopo; entrega filtrada por
  autorização.
- Cache: chave versionada por escopo e período, TTL 30 s, invalidação em
  mutations de negócio; fallback sem cache.
- Testcontainers: PostgreSQL e Redis efêmeros; testes de concorrência, IDOR,
  timeline, subscription, cache e degradação.

Alternativas rejeitadas: polling HTTP (ADR-005); pub/sub em memória (não escala);
`LISTEN/NOTIFY` (acoplamento e limites); paginação por offset; valor monetário em
ponto flutuante; update sem `version`.

## Entrega e operações

- Plano de implantação: ambiente local e CI; deploy fica para a Fase 5.
- Plano de migração: migration incremental com novos modelos e enums.
- Plano de reversão: reverter o commit da fase e recriar o banco em
  desenvolvimento; desabilitar subscriptions/cache por configuração.
- Monitoramento e alertas: logs de conexão, eventos e cache; health checks
  existentes.
- Suporte: seed recriável e sem dados reais.

## Riscos e dependências

| Risco ou dependência                                        | Impacto | Probabilidade | Mitigação                                                  | Responsável       |
| ----------------------------------------------------------- | ------- | ------------- | ---------------------------------------------------------- | ----------------- |
| Regras de etapa e transição ainda não validadas por produto | Alto    | Média         | Aprovar esta SPEC e o discovery antes do código            | Produto           |
| Autenticação em WebSocket pode expor eventos indevidos      | Alto    | Média         | Validação no connection_init e filtro por dono nos eventos | Segurança         |
| Redis se torna dependência operacional da fase              | Médio   | Média         | Degradação sem cache e pub/sub best-effort                 | Engenharia        |
| Inconsistência entre cache e banco em janela curta          | Médio   | Média         | TTL curto, invalidação por evento e testes                 | Engenharia        |
| Novas dependências (`graphql-ws`, cliente Redis) e versões  | Médio   | Média         | Validar compatibilidade sob ADR-003 antes de implementar   | Engenharia        |
| Testcontainers com PostgreSQL e Redis na CI                 | Médio   | Média         | Job de integração com Docker; fallback documentado         | Engenharia/QA     |
| LGPD para atividades e histórico                            | Alto    | Média         | Usar somente dados fictícios; retenção real em Fase 3/5    | Produto/Segurança |

## Questões abertas

| Questão                                          | Responsável | Data limite | Resolução                                          |
| ------------------------------------------------ | ----------- | ----------- | -------------------------------------------------- |
| Quais etapas e regras de transição são oficiais? | Produto     | Fase 2      | Proposta: seis etapas, `WON`/`LOST` terminais      |
| Quais tipos de atividade existem?                | Produto     | Fase 2      | Proposta: `CALL`, `EMAIL`, `MEETING`, `NOTE`       |
| O dashboard precisa de período configurável?     | Produto     | Fase 2      | Proposta: período opcional em UTC com total aberto |
| Valor será sempre BRL na demo?                   | Produto     | Fase 2      | Proposta: sim; múltiplas moedas fora de escopo     |
| Transporte e autenticação de subscription?       | Engenharia  | Fase 2      | Proposta: `graphql-ws` + Redis, JWT no init        |

## Aprovação

| Papel      | Nome                    | Decisão  | Data       | Notas                                |
| ---------- | ----------------------- | -------- | ---------- | ------------------------------------ |
| Produto    | Solicitante humano      | Aprovado | 2026-11-11 | Aprovação explícita para implementar |
| Design     | —                       | N/A      | —          | API sem UI                           |
| Engenharia | Agente de implementação | Aprovado | 2026-11-11 | Executa TASK-003-01                  |
| QA         | Agente de implementação | Pronto   | 2026-11-11 | Evidências automatizadas por AC      |
| Segurança  | Baseline da SPEC        | Aceito   | 2026-11-11 | Validar subscription, cache e LGPD   |
