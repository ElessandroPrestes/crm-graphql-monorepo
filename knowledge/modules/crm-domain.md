# Domínio do produto — CRM (KB-001)

## Metadados

| Campo | Valor |
|---|---|
| Domínio | Produto, usuários e regras de negócio |
| Responsável | Produto (a designar) |
| Revisado em | 2026-11-09 |
| Aplicabilidade | Discovery de produto/UX e especificação de funcionalidades do CRM |
| Fonte da verdade | `PROJECT.md` e SPECs aprovadas |

## Estado atual

Discovery não iniciado. Este módulo registra apenas o que é observável e as
lacunas a resolver. Nenhuma entidade, regra ou requisito abaixo está aprovado.

## Fatos observáveis

- O repositório se chama `crm-graphql-monorepo`.
- Não há código, schema GraphQL, banco de dados, testes ou documentação de
  produto anteriores no repositório.

## Hipóteses a validar (não aprovadas)

As hipóteses abaixo servem apenas para orientar o discovery. Elas não autorizam
implementação e devem ser confirmadas, refinadas ou descartadas por uma SPEC.

- Um CRM normalmente organiza contas, contatos, leads, oportunidades e
  atividades.
- Um monorepo normalmente agrupa aplicações e pacotes compartilhados.
- Uma API GraphQL normalmente expõe um schema tipado e consultas/mutações.

## Perguntas em aberto

1. Qual problema de negócio o CRM resolve e para qual segmento?
2. Quem são os usuários (perfis, permissões, multiusuário/multitenancy)?
3. Quais entidades e ciclos de vida compõem o domínio?
4. Quais integrações são necessárias (e-mail, calendário, telefonia, marketing)?
5. Quais requisitos de privacidade e retenção (LGPD) se aplicam?
6. Quais métricas definem sucesso do produto?

## Fronteiras

A definir após o discovery. Não presuma escopo, entidades ou integrações.
