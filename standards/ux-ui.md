# UX/UI Standard (Padrão de UX/UI)

## Propósito

Definir o mínimo de descoberta (discovery), design, transferência (handoff), validação e revisão necessários para qualquer mudança voltada ao usuário. Este padrão aplica-se à web, mobile, desktop, CLI e outros produtos interativos. O perfil de projeto ativo pode adicionar regras mais rígidas.

## Entradas obrigatórias

Antes do design começar, identifique:

- o problema, o resultado de negócios e os grupos de usuários afetados;
- evidências disponíveis do usuário e suposições explicitamente rotuladas;
- a jornada ou fluxo de trabalho (workflow) atual, se houver um;
- restrições, riscos, dependências e as convenções da plataforma aplicáveis;
- critérios de sucesso mensuráveis.

Use `templates/ux-brief.md`. Se a pesquisa for ignorada intencionalmente, registre o motivo, o aprovador, os riscos e o plano de validação.

## Artefatos de design obrigatórios

Toda mudança voltada ao usuário deve fornecer, na proporção de seu risco:

1. um fluxo do usuário (user flow) cobrindo o caminho principal, alternativas, erros, cancelamento e recuperação;
2. wireframes ou um protótipo quando o comportamento não puder ser entendido pelo fluxo;
3. uma especificação de design usando `templates/design-specification.md`;
4. mapeamentos de componentes e tokens de design;
5. anotações de acessibilidade;
6. aprovação humana antes da implementação.

Pequenas alterações podem combinar estes artefatos na SPEC, mas nenhuma das informações obrigatórias pode ser omitida sem uma exceção aprovada.

## Estados de interface

A especificação de design deve abordar todos os estados aplicáveis:

- inicial, de carregamento, progresso, sucesso, vazio, parcial e de dados desatualizados (stale data);
- validação, erro recuperável, erro fatal, offline e timeout (tempo limite excedido);
- desativado (disabled), somente leitura (read-only), selecionado, focado, hover (passar o mouse), pressionado e expandido;
- autenticação, autorização, permissão negada e expiração de sessão;
- primeiro uso, uso repetido, confirmação destrutiva, desfazer (undo) e cancelamento.

## Comportamento responsivo e de plataforma

Defina as viewports (áreas de visualização), orientações, métodos de entrada, zoom ou escala de texto suportados e o refluxo (reflow) de conteúdo. Não confie em um requisito não especificado de "responsivo". Registre os dispositivos e navegadores mínimos suportados no plano de QA.

As convenções nativas da plataforma têm precedência, a menos que uma decisão de design aprovada documente por que elas devem ser alteradas.

## Conteúdo e interação

- Use rótulos (labels) claros orientados a tarefas e terminologia consistente.
- Defina o tempo da validação e mensagens de erro acionáveis.
- Não use apenas cor, posição, gesto ou ícone para comunicar significado.
- Ações destrutivas requerem confirmação ou um caminho de desfazer (undo) confiável.
- Preserve as entradas (inputs) do usuário após falhas recuperáveis sempre que possível.
- Defina o comportamento do teclado, ponteiro, toque e tecnologia assistiva conforme aplicável.

## Validação de usabilidade

Testes de usabilidade são obrigatórios para jornadas críticas novas ou materialmente alteradas, suposições de alto risco ou comportamentos com impacto significativo no suporte ou na conversão. Use `templates/usability-test-plan.md` e registre:

- perfil dos participantes e limitações da amostra;
- cenários e medidas de sucesso;
- observações em vez da intenção inferida;
- a severidade dos achados e as decisões resultantes.

## Prontidão para transferência (Handoff readiness)

O design está pronto para implementação apenas quando:

- o problema, o escopo e o fluxo do usuário são aprovados;
- todos os estados e regras responsivas aplicáveis estão especificados;
- componentes, tokens, ativos (assets) e conteúdo estão identificados;
- o comportamento de acessibilidade está anotado;
- os critérios de aceitação são testáveis;
- perguntas não resolvidas, riscos e exceções aprovadas estão registrados.

## Revisão de implementação

Use `templates/design-review.md`. Revise viewports e estados representativos, conteúdo realista, comportamento do teclado, zoom ou escala de texto e o uso de componentes/tokens. Apenas uma correspondência visual não é suficiente: interação, conteúdo e comportamento de acessibilidade também devem corresponder à especificação aprovada.
