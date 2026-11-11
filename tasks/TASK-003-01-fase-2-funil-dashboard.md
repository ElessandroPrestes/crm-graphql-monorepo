# TASK: Implementar a Fase 2 — funil, atividades e dashboard

## Metadados

| Campo        | Valor                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-003-01                                                                                                            |
| Status       | Done                                                                                                                   |
| Responsável  | Engenharia                                                                                                             |
| SPEC         | SPEC-003                                                                                                               |
| Critérios    | AC-201, AC-202, AC-203, AC-204, AC-205, AC-206, AC-207, AC-208, AC-209, AC-210, AC-211, AC-212, AC-213, AC-214, AC-215 |
| Dependências | SPEC-003 aprovada; discovery da Fase 2 aceito; ADR-005 aceito                                                          |

## Objetivo

Entregar negócios com etapas e concorrência otimista, linha do tempo de
atividades, subscription `dealMoved` em tempo real e `dashboardMetrics` com
cache Redis, com autorização por propriedade e evidências automatizadas.

## Escopo

### Incluído

- Modelo Prisma com `Deal`, `Activity`, enums `DealStage`/`ActivityType`,
  migration e seed fictício.
- CRUD GraphQL de negócios com etapas, encerramento e `version`.
- Linha do tempo de atividades com paginação por cursor.
- Subscription `dealMoved` via `graphql-ws` e Redis pub/sub.
- `dashboardMetrics` com cache Redis, TTL e invalidação.
- Testes unitários e de integração com PostgreSQL e Redis via Testcontainers.
- Schema, codegen, drift check, documentação e rastreabilidade.

### Não incluído

- Conversas, WhatsApp, RabbitMQ e worker (Fase 3).
- Interface web, kanban visual, i18n e temas (Fase 4).
- Reabertura de negócios, múltiplas moedas, edição/exclusão de atividades.
- Rate limit, persisted queries e benchmark k6 (Fase 5).

## Abordagem e impacto

- Arquivos: `apps/api/prisma/**`, `apps/api/src/deals/**`,
  `apps/api/src/activities/**`, `apps/api/src/dashboard/**`,
  `apps/api/src/realtime/**`, `apps/api/src/redis/**`,
  `apps/api/src/graphql/**`, `apps/api/src/auth/**`, `apps/api/test/**`,
  `packages/graphql-schema/**`, `adr/ADR-005*`, `docs/**`, `PROJECT.md`,
  `ROADMAP.md`.
- Contratos: schema GraphQL com `Deal`, `Activity`, `DashboardMetrics`,
  `dealMoved` e novas mutations/queries.
- Dados: duas tabelas novas, quatro índices de ordenação/escopo e FKs.
- Riscos: autenticação em WebSocket, consistência de cache, pub/sub
  best-effort e dependências novas.
- ADRs e padrões: ADR-002, ADR-003, ADR-004, ADR-005,
  `standards/security.md`, `standards/coding.md`.

## Passos

