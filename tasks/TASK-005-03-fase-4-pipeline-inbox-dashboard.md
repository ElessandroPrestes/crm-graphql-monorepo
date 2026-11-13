# TASK: Pipeline, inbox em tempo real e dashboard

## Metadados

| Campo        | Valor                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------- |
| ID           | TASK-005-03                                                                                    |
| Status       | Done — revisão aprovada com ressalvas (REVIEW-001)                                             |
| Responsável  | Engenharia de front-end                                                                        |
| SPEC         | SPEC-005                                                                                       |
| Critérios    | AC-509, AC-510, AC-511, AC-512, AC-513, AC-514, AC-515, AC-516, AC-519, AC-520, AC-522, AC-524 |
| Dependências | TASK-005-01 concluída; filtros GraphQL e sessão disponíveis; seed fictício                     |

## Objetivo

Entregar o kanban acessível com concorrência otimista, o inbox em tempo real
com envio idempotente e o dashboard de métricas, preservando autorização,
estados de falha e anúncios acessíveis.

## Escopo

### Incluído

- `/pipeline` com colunas de etapas abertas, contagem/valor, filtros e resumo
  de `WON`/`LOST`.
- Drag and drop com dnd-kit e alternativa “Mover para etapa” por teclado.
- Movimento com `expectedVersion`, atualização de totais e recuperação de
  `CONFLICT`.
- `/inbox` e `/inbox/:conversationId` com busca, histórico paginado, envio com
  `clientMessageId`, estados pendente/sent/failed e repetição idempotente.
- Subscription `messageReceived`, atualização da lista/thread, estado de
  reconexão e anúncios `aria-live` sem roubo de foco.
- `/` com `dashboardMetrics`, período, estados de cache/erro e atualização após
  mutações relevantes.
- Testes de componente, contrato, acessibilidade e concorrência.
- Atualização de documentação e rastreabilidade.

### Não incluído

- Reabertura de `WON`/`LOST`.
- Mídia, templates, status de entrega/leitura e presença.
- Notificações do sistema, push e analytics.
- E2E Playwright (Fase 5).

## Abordagem e impacto

- Arquivos: `apps/web/src/pipeline/**`, `apps/web/src/inbox/**`,
  `apps/web/src/dashboard/**`, `apps/web/src/graphql/**`, testes da API,
  `docs/a11y.md`, `docs/architecture.md`, `PROJECT.md`.
- Contratos: `deals(stages, contactId, companyId, search)`,
  `updateDeal(expectedVersion)`, `conversations(contactId, search)`,
  `messages`, `sendMessage`, `messageReceived`, `dashboardMetrics`.
- Concorrência: conflito não sobrescreve; recarrega o quadro e preserva
  seleção; nenhuma mutação otimista sem rollback visível.
- Tempo real: WebSocket autenticado, reconexão controlada e falha visível.
- Acessibilidade: kanban operável por teclado, anúncios `polite`, foco
  preservado no composer e contraste AA.

## Passos

- [ ] Aprovar TASK-005-03 e QA-001.
- [x] Implementar kanban, colunas, filtros e resumo.
- [x] Implementar drag and drop e alternativa por teclado.
- [x] Implementar movimento com `expectedVersion` e conflito.
- [x] Implementar lista e thread do inbox com paginação.
- [x] Implementar envio idempotente e estados de mensagem.
- [x] Implementar `messageReceived`, reconexão e anúncios.
- [x] Implementar dashboard e atualização após mutações.
- [x] Adicionar testes de componente, concorrência e acessibilidade.
- [x] Rodar lint, typecheck, testes, build e format.
- [x] Atualizar documentação e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                          | Evidência esperada                                   |
| -------------- | -------------------------------------------------- | ---------------------------------------------------- |
| AC-509         | testes de kanban com dois donos                    | Colunas, totais e resumo corretos                    |
| AC-510         | testes de drag, menu e teclado                     | Mesmo resultado por mouse e teclado                  |
| AC-511         | teste de conflito de versão                        | Recarga, seleção preservada e mensagem clara         |
| AC-512         | testes de lista, thread e paginação                | Ordem, cursor e escopo por dono                      |
| AC-513         | teste de envio e repetição                         | Pendente → SENT/FAILED sem duplicata                 |
| AC-514         | teste de subscription e anúncio                    | Lista/thread atualizadas e foco no composer          |
| AC-515         | teste de queda e retorno do WebSocket              | Estado visível, histórico disponível e retomada      |
| AC-516         | testes de métricas, período e mutação              | Valores corretos e atualização após mover            |
| AC-519         | revisão em viewports e zoom                        | Sem perda de conteúdo ou rolagem horizontal indevida |
| AC-520         | axe e checklist manual                             | Sem violação crítica ou séria nos fluxos             |
| AC-522         | testes de erro, vazio e sem resultado              | Mensagens e ações distintas                          |
| AC-524         | `pnpm lint && typecheck && test && build` e schema | Tudo verde, sem drift                                |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade foram atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

Implementado em 2026-11-11.

### Escopo entregue

- Kanban agrupado por etapa com totais, filtros compartilhados por URL e
  resumo de métricas.
- Drag and drop com `@dnd-kit/core` e menu acessível de movimento por teclado.
- Movimento com `expectedVersion`, aviso de `CONFLICT`, recarga do board e
  preservação do contexto.
- Inbox com busca, paginação, lista de conversas e thread com mensagens
  antigas.
- Envio idempotente com `clientMessageId` estável, estados pendente/falhou,
  reenvio com o mesmo id e foco no composer.
- Subscription `messageReceived` com anúncio em `aria-live` e recarga da
  thread sem roubo de foco.
- Dashboard com métricas, período e tabela por etapa.
- Testes de componente para kanban, conflito, inbox, envio/retry,
  subscription e dashboard.

### Validações executadas

- `pnpm lint` — verde.
- `pnpm --filter @nexo/web typecheck` — verde.
- `pnpm --filter @nexo/web test` — 39 testes verdes, incluindo pipeline,
  inbox e dashboard.
- `pnpm --filter @nexo/api exec vitest run -c vitest.integration.config.ts
test/fase-4.e2e.test.ts` — 5 testes verdes.
- `pnpm build` e `pnpm format:check` — verdes.

### Desvios e limitações

- Subscriptions e eventos continuam best-effort; não há outbox transacional
  nem exactly-once.
- A queda e retomada do WebSocket tem aviso visual, mas o teste automatizado
  de reconexão ponta a ponta fica para a Fase 5.
- Axe/Playwright e leitor de tela real não foram executados nesta fase.

### Pendências

- Aprovação formal da TASK e do QA-001.
- Teste de reconexão, revisão manual de acessibilidade e responsividade.
- Commit com `Spec-Ref: SPEC-005` e `Task-Ref: TASK-005-03`.
