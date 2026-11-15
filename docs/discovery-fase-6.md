# Discovery — Fase 6: produção e operação

## Metadados

| Campo       | Valor                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| Status      | Approved — escopo aprovado por instrução humana em 2026-11-14                                                   |
| Responsável | Engenharia, QA, Segurança e Operações                                                                           |
| Criado      | 2026-11-14                                                                                                      |
| Atualizado  | 2026-11-14                                                                                                      |
| SPEC alvo   | SPEC-008 (In review)                                                                                            |
| Fontes      | `PROJECT.md`, `ROADMAP.md`, `docs/deploy.md`, `docs/security.md`, `docs/architecture.md`, `REVIEW-001` e código |

Este documento mapeia o estado real após a Fase 5 e a refatoração DevOps
(SPEC-007). O escopo mínimo foi aprovado por instrução humana em 2026-11-14; a
SPEC-008 e as TASKs derivadas seguem para revisão. Arquitetura, release e uso de
dados reais continuam exigindo aprovação específica.

## Fatos conhecidos

- A Fase 5 está tecnicamente concluída: TASK-006-01 e TASK-006-03 estão `Done`;
  a TASK-006-02 está `In progress` apenas por aprovações humanas do Gate 4
  (QA-001, design, NVDA/VoiceOver e zoom 200% reais). Ver
  `tasks/TASK-006-02-fase-5-e2e-a11y-seguranca.md` e `docs/a11y.md`.
- O deploy real nunca foi executado e o provedor de infraestrutura continua em
  aberto. `docs/deploy.md` é provider-neutral e não há workflow de deploy; a CI
  só executa qualidade, E2E e segurança.
- Não há bootstrap automatizado do primeiro `ADMIN`; o seed é fictício e não
  pode ser usado em produção (`docs/deploy.md`, riscos residuais).
- Os health checks da API e do worker verificam apenas o processo. `/health/ready`
  retorna `ok` sem consultar PostgreSQL, Redis ou RabbitMQ
  (`apps/api/src/health/health.controller.ts`, `apps/worker/src/health/health.controller.ts`).
- Não há endpoint de métricas Prometheus, tracing distribuído nem dependências de
  OpenTelemetry no `package.json`. A operação depende de logs JSON, health
  checks e métricas do provedor (`docs/deploy.md`).
- O RabbitMQ usa publisher confirms e o worker tem retry com backoff e DLQ, mas
  não há outbox transacional. A publicação entre a transação do banco e o broker
  é best-effort; o replay da DLQ é manual
  (`apps/api/src/messaging/rabbitmq.service.ts`,
  `apps/worker/src/whatsapp/whatsapp-inbound.consumer.ts`,
  `docs/architecture.md`).
- O schema Prisma não possui modelo de outbox (`apps/api/prisma/schema.prisma`).
- A LGPD tem exportação e exclusão implementadas, mas base legal, minimização e
  retenção continuam sem aprovação. Não há job de purge de refresh tokens,
  mensagens, logs ou auditoria (`docs/security.md`, `docs/deploy.md`).
- O front-end entrega um único bundle JavaScript de aproximadamente 694 kB no
  build local de 2026-11-14. As rotas são importadas estaticamente em
  `apps/web/src/App.tsx`; não há code splitting por rota nem orçamento de bundle.
- O rate limit usa janela fixa; a borda da janela permite rajadas
  (`docs/security.md`, riscos pendentes).
- Não há assinatura de imagens nem validação automatizada do SBOM contra o
  schema oficial CycloneDX. O primeiro PR do Dependabot ainda depende do
  agendamento no GitHub (`docs/security.md`, release notes).
- O backup/rollback está documentado, mas não há drill de restauração, runbook de
  incidente ou replay de DLQ testado (`docs/deploy.md`).
- A documentação de estado foi alinhada em 2026-11-14 para registrar a Fase 5
  tecnicamente concluída e a Fase 6 em discovery; restam as aprovações humanas
  do Gate 4 e das decisões desta discovery.

## Lacunas e riscos

