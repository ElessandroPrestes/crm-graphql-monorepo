# TASK: Integração versionada do ai-memory

## Metadados

| Campo        | Valor                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-009-01                                                                                                                |
| Status       | Done — implementação versionada concluída; instalação executada em TASK-009-02; revisão independente pendente (2026-11-15) |
| Responsável  | Engenharia                                                                                                                 |
| Refs:        | SPEC: SPEC-009; Critérios de aceitação: AC-901..AC-905; ADRs: ADR-012                                                      |
| Dependências | SPEC-009 aprovada por instrução humana em 2026-11-15; ai-memory 3.4.6 para validação do marker                             |

## Objetivo

Declarar o escopo de memória do repositório, instalar as instruções de
roteamento nos arquivos canônicos dos agentes, documentar a topologia local
single-user e registrar a decisão/evidência no SDD, sem baixar o binário nem
alterar configurações globais nesta máquina.

## Escopo

### Incluído

- `.ai-memory.toml` com `workspace`, `project` e política `[capture]`.
- Bloco gerenciado do ai-memory em `AGENTS.md`.
- Import `@AGENTS.md` em `CLAUDE.md`.
- `docs/ai-memory.md` com instalação, wiring, verificação, segurança e rollback.
- `.prettierignore` com `.ai-memory.toml` (TOML não tem parser no Prettier).
- ADR-012, SPEC-009, esta TASK e evidência de QA.
- Atualização de `README.md`, `PROJECT.md` e `docs/traceability-matrix.md`.
- Validação do marker com ai-memory 3.4.6 executado a partir de `/tmp`.

### Excluído

- Instalar o binário, criar serviço de usuário ou configurar hooks/MCP.
- Configurar LLM, embeddings, vetores ou passe "dream".
- Provisionar servidor remoto, multiusuário, TLS ou OIDC.
- Alterar código, schema, API, dependências de runtime ou CI.
- Commitar ou publicar as mudanças sem pedido explícito.

## Abordagem e impacto

- Prováveis arquivos ou componentes: `.ai-memory.toml`, `AGENTS.md`,
  `CLAUDE.md`, `docs/ai-memory.md`, `adr/ADR-012-memoria-agentes-ai-memory.md`,
  `specs/SPEC-009-memoria-agentes-ai-memory.md`, `README.md`, `PROJECT.md`,
  `docs/traceability-matrix.md`, `.prettierignore`,
  `reviews/qa-evidence/QA-EVIDENCE-TASK-009-01.md`.
- Dados, contratos ou migrações: nenhuma migração; apenas arquivos de
  configuração/instrução e documentação.
- Riscos e salvaguardas: não versionar token; não rodar `ai-memory setup`;
  excluir registros canônicos da captura; validar TOML e o bloco gerenciado.
- ADRs e padrões aplicáveis: ADR-012; `standards/security.md`,
  `standards/coding.md` e `docs/ids-and-traceability.md`.

## Etapas

- [x] Criar `.ai-memory.toml` com escopo e exclusões de captura.
- [x] Gerar o bloco oficial com ai-memory 3.4.6 e inseri-lo em `AGENTS.md`.
- [x] Reduzir `CLAUDE.md` ao import `@AGENTS.md`.
- [x] Escrever `docs/ai-memory.md`.
- [x] Criar ADR-012, SPEC-009 e TASK-009-01.
- [x] Atualizar `README.md` e `PROJECT.md`.
- [x] Validar o marker com `ai-memory hook --check-capture`.
- [x] Gerar a matriz de rastreabilidade.
- [x] Registrar evidência de QA e executar a verificação de formatação.
- [x] Instalar e ligar o ai-memory localmente — executado na TASK-009-02 após
      autorização humana em 2026-11-15.
- [x] Registrar o commit de implementação (`c42d10e`) e o fechamento de
      rastreabilidade com `Spec-Ref: SPEC-009` e `Task-Ref: TASK-009-01`.
- [ ] Revisão independente do artefato.

## Validação

| Critério/risco | Teste, comando ou revisão                                                                 | Evidência esperada                                                       |
| -------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| AC-901         | `python3 -c "import tomllib..."` e `ai-memory hook --check-capture`                       | JSON resolve `portfolio`/`crm-graphql-monorepo` e `capture_policy` ativa |
| AC-902         | Diff entre `ai-memory install-instructions --print --target AGENTS.md` e o bloco inserido | Marcadores únicos; `CLAUDE.md` com `@AGENTS.md`                          |
| AC-903         | Revisão de `docs/ai-memory.md` e links                                                    | Instalação, wiring, verificação, segurança e rollback cobertos           |
| AC-904         | `git diff`, `grep` por token/segredo e `command -v ai-memory`                             | Nenhum segredo, binário ou serviço versionado                            |
| AC-905         | `python3 scripts/generate_traceability.py`                                                | SPEC-009, TASK-009-01, ADR-012 e QA na matriz                            |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis foram aprovados.
- [x] A documentação e rastreabilidade estão atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças feitas:
  - `.ai-memory.toml` com escopo `portfolio/crm-graphql-monorepo` e exclusões de
    build, segredos e registros canônicos.
  - Bloco gerenciado do ai-memory 3.4.6 em `AGENTS.md`; `CLAUDE.md` apenas com
    `@AGENTS.md`.
  - `docs/ai-memory.md` com topologia local single-user e operação.
  - ADR-012, SPEC-009, TASK-009-01 e evidência de QA.
  - README, PROJECT e matriz de rastreabilidade atualizados.
- Evidência:
  - `checksum OK` do tarball `ai-memory-linux-x86_64.tar.gz` 3.4.6
    (`cde3c286bd81854a6b724746b86fe5def5ffd0c9a46ee7abccfa00796561b791`).
  - `ai-memory hook --check-capture` resolvendo `workspace=portfolio`,
    `project=crm-graphql-monorepo` e `capture_policy=active`.
  - `ai-memory install-instructions --print --target AGENTS.md` corresponde ao
    bloco versionado, salvo a normalização de formatação do Prettier.
  - `python3 scripts/generate_traceability.py` e `pnpm exec prettier --check`
    nos arquivos alterados.
  - Commit de implementação `c42d10e` com `Spec-Ref: SPEC-009` e
    `Task-Ref: TASK-009-02`; commit de fechamento com `Task-Ref: TASK-009-01`.
  - Detalhes em `reviews/qa-evidence/QA-EVIDENCE-TASK-009-01.md`.
- Desvios: a instalação ficou fora desta TASK por decisão explícita do
  solicitante e foi executada depois na
  [TASK-009-02](TASK-009-02-instalacao-local-ai-memory.md), mantendo a separação
  entre artefato versionado e operação local.
- Trabalho em aberto ou bloqueios: captura do OpenCode validada na TASK-009-02;
  restam confiar nos hooks do Codex, exportar o token do MCP do Codex e realizar
  revisão independente.
