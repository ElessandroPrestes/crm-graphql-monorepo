# TASK: Benchmark k6, documentação e entrega

## Metadados

| Campo        | Valor                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| ID           | TASK-006-03                                                                                                 |
| Status       | Done — implementação e validação local; revisão independente e release pendentes (2026-11-13)               |
| Responsável  | Engenharia, QA e Documentação                                                                               |
| Refs:        | SPEC: SPEC-006; Critérios: AC-615, AC-616, AC-617, AC-618, AC-620; ADRs: ADR-003, ADR-005, ADR-006, ADR-007 |
| Dependências | TASK-006-01 e TASK-006-02 concluídas; decisões de deploy, k6 e LGPD registradas                             |

## Objetivo

Comprovar o ganho do DataLoader com k6, finalizar a documentação de segurança,
acessibilidade e deploy, automatizar dependências/SBOM e publicar a entrega
`0.3.0-alpha` com evidências reproduzíveis.

## Escopo

### Incluído

- Cenário k6 versionado comparando DataLoader desligado e ligado.
- Resultados em `docs/performance.md` e README, com ambiente, data, p95,
  throughput e erros.
- STRIDE final e riscos residuais em `docs/security.md`.
- `docs/a11y.md` completo, incluindo checklist manual e resultados axe.
- SBOM CycloneDX na CI e Dependabot ou Renovate para pnpm/Actions.
- Guia de deploy com variáveis, migração, health checks, rollback, backup e
  smoke tests.
- README final com GIF, arquitetura, setup e resultados; CHANGELOG e release
  notes de `0.3.0-alpha`.
- Fechamento dos gates de qualidade e revisão final de release.

### Excluído

- Executar o deploy em produção.
- Aprovar retenção/base legal LGPD.
- Outbox/exactly-once e mídia de WhatsApp.
- Novas funcionalidades de produto.

## Abordagem e impacto

- Prováveis arquivos: `infra/k6/**`, `docs/performance.md`, `docs/security.md`,
  `docs/a11y.md`, `docs/deploy.md`, `README.md`, `CHANGELOG.md`,
  `.github/dependabot.yml`, `.github/workflows/ci.yml`, `package.json`.
- Dados/contratos: nenhuma migração; seed determinístico para benchmark.
- Salvaguardas: benchmark rotulado como ambiente local, sem extrapolar para
  produção; SBOM gerado a partir do lockfile; deploy documentado sem segredos.
- Padrões: `standards/performance.md`, `standards/security.md`,
  `standards/documentation.md`, `standards/quality-gates.md`.

## Etapas

- [x] Aprovar SPEC-006 e QA-002. A aprovação formal desta TASK é humana e não
      pode ser auto-concedida por este agente.
- [x] Registrar decisões de deploy, metas de k6 e riscos residuais.
- [x] Implementar e executar o cenário k6 antes/depois do DataLoader.
- [x] Publicar resultados e metodologia no README.
- [x] Finalizar STRIDE e `docs/a11y.md`.
- [x] Gerar SBOM CycloneDX na CI e configurar Dependabot.
- [x] Escrever o guia de deploy e smoke tests.
- [x] Atualizar README, CHANGELOG e release notes.
- [ ] Rodar gates finais e revisão de release — **gates locais verdes**; revisão
      independente de release pendente de aprovador humano.
- [x] Atualizar rastreabilidade e registrar evidências.

## Validação

| Critério/risco | Teste, comando ou revisão                 | Resultado                                                                                               |
| -------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| AC-615         | `k6 run` nos dois modos + revisão         | Passou: p95 9.494,65 ms → 58,58 ms; throughput 5,69 → 9,91 req/s; zero erros; em `docs/performance.md`  |
| AC-616         | Revisão de docs/security, a11y e deploy   | Passou: STRIDE final, riscos residuais, checklist de a11y e deploy com backup/rollback/smoke tests      |
| AC-617         | PR de dependência + consulta ao SBOM      | Parcial: SBOM CycloneDX 1.6 com 1.119 componentes gerado; primeiro PR do Dependabot aguarda agendamento |
| AC-618         | Revisão de README/CHANGELOG/release notes | Parcial: README, CHANGELOG e release notes completos; GIF de demonstração pendente                      |
| AC-620         | Gates finais + CI                         | Passou local: lint, typecheck, 93 testes, build, format, schema, audit, 43 E2E e 30 varreduras axe      |
| AC-619         | Revisão final do Gate 4 da Fase 4         | Pendente: requer aprovação humana de QA/design/acessibilidade; não auto-concedível                      |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade atualizadas.
- [x] Limitações e desvios registrados.

## Resultado

- Mudanças feitas: cenário k6 com flag `DATALOADER_ENABLED`, seed determinístico
  de benchmark, resultados e limitações em `docs/performance.md`, SBOM CycloneDX
  1.6 com validação, Dependabot semanal, guia de deploy, STRIDE final, checklist
  de acessibilidade ampliado, release notes e versão `0.3.0-alpha`.
- Evidência: `pnpm test:e2e` — 43 testes passaram (6 API, 4 desktop, 4 mobile,
  28 de acessibilidade e 1 setup), 30 varreduras axe sem critical/serious;
  `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`,
  `schema:check`, `pnpm audit --audit-level high` e `pnpm run sbom` verdes em
  2026-11-13. Detalhes em `reviews/qa-evidence/QA-EVIDENCE-TASK-006-03.md`.
- Trabalho em aberto ou bloqueios: aprovação humana do Gate 4, decisão e
  execução do deploy de referência, retenção/base legal LGPD, bootstrap do
  primeiro `ADMIN`, primeiro PR do Dependabot e GIF de demonstração.
