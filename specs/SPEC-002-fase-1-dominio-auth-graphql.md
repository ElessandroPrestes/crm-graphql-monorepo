# SPEC: Fase 1 — Domínio, autenticação e GraphQL

## Metadados

| Campo                      | Valor                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------- |
| ID                         | SPEC-002                                                                            |
| Status                     | Approved                                                                            |
| Responsável                | Engenharia                                                                          |
| Revisores                  | Produto / Engenharia / QA / Segurança                                               |
| Criado                     | 2026-11-09                                                                          |
| Atualizado                 | 2026-11-09                                                                          |
| Lançamento alvo            | Fase 1                                                                              |
| Briefing de UX relacionado | N/A — fase de API, sem interface de produto                                         |
| Especificação de design    | N/A — fase de API, sem interface de produto                                         |
| ADRs relacionadas          | ADR-002, ADR-003, ADR-004                                                           |
| Refs:                      | Discovery: `docs/discovery-fase-1.md`; Design: N/A; ADRs: ADR-002, ADR-003, ADR-004 |

## Problema e resultado

A Fase 0 entregou apenas esqueletos. Sem persistência, identidade e autorização,
não é possível implementar o domínio do CRM nem expor dados com segurança. A
Fase 1 deve entregar a base de dados, o fluxo de sessão e a primeira API GraphQL
de contatos e empresas, com isolamento entre usuários.

Resultado esperado: um `SELLER` autenticado consegue gerenciar seus contatos e
empresas; um `ADMIN` consegue ver e administrar todos; consultas GraphQL são
bateladas e limitadas; migrations, seed e testes de integração são
reprodutíveis. A implementação só começa após aprovação desta SPEC e da
TASK-002-01.

## Escopo

### No escopo

- Prisma 7 com PostgreSQL 18: `User`, `RefreshToken`, `Company` e `Contact`.
- Migration inicial e seed fictício, sem dados pessoais reais.
- Autenticação REST: login, refresh rotativo, logout e `me`.
- Access token JWT curto e refresh token opaco com hash e detecção de reuso.
- Argon2id para senhas.
- Guard de autenticação GraphQL e RBAC por propriedade.
- CRUD GraphQL de contatos e empresas com paginação por cursor.
- DataLoader para `Contact.company`.
- Geração de schema, types e verificação de drift.
- Limites de profundidade, complexidade e aliases; introspection desativada em
  produção.
- Testes unitários e de integração com PostgreSQL via Testcontainers.
- Atualização de `PROJECT.md`, `ROADMAP.md`, `docs/security.md` e
  rastreabilidade.

### Fora do escopo

- Negócios, funil, atividades e dashboard (Fase 2).
- Conversas, mensagens, WhatsApp, RabbitMQ e worker consumidor (Fase 3).
- Interface web de produto, i18n e temas (Fase 4).
- Uploads, pagamentos, persisted queries e k6 (Fase 5).
- Compartilhamento de registros por time, convites e recuperação de senha.

## Experiência do usuário

### Usuário principal e contexto

- Grupo: `SELLER` e `ADMIN` de um time pequeno de vendas.
- Objetivo: manter contatos e empresas atualizados e consultá-los via API.
- Contexto: clientes REST/GraphQL; a interface web só existe na Fase 4.

### Fluxo do usuário

1. O usuário faz login com e-mail e senha.
2. Recebe um access token de curta duração e um cookie de refresh.
3. Usa o access token no header `Authorization` para consultas e mutations.
4. Renova a sessão via refresh antes ou após o vencimento do access token.
5. Faz logout, que revoga o refresh e limpa o cookie.

### Estados de interface

N/A — não há interface nesta fase. Os estados observáveis são respostas HTTP e
erros GraphQL padronizados.

### Comportamento responsivo e compatibilidade

N/A para UI. A API deve funcionar em Node.js 26 e PostgreSQL 18.

### Sistema de design

N/A.

### Acessibilidade

N/A para UI. Mensagens de erro da API devem ser claras e não expor detalhes
internos.

### Conteúdo

Mensagens de erro genéricas para credenciais inválidas e recursos de outro
usuário; mensagens específicas de validação para campos.

### Análises e feedback

N/A — sem analytics nesta fase. Logs de autenticação e autorização são
registrados sem tokens, senhas ou dados pessoais.

## Comportamento funcional

- E-mail é único globalmente para `User`; senha nunca é retornada.
- `Company` e `Contact` têm `ownerId`; `SELLER` só acessa registros próprios.
- `ADMIN` acessa todos os registros.
- Excluir uma empresa com contatos vinculados exige decisão explícita: rejeitar
  com erro de validação, sem cascata silenciosa.
