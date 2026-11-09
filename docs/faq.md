# Perguntas frequentes

## O Universal SDD substitui Scrum, Kanban ou gestão de projetos?

Não. Ele organiza especificação, execução, evidência e governança de mudanças e
pode coexistir com diferentes métodos de planejamento.

## Toda mudança precisa de uma SPEC?

Toda mudança de comportamento precisa de escopo e aceitação explícitos. Para uma
correção editorial trivial, o pull request pode conter uma especificação mínima,
conforme a governança local.

## A IA pode aprovar uma SPEC?

Ela pode analisar e recomendar, mas a aprovação exigida pelo framework é humana
e atribuída a alguém com autoridade sobre o escopo.

## Qual é a fonte única da verdade?

Não há um único arquivo para todos os momentos. A SPEC aprovada autoriza o
comportamento da mudança; `PROJECT.md` registra o estado atual; código e
evidências demonstram a entrega. Divergências são tratadas explicitamente.

## Preciso usar todos os agentes?

Não necessariamente. Papéis podem ser combinados quando risco e independência
permitirem. Responsabilidades e gates aplicáveis continuam explícitos.

## Posso adaptar os templates?

Sim. Preserve metadados, rastreabilidade e critérios necessários ao seu perfil.
Registre extensões e exceções para que agentes saibam qual regra aplicar.

## O framework depende de uma ferramenta de IA?

Não. Arquivos específicos apenas redirecionam cada ferramenta para o mesmo
contexto canônico.

## Como tratar uma implementação diferente da SPEC?

Classifique a divergência como defeito, mudança de escopo ou dívida documental.
Não altere retroativamente a SPEC apenas para fazer a implementação parecer
conforme.
