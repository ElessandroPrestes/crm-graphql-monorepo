# Plano de QA — Fase 5: endurecimento e entrega

## Metadados

| Campo                   | Valor                                          |
| ----------------------- | ---------------------------------------------- |
| ID                      | QA-002                                         |
| Status                  | Approved — execução autorizada em 2026-11-13   |
| Responsável (QA owner)  | Engenharia/QA                                  |
| Build/commit            | `0.3.0-alpha` em `develop` (TASK-006-01/02/03) |
| SPEC/design relacionado | SPEC-006; DS-001 (sem nova mudança)            |
| Janela de teste         | Fase 5                                         |

## Escopo e objetivo de qualidade

### No escopo

- Persisted queries em audit/enforce, rate limit de login/GraphQL/WS, limite de
  corpo, política de senha, bloqueio progressivo e sugestões desativadas.
- E2E Playwright em desktop/mobile e axe sem violações críticas/sérias.
- Checklist manual de acessibilidade: teclado, foco, zoom 200%, contraste e
  leitor de tela.
- Segurança negativa: IDOR, token inválido/expirado, reuso de refresh, HMAC,
  WebSocket sem token e bypass de rate limit.
- Benchmark k6 do DataLoader, SBOM, Dependabot/Renovate, guia de deploy,
  README, CHANGELOG e release notes.
- Fechamento do Gate 4 da Fase 4.

### Fora do escopo

- Deploy em produção, outbox/exactly-once, mídia de WhatsApp, analytics e
  aprovação de retenção LGPD.
- Reabertura de requisitos funcionais das Fases 1 a 4.
- Testes em dispositivos físicos.

## Avaliação de risco

| ID    | Risco                                       | Impacto | Probabilidade | Resposta de teste                                   | Responsável          |
| ----- | ------------------------------------------- | ------- | ------------- | --------------------------------------------------- | -------------------- |
| R-501 | Rate limit bloqueia usuário legítimo        | Alto    | Média         | Limites, `Retry-After`, modo audit e teste de carga | Segurança/QA         |
| R-502 | Persisted query rejeita cliente válido      | Alto    | Média         | Audit antes de enforce, allowlist e drift check     | Engenharia/QA        |
| R-503 | Bypass de rate limit por IP/usuário forjado | Alto    | Baixa         | Testes negativos com headers e tokens               | Segurança            |
| R-504 | E2E instável e CI lenta                     | Médio   | Alta          | Retries limitados, job dedicado e artefatos         | QA                   |
| R-505 | axe não cobre estado de erro/empty          | Médio   | Média         | Cenários com falha simulada e dados vazios          | A11y/QA              |
| R-506 | Regressão nas Fases 1 a 4                   | Alto    | Baixa         | Suíte completa, E2E e smoke das APIs                | QA                   |
| R-507 | Benchmark não reproduzível                  | Médio   | Média         | Seed/containers determinísticos e metodologia       | Engenharia/QA        |
| R-508 | Guia de deploy omite rollback               | Médio   | Média         | Revisão de segurança/operação                       | Engenharia/Segurança |
| R-509 | SBOM/Dependabot sem gate                    | Médio   | Baixa         | Job de CI e PR de teste                             | Engenharia           |

## Abordagem de teste

| Área de teste        | Nível/tipo             | Automatizado/manual | Ambiente             | Responsável   | Evidência requerida            |
| -------------------- | ---------------------- | ------------------- | -------------------- | ------------- | ------------------------------ |
| Segurança/abuso      | Integração e negativos | Automatizado        | Local/Testcontainers | Segurança/QA  | Testes verdes e logs sem PII   |
| Persisted queries    | Contrato e drift       | Automatizado        | Local                | Engenharia/QA | Allowlist e drift check        |
| E2E funcional        | Navegador real         | Automatizado        | Compose + seed       | QA            | Playwright verde e traces      |
| Acessibilidade       | axe + checklist manual | Automatizado/manual | Navegador            | A11y/QA       | Relatório sem critical/serious |
| Desempenho           | Carga k6               | Automatizado        | Local determinístico | Engenharia/QA | Relatório p95/throughput/erros |
| Regressão            | API, worker e web      | Automatizado        | Local                | QA            | Suítes verdes                  |
| Entrega/documentação | Revisão                | Manual              | Repositório          | QA/Engenharia | Checklist e release notes      |

