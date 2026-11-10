# SPEC: Fase 0 — Fundação do Nexo CRM

## Metadados

| Campo           | Valor                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID              | SPEC-001                                                                                                                                                 |
| Status          | Approved                                                                                                                                                 |
| Responsável     | Engenharia                                                                                                                                               |
| Revisores       | Produto / Engenharia / QA / Segurança                                                                                                                    |
| Criado          | 2026-11-09                                                                                                                                               |
| Atualizado      | 2026-11-09                                                                                                                                               |
| Lançamento alvo | Fase 0                                                                                                                                                   |
| Refs:           | Discovery: N/A — fundação técnica, sem discovery de produto; Design: N/A — apenas shell acessível, sem fluxo de produto; ADRs: ADR-001, ADR-002, ADR-003 |

## Problema e resultado

O repositório contém apenas a estrutura documental do Universal SDD. Para que as
fases seguintes do Nexo CRM sejam implementáveis e verificáveis, é necessário
um monorepo funcional com tooling, aplicações esqueleto, infraestrutura local,
CI básica e documentação de engenharia.

Resultado esperado: `pnpm install && pnpm dev` sobe a infraestrutura e as três
aplicações; lint, typecheck, testes e build passam; não há segredos
versionados. O sucesso é medido pelos critérios de aceite abaixo.

## Escopo

### No escopo

- pnpm workspaces + Turborepo.
- `apps/api` (NestJS, health checks, validação de ambiente, middlewares de segurança).
- `apps/worker` (esqueleto NestJS com health check próprio).
- `apps/web` (Vite + React + Tailwind, shell acessível em pt-BR).
- `packages/tsconfig`, `packages/eslint-config`, `packages/shared`, `packages/graphql-schema`.
- Tooling: TypeScript strict, ESLint flat, Prettier, Husky, lint-staged, commitlint.
- Docker Compose e Dockerfiles multi-stage.
- CI básica e varreduras de segurança iniciais.
- ADRs de stack, `docs/architecture.md`, `docs/security.md`, `SECURITY.md` e `docs/a11y.md`.

### Fora do escopo

- Modelo Prisma, migrations e seed (Fase 1).
- Autenticação, RBAC, GraphQL schema, DataLoader e paginação (Fase 1).
- Funil, dashboard, subscriptions e cache (Fase 2).
- WhatsApp, RabbitMQ consumer real, idempotência e DLQ (Fase 3).
- Interface funcional de produto, i18n completo e tema claro/escuro (Fase 4).
- Persisted queries, benchmark k6 e endurecimento final (Fase 5).

## Comportamento funcional

- `pnpm install` instala o workspace com lockfile congelado.
- `pnpm dev` inicia Postgres, Redis e RabbitMQ via Docker Compose e, em paralelo,
  inicia api, worker e web.
- A API responde `GET /health/live` e `GET /health/ready` com JSON e HTTP 200.
- O worker responde ao seu health check na porta interna configurada.
- O web serve um shell com `lang="pt-BR"`, link "pular para o conteúdo",
  landmarks `header`, `nav` e `main`, e um único `h1` por rota.
- Variáveis de ambiente são validadas com zod; valores inválidos falham rápido
  com mensagem que não expõe segredos.
- Credenciais locais padrão apontam para `localhost` e podem ser sobrescritas
  por `.env`; nenhum valor secreto real é versionado.

## Requisitos não-funcionais

- Segurança e privacidade: helmet, CORS com allowlist explícita, validação de
  ambiente na inicialização, sem segredos no repositório, logs sem dados
  sensíveis. Controles ainda não implementados ficam registrados em
  `docs/security.md`.
- Desempenho e capacidade: builds paralelos via Turborepo; sem metas de
  throughput nesta fase.
- Confiabilidade e recuperação: health checks, graceful shutdown e Docker
  Compose com healthchecks.
- Acessibilidade: WCAG 2.2 AA como alvo; shell inicial com navegação por
  teclado e semântica correta.
- Compatibilidade: Node.js 26 LTS, pnpm 12, Docker Compose.
- Observabilidade: logs estruturados com pino na API; OpenTelemetry completo
  fica para fase posterior.

## Critérios de aceitação

### AC-001

```yaml
id: AC-001
title: Workspace instala e compila com lockfile congelado
preconditions:
  - Node.js 26 LTS e pnpm 12 instalados
action: Executar pnpm install --frozen-lockfile e pnpm build
expected_result: Instalação e build concluem sem erro
evidence_type: automated
```

### AC-002

```yaml
id: AC-002
title: pnpm dev sobe infraestrutura e aplicações
preconditions:
  - Docker daemon disponível
  - Portas locais livres
action: Executar pnpm dev
expected_result: Postgres, Redis e RabbitMQ sobem; api, worker e web iniciam sem erro
evidence_type: manual
```

### AC-003

```yaml
id: AC-003
title: API expõe health checks
preconditions:
  - API em execução
action: Requisitar GET /health/live e GET /health/ready
expected_result: Ambas retornam HTTP 200 com JSON contendo status ok e service api
evidence_type: automated
```

