# Segurança

Status: Fases 0 a 5 implementadas em `develop`; release e aprovações humanas
pendentes. Este documento lista o mapeamento OWASP, o modelo STRIDE final e os
riscos ainda abertos. Controles não implementados estão marcados como
**planejado**; não os trate como existentes.

## Modelo de ameaças (STRIDE final)

| Ameaça                 | Exemplo no Nexo CRM                        | Controles implementados                                                                                                      | Risco residual                                                     |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Spoofing               | Token de acesso forjado ou sessão roubada  | JWT HS256 curto com segredo validado; refresh opaco rotativo com hash no banco; cookie `HttpOnly`/`SameSite=Strict`/`Secure` | Roubo de dispositivo ou segredo ainda não têm revogação central    |
| Tampering              | Alteração indevida de negócio ou mensagem  | Autorização por propriedade, validação zod/class-validator, concorrência otimista e HMAC do webhook                          | Sem assinatura de integridade no banco                             |
| Repudiation            | Negar uma ação sensível                    | Logs pino com `x-request-id` e redação; auditoria de ações sensíveis em tabelas dedicadas                                    | Sem trilha imutável/WORM nem exportação de auditoria               |
| Information disclosure | Vazamento de contato ou conversa           | RBAC por recurso, respostas `NOT_FOUND` genéricas, logs redigidos, introspecção off e exportação LGPD controlada             | Logs de aplicação não têm retenção aprovada                        |
| Denial of service      | Query profunda, batching ou flood de login | Profundidade/complexidade/aliases, paginação máxima, rate limit por Redis, bloqueio de login, corpo máximo e limite de WS    | Janela fixa permite rajadas na borda; falta proteção de L3/L4      |
| Elevation of privilege | SELLER acessa recurso de outro usuário     | Negar por padrão, checagem de `ownerId` em leitura/escrita, subscriptions filtradas e testes negativos entre usuários        | Nenhum controle de administração granular além de `ADMIN`/`SELLER` |

## OWASP Top 10 — mapeamento

| Categoria                                      | Controle no projeto                                                                                                | Status                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| A01 Broken Access Control                      | Autorização em resolver/service com checagem de propriedade; negar por padrão; testes entre usuários               | Implementado (Fases 1 e 2, inclui subscriptions)                        |
| A02 Cryptographic Failures                     | argon2id, TLS terminado no proxy, refresh armazenado como hash, segredos fora do código                            | Parcial (aplicação correta; TLS depende do deploy documentado)          |
| A03 Injection                                  | Prisma parametrizado, proibição de `$queryRawUnsafe`, validação com zod/class-validator, saída escapada pelo React | Implementado (Fases 1 e 2)                                              |
| A04 Insecure Design                            | ADRs, modelo de ameaças e limites definidos antes do código                                                        | Em andamento                                                            |
| A05 Security Misconfiguration                  | helmet, CORS com allowlist, validação de env, erros genéricos, introspecção off, corpo limitado e headers do proxy | Implementado na aplicação; headers do proxy são checklist de deploy     |
| A06 Vulnerable and Outdated Components         | lockfile, `pnpm audit`, Trivy, SBOM CycloneDX e Dependabot agrupado                                                | Implementado; primeiro PR do Dependabot aguarda execução no GitHub      |
| A07 Identification and Authentication Failures | Política de senha, bloqueio progressivo, rate limit, rotação de refresh com detecção de reuso                      | Implementado (argon2id, rotação/reuso, política, bloqueio e rate limit) |
| A08 Software and Data Integrity Failures       | Actions fixadas por SHA, permissões mínimas, SBOM, HMAC e builds com lockfile                                      | Implementado; assinatura de imagens não faz parte desta fase            |
| A09 Security Logging and Monitoring Failures   | pino com redação, correlation id, auditoria de eventos de segurança                                                | Parcial (sem métricas/tracing; retenção de logs pendente)               |
| A10 Server-Side Request Forgery                | Apenas hosts fixos e configurados; Cloud API usa URL base não fornecida pelo usuário                               | Implementado para o provider atual                                      |

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

