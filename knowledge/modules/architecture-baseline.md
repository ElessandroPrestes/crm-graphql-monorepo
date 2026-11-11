# Baseline de arquitetura (KB-002)

## Metadados

| Campo            | Valor                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Domínio          | Engenharia e arquitetura                                           |
| Responsável      | Arquitetura (a designar)                                           |
| Revisado em      | 2026-11-11                                                         |
| Aplicabilidade   | Escolha de stack, limites do monorepo, contrato GraphQL e operação |
| Fonte da verdade | `PROJECT.md`, ADRs aceitos e SPECs aprovadas                       |

## Estado atual

Fases 0, 1 e 2 concluídas: monorepo pnpm + Turborepo; API NestJS com REST de
auth, GraphQL (contatos, empresas, negócios, atividades e dashboard),
subscriptions `graphql-ws` com Redis pub/sub e DataLoaders. Worker e web ainda
estão implementados, incluindo consumer do WhatsApp e RabbitMQ.

## Decisões tomadas

- pnpm workspaces + Turborepo (ADR-001).
- API e worker NestJS; web React/Vite; PostgreSQL, Redis e RabbitMQ no Compose
  (ADR-002).
- Node 26 LTS, TypeScript 6.0.3, GraphQL 16, Prisma 7.10.1 (ADR-003).
- Portas locais: web 5217, API 3202, worker 3203, Postgres 5402, Redis 8203,
  RabbitMQ 8204/8205.
- Prisma com modelos de auth, contatos, empresas, negócios e atividades
  (ADR-003 e SPEC-002/SPEC-003).
- Apollo code-first com schema versionado e drift check (ADR-002).
- Auth JWT curto + refresh rotativo e RBAC por propriedade (ADR-004).
- Subscriptions `graphql-ws` autenticadas e cache do dashboard em Redis
  (ADR-005).

## Decisões pendentes (exigem ADR/SPEC)

1. Fila RabbitMQ, idempotência, retentativas e DLQ (Fase 3, implementado).
2. Webhook do WhatsApp, provider, conversas/mensagens e LGPD (Fase 3, implementado).
3. Interface web, kanban, i18n e temas (Fase 4).
4. Rate limit, persisted queries, build/deploy, observabilidade completa e
   thresholds de cobertura (Fase 5).

## Restrições conhecidas

- Mudanças arquiteturais exigem ADR (`templates/adr.md`).
- Nenhum segredo, credencial ou dado de produção pode ser versionado.
- Webhooks, uploads e pagamentos permanecem REST.

## Referências

- `standards/coding.md`, `standards/api.md`, `standards/database.md`,
  `standards/security.md`, `standards/performance.md`
- `templates/adr.md`, `workflows/feature.md`, `docs/architecture.md`
