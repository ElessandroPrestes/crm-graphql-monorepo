# Base de conhecimento

A Knowledge Base preserva contexto reutilizável que ajuda decisões futuras sem
substituir fontes normativas.

## O que registrar

- glossário e linguagem do domínio;
- convenções recorrentes e exemplos aprovados;
- mapas de sistemas, integrações e responsáveis;
- armadilhas conhecidas e diagnóstico operacional;
- lições verificadas e referências duráveis.

Use `templates/knowledge-entry.md` e armazene a entrada em `knowledge/`.
Para contexto de estado atual modularizado, mantenha `PROJECT.md` como índice
canônico e registre metadados de recuperação em `knowledge/INDEX.md`; módulos
podem compor esse estado sem substituir regras normativas.

## O que pertence a outro lugar

| Informação | Local correto |
|---|---|
| Índice do estado atual do projeto | `PROJECT.md` e módulos vinculados em `knowledge/INDEX.md` |
| Requisito de uma mudança | `specs/` |
| Decisão arquitetural | `adr/` |
| Trabalho executável | `tasks/` |
| Regra obrigatória | `standards/` |
| Resultado de validação | `reviews/` ou evidência de teste |

## Qualidade de uma entrada

Toda entrada deve declarar origem, responsável, data de revisão, aplicabilidade
e links para fontes. Hipóteses devem ser identificadas. Conteúdo obsoleto deve
ser atualizado ou marcado como superseded; não deve desaparecer sem histórico.
