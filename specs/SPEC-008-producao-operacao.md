# SPEC: Fase 6 — produção e operação do Nexo CRM

## Metadados

| Campo             | Valor                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| ID                | SPEC-008                                                                                                       |
| Status            | In review — discovery aprovada; SPEC aguardando aprovação humana e decisões de topologia, SLOs e LGPD          |
| Responsável       | Engenharia, Operações, QA e Segurança                                                                          |
| Revisores         | Produto / Engenharia / QA / Segurança / Operações / Jurídico                                                   |
| Criado            | 2026-11-14                                                                                                     |
| Atualizado        | 2026-11-14                                                                                                     |
| Lançamento alvo   | Fase 6 (release a definir após aprovação)                                                                      |
| Discovery         | `docs/discovery-fase-6.md` (aprovada em 2026-11-14)                                                            |
| Plano de QA       | `docs/qa-plan-fase-6.md` (QA-003, Draft)                                                                       |
| ADRs relacionadas | ADR-010 (topologia, proposta); ADR-011 (outbox, a criar); ADR-009 (rate limit e persisted queries)             |
| Refs              | Discovery: `docs/discovery-fase-6.md`; Design: N/A — sem nova tela; TASK: TASK-008-01..TASK-008-06; QA: QA-003 |

## Problema e resultado

As Fases 0 a 5 entregaram o produto e o endurecimento técnico, mas o Nexo CRM
ainda não é operável em produção. Não existe deploy de referência, staging,
pipeline de CD, bootstrap seguro do primeiro `ADMIN`, readiness real de
dependências, métricas, tracing, SLOs, outbox transacional, retenção LGPD
aprovada ou code splitting por rota. O Gate 4 humano da Fase 5 também permanece
aberto.

Resultado esperado: um ambiente de staging reproduzível e um caminho aprovado
para produção, com deploy e rollback por SHA, observabilidade acionável,
entrega de eventos sem perda entre commit e publicação, retenção de dados
definida, front-end com carregamento inicial controlado e runbooks testados.
Nenhuma funcionalidade de produto das Fases 1 a 5 é reaberta.

O sucesso é medido pelos critérios AC-801..AC-810, pela aprovação do Gate 2
(SPEC, ADR-010, TASKs e QA-003) e, ao final, pelos Gates 3 e 4. A discovery foi
aprovada por instrução humana em 2026-11-14; a implementação continua bloqueada
até a aprovação explícita desta SPEC, do ADR-010 e das TASKs.

## Escopo

### No escopo

- ADR de topologia, ambientes staging/produção, TLS, domínios e segredos.
- Pipeline de CD com imagens por SHA, migrations, deploy, smoke tests,
  aprovação manual e rollback.
- Bootstrap seguro e auditável do primeiro `ADMIN`, sem seed em produção.
- Readiness real de PostgreSQL, Redis e RabbitMQ para API e worker.
- Métricas, tracing, dashboards, alertas e SLOs acordados no ambiente alvo.
- Outbox transacional para eventos de webhook e subscriptions, com replay de
  DLQ testado e garantia at-least-once com idempotência.
- Política de retenção LGPD aprovada e jobs de purge de refresh tokens,
  mensagens, logs e auditoria.
- Code splitting por rota, orçamento de bundle e cache headers para assets.
- Runbooks de incidente, rollback, restore, replay de DLQ e rotação de
  segredos; drill de backup/restore.
- Validação do SBOM contra o schema CycloneDX e assinatura de imagens, se
  aprovada; caso contrário, exceção registrada.
- Revisão documentada do rate limit de janela fixa, sem alterar o algoritmo
  nesta SPEC.

### Fora do escopo

- Mídia, templates, status de entrega/leitura e presença no WhatsApp.
- Analytics, telemetria de produto ou rastreamento de usuários.
- Multi-tenant, times, aplicativo móvel ou reabertura funcional das Fases 1 a 5.
- Garantia exactly-once; a outbox mantém at-least-once com idempotência.
- Uso de dados reais antes da aprovação de base legal, minimização e retenção.
- HA multi-região ou multi-provedor além da topologia aprovada no ADR-010.
- Mudança do algoritmo de rate limit; a revisão pode recomendar uma SPEC nova.
- Execução de campanhas, integrações comerciais ou novas telas de produto.
- Fechamento do Gate 4 da Fase 5; ele é dependência de entrada, não entrega
  desta SPEC.

## Experiência do usuário

### Usuário principal e contexto

