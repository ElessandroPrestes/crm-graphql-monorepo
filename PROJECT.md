# PROJECT: Nexo CRM

## Metadados

| Campo                   | Valor                                                    |
| ----------------------- | -------------------------------------------------------- |
| Nome do Projeto         | Nexo CRM (`crm-graphql-monorepo`)                        |
| Organização             | Portfólio pessoal                                        |
| Responsável             | Engenharia (a designar por área)                         |
| Estado                  | Ativo — Fase 0 (Fundação) implementada; domínio pendente |
| Versão ou release       | `0.2.0-alpha`                                            |
| Última revisão          | 2026-11-09                                               |
| Revisores               | Produto / Engenharia / QA / Segurança                    |
| Framework de Governança | Universal SDD (Spec-Driven Development)                  |

---

## 1. Visão geral e domínio

- **Problema e resultado principal**: fornecer um mini CRM para times pequenos
  de vendas, com contatos e empresas, funil de negociações (kanban), caixa de
  entrada de conversas de WhatsApp em tempo real e dashboard simples. O projeto
  é também uma demonstração técnica de GraphQL como BFF tipado.
- **Usuários e partes interessadas**: vendedores (`SELLER`) e administradores
  (`ADMIN`). O discovery formal de personas e jornadas pertence à Fase 1.
- **Termos importantes do domínio**: `Contact`, `Company`, `Deal`, `Activity`,
  `Conversation`, `Message`, `User`. Os detalhes de cada entidade serão
  aprovados em SPEC própria antes da implementação.
- **Limites do sistema**: web, API GraphQL, worker assíncrono, PostgreSQL,
  Redis e RabbitMQ. Webhooks, uploads e pagamentos usam REST, não GraphQL
  ([ADR-002](adr/ADR-002-stack-api-graphql.md)).

## 2. Arquitetura

- **Estilo e componentes**: monorepo pnpm + Turborepo; API e worker NestJS;
  web React + Vite; portas e adaptadores para WhatsApp, fila e cache;
  camadas resolver → service → repository no domínio.
- **Fluxos de dados**: web → API GraphQL; WhatsApp → webhook REST → RabbitMQ →
  worker → PostgreSQL; API ↔ Redis para pub/sub e cache.
- **Integrações e contratos**: GraphQL code-first (Fase 1), REST de webhook
  (Fase 3), HMAC-SHA256 e idempotência por id externo.
- **ADRs vigentes**: [ADR-001](adr/ADR-001-monorepo-pnpm-turborepo.md),
  [ADR-002](adr/ADR-002-stack-api-graphql.md),
  [ADR-003](adr/ADR-003-versoes-e-compatibilidade.md).
- Detalhes em [`docs/architecture.md`](docs/architecture.md).

## 3. Stack e dependências

| Tecnologia/dependência | Versão                  | Finalidade                           | Fonte canônica             |
| ---------------------- | ----------------------- | ------------------------------------ | -------------------------- |
| Node.js                | 26.13.0 LTS             | Runtime                              | `.nvmrc`, `package.json`   |
| pnpm                   | 12.18.0                 | Workspaces e lockfile                | `packageManager`           |
| Turborepo              | 2.11.10                 | Orquestração de tarefas              | `turbo.json`               |
| TypeScript             | 6.0.3                   | Tipagem strict                       | `packages/tsconfig`        |
| NestJS                 | 12.4.2                  | API e worker                         | `apps/api`, `apps/worker`  |
| React                  | 19.3.1                  | Front-end                            | `apps/web`                 |
| Vite                   | 8.3.7                   | Build do front-end                   | `apps/web/vite.config.ts`  |
| Tailwind CSS           | 4.3.5                   | Estilização                          | `apps/web`                 |
| PostgreSQL             | 18.6-alpine             | Persistência (Fase 1)                | `infra/docker-compose.yml` |
| Redis                  | 8.8.4-alpine            | Pub/sub, cache e rate limit (Fase 2) | `infra/docker-compose.yml` |
| RabbitMQ               | 4.4.0-management-alpine | Fila de eventos (Fase 3)             | `infra/docker-compose.yml` |

Versões e justificativas de compatibilidade: [ADR-003](adr/ADR-003-versoes-e-compatibilidade.md).

## 4. Estrutura do repositório

| Caminho                        | Responsabilidade                                                |
| ------------------------------ | --------------------------------------------------------------- |
| `apps/api/`                    | API NestJS; health checks na Fase 0; GraphQL a partir da Fase 1 |
| `apps/worker/`                 | Worker NestJS; health check na Fase 0; consumer na Fase 3       |
| `apps/web/`                    | SPA React/Vite; shell acessível na Fase 0                       |
| `packages/shared/`             | Schemas zod de ambiente e utilidades puras                      |
| `packages/graphql-schema/`     | Schema gerado e documents (Fase 1)                              |
| `packages/eslint-config/`      | Configuração ESLint compartilhada                               |
| `packages/tsconfig/`           | Configurações TypeScript compartilhadas                         |
| `infra/`                       | Docker Compose, Dockerfiles e configuração do Nginx             |
| `specs/`, `tasks/`, `reviews/` | Rastreabilidade SDD                                             |
| `adr/`                         | Decisões arquiteturais                                          |
| `docs/`                        | Arquitetura, segurança, acessibilidade e guias                  |
| `scripts/`                     | Automação de rastreabilidade                                    |

## 5. Runtime e configuração

- **Pré-requisitos**: Node.js 26 LTS, pnpm 12, Docker e Docker Compose.
- **Instalação**: `pnpm install --frozen-lockfile`.
- **Execução local**: `pnpm dev` (sobe Postgres, Redis e RabbitMQ e inicia api,
  worker e web). O arquivo `.env` é opcional; os defaults apontam para
  `localhost`.
