# TASK: E2E Playwright, axe e testes de segurança

## Metadados

| Campo        | Valor                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| ID           | TASK-006-02                                                                                                |
| Status       | Planned — aguardando aprovação                                                                             |
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

- [ ] Aprovar SPEC-006, esta TASK e QA-002.
- [ ] Configurar Playwright com Compose/seed e projetos desktop/mobile.
- [ ] Implementar E2E dos fluxos críticos.
- [ ] Integrar axe e falhar em critical/serious.
- [ ] Executar e registrar o checklist manual de acessibilidade.
- [ ] Implementar testes negativos de segurança.
- [ ] Adicionar job e artefatos na CI.
- [ ] Encerrar o Gate 4 da Fase 4 com aprovações ou exceções.
- [ ] Atualizar documentação e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                         | Evidência esperada                              |
| -------------- | ------------------------------------------------- | ----------------------------------------------- |
| AC-610         | `pnpm e2e` em desktop/mobile                      | Fluxos críticos verdes, traces publicados       |
| AC-611         | axe nas páginas principais                        | Zero critical/serious; relatório anexado        |
| AC-612         | Checklist manual em `docs/a11y.md`                | Checklist preenchido com achados e disposição   |
| AC-613         | Suíte de segurança negativa                       | Todas as tentativas negadas sem vazamento       |
| AC-614         | PR com job E2E/axe/segurança                      | Jobs obrigatórios verdes e artefatos publicados |
| AC-619         | Revisão de QA-001/design/a11y e VR-001/REVIEW-001 | Aprovações ou exceções autorizadas registradas  |
| AC-620         | `pnpm lint && typecheck && test && build`         | Gates verdes, sem regressão                     |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade atualizadas.
- [ ] Limitações e desvios registrados.

## Resultado

- Mudanças feitas: pendente.
- Evidência: pendente.
- Trabalho em aberto ou bloqueios: decisões de QA/design/acessibilidade e
  aprovação da TASK.
