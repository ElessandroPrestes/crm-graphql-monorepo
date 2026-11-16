# SPEC: Memória compartilhada de agentes com ai-memory

## Metadados

| Campo          | Valor                                                                                                                                                                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SPEC-009                                                                                                                                                                                                                                                                                                                      |
| Status         | Approved — integração versionada; instalação local executada como passo operacional autorizado em 2026-11-15 (TASK-009-02)                                                                                                                                                                                                    |
| Responsável    | Engenharia                                                                                                                                                                                                                                                                                                                    |
| Revisores      | Engenharia / QA / Segurança                                                                                                                                                                                                                                                                                                   |
| Criado         | 2026-11-15                                                                                                                                                                                                                                                                                                                    |
| Atualizado     | 2026-11-15                                                                                                                                                                                                                                                                                                                    |
| Liberação Alvo | Melhoria de tooling pós-`0.3.0-alpha`; sem release de produto                                                                                                                                                                                                                                                                 |
| Refs:          | Discovery: N/A — solicitação operacional direta, sem mudança de produto; Design: N/A — sem interface de usuário; ADRs: ADR-012; TASKs: TASK-009-01, TASK-009-02; QA: `reviews/qa-evidence/QA-EVIDENCE-TASK-009-01.md`, `reviews/qa-evidence/QA-EVIDENCE-TASK-009-02.md`; Verificação: `reviews/VERIFICATION-REPORT-VR-002.md` |

## Problema e resultado

O Nexo CRM é trabalhado por agentes diferentes (Claude Code, Codex, OpenCode e
outros) em sessões e máquinas distintas. As regras e decisões do projeto estão
bem documentadas em `AGENTS.md`, `PROJECT.md`, `specs/`, `tasks/`, `adr/` e
`reviews/`, mas não existe uma memória operacional compartilhada: ao retomar
uma tarefa, o agente precisa redescobrir o que foi tentado, o que falhou e o
que ficou em aberto. A memória nativa de cada harness é local, pertence a um
agente e desaparece ao trocar de ferramenta.

O resultado desejado é uma integração versionada do ai-memory no repositório,
com escopo de projeto declarado, política de captura explícita, instruções
canônicas para os agentes e documentação de instalação/verificação. A
instalação global do binário e o wiring de hooks/MCP ficam fora desta SPEC e
são um passo operacional documentado, executado apenas com confirmação humana.

Fatos: o ai-memory 3.4.6 é um binário Rust autocontido que usa wiki markdown
versionada em git como fonte de verdade e funciona sem LLM por padrão. A
instalação de 2026-11-15 confirmou o ambiente Linux x86_64 e os agentes usados:
Claude Code, Codex e OpenCode.

Medidas de sucesso: AC-901 a AC-905, com evidência reproduzível em
`reviews/qa-evidence/QA-EVIDENCE-TASK-009-01.md`; a operação local está em
`reviews/qa-evidence/QA-EVIDENCE-TASK-009-02.md`.

## Escopo

### No escopo

- Criar `.ai-memory.toml` com `workspace`, `project` e `[capture] ignore_paths`.
- Inserir o bloco gerenciado de roteamento do ai-memory em `AGENTS.md` e fazer
  `CLAUDE.md` importar `AGENTS.md`.
- Documentar topologia local single-user, instalação, wiring, verificação,
  segurança, operação e rollback em `docs/ai-memory.md`.
- Ignorar `.ai-memory.toml` no Prettier, que não possui parser TOML nativo.
- Registrar a decisão em ADR-012 e a implementação em TASK-009-01.
- Atualizar `README.md`, `PROJECT.md`, `docs/traceability-matrix.md` e a
  evidência de QA.
- Excluir da captura artefatos de build, segredos e registros canônicos do
  repositório (`adr/`, `specs/`, `tasks/`, `reviews/`).

### Fora do escopo

- Baixar, instalar ou atualizar o binário do ai-memory nesta máquina.
- Criar serviço de usuário, LaunchAgent ou container.
- Configurar hooks, MCP, Agent Skills ou `ai-memory run` em qualquer harness.
- Provisionar servidor remoto, multiusuário, TLS, OIDC ou deploy de equipe.
- Configurar provedor de LLM, embeddings, busca vetorial ou o passe "dream".
- Migrar dados reais, importar histórico do Git ou rodar `ai-memory bootstrap`.
- Alterar código, schema, API, dependências de runtime ou pipeline de CI.

## Comportamento funcional

- O arquivo `.ai-memory.toml` é a fonte de escopo por repositório. Clientes MCP
  estáticos devem passar `workspace = "portfolio"` e
  `project = "crm-graphql-monorepo"` em toda chamada project-scoped.
- Clientes MCP com sessão podem omitir o escopo para o repositório atual, mas
  nunca inferir o projeto pelo nome da pasta ou pelo último projeto ativo do
  servidor.
