# Roadmap — Nexo CRM

> **Framework de Governança**: Universal SDD (Spec-Driven Development)
> **Status vigente**: Fases 0 a 5 implementadas tecnicamente; Gate 4 aprovado por instrução humana em 2026-11-16; Fase 6 em andamento no escopo local via git clone, com deploy hospedado cancelado em 2026-11-16.

O roadmap comunica direção, não compromisso de prazo. Nenhuma funcionalidade é
implementada antes da aprovação formal de sua SPEC e TASK.

---

## Fase 0 — Fundação (concluída)

- [x] pnpm workspaces + Turborepo.
- [x] TypeScript strict, ESLint, Prettier, Husky, lint-staged e commitlint.
- [x] Esqueletos de API, worker e web.
- [x] Validação de ambiente, health checks e segurança básica.
- [x] Docker Compose e Dockerfiles multi-stage non-root.
- [x] CI com quality gates, auditoria, gitleaks, Trivy e CodeQL.
- [x] ADRs de stack, arquitetura, segurança e acessibilidade iniciais.
- [x] SPEC-001 / TASK-001-01 com rastreabilidade.

## Fase 1 — Domínio e API núcleo (concluída)

- [x] Discovery de produto/UX e premissas de LGPD para dados fictícios.
- [x] Modelo Prisma, migration inicial e seed fictício.
- [x] Autenticação com argon2id, JWT curto e refresh rotativo.
- [x] RBAC com checagem de propriedade e testes negativos entre usuários.
- [x] CRUD de contatos e empresas com paginação por cursor.
- [x] Schema GraphQL code-first, codegen e verificação de drift.
- [x] DataLoader com teste unitário de batching por requisição.
- [x] Limites de profundidade, complexidade e aliases; introspection off em
      produção.

> Evidências: `specs/SPEC-002-fase-1-dominio-auth-graphql.md`,
> `tasks/TASK-002-01-fase-1-dominio-auth-graphql.md` e testes em
> `apps/api/test/fase-1.e2e.test.ts`.

## Fase 2 — Funil e dashboard (concluída)

- [x] Negociações com etapas e concorrência otimista (`version`).
- [x] Linha do tempo de atividades.
- [x] Subscription `dealMoved` via Redis pub/sub e autorização.
- [x] `dashboardMetrics` com cache Redis e invalidação por evento.

> Evidências: `specs/SPEC-003-fase-2-funil-dashboard.md`,
> `tasks/TASK-003-01-fase-2-funil-dashboard.md`,
> `adr/ADR-005-subscriptions-graphql-redis.md` e testes em
> `apps/api/test/fase-2.e2e.test.ts`.

## Fase 3 — WhatsApp e eventos (concluída)

- [x] Porta `WhatsAppProvider` com Mock e Cloud API.
- [x] Webhook REST com HMAC-SHA256 e limite de corpo.
- [x] Publicação no RabbitMQ e worker com idempotência.
- [x] Retentativas com backoff e dead-letter queue.
- [x] Subscription `messageReceived` e mutation `sendMessage`.
- [x] Exportação/exclusão de dados de contato.

> Evidências: `specs/SPEC-004-fase-3-whatsapp-eventos.md`,
> `tasks/TASK-004-01-fase-3-whatsapp-eventos.md`,
> `adr/ADR-006-whatsapp-rabbitmq-idempotencia.md`,
> `adr/ADR-007-lgpd-exportacao-exclusao.md`,
> `apps/api/test/fase-3.e2e.test.ts` e
> `apps/worker/test/whatsapp-inbound.integration.test.ts`.

## Fase 4 — Front-end (implementada; código aprovado com ressalvas)

- [x] Login e sessão em memória com refresh em cookie HttpOnly.
- [x] Lista de contatos com busca e filtros.
- [x] Visão 360° do contato.
- [x] Kanban acessível com alternativa ao arrastar e soltar.
- [x] Inbox em tempo real com anúncios `aria-live`.
- [x] Dashboard, i18n pt-BR e temas claro/escuro.

