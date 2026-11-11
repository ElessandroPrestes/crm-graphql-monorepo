# Discovery — Fase 3: WhatsApp, eventos e LGPD

## Metadados

| Campo       | Valor                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Status      | Aceito em 2026-11-11                                                                           |
| Responsável | Descoberta de produto/UX e engenharia                                                          |
| Criado      | 2026-11-11                                                                                     |
| Atualizado  | 2026-11-11                                                                                     |
| SPEC alvo   | SPEC-004                                                                                       |
| Fontes      | `PROJECT.md`, `ROADMAP.md`, `knowledge/modules/crm-domain.md`, ADR-002, código das Fases 1 e 2 |

## Fatos conhecidos

- As Fases 1 e 2 entregaram autenticação REST, RBAC por `ownerId`, GraphQL
  code-first, contatos, empresas, negócios, atividades, subscriptions
  `graphql-ws` e cache Redis.
- Não existem `Conversation`, `Message` ou `WhatsAppAccount` no schema Prisma,
  nem módulo de WhatsApp, cliente AMQP ou consumer no worker.
- RabbitMQ 4.4.0 está no Compose e `RABBITMQ_URL` existe no schema base de
  ambiente, mas nenhum código abre conexão; `pnpm infra:up` já sobe o broker.
- O worker é um esqueleto NestJS com health checks HTTP, sem acesso a Prisma,
  Redis ou RabbitMQ.
- `Contact.email` é obrigatório e `Contact.phone` é texto livre, opcional e sem
  unicidade ou normalização. Um remetente desconhecido não pode virar contato
  sem e-mail no modelo atual.
- A API usa o body parser JSON global; não há captura do corpo bruto nem
  cabeçalho de assinatura para validar HMAC.
- O Redis pub/sub da Fase 2 (canal `deals.moved`) é reutilizável, mas o worker
  não possui cliente Redis.
- O roadmap prevê para a Fase 3: porta `WhatsAppProvider` com Mock e Cloud API,
  webhook REST com HMAC-SHA256 e limite de corpo, RabbitMQ com worker
  idempotente, retentativas/DLQ, subscription `messageReceived`, mutation
  `sendMessage` e exportação/exclusão de dados de contato.
- Não há interface web até a Fase 4; a entrega da Fase 3 é de API, worker e
  contratos.

## Usuários e trabalhos

| Grupo    | Objetivo principal                                             | Necessidade mínima                                            |
| -------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| `SELLER` | Ler e responder conversas dos próprios contatos                | Ver apenas suas conversas e enviar mensagens em seu nome      |
| `ADMIN`  | Acompanhar conversas e apoiar vendedores                       | Ver todas as conversas e enviar mensagens                     |
| Suporte  | Atender pedidos de exportação/exclusão (LGPD)                  | Exportar e apagar dados do contato sem vazar outros registros |
| Demo/QA  | Validar recebimento, idempotência e tempo real sem dados reais | Seed e Mock com mensagens fictícias e eventos reproduzíveis   |

## Escopo mínimo proposto

1. Modelos Prisma `Conversation`, `Message` e `WhatsAppAccount`, enums de canal,
   direção e status; migration e seed fictício.
2. Porta `WhatsAppProvider` com adaptadores `Mock` e `Cloud API`, selecionados
   por configuração validada.
3. Webhook REST `GET`/`POST /webhooks/whatsapp` com verificação de token,
   HMAC-SHA256 em tempo constante sobre o corpo bruto, limite de corpo e
   resposta rápida.
4. Publicação durável no RabbitMQ com confirmação; worker com consumo manual,
   idempotência por `externalId`, retentativas com backoff e DLQ.
5. GraphQL para listar conversas, consultar mensagens, enviar mensagem e
   receber `messageReceived` em tempo real com autorização por propriedade.
6. Exportação de dados do contato e exclusão com cascata LGPD, preservando
   negócios sem vínculo e registrando auditoria sem PII.
7. Testes unitários e de integração com PostgreSQL, Redis e RabbitMQ via
   Testcontainers, incluindo HMAC, duplicidade, retry/DLQ, IDOR e subscription.
8. Geração de schema, codegen, drift check, documentação e rastreabilidade.

## Hipóteses a validar

| Hipótese                                                                                                             | Impacto se rejeitada                                              |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Um `WhatsAppAccount` mapeia `phone_number_id` para um `ownerId`; o número é provisionado por seed/config, sem CRUD   | Modelo de account, seed e resolução de dono no webhook mudam      |
| Remetente desconhecido cria contato para o dono da conta, com `email` opcional e telefone normalizado                | Modelo de contato, migração e contrato GraphQL de `Contact` mudam |
| Apenas mensagens recebidas geram `messageReceived`; status de entrega/leitura ficam fora da fase                     | Modelo de status, webhook e eventos aumentam de escopo            |
| RabbitMQ entrega ao menos uma vez; idempotência por `externalId` evita duplicatas                                    | Necessidade de exactly-once, outbox ou deduplicação adicional     |
| Retentativas usam 3 esperas (5 s, 30 s, 5 min) e depois DLQ; mensagens inválidas vão direto para DLQ                 | Topologia, tempos e critérios de aceitação mudam                  |
| O evento em tempo real carrega apenas IDs; a API busca e autoriza a mensagem antes de entregar                       | Contrato do evento, PII no Redis e custo por evento mudam         |
| Redis continua best-effort: falha de publicação não desfaz a mensagem já gravada                                     | Requisito de entrega em tempo real e tratamento de falha mudam    |
| `sendMessage` chama o provider de forma síncrona e persiste `QUEUED → SENT`/`FAILED`, com `clientMessageId` opcional | Contrato da mutation, idempotência e tratamento de timeout mudam  |
| Exclusão de contato é física e cascateia atividades, conversas e mensagens; negócios ficam com `contactId` nulo      | Estratégia de retenção, integridade e reversibilidade mudam       |
| Retenção automática e obrigações de backup ficam fora da fase; apenas dados fictícios são usados                     | Escopo de LGPD, jobs de limpeza e documentação legal mudam        |

## Fluxos propostos

1. **Verificação do webhook**: Meta chama `GET` com `hub.mode=subscribe`,
   `hub.verify_token` e `hub.challenge`; a API compara o token e devolve o
   challenge em texto puro.
2. **Recebimento**: Meta chama `POST` com corpo bruto e
   `X-Hub-Signature-256`; a API valida HMAC, extrai mensagens suportadas,
   publica eventos duráveis e responde `200` sem processar regra de negócio.
3. **Processamento**: o worker consome, valida o evento, resolve a conta e o
   contato, cria/reutiliza a conversa, grava a mensagem de forma idempotente e
   confirma. Falhas transitórias vão para retry; definitivas ou esgotadas vão
   para DLQ.
4. **Tempo real**: após o commit, o worker publica um evento mínimo no Redis;
   a API entrega `messageReceived` apenas a assinantes autorizados.
5. **Envio**: o usuário chama `sendMessage`; a API grava `QUEUED`, chama o
   provider com timeout, atualiza para `SENT` ou `FAILED` e retorna a mensagem.
6. **LGPD**: o usuário autorizado exporta os dados do contato ou exclui o
   contato; a exclusão remove dados dependentes e preserva negócios.

## Medidas de sucesso

- Um webhook com assinatura válida é aceito e processado; assinatura inválida
  ou corpo acima do limite é rejeitado sem publicar evento.
- A mesma mensagem entregue duas vezes pela Meta gera uma única linha e um
  único evento em tempo real.
- Falhas transitórias são reprocessadas com backoff; após o limite, a mensagem
  fica na DLQ sem bloquear a fila principal.
- `SELLER A` não lê, envia nem recebe eventos de conversas de `SELLER B`;
  `ADMIN` acessa todas.
- Exportação retorna contato, negócios, atividades, conversas e mensagens do
  contato; exclusão remove os dados dependentes e mantém negócios íntegros.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, testes de integração
  e `schema:check` passam sem drift.

## Fora de escopo

- Interface web, inbox visual, i18n e temas (Fase 4).
- Mídia, áudio, documentos, templates, botões e mensagens interativas.
- Webhooks de status (`sent`, `delivered`, `read`) e confirmação de leitura.
- Replay automático de DLQ, ferramenta de administração e exactly-once.
- CRUD de `WhatsAppAccount`, múltiplos números por vendedor e multilocação.
- Retenção automática, anonimização, backup e requisitos jurídicos completos.
- Rate limit de webhook/GraphQL, persisted queries e benchmark k6 (Fase 5).

## Riscos e questões abertas

| Questão ou risco                                             | Proposta para validação                                                              | Responsável        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------ |
| Como resolver o dono de uma mensagem recebida?               | `WhatsAppAccount` com `phoneNumberId` único, provisionado por seed/env               | Produto/Engenharia |
| O que fazer com remetente desconhecido?                      | Criar contato no dono da conta, com nome do perfil e telefone; e-mail opcional       | Produto            |
| Tornar `Contact.email` opcional quebra o contrato da Fase 1? | Sim; consumidores ainda não existem e o campo passa a ser nullable com migração      | Produto/Engenharia |
| Como evitar contatos duplicados pelo mesmo telefone?         | `phoneNormalized` com unicidade por `ownerId`; normalizar no create/update e inbound | Engenharia         |
| Status de entrega/leitura entram na fase?                    | Não; apenas `RECEIVED`, `QUEUED`, `SENT` e `FAILED`                                  | Produto            |
| Exclusão de contato deve ser física ou lógica?               | Física com cascata; negócios preservados com `contactId` nulo; auditoria sem PII     | Produto/Segurança  |
| Exportação deve incluir mensagens?                           | Sim, contato, negócios, atividades, conversas e mensagens em payload tipado          | Produto/Segurança  |
| O que acontece se o RabbitMQ cair no webhook?                | Responder `503` para a Meta reenviar; não gravar estado parcial na API               | Engenharia         |
| O que acontece se o Redis cair no worker?                    | Mensagem permanece gravada; evento em tempo real é perdido e a falha é logada        | Engenharia         |
| Como lidar com duplicidade de `sendMessage`?                 | `clientMessageId` opcional único por conversa; repeated retorna a mensagem existente | Engenharia         |
| Testcontainers suportam RabbitMQ na CI?                      | Adicionar container RabbitMQ efêmero; validar imagem e health antes dos testes       | Engenharia/QA      |
| Qual versão da Cloud API usar?                               | URL base e versão configuráveis; testes usam `Mock` e não dependem da Meta           | Engenharia         |

## Recomendação

Prosseguir com a SPEC-004, ADR-006 (mensageria e WhatsApp) e ADR-007 (LGPD),
mantendo as hipóteses acima explícitas. Nenhuma implementação deve começar
antes da aprovação humana do discovery, das ADRs, da SPEC-004 e da TASK-004-01.
