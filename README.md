# CRM GraphQL Monorepo

> **Status:** Discovery / Bootstrap — nenhuma funcionalidade implementada.
> **Governança:** Universal SDD (Spec-Driven Development).
> **Repositório:** `crm-graphql-monorepo`.

---

## Sobre o projeto

Repositório destinado a um CRM (Customer Relationship Management) organizado como
monorepo e exposto por uma API GraphQL. O escopo de produto, a arquitetura e a
stack ainda não foram aprovados: este repositório encontra-se na fase de
adoção do Universal SDD e de discovery.

Os fatos, inferências e lacunas conhecidos estão registrados em
[`PROJECT.md`](PROJECT.md). Nenhuma decisão de produto ou arquitetura deve ser
tratada como aprovada antes de uma SPEC formal.

---

## Governança Universal SDD

Este projeto adota o Universal SDD. As três fontes complementares de verdade são:

- a **SPEC aprovada** define o comportamento desejado de uma mudança;
- o **PROJECT.md** registra o estado canônico do projeto;
- o **código e as evidências de QA** demonstram o comportamento implementado.

Divergências entre essas fontes são tratadas como defeito, mudança de escopo ou
dívida documental — nunca resolvidas silenciosamente.

### Fluxo oficial

```text
Ideia
   ↓
Discovery de Produto e UX
   ↓
Arquitetura
   ↓
UX/UI Design
   ↓
Aprovação do Design
   ↓
SPEC técnica e funcional
   ↓
Aprovação Humana
   ↓
TASK
   ↓
Implementação
   ↓
QA automatizado e manual
   ↓
Design Review e Code Review
   ↓
Refatoração (se necessário)
   ↓
Documentação
   ↓
Release
```

Consulte [`workflows/feature.md`](workflows/feature.md) e
[`workflows/verification.md`](workflows/verification.md).

---

## Estrutura do repositório

```text
crm-graphql-monorepo/
├── AGENTS.md                  # Protocolo comum para pessoas e agentes de IA
├── CLAUDE.md                  # Entrada para Claude
├── GEMINI.md                  # Entrada para Gemini
├── COPILOT.md                 # Entrada para GitHub Copilot
├── PROJECT.md                 # Estado canônico atual do projeto
├── UNIVERSAL_SDD_FRAMEWORK.md # Definição normativa do núcleo
├── README.md                  # Este arquivo
├── ROADMAP.md                 # Direção e fases planejadas
├── CHANGELOG.md               # Histórico de versões
├── agents/                    # Contratos dos papéis do ciclo SDD
├── workflows/                 # Fluxos oficiais (feature, verification)
├── profiles/                  # Perfis de adoção reutilizáveis
├── knowledge/                 # Base de conhecimento modular
├── standards/                 # Padrões normativos (UX, testes, segurança, etc.)
├── templates/                 # Artefatos executáveis de SPEC, TASK, ADR, review
├── specs/                     # Especificações aprovadas
├── tasks/                     # Tarefas vinculadas a SPECs
├── reviews/                   # Registros de revisão formal
├── adr/                       # Registros de Decisão Arquitetural
├── docs/                      # Guias, governança e matriz de rastreabilidade
└── scripts/                   # Automação de rastreabilidade
```

---

## Primeiros passos

1. Leia [`PROJECT.md`](PROJECT.md) e [`AGENTS.md`](AGENTS.md).
2. Execute o discovery do produto e da arquitetura antes de qualquer implementação.
3. Registre uma SPEC a partir de [`templates/spec.md`](templates/spec.md).
4. Obtenha aprovação humana explícita.
5. Divida o escopo em TASKs com [`templates/task.md`](templates/task.md).
6. Implemente apenas as TASKs aprovadas.
7. Registre evidências, revisão e documentação final.

Checklist completo em [`docs/getting-started.md`](docs/getting-started.md).

---

## Rastreabilidade

Toda implementação vinculada a uma TASK aprovada registra no commit:

```text
Spec-Ref: SPEC-NNN
Task-Ref: TASK-NNN-XX
```

Gere a matriz a partir da raiz do repositório:

```sh
python3 scripts/generate_traceability.py
```

Consulte [`docs/ids-and-traceability.md`](docs/ids-and-traceability.md).

---

## Licença

[MIT License](LICENSE).
