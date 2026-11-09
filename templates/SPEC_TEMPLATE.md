# SPEC: <title>

## Metadados

| Campo | Valor |
|---|---|
| ID | SPEC-NNN |
| Status | Draft (Rascunho) / In review (Em revisão) / Approved (Aprovado) / Implemented (Implementado) / Superseded (Substituído) |
| Responsável | |
| Revisores | Produto / Design / Engenharia / QA / Segurança |
| Criado | YYYY-MM-DD |
| Atualizado | YYYY-MM-DD |
| Liberação Alvo | |
| Refs: | Discovery (Descoberta): <caminho ou N/A — motivo>; Design: <caminho ou N/A — motivo>; ADRs: <ADR-NNN ou N/A — motivo> |

## Problema e resultado

Descreva o problema, os grupos afetados, as evidências atuais, o resultado desejado e as medidas de sucesso. Diferencie fatos de suposições.

## Escopo

### No escopo (In scope)

-

### Fora do escopo (Out of scope)

-

## Comportamento funcional

Descreva regras, permissões, validações, alterações de dados, integrações, tratamento de falhas, idempotência, concorrência e casos extremos (edge cases) aplicáveis.

## Requisitos não-funcionais

- Segurança e privacidade:
- Desempenho e capacidade:
- Confiabilidade e recuperação:
- Acessibilidade:
- Compatibilidade:
- Observabilidade:

## Critérios de aceitação

Use um bloco YAML por critério. Não adicione texto livre (prosa) relevante para o cumprimento fora desses campos. O `id` é imutável após a aprovação para que as TAREFAS (TASKs) e as evidências de QA possam mapeá-lo.

### AC-001

```yaml
id: AC-001
title: <curto comportamento observável>
preconditions:
  - <estado ou permissão necessária>
action: <ação do ator ou evento de disparo>
expected_result: <resultado observável>
evidence_type: automated / manual / accessibility / design / other
```

## Abordagem técnica

Resuma componentes afetados, APIs, schemas, migrações, feature flags, dependências, compatibilidade e alternativas rejeitadas.

## Entrega e operações

- Plano de implantação (Rollout plan):
- Plano de migração:
- Plano de rollback (reversão):
- Monitoramento e alertas:

## Riscos e dependências

| Risco ou dependência | Impacto | Probabilidade | Mitigação | Responsável |
|---|---|---|---|---|
| | | | | |

## Questões abertas

| Questão | Responsável | Data limite | Resolução |
|---|---|---|---|
| | | | |

## Aprovação

| Papel | Nome | Decisão | Data | Notas |
|---|---|---|---|---|
| Produto | | Approved / Rejected | | |
| Design | | Approved / Rejected / N/A | | |
| Engenharia | | Approved / Rejected | | |
| QA | | Ready / Not ready | | |
