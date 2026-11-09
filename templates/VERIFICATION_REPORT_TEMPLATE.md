# Relatório de Verificação de QA (QA Verification Report): <title>

## Metadados

| Campo | Valor |
|---|---|
| ID | VR-NNN |
| Status | Passed (Aprovado) / Blocked (Bloqueado) |
| SPEC | SPEC-NNN |
| TAREFA (TASK) | TASK-NNN-XX |
| Evidência Ref | <caminho para o arquivo de evidência de QA> |
| Verificador | QA-Verifier |
| Data de Execução | YYYY-MM-DD |

## Resultados da comparação

O QA-Verifier compara cada critério estruturado na SPEC aprovada com a evidência estruturada de QA. Cada item é classificado como:

- **verified (verificado):** a evidência corresponde ao critério, pré-condições, ação e resultado esperado, com o status aprovado (passing) ou com uma exceção aprovada.
- **missing (ausente):** não existe uma entrada de evidência de QA para este ID de critério.
- **unmapped (não mapeado):** a evidência não pode ser vinculada exatamente a um ID de critério aprovado.
- **failed (falhou):** a evidência vinculada registra um resultado reprovado.
- **ambiguous (ambíguo):** o critério ou a evidência não possui detalhes estruturados suficientes para confirmar a verificação.

| ID do Critério | Resultado Esperado da SPEC | Status da Evidência | Classificação do Verificador | Notas / Achado |
|---|---|---|---|---|
| AC-001 | | passed | verified | |
| AC-002 | | passed | verified | |

## Descobertas não resolvidas (Unresolved findings)

Liste cada item ausente, não mapeado, falho ou ambíguo. Qualquer descoberta em aberto bloqueia a Revisão de Código (Code Review).

| ID da Descoberta | Critério | Classificação | Descrição | Ação requerida |
|---|---|---|---|---|
| | | | | |

## Decisão do Portão 3 (Gate 3 decision)

- Status do Portão: **Pass** (Pronto para Code Review) / **Blocked** (Descobertas em aberto)
- Contagem de descobertas abertas: 0
- Exceções autorizadas: Nenhuma / <referência>
- Assinatura do verificador e timestamp:
