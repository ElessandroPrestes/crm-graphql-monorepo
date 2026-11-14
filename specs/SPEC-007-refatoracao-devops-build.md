# SPEC: Refatoração DevOps e desempenho de build

## Metadados

| Campo             | Valor                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| ID                | SPEC-007                                                                                         |
| Status            | Approved — instrução direta do solicitante humano em 2026-11-14                                  |
| Responsável       | Engenharia                                                                                       |
| Revisores         | Engenharia / QA                                                                                  |
| Criado            | 2026-11-14                                                                                       |
| Atualizado        | 2026-11-14                                                                                       |
| Lançamento alvo   | Melhoria operacional pós-`0.3.0-alpha`                                                           |
| Discovery         | N/A — solicitação operacional direta, sem mudança de produto                                     |
| Plano de QA       | Evidências em `docs/devops/build-optimization.md` e validações da TASK-007-01                    |
| ADRs relacionadas | ADR-001 (monorepo pnpm/Turborepo), ADR-002 (stack)                                               |
| Refs              | Solicitante: instrução humana de 2026-11-14; Design: N/A — sem mudança visual; TASK: TASK-007-01 |

## Problema e resultado

O build Docker local está lento e duplicado: três Dockerfiles repetem instalação,
build e `pnpm deploy`, o contexto de build é grande e não há uma interface única
para operar a stack. O baseline medido nesta máquina foi de **12 min 25 s** para
o build frio completo (`docker compose ... build --no-cache`), com
`pnpm deploy` da API levando centenas de segundos por causa de hardlinks sobre
camadas do overlayfs.

Resultado esperado: um único Dockerfile multi-stage com cache BuildKit para o
store pnpm, um `Makefile` autodocumentado e não destrutivo, Compose endurecido
sem perder os volumes existentes e documentação com benchmark antes/depois.

## Escopo

### No escopo

- Consolidar `infra/api.Dockerfile`, `infra/worker.Dockerfile` e
  `infra/web.Dockerfile` em `infra/Dockerfile` com targets `api`, `worker` e
  `web`.
- Usar cache mounts BuildKit para o store pnpm e para o cache do Turborepo.
- Reduzir o contexto com `.dockerignore` seguro.
- Criar `Makefile` com ajuda automática, build, subida, health, logs, limpeza
  seletiva e benchmark.
- Endurecer `infra/docker-compose.yml` (non-root preservado, rotação de logs,
  `init`, `cap_drop`, política de restart para infraestrutura) sem remover
  volumes.
- Corrigir dependências de cache do Turborepo para mudanças de schema Prisma.
- Documentar arquitetura, otimização, referência do Makefile e troubleshooting.
- Medir build frio, rebuild após mudança de código e rebuild após mudança de
  dependência, registrando os resultados.

### Fora do escopo

- Alterar comportamento funcional da API, worker ou web.
- Trocar o provedor de deploy, criar manifests Kubernetes ou pipeline de
  publicação de imagens.
- Remover volumes, executar `docker compose down -v`, `docker volume prune` ou
  limpeza global do builder sem confirmação.
- Alterar versões de Node.js, pnpm, Prisma ou dependências de produto.
- Definir limites de CPU/memória arbitrários sem medição no ambiente alvo.

## Requisitos não-funcionais

- Segurança: imagens finais sem segredos, execução como usuário não-root,
  `no-new-privileges` preservado e `cap_drop: [ALL]` nos serviços de aplicação.
- Desempenho: reduzir o build frio e evitar reinstalação de dependências em
  rebuilds de código.
- Confiabilidade: health checks existentes preservados; Compose válido.
- Operação: comandos destrutivos separados e explícitos; volumes preservados.
- Rastreabilidade: benchmark com data, hardware, comandos e resultados.

## Critérios de aceitação

### AC-701: build frio consolidado

```gherkin
Dado um builder sem cache do projeto
Quando executo o build frio dos três targets
Então as imagens são produzidas e o tempo é registrado em docs/devops/build-optimization.md
```

Evidência necessária: automatizada/manual com log e tempo.

### AC-702: rebuild de código reutiliza dependências

```gherkin
Dado que as imagens já foram construídas
Quando altero um arquivo de código e reconstruo
Então a etapa de instalação não é reexecutada e o tempo é registrado
```

Evidência necessária: log do BuildKit mostrando `CACHED` na instalação.

### AC-703: rebuild de dependência é seguro

```gherkin
Dado que o lockfile mudou
Quando reconstruo as imagens
Então as dependências são reinstaladas e os testes de fumaça continuam passando
```

Evidência necessária: log e health checks.

### AC-704: Makefile e Compose operacionais

```gherkin
Dado o repositório limpo
Quando executo make help, make config e make doctor
Então os comandos funcionam sem alterar dados ou volumes
```

Evidência necessária: saída dos comandos.

### AC-705: stack endurecida e funcional

```gherkin
Dado o Compose atualizado
Quando subo a stack full
Então API, worker e web ficam healthy e os volumes existentes são preservados
```

Evidência necessária: `docker compose ps` e health checks.

### AC-706: documentação operacional

```gherkin
Dado um novo integrante do time
Quando lê docs/devops/
Então encontra arquitetura, cache, comandos, benchmark e troubleshooting
```

Evidência necessária: revisão dos documentos.

## Abordagem técnica

- `infra/Dockerfile` com estágios `base`, `deps`, `build`, `prod`, `api`,
  `worker` e `web`; store pnpm montado como cache em `deps` e `prod`.
- Builds sequenciais no estágio `build` para evitar corrida de `prisma generate`
  entre API e worker.
- `pnpm deploy` sequencial em um único estágio `prod`, produzindo `/prod/api` e
  `/prod/worker`.
- Turborepo continua sendo a interface local/CI; o cache de schema Prisma é
  corrigido no `turbo.json`.
- Compose referencia `infra/Dockerfile` com `target` por serviço.
- `Makefile` usa `docker compose` e variáveis sobrescrevíveis; limpeza de
  volumes nunca faz parte de `make clean`.

## Riscos e dependências

| Risco ou dependência                  | Impacto | Probabilidade | Mitigação                                                     |
| ------------------------------------- | ------- | ------------- | ------------------------------------------------------------- |
| Cache mounts crescerem sem controle   | Médio   | Média         | `make cache` para inspeção; poda explícita e documentada      |
| `pnpm deploy` continuar lento no host | Alto    | Baixa         | Cache mount medido; benchmark antes/depois registrado         |
| `cap_drop`/`init` quebrarem runtime   | Médio   | Baixa         | Health checks e smoke tests após subir a stack                |
| Mudança de Compose recriar containers | Baixo   | Alta          | Volumes nomeados preservados; `make clean` não remove volumes |

## Aprovação

| Papel      | Nome               | Decisão  | Data       | Notas                                  |
| ---------- | ------------------ | -------- | ---------- | -------------------------------------- |
| Engenharia | Solicitante humano | Approved | 2026-11-14 | Instrução direta para refatorar DevOps |
| QA         | Engenharia         | Ready    | 2026-11-14 | Validação local e CI serão registradas |
