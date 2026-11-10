# TASK: Implementar a Fundação do Nexo CRM

## Metadados

| Campo        | Valor                                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-001-01                                                                                                                                                     |
| Status       | Done                                                                                                                                                            |
| Responsável  | Engenharia                                                                                                                                                      |
| Refs:        | SPEC: SPEC-001; Critérios de aceitação: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011; ADRs: ADR-001, ADR-002, ADR-003 |
| Dependências | Nenhuma                                                                                                                                                         |

## Objetivo

Entregar um monorepo funcional do Nexo CRM com tooling, aplicações esqueleto,
infraestrutura local, CI básica, segurança inicial e documentação de engenharia,
sem implementar domínio de produto.

## Escopo

### Incluído

- pnpm workspaces, Turborepo, TypeScript strict e pacotes base.
- `apps/api`, `apps/worker` e `apps/web` esqueleto.
- Validação de ambiente com zod, health checks e middlewares de segurança da API.
- Shell acessível em pt-BR no web.
- Docker Compose, Dockerfiles, `.env.example`, `.gitignore` e `.dockerignore`.
- ESLint, Prettier, Husky, lint-staged e commitlint.
- CI básica e varreduras iniciais de segurança.
- ADRs, docs de arquitetura, segurança e acessibilidade.

### Excluído

- Prisma, migrations, seed, autenticação, RBAC, GraphQL schema, DataLoader.
- Funil, dashboard, subscriptions, WhatsApp, RabbitMQ consumer real.
- Interface de produto, i18n completo, tema claro/escuro, benchmark k6.

## Abordagem e impacto

- Principais arquivos: `package.json`, `pnpm-workspace.yaml`, `turbo.json`,
  `apps/*`, `packages/*`, `infra/*`, `.github/workflows/ci.yml`, `docs/*`,
  `adr/*`.
- Contratos: endpoints de health; variáveis de ambiente documentadas.
- Riscos: compatibilidade de versões; Docker local; escopo de segurança parcial.
- Padrões: AGENTS.md, workflows/feature.md, standards/coding.md,
  standards/security.md.

## Etapas

- [x] Criar SPEC-001 e esta TASK.
- [x] Configurar workspace, tooling e pacotes base.
- [x] Implementar API, worker e web esqueleto.
- [x] Configurar Docker Compose, Dockerfiles e CI.
- [x] Registrar ADRs e documentação inicial.
- [x] Executar lint, typecheck, testes e build.
- [x] Validar infraestrutura e atualizar rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                                | Evidência esperada                   |
| -------------- | -------------------------------------------------------- | ------------------------------------ |
| AC-001         | `pnpm install --frozen-lockfile && pnpm build`           | Saída verde                          |
| AC-002         | `pnpm dev`                                               | Serviços e apps iniciados            |
| AC-003         | Teste/curl dos health checks                             | HTTP 200 e JSON                      |
| AC-004         | Health check do worker                                   | HTTP 200 e JSON                      |
| AC-005         | Teste de componente do shell                             | Semântica e textos                   |
| AC-006         | Teste unitário do schema de ambiente                     | Erro claro em valor inválido         |
| AC-007         | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | Saída verde                          |
| AC-008         | `docker compose config` e inspeção                       | Config válida, non-root, HEALTHCHECK |
| AC-009         | Revisão do workflow                                      | Jobs definidos                       |
| AC-010         | Varredura de segredos                                    | Nenhum segredo                       |
| AC-011         | Revisão de docs e ADRs                                   | Arquivos presentes                   |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade atualizadas.
- [x] Limitações e desvios registrados.

## Resultado

- Mudanças feitas: monorepo pnpm + Turborepo; pacotes `tsconfig`,
  `eslint-config`, `shared` e `graphql-schema`; API e worker NestJS com health
  checks, validação zod, pino, helmet e CORS; web React/Vite/Tailwind com shell
  acessível em pt-BR; Docker Compose, Dockerfiles non-root com HEALTHCHECK; CI
  com quality gates, gitleaks, Trivy e CodeQL; ADRs e documentação inicial.
- Evidência:
  - `pnpm install --frozen-lockfile`: sucesso, lockfile atualizado e verificado.
  - `pnpm peers check`: sem conflitos de peer dependencies.
  - `pnpm lint`: sucesso com `--max-warnings 0`.
  - `pnpm typecheck`: 5 tarefas concluídas com sucesso.
  - `pnpm test`: 11 testes aprovados (shared 4, api 2, worker 2, web 3).
  - `pnpm build`: 4 tarefas concluídas com sucesso.
  - `pnpm format:check`: todos os arquivos fora do legado SDD formatados.
  - `docker compose -f infra/docker-compose.yml config`: configuração válida.
  - `pnpm infra:up`: Postgres, Redis e RabbitMQ com health `healthy`.
  - `pnpm dev`: API (`/health/live`), worker (`/health/live`) e web responderam
    HTTP 200; página inicial com `<title>Nexo CRM</title>`.
  - `API_PORT=abc node apps/api/dist/main.js`: encerrou com código 1 e mensagem
    clara, sem vazar segredos.
  - Imagens `nexo-crm-api`, `nexo-crm-worker` e `nexo-crm-web` construídas;
    containers iniciaram `healthy`, com usuários non-root (`nestjs` e `101`), e
    `/healthz` do web respondeu `ok`.
  - gitleaks via container: `no leaks found` em 603 KB varridos.
- Desvios e decisões de implementação:
  - ESLint fixado em 9.39.5 porque `eslint-plugin-jsx-a11y` 6.10.2 ainda declara
    peer `^9`; ESLint 10 fica para quando o plugin suportar.
  - API, worker e `shared` adotam ESM (`type: module`, Node16), porque NestJS 12
    distribui pacotes ESM.
  - `class-validator` e `class-transformer` adicionados à API para o
    `ValidationPipe`.
  - Dockerfiles instalam pnpm via npm, pois Node 26 não inclui corepack.
  - Volume do Postgres montado em `/var/lib/postgresql`, conforme exigido pela
    imagem 18+.
  - Deploy pnpm usa `--offline --trust-lockfile` após o install congelado já ter
    validado a cadeia de suprimentos.
- Limitações: build das imagens Docker leva cerca de 6 a 9 minutos neste
  ambiente por custo de importação de pacotes no overlayfs; gitleaks e Trivy
  locais foram executados via container/CI, não como binários nativos; CI ainda
  não rodou no GitHub; cobertura e testes de integração pertencem às próximas
  fases.
- Trabalho em aberto: Fase 1 (Prisma, auth, RBAC, GraphQL e DataLoader).
