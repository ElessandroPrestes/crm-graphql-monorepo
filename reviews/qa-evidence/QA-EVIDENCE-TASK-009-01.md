# Evidência de QA (QA Evidence): integração do ai-memory (TASK-009-01)

## Metadados

| Campo                  | Valor                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| ID                     | QA-EVIDENCE-009                                                     |
| Status                 | Passed (local) — artefato versionado; revisão independente pendente |
| SPEC                   | SPEC-009                                                            |
| TAREFA (TASK)          | TASK-009-01                                                         |
| Responsável (QA Owner) | Engenharia (autoavaliação; revisão independente pendente)           |
| Data de Execução       | 2026-11-15                                                          |
| Build / Commit         | `develop` — alterações ainda não commitadas                         |
| Ambiente               | Linux x86_64; ai-memory 3.4.6 executado de `/tmp`, sem instalação   |
| Ferramentas            | Node.js 26.13.0, pnpm 12.18.0, Python 3, Prettier 3.9.10            |

## Configuração do ambiente

- SO / Arquitetura: Linux x86_64.
- ai-memory: binário 3.4.6 extraído em `/tmp/opencode/ai-memory`, com checksum
  SHA-256 `cde3c286bd81854a6b724746b86fe5def5ffd0c9a46ee7abccfa00796561b791`
  conferido contra o release publicado.
- `command -v ai-memory` não retorna caminho; não há unidade `systemd --user`
  nem serviço instalado.
- Nenhum dado real, token ou credencial foi usado na validação.

## Evidência de critérios de aceitação

### AC-901 — Escopo do repositório declarado e reconhecido

```yaml
criterion_id: AC-901
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Validar o TOML com tomllib e executar ai-memory hook --check-capture a partir da raiz.
observable_result: workspace=portfolio, project=crm-graphql-monorepo, project_src=marker; eventos de ferramenta retornam policy_state=active e drop para caminhos excluídos.
reproducible_evidence:
  command: python3 -c "import tomllib; ..." && printf '%s' '{"cwd":"'"$PWD"'","session_id":"check","hook_event_name":"UserPromptSubmit"}' | ai-memory hook --event user-prompt-submit --agent claude-code --check-capture
  log_or_artifact: .ai-memory.toml
  details: |
    Saída do check-capture: capture_mode=denylist, marker_present=true,
    admits_capture=true, scope.workspace=portfolio,
    scope.project=crm-graphql-monorepo, scope.project_src=marker.
    Para pre-tool-use: node_modules/x/index.js => drop; apps/web/src/main.tsx => keep;
    specs/exemplo.md => drop; .env => drop;
    apps/api/src/generated/client.ts => drop.
exception_ref: N/A
```

### AC-902 — Instruções canônicas e bloco gerenciado

```yaml
criterion_id: AC-902
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Comparar o bloco versionado em AGENTS.md com a saída de ai-memory install-instructions --print --target AGENTS.md; inspecionar CLAUDE.md.
observable_result: Um único par de marcadores; conteúdo igual ao oficial após a normalização do Prettier (linha em branco após o marcador e ênfase com _); CLAUDE.md contém apenas @AGENTS.md.
reproducible_evidence:
  command: ai-memory install-instructions --print --target AGENTS.md && python3 - <<'PY' ... PY
  log_or_artifact: AGENTS.md; CLAUDE.md
  details: start markers=1; end markers=1; block_matches_official_snippet=True antes do Prettier; diferenças restantes são apenas formatação Markdown.
exception_ref: N/A
```

### AC-903 — Documentação operacional

```yaml
criterion_id: AC-903
status: passed
execution_type: manual
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Revisar docs/ai-memory.md e os links a partir de README.md, PROJECT.md, ADR-012, SPEC-009 e TASK-009-01.
observable_result: Documento cobre topologia local single-user, instalação, wiring, verificação, captura excluída, segurança, operação e rollback; os links relativos apontam para arquivos existentes.
reproducible_evidence:
  command: Revisão de docs/ai-memory.md e links relativos
  log_or_artifact: docs/ai-memory.md
  details: Nenhum comando de instalação foi executado; a seção de estado deixa claro que a captura só começa após o setup humano.
exception_ref: N/A
```

### AC-904 — Nenhum artefato global ou segredo versionado

```yaml
criterion_id: AC-904
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Inspecionar git status/diff, procurar valores de token/segredo e confirmar ausência de binário ou serviço instalado.
observable_result: Apenas arquivos de configuração e documentação foram alterados; a varredura não encontrou valores de segredo; ai-memory não está instalado; não há unidade systemd de usuário.
reproducible_evidence:
  command: git diff --check && grep -RInE "(sk-[A-Za-z0-9]{16,}|Bearer [A-Za-z0-9._-]{16,}|AI_MEMORY_AUTH_TOKEN=)" <arquivos alterados>; command -v ai-memory; systemctl --user list-unit-files | grep -i ai-memory
  log_or_artifact: git status; git diff --stat
  details: git diff --check sem erros; "no secret values found"; "ai-memory not installed"; "no user unit".
exception_ref: N/A
```

### AC-905 — Rastreabilidade SDD atualizada

```yaml
criterion_id: AC-905
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Executar scripts/generate_traceability.py e revisar a matriz.
observable_result: A matriz lista SPEC-009 com TASK-009-01; a única lacuna nova é o commit com Task-Ref, pendente porque não houve commit.
reproducible_evidence:
  command: python3 scripts/generate_traceability.py
  log_or_artifact: docs/traceability-matrix.md
  details: Linha de SPEC-009 presente; lacuna "TASK-009-01 não possui commit com Task-Ref: TASK-009-01".
exception_ref: N/A
```

## Gates de qualidade

```yaml
criterion_id: quality-gates
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Executar pnpm format:check, validar TOML, diff-check e gerar a matriz.
observable_result: pnpm format:check passou em todo o repositório; o TOML foi lido com tomllib; git diff --check não reportou problemas; a matriz foi regenerada.
reproducible_evidence:
  command: pnpm format:check && python3 -c "import tomllib; tomllib.load(open('.ai-memory.toml','rb'))" && git diff --check && python3 scripts/generate_traceability.py
  log_or_artifact: saída dos comandos
  details: Nenhum código, schema, migration, dependência de runtime ou pipeline de CI foi alterado; lint/typecheck/testes de produto não se aplicam a esta mudança documental.
exception_ref: N/A
```

## Limitações e pendências

- A instalação local do binário, do serviço de usuário e o wiring de hooks/MCP
  ficaram fora desta evidência e foram executados depois na
  [TASK-009-02](QA-EVIDENCE-TASK-009-02.md); esta evidência cobre apenas o
  artefato versionado.
- O commit de implementação e os trailers `Spec-Ref: SPEC-009` /
  `Task-Ref: TASK-009-01` ainda não existem; a matriz registra essa lacuna.
- A revisão independente desta evidência ainda não foi realizada.
- Os links para a documentação upstream foram verificados por leitura, mas o
  projeto upstream pode mudar de caminho entre releases.
