# Workflows oficiais

Workflows definem a sequência de trabalho; quality gates definem as condições de
passagem. O fluxo padrão está em `workflows/feature.md`.

## Fluxo resumido

```text
Ideia → Discovery → Arquitetura → Design → SPEC aprovada → TASK
      → Implementação → Testes → Revisões → Documentação → Release
```

Etapas de design são aplicáveis a mudanças de experiência ou interface. Uma
etapa pode ser marcada como não aplicável apenas com justificativa registrada.

## Estados de uma mudança

| Estado | Condição de entrada | Próxima decisão |
|---|---|---|
| Descoberta | problema identificado | prosseguir, pesquisar ou encerrar |
| Especificação | contexto suficiente | aprovar, revisar ou rejeitar |
| Pronta | SPEC aprovada e TASKs rastreáveis | implementar |
| Em implementação | tarefa atribuída | validar ou devolver à SPEC |
| Em validação | escopo implementado | aprovar, corrigir ou bloquear |
| Pronta para release | gates aplicáveis aprovados | liberar ou adiar |
| Concluída | entrega e documentação alinhadas | monitorar e aprender |

## Retornos obrigatórios

- Ambiguidade de requisito retorna à SPEC.
- Mudança arquitetural retorna à análise e ao ADR.
- Expansão de escopo retorna à aprovação humana.
- Defeito retorna à TASK de correção ou refatoração.
- Falha de gate impede avanço ou exige exceção formal.

Adaptações devem ser registradas no perfil ativo e preservar rastreabilidade.
