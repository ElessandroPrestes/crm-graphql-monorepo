# Orçamento de contexto por fase (Context budget by phase)

## Regras compartilhadas

Comece com o arquivo `AGENTS.md`, este guia, e o índice curto `PROJECT.md`. Carregue um módulo de conhecimento apenas quando a SPEC ativa o nomear em `Refs:` ou um risco material for documentado com o módulo e o motivo. Um índice é apenas metadado de recuperação (retrieval), não um motivo para carregar todo módulo listado nele. Nunca substitua um artefato obrigatório por uma busca em todo o repositório ou um resumo inferido.

## Descoberta (Discovery)

**Deve carregar:** a solicitação de entrada; `AGENTS.md`; `PROJECT.md` nas seções "Current state" (Estado atual), "Canonical hierarchy" (Hierarquia canônica) e "Context index" (Índice de contexto); e a tabela de metadados em `knowledge/INDEX.md`.

**Pode carregar:** apenas módulos selecionados pelo domínio da solicitação ou um risco registrado; pesquisa existente diretamente vinculada pela solicitação.

**Não carregar:** futuras SPECs, TASKs, todos os módulos ou implementações não relacionadas.

## Design e Especificação (Design and Specification)

**Deve carregar:** a solicitação de entrada ou aprovação de descoberta; `AGENTS.md`; padrões de UX/UI aplicáveis e o documento do sistema de design; a SPEC em rascunho.

**Pode carregar:** artefatos de UX vinculados; módulos limitados de segurança ou arquitetura se o risco for identificado; um ADR.

**Não carregar:** tarefas, testes, código-fonte.

## Implementação (Implementation)

**Deve carregar:** `AGENTS.md`; a SPEC aprovada e o design; a TASK ativa; diretrizes (guidelines) aplicáveis de codificação, banco de dados ou segurança e ferramentas limitadas de repositório (por exemplo, configuração de linter).

**Pode carregar:** os arquivos do código-fonte e o esquema (schema) identificados pela TASK ou varredura pontual (spot scanning); `docs/traceability-matrix.md` se o rastreamento precisar de atualização.

**Não carregar:** toda a base de código, módulos não relacionados em `knowledge/`.

## Teste, Revisão e QA (Testing, Review, and QA)

**Deve carregar:** a SPEC aprovada; a TASK e as evidências; as ferramentas de teste e padrões de portão de qualidade (quality gate); PR (Pull Request) e arquivos modificados; este guia de orçamento de contexto; `AGENTS.md`.

**Pode carregar:** logs e rastreamentos (traces) vinculados; histórico restrito do Git se investigar uma regressão.

**Não carregar:** contexto global, módulos não referenciados na SPEC.