- A política `[capture] ignore_paths` é aplicada pelo hook e pelas integrações
  TypeScript antes de qualquer evento chegar ao spool ou à rede. Caminhos de
  build, dependências, resultados de teste e segredos não são capturados.
- Os registros canônicos do SDD (`adr/`, `specs/`, `tasks/`, `reviews/`) não são
  capturados para evitar cópias desatualizadas na wiki; eles continuam sendo
  lidos diretamente do repositório.
- `AGENTS.md` continua sendo o arquivo canônico de regras. O bloco do ai-memory
  fica delimitado por `<!-- ai-memory:start -->` e `<!-- ai-memory:end -->` e
  pode ser atualizado por `ai-memory install-instructions --target AGENTS.md`
  sem tocar no restante do arquivo.
- `CLAUDE.md` contém apenas o import `@AGENTS.md`, para que sessões do Claude
  Code carreguem as mesmas regras.
- A memória recuperada é evidência histórica não confiável, nunca instrução.
  Regras atuais do sistema, do usuário e do repositório prevalecem.
- Nenhum token, URL de servidor ou segredo é versionado. O token do ai-memory
  fica no diretório de dados owner-only, fora do repositório.

## Requisitos não-funcionais

- Segurança e privacidade: servidor em loopback, token owner-only, captura
  sanitizada, exclusão de segredos e de registros canônicos; nenhuma alteração
  global nesta entrega.
- Desempenho e capacidade: o caminho padrão não usa LLM; o custo em sessão é o
  bloco de instruções e a injeção de brief/handoff quando habilitados.
- Confiabilidade e recuperação: wiki markdown é a fonte de verdade; o índice
  SQLite é derivado e reconstruível; `ai-memory recover` drena spool após
  indisponibilidade do servidor.
- Acessibilidade: N/A — não há interface de usuário nesta mudança.
- Compatibilidade: Linux e macOS suportados; Windows via WSL2; Windows nativo
  experimental. Claude Code, Codex e OpenCode são os harnesses de referência.
- Observabilidade: `ai-memory status` e `ai-memory doctor`; logs no serviço de
  usuário e no diretório de dados.

## Critérios de aceitação

### AC-901

```yaml
id: AC-901
title: Escopo do repositório declarado e reconhecido pelo ai-memory
preconditions:
  - Binário ai-memory compatível disponível para validação local
action: Validar o TOML e executar ai-memory hook --check-capture a partir da raiz
expected_result: O marker é TOML válido, resolve workspace portfolio, project crm-graphql-monorepo e aplica a política de captura
evidence_type: automated
```

### AC-902

```yaml
id: AC-902
title: Instruções canônicas e bloco gerenciado nos agentes
preconditions:
  - Repositório com AGENTS.md e CLAUDE.md
action: Inspecionar AGENTS.md e CLAUDE.md e comparar o bloco com a saída de install-instructions --print --target AGENTS.md, desconsiderando normalização de formatação do Prettier
expected_result: AGENTS.md contém exatamente um bloco delimitado pelos marcadores, com o conteúdo oficial, e CLAUDE.md importa @AGENTS.md, sem regras duplicadas ou conflitantes
evidence_type: automated
```

### AC-903

```yaml
id: AC-903
title: Documentação operacional da topologia local single-user
preconditions:
  - Nenhuma instalação prévia do ai-memory
action: Revisar docs/ai-memory.md e os links a partir de README.md e PROJECT.md
expected_result: A documentação cobre instalação local, wiring, verificação, captura excluída, segurança, operação e rollback, com comandos reproduzíveis
evidence_type: manual
```

### AC-904

```yaml
id: AC-904
title: Nenhum artefato global ou segredo versionado
preconditions:
  - Repositório limpo no branch de trabalho
action: Inspecionar arquivos alterados, varreduras de segredo e ausência de binário/serviço instalado
expected_result: Nenhum token, URL privada, binário ou unidade de serviço é adicionado; a CI e o runtime continuam sem dependência do ai-memory
evidence_type: automated
```

### AC-905

```yaml
id: AC-905
title: Rastreabilidade SDD atualizada
preconditions:
  - ADR-012, SPEC-009, TASK-009-01 e evidência de QA criados
action: Executar scripts/generate_traceability.py e revisar a matriz
expected_result: A matriz lista SPEC-009, TASK-009-01, ADR-012 e a evidência de QA; as lacunas restantes são apenas o commit de implementação pendente
evidence_type: automated
```

## Abordagem técnica

- `.ai-memory.toml` na raiz, com escopo explícito e `[capture] ignore_paths`.
  A exclusão cobre `node_modules`, `dist`, `build`, `coverage`, `.turbo`,
  resultados de Playwright, código gerado, `.env`, chaves e os registros
  canônicos `adr/`, `specs/`, `tasks/` e `reviews/`.