- Grupo de usuários: operadores, engenharia, QA, segurança e pessoas de plantão.
- Objetivo: implantar, observar, recuperar e evoluir o CRM com evidência e
  rollback seguro.
- Contexto e restrições: equipe pequena, orçamento limitado, dados fictícios em
  staging e nenhum dado real antes da aprovação LGPD.

### Fluxo do usuário

O fluxo operacional está descrito em `docs/discovery-fase-6.md` e será
detalhado nos runbooks da TASK-008-06: decidir/provisionar, entregar, observar,
garantir eventos, cumprir LGPD e acelerar o front-end.

### Estados de interface

Não há nova tela de produto. O code splitting pode introduzir um fallback de
carregamento por rota; ele deve usar `role="status"`, texto curto, foco
preservado e não deslocar o layout. Se o fallback for visualmente perceptível,
a revisão de design é obrigatória antes do release.

### Comportamento responsivo e compatibilidade

- Preservar os breakpoints e a compatibilidade da Fase 5.
- O fallback de rota deve funcionar em 320 px, zoom 200% e leitor de tela.
- Navegadores: Chrome, Firefox, Edge e Safari nas duas últimas versões.

### Sistema de design

Nenhum componente ou token novo é planejado. Reutilizar o padrão de estado de
carregamento existente; qualquer exceção visual exige aprovação de design.

### Acessibilidade

Manter WCAG 2.2 AA e os gates da Fase 5. O fallback de carregamento deve ser
anunciado, o foco não pode ser perdido na troca de rota e o bundle dividido não
pode quebrar atalhos, landmarks ou anúncios de rota.

### Conteúdo

Mensagens operacionais e de erro devem ser curtas, sem PII, tokens, segredos ou
nomes internos de infraestrutura expostos ao usuário final.

### Análises e feedback

N/A para telemetria de produto. Métricas e logs são estritamente operacionais,
sem rastreamento de usuário e com retenção aprovada.

## Comportamento funcional

### Deploy, staging e CD

- Staging e produção são ambientes separados, com segredos, banco e domínio
  próprios; staging usa dados fictícios e WhatsApp mock.
- O pipeline publica `api`, `worker` e `web` com tag imutável por SHA, aplica
  migrations, executa smoke tests e exige aprovação manual para produção.
- A política de branch/tag é definida no ADR-010; a proposta inicial é staging a
  partir de `develop` e produção a partir de tag `v*` assinada.
- O rollback usa as imagens anteriores por SHA e só reverte schema quando a
  migration for aditiva e compatível; caso contrário, usa restore do banco.

### Bootstrap do primeiro ADMIN

- O primeiro `ADMIN` é criado por comando operacional idempotente, com
  credencial de uso único ou segredo injetado no runtime.
- O comando não usa `db:seed`, não aceita senha em argumento de linha de comando,
  registra auditoria sem senha e falha se já existir um `ADMIN`.
- A criação é permitida apenas em ambiente explicitamente autorizado.

### Readiness e dependências

- `/health/live` continua verificando o processo.
- `/health/ready` da API consulta PostgreSQL (`SELECT 1`), Redis (`PING`) e
  RabbitMQ (conexão/canal) com timeout curto e retorna `503` quando uma
  dependência essencial falha.
- O worker expõe readiness equivalente para banco, Redis e broker; o web mantém
  `/healthz` para o arquivo estático.
- O resultado não inclui credenciais, hosts internos ou detalhes exploráveis.

### Observabilidade e SLOs

- Instrumentação vendor-neutral para API, worker e web, com correlação por
  `x-request-id` e propagação de trace.
- Métricas mínimas: requisições, erros 5xx, latência, login, rate limit, fila,
  DLQ, conexões do banco, memória e saturação de recursos.
- Dashboards e alertas para 5xx, latência, falhas de login, rate limit, backlog
  de fila, DLQ, banco e indisponibilidade de dependências.
- SLOs, error budget e janelas de alerta são aprovados por humano e registrados
  com baseline no ambiente alvo; nenhum número local é tratado como SLO.
- Logs continuam JSON, redigidos e com retenção definida.

### Outbox e entrega de eventos

- Eventos de webhook e subscriptions são gravados em uma tabela de outbox na
  mesma transação da mudança de domínio.
- Um publicador no worker envia eventos pendentes ao RabbitMQ com retry,
  backoff, métricas e marcação de publicação.
