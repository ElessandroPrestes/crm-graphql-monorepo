# Design System Standard (Padrão de Sistema de Design)

## Propósito

Manter as decisões de interface consistentes, acessíveis, reutilizáveis e rastreáveis. Um projeto pode usar um sistema interno, um sistema de terceiros ou um conjunto documentado de convenções nativas da plataforma.

## Origem e propriedade

O `PROJECT.md` deve identificar:

- o design system e a sua versão ou revisão;
- o local canônico para tokens, componentes, ícones e orientações de conteúdo;
- os mantenedores e responsabilidades de aprovação;
- as plataformas suportadas e as lacunas conhecidas.

Os arquivos de design não devem ser a única fonte de comportamento dos componentes. Os estados implementáveis, propriedades e a semântica de acessibilidade devem estar documentados no repositório ou num sistema versionado referenciado por ele.

## Tokens

Use tokens semânticos para pelo menos:

- cores e papéis de contraste;
- tipografia;
- espaçamento e dimensionamento;
- bordas, raio (radius), elevação e opacidade;
- duração da animação (motion) e easing (suavização);
- breakpoints ou regras de layout onde aplicável.

Evite introduzir valores brutos (raw values) quando um token apropriado existir. Um novo token deve ter um propósito semântico, proprietário, orientação de uso e impacto de migração.

## Componentes

Cada componente reutilizável deve definir:

- propósito, variantes suportadas e uso proibido;
- regras de conteúdo e comportamento de localização;
- estados interativos e transições;
- teclado e semântica de tecnologia assistiva;
- comportamento responsivo;
- exemplos e testes automatizados apropriados ao seu risco.

Prefira estender um componente existente em vez de criar uma variante local visualmente semelhante. Uma composição específica de produto pode permanecer local quando não for reutilizável.

## Governança de mudanças

As mudanças que afetam os consumidores existentes exigem:

1. análise de impacto;
2. revisão de design e engenharia;
3. revisão de acessibilidade;
4. notas de versão ou migração;
5. evidência de regressão visual e comportamental.

Mudanças que quebram compatibilidade (breaking changes) não devem ser lançadas silenciosamente. Descontinuações (deprecations) precisam de um responsável, orientação de substituição e um alvo para remoção.

## Checklist de revisão

- Apenas componentes e tokens aprovados são utilizados.
- Novos padrões são justificados e documentados.
- Todos os estados do componente estão implementados.
- O conteúdo funciona com tamanho e localização realistas.
- A semântica de acessibilidade é preservada pela composição.
- O componente implementado possui evidências relevantes de teste e revisão.