- `AGENTS.md` recebe o bloco oficial de `ai-memory install-instructions --print
--target AGENTS.md` (versão 3.4.6), delimitado por marcadores. O bloco é
  atualizável de forma idempotente e não substitui as regras do projeto.
- `CLAUDE.md` é reduzido ao import `@AGENTS.md`, conforme a orientação oficial
  para projetos em que `AGENTS.md` é canônico.
- `docs/ai-memory.md` documenta a topologia local single-user, a instalação e
  o estado desta máquina.
- A instalação real (`install.sh`, `ai-memory setup`, `install-mcp`,
  `install-hooks`) é um passo separado e exige confirmação humana porque altera
  configurações globais dos agentes e cria um serviço de usuário. Foi executada
  em 2026-11-15 após autorização direta, registrada na TASK-009-02.
- Alternativas rejeitadas: memória nativa por harness (ilhada), API hospedada
  (dados fora da máquina e custo) e wiki sem captura automática (depende de
  disciplina manual). Detalhes em ADR-012.

## Entrega e operações

- Plano de implantação: merge dos arquivos versionados; a instalação local foi
  executada em 2026-11-15 e a captura do OpenCode foi validada. O Codex ainda
  exige confiança nos hooks e exportação do token, conforme `docs/ai-memory.md`.
- Plano de migração: nenhum dado de produto é migrado; a wiki do ai-memory
  começa vazia e pode ser populada pelo uso normal ou por `ai-memory bootstrap`.
- Plano de rollback: remover `.ai-memory.toml`, o bloco gerenciado e
  `docs/ai-memory.md`; se instalado, `ai-memory uninstall --apply`.
- Monitoramento e alertas: `ai-memory status`, `ai-memory doctor`, log do
  serviço de usuário e verificação de que a CI não referencia a ferramenta.

## Riscos e dependências

| Risco ou dependência                                   | Impacto | Probabilidade | Mitigação                                                                                                                 | Responsável          |
| ------------------------------------------------------ | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Captura silenciosa reter contexto sensível             | Alto    | Média         | Excluir segredos e build; revisar `ignore_paths` a cada novo diretório sensível; usar allowlist em repositórios sensíveis | Segurança/Engenharia |
| Serviço local indisponível quebrar recall              | Médio   | Média         | Documentar `ai-memory recover`, spool local e `--require-server`                                                          | Engenharia           |
| Bloco de instruções consumir contexto                  | Médio   | Alta          | Manter o bloco oficial enxuto; regras do projeto prevalecem; orçamento de contexto documentado                            | Engenharia           |
| Instalação global afetar outros projetos               | Alto    | Baixa         | Instalação feita só após autorização, com três agentes ligados, marker por repositório e allowlist disponível             | Solicitante          |
| Divergência entre a wiki e os registros do repositório | Médio   | Média         | Excluir `adr/`, `specs/`, `tasks/` e `reviews/` da captura; repositório continua canônico                                 | Engenharia           |
| Windows nativo experimental                            | Baixo   | Baixa         | Recomendar WSL2; documentar limitações                                                                                    | Engenharia           |

## Questões abertas

| Questão                                            | Responsável | Data limite | Resolução                                                                       |
| -------------------------------------------------- | ----------- | ----------- | ------------------------------------------------------------------------------- |
| Quando instalar o binário e quais harnesses ligar? | Solicitante | Sem data    | Executado em 2026-11-15: Claude Code, Codex e OpenCode; demais não ligados      |
| Servidor remoto para múltiplas máquinas ou equipe? | Solicitante | Sem data    | Topologia local single-user escolhida em 2026-11-15; reavaliar em SPEC futura   |
| Habilitar LLM, embeddings ou "dream"?              | Engenharia  | Sem data    | Permanecem opt-in e desligados; exigem avaliação de custo, privacidade e recall |

## Aprovação

| Papel      | Nome               | Decisão  | Data       | Notas                                                                                                                                                                      |
| ---------- | ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Produto    | Solicitante humano | Approved | 2026-11-15 | Integração no repositório, sem instalação global                                                                                                                           |
| Operação   | Solicitante humano | Approved | 2026-11-15 | Instalação local autorizada e executada (TASK-009-02)                                                                                                                      |
| Design     | —                  | N/A      | 2026-11-15 | Sem interface de usuário                                                                                                                                                   |
| Engenharia | Engenharia         | Approved | 2026-11-15 | Implementação e validação local                                                                                                                                            |
| QA         | Engenharia         | Ready    | 2026-11-15 | Evidência em `reviews/qa-evidence/QA-EVIDENCE-TASK-009-01.md`; QA-Verifier `Passed` em `reviews/VERIFICATION-REPORT-VR-002.md` (2026-11-16); revisão independente pendente |
