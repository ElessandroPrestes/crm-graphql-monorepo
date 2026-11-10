# TASK: Implementar a Fase 1 — domínio, autenticação e GraphQL

## Metadados

| Campo        | Valor                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-002-01                                                                                                            |
| Status       | Planned — bloqueada até aprovação da SPEC-002                                                                          |
| Responsável  | Engenharia                                                                                                             |
| SPEC         | SPEC-002                                                                                                               |
| Critérios    | AC-101, AC-102, AC-103, AC-104, AC-105, AC-106, AC-107, AC-108, AC-109, AC-110, AC-111, AC-112, AC-113, AC-114, AC-115 |
| Dependências | Aprovação de SPEC-002 e do discovery da Fase 1; ADR-004 aceito                                                         |

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

- [ ] Aprovar SPEC-002 e ADR-004.
- [ ] Validar Prisma 7 com Node 26 e PostgreSQL 18.
- [ ] Criar schema, migration e seed.
- [ ] Implementar auth REST, cookie e rotação de refresh.
- [ ] Implementar guard GraphQL e RBAC por propriedade.
- [ ] Implementar CRUD de empresas e contatos com cursor.
- [ ] Implementar DataLoader e teste de contagem de queries.
- [ ] Gerar schema/types e configurar drift check.
- [ ] Configurar limites de consulta e introspection.
- [ ] Adicionar testes unitários e de integração.
- [ ] Rodar lint, typecheck, test e build.
- [ ] Atualizar documentação e rastreabilidade.

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

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade foram atualizadas.
- [ ] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas: pendente de aprovação e implementação.
- Evidências: pendente.
- Pendências ou bloqueios: aprovação humana da SPEC-002 e do discovery.
