# Discovery — Fase 1: domínio, autenticação e GraphQL

## Metadados

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Status      | Draft — aguardando validação humana                           |
| Responsável | Descoberta de produto/UX e engenharia                         |
| Criado      | 2026-11-09                                                    |
| Atualizado  | 2026-11-09                                                    |
| SPEC alvo   | SPEC-002                                                      |
| Fontes      | `PROJECT.md`, `ROADMAP.md`, `knowledge/modules/crm-domain.md` |

## Fatos conhecidos

- O produto é um mini CRM de demonstração para times pequenos de vendas.
- O domínio previsto inclui contatos, empresas, negócios, atividades,
  conversas, mensagens e usuários.
- Os papéis previstos são `ADMIN` e `SELLER`.
- A Fase 1 cobre persistência, autenticação, autorização, CRUD de contatos e
  empresas, GraphQL, DataLoader e limites de consulta.
- Negócios, atividades e inbox de WhatsApp pertencem às Fases 2 e 3.
- O repositório é público ou de portfólio; não há intenção de armazenar dados
  pessoais reais nesta fase.

## Usuários e trabalhos

| Grupo    | Objetivo principal                                       | Necessidade mínima                            |
| -------- | -------------------------------------------------------- | --------------------------------------------- |
| `SELLER` | Organizar seus contatos e empresas e consultá-los rápido | Ver e editar apenas os registros que possui   |
| `ADMIN`  | Administrar a base e apoiar o time                       | Ver e editar todos os registros               |
| Demo/QA  | Validar o fluxo ponta a ponta sem dados reais            | Seed fictício, credenciais de desenvolvimento |

## Escopo mínimo proposto para a Fase 1

1. Modelo Prisma com `User`, `RefreshToken`, `Company` e `Contact`.
2. Migrations e seed fictício com um `ADMIN`, dois `SELLER`, empresas e
   contatos.
3. Autenticação REST: `POST /auth/login`, `POST /auth/refresh`,
   `POST /auth/logout` e `GET /auth/me`.
4. Access token JWT curto; refresh token opaco, rotativo, armazenado como hash
   e enviado em cookie `HttpOnly`.
5. RBAC por propriedade: `ADMIN` acessa tudo; `SELLER` acessa apenas registros
   com `ownerId` próprio.
6. GraphQL code-first para contatos e empresas, com queries, mutations e
   paginação por cursor.
7. DataLoader para a relação `Contact.company`, com teste que limita o número
   de queries.
8. Geração de schema e types, verificação de drift e limites de profundidade,
   complexidade e aliases.
9. Testes unitários e de integração com PostgreSQL real via Testcontainers.

## Hipóteses a validar

| Hipótese                                                                       | Impacto se rejeitada                           |
| ------------------------------------------------------------------------------ | ---------------------------------------------- |
| Empresas e contatos pertencem a um `ownerId`; não há compartilhamento por time | O modelo de RBAC e as queries mudam            |
| `Company` é globalmente única por `domain` quando informado                    | Regras de unicidade e seed mudam               |
| `Contact.email` é único por `ownerId`, não global                              | Índices e mensagens de erro mudam              |
| O status do contato fica para a Fase 2                                         | O schema e a UI futura podem precisar de campo |
| O refresh token fica em cookie e o access token em memória no cliente          | O fluxo de auth e CSRF muda                    |
| A demo não armazena dados pessoais reais                                       | Requisitos de LGPD e retenção mudam            |

## Medidas de sucesso

- Um `SELLER` autenticado consegue criar, listar, editar e excluir seus
  contatos e empresas, sem enxergar registros de outro `SELLER`.
- Um `ADMIN` consegue consultar e administrar todos os registros.
- Consultas GraphQL aninhadas não geram N+1; o teste de contagem de queries
  comprova o uso do DataLoader.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam com testes
  de integração aplicáveis.
- O schema GraphQL gerado não apresenta drift em relação ao código.

## Fora de escopo

- Negócios, funil, atividades, dashboard e subscriptions.
- Conversas, mensagens, WhatsApp, RabbitMQ e worker consumidor.
- Interface web de produto, i18n completo e temas.
- Uploads, pagamentos, persisted queries e benchmark k6.

## Riscos e questões abertas

| Questão ou risco                                      | Proposta para validação                                                    | Responsável      |
| ----------------------------------------------------- | -------------------------------------------------------------------------- | ---------------- |
| Empresas são por dono ou compartilhadas pelo time?    | Adotar `ownerId` em `Company` e `Contact` para simplificar                 | Produto          |
| Qual a política de senha e os parâmetros de argon2id? | Mínimo 12 caracteres; argon2id com baseline OWASP                          | Segurança        |
| O refresh token precisa de CSRF token explícito?      | `SameSite=Strict`, `HttpOnly`, `Secure` em produção e checagem de `Origin` | Segurança        |
| Qual a base legal e retenção de dados?                | Demo com dados fictícios; sem dados reais e reset documentado              | Produto/Jurídico |
| Testcontainers será usado na CI?                      | Sim, com PostgreSQL efêmero; fallback documentado se Docker faltar         | Engenharia/QA    |
| O schema gerado será commitado?                       | Sim, em `packages/graphql-schema`; drift check na CI                       | Engenharia       |

## Recomendação

Prosseguir para a SPEC-002 com as hipóteses acima explicitamente marcadas.
Nenhuma implementação deve começar antes da aprovação humana da SPEC-002 e da
TASK-002-01.
