# API Standard (Padrão de API)

## Linha de base

Cada API deve definir o seu contrato, propriedade, autenticação, autorização, versionamento, erros, limites, janela de compatibilidade, observabilidade e documentação canônica.

- Validar as requisições e retornar erros estáveis e acionáveis, sem vazar informações internas.
- Tratar o comportamento consumido externamente como um contrato de compatibilidade.
- Especificar paginação, ordenação, filtragem, idempotência, concorrência e timeouts (tempos de limite) onde aplicável.
- Usar períodos explícitos de descontinuação (deprecation) e migração para mudanças que quebrem compatibilidade (breaking changes).
- Proteger campos sensíveis e auditar operações relevantes para a segurança.
- Adicionar testes de contrato e integração em limites que evoluem de forma independente.

A SPEC deve identificar os consumidores afetados e o comportamento de rollout (implantação)/rollback (reversão).
