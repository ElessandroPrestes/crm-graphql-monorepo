# TASK: Benchmark k6, documentação e entrega

## Metadados

| Campo        | Valor                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| ID           | TASK-006-03                                                                                                 |
| Status       | Planned — aguardando aprovação                                                                              |
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

- [ ] Aprovar SPEC-006, esta TASK e QA-002.
- [ ] Registrar decisões de deploy, metas de k6 e riscos residuais.
- [ ] Implementar e executar o cenário k6 antes/depois do DataLoader.
- [ ] Publicar resultados e metodologia no README.
- [ ] Finalizar STRIDE e `docs/a11y.md`.
- [ ] Gerar SBOM CycloneDX na CI e configurar Dependabot/Renovate.
- [ ] Escrever o guia de deploy e smoke tests.
- [ ] Atualizar README, CHANGELOG e release notes.
- [ ] Rodar gates finais e revisão de release.
- [ ] Atualizar rastreabilidade e registrar evidências.

## Validação

| Critério/risco | Teste, comando ou revisão                 | Evidência esperada                                            |
| -------------- | ----------------------------------------- | ------------------------------------------------------------- |
| AC-615         | `k6 run` nos dois modos + revisão         | Números reproduzíveis e publicados                            |
| AC-616         | Revisão de docs/security, a11y e deploy   | Documentos completos e riscos residuais explícitos            |
| AC-617         | PR de dependência + consulta ao SBOM      | PR verde e SBOM CycloneDX anexado                             |
| AC-618         | Revisão de README/CHANGELOG/release notes | GIF, resultados e 0.3.0-alpha documentados                    |
| AC-620         | Gates finais + CI                         | Lint, typecheck, test, build, schema, audit, E2E e axe verdes |
| AC-619         | Revisão final do Gate 4 da Fase 4         | Aprovações ou exceções registradas                            |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade atualizadas.
- [ ] Limitações e desvios registrados.

## Resultado

- Mudanças feitas: pendente.
- Evidência: pendente.
- Trabalho em aberto ou bloqueios: decisões de provedor de deploy, metas de k6
  e retenção LGPD.
