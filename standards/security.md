# Segurança — OWASP Top 10:2025

> Padrão de segurança aplicável a toda SPEC, TASK ou revisão de código dentro do Universal SDD.
> Este arquivo não existia na estrutura original do framework — preenche a lacuna de segurança identificada na análise do documento base.

## Objetivo

Definir os requisitos mínimos de segurança que toda implementação do Universal SDD deve atender, com base no **OWASP Top 10:2025** — edição mais recente, publicada pela OWASP Foundation em janeiro de 2026, que substitui a edição de 2021.

## Escopo

Aplica-se a qualquer SPEC que envolva:

- Autenticação, sessão ou controle de acesso;
- Manipulação de dados pessoais ou sensíveis;
- Integrações externas (APIs, webhooks, filas, serviços de terceiros);
- Upload/download de arquivos;
- Dependências de terceiros (bibliotecas, pacotes, imagens de container, pipeline de build);
- Qualquer superfície exposta publicamente (rotas HTTP, formulários, endpoints).

## Princípios

Seguindo o mesmo padrão dos princípios centrais do framework:

- Toda SPEC que amplia a superfície de ataque exige **revisão de segurança** antes da aprovação — assim como mudanças de interface já exigem revisão de design e acessibilidade.
- Nenhuma TASK é considerada concluída sem evidência de mitigação para os riscos aplicáveis do OWASP Top 10:2025.
- Divergência entre o comportamento de segurança esperado (SPEC) e o comportamento implementado é tratada como **defeito** — nunca resolvida silenciosamente pela IA ou pelo desenvolvedor.
- Segredos, chaves e credenciais nunca são versionados no repositório; ficam em cofres de segredos ou variáveis de ambiente geridas fora do código.
- A cadeia de dependências (SCA/SBOM) é auditada de forma contínua, não apenas no momento do release.

## OWASP Top 10:2025 — categorias e requisitos mínimos

| # | Categoria | O que cobre | Requisito mínimo na implementação |
|---|---|---|---|
| A01 | Broken Access Control | Acesso a dados ou funções além do que o usuário deveria ver/fazer (inclui o que antes era SSRF). | Toda rota/ação valida autorização no backend (nunca só no cliente); princípio do menor privilégio; nega por padrão. |
| A02 | Security Misconfiguration | Configurações padrão inseguras, permissões excessivas, ambientes de debug expostos. | Checklist de hardening por ambiente; nenhum modo debug/verbose em produção; headers de segurança definidos (CSP, HSTS etc.). |
| A03 | Software Supply Chain Failures *(novo)* | Dependências comprometidas, pacotes maliciosos, builds adulterados, atualizações inseguras. | SCA no pipeline; SBOM gerado a cada release; builds reprodutíveis e assinados quando aplicável. |
| A04 | Cryptographic Failures | Dados sensíveis mal protegidos em trânsito/repouso, algoritmos fracos ou obsoletos. | TLS obrigatório em trânsito; hashing forte para senhas (Argon2/bcrypt); nenhum dado sensível em log ou texto plano. |
| A05 | Injection | SQL, NoSQL, comando de SO, LDAP, template injection, entre outras. | Queries parametrizadas/ORM; validação e sanitização de toda entrada externa. |
| A06 | Insecure Design | Ausência de modelagem de ameaças e controles de segurança já no design. | Ameaças mapeadas na etapa de Arquitetura/SPEC — antes da implementação, não depois. |
| A07 | Authentication Failures | Sessões previsíveis, senhas fracas, ausência de MFA, tokens mal geridos. | Política de senha forte, expiração/rotação de sessão, MFA para contas sensíveis, tokens com escopo e expiração. |
| A08 | Software or Data Integrity Failures | Pipelines de CI/CD, atualizações ou deserialização sem verificação de integridade. | Verificação de assinatura/checksum em artefatos; pipeline de CI/CD protegido contra alterações não auditadas. |
| A09 | Security Logging and Alerting Failures | Ausência de logs de eventos de segurança ou de alertas para incidentes. | Log de eventos críticos (login, falha de autorização, alterações sensíveis) sem dados sensíveis; alertas para anomalias. |
| A10 | Mishandling of Exceptional Conditions *(novo)* | Tratamento de erro que vaza informação ou deixa o sistema em estado inconsistente. | Mensagens de erro genéricas para o usuário final; stack traces nunca expostos; falhas tratadas sem comprometer a segurança. |

## Quality Gates de segurança

No mesmo formato de entrada/saída usado em `standards/quality-gates.md`:

**Na SPEC (antes da implementação)**
- [ ] Classificação de dados tratados (pública, interna, sensível, pessoal)
- [ ] Modelagem de ameaças leve para a mudança proposta
- [ ] Requisitos de autenticação/autorização explicitados

**Durante a implementação**
- [ ] SAST executado sem findings críticos/altos não tratados
- [ ] SCA/dependency scanning sem vulnerabilidades críticas conhecidas
- [ ] Scanner de segredos sem ocorrências

**Antes do release**
- [ ] Revisão de configuração do ambiente de destino
- [ ] Logs verificados para garantir ausência de dados sensíveis
- [ ] DAST/pentest leve quando a mudança expõe nova superfície pública

## Processo de revisão

Revisão de segurança é **obrigatória** sempre que a SPEC:

- cria ou altera uma rota/endpoint exposto;
- altera regras de autenticação ou autorização;
- introduz nova dependência externa ou integração de terceiros;
- manipula dados pessoais ou sensíveis.

Recomenda-se atualizar o princípio central do framework para:
> "Mudanças de interface **e de superfície de ataque** exigem revisão de design, acessibilidade e segurança."

## Ferramentas sugeridas (agnósticas de stack)

- **SAST:** Semgrep, CodeQL, SonarQube
- **SCA/SBOM:** OWASP Dependency-Check, Trivy, Syft/Grype
- **Secrets scanning:** Gitleaks, TruffleHog
- **DAST:** OWASP ZAP

## Referências

- OWASP Top 10:2025 — https://top10.owasp.org/2025/
