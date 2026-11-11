# TASK: Implementar a Fase 1 — domínio, autenticação e GraphQL

## Metadados

| Campo        | Valor                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-002-01                                                                                                            |
| Status       | Done                                                                                                                   |
| Responsável  | Engenharia                                                                                                             |
| SPEC         | SPEC-002                                                                                                               |
| Critérios    | AC-101, AC-102, AC-103, AC-104, AC-105, AC-106, AC-107, AC-108, AC-109, AC-110, AC-111, AC-112, AC-113, AC-114, AC-115 |
| Dependências | SPEC-002 aprovada; discovery da Fase 1 aceito; ADR-004 aceito                                                          |

## Objetivo

Entregar persistência, autenticação, autorização e a primeira API GraphQL de
contatos e empresas, com isolamento entre usuários e evidências automatizadas.

## Escopo

### Incluído

- Modelo Prisma, migration inicial e seed fictício.
- Auth REST com argon2id, JWT curto e refresh rotativo.
- Guard GraphQL e RBAC por propriedade.
- CRUD GraphQL de contatos e empresas com paginação por cursor.
- DataLoader para `Contact.company`.
- Geração de schema, types e drift check.
- Limites de consulta e desativação de introspection em produção.
- Testes unitários e de integração com Testcontainers.
- Documentação e rastreabilidade.

### Não incluído

- Negócios, atividades, dashboard, subscriptions, WhatsApp e worker.
- UI web, i18n e temas.
- Uploads, pagamentos, persisted queries e k6.

## Abordagem e impacto

- Arquivos prováveis: `apps/api/prisma/**`, `apps/api/src/auth/**`,
  `apps/api/src/users/**`, `apps/api/src/companies/**`,
  `apps/api/src/contacts/**`, `apps/api/src/graphql/**`, `packages/graphql-schema/**`,
  `apps/api/test/**`, `docs/security.md`, `PROJECT.md`, `ROADMAP.md`.
- Contratos: rotas REST de auth e schema GraphQL de contatos/empresas.
- Dados: quatro modelos iniciais e índices de unicidade e paginação.
- Riscos: Prisma 7/Node 26, Testcontainers na CI, modelo de propriedade.
- ADRs e padrões: ADR-002, ADR-003, ADR-004, `standards/security.md`,
  `standards/coding.md`.

## Passos

- [x] Aprovar SPEC-002 e ADR-004.
- [x] Validar Prisma 7 com Node 26 e PostgreSQL 18.
- [x] Criar schema, migration e seed.
- [x] Implementar auth REST, cookie e rotação de refresh.
- [x] Implementar guard GraphQL e RBAC por propriedade.
- [x] Implementar CRUD de empresas e contatos com cursor.
- [x] Implementar DataLoader e teste de contagem de queries.
- [x] Gerar schema/types e configurar drift check.
- [x] Configurar limites de consulta e introspection.
- [x] Adicionar testes unitários e de integração.
- [x] Rodar lint, typecheck, test e build.
- [x] Atualizar documentação e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                                | Evidência esperada                       |
| -------------- | -------------------------------------------------------- | ---------------------------------------- |
| AC-101         | migration + seed + consulta ao banco                     | Dados fictícios e usuários presentes     |
| AC-102         | testes de login válido e inválido                        | 200 com cookie; 401 genérico             |
| AC-103         | query GraphQL sem token                                  | UNAUTHENTICATED                          |
| AC-104         | teste de refresh e reuso                                 | Rotação e revogação da família           |
| AC-105         | teste de logout                                          | Refresh revogado e cookie limpo          |
| AC-106         | testes negativos entre SELLER A e B                      | Negado sem vazar existência              |
| AC-107         | testes de CRUD de contatos                               | Validação e persistência                 |
| AC-108         | testes de CRUD de empresas                               | Validação e conflito de vínculo          |
| AC-109         | testes de paginação                                      | Ordem estável e limites respeitados      |
| AC-110         | teste de contagem de queries                             | Sem N+1                                  |
| AC-111         | geração de schema + typecheck                            | Sem drift                                |
| AC-112         | testes de profundidade/complexidade/aliases              | Rejeição e introspection off             |
| AC-113         | inspeção de hash e logs                                  | Sem senha/token em claro                 |
| AC-114         | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | Saída verde                              |
| AC-115         | revisão de docs e matriz                                 | Documentos e rastreabilidade atualizados |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade foram atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas: Prisma 7 com `User`, `RefreshToken`, `Company` e
  `Contact` (migration inicial e seed fictício); auth REST com argon2id, JWT
  curto e refresh opaco rotativo com detecção de reuso; guard GraphQL e RBAC
  por propriedade; CRUD GraphQL de empresas/contatos com cursor; DataLoader de
  empresa; schema code-first, codegen e drift check; limites de profundidade,
  complexidade e aliases; testes unitários e de integração com Testcontainers;
  documentação e rastreabilidade atualizadas.
