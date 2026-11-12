# ADR-008: Cliente GraphQL, sessão e estado do front-end

## Metadados

| Campo                     | Valor                              |
| ------------------------- | ---------------------------------- |
| Status                    | Accepted                           |
| Data                      | 2026-11-11                         |
| Responsáveis              | Engenharia, Arquitetura, Segurança |
| SPEC relacionada          | SPEC-005                           |
| Substitui/substituída por | —                                  |

## Contexto

A Fase 4 precisa transformar os contratos REST e GraphQL das Fases 1 a 3 em
uma aplicação web usável, acessível e segura. O shell atual tem React Router,
Tailwind e um teste de acessibilidade, mas não possui cliente GraphQL, estado
de sessão, formulários, cache, subscriptions, i18n ou tema.

As decisões já aceitas determinam React + Vite + Apollo Client, React Router,
react-hook-form + zod, Tailwind, dnd-kit e primitivos acessíveis (ADR-002). A
autenticação é REST com access token curto e refresh em cookie `HttpOnly`
(ADR-004). Subscriptions usam `graphql-ws` autenticado no `connection_init`
(ADR-005). Falta decidir como essas peças se combinam no navegador sem expor
tokens, sem duplicar estado e sem quebrar a autorização do servidor.

## Drivers da decisão

- O access token não pode ir para `localStorage` nem para cookies legíveis por
  JavaScript.
- O refresh cookie é `HttpOnly`, `SameSite=Strict` e restrito a `/auth`; o
  bootstrap da sessão depende de uma chamada com credenciais.
- Chamadas concorrentes com token expirado não podem disparar vários refreshes
  nem loops de redirecionamento.
- O cliente precisa compartilhar o mesmo contrato tipado para queries,
  mutations e subscriptions.
- A UI deve distinguir erro de rede, erro de autorização e conflito de domínio.
- O cache deve ser limpo no logout e nunca misturar dados entre usuários.
- O WebSocket precisa renovar credenciais sem manter conexões zumbis.
- O time quer evitar uma segunda biblioteca de estado global sem necessidade.

## Alternativas consideradas

### Alternativa A: Apollo Client com token em memória e refresh single-flight

- Benefícios: cache normalizado, subscriptions, tipagem via codegen, tratamento
  central de erros e uma única camada de dados.
- Custos e riscos: dependência grande; necessidade de configurar links, cache,
  refresh e reconexão com cuidado.

### Alternativa B: cliente `fetch` próprio com React Query

- Benefícios: pacote menor; controle explícito de HTTP.
- Custos e riscos: subscriptions e cache normalizado exigiriam trabalho extra;
  divergiria da stack aprovada; mais superfície para erros de autorização.

### Alternativa C: Apollo Client com token em `localStorage`

- Benefícios: sessão sobrevive sem refresh inicial e simplifica o bootstrap.
- Custos e riscos: exposição a XSS; viola a decisão de segurança da ADR-004.

### Alternativa D: estado global externo (Redux/Zustand) além do Apollo

- Benefícios: previsibilidade para filtros e UI complexa.
- Custos e riscos: duplicação de estado do servidor, sincronização manual e
  mais conceitos sem ganho proporcional nesta fase.

## Decisão

Adotar a Alternativa A, com as seguintes regras:

### Sessão

- O access token vive apenas em memória, em um `SessionStore` observável.
- No carregamento da aplicação, `POST /auth/refresh` com
  `credentials: 'include'` tenta restaurar a sessão; em sucesso, o token é
  guardado em memória. Não há token em `localStorage`, `sessionStorage` ou
  cookie legível.
- `POST /auth/logout` é chamado com credenciais; em seguida, o token, o cache
  Apollo e qualquer dado derivado do usuário são descartados.
- Um refresh em andamento é compartilhado (single-flight). Requisições que
  falharem com 401/`UNAUTHENTICATED` aguardam o mesmo refresh e são repetidas
  uma única vez; falha leva ao login com `returnTo`.
