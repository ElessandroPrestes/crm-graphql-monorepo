# Changelog — Nexo CRM

Todas as alterações relevantes deste projeto serão documentadas neste arquivo.
O formato segue os princípios de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e o versionamento adotará [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.2.0-alpha] - 2026-11-09

### Adicionado

- Monorepo com pnpm workspaces e Turborepo.
- `apps/api` (NestJS) com validação de ambiente, helmet, CORS, logs pino e
  health checks `/health/live` e `/health/ready`.
- `apps/worker` (NestJS) com health check próprio.
- `apps/web` (React + Vite + Tailwind) com shell acessível em pt-BR, skip link,
  landmarks, anúncio de rota e testes de componente.
- Pacotes `@nexo/shared`, `@nexo/tsconfig`, `@nexo/eslint-config` e
  `@nexo/graphql-schema`.
- ESLint flat, Prettier, Husky, lint-staged e commitlint.
- Docker Compose com Postgres, Redis e RabbitMQ; Dockerfiles multi-stage
  non-root com `HEALTHCHECK`.
- CI com install frozen, lint, typecheck, testes, build, `pnpm audit`,
  gitleaks, Trivy e CodeQL. Actions fixadas por SHA.
- ADRs 001-003, `docs/architecture.md`, `docs/security.md`, `docs/a11y.md` e
  `SECURITY.md`.
- SPEC-001 e TASK-001-01 com critérios de aceite rastreáveis.

### Alterado

- `PROJECT.md`, `README.md` e `ROADMAP.md` passam a descrever o Nexo CRM.
- Portas locais reservadas: web 5217, API 3202, worker 3203, Postgres 5402,
  Redis 8203, RabbitMQ 8204/8205.

### Observações

- Nenhuma funcionalidade de domínio, autenticação ou GraphQL foi implementada;
  isso pertence à Fase 1.
- Controles de segurança ainda parciais estão registrados em
  `docs/security.md`.

---

## [0.1.0-alpha] - 2026-11-09

### Adicionado

- Adoção inicial do Universal SDD no repositório.
- Estrutura de governança, pontes de entrada de IA, estado canônico e base de
  conhecimento.
