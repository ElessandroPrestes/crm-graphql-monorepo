# Plano de QA — Fase 4: front-end do Nexo CRM

## Metadados

| Campo                   | Valor                        |
| ----------------------- | ---------------------------- |
| ID                      | QA-001                       |
| Status                  | Draft — aguardando aprovação |
| Responsável (QA owner)  | Engenharia/QA                |
| Build/commit            | Pendente                     |
| SPEC/design relacionado | SPEC-005, UXB-001, DS-001    |
| Janela de teste         | Fase 4                       |

## Escopo e objetivo de qualidade

### No escopo

- Sessão, refresh, logout, rotas protegidas e autorização refletida na UI.
- Busca/filtros server-side, contatos, visão 360°, exportação e exclusão.
- Kanban com drag and drop e alternativa por teclado, incluindo conflito.
- Inbox em tempo real, envio idempotente, reconexão e anúncios.
- Dashboard, tema, i18n, responsividade e acessibilidade WCAG 2.2 AA.
- Contratos GraphQL aditivos e ausência de regressão nas Fases 1 a 3.
- Segurança da sessão: token em memória, cookie, CORS, WebSocket e logs.

### Fora do escopo

- E2E Playwright, benchmark k6, persisted queries e rate limit — Fase 5; risco
  residual aceito com validação manual dos fluxos principais.
- Teste com NVDA/VoiceOver real — Fase 5; mitigado por checklist e axe.
- Analytics e telemetria — não existem por decisão de privacidade.
- Mídia, templates, status de entrega e reabertura de negócios — fora da SPEC.

## Avaliação de risco

| ID    | Risco                                           | Impacto no usuário/sistema | Probabilidade | Resposta de teste                                   | Responsável   |
| ----- | ----------------------------------------------- | -------------------------- | ------------- | --------------------------------------------------- | ------------- |
| R-401 | Token exposto ou cache misturado entre usuários | Alto                       | Média         | Inspeção de storage/logs, logout e troca de usuário | Segurança     |
| R-402 | Refresh concorrente em loop ou perda de sessão  | Alto                       | Média         | Testes de concorrência e falha de refresh           | Engenharia/QA |
| R-403 | Filtro revela dados de outro dono               | Alto                       | Baixa         | Testes de IDOR em contacts/deals/conversations      | QA/Segurança  |
| R-404 | Conflito no kanban perde movimento ou confunde  | Alto                       | Média         | Teste de `CONFLICT`, recarga e mensagem             | QA            |
| R-405 | Tempo real rouba foco ou perde mensagens        | Alto                       | Média         | Teste de subscription, reconexão e `aria-live`      | QA/A11y       |
| R-406 | Tema claro abaixo de AA                         | Médio                      | Média         | Contraste e revisão visual nos dois temas           | Design/A11y   |
| R-407 | Busca não escala ou retorna resultado incorreto | Médio                      | Média         | Casos de borda, paginação e volume do seed          | QA            |
| R-408 | Layout quebra em mobile/zoom                    | Médio                      | Média         | Viewports, reflow 320 px e zoom 200%                | QA            |
| R-409 | Regressão nas APIs das fases anteriores         | Alto                       | Baixa         | Suíte existente de API/worker e testes de contrato  | QA            |

## Abordagem de teste

| Área de teste               | Nível/tipo                         | Automatizado/manual | Ambiente             | Responsável   | Evidência requerida              |
| --------------------------- | ---------------------------------- | ------------------- | -------------------- | ------------- | -------------------------------- |
| Funcional                   | Componente e fluxo                 | Automatizado        | jsdom                | Engenharia/QA | Testes Vitest verdes             |
| Integração/contrato         | API GraphQL e REST                 | Automatizado        | Local/Testcontainers | QA            | Testes de API e schema drift     |
| E2E                         | Fluxo crítico                      | Manual              | Local                | QA            | Roteiro executado                |
| Exploratório/usabilidade    | Fluxos principais                  | Manual              | Local                | Produto/QA    | Notas e defeitos                 |
| Aceitação de usuário        | Login → contato → negócio → inbox  | Manual              | Local                | Produto       | Checklist assinado               |
| Visual                      | Temas, estados e responsividade    | Manual              | Navegador            | Design/QA     | Capturas e checklist             |
| Acessibilidade              | axe + teclado + foco + contraste   | Automatizado/manual | jsdom/Navegador      | A11y/QA       | Relatório sem crítico/sério      |
| Segurança/privacidade       | Sessão, IDOR, storage e logs       | Automatizado/manual | Local                | Segurança/QA  | Inspeção e testes negativos      |
| Desempenho/confiabilidade   | Carga inicial, paginação, queda WS | Manual              | Local                | Engenharia/QA | Tempo e comportamento observados |
| Compatibilidade/localização | Navegadores, viewports e pt-BR     | Manual              | Navegador            | QA            | Matriz preenchida                |

