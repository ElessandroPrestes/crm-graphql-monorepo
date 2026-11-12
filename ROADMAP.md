# Roadmap — Nexo CRM

> **Framework de Governança**: Universal SDD (Spec-Driven Development)
> **Status vigente**: Fases 0 a 4 implementadas; revisão e QA final pendentes.

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

## Fase 4 — Front-end (implementada, em revisão)

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
`docs/qa-plan-fase-4.md` e `apps/web/src/**/*.test.tsx`.

## Fase 5 — Endurecimento e entrega

- [ ] Persisted queries e ajuste de limites/rate limits.
- [ ] Benchmark k6 antes/depois do DataLoader com números no README.
- [ ] E2E Playwright + axe e testes de segurança finais.
- [ ] Modelo STRIDE finalizado e docs/a11y.md completo.
- [ ] SBOM, Dependabot/Renovate e guia de deploy.
- [ ] README final com GIF e resultados.

---

## Fora de compromisso atual

Datas, provedor de deploy e integrações específicas não estão comprometidos sem
decisão registrada em ADR ou SPEC aprovada.
