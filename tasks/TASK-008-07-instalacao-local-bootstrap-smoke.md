# TASK: Instalação local, bootstrap e smoke test via git clone

## Metadados

| Campo        | Valor                                                      |
| ------------ | ---------------------------------------------------------- |
| ID           | TASK-008-07                                                |
| Status       | Done — validado em clone limpo e banco vazio em 2026-11-16 |
| Responsável  | Engenharia                                                 |
| SPEC         | SPEC-008                                                   |
| Critérios    | AC-811                                                     |
| Dependências | ADR-013 aceito; clone limpo; Node, pnpm e Docker           |
| ADRs         | ADR-013 (distribuição local)                               |

## Objetivo

Garantir que um clone limpo do repositório suba e seja validado com dois
comandos: `make bootstrap` e `make smoke`.

## Escopo

### Incluído

- Script de smoke test para API, web, login e GraphQL.
- Target `make bootstrap`: dependências, infraestrutura, migrations, seed, stack
  e smoke.
- Target `make smoke` reutilizável.
- Documentação do início rápido no `README.md`.

### Não incluído

- Provedor, domínio, TLS, staging, produção ou CD.
- Outbox, retenção LGPD, code splitting e SBOM (TASKs 008-02..06).

## Abordagem e impacto

- Arquivos: `scripts/smoke-local.mjs`, `Makefile`, `README.md`.
- Dados: usa apenas o seed fictício existente; não há migração nova.
- Riscos: dependência de Docker e portas locais; falhas devem ser explícitas.

## Passos

- [x] Criar script de smoke test local.
- [x] Adicionar `make bootstrap` e `make smoke`.
- [x] Documentar o início rápido por git clone.
- [x] Executar `make bootstrap` e `make smoke` em clone limpo.
- [x] Registrar evidências e atualizar rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                     | Evidência esperada                          |
| -------------- | --------------------------------------------- | ------------------------------------------- |
| AC-811         | `make bootstrap && make smoke` em clone limpo | Saída `smoke ok` e stack saudável           |
| Documentação   | Revisão do README                             | Passos de clone, bootstrap e URLs corretos  |
| Idempotência   | Repetir `make smoke`                          | Segunda execução também termina com sucesso |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade foram atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas: `scripts/smoke-local.mjs`, targets `bootstrap` e `smoke`
  no `Makefile`, início rápido por git clone no `README.md` e atualização da
  SPEC-008/QA-003.
- Evidências: em 2026-11-16, `make bootstrap` foi executado em um clone limpo
  (`git clone --branch develop`) no commit `bb0a6dc`, com o projeto Compose
  isolado `nexo-crm-test` e volumes vazios. O comando gerou o cliente Prisma,
  aplicou migrations e seed, construiu API, worker e web, subiu os seis
  containers com health checks verdes e terminou com
  `smoke ok: API, web, login e GraphQL (admin@nexo.local)`. Uma segunda
  execução de `make smoke` também passou; o projeto de teste foi removido com
  `down -v` e a stack normal foi restaurada.
- Correção associada: o primeiro clone limpo revelou que o seed precisava do
  cliente Prisma gerado; `make bootstrap` passou a executar `db:generate`
  antes de `db:deploy` (commit `bb0a6dc`).
- Pendências ou bloqueios: não há provedor, domínio, TLS ou custo no escopo.
  A validação automatizada de acessibilidade manual (NVDA/VoiceOver e zoom
  200%) permanece como risco residual da fase.