| Lacuna atual                                      | Risco                                                        | Impacto | Fase |
| ------------------------------------------------- | ------------------------------------------------------------ | ------- | ---- |
| Sem deploy de referência, staging ou CD           | Entrega não reproduzível e dependente de conhecimento tácito | Alto    | 6    |
| Provedor, TLS, domínios e topologia não decididos | Decisões ad hoc e retrabalho de infraestrutura               | Alto    | 6    |
| Sem bootstrap seguro do primeiro `ADMIN`          | Provisionamento manual e risco de conta indevida             | Alto    | 6    |
| Health checks não verificam dependências          | Tráfego enviado para instância sem banco/fila                | Alto    | 6    |
| Sem métricas, tracing, dashboards ou alertas      | Incidentes detectados tarde e sem diagnóstico                | Alto    | 6    |
| Sem SLOs acordados                                | Não há critério objetivo de operação saudável                | Médio   | 6    |
| Sem outbox transacional                           | Perda de evento entre commit e publicação                    | Alto    | 6    |
| Replay de DLQ manual                              | Recuperação lenta e arriscada                                | Médio   | 6    |
| Retenção/base legal LGPD não aprovadas            | Bloqueia dados reais e purge automatizado                    | Alto    | 6    |
| Sem purge de refresh tokens e logs                | Crescimento e retenção além do necessário                    | Médio   | 6    |
| Sem drill de backup/restore                       | Recuperação não comprovada                                   | Alto    | 6    |
| Bundle único de ~694 kB                           | Carga inicial lenta em redes móveis                          | Médio   | 6    |
| Rate limit de janela fixa                         | Rajadas na borda da janela                                   | Médio   | 6    |
| Sem assinatura de imagem/SBOM validado            | Cadeia de suprimentos sem gate de integridade                | Médio   | 6    |
| Gate 4 humano e a11y manual pendentes             | Release bloqueado                                            | Alto    | 5/6  |

## Decisões que exigem aprovação humana

| Decisão                                               | Responsável                | Impacto se não decidida                              |
| ----------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| Provedor e topologia (VM, PaaS ou orquestrador)       | Produto/Engenharia         | Deploy, backup, TLS e custos ficam indefinidos       |
| Separação staging/produção, domínios e TLS            | Produto/Engenharia         | Não há ambiente seguro para validar a release        |
| Backend de observabilidade (OTLP, Prometheus/Grafana) | Engenharia/Operações       | Métricas, tracing e alertas não têm destino          |
| SLOs, error budget e janelas de alerta                | Produto/QA/Operações       | Não há critério objetivo de saúde do serviço         |
| Base legal, minimização e retenção LGPD               | Produto/Jurídico/Segurança | Dados reais continuam proibidos                      |
| Outbox transacional versus confirms + retry           | Engenharia/Segurança       | Escolha afeta schema, worker e garantia de entrega   |
| Orçamento e estratégia de code splitting              | Engenharia/Produto         | Performance inicial e escopo de front-end mudam      |
| Método de bootstrap do primeiro `ADMIN`               | Segurança/Operações        | Provisionamento manual e auditabilidade              |
| Assinatura de imagens e gate de SBOM                  | Segurança                  | Cadeia de suprimentos sem verificação de integridade |
| Serviços gerenciados versus autogerenciados           | Engenharia/Operações       | Custo, HA e esforço operacional mudam                |

## Escopo mínimo proposto

1. **Deploy de referência e entrega**
   - ADR do provedor/topologia e separação staging/produção.
   - Pipeline de CD com build, publicação de imagens por SHA, migrations,
     deploy, smoke tests, aprovação manual e rollback.
   - Bootstrap do primeiro `ADMIN` por comando seguro, auditável e sem seed.
   - Integração com gerenciador de segredos e checklist de TLS/CORS.
   - Drill de backup/restore do PostgreSQL e procedimento de replay da DLQ.

2. **Observabilidade e confiabilidade**
   - Readiness com verificação real de PostgreSQL, Redis e RabbitMQ.
   - Métricas e tracing (OTLP ou Prometheus) para API, worker e web.
   - Dashboards e alertas para 5xx, latência, falhas de login, rate limit,
     profundidade de fila, DLQ, conexões do banco e memória.
   - SLOs acordados e medidos no ambiente alvo; logs correlacionados por
     `x-request-id` com retenção definida.

3. **Entrega durável de eventos**
   - ADR e implementação de outbox transacional para eventos de webhook e
     subscriptions, preservando idempotência por `externalId`.
   - Replay de DLQ documentado, testado e com ferramenta operacional.
   - Testes de falha entre commit e publicação e de duplicidade.

