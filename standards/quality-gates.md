# Quality Gates Standard (Padrão de Portões de Qualidade)

## Propósito

Definir critérios de entrada e saída auditáveis para cada estágio. O perfil ativo pode adicionar verificações mais rígidas, mas não deve remover estes portões de base sem uma exceção aprovada.

## Portão 1: Pronto para design (Ready for design)

- O problema, os usuários afetados, o resultado, as restrições e os riscos estão registrados.
- Evidências e suposições são distinguíveis.
- As necessidades de pesquisa e as medidas de sucesso estão definidas.

## Portão 2: Pronto para implementação (Ready for implementation)

- O briefing de UX e o fluxo do usuário estão aprovados para alterações voltadas ao usuário.
- A especificação de design abrange estados aplicáveis, conteúdo, responsividade, componentes, tokens e acessibilidade.
- A SPEC tem um escopo aprovado, itens fora do escopo e critérios de aceitação testáveis.
- Dependências, migrações, riscos, observabilidade e rollback (reversão) são abordados.
- As tarefas e o plano de QA fornecem rastreabilidade dos critérios de aceitação.
- Questões não resolvidas estão encerradas ou aceitas explicitamente.

## Classificação de alteração da SPEC

Antes da implementação continuar após uma descoberta, crie uma solicitação de mudança (change request) e classifique-a usando `templates/CHANGE_REQUEST_TEMPLATE.md`.

Uma solicitação é um **esclarecimento simples (lightweight clarification)** apenas se todas as afirmações forem verdadeiras:

- não altera nenhum resultado observável, incluindo a experiência do usuário, API, permissões, dados, comportamento de erros, compatibilidade, desempenho, confiabilidade, segurança ou operação;
- não adiciona, remove, enfraquece, reinterpreta ou altera de qualquer outra forma um critério de aceitação;
- a sua questão, resolução, justificativa e aprovação assíncrona durável pela mesma autoridade humana que aprovou a SPEC base estão registradas.

Uma solicitação é uma **mudança de escopo** se qualquer uma das afirmações acima for falsa ou desconhecida. Ela é um portão de bloqueio: pare a implementação, crie a próxima `SPEC-NNN-vN` com uma referência à anterior, avalie os impactos de design e técnicos aplicáveis, e obtenha um novo ciclo de aprovação humana aplicável antes de criar ou continuar as TAREFAS (TASKs) de implementação. Nenhum agente pode classificar a incerteza como um esclarecimento.

## Portão 3: Pronto para revisão (Ready for review)

- Tarefas aprovadas são implementadas sem expansão de escopo não documentada.
- Os testes automatizados necessários passam no ambiente definido.
- Verificações manuais, exploratórias, de compatibilidade e não funcionais são concluídas conforme aplicável.
- O escopo de regressão é executado.
- O QA-Verifier em `workflows/verification.md` compara todos os IDs estruturados aplicáveis de critério de aceitação com as evidências estruturadas de QA antes da Revisão de Código começar.
- Descobertas do QA-Verifier que estiverem ausentes, não mapeadas, falhas ou ambíguas bloqueiam a Revisão de Código até serem resolvidas ou cobertas por uma exceção autorizada.
- A documentação e as notas de impacto de lançamento estão atualizadas.
- Defeitos e riscos residuais estão registrados.

## Portão 4: Pronto para lançamento (Ready for release)

- Critérios de aceitação têm evidências de aprovação.
- O build e as verificações de CI exigidas passam.
- Não há defeitos S1 ou S2 abertos.
- Defeitos S3 e S4 têm uma disposição explícita.
- A revisão de código (Code review) está aprovada.
- A revisão de design e a revisão de acessibilidade estão aprovadas para mudanças aplicáveis.
- O produto ou negócio foi aceito, quando o UAT for necessário.
- Verificações de segurança, performance, dados, deployment (implantação) e rollback passam, quando aplicável.
- O QA fornece uma recomendação de liberação (release).
- Versão e release notes (notas de versão) estão prontas.

## Portão 5: Concluído (Done)

- A implementação aceita é implantada ou distribuída conforme planejado.
- Verificações de smoke (fumaça) e monitoramento exigido confirmam o comportamento esperado.
- PROJECT.md, SPEC, decisões, testes e evidências refletem o estado entregue.
- O trabalho de acompanhamento (follow-up) tem um responsável (owner) e alvo.
- O aprendizado que altera o comportamento futuro é capturado em padrões ou na Base de Conhecimento (Knowledge Base).

## Exceções

Um humano com autoridade documentada pode aprovar uma exceção. Ela deve conter:

- o portão reprovado ou ignorado;
- motivo e evidência;
- o impacto no usuário, no negócio, na segurança e nas operações;
- mitigação e monitoramento;
- o responsável (owner);
- a data de validade ou remediação;
- identidade da aprovação e carimbo de data/hora (timestamp).

Uma exceção não transforma uma verificação falha em uma verificação aprovada. Exceções expiradas bloqueiam lançamentos subsequentes até serem renovadas ou resolvidas.

## Decisão de Lançamento (Release decision)

A recomendação de QA deve ser uma destas:

- **Go (Aprovado):** todos os portões aplicáveis foram aprovados;
- **Go with accepted risk (Aprovado com risco aceito):** restam apenas exceções autorizadas e não expiradas;
- **No-go (Não aprovado):** um portão de bloqueio falhou ou as evidências estão incompletas.
