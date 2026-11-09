# PROJECT: CRM GraphQL Monorepo

## Metadados

| Campo | Valor |
|---|---|
| Nome do Projeto | CRM GraphQL Monorepo (`crm-graphql-monorepo`) |
| Responsável | A definir (produto, engenharia e arquitetura) |
| Estado | Discovery / Bootstrap — nenhuma funcionalidade implementada |
| Versão ou release | `0.1.0-alpha` (adoção inicial do Universal SDD) |
| Última revisão | 2026-11-09 |
| Revisores | Pendente de validação humana |
| Framework de Governança | Universal SDD (Spec-Driven Development) |

> Este documento registra o estado **real** do repositório. As seções marcadas
> como "a definir" são lacunas de discovery, não requisitos aprovados.

---

## 1. Visão geral e domínio

- **Problema e resultado principal**: construir um CRM (Customer Relationship
  Management) organizado como monorepo. O problema de negócio, o público e o
  resultado esperado ainda não foram descobertos nem aprovados.
- **Usuários e partes interessadas**: a definir no discovery de produto/UX.
- **Termos importantes do domínio**: "CRM", "monorepo" e "GraphQL" aparecem no
  nome do repositório; o significado de cada um no escopo do produto ainda não
  foi validado. Nenhuma entidade de domínio (lead, conta, oportunidade, funil,
  atividade etc.) deve ser tratada como aprovada antes de uma SPEC.
- **Limites do sistema**: a definir. Não há integrações, contratos ou fronteiras
  arquiteturais acordados.

## 2. Arquitetura

- **Estilo e componentes**: não definido. Requer discovery e ADR antes de
  qualquer implementação.
- **Fluxos de dados**: não definidos.
- **Integrações e contratos**: nenhum contrato GraphQL ou integração definidos.
- **ADRs vigentes**: nenhum. Consulte `adr/` e use `templates/adr.md`.

## 3. Stack e dependências

| Tecnologia/dependência | Versão | Finalidade | Fonte canônica |
|---|---|---|---|
| A definir | — | Stack de aplicação, runtime e banco de dados | Discovery pendente |

Nenhuma dependência de aplicação foi instalada. O repositório contém apenas a
estrutura documental do Universal SDD e um script auxiliar em Python 3.

## 4. Estrutura do repositório

| Caminho | Responsabilidade |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `COPILOT.md` | Protocolo e pontos de entrada para pessoas e agentes de IA |
| `PROJECT.md` | Estado canônico atual do projeto (este arquivo) |
| `UNIVERSAL_SDD_FRAMEWORK.md` | Definição normativa do núcleo |
| `agents/` | Contratos dos papéis do ciclo SDD |
| `workflows/` | Fluxos oficiais de feature e verificação |
| `standards/` | Padrões normativos de código, API, dados, testes, segurança e UX |
| `templates/` | Modelos de SPEC, TASK, ADR, revisão, QA e conhecimento |
| `specs/` | Especificações aprovadas (atualmente vazio) |
| `tasks/` | Tarefas vinculadas a SPECs (atualmente vazio) |
| `reviews/` | Registros de revisão formal (atualmente vazio) |
| `adr/` | Registros de Decisão Arquitetural (atualmente vazio) |
| `knowledge/` | Base de conhecimento modular |
| `profiles/` | Perfis de adoção reutilizáveis |
| `docs/` | Guias, governança e matriz de rastreabilidade |
| `scripts/generate_traceability.py` | Geração da matriz de rastreabilidade |

## 5. Runtime e configuração

- **Pré-requisitos**: Python 3 (para `scripts/generate_traceability.py`) e Git.
- **Instalação**: não aplicável — não há aplicação a instalar.
- **Execução local**: não aplicável.
- **Build**: não aplicável.
- **Variáveis de ambiente**: nenhuma definida. Nunca registre valores secretos
  neste documento.

## 6. APIs, dados e integrações

- **Interfaces públicas**: nenhuma. A API GraphQL será definida por SPEC após
  discovery e arquitetura.
- **Persistência e migrações**: não definidas.
- **Serviços externos**: nenhum.
- **Compatibilidade e versionamento**: a definir.

## 7. Segurança e privacidade

- **Modelo de autenticação e autorização**: não definido.
- **Classificação e retenção de dados**: não definidas. Um CRM tende a lidar com
  dados pessoais; a classificação e a base legal (LGPD) devem ser tratadas em
  SPEC e ADR próprios antes de qualquer coleta.
- **Gestão de segredos**: nenhum segredo deve ser versionado. Uso previsto de
  variáveis de ambiente ou cofre a definir.
- **Threat model**: não elaborado.

## 8. Experiência, design e acessibilidade

- **Plataformas e usuários**: não definidos.
- **Design system e revisão**: não definidos. Interfaces exigem discovery,
  design aprovado e Design Review antes de implementação.
- **Baseline de acessibilidade**: alvo a declarar (recomendação do framework:
  WCAG 2.2 AA para web).
- **Compatibilidade, localização e conteúdo**: a definir.

## 9. Testes e quality gates

- **Comandos verificáveis**: `python3 scripts/generate_traceability.py` (matriz
  de rastreabilidade). Comandos de build, lint e teste ainda não existem.
- **Níveis e estratégia**: a definir em `standards/testing.md` quando houver
  stack escolhida.
- **Ambientes e dados**: nenhum ambiente configurado.
- **Gates, thresholds e responsáveis**: usar `standards/quality-gates.md` como
  referência e registrar adaptações aprovadas.

## 10. CI/CD, deploy e operação

- **Pipelines e artefatos**: nenhum pipeline configurado.
- **Ambientes e promoção**: nenhum ambiente configurado.
- **Migração e rollback**: não aplicáveis até existir aplicação.
- **Logs, métricas, tracing e alertas**: não definidos.

## 11. Padrões de desenvolvimento

- **Convenções de código**: `standards/coding.md` é a referência; a stack ainda
  não foi escolhida.
- **Branches, commits e revisão**: `standards/commits.md`. Commits de
  implementação usam `Spec-Ref:` e `Task-Ref:`.
- **Workflow e perfil SDD ativos**: `workflows/feature.md`; perfil específico de
  tecnologia ainda não definido em `profiles/`.

## 12. Limitações e riscos conhecidos

| Item | Impacto | Mitigação | Responsável |
|---|---|---|---|
| Escopo de produto não descoberto | Alto — risco de construir a solução errada | Concluir discovery e aprovar SPEC antes de codar | Produto / Engenharia |
| Stack e arquitetura indefinidas | Alto — decisões precoces viram dívida | Registrar ADRs antes da implementação | Arquitetura |
| Tratamento de dados pessoais (LGPD) não definido | Alto — risco legal e de segurança | Definir classificação, base legal e retenção em SPEC/ADR | Segurança / Produto |
| Repositório sem código nem testes | Médio — não há baseline verificável | Tratar o bootstrap como Fase 0 e validar a primeira mudança | Engenharia |

## 13. Tecnologias e abordagens intencionalmente não usadas

| Item | Motivo | Reavaliar quando |
|---|---|---|
| A definir | Nenhuma decisão técnica foi tomada ainda | Durante o discovery de arquitetura |