4. **LGPD e retenção**
   - Aprovação de base legal, minimização e prazos de retenção.
   - Jobs de purge para refresh tokens expirados, mensagens, logs e auditoria,
     conforme a política aprovada.
   - Registro de auditoria sem PII e revisão da retenção de logs.

5. **Performance do front-end**
   - Code splitting por rota com `React.lazy`/`Suspense` e orçamento de bundle.
   - Cache headers no Nginx para assets versionados.
   - Medição de carregamento no ambiente alvo e meta de bundle acordada.

6. **Operação e cadeia de suprimentos**
   - Runbooks de incidente, rollback, restore, replay de DLQ e rotação de
     segredos.
   - Validação do SBOM contra o schema oficial e assinatura de imagens, se
     aprovado.
   - Job de limpeza de tokens e revisão do rate limit de janela fixa.

## Fora do escopo

- Mídia, templates, status de entrega/leitura e presença no WhatsApp.
- Analytics, telemetria de produto ou rastreamento de usuários.
- Multi-tenant, times, aplicativo móvel ou reabertura funcional das Fases 1 a 4.
- Garantia exactly-once; outbox mantém at-least-once com idempotência.
- Uso de dados reais antes da aprovação LGPD.
- HA multi-região ou multi-provedor além da topologia escolhida.
- Execução de campanhas de marketing ou integrações comerciais novas.

## Hipóteses a validar

| Hipótese                                                             | Impacto se rejeitada                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| Serviços gerenciados são preferíveis para uma equipe pequena         | Topologia, custo e runbooks mudam                    |
| Outbox em PostgreSQL é suficiente sem introduzir Kafka               | Complexidade e garantia de entrega mudam             |
| OTLP com backend gerenciado ou Prometheus/Grafana self-hosted atende | Instrumentação, custo e operação mudam               |
| Staging usa dados fictícios e WhatsApp mock                          | Validação de produção fica limitada                  |
| Code splitting por rota reduz o bundle inicial para a meta acordada  | Performance inicial e arquitetura do front-end mudam |
| Gate 4 pode ser concluído antes do go-live de produção               | Release permanece bloqueado                          |
| SLOs iniciais podem ser medidos no staging antes de produção         | Metas e alertas ficam sem baseline                   |

## Fluxos propostos

1. **Decidir e provisionar**: ADR do provedor, staging/produção, segredos, TLS,
   banco gerenciado e backup.
2. **Entregar**: pipeline publica imagens por SHA, aplica migrations, sobe a
   stack, executa smoke tests e permite rollback com aprovação manual.
3. **Observar**: readiness de dependências, métricas/tracing, dashboards,
   alertas e SLOs; incidentes usam runbook e logs correlacionados.
4. **Garantir eventos**: outbox grava e publica eventos; worker idempotente
   consome; DLQ tem replay testado.
5. **Cumprir LGPD**: política aprovada, jobs de purge e auditoria sem PII.
6. **Acelerar o front-end**: rotas lazy, orçamento de bundle e cache headers.

## Proposta de SPEC-008 e TASKs

| ID proposto | Escopo principal                                                  | Critérios sugeridos    | Dependências humanas               |
| ----------- | ----------------------------------------------------------------- | ---------------------- | ---------------------------------- |
| SPEC-008    | Produção e operação do Nexo CRM                                   | AC-801..AC-810         | Aprovação da discovery e do escopo |
| TASK-008-01 | Deploy de referência, staging, CD, bootstrap de `ADMIN` e backup  | AC-801, AC-802, AC-803 | Provedor/topologia e ambientes     |
| TASK-008-02 | Observabilidade, readiness de dependências, SLOs e alertas        | AC-804, AC-805, AC-806 | Backend de observabilidade e SLOs  |
| TASK-008-03 | Outbox transacional, replay de DLQ e testes de falha              | AC-807                 | Decisão outbox versus retry        |
| TASK-008-04 | Retenção LGPD, purge de tokens/logs e auditoria                   | AC-808                 | Base legal e prazos                |
| TASK-008-05 | Code splitting, orçamento de bundle e cache headers               | AC-809                 | Meta de bundle                     |
| TASK-008-06 | Runbooks, drill de restore, SBOM validado e assinatura de imagens | AC-810                 | Gate de supply chain               |

