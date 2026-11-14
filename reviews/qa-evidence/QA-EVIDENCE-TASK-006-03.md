# Evidência de QA (QA Evidence): desempenho, entrega e release (TASK-006-03)

## Metadados

| Campo                  | Valor                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| ID                     | QA-EVIDENCE-005                                                                                                           |
| Status                 | Partial (Parcial — executável concluído; aprovação humana e release pendentes)                                            |
| SPEC                   | SPEC-006                                                                                                                  |
| TAREFA (TASK)          | TASK-006-03                                                                                                               |
| Responsável (QA Owner) | Agente de QA                                                                                                              |
| Data de Execução       | 2026-11-13                                                                                                                |
| Build / Commit         | `0.3.0-alpha` em `develop` (implementação da TASK-006-03)                                                                 |
| Ambiente               | Linux x86_64, Node.js 26.13.0, pnpm 12.18.0, Docker Compose (PostgreSQL, Redis, RabbitMQ), Playwright headless, k6 0.57.0 |
| Feature flags          | `DATALOADER_ENABLED=true/false`, `PERSISTED_QUERIES_MODE=audit`                                                           |
| Contas de teste        | Seed fictício: 1 ADMIN, 2 SELLER (sem PII real)                                                                           |

## Configuração do ambiente

- SO / Arquitetura: Linux x86_64
- Runtime: Node.js 26.13.0 LTS, pnpm 12.18.0
- Serviços: PostgreSQL 18.6-alpine, Redis 8.8.4-alpine, RabbitMQ 4.4.0-management-alpine via Docker Compose
- Navegador: Playwright Chromium (desktop, mobile emulado Pixel 7 e suíte dedicada de acessibilidade)
- Ferramentas: `@axe-core/playwright` 4.14.0, Playwright 1.65.0, Grafana k6 0.57.0

## Evidência de critérios de aceitação

### AC-615 — Benchmark k6 antes/depois do DataLoader

```yaml
criterion_id: AC-615
status: passed
execution_type: automated
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar `infra/k6/deals-dataloader.js` com `DATALOADER_ENABLED=false` e `true`, seed determinístico de 120 negócios e a mesma máquina/banco.
observable_result: p95 caiu de 9.494,65 ms para 58,58 ms; throughput subiu de 5,69 para 9,91 req/s; zero erros HTTP/GraphQL nos dois modos.
reproducible_evidence:
  command: pnpm --filter @nexo/api db:seed:benchmark; k6 run infra/k6/deals-dataloader.js
  log_or_artifact: docs/performance.md
  details: Metodologia, ambiente, reprodução e limitações documentados; resultados não são SLO de produção.
exception_ref: N/A
```

### AC-616 — Documentação de segurança, acessibilidade e deploy

```yaml
criterion_id: AC-616
status: passed
execution_type: manual
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Revisar docs/security.md (STRIDE final e riscos residuais), docs/a11y.md (checklist e limitações) e docs/deploy.md (variáveis, migrations, health checks, smoke tests, backup e rollback).
observable_result: Documentos completos; riscos residuais explícitos; deploy real e aprovações LGPD/Gate 4 registrados como pendentes.
reproducible_evidence:
  command: Revisão de docs/security.md, docs/a11y.md e docs/deploy.md
  log_or_artifact: docs/security.md; docs/a11y.md; docs/deploy.md
  details: Nenhum segredo real foi incluído; smoke tests e rollback descritos de forma provider-neutral.
exception_ref: N/A
```

### AC-617 — SBOM CycloneDX e Dependabot

```yaml
criterion_id: AC-617
status: partial
execution_type: automated+manual
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar `pnpm run sbom`, inspecionar o artefato e revisar `.github/dependabot.yml` e o job de upload na CI.
observable_result: SBOM CycloneDX 1.6 com 1.119 componentes gerado em test-results/sbom/nexo-crm.cdx.json; Dependabot semanal configurado para pnpm e GitHub Actions. O primeiro PR do Dependabot depende do agendamento no GitHub.
reproducible_evidence:
  command: pnpm run sbom
  log_or_artifact: test-results/sbom/nexo-crm.cdx.json; .github/dependabot.yml; .github/workflows/ci.yml
  details: O JSON foi inspecionado, mas a validação contra o schema oficial CycloneDX ainda não está automatizada.
exception_ref: Pendente — PR de dependência aguarda execução do Dependabot no GitHub.
```

