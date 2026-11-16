# Evidência de QA (QA Evidence): instalação local do ai-memory (TASK-009-02)

## Metadados

| Campo                  | Valor                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| ID                     | QA-EVIDENCE-010                                                                 |
| Status                 | Passed (instalação e captura OpenCode); Codex e revisão independentes pendentes |
| SPEC                   | SPEC-009                                                                        |
| TAREFA (TASK)          | TASK-009-02                                                                     |
| Responsável (QA Owner) | Engenharia (autoavaliação; revisão independente pendente)                       |
| Data de Execução       | 2026-11-15                                                                      |
| Build / Commit         | `develop` — alterações ainda não commitadas                                     |
| Ambiente               | Linux x86_64, systemd user, ai-memory 3.4.6, LLM/embeddings desligados          |
| Ferramentas            | ai-memory 3.4.6, Claude Code, Codex, OpenCode 1.19.5, Node.js 26, pnpm 12       |

## Configuração do ambiente

- Instalação nativa em `~/.local/lib/ai-memory`, link em
  `~/.local/bin/ai-memory`.
- Serviço `systemd --user` `ai-memory.service`, habilitado e ativo em
  `127.0.0.1:49374`.
- Dados em `~/.local/share/ai-memory`; token root em
  `auth-tokens/default` com modo `600`.
- Nenhum provedor de LLM ou embedding configurado.
- Agentes ligados: `claude-code`, `codex` e `open-code`. Os demais agentes
  detectados pelo `setup` não foram alterados.

## Evidência de critérios de aceitação

### AC-901 — Escopo do repositório reconhecido após a instalação

```yaml
criterion_id: AC-901
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Executar ai-memory hook --check-capture no repositório com o binário instalado.
observable_result: workspace=portfolio, project=crm-graphql-monorepo, project_src=marker, marker_present=true; política ativa em eventos de ferramenta.
reproducible_evidence:
  command: printf '%s' '{"cwd":"'"$PWD"'","session_id":"check","hook_event_name":"UserPromptSubmit"}' | ai-memory hook --event user-prompt-submit --agent claude-code --check-capture
  log_or_artifact: saída JSON do check-capture
  details: |
    capture_mode=denylist; admits_capture=true; scope.workspace=portfolio;
    scope.project=crm-graphql-monorepo; scope.project_src=marker.
    pre-tool-use: node_modules/x/index.js => drop; apps/web/src/main.tsx => keep;
    specs/exemplo.md => drop; .env => drop.
exception_ref: N/A
```

### AC-903 — Documentação operacional atualizada

```yaml
criterion_id: AC-903
status: passed
execution_type: manual
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Revisar docs/ai-memory.md, README.md e PROJECT.md após a instalação.
observable_result: A documentação registra a instalação local, o serviço ativo, o wiring de Claude Code/Codex/OpenCode, o reinício necessário e a pendência de confiança/exportação de token no Codex.
reproducible_evidence:
  command: Revisão de docs/ai-memory.md e links relativos
  log_or_artifact: docs/ai-memory.md
  details: Instruções genéricas de instalação preservadas; estado local registrado com data e versão.
exception_ref: N/A
```

### AC-904 — Nenhum segredo ou artefato global versionado

```yaml
criterion_id: AC-904
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Inspecionar git status/diff, procurar token literal no repositório e confirmar que o token está owner-only fora do repositório.
observable_result: Nenhum token, binário ou unidade de serviço foi versionado; o token está em arquivo 600 fora do repositório; as configurações dos agentes referenciam o arquivo ou a variável de ambiente, nunca o valor.
reproducible_evidence:
  command: git status --short && git diff --check && stat -c '%a %n' ~/.local/share/ai-memory/auth-tokens/default && grep -RInE "(sk-[A-Za-z0-9]{16,}|Bearer [A-Za-z0-9._-]{16,}|AI_MEMORY_AUTH_TOKEN=)" <arquivos do repositório>
  log_or_artifact: git status; stat do token
  details: Token com modo 600; nenhum valor de segredo encontrado no repositório; Codex usa bearer_token_env_var.
exception_ref: N/A
```

## Evidência operacional

### Instalação e serviço

