# Acessibilidade — WCAG 2.1 Nível AA

> Padrão de acessibilidade aplicável a toda interface produzida dentro do Universal SDD.
> Este arquivo já era referenciado na tabela de documentação do framework, mas seu conteúdo não estava definido — este documento o preenche.

## Objetivo

Garantir que toda interface (web, mobile web ou equivalente) produzida através do Universal SDD atenda ao nível de conformidade **AA** do WCAG 2.1.

## Escopo

Aplica-se às etapas de **UX/UI Design** e **Aprovação do Design** do fluxo do framework, e a toda TASK que produza ou altere interface.

## Nível de conformidade

| Nível | Status neste framework |
|---|---|
| A | Obrigatório (base mínima) |
| AA | **Obrigatório — padrão alvo deste documento** |
| AAA | Opcional, não exigido |

Conformidade AA soma **50 critérios de sucesso**: 30 do nível A + 20 adicionais do nível AA, organizados em 4 princípios (POUR — Perceivable, Operable, Understandable, Robust).

## 1. Perceptível

| SC | Critério | Nível | Requisito prático |
|---|---|---|---|
| 1.1.1 | Conteúdo não textual | A | Toda imagem, ícone funcional e mídia não textual tem alternativa textual (`alt`). |
| 1.2.1 | Apenas áudio/vídeo (gravado) | A | Transcrição textual para conteúdo apenas em áudio ou apenas em vídeo. |
| 1.2.2 | Legendas (gravado) | A | Vídeos pré-gravados com áudio têm legendas. |
| 1.2.3 | Audiodescrição ou alternativa | A | Vídeo pré-gravado tem audiodescrição ou alternativa textual completa. |
| 1.2.4 | Legendas (ao vivo) | AA | Transmissões ao vivo com áudio têm legendas sincronizadas. |
| 1.2.5 | Audiodescrição (gravado) | AA | Vídeo pré-gravado tem audiodescrição. |
| 1.3.1 | Informações e relações | A | Estrutura semântica (headings, listas, tabelas, labels) é transmitida por marcação, não só visualmente. |
| 1.3.2 | Sequência significativa | A | A ordem de leitura programática corresponde à ordem lógica/visual. |
| 1.3.3 | Características sensoriais | A | Instruções não dependem só de forma, cor, tamanho ou posição. |
| 1.3.4 | Orientação | AA | Conteúdo funciona em retrato e paisagem, salvo quando a orientação é essencial. |
| 1.3.5 | Identificar propósito da entrada | AA | Campos de dados pessoais comuns usam `autocomplete` apropriado. |
| 1.4.1 | Uso de cor | A | Cor não é o único meio de transmitir informação, ação ou estado. |
| 1.4.2 | Controle de áudio | A | Áudio que toca automaticamente por mais de 3s pode ser pausado/controlado. |
| 1.4.3 | Contraste (mínimo) | AA | Contraste de pelo menos 4.5:1 (texto normal) e 3:1 (texto grande). |
| 1.4.4 | Redimensionar texto | AA | Texto pode ser ampliado até 200% sem perda de conteúdo ou função. |
| 1.4.5 | Imagens de texto | AA | Usar texto real em vez de imagem de texto, exceto quando essencial (ex.: logotipo). |
| 1.4.10 | Reflow | AA | Conteúdo se adapta a 320px de largura sem exigir rolagem horizontal. |
| 1.4.11 | Contraste não textual | AA | Componentes de interface e elementos gráficos têm contraste mínimo de 3:1. |
| 1.4.12 | Espaçamento de texto | AA | Layout não quebra quando o usuário aumenta espaçamento de linha/parágrafo/letras. |
| 1.4.13 | Conteúdo em hover ou foco | AA | Conteúdo extra exibido em hover/focus é dispensável, persistente e não some ao mover o mouse até ele. |

## 2. Operável

