# Guia de deploy

Status: **referência operacional da Fase 5**. O deploy real não foi executado e
o provedor de infraestrutura permanece em aberto. Este documento define o
mínimo exigido para uma implantação do Nexo CRM sem tratar o Compose local como
ambiente de produção.

## Decisão de referência

- Três processos stateless: `api`, `worker` e `web` (Nginx não privilegiado).
- PostgreSQL gerenciado ou com backup testado; Redis e RabbitMQ com persistência
  habilitada.
- TLS terminado em proxy reverso confiável; a aplicação não publica portas
  diretamente na internet.
- Segredos vêm do gerenciador de segredos do provedor ou de variáveis de
  ambiente injetadas no runtime; nunca do repositório.
- O `infra/docker-compose.yml` é local: publica portas, usa credenciais de
  demonstração e não deve ser promovido como manifesto de produção.

A escolha do provedor (VM única, PaaS de containers ou orquestrador) não muda os
contratos abaixo. Qualquer topologia que os viole exige ADR.

## Variáveis obrigatórias

| Variável                                        | Produção                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`                                      | `production`                                                       |
| `DATABASE_URL`                                  | PostgreSQL com TLS e usuário de menor privilégio                   |
| `REDIS_URL`                                     | Redis autenticado; usado por cache, rate limit, throttle e pub/sub |
| `RABBITMQ_URL`                                  | RabbitMQ com usuário dedicado e DLQ configurada                    |
| `ACCESS_TOKEN_SECRET`                           | 32+ caracteres aleatórios; rotação invalida sessões ativas         |
| `CORS_ORIGINS`                                  | origem pública exata do web, sem curinga                           |
| `WHATSAPP_PROVIDER`                             | `cloud`                                                            |
| `WHATSAPP_APP_SECRET` / `WHATSAPP_ACCESS_TOKEN` | segredos reais da Meta                                             |
| `WHATSAPP_VERIFY_TOKEN`                         | token de verificação do webhook                                    |
| `PERSISTED_QUERIES_MODE`                        | iniciar em `audit`; migrar para `enforce` após observar logs       |
| `JSON_BODY_LIMIT`                               | `256kb`, salvo necessidade medida                                  |
| `RATE_LIMIT_*`, `LOGIN_LOCK_*`                  | valores do ADR-009 ou mais restritivos                             |
| `DATALOADER_ENABLED`                            | `true`; `false` existe somente para benchmark                      |

Consulte `.env.example` para a lista completa. `NODE_ENV=production` falha na
inicialização se o segredo de acesso ou o WhatsApp Cloud estiverem incompletos.

## Build e publicação

```sh
docker build -f infra/api.Dockerfile -t registry.example/nexo-api:0.3.0-alpha .
docker build -f infra/worker.Dockerfile -t registry.example/nexo-worker:0.3.0-alpha .
docker build -f infra/web.Dockerfile -t registry.example/nexo-web:0.3.0-alpha .
```

Publique as três imagens com o mesmo commit e prefixe a release com o SHA. O web
serve apenas arquivos estáticos; o proxy deve encaminhar `/graphql`, `/auth` e
`/webhooks/whatsapp` para a API.

## Ordem de implantação

1. Provisione PostgreSQL, Redis e RabbitMQ; confirme backup e métricas básicas.
2. Aplique migrations com a versão da release, a partir de um runner com acesso
   ao banco:

   ```sh
   DATABASE_URL=... pnpm --filter @nexo/api db:deploy
   ```

3. **Não execute `db:seed` em produção.** O seed contém contas e dados
   fictícios. O provisionamento do primeiro `ADMIN` ainda é um trabalho pendente
   registrado em riscos residuais.
4. Suba `api` e `worker`; aguarde `/health/live` e `/health/ready` da API e
   `/health/live` do worker.
5. Suba `web` e publique o proxy com TLS.
6. Execute os smoke tests.

## Smoke tests

```sh
curl -fsS https://crm.example/health/live
curl -fsS https://crm.example/health/ready

