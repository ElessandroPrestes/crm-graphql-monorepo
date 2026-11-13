# ADR-009: Endurecimento GraphQL, rate limit e política de senha

## Metadados

| Campo                     | Valor                           |
| ------------------------- | ------------------------------- |
| Status                    | Accepted                        |
| Data                      | 2026-11-13                      |
| Responsáveis              | Engenharia, Segurança e Produto |
| SPEC relacionada          | SPEC-006                        |
| Substitui/substituída por | —                               |

## Contexto

A Fase 5 precisa reduzir a superfície de abuso antes de uma entrega controlada.
O servidor já limita profundidade, complexidade e aliases, mas ainda aceita
qualquer query GraphQL válida, não limita tentativas de login, não tem limite de
corpo explícito e não desativa sugestões de campo em produção. O cliente Apollo
da Fase 4 não envia persisted queries.

As decisões precisam preservar o comportamento funcional aprovado, permitir
rollback por ambiente e não introduzir migração de banco. A instrução humana de
2026-11-13 autorizou a execução da Fase 5 com defaults conservadores, sujeitos a
revisão de Segurança antes do release.

## Drivers da decisão

- Reduzir queries arbitrárias e abuso de autenticação sem quebrar clientes.
- Permitir ativação gradual (audit) e bloqueio (enforce) por variável de
  ambiente.
- Falhar de forma segura quando o Redis estiver indisponível.
- Manter logs sem PII, tokens ou corpos de mensagem.
- Manter o custo local baixo: Redis já é dependência da Fase 3/4.

## Alternativas consideradas

### Alternativa A: allowlist de persisted queries gerada no codegen

- Benefícios: allowlist determinística, drift check na CI, hash-only no cliente e
  rejeição de operações desconhecidas em enforce.
- Custos e riscos: exige regenerar a allowlist quando operações mudam; clientes
  antigos precisam de audit antes de enforce.

### Alternativa B: APQ automático do Apollo Server sem allowlist

- Benefícios: menos código.
- Custos e riscos: qualquer query válida é registrada no cache na primeira
  chamada; não impede queries arbitrárias.

### Alternativa C: rate limit em memória por processo

- Benefícios: sem dependência do Redis.
- Custos e riscos: não funciona com múltiplas réplicas e perde estado no restart.

## Decisão

Adotar a Alternativa A para persisted queries e rate limit distribuído no Redis
com janela fixa. As decisões operacionais são:

- **Persisted queries:** allowlist versionada em
  `packages/graphql-schema/src/persisted-queries.ts`, gerada a partir das
  operações do codegen, incluindo a variante com `__typename` que o Apollo
  Client adiciona. O servidor substitui a query pelo texto da allowlist quando o
  hash é conhecido. `PERSISTED_QUERIES_MODE` aceita `off`, `audit` e `enforce`;
  o default é `audit`. Em `enforce`, hash ausente ou desconhecido retorna
  `PERSISTED_QUERY_REQUIRED`/`PERSISTED_QUERY_NOT_FOUND` sem executar resolver.
- **Rate limit:** janela fixa no Redis com `INCR` + `EXPIRE`, chaves por IP,
  e-mail normalizado (hash SHA-256) e usuário. Limites default: login 30/15 min
  por IP e 10/15 min por IP+e-mail; GraphQL 120/min por usuário, 40/min para
  mutations autenticadas e 30/min por IP anônimo; WebSocket 10/min por IP e por
  usuário. Excedente HTTP retorna `429` com `Retry-After`.
- **Bloqueio de login:** após 5 falhas na janela de 15 min, a conta fica
  bloqueada por 15 min. A mensagem é genérica e não revela existência da conta.
  Redis indisponível no login falha fechado com `503`; GraphQL/WS usam
  fail-open controlado com log.
- **Senha:** mínimo de 12 e máximo de 128 caracteres, validado por Zod em
  `password-policy.ts` e aplicado no seed. Não há endpoint público de cadastro
  nesta fase; qualquer criação/alteração futura deve reutilizar a política.
- **Corpo e erros:** limite JSON default de `256kb`, configurável por
  `JSON_BODY_LIMIT`; em produção, introspecção é negada e sugestões
  `Did you mean ...` são removidas das mensagens de validação.
- **Observabilidade:** logs estruturados registram bloqueios, operações fora da
  allowlist e falhas de Redis sem corpo, token ou PII.

## Consequências

### Positivas

- Queries fora da allowlist deixam de executar em produção sem remover o modo
  audit para rollout.
- Rate limit e bloqueio funcionam com múltiplas réplicas.
- Rollback é imediato por env, sem migração.

### Negativas e riscos

- A allowlist precisa ser regenerada e revisada quando o cliente muda; o drift
  check falha a CI de propósito.
- Rate limit por janela fixa permite rajadas na borda da janela; uma evolução
  para token bucket fica registrada como melhoria.
- Falha do Redis degrada a proteção de leitura (fail-open) e bloqueia login
  (fail-closed), exigindo alerta operacional.
- Clientes que não usam o link de persisted queries são rejeitados em enforce.

## Implementação e migração

- **Compatibilidade:** `audit` é o default em desenvolvimento/teste; produção
  deve ativar `audit`, observar e então `enforce`.
- **Etapas:** gerar allowlist no codegen; instalar middlewares de rate limit e
  persisted queries; integrar `PersistedQueryLink` no Apollo; configurar env;
  rodar gates.
- **Rollback:** `PERSISTED_QUERIES_MODE=off`, remover/limitar flags de rate
  limit e restaurar o build anterior. Nenhuma migração de banco.
- **Observabilidade:** alertar para 429, `PERSISTED_QUERY_NOT_FOUND`, falhas de
  Redis e bloqueios de login.

## Evidências e validação

- Testes unitários de rate limit, política de senha, sanitização de sugestões e
  middleware de persisted queries.
- Teste de integração da Fase 5: 429 de login/GraphQL, 413 de corpo, audit e
  persisted query conhecida apenas pelo hash.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e drift check da
  allowlist.
