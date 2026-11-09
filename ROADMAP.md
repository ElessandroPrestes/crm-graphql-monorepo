# Roadmap — CRM GraphQL Monorepo

> **Framework de Governança**: Universal SDD (Spec-Driven Development)
> **Status vigente**: Fase 0 — Bootstrap e adoção do SDD concluídos.

O roadmap comunica direção, não compromisso de prazo. Nenhuma funcionalidade é
implementada antes da aprovação formal de sua respectiva SPEC e TASK.

---

## Fase 0 — Bootstrap e adoção do Universal SDD (concluída)

- [x] Estrutura do Universal SDD copiada para o repositório.
- [x] Pontos de entrada de IA configurados (`AGENTS.md`, `CLAUDE.md`,
      `GEMINI.md`, `COPILOT.md`).
- [x] Definição normativa do núcleo (`UNIVERSAL_SDD_FRAMEWORK.md`).
- [x] Estado canônico inicial registrado em [`PROJECT.md`](PROJECT.md).
- [x] Base de conhecimento inicial e índice de contexto.
- [x] Script e convenção de rastreabilidade (`scripts/generate_traceability.py`).

## Fase 1 — Discovery de produto e UX

- [ ] Definir problema, público, jobs-to-be-done e métricas de sucesso do CRM.
- [ ] Levantar entidades e fluxos de domínio (contas, contatos, leads,
      oportunidades, atividades) como hipóteses.
- [ ] Mapear jornadas e requisitos de interface.
- [ ] Identificar requisitos regulatórios e de privacidade (LGPD).
- [ ] Validar e aprovar o discovery.

## Fase 2 — Arquitetura

- [ ] Escolher stack e ferramentas do monorepo.
- [ ] Definir limites de pacotes/serviços e estratégia de build.
- [ ] Definir modelo de dados, persistência e migrações.
- [ ] Definir contrato GraphQL (schema, autorização por campo, versionamento).
- [ ] Definir autenticação, autorização e modelo de ameaças.
- [ ] Registrar ADRs das decisões estruturantes.

## Fase 3 — UX/UI e Design System

- [ ] Definir princípios de design e design tokens.
- [ ] Especificar componentes e estados.
- [ ] Validar acessibilidade e aprovar o design antes de codar interface.

## Fase 4 — Especificação e implementação

- [ ] Registrar a primeira SPEC aprovada.
- [ ] Decompor em TASKs rastreáveis.
- [ ] Implementar somente o escopo aprovado.
- [ ] Configurar comandos de build, lint e teste e os quality gates.

## Fase 5 — QA e release

- [ ] Executar testes automatizados e manuais.
- [ ] Executar auditoria de acessibilidade quando houver interface.
- [ ] Gerar a matriz de rastreabilidade (`make` ou
      `python3 scripts/generate_traceability.py`).
- [ ] Publicar a primeira release com notas em [`CHANGELOG.md`](CHANGELOG.md).

---

## Fora de compromisso atual

Datas, escolha de stack, provedor de nuvem e integrações específicas não estão
comprometidos sem uma decisão registrada em ADR ou SPEC aprovada.
