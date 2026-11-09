# Primeiros passos

Este guia descreve a adoção mínima do Universal SDD em um projeto existente.

## 1. Instale a estrutura

Copie os arquivos do framework preservando os diretórios. Não substitua
instruções locais válidas sem revisar o impacto. O framework pode coexistir com
documentação existente durante a migração.

## 2. Faça o discovery do repositório

Mapeie apenas fatos observáveis:

- objetivo e domínio do produto;
- linguagens, frameworks e versões;
- arquitetura, módulos e integrações;
- comandos de build, teste, lint e execução;
- ambientes, configuração e implantação;
- padrões de código, segurança, dados e interface;
- riscos, lacunas e decisões ainda não documentadas.

Não trate uma inferência como fato. Registre origem, confiança e perguntas em
aberto.

## 3. Gere o estado inicial

Use `templates/project.md` para criar ou revisar `PROJECT.md`. O documento deve
descrever o estado real do projeto, não o estado desejado. Valide-o com pessoas
responsáveis pelas áreas afetadas.

## 4. Escolha o workflow e o perfil

Use `workflows/feature.md` como fluxo padrão. Registre em `PROJECT.md` qualquer
adaptação necessária. Perfis em `profiles/` podem adicionar regras específicas,
mas não remover gates sem uma exceção aprovada.

## 5. Preencha a base de conhecimento

Registre convenções e contexto reutilizável em `knowledge/`. Decisões
arquiteturais pertencem a `adr/`; requisitos de uma mudança pertencem a
`specs/`. Consulte `docs/knowledge-base.md` para não duplicar responsabilidades.

## 6. Inicie a primeira mudança

1. Faça discovery proporcional ao risco.
2. Registre uma SPEC a partir de `templates/spec.md`.
3. Obtenha aprovação humana explícita.
4. Divida o escopo em TASKs com `templates/task.md`.
5. Implemente somente as TASKs aprovadas.
6. Execute testes e revisões aplicáveis.
7. Registre evidências, decisão de release e documentação final.

## Checklist mínimo de adoção

- [ ] `PROJECT.md` representa o estado atual e foi revisado.
- [ ] Pessoas e agentes conhecem `AGENTS.md`.
- [ ] O workflow ativo e seus aprovadores estão definidos.
- [ ] Comandos verificáveis e ambientes estão documentados.
- [ ] Segurança, testes e quality gates têm responsáveis.
- [ ] A primeira implementação aguarda uma SPEC aprovada.
