# Contexto de entrega e qualidade (Delivery and quality context)

## Metadados

| Campo | Valor |
|---|---|
| Domínio | Entrega, qualidade, segurança e operações |
| Responsável | Documentação |
| Revisado | 2026-09-15 |
| Aplicabilidade | UX, QA, lançamento e planejamento operacional |
| Fonte da verdade | Índice de contexto do `PROJECT.md` e padrões vinculados |

## Experiência e acessibilidade

Alterações voltadas ao usuário seguem o arquivo `workflows/feature.md`, incluindo descoberta, aprovação de design, especificação acessível, revisão de design e evidências rastreáveis.
O framework não possui interface gráfica ou implementação de tokens de design.

Os adotantes usam `standards/ux-ui.md`, `standards/design-system.md` e `standards/accessibility.md`. O framework recomenda WCAG 2.2 Nível AA como um padrão (default) para projetos da web; os adotantes declaram seu alvo, cobertura, ferramentas e matriz de tecnologia assistiva.

## Qualidade e segurança

`standards/testing.md` define a estratégia e `standards/quality-gates.md` define os controles de lançamento. Artefatos do framework são validados através da estrutura do repositório, referências internas, consistência do Markdown e revisão humana. Projetos de software adotantes definem comandos executáveis, ambientes, limiares (thresholds) quando úteis, cobertura de compatibilidade e armazenamento de evidências.

A documentação e as evidências não devem expor segredos, credenciais, dados pessoais ou dados inseguros de produção. Os adotantes definem seu padrão de segurança detalhado e o modelo de ameaças.

## Entrega e limitações

O framework não tem um processo de CI/CD ou implantação (deployment). Os consumidores o copiam ou adaptam e conectam portões de qualidade à sua automação.

- Perfis de tecnologia (Technology profiles) e inicialização (bootstrapping) automática estão planejados, não implementados.
- Ainda não há validação automatizada de links Markdown ou esquema (schema).
- A API da documentação pode mudar antes da versão 1.0.
