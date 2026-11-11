# SPEC: Fase 3 — WhatsApp, eventos e LGPD

## Metadados

| Campo                      | Valor                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| ID                         | SPEC-004                                                                                                  |
| Status                     | Approved                                                                                                  |
| Responsável                | Engenharia                                                                                                |
| Revisores                  | Produto / Engenharia / QA / Segurança                                                                     |
| Criado                     | 2026-11-11                                                                                                |
| Atualizado                 | 2026-11-11                                                                                                |
| Lançamento alvo            | Fase 3                                                                                                    |
| Briefing de UX relacionado | N/A — fase de API e worker, sem interface de produto                                                      |
| Especificação de design    | N/A — fase de API e worker, sem interface de produto                                                      |
| ADRs relacionadas          | ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007                                                      |
| Refs:                      | Discovery: `docs/discovery-fase-3.md`; ADRs: ADR-006, ADR-007; Testes: `apps/api/test/fase-3.e2e.test.ts` |

## Problema e resultado

O CRM acompanha contatos, negócios e atividades, mas não recebe nem envia
mensagens de WhatsApp. Sem isso, o inbox em tempo real prometido pelo produto
não existe e o usuário precisa sair do CRM para conversar com o cliente. A fase
também precisa tratar dados pessoais de forma mínima: exportar e eliminar os
dados de um contato sem vazar registros de outros donos.

Resultado esperado: a Meta entrega mensagens ao webhook; a API valida a
assinatura e publica com segurança; o worker grava contatos, conversas e
mensagens de forma idempotente; o usuário lê a conversa, envia respostas e
recebe novas mensagens em tempo real; e operações de exportação/exclusão LGPD
funcionam com autorização por propriedade.

A implementação só começa após aprovação humana deste discovery, da SPEC-004,
das ADR-006/ADR-007 e da TASK-004-01.

## Escopo

### No escopo

- Prisma 7: `Conversation`, `Message`, `WhatsAppAccount`, enums de canal,
  direção e status; `Contact.email` opcional e `Contact.phoneNormalized`;
  migration e seed fictício.
- Porta `WhatsAppProvider` com adaptadores `Mock` e `Cloud API`, configuração
  validada e seleção por ambiente.
- `GET`/`POST /webhooks/whatsapp`: challenge, HMAC-SHA256, corpo bruto, limite
  de 1 MB e resposta rápida.
- Publicação durável no RabbitMQ e worker com ack manual, idempotência,
  retentativas com backoff e DLQ.
- GraphQL: listar/consultar conversas, listar mensagens, `sendMessage` e
  subscription `messageReceived` autenticada e autorizada.
- Exportação tipada de dados do contato e exclusão física com cascata,
  preservando negócios.
- Testes unitários e de integração com PostgreSQL, Redis e RabbitMQ via
  Testcontainers.
- Atualização de schema/codegen, `PROJECT.md`, `ROADMAP.md`,
  `docs/architecture.md`, `docs/security.md`, knowledge e rastreabilidade.

### Fora do escopo

- Interface web, inbox visual, i18n e temas (Fase 4).
- Mídia, áudio, documentos, templates, botões e mensagens interativas.
- Webhooks de status de entrega/leitura e confirmação de leitura.
- Replay automático de DLQ, painel de administração e exactly-once.
- CRUD de `WhatsAppAccount`, múltiplos números por vendedor e multilocação.
- Retenção automática, anonimização, backup e política jurídica completa.
- Rate limit de webhook/GraphQL, persisted queries e benchmark k6 (Fase 5).

## Experiência do usuário

### Usuário principal e contexto

- Grupo: `SELLER` e `ADMIN` de um time pequeno de vendas.
- Objetivo: acompanhar conversas de WhatsApp dos contatos e responder sem sair
  do CRM.
- Contexto: clientes REST/GraphQL; a interface web só existe na Fase 4. A Meta
  é o produtor externo e não tem usuário no sistema.

### Fluxo do usuário

