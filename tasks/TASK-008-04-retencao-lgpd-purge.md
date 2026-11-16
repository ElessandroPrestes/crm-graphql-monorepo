# TASK: Retenção LGPD, purge e auditoria

## Metadados

| Campo        | Valor                                                                               |
| ------------ | ----------------------------------------------------------------------------------- |
| ID           | TASK-008-04                                                                         |
| Status       | Planned — SPEC-008 aprovada; aguardando política de retenção e aprovação desta TASK |
| Responsável  | Engenharia/Jurídico/QA                                                              |
| SPEC         | SPEC-008                                                                            |
| Critérios    | AC-808                                                                              |
| Dependências | SPEC-008 revisada; base legal e prazos aprovados                                    |
| ADRs         | ADR-007 (LGPD/exportação/exclusão)                                                  |

## Objetivo

Implementar a política de retenção aprovada para refresh tokens, mensagens, logs
e auditoria, com jobs de purge seguros, dry-run, métricas e evidência de
conformidade, sem apagar dados dentro do prazo legal.

## Escopo

### Incluído

- Documento de política de retenção com base legal, categorias e prazos
  aprovados por humano.
- Jobs agendados de purge para refresh tokens expirados, mensagens, logs e
  auditoria conforme a política.
- Modo dry-run, limite por execução, idempotência e registro de auditoria sem
  PII.
- Métricas de itens removidos, falhas e duração.
- Testes com dados fictícios de idades variadas.
- Atualização de `docs/security.md`, `docs/deploy.md` e runbook de retenção.

### Não incluído

- Aprovação jurídica da base legal (entrada humana, não implementação).
- Exportação/exclusão LGPD já existentes da Fase 3.
- Retenção de dados em serviços externos além do escopo aprovado.
- Outbox (TASK-008-03), observabilidade base (TASK-008-02) e deploy (TASK-008-01).
- Mudança de schema além de índices necessários ao purge.

## Abordagem e impacto

- Arquivos ou componentes prováveis: `apps/worker/src/retention/**`,
  `apps/api/prisma/schema.prisma` (índices), `docs/security.md`,
  `docs/runbooks/retention.md`, testes de integração e `.env.example`.
- Dados, contratos ou migrações: possíveis índices para consultas de purge;
  nenhuma remoção de coluna.
- Riscos e precauções: apagar dado dentro do prazo, lock longo, PII em logs de
  auditoria e execução parcial; usar dry-run, batches e limites.
- ADRs e padrões aplicáveis: ADR-007, `standards/database.md`,
  `standards/security.md`.

## Passos

- [ ] Registrar a política de retenção aprovada e os prazos por categoria.
- [ ] Implementar dry-run e contagem por categoria.
- [ ] Implementar purge em batches com limite e idempotência.
- [ ] Registrar auditoria sem PII e métricas.
- [ ] Testar dados dentro e fora do prazo.
- [ ] Agendar execução e documentar operação/rollback.
- [ ] Atualizar documentação e evidências.

## Validação

| Critério/risco | Teste, comando ou revisão                              | Evidência esperada                                      |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| AC-808         | Dry-run e purge com dados fictícios de idades variadas | Apenas dados além do prazo removidos; auditoria sem PII |
| Segurança      | Revisar logs e registros de auditoria                  | Sem PII, tokens ou conteúdo de mensagem                 |
| Operação       | Executar purge em batches e medir duração              | Métricas, limites e idempotência                        |
| Conformidade   | Revisar política e prazos com Jurídico                 | Aprovação registrada                                    |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade foram atualizadas.
- [ ] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas:
- Evidências:
- Pendências ou bloqueios:
