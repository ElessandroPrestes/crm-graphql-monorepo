# Domínio do produto — CRM (KB-001)

## Metadados

| Campo            | Valor                                                             |
| ---------------- | ----------------------------------------------------------------- |
| Domínio          | Produto, usuários e regras de negócio                             |
| Responsável      | Produto (a designar)                                              |
| Revisado em      | 2026-11-11                                                        |
| Aplicabilidade   | Discovery de produto/UX e especificação de funcionalidades do CRM |
| Fonte da verdade | `PROJECT.md` e SPECs aprovadas                                    |

## Estado atual

As Fases 1 e 2 foram implementadas e aprovadas em `SPEC-002` e `SPEC-003`. O
domínio atual cobre `User` (ADMIN/SELLER), `Company`, `Contact`, `RefreshToken`,
`Deal` e `Activity`, com RBAC por propriedade (`ownerId`): ADMIN vê tudo e
SELLER vê apenas os próprios registros. Negócios percorrem
`LEAD → QUALIFIED → PROPOSAL → WON|LOST`, com `WON`/`LOST` terminais,
concorrência otimista por `version` e timeline de atividades imutáveis.
Conversas e mensagens continuam fora do escopo e dependem da Fase 3.

## Hipóteses a validar (não aprovadas)

- Um CRM organiza contas/empresas, contatos, negócios, atividades e conversas.
- Um inbox de WhatsApp exige idempotência por id externo e histórico por
  contato. _(Hipótese da Fase 3.)_

## Perguntas em aberto

1. Qual segmento e tamanho de time são o alvo do demo?
2. Quais requisitos de LGPD se aplicam a dados reais de contatos e mensagens?
3. Quais métricas definem sucesso do produto além do dashboard atual?

## Fronteiras

As Fases 1 e 2 cobrem contatos, empresas, autenticação, autorização, negócios,
atividades e dashboard. Inbox de WhatsApp, worker, interface web e dados reais
ainda não foram especificados; não presuma escopo, entidades ou integrações.