- O guard de rota é apenas conveniência de navegação; a autorização real
  continua no servidor.

### GraphQL

- Apollo Client usa um `HttpLink` para `/graphql` com `Authorization` lido do
  `SessionStore` no momento da requisição.
- Um `ErrorLink` classifica erros: sessão, autorização, conflito, validação,
  rede e servidor. A UI recebe um erro normalizado, não o formato bruto.
- Subscriptions usam `graphql-ws` no mesmo `/graphql`, com
  `connectionParams.authorization` e reconexão que relê o token atual. Ao
  renovar a sessão, a conexão é reaberta de forma controlada.
- Operações são escritas em documentos GraphQL versionados e tipadas por
  codegen; nenhum tipo de resposta é escrito à mão.
- Paginação por cursor usa políticas de tipo e `merge` explícito; mutações
  atualizam ou invalidam as listas e métricas afetadas.

### Estado e formulários

- Estado do servidor fica no cache Apollo; estado local de UI fica em
  componentes e contexto quando compartilhado (sessão, tema, i18n, toasts).
- Não entra biblioteca de estado global nesta fase.
- Formulários usam react-hook-form + zod; erros do servidor são mapeados para
  campos quando possível e para um resumo acionável no topo.
- Filtros e busca ficam na URL (`searchParams`) para sobreviver a recarregar e
  ao botão voltar.

### Apresentação

- i18n usa catálogo tipado em pt-BR e `Intl` para data, número e moeda, sem
  biblioteca de runtime nesta fase. A estrutura permite adicionar outro idioma
  sem reescrever componentes.
- Temas usam tokens CSS semânticos, classe no elemento raiz e preferência
  `light`/`dark`/`system` persistida. O tema inicial é aplicado antes da
  pintura para evitar flash.
- Tailwind consome os tokens; componentes visuais são internos e reutilizáveis.

## Consequências

### Positivas

- Um único cliente tipado para leitura, escrita e tempo real.
- Token fora do alcance de JavaScript persistente e cache limpo no logout.
- Refresh previsível sob concorrência, com recuperação de sessão explícita.
- Menos bibliotecas e menos estado duplicado.
- Filtros compartilháveis e restauráveis por URL.

### Negativas e riscos

- Apollo Client aumenta o bundle; code splitting por rota é obrigatório.
- A configuração de links, cache e reconexão de WebSocket é sensível a erros.
- Sem biblioteca de i18n, pluralização e interpolação precisam de disciplina.
- O refresh depende de cookie e CORS corretos; erro de configuração afeta todas
  as sessões.
- Testes precisam simular REST e GraphQL sem acoplar ao formato interno do
  Apollo.

## Implementação e migração

- Compatibilidade: mudanças GraphQL são argumentos opcionais e aditivos; não
  removem campos nem alteram respostas existentes.
- Etapas: adicionar dependências e codegen; implementar sessão e cliente;
  criar shell e rotas; entregar contatos, visão 360°, kanban, inbox e
  dashboard; cobrir com testes e revisão de acessibilidade.
- Rollback: a aplicação web pode voltar ao shell anterior sem alterar a API;
  filtros aditivos podem permanecer sem consumidores.
- Observabilidade: erros de rede e GraphQL são registrados no cliente sem
  tokens, cookies, corpos de mensagem ou PII; nenhum analytics de produto.

## Evidências e validação

- Pendente de aprovação humana e da implementação da SPEC-005.
- Evidências esperadas: teste de bootstrap sem sessão, refresh concorrente,
  falha de refresh, logout com limpeza de cache, subscription autenticada,
  reconexão após renovação e teste de IDOR refletido na UI.

## Referências

- ADR-002, ADR-003, ADR-004 e ADR-005.
- SPEC-005, `docs/discovery-fase-4.md`, `docs/ux-brief-fase-4.md` e
  `docs/design-spec-fase-4.md`.
