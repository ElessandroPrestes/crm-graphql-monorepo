# SPEC: Fase 5 — endurecimento e entrega do Nexo CRM

## Metadados

| Campo             | Valor                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID                | SPEC-006                                                                                                                                               |
| Status            | Approved — execução autorizada em 2026-11-13                                                                                                           |
| Responsável       | Engenharia, QA e Segurança                                                                                                                             |
| Revisores         | Produto / Design / Engenharia / QA / Segurança / Acessibilidade                                                                                        |
| Criado            | 2026-11-13                                                                                                                                             |
| Atualizado        | 2026-11-13                                                                                                                                             |
| Lançamento alvo   | Fase 5 (0.3.0-alpha)                                                                                                                                   |
| Discovery         | `docs/discovery-fase-5.md`                                                                                                                             |
| Plano de QA       | `docs/qa-plan-fase-5.md` (QA-002)                                                                                                                      |
| ADRs relacionadas | ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, ADR-008; ADR-009 a criar para rate limit/persisted queries                                                |
| Refs              | Discovery: `docs/discovery-fase-5.md`; Design: N/A — sem mudança visual aprovada; ADR: ADR-009 (proposta); TASK: TASK-006-01, TASK-006-02, TASK-006-03 |

## Problema e resultado

As Fases 0 a 4 entregaram o produto funcional, mas ainda faltam controles de
produção e evidências de entrega: rate limit, persisted queries, política de
senha, testes E2E no navegador real, axe, benchmark do DataLoader, SBOM,
automação de dependências e guia de deploy. O Gate 4 da Fase 4 também continua
aberto por aprovações de QA, design e acessibilidade.

Resultado esperado: o Nexo CRM fica pronto para uma entrega controlada, com
superfície GraphQL limitada, proteção contra abuso, evidência de acessibilidade
e desempenho, cadeia de suprimentos rastreável, deploy reproduzível e riscos
residuais explícitos. Nenhuma mudança funcional de produto é introduzida além
das correções de baixo impacto já registradas em REVIEW-001.

A execução foi autorizada por instrução direta do solicitante humano em
2026-11-13, após a proposta de discovery, SPEC, QA-002 e TASKs. As decisões
técnicas abertas foram registradas com defaults conservadores em ADR-009 e
continuam sujeitas a revisão antes do release.

## Escopo

### No escopo

- Persisted queries com allowlist, modo audit e modo enforce, integradas ao
  cliente Apollo do front-end.
- Rate limit de login e GraphQL por usuário/IP, com Redis, `429` e
  `Retry-After`; rate limit de handshake WebSocket.
- Limite explícito de corpo para JSON/GraphQL e verificação do limite do
  webhook.
- Política de senha e bloqueio progressivo após tentativas falhas.
- Desativação de sugestões de campo em produção e revisão dos limites de
  profundidade, complexidade e aliases.
- Testes E2E Playwright dos fluxos críticos e axe sem violações críticas ou
  sérias.
- Checklist manual de acessibilidade: teclado, zoom 200%, leitor de tela e
  contraste nos dois temas.
- Testes de segurança negativos: IDOR, token inválido/expirado, reuso de
  refresh, HMAC de webhook, autenticação WebSocket e bypass de rate limit.
- Benchmark k6 comparando DataLoader desligado e ligado, com resultados no
  README.
- STRIDE final, `docs/a11y.md` completo, SBOM CycloneDX, Dependabot ou
  Renovate, guia de deploy com rollback, release notes e README final.
- Fechamento do Gate 4 da Fase 4 (QA-001, design e acessibilidade).

### Fora do escopo

- Outbox transacional, exactly-once e entrega durável de subscriptions.
- Mídia, templates, status de entrega/leitura e presença no WhatsApp.
- Execução de deploy em produção; apenas o guia e os smoke tests são entregues.
- Aprovar retenção/base legal LGPD.
- Analytics, telemetria de produto ou rastreamento de usuários.
- Reabrir requisitos funcionais das Fases 1 a 4.
- Code splitting por rota, salvo se aprovado como item adicional desta SPEC.

## Comportamento funcional

### Persisted queries