## Rastreabilidade dos critérios de aceitação

| Critério | Risco | ID/caminho do teste                           | Caso manual                                        | Evidência/resultado                                                                                                                                                                                      | Defeito/exceção |
| -------- | ----- | --------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| AC-601   | R-502 | `apps/api` — `schema:check` + allowlist       | Revisar allowlist versionada                       | Passou (`schema:check` sem drift)                                                                                                                                                                        | —               |
| AC-602   | R-502 | `apps/api/test/fase-5.e2e.test.ts` — audit    | Query fora da allowlist em audit                   | Passou (integração + unit de log)                                                                                                                                                                        | —               |
| AC-603   | R-502 | `persisted-queries.middleware.test.ts`        | Query fora da allowlist em enforce                 | Passou (unit; sem resolver)                                                                                                                                                                              | —               |
| AC-604   | R-501 | `apps/api/test/fase-5.e2e.test.ts` — login    | Exceder tentativas                                 | Passou (429 + Retry-After)                                                                                                                                                                               | —               |
| AC-605   | R-501 | `password-policy.test.ts` + fase-5 — lockout  | Senha fraca e bloqueio                             | Passou (política + 429 genérico)                                                                                                                                                                         | —               |
| AC-606   | R-501 | `apps/api/test/fase-5.e2e.test.ts` — GraphQL  | Exceder operações autenticado/anônimo              | Passou (429 por usuário)                                                                                                                                                                                 | —               |
| AC-607   | R-503 | `apps/api/test/fase-5.e2e.test.ts` — WS       | Abrir conexões acima do limite                     | Passou (close 4429)                                                                                                                                                                                      | —               |
| AC-608   | R-509 | `apps/api/test/fase-5.e2e.test.ts` — payload  | Enviar corpo grande                                | Passou (413)                                                                                                                                                                                             | —               |
| AC-609   | R-508 | `apps/api/test/fase-5-production.e2e.test.ts` | Introspecção/campo inválido                        | Passou (sem introspecção/sugestão)                                                                                                                                                                       | —               |
| AC-610   | R-504 | `e2e/critical-flow.spec.ts`                   | Login, contato, negócio, kanban, inbox e dashboard | Passou local e CI (desktop + mobile, 4 cenários)                                                                                                                                                         | —               |
| AC-611   | R-505 | `e2e/a11y.spec.ts` + `e2e/a11y/axe.spec.ts`   | Páginas principais, dois temas e estados abertos   | Passou local (30 varreduras, zero critical/serious; 18 em desktop/mobile e 12 na suíte dedicada)                                                                                                         | —               |
| AC-612   | R-505 | Checklist em `docs/a11y.md`                   | Teclado, reflow, contraste e leitor de tela        | Parcial: teclado, reflow (320px), zoom equivalente (640x400) e contraste passaram via axe/Playwright; NVDA/VoiceOver e zoom 200% real pendentes — requerem dispositivo real e aprovador humano no Gate 4 | —               |
| AC-613   | R-503 | `e2e/security.spec.ts`                        | IDOR, tokens, refresh, HMAC, WS e bypass           | Passou (6 testes)                                                                                                                                                                                        | —               |
| AC-614   | R-504 | CI workflow — job `e2e`                       | Abrir PR                                           | Passou (run 43430975275; artefatos publicados)                                                                                                                                                           | —               |
| AC-615   | R-507 | `infra/k6/deals-dataloader.js`                | Executar antes/depois                              | Passou local: p95 de 9.494,65 ms para 58,58 ms; throughput de 5,69 para 9,91 req/s; zero erros                                                                                                           | —               |
| AC-616   | R-508 | Revisão de docs/security, a11y e deploy       | Revisar seções e rollback                          | Passou: STRIDE final, riscos residuais, checklist de a11y e deploy com backup/rollback/smoke tests                                                                                                       | —               |
| AC-617   | R-509 | SBOM + PR de dependência                      | Consultar artefato e PR                            | Parcial: SBOM CycloneDX 1.6 com 1.119 componentes gerado; PR do Dependabot aguarda o agendamento no GitHub                                                                                               | —               |
| AC-618   | R-509 | Revisão de README/CHANGELOG                   | Ver GIF e resultados                               | Parcial: README, CHANGELOG e release notes completos; GIF de demonstração ainda não gravado                                                                                                              | —               |
| AC-619   | R-506 | Revisão de QA-001/design/a11y                 | Comparar com quality gates                         | Pendente (aprovação humana)                                                                                                                                                                              | —               |
| AC-620   | R-506 | Gates locais + CI                             | Executar pipeline                                  | Passou local (lint, typecheck, test, build, format, schema, audit, 43 E2E) e CI anterior verde                                                                                                           | —               |

