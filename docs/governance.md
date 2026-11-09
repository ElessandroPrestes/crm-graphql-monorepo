# Governança

## Linguagem normativa

- **DEVE / NÃO DEVE:** requisito obrigatório.
- **DEVERIA / NÃO DEVERIA:** padrão esperado, com justificativa para desvio.
- **PODE:** opção permitida.

## Autoridade e aprovação

Cada projeto adotante define em `PROJECT.md` quem pode aprovar produto,
arquitetura, segurança, design, QA e release. Uma aprovação registra identidade,
decisão, revisão do artefato e data.

Silêncio, ausência de comentário e saída gerada por IA não equivalem a aprovação
humana.

## Mudanças no framework

Mudanças normativas devem incluir:

1. problema e usuários afetados;
2. proposta, alternativas e impacto de migração;
3. critérios de aceitação;
4. aprovação dos mantenedores;
5. atualização coordenada de documentos e changelog.

Mudanças arquiteturais usam ADR. Breaking changes exigem destaque e orientação
de migração. Antes da v1.0, a API documental pode evoluir, mas mudanças não devem
ser silenciosas.

## Exceções

Uma exceção identifica regra, motivo, impacto, mitigação, responsável, aprovador
e expiração. Ela não reescreve o resultado de um gate. Exceções expiradas devem
ser resolvidas ou renovadas explicitamente.

## Auditoria e retenção

Specs, tarefas, ADRs e reviews são versionados. Artefatos superseded permanecem
rastreáveis. Evidências externas devem ter localização estável, controle de
acesso e política de retenção compatível com o projeto.
