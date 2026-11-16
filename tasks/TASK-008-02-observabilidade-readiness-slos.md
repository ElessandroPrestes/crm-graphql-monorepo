# TASK: Observabilidade, readiness e SLOs

## Metadados

| Campo        | Valor                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------- |
| ID           | TASK-008-02                                                                                     |
| Status       | Planned — SPEC-008 aprovada; aguardando decisões de observabilidade/SLOs e aprovação desta TASK |
| Responsável  | Engenharia/Operações                                                                            |
| SPEC         | SPEC-008                                                                                        |
| Critérios    | AC-804, AC-805, AC-806                                                                          |
| Dependências | SPEC-008 revisada para distribuição local; escopo de observabilidade confirmado                 |
| ADRs         | ADR-013 (distribuição local, aceito em 2026-11-16)                                              |

## Objetivo

Tornar API, worker e web observáveis e capazes de falhar de forma segura quando
uma dependência essencial estiver indisponível, com readiness real, métricas,
tracing, dashboards, alertas e SLOs medidos no ambiente alvo.

## Escopo

### Incluído

- Readiness da API e do worker com PostgreSQL, Redis e RabbitMQ, timeout curto e
  `503` fail-closed.
- Manter `/health/live` e `/healthz` do web.
- Instrumentação vendor-neutral (OpenTelemetry ou equivalente) com correlação
  por `x-request-id`.
- Métricas de requisições, 5xx, latência, login, rate limit, fila, DLQ, banco,
  memória e saturação.
- Dashboards e alertas para os sinais definidos na SPEC-008.
- Documento de SLOs com baseline, error budget, janelas e responsáveis.
- Testes de integração e ensaio de dependência indisponível no ambiente local.

### Não incluído

- Pipeline de CD e bootstrap de `ADMIN` (TASK-008-01).
- Outbox e replay de DLQ (TASK-008-03).
- Purge LGPD (TASK-008-04).
- Code splitting (TASK-008-05).
- Runbooks completos e drill de restore (TASK-008-06).
- Compra de backend, HA ou retenção de observabilidade além do aprovado.

## Abordagem e impacto

- Arquivos ou componentes prováveis:
  `apps/api/src/health/health.controller.ts`,
  `apps/worker/src/health/health.controller.ts`,
  `apps/api/src/observability/**`, `apps/worker/src/observability/**`,
  `apps/web/src/observability/**`, `infra/observability/**`,
  `docs/observability.md`, `docs/slo.md` e `.env.example`.
- Dados, contratos ou migrações: nenhuma migração; novas variáveis de ambiente
  para exporter, sampling e endpoints.
- Riscos e precauções: limitar cardinalidade; não expor credenciais ou hosts
  internos no readiness; evitar tracing de corpo/PII; medir custo.
- ADRs e padrões aplicáveis: ADR-010; `standards/security.md` e
  `standards/quality-gates.md`.

## Passos

- [ ] Definir backend, retenção, sampling, orçamento e SLOs com aprovação
      humana.
- [ ] Implementar readiness real com timeout e fail-closed.
- [ ] Instrumentar API, worker e web com correlação de trace.
- [ ] Criar métricas e dashboards acordados.
- [ ] Configurar alertas e testar disparo.
- [ ] Medir baseline e registrar SLOs/error budget.
- [ ] Testar dependências indisponíveis no ambiente local.
- [ ] Atualizar documentação e evidências.

## Validação

| Critério/risco | Teste, comando ou revisão                                   | Evidência esperada                                    |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| AC-804         | Derrubar PostgreSQL, Redis e RabbitMQ e consultar readiness | 503/200 por dependência, sem vazamento de credenciais |
| AC-805         | Gerar tráfego, 5xx, login, fila e DLQ                       | Métricas/traces no backend, dashboards e alertas      |
| AC-806         | Comparar janela com SLO e simular error budget              | Relatório de baseline, SLO e alerta de orçamento      |
| Segurança      | Revisar labels, logs e traces                               | Sem PII, tokens ou segredos                           |
| Custo          | Revisar cardinalidade e sampling                            | Orçamento e limites documentados                      |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade foram atualizadas.
- [ ] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas:
- Evidências:
- Pendências ou bloqueios:
