# Instruções para agentes

Este arquivo é o ponto de entrada comum para pessoas e agentes de IA que atuam
em um projeto que adota o Universal SDD.

## Ordem de leitura

Antes de propor ou executar uma mudança:

1. leia `PROJECT.md`;
2. identifique o workflow ativo em `workflows/`;
3. leia o contrato do papel ativo em `agents/`;
4. localize a SPEC aprovada em `specs/`;
5. localize a TASK atribuída em `tasks/`;
6. consulte padrões, ADRs e conhecimento relacionados.

Na ausência de SPEC aprovada e TASK atribuída, não inicie implementação.

## Hierarquia de instruções

Quando houver conflito, siga esta ordem:

1. instruções humanas explícitas e atuais;
2. SPEC aprovada da mudança;
3. `PROJECT.md` e ADRs aceitos;
4. workflow e perfil ativos;
5. padrões do projeto;
6. conhecimento e documentação auxiliar.

O código e as evidências demonstram o estado implementado, mas não autorizam
silenciosamente uma mudança de requisito. Divergências devem ser registradas.

## Regras obrigatórias

- Não invente requisitos, aprovações, pesquisa, resultados de testes ou evidências.
- Não amplie o escopo aprovado.
- Interrompa e registre ambiguidades que alterem comportamento, risco ou arquitetura.
- Preserve mudanças existentes que não pertençam à tarefa.
- Não exponha segredos, credenciais, dados pessoais ou dados de produção inseguros.
- Mudanças arquiteturais exigem ADR.
- Toda aceitação deve apontar para evidência reproduzível.
- Atualize documentação e rastreabilidade junto com a implementação.

## Separação de papéis

Um agente pode assumir mais de um papel em mudanças de baixo risco, desde que
declare a transição. Aprovações independentes não podem ser concedidas pelo
mesmo agente que produziu o artefato quando o workflow exigir revisão.

Os contratos detalhados estão em `agents/`; o catálogo está em
`docs/agents.md`.

## Rastreabilidade mecanizada

Use os formatos e relações definidos em `docs/ids-and-traceability.md`. Toda
implementação vinculada a uma TASK aprovada deve registrar, no commit, estes
trailers em linhas separadas:

```text
Spec-Ref: SPEC-NNN
Task-Ref: TASK-NNN-XX
```

Commits que não pertencem a uma TASK não devem usar apenas um desses trailers.
O hook opcional em `templates/hooks/commit-msg` rejeita referências parciais ou
malformadas; projetos podem instalá-lo conforme o guia de rastreabilidade.
Use `Refs:` nos artefatos para manter a cadeia entre as fontes de verdade.

## Orçamento de contexto

Carregue `docs/context-budget.md` e siga o pacote da fase ativa. Para trabalho
ativo, carregue somente a SPEC aprovada, a TASK atribuída quando aplicável, e
os módulos de `knowledge/` referenciados explicitamente pela SPEC. Não carregue
a base de conhecimento completa, nem use uma varredura ampla do repositório
como substituto para recuperação seletiva. Registre uma exceção apenas quando
um risco material exigir contexto adicional e indique o módulo e o motivo.

## Encerramento

Ao concluir uma tarefa, informe:

- escopo implementado;
- arquivos e decisões alterados;
- validações executadas e seus resultados;
- desvios, riscos, limitações e trabalho pendente;
- documentos e evidências atualizados.