- O servidor mantém uma allowlist versionada de operações geradas pelo codegen.
- Em `PERSISTED_QUERIES_MODE=audit`, queries não registradas executam e geram
  log/métrica; em `enforce`, são rejeitadas com `PERSISTED_QUERY_NOT_FOUND`.
- O cliente envia `sha256Hash`; se o servidor não encontrar a operação e o modo
  permitir, a query completa pode ser registrada apenas em desenvolvimento.
- A allowlist é publicada junto com o build e coberta por drift check na CI.

### Rate limit e autenticação

- Login: janela e limite por IP e por e-mail normalizado; excedente retorna
  `429` com `Retry-After` e não revela existência da conta.
- GraphQL HTTP: limite por usuário autenticado; fallback por IP para
  requisições anônimas; operações de escrita podem ter limite mais restrito.
- WebSocket: handshake limitado por IP e por usuário; conexões acima do limite
  recebem fechamento com código apropriado.
- Falhas de login incrementam contador progressivo; após o limite, a conta
  entra em bloqueio temporário com mensagem genérica e auditável.
- Senhas novas exigem comprimento mínimo, e o hash continua argon2id. A
  política exata é decidida em ADR-009 e refletida no seed/documentação.

### Limites de requisição

- JSON/GraphQL têm limite de corpo explícito e configurável; payload acima do
  limite retorna `413` antes da execução.
- O webhook REST mantém corpo bruto e limite próprio; a assinatura HMAC é
  validada antes do processamento.
- Profundidade, complexidade e aliases continuam limitados; os valores são
  revisados com evidência de carga e registrados em ADR-009.

### E2E, acessibilidade e segurança

- Playwright cobre login, criação de contato, criação de negócio, movimento no
  kanban, inbox e dashboard em desktop e mobile emulado.
- axe roda nas mesmas páginas e falha a CI em violações críticas ou sérias.
- O checklist manual registra teclado, foco, zoom 200%, contraste nos dois
  temas e leitor de tela (NVDA ou VoiceOver).
- Testes negativos cobrem IDOR entre dois usuários, token inválido/expirado,
  reuso de refresh, HMAC inválido, WebSocket sem token e rate limit.

### Desempenho e entrega

- k6 executa o mesmo cenário com DataLoader desligado e ligado, usando seed
  determinístico; o README registra ambiente, data, p95, throughput e erros.
- SBOM CycloneDX é gerado na CI e anexado ao run; Dependabot ou Renovate abre
  PRs agrupados e a CI valida cada atualização.
- O guia de deploy cobre variáveis, migração, health checks, rollback, backup e
  smoke tests; o provedor é uma decisão registrada em ADR.
- README final inclui GIF, arquitetura, setup, resultados de desempenho e
  acessibilidade; CHANGELOG e release notes descrevem `0.3.0-alpha`.

## Requisitos não-funcionais

- Segurança e privacidade: nenhum token, cookie, PII ou corpo de mensagem em
  logs; rate limit e persisted queries não enfraquecem RBAC; HMAC obrigatório.
- Desempenho e capacidade: p95 do cenário k6 definido em QA-002; rate limit
  não adiciona mais de 20 ms p95 no caminho autenticado local.
- Confiabilidade e recuperação: falha do Redis degrada rate limit de forma
  segura (fail-closed em login, fail-open controlado em leitura) e é
  observável; health check de dependências críticas.
- Acessibilidade: WCAG 2.2 AA; nenhuma violação crítica/séria no axe; foco,
  teclado, zoom e contraste verificados manualmente.
- Compatibilidade: Chrome, Firefox, Edge e Safari nas duas últimas versões;
  mobile emulado 375/320 px; Node.js 26.13.0 e pnpm 12.18.0.
- Observabilidade: métricas de rate limit, persisted queries, erros GraphQL e
  latência; logs estruturados com correlation id.

## Critérios de aceitação

### AC-601

```yaml
id: AC-601
title: Persisted queries são registradas, versionadas e verificadas contra drift
preconditions:
  - Codegen gera operações tipadas e allowlist a partir do schema aprovado
action: Executar o build e o check de drift na CI
expected_result: A allowlist corresponde às operações do cliente; operação ausente ou alterada falha o gate
evidence_type: automated
```