### AC-618 — README, CHANGELOG e release notes

```yaml
criterion_id: AC-618
status: partial
execution_type: manual
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Revisar README, CHANGELOG e docs/release-notes-0.3.0-alpha.md.
observable_result: Arquitetura, setup, resultados de k6/SBOM/E2E, riscos e versão 0.3.0-alpha documentados. O GIF de demonstração não foi gravado; nenhum binário foi versionado.
reproducible_evidence:
  command: Revisão de README.md; CHANGELOG.md; docs/release-notes-0.3.0-alpha.md
  log_or_artifact: README.md; CHANGELOG.md; docs/release-notes-0.3.0-alpha.md
  details: A referência ao GIF foi substituída por placeholder explícito para não apontar para arquivo inexistente.
exception_ref: Pendente — gravação do GIF de demonstração.
```

### AC-620 — Gates de qualidade permanecem verdes

```yaml
criterion_id: AC-620
status: passed
execution_type: automated
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, `pnpm --filter @nexo/api schema:check`, `pnpm audit --audit-level high` e `pnpm test:e2e`.
observable_result: Lint, typecheck, 93 testes unitários, build, format, schema e audit (sem high/critical) verdes; E2E com 43 testes verdes e 30 varreduras axe sem critical/serious.
reproducible_evidence:
  command: pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check && pnpm --filter @nexo/api schema:check && pnpm audit --audit-level high && pnpm test:e2e
  log_or_artifact: Saída local de 2026-11-13; CI run 43535806770 verde em develop (Quality gates, E2E, Security e CodeQL)
  details: Nenhuma regressão nas fases anteriores; auditoria mantém 2 advisories moderadas de desenvolvimento sem correção compatível.
exception_ref: N/A
```

### AC-619 — Gate 4 da Fase 4

```yaml
criterion_id: AC-619
status: pending
execution_type: manual
execution_date: N/A
verified_by: Pendente — aprovador humano (QA-001, design, acessibilidade)
preconditions_met: partial
action_taken: Consolidar checklist automatizado e registrar pendências de NVDA/VoiceOver e zoom 200% real.
observable_result: Nenhum ainda — a aprovação exige revisor humano e não pode ser concedida por este agente.
reproducible_evidence:
  command: N/A
  log_or_artifact: docs/a11y.md; docs/qa-plan-fase-5.md
  details: Gate 4 bloqueado por aprovação humana independente.
exception_ref: Requer exceção autorizada ou aprovação humana antes do release.
```

## Resumo e descobertas

| Total de critérios rastreados | Passed | Partial | Pending | Exceção |
| ----------------------------- | ------ | ------- | ------- | ------- |
| 6 (AC-615 a AC-620)           | 3      | 2       | 1       | 0       |

### Defeitos e regressões

| ID do Defeito | Severidade | Critério | Resumo | Status |
| ------------- | ---------- | -------- | ------ | ------ |
| —             | —          | —        | —      | —      |

### Riscos residuais e exceções

| ID da Exceção | Critério | Motivo                                                                            | Aprovado por | Validade                      |
| ------------- | -------- | --------------------------------------------------------------------------------- | ------------ | ----------------------------- |
| —             | AC-617   | Primeiro PR do Dependabot depende do agendamento no GitHub                        | Pendente     | Primeira execução semanal     |
| —             | AC-618   | GIF de demonstração não gravado por ausência de ferramenta de captura no ambiente | Pendente     | Próxima atualização do README |
| —             | AC-619   | Gate 4 requer aprovação humana independente                                       | Pendente     | Até aprovação do Gate 4       |

## Recomendação

- Recomendação: **Continue em `develop`; No-go para release até aprovação humana do Gate 4, deploy de referência, retenção/base legal LGPD, bootstrap de administrador, primeiro PR do Dependabot e GIF de demonstração.**
- Justificativa: os critérios automatizados de desempenho, documentação e gates estão verdes; os itens parciais/pendentes não são concedíveis por este agente ou dependem de terceiros.
- Responsável de QA e Data: Agente de QA, 2026-11-13.
