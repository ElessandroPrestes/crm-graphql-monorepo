# TASK: Refatoração DevOps e build multi-stage

## Metadados

| Campo        | Valor                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| ID           | TASK-007-01                                                                                   |
| Status       | Done — implementação, validação local e CI verdes; revisão independente pendente (2026-11-14) |
| Responsável  | Engenharia                                                                                    |
| Refs:        | SPEC: SPEC-007; Critérios: AC-701..AC-706; ADRs: ADR-001, ADR-002                             |
| Dependências | SPEC-007 aprovada por instrução humana em 2026-11-14                                          |

## Objetivo

Consolidar as imagens Docker, introduzir cache BuildKit e uma interface
`Makefile` para reduzir o tempo de build e padronizar a operação local sem
alterar o comportamento da aplicação nem remover volumes.

## Escopo

### Incluído

- `infra/Dockerfile` multi-stage com targets `api`, `worker` e `web`.
- Cache BuildKit para o Turborepo; store pnpm na camada `deps` e deploy por cópia.
- `.dockerignore` revisado.
- `Makefile` autodocumentado e não destrutivo.
- `infra/docker-compose.yml` atualizado para o novo Dockerfile e endurecido.
- Ajuste de `turbo.json` para invalidar cache quando o schema Prisma mudar.
- `docs/devops/docker-architecture.md`, `build-optimization.md`,
  `makefile-reference.md` e `troubleshooting.md`.
- Atualização de `README.md` e `docs/deploy.md` para os novos comandos.
- Benchmark antes/depois com medições registradas.

### Não incluído

- Mudanças funcionais em API, worker ou web.
- Publicação de imagens em registry.
- Limpeza de volumes ou do builder sem confirmação.
- Limites de recursos arbitrários.

## Abordagem e impacto

- Arquivos prováveis: `infra/Dockerfile`, `infra/docker-compose.yml`,
  `.dockerignore`, `Makefile`, `turbo.json`, `docs/devops/**`, `README.md`,
  `docs/deploy.md`, `.github/workflows/ci.yml`.
- Dados/contratos: nenhuma migração; schema Prisma inalterado.
- Riscos e precauções: validar health checks após `make up`; preservar volumes
  `nexo-crm_*`; não usar `down -v`.
- ADRs e padrões aplicáveis: ADR-001, ADR-002; padrões de documentação e
  segurança do projeto.

## Passos

- [x] Medir baseline frio antes da refatoração.
- [x] Consolidar Dockerfile com cache BuildKit do Turbo.
- [x] Criar Makefile e atualizar Compose.
- [x] Ajustar `.dockerignore` e `turbo.json`.
- [x] Validar build, health checks e comandos do Makefile.
- [x] Medir rebuild de código e de dependência.
- [x] Documentar arquitetura, benchmark, comandos e troubleshooting.
- [x] Commitar, publicar em `develop` e acompanhar CI.

## Validação

| Critério/risco | Teste, comando ou revisão                                 | Evidência esperada                       |
| -------------- | --------------------------------------------------------- | ---------------------------------------- |
| AC-701         | `CONFIRM=1 make cache-prune` + `MODE=cold make benchmark` | Tempo frio e log em docs/devops          |
| AC-702         | `MODE=code make benchmark`                                | `CACHED` na instalação; tempo registrado |
| AC-703         | `MODE=deps make benchmark` + `make up`                    | Reinstalação e health checks verdes      |
| AC-704         | `make help`, `make config`, `make doctor`                 | Saída válida, sem alteração de dados     |
| AC-705         | `make up` e `make health`                                 | Serviços `healthy`; volumes preservados  |
| AC-706         | Revisão de `docs/devops/**`                               | Conteúdo completo e links válidos        |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade foram atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas:
  - `infra/Dockerfile` multi-stage com estágios `deps` e `build` e targets
    `api`, `worker` e `web`.
  - Install em camada separada; deploy por cópia para evitar copy-up; cache
    BuildKit para o Turbo.
  - `Makefile` autodocumentado e script `scripts/benchmark-docker-build.sh`.
  - Compose com `init`, `read_only`, `tmpfs`, `cap_drop`, rotação de logs,
    `restart` e valores locais de demonstração.
  - `.dockerignore` reduzido e `turbo.json` com `globalDependencies` do schema.
  - Builds locais/CI serializados (`--concurrency=1`) para evitar corrida do
    `prisma generate`.
  - Documentação em `docs/devops/` e atualização de README, deploy e PROJECT.
- Evidências:
  - Baseline frio: 745 s; novo frio: 315 s; warm: 17 s; código: 122 s
    (install em cache); dependências: 282 s.
  - Imagens: API 322 MB, worker 300 MB, web 61,6 MB.
  - `make up`: seis containers `healthy`; `make down` preservou os três volumes.
  - `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
    `pnpm format:check`, `schema:check` e `pnpm audit --audit-level high`
    passaram.
  - Commits `ae71289`, `6f281af` e `b79d04c`; CI run `43641509234` verde em
    `develop` (Quality gates, E2E, Security e CodeQL). Detalhes em
    `reviews/qa-evidence/QA-EVIDENCE-TASK-007-01.md`.
- Desvios: a primeira versão usava install, build e deploy no mesmo `RUN` e
  chegou a 299 s no frio, mas reexecutava o install em mudanças de código e não
  atendia ao AC-702. A versão final separa `deps`/`build` e usa
  `--config.package-import-method=copy`; o cache mount do store foi descartado
  porque o install com store quente levava ~10 min por cópia EXDEV.
- Pendências ou bloqueios: revisão independente do artefato.