1. A Meta verifica o webhook com `hub.challenge`.
2. A Meta entrega uma mensagem; a API valida HMAC e publica um evento.
3. O worker resolve conta e contato, cria/reutiliza a conversa e grava a
   mensagem de forma idempotente.
4. Clientes autenticados recebem `messageReceived` e consultam a conversa.
5. O usuário envia uma resposta por `sendMessage`; a API chama o provider e
   devolve a mensagem com status.
6. Um usuário autorizado exporta os dados do contato ou exclui o contato.

### Estados de interface

N/A — não há interface nesta fase. Os estados observáveis são respostas HTTP,
erros GraphQL padronizados, status de mensagem e eventos de subscription.

### Comportamento responsivo e compatibilidade

N/A para UI. A API e o worker devem funcionar em Node.js 26, PostgreSQL 18,
Redis 8 e RabbitMQ 4.4.

### Sistema de design

N/A.

### Acessibilidade

N/A para UI. Mensagens de erro devem ser claras e não expor detalhes internos.

### Conteúdo

Mensagens genéricas para recursos de outro dono; validação específica para
limites de texto e paginação; `503` quando o broker estiver indisponível;
`502` quando o provider de saída falhar.

### Análises e feedback

N/A — sem analytics nesta fase. Logs de webhook, fila e worker usam IDs
técnicos, telefone mascarado e nunca o corpo da mensagem.

## Comportamento funcional

- `WhatsAppAccount` liga `phoneNumberId` único a um `ownerId`; é provisionada
  por seed/config, sem CRUD nesta fase. Webhook de conta desconhecida é
  registrado e respondido com `200` sem publicar evento.
- `GET /webhooks/whatsapp` aceita `hub.mode=subscribe` e compara
  `hub.verify_token` com `WHATSAPP_VERIFY_TOKEN`; token inválido retorna `403`.
  Token válido retorna o challenge em texto puro.
- `POST /webhooks/whatsapp` valida `X-Hub-Signature-256` como
  `sha256=<hex>` sobre o corpo bruto, em tempo constante, usando
  `WHATSAPP_APP_SECRET`. Assinatura ausente/inválida retorna `401`; corpo acima
  de 1 MB retorna `413`.
- Payload válido sem mensagens suportadas (por exemplo, apenas status) retorna
  `200` sem publicar. JSON malformado retorna `400`.
- A API extrai mensagens de texto, valida o contrato com zod e publica um
  evento por mensagem no RabbitMQ com confirmação. Se o broker estiver
  indisponível, retorna `503` sem gravar estado parcial.
- `Conversation` pertence a um `ownerId`, tem canal `WHATSAPP`, conta, contato,
  `lastMessageAt` e é única por `(contactId, channel)`. `Message` pertence a uma
  conversa, tem direção `INBOUND`/`OUTBOUND`, status `RECEIVED`/`QUEUED`/
  `SENT`/`FAILED`, texto, `externalId` único e `sentAt`; `lastMessageAt` da
  conversa é atualizado em mensagens recebidas e enviadas.
- Remetente desconhecido cria contato no dono da conta, com nome do perfil
  (quando houver), telefone normalizado, `lastName` derivado e `email` nulo.
  Contato existente é resolvido por `(ownerId, phoneNormalized)`.
- Duplicata de `externalId` é confirmada sem criar nova mensagem nem novo
  evento. Mensagens inválidas vão para a DLQ.
- Falhas transitórias usam retry com TTL de 5 s, 30 s e 5 min; após três
  retentativas, o evento vai para a DLQ. O worker reconecta ao broker após
  queda e encerra canal/conexão de forma limpa.
- `conversations` lista apenas conversas do usuário (`ADMIN` vê todas), ordenada
  por `lastMessageAt DESC, id DESC`, com cursor e máximo de 100.
- `messages(conversationId)` lista apenas mensagens de conversa autorizada,
  ordenada por `sentAt DESC, id DESC`, com cursor e máximo de 100.
