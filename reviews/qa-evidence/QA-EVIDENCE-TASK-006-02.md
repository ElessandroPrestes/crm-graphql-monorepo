# Evidência de QA (QA Evidence): E2E Playwright, axe e testes de segurança (TASK-006-02)

## Metadados

| Campo                  | Valor                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID                     | QA-EVIDENCE-004                                                                                                |
| Status                 | Partial (Parcial — concluído o executável por este agente; pendente aprovação humana no Gate 4)                |
| SPEC                   | SPEC-006                                                                                                       |
| TAREFA (TASK)          | TASK-006-02                                                                                                    |
| Responsável (QA Owner) | Agente de QA                                                                                                   |
| Data de Execução       | 2026-11-13                                                                                                     |
| Build / Commit         | `f830704` (TASK-006-02 automação e CI); `bf58e1c` (TASK-006-01 endurecimento GraphQL/rate limit/auth)          |
| Ambiente               | Linux x86_64, Node.js 26.13.0, pnpm 12.18.0, Docker Compose (PostgreSQL, Redis, RabbitMQ), Playwright headless |
| Feature flags          | `PERSISTED_QUERIES_MODE=audit`, `DATALOADER_ENABLED=true`, limites de rate limit por env                       |
| Contas de teste        | Seed fictício: 1 ADMIN, 2 SELLER (dados fictícios, sem PII real)                                               |

## Configuração do ambiente

- SO / Arquitetura: Linux x86_64
- Runtime: Node.js 26.13.0 LTS, pnpm 12.18.0
- Serviços: PostgreSQL 18.6-alpine, Redis 8.8.4-alpine, RabbitMQ 4.4.0-management-alpine via Docker Compose
- Navegador: Playwright Chromium (desktop e mobile emulado Pixel 7)
- Ferramentas: `@axe-core/playwright` 4.14.0, Playwright 1.65.0

## Evidência de critérios de aceitação

### AC-610 — E2E Playwright cobre os fluxos críticos

```yaml
criterion_id: AC-610
status: passed
execution_type: automated
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar `pnpm e2e` em projetos desktop-chromium e mobile-chromium com Compose + seed fictício.
observable_result: 14 testes passaram (4 desktop, 4 mobile, 6 API): login, criação de contato, criação de negócio, movimento no kanban, inbox em tempo real e dashboard.
reproducible_evidence:
  command: pnpm e2e
  log_or_artifact: CI run 43430975275 — job `e2e` verde; artefatos Playwright publicados (trace, screenshot)
  details: Fluxos críticos verdes em desktop e mobile emulado.
exception_ref: N/A
```

### AC-611 — axe não encontra violações críticas ou sérias

```yaml
criterion_id: AC-611
status: passed
execution_type: automated
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar `e2e/a11y.spec.ts` com axe nas páginas principais (login, dashboard, contatos, pipeline, inbox) nos temas claro e escuro.
observable_result: 18 varreduras axe, zero violações critical/serious. Relatório anexado à CI.
reproducible_evidence:
  command: pnpm e2e (projeto desktop-chromium, suíte axe)
  log_or_artifact: CI run 43430975275 — artefato de relatório axe publicado
  details: axe/Playwright nos fluxos completos da Fase 5 sem violações críticas ou sérias.
exception_ref: N/A
```

### AC-612 — Checklist manual de acessibilidade

```yaml
criterion_id: AC-612
status: partial
execution_type: automated+manual
execution_date: 2026-11-13
verified_by: Agente de QA (automatizado); aprovador humano pendente (manual)
preconditions_met: true
action_taken: Checklist executado parcialmente via automação (teclado, reflow 320px, contraste, anúncios aria-live). Itens pendentes: teste com NVDA/VoiceOver e zoom 200% no navegador real — requerem dispositivo real com tecnologia assistiva.
observable_result:
  - Teclado: ordem de foco, link "Pular para o conteúdo", menu mobile e foco visível — validados.
  - Reflow 320px: dashboard, contatos, pipeline e inbox sem rolagem horizontal — validados.
  - Contraste: dois temas validados via axe — zero violações.
  - NVDA/VoiceOver: não executado (sem dispositivo real com leitor de tela).
  - Zoom 200%: não executado (sem navegador renderizado com ampliação real).
reproducible_evidence:
  command: pnpm e2e; docs/a11y.md checklist manual
  log_or_artifact: docs/a11y.md (checklist manual com itens [x] e [ ]); CI run 43430975275 (axe)
  details: Checklist parcialmente concluído; itens restantes exigem aprovador humano no Gate 4.
exception_ref: Pendente — exceção de aprovador humano requerida para itens manuais não executáveis neste agente.
```

### AC-613 — Testes de segurança negativos passam

