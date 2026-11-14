# Arquitetura Docker

Status: **referência operacional**. O Compose continua sendo um ambiente local;
produção segue `docs/deploy.md`.

## Visão geral

O repositório usa um único `infra/Dockerfile` multi-stage com três targets:

```text
infra/Dockerfile
├─ base      Node + pnpm
├─ deps      manifestos + pnpm install
├─ build     fonte + Turbo build + pnpm deploy (copy)
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

1. `deps` copia apenas os manifestos (`package.json`, `pnpm-lock.yaml`,
   `pnpm-workspace.yaml`, `.npmrc` e os `package.json` dos workspaces) e executa
   `pnpm install --frozen-lockfile`. Essa camada só muda quando um manifesto ou
   o lockfile muda.
2. `build` copia o restante do contexto e executa
   `turbo run build --filter=@nexo/api --filter=@nexo/worker --filter=@nexo/web
--concurrency=1` na ordem topológica.
3. `pnpm --filter @nexo/api --prod --offline --trust-lockfile
--config.package-import-method=copy deploy /prod/api` e o equivalente do worker
   produzem pacotes de runtime isolados. O store continua na camada `deps`; o
   deploy copia os arquivos em vez de criar hardlinks entre camadas.
4. Os targets `api` e `worker` copiam apenas `/prod/*`; o target `web` copia o
   `dist` do Vite para o Nginx. O estágio `build` não faz parte da imagem final.

O `--concurrency=1` é intencional: os hooks `prebuild` da API e do worker rodam
`prisma generate`, e a execução concorrente pode disputar os mesmos arquivos
gerados. O custo de serializar é pequeno diante do ganho de previsibilidade.

## Por que separar `deps` e `build`

Em overlayfs, quando o store pnpm está em uma camada inferior e `pnpm deploy`
cria hardlinks em uma camada superior, o kernel precisa copiar os arquivos
(hardlink entre camadas dispara copy-up). Nesta máquina o deploy padrão levou
**13 min 13 s** em um protótipo com install e deploy em camadas separadas.

A primeira versão da refatoração manteve install, build e deploy no mesmo `RUN`
para evitar o copy-up. Isso reduziu o build frio para 299 s, mas uma mudança de
código reexecutava o `pnpm install` e não atendia ao AC-702.

A versão final separa as responsabilidades:

- `deps` instala o workspace em uma camada que só depende dos manifestos. Uma
  mudança de código reutiliza essa camada; uma mudança de lockfile a reconstrói.
- `build` copia a fonte, executa o Turbo e chama `pnpm deploy` com
  `--config.package-import-method=copy`. A cópia lê do store na camada `deps` e
  evita o copy-up de hardlinks. O deploy de API + worker levou ~30 s.

O cache BuildKit é usado apenas para o cache do Turbo (`/cache/turbo`), que é
pequeno e não sofre o mesmo problema. O trade-off é pagar a cópia do deploy em
toda mudança de código; em troca, o install não é reexecutado. Os números estão
em [build-optimization.md](build-optimization.md).

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