- `sendMessage(conversationId, text, clientMessageId?)` exige conversa
  autorizada, texto de 1 a 4096 caracteres e provider disponível. Grava
  `QUEUED`, chama o provider com timeout de 10 s e atualiza para `SENT` com
  `externalId` ou para `FAILED` com erro genérico. Se `clientMessageId` já
  existir na conversa, retorna a mensagem existente sem reenviar.
- `messageReceived(conversationId: ID)` entrega apenas mensagens recebidas de
  conversas autorizadas. Sem `conversationId`, entrega eventos de todas as
  conversas do usuário. Evento Redis carrega apenas IDs; a API busca e autoriza
  antes de entregar.
- Após o commit, o worker publica o evento no Redis de forma best-effort. Falha
  no Redis é registrada, mas não desfaz a mensagem.
- `exportContactData(contactId)` retorna `exportedAt`, contato, empresa,
  negócios, atividades, conversas e mensagens; é escopada por dono.
- `deleteContact(id)` remove fisicamente o contato e, por cascata, atividades,
  conversas e mensagens; negócios ficam com `contactId` nulo. A operação
  registra auditoria sem PII.
- Provider `Mock` é o padrão em desenvolvimento/teste e não acessa a rede.
  Provider `Cloud` usa URL base e versão configuráveis, access token e
  `phoneNumberId` da conta; em produção, `WHATSAPP_PROVIDER=mock` é rejeitado.
- Logs mascaram telefone e nunca incluem corpo de mensagem, token, assinatura ou
  headers sensíveis.

## Requisitos não-funcionais

- Segurança e privacidade: HMAC em tempo constante, limite de corpo, token de
  verificação, JWT em GraphQL, autorização por propriedade, logs sem PII e
  segredos somente em ambiente.
- Desempenho e capacidade: webhook responde após publicação, sem processar
  regra de negócio; prefetch limitado; listas com cursor e máximo de 100;
  conversas indexadas por dono e `lastMessageAt`; mensagens indexadas por
  conversa e `sentAt`.
- Confiabilidade e recuperação: RabbitMQ durável com publisher confirms, ack
  manual, retry com backoff e DLQ; reconexão do worker; idempotência por
  `externalId`; Redis best-effort para tempo real.
- Acessibilidade: N/A para UI; erros de API claros.
- Compatibilidade: Node.js 26, PostgreSQL 18, Redis 8, RabbitMQ 4.4, Prisma 7,
  GraphQL 16 e Apollo Server 5.
- Observabilidade: logs estruturados de webhook, publicação, ack, retry, DLQ,
  envio e falha de Redis; erros sem stack em produção.

## Critérios de aceitação

### AC-301: Provider WhatsApp e configuração

```gherkin
Dado o ambiente de desenvolvimento ou teste
Quando a API iniciar sem credenciais da Meta
Então o provider Mock é selecionado
E em produção o provider Mock é rejeitado
E o provider Cloud exige token, app secret, verify token e phone number id
```

Evidência necessária: automatizada.

### AC-302: Verificação do webhook

```gherkin
Dado o token de verificação configurado
Quando a Meta chamar GET /webhooks/whatsapp com o challenge correto
Então a API devolve o challenge em texto puro
E um token inválido retorna 403 sem publicar evento
```

Evidência necessária: automatizada.

### AC-303: HMAC e limite de corpo

```gherkin
Dado um corpo JSON de mensagem
Quando o POST trouxer X-Hub-Signature-256 válido
Então a API aceita e publica o evento
E assinatura ausente ou inválida retorna 401
E corpo acima de 1 MB retorna 413
E JSON malformado retorna 400
```

Evidência necessária: automatizada.

### AC-304: Publicação e indisponibilidade do broker

```gherkin
Dado um webhook válido
Quando a API publicar no RabbitMQ
Então a mensagem é persistente e confirmada
E se o broker estiver indisponível a API retorna 503 sem gravar estado parcial
```

Evidência necessária: automatizada.

### AC-305: Resolução de conta, contato e conversa

```gherkin
Dado um evento de mensagem para uma conta ativa
Quando o worker processar um remetente conhecido
Então reutiliza o contato e a conversa existentes
E quando o remetente for desconhecido cria contato no dono da conta
E reutiliza a conversa única por contato e canal
```

