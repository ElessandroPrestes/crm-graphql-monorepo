# Plano de QA — Fase 6: produção e operação

## Metadados

| Campo                   | Valor                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| ID                      | QA-003                                                                                   |
| Status                  | Draft — reescopo local necessário; premissa de staging/produção invalidada em 2026-11-16 |
| Responsável (QA owner)  | QA/Operações                                                                             |
| Build/commit            | A definir após aprovação da SPEC-008                                                     |
| SPEC/design relacionado | SPEC-008; Design N/A (sem nova tela)                                                     |
| Janela de teste         | Fase 6                                                                                   |

## Escopo e objetivo de qualidade

### No escopo

- Deploy de referência em staging, TLS, migrations, smoke tests e rollback.
- Pipeline de CD com imagens por SHA, aprovação manual e rollback.
- Bootstrap seguro do primeiro `ADMIN`.
- Readiness real de PostgreSQL, Redis e RabbitMQ.
- Métricas, tracing, dashboards, alertas e SLOs.
- Outbox transacional, falha entre commit e publicação e replay de DLQ.
- Retenção LGPD, dry-run e jobs de purge.
- Code splitting, orçamento de bundle e cache headers.
- Runbooks, drill de restore, validação de SBOM e assinatura de imagens.

### Fora do escopo

- Mídia/templates de WhatsApp, analytics, multi-tenant e novas telas.
- HA multi-região e mudança do algoritmo de rate limit.
- Uso de dados reais antes da aprovação LGPD.
- Reabertura funcional das Fases 1 a 5.

## Avaliação de risco

| ID    | Risco                                              | Impacto | Probabilidade | Resposta de teste                                     | Responsável    |
| ----- | -------------------------------------------------- | ------- | ------------- | ----------------------------------------------------- | -------------- |
| R-601 | Deploy não reproduzível ou sem rollback            | Alto    | Média         | Ensaio completo em staging e simulação de falha       | Operações/QA   |
| R-602 | Readiness não detecta dependência indisponível     | Alto    | Média         | Derrubar PostgreSQL, Redis e RabbitMQ individualmente | QA/Engenharia  |
| R-603 | Outbox perde evento ou duplica efeito              | Alto    | Média         | Falha injetada após commit, restart e replay de DLQ   | Engenharia/QA  |
| R-604 | Purge LGPD remove dado dentro do prazo             | Alto    | Baixa         | Dry-run, dados com idades variadas e revisão jurídica | QA/Jurídico    |
| R-605 | Code splitting quebra rota, foco ou a11y           | Médio   | Média         | E2E, axe e navegação por teclado em todas as rotas    | QA/A11y        |
| R-606 | Assinatura de imagem sem verificação no deploy     | Médio   | Média         | Teste de admissão com imagem assinada e não assinada  | Segurança      |
| R-607 | Observabilidade com custo/cardinalidade excessivos | Médio   | Média         | Revisão de labels, sampling e orçamento               | Operações      |
| R-608 | Restore não atende ao RPO/RTO                      | Alto    | Média         | Drill cronometrado com backup real de staging         | Operações      |
| R-609 | Gate 4 aberto bloqueia go-live                     | Alto    | Alta          | Checklist de aprovações e exceções antes da promoção  | QA/Design/A11y |
| R-610 | Clone local não sobe ou smoke não valida o fluxo   | Alto    | Média         | `make bootstrap` e `make smoke` em clone limpo        | Engenharia/QA  |

## Abordagem de teste

| Área de teste    | Nível/tipo           | Automatizado/manual | Ambiente              | Responsável   | Evidência requerida                         |
| ---------------- | -------------------- | ------------------- | --------------------- | ------------- | ------------------------------------------- |
| Deploy e CD      | Integração e ensaio  | Automatizado/manual | Staging               | Operações/QA  | Logs do pipeline, smoke tests e rollback    |
| Bootstrap ADMIN  | Integração/segurança | Automatizado        | Staging               | Segurança/QA  | Teste de criação, repetição e auditoria     |
| Readiness        | Integração           | Automatizado        | Staging/Compose       | QA/Engenharia | 503/200 por dependência                     |
| Observabilidade  | Integração/operação  | Automatizado/manual | Staging               | Operações/QA  | Dashboards, traces e alertas disparados     |
| SLOs             | Medição e revisão    | Manual              | Staging               | QA/Operações  | Relatório de baseline e error budget        |
| Outbox/DLQ       | Integração e caos    | Automatizado/manual | Staging               | Engenharia/QA | Teste de falha, duplicata e replay auditado |
| LGPD/purge       | Integração e revisão | Automatizado/manual | Staging com fictícios | QA/Jurídico   | Dry-run, purge e auditoria sem PII          |
| Front-end        | E2E, build e a11y    | Automatizado        | Compose/CI            | QA/A11y       | Bundle, chunks, cache e E2E/axe verdes      |
| Runbooks/restore | Ensaio operacional   | Manual              | Staging               | Operações/QA  | Drill cronometrado e runbook revisado       |
| Supply chain     | CI e admissão        | Automatizado        | CI/Staging            | Segurança     | SBOM validado e assinatura verificada       |