- Evidências:
  - `pnpm --filter @nexo/api db:generate`: client Prisma 7.10.1 gerado.
  - `prisma migrate deploy` + `prisma db seed`: migration e seed aplicados no
    PostgreSQL 18.6 local e no container de teste.
  - `pnpm --filter @nexo/api test`: 4 arquivos, 11 testes aprovados.
  - `pnpm --filter @nexo/api test:integration`: 1 arquivo, 9 testes aprovados
    (auth, hash de senha/refresh, RBAC/IDOR, CRUD, paginação, limites e
    DataLoader funcional).
  - `pnpm lint`: sucesso com `--max-warnings 0`.
  - `pnpm typecheck`: 6 tarefas aprovadas.
  - `pnpm test`: 20 testes aprovados (shared 4, api 11, worker 2, web 3).
  - `pnpm build`: 4 tarefas aprovadas.
  - `pnpm format:check`: todos os arquivos formatados.
  - `pnpm --filter @nexo/api schema:check`: schema e types regenerados sem
    drift.
- Desvios e decisões de implementação:
  - A regra de complexidade é própria (custo por campo e multiplicador de
    `first`), porque `graphql-query-complexity` valida variáveis durante a fase
    de validação sem os valores da requisição e rejeitava mutations válidas.
  - `AppModule` é importado dinamicamente no helper de teste para que
    `DATABASE_URL` e segredos do Testcontainers sejam aplicados antes do
    `ConfigModule` cachear o ambiente.
  - Erros HTTP 404/409 são mapeados para `NOT_FOUND`/`CONFLICT` no
    `formatError`, pois o driver Apollo do NestJS só traduz 400/401/403/422.
  - `@types/express-serve-static-core` foi adicionado como dependência direta
    da API para a augmentação de `Request.user`; `@types/node` foi adicionado
    ao `graphql-schema` para o typecheck.
  - Construtores Nest usam `@Inject` explícito e a geração de schema roda sobre
    o build compilado, porque `tsx`/esbuild não emitem metadata de decorators;
    os testes de integração usam `unplugin-swc`.
- Limitações e pendências:
  - Sem rate limit de login/GraphQL, política de senha, verificação de e-mail,
    recuperação de senha ou limpeza automática de refresh expirado.
  - A configuração de introspection off em produção foi revisada, mas não
    exercitada por um app com `NODE_ENV=production` nos testes; o segredo de
    acesso default é rejeitado nesse ambiente.
  - O teste de DataLoader cobre batching unitário; contagem de queries da visão
    360° pertence à fase que criar essa visão.
  - Testcontainers exige Docker e adiciona ~30 s ao tempo de integração.
  - CI da Fase 1 ainda não foi executada no GitHub; validar em PR antes do
    merge.
  - O commit de implementação com `Spec-Ref`/`Task-Ref` está pendente de
    solicitação explícita; por isso a matriz registra a lacuna de commit.
