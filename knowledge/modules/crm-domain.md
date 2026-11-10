# Domínio do produto — CRM (KB-001)

## Metadados

| Campo            | Valor                                                             |
| ---------------- | ----------------------------------------------------------------- |
| Domínio          | Produto, usuários e regras de negócio                             |
| Responsável      | Produto (a designar)                                              |
| Revisado em      | 2026-11-09                                                        |
| Aplicabilidade   | Discovery de produto/UX e especificação de funcionalidades do CRM |
| Fonte da verdade | `PROJECT.md` e SPECs aprovadas                                    |

## Estado atual

Discovery de produto não iniciado. O briefing define o produto como um mini CRM
para times pequenos de vendas (contatos/empresas, funil, inbox de WhatsApp e
dashboard), mas entidades, regras e permissões ainda não foram aprovadas em
SPEC.

## Hipóteses a validar (não aprovadas)

- Um CRM organiza contas/empresas, contatos, leads/negócios, atividades e
  conversas.
- Um funil kanban exige etapas e regras de transição.
- Um inbox de WhatsApp exige idempotência por id externo e histórico por
  contato.

## Perguntas em aberto

1. Qual segmento e tamanho de time são o alvo do demo?
2. Quais entidades e ciclos de vida compõem o domínio mínimo?
3. Quais permissões separam ADMIN e SELLER na prática?
4. Quais requisitos de LGPD se aplicam a contatos e mensagens?
5. Quais métricas definem sucesso do produto?

## Fronteiras

A definir no discovery da Fase 1. Não presuma escopo, entidades ou integrações.