## Rastreabilidade dos critérios de aceitação

| Critério | Risco | ID/caminho do teste automatizado                          | Caso de teste manual                             | Evidência/resultado | Defeito/exceção |
| -------- | ----- | --------------------------------------------------------- | ------------------------------------------------ | ------------------- | --------------- |
| AC-501   | R-401 | `apps/web/src/auth/*.test.tsx` — bootstrap                | Abrir app com e sem cookie                       | Pendente            | —               |
| AC-502   | R-402 | `apps/web/src/auth/*.test.tsx` — login/logout/expiração   | Expirar sessão durante uso                       | Pendente            | —               |
| AC-503   | R-401 | `apps/web/src/auth/*.test.tsx` — returnTo                 | Abrir rota protegida sem sessão                  | Pendente            | —               |
| AC-504   | R-408 | `apps/web/src/shell/*.test.tsx` — navegação               | Navegação por teclado e leitor de tela           | Pendente            | —               |
| AC-505   | R-403 | `apps/web/src/contacts/*.test.tsx`, API `fase-4`          | Busca/filtro com dois donos                      | Pendente            | —               |
| AC-506   | R-407 | `apps/web/src/contacts/*.test.tsx` — formulário           | Criar contato inválido e válido                  | Pendente            | —               |
| AC-507   | R-403 | `apps/web/src/contacts/*.test.tsx` — visão 360°           | Contato completo, vazio e de outro dono          | Pendente            | —               |
| AC-508   | R-403 | `apps/web/src/contacts/*.test.tsx` — exportar/excluir     | Confirmar, cancelar e verificar cascata          | Pendente            | —               |
| AC-509   | R-403 | `apps/web/src/pipeline/*.test.tsx`                        | Kanban com dois donos                            | Pendente            | —               |
| AC-510   | R-408 | `apps/web/src/pipeline/*.test.tsx` — mouse/teclado        | Mover card por ambas as formas                   | Pendente            | —               |
| AC-511   | R-404 | `apps/web/src/pipeline/*.test.tsx` — conflito             | Simular `CONFLICT`                               | Pendente            | —               |
| AC-512   | R-403 | `apps/web/src/inbox/*.test.tsx`                           | Lista, thread, paginação e outro dono            | Pendente            | —               |
| AC-513   | R-405 | `apps/web/src/inbox/*.test.tsx` — envio                   | Falha, repetição e ausência de duplicata         | Pendente            | —               |
| AC-514   | R-405 | `apps/web/src/inbox/*.test.tsx` — subscription            | Receber mensagem com composer focado             | Pendente            | —               |
| AC-515   | R-405 | `apps/web/src/inbox/*.test.tsx` — reconexão               | Derrubar e restaurar WebSocket                   | Pendente            | —               |
| AC-516   | R-407 | `apps/web/src/dashboard/*.test.tsx`                       | Período e atualização após mutação               | Pendente            | —               |
| AC-517   | R-406 | `apps/web/src/appearance/*.test.tsx`                      | Trocar tema e recarregar                         | Pendente            | —               |
| AC-518   | R-408 | `apps/web/src/i18n/*.test.ts`                             | Datas, moeda e textos                            | Pendente            | —               |
| AC-519   | R-408 | Testes de layout + revisão manual                         | 320/768/1024/1440 px e zoom 200%                 | Pendente            | —               |
| AC-520   | R-406 | axe nos fluxos principais                                 | Checklist de teclado, foco, contraste e anúncios | Pendente            | —               |
| AC-521   | R-403 | `apps/api/test/fase-4.e2e.test.ts`                        | Filtros com dois donos                           | Pendente            | —               |
| AC-522   | R-409 | Testes de estados por tela                                | Erro, vazio e sem resultado                      | Pendente            | —               |
| AC-523   | R-401 | Teste de storage/logout + inspeção                        | Inspecionar browser e console                    | Pendente            | —               |
| AC-524   | R-409 | `pnpm lint && typecheck && test && build && schema:check` | Executar pipeline local                          | Pendente            | —               |

