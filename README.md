# Nexo CRM

> **Status:** Fases 0 a 4 implementadas — fundação, domínio, autenticação,
> funil, WhatsApp, worker idempotente, LGPD e front-end React (sessão,
> contatos/360°, kanban, inbox em tempo real e dashboard). Revisão e QA final
> pendentes.
> **Governança:** Universal SDD (Spec-Driven Development).
> **Stack:** Node.js 26 LTS · pnpm · Turborepo · NestJS · React · Vite ·
> TypeScript · Tailwind CSS.

---

## Sobre o projeto

O **Nexo CRM** é um mini CRM para times pequenos de vendas, construído como
monorepo de demonstração técnica. O objetivo é mostrar GraphQL onde ele faz
sentido: visão 360° do contato em uma única query, API como BFF tipado por
codegen, subscriptions em tempo real e desempenho consciente (DataLoader,
cache e limites de complexidade).

Fluxos de webhook, upload e pagamento permanecem em REST, conforme
[ADR-002](adr/ADR-002-stack-api-graphql.md).

> **Demo:** espaço reservado para o GIF do fluxo completo.

---

## Fases

| Fase | Escopo                                                           | Status       |
| ---- | ---------------------------------------------------------------- | ------------ |
| 0    | Fundação: monorepo, tooling, esqueletos, Docker, CI e docs       | Concluída    |
| 1    | Domínio e API núcleo: Prisma, auth, RBAC, GraphQL, DataLoader    | Concluída    |
| 2    | Funil e dashboard: negócios, concorrência, subscriptions, cache  | Concluída    |
| 3    | WhatsApp e eventos: provider, HMAC, RabbitMQ, worker, DLQ, LGPD  | Concluída    |
| 4    | Front-end: login, contatos, visão 360°, kanban, inbox, dashboard | Em revisão   |
| 5    | Endurecimento: persisted queries, k6, e2e, STRIDE e deploy       | Em andamento |

---

## Pré-requisitos

- Node.js **26.13.0** (use `.nvmrc`)
- pnpm **12.18.0**
- Docker e Docker Compose

```sh
nvm install
nvm use
npm install -g pnpm@12.18.0
```

---

## Como rodar

```sh
pnpm install --frozen-lockfile
pnpm infra:up
pnpm --filter @nexo/api db:migrate
pnpm --filter @nexo/api db:seed
pnpm dev
```

`pnpm dev` sobe Postgres, Redis e RabbitMQ via Docker Compose (idempotente) e
inicia as três aplicações em paralelo. Migrations e seed só precisam rodar na
primeira execução ou após mudanças de schema.

| Serviço                   | URL local                               |
| ------------------------- | --------------------------------------- |
| Web                       | http://localhost:5217                   |
| API — liveness            | http://localhost:3202/health/live       |
| API — readiness           | http://localhost:3202/health/ready      |
| API — GraphQL             | http://localhost:3202/graphql           |
| API — auth                | http://localhost:3202/auth/*            |
| API — webhook WhatsApp    | http://localhost:3202/webhooks/whatsapp |
| Worker — health (interna) | http://localhost:3203/health/live       |
| RabbitMQ Management       | http://localhost:8205                   |

Credenciais locais do RabbitMQ: `nexo` / `nexo`. Não use em produção.

### Stack completo em containers

```sh
pnpm infra:full
```

### Banco e seed

```sh
pnpm --filter @nexo/api db:migrate
pnpm --filter @nexo/api db:seed
```

Seed local (apenas dados fictícios): `admin@nexo.local`,
`vendedor1@nexo.local` e `vendedor2@nexo.local`, senha `NexoDemo!2026`.

### Comandos de qualidade

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @nexo/api test:integration
pnpm --filter @nexo/worker test:integration
pnpm build
pnpm format:check
pnpm --filter @nexo/api schema:check
```

### E2E e acessibilidade

```sh
pnpm e2e:install   # instala o Chromium do Playwright
pnpm e2e:prepare   # build da API e do web
pnpm e2e:db        # migrations e seed do banco de teste
pnpm infra:up
pnpm e2e
```

O `playwright.config.ts` sobe API (`3202`) e web (`5217`) e executa os projetos
`desktop-chromium`, `mobile-chromium` e `api-security`. A suíte cobre fluxos
críticos, axe nos temas claro/escuro, teclado/reflow e testes negativos de
segurança. Antes da execução os contadores `throttle:*` do Redis são limpos.

### Infraestrutura

```sh
pnpm infra:up    # postgres, redis e rabbitmq
pnpm infra:down
```

---

## Estrutura

```text
nexo-crm/
├─ apps/
│  ├─ api/                NestJS + auth REST + GraphQL + Prisma
│  ├─ worker/             Worker NestJS + consumer WhatsApp
│  └─ web/                React + Vite + Tailwind
├─ packages/
│  ├─ graphql-schema/     Schema gerado, types e documents
│  ├─ shared/             Schemas zod e utilidades puras
│  ├─ eslint-config/      ESLint flat compartilhado
│  └─ tsconfig/           TypeScript compartilhado
├─ infra/                 Compose, Dockerfiles e Nginx
├─ specs/ tasks/ reviews/ Rastreabilidade SDD
├─ adr/                   Decisões arquiteturais
├─ docs/                  Arquitetura, segurança, a11y e guias
└─ .github/               CI, segurança e automação
```

---

## Decisões principais

- [ADR-001](adr/ADR-001-monorepo-pnpm-turborepo.md): pnpm workspaces + Turborepo.
- [ADR-002](adr/ADR-002-stack-api-graphql.md): NestJS + Apollo, Prisma,
  Redis, RabbitMQ, React.
- [ADR-003](adr/ADR-003-versoes-e-compatibilidade.md): versões fixadas e
  compatibilidade de peers.
- [ADR-004](adr/ADR-004-autenticacao-rest-e-rbac.md): autenticação REST,
  refresh rotativo e RBAC por propriedade.
- [ADR-005](adr/ADR-005-subscriptions-graphql-redis.md): subscriptions e cache
  via Redis.
- [ADR-006](adr/ADR-006-whatsapp-rabbitmq-idempotencia.md): WhatsApp, RabbitMQ
  e idempotência.
- [ADR-007](adr/ADR-007-lgpd-exportacao-exclusao.md): exportação e exclusão
  LGPD.

---

## Segurança e acessibilidade

- Segurança: [docs/security.md](docs/security.md) e [SECURITY.md](SECURITY.md).
- Acessibilidade: [docs/a11y.md](docs/a11y.md), alvo WCAG 2.2 AA.
- Nenhum segredo real é versionado; use `.env.example` como referência.

---

## Rastreabilidade

Commits de implementação registram:

```text
Spec-Ref: SPEC-NNN
Task-Ref: TASK-NNN-XX
```

Matriz de rastreabilidade:

```sh
python3 scripts/generate_traceability.py
```

Consulte [docs/ids-and-traceability.md](docs/ids-and-traceability.md).

---

## Licença

[MIT](LICENSE).
