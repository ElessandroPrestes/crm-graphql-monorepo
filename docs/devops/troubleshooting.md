# Troubleshooting de infraestrutura

## A API fica `unhealthy` com erro de configuração

Sintoma:

```text
Invalid environment configuration: ACCESS_TOKEN_SECRET ...
WHATSAPP_PROVIDER deve ser cloud em produção
```

O Compose roda com `NODE_ENV=production` para exercitar o caminho de produção e
injeta valores de demonstração `local-compose-*`. Se você sobrescreveu o
ambiente, mantenha os três campos exigidos em produção:

- `ACCESS_TOKEN_SECRET` com 32+ caracteres e diferente do valor de
  desenvolvimento;
- `WHATSAPP_PROVIDER=cloud`;
- `WHATSAPP_APP_SECRET` e `WHATSAPP_ACCESS_TOKEN` definidos.

Para desenvolvimento fora do container, use `pnpm dev` e o `.env.example`.

## API falha com `EROFS: read-only file system, mkdir '/packages'`

O modo `development` faz o NestJS GraphQL gravar o schema em
`../../packages/graphql-schema/schema.graphql` relativo a `/app`, o que resolve
para `/packages`. Com `read_only: true` isso falha.

O Compose usa `NODE_ENV=production`, no qual o schema é mantido em memória. Se
precisar rodar em `development` dentro do container, remova `read_only` ou
adicione um `tmpfs` em `/packages`. Não remova `read_only` em produção.

## `make up` falha em `dependency failed to start`

1. Veja o serviço que falhou:

   ```sh
   make health
   make logs SERVICE=api
   ```

2. Confira se as portas `3202`, `3203`, `5217`, `5402`, `8203`, `8204` e
   `8205` estão livres:

   ```sh
   ss -ltnp | grep -E ':(3202|3203|5217|5402|8203|8204|8205)'
   ```

3. Se o health check falhar por causa de migrations, aplique-as:

   ```sh
   make db-migrate
   make db-seed
   ```

## Build lento ou `pnpm deploy` demorando minutos

O `infra/Dockerfile` mantém install, build e deploy no mesmo `RUN`
propositalmente. Mover o store pnpm para um cache mount ou para uma camada
inferior faz o overlayfs copiar arquivos no deploy e piora o tempo nesta
máquina. Veja [build-optimization.md](build-optimization.md).

Se o build estiver lento por cache antigo:

```sh
CONFIRM=1 make cache-prune
MODE=cold make benchmark
```

Não use `docker system prune -a --volumes`; isso remove volumes e imagens de
outros projetos.

## `docker buildx du` ou `docker system df` demora

Em builders com muitos registros de cache, esses comandos podem levar minutos.
Use `timeout` para inspecionar sem travar o terminal:

```sh
timeout 60 docker buildx du | tail -20
```

A poda é separada e exige confirmação:

```sh
CONFIRM=1 make cache-prune
```

## Prisma client desatualizado

Os clients são gerados a partir de `apps/api/prisma/schema.prisma`:

```sh
pnpm --filter @nexo/api db:generate
```

O `turbo.json` invalida o cache quando o schema muda. Se o worker continuar com
um client antigo, remova o cache local e gere novamente:

```sh
rm -rf apps/api/src/generated/prisma apps/worker/src/generated/prisma
pnpm --filter @nexo/api db:generate
```

## Volumes e dados

Os volumes do projeto são:

```sh
docker volume ls | grep '^nexo-crm_'
```

`make down` e `make clean` preservam os volumes. Para remover dados de forma
consciente, faça backup antes e execute manualmente apenas o volume desejado:

```sh
# Exemplo destrutivo: só faça isso com backup e confirmação explícita.
docker volume rm nexo-crm_postgres-data
```

Nunca use `docker compose down -v` como atalho.

## CI: `make config` falha

O job de qualidade executa `make help` e `make config`. Se falhar, rode os
mesmos comandos localmente. Erros comuns são YAML inválido, `target` inexistente
no Dockerfile ou variável de ambiente não resolvida.