```yaml
criterion_id: install-service
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Validar checksums, instalar, executar setup e consultar o serviço.
observable_result: install.sh e tarball com checksum válido; ai-memory 3.4.6; serviço enabled/active; /healthz ok.
reproducible_evidence:
  command: sha256sum install.sh ai-memory-linux-x86_64.tar.gz; ai-memory --version; systemctl --user is-enabled ai-memory.service; systemctl --user is-active ai-memory.service; curl -fsS http://127.0.0.1:49374/healthz
  log_or_artifact: saída dos comandos
  details: |
    install.sh: bac95bc26ed8ab5751117283a3568fa52c341b38294440cd1bb808056d0f0395
    tarball: cde3c286bd81854a6b724746b86fe5def5ffd0c9a46ee7abccfa00796561b791
    serviço: enabled / active (running) desde 2026-11-15 11:36:39 -03
    healthz: {"status":"ok"}
exception_ref: N/A
```

### Estado do servidor

```yaml
criterion_id: server-status
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Executar ai-memory status e ai-memory doctor.
observable_result: Servidor 3.4.6 em loopback, auth bearer token, 1 página, 1 sessão e 4 observações; doctor confirma escopo exato, marker válido e que todos os harnesses recentes estão capturados.
reproducible_evidence:
  command: ai-memory status && ai-memory doctor
  log_or_artifact: saída dos comandos
  details: |
    providers: llm disabled, embedding disabled.
    doctor: project coordinate exact (requested crm-graphql-monorepo, current
    crm-graphql-monorepo); local scope marker_or_fallback, marker valid.
    open-code: 16 local (16 recent) -> 1 captured;
    ✓ Every harness that ran in this project recently is captured on the server.
exception_ref: N/A
```

### Captura ponta a ponta (OpenCode)

```yaml
criterion_id: opencode-capture
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Executar uma sessão nova do OpenCode no repositório e consultar o servidor.
observable_result: A sessão foi aceita e consolidada; o servidor passou de 0 para 1 sessão, 1 página e 4 observações, sem drops.
reproducible_evidence:
  command: opencode run --model opencode/deepseek-v4.1-flash-free --title "ai-memory: validação da instalação" "Responda apenas com a palavra ok. Não use ferramentas." && ai-memory status && ai-memory doctor
  log_or_artifact: saída dos comandos
  details: |
    sessão: 1; páginas: 1; observações: 4; ingest accepted: 4;
    outcomes: 4 stored, 0 failed; drops: 0 unauthorized, 0 collision,
    0 invalid.
exception_ref: N/A
```

### Wiring dos agentes

```yaml
criterion_id: agent-wiring
status: passed
execution_type: automated
execution_date: 2026-11-15
verified_by: Engenharia
preconditions_met: true
action_taken: Inspecionar as configurações globais dos três agentes ligados.
observable_result: Claude Code com MCP stdio via mcp-bridge e hooks; Codex com MCP HTTP e bearer_token_env_var; OpenCode com MCP local e plugin V1 ai-memory.ts; nenhum token literal.
reproducible_evidence:
  command: python3 -c "import json; ..."; grep -n "ai-memory" ~/.codex/config.toml; ls -l ~/.config/opencode/plugins/ai-memory.ts
  log_or_artifact: ~/.claude.json; ~/.claude/settings.json; ~/.codex/config.toml; ~/.codex/hooks.json; ~/.config/opencode/opencode.json
  details: |
    Claude: mcpServers.ai-memory = mcp-bridge --server-url http://127.0.0.1:49374/mcp.
    Codex: [mcp_servers.ai-memory] url + bearer_token_env_var=AI_MEMORY_AUTH_TOKEN.
    OpenCode 1.19.5: mcp.ai-memory local com mcp-bridge --no-session-id e
    plugins/ai-memory.ts (153.546 bytes).
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
action_taken: Executar pnpm format:check, git diff --check e regenerar a matriz de rastreabilidade.
observable_result: Formatação e diff-check passaram; a matriz lista SPEC-009, TASK-009-01, TASK-009-02 e as duas evidências de QA.
reproducible_evidence:
  command: pnpm format:check && git diff --check && python3 scripts/generate_traceability.py
  log_or_artifact: docs/traceability-matrix.md
  details: Nenhum código, schema, migration ou dependência de runtime foi alterado.
exception_ref: N/A
```

## Limitações e pendências

- A captura foi validada em uma sessão nova do OpenCode. Sessões abertas antes
  da instalação do plugin não são capturadas retroativamente.
- O Codex exige confiança explícita nos hooks no próximo início e a variável
  `AI_MEMORY_AUTH_TOKEN` exportada para o MCP HTTP; esses dois passos não foram
  exercitados nesta evidência.
- Nenhum handoff real foi gerado; a sessão de validação foi curta e não abriu
  trabalho pendente.
- A revisão independente desta evidência ainda não foi realizada.
- O commit de implementação é `c42d10e`, com `Spec-Ref: SPEC-009` e
  `Task-Ref: TASK-009-02`.
