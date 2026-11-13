# Revisão (Review): Fase 4 — front-end do Nexo CRM

## Metadados

| Campo        | Valor                                                               |
| ------------ | ------------------------------------------------------------------- |
| ID           | REVIEW-001                                                          |
| Status       | Approved with remarks (Aprovado com ressalvas)                      |
| SPEC/TASK    | SPEC-005; TASK-005-01, TASK-005-02, TASK-005-03                     |
| Build/commit | `51e8ba8` (código), `72b2e72` (CI)                                  |
| Revisor      | Code Review Agent                                                   |
| Data         | 2026-11-13                                                          |
| Refs         | Spec-Ref: SPEC-005; Task-Ref: TASK-005-01, TASK-005-02, TASK-005-03 |

## Escopo revisado

- Artefatos: SPEC-005, TASK-005-01 a TASK-005-03, `docs/design-spec-fase-4.md`
  (DS-001), `docs/ux-brief-fase-4.md` (UXB-001), `docs/qa-plan-fase-4.md`
  (QA-001), `reviews/VERIFICATION-REPORT-VR-001.md` e as três evidências de QA.
- Critérios: AC-501 a AC-524 de SPEC-005.
- Padrões e ADRs: `standards/security.md`, `standards/testing.md`,
  `standards/accessibility.md`, `standards/quality-gates.md`, ADR-002 (JWT e
  refresh), ADR-005 (subscriptions via Redis) e ADR-007 (LGPD).
- Validações disponíveis: evidence de QA automatizada, relatório de verificação
  VR-001 (Gate 3 Pass), execução local e CI.

### Diff e validações executadas nesta revisão

- `pnpm lint` — verde.
- `pnpm typecheck` — 6 tarefas verdes.
- `pnpm test` — 5 pacotes verdes; suíte web repetida 3 vezes após a correção de
  flake (39/39 em todas).
- `pnpm build` — 4 tarefas verdes.
- `pnpm format:check` — verde.
- `pnpm audit --audit-level high` — verde (restam 2 advisories moderadas em
  ferramentas de desenvolvimento).
- CI: `main` run 43416373694 — success; `develop` run 43417932656 — success.

## Achados (Findings)

| ID     | Severidade | Local                                                | Evidência e impacto                                                                                                                                                                                                                                                       | Correção requerida                                                                     | Status                                                                   |
| ------ | ---------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| REV-01 | S3         | `apps/web/src/inbox/conversation-page.test.tsx:108`  | O teste aguardava o nó da mensagem pendente e, quando o refetch concluía antes da asserção, o nó já havia sido substituído pela mensagem do servidor. Reproduzido em 1 de 3 execuções da suíte completa; poderia falhar a CI de forma intermitente.                       | Refazer a consulta dentro de `waitFor`, em vez de reter o nó encontrado.               | Resolvido em `51e8ba8`; 3/3 suítes verdes.                               |
| REV-02 | S3         | `apps/web/src/inbox/conversation-page.tsx:60-72`     | O anúncio em `aria-live` usa texto fixo por contato. Duas mensagens consecutivas do mesmo contato produzem o mesmo `textContent`, que não é reanunciado por leitores de tela. AC-514 fica parcialmente atendido nesse caso.                                               | Incluir um identificador ou contador no texto do anúncio para garantir mudança no DOM. | Open — disposto para a Fase 5 (TASK-006).                                |
| REV-03 | S4         | `apps/web/src/pipeline/deal-card.tsx:38-50`          | O botão de arraste tem rótulo "Mover para …", mas apenas `PointerSensor` está configurado. Usuários de teclado usam o menu `<details>` equivalente; o rótulo do handle pode sugerir uma ação que só existe com ponteiro.                                                  | Renomear o handle para descrever o arraste ou adicionar `KeyboardSensor`.              | Open — disposto para a Fase 5.                                           |
| REV-04 | S4         | `apps/web/src/inbox/conversation-page.tsx:91-110`    | Se o refetch pós-envio falhar, a mensagem pendente permanece em `QUEUED` sem ação de repetição; o botão de retry só existe para `FAILED`.                                                                                                                                 | Tratar a falha de refetch como `FAILED` ou expor repetição para `QUEUED`.              | Open — disposto para a Fase 5.                                           |
| REV-05 | S4         | `pnpm audit`                                         | Duas advisories moderadas em dependências de desenvolvimento (`glob` via `testcontainers`; `minimatch` via codegen/eslint). O portão `--audit-level high` passa e não há exposição em runtime.                                                                            | Acompanhar via Dependabot/Renovate na Fase 5.                                          | Aceito como risco residual.                                              |
| REV-06 | S3 (Gate)  | `docs/qa-plan-fase-4.md`, `reviews/`, `docs/a11y.md` | QA-001 permanece "Draft — aguardando aprovação". A revisão de implementação de design e a revisão manual de acessibilidade seguem pendentes; axe/Playwright e leitor de tela real estão previstos para a Fase 5. O Gate 4 exige essas aprovações ou exceções autorizadas. | Obter aprovação humana de QA/design/acessibilidade ou registrar exceção autorizada.    | Open — bloqueia o Gate 4 de release; não bloqueia a aprovação do código. |
| REV-07 | Info       | `.github/workflows/ci.yml`                           | O gitleaks falhava apenas no branch padrão porque o checkout raso não continha o commit base do range completo. Corrigido com `fetch-depth: 0` no job de segurança.                                                                                                       | Nenhuma.                                                                               | Resolvido em `72b2e72`; CI verde em `main` e `develop`.                  |

## Verificações

- [x] Escopo e critérios da SPEC foram atendidos (VR-001: 24/24 critérios
      verificados; nenhum achado de QA aberto).
- [x] Arquitetura e padrões aplicáveis foram preservados: sessão em memória com
      refresh em cookie, Apollo com retry single-flight, RBAC refletido na UI,
      subscriptions best-effort documentadas e filtros GraphQL autorizados.
- [x] Testes cobrem comportamento e riscos relevantes; a suíte web foi
      estabilizada e reexecutada após a correção de flake.
- [x] Segurança, dados, acessibilidade e operação foram avaliados; itens
      pendentes de acessibilidade estão registrados em REV-06 e
      `docs/a11y.md`.
- [x] Documentação, migração e rollback estão alinhados; não há migração nova
      nesta fase e a documentação de acessibilidade, arquitetura e QA foi
      atualizada.
- [x] Nenhuma expansão de escopo não aprovada foi identificada.

## Decisão

**Approved with remarks (Aprovado com ressalvas).**

- Motivo: a implementação cumpre o escopo e os critérios de SPEC-005, os gates
  automatizados de qualidade estão verdes e não foram encontrados defeitos S1
  ou S2 no código. REV-01 e REV-07 foram corrigidos durante este ciclo.
- Riscos residuais ou ressalvas: REV-02 a REV-04 são débitos de baixo impacto
  dispostos para a Fase 5; REV-05 é risco aceito em ferramentas de
  desenvolvimento; REV-06 mantém o **Gate 4 de release aberto** até que QA-001,
  a revisão de design da implementação e a revisão manual de acessibilidade
  sejam aprovadas ou cobertas por exceção autorizada.
- Revisor e timestamp: Code Review Agent, 2026-11-13.