Critérios sugeridos:

- **AC-801**: deploy de referência em staging com TLS, migrations, smoke tests e
  rollback documentado.
- **AC-802**: pipeline de CD publica imagens por SHA, exige aprovação manual e
  executa rollback automatizado.
- **AC-803**: primeiro `ADMIN` é criado por comando seguro e auditável, sem seed
  em produção.
- **AC-804**: `/health/ready` verifica PostgreSQL, Redis e RabbitMQ e falha
  fechado quando uma dependência essencial está indisponível.
- **AC-805**: métricas e tracing cobrem API, worker e web; dashboards e alertas
  disparam para 5xx, latência, login, rate limit, fila e DLQ.
- **AC-806**: SLOs aprovados são medidos no ambiente alvo e registrados com
  baseline e error budget.
- **AC-807**: eventos de webhook e subscriptions usam outbox; falha entre commit
  e publicação não perde evento; replay de DLQ é testado.
- **AC-808**: política de retenção aprovada e jobs de purge reduzem tokens,
  mensagens, logs e auditoria conforme os prazos.
- **AC-809**: rotas usam code splitting e o bundle inicial atende ao orçamento
  acordado; assets têm cache headers.
- **AC-810**: runbooks de incidente, restore e replay são testados; SBOM é
  validado e imagens são assinadas se aprovado.

## Critérios de entrada

- [ ] Discovery da Fase 6 aprovada por instrução humana.
- [ ] Provedor/topologia e ambientes staging/produção decididos em ADR.
- [ ] Gate 4 da Fase 4 concluído ou com exceção autorizada.
- [ ] Base legal/retenção LGPD decidida para dados reais; staging pode usar
      dados fictícios.
- [ ] SLOs e backend de observabilidade definidos.
- [ ] Proprietários de QA, Segurança e Operações designados.

## Critérios de saída

- [ ] SPEC-008 e TASKs aprovadas.
- [ ] Deploy de referência em staging com TLS, migrations, smoke e rollback.
- [ ] Pipeline de CD com aprovação manual e artefatos publicados.
- [ ] Readiness de dependências e observabilidade com alertas.
- [ ] Outbox e replay de DLQ testados.
- [ ] Retenção LGPD implementada conforme política aprovada.
- [ ] Code splitting e orçamento de bundle atendidos.
- [ ] Runbooks e drill de backup/restore executados.
- [ ] CI verde, sem defeito S1/S2 aberto e riscos residuais registrados.

## Evidências e pendências documentais

- `PROJECT.md`, `ROADMAP.md` e `docs/architecture.md` foram alinhados em
  2026-11-14 com a Fase 5 tecnicamente concluída e a Fase 6 em discovery.
- `docs/qa-plan-fase-5.md` e `docs/release-notes-0.3.0-alpha.md` listam deploy,
  outbox, mídia de WhatsApp e retenção LGPD como fora do escopo da Fase 5.
- `reviews/REVIEW-001-fase-4.md` mantém REV-03, REV-04 e REV-06 abertos; REV-06
  bloqueia o Gate 4 de release.
- `docs/a11y.md` mantém zoom 200% real e NVDA/VoiceOver pendentes.
- `docs/security.md` registra ausência de métricas/tracing, retenção de logs,
  outbox e bootstrap de `ADMIN` como riscos abertos.
- `docs/deploy.md` registra que não há endpoint Prometheus nem tracing e que o
  replay de DLQ é manual.

## Aprovação

| Papel              | Nome | Decisão  | Data       | Notas                                                            |
| ------------------ | ---- | -------- | ---------- | ---------------------------------------------------------------- |
| Solicitante humano | —    | Approved | 2026-11-14 | Aprovou o escopo mínimo proposto; SPEC e TASKs seguem em revisão |

## Próximo passo sugerido

A SPEC-008 foi criada em `specs/SPEC-008-producao-operacao.md` com status
`In review`, acompanhada do `ADR-010` proposto, do plano `QA-003` e das TASKs
`TASK-008-01..06` em `Planned`. Nenhuma implementação deve começar antes da
aprovação da SPEC, do ADR-010 e das TASKs.
