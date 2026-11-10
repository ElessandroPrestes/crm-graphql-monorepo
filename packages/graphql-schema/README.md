# @nexo/graphql-schema

Pacote reservado para o schema GraphQL gerado e para os documents consumidos
pelo GraphQL Code Generator.

A Fase 0 apenas cria a estrutura. A Fase 1 adiciona:

- `schema.graphql` gerado pela API NestJS (code-first);
- `documents/` com queries e mutations do front-end;
- `codegen.ts` e os scripts de geração;
- verificação de drift na CI.

Nenhum schema foi gerado ainda; não trate este pacote como contrato público.