## Rastreabilidade dos critérios de aceitação

| Critério | Risco       | ID/caminho do teste                        | Caso manual                               | Evidência/resultado      | Defeito/exceção |
| -------- | ----------- | ------------------------------------------ | ----------------------------------------- | ------------------------ | --------------- |
| AC-801   | R-601       | Pipeline de staging + smoke tests          | Deploy e rollback em staging              | Planned                  | —               |
| AC-802   | R-601       | Pipeline de CD + simulação de falha        | Aprovação manual e rollback               | Planned                  | —               |
| AC-803   | R-601       | Teste de bootstrap e repetição             | Criar primeiro ADMIN e tentar repetir     | Planned                  | —               |
| AC-804   | R-602       | Teste de readiness com dependências caídas | Derrubar cada dependência                 | Planned                  | —               |
| AC-805   | R-607       | Teste de métricas/tracing e alertas        | Gerar 5xx, login, fila e DLQ              | Planned                  | —               |
| AC-806   | R-607       | Revisão de SLO e baseline                  | Comparar janela e error budget            | Planned                  | —               |
| AC-807   | R-603       | Teste de falha da outbox e replay          | Falhar publicação e reiniciar worker      | Planned                  | —               |
| AC-808   | R-604       | Teste de dry-run e purge                   | Dados fictícios com idades variadas       | Planned                  | —               |
| AC-809   | R-605       | Build + E2E + axe + medição de bundle      | Navegar por todas as rotas                | Planned                  | —               |
| AC-811   | R-610       | `make bootstrap` + `make smoke`            | Clone limpo e stack local                 | Partial — checkout atual | —               |
| AC-810   | R-606/R-608 | Drill de restore + SBOM + assinatura       | Restore cronometrado e admissão de imagem | Planned                  | —               |

## Ambiente e dados

- Ambiente e URL/endpoint: staging a definir no ADR-010; Compose local para
  testes de integração.
- Build/commit/configuração: imagens por SHA, migrations da release e segredos
  de staging.
- Feature flags: publisher da outbox, retenção e rollout de produção.
- Dependências: PostgreSQL, Redis e RabbitMQ; backend de observabilidade e
  registry de imagens.
- Contas e permissões: `ADMIN` de bootstrap e usuários fictícios; nenhum dado
  real.
- Dados e privacidade: somente fictícios até aprovação LGPD; logs sem PII,
  tokens ou corpos de mensagem.
- Observabilidade: métricas, traces e logs correlacionados por `x-request-id`.

## Critérios de entrada

- [x] Discovery da Fase 6 aprovada em 2026-11-14.
- [ ] SPEC-008 aprovada por humano.
- [ ] ADR-013 aceito e distribuição local validada.
- [ ] TASKs TASK-008-01..06 aprovadas e atribuídas.
- [ ] Gate 4 da Fase 5 concluído ou com exceção autorizada.
- [ ] Base legal/retenção LGPD definida para produção; staging com fictícios.
- [ ] Backend de observabilidade, SLOs e RPO/RTO definidos.

## Critérios de saída

- [ ] AC-803..AC-811 com evidência reproduzível; AC-801 e AC-802 estão cancelados.
- [ ] Deploy, rollback, restore e replay de DLQ ensaiados.
- [ ] Readiness, métricas, tracing, dashboards e alertas verdes.
- [ ] Nenhum defeito S1/S2 aberto; S3/S4 com disposição.
- [ ] Riscos residuais e exceções registrados.
- [ ] Gate 4 aprovado e release autorizada.

## Defeitos e riscos residuais

| ID  | Severidade | Resumo | Status | Responsável | Disposição para lançamento |
| --- | ---------- | ------ | ------ | ----------- | -------------------------- |
| —   | —          | —      | —      | —           | —                          |

## Exceções de portão

| Portão/verificação | Motivo e impacto | Mitigação/monitoramento | Responsável | Validade | Aprovador |
| ------------------ | ---------------- | ----------------------- | ----------- | -------- | --------- |
| —                  | —                | —                       | —           | —        | —         |

## Resumo do teste e recomendação

Plano em Draft. Nenhum teste de Fase 6 foi executado e nenhum critério possui
evidência. Em 2026-11-16 a premissa de staging/produção hospedados foi
invalidada: a distribuição é apenas por git clone e execução local. O plano
precisa ser reescrito para validar clone, instalação, infraestrutura local,
migrations, bootstrap de `ADMIN`, smoke tests e backup/restore locais. A
recomendação permanece **No-go** até essa revisão.