### AC-602

```yaml
id: AC-602
title: Modo audit permite e registra query não persistida
preconditions:
  - PERSISTED_QUERIES_MODE=audit
action: Enviar uma query válida fora da allowlist
expected_result: A query executa e gera log/métrica de operação não persistida
evidence_type: automated
```

### AC-603

```yaml
id: AC-603
title: Modo enforce rejeita query fora da allowlist
preconditions:
  - PERSISTED_QUERIES_MODE=enforce
action: Enviar uma query válida fora da allowlist
expected_result: A resposta falha com código PERSISTED_QUERY_NOT_FOUND e não executa resolvers
evidence_type: automated
```

### AC-604

```yaml
id: AC-604
title: Rate limit de login responde 429 com Retry-After
preconditions:
  - Limite de login configurado e Redis disponível
action: Exceder o limite de tentativas por IP e por e-mail
expected_result: A resposta é 429 com Retry-After; a mensagem não revela existência da conta
evidence_type: automated
```

### AC-605

```yaml
id: AC-605
title: Bloqueio progressivo e política de senha protegem a conta
preconditions:
  - Política e limiar definidos em ADR-009
action: Exceder tentativas falhas e tentar cadastrar senha fora da política
expected_result: A conta bloqueia temporariamente; senha fraca é rejeitada com mensagem acionável
evidence_type: automated
```

### AC-606

```yaml
id: AC-606
title: GraphQL é limitado por usuário e IP
preconditions:
  - Usuário autenticado e requisição anônima disponíveis
action: Exceder o limite de operações GraphQL
expected_result: A resposta é 429 com Retry-After; o limite autenticado é por usuário e o anônimo é por IP
evidence_type: automated
```

### AC-607

```yaml
id: AC-607
title: Handshake WebSocket é limitado
preconditions:
  - Limite de conexões configurado
action: Abrir conexões acima do limite por IP/usuário
expected_result: O servidor fecha as conexões excedentes com código observável e registra o evento
evidence_type: automated
```

### AC-608

```yaml
id: AC-608
title: Corpo acima do limite é rejeitado com 413
preconditions:
  - Limite de corpo configurado
action: Enviar payload JSON/GraphQL acima do limite
expected_result: A resposta é 413 antes da execução; o webhook mantém seu limite próprio
evidence_type: automated
```

### AC-609

```yaml
id: AC-609
title: Produção desativa introspecção e sugestões de campo
preconditions:
  - NODE_ENV=production
action: Consultar introspecção e enviar campo inválido
expected_result: Introspecção é negada e a resposta não sugere campos alternativos
evidence_type: automated
```

### AC-610

```yaml
id: AC-610
title: E2E Playwright cobre os fluxos críticos
preconditions:
  - Ambiente Compose com seed fictício e API/worker/web ativos
action: Executar a suíte E2E em desktop e mobile emulado
expected_result: Login, contato, negócio, kanban, inbox e dashboard passam sem erro
evidence_type: automated
```

### AC-611

```yaml
id: AC-611
title: axe não encontra violações críticas ou sérias
preconditions:
  - Páginas principais servidas no ambiente E2E
action: Executar axe nas páginas do fluxo crítico
expected_result: Zero violações critical/serious; relatório fica anexado à CI
evidence_type: accessibility
```

### AC-612

```yaml
id: AC-612
title: Checklist manual de acessibilidade é concluído
preconditions:
  - Build da Fase 5 disponível
action: Verificar teclado, foco, zoom 200%, contraste nos dois temas e leitor de tela
expected_result: Checklist em docs/a11y.md preenchido, com achados e disposição
evidence_type: accessibility
```

### AC-613

```yaml
id: AC-613
title: Testes de segurança negativos passam
preconditions:
  - Dois usuários SELLER e um ADMIN no seed
action: Executar IDOR, token inválido/expirado, reuso de refresh, HMAC inválido, WS sem token e bypass de rate limit
expected_result: Todas as tentativas são negadas sem vazamento de dados ou detalhes internos
evidence_type: automated
```

### AC-614

