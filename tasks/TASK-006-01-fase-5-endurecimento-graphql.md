# TASK: Endurecimento GraphQL, rate limit e autenticação

## Metadados

| Campo        | Valor                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-006-01                                                                                                                        |
| Status       | Planned — aguardando aprovação                                                                                                     |
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

- [ ] Aprovar SPEC-006, ADR-009, esta TASK e QA-002.
- [ ] Definir limites e política de senha com Segurança/Produto.
- [ ] Implementar allowlist e modo audit/enforce no servidor.
- [ ] Integrar o hash de persisted query no cliente Apollo.
- [ ] Implementar rate limit de login, GraphQL e handshake WS com Redis.
- [ ] Implementar política de senha e bloqueio progressivo.
- [ ] Aplicar limite de corpo e desativar sugestões em produção.
- [ ] Adicionar testes unitários, de integração e de bypass.
- [ ] Rodar lint, typecheck, testes, build e schema check.
- [ ] Atualizar documentação, `.env.example` e rastreabilidade.

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

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade atualizadas.
- [ ] Limitações e desvios registrados.

## Resultado

- Mudanças feitas: pendente.
- Evidência: pendente.
- Trabalho em aberto ou bloqueios: aprovação de SPEC-006/ADR-009 e decisão dos
  limites.
