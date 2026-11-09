# Fluxo de Trabalho de Funcionalidade (Feature Workflow)

## Propósito

Fornecer o fluxo de trabalho (workflow) padrão de ponta a ponta para uma funcionalidade (feature). Alterações não voltadas ao usuário podem marcar as atividades de design como não aplicáveis com um motivo registrado. Perfis mais arriscados podem introduzir aprovações adicionais.

## 1. Descoberta de Produto e UX (Product and UX discovery)

Responsável: Produto e Pesquisa de UX.

Artefatos:

- `templates/ux-brief.md`;
- evidências existentes, suposições, grupos de usuários, jornada atual e riscos;
- medidas de sucesso.

Saída: O Portão 1 em `standards/quality-gates.md` é aprovado.

## 2. Arquitetura e viabilidade (Architecture and feasibility)

Responsável: Arquitetura.

Confirme restrições, integrações, dados, segurança, desempenho, observabilidade e decisões arquiteturais. Crie uma ADR para mudança de arquitetura.

## 3. Design de UX/UI

Responsável: Design de UX/UI.

Artefatos:

- `templates/user-flow.md`;
- wireframe ou protótipo quando necessário;
- `templates/design-specification.md`;
- anotações de acessibilidade.

Saída: a aprovação humana autorizada de design é registrada.

## 4. Especificação funcional e técnica (Functional and technical specification)

Responsável: Agente de Especificação.

A SPEC vincula os artefatos de descoberta e design e define o escopo, o que está fora do escopo, critérios de aceitação, dados, integrações, segurança, desempenho, observabilidade, migração, rollback (reversão) e riscos.

Saída: aprovação comercial e técnica é registrada.

## 5. Tarefas e planejamento de QA (Tasks and QA planning)

Responsáveis: Agente de Tarefas e Agente de QA.

Crie tarefas de implementação, `templates/qa-plan.md`, casos de teste, matriz de compatibilidade, escopo de regressão e rastreabilidade dos critérios de aceitação.

Saída: O Portão 2 é aprovado.

## 6. Implementação

Responsável: Agente de Implementação.

Implemente apenas tarefas aprovadas. Adicione os testes automatizados mais baixos e confiáveis ​​que comprovem o comportamento. Registre perguntas de escopo em vez de tomar decisões não documentadas de produto ou design.

## 7. QA e regressão

Responsáveis: Agentes de Teste e de QA.

Execute verificações automatizadas, manuais, exploratórias, de compatibilidade, visuais, de acessibilidade, segurança, de desempenho e aceitação de usuário/negócio de acordo com o risco.
Registre evidências reprodutíveis e defeitos.

Execute o QA-Verifier conforme definido em `workflows/verification.md` antes de análises (reviews) independentes. Ele relata divergências de critério-para-evidência e é uma condição bloqueadora do Portão 3.

Saída: O Portão 3 é aprovado.

## 8. Revisões independentes (Independent reviews)

Responsáveis: Agente de Revisão de Acessibilidade, Agente de Revisão de Design e Agente de Revisão.

Realize revisões aplicáveis ​​de forma independente. O trabalho rejeitado retorna apenas com os problemas identificados para implementação ou refatoração. Mudanças de escopo retornam à SPEC e aprovação humana.

Saída: todas as revisões aplicáveis ​​são aprovadas.

## 9. Decisão de Lançamento (Release decision)

Responsáveis: Agentes de QA e Release (Lançamento).

O QA emite 'Go' (Aprovado), 'Go with accepted risk' (Aprovado com risco aceito) ou 'No-go' (Não aprovado). O Agente Release confirma o build, portões (gates), documentação, versão, release notes (notas de lançamento), implantação (deployment), rollback (reversão) e monitoramento.

Saída: O Portão 4 é aprovado.

## 10. Entrega e aprendizado (Delivery and learning)

Execute smoke checks (testes de fumaça) e monitore sinais definidos. Alinhe o código, PROJECT.md, SPEC, decisões, testes e evidências. Registre trabalhos de follow-up (acompanhamento) e atualize os padrões quando uma lição reutilizável for identificada.

Saída: O Portão 5 é aprovado.
