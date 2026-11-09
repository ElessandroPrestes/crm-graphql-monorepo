# Baseline de arquitetura (KB-002)

## Metadados

| Campo | Valor |
|---|---|
| Domínio | Engenharia e arquitetura |
| Responsável | Arquitetura (a designar) |
| Revisado em | 2026-11-09 |
| Aplicabilidade | Escolha de stack, limites do monorepo, contrato GraphQL e operação |
| Fonte da verdade | `PROJECT.md`, ADRs aceitos e SPECs aprovadas |

## Estado atual

Arquitetura não definida. O repositório está na fase de bootstrap do Universal
SDD e não contém aplicação.

## Restrições conhecidas

- Deve permanecer um monorepo, conforme o nome e o propósito do repositório.
- A camada de API deve ser GraphQL (decisão de alto nível ainda não formalizada
  em ADR).
- Mudanças arquiteturais exigem ADR (`templates/adr.md`).
- Nenhum segredo, credencial ou dado de produção pode ser versionado.

## Decisões pendentes (exigem ADR)

1. Linguagem, runtime e gerenciador de pacotes do monorepo.
2. Ferramenta de orquestração do monorepo (workspaces, Turborepo, Nx etc.).
3. Framework do servidor GraphQL e estratégia de schema-first ou code-first.
4. Banco de dados, ORM/query builder e estratégia de migração.
5. Autenticação, autorização e autorização por campo no GraphQL.
6. Estratégia de build, CI/CD, ambientes e observabilidade.
7. Estratégia de testes por camada e quality gates concretos.

## Estrutura de pastas planejada

Não definida. Qualquer proposta de `apps/` e `packages/` deve ser registrada em
ADR aprovado antes de ser criada.

## Referências

- `standards/coding.md`, `standards/api.md`, `standards/database.md`,
  `standards/security.md`, `standards/performance.md`
- `templates/adr.md`, `workflows/feature.md`