### AC-004

```yaml
id: AC-004
title: Worker inicia e expõe health check próprio
preconditions:
  - Worker em execução
action: Requisitar o health check interno do worker
expected_result: Retorna HTTP 200 com JSON contendo status ok e service worker
evidence_type: automated
```

### AC-005

```yaml
id: AC-005
title: Web serve shell acessível em pt-BR
preconditions:
  - Web em execução
action: Abrir a página inicial
expected_result: Documento com lang pt-BR, link de pular conteúdo, landmarks e um h1
evidence_type: automated
```

### AC-006

```yaml
id: AC-006
title: Validação de ambiente falha rápido
preconditions:
  - Variável de ambiente obrigatória inválida
action: Iniciar a API
expected_result: Processo encerra com mensagem clara, sem vazar segredos
evidence_type: automated
```

### AC-007

```yaml
id: AC-007
title: Quality gates locais passam
preconditions:
  - Dependências instaladas
action: Executar pnpm lint, pnpm typecheck, pnpm test e pnpm build
expected_result: Todos os comandos terminam com sucesso
evidence_type: automated
```

### AC-008

```yaml
id: AC-008
title: Infraestrutura Docker é válida e segura
preconditions:
  - Docker Compose disponível
action: Validar docker compose config e inspecionar Dockerfiles
expected_result: Configuração válida; containers rodam como non-root e têm HEALTHCHECK
evidence_type: automated
```

### AC-009

```yaml
id: AC-009
title: CI básica e varreduras de segurança configuradas
preconditions:
  - Workflow versionado
action: Inspecionar .github/workflows/ci.yml
expected_result: Jobs de install frozen, lint, typecheck, test, build e varreduras de segurança definidos
evidence_type: manual
```

### AC-010

```yaml
id: AC-010
title: Nenhum segredo versionado
preconditions:
  - Repositório versionado
action: Executar varredura de segredos e revisar .env.example
expected_result: Nenhum segredo real encontrado; apenas placeholders documentados
evidence_type: automated
```

### AC-011

```yaml
id: AC-011
title: Documentação e decisões registradas
preconditions:
  - Fase implementada
action: Revisar docs e ADRs
expected_result: ADRs 001-003, docs/architecture.md, docs/security.md, SECURITY.md e docs/a11y.md presentes e atualizados
evidence_type: manual
```

## Abordagem técnica

Monorepo com pnpm workspaces e Turborepo. O pacote `@nexo/shared` concentra
schemas zod de ambiente e utilidades puras. `apps/api` e `apps/worker` são
aplicações NestJS independentes; `apps/web` é Vite + React. A infraestrutura
local usa Docker Compose com perfis: serviços de dados por padrão e o stack
completo no perfil `full`. Versões fixadas conforme ADR-003.

Alternativas rejeitadas: npm/yarn workspaces (pnpm é decisão do produto);
Nx (Turborepo é mais simples para o escopo); Jest na API (Vitest atende e
uniformiza o tooling; Jest fica reservado se o NestJS exigir).

## Entrega e operações

- Plano de implantação: não aplicável nesta fase; deploy documentado na Fase 5.
- Plano de migração: não aplicável.
- Plano de rollback: reverter o commit da fase.
- Monitoramento e alertas: health checks e logs estruturados; observabilidade completa depois.

## Riscos e dependências

| Risco ou dependência                              | Impacto | Probabilidade | Mitigação                                                              | Responsável |
| ------------------------------------------------- | ------- | ------------- | ---------------------------------------------------------------------- | ----------- |
| Incompatibilidade de peers entre versões recentes | Alto    | Média         | Pins validados no registry; GraphQL 16 e TypeScript 6                  | Engenharia  |
| Docker indisponível no ambiente                   | Médio   | Média         | Documentar pré-requisito; health checks e comando `infra:up` separado  | Engenharia  |
| Escopo de produto ainda não descoberto            | Alto    | Alta          | Não implementar domínio nesta fase; Fase 1 depende de discovery        | Produto     |
| Controles de segurança ainda parciais             | Alto    | Alta          | Registrar como risco pendente em docs/security.md sem simular controle | Segurança   |

## Questões abertas

| Questão                         | Responsável | Data limite | Resolução |
| ------------------------------- | ----------- | ----------- | --------- |
| Provedor de deploy definitivo   | Engenharia  | Fase 5      | Aberta    |
| Estratégia de persisted queries | Segurança   | Fase 5      | Aberta    |

## Aprovação

| Papel      | Nome                    | Decisão  | Data       | Notas                                         |
| ---------- | ----------------------- | -------- | ---------- | --------------------------------------------- |
| Produto    | Solicitante             | Approved | 2026-11-09 | Aprovação via continuação explícita da Fase 0 |
| Design     | N/A                     | N/A      | 2026-11-09 | Shell técnico sem fluxo de design de produto  |
| Engenharia | Agente de implementação | Approved | 2026-11-09 | Escopo foundation                             |
| QA         | Agente de QA            | Ready    | 2026-11-09 | Critérios automatizáveis definidos            |