curl -fsS -X POST https://crm.example/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"...","password":"..."}'
```

Valide também:

- login e refresh com cookie `Secure`, `HttpOnly` e `SameSite=Strict`;
- uma persisted query em `audit`/`enforce` e uma operação fora da allowlist;
- abertura de subscription e rejeição sem token;
- webhook com HMAC válido e inválido;
- envio de mensagem e consumo pelo worker;
- `/healthz` do web;
- ausência de tokens, cookies, PII e corpo de mensagem nos logs.

## Observabilidade e capacidade

- Coletar logs JSON da API e do worker com `x-request-id`; alertar para
  `5xx`, falhas de login em massa, DLQ e erros de migration.
- Monitorar `health/ready`, conexões do PostgreSQL, memória do Redis, filas e
  consumidores do RabbitMQ.
- Não há endpoint de métricas Prometheus nesta versão; use logs, health checks e
  métricas do provedor. Essa lacuna é um risco residual.
- O benchmark local está em [performance.md](performance.md). Números de uma
  máquina de desenvolvimento não são SLO de produção; meça no ambiente alvo
  antes de definir autoscaling.

## Segurança operacional

- Termine TLS no proxy, redirecione HTTP para HTTPS e aplique HSTS no proxy.
- Restrinja o acesso ao PostgreSQL, Redis e RabbitMQ à rede privada.
- Mantenha `CORS_ORIGINS` e `ACCESS_TOKEN_SECRET` por ambiente.
- Rotacione segredos de WhatsApp e banco com procedimento de rollback.
- Não habilite introspecção nem sugestões de campo em produção.
- Mantenha `PERSISTED_QUERIES_MODE=audit` durante a primeira janela e só aplique
  `enforce` após confirmar que o cliente publicado está na allowlist.
- Dados reais só podem entrar após aprovação de base legal, minimização e
  retenção LGPD. Até lá, use apenas dados fictícios.

## Backup e recuperação

- PostgreSQL: backup diário + WAL/PITR, com restauração testada trimestralmente.
- Redis: perda é tolerável para cache e rate limit, mas derruba sessões de
  throttle e pub/sub; refresh continua no PostgreSQL. Prefira AOF quando o
  provedor permitir.
- RabbitMQ: filas duráveis, DLQ e procedimento documentado de replay. Sem
  outbox, a publicação é best-effort.
- Guarde a versão da release, o SHA das imagens e o estado das migrations junto
  ao backup.

## Rollback

1. Pare o tráfego de escrita ou coloque a aplicação em manutenção.
2. Reverta `api`, `worker` e `web` para as imagens da release anterior.
3. Verifique compatibilidade das migrations. Prisma aplica migrations
   forward-only; se a release incluiu migration incompatível, restaure o banco
   a partir do backup/PITR antes de subir a versão antiga.
4. Rode os smoke tests e libere o tráfego.
5. Registre o incidente e o motivo do rollback.

Rollback de aplicação sem rollback de schema só é permitido quando a migration
for aditiva e compatível com a versão anterior. Caso contrário, o rollback é o
restore do banco.

## Riscos residuais

| Risco                                           | Impacto | Mitigação atual                                      |
| ----------------------------------------------- | ------- | ---------------------------------------------------- |
| Sem bootstrap de primeiro `ADMIN` para produção | Alto    | Provisionamento manual controlado antes do go-live   |
| Sem métricas Prometheus nem tracing distribuído | Médio   | Logs correlacionados e health checks                 |
| Provedor de deploy e TLS não decididos          | Médio   | Guia provider-neutral; decisão antes do deploy       |
| Retenção/base legal LGPD não aprovadas          | Alto    | Nenhum dado real até aprovação                       |
| Redis indisponível afeta throttle e pub/sub     | Médio   | Login falha fechado; cache e WS têm fail-open medido |
| Migrations sem down migration                   | Médio   | Backup/PITR e janela de manutenção                   |
| Host único não elimina ponto único de falha     | Médio   | Backup e runbook; HA exige nova decisão              |
