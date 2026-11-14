# Release notes — Nexo CRM 0.3.0-alpha

Data: 2026-11-13
Branch: `develop`
Status: pré-release técnica; não é um anúncio de produção.

## Destaques

- Endurecimento GraphQL: persisted queries, rate limits por usuário/IP,
  bloqueio de login, payload máximo e introspecção desativada em produção.
- Qualidade de entrega: E2E Playwright em desktop/mobile/API, axe nos temas
  claro/escuro, testes negativos de segurança e CI com artefatos.
- Desempenho: benchmark k6 com e sem DataLoader, seed determinístico e
  metodologia reproduzível.
- Cadeia de suprimentos: SBOM CycloneDX na CI e Dependabot semanal.
- Operação: guia de deploy provider-neutral com backup, rollback e smoke tests.

## Evidências

| Área          | Resultado                                                                      |
| ------------- | ------------------------------------------------------------------------------ |
| E2E           | 43 testes verdes localmente; 4 desktop, 4 mobile, 6 API e 29 de acessibilidade |
| axe           | 30 varreduras, zero violações critical/serious                                 |
| Segurança     | IDOR, tokens, refresh, HMAC, WS sem token e bypass de rate limit cobertos      |
| k6 p95        | 9.494,65 ms sem DataLoader; 58,58 ms com DataLoader                            |
| k6 throughput | 5,69 req/s sem DataLoader; 9,91 req/s com DataLoader                           |
| SBOM          | CycloneDX 1.6 com 1.119 componentes; schema oficial ainda não validado         |
| CI            | Quality gates, E2E, security scans e CodeQL verdes (run 43535806770)           |

Os números de k6 são de um host local compartilhado e não são SLO de produção.
Consulte [performance.md](performance.md).

## Compatibilidade e migração

- Sem migration nova nesta release.
- Variável nova: `DATALOADER_ENABLED`, default `true`; use `false` apenas para
  benchmark.
- `PERSISTED_QUERIES_MODE` continua `audit` por default. Antes de usar
  `enforce`, confirme que o cliente publicado está na allowlist.
- `NODE_ENV=production` exige `ACCESS_TOKEN_SECRET` e WhatsApp Cloud completos.

## Riscos e pendências

- Gate 4 da Fase 4: revisão manual com NVDA/VoiceOver e zoom 200% pendente.
- GIF de demonstração do README ainda não foi gravado; nenhum binário é
  versionado.
- Deploy real e escolha do provedor não executados.
- Bootstrap do primeiro `ADMIN` em produção ainda não automatizado.
- Retenção/base legal LGPD não aprovadas; use somente dados fictícios.
- Primeiro PR do Dependabot depende do agendamento no GitHub.
- `pnpm audit` mantém advisories moderadas de desenvolvimento em `glob` e
  `minimatch`, sem correção compatível no momento.

## Próximos passos

1. Concluir o Gate 4 humano e registrar aprovações ou exceções.
2. Decidir provedor e executar um deploy de referência com TLS e backup.
3. Aprovar retenção/base legal LGPD e o bootstrap de administrador.
4. Definir SLOs com medição no ambiente alvo.
