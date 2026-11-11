# Discovery — Fase 2: funil e dashboard

## Metadados

| Campo       | Valor                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| Status      | Aceito em 2026-11-11                                                            |
| Responsável | Descoberta de produto/UX e engenharia                                           |
| Criado      | 2026-11-11                                                                      |
| Atualizado  | 2026-11-11                                                                      |
| SPEC alvo   | SPEC-003                                                                        |
| Fontes      | `PROJECT.md`, `ROADMAP.md`, `knowledge/modules/crm-domain.md`, código da Fase 1 |

## Fatos conhecidos

- A Fase 1 entregou `User`, `Company`, `Contact` e `RefreshToken`, com
  autenticação REST, RBAC por propriedade (`ownerId`), GraphQL code-first,
  paginação por cursor, DataLoader e limites de consulta.
- O schema atual não possui negócios, atividades, dashboard ou subscriptions.
- Redis 8.8.4 está no Docker Compose, mas nenhum cliente Redis é usado pela API.
- Apollo Server 5 e GraphQL 16 já estão configurados para HTTP; transporte de
  subscriptions ainda não foi habilitado.
- O roadmap prevê para a Fase 2: negociações com etapas e concorrência
  otimista, linha do tempo de atividades, subscription `dealMoved` via Redis
  pub/sub e `dashboardMetrics` com cache Redis.
- Não há interface web de produto até a Fase 4; a entrega da Fase 2 é de API.

## Usuários e trabalhos

| Grupo    | Objetivo principal                                   | Necessidade mínima                                         |
| -------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `SELLER` | Acompanhar suas negociações e registrar interações   | Ver e mover apenas os próprios negócios e atividades       |
| `ADMIN`  | Acompanhar o funil do time e apoiar vendedores       | Ver e mover todos os negócios e atividades                 |
| Demo/QA  | Validar funil, tempo real e métricas sem dados reais | Seed fictício com negócios em etapas e atividades variadas |

## Escopo mínimo proposto para a Fase 2

1. Modelo Prisma com `Deal` e `Activity`, enums de etapa e tipo, migration e
   seed fictício.
2. CRUD GraphQL de negócios com etapas, encerramento e concorrência otimista
   por `version`.
3. Linha do tempo de atividades por contato e por negócio, com paginação por
   cursor.
4. Subscription `dealMoved` autenticada, entregue por Redis pub/sub e filtrada
   por autorização.
5. `dashboardMetrics` com contagens e valores por etapa, cache Redis e
   invalidação por evento.
6. Testes unitários e de integração, incluindo concorrência, IDOR,
   subscriptions e invalidação de cache.
7. Geração de schema, codegen, drift check e atualização de documentação e
   rastreabilidade.

## Hipóteses a validar

| Hipótese                                                                       | Impacto se rejeitada                                  |
| ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Etapas do funil: `LEAD`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST` | Enum, seed, dashboard e validação de transições mudam |
| `WON` e `LOST` são terminais; reabertura fica fora da Fase 2                   | Regras de transição e timeline de atividades mudam    |
| Negócio tem `contactId` e `companyId` opcionais, validados por propriedade     | Modelo de dados e regras de vínculo mudam             |
| Valor monetário é armazenado em centavos inteiros, moeda única `BRL`           | Tipo de campo, input e agregações do dashboard mudam  |
| Concorrência otimista usa `version` inteiro e `expectedVersion` no input       | Contrato de update e tratamento de conflito mudam     |
| `dealMoved` é a única subscription da fase                                     | Transporte, autorização e escopo de eventos mudam     |
| Dashboard usa janela de tempo explícita em UTC, com TTL curto de cache         | Contrato de métricas, invalidação e testes mudam      |
| Atividades são imutáveis após criação na Fase 2 (sem edição/exclusão)          | CRUD de atividades e trilha de auditoria mudam        |
| Redis pub/sub entrega eventos best-effort; queda do Redis não bloqueia writes  | Requisitos de confiabilidade e observabilidade mudam  |

## Medidas de sucesso

- Um `SELLER` movimenta seus negócios entre etapas sem enxergar ou alterar os
  de outro `SELLER`; um `ADMIN` movimenta qualquer negócio.
- Duas atualizações concorrentes do mesmo negócio: a segunda com
  `expectedVersion` desatualizado recebe `CONFLICT` e não sobrescreve a
  primeira.
- A linha do tempo retorna atividades do contato/negócio em ordem estável com
  paginação por cursor.
- Um cliente autenticado recebe `dealMoved` quando um negócio acessível muda de
  etapa; não recebe eventos de negócios de outro dono.
- `dashboardMetrics` reflete o estado do funil e é invalidado após mudanças,
  com teste de cache e de invalidação.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, testes de integração
  e `schema:check` passam sem drift.

## Fora de escopo

- Conversas, mensagens, WhatsApp, RabbitMQ e worker consumidor (Fase 3).
- Interface web, kanban visual, i18n e temas (Fase 4).
- Reabertura de negócios encerrados, múltiplas moedas e câmbio.
- Edição/exclusão de atividades, anexos e lembretes.
- Rate limit por usuário/IP, persisted queries e benchmark k6 (Fase 5).
- Compartilhamento de negócios por time; permanece RBAC por propriedade.

## Riscos e questões abertas

| Questão ou risco                                                | Proposta para validação                                              | Responsável       |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------- |
| Quais etapas e regras de transição o funil exige?               | Adotar as seis etapas acima; permitir avanço/retrocesso em abertas   | Produto           |
| Quais tipos de atividade existem?                               | `CALL`, `EMAIL`, `MEETING`, `NOTE`, com `occurredAt`                 | Produto           |
| O dashboard precisa de período configurável ou só total aberto? | `periodStart`/`periodEnd` opcionais em UTC, além do total por etapa  | Produto           |
| Qual transporte de subscription usar?                           | `graphql-ws` com pub/sub Redis; validar em ADR-005                   | Engenharia        |
| Como autenticar subscriptions?                                  | JWT no `connection_init`, mesmas regras do guard HTTP                | Segurança         |
| Cache pode servir dado desatualizado?                           | TTL curto e invalidação por evento; degradar sem cache se Redis cair | Engenharia        |
| Qual a política de retenção de atividades?                      | Dados fictícios na fase; retenção real depende de LGPD (Fase 3/5)    | Produto/Segurança |
| Testcontainers suporta Redis nos testes de integração?          | Adicionar container Redis efêmero; fallback documentado se faltar    | Engenharia/QA     |

## Recomendação

Prosseguir para a SPEC-003 e ADR-005 com as hipóteses acima explicitamente
marcadas. Nenhuma implementação deve começar antes da aprovação humana do
discovery, da SPEC-003, da ADR-005 e da TASK-003-01.
