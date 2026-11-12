# Especificação de design — Fase 4: front-end do Nexo CRM

## Metadados

| Campo            | Valor                            |
| ---------------- | -------------------------------- |
| ID               | DS-001                           |
| Status           | Approved em 2026-11-11           |
| Responsável      | Design e Engenharia de front-end |
| Briefing de UX   | `docs/ux-brief-fase-4.md`        |
| SPEC relacionada | SPEC-005                         |
| Data             | 2026-11-11                       |

## Princípios

- A tarefa principal de cada tela deve ser evidente sem tutorial.
- Dados do servidor são a fonte de verdade; a UI nunca presume autorização.
- Toda ação destrutiva ou irreversível exige confirmação explícita.
- Tempo real informa sem interromper; o foco do usuário é preservado.
- Teclado e leitor de tela são caminhos de primeira classe, não alternativos.
- O tema escuro é o padrão visual atual do shell; o claro é par completo.

## Tokens semânticos

Os tokens são implementados como variáveis CSS em `apps/web` e consumidos por
classes Tailwind. Os valores abaixo são candidatos; a implementação deve
verificar contraste AA nos dois temas.

| Token                   | Tema escuro (padrão) | Tema claro    | Uso                                      |
| ----------------------- | -------------------- | ------------- | ---------------------------------------- |
| `--color-bg`            | `slate-950`          | `slate-50`    | Fundo da aplicação                       |
| `--color-surface`       | `slate-900`          | `white`       | Cards, painéis e tabelas                 |
| `--color-surface-muted` | `white/5`            | `slate-100`   | Linhas alternadas, estados desabilitados |
| `--color-text`          | `slate-50`           | `slate-950`   | Texto principal                          |
| `--color-text-muted`    | `slate-300`          | `slate-600`   | Texto secundário e metadados             |
| `--color-border`        | `white/10`           | `slate-200`   | Bordas e divisores                       |
| `--color-primary`       | `cyan-300`           | `cyan-700`    | Ação primária e foco de marca            |
| `--color-primary-hover` | `cyan-200`           | `cyan-800`    | Hover/pressed da ação primária           |
| `--color-on-primary`    | `slate-950`          | `white`       | Texto sobre ação primária                |
| `--color-danger`        | `red-300`            | `red-700`     | Erro e ação destrutiva                   |
| `--color-success`       | `emerald-300`        | `emerald-700` | Sucesso e estado conectado               |
| `--color-warning`       | `amber-300`          | `amber-700`   | Atenção e dados desatualizados           |
| `--color-focus`         | `cyan-400`           | `cyan-700`    | Anel de foco visível                     |
| `--font-sans`           | `ui-sans-serif`      | idem          | Tipografia padrão                        |
| `--radius-control`      | `0.375rem`           | idem          | Botões e inputs                          |
| `--radius-panel`        | `0.75rem`            | idem          | Cards e painéis                          |
| `--space-unit`          | `0.25rem`            | idem          | Base de espaçamento                      |
| `--motion-fast`         | `120ms`              | idem          | Hover, foco e microtransições            |
| `--motion-normal`       | `200ms`              | idem          | Abertura de painéis e diálogos           |
| `--breakpoint-sm`       | `640px`              | idem          | Layout intermediário                     |
| `--breakpoint-lg`       | `1024px`             | idem          | Shell com navegação lateral              |
| `--breakpoint-xl`       | `1280px`             | idem          | Inbox em duas colunas amplas             |

Regras:

- Texto nunca usa cor bruta; usa `--color-text` ou `--color-text-muted`.
- Foco usa `outline: 2px solid var(--color-focus)` com `outline-offset: 2px`.
- Movimento respeita `prefers-reduced-motion: reduce` e é reduzido a zero.
- Não usar cor como único indicador de etapa, status ou erro.

## Componentes

| Componente         | Responsabilidade                                           | Estados e observações de acessibilidade                                 |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `AppShell`         | Header, navegação, `main`, link de salto e anúncio de rota | Landmarks, `aria-current`, foco visível, menu mobile com foco contido   |
| `Button`           | Ação primária, secundária, destrutiva e discreta           | `disabled`, `loading` com texto, `aria-busy`, alvo mínimo de 24 px      |
| `IconButton`       | Ação compacta com ícone                                    | `aria-label` obrigatório, tooltip acessível, alvo mínimo de 24 px       |
| `FormField`        | Label, hint, erro e contador                               | `aria-describedby`, erro associado ao campo, foco no primeiro erro      |
| `Input`/`Select`   | Entrada de texto, busca e seleção                          | `autocomplete`, `inputmode`, mensagem de erro e estado `readOnly`       |
| `Dialog`           | Confirmação destrutiva e criação rápida                    | `role=dialog`, `aria-modal`, foco inicial, Esc, retorno de foco         |
| `Toast`            | Feedback de sucesso, erro e reconexão                      | Região `aria-live` sem mover foco; erro persistente tem ação de repetir |
| `DataList`/`Table` | Contatos, negócios e mensagens                             | Cabeçalhos semânticos, ordenação anunciada, linhas focáveis             |
| `Pagination`       | Carregar mais e estado de fim                              | Botão com `aria-busy`; anuncia “mais resultados carregados”             |
| `Badge`            | Etapa, status de mensagem e tema                           | Texto além da cor; contraste AA                                         |
| `EmptyState`       | Sem dados ou sem resultado de busca                        | Título, explicação e ação para limpar filtros                           |
| `ErrorState`       | Erro recuperável, sessão expirada e offline                | Mensagem acionável, detalhe técnico opcional, ação de repetir           |
| `Skeleton`         | Carregamento de lista, card e painel                       | `aria-hidden`; região com `aria-busy` e texto para leitor de tela       |
| `ThemeToggle`      | Alternância claro/escuro/sistema                           | `aria-pressed` ou grupo de opções; preferência persistida               |
| `KanbanBoard`      | Colunas por etapa e cards                                  | Instruções, região com `aria-label`, ações “Mover para” por teclado     |
| `KanbanCard`       | Resumo do negócio                                          | Link para detalhe, menu de ações, anúncio ao mover e ao conflitar       |
| `ConversationList` | Lista ordenada de conversas                                | Itens como links/botões, não lidas anunciadas, filtro de busca          |
| `MessageThread`    | Histórico e composer                                       | Ordem cronológica, remetente/direção, pendente e falha anunciados       |
| `MetricCard`       | Métrica do dashboard                                       | Rótulo, valor formatado, variação e estado de cache/erro                |

