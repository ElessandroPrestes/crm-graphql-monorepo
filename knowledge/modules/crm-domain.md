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

A Fase 1 foi implementada e aprovada em `SPEC-002`. O domínio atual cobre
`User` (ADMIN/SELLER), `Company`, `Contact` e `RefreshToken`, com RBAC por
propriedade (`ownerId`): ADMIN vê tudo e SELLER vê apenas os próprios registros.
Negócios, atividades, conversas e mensagens continuam fora do escopo implementado
e dependem de SPEC das fases seguintes.

## Hipóteses a validar (não aprovadas)

- Um CRM organiza contas/empresas, contatos, leads/negócios, atividades e
  conversas.
- Um funil kanban exige etapas e regras de transição.
- Um inbox de WhatsApp exige idempotência por id externo e histórico por
  contato.

## Perguntas em aberto

1. Qual segmento e tamanho de time são o alvo do demo?
2. Quais ciclos de vida e regras de transição o funil de negócios exige?
3. Quais requisitos de LGPD se aplicam a dados reais de contatos e mensagens?
4. Quais métricas definem sucesso do produto?

## Fronteiras

A Fase 1 cobre contatos, empresas, autenticação e autorização. Negócios,
atividades, inbox de WhatsApp, dashboard e dados reais ainda não foram
especificados; não presuma escopo, entidades ou integrações.
