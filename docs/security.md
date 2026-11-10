# Segurança

Status: inicial (Fase 0). Este documento lista o mapeamento OWASP, o modelo de
ameaças resumido e os riscos ainda abertos. Controles não implementados estão
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

| Categoria                                      | Controle no projeto                                                                                                | Status                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| A01 Broken Access Control                      | Autorização em resolver/service com checagem de propriedade; negar por padrão; testes entre usuários               | Planejado (Fase 1)                                       |
| A02 Cryptographic Failures                     | argon2id, TLS fora do local, refresh armazenado como hash, segredos fora do código                                 | Planejado (Fase 1)                                       |
| A03 Injection                                  | Prisma parametrizado, proibição de `$queryRawUnsafe`, validação com zod/class-validator, saída escapada pelo React | Parcial (validação de env; restante Fase 1)              |
| A04 Insecure Design                            | ADRs, modelo de ameaças e limites definidos antes do código                                                        | Em andamento                                             |
| A05 Security Misconfiguration                  | helmet, CORS com allowlist, validação de env, erros genéricos, introspection off em produção                       | Parcial (helmet, CORS e env na Fase 0)                   |
| A06 Vulnerable and Outdated Components         | lockfile, `pnpm audit`, Dependabot, Trivy e SBOM                                                                   | Parcial (audit e Trivy na CI; Dependabot/SBOM pendentes) |
| A07 Identification and Authentication Failures | Política de senha, bloqueio progressivo, rate limit, rotação de refresh com detecção de reuso                      | Planejado (Fase 1)                                       |
| A08 Software and Data Integrity Failures       | Actions fixadas por SHA, permissões mínimas, HMAC de webhook, builds com lockfile                                  | Parcial (Actions por SHA e lockfile na Fase 0)           |
| A09 Security Logging and Monitoring Failures   | pino com redação, correlation id, auditoria de eventos de segurança                                                | Parcial (pino e correlation id na Fase 0)                |
| A10 Server-Side Request Forgery                | Apenas hosts fixos e configurados; nenhuma URL fornecida pelo usuário é buscada                                    | Planejado (Fase 3)                                       |

## GraphQL (OWASP API Security)

Planejado para a Fase 1/5: limite de profundidade, complexidade, aliases e
tamanho de corpo; persisted queries em produção; rate limit por usuário e IP;
CSRF para refresh em cookie; autenticação em `connection_init`; desativação de
field suggestions em produção.

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

| Risco                                                   | Impacto | Fase alvo |
| ------------------------------------------------------- | ------- | --------- |
| Sem autenticação/autorização implementada               | Alto    | Fase 1    |
| Sem rate limit nem limites de complexidade GraphQL      | Alto    | Fase 1/5  |
| Logs ainda não possuem trilha de auditoria de segurança | Médio   | Fase 1    |
| SBOM e Dependabot ainda não configurados                | Médio   | Fase 5    |
| Webhook HMAC e idempotência ainda não existem           | Alto    | Fase 3    |
| Sem TLS local obrigatório; produção depende do provedor | Médio   | Fase 5    |
| Dados pessoais/LGPD ainda não implementados             | Alto    | Fase 3/5  |

## LGPD

O domínio de CRM lidará com dados pessoais. Antes de implementar contatos e
conversas, a Fase 1 deve registrar minimização, base legal, retenção e os
mecanismos de exportação/exclusão. Nenhum dado real será usado em seeds.
