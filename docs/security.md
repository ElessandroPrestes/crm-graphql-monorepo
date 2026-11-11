# Segurança

Status: Fases 0, 1 e 2 implementadas. Este documento lista o mapeamento OWASP,
o modelo de ameaças resumido e os riscos ainda abertos. Controles não implementados estão
marcados como **planejado**; não os trate como existentes.

## Modelo de ameaças (STRIDE resumido)

| Ameaça                 | Exemplo no Nexo CRM                        | Controle planejado                                                        |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| Spoofing               | Token de acesso forjado ou sessão roubada  | JWT curto com algoritmo fixo, refresh rotativo e hash no banco            |
| Tampering              | Alteração indevida de negócio ou mensagem  | Autorização por recurso, validação de input e webhook HMAC                |
| Repudiation            | Negar uma ação sensível                    | Logs estruturados com correlação e trilha de auditoria                    |
| Information disclosure | Vazamento de contato ou conversa           | Autorização por campo, logs redigidos e mensagens genéricas               |
| Denial of service      | Query profunda, batching ou flood de login | Limites de profundidade/complexidade/aliases, rate limit e payload máximo |
| Elevation of privilege | SELLER acessa recurso de outro usuário     | Negar por padrão e testes negativos de autorização/IDOR                   |

## OWASP Top 10 — mapeamento

| Categoria                                      | Controle no projeto                                                                                                | Status                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| A01 Broken Access Control                      | Autorização em resolver/service com checagem de propriedade; negar por padrão; testes entre usuários               | Implementado (Fases 1 e 2, inclui subscriptions)                          |
| A02 Cryptographic Failures                     | argon2id, TLS fora do local, refresh armazenado como hash, segredos fora do código                                 | Parcial (argon2id e hash de refresh; TLS produção pendente)               |
| A03 Injection                                  | Prisma parametrizado, proibição de `$queryRawUnsafe`, validação com zod/class-validator, saída escapada pelo React | Implementado (Fases 1 e 2)                                                |
| A04 Insecure Design                            | ADRs, modelo de ameaças e limites definidos antes do código                                                        | Em andamento                                                              |
| A05 Security Misconfiguration                  | helmet, CORS com allowlist, validação de env, erros genéricos, introspection off em produção                       | Parcial (helmet, CORS, env e introspection off; headers finais pendentes) |
| A06 Vulnerable and Outdated Components         | lockfile, `pnpm audit`, Dependabot, Trivy e SBOM                                                                   | Parcial (audit e Trivy na CI; Dependabot/SBOM pendentes)                  |
| A07 Identification and Authentication Failures | Política de senha, bloqueio progressivo, rate limit, rotação de refresh com detecção de reuso                      | Parcial (argon2id, rotação e reuso; rate limit/política pendentes)        |
| A08 Software and Data Integrity Failures       | Actions fixadas por SHA, permissões mínimas, HMAC de webhook, builds com lockfile                                  | Parcial (Actions por SHA e lockfile na Fase 0)                            |
| A09 Security Logging and Monitoring Failures   | pino com redação, correlation id, auditoria de eventos de segurança                                                | Parcial (pino e correlation id na Fase 0)                                 |
| A10 Server-Side Request Forgery                | Apenas hosts fixos e configurados; nenhuma URL fornecida pelo usuário é buscada                                    | Planejado (Fase 3)                                                        |

## GraphQL (OWASP API Security)

Implementado nas Fases 1 e 2: autenticação em todas as operações, limite de
profundidade 10, complexidade 1000 (incluindo `deals` e `activities`), 10
aliases, paginação máxima de 100, introspection desativada em produção e
mensagens internas genéricas. O refresh em cookie exige `Origin` permitida e
usa `SameSite=Strict`.

Subscriptions: `graphql-ws` exige Bearer JWT no `connection_init`; a conexão é
rejeitada sem token válido e cada evento `dealMoved` é filtrado por `ownerId`
(ADMIN recebe todos). Testes negativos cobrem conexão sem token e isolamento
entre vendedores.

Pendente para fases seguintes: persisted queries, rate limit por usuário/IP,
limite explícito de corpo e desativação de field suggestions em produção.

## Implementado na Fase 2

- Autorização por propriedade em negócios, atividades, timeline e dashboard,
  com testes negativos entre SELLER A e SELLER B.
- Concorrência otimista com `version`/`expectedVersion` e conflito explícito,
  reduzindo lost updates.
- Subscription autenticada no `connection_init` e eventos filtrados por dono.
- Cache do dashboard com chaves escopadas por dono/ADMIN, TTL de 30 s e
  invalidação por versão; sem Redis, o cálculo ocorre direto no banco.
- Validação de enums, UUIDs, limites de paginação e campos desconhecidos nos
  inputs de negócios e atividades.
- Seed e testes apenas com dados fictícios.

## Implementado na Fase 1

- Argon2id (`19456 KiB`, 2 iterações, paralelismo 1) para senhas.
- Access token JWT de 15 minutos com algoritmo HS256 fixo.
- Refresh opaco de 7 dias, armazenado como SHA-256, rotacionado a cada uso e
  revogado em caso de reuso da família.
- Cookie `HttpOnly`, `SameSite=Strict`, `Path=/auth`, `Secure` em produção.
- Guard REST/GraphQL, RBAC por propriedade e respostas `NOT_FOUND` sem vazar
  existência.
- Testes negativos entre vendedores e teste de hash de senha/refresh.
- Limites de consulta e introspection off em produção.

## Implementado na Fase 0

- Validação de variáveis de ambiente com zod na inicialização (falha rápida).
- `helmet` na API e no worker.
- CORS com allowlist explícita na API.
- `ValidationPipe` com whitelist e rejeição de propriedades desconhecidas.
- Logs HTTP com pino e redação de cabeçalhos sensíveis.
- `x-request-id` para correlação.
- Containers non-root nos Dockerfiles e `no-new-privileges` no Compose.
- CI com lockfile congelado, `pnpm audit`, gitleaks, Trivy e CodeQL.
- `.env.example` sem segredos reais e `.gitignore`/`.dockerignore` restritivos.

## Riscos pendentes

| Risco                                                      | Impacto | Fase alvo      |
| ---------------------------------------------------------- | ------- | -------------- |
| Sem rate limit de login/GraphQL                            | Alto    | Fase 5         |
| Sem política de senha e bloqueio progressivo               | Médio   | Fase 4/5       |
| Tokens expirados não têm job de limpeza                    | Baixo   | Fase 5         |
| Logs ainda não possuem trilha de auditoria de segurança    | Médio   | Fase 5         |
| Pub/sub de `dealMoved` é best-effort (sem entrega durável) | Médio   | Fase 3/5       |
| SBOM e Dependabot ainda não configurados                   | Médio   | Fase 5         |
| Webhook HMAC e idempotência ainda não existem              | Alto    | Fase 3         |
| Sem TLS local obrigatório; produção depende do provedor    | Médio   | Fase 5         |
| Retenção/exportação LGPD ainda não implementadas           | Alto    | Fase 3/5       |
| CI das Fases 1 e 2 ainda não executada no GitHub           | Médio   | Antes do merge |

## LGPD

O domínio de CRM lida com dados pessoais. As Fases 1 e 2 usam apenas dados
fictícios em seed e testes. Antes de qualquer dado real, ainda é necessário registrar
base legal, minimização, retenção, exportação e exclusão. Nenhum dado real é
usado em seeds ou testes.
