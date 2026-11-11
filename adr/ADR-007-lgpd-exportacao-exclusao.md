# ADR-007: Exportação e exclusão de dados de contato (LGPD)

## Metadados

| Campo                     | Valor                           |
| ------------------------- | ------------------------------- |
| Status                    | Accepted                        |
| Data                      | 2026-11-11                      |
| Responsáveis              | Produto, Engenharia e Segurança |
| SPEC relacionada          | SPEC-004                        |
| Substitui/substituída por | —                               |

## Contexto

A Fase 3 passa a armazenar conversas e mensagens de WhatsApp vinculadas a
contatos, aumentando a superfície de dados pessoais. O roadmap exige
exportação e exclusão de dados de contato, e o `PROJECT.md` registra que a
retenção e a exportação LGPD ainda não estão implementadas.

O modelo atual exclui contatos com `deleteContact`, mas o comportamento não
está documentado como operação de privacidade: atividades são removidas por
cascata, negócios mantêm o registro com `contactId` nulo e não há exportação
nem auditoria específica. Com mensagens e conversas, a exclusão passa a afetar
mais entidades e precisa de decisão explícita.

## Drivers da decisão

- Atender ao direito de acesso e eliminação para dados fictícios da demo.
- Evitar que a exclusão deixe mensagens ou atividades órfãs.
- Preservar negócios e histórico comercial sem reter o vínculo pessoal.
- Não expor dados de outros donos na exportação ou exclusão.
- Não usar exclusão lógica que mantenha PII indefinidamente.
- Manter a operação simples o suficiente para a demo e para testes.

## Alternativas consideradas

### Alternativa A: exclusão lógica com `deletedAt`

- Benefícios: reversível; fácil de auditar; não quebra referências.
- Custos e riscos: mantém PII no banco; exige filtro em todas as consultas e
  jobs de expurgo; não atende bem ao direito de eliminação.

### Alternativa B: anonimização com preservação de histórico

- Benefícios: mantém métricas e histórico comercial.
- Custos e riscos: anonimização de texto livre é frágil; mensagens podem conter
  PII; exige regras por campo e revisão jurídica.

### Alternativa C: exclusão física com cascata e preservação de negócios

- Benefícios: elimina PII de forma verificável; simples de testar; alinhada à
  demo.
- Custos e riscos: irreversível; remove atividades e conversas; negócios ficam
  sem contato; backups não são cobertos.

## Decisão

Adotar a Alternativa C:

- **Exportação**: mutation GraphQL autenticada `exportContactData(contactId)`
  retorna um payload tipado com `exportedAt`, contato, empresa, negócios,
  atividades, conversas e mensagens. A exportação é escopada por `ownerId`
  (ou qualquer contato para `ADMIN`) e não inclui registros de outros donos.
- **Exclusão**: a mutation existente `deleteContact(id)` passa a ser a operação
  de eliminação: remove fisicamente o contato e, por cascata, atividades,
  conversas e mensagens. Negócios são preservados com `contactId` nulo;
  empresas não são afetadas.
- **Auditoria**: registrar evento de exportação/exclusão com `contactId`,
  `actorId`, `requestId` e timestamp, sem nome, e-mail, telefone ou conteúdo de
  mensagem.
- **Autorização**: `SELLER` só exporta/exclui os próprios contatos; `ADMIN`
  exporta/exclui qualquer contato; recurso de outro dono retorna `NOT_FOUND`.
- **Retenção**: a fase não implementa job de retenção, anonimização automática
  ou expurgo de backup. Apenas dados fictícios são usados; a política completa
  continua pendente para dados reais.
- **Minimização**: logs e eventos em tempo real não carregam conteúdo de
  mensagem; a exportação é explícita e sob demanda.

## Consequências

### Positivas

- Eliminação de PII verificável e testável.
- Negócios e métricas comerciais permanecem íntegros com `contactId` nulo.
- Operação única e documentada, sem duplicar `deleteContact`.
- Auditoria sem ampliar o risco de vazamento.

### Negativas e riscos

- Exclusão é irreversível e pode surpreender usuários; a UI da Fase 4 deve
  confirmar a ação.
- Atividades e histórico de conversas são perdidos junto com o contato.
- Backups e réplicas não são cobertos; a política real precisa de retenção e
  expurgo.
- Exportação de conversas grandes pode consumir memória; a demo usa volumes
  pequenos e a fase não define streaming.
- A exclusão depende de `onDelete: Cascade` nas relações; novas entidades
  precisam ser adicionadas explicitamente à cascata.

## Implementação e migração

- Compatibilidade: mantém o nome `deleteContact`; adiciona
  `exportContactData`; não altera o contrato de negócios.
- Etapas: adicionar relações e cascatas no schema; implementar exportação;
  adaptar exclusão; adicionar auditoria; testar IDOR, cascata e preservação de
  negócios.
- Rollback: reverter o commit e a migration; a exclusão física já executada não
  é reversível, o que é esperado para a operação.
- Observabilidade: log estruturado de auditoria com IDs técnicos; nunca incluir
  PII no log.

## Evidências e validação

- Pendente de aprovação humana e da implementação da SPEC-004.
- Evidências esperadas: teste de exportação completa, teste de exclusão com
  cascata, negócio preservado com `contactId` nulo e IDOR entre vendedores.
