# TASK: Fundação web — sessão, GraphQL, shell, i18n e filtros

## Metadados

| Campo        | Valor                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| ID           | TASK-005-01                                                                           |
| Status       | Implementada — aguardando revisão                                                     |
| Responsável  | Engenharia de front-end                                                               |
| SPEC         | SPEC-005                                                                              |
| Critérios    | AC-501, AC-502, AC-503, AC-504, AC-517, AC-518, AC-521, AC-523, AC-524                |
| Dependências | SPEC-005 aprovada; UXB-001 e DS-001 aprovados; ADR-008 aceito; Fases 1 a 3 concluídas |

## Objetivo

Entregar a fundação do front-end: sessão segura, cliente GraphQL tipado, shell
responsivo e acessível, tema, i18n pt-BR e extensões aditivas de filtros na API
necessárias às telas seguintes.

## Escopo

### Incluído

- Dependências e codegen do cliente GraphQL (`@apollo/client`, `graphql-ws`).
- `SessionStore` em memória, bootstrap por refresh, login, logout, renovação
  single-flight e retorno à rota original.
- Links HTTP/WS, tratamento normalizado de erros e limpeza de cache.
- Rotas base e guards: `/login`, `/`, `/contacts`, `/contacts/:contactId`,
  `/pipeline`, `/inbox`, `/inbox/:conversationId`, `*`.
- Shell responsivo, navegação, link de salto, anúncio de rota e estados de
  sessão/conexão.
- Tokens de tema, alternância claro/escuro/sistema e persistência sem flash.
- Catálogo tipado pt-BR e formatação `Intl`/BRL/America/Sao_Paulo.
- Extensões GraphQL aditivas `contacts(search, companyId)`,
  `deals(contactId, companyId, stages, search)` e
  `conversations(contactId, search)`, com testes de autorização.
- Testes de sessão, rota, shell, tema, i18n e filtros.
- Atualização de schema/codegen, documentação e rastreabilidade.

### Não incluído

- Lista/visão 360° de contatos (TASK-005-02).
- Kanban, inbox e dashboard (TASK-005-03).
- E2E Playwright, analytics e telemetria.
- Qualquer mutação de domínio nova.

## Abordagem e impacto

- Arquivos: `apps/web/src/**`, `apps/web/package.json`,
  `packages/graphql-schema/**`, `apps/api/src/contacts/**`,
  `apps/api/src/deals/**`, `apps/api/src/conversations/**`, testes da API,
  `docs/a11y.md`, `docs/architecture.md`, `docs/security.md`, `PROJECT.md`.
- Contratos: argumentos opcionais de filtro; respostas existentes preservadas.
- Segurança: token apenas em memória; refresh cookie; logout limpa cache e
  WebSocket; erros de autorização não revelam existência.
- Padrões: ADR-002, ADR-004, ADR-005, ADR-008, `docs/a11y.md`,
  `standards/ux-ui.md`, `standards/design-system.md`.

## Passos

- [ ] Aprovar TASK-005-01 e QA-001.
- [x] Adicionar dependências e configurar codegen/documentos GraphQL.
- [x] Implementar `SessionStore`, refresh single-flight e cliente Apollo.
- [x] Implementar login, logout, guards e `returnTo`.
- [x] Implementar shell, rotas base, anúncio de rota e estados globais.
- [x] Implementar tokens de tema, alternância e persistência.
- [x] Implementar catálogo pt-BR, `Intl` e provider.
- [x] Adicionar filtros aditivos na API e testes de IDOR.
- [x] Adicionar testes de componente e acessibilidade da fundação.
- [x] Regenerar schema/types e verificar drift.
- [x] Rodar lint, typecheck, testes, build e format.
- [x] Atualizar documentação e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                          | Evidência esperada                                 |
| -------------- | -------------------------------------------------- | -------------------------------------------------- |
| AC-501         | teste de bootstrap com e sem refresh               | Sessão restaurada ou login sem erro interno        |
| AC-502         | testes de login, logout, expiração e refresh único | Token em memória, cache limpo e refresh controlado |
| AC-503         | teste de rota protegida e `returnTo`               | Destino preservado após login                      |
| AC-504         | teste de shell, navegação e anúncio                | Landmarks, foco, `aria-current` e títulos          |
| AC-517         | teste de tema e revisão visual                     | Claro/escuro/sistema sem flash                     |
| AC-518         | teste de catálogo e formatação                     | Textos externalizados e formatos pt-BR             |
| AC-521         | testes de API com filtros e dois donos             | Apenas registros autorizados; ADMIN vê todos       |
| AC-523         | inspeção de storage, cookies e logs                | Sem token, PII ou corpo de mensagem                |
| AC-524         | `pnpm lint && typecheck && test && build` e schema | Tudo verde, sem drift                              |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade foram atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

Implementado em 2026-11-11.

### Escopo entregue

- Dependências `@apollo/client`, `graphql-ws`, `@hookform/resolvers`,
  `react-hook-form`, `zod`, `react-router-dom` e `@dnd-kit/core`.
- Codegen consumindo os documentos de `apps/web/src/**/*.graphql` e emitindo
  `DocumentNode`; schema/types regenerados.
- `SessionStore` em memória com refresh single-flight, login, logout e
  limpeza de cache Apollo; token nunca vai para storage.
- Cliente Apollo HTTP/WS, normalização de erros e `resetApolloState`.
- Shell responsivo, navegação com `aria-current`, link de salto, anúncio de
  rota, título por rota, tema claro/escuro/sistema e catálogo pt-BR tipado.
- Rotas e guards para login, dashboard, contatos, visão 360°, pipeline, inbox,
  conversa e não encontrado.
- Filtros aditivos `contacts(search, companyId)`, `deals(contactId, companyId,
stages, search)` e `conversations(contactId, search)` com testes de IDOR.

### Validações executadas

- `pnpm lint` — verde, com `--max-warnings 0`.
- `pnpm typecheck` — 6 tarefas verdes.
- `pnpm --filter @nexo/web test` — 39 testes verdes.
- `pnpm --filter @nexo/api exec vitest run -c vitest.integration.config.ts
test/fase-4.e2e.test.ts` — 5 testes verdes.
- `pnpm build` — verde; o primeiro `pnpm build` pode falhar pela corrida de
  `prisma generate` entre API e worker, e passa ao repetir.
- `pnpm format:check` — verde.
- `schema:generate` e `schema:codegen` executados; `schema:check` só conclui
  após o commit, pois compara contra o índice do Git.

### Desvios e limitações

- O token de acesso fica apenas em memória; recarregar a página depende do
  refresh em cookie.
- O bundle principal tem ~708 kB (aviso do Vite); code splitting fica para a
  Fase 5.
- Playwright/axe e leitor de tela real continuam fora desta fase.

### Pendências

- Aprovação formal da TASK e do QA-001 por revisores independentes.
- Commit com `Spec-Ref: SPEC-005` e `Task-Ref: TASK-005-01`.
- `schema:check` e CI no GitHub após o commit.