- `Contact.companyId` é opcional; quando informado, a empresa precisa existir e
  pertencer ao mesmo dono (ou o usuário é `ADMIN`).
- `Contact.email` é único por `ownerId`.
- `Company.domain` é único quando informado.
- Paginação por cursor: `first` padrão 20, máximo 100; ordenação estável por
  `createdAt DESC, id DESC`; cursor opaco inválido retorna erro de validação.
- Access token expirado retorna `UNAUTHENTICATED`; ausência de permissão retorna
  `FORBIDDEN` sem revelar a existência do recurso.
- Refresh token reutilizado revoga a família e retorna `401`.
- O sistema usa transações para rotação de refresh e para operações que
  envolvam contato e empresa.

## Requisitos não-funcionais

- Segurança e privacidade: argon2id, JWT com algoritmo fixo, refresh hasheado,
  cookie `HttpOnly`/`SameSite=Strict`/`Secure`, validação de `Origin`, logs
  redigidos, nenhum dado real no seed.
- Desempenho e capacidade: consultas de lista com cursor; DataLoader para
  relações; sem N+1 no caminho de contato com empresa.
- Confiabilidade e recuperação: migrations reversíveis por recriação em
  desenvolvimento; seed idempotente; transações em rotação de token.
- Acessibilidade: N/A para UI; erros de API claros.
- Compatibilidade: Node.js 26, PostgreSQL 18, Prisma 7, GraphQL 16.
- Observabilidade: logs estruturados de auth e autorização; contagem de queries
  em teste; erros sem vazamento de stack em produção.

## Critérios de aceitação

### AC-101: Modelo e seed

```gherkin
Dado o banco vazio
Quando as migrations e o seed forem executados
Então existem usuários ADMIN e SELLER, empresas e contatos fictícios
E nenhum dado pessoal real é inserido
```

Evidência necessária: automatizada.

### AC-102: Login

```gherkin
Dado um usuário ativo com senha válida
Quando POST /auth/login for chamado
Então a resposta é 200 com access token e cookie de refresh HttpOnly
E credenciais inválidas retornam 401 com mensagem genérica
```

Evidência necessária: automatizada.

### AC-103: Proteção do GraphQL

```gherkin
Dado que não há access token válido
Quando uma query protegida for executada
Então a resposta é UNAUTHENTICATED
E nenhum dado é retornado
```

Evidência necessária: automatizada.

### AC-104: Rotação e reuso de refresh

```gherkin
Dado um refresh token válido
Quando ele for usado uma vez
Então um novo refresh token é emitido e o anterior é invalidado
Quando o token anterior for reutilizado
Então a família é revogada e a resposta é 401
```

Evidência necessária: automatizada.

### AC-105: Logout

```gherkin
Dado um usuário autenticado
Quando POST /auth/logout for chamado
Então o refresh token é revogado
E o cookie é limpo
```

Evidência necessária: automatizada.

### AC-106: RBAC e IDOR

```gherkin
Dado um contato pertencente ao SELLER A
Quando o SELLER B tentar ler, editar ou excluir o contato
Então a operação é negada sem revelar se o recurso existe
E o ADMIN consegue acessar o mesmo contato
```

Evidência necessária: automatizada.

### AC-107: CRUD de contatos

```gherkin
Dado um usuário autenticado
Quando criar, listar, atualizar e excluir contatos seus
Então os dados são persistidos e validados
E e-mail duplicado para o mesmo dono retorna erro de validação
```

Evidência necessária: automatizada.

### AC-108: CRUD de empresas

```gherkin
Dado um usuário autenticado
Quando criar, listar, atualizar e excluir empresas suas
Então os dados são persistidos e validados
E uma empresa com contatos vinculados não é excluída silenciosamente
```

Evidência necessária: automatizada.

### AC-109: Paginação por cursor

```gherkin
Dado um conjunto de contatos ou empresas
Quando a lista for consultada com first e after
Então o número máximo é respeitado, a ordem é estável e o cursor funciona
E cursor inválido retorna erro de validação
```

Evidência necessária: automatizada.

### AC-110: DataLoader sem N+1

```gherkin
Dado vários contatos com empresas diferentes
Quando a query solicitar contato e empresa
Então o número de queries não cresce linearmente com o número de contatos
```

Evidência necessária: automatizada.

### AC-111: Schema e drift

```gherkin
Dado o código da API
Quando o schema GraphQL for gerado
Então o arquivo versionado corresponde ao schema do código
E o typecheck dos types gerados passa
```

