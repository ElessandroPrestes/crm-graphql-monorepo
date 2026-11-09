# Changelog — CRM GraphQL Monorepo

Todas as alterações relevantes deste projeto serão documentadas neste arquivo.
O formato segue os princípios de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e o versionamento adotará [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.1.0-alpha] - 2026-11-09

### Adicionado

- **Adoção do Universal SDD (USF)**:
  - Estrutura de governança: `agents/`, `workflows/`, `standards/`, `templates/`,
    `specs/`, `tasks/`, `reviews/`, `adr/`, `knowledge/`, `profiles/`, `docs/`.
  - Pontos de entrada de IA: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `COPILOT.md`.
  - Definição normativa do framework em `UNIVERSAL_SDD_FRAMEWORK.md`.
  - Estado canônico inicial em `PROJECT.md` (fase de discovery, sem código).
  - Roadmap estruturado em fases em `ROADMAP.md`.
  - Base de conhecimento inicial com índice de contexto.
  - Convenção e script de rastreabilidade (`scripts/generate_traceability.py`).
  - Documentos de governança comunitária: `CONTRIBUTING.md` e
    `CODE_OF_CONDUCT.md`.

### Observações

- Nenhuma funcionalidade de produto foi implementada. A primeira mudança deve
  aguardar discovery, arquitetura e uma SPEC aprovada.