```yaml
id: AC-614
title: CI executa E2E, axe, segurança e SBOM
preconditions:
  - Workflow de CI atualizado
action: Abrir PR com mudança de aplicação
expected_result: Jobs obrigatórios passam; artefatos de axe, Playwright e SBOM são publicados
evidence_type: automated
```

### AC-615

```yaml
id: AC-615
title: Benchmark k6 comprova o efeito do DataLoader
preconditions:
  - Seed determinístico e cenário k6 versionado
action: Executar o cenário com DataLoader desligado e ligado
expected_result: Relatório registra ambiente, data, p95, throughput e erros; README publica os números
evidence_type: other
```

### AC-616

```yaml
id: AC-616
title: STRIDE, a11y e guia de deploy estão completos
preconditions:
  - Decisões de provedor e riscos residuais registradas
action: Revisar docs/security.md, docs/a11y.md e docs/deploy.md
expected_result: Documentos cobrem ameaças, controles, riscos residuais, checklist a11y e rollback
evidence_type: manual
```

### AC-617

```yaml
id: AC-617
title: Dependências e SBOM são automatizados
preconditions:
  - Dependabot ou Renovate habilitado
action: Abrir atualização de dependência e consultar o SBOM
expected_result: PR agrupado passa na CI; SBOM CycloneDX lista componentes e versões
evidence_type: automated
```

### AC-618

```yaml
id: AC-618
title: README, CHANGELOG e release notes refletem a entrega
preconditions:
  - Resultados de E2E, a11y e k6 disponíveis
action: Revisar README, CHANGELOG e release notes
expected_result: GIF, arquitetura, setup, resultados e riscos publicados; versão 0.3.0-alpha documentada
evidence_type: manual
```

### AC-619

```yaml
id: AC-619
title: Gate 4 da Fase 4 é encerrado
preconditions:
  - REVIEW-001, QA-001 e revisões de design/acessibilidade disponíveis
action: Comparar aprovações e evidências com standards/quality-gates.md
expected_result: Aprovações humanas ou exceções autorizadas registradas; nenhum bloqueio aberto
evidence_type: manual
```

### AC-620

```yaml
id: AC-620
title: Gates de qualidade permanecem verdes
preconditions:
  - Ambiente e dependências instalados
action: Executar lint, typecheck, test, build, schema check, audit high, E2E e axe
expected_result: Todos os gates passam sem drift de schema ou regressão nas Fases 1 a 4
evidence_type: automated
```

## Abordagem técnica

- API: middleware/guard de rate limit com Redis (janela deslizante ou token
  bucket), chaves por usuário/IP/e-mail; `express.json` com limite explícito;
  configuração de `graphql-armor` ou equivalentes para sugestões/introspecção.
- Persisted queries: gerar allowlist a partir do codegen do
  `@nexo/graphql-schema`, publicar com o build da API e validar no
  `ApolloDriver`; cliente Apollo envia hash e fallback controlado por ambiente.
- Autenticação: contadores de falha no Redis, bloqueio temporário e política de
  senha validada por Zod; argon2id permanece.
- E2E: Playwright com `webServer`/Compose, projetos desktop/mobile e
  `@axe-core/playwright`; artefatos de trace, screenshot e relatório.
- k6: script versionado em `infra/k6`, seed determinístico, execução manual ou
  job opcional, resultados em `docs/performance.md` e README.
- Entrega: SBOM CycloneDX no CI, Dependabot para pnpm/Actions, guia de deploy
  agnóstico com seções por provedor, release notes e smoke tests.
- ADR-009 registra decisões de rate limit, persisted queries, política de senha
  e limites. Nenhuma migração de banco é necessária além de possíveis índices
  para rate limit (Redis) — dados de contato permanecem inalterados.

## Entrega e operações

- Plano de implantação: ativar persisted queries em audit, observar por uma
  janela, mudar para enforce; rate limit entra com limites conservadores e
  revisão após carga.
- Plano de migração: nenhuma migração Prisma prevista; seed e allowlist são
  versionados. Se houver índice, migration aditiva com rollback documentado.
- Plano de rollback: desligar enforce via env, remover rate limit por flag,
  reverter allowlist para a versão anterior e restaurar o build anterior.
