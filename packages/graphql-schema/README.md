# @nexo/graphql-schema

Pacote com o schema GraphQL gerado pela API NestJS (code-first), os types
TypeScript gerados e o espaço para documents consumidos pelo front-end.

## Conteúdo

- `schema.graphql`: contrato gerado por `pnpm --filter @nexo/api schema:generate`.
- `src/types.ts`: types gerados pelo GraphQL Code Generator.
- `documents/`: queries e mutations do front-end (a partir da Fase 4).
- `codegen.ts`: configuração do codegen.

## Drift check

```sh
pnpm --filter @nexo/api schema:check
```

O comando regenera schema/types e falha se houver diferença não commitada.
