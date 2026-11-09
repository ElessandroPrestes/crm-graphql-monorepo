# Bootstrapping de projetos

Bootstrapping é a criação assistida do contexto inicial de um projeto existente.
Até existir automação oficial, o processo é manual e revisado por pessoas.

## Fase 1: inventário somente leitura

Inspecione estrutura, histórico, configuração, dependências, código, testes,
automação e documentação. Não altere produção durante esta fase. Registre fatos,
inferências, conflitos e dados ausentes separadamente.

## Fase 2: PROJECT inicial

Preencha `templates/project.md` com referências para fontes reais. Use
“desconhecido” quando necessário e atribua um responsável para resolver lacunas.
Não descreva uma arquitetura pretendida como se já existisse.

## Fase 3: baseline operacional

Defina:

- workflow padrão e pessoas autorizadas a aprovar;
- comandos de setup, build, teste, lint e execução;
- padrões aplicáveis e exceções existentes;
- ambientes, dados de teste, segurança e observabilidade;
- critérios mínimos de revisão e release.

## Fase 4: validação humana

Responsáveis por produto, arquitetura, engenharia, QA e operação revisam as
seções pertinentes. Incertezas remanescentes viram tarefas de documentação, não
fatos inventados.

## Fase 5: adoção incremental

Escolha uma mudança limitada para testar o fluxo completo. Registre fricções e
melhore o perfil local antes de ampliar a adoção.

O bootstrap descreve o projeto; ele não autoriza novas funcionalidades.
