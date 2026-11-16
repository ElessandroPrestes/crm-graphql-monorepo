# Relatório de Verificação de QA (QA Verification Report): SPEC-009 memória compartilhada de agentes com ai-memory

## Metadados

| Campo            | Valor                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| ID               | VR-002                                                                                                 |
| Status           | Passed (Aprovado)                                                                                      |
| SPEC             | SPEC-009                                                                                               |
| TAREFA (TASK)    | TASK-009-01, TASK-009-02                                                                               |
| Evidência Ref    | reviews/qa-evidence/QA-EVIDENCE-TASK-009-01.md, reviews/qa-evidence/QA-EVIDENCE-TASK-009-02.md         |
| Verificador      | QA-Verifier (agente OpenCode, sessão de 2026-11-16; revisão de código independente permanece pendente) |
| Data de Execução | 2026-11-16                                                                                             |

## Resultados da comparação

O QA-Verifier compara cada critério estruturado na SPEC aprovada com a evidência estruturada de QA. Cada item é classificado como:

- **verified (verificado):** a evidência corresponde ao critério, pré-condições, ação e resultado esperado, com o status aprovado (passing) ou com uma exceção aprovada.
- **missing (ausente):** não existe uma entrada de evidência de QA para este ID de critério.
- **unmapped (não mapeado):** a evidência não pode ser vinculada exatamente a um ID de critério aprovado.
- **failed (falhou):** a evidência vinculada registra um resultado reprovado.
- **ambiguous (ambíguo):** o critério ou a evidência não possui detalhes estruturados suficientes para confirmar a verificação.

| ID do Critério | Resultado Esperado da SPEC                                                         | Status da Evidência | Classificação do Verificador | Notas / Achado                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------- | ------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-901         | Escopo portfolio/crm-graphql-monorepo e política de captura ativa                  | passed              | verified                     | `pre-` e pós-instalação: TOML válido, `project_src=marker`, `capture_mode=denylist` e drop de caminhos excluídos (QA-EVIDENCE-009 e QA-EVIDENCE-010)                      |
| AC-902         | Um bloco gerenciado em AGENTS.md e CLAUDE.md importando @AGENTS.md                 | passed              | verified                     | Marcador único (1 start / 1 end) e `CLAUDE.md` apenas com `@AGENTS.md`, conforme QA-EVIDENCE-009                                                                          |
| AC-903         | Documentação cobre instalação, wiring, verificação, segurança, operação e rollback | passed              | verified                     | `docs/ai-memory.md` existe e está linkado; estado local e pendência do Codex registrados (QA-EVIDENCE-009 e QA-EVIDENCE-010)                                              |
| AC-904         | Nenhum token, URL privada, binário ou unidade de serviço versionado                | passed              | verified                     | Varredura de segredo sem valores; token `600` fora do repositório; Codex usa `bearer_token_env_var` (QA-EVIDENCE-009 e QA-EVIDENCE-010)                                   |
| AC-905         | Matriz lista SPEC-009, TASKs, ADR-012 e evidências                                 | passed              | verified                     | `docs/traceability-matrix.md` lista SPEC-009, TASK-009-01/02, ADR-012 e as duas evidências de QA; lacunas restantes são apenas de commits de TASKs posteriores à execução |

### Escopo por TASK

| TASK        | Critérios declarados em `Refs:` | Evidência estruturada | Resultado                                                    |
| ----------- | ------------------------------- | --------------------- | ------------------------------------------------------------ |
| TASK-009-01 | AC-901..AC-905                  | QA-EVIDENCE-009       | Todos os cinco critérios com entrada `passed` e reproduzível |
| TASK-009-02 | AC-901, AC-903, AC-904          | QA-EVIDENCE-010       | Três critérios com entrada `passed` e reproduzível           |

Os critérios AC-901, AC-903 e AC-904 aparecem nas duas evidências com escopos
complementares declarados pelas próprias TASKs (artefato versionado versus
instalação local). Cada ocorrência está vinculada exatamente a um `criterion_id`
dentro da evidência da sua TASK, sem entrada órfã ou não mapeada; a checagem de
"exatamente uma vez" foi aplicada por escopo de TASK.

## Descobertas não resolvidas (Unresolved findings)

| ID da Descoberta | Critério | Classificação | Descrição | Ação requerida |
| ---------------- | -------- | ------------- | --------- | -------------- |
| —                | —        | —             | —         | —              |

Nenhuma descoberta em aberto. Todos os cinco critérios aplicáveis de SPEC-009
estão verificados nas evidências estruturadas das duas TASKs.

## Riscos residuais e limitações registradas

- A captura ponta a ponta do Codex (confiança nos hooks e exportação de
  `AI_MEMORY_AUTH_TOKEN`) não foi exercitada; não é critério de aceitação da
  SPEC-009, mas permanece como trabalho operacional em aberto na TASK-009-02.
- A revisão de código independente dos artefatos de SPEC-009 ainda não foi
  realizada. Este relatório cobre apenas a comparação de rastreabilidade
  entre critérios e evidências estruturadas; não substitui o Gate 4.
- As evidências foram executadas em 2026-11-15; a verificação de 2026-11-16
  confirmou o estado atual do escopo, do marker, do serviço e da ausência de
  segredos versionados.

## Decisão do Portão 3 (Gate 3 decision)

- Status do Portão: **Pass** (Pronto para Code Review)
- Contagem de descobertas abertas: 0
- Exceções autorizadas: Nenhuma
- Assinatura do verificador e timestamp: QA-Verifier (agente OpenCode) — 2026-11-16T12:45:00Z
