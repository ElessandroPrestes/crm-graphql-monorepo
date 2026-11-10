# ADR-004: Autenticação REST, sessão e autorização por propriedade

## Metadados

| Campo                     | Valor                  |
| ------------------------- | ---------------------- |
| Status                    | Proposed               |
| Data                      | 2026-11-09             |
| Responsáveis              | Engenharia e Segurança |
| SPEC relacionada          | SPEC-002               |
| Substitui/substituída por | —                      |

## Contexto

A Fase 1 precisa autenticar usuários e autorizar o acesso a contatos e
empresas sem expor tokens a JavaScript malicioso. O produto já definiu GraphQL
como API de domínio, mas login, refresh e logout têm semântica de sessão e
cookie que não se encaixa bem em uma mutation GraphQL pública.

## Drivers da decisão

- Refresh token não pode ficar acessível a JavaScript.
- Access token curto reduz a janela de uso indevido.
- O modelo de autorização precisa ser testável contra IDOR/BOLA.
- O fluxo deve funcionar antes da interface web da Fase 4.

## Alternativas consideradas

### Alternativa A: tudo em GraphQL, inclusive login e refresh

- Benefícios: um único contrato e um único cliente.
- Custos e riscos: cookies e CSRF ficam menos explícitos; erros de auth se
  misturam ao schema de domínio; dificulta clientes REST simples.

### Alternativa B: REST para sessão e GraphQL para domínio

- Benefícios: separação clara de responsabilidades; controle explícito de
  cookies, status HTTP e headers; GraphQL permanece focado no domínio.
- Custos e riscos: dois contratos para manter; exige documentação de auth.

## Decisão

Adotar a Alternativa B:

- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` e
  `GET /auth/me` em REST.
- Access token JWT de curta duração enviado em `Authorization: Bearer` para o
  GraphQL.
- Refresh token opaco, aleatório, armazenado apenas como hash, rotacionado a
  cada uso e enviado em cookie `HttpOnly`, `SameSite=Strict` e `Secure` em
  produção.
- Reuso de refresh token revoga a família de tokens.
- Senhas com argon2id e parâmetros mínimos OWASP.
- Autorização por propriedade: `ADMIN` acessa todos os registros; `SELLER`
  acessa apenas registros com `ownerId` próprio. A checagem fica no serviço,
  não apenas no resolver.

## Consequências

### Positivas

- Token de refresh não fica exposto ao JavaScript da aplicação.
- Autorização testável com casos negativos entre usuários.
- GraphQL não precisa carregar responsabilidades de sessão.

### Negativas e riscos

- É necessário proteger refresh/logout contra CSRF e validar `Origin`.
- O cliente precisa renovar o access token antes do vencimento.
- A rotação e a detecção de reuso adicionam complexidade ao modelo de dados.

## Implementação e migração

- Compatibilidade: novas rotas REST; não alteram o health check existente.
- Etapas: modelo `RefreshToken`, endpoints REST, guard GraphQL, RBAC por
  serviço e testes negativos.
- Rollback: remover rotas e modelos da fase; nenhum dado de produção existe.
- Observabilidade: logar login, refresh, logout e falhas de autorização sem
  registrar tokens ou senhas.

## Evidências e validação

- SPEC-002, AC-102 a AC-106 e AC-113.
- Testes de integração de login, rotação, reuso, logout e IDOR.
