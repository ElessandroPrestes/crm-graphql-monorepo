# Evidência de QA (QA Evidence): <title>

## Metadados

| Campo | Valor |
|---|---|
| ID | QA-EVIDENCE-NNN |
| Status | In progress (Em progresso) / Complete (Concluído) |
| SPEC | SPEC-NNN |
| TAREFA (TASK) | TASK-NNN-XX |
| Responsável (QA Owner) | |
| Data de Execução | YYYY-MM-DD |
| Build / Commit | |
| Ambiente | |

## Configuração do ambiente

- SO / Arquitetura:
- Runtime / Engine:
- Dependências / Versões de serviço:
- Feature flags / Configurações:
- Contas de teste / Permissões:
- Linha de base dos dados de teste / Seed:

## Evidência de critérios de aceitação

Registre uma entrada YAML estruturada para cada critério de aceitação definido na SPEC.
Não deduza os resultados ou use texto livre (prosa) fora desses campos. Todo critério aplicável deve ser avaliado.

### AC-001 evidence

```yaml
criterion_id: AC-001
status: passed # passed | failed | exception
execution_type: automated # automated | manual | exploratory | accessibility | visual | performance | security
execution_date: YYYY-MM-DD
verified_by: <Agente de QA / nome do testador>
preconditions_met: true
action_taken: <ação exata ou gatilho executado>
observable_result: <resultado observado correspondendo ao expected_result da SPEC>
reproducible_evidence:
  command: <linha de comando exata executada, ou N/A>
  log_or_artifact: <caminho do arquivo, URI, ou referência do artefato>
  details: <resumo de stdout/stderr, capturas de tela, ou passos de reprodução>
exception_ref: N/A # N/A ou referência de exceção aprovada
```

### AC-002 evidence

```yaml
criterion_id: AC-002
status: passed # passed | failed | exception
execution_type: manual # automated | manual | exploratory | accessibility | visual | performance | security
execution_date: YYYY-MM-DD
verified_by: <Agente de QA / nome do testador>
preconditions_met: true
action_taken: <ação exata ou gatilho executado>
observable_result: <resultado observado correspondendo ao expected_result da SPEC>
reproducible_evidence:
  command: N/A
  log_or_artifact: <caminho para notas de teste, screenshot (captura de tela) ou vídeo>
  details: <log de verificação passo a passo>
exception_ref: N/A # N/A ou referência de exceção aprovada
```

## Resumo e descobertas (Summary and findings)

| Total de critérios | Passed (Aprovados) | Failed (Falhos) | Exceção |
|---|---|---|---|
| | | | |

### Defeitos e regressões

| ID do Defeito | Severidade | Critério | Resumo | Status |
|---|---|---|---|---|
| | | | | |

### Riscos residuais e exceções

| ID da Exceção | Critério | Motivo | Aprovado por | Expirado em (Expiry) |
|---|---|---|---|---|
| | | | | |

## Recomendação

- Recomendação: Go (Aprovado) / Go with accepted risk (Aprovado com risco aceito) / No-go (Não aprovado)
- Justificativa (Rationale):
- Responsável de QA e Data:
