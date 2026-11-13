# TASK: Contatos e visão 360°

## Metadados

| Campo        | Valor                                                             |
| ------------ | ----------------------------------------------------------------- |
| ID           | TASK-005-02                                                       |
| Status       | Done — revisão aprovada com ressalvas (REVIEW-001)                |
| Responsável  | Engenharia de front-end                                           |
| SPEC         | SPEC-005                                                          |
| Critérios    | AC-505, AC-506, AC-507, AC-508, AC-519, AC-522, AC-524            |
| Dependências | TASK-005-01 concluída; filtros GraphQL disponíveis; seed fictício |

## Objetivo

Entregar a lista de contatos com busca, filtros e paginação server-side, a
criação de contato e a visão 360° com negócios, atividades, conversas,
exportação e exclusão LGPD.

## Escopo

### Incluído

- `/contacts` com busca debounced, filtro por empresa, filtros na URL,
  paginação incremental e estados de carregamento/vazio/sem resultado/erro.
- Criação de contato com react-hook-form + zod, erros de campo e conflito.
- `/contacts/:contactId` com cadastro, empresa, negócios, atividades e
  conversas.
- Criação de atividade e de negócio a partir da visão 360°.
- Exportação JSON via `exportContactData` e exclusão via `deleteContact` com
  diálogo de confirmação e consequências.
- Links entre visão 360° e inbox/pipeline.
- Testes de componente, contrato e acessibilidade das telas.
- Atualização de documentação e rastreabilidade.

### Não incluído

- Edição de contato e de atividades.
- Exclusão em lote, restauração e desfazer.
- Kanban, inbox completo e dashboard (TASK-005-03).

## Abordagem e impacto

- Arquivos: `apps/web/src/contacts/**`, `apps/web/src/ui/**`,
  `apps/web/src/graphql/**`, testes da API para filtros e IDOR,
  `docs/a11y.md`, `PROJECT.md`.
- Contratos: `contacts(search, companyId)`, `contact`, `companies`,
  `deals(contactId)`, `activities(contactId)`,
  `conversations(contactId)`, `createContact`, `createActivity`,
  `createDeal`, `exportContactData`, `deleteContact`.
- Segurança: escopo por dono no servidor; 404 para recurso de outro dono; sem
  PII em logs; exportação sem envio a terceiros.
- Acessibilidade: tabela/cartões semânticos, formulário com erros associados,
  diálogo com foco contido e retorno de foco.

## Passos

- [ ] Aprovar TASK-005-02 e QA-001.
- [x] Implementar lista, busca, filtro e paginação de contatos.
- [x] Implementar criação de contato e tratamento de conflito.
- [x] Implementar visão 360° e seções com estados vazios.
- [x] Implementar criação de atividade e negócio.
- [x] Implementar exportação e exclusão com confirmação.
- [x] Adicionar testes de contrato, componente e acessibilidade.
- [x] Rodar lint, typecheck, testes, build e format.
- [x] Atualizar documentação e rastreabilidade.

## Validação

| Critério/risco | Teste, comando ou revisão                          | Evidência esperada                                     |
| -------------- | -------------------------------------------------- | ------------------------------------------------------ |
| AC-505         | testes de API e componente                         | Busca/filtro server-side e escopo por dono             |
| AC-506         | teste de formulário e conflito                     | Foco no erro, entrada preservada e contato criado      |
| AC-507         | testes de visão 360° com e sem dados               | Quatro seções, estados vazios e 404 para outro dono    |
| AC-508         | testes de exportação, exclusão e cancelamento      | JSON completo, cascata refletida e cancelamento seguro |
| AC-519         | revisão em viewports e zoom                        | Sem perda de conteúdo ou rolagem horizontal indevida   |
| AC-522         | testes de erro, vazio e sem resultado              | Mensagens e ações distintas                            |
| AC-524         | `pnpm lint && typecheck && test && build` e schema | Tudo verde, sem drift                                  |

## Condição de conclusão

- [x] Escopo implementado sem expansão.
- [x] Testes e validações aplicáveis passam.
- [x] Documentação e rastreabilidade foram atualizadas.
- [x] Limitações e desvios estão registrados.

## Resultado

Implementado em 2026-11-11.

### Escopo entregue

- Lista de contatos com busca debounced, filtro por empresa, paginação por
  cursor e estados de carregamento/erro/vazio/sem resultado.
- Criação de contato com validação zod, foco no primeiro campo inválido,
  preservação de entrada e aviso de conflito.
- Visão 360° com cadastro, empresa, negócios, atividades, conversas, recarga
  de cada seção e tratamento de `NOT_FOUND` sem vazar existência.
- Criação de atividade e de negócio a partir do contato.
- Exportação JSON dos dados do contato e exclusão com diálogo de confirmação,
  cancelamento e navegação para `/contacts` após sucesso.
- Testes de componente para lista, busca, criação, 360°, exportação, exclusão e
  estados de erro.

### Validações executadas

- `pnpm lint` — verde.
- `pnpm --filter @nexo/web typecheck` — verde.
- `pnpm --filter @nexo/web test` — 39 testes verdes, incluindo 11 de contatos.
- `pnpm --filter @nexo/api exec vitest run -c vitest.integration.config.ts
test/fase-4.e2e.test.ts` — 5 testes verdes.
- `pnpm build` e `pnpm format:check` — verdes.

### Desvios e limitações

- A exportação usa `URL.createObjectURL` no navegador; nenhum dado é enviado
  para fora da API.
- A exclusão remove o contato e reflete a cascata no backend; negócios são
  preservados com `contactId` nulo.
- A revisão visual em viewports, zoom 200% e axe permanece manual.

### Pendências

- Aprovação formal da TASK e do QA-001.
- Revisão manual de responsividade, zoom e leitor de tela.
- Commit com `Spec-Ref: SPEC-005` e `Task-Ref: TASK-005-02`.