- Consumidores permanecem idempotentes por `externalId` e chave de evento.
- Falha entre commit e publicação não perde evento; duplicatas são toleradas e
  não produzem efeito duplicado.
- O replay de DLQ é documentado, testado e executável por ferramenta
  operacional, com auditoria.

### Retenção LGPD e purge

- A política aprovada define base legal, minimização, prazos e categorias de
  dados para refresh tokens, mensagens, logs e auditoria.
- Jobs agendados removem dados além do prazo, com dry-run, limite por execução,
  métricas e registro de auditoria sem PII.
- Dados legais ou de auditoria não são apagados antes do prazo aprovado.
- Nenhum dado real entra em staging ou produção antes da aprovação.

### Front-end e cache

- Rotas autenticadas usam `React.lazy`/`Suspense` com fallback acessível.
- O build separa chunks por rota e, se necessário, vendor; o bundle inicial
  atende ao orçamento aprovado.
- O Nginx serve assets versionados com `Cache-Control` imutável e HTML sem cache
  agressivo.
- A navegação, o foco, os anúncios de rota e os testes E2E/axe continuam
  passando.

### Operação e cadeia de suprimentos

- Runbooks cobrem incidente, rollback, restore, replay de DLQ, rotação de
  segredos e indisponibilidade de dependências.
- O drill de restore prova o RPO/RTO aprovados e registra data, responsável e
  resultado.
- O SBOM é validado contra o schema CycloneDX na CI; imagens são assinadas e
  verificadas no deploy ou uma exceção formal é registrada.
- A revisão do rate limit de janela fixa registra recomendação e riscos; mudança
  de algoritmo exige SPEC própria.

## Requisitos não-funcionais

- Segurança e privacidade: TLS, menor privilégio, segredos fora do repositório,
  logs sem PII/tokens, imagens assinadas ou exceção e SBOM validado.
- Desempenho e capacidade: readiness responde em até 2 s com dependências
  saudáveis; bundle inicial atende ao orçamento aprovado; deploy não ultrapassa
  a janela acordada.
- Confiabilidade e recuperação: outbox não perde evento entre commit e
  publicação; restore atende ao RPO/RTO aprovados; rollback por SHA é ensaiado.
- Acessibilidade: WCAG 2.2 AA preservado; fallback de rota anunciado e foco
  preservado; axe sem violações críticas ou sérias.
- Compatibilidade: mesmas versões de Node.js, pnpm, navegadores e mobile da
  Fase 5.
- Observabilidade: métricas, traces e logs correlacionados para API, worker e
  web, com dashboards, alertas e retenção definida.
- Operação: comandos documentados, idempotentes e sem dependência de
  conhecimento tácito; ações destrutivas exigem confirmação explícita.

## Critérios de aceitação

### AC-801

```yaml
id: AC-801
title: Deploy de referência em staging com TLS, migrations, smoke tests e rollback
preconditions:
  - ADR-010 aceito e staging provisionado com domínio e TLS
  - Imagens da release publicadas por SHA
action: Executar o deploy de staging e o smoke test documentado
expected_result: Staging responde com TLS, migrations aplicadas, smoke tests verdes e rollback documentado e ensaiado
evidence_type: automated+manual
```

### AC-802

```yaml
id: AC-802
title: Pipeline de CD publica por SHA, exige aprovação e executa rollback
preconditions:
  - Repositório com permissão de publicação no registry
  - Ambiente de produção autorizado
action: Disparar o pipeline, aprovar a promoção e simular falha de smoke test
expected_result: Imagens imutáveis são publicadas, a produção exige aprovação humana e o rollback restaura a release anterior
evidence_type: automated+manual
```

### AC-803

```yaml
id: AC-803
title: Primeiro ADMIN é criado por comando seguro e auditável
preconditions:
  - Banco de produção ou staging sem ADMIN
  - Segredo de bootstrap disponível no runtime
action: Executar o comando de bootstrap e repetir a execução
expected_result: O primeiro ADMIN é criado, a repetição falha sem duplicar, a senha não aparece em logs/argv e a auditoria é registrada
evidence_type: automated
```

### AC-804

```yaml
id: AC-804
title: Readiness verifica PostgreSQL, Redis e RabbitMQ e falha fechado
preconditions:
  - API e worker saudáveis
action: Derrubar cada dependência essencial e consultar /health/ready
expected_result: A resposta é 503 enquanto a dependência está indisponível e volta a 200 quando ela retorna; a saída não expõe credenciais
evidence_type: automated
```

### AC-805