Evidências: `specs/SPEC-005-fase-4-frontend.md`,
`tasks/TASK-005-01-fase-4-fundacao-web.md`,
`tasks/TASK-005-02-fase-4-contatos-360.md`,
`tasks/TASK-005-03-fase-4-pipeline-inbox-dashboard.md`,
`docs/qa-plan-fase-4.md`, `reviews/VERIFICATION-REPORT-VR-001.md`,
`reviews/REVIEW-001-fase-4.md` e `apps/web/src/**/*.test.tsx`.

O Gate 4 de release foi aprovado por instrução humana em 2026-11-16. A execução
manual com NVDA/VoiceOver e zoom 200% não foi produzida por este agente e
permanece registrada como risco residual em `docs/a11y.md`.

## Fase 5 — Endurecimento e entrega (implementada tecnicamente; Gate 4 aprovado)

- [x] Persisted queries e ajuste de limites/rate limits.
- [x] Benchmark k6 antes/depois do DataLoader com números no README.
- [x] E2E Playwright + axe e testes de segurança finais.
- [x] Modelo STRIDE finalizado e docs/a11y.md com verificação automatizada.
- [x] SBOM, configuração do Dependabot e guia de deploy; primeiro PR do Dependabot pendente.
- [x] README final com resultados.
- [ ] GIF de demonstração.
- [x] Gate 4 humano: aprovado por instrução humana em 2026-11-16; NVDA/VoiceOver e zoom 200% reais não executados (risco residual).

Evidências: `docs/discovery-fase-5.md`,
`specs/SPEC-006-fase-5-endurecimento-entrega.md` (Approved),
`tasks/TASK-006-01-fase-5-endurecimento-graphql.md` (Done),
`tasks/TASK-006-02-fase-5-e2e-a11y-seguranca.md` (Done — Gate 4 aprovado),
`tasks/TASK-006-03-fase-5-desempenho-entrega.md` (Done),
`docs/qa-plan-fase-5.md` (QA-002, Approved) e
`reviews/qa-evidence/QA-EVIDENCE-TASK-006-03.md`.

A Fase 5 está tecnicamente concluída. O Gate 4 de release foi aprovado por
instrução humana em 2026-11-16; os testes manuais de NVDA/VoiceOver e zoom 200%
não foram executados e seguem como risco residual. O próximo passo é a decisão
de release e a aprovação da SPEC-008 para a Fase 6.

---

## Fase 6 — Distribuição local e operação (em andamento)

- [ ] Deploy de referência, staging e pipeline de CD com rollback. — **Cancelado
      em 2026-11-16**: distribuição apenas por git clone.
- [ ] Instalação e validação local via git clone: dependências, infraestrutura,
      migrations, `ADMIN` e smoke tests. — Bootstrap e smoke validados no
      checkout em 2026-11-16; clone limpo pendente de commit.
- [ ] Bootstrap seguro do primeiro `ADMIN` e gerenciamento de segredos.
- [ ] Readiness de PostgreSQL/Redis/RabbitMQ, métricas, tracing, alertas e SLOs.
- [ ] Outbox transacional e replay de DLQ testado.
- [ ] Retenção LGPD, purge de tokens/logs e auditoria.
- [ ] Code splitting por rota e orçamento de bundle.
- [ ] Runbooks, backup/restore, SBOM validado e assinatura de imagens.

Evidências: `docs/discovery-fase-6.md` (Approved),
`specs/SPEC-008-producao-operacao.md` (Approved — reescopo em andamento),
`adr/ADR-010-topologia-deploy.md` (Superseded),
`adr/ADR-013-distribuicao-local-git-clone.md` (Accepted),
`docs/qa-plan-fase-6.md` (QA-003, Draft) e TASKs `TASK-008-01` (Cancelled) e
`TASK-008-02..06` (Planned).

Nenhum item da Fase 6 é implementado antes da revisão da SPEC-008, do QA-003 e
das TASKs sob o modelo de distribuição local; os itens 4 a 8 serão revalidados
nesse reescopo.

---

## Fora de compromisso atual

Datas, provedor de deploy e integrações específicas não estão comprometidos sem
decisão registrada em ADR ou SPEC aprovada.
