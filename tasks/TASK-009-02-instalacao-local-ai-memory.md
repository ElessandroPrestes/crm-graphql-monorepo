# TASK: Instalação local do ai-memory e wiring dos agentes

## Metadados

| Campo        | Valor                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-009-02                                                                                                             |
| Status       | Done — instalação, serviço, wiring e captura do OpenCode validados; Codex e revisão independente pendentes (2026-11-15) |
| Responsável  | Engenharia                                                                                                              |
| Refs:        | SPEC: SPEC-009; Critérios de aceitação: AC-901, AC-903, AC-904; ADRs: ADR-012                                           |
| Dependências | SPEC-009 aprovada; TASK-009-01 concluída; autorização humana para instalar em 2026-11-15                                |

## Objetivo

Executar o passo operacional previsto na seção "Entrega e operações" da
SPEC-009: instalar o binário ai-memory 3.4.6, criar e iniciar o serviço de
usuário, ligar Claude Code, Codex e OpenCode, e verificar saúde, autenticação e
escopo do repositório sem versionar segredos.

## Escopo

### Incluído

- Baixar o release Linux x86_64, conferir o checksum e instalar em
  `~/.local/bin/ai-memory`.
- Executar `ai-memory setup` para criar o diretório de dados, o token
  owner-only e o serviço `systemd --user`.
- Ligar apenas `claude-code`, `codex` e `open-code` (MCP, hooks e skills).
- Confirmar `/healthz`, `ai-memory status`, `ai-memory doctor` e o marker
  `portfolio/crm-graphql-monorepo`.
- Registrar a evidência e atualizar a documentação operacional.

### Excluído

- Ligar os demais agentes detectados (Kiro, Antigravity, CodeBuddy, IBM Bob,
  Qwen, Qoder).
- Configurar LLM, embeddings, vetores, "dream" ou servidor remoto.
- Commitar tokens, configurações globais ou artefatos do diretório de dados.
- Alterar o escopo de runtime, CI ou código de produto.

## Abordagem e impacto

- Arquivos/componentes fora do repositório: `~/.local/bin/ai-memory`,
  `~/.local/lib/ai-memory/`, `~/.local/share/ai-memory/`,
  `~/.config/systemd/user/ai-memory.service`, configurações de Claude Code,
  Codex e OpenCode.
- Arquivos no repositório: evidência de QA, `docs/ai-memory.md`, `README.md`,
  `PROJECT.md`, esta TASK e a matriz de rastreabilidade.
- Dados, contratos ou migrações: nenhum dado de produto; a wiki do ai-memory
  começa vazia.
- Riscos e salvaguardas: token apenas em arquivo owner-only e em variável de
  ambiente do Codex; hooks do Codex exigem confiança explícita; OpenCode exige
  reinício para carregar o plugin; não ligar agentes não usados.
- ADRs e padrões aplicáveis: ADR-012, `standards/security.md` e
  `docs/ids-and-traceability.md`.

## Etapas

- [x] Baixar e validar o `install.sh` e o tarball do release.
- [x] Instalar o binário e confirmar a versão 3.4.6.
- [x] Executar `ai-memory setup --yes` para claude-code, codex e open-code.
- [x] Confirmar serviço ativo, `/healthz`, token owner-only e status.
- [x] Reaplicar `install-hooks --agent open-code` (no-op confirmado).
- [x] Verificar o marker com o binário instalado.
- [x] Registrar evidência e atualizar documentação/rastreabilidade.
- [x] Validar a captura ponta a ponta com uma sessão nova do OpenCode.
- [ ] Confiar nos hooks do Codex e exportar o token do MCP no próximo início.
- [ ] Revisão independente do artefato.

## Validação

| Critério/risco     | Teste, comando ou revisão                                       | Evidência esperada                               |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------------ |
| Instalação íntegra | Checksum do `install.sh` e do tarball; `ai-memory --version`    | 3.4.6 instalado em `~/.local/bin`                |
| Serviço local      | `systemctl --user is-active ai-memory.service` e `/healthz`     | `active` e `{"status":"ok"}`                     |
| Autenticação       | `stat` do token e `ai-memory status`                            | Token `600`, auth `bearer token`                 |
| Escopo e captura   | `ai-memory hook --check-capture` no repositório                 | `portfolio/crm-graphql-monorepo`, política ativa |
| Wiring             | Inspeção de `~/.claude.json`, `~/.codex/config.toml` e OpenCode | Entradas ai-memory sem token literal             |
| Captura real       | Reiniciar agentes e executar uma sessão no repositório          | `ai-memory doctor` sem o aviso de open-code      |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis foram aprovados.
- [x] A documentação e rastreabilidade estão atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas:
  - ai-memory 3.4.6 instalado e serviço `systemd --user` ativo em
    `127.0.0.1:49374`.
  - Claude Code, Codex e OpenCode ligados a MCP, hooks e skills; OpenCode com
    plugin V1 (`ai-memory.ts`).
  - Token root em `~/.local/share/ai-memory/auth-tokens/default` com modo
    `600`; nenhum token no repositório.
  - Documentação e evidência atualizadas.
- Evidência:
  - `install.sh` checksum `bac95bc2…`, tarball checksum `cde3c286…`,
    `ai-memory 3.4.6`.
  - `systemctl --user is-active` = `active`; `/healthz` = `{"status":"ok"}`.
  - `ai-memory status`: 1 página, 1 sessão e 4 observações após a validação;
    providers LLM/embedding desligados.
  - `ai-memory doctor`: escopo `exact`, marker válido e
    `✓ Every harness that ran in this project recently is captured` após uma
    sessão nova do OpenCode.
  - Detalhes em `reviews/qa-evidence/QA-EVIDENCE-TASK-009-02.md`.
- Desvios: o `setup` detectou nove agentes, mas apenas os três usados foram
  ligados por decisão de menor impacto.
- Trabalho em aberto ou bloqueios: confiar nos hooks do Codex, exportar
  `AI_MEMORY_AUTH_TOKEN` para o MCP do Codex e revisar o artefato de forma
  independente.
