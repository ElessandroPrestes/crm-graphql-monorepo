# Evidência de QA (QA Evidence): refatoração DevOps e build multi-stage (TASK-007-01)

## Metadados

| Campo                  | Valor                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| ID                     | QA-EVIDENCE-006                                                    |
| Status                 | Passed (local e CI); revisão independente pendente                 |
| SPEC                   | SPEC-007                                                           |
| TAREFA (TASK)          | TASK-007-01                                                        |
| Responsável (QA Owner) | Agente de QA                                                       |
| Data de Execução       | 2026-11-14                                                         |
| Build / Commit         | `develop` — `ae71289`, `6f281af`, `b79d04c`                        |
| Ambiente               | Linux x86_64, 4 vCPUs, 11 GiB RAM, Docker 29.9.3, BuildKit 0.34.2  |
| Ferramentas            | Node.js 26.13.0, pnpm 12.18.0, Docker Compose 5.7.1, Buildx 0.39.0 |

## Configuração do ambiente

- SO / Arquitetura: Linux 6.8.0-149-generic x86_64
- Runtime: Node.js 26.13.0 LTS, pnpm 12.18.0
- Serviços: PostgreSQL 18.6-alpine, Redis 8.8.4-alpine, RabbitMQ 4.4.0-management-alpine
- Backend de armazenamento Docker: overlay2 sobre ext4
- Nenhum dado real foi usado; o Compose local usa segredos de demonstração.

## Evidência de critérios de aceitação

### AC-701 — Build frio consolidado

```yaml
criterion_id: AC-701
status: passed
execution_type: automated
execution_date: 2026-11-14
verified_by: Agente de QA
preconditions_met: true
action_taken: Podar o cache do builder com CONFIRM=1 make cache-prune e executar MODE=cold make benchmark.
observable_result: Build frio dos três targets em 315 s; baseline medido na mesma máquina foi 745 s.
reproducible_evidence:
  command: CONFIRM=1 make cache-prune && MODE=cold make benchmark
  log_or_artifact: docs/devops/build-optimization.md
  details: Log do BuildKit em /tmp/nexo-build-cold-20261114-180316.log; números não são SLO de produção.
exception_ref: N/A
```

### AC-702 — Rebuild de código reutiliza dependências

```yaml
criterion_id: AC-702
status: passed
execution_type: automated
execution_date: 2026-11-14
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar MODE=code make benchmark, que altera temporariamente apps/api/src/main.ts e restaura o arquivo.
observable_result: Rebuild em 122 s; o log mostra pnpm install CACHED no estágio deps e o deploy por cópia reexecutado.
reproducible_evidence:
  command: MODE=code make benchmark
  log_or_artifact: docs/devops/build-optimization.md
  details: Log /tmp/nexo-build-code-20261114-174930.log; o install não foi reexecutado.
exception_ref: N/A
```

### AC-703 — Rebuild de dependência é seguro

```yaml
criterion_id: AC-703
status: passed
execution_type: automated
execution_date: 2026-11-14
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar MODE=deps make benchmark, que altera temporariamente pnpm-lock.yaml, e subir a stack com make up.
observable_result: Rebuild em 282 s (install 66 s, Turbo 61 s, deploy 53 s); API, worker e web ficaram healthy.
reproducible_evidence:
  command: MODE=deps make benchmark && make up && make health
  log_or_artifact: docs/devops/build-optimization.md
  details: Log /tmp/nexo-build-deps-20261114-175146.log; nenhum volume foi removido.
exception_ref: N/A
```

### AC-704 — Makefile e Compose operacionais

```yaml
criterion_id: AC-704
status: passed
execution_type: automated+manual
execution_date: 2026-11-14
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar make help, make config e make doctor.
observable_result: Ajuda listou os alvos; o Compose validou sem erro; o doctor confirmou Docker, Node, pnpm e Compose.
reproducible_evidence:
  command: make help && make config && make doctor
  log_or_artifact: Makefile; docs/devops/makefile-reference.md
  details: Nenhum comando alterou dados ou volumes.
exception_ref: N/A
```

### AC-705 — Stack endurecida e funcional

```yaml
criterion_id: AC-705
status: passed
execution_type: automated
execution_date: 2026-11-14
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar make up, make health, make down e make start; inspecionar docker compose ps.
observable_result: Seis containers healthy; API e worker com read_only, tmpfs e cap_drop; volumes nomeados preservados após make down.
reproducible_evidence:
  command: make up && make health && make down && make start
  log_or_artifact: infra/docker-compose.yml; docs/devops/docker-architecture.md
  details: Volumes nexo-crm_postgres-data, nexo-crm_redis-data e nexo-crm_rabbitmq-data mantidos.
exception_ref: N/A
```

### AC-706 — Documentação operacional

```yaml
criterion_id: AC-706
status: passed
execution_type: manual
execution_date: 2026-11-14
verified_by: Agente de QA
preconditions_met: true
action_taken: Revisar docs/devops/docker-architecture.md, build-optimization.md, makefile-reference.md e troubleshooting.md.
observable_result: Arquitetura, cache, benchmark, comandos e troubleshooting documentados; README e docs/deploy.md apontam para o Dockerfile único.
reproducible_evidence:
  command: Revisão de docs/devops/**, README.md e docs/deploy.md
  log_or_artifact: docs/devops/docker-architecture.md; docs/devops/build-optimization.md; docs/devops/makefile-reference.md; docs/devops/troubleshooting.md
  details: Nenhum segredo real foi incluído; os valores do Compose são locais.
exception_ref: N/A
```

## Gates de qualidade

```yaml
criterion_id: quality-gates
status: passed
execution_type: automated
execution_date: 2026-11-14
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar lint, typecheck, testes, build, format, schema, audit e CI.
observable_result: pnpm lint, pnpm typecheck, pnpm test, pnpm build, pnpm format:check, schema:check e pnpm audit --audit-level high passaram; CI run 43641509234 verde em develop (Quality gates, E2E, Security e CodeQL).
reproducible_evidence:
  command: pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check && pnpm --filter @nexo/api schema:check && pnpm audit --audit-level high
  log_or_artifact: CI run 43641509234
  details: Audit manteve 2 advisories moderadas de desenvolvimento, sem high/critical.
exception_ref: N/A
```

## Limitações e pendências

- Os tempos são de uma máquina local; CI e ambiente alvo podem variar.
- O deploy por cópia adiciona ~30 s em mudanças de código; a alternativa com
  hardlinks entre camadas levava minutos por copy-up.
- Revisão independente do artefato ainda não foi registrada.
