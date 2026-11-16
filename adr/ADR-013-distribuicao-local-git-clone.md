# ADR-013: Distribuição via git clone e execução local

## Metadados

| Campo                     | Valor                                                           |
| ------------------------- | --------------------------------------------------------------- |
| Status                    | Accepted — instrução direta do solicitante humano em 2026-11-16 |
| Data                      | 2026-11-16                                                      |
| Responsáveis              | Engenharia e Produto                                            |
| SPEC relacionada          | SPEC-008 (reescopo)                                             |
| Substitui/substituída por | Substitui o ADR-010                                             |

## Contexto

O projeto é um portfólio pessoal. Quem deseja avaliá-lo clona o repositório e
executa localmente; não existe ambiente hospedado, staging, produção, provedor
de nuvem, domínio, TLS público, teto de custo ou serviço gerenciado a contratar.
O ADR-010 foi aceito sob a premissa de uma topologia hospedada e essa premissa
não vale mais.

## Decisão

- A distribuição oficial é **git clone** do repositório. Não há pacote npm,
  tarball de release, imagens publicadas em registry ou instalação gerenciada.
- O fluxo oficial de execução local é o já documentado no `README.md`:
  `pnpm install --frozen-lockfile`, `pnpm infra:up` e `pnpm dev`; a stack
  completa em containers continua disponível por `make up`.
- Não há staging nem produção hospedados, DNS/TLS públicos, pipeline de CD para
  provedor, aprovação manual de produção ou rollback por SHA em servidor.
- A CI existente continua validando build, testes, E2E, SBOM e qualidade em cada
  push e pull request.
- Tags e versões continuam marcando releases do código; elas não disparam
  deploy.
- O bootstrap do primeiro `ADMIN`, migrations, backup/restore e smoke tests
  passam a ser validados no ambiente local do usuário, não em servidor remoto.

## Consequências

- TASK-008-01 (deploy de staging, CD e bootstrap em servidor) é cancelada e
  deve ser substituída por uma tarefa de instalação e validação local.
- Itens da SPEC-008 que dependiam de hospedagem — provedor, região, domínio,
  TLS, serviços gerenciados, CD e SLOs de produção — saem do escopo.
- Outbox, retenção LGPD, performance/code splitting, SBOM e runbooks locais
  continuam candidatos, sujeitos à revisão da SPEC-008.
- O `docs/deploy.md` deixa de ser caminho oficial e passa a referência
  histórica/opcional de self-hosting.

## Evidências e validação

- Instrução humana de 2026-11-16: distribuição apenas por git clone, sem
  provedor, domínio ou teto de custo.
- O `README.md` e o `Makefile` já descrevem o fluxo local que passa a ser o
  caminho oficial.
