# Referência do Makefile

O `Makefile` é a interface operacional do monorepo. Ele não substitui os
scripts do `package.json`; apenas agrupa os comandos usados no dia a dia e no
diagnóstico do Docker.

```sh
make help
```

## Variáveis

| Variável            | Padrão                     | Uso                               |
| ------------------- | -------------------------- | --------------------------------- |
| `COMPOSE`           | `docker compose`           | Binário do Compose                |
| `COMPOSE_FILE`      | `infra/docker-compose.yml` | Arquivo Compose                   |
| `PROFILE`           | `full`                     | Perfil do Compose                 |
| `SERVICE`           | vazio                      | Serviço para `build` e `logs`     |
| `MODE`              | `warm`                     | Cenário de `make benchmark`       |
| `CONFIRM`           | vazio                      | Confirmação de `make cache-prune` |
| `DOCKER_BUILDKIT`   | `1`                        | BuildKit habilitado               |
| `BUILDKIT_PROGRESS` | `auto`                     | Progresso do BuildKit             |

Exemplos:

```sh
make build SERVICE=api
make logs SERVICE=worker
make benchmark MODE=code
CONFIRM=1 make cache-prune
```

## Comandos

### Diagnóstico

| Comando       | Efeito                                                          |
| ------------- | --------------------------------------------------------------- |
| `make help`   | Lista os alvos com descrição                                    |
| `make doctor` | Mostra versões de Docker, Compose, Node, pnpm e espaço em disco |
| `make config` | Valida o Compose sem subir nada                                 |
| `make ps`     | Lista containers do projeto                                     |
| `make health` | Mostra `healthy`/`unhealthy`/`starting` por container           |
| `make images` | Lista tamanhos das imagens `nexo-crm-*`                         |
| `make cache`  | Mostra o uso do cache do builder                                |

### Build e execução

| Comando             | Efeito                                         |
| ------------------- | ---------------------------------------------- |
| `make build`        | Constrói as imagens do perfil                  |
| `make build-api`    | Constrói somente a API                         |
| `make build-worker` | Constrói somente o worker                      |
| `make build-web`    | Constrói somente o web                         |
| `make up`           | Constrói e sobe a stack aguardando health      |
| `make up-infra`     | Sobe somente Postgres, Redis e RabbitMQ        |
| `make start`        | Sobe a stack sem reconstruir                   |
| `make down`         | Remove containers e rede; **preserva volumes** |
| `make stop`         | Para os containers                             |
| `make restart`      | Reinicia os containers                         |
| `make logs`         | Acompanha logs (`SERVICE` opcional)            |
| `make shell-api`    | Abre `sh` no container da API                  |
| `make shell-worker` | Abre `sh` no container do worker               |

### Banco e qualidade

| Comando             | Efeito                         |
| ------------------- | ------------------------------ |
| `make db-migrate`   | `prisma migrate dev`           |
| `make db-seed`      | Seed local com dados fictícios |
| `make db-deploy`    | `prisma migrate deploy`        |
| `make lint`         | ESLint                         |
| `make typecheck`    | TypeScript                     |
| `make test`         | Testes unitários               |
| `make format`       | Prettier                       |
| `make format-check` | Prettier em modo verificação   |
| `make e2e`          | Playwright + axe               |
| `make sbom`         | CycloneDX                      |

### Benchmark e limpeza

| Comando            | Efeito                                                       |
| ------------------ | ------------------------------------------------------------ |
| `make benchmark`   | Mede o build no modo `MODE` (`warm`, `cold`, `code`, `deps`) |
| `make cache-prune` | Remove o cache do builder; exige `CONFIRM=1`                 |
| `make clean`       | Remove containers e imagens do projeto; **preserva volumes** |

## Segurança operacional

- `make down` e `make clean` nunca usam `-v`. Os volumes
  `nexo-crm_postgres-data`, `nexo-crm_redis-data` e
  `nexo-crm_rabbitmq-data` permanecem.
- `make cache-prune` remove o cache global do builder, não volumes nem imagens.
  Use apenas quando precisar de um build realmente frio.
- `make clean` não remove volumes. Para remover dados, faça backup e execute o
  procedimento manual documentado em [troubleshooting.md](troubleshooting.md).
- `make up` usa `--build --wait`; se um health check falhar, o comando retorna
  erro e os containers permanecem para inspeção com `make logs`.
