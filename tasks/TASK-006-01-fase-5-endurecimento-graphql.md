# TASK: Endurecimento GraphQL, rate limit e autenticação

## Metadados

| Campo        | Valor                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-006-01                                                                                                                        |
| Status       | Done — validação local; revisão independente pendente                                                                              |
| Responsável  | Engenharia de API/Segurança                                                                                                        |
| Refs:        | SPEC: SPEC-006; Critérios: AC-601, AC-602, AC-603, AC-604, AC-605, AC-606, AC-607, AC-608, AC-609, AC-620; ADRs: ADR-009 (a criar) |
| Dependências | SPEC-006 e ADR-009 aprovados; Redis disponível; cliente Apollo atualizado                                                          |

## Objetivo

Impedir abuso e queries arbitrárias em produção, com persisted queries,
rate limit de login/GraphQL/WebSocket, limite de corpo, política de senha e
bloqueio progressivo, sem alterar o comportamento funcional aprovado.

## Escopo

### Incluído

- Allowlist de persisted queries gerada pelo codegen e enviada pelo Apollo.
- Modos `audit` e `enforce`, com erro `PERSISTED_QUERY_NOT_FOUND`.
- Rate limit de login por IP/e-mail, GraphQL por usuário/IP e handshake WS.
- Bloqueio progressivo e política de senha validada por Zod.
- Limite explícito de corpo para JSON/GraphQL.
- Desativação de sugestões de campo em produção.
- ADR-009 com decisões, limites e rollback.
- Testes unitários e de integração dos controles.

### Excluído

- E2E Playwright, axe e k6 (TASK-006-02/03).
- Mudanças em regras de negócio, autorização ou schema funcional.
- Outbox/exactly-once e entrega durável de eventos.

## Abordagem e impacto

- Prováveis arquivos: `apps/api/src/graphql/**`, `apps/api/src/auth/**`,
  `apps/api/src/config/env.ts`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`,
  `apps/web/src/graphql/client.ts`, `packages/graphql-schema/**`,
  `infra/docker-compose.yml`, `.env.example`.
- Dados/contratos: nenhuma migração Prisma prevista; chaves de rate limit no
  Redis; allowlist versionada; env `PERSISTED_QUERIES_MODE` e limites.
- Salvaguardas: ativação em audit, fail-closed no login, logs sem PII, testes
  de bypass e rollback por env.
- Padrões: `standards/api.md`, `standards/security.md`,
  `standards/quality-gates.md`; ADR-009.

## Etapas

- [x] Aprovar SPEC-006, ADR-009, esta TASK e QA-002 (instrução humana de 2026-11-13).
- [x] Definir limites e política de senha com defaults registrados em ADR-009.
- [x] Implementar allowlist e modo audit/enforce no servidor.
- [x] Integrar o hash de persisted query no cliente Apollo.
- [x] Implementar rate limit de login, GraphQL e handshake WS com Redis.
- [x] Implementar política de senha e bloqueio progressivo.
- [x] Aplicar limite de corpo e desativar sugestões em produção.
- [x] Adicionar testes unitários, de integração e de bypass.
- [x] Rodar lint, typecheck, testes, build e schema check.
- [x] Atualizar documentação, `.env.example` e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                                 | Evidência esperada                              |
| -------------- | --------------------------------------------------------- | ----------------------------------------------- |
| AC-601         | Build + check de drift da allowlist                       | Allowlist igual às operações; drift falha       |
| AC-602         | Teste de integração em modo audit                         | Query executa e gera log/métrica                |
| AC-603         | Teste de integração em modo enforce                       | `PERSISTED_QUERY_NOT_FOUND`, sem resolver       |
| AC-604         | Teste de login acima do limite                            | `429` + `Retry-After`, mensagem genérica        |
| AC-605         | Testes de senha fraca e bloqueio progressivo              | Senha rejeitada; conta bloqueia temporariamente |
| AC-606         | Teste GraphQL acima do limite por usuário/IP              | `429` + `Retry-After`                           |
| AC-607         | Teste de conexões WS acima do limite                      | Fechamento observável e log                     |
| AC-608         | Teste de payload acima do limite                          | `413` antes da execução                         |
| AC-609         | Teste em `NODE_ENV=production`                            | Introspecção negada; sem sugestões              |
| AC-620         | `pnpm lint && typecheck && test && build && schema:check` | Gates verdes, sem regressão                     |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade atualizadas.
- [x] Limitações e desvios registrados.

## Resultado

- Mudanças feitas: allowlist de persisted queries gerada pelo codegen e
  integrada ao Apollo; modos audit/enforce; rate limit de login, GraphQL e WS;
  bloqueio progressivo; política de senha; limite de corpo; sanitização de
  sugestões em produção; ADR-009; testes unitários e de integração.
- Evidência: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
  `pnpm format:check`, `pnpm --filter @nexo/api schema:check` e
  `pnpm audit --audit-level high` passaram. Testes: API unit 37, web 39,
  integração completa 37 (inclui `fase-5` com 7 e `fase-5-production` com 2).
- Trabalho em aberto ou bloqueios: revisão independente de Segurança/QA e
  revisão dos limites antes do release; `pnpm audit` mantém 2 advisories
  moderadas em ferramentas dev, já conhecidas e sem correção compatível.