## Ambiente e dados

- Ambiente e URL/endpoint: local; web `http://localhost:5217`, API
  `http://localhost:3202`.
- Build/commit/configuração: build da Fase 5, seed fictício e
  `WHATSAPP_PROVIDER=mock`.
- Feature flags: `PERSISTED_QUERIES_MODE` (audit/enforce) e limites por env.
- Dependências: PostgreSQL, Redis e RabbitMQ do Compose; Node.js 26.13.0 e
  pnpm 12.18.0; Playwright e k6 em versões fixadas.
- Contas e permissões: um `ADMIN` e dois `SELLER` no seed.
- Dados e privacidade: somente fictícios; recriar banco e seed entre execuções.
- Observabilidade: logs da API/worker; verificar ausência de token, cookie, PII
  e corpo de mensagem.

## Critérios de entrada

- [x] SPEC-006, TASKs e este plano aprovados.
- [x] ADR-009 e decisões de limites/política registradas.
- [x] Ambiente Compose + seed determinístico pronto.
- [x] Playwright 1.65.0, axe 4.14.0 e k6 0.57.0 disponíveis e executados.

## Critérios de saída

- [x] Critérios de aceitação com evidência reproduzível, exceto AC-617 e AC-618
      (parciais por dependência do GitHub e ausência de GIF).
- [x] E2E, axe, segurança, k6 e regressão das fases anteriores passam.
- [x] Nenhum defeito S1/S2 aberto; S3/S4 com disposição.
- [ ] Gate 4 da Fase 4 encerrado.
- [x] Riscos residuais e exceções registrados.

## Defeitos e riscos residuais

| ID  | Severidade | Resumo | Status | Responsável | Disposição para lançamento |
| --- | ---------- | ------ | ------ | ----------- | -------------------------- |
| —   | —          | —      | —      | —           | —                          |

## Exceções de portão

| Portão/verificação | Motivo e impacto | Mitigação/monitoramento | Responsável | Validade | Aprovador |
| ------------------ | ---------------- | ----------------------- | ----------- | -------- | --------- |
| —                  | —                | —                       | —           | —        | —         |

## Resumo do teste e recomendação

- TASK-006-01 implementada e validada localmente.
- TASK-006-02: E2E, axe, segurança negativa e job de CI implementados; 14 testes
  passaram localmente e a CI ficou verde (run 43430975275). Checklist manual de
  acessibilidade parcialmente concluído (teclado, reflow 320px, contraste e
  anúncios validados via automação); NVDA/VoiceOver e zoom 200% pendentes —
  requerem dispositivo real e aprovador humano no Gate 4 da Fase 4.
- TASK-006-03: k6 executado e publicado, SBOM CycloneDX gerado, Dependabot
  configurado, guia de deploy e release notes escritos. A suíte E2E passou com
  43 testes (6 API, 4 desktop, 4 mobile, 28 de acessibilidade e 1 setup) e 30
  varreduras axe sem critical/serious.
- AC-617 e AC-618 permanecem parciais: o primeiro PR do Dependabot depende do
  agendamento no GitHub e o GIF de demonstração não foi gravado.
- Recomendação atual: continuar em `develop`; No-go para release até aprovação
  humana do Gate 4, deploy de referência, retenção/base legal LGPD e bootstrap
  de administrador.