```yaml
id: AC-805
title: Métricas e tracing cobrem API, worker e web com dashboards e alertas
preconditions:
  - Backend de observabilidade escolhido e acessível
action: Gerar tráfego, erro 5xx, falha de login, backlog de fila e DLQ
expected_result: Métricas e traces correlacionados aparecem no backend; dashboards e alertas disparam para os sinais definidos
evidence_type: automated+manual
```

### AC-806

```yaml
id: AC-806
title: SLOs aprovados são medidos com baseline e error budget
preconditions:
  - SLOs aprovados por humano e ambiente alvo medido
action: Comparar a janela observada com os SLOs e simular consumo de error budget
expected_result: Relatório registra baseline, SLO, error budget e alerta quando o orçamento é consumido
evidence_type: manual
```

### AC-807

```yaml
id: AC-807
title: Outbox evita perda entre commit e publicação e permite replay de DLQ
preconditions:
  - Migração da outbox aplicada
  - Worker publicador e consumidor idempotente ativos
action: Falhar a publicação após o commit, reiniciar o publicador e executar replay de uma DLQ
expected_result: O evento é publicado após a recuperação, duplicatas não geram efeito duplicado e o replay é auditado
evidence_type: automated+manual
```

### AC-808

```yaml
id: AC-808
title: Retenção LGPD aprovada e purge reduz dados além do prazo
preconditions:
  - Política de retenção aprovada
  - Dados fictícios com idades variadas em staging
action: Executar dry-run e depois o purge agendado
expected_result: O dry-run lista o escopo, o purge remove apenas dados além do prazo e a auditoria registra a execução sem PII
evidence_type: automated+manual
```

### AC-809

```yaml
id: AC-809
title: Code splitting e cache headers reduzem o bundle inicial
preconditions:
  - Baseline de bundle registrado
  - Orçamento aprovado
action: Executar o build, navegar por todas as rotas e medir o bundle inicial
expected_result: Rotas carregam chunks separados, o bundle inicial atende ao orçamento, assets têm cache imutável e E2E/axe continuam verdes
evidence_type: automated
```

### AC-810

```yaml
id: AC-810
title: Runbooks, restore e cadeia de suprimentos são verificados
preconditions:
  - Backup disponível e SBOM gerado
  - Decisão de assinatura de imagem registrada
action: Executar drill de restore, revisar runbooks e validar SBOM/assinatura
expected_result: Restore atende ao RPO/RTO aprovados, runbooks são executáveis, SBOM valida no schema e imagens estão assinadas ou com exceção aprovada
evidence_type: manual+automated
```

## Abordagem técnica

- **Topologia:** ADR-010 propõe uma VM Linux por ambiente com Docker Compose,
  proxy reverso e serviços de dados gerenciados quando disponíveis. A escolha
  final do provedor, região, domínio e TLS permanece humana; nenhum manifesto
  específico de provedor é criado antes da aceitação.
- **Build e release:** reutilizar `infra/Dockerfile` e os targets `api`, `worker`
  e `web`; publicar imagens imutáveis por SHA; migrations executadas por job
  separado; smoke tests e rollback por SHA.
- **Observabilidade:** instrumentação OpenTelemetry vendor-neutral, exportação
  OTLP ou endpoint Prometheus conforme decisão humana; logs JSON existentes
  continuam sendo a fonte de correlação.
- **Outbox:** nova tabela Prisma `OutboxEvent` com payload, tipo, tentativas,
  próxima tentativa e estado; publisher no worker com `FOR UPDATE SKIP LOCKED`
  ou equivalente; consumidores idempotentes. ADR-011 registra a decisão antes da
  migração.
- **LGPD:** jobs no worker ou cron operacional, com dry-run, limites e auditoria;
  a política aprovada define prazos e categorias.
- **Front-end:** `React.lazy`/`Suspense` por rota, chunks de vendor quando
  medido, orçamento no CI e cache headers no Nginx.
- **Supply chain:** validar SBOM CycloneDX na CI, assinar imagens com cosign ou
  mecanismo equivalente e verificar no deploy; exceção formal se não aprovado.
- **Alternativas rejeitadas:** Kafka para outbox (complexidade desnecessária),
  exactly-once (custo e semântica incompatíveis), Kubernetes desde o início
  (complexidade para equipe pequena), deploy manual (não reproduzível).

## Entrega e operações

- **Plano de implantação:** staging primeiro, com dados fictícios; produção
  somente após Gate 4, LGPD, SLOs e aprovação humana da release.
