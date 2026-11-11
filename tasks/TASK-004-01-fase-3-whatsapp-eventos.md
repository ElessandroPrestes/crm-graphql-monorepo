# TASK: Implementar a Fase 3 — WhatsApp, eventos e LGPD

## Metadados

| Campo        | Valor                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID           | TASK-004-01                                                                                                                                                    |
| Status       | Done                                                                                                                                                           |
| Responsável  | Engenharia                                                                                                                                                     |
| SPEC         | SPEC-004                                                                                                                                                       |
| Critérios    | AC-301, AC-302, AC-303, AC-304, AC-305, AC-306, AC-307, AC-308, AC-309, AC-310, AC-311, AC-312, AC-313, AC-314, AC-315, AC-316, AC-317, AC-318, AC-319, AC-320 |
| Dependências | SPEC-004 aprovada; discovery da Fase 3 aceito; ADR-006 e ADR-007 aceitos; Fases 1 e 2 concluídas                                                               |

## Objetivo

Entregar recebimento e envio de WhatsApp, processamento idempotente no worker,
subscription `messageReceived` e operações de exportação/exclusão LGPD, com
autorização por propriedade e evidências automatizadas.

## Escopo

### Incluído

- Modelos `Conversation`, `Message` e `WhatsAppAccount`; `Contact.email`
  opcional e `phoneNormalized`; migration e seed fictício.
- Porta `WhatsAppProvider` com Mock e Cloud API.
- Webhook `GET`/`POST` com HMAC-SHA256, corpo bruto e limite de 1 MB.
- RabbitMQ com publisher confirms, retry com backoff e DLQ.
- Worker com idempotência por `externalId` e publicação Redis best-effort.
- GraphQL de conversas, mensagens, `sendMessage` e `messageReceived`.
- Exportação e exclusão de dados de contato.
- Testes unitários e de integração com PostgreSQL, Redis e RabbitMQ.
- Schema, codegen, documentação e rastreabilidade.

### Não incluído

- Front-end, inbox visual, i18n e temas (Fase 4).
- Mídia, templates e webhooks de status.
- Replay de DLQ e CRUD de conta WhatsApp.
- Retenção automática e política jurídica completa.
- Rate limit, persisted queries e benchmark k6 (Fase 5).

## Abordagem e impacto

- Arquivos: `apps/api/prisma/**`, `apps/api/src/whatsapp/**`,
  `apps/api/src/conversations/**`, `apps/api/src/messages/**`,
  `apps/api/src/messaging/**`, `apps/api/src/realtime/**`,
  `apps/api/src/contacts/**`, `apps/worker/**`, `packages/shared/**`,
  `infra/docker-compose.yml`, `packages/graphql-schema/**`, ADRs, docs.
- Contratos: rotas REST de webhook; tipos GraphQL `Conversation`, `Message`,
  `ContactDataExport`, mutation `sendMessage`/`exportContactData` e subscription
  `messageReceived`.
- Dados: três tabelas novas, enums, índices, `email` nullable e telefone
  normalizado.
- Riscos: HMAC, PII em logs/DLQ, duplicidade de eventos, perda de tempo real
  sem Redis e exclusão irreversível.
- ADRs e padrões: ADR-006, ADR-007, `standards/security.md`,
  `standards/database.md`, `standards/coding.md`.

## Passos

