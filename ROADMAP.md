# Roadmap — Nexo CRM

> **Framework de Governança**: Universal SDD (Spec-Driven Development)
> **Status vigente**: Fases 0, 1 e 2 concluídas; Fase 3 pendente de discovery e SPEC.

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

## Fase 3 — WhatsApp e eventos

- [ ] Porta `WhatsAppProvider` com Mock e Cloud API.
- [ ] Webhook REST com HMAC-SHA256 e limite de corpo.
- [ ] Publicação no RabbitMQ e worker com idempotência.
- [ ] Retentativas com backoff e dead-letter queue.
- [ ] Subscription `messageReceived` e mutation `sendMessage`.
- [ ] Exportação/exclusão de dados de contato.

## Fase 4 — Front-end

- [ ] Login e sessão em memória com refresh em cookie HttpOnly.
- [ ] Lista de contatos com busca e filtros.
- [ ] Visão 360° do contato.
- [ ] Kanban acessível com alternativa ao arrastar e soltar.
- [ ] Inbox em tempo real com anúncios `aria-live`.
- [ ] Dashboard, i18n pt-BR e temas claro/escuro.

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
