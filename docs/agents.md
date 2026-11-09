# Agentes e responsabilidades

Agente é um papel com missão, entradas, saídas e limites. Pode ser desempenhado
por uma pessoa, IA ou colaboração entre ambos. O responsável deve ser
identificável nos artefatos produzidos.

## Catálogo

| Papel | Contrato | Saída principal |
|---|---|---|
| Discovery | `agents/discovery.md` | Inventário factual e riscos |
| UX Research | `agents/ux-research.md` | UX brief e evidências |
| Arquitetura | `agents/architecture.md` | Proposta técnica e ADRs |
| UX/UI Design | `agents/ux-ui-design.md` | Fluxo e especificação de design |
| SPEC | `agents/spec.md` | SPEC testável para aprovação |
| TASK | `agents/task.md` | Plano executável e rastreável |
| Implementação | `agents/implementation.md` | Código e testes no escopo |
| Testing | `agents/testing.md` | Testes e resultados reproduzíveis |
| QA | `agents/qa.md` | Plano, evidências e recomendação |
| Acessibilidade | `agents/accessibility-review.md` | Parecer de acessibilidade |
| Design Review | `agents/design-review.md` | Parecer de conformidade visual |
| Review | `agents/review.md` | Parecer técnico independente |
| Refactor | `agents/refactor.md` | Correções solicitadas pela revisão |
| Documentação | `agents/documentation.md` | Estado e documentação alinhados |
| Release | `agents/release.md` | Decisão e registro de release |

## Regras de atuação

- O papel ativo deve ser declarado quando não for óbvio.
- Trocas de papel devem preservar contexto e registrar entregáveis.
- O produtor não concede a própria aprovação quando independência for exigida.
- Um agente não assume autoridade de negócio, segurança ou release sem delegação.
- Falta de informação relevante produz pergunta ou risco registrado, não invenção.

O protocolo comum de entrada e encerramento está em `AGENTS.md`.