```yaml
criterion_id: AC-613
status: passed
execution_type: automated
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar `e2e/security.spec.ts` cobrindo IDOR entre dois usuários SELLER, token inválido/expirado, reuso de refresh, HMAC inválido de webhook, WebSocket sem token e bypass de rate limit.
observable_result: Todas as tentativas negadas sem vazamento de dados ou detalhes internos; 6 testes de segurança negativa verdes.
reproducible_evidence:
  command: pnpm e2e (projeto api-security)
  log_or_artifact: CI run 43430975275 — job `e2e` verde
  details: Testes negativos de segurança aprovados.
exception_ref: N/A
```

### AC-614 — CI executa E2E, axe, segurança e SBOM

```yaml
criterion_id: AC-614
status: passed
execution_type: automated
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: CI workflow com job `e2e` (Playwright + axe + segurança negativa), job de geração de SBOM CycloneDX, gitleaks, Trivy e CodeQL.
observable_result: Jobs obrigatórios verdes (run 43430975275): Quality gates, E2E and accessibility, Security scans, CodeQL. Artefatos Playwright e SBOM publicados.
reproducible_evidence:
  command: Abrir PR no `develop`; `.github/workflows/ci.yml`
  log_or_artifact: CI run 43430975275; artefactos `sbom-<run_id>` e traces Playwright
  details: CI verde para E2E, axe, segurança e scans.
exception_ref: N/A
```

### AC-619 — Gate 4 da Fase 4 é encerrado

```yaml
criterion_id: AC-619
status: pending
execution_type: manual
execution_date: N/A
verified_by: Pendente — aprovador humano (QA-001, design, acessibilidade)
preconditions_met: partial
action_taken: REVIEW-001 (aprovado com ressalfas), VR-001 (Gate 3 Pass, 24/24 critérios verificados), docs/a11y.md checklist parcial, docs/qa-plan-fase-5.md atualizados.
observable_result: Nenhum ainda — aguarda aprovação humana de QA-001, revisão de design da implementação e revisão manual de acessibilidade. Este agente não pode conceder aprovações independentes (conflito de papel per AGENTS.md).
reproducible_evidence:
  command: N/A
  log_or_artifact: reviews/REVIEW-001-fase-4.md; reviews/VERIFICATION-REPORT-VR-001.md; docs/a11y.md
  details: Gate 4 bloqueado por aprovações humanas não concedíveis por este agente.
exception_ref: Requer exceção autorizada ou aprovação humana antes do release.
```

### AC-620 — Gates de qualidade permanecem verdes

```yaml
criterion_id: AC-620
status: passed
execution_type: automated
execution_date: 2026-11-13
verified_by: Agente de QA
preconditions_met: true
action_taken: Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`, `pnpm --filter @nexo/api schema:check`, `pnpm audit --audit-level high`, E2E e axe.
observable_result: Gates verdes; sem drift de schema; sem regressão nas Fases 1 a 4. Restam 2 advisories moderadas conhecidas em ferramentas de desenvolvimento (sem correção compatível).
reproducible_evidence:
  command: pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
  log_or_artifact: CI run 43430975275 — job `Quality gates` verde
  details: Tarefas de qualidade locais e CI verdes.
exception_ref: N/A
```

## Resumo e descobertas

| Total de critérios rastreados                 | Passed | Partial | Pending | Exceção |
| --------------------------------------------- | ------ | ------- | ------- | ------- |
| 7 (AC-610 a AC-616 exceto k6, AC-619, AC-620) | 5      | 1       | 1       | 0       |

### Defeitos e regressões

| ID do Defeito | Severidade | Critério | Resumo | Status |
| ------------- | ---------- | -------- | ------ | ------ |
| —             | —          | —        | —      | —      |

### Riscos residuais e exceções

| ID da Exceção | Critério | Motivo                                                                           | Aprovado por                | Validade             |
| ------------- | -------- | -------------------------------------------------------------------------------- | --------------------------- | -------------------- |
| —             | AC-612   | NVDA/VoiceOver e zoom 200% requerem dispositivo real não disponível neste agente | Pendente (aprovador humano) | Até aprovação Gate 4 |
| —             | AC-619   | Gate 4 requer aprovação humana de QA/design/a11y; não auto-concedível            | Pendente (aprovador humano) | Até aprovação Gate 4 |

## Recomendação

- Recomendação: **Continue em `develop`; No-go para release até concluir AC-612 (manual), AC-619 (aprovação humana Gate 4) e TASK-006-03 (k6, deploy, release notes).**
- Justificativa: todos os critérios automatizados de TASK-006-02 estão verdes (AC-610, AC-611, AC-613, AC-614, AC-620). AC-612 está parcial (automação concluída; manual pendente). AC-619 está pendente de aprovador humano.
- Responsável de QA e Data: Agente de QA, 2026-11-13.
