# Roadmap — Nexo CRM

> **Framework de Governança**: Universal SDD (Spec-Driven Development)
> **Status vigente**: Fase 0 concluída; Fase 1 pendente de discovery e SPEC.

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

## Fase 1 — Domínio e API núcleo

- [ ] Discovery de produto/UX e base legal de dados pessoais (LGPD).
- [ ] Modelo Prisma, migrations e seed fictício.
- [ ] Autenticação com argon2id, JWT curto e refresh rotativo.
- [ ] RBAC com checagem de propriedade e testes negativos entre usuários.
- [ ] CRUD de contatos e empresas com paginação por cursor.
- [ ] Schema GraphQL code-first, codegen e verificação de drift.
- [ ] DataLoader e teste que afirma o número de queries da visão 360°.
- [ ] Limites de profundidade, complexidade e aliases.

## Fase 2 — Funil e dashboard

- [ ] Negociações com etapas e concorrência otimista (`version`).
- [ ] Linha do tempo de atividades.
- [ ] Subscription `dealMoved` via Redis pub/sub e autorização.
- [ ] `dashboardMetrics` com cache Redis e invalidação por evento.

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