- **Build**: `pnpm build`.
- **Testes**: `pnpm test`.
- **Lint/typecheck**: `pnpm lint` e `pnpm typecheck`.
- **Infraestrutura**: `pnpm infra:up`, `pnpm infra:down` e `pnpm infra:full`
  para o stack completo em containers.
- **Variáveis de ambiente**: ver `.env.example`. Nenhum valor secreto real é
  versionado.

## 6. APIs, dados e integrações

- **Interfaces públicas (Fase 0)**: `GET /health/live` e `GET /health/ready` na
  API e no worker (porta interna).
- **GraphQL**: ainda não exposto; schema e operações pertencem à Fase 1.
- **Persistência e migrações**: não implementadas; Prisma entra na Fase 1.
- **Serviços externos**: WhatsApp Cloud API via porta `WhatsAppProvider` na
  Fase 3; `MockProvider` será o padrão local.
- **Compatibilidade e versionamento**: schema GraphQL com verificação de
  breaking changes a partir da Fase 1.

## 7. Segurança e privacidade

- **Implementado na Fase 0**: validação de ambiente com zod, helmet, CORS com
  allowlist, `ValidationPipe` restritivo, logs pino com redação, correlation id,
  containers non-root e CI com auditoria/varreduras.
- **Modelo de autenticação**: JWT curto + refresh rotativo em cookie HttpOnly
  (Fase 1).
- **Autorização**: ADMIN vê tudo; SELLER vê apenas o que é seu, com testes
  negativos de IDOR/BOLA (Fase 1).
- **LGPD**: classificação, base legal, retenção e exportação/exclusão serão
  especificadas antes de armazenar dados pessoais.
- Riscos e mapeamento OWASP: [`docs/security.md`](docs/security.md).

## 8. Experiência, design e acessibilidade

- **Plataformas e usuários**: web responsiva para times de vendas.
- **Design system**: ainda não definido; Tailwind é a base técnica.
- **Baseline de acessibilidade**: WCAG 2.2 AA.
- **Fase 0**: shell semântico, skip link, landmarks, foco visível, anúncio de
  rota e respeito a `prefers-reduced-motion`.
- Detalhes e pendências: [`docs/a11y.md`](docs/a11y.md).

## 9. Testes e quality gates

- **Comandos verificáveis**: `pnpm lint`, `pnpm typecheck`, `pnpm test`,
  `pnpm build`, `python3 scripts/generate_traceability.py`.
- **Níveis**: unitários (Vitest) na Fase 0; integração com Testcontainers,
  e2e GraphQL, componentes, e2e Playwright e testes de segurança nas fases
  seguintes.
- **Ambientes e dados**: Docker Compose local; seeds fictícios a partir da
  Fase 1.
- **Gates e responsáveis**: ver `standards/quality-gates.md`; CI em
  `.github/workflows/ci.yml`.

## 10. CI/CD, deploy e operação

- **Pipelines**: GitHub Actions com quality gates, auditoria, gitleaks, Trivy e
  CodeQL. Actions fixadas por SHA.
- **Ambientes**: local via Docker Compose. Deploy será documentado na Fase 5.
- **Migração e rollback**: não aplicáveis até existir persistência.
- **Observabilidade**: health checks e logs estruturados na Fase 0;
  OpenTelemetry e métricas nas fases seguintes.

## 11. Padrões de desenvolvimento

- **Convenções**: `standards/coding.md`, TypeScript strict com
  `noUncheckedIndexedAccess`, ESLint flat e Prettier.
- **Branches e commits**: `develop` para integração; Conventional Commits;
  `Spec-Ref:` e `Task-Ref:` em commits de implementação.
- **Workflow e perfil SDD**: `workflows/feature.md`; sem perfil de tecnologia
  específico.
- **Rastreabilidade**: [`docs/traceability-matrix.md`](docs/traceability-matrix.md).

## 12. Limitações e riscos conhecidos

| Item                                              | Impacto | Mitigação                                      | Responsável          |
| ------------------------------------------------- | ------- | ---------------------------------------------- | -------------------- |
| Domínio e regras de negócio ainda não descobertos | Alto    | Discovery e SPEC antes da Fase 1               | Produto              |
| Sem autenticação, autorização e rate limit        | Alto    | Implementar e testar na Fase 1                 | Engenharia/Segurança |
| Health checks não verificam dependências          | Médio   | Adicionar checks reais por fase                | Engenharia           |
| Deploy não documentado                            | Médio   | Guia de deploy na Fase 5                       | Engenharia           |
| Cobertura de testes ainda inicial                 | Médio   | Ampliar pirâmide por fase e definir thresholds | QA                   |
| LGPD não implementada                             | Alto    | Especificar antes de dados pessoais            | Produto/Segurança    |

## 13. Tecnologias e abordagens intencionalmente não usadas

| Item                                     | Motivo                                                  | Reavaliar quando                                      |
| ---------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| GraphQL para webhooks/uploads/pagamentos | Semântica inadequada; HMAC e resposta rápida pedem REST | Se o fluxo deixar de ser orientado a eventos/arquivos |
| Nx                                       | Complexidade além do escopo atual                       | Se o monorepo crescer muito e exigir grafo avançado   |
| Jest na API                              | Vitest uniformiza o tooling e atende ao NestJS          | Se algum recurso do NestJS exigir Jest                |
| Dados reais em seeds                     | Privacidade e segurança                                 | Nunca para este projeto de demonstração               |