| SC | Critério | Nível | Requisito prático |
|---|---|---|---|
| 2.1.1 | Teclado | A | Toda funcionalidade é operável via teclado. |
| 2.1.2 | Sem armadilha de teclado | A | O foco do teclado nunca fica preso em um componente. |
| 2.1.4 | Atalhos de tecla única | A | Atalhos de uma única letra podem ser desativados/remapeados. |
| 2.2.1 | Tempo ajustável | A | Limites de tempo podem ser estendidos, desativados ou ajustados. |
| 2.2.2 | Pausar, parar, ocultar | A | Conteúdo em movimento/piscante pode ser pausado pelo usuário. |
| 2.3.1 | Três flashes ou abaixo do limite | A | Nada pisca mais de 3 vezes por segundo. |
| 2.4.1 | Ignorar blocos | A | Existe mecanismo para pular blocos repetidos ("pular para o conteúdo"). |
| 2.4.2 | Página com título | A | Toda página tem um `<title>` descritivo. |
| 2.4.3 | Ordem do foco | A | A ordem de tabulação segue uma sequência lógica. |
| 2.4.4 | Propósito do link (em contexto) | A | O destino de um link é identificável pelo texto do link ou seu contexto. |
| 2.4.5 | Várias formas | AA | Existe mais de uma forma de chegar a uma página (busca, menu, mapa do site). |
| 2.4.6 | Cabeçalhos e rótulos | AA | Cabeçalhos e rótulos descrevem claramente o tópico ou propósito. |
| 2.4.7 | Foco visível | AA | O elemento com foco de teclado é visualmente identificável. |
| 2.5.1 | Gestos de ponteiro | A | Funções operadas por gestos multiponto têm alternativa de ponto único. |
| 2.5.2 | Cancelamento de ponteiro | A | Ações podem ser canceladas antes de completar o clique/toque. |
| 2.5.3 | Rótulo no nome | A | O texto visível do rótulo está contido no nome acessível do componente. |
| 2.5.4 | Ativação por movimento | A | Funções ativadas por movimento do dispositivo têm alternativa via interface. |

## 3. Compreensível

| SC | Critério | Nível | Requisito prático |
|---|---|---|---|
| 3.1.1 | Idioma da página | A | O idioma principal da página é declarado (`lang`). |
| 3.1.2 | Idioma de trechos | AA | Trechos em outro idioma têm o idioma declarado. |
| 3.2.1 | Ao receber foco | A | Receber foco não dispara mudança de contexto inesperada. |
| 3.2.2 | Ao receber entrada | A | Preencher um campo não dispara mudança de contexto sem aviso prévio. |
| 3.2.3 | Navegação consistente | AA | Menus e navegação mantêm a mesma ordem relativa entre páginas. |
| 3.2.4 | Identificação consistente | AA | Componentes com a mesma função são identificados de forma consistente. |
| 3.3.1 | Identificação de erro | A | Erros de formulário são identificados em texto, não só por cor. |
| 3.3.2 | Rótulos ou instruções | A | Campos de formulário têm rótulo ou instrução clara. |
| 3.3.3 | Sugestão de erro | AA | Quando possível, o sistema sugere como corrigir o erro. |
| 3.3.4 | Prevenção de erros (legal, financeiro, dados) | AA | Ações irreversíveis (compra, exclusão) podem ser revisadas, confirmadas ou desfeitas. |

## 4. Robusto

| SC | Critério | Nível | Requisito prático |
|---|---|---|---|
| 4.1.1 | Análise (parsing) | A | HTML bem formado, sem erros graves de marcação. |
| 4.1.2 | Nome, função, valor | A | Componentes customizados expõem nome, função e estado via API de acessibilidade (ARIA quando necessário). |
| 4.1.3 | Mensagens de status | AA | Mudanças de status (ex.: "item adicionado ao carrinho") são anunciadas a tecnologias assistivas sem exigir mudança de foco. |

## Quality Gates de acessibilidade

**Na etapa de Discovery/Design**
- [ ] Contraste de cores validado no design system (`standards/design-system.md`)
- [ ] Hierarquia de cabeçalhos e ordem de leitura definidas no protótipo

**Na implementação**
- [ ] Navegação 100% por teclado testada manualmente
- [ ] Auditoria automatizada (axe-core, Lighthouse, WAVE) sem erros críticos
- [ ] Textos alternativos e rótulos de formulário revisados

**Antes do release**
- [ ] Teste com leitor de tela (NVDA/VoiceOver/TalkBack) no fluxo principal
- [ ] Verificação de reflow em 320px e zoom de 200%

## Referências

- W3C — WCAG 2.1: https://www.w3.org/TR/WCAG21/

---

**Nota:** o W3C já publicou o WCAG 2.2 (outubro/2023), que adiciona 9 novos critérios sobre foco, arrastar e tamanho de alvo de toque. Como você pediu especificamente 2.1 AA, este documento se mantém nessa versão — mas migrar para 2.2 AA no futuro é apenas somar critérios, já que as versões são retrocompatíveis.
