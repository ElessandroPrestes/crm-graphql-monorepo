# TASK: Runbooks, restore, SBOM e assinatura de imagens

## Metadados

| Campo        | Valor                                                                                |
| ------------ | ------------------------------------------------------------------------------------ |
| ID           | TASK-008-06                                                                          |
| Status       | Planned — aguardando aprovação da SPEC-008 e das decisões de supply chain            |
| Responsável  | Operações/Segurança/QA                                                               |
| SPEC         | SPEC-008                                                                             |
| Critérios    | AC-810                                                                               |
| Dependências | SPEC-008 aprovada; ADR-010 aceito; TASK-008-01..05 concluídas; decisão de assinatura |
| ADRs         | ADR-010 (topologia), ADR-011 (outbox)                                                |

## Objetivo

Fechar a operação da Fase 6 com runbooks executáveis, drill de backup/restore,
validação do SBOM contra o schema CycloneDX, assinatura/verificação de imagens
ou exceção aprovada, e revisão documentada do rate limit de janela fixa.

## Escopo

### Incluído

- Runbooks de incidente, rollback, restore, replay de DLQ, rotação de segredos
  e indisponibilidade de dependências.
- Drill cronometrado de restore com evidência de RPO/RTO.
- Validação do SBOM CycloneDX contra o schema oficial na CI.
- Assinatura de imagens e verificação no deploy, se aprovado; caso contrário,
  exceção formal com mitigação.
- Revisão do rate limit de janela fixa com recomendação e riscos.
- Revisão final de `docs/deploy.md`, `docs/security.md` e `docs/architecture.md`.

### Não incluído

- Implementar deploy/CD, observabilidade, outbox, LGPD ou code splitting; essas
  entregas pertencem às TASK-008-01..05.
- Mudar o algoritmo de rate limit sem SPEC própria.
- HA multi-região, Kubernetes ou troca de provedor sem novo ADR.
- Aprovar juridicamente a retenção LGPD.

## Abordagem e impacto

- Arquivos ou componentes prováveis: `docs/runbooks/**`, `docs/deploy.md`,
  `docs/security.md`, `docs/architecture.md`, `.github/workflows/ci.yml`,
  `scripts/verify-sbom.*`, `scripts/sign-images.*` e `scripts/verify-images.*`.
- Dados, contratos ou migrações: nenhuma migração; possível job de CI e
  política de admissão.
- Riscos e precauções: restore lento, chave de assinatura mal gerida, SBOM
  inválido, runbook desatualizado e exceção sem validade.
- ADRs e padrões aplicáveis: ADR-010, ADR-011, `standards/security.md`,
  `standards/quality-gates.md`.

## Passos

- [ ] Escrever/consolidar runbooks e validar comandos.
- [ ] Executar drill de restore e registrar RPO/RTO.
- [ ] Validar SBOM contra o schema CycloneDX na CI.
- [ ] Implementar assinatura/verificação ou registrar exceção aprovada.
- [ ] Revisar rate limit de janela fixa e registrar recomendação.
- [ ] Revisar documentação final e riscos residuais.
- [ ] Coletar evidências e atualizar rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                                | Evidência esperada                                    |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| AC-810         | Drill de restore, revisão de runbooks, SBOM e assinatura | Restore no RPO/RTO, runbooks executáveis, SBOM válido |
| Supply chain   | Admissão com imagem assinada e não assinada              | Assinatura verificada ou exceção registrada           |
| Operação       | Executar replay de DLQ e rotação de segredo em staging   | Comandos funcionam e são auditados                    |
| Documentação   | Revisão de docs/deploy, security e architecture          | Conteúdo consistente e links válidos                  |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade foram atualizadas.
- [ ] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas:
- Evidências:
- Pendências ou bloqueios:
