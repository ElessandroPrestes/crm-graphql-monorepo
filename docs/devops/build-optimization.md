# Otimização de build

Status: **medição local de 2026-11-14**. Números de uma máquina de
desenvolvimento não são SLO; meça no ambiente de CI e no alvo antes de definir
orçamento de build.

## Ambiente

| Item       | Valor                          |
| ---------- | ------------------------------ |
| Data       | 2026-11-14                     |
| Host       | Linux 6.8.0-149-generic x86_64 |
| CPU        | 4 vCPUs                        |
| Memória    | 11 GiB RAM + 3,9 GiB swap      |
| Docker     | 29.9.3                         |
| Compose    | 5.7.1                          |
| Buildx     | 0.39.0                         |
| BuildKit   | 0.34.2                         |
| Node.js    | 26.13.0                        |
| pnpm       | 12.18.0                        |
| Backend FS | overlay2 sobre ext4            |

## Baseline

O baseline foi medido antes da refatoração, com os três Dockerfiles antigos
(`api.Dockerfile`, `worker.Dockerfile`, `web.Dockerfile`), store pnpm dentro da
imagem e cache BuildKit vazio:

```sh
DOCKER_BUILDKIT=1 /usr/bin/time -v \
  docker compose -f infra/docker-compose.yml --profile full build --no-cache
```

| Métrica                | Baseline                        |
| ---------------------- | ------------------------------- |
| Build frio completo    | **745 s** (12 min 25 s)         |
| `pnpm install`         | 74,5 s                          |
| Deploy da API          | 430,4 s                         |
| Deploy do worker       | 514,6 s (em paralelo com a API) |
| Build da API           | 51,3 s                          |
| Build do worker        | 44,8 s                          |
| Build do web           | 45,0 s                          |
| Exportação das imagens | ~25 s                           |

O solicitante registrou um baseline anterior de ~456 s para o build completo.
A diferença é atribuída a variação de host/carga e à execução concorrente dos
três Dockerfiles. Para a comparação antes/depois, usamos o baseline medido na
mesma máquina (745 s).

## Diagnóstico

1. Os três Dockerfiles repetiam instalação, build do `@nexo/shared` e builds.
2. `pnpm deploy` da API e do worker rodava em paralelo e disputava I/O.
3. O store pnpm ficava na imagem; ao criar hardlinks em uma camada superior,
   o overlayfs fazia copy-up. O deploy da API chegou a centenas de segundos.
4. O contexto de build incluía documentação, testes e artefatos de QA.
5. O cache do Turbo não era montado no Docker e o schema Prisma não invalidava
   o cache do worker.
6. Os hooks `prebuild`, `pretypecheck` e `pretest` da API e do worker rodam
   `prisma generate` nos mesmos diretórios. Execuções concorrentes podem
   corromper o client gerado; por isso os scripts raiz usam `--concurrency=1`
   e o Docker também serializa os builds.

## Experimentos

### Cache mount do store pnpm

Montar `/pnpm/store` como cache BuildKit reduziu o deploy para ~25 s (API) e
~17 s (worker). Porém, quando o store já estava quente, o `pnpm install`
precisou copiar os pacotes do cache mount para o overlayfs e levou **~10 min**.
O custo apareceu em rebuilds de dependência e inviabilizou a abordagem.

### Install + build + deploy no mesmo `RUN`

Manter o store e o destino de deploy na mesma camada gravável elimina o
copy-up. O cache do Turbo é montado separadamente em `/cache/turbo`.

O primeiro experimento com apenas o estágio de build levou **140 s** no frio
(install 62 s, Turbo 43 s, deploy ~3 s). O build com os três targets de runtime
levou **299 s** no frio. Porém, uma mudança de código reexecutava o
`pnpm install`, então essa versão não atendia ao AC-702.

### Install em camada separada com deploy por cópia

O `deps` passou a copiar apenas os manifestos e instalar o workspace. O `build`
copia a fonte, executa o Turbo e chama `pnpm deploy` com
`--config.package-import-method=copy`.

O deploy padrão (hardlinks) a partir da camada inferior levou **13 min 13 s**
em um protótipo. Com cópia, o mesmo deploy levou **38 s** no protótipo e cerca
de **30 s** para API + worker no build completo. O install fica em cache quando
só o código muda.

## Resultado final

Build final: `infra/Dockerfile` com estágios `deps` e `build` e targets `api`,
`worker` e `web`.

| Cenário                       | Tempo     | Como foi medido                                           |
| ----------------------------- | --------- | --------------------------------------------------------- |
| Frio, cache do builder podado | **315 s** | `CONFIRM=1 make cache-prune` + `MODE=cold make benchmark` |
| Sem mudanças (tudo em cache)  | **17 s**  | `MODE=warm make benchmark`                                |
| Mudança de código na API      | **122 s** | `MODE=code make benchmark`                                |
| Mudança no lockfile           | **282 s** | `MODE=deps make benchmark`                                |

Ganho no build frio: **745 s → 315 s (2,4×)**. O rebuild sem mudanças caiu para
17 s. A mudança de código mantém o install em cache, recompila a API e copia o
deploy (~30 s). A mudança de dependência reinstala (66 s), reconstrói as quatro
tarefas (61 s) e copia o deploy (53 s). O frio ficou 16 s acima da versão de
`RUN` único, mas o rebuild de código ficou 33 s mais rápido e o install deixou
de ser reexecutado, atendendo ao AC-702.

### Tamanho das imagens

| Imagem            | Antes   | Depois  |
| ----------------- | ------- | ------- |
| `nexo-crm-api`    | 419 MB  | 322 MB  |
| `nexo-crm-worker` | 400 MB  | 300 MB  |
| `nexo-crm-web`    | 61,6 MB | 61,6 MB |

A redução vem de não incluir pnpm nem o store no estágio de runtime.

## Comandos

```sh
make benchmark MODE=warm   # rebuild incremental
make benchmark MODE=code   # altera e restaura apps/api/src/main.ts
make benchmark MODE=deps   # altera e restaura pnpm-lock.yaml
MODE=cold make benchmark   # build com --no-cache

# Para um frio real, remova o cache do builder antes (não remove volumes):
CONFIRM=1 make cache-prune
MODE=cold make benchmark
```

O script `scripts/benchmark-docker-build.sh` grava o log em
`/tmp/nexo-build-<modo>-<timestamp>.log` e imprime `mode` e `elapsed`. Ele
verifica se o arquivo alvo está limpo antes de alterar e restaura com
`git checkout` ao final.

## Limitações

- `docker compose build --no-cache` não limpa cache mounts; para o frio real é
  necessário podar o builder. `cache-prune` remove o cache global do builder,
  não volumes nem imagens.
- O tempo de install depende da rede e do registry. O CI pode ter números
  diferentes.
- O deploy por cópia adiciona ~30 s em toda mudança de código. A alternativa
  com hardlinks entre camadas levava minutos por causa do copy-up do overlayfs.
- O modo `code` do benchmark acrescenta um `console.log` temporário para mudar
  a saída compilada; um comentário não invalidaria o cache do deploy.
- O Compose usa `NODE_ENV=production` com segredos de demonstração para
  exercitar o caminho de produção localmente. Isso não é uma configuração de
  produção.
- Não foram definidos limites de CPU/memória sem medição no ambiente alvo.
