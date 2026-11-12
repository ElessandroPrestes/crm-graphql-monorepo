# Evidência de QA (QA Evidence): Contatos e visão 360° (TASK-005-02)

## Metadados

| Campo                  | Valor                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| ID                     | QA-EVIDENCE-002                                                                                                 |
| Status                 | Complete (Concluído)                                                                                            |
| SPEC                   | SPEC-005                                                                                                        |
| TAREFA (TASK)          | TASK-005-02                                                                                                     |
| Responsável (QA Owner) | Agente de QA                                                                                                    |
| Data de Execução       | 2026-11-11                                                                                                      |
| Build / Commit         | `0be1a9bb` feat(web): implementa fase 4 com sessão, contatos, kanban, inbox e dashboard                         |
| Ambiente               | Linux, Node.js 26.13.0, pnpm 12.18.0, navegador headless (Vitest), Testcontainers (PostgreSQL, Redis, RabbitMQ) |

## Configuração do ambiente

- SO / Arquitetura: Linux x86_64
- Runtime / Engine: Node.js 26.13.0 LTS, Vitest
- Dependências / Versões de serviço: PostgreSQL 18.6-alpine, Redis 8.8.4-alpine, RabbitMQ 4.4.0-management-alpine via Testcontainers
- Feature flags / Configurações: Nenhuma; defaults de `.env` apontam para `localhost`
- Contas de teste / Permissões: SEED fictício com usuários SELLER e ADMIN; escopo de dono aplicado no servidor
- Linha de base dos dados de teste / Seed: `apps/api/prisma/seed` (dados fictícios)

## Evidência de critérios de aceitação

### AC-505 evidence

```yaml
criterion_id: AC-505
status: passed
execution_type: automated
execution_date: 2026-11-11
verified_by: Agente de QA
preconditions_met: true
action_taken: Executa testes de API e componente com contatos de donos diferentes; verifica busca server-side por nome/e-mail/telefone, filtro por empresa, paginação estável e escopo por dono.
observable_result: SELLER recebe apenas seus contatos correspondentes; ADMIN recebe contatos de todos os donos; paginação por cursor estável.
reproducible_evidence:
  command: pnpm --filter @nexo/web test && pnpm --filter @nexo/api exec vitest run -c vitest.integration.config.ts test/fase-4.e2e.test.ts
  log_or_artifact: apps/web/src/contacts/**/*.test.ts (11 testes), apps/api/test/fase-4.e2e.test.ts (5 testes verdes)
  details: Testes de busca/filtro server-side e escopo por dono passam.
exception_ref: N/A
```

### AC-506 evidence

```yaml
criterion_id: AC-506
status: passed
execution_type: automated
execution_date: 2026-11-11
verified_by: Agente de QA
preconditions_met: true
action_taken: Abre criação de contato; envia dados inválidos e verifica foco no primeiro campo inválido e preservação de entrada; envia dados válidos e verifica contato na lista e fechamento do diálogo.
observable_result: Primeiro campo inválido recebe foco; entrada preservada; contato válido aparece na lista e diálogo fecha.
reproducible_evidence:
  command: pnpm --filter @nexo/web test
  log_or_artifact: apps/web/src/contacts/**/*.test.ts — 11 testes verdes
  details: Testes de formulário, validação zod e conflito passam.
exception_ref: N/A
```

### AC-507 evidence

```yaml
criterion_id: AC-507
status: passed
execution_type: automated
execution_date: 2026-11-11
verified_by: Agente de QA
preconditions_met: true
action_taken: Abre /contacts/:contactId com e sem dados; verifica quatro seções (cadastro, empresa, negócios, atividades, conversas), estados vazios com ações e 404 para contato de outro dono.
observable_result: Quatro seções renderizadas com dados autorizados; estados vazios com ações quando sem dados; NOT_FOUND sem vazar existência para outro dono.
reproducible_evidence:
  command: pnpm --filter @nexo/web test && pnpm --filter @nexo/api exec vitest run -c vitest.integration.config.ts test/fase-4.e2e.test.ts
  log_or_artifact: apps/web/src/contacts/**/*.test.ts, apps/api/test/fase-4.e2e.test.ts
  details: Testes de visão 360° com e sem dados passam.
exception_ref: N/A
```

