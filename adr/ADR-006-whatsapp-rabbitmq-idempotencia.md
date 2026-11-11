# ADR-006: Integração WhatsApp, RabbitMQ e processamento idempotente

## Metadados

| Campo                     | Valor                               |
| ------------------------- | ----------------------------------- |
| Status                    | Accepted                            |
| Data                      | 2026-11-11                          |
| Responsáveis              | Arquitetura, Engenharia e Segurança |
| SPEC relacionada          | SPEC-004                            |
| Substitui/substituída por | —                                   |

## Contexto

A Fase 3 precisa receber eventos da WhatsApp Cloud API, processá-los sem perder
mensagens e notificar a API em tempo real. O projeto já possui RabbitMQ no
Compose e `RABBITMQ_URL` no schema de ambiente, mas nenhum cliente ou consumer.
Também não existem conversas, mensagens ou mapeamento de número para dono.

O caminho crítico tem restrições distintas: o webhook da Meta exige resposta
rápida e validação de assinatura; o processamento pode falhar por indisponibilidade
transitória do banco; e a subscription é apenas uma notificação de UI, não uma
fonte de verdade. Sem decisão registrada, o risco é misturar processamento
síncrono, retentativas sem idempotência e eventos com dados pessoais no broker.

## Drivers da decisão

- O webhook precisa validar `X-Hub-Signature-256` sobre o corpo bruto e
  responder antes do timeout da Meta.
- O processamento deve sobreviver a reinícios e falhas transitórias sem perder
  mensagens nem duplicar registros.
- O worker já existe como processo separado e é o local natural para consumo.
- A subscription `messageReceived` deve reutilizar `graphql-ws` e Redis da Fase
  2, sem acoplar o worker ao schema GraphQL.
- Dados pessoais devem circular o mínimo possível e não aparecer em logs.
- O ambiente local e os testes precisam funcionar sem credenciais reais da Meta.

## Alternativas consideradas

### Alternativa A: processar o webhook de forma síncrona na API

- Benefícios: menos componentes; resposta reflete o processamento.
- Custos e riscos: latência e falhas do banco afetam a resposta à Meta;
  retentativas da Meta duplicam trabalho; a API deixa de ser BFF fina.

### Alternativa B: usar `@nestjs/microservices` com transporte AMQP

- Benefícios: integração pronta com NestJS; menos código de conexão.
- Custos e riscos: controle limitado de confirmação, retry, DLQ e headers;
  acoplamento ao ciclo de vida do microserviço; difícil testar topologia.

### Alternativa C: RabbitMQ com `amqplib`, retry por TTL e DLQ

- Benefícios: controle explícito de publisher confirms, ack manual, headers,
  retry com backoff e DLQ; topologia testável; alinhado ao ADR-002.
- Custos e riscos: mais código operacional; exige idempotência e observabilidade
  cuidadosas; RabbitMQ vira dependência do fluxo de entrada.

### Alternativa D: outbox transacional com relay para o broker

- Benefícios: elimina a janela entre commit e publicação; maior garantia.
- Custos e riscos: nova tabela, job de relay e complexidade operacional;
  desproporcional para uma demo e para eventos de UI.

## Decisão

Adotar a Alternativa C, com as seguintes regras:

- **Provider**: porta `WhatsAppProvider` com `MockWhatsAppProvider` (padrão em
  desenvolvimento/teste) e `CloudWhatsAppProvider` (produção). A URL base e a
  versão da Graph API são configuráveis; nenhuma URL fornecida pelo usuário é
  usada. Em produção, o provider `mock` é rejeitado na validação de ambiente.
- **Webhook**: `GET /webhooks/whatsapp` valida `hub.verify_token` e devolve o
  challenge; `POST /webhooks/whatsapp` exige HMAC-SHA256 em tempo constante
  sobre o corpo bruto, limite de 1 MB e responde `200` após publicar. Se o
  broker estiver indisponível, responde `503` para a Meta reenviar.