Evidência necessária: automatizada.

### AC-306: Idempotência de mensagens

```gherkin
Dado um evento já processado com o mesmo externalId
Quando o worker receber a duplicata
Então não cria nova mensagem nem novo evento em tempo real
E confirma o evento sem erro
```

Evidência necessária: automatizada.

### AC-307: Retentativas e DLQ

```gherkin
Dado um evento cujo processamento falha de forma transitória
Quando o worker falhar até o limite de retentativas
Então as tentativas usam backoff configurado
E o evento termina na DLQ sem bloquear a fila principal
E evento inválido vai direto para a DLQ
```

Evidência necessária: automatizada.

### AC-308: Conversas e mensagens no GraphQL

```gherkin
Dado um usuário autenticado com conversas
Quando listar conversas e mensagens com first e after
Então vê apenas registros autorizados em ordem estável
E o cursor avança sem duplicar ou pular
E o máximo de 100 é respeitado
```

Evidência necessária: automatizada.

### AC-309: Envio de mensagem

```gherkin
Dado um usuário autenticado e uma conversa autorizada
Quando enviar um texto com o provider Mock
Então a mensagem é persistida como SENT com externalId
E falha do provider marca FAILED e retorna erro genérico
E repeated com o mesmo clientMessageId retorna a mensagem existente
```

Evidência necessária: automatizada.

### AC-310: Subscription messageReceived

```gherkin
Dado um cliente autenticado conectado via graphql-ws
Quando uma mensagem recebida for gravada para uma conversa autorizada
Então o cliente recebe messageReceived com a mensagem
E não recebe mensagens de outro dono
E conexão sem token válido é rejeitada no connection_init
```

Evidência necessária: automatizada.

### AC-311: Tempo real best-effort

```gherkin
Dado que o Redis está indisponível
Quando o worker gravar uma mensagem recebida
Então a mensagem permanece no banco e o processamento é confirmado
E a falha de publicação é registrada sem corpo de mensagem
```

Evidência necessária: automatizada.

### AC-312: Exportação de dados do contato

```gherkin
Dado um contato com negócios, atividades e conversas
Quando o dono ou ADMIN chamar exportContactData
Então recebe contato, empresa, negócios, atividades, conversas e mensagens
E não recebe registros de outro dono
```

Evidência necessária: automatizada.

### AC-313: Exclusão de dados do contato

```gherkin
Dado um contato com atividades, conversas e mensagens
Quando o dono ou ADMIN chamar deleteContact
Então contato, atividades, conversas e mensagens são removidos
E negócios permanecem com contactId nulo
E a operação registra auditoria sem PII
```

Evidência necessária: automatizada.

### AC-314: RBAC e IDOR em conversas e LGPD

```gherkin
Dado uma conversa ou contato do SELLER A
Quando o SELLER B tentar ler, enviar, exportar ou excluir
Então a operação é negada sem revelar se o recurso existe
E o ADMIN consegue acessar
```

Evidência necessária: automatizada.

### AC-315: Validação de entrada e limites

```gherkin
Dado um input inválido
Quando houver texto vazio ou acima de 4096 caracteres, cursor inválido,
telefone impossível ou campo desconhecido
Então a API retorna erro de validação
E nenhum registro parcial é criado
```

Evidência necessária: automatizada.

### AC-316: Segredos e logs

```gherkin
Dado um webhook, envio ou processamento
Quando os logs forem inspecionados
Então não contêm token, assinatura, corpo de mensagem ou telefone completo
E credenciais da Meta vêm apenas do ambiente
```

Evidência necessária: automatizada/manual.

### AC-317: Schema GraphQL e drift

```gherkin
Dado o código da Fase 3
Quando o schema for gerado e verificado
Então os tipos de conversa, mensagem, envio, exportação e subscription estão versionados
E não há drift
```

Evidência necessária: automatizada.

### AC-318: Quality gates com RabbitMQ

