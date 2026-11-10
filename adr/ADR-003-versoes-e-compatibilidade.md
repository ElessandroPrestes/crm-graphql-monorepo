# ADR-003: Versões fixadas e compatibilidade de peers

## Status

Accepted

## Contexto

O projeto deve usar versões estáveis atuais, verificadas no registry, sem
presumir versões de memória. Algumas tags `latest` do ecossistema apontam para
pré-releases ou introduzem incompatibilidades de peer dependencies.

## Decisão

Fixar as seguintes versões na Fase 0:

| Item         | Versão      | Motivo                                                                                                |
| ------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| Node.js      | 26.13.0 LTS | Versão LTS vigente consultada em nodejs.org                                                           |
| pnpm         | 12.18.0     | Versão estável atual                                                                                  |
| Turborepo    | 2.11.10     | Versão estável atual                                                                                  |
| TypeScript   | 6.0.3       | `typescript-eslint` exige `<6.1.0`; NestJS GraphQL aceita 5.5 ou 6.0                                  |
| ESLint       | 9.39.5      | `eslint-plugin-jsx-a11y` 6.10.2 ainda declara peer `^9`; ESLint 10 fica para quando o plugin suportar |
| GraphQL      | 16.15.0     | `@apollo/server` 5.5.1 exige `^16.11.0`; não usar 17                                                  |
| NestJS       | 12.4.2      | Versão estável atual                                                                                  |
| Prisma       | 7.10.1      | A tag `latest` do pacote `prisma` aponta para 8.0.0-rc; usar a estável                                |
| React        | 19.3.1      | Versão estável atual                                                                                  |
| Vite         | 8.3.7       | Versão estável atual                                                                                  |
| Tailwind CSS | 4.3.5       | Versão estável atual                                                                                  |

As demais dependências seguem as versões estáveis consultadas no registry e
ficam registradas no `pnpm-lock.yaml`.

## Alternativas consideradas

- TypeScript 7.0.2: rejeitado porque quebra os peers de `typescript-eslint`
  (máximo `<6.1.0`) e não é aceito por `@nestjs/graphql` 14.
- GraphQL 17.1.0: rejeitado porque `@apollo/server` 5.5.1 declara peer
  `graphql ^16.11.0`.
- Prisma 8.0.0-rc.33: rejeitado por ser pré-release.

## Consequências

- A instalação é reproduzível e a CI detecta desvios com lockfile congelado.
- Atualizações exigem revisão de compatibilidade e atualização deste ADR.
- O Node.js local precisa ser 26 LTS (registrado em `.nvmrc`).
- NestJS 12 distribui pacotes ESM; `apps/api`, `apps/worker` e `packages/shared`
  usam `"type": "module"`, `module`/`moduleResolution` `Node16` e imports
  relativos com extensão `.js`.
- TypeScript 6 descontinuou `baseUrl` e `moduleResolution: Node10`; o projeto
  não usa `baseUrl` e adota `Node16`.

## Referências

- SPEC-001, AC-001 e AC-007.
