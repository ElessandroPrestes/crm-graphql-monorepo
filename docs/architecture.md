# Arquitetura do framework

O Universal SDD é uma arquitetura documental modular. Ele não exige runtime,
linguagem, fornecedor de IA ou ferramenta de gestão.

## Camadas

| Camada | Local | Responsabilidade |
|---|---|---|
| Estado | `PROJECT.md` | Descrever o projeto como ele existe agora |
| Entrada | `AGENTS.md` e arquivos por IA | Orientar o início seguro de cada sessão |
| Governança | `docs/` e `standards/` | Definir regras, qualidade e tomada de decisão |
| Execução | `workflows/` e `agents/` | Definir sequência, responsáveis e limites |
| Contexto | `knowledge/` e `adr/` | Preservar conhecimento e decisões duráveis |
| Mudança | `specs/` e `tasks/` | Autorizar comportamento e decompor execução |
| Evidência | `reviews/` e testes | Demonstrar conformidade e decidir release |
| Reuso | `templates/` e `profiles/` | Padronizar artefatos e adaptar tecnologias |

## Relação entre fontes

Para uma mudança ativa, a SPEC aprovada define o comportamento esperado. O
`PROJECT.md` registra o estado canônico atual. Código, testes e evidências
demonstram o que foi entregue. Depois da aceitação, essas fontes devem convergir.

Uma divergência nunca é resolvida por suposição. Ela se torna:

- defeito, se a implementação descumpre o requisito aprovado;
- mudança de escopo, se o requisito precisa mudar;
- dívida documental, se o comportamento aceito não foi documentado.

## Extensão

Um projeto pode adicionar agentes, workflows, standards, templates e profiles.
Extensões devem declarar precedência, responsáveis, compatibilidade e impacto.
Regras específicas de fornecedor devem ficar na borda; a política canônica
permanece independente de ferramenta.

## Propriedades desejadas

- **Rastreabilidade:** requisito, tarefa, mudança, teste e revisão se conectam.
- **Previsibilidade:** entradas, saídas e gates são explícitos.
- **Auditabilidade:** decisões e evidências têm autor, data e revisão.
- **Portabilidade:** o núcleo não depende de tecnologia específica.
- **Proporcionalidade:** rigor aumenta com risco e impacto.