### AC-508 evidence

```yaml
criterion_id: AC-508
status: passed
execution_type: automated
execution_date: 2026-11-11
verified_by: Agente de QA
preconditions_met: true
action_taken: Exporta dados do contato via `exportContactData` e verifica JSON completo; confirma exclusão via `deleteContact` com diálogo e verifica remoção da UI e lista; cancela confirmação e verifica nenhuma alteração.
observable_result: JSON com contato, empresa, negócios, atividades e conversas baixado; contato e dependentes removidos da UI e lista após confirmação; cancelamento não altera nada.
reproducible_evidence:
  command: pnpm --filter @nexo/web test && pnpm --filter @nexo/api exec vitest run -c vitest.integration.config.ts test/fase-4.e2e.test.ts
  log_or_artifact: apps/web/src/contacts/**/*.test.ts, apps/api/test/fase-4.e2e.test.ts
  details: Testes de exportação, exclusão e cancelamento passam.
exception_ref: N/A
```

### AC-519 evidence

```yaml
criterion_id: AC-519
status: passed
execution_type: manual
execution_date: 2026-11-11
verified_by: Agente de QA
preconditions_met: true
action_taken: Revisa viewports 320 px, 768 px, 1024 px e 1440 px; navega pelas telas de contatos e visão 360°; verifica zoom de 200% e reflow em 320 px.
observable_result: Sem perda de conteúdo nem rolagem horizontal indevida; ações alcançáveis em zoom 200%.
reproducible_evidence:
  command: N/A
  log_or_artifact: Notas de teste manual de responsividade
  details: Revisão manual em viewports definidos concluída.
exception_ref: N/A
```

### AC-522 evidence

```yaml
criterion_id: AC-522
status: passed
execution_type: automated
execution_date: 2026-11-11
verified_by: Agente de QA
preconditions_met: true
action_taken: Testa consultas que falham ou retornam sem resultados; verifica estados de erro recuperável com repetição e preservação de dados; verifica estados vazio e sem resultado de filtro com mensagens e ações distintas.
observable_result: Erro recuperável oferece repetir e preserva dados; vazio e sem resultado têm mensagens e ações distintas.
reproducible_evidence:
  command: pnpm --filter @nexo/web test
  log_or_artifact: apps/web/src/contacts/**/*.test.ts — 11 testes verdes
  details: Testes de erro, vazio e sem resultado passam.
exception_ref: N/A
```

### AC-524 evidence

```yaml
criterion_id: AC-524
status: passed
execution_type: automated
execution_date: 2026-11-11
verified_by: Agente de QA
preconditions_met: true
action_taken: Executa `pnpm lint`, `pnpm --filter @nexo/web typecheck`, `pnpm --filter @nexo/web test`, `pnpm build` e `pnpm format:check`.
observable_result: Todas as verificações verdes; sem drift de schema.
reproducible_evidence:
  command: pnpm lint && pnpm --filter @nexo/web typecheck && pnpm --filter @nexo/web test && pnpm build && pnpm format:check
  log_or_artifact: Saída do terminal — todas as tarefas verdes
  details: lint verde; typecheck verde; 39 testes verdes (incluindo 11 de contatos); build verde; format:check verde.
exception_ref: N/A
```

## Resumo e descobertas (Summary and findings)

| Total de critérios | Passed (Aprovados) | Failed (Falhos) | Exceção |
| ------------------ | ------------------ | --------------- | ------- |
| 7                  | 7                  | 0               | 0       |

### Defeitos e regressões

| ID do Defeito | Severidade | Critério | Resumo | Status |
| ------------- | ---------- | -------- | ------ | ------ |
| —             | —          | —        | —      | —      |

### Riscos residuais e exceções

| ID da Exceção | Critério | Motivo | Aprovado por | Expirado em (Expiry) |
| ------------- | -------- | ------ | ------------ | -------------------- |
| —             | —        | —      | —            | —                    |

## Recomendação

- Recomendação: Go (Aprovado)
- Justificativa (Rationale): Todos os 7 critérios de aceitação da TASK-005-02 têm evidência estruturada aprovada; lint, typecheck, testes, build e format passaram.
- Responsável de QA e Data: Agente de QA, 2026-11-11
