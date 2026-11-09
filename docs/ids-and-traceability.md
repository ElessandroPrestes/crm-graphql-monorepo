# IDs e rastreabilidade (IDs and traceability)

## Propósito

Esta convenção torna a cadeia de entrega auditável sem impor um rastreador de problemas (issue tracker), linguagem de programação, provedor de CI ou instalação automática de hook do Git.
Ela complementa, em vez de substituir, a aprovação humana e as evidências de QA.

## Identificadores estáveis

| Artefato | Formato | Exemplo | Regra de alocação |
|---|---|---|---|
| Especificação (SPEC) | `SPEC-NNN` | `SPEC-042` | Use a próxima sequência de três dígitos não utilizada em `specs/`. |
| Emenda/Alteração de SPEC | `SPEC-NNN-vN` | `SPEC-042-v2` | Mantenha o identificador base e incremente o `N` apenas para uma alteração de SPEC aprovada. |
| Tarefa (TASK) | `TASK-NNN-XX` | `TASK-042-01` | Reutilize o número base de três dígitos da SPEC; incremente a sequência da tarefa de dois dígitos. |
| Decisão de arquitetura (ADR) | `ADR-NNN` | `ADR-017` | Use a próxima sequência de três dígitos não utilizada em `adr/`. |

Identificadores são imutáveis depois que um artefato é compartilhado para revisão. Não reutilize um identificador de um artefato substituído, rejeitado ou excluído. Uma alteração de SPEC faz referência a seu predecessor e é um artefato de aprovação separado; suas tarefas usam o identificador da SPEC alterada em seus campos `Refs:`.

## Ciclo de vida da alteração de SPEC

Uma SPEC aprovada é imutável. Uma mudança de escopo cria o próximo artefato `SPEC-NNN-vN` disponível; ela nunca sobrescreve o predecessor aprovado. Seu campo de metadados `Refs:` identifica o predecessor exato, e sua tabela de aprovação registra um novo ciclo de aprovação humana aplicável antes que uma TAREFA (TASK) possa implementá-la.

Use o identificador alterado em todos os campos `Refs:` de TASKs derivadas e nos trailers de commit. Preserve o predecessor para auditoria. Marque-o como `Superseded` (Substituído) somente quando a alteração aprovada o substituir; tarefas, commits e evidências históricas continuam a referenciar o artefato que as governou.

Um esclarecimento simples (lightweight clarification) não cria uma versão da SPEC e não edita a SPEC aprovada. É registrado em uma solicitação de mudança (change request) vinculada à base da SPEC, com a pergunta, resolução, justificativa e aprovação assíncrona da mesma autoridade humana que aprovou a SPEC base. Só é válido quando não altera o comportamento observável ou os critérios de aceitação.

## Referências obrigatórias

Novos artefatos usam os templates em letras maiúsculas em `templates/`. Os templates legados em minúsculas permanecem disponíveis para adoção compatível.

| Artefato | Conteúdo obrigatório de `Refs:` |
|---|---|
| SPEC | Referências de descoberta, de design e de ADRs aplicáveis; registre `N/A — <motivo>` quando uma atividade anterior (upstream) não se aplicar. |
| TASK | O identificador exato da SPEC aprovada, IDs de critérios de aceitação aplicáveis e ADRs aplicáveis. |
| Artefato de QA ou revisão | Os identificadores de SPEC e TASK que ele verifica, usando as linhas `Spec-Ref:` e `Task-Ref:` quando não existe tabela de metadados. |

As referências devem ser explícitas. Uma referência ausente, malformada ou não solucionável é uma lacuna (gap) de rastreabilidade a ser registrada e resolvida; nem uma pessoa nem um script pode inferir o link pretendido a partir de textos em prosa ou nomes de arquivos correspondentes.

## Trailers de commit

Todo commit de implementação associado a uma TAREFA aprovada inclui exatamente um trailer para a SPEC e um para a TAREFA (TASK):

```text
Spec-Ref: SPEC-042
Task-Ref: TASK-042-01
```

Use a versão exata da SPEC ao implementar uma alteração, por exemplo, `Spec-Ref: SPEC-042-v2`. Um commit que não está relacionado a uma TAREFA aprovada omite os dois trailers. Nunca adicione apenas um trailer.

Para optar pela validação local, copie o hook fornecido e torne-o executável:

```sh
cp templates/hooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

O hook valida a presença e o formato sempre que algum trailer de rastreabilidade for usado. Ele é intencionalmente opcional, para que os adotantes existentes possam migrar sem bloquear commits históricos ou não relacionados.

## Matriz de rastreabilidade

Gere a matriz do repositório a partir de sua raiz com:

```sh
python3 scripts/generate_traceability.py
```

A saída padrão (default) é `docs/traceability-matrix.md`. Ela lista cada SPEC descoberta, TAREFAS vinculadas, commits cujos trailers referenciam a SPEC ou a TAREFA vinculada, e registros vinculados de QA/revisão. Ela também lista lacunas, como uma TAREFA sem uma SPEC existente ou uma SPEC sem uma referência de TAREFA ou commit. O gerador lê apenas as pastas `specs/`, `tasks/`, `reviews/` e o histórico do Git; ele não edita os artefatos de origem nem o histórico do Git. Use `--output <path>` para escrever uma matriz diferente.

Markdown é o formato padrão porque pode ser revisado em qualquer repositório. O script de origem contém as regras de extração determinísticas, para que os adotantes possam converter o resultado em outro formato de relatório sem alterar os registros de origem.