- **Plano de migração:** migrations aditivas para outbox e índices; backup antes
  de qualquer mudança destrutiva; sem backfill de dados reais nesta SPEC.
- **Plano de reversão:** imagens anteriores por SHA; flag para desabilitar o
  publisher; restore do banco quando a migration não for compatível.
- **Monitoramento e alertas:** dashboards e alertas definidos em AC-805/AC-806;
  incidentes usam runbook e logs correlacionados.
- **Suporte ou impacto operacional:** proprietários de Operações, Segurança e QA
  designados antes do go-live; plantão e escalonamento definidos no runbook.

## Riscos e dependências

| Risco ou dependência                                 | Impacto | Probabilidade | Mitigação                                                   | Responsável        |
| ---------------------------------------------------- | ------- | ------------- | ----------------------------------------------------------- | ------------------ |
| Provedor/topologia e custos não decididos            | Alto    | Alta          | ADR-010 proposto; decisão humana antes de provisionar       | Produto/Engenharia |
| Gate 4 da Fase 5 aberto                              | Alto    | Alta          | Concluir aprovações ou registrar exceção antes do go-live   | QA/A11y/Design     |
| Base legal e retenção LGPD não aprovadas             | Alto    | Alta          | Nenhum dado real até aprovação; jobs só após política       | Produto/Jurídico   |
| Outbox introduzir duplicatas ou atraso               | Alto    | Média         | Idempotência, testes de falha, métricas de backlog e replay | Engenharia         |
| Observabilidade gerar custo/cardinalidade excessivos | Médio   | Média         | Limites de cardinalidade, sampling e revisão de custo       | Operações          |
| Code splitting quebrar foco/rotas                    | Médio   | Média         | Fallback acessível, E2E/axe e revisão de design se visível  | Engenharia/A11y    |
| Assinatura de imagem sem gestão de chaves            | Médio   | Média         | KMS/keyless, rotação e verificação no deploy                | Segurança          |
| Restore não atender ao RPO/RTO                       | Alto    | Média         | Drill, backup imutável e registro de evidência              | Operações          |
| Rate limit de janela fixa permitir rajadas           | Médio   | Média         | Revisão documentada; mudança de algoritmo em SPEC própria   | Segurança          |

## Questões abertas

| Questão                                            | Responsável          | Data limite          | Resolução |
| -------------------------------------------------- | -------------------- | -------------------- | --------- |
| Provedor, região, topologia e custos               | Produto/Engenharia   | Antes da TASK-008-01 | Pendente  |
| Domínios, TLS e política de branch/tag             | Engenharia/Operações | Antes da TASK-008-01 | Pendente  |
| Backend de observabilidade, retenção e orçamento   | Engenharia/Operações | Antes da TASK-008-02 | Pendente  |
| SLOs, error budget e janelas de alerta             | Produto/QA/Operações | Antes da TASK-008-02 | Pendente  |
| Base legal, minimização e prazos de retenção       | Produto/Jurídico     | Antes da TASK-008-04 | Pendente  |
| Outbox versus confirms + retry e desenho da tabela | Engenharia/Segurança | Antes da TASK-008-03 | Pendente  |
| Orçamento de bundle e estratégia de chunks         | Engenharia/Produto   | Antes da TASK-008-05 | Pendente  |
| Método de bootstrap do primeiro `ADMIN`            | Segurança/Operações  | Antes da TASK-008-01 | Pendente  |
| Assinatura de imagens e gate de SBOM               | Segurança            | Antes da TASK-008-06 | Pendente  |
| Serviços gerenciados versus autogerenciados        | Engenharia/Operações | Antes da TASK-008-01 | Pendente  |
| RPO/RTO e periodicidade de restore                 | Operações/Produto    | Antes da TASK-008-06 | Pendente  |

## Aprovação

| Papel              | Nome | Decisão            | Data       | Notas                                      |
| ------------------ | ---- | ------------------ | ---------- | ------------------------------------------ |
| Produto            | —    | Pendente           | —          | —                                          |
| Engenharia         | —    | Pendente           | —          | —                                          |
| QA                 | —    | Not ready          | —          | QA-003 em Draft                            |
| Segurança          | —    | Pendente           | —          | —                                          |
| Operações          | —    | Pendente           | —          | —                                          |
| Solicitante humano | —    | Discovery aprovada | 2026-11-14 | Aprovação do escopo; SPEC ainda em revisão |
