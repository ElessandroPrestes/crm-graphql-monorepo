# Desempenho — benchmark do DataLoader

Status: **medido localmente em 2026-11-13**. Evidência da TASK-006-03 e do
critério AC-615. Os números valem para o ambiente descrito abaixo; não são SLO
de produção.

## Pergunta

Qual é o efeito do DataLoader nas resoluções `Deal.contact` e `Deal.company`
quando uma lista de negócios é carregada com contatos e empresas?

## Cenário

- Query GraphQL `deals(first: 100)` retornando `contact` e `company` de cada nó.
- Seed normal (`pnpm --filter @nexo/api db:seed`) + 120 negócios determinísticos
  criados por `pnpm --filter @nexo/api db:seed:benchmark`.
- `DATALOADER_ENABLED=false` executa uma consulta por contato e uma por empresa;
  `true` usa os loaders por requisição.
- k6 com taxa constante de 10 iterações/s por 30 s, um login no `setup`.
- Mesma máquina, mesmo banco e mesmas imagens nos dois modos; apenas a flag e o
  processo da API foram alternados.

### Ambiente

| Item             | Valor                                                               |
| ---------------- | ------------------------------------------------------------------- |
| Data             | 2026-11-13                                                          |
| Código           | build da TASK-006-03 sobre `536b2fb`                                |
| CPU              | Intel Core i3-5005U, 4 vCPUs lógicas                                |
| Memória          | 11 GiB                                                              |
| Node.js / pnpm   | 26.13.0 / 12.18.0                                                   |
| PostgreSQL       | `postgres:18.6-alpine` (Docker, mesma máquina)                      |
| Redis / RabbitMQ | `redis:8.8.4-alpine` / `rabbitmq:4.4.0-management-alpine`           |
| k6               | `grafana/k6:0.57.0` (`sha256:70af91f8…`)                            |
| API              | `node apps/api/dist/main.js`, `NODE_ENV=development`, mesma máquina |
| Rate limit       | limites elevados no benchmark; `PERSISTED_QUERIES_MODE=off`         |
| Dados            | fictícios, 100 negócios retornados por iteração                     |

## Resultados

| Métrica                        | DataLoader off | DataLoader on | Variação |
| ------------------------------ | -------------- | ------------- | -------- |
| p95 de `deals`                 | 9 494,65 ms    | 58,58 ms      | −99,4%   |
| Média de `deals`               | 5 952,55 ms    | 40,27 ms      | −99,3%   |
| Mediana de `deals`             | 6 394,34 ms    | 37,38 ms      | —        |
| Throughput GraphQL             | 5,69 req/s     | 9,91 req/s    | +74%     |
| Iterações completas            | 199            | 301           | +51%     |
| Iterações descartadas          | 55             | 0             | —        |
| Erros HTTP/GraphQL             | 0              | 0             | —        |
| Checks                         | 100% (597)     | 100% (903)    | —        |
| Limite adotado `p95 < 3000 ms` | violado        | atendido      | —        |

O modo sem loader consulta contato e empresa individualmente para cada negócio:
com 100 negócios por resposta, o custo esperado é 201 consultas por requisição
(1 lista + 100 contatos + 100 empresas). Com loader, o esperado é 3 consultas
(1 lista + 1 lote de contatos + 1 lote de empresas). Os tempos medidos refletem
essa diferença; a contagem de SQL não foi instrumentada nesta execução.

## Reprodução

```sh
pnpm --filter @nexo/shared build
pnpm --filter @nexo/api build
pnpm --filter @nexo/api db:deploy
pnpm --filter @nexo/api db:seed
pnpm --filter @nexo/api db:seed:benchmark

mkdir -p test-results/k6

DATALOADER_ENABLED=false \
  RATE_LIMIT_GRAPHQL_USER_MAX=100000 \
  RATE_LIMIT_GRAPHQL_WRITE_MAX=100000 \
  RATE_LIMIT_GRAPHQL_ANON_MAX=100000 \
  PERSISTED_QUERIES_MODE=off \
  node apps/api/dist/main.js

docker run --rm --network host -u "$(id -u):$(id -g)" \
  -v "$PWD/infra/k6:/scripts:ro" -v "$PWD/test-results/k6:/results" \
  -e API_URL=http://127.0.0.1:3202 -e DATALOADER_MODE=off \
  -e RATE=10 -e DURATION=30s \
  grafana/k6:0.57.0 run --summary-export=/results/baseline.json \
  /scripts/deals-dataloader.js
```

Pare a API, suba novamente com `DATALOADER_ENABLED=true` e repita com
`DATALOADER_MODE=loader`, gravando `loader.json`. O script está em
`infra/k6/deals-dataloader.js`; os JSONs de resultado ficam em
`test-results/k6/` (ignorado pelo Git).

## Limitações

- Um único host compartilha API e banco; o gargalo do modo sem loader é
  amplificado pela contenção local.
- O banco de benchmark tem dados fictícios e um único `ADMIN`; o cenário não
  mede escrita, subscriptions nem cache do dashboard.
- O limite `p95 < 3000 ms` é uma meta de referência do cenário, não um SLO
  contratual publicado.
- `DATALOADER_ENABLED=false` é uma ferramenta de comparação, não uma opção
  recomendada em produção.
