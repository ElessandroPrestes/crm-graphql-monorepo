# Discovery — Fase 5: endurecimento e entrega

## Metadados

| Campo       | Valor                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Status      | Aprovado — execução autorizada em 2026-11-13                                                       |
| Responsável | Engenharia, QA e Segurança                                                                         |
| Criado      | 2026-11-13                                                                                         |
| Atualizado  | 2026-11-13                                                                                         |
| SPEC alvo   | SPEC-006                                                                                           |
| Fontes      | `PROJECT.md`, `ROADMAP.md`, `docs/security.md`, `docs/architecture.md`, `docs/a11y.md`, REVIEW-001 |

## Fatos conhecidos

- As Fases 0 a 4 entregaram monorepo, API GraphQL, autenticação, funil,
  atividades, WhatsApp, LGPD e o front-end completo, com gates automatizados
  verdes em `main` e `develop`.
- O Gate 3 da Fase 4 foi aprovado (VR-001, 24/24 critérios verificados) e o
  código recebeu REVIEW-001 com ressalvas.
- A CI executa lint, typecheck, testes, build, `pnpm audit --audit-level high`,
  gitleaks, Trivy e CodeQL.
- O schema GraphQL já limita profundidade (10), complexidade (1000) e aliases
  (10); a introspection é desativada em produção.
- O login é REST; GraphQL e subscriptions usam `/graphql`. A sessão usa access
  token JWT curto em memória e refresh opaco em cookie `HttpOnly`.
- Não há rate limit de login ou GraphQL, persisted queries, política de senha,
  bloqueio progressivo, sugestões de campo desativadas explicitamente, SBOM,
  Dependabot/Renovate, guia de deploy ou E2E Playwright/axe.
- O benchmark k6 do DataLoader nunca foi executado; o bundle principal tem
  ~708 kB e code splitting por rota continua pendente.
- O README atual descreve o projeto, mas não traz GIF, números de benchmark ou
  resultados de acessibilidade.
- LGPD: exportação e exclusão estão prontas; retenção e base legal ainda não
  foram aprovadas por Produto/Jurídico.

## Lacunas e riscos

| Lacuna atual                                  | Risco                                                 | Impacto | Fase |
| --------------------------------------------- | ----------------------------------------------------- | ------- | ---- |
| Sem rate limit de login/GraphQL               | Força bruta, credential stuffing e abuso de queries   | Alto    | 5    |
| Sem persisted queries                         | Queries arbitrárias e custo imprevisível em produção  | Médio   | 5    |
| Sem política de senha e bloqueio progressivo  | Contas fracas e tentativas ilimitadas                 | Médio   | 5    |
| Sem limite explícito de corpo no GraphQL      | Payload grande consome memória antes da validação     | Médio   | 5    |
| Sem E2E/axe no navegador real                 | Regressões de fluxo, foco, contraste e responsividade | Médio   | 5    |
| Sem benchmark k6 do DataLoader                | Ganho do batching não comprovado                      | Médio   | 5    |
| Sem SBOM/Dependabot/Renovate                  | Vulnerabilidades e atualizações sem processo          | Médio   | 5    |
| Sem guia de deploy                            | Operação depende de conhecimento tácito               | Médio   | 5    |
| Revisões de design/acessibilidade da Fase 4   | Gate 4 de release aberto                              | Alto    | 4/5  |
| Retenção/base legal LGPD não aprovadas        | Impossibilidade de produção com dados reais           | Alto    | 5    |
| Code splitting ausente                        | Bundle inicial grande em redes lentas                 | Baixo   | 5    |
| Sem trilha de auditoria de segurança nos logs | Investigação de incidentes limitada                   | Médio   | 5    |
| Sem outbox/exactly-once                       | Perda/duplicação de eventos em falhas                 | Médio   | fora |

## Decisões que exigem aprovação humana

| Decisão                                           | Responsável          | Impacto se não decidida                          |
| ------------------------------------------------- | -------------------- | ------------------------------------------------ |
| Provedor e topologia de deploy                    | Produto/Engenharia   | Guia de deploy e smoke ficam genéricos           |
| Modo de persisted queries (audit vs enforce)      | Engenharia/Segurança | Pode bloquear clientes antigos                   |
| Limiares de rate limit por rota/usuário/IP        | Segurança/Produto    | Risco de bloquear uso legítimo ou permitir abuso |
| Política de senha e bloqueio progressivo          | Produto/Segurança    | Contas fracas e força bruta                      |
| Metas de desempenho do k6 (p95, erro, throughput) | Engenharia/QA        | Sem critério objetivo de aprovação               |
| Retenção e base legal LGPD                        | Produto/Jurídico     | Não liberar uso com dados reais                  |
| Escopo do code splitting e orçamento de bundle    | Engenharia           | Performance inicial abaixo do esperado           |

