# TASK: Deploy de referência, staging, CD e bootstrap de ADMIN

## Metadados

| Campo        | Valor                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| ID           | TASK-008-01                                                                                   |
| Status       | Planned — aguardando aprovação da SPEC-008, do ADR-010 e das decisões humanas                 |
| Responsável  | Operações/Engenharia                                                                          |
| SPEC         | SPEC-008                                                                                      |
| Critérios    | AC-801, AC-802, AC-803                                                                        |
| Dependências | SPEC-008 aprovada; ADR-010 aceito; Gate 4 ou exceção; provedor/domínio/TLS/segredos definidos |
| ADRs         | ADR-010 (topologia, proposta)                                                                 |

## Objetivo

Entregar um ambiente de staging reproduzível e um pipeline de CD que publique
imagens imutáveis por SHA, aplique migrations, execute smoke tests, permita
aprovação manual e rollback, além de criar o primeiro `ADMIN` por comando
seguro e auditável.

## Escopo

### Incluído

- Provisionar staging conforme o ADR-010 aceito, com DNS, TLS, rede privada e
  segredos fora do repositório.
- Configurar registry e pipeline de CD para `api`, `worker` e `web` com tags por
  SHA.
- Job de migrations separado do runtime e executado antes do deploy.
- Smoke tests de login, health, GraphQL, webhook e web.
- Aprovação manual para produção e rollback por SHA.
- Comando idempotente de bootstrap do primeiro `ADMIN`, sem seed, com auditoria
  e senha fora de `argv`/logs.
- Backup inicial do PostgreSQL e configuração de retenção/PITR quando
  disponível.
- Atualizar `docs/deploy.md`, `.env.example` e referências operacionais.

### Não incluído

- Readiness real, métricas, tracing, dashboards e SLOs (TASK-008-02).
- Outbox e replay de DLQ (TASK-008-03).
- Jobs de retenção LGPD (TASK-008-04).
- Code splitting e cache headers do front-end (TASK-008-05).
- Runbooks completos e drill de restore (TASK-008-06).
- HA multi-região, Kubernetes ou mudança de provedor sem novo ADR.

## Abordagem e impacto

- Arquivos ou componentes prováveis: `.github/workflows/cd.yml`,
  `infra/deploy/**`, `scripts/bootstrap-admin.*`, `docs/deploy.md`,
  `.env.example`, `README.md`.
- Dados, contratos ou migrações: nenhuma migração de produto; migrations
  existentes passam a rodar em job dedicado.
- Riscos e precauções: não promover o Compose local; não usar `db:seed` em
  produção; validar rollback e compatibilidade de migrations; não registrar
  segredos.
- ADRs e padrões aplicáveis: ADR-010; `standards/security.md`,
  `standards/quality-gates.md` e `docs/deploy.md`.

## Passos

- [ ] Aceitar ADR-010 e registrar provedor, região, domínio, TLS e política de
      branch/tag.
- [ ] Provisionar staging e configurar DNS, TLS, rede e segredos.
- [ ] Configurar registry e pipeline de CD com imagens por SHA.
- [ ] Adicionar job de migrations e smoke tests.
- [ ] Implementar aprovação manual e rollback por SHA.
- [ ] Implementar bootstrap idempotente do primeiro `ADMIN` com auditoria.
- [ ] Configurar backup e retenção inicial do PostgreSQL.
- [ ] Executar deploy, smoke tests e rollback em staging.
- [ ] Atualizar documentação e evidências.

## Validação

| Critério/risco | Teste, comando ou revisão                              | Evidência esperada                                    |
| -------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| AC-801         | Deploy de staging + smoke tests + rollback ensaiado    | Logs, URLs, `docker compose ps`/status e relatório    |
| AC-802         | Pipeline com aprovação manual e falha simulada         | Run do CD, imagens por SHA e rollback restaurando SHA |
| AC-803         | Criar `ADMIN`, repetir comando e inspecionar logs/argv | Teste automatizado, auditoria e ausência de senha     |
| Segurança      | Revisão de segredos, permissões e exposição de portas  | Checklist e revisão de segurança                      |
| Rollback       | Reverter release e validar smoke tests                 | Evidência de restore da release anterior              |

## Condição de conclusão

- [ ] Escopo implementado sem expansão.
- [ ] Testes e validações aplicáveis passam.
- [ ] Documentação e rastreabilidade foram atualizadas.
- [ ] Limitações e desvios estão registrados.

## Resultado

- Mudanças realizadas:
- Evidências:
- Pendências ou bloqueios:
