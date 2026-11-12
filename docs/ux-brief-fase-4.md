# Briefing de UX — Fase 4: front-end do Nexo CRM

## Metadados

| Campo                  | Valor                        |
| ---------------------- | ---------------------------- |
| ID                     | UXB-001                      |
| Status                 | Approved em 2026-11-11       |
| Responsável            | Produto e UX                 |
| Iniciativa relacionada | SPEC-005 — Fase 4: front-end |
| Data                   | 2026-11-11                   |

## Problema

As Fases 1 a 3 entregaram API, autenticação, funil, tempo real, WhatsApp e
LGPD, mas o produto só pode ser usado por contratos REST/GraphQL. Um vendedor
não consegue consultar a carteira, registrar uma atividade, mover um negócio,
ler uma conversa ou acompanhar o funil sem ferramentas externas. O time também
não tem uma visão operacional única para acompanhar o trabalho.

## Resultado desejado e medidas de sucesso

| Resultado                               | Sinal ou métrica                                            | Linha de base | Meta                                    | Janela de avaliação |
| --------------------------------------- | ----------------------------------------------------------- | ------------- | --------------------------------------- | ------------------- |
| Vendedor opera a carteira no navegador  | Fluxo login → contato → negócio concluído sem suporte       | Inexistente   | 1 fluxo ponta a ponta em teste moderado | Fase 4              |
| Tempo real é perceptível sem recarregar | Mensagem recebida aparece no inbox                          | Inexistente   | ≤ 2 s após o evento do servidor         | Fase 4              |
| Kanban é operável sem mouse             | Mover card por teclado com mesmo resultado do drag and drop | Inexistente   | 100% das etapas alcançáveis por teclado | Fase 4              |
| Busca e filtros são eficientes          | Resultado retorna sem baixar todas as páginas               | Inexistente   | Consulta server-side com paginação      | Fase 4              |
| Interface atende AA                     | Verificações automatizadas e manuais                        | Shell mínimo  | Nenhuma violação crítica ou séria       | Fase 4              |

## Grupos de usuários e contexto

| Grupo    | Objetivo (Job to be done)                      | Contexto                                | Necessidades ou barreiras                                     | Evidência           |
| -------- | ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------------- | ------------------- |
| `SELLER` | Priorizar e trabalhar seus contatos e negócios | Desktop no escritório, sessões longas   | Busca rápida, menos cliques, sinal claro de conflito e sessão | Persona do briefing |
| `SELLER` | Responder conversas sem sair do CRM            | Uso intercalado com outras tarefas      | Inbox legível, envio confiável, anúncio sem interrupção       | Escopo da Fase 3    |
| `ADMIN`  | Acompanhar o time e intervir quando necessário | Desktop, visão macro                    | Filtros, totais confiáveis e acesso a qualquer registro       | Persona do briefing |
| Demo/QA  | Reproduzir fluxos e validar acessibilidade     | Ambiente local com seed e provider Mock | Dados previsíveis, estados vazios/erro e controle de tema     | Escopo das fases    |

## Inventário de evidências

- Briefing do produto e roadmap em `PROJECT.md` e `ROADMAP.md`.
- Shell acessível e testes existentes em `apps/web/src/App.test.tsx`.
- Baseline de acessibilidade em `docs/a11y.md`.
- Contratos reais em `packages/graphql-schema/schema.graphql` e rotas de
  autenticação em `apps/api/src/auth/auth.controller.ts`.
- Não há pesquisa com usuários, analytics ou teste de usabilidade anterior.
  Isso é uma limitação explícita: as decisões de UX desta fase são baseadas em
  requisitos, heurísticas e revisão de acessibilidade.

## Jornada atual

1. O usuário não tem tela de login; precisa montar chamadas manualmente.
2. Para encontrar um contato, precisa consultar GraphQL e paginar manualmente.
3. Para ver negócios, atividades e conversas, combina consultas sem visão 360°.
4. Para mover um negócio, envia mutação e trata conflito sem feedback visual.
5. Para ler mensagens, depende de polling ou de um cliente GraphQL externo.
6. Não há tema claro, catálogo de textos nem formatação local consistente.

Pontos de falha: sessão expirada sem recuperação, conflito de versão silencioso,
perda de contexto ao navegar, anúncios de tempo real que roubam foco e
formulários que descartam entrada após erro.

## Suposições (Assumptions)

| ID    | Suposição                                                          | Risco se falso                               | Método de validação            | Responsável | Status       |
| ----- | ------------------------------------------------------------------ | -------------------------------------------- | ------------------------------ | ----------- | ------------ |
| A-401 | O uso principal é desktop, com suporte funcional a mobile          | Layout, navegação e densidade mudam          | Teste moderado e QA responsivo | Produto     | Não validada |
| A-402 | `SELLER` trabalha principalmente na própria carteira               | Filtros padrão e priorização mudam           | Revisão com stakeholder        | Produto     | Não validada |
| A-403 | O inbox pode mostrar lista e conversa em duas colunas no desktop   | Navegação mobile e estados mudam             | Protótipo navegável            | UX          | Não validada |
| A-404 | O kanban padrão mostra apenas negócios abertos                     | Volume, colunas e resumo de fechados mudam   | Revisão com stakeholder        | Produto     | Não validada |
| A-405 | pt-BR é o único idioma da fase, mas os textos serão externalizados | Estrutura de i18n e esforço mudam            | Revisão de engenharia          | Engenharia  | Não validada |
| A-406 | Tema do sistema é o padrão, com escolha persistida pelo usuário    | Flash de tema, contraste e preferência mudam | QA visual e manual             | Design      | Não validada |
| A-407 | Não há analytics de produto nesta fase                             | Privacidade, instrumentação e métricas mudam | Aprovação de produto/segurança | Produto     | Não validada |

## Restrições e exclusões (Constraints and exclusions)

- Negócio: entregar os seis itens da Fase 4 sem ampliar o domínio funcional.
- Técnico: React 19, Vite 8, React Router 7, Tailwind 4, Apollo Client,
  dnd-kit, react-hook-form e zod; sem biblioteca de componentes visuais.
- Segurança: access token apenas em memória, refresh em cookie `HttpOnly`,
  autorização sempre no servidor e nenhuma decisão de acesso baseada só na UI.
- Privacidade: dados fictícios; sem analytics, telemetria ou PII em logs.
- Acessibilidade: WCAG 2.2 AA, teclado completo, foco visível, contraste AA,
  reflow em 320 px e zoom de 200%.
- Tempo/operacional: uma fase, dividida em tarefas de implementação.
- Não-objetivos: PWA, offline real, push, edição de atividades, mídia,
  múltiplos idiomas e redesenho fora dos tokens definidos.

## Plano de pesquisa e validação

| Questão                                              | Método                                | Participante ou fonte de dados    | Sinal de sucesso                            | Responsável |
| ---------------------------------------------------- | ------------------------------------- | --------------------------------- | ------------------------------------------- | ----------- |
| O fluxo de contato até negócio é compreensível?      | Teste moderado com 3 a 5 pessoas      | Usuários internos ou stakeholders | Conclusão sem ajuda e sem erro crítico      | Produto/UX  |
| O kanban por teclado é equivalente ao drag and drop? | Teste de teclado e leitor de tela     | Especialista em a11y              | Todas as etapas alcançáveis e anunciadas    | A11y        |
| O inbox anuncia mensagens sem interromper?           | Teste manual com leitor de tela       | Especialista em a11y              | Nenhum roubo de foco; anúncio compreensível | A11y        |
| Busca e filtros retornam o esperado?                 | Teste de usabilidade e casos de borda | Seed fictício                     | Resultado correto e paginação estável       | QA          |

Se o teste moderado não ocorrer antes da implementação, registrar a exceção,
o risco aceito, o aprovador e a validação futura. A revisão de acessibilidade
não pode ser dispensada.

## Riscos de usabilidade

| Risco                                              | Usuários afetados | Impacto | Mitigação ou questão de design                                     |
| -------------------------------------------------- | ----------------- | ------- | ------------------------------------------------------------------ |
| Conflito de versão no kanban parece perda de dados | `SELLER`/`ADMIN`  | Alto    | Recarregar o quadro, preservar seleção e explicar o conflito       |
| Inbox em tempo real rouba foco durante a digitação | `SELLER`          | Alto    | `aria-live="polite"`, não focar automaticamente, indicar não lidas |
| Sessão expira no meio de um formulário             | Todos             | Alto    | Refresh single-flight, preservar rascunho e retornar à rota        |
| Tema claro tem contraste insuficiente              | Todos             | Médio   | Tokens semânticos e revisão de contraste nos dois temas            |
| Kanban horizontal é difícil em telas pequenas      | Mobile            | Médio   | Colunas empilhadas ou seletor de etapa, com navegação por teclado  |
| Exclusão de contato é irreversível                 | `ADMIN`           | Alto    | Diálogo com nome, consequências e confirmação explícita            |
| Busca sem resultados claros gera repetição         | Todos             | Baixo   | Estado vazio com termo aplicado e ação para limpar filtros         |

## Questões de design

- O dashboard deve ser a rota inicial após login ou a lista de contatos?
- O kanban deve mostrar valores por coluna e total do período no topo?
- O inbox deve abrir a conversa mais recente automaticamente no desktop?
- A visão 360° deve priorizar negócios ou a conversa mais recente no topo?
- A navegação mobile deve usar barra inferior ou menu lateral retrátil?

Essas questões não bloqueiam a SPEC; a recomendação é dashboard como início,
kanban com totais por coluna, inbox com seleção explícita (sem autoabrir), visão
360° com resumo no topo e navegação lateral retrátil no mobile.

## Aprovação

| Papel          | Nome | Decisão | Data | Notas |
| -------------- | ---- | ------- | ---- | ----- |
| Produto        |      |         |      |       |
| Pesquisa de UX |      |         |      |       |
| Design         |      |         |      |       |
| Acessibilidade |      |         |      |       |
