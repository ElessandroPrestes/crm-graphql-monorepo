# Governança e estrutura (Governance and structure)

## Metadados

| Campo | Valor |
|---|---|
| Domínio | Governança do framework e organização do repositório |
| Responsável | Documentação |
| Revisado | 2026-09-15 |
| Aplicabilidade | Trabalho de arquitetura, governança e adoção |
| Fonte da verdade | Índice de contexto do `PROJECT.md` e documentos normativos vinculados |

## Responsabilidades do repositório

| Caminho | Responsabilidade |
|---|---|
| `README.md` | Visão geral em português e ponto de entrada para adoção |
| `UNIVERSAL_SDD_FRAMEWORK.md` | Definição principal do framework agnóstico de linguagem |
| `AGENTS.md` e arquivos de entrada de IA | Protocolo compartilhado de inicialização de sessão e escopo |
| `agents/` e `workflows/` | Contratos de papéis (roles) e fluxo de entrega de ponta a ponta |
| `standards/` | Práticas operacionais normativas e portões (gates) |
| `templates/` | Artefatos reutilizáveis e versionados |
| `specs/`, `tasks/`, `reviews/`, `adr/` | Registros de mudanças, decisões e evidências |
| `knowledge/`, `profiles/`, `docs/` | Contexto reutilizável, adaptações e orientações de referência |

## Arquitetura modular

O documento principal define a governança universal; arquivos de papéis (roles) definem a propriedade; padrões definem regras normativas; fluxos de trabalho definem a sequência e os portões (gates); e templates capturam decisões e evidências. Os projetos que adotam o framework podem estender esses documentos através de perfis (profiles), mas exceções aos portões de qualidade básicos (baseline quality gates) exigem aprovação.
