# ADR-012: Memória compartilhada de agentes com ai-memory

## Metadados

| Campo                     | Valor                                                           |
| ------------------------- | --------------------------------------------------------------- |
| Status                    | Accepted — instrução direta do solicitante humano em 2026-11-15 |
| Data                      | 2026-11-15                                                      |
| Responsáveis              | Engenharia                                                      |
| SPEC relacionada          | SPEC-009                                                        |
| Substitui/substituída por | —                                                               |

## Contexto

O projeto é desenvolvido por agentes diferentes (Claude Code, Codex, OpenCode e
outros) em sessões e máquinas distintas. O repositório já mantém a fonte de
verdade do trabalho em `AGENTS.md`, `PROJECT.md`, `specs/`, `tasks/`, `adr/` e
`reviews/`, mas não há memória operacional compartilhada entre sessões: o
agente que retoma uma tarefa precisa reconstruir o que foi tentado, o que
falhou e o que ficou aberto. Recursos de memória nativos de cada harness são
locais, pertencem a um agente e não atravessam a troca de ferramenta.

O `ai-memory` é uma ferramenta externa, escrita em Rust, que captura
observações por lifecycle hooks, consolida sessões em uma wiki markdown
versionada em git, indexa o conteúdo para recuperação e distribui handoffs
tipados entre agentes. O modelo padrão não exige LLM nem banco vetorial. A
ferramenta não é uma dependência de runtime do CRM e não altera a aplicação.

## Drivers da decisão

- Continuidade entre harnesses, sessões e máquinas sem reexplicar arquitetura.
- Fonte de verdade em markdown versionado, editável e reconstruível.
- Operação local e privada por padrão, com token e servidor em loopback.
- Custo zero de LLM no caminho padrão e nenhuma dependência de runtime.
- Regras do projeto continuam canônicas em `AGENTS.md`, acima da memória.
- Integração reversível; a entrega versionada não instala serviço nem altera
  configurações globais. A operação local é um passo separado.

## Alternativas consideradas

### Alternativa A: manter apenas a memória nativa de cada harness

- Benefícios: nenhuma ferramenta nova, nenhum processo local, zero configuração.
- Custos e riscos: memória ilhada por agente e por máquina; handoffs manuais;
  troca de harness perde o contexto; nenhuma busca unificada no histórico.

### Alternativa B: adotar o ai-memory como ferramenta de desenvolvimento

- Benefícios: captura automática, wiki markdown como fonte de verdade, handoffs
  entre agentes, busca híbrida local, operação single-user em loopback e
  caminho zero-LLM por padrão.
- Custos e riscos: um binário e um serviço de usuário a instalar e operar;
  captura silenciosa exige política de exclusão e revisão de privacidade;
  recursos de consolidação por LLM e vetores permanecem opt-in.

### Alternativa C: API hospedada de memória

- Benefícios: ingestão e recuperação gerenciadas, sem operar servidor.
- Custos e riscos: dados de sessão saem da máquina, custo recorrente, lock-in,
  dependência de rede e menor controle sobre retenção e formato.

### Alternativa D: wiki markdown sem captura automática (estilo basic-memory)

- Benefícios: arquivos locais e controle total do formato.
- Custos e riscos: exige disciplina manual para registrar cada sessão; não há
  captura de lifecycle, handoff claim-once nem busca integrada ao agente.

## Decisão

Adotar o **ai-memory** como ferramenta opcional de memória de desenvolvimento,
com integração versionada no repositório:

- `.ai-memory.toml` declara `workspace = "portfolio"` e
  `project = "crm-graphql-monorepo"` e exclui da captura artefatos de build,
  segredos e registros canônicos do próprio repositório (`adr/`, `specs/`,
  `tasks/`, `reviews/`).
- `AGENTS.md` é o arquivo canônico de instruções e recebe o bloco gerenciado de
  roteamento do ai-memory; `CLAUDE.md` importa `@AGENTS.md`.
- A topologia documentada é local single-user: servidor em `127.0.0.1:49374`,
  token em arquivo owner-only, dados em `~/.local/share/ai-memory`.
- A instalação do binário, do serviço de usuário e o wiring de hooks/MCP são um
  passo operacional separado, fora do escopo desta decisão de repositório.
- LLM, embeddings, vetores e o passe de "dream" permanecem desligados por
  padrão; o caminho zero-LLM é o esperado.

## Consequências

### Positivas

- O próximo agente encontra handoffs e páginas de sessão em vez de reconstruir o
  contexto por busca ampla.
- A memória é portátil entre agentes e máquinas quando apontada para o mesmo
  servidor, sem prender o projeto a um harness.
- A wiki em markdown pode ser inspecionada, versionada e editada à mão; o índice
  SQLite é derivado e reconstruível.
- O repositório continua utilizável sem o ai-memory; CI e runtime não dependem
  dele.

### Negativas e riscos

- A captura silenciosa pode reter contexto sensível se as exclusões forem
  esquecidas; a política deve ser revisada quando novos diretórios sensíveis
  forem criados.
- Um serviço local adicional precisa estar ativo para recall e handoffs; a
  indisponibilidade gera spool local e exige `ai-memory recover`.
- O bloco de instruções adiciona tokens a cada sessão; o orçamento de contexto
  do projeto continua prevalecendo.
- Windows nativo é experimental; WSL2 é o caminho suportado.

## Implementação e migração

- **Compatibilidade:** nenhuma mudança de código, schema, API ou dependência de
  runtime. A ferramenta é opcional e pode ser removida sem afetar o build.
- **Etapas:** adicionar `.ai-memory.toml`, o bloco gerenciado em `AGENTS.md`, o
  import em `CLAUDE.md`, `docs/ai-memory.md` e a rastreabilidade SDD. A
  instalação local segue `docs/ai-memory.md`.
- **Estado operacional (2026-11-15):** ai-memory 3.4.6 instalado com serviço
  `systemd --user` ativo; Claude Code, Codex e OpenCode ligados. Detalhes e
  limitações em `TASK-009-02` e `QA-EVIDENCE-TASK-009-02.md`.
- **Rollback:** remover os arquivos e o bloco gerenciado; se instalado,
  `ai-memory uninstall --apply` remove apenas o que a ferramenta criou.
- **Observabilidade:** `ai-memory status`, `ai-memory doctor` e o log do serviço
  de usuário; a wiki e o índice ficam no diretório de dados, fora do repositório.

## Evidências e validação

- `.ai-memory.toml` validado como TOML e reconhecido pelo binário ai-memory
  3.4.6 com `--check-capture`.
- Bloco de roteamento gerado por `ai-memory install-instructions --print
--target AGENTS.md` e inserido entre os marcadores gerenciados.
- `docs/ai-memory.md` cobre instalação, wiring, verificação, segurança e
  rollback.
- Evidência de QA em `reviews/qa-evidence/QA-EVIDENCE-TASK-009-01.md`.