- [x] Aprovar SPEC-003, discovery e ADR-005.
- [x] Criar schema Prisma, migration e seed.
- [x] Implementar CRUD de negócios com etapas e concorrência otimista.
- [x] Implementar atividades e timeline com cursor.
- [x] Implementar provider Redis e pub/sub de `dealMoved`.
- [x] Implementar subscription autenticada e autorizada.
- [x] Implementar `dashboardMetrics`, cache e invalidação.
- [x] Adicionar DataLoaders de contato/negócio.
- [x] Gerar schema/types e verificar drift.
- [x] Adicionar testes unitários e de integração.
- [x] Rodar lint, typecheck, test, build e format.
- [x] Atualizar documentação e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                                | Evidência esperada                              |
| -------------- | -------------------------------------------------------- | ----------------------------------------------- |
| AC-201         | migration + seed + consulta ao banco                     | Negócios em etapas e atividades fictícias       |
| AC-202         | testes de CRUD de negócios                               | Validação, persistência e vínculo por dono      |
| AC-203         | teste de concorrência com `expectedVersion`              | Primeiro update vence; segundo retorna CONFLICT |
| AC-204         | testes negativos entre SELLER A e B                      | Negado sem vazar existência; ADMIN acessa       |
| AC-205         | teste de encerramento e reabertura                       | `closedAt` preenchido; reabertura rejeitada     |
| AC-206         | teste de timeline e cursor                               | Ordem estável e paginação sem duplicar          |
| AC-207         | teste de subscription autenticada                        | Evento `dealMoved` recebido                     |
| AC-208         | teste de autorização e conexão sem token                 | Sem evento entre donos; conexão rejeitada       |
| AC-209         | teste de cache e invalidação                             | Próxima leitura reflete a mudança               |
| AC-210         | teste unitário de degradação sem Redis                   | Cálculo sem cache e escrita sem falha           |
| AC-211         | testes de paginação e validação                          | Limites e erros corretos                        |
| AC-212         | testes unitários de DataLoader                           | Batching por requisição                         |
| AC-213         | geração dupla de schema/types e comparação de hash       | Sem drift                                       |
| AC-214         | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | Saída verde                                     |
| AC-215         | revisão de docs e matriz                                 | Documentos e rastreabilidade atualizados        |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade foram atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas: modelos `Deal` e `Activity` com enums e migration;
  seed com negócios em todas as etapas e atividades; CRUD GraphQL de negócios
  com etapas, encerramento e concorrência otimista por `version`; timeline de
  atividades com cursor por `occurredAt`; provider Redis; pub/sub e
  subscription `dealMoved` autenticada via `graphql-ws`; `dashboardMetrics`
  com cache Redis de 30 s e invalidação por versão de escopo; DataLoaders de
  contato/negócio; schema, codegen e documentação atualizados.
- Evidências:
  - `prisma migrate dev` aplicou a migration
    `20261111124822_fase_2_deals_activities`; `prisma db seed` concluiu.
  - `pnpm --filter @nexo/api test`: 6 arquivos, 17 testes aprovados.
  - `pnpm --filter @nexo/api test:integration`: 2 arquivos, 17 testes
    aprovados (Fase 1 e Fase 2, incluindo concorrência, IDOR, timeline,
    subscription, cache e validação).
  - `pnpm lint`: sucesso com `--max-warnings 0`.
  - `pnpm typecheck`: 6 tarefas aprovadas.
  - `pnpm test`: suíte completa com 26 testes aprovados (API 17, web 3,
    shared 4, worker 2).
  - `pnpm build`: tarefas aprovadas.
  - `pnpm format:check`: todos os arquivos formatados.
  - Regeneração dupla de `schema.graphql` e `types.ts` produziu hashes
    idênticos (`SEM_DRIFT`).
- Desvios e decisões de implementação:
  - Pub/sub Redis foi implementado com `ioredis` e um serviço de eventos
    próprio, sem `graphql-redis-subscriptions`, para reduzir dependências.
  - A invalidação do dashboard usa versão por escopo
    (`dashboard:version:<scope>`) em vez de varredura de chaves, evitando
    `SCAN` e mantendo o TTL como rede de segurança.
  - `onConnect` do `graphql-ws` valida o JWT com `AuthService`; o guard
    reaproveita o usuário já autenticado na conexão.
  - Activities são imutáveis após criação, conforme o escopo aprovado.
  - Criar negócio já em `WON`/`LOST` preenche `closedAt`, mantendo a regra de
    encerramento consistente com o update.
  - Excluir negócio remove suas atividades por cascata; o comportamento está
    registrado como decisão desta fase.
  - O helper de integração passou a subir Redis e a chamar `app.listen(0)`
    para permitir o cliente WebSocket nos testes.
- Limitações e pendências:
  - Pub/sub é best-effort; não há entrega durável nem reenvio de eventos.
  - Se o Redis cair durante a inicialização, a API não reassina o canal até
    reiniciar; o dashboard continua funcionando sem cache.
  - Sem múltiplas moedas; `valueCents` é inteiro em BRL e usa `Int` no schema.
  - Sem edição/exclusão de atividades e sem reabertura de negócios.
  - Sem rate limit de login/GraphQL, persisted queries ou benchmark k6
    (Fase 5).
  - CI da Fase 2 ainda não foi executada no GitHub; validar em PR.
  - `schema:check` só passa com os arquivos versionados; antes do commit ele
    acusa a diferença esperada da própria fase.