Nenhum critério pode permanecer sem evidência ou sem motivo aprovado de não
aplicável.

## Ambiente e dados

- Ambiente e URL/endpoint: local; web `http://localhost:5217`, API
  `http://localhost:3202`, GraphQL/WS `/graphql`.
- Build/commit/configuração: build da Fase 4 com seed fictício e
  `WHATSAPP_PROVIDER=mock`.
- Feature flags: nenhuma nesta fase.
- Dependências ou versões de serviço: PostgreSQL, Redis e RabbitMQ do Compose;
  Node.js 26.13.0 e pnpm 12.18.0.
- Contas, roles e permissões: usuários do seed com `SELLER` e `ADMIN`.
- Dados, limpeza, isolamento e privacidade: dados fictícios; recriar banco e
  seed entre execuções; nenhum dado real.
- Acesso à observabilidade/logs: logs locais da API e worker; inspecionar que
  não há PII, token ou corpo de mensagem.

## Matriz de compatibilidade

| Plataforma/navegador/dispositivo | Versão            | Viewport/entrada         | Prioridade | Resultado/evidência |
| -------------------------------- | ----------------- | ------------------------ | ---------- | ------------------- |
| Chrome desktop                   | Última e anterior | 1440/1280, mouse/teclado | Alta       | Pendente            |
| Firefox desktop                  | Última e anterior | 1440/1280, mouse/teclado | Alta       | Pendente            |
| Safari desktop                   | Última e anterior | 1440/1280, mouse/teclado | Média      | Pendente            |
| Edge desktop                     | Última e anterior | 1440/1280, mouse/teclado | Média      | Pendente            |
| Chrome mobile emulado            | Última            | 375/320, toque           | Alta       | Pendente            |
| Safari mobile emulado            | Última            | 375/320, toque           | Média      | Pendente            |
| Zoom 200%                        | N/A               | 1280                     | Alta       | Pendente            |

## Critérios de entrada

- [x] SPEC-005, UXB-001, DS-001 e ADR-008 aprovados.
- [ ] TASK-005-01 a TASK-005-03 aprovadas.
- [x] Build pode ser executado no ambiente local.
- [ ] Ambiente e dados determinísticos estão prontos.
- [x] Casos e automação podem ser revisados.
- [ ] Limitações e dependências alteradas são divulgadas.

## Critérios de saída

- [ ] Critérios de aceitação têm evidência de aprovação.
- [ ] Automação e regressão das fases anteriores passam.
- [ ] Verificações manuais e não funcionais aplicáveis passam.
- [ ] Não há defeito S1 ou S2 aberto.
- [ ] Defeitos e riscos restantes têm disposição explícita.
- [ ] Revisões de acessibilidade, design e código estão completas.

## Defeitos e riscos residuais

| ID  | Severidade | Resumo | Status | Responsável | Disposição para lançamento |
| --- | ---------- | ------ | ------ | ----------- | -------------------------- |
| —   | —          | —      | —      | —           | —                          |

## Exceções de portão

| Portão/verificação           | Motivo e impacto         | Mitigação/monitoramento                   | Responsável | Validade | Aprovador |
| ---------------------------- | ------------------------ | ----------------------------------------- | ----------- | -------- | --------- |
| E2E Playwright e leitor real | Planejados para a Fase 5 | Fluxo manual + axe + checklist de teclado | QA          | Fase 5   | Produto   |

## Resumo do teste e recomendação

- Executados: 39 testes de componente no web e 5 testes de integração da API
  (fase 4), além de lint, typecheck, build e format:check verdes.
- Aprovados: automação das histórias AC-501 a AC-524 cobertas por componente e
  API. QA manual de responsividade, zoom, contraste e leitor de tela pendente.
- Falhos/bloqueados: nenhum defeito S1/S2 identificado na automação.
- Evidência principal: saídas de `pnpm lint`, `pnpm typecheck`,
  `pnpm --filter @nexo/web test`, teste de integração da fase 4 e `pnpm build`.
- Limitações conhecidas: E2E, axe e leitor de tela real ficam para a Fase 5.
- Recomendação: pronto para revisão de QA; não aprovar release antes dos
  testes manuais e da aprovação formal das TASKs.
- Responsável de QA e timestamp: pendente.