```gherkin
Dado o repositório com Docker
Quando lint, typecheck, test, build, integração e schema:check rodarem
Então todos passam
E a integração sobe PostgreSQL, Redis e RabbitMQ efêmeros
```

Evidência necessária: automatizada.

### AC-319: Documentação e rastreabilidade

```gherkin
Dado o fim da implementação
Quando a documentação e a matriz forem revisadas
Então PROJECT, ROADMAP, arquitetura, segurança, SPEC, TASK e matriz refletem a Fase 3
```

Evidência necessária: manual.

### AC-320: Resiliência do worker

```gherkin
Dado o worker conectado ao broker
Quando a conexão cair e voltar
Então o worker reconecta e volta a consumir
E no shutdown fecha canal e conexão sem deixar mensagem em processamento sem ack
```

Evidência necessária: automatizada/manual.

## Abordagem técnica

- Prisma: `WhatsAppAccount` (`phoneNumberId` único, `ownerId`, número de
  exibição), `Conversation` (`channel`, `contactId`, `accountId`, `ownerId`,
  `lastMessageAt`) e `Message` (`conversationId`, `direction`, `status`,
  `body`, `externalId` único, `clientMessageId`, `sentAt`, `errorCode`), com
  índices de escopo e ordenação. `Contact.email` passa a nullable e ganha
  `phoneNormalized` com unicidade por `ownerId`.
- Módulos NestJS na API: `whatsapp` (provider, webhook, publicação),
  `conversations` e `messages` (GraphQL), reutilizando auth, Redis e
  DataLoaders. No worker: `whatsapp-consumer`, conexão AMQP e publicação Redis.
- Webhook: `NestFactory.create(AppModule, { rawBody: true })` ou middleware
  equivalente para preservar o corpo bruto; limite global de 1 MB; validação
  manual de query e assinatura; sem guard JWT.
- Mensageria: `amqplib` com exchange direct durável `nexo.events`, fila
  `whatsapp.inbound`, DLX `nexo.dlx`, retry queues `whatsapp.inbound.retry.5s`,
  `.30s`, `.5m` e `whatsapp.inbound.dlq`; publisher confirms, mensagens
  persistentes, prefetch 10 e ack manual.
- Contrato de evento compartilhado em `@nexo/shared` com zod: evento de
  mensagem recebida e evento mínimo de tempo real.
- GraphQL: connection/cursor própria para conversas e mensagens; `Message`
  com direção/status; `sendMessage` com provider injetado; `messageReceived`
  usando o `DealEventsService`/Redis da Fase 2 como base.
- LGPD: exportação tipada e exclusão com cascata; auditoria via logger
  estruturado; sem PII.
- Testcontainers: PostgreSQL, Redis e RabbitMQ efêmeros; worker consumer
  instanciado no teste com Mock provider e banco de teste; falhas injetadas
  para retry/DLQ.

Alternativas rejeitadas: processamento síncrono no webhook; `@nestjs/microservices`
AMQP; outbox transacional; pub/sub em memória; exclusão lógica; anonimização de
texto livre; exactly-once; e-mail sintético para contatos de WhatsApp.

## Entrega e operações

- Plano de implantação: ambiente local e CI; deploy fica para a Fase 5.
- Plano de migração: migration incremental com novos modelos, enums, `email`
  nullable e `phoneNormalized`; seed atualizado com contas e mensagens
  fictícias.
- Plano de reversão: desabilitar webhook/consumer por configuração; reverter
  commit e migration; dados de WhatsApp da fase são fictícios.
- Monitoramento e alertas: logs de webhook, publicação, retry, DLQ, envio e
  Redis; health checks existentes; sem stack em produção.
- Suporte: seed recriável; DLQ inspecionável pelo management UI; sem replay
  automático.

## Riscos e dependências

