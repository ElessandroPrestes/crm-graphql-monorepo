# ADR-005: Subscriptions GraphQL via WebSocket e pub/sub Redis, com cache de dashboard

## Metadados

| Campo                     | Valor                               |
| ------------------------- | ----------------------------------- |
| Status                    | Accepted                            |
| Data                      | 2026-11-11                          |
| Responsáveis              | Engenharia, Arquitetura e Segurança |
| SPEC relacionada          | SPEC-003                            |
| Substitui/substituída por | —                                   |

## Contexto

A Fase 2 precisa notificar clientes quando um negócio muda de etapa e servir
métricas agregadas com baixa latência. A API já usa Apollo Server 5, GraphQL 16
e NestJS, mas hoje só expõe transporte HTTP. O Redis 8.8.4 está disponível no
ambiente local e é o componente previsto em `PROJECT.md` para pub/sub e cache.

Sem uma decisão registrada, a entrega de eventos e a camada de cache tendem a
ser implementadas de formas divergentes (polling, pub/sub em memória ou cache
sem invalidação), comprometendo consistência, autorização e capacidade de
escala horizontal.

## Drivers da decisão

- Consultas GraphQL continuam sendo o contrato de leitura; eventos devem
  reutilizar o mesmo schema tipado.
- Autorização por propriedade (`ownerId`) precisa valer também para eventos em
  tempo real; um cliente não pode receber dados de outro dono.
- A API deve poder rodar com mais de uma instância; estado de pub/sub não pode
  ficar apenas na memória do processo.
- O dashboard deve responder rápido sem recalcular agregações a cada leitura,
  mas não pode servir dados indefinidamente desatualizados.
- O ambiente local já possui Redis; introduzir outro broker para a Fase 2
  ampliaria a superfície operacional sem necessidade.

## Alternativas consideradas

### Alternativa A: polling HTTP do cliente

- Benefícios: nenhuma infraestrutura nova; simples de operar.
- Custos e riscos: latência e carga de consultas; não comprova o requisito de
  tempo real; desperdício de recursos.

### Alternativa B: pub/sub em memória no processo da API

- Benefícios: implementação mínima; sem Redis para eventos.
- Custos e riscos: não funciona com múltiplas instâncias; perde eventos em
  restart; não é o padrão arquitetural previsto.

### Alternativa C: `LISTEN/NOTIFY` do PostgreSQL

- Benefícios: um componente a menos; transacional com os dados.
- Custos e riscos: conexões dedicadas, limites de payload e acoplamento do
  domínio ao banco; Redis já está previsto para pub/sub e cache.

### Alternativa D: `graphql-ws` com pub/sub Redis e cache Redis

- Benefícios: transporte padrão para subscriptions GraphQL; escala horizontal
  via Redis; reutiliza o Redis já provisionado; cache e eventos no mesmo
  componente.
- Custos e riscos: nova dependência de WebSocket; necessidade de autenticar a
  conexão; inconsistências possíveis entre cache e eventos; Redis vira
  dependência operacional adicional da fase.

## Decisão

Adotar a Alternativa D:

- Habilitar subscriptions no Apollo/NestJS com o transporte `graphql-ws`.
- Autenticar a conexão WebSocket no `connection_init`, validando o access token
  JWT com as mesmas regras do guard HTTP, e rejeitar conexões sem identidade.
- Publicar eventos de domínio em canais Redis; cada instância assina os canais
  e entrega apenas eventos aos assinantes autorizados.
- Filtrar a entrega por `ownerId`/papel no servidor; o cliente nunca recebe
  negócios de outro dono.
- Usar Redis como cache de `dashboardMetrics` com TTL curto e invalidação por
  evento de negócio/atividade.
- Tratar Redis como dependência degradável: leituras de dashboard recalculam
  sem cache e escritas não falham se o pub/sub estiver indisponível; a falha é
  registrada em log.

## Consequências

### Positivas

- Um único contrato GraphQL para leitura, mutação e eventos.
- Escala horizontal da API preservada, pois o estado de pub/sub fica no Redis.
- Dashboard com latência menor e invalidação explícita.
- Reutilização do Redis já presente no Compose.

### Negativas e riscos

- Nova superfície de segurança em WebSocket (autenticação, limites e
  desconexão).
- Pub/sub é best-effort: sem garantia de entrega durável; aceitável para
  notificação de UI, não para integração crítica.
- Cache e banco podem divergir por um intervalo curto; TTL e invalidação
  reduzem, mas não eliminam a janela.
- Testes de integração passam a exigir Redis além do PostgreSQL, elevando o
  tempo e a dependência de Docker.

## Implementação e migração

- Compatibilidade: adiciona transporte e schema; não altera o contrato HTTP
  existente. Novas dependências devem seguir ADR-003 e ser validadas no início
  da implementação.
- Etapas: adicionar modelos e migration; implementar provider Redis; habilitar
  `graphql-ws`; publicar/assinar eventos; adicionar cache e invalidação;
  cobrir com testes.
- Rollback: desabilitar o transporte de subscriptions e o cache por
  configuração; o CRUD HTTP permanece funcional. Reverter a migration remove
  os modelos novos.
- Observabilidade: logar conexões aceitas/rejeitadas, falhas de pub/sub e
  acertos/erros de cache, sem tokens ou dados pessoais.

## Evidências e validação

- Pendente de aprovação humana e da implementação da SPEC-003.
- Evidências esperadas: teste de autorização em subscription, teste de evento
  entre donos, teste de TTL/invalidação de cache e teste de degradação sem
  Redis.