- [x] Aprovar discovery, ADR-006, ADR-007 e SPEC-004.
- [x] Adicionar dependências e modelos Prisma.
- [x] Implementar provider, HMAC, webhook e publicação RabbitMQ.
- [x] Implementar consumer, idempotência, retry/DLQ e Redis no worker.
- [x] Implementar GraphQL de conversas, mensagens, envio e subscription.
- [x] Implementar exportação e exclusão LGPD.
- [x] Adicionar testes unitários e de integração.
- [x] Gerar schema/types e verificar drift.
- [x] Rodar lint, typecheck, test, build, format e schema:check.
- [x] Atualizar documentação e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                     | Evidência esperada                           |
| -------------- | --------------------------------------------- | -------------------------------------------- |
| AC-301         | testes de validação de ambiente e provider    | Mock padrão; Cloud exige credenciais         |
| AC-302         | integração GET challenge                      | Challenge correto e token inválido rejeitado |
| AC-303         | integração HMAC, corpo grande e JSON inválido | 200/401/413/400 conforme o caso              |
| AC-304         | integração publicação e broker indisponível   | Evento confirmado; 503 sem estado parcial    |
| AC-305         | integração consumer                           | Contato/conversa criados ou reutilizados     |
| AC-306         | integração duplicata                          | Uma mensagem e um evento                     |
| AC-307         | unitário de política + integração DLQ         | Backoff e DLQ corretos                       |
| AC-308         | integração GraphQL                            | Cursor, ordem e RBAC                         |
| AC-309         | integração e unitário de envio                | SENT/FAILED e idempotência                   |
| AC-310         | integração graphql-ws                         | Evento autorizado; outro dono não recebe     |
| AC-311         | unitário de falha Redis                       | Mensagem persiste e falha é logada           |
| AC-312         | integração exportação                         | Payload completo e escopado                  |
| AC-313         | integração exclusão                           | Cascata e negócio preservado                 |
| AC-314         | integração IDOR                               | Negado sem vazar existência                  |
| AC-315         | testes de validação                           | Limites e erros corretos                     |
| AC-316         | revisão de logs e configuração                | Sem PII/segredos                             |
| AC-317         | `schema:check` e hash de regeneração          | Sem drift                                    |
| AC-318         | `pnpm lint && typecheck && test && build`     | Saída verde                                  |
| AC-319         | revisão de docs e matriz                      | Documentos e rastreabilidade atualizados     |
| AC-320         | integração de reconexão/shutdown              | Consumer reassina e fecha sem perda          |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade foram atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

Implementado em 2026-11-11.

### Escopo entregue

- Migration `20261111152000_fase_3_whatsapp` com backfill de
  `Contact.phoneNormalized`, modelos `WhatsAppAccount`, `Conversation` e
  `Message`, enums e índices; seed fictício da Fase 3.
- API: provider Mock/Cloud, HMAC sobre corpo bruto, webhook `GET/POST`,
  publisher RabbitMQ com confirm e 503, GraphQL de conversas/mensagens,
  `sendMessage`, `messageReceived`, `exportContactData` e `deleteContact`.
- Worker: consumer com topologia, prefetch, retry 5s/30s/5m, DLQ, reconexão,
  shutdown ordenado, idempotência por `externalId` e evento Redis mínimo.
- Shared: contratos zod e constantes de fila/eventos; segundo generator Prisma
  para o worker.
- Documentação: PROJECT, ROADMAP, README, arquitetura, segurança, knowledge e
  `.env.example`.

### Validações executadas

- `pnpm lint` — verde.
- `pnpm typecheck` — verde.
- `pnpm --filter @nexo/api test` — 24 testes verdes.
- `pnpm --filter @nexo/worker test` — 9 testes verdes.
- `pnpm --filter @nexo/shared test` — 7 testes verdes.
- `pnpm --filter @nexo/api test:integration` — 23 testes verdes (PostgreSQL,
  Redis e RabbitMQ).
- `pnpm --filter @nexo/worker test:integration` — 3 testes verdes.
- `pnpm build`, `pnpm format:check`, `schema:check` e matriz de rastreabilidade
  regenerada.

### Desvios e limitações

- A conversa é única por `contactId + channel`, conforme o schema aprovado; o
  `accountId` é atualizado para a conta do último inbound.
- Apenas mensagens inbound publicam `messageReceived`; envio outbound é
  síncrono e não gera evento de subscription.
- Redis e subscriptions permanecem best-effort; não há outbox transacional nem
  exactly-once.
- Replay de DLQ é manual; mídia e webhooks de status ficam fora do escopo.
- Retenção/base legal LGPD ainda dependem de aprovação antes de dados reais.

### Pendências

- Commit da implementação com `Spec-Ref: SPEC-004` e
  `Task-Ref: TASK-004-01`.
- Execução do pipeline no GitHub e revisão independente.
- Política de retenção e revisão jurídica antes de produção com dados reais.
