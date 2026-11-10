# ADR-001: Monorepo com pnpm workspaces e Turborepo

## Status

Accepted

## Contexto

O Nexo CRM contém três aplicações (API, worker, web) e pacotes compartilhados
(schema GraphQL, schemas zod, configuração de TypeScript e ESLint). É preciso
um workspace reproduzível, com instalação única e builds/testes orquestrados.

## Decisão

Adotar **pnpm workspaces** para resolução e instalação de dependências e
**Turborepo** para orquestração de tarefas (`build`, `dev`, `lint`, `typecheck`,
`test`). O lockfile do pnpm é obrigatório e a CI usa `--frozen-lockfile`.

## Alternativas consideradas

- **npm workspaces**: funcional, porém com resolução mais lenta e sem o rigor de
  isolamento de dependências do pnpm.
- **Yarn workspaces**: viável, mas o time padronizou pnpm.
- **Nx**: poderoso, porém com mais complexidade e conceitos do que o escopo
  atual exige.

## Consequências

- Uma única instalação atende todos os pacotes.
- A ordem de build respeita dependências internas via `dependsOn: ["^build"]`.
- O desenvolvedor precisa de Node.js 26 LTS e pnpm 12.
- Pacotes internos são referenciados com `workspace:*`.

## Referências

- SPEC-001, AC-001 e AC-007.