- **Publicação**: `amqplib` com exchange e fila duráveis, mensagens persistentes
  e publisher confirms. A API extrai apenas mensagens de texto suportadas e
  publica um evento por mensagem; payloads de status são ignorados.
- **Consumo**: o worker consome com `prefetch` limitado e ack manual. A
  idempotência é garantida por `Message.externalId` único; duplicata é
  confirmada sem novo efeito.
- **Retentativas**: falhas transitórias usam filas de retry com TTL de 5 s,
  30 s e 5 min; após três retentativas, o evento vai para a DLQ. Evento
  inválido ou erro permanente vai direto para a DLQ. A DLQ não tem replay
  automático nesta fase.
- **Tempo real**: após o commit, o worker publica no Redis um evento mínimo
  (`messageId`, `conversationId`, `ownerId`, `occurredAt`). A API busca a
  mensagem, autoriza pelo dono e entrega `messageReceived`. A publicação é
  best-effort; falha no Redis não desfaz a mensagem.
- **Envio**: `sendMessage` grava `QUEUED`, chama o provider com timeout,
  atualiza para `SENT` ou `FAILED` e retorna a mensagem. `clientMessageId`
  opcional e único por conversa torna retentativas do cliente idempotentes.
- **Mapeamento de dono**: `WhatsAppAccount` liga `phoneNumberId` a um
  `ownerId`. Remetente desconhecido cria contato para o dono da conta, com
  `email` opcional e telefone normalizado; contatos existentes são resolvidos
  por `(ownerId, phoneNormalized)`.
- **Sem outbox**: aceita-se at-least-once no broker e exactly-once apenas no
  efeito de banco via idempotência. A janela entre commit e evento Redis é
  aceitável porque a subscription é notificação, não fonte de verdade.

## Consequências

### Positivas

- Webhook rápido e resiliente a indisponibilidade do banco e do processamento.
- Retentativas seguras por idempotência e DLQ explícita.
- Worker desacoplado do schema GraphQL e da autenticação de usuário.
- Provider Mock permite testes e demo sem credenciais reais.
- Eventos em tempo real sem payload de mensagem no Redis.

### Negativas e riscos

- RabbitMQ passa a ser dependência do fluxo de entrada; indisponibilidade
  impede novos recebimentos e gera `503`.
- At-least-once exige disciplina de idempotência em todo consumer futuro.
- Eventos podem chegar fora de ordem quando há retry; a UI deve ordenar por
  `sentAt`/`id`.
- Mensagens ficam na DLQ sem ferramenta de replay nesta fase; a DLQ contém
  payload com texto e exige expurgo/retenção antes de dados reais.
- `sendMessage` síncrono pode sofrer timeout da Cloud API; o estado `FAILED` é
  registrado, mas não há retentativa automática para evitar duplicidade.
- A mudança de `Contact.email` para opcional é uma quebra de contrato da Fase 1
  aceita porque ainda não há consumidor externo.

## Implementação e migração

- Compatibilidade: adiciona rotas REST, modelos e dependências `amqplib`; a API
  continua funcionando sem broker para leitura e operações existentes, mas o
  webhook responde `503` até a conexão ser restabelecida.
- Etapas: modelos e migration; provider e configuração; webhook e publicação;
  topologia e consumer; GraphQL de conversas/mensagens; subscription; testes;
  documentação e rastreabilidade.
- Rollback: desabilitar o consumer e a rota de webhook por configuração;
  reverter a migration e o commit da fase; o CRUD das fases anteriores
  permanece.
- Observabilidade: logs de webhook aceito/rejeitado, publicação, ack, retry,
  DLQ e falha de Redis, com IDs técnicos e telefone mascarado; nunca logar
  corpo de mensagem, token ou assinatura.

## Evidências e validação

- Pendente de aprovação humana e da implementação da SPEC-004.
- Evidências esperadas: teste de challenge, HMAC inválido, limite de corpo,
  publicação/`503`, deduplicação, retry/DLQ, IDOR, `sendMessage` com Mock,
  subscription autorizada e falha de Redis sem perda da mensagem.
