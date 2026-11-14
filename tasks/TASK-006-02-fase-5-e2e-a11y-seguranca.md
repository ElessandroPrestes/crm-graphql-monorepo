# TASK: E2E Playwright, axe e testes de segurança

## Metadados

| Campo        | Valor                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| ID           | TASK-006-02                                                                                                |
| Status       | In progress — automação/CI e checklist parcial; revisão manual e Gate 4 pendentes (2026-11-13)             |
| Responsável  | QA, Engenharia e Acessibilidade                                                                            |
| Refs:        | SPEC: SPEC-006; Critérios: AC-610, AC-611, AC-612, AC-613, AC-614, AC-620; ADRs: ADR-004, ADR-005, ADR-006 |
| Dependências | TASK-006-01 concluída para testes de rate limit; Compose e seed determinísticos                            |

## Objetivo

Provar no navegador real que os fluxos críticos, a acessibilidade e os controles
de segurança funcionam, com falhas bloqueando a CI.

## Escopo

### Incluído

- Playwright para login, contato, negócio, kanban, inbox e dashboard em desktop
  e mobile emulado.
- `@axe-core/playwright` nas páginas principais, sem violações críticas/sérias.
- Checklist manual de teclado, foco, zoom 200%, contraste e leitor de tela.
- Testes negativos de IDOR, token inválido/expirado, reuso de refresh, HMAC,
  WebSocket sem token e bypass de rate limit.
- Job de CI com artefatos de trace, screenshot, relatório axe e resultados.
- Fechamento do Gate 4 da Fase 4 com QA-001, design e acessibilidade.

### Excluído

- Benchmark k6 e documentação de entrega (TASK-006-03).
- Novas telas ou mudanças funcionais.
- Testes em dispositivos físicos.

## Abordagem e impacto

- Prováveis arquivos: `e2e/**`, `playwright.config.ts`, `.github/workflows/ci.yml`,
  `package.json`, `docs/a11y.md`, `reviews/**`, `docs/qa-plan-fase-5.md`.
- Dados/contratos: seed fictício com um `ADMIN` e dois `SELLER`; nenhuma
  migração.
- Salvaguardas: retries limitados, isolamento por banco/tenant, nenhum dado
  real, artefatos com retenção curta.
- Padrões: `standards/testing.md`, `standards/accessibility.md`,
  `standards/security.md`, `docs/qa-plan-fase-5.md`.

## Etapas

- [x] Aprovar SPEC-006, esta TASK e QA-002 (instrução humana de 2026-11-13).
- [x] Configurar Playwright com Compose/seed e projetos desktop/mobile.
- [x] Implementar E2E dos fluxos críticos.
- [x] Integrar axe e falhar em critical/serious.
- [x] Executar e registrar o checklist manual de acessibilidade (teclado,
      reflow e contraste automatizados; NVDA/VoiceOver e zoom 200% pendentes —
      requerem dispositivo real e aprovador humano no Gate 4).
- [x] Implementar testes negativos de segurança.
- [x] Adicionar job e artefatos na CI.
- [ ] Encerrar o Gate 4 da Fase 4 com aprovações ou exceções. — **pendente**;
      requer aprovador humano (QA-001, design e acessibilidade). Este agente não
      pode auto-conceder aprovações independentes.
- [x] Atualizar documentação e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                         | Evidência esperada                                                                                        |
| -------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| AC-610         | `pnpm e2e` em desktop/mobile                      | Fluxos críticos verdes, traces publicados                                                                 |
| AC-611         | axe nas páginas principais                        | Zero critical/serious; relatório anexado                                                                  |
| AC-612         | Checklist manual em `docs/a11y.md`                | Parcial: teclado/reflow/contraste concluídos; NVDA/VoiceOver e zoom 200% pendentes de aprovador humano    |
| AC-613         | Suíte de segurança negativa                       | Todas as tentativas negadas sem vazamento                                                                 |
| AC-614         | PR com job E2E/axe/segurança                      | Jobs obrigatórios verdes e artefatos publicados                                                           |
| AC-619         | Revisão de QA-001/design/a11y e VR-001/REVIEW-001 | **Pendente:** requer aprovador humano (QA/design/a11y) — este agente não concede aprovações independentes |
| AC-620         | `pnpm lint && typecheck && test && build`         | Gates verdes, sem regressão                                                                               |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade atualizadas.
- [ ] Limitações e desvios registrados.

## Resultado

- Mudanças feitas: `playwright.config.ts` com projetos `desktop-chromium`,
  `mobile-chromium` e `api-security`; `e2e/` com fluxo crítico, axe, segurança
  negativa, autenticação, limpeza de rate limit e setup global; scripts
  `e2e*`/`test:e2e`; job `e2e` no workflow de CI com artefatos Playwright;
  regiões roláveis com `tabIndex=0` e rótulo; links do inbox sem `aria-label`
  divergente; `DashboardMetricsDocument` tipado em `refetchQueries`.
  Checklist manual de acessibilidade parcialmente concluído: teclado, reflow
  320px e contraste validados via automação; NVDA/VoiceOver e zoom 200%
  pendentes de dispositivo real e aprovador humano.
- Evidência: `pnpm e2e` — 14 testes passaram localmente em 2026-11-13
  (4 desktop, 4 mobile, 6 API), incluindo 18 varreduras axe sem critical/serious.
  Commit `f830704` e CI run `43430975275` verdes em `Quality gates`, `E2E and
accessibility`, `Security scans` e `CodeQL`, com artefatos Playwright
  publicados. `docs/a11y.md` e `docs/qa-plan-fase-5.md` atualizados.
- Trabalho em aberto ou bloqueios: revisão manual com NVDA/VoiceOver, zoom 200%
  e aprovação humana do Gate 4 (QA-001/design/acessibilidade). Nenhuma dessas
  aprovações pode ser concedida por este agente (conflito de papel).