- Monitoramento e alertas: métricas de 429, erros de persisted query, falhas de
  Redis, latência GraphQL/WS e taxa de bloqueio de login.

## Riscos e dependências

| Risco ou dependência                                 | Impacto | Probabilidade | Mitigação                                                        | Responsável          |
| ---------------------------------------------------- | ------- | ------------- | ---------------------------------------------------------------- | -------------------- |
| Rate limit bloquear usuários legítimos               | Alto    | Média         | Modo audit, limites conservadores, `Retry-After` e monitoramento | Segurança/Engenharia |
| Persisted queries quebrarem clientes antigos         | Alto    | Média         | Audit antes de enforce e allowlist versionada                    | Engenharia           |
| Redis indisponível                                   | Alto    | Média         | Fail-closed em login, fail-open controlado em leitura, alerta    | Engenharia           |
| E2E instável ou lento na CI                          | Médio   | Alta          | Retries controlados, artefatos e execução em job dedicado        | QA                   |
| Provedor de deploy indefinido                        | Médio   | Alta          | Guia agnóstico + decisão em ADR antes do smoke                   | Produto/Engenharia   |
| Retenção/base legal LGPD não aprovadas               | Alto    | Alta          | Não usar dados reais; bloquear release com dados reais           | Produto/Jurídico     |
| k6 sem ambiente representativo                       | Médio   | Média         | Documentar limitações e usar seed/containers determinísticos     | Engenharia/QA        |
| Dependências com advisories moderadas em ferramentas | Baixo   | Média         | Dependabot/Renovate e revisão contínua                           | Engenharia           |

## Questões abertas

| Questão                                       | Responsável          | Data limite                           | Resolução                                                                                                                      |
| --------------------------------------------- | -------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Qual provedor/topologia de deploy será usado? | Produto/Engenharia   | Antes da TASK-006-03                  | Pendente                                                                                                                       |
| Persisted queries: audit por quanto tempo?    | Engenharia/Segurança | Antes da implementação                | Assumido: `audit` em dev/teste, `enforce` habilitável por env em produção (ADR-009); janela de observação a validar no release |
| Limites exatos de login/GraphQL/WS?           | Segurança/Produto    | Antes da implementação                | Assumido em ADR-009: login 10/15 min por IP+e-mail, GraphQL 120/min por usuário e 30/min por IP anônimo, WS 10/min por IP      |
| Política de senha e duração do bloqueio?      | Produto/Segurança    | Antes da implementação                | Assumido em ADR-009: mínimo 12 caracteres; bloqueio progressivo de 15 min após 5 falhas, com contador Redis                    |
| Metas de p95/erro/throughput do k6?           | Engenharia/QA        | Antes do benchmark                    | Pendente                                                                                                                       |
| Retenção/base legal LGPD?                     | Produto/Jurídico     | Antes de qualquer uso com dados reais | Pendente                                                                                                                       |
| Code splitting entra nesta fase?              | Engenharia           | Antes da TASK-006-03                  | Pendente                                                                                                                       |

## Aprovação

| Papel          | Nome                           | Decisão  | Data       | Notas                                                                |
| -------------- | ------------------------------ | -------- | ---------- | -------------------------------------------------------------------- |
| Produto        | Solicitante humano (instrução) | Approved | 2026-11-13 | Autorizou seguir para a Fase 5 e continuar a execução na `develop`.  |
| Design         | Solicitante humano (instrução) | N/A      | 2026-11-13 | Sem mudança visual nova; revisão de design da Fase 4 segue pendente. |
| Engenharia     | Solicitante humano (instrução) | Approved | 2026-11-13 | Implementação inicia por TASK-006-01.                                |
| QA             | Solicitante humano (instrução) | Ready    | 2026-11-13 | QA-002 aceito para execução; resultados serão registrados.           |
| Segurança      | Solicitante humano (instrução) | Approved | 2026-11-13 | Defaults de ADR-009 assumidos; revisão antes do release.             |
| Acessibilidade | Solicitante humano (instrução) | Approved | 2026-11-13 | Verificação de implementação ocorre em TASK-006-02.                  |
