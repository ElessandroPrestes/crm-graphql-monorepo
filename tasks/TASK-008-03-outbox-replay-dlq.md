# TASK: Outbox transacional e replay de DLQ

## Metadados

| Campo        | Valor                                                                 |
| ------------ | --------------------------------------------------------------------- |
| ID           | TASK-008-03                                                           |
| Status       | Planned — aguardando aprovação da SPEC-008 e do ADR de outbox         |
| Responsável  | Engenharia/Segurança                                                  |
| SPEC         | SPEC-008                                                              |
| Critérios    | AC-807                                                                |
| Dependências | SPEC-008 aprovada; ADR-011 (outbox) aceito; TASK-008-01/02 em staging |
| ADRs         | ADR-006 (RabbitMQ/idempotência), ADR-011 (outbox, a criar)            |

## Objetivo

Garantir que eventos de webhook e subscriptions sejam gravados e publicados sem
perda entre o commit do banco e o broker, com entrega at-least-once,
idempotência, métricas e replay de DLQ testado.

## Escopo

### Incluído

- ADR-011 comparando outbox transacional, confirms + retry e alternativas.
- Modelo Prisma de outbox e migration aditiva com índices.
- Gravação do evento na mesma transação da mudança de domínio.
- Publisher no worker com retry, backoff, lock e métricas de backlog.
- Consumidores idempotentes por `externalId`/chave de evento.
- Ferramenta operacional de replay de DLQ com auditoria.
- Testes de falha após commit, restart do publisher, duplicata e replay.
- Documentação técnica e atualização de `docs/architecture.md`/`docs/security.md`.

### Não incluído

- Garantia exactly-once ou uso de Kafka.
- Eventos de mídia/status do WhatsApp.
- Pipeline de deploy (TASK-008-01) e observabilidade base (TASK-008-02).
- Purge LGPD (TASK-008-04).
- Runbooks completos de incidente (TASK-008-06), embora o replay seja
  documentado aqui e consolidado lá.

## Abordagem e impacto

- Arquivos ou componentes prováveis: `apps/api/prisma/schema.prisma`,
  `apps/api/prisma/migrations/**`, `apps/api/src/messaging/**`,
  `apps/worker/src/outbox/**`, `apps/worker/src/whatsapp/**`,
  `scripts/replay-dlq.*`, testes de integração e `docs/architecture.md`.
- Dados, contratos ou migrações: nova tabela de outbox e índices; migration
  aditiva; sem backfill de dados reais.
- Riscos e precauções: duplicatas, lock contention, crescimento da tabela,
  poison messages e atraso de publicação; limitar tentativas e alertar backlog.
- ADRs e padrões aplicáveis: ADR-006, ADR-011, `standards/database.md` e
  `standards/security.md`.

## Passos

- [ ] Criar e aceitar ADR-011 com o desenho da outbox.
- [ ] Adicionar modelo e migration aditiva.
- [ ] Gravar eventos na transação de domínio.
- [ ] Implementar publisher com retry/backoff e métricas.
- [ ] Garantir idempotência nos consumidores.
- [ ] Implementar replay de DLQ com auditoria.
- [ ] Testar falha, restart, duplicata e replay.
- [ ] Atualizar documentação e evidências.

## Validação

| Critério/risco | Teste, comando ou revisão                                  | Evidência esperada                                       |
| -------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| AC-807         | Falhar publicação após commit, reiniciar e executar replay | Evento publicado, duplicata sem efeito e replay auditado |
| Integridade    | Teste de transação e rollback                              | Evento e domínio consistentes                            |
| Idempotência   | Reenviar evento duplicado                                  | Um único efeito observável                               |
| Operação       | Medir backlog e tentativas                                 | Métricas e alerta de atraso                              |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade foram atualizadas.
- [ ] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas:
- Evidências:
- Pendências ou bloqueios:
