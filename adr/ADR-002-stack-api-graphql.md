# ADR-002: Stack da API, mensageria e front-end

## Status

Accepted

## Contexto

O produto exige uma API GraphQL como BFF do front-end, subscriptions em tempo
real, processamento assíncrono de webhooks e um front-end acessível. As
decisões de stack foram fornecidas no briefing do produto.

## Decisão

- **API**: NestJS + Apollo Server (code-first), com módulos por domínio e
  camadas resolver → service → repository.
- **GraphQL**: `@nestjs/graphql` + `graphql` 16, com schema gerado e commitado a
  partir da Fase 1.
- **Dados**: Prisma + PostgreSQL.
- **Tempo real e cache**: Redis pub/sub e cache.
- **Eventos**: RabbitMQ, consumido por um worker NestJS separado.
- **Web**: React + Vite + TypeScript, Apollo Client, React Router,
  react-hook-form + zod, Tailwind CSS, primitivos acessíveis e dnd-kit.
- **WhatsApp**: porta `WhatsAppProvider` com adaptadores Mock e Cloud API.
- **Webhooks, uploads e pagamentos**: REST, não GraphQL, por serem fluxos
  orientados a eventos/arquivos e fora do modelo de consulta do GraphQL.

A Fase 0 implementa apenas o esqueleto HTTP das aplicações; GraphQL, Prisma,
Redis e RabbitMQ entram nas fases seguintes, sem alterar esta decisão.

## Alternativas consideradas

- REST para toda a API: rejeitado porque a visão 360° e a tipagem ponta a ponta
  são requisitos explícitos.
- GraphQL para webhooks: rejeitado por semântica inadequada, necessidade de
  HMAC sobre corpo bruto e resposta rápida sem acoplamento ao schema.
- Monólito único: rejeitado porque o worker precisa escalar e falhar de forma
  independente da API.

## Consequências

- Duas aplicações NestJS compartilham padrões, mas têm ciclos de vida próprios.
- O schema GraphQL será a fonte de tipos do front-end via codegen.
- A complexidade operacional aumenta (Postgres, Redis, RabbitMQ), mitigada por
  Docker Compose local.

## Referências

- SPEC-001, AC-002 e AC-008.
- `docs/architecture.md`.
