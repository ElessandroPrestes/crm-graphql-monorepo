# TASK: Code splitting, orçamento de bundle e cache headers

## Metadados

| Campo        | Valor                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| ID           | TASK-008-05                                                                        |
| Status       | Planned — SPEC-008 aprovada; aguardando orçamento de bundle e aprovação desta TASK |
| Responsável  | Engenharia/A11y                                                                    |
| SPEC         | SPEC-008                                                                           |
| Critérios    | AC-809                                                                             |
| Dependências | SPEC-008 revisada; baseline e orçamento de bundle aprovados                        |
| ADRs         | ADR-008 (frontend/Apollo), ADR-013 (distribuição local)                            |

## Objetivo

Reduzir o bundle inicial com code splitting por rota, preservar acessibilidade e
comportamento das telas existentes, aplicar cache headers para assets
versionados e impedir regressões com um orçamento verificado na CI.

## Escopo

### Incluído

- Baseline de bundle e orçamento aprovado.
- `React.lazy`/`Suspense` por rota com fallback acessível.
- Separação de chunks por rota e vendor quando justificada por medição.
- Check de orçamento no build/CI.
- Cache headers no Nginx para assets versionados e HTML sem cache agressivo.
- Testes de navegação, foco, anúncios de rota, E2E e axe.
- Atualização de `docs/performance.md` e `docs/architecture.md`.

### Não incluído

- Novas telas, mudança de fluxo ou design system.
- Mudança de API/GraphQL ou de dados.
- Deploy e infraestrutura (TASK-008-01).
- Observabilidade de backend (TASK-008-02).
- Outbox e LGPD (TASK-008-03/04).
- Reescrita do roteador ou troca de framework.

## Abordagem e impacto

- Arquivos ou componentes prováveis: `apps/web/src/App.tsx`,
  `apps/web/src/**/page.tsx`, `apps/web/vite.config.ts`,
  `infra/nginx.conf`, `scripts/check-bundle-size.*`, testes E2E e
  `docs/performance.md`.
- Dados, contratos ou migrações: nenhuma migração; novo check de build.
- Riscos e precauções: fallback visível sem design aprovado, perda de foco,
  chunk quebrado em deploy, cache de HTML e regressão de a11y.
- ADRs e padrões aplicáveis: ADR-008, `standards/performance.md`,
  `standards/accessibility.md` e `standards/design-system.md`.

## Passos

- [ ] Registrar baseline e aprovar orçamento de bundle.
- [ ] Converter rotas para `React.lazy`/`Suspense`.
- [ ] Ajustar chunks de vendor conforme medição.
- [ ] Implementar check de orçamento na CI.
- [ ] Configurar cache headers no Nginx.
- [ ] Executar E2E/axe e validar foco/anúncios.
- [ ] Medir bundle final e atualizar documentação.

## Validação

| Critério/risco | Teste, comando ou revisão                              | Evidência esperada                                   |
| -------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| AC-809         | Build, navegação por rotas e medição do bundle inicial | Chunks separados, orçamento atendido e cache headers |
| A11y           | E2E, axe e teclado em todas as rotas                   | Sem violações críticas/sérias e foco preservado      |
| Regressão      | Suíte E2E e unitária do web                            | Fluxos da Fase 4/5 verdes                            |
| Cache          | Inspecionar headers de assets e HTML                   | Assets imutáveis; HTML sem cache agressivo           |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade foram atualizadas.
- [ ] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas:
- Evidências:
- Pendências ou bloqueios:
