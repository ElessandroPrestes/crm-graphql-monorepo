# Arquitetura Docker

Status: **referência operacional**. O Compose continua sendo um ambiente local;
produção segue `docs/deploy.md`.

## Visão geral

O repositório usa um único `infra/Dockerfile` multi-stage com três targets:

```text
infra/Dockerfile
├─ base      Node + pnpm, cache de ferramentas
├─ build     install + Turbo build + pnpm deploy
├─ runtime   Node de produção, usuário não-root
│  ├─ api    /prod/api
│  └─ worker /prod/worker
└─ web       Nginx unprivileged + dist do Vite
```

`infra/docker-compose.yml` referencia o mesmo arquivo com `target` por serviço:

| Serviço    | Target   | Porta local | Usuário           |
| ---------- | -------- | ----------- | ----------------- |
| `api`      | `api`    | `3202`      | `nestjs`          |
| `worker`   | `worker` | `3203`      | `nestjs`          |
| `web`      | `web`    | `5217→8080` | `101` (nginx)     |
| `postgres` | imagem   | `5402`      | usuário da imagem |
| `redis`    | imagem   | `8203`      | usuário da imagem |
| `rabbitmq` | imagem   | `8204/8205` | usuário da imagem |

## Fluxo de build

1. `pnpm install --frozen-lockfile --prefer-offline` instala o workspace.
2. `turbo run build --filter=@nexo/api --filter=@nexo/worker --filter=@nexo/web
--concurrency=1` executa os builds na ordem topológica.
3. `pnpm --filter @nexo/api --prod deploy /prod/api` e o equivalente do worker
   produzem pacotes de runtime isolados.
4. `rm -rf` remove `node_modules`, `.turbo` e o store pnpm do estágio de build
   para não inflar a camada intermediária.
5. Os targets `api` e `worker` copiam apenas `/prod/*`; o target `web` copia o
   `dist` do Vite para o Nginx.

O `--concurrency=1` é intencional: os hooks `prebuild` da API e do worker rodam
`prisma generate`, e a execução concorrente pode disputar os mesmos arquivos
gerados. O custo de serializar é pequeno diante do ganho de previsibilidade.

## Por que install, build e deploy no mesmo `RUN`

Em overlayfs, quando o store pnpm está em uma camada inferior e `pnpm deploy`
cria hardlinks em uma camada superior, o kernel precisa copiar os arquivos
(hardlink entre camadas dispara copy-up). Nesta máquina isso elevou o deploy de
~10 s para centenas de segundos.

Manter install, build e deploy no mesmo `RUN` deixa store e destino na mesma
camada gravável. O cache BuildKit é usado apenas para o cache do Turbo
(`/cache/turbo`), que é pequeno e não sofre o mesmo problema. O trade-off é que
uma mudança de código reexecuta o `pnpm install`; ainda assim o rebuild fica
muito abaixo do baseline. Os números estão em
[build-optimization.md](build-optimization.md).

## Prisma

- `apps/api/prisma/schema.prisma` gera dois clients:
  `apps/api/src/generated/prisma` e `apps/worker/src/generated/prisma`.
- A geração é feita pelos hooks `prebuild`; o worker delega para a API.
- `turbo.json` declara `apps/api/prisma/schema.prisma` em
  `globalDependencies` para invalidar também o cache do worker quando o schema
  mudar.
- Os clients gerados não são versionados; o build sempre parte do schema.

## Runtime e segurança

- API e worker rodam como `nestjs`, sem privilégios e com `cap_drop: [ALL]`.
- `read_only: true` com `tmpfs: /tmp` impede escrita no sistema de arquivos.
- `no-new-privileges:true` permanece em todos os serviços.
- Nginx usa a imagem `nginx-unprivileged` e a porta 8080.
- Logs usam `json-file` com rotação de 10 MB × 3 por serviço.
- `init: true` garante tratamento de sinais e reaping de processos.
- Health checks: `/health/live` na API e worker, `/healthz` no web.
- `restart: unless-stopped` mantém a stack local recuperável; em produção a
  política deve ser definida pelo orquestrador.

## Compose local

O Compose define `NODE_ENV=production` para exercitar o caminho de produção, mas
injeta segredos de demonstração (`local-compose-*`). Eles existem apenas para o
ambiente local e nunca devem ser usados em produção. O web é servido por Nginx;
o proxy de produção deve encaminhar `/graphql`, `/auth` e `/webhooks/whatsapp`
para a API.

## Volumes

Os volumes nomeados são preservados por `make down` e `make clean`:

- `nexo-crm_postgres-data`
- `nexo-crm_redis-data`
- `nexo-crm_rabbitmq-data`

Nunca use `docker compose down -v`, `docker volume prune` ou
`docker system prune -a --volumes` neste projeto sem backup e decisão explícita.