## Escopo mínimo proposto

1. Endurecimento GraphQL: persisted queries, rate limit por usuário/IP, limite
   de corpo, sugestões desativadas em produção e decisão registrada em ADR.
2. Autenticação: política de senha, bloqueio progressivo e rate limit de login
   com `429` e `Retry-After`.
3. Qualidade no navegador: Playwright nos fluxos críticos, axe sem violações
   críticas/sérias, checklist manual de teclado/zoom/leitor de tela/contraste.
4. Segurança: testes negativos de IDOR, token inválido/expirado, reuso de
   refresh, HMAC de webhook, autenticação WebSocket e bypass de rate limit.
5. Desempenho: cenário k6 comparando DataLoader desligado e ligado, com
   metodologia e números no README.
6. Entrega: STRIDE final, `docs/a11y.md` completo, SBOM CycloneDX,
   Dependabot/Renovate, guia de deploy com rollback, release notes e README
   final com GIF e resultados.
7. Fechamento do Gate 4 da Fase 4: QA-001 aprovado, revisão de design da
   implementação e revisão manual de acessibilidade aprovadas ou com exceção
   autorizada.

## Fora do escopo

- Implementar outbox transacional ou exactly-once.
- Mídia, templates, status de entrega/leitura e presença no WhatsApp.
- Executar o deploy em produção (o guia é entregue; a execução exige decisão de
  provedor).
- Aprovar retenção/base legal LGPD.
- Analytics, telemetria de produto ou rastreamento de usuários.
- Reabrir o escopo funcional das Fases 1 a 4.

## Hipóteses a validar

| Hipótese                                                              | Impacto se rejeitada                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------- |
| Persisted queries entram em modo audit antes de enforce               | Rollout e compatibilidade com clientes mudam         |
| Rate limit usa Redis já presente na infraestrutura                    | Nova dependência ou armazenamento local              |
| Playwright roda com Docker Compose/Testcontainers na CI               | Pipeline, tempo e custo de CI mudam                  |
| axe é executado nas páginas principais em desktop e mobile            | Escopo de acessibilidade e tempo de teste mudam      |
| k6 usa ambiente local com seed determinístico                         | Comparação antes/depois perde reprodutibilidade      |
| SBOM é gerado em CycloneDX e anexado ao artefato de CI                | Ferramenta e formato de entrega mudam                |
| Dependabot é preferido a Renovate nesta fase                          | Automação, agrupamento e política de merge mudam     |
| O deploy será documentado de forma agnóstica até decisão de provedor  | Seções específicas do guia ficam pendentes           |
| O code splitting por rota entra se o orçamento de bundle for aprovado | Performance inicial e arquitetura do front-end mudam |

## Fluxos propostos

1. **Endurecer**: rate limit e persisted queries entram em modo audit, métricas
   e logs são observados; depois o modo enforce é ativado em produção.
2. **Validar no navegador**: Playwright percorre login, contatos, negócio,
   kanban, inbox e dashboard; axe roda nas mesmas páginas; falhas bloqueiam a
   CI.
3. **Medir**: k6 executa o mesmo cenário com DataLoader desligado e ligado; os
   resultados são registrados no README com ambiente, seed e data.
4. **Entregar**: SBOM, dependências automatizadas, guia de deploy, release
   notes e README final são publicados; o Gate 4 da Fase 4 é encerrado.

## Critérios de entrada para a SPEC

- [ ] Decisões de deploy, rate limit e LGPD registradas ou explicitamente
      adiadas.
- [ ] SPEC-006, TASKs e QA-002 aprovados.
- [ ] Ambiente local reproduzível (Compose + seed fictício).
- [ ] Proprietários de QA, Segurança, Design e Acessibilidade definidos.

## Critérios de saída

- [ ] Critérios de aceitação com evidência reproduzível.
- [ ] CI verde com E2E, axe, segurança e SBOM.
- [ ] Nenhum defeito S1/S2 aberto.
- [ ] Riscos residuais com disposição e responsável.
- [ ] Gate 4 da Fase 4 encerrado.
