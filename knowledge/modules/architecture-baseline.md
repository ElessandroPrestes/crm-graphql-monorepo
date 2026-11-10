# Baseline de arquitetura (KB-002)

## Metadados

| Campo            | Valor                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Domínio          | Engenharia e arquitetura                                           |
| Responsável      | Arquitetura (a designar)                                           |
| Revisado em      | 2026-11-09                                                         |
| Aplicabilidade   | Escolha de stack, limites do monorepo, contrato GraphQL e operação |
| Fonte da verdade | `PROJECT.md`, ADRs aceitos e SPECs aprovadas                       |

## Estado atual

Fase 0 concluída: monorepo pnpm + Turborepo com esqueletos NestJS (API e
worker) e React/Vite (web). Sem domínio, persistência, autenticação ou GraphQL.

## Decisões tomadas

- pnpm workspaces + Turborepo (ADR-001).
- API e worker NestJS; web React/Vite; PostgreSQL, Redis e RabbitMQ no Compose
  (ADR-002).
- Node 26 LTS, TypeScript 6.0.3, GraphQL 16, Prisma 7.10.1 (ADR-003).
- Portas locais: web 5217, API 3202, worker 3203, Postgres 5402, Redis 8203,
  RabbitMQ 8204/8205.

## Decisões pendentes (exigem ADR/SPEC)

1. Modelo Prisma, migrations e seed.
2. Framework de servidor GraphQL (Apollo code-first) e estratégia de schema.
3. Autenticação, autorização e autorização por campo no GraphQL.
4. Estratégia de subscriptions (Redis pub/sub) e rate limit.
5. Fila RabbitMQ, idempotência, retentativas e DLQ.
6. Build/deploy, observabilidade completa e thresholds de cobertura.

## Restrições conhecidas

- Mudanças arquiteturais exigem ADR (`templates/adr.md`).
- Nenhum segredo, credencial ou dado de produção pode ser versionado.
- Webhooks, uploads e pagamentos permanecem REST.

## Referências

- `standards/coding.md`, `standards/api.md`, `standards/database.md`,
  `standards/security.md`, `standards/performance.md`
- `templates/adr.md`, `workflows/feature.md`, `docs/architecture.md`
