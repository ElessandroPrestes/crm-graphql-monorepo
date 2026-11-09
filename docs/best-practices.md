# Boas práticas

## Especifique resultados observáveis

Descreva comportamento, limites e evidência esperada. Evite critérios como
“funcionar corretamente” ou decisões internas que não sejam necessárias.

## Use identificadores estáveis

Conecte `SPEC-`, `AC-`, `TASK-`, testes, bugs, ADRs e reviews. Não dependa apenas
de títulos ou links de ferramentas externas.

## Mantenha o contexto mínimo suficiente

Coloque regras duráveis em padrões e conhecimento; deixe detalhes da mudança na
SPEC. Duplicação cria divergência e aumenta o custo de revisão.

## Trabalhe proporcionalmente ao risco

Uma correção editorial não exige o mesmo ritual de uma migração de dados. O
workflow pode ser reduzido, mas requisitos, autoridade e evidências críticas não
podem desaparecer.

## Faça mudanças pequenas e reversíveis

Prefira tarefas focadas, migrações compatíveis, feature flags quando justificadas
e rollback verificável. Não misture refatoração ampla com comportamento novo sem
aprovação explícita.

## Registre incerteza

Marque fatos, inferências e hipóteses. Uma pergunta bem localizada preserva mais
confiança do que uma resposta inventada.

## Revise a entrega completa

Não revise apenas o diff: confronte SPEC, riscos, código, testes, documentação,
observabilidade e plano de release. Registre o que não pôde ser validado.