Novos padrões visuais exigem justificativa na revisão de design; componentes
locais devem ser composições dos componentes acima.

## Telas e estados

| Tela                       | Estados obrigatórios                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Login                      | Inicial, validando, credenciais inválidas, bloqueio temporário, erro de rede, sucesso e redirecionamento                       |
| Bootstrap de sessão        | Verificando, sessão válida, sem sessão e falha de rede com repetição                                                           |
| Dashboard                  | Carregando, dados, vazio, erro, período sem dados, cache desatualizado e atualização após mutação                              |
| Contatos                   | Carregando, lista, vazio, busca sem resultado, erro, paginação, criação em andamento, criação concluída e conflito de e-mail   |
| Visão 360°                 | Carregando, dados completos, contato sem empresa/negócios/conversas, erro, exclusão confirmada e exclusão bloqueada            |
| Kanban                     | Carregando, colunas com cards, coluna vazia, erro, conflito de versão, movendo, movimento concluído e falha de rede            |
| Inbox                      | Carregando, lista vazia, conversa selecionada, conversa vazia, enviando, enviado, falha de envio, reconectando e mensagem nova |
| Configurações de aparência | Tema atual, troca aplicada, preferência persistida e falha ao persistir                                                        |
| Rota inexistente/permissão | 404, sessão expirada e acesso negado                                                                                           |

Regras transversais:

- Erros de formulário preservam a entrada e focam o primeiro campo inválido.
- Erros de rede mantêm dados já carregados e oferecem repetir sem perder filtros.
- Sessão expirada limpa dados privados do cache e retorna ao login com `returnTo`.
- Toda lista tem estado vazio distinto de “sem resultado para os filtros”.

## Responsividade e compatibilidade

- 320–639 px: uma coluna; navegação em menu retrátil; kanban com seletor de
  etapa ou rolagem horizontal com indicação; inbox lista e thread em rotas
  separadas.
- 640–1023 px: shell compacto; contatos em cartões; kanban com rolagem
  horizontal; inbox em duas colunas estreitas quando houver espaço.
- 1024 px ou mais: navegação lateral, tabelas, kanban com todas as colunas e
  inbox em lista + thread.
- Zoom de 200% e texto ampliado não podem esconder ações ou criar rolagem
  horizontal na página inteira.
- Navegadores: últimas duas versões estáveis de Chrome, Firefox, Safari e Edge.
- Entrada: mouse, teclado e toque; nenhuma ação depende de hover.
- Timezone de apresentação: `America/Sao_Paulo`; datas e valores em `pt-BR`.

## Conteúdo

- Voz direta, orientada à ação, sem jargão técnico.
- Ações: “Entrar”, “Salvar”, “Criar contato”, “Carregar mais”, “Mover para…”,
  “Enviar mensagem”, “Exportar dados”, “Excluir contato”.
- Erros: dizer o que aconteceu e o que fazer, por exemplo “Não foi possível
  carregar os contatos. Tente novamente.”
- Conflito no kanban: “Este negócio foi atualizado por outra pessoa. O quadro
  foi recarregado para mostrar a versão mais recente.”
- Inbox: “Nova mensagem de {nome}.” Anúncio sem mover o foco.
- Exclusão: “Excluir {nome}? Negócios serão mantidos, mas atividades,
  conversas e mensagens serão removidas. Esta ação não pode ser desfeita.”
- Vazio de busca: “Nenhum contato encontrado para “{termo}”.” com “Limpar
  filtros”.
- Todo texto visível passa pelo catálogo `pt-BR`; não há strings de produto
  embutidas em componentes.

## Anotações de acessibilidade

- Um `h1` por rota e hierarquia de headings sem saltos.
- Região `main` com `tabIndex=-1` para foco após navegação.
- Tabelas usam `caption`/`aria-label`; listas usam semântica de lista.
- Kanban: cada card é focável; “Mover para etapa” abre menu com etapas;
  movimento é anunciado em região `aria-live="polite"`.
- Inbox: mensagens novas são anunciadas de forma agregada e `polite`; nunca
  movem o foco do composer.
- Dialogs prendem o foco, fecham com Esc e devolvem o foco ao acionador.
- Toasts não substituem mensagens inline de erro de formulário.
- Contraste mínimo 4.5:1 para texto normal e 3:1 para texto grande e componentes.
- Alvos de toque com pelo menos 24×24 px, preferencialmente 44×44 px.
- `prefers-reduced-motion` remove animações de card, painel e transição de tema.
- Ícones decorativos têm `aria-hidden`; ícones acionáveis têm nome acessível.

## Aprovação

| Papel          | Nome | Decisão | Data | Notas |
| -------------- | ---- | ------- | ---- | ----- |
| Design         |      |         |      |       |
| Acessibilidade |      |         |      |       |
| Produto        |      |         |      |       |
| Engenharia     |      |         |      |       |