Evidência necessária: automatizada.

### AC-112: Limites de consulta

```gherkin
Dado o servidor em produção
Quando uma query exceder profundidade, complexidade ou aliases
Então ela é rejeitada
E a introspection está desativada
```

Evidência necessária: automatizada/manual.

### AC-113: Hash e redação

```gherkin
Dado o cadastro ou login de usuário
Quando a senha ou token for processado
Então a senha usa argon2id e nunca aparece em resposta ou log
E tokens não aparecem nos logs
```

Evidência necessária: automatizada.

### AC-114: Quality gates

```gherkin
Dado o repositório instalado
Quando pnpm lint, typecheck, test e build forem executados
Então todos passam, incluindo os testes de integração aplicáveis
```

Evidência necessária: automatizada.

### AC-115: Documentação e rastreabilidade

```gherkin
Dado o fim da implementação
Quando a documentação e a matriz forem revisadas
Então PROJECT, ROADMAP, segurança, SPEC, TASK e matriz refletem a Fase 1
```

Evidência necessária: manual.

## Abordagem técnica

- Prisma 7 com PostgreSQL 18, schema em `apps/api/prisma/schema.prisma` e
  migrations versionadas.
- Módulos NestJS: `auth`, `users`, `companies`, `contacts`; guards de auth e
  RBAC; serviços com checagem de propriedade.
- GraphQL code-first com `@nestjs/graphql`, Apollo Server 5 e GraphQL 16.
- DataLoader por request para `Contact.company`.
- REST de auth com cookie e validação de `Origin`.
- Testcontainers para PostgreSQL nos testes de integração.
- Geração de schema e codegen em `packages/graphql-schema`.

Alternativas rejeitadas: auth inteiramente em GraphQL (ADR-004); autorização
apenas no resolver (insuficiente para IDOR); paginação por offset (instável com
inserções).

## Entrega e operações

- Plano de implantação: ambiente local e CI; deploy fica para a Fase 5.
- Plano de migração: migration inicial; rollback por recriação em
  desenvolvimento.
- Plano de reversão: reverter o commit da fase e remover o volume local.
- Monitoramento e alertas: logs de auth e autorização, health checks existentes.
- Suporte: nenhum dado real; seed pode ser recriado.

## Riscos e dependências

| Risco ou dependência                                    | Impacto | Probabilidade | Mitigação                                          | Responsável       |
| ------------------------------------------------------- | ------- | ------------- | -------------------------------------------------- | ----------------- |
| Descoberta de produto ainda não validada                | Alto    | Alta          | Aprovar esta SPEC e o discovery antes do código    | Produto           |
| Prisma 7 e Node 26 podem exigir ajustes de configuração | Médio   | Média         | Validar no início da implementação                 | Engenharia        |
| Testcontainers depende de Docker na CI                  | Médio   | Média         | Job de integração com Docker; fallback documentado | Engenharia/QA     |
| Modelo de propriedade por dono pode não refletir o time | Alto    | Média         | Validar hipótese antes da implementação            | Produto           |
| LGPD ainda sem base legal formal                        | Alto    | Média         | Usar apenas dados fictícios; documentar limites    | Produto/Segurança |

## Questões abertas

| Questão                                  | Responsável      | Data limite | Resolução                                |
| ---------------------------------------- | ---------------- | ----------- | ---------------------------------------- |
| Empresas são por dono ou compartilhadas? | Produto          | Fase 1      | Proposta: por dono                       |
| Contato terá status já na Fase 1?        | Produto          | Fase 1      | Proposta: não; Fase 2                    |
| Política de senha e retenção de refresh? | Segurança        | Fase 1      | Proposta: 12+ caracteres; refresh 7 dias |
| Base legal e retenção de dados pessoais? | Produto/Jurídico | Fase 1      | Proposta: demo com dados fictícios       |

## Aprovação

| Papel      | Nome                    | Decisão  | Data       | Notas                                       |
| ---------- | ----------------------- | -------- | ---------- | ------------------------------------------- |
| Produto    | Solicitante humano      | Aprovado | 2026-11-09 | Aprovação explícita para implementar        |
| Design     | —                       | N/A      | —          | API sem UI                                  |
| Engenharia | Agente de implementação | Aprovado | 2026-11-09 | Inicia TASK-002-01                          |
| QA         | Agente de implementação | Pronto   | 2026-11-09 | Evidências automatizadas por AC             |
| Segurança  | Baseline da SPEC        | Aceito   | 2026-11-09 | Validar argon2id, tokens e LGPD na execução |