Implementado na Fase 5 (TASK-006-01): persisted queries com allowlist gerada
pelo codegen e modos `off`/`audit`/`enforce`; rate limit de login por IP/e-mail,
de GraphQL por usuário/IP e de handshake WebSocket com Redis; bloqueio
temporário após falhas de login; política de senha de 12 a 128 caracteres;
limite de corpo JSON configurável (`JSON_BODY_LIMIT`, default `256kb`); e
remoção de sugestões `Did you mean ...` em produção. O login falha fechado se o
Redis estiver indisponível; leitura GraphQL/WS usa fail-open controlado com log.
Detalhes e rollback estão em ADR-009.

Testes E2E negativos da TASK-006-02 (`e2e/security.spec.ts`) exercitam IDOR
entre vendedores, token inválido/expirado, reuso de refresh, HMAC inválido,
WebSocket sem token e tentativa de burlar o rate limit anônimo com
`X-Forwarded-For` forjado. Todos passam localmente em desktop/mobile/API; a
execução na CI é registrada no job `e2e`.

## Implementado na Fase 5 (TASK-006-03)

- Benchmark k6 versionado compara `DATALOADER_ENABLED=false/true` em
  `deals(first: 100)` com `contact` e `company`; resultados e limitações estão
  em `docs/performance.md`. A flag existe para medição e o default é `true`.
- SBOM CycloneDX 1.6 é gerado por `scripts/generate-sbom.mjs` a partir de
  `pnpm -r licenses list` e publicado como artefato no job `security` da CI.
  O arquivo é gerado de forma determinística, mas a validação contra o schema
  oficial CycloneDX ainda não está automatizada.
- Dependabot está configurado para pnpm e GitHub Actions, com PRs semanais
  agrupados por produção/desenvolvimento; a primeira execução ocorre após o
  push no GitHub.
- `docs/deploy.md` cobre variáveis, ordem de implantação, migrations, health
  checks, smoke tests, backup, rollback e riscos residuais. O deploy real e a
  escolha do provedor continuam fora do escopo.
- O STRIDE acima foi revisado com controles implementados e risco residual. A
  aprovação de retenção LGPD segue pendente; nenhum dado real é usado.

## Implementado na Fase 4 (front-end)

- Access token mantido apenas em memória (`SessionStore`); nenhum token, PII
  ou corpo de mensagem é gravado em `localStorage`/`sessionStorage`.
- Refresh em cookie `HttpOnly`, `SameSite=Strict`, `Path=/auth`, com renovação
  single-flight no cliente para evitar tempestade de refresh.
- Logout limpa a sessão, o cache Apollo e a conexão WebSocket mesmo se a
  requisição de logout falhar.
- Guards de rota decidem por `status` do `AuthProvider`, sem confiar em dados
  do cliente para autorização; o servidor continua sendo a fonte de verdade.
- Erros GraphQL/REST são normalizados e exibidos sem stack, detalhes internos
  ou distinção entre recurso inexistente e sem permissão.
- Só dados fictícios são usados em seed, testes e revisão visual.

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

| Risco                                                         | Impacto | Disposição                                      |
| ------------------------------------------------------------- | ------- | ----------------------------------------------- |
| Rate limit por janela fixa permite rajadas na borda           | Médio   | Evolução futura                                 |
| Política de senha sem endpoint público de cadastro            | Baixo   | Evolução futura                                 |
| Leitor de tela e zoom 200% reais ainda não revisados          | Médio   | Gate 4 humano                                   |
| Tokens expirados não têm job de limpeza                       | Baixo   | Evolução futura                                 |
| Logs sem trilha imutável e sem métricas/tracing               | Médio   | Evolução futura; deploy usa logs + health       |
| Pub/sub de subscriptions é best-effort (sem entrega durável)  | Médio   | Documentado em `docs/deploy.md`                 |
| Sem TLS no repositório; produção depende do proxy do provedor | Médio   | Checklist de deploy; decisão de provedor aberta |
| Política de retenção/base legal ainda não aprovada            | Alto    | Bloqueia dados reais                            |
| Sem bootstrap de primeiro `ADMIN` para produção               | Alto    | Provisionamento manual antes do go-live         |
| Sem outbox/exactly-once; DLQ exige replay manual              | Médio   | Documentado; evolução futura                    |

## LGPD

O domínio de CRM lida com dados pessoais. A Fase 3 implementou exportação
tipada (`exportContactData`) e exclusão física com cascata (`deleteContact`),
preservando negócios com `contactId` nulo e registrando auditoria sem PII. Ainda
é necessário aprovar base legal, minimização e retenção antes de usar dados
reais; seeds e testes continuam exclusivamente fictícios.
