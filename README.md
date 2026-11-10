# Nexo CRM

> **Status:** Fase 0 concluída — fundação técnica pronta; domínio e GraphQL
> entram na Fase 1.
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

> **Demo:** espaço reservado para o GIF do fluxo completo (Fase 4).

---

## Fases

| Fase | Escopo                                                           | Status    |
| ---- | ---------------------------------------------------------------- | --------- |
| 0    | Fundação: monorepo, tooling, esqueletos, Docker, CI e docs       | Concluída |
| 1    | Domínio e API núcleo: Prisma, auth, RBAC, GraphQL, DataLoader    | Pendente  |
| 2    | Funil e dashboard: negócios, concorrência, subscriptions, cache  | Pendente  |
| 3    | WhatsApp e eventos: provider, HMAC, RabbitMQ, worker, DLQ        | Pendente  |
| 4    | Front-end: login, contatos, visão 360°, kanban, inbox, dashboard | Pendente  |
| 5    | Endurecimento: persisted queries, k6, e2e, STRIDE e deploy       | Pendente  |

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
pnpm dev
```

`pnpm dev` sobe Postgres, Redis e RabbitMQ via Docker Compose e inicia as três
aplicações em paralelo.

| Serviço                   | URL local                          |
| ------------------------- | ---------------------------------- |
| Web                       | http://localhost:5217              |
| API — liveness            | http://localhost:3202/health/live  |
| API — readiness           | http://localhost:3202/health/ready |
| Worker — health (interna) | http://localhost:3203/health/live  |
| RabbitMQ Management       | http://localhost:8205              |

Credenciais locais do RabbitMQ: `nexo` / `nexo`. Não use em produção.

### Stack completo em containers

```sh
pnpm infra:full
```

### Comandos de qualidade

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

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
│  ├─ api/                NestJS + health checks
│  ├─ worker/             Worker NestJS + health check
│  └─ web/                React + Vite + Tailwind
├─ packages/
│  ├─ graphql-schema/     Schema gerado e documents (Fase 1)
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