| Risco ou dependência                                     | Impacto | Probabilidade | Mitigação                                                           | Responsável       |
| -------------------------------------------------------- | ------- | ------------- | ------------------------------------------------------------------- | ----------------- |
| Webhook exposto sem HMAC ou com comparação insegura      | Alto    | Média         | HMAC-SHA256 em tempo constante sobre corpo bruto e testes negativos | Segurança         |
| RabbitMQ indisponível bloqueia recebimento               | Alto    | Média         | 503 para retry da Meta, reconexão e DLQ documentada                 | Engenharia        |
| Duplicidade ou reordenação de eventos                    | Alto    | Alta          | Idempotência por `externalId`; UI ordena por `sentAt`/`id`          | Engenharia        |
| Exclusão LGPD remover histórico comercial esperado       | Alto    | Média         | Preservar negócios com `contactId` nulo; documentar na UI futura    | Produto/Segurança |
| `Contact.email` nullable quebrar consumidores da Fase 1  | Médio   | Baixa         | Ainda não há consumidor externo; atualizar testes e schema          | Engenharia        |
| PII em logs, eventos Redis ou DLQ                        | Alto    | Média         | IDs técnicos, telefone mascarado e sem corpo de mensagem            | Segurança         |
| Cloud API mudar versão/contrato                          | Médio   | Média         | URL/versão configuráveis, Mock nos testes e timeout                 | Engenharia        |
| `sendMessage` duplicar em timeout do provider            | Médio   | Média         | `clientMessageId` opcional e estado `FAILED` explícito              | Engenharia        |
| Testcontainers com RabbitMQ aumentam tempo de integração | Médio   | Média         | Container efêmero com health check e job de integração              | QA/Engenharia     |
| Retenção e backup LGPD continuam fora do escopo          | Alto    | Média         | Apenas dados fictícios; pendência registrada para dados reais       | Produto/Segurança |

## Questões abertas

| Questão                                   | Responsável        | Data limite | Resolução                                                              |
| ----------------------------------------- | ------------------ | ----------- | ---------------------------------------------------------------------- |
| Como mapear número para dono?             | Produto/Engenharia | Fase 3      | Proposta: `WhatsAppAccount` por `phoneNumberId`, provisionada por seed |
| Remetente desconhecido vira contato?      | Produto            | Fase 3      | Proposta: sim, com e-mail nulo e telefone normalizado                  |
| `Contact.email` pode ser opcional?        | Produto/Engenharia | Fase 3      | Proposta: sim; campo nullable e sem consumidor externo ainda           |
| Status de entrega/leitura entram?         | Produto            | Fase 3      | Proposta: não; apenas `RECEIVED`, `QUEUED`, `SENT`, `FAILED`           |
| Exclusão é física ou lógica?              | Produto/Segurança  | Fase 3      | Proposta: física com cascata; negócios preservados                     |
| Exportação inclui mensagens?              | Produto/Segurança  | Fase 3      | Proposta: sim, contato, negócios, atividades, conversas e mensagens    |
| Broker cai no webhook?                    | Engenharia         | Fase 3      | Proposta: `503` para a Meta reenviar                                   |
| Redis cai no worker?                      | Engenharia         | Fase 3      | Proposta: mensagem persiste; evento em tempo real é best-effort        |
| Retentativas: quantas e com qual backoff? | Engenharia         | Fase 3      | Proposta: 5 s, 30 s, 5 min; depois DLQ                                 |
| Testcontainers suportam RabbitMQ?         | QA/Engenharia      | Fase 3      | Proposta: container efêmero validado no início da implementação        |

## Aprovação

| Papel      | Nome                    | Decisão  | Data       | Notas                                |
| ---------- | ----------------------- | -------- | ---------- | ------------------------------------ |
| Produto    | Solicitante humano      | Aprovado | 2026-11-11 | Aprovação explícita para implementar |
| Design     | —                       | N/A      | —          | API e worker sem UI                  |
| Engenharia | Agente de implementação | Aprovado | 2026-11-11 | Executa TASK-004-01                  |
| QA         | Agente de implementação | Pronto   | 2026-11-11 | Evidências automatizadas por AC      |
| Segurança  | Baseline da SPEC        | Aceito   | 2026-11-11 | Validar HMAC, PII, DLQ e exclusão    |
