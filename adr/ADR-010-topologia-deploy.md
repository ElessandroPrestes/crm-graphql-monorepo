# ADR-010: Topologia de deploy e ambientes

## Metadados

| Campo                     | Valor                           |
| ------------------------- | ------------------------------- |
| Status                    | Proposed                        |
| Data                      | 2026-11-14                      |
| Responsáveis              | Engenharia, Operações e Produto |
| SPEC relacionada          | SPEC-008                        |
| Substitui/substituída por | —                               |

## Contexto

O Nexo CRM tem imagens Docker funcionais e um guia de deploy provider-neutral,
mas nunca foi implantado em um ambiente real. Não há staging, pipeline de CD,
domínio, TLS, gestão de segredos, bootstrap de `ADMIN`, backup testado ou
observabilidade de produção. A discovery da Fase 6 foi aprovada em 2026-11-14 e
a SPEC-008 está em revisão.

A equipe é pequena e o orçamento é limitado. A topologia precisa ser
reproduzível, barata, fácil de operar e compatível com o `infra/Dockerfile` e o
Compose local, sem transformar o Compose de demonstração em manifesto de
produção. A escolha do provedor, região, domínio e serviços gerenciados continua
sendo uma decisão humana; este ADR registra uma recomendação para aprovação.

## Drivers da decisão

- Reproduzibilidade e rollback por SHA sem depender de conhecimento tácito.
- Custo e esforço operacional compatíveis com uma equipe pequena.
- TLS, segredos, backup e isolamento de rede desde o primeiro ambiente.
- Compatibilidade com os três processos stateless (`api`, `worker`, `web`).
- Possibilidade de adicionar HA ou orquestração no futuro sem reescrever a
  aplicação.
- Nenhum dado real antes da aprovação LGPD; staging usa dados fictícios.

## Alternativas consideradas

### Alternativa A: VM Linux por ambiente com Docker Compose e dados gerenciados

- Benefícios: simples, portátil, próxima do ambiente local; baixo custo; deploy
  e rollback diretos; serviços de dados gerenciados reduzem backup e patching.
- Custos e riscos: host único é ponto único de falha; exige disciplina de
  patch, backup e monitoramento; escala vertical e alguma operação manual.

### Alternativa B: PaaS de containers com add-ons gerenciados

- Benefícios: TLS, deploy, escala e observabilidade básica integrados; menos
  operação de host; bom para equipe pequena.
- Custos e riscos: lock-in, custo variável, restrições de runtime/rede e
  compatibilidade limitada com RabbitMQ/Redis gerenciados; menos controle sobre
  o processo de migrations e rollback.

### Alternativa C: Kubernetes gerenciado ou single-node

- Benefícios: padrão de mercado, escala, probes, secrets e ecossistema.
- Custos e riscos: complexidade e custo altos para o tamanho atual; exige
  manifests, operadores, ingress, política de rede e conhecimento especializado.

## Decisão

Recomendar a **Alternativa A** para staging e produção inicial: uma VM Linux por
ambiente, Docker Compose para `api`, `worker` e `web`, proxy reverso com TLS e
PostgreSQL, Redis e RabbitMQ gerenciados quando o provedor oferecer. Se serviços
gerenciados não estiverem disponíveis, os containers de dados podem ser usados
com persistência, backup e restauração testados.

A decisão final de provedor, região, domínio, TLS, serviços gerenciados e
política de branch/tag permanece humana. Este ADR está `Proposed`; nenhuma
infraestrutura é provisionada antes da aceitação e da aprovação da SPEC-008.

Proposta operacional:

- Staging a partir de `develop`; produção a partir de tag `v*` assinada, com
  aprovação manual.
- Imagens imutáveis por SHA; migrations em job separado; smoke tests antes de
  liberar tráfego.
- Segredos no gerenciador do provedor ou em arquivo injetado no runtime, nunca
  no repositório.
- Staging com dados fictícios e WhatsApp mock; produção somente após LGPD,
  Gate 4 e SLOs aprovados.
- Backup diário com PITR quando disponível e restore trimestral testado.

## Consequências

### Positivas

- Caminho de deploy curto e compreensível, alinhado ao Dockerfile e ao Compose.
- Menor custo e complexidade inicial; rollback por SHA é direto.
- Serviços gerenciados reduzem risco de perda de dados e trabalho de patching.
- A aplicação continua portátil para PaaS ou Kubernetes no futuro.

### Negativas e riscos

- Host único não elimina ponto único de falha; HA exige nova decisão.
- Patching, TLS, backup e monitoramento do host continuam sob responsabilidade
  da equipe.
- Serviços gerenciados podem não estar disponíveis em todos os provedores ou
  regiões.
- A topologia precisa de disciplina para não promover o Compose local a
  produção.

## Implementação e migração

- **Compatibilidade:** os três processos continuam stateless; o `infra/Dockerfile`
  e as variáveis de ambiente existentes são reutilizados.
- **Etapas:** aceitar este ADR; provisionar staging; configurar DNS/TLS e
  segredos; publicar imagens por SHA; aplicar migrations; subir a stack; rodar
  smoke tests; configurar backup; repetir para produção após aprovações.
- **Rollback:** reverter imagens para o SHA anterior; manter migrations
  aditivas; restaurar banco quando a migration não for compatível.
- **Observabilidade:** readiness, logs correlacionados, métricas do host e dos
  serviços de dados; alertas definidos na SPEC-008.

## Evidências e validação

- Aceitação humana registrada neste ADR e na SPEC-008.
- Staging com TLS, smoke tests e rollback ensaiado (AC-801/AC-802).
- Backup e restore testados (AC-810).
- Readiness e observabilidade verificados (AC-804/AC-805).
