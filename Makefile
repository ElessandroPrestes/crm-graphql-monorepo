SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE ?= docker compose
COMPOSE_FILE ?= infra/docker-compose.yml
PROFILE ?= full
SERVICE ?=
MODE ?= warm
CONFIRM ?=

export DOCKER_BUILDKIT ?= 1
export BUILDKIT_PROGRESS ?= auto

.PHONY: help doctor config build build-api build-worker build-web up up-infra start down stop restart ps health logs images benchmark cache cache-prune clean lint typecheck test format format-check e2e sbom db-migrate db-seed db-deploy shell-api shell-worker

help: ## Mostra os comandos disponíveis
	@awk 'BEGIN {FS = ":.*##"; printf "\nUso: make <alvo>\n\n"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

doctor: ## Verifica Docker, Compose, Node, pnpm e espaço em disco
	@command -v docker >/dev/null || (echo "docker ausente" >&2; exit 1)
	@command -v node >/dev/null || (echo "node ausente" >&2; exit 1)
	@command -v pnpm >/dev/null || (echo "pnpm ausente" >&2; exit 1)
	@docker version --format 'docker={{.Server.Version}}'
	@docker compose version
	@node --version
	@pnpm --version
	@df -h . | tail -1

config: ## Valida o arquivo Compose
	$(COMPOSE) -f $(COMPOSE_FILE) config --quiet

build: ## Constrói as imagens do perfil (SERVICE opcional)
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) build $(SERVICE)

build-api: ## Constrói somente a imagem da API
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) build api

build-worker: ## Constrói somente a imagem do worker
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) build worker

build-web: ## Constrói somente a imagem do web
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) build web

up: ## Constrói e sobe a stack do perfil aguardando health
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) up -d --build --wait

up-infra: ## Sobe somente Postgres, Redis e RabbitMQ
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --wait postgres redis rabbitmq

start: ## Sobe a stack sem reconstruir imagens
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) up -d --wait

down: ## Para e remove containers (preserva volumes)
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) down --remove-orphans

stop: ## Para os containers sem removê-los
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) stop

restart: ## Reinicia os containers
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) restart

ps: ## Lista os containers do projeto
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) ps

health: ## Mostra o estado de saúde dos containers do projeto
	@ids="$$($(COMPOSE) -f $(COMPOSE_FILE) ps -q)"; \
	if [ -z "$$ids" ]; then echo "Nenhum container do projeto em execução."; exit 0; fi; \
	docker inspect --format '{{.Name}} {{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $$ids

logs: ## Acompanha logs (SERVICE=api|worker|web opcional)
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) logs -f --tail=100 $(SERVICE)

images: ## Lista as imagens do projeto
	@docker images --filter reference='nexo-crm-*' --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}'

benchmark: ## Mede o build (MODE=cold|warm|code|deps)
	./scripts/benchmark-docker-build.sh $(MODE)

cache: ## Mostra o uso do cache do builder
	docker buildx du

cache-prune: ## Remove o cache do builder (exige CONFIRM=1)
	@if [ "$(CONFIRM)" != "1" ]; then echo "Use: CONFIRM=1 make cache-prune" >&2; exit 1; fi
	docker buildx prune -f

clean: ## Remove containers e imagens do projeto (preserva volumes)
	$(COMPOSE) -f $(COMPOSE_FILE) --profile $(PROFILE) down --remove-orphans
	-@docker image rm -f nexo-crm-api nexo-crm-worker nexo-crm-web 2>/dev/null || true

lint: ## Executa o lint
	pnpm lint

typecheck: ## Executa a checagem de tipos
	pnpm typecheck

test: ## Executa os testes unitários
	pnpm test

format: ## Formata o repositório
	pnpm format

format-check: ## Verifica a formatação
	pnpm format:check

e2e: ## Executa a suíte E2E e acessibilidade
	pnpm test:e2e

sbom: ## Gera o SBOM CycloneDX
	pnpm run sbom

db-migrate: ## Aplica migrations em desenvolvimento
	pnpm --filter @nexo/api db:migrate

db-seed: ## Popula o banco com dados fictícios
	pnpm --filter @nexo/api db:seed

db-deploy: ## Aplica migrations pendentes (produção)
	pnpm --filter @nexo/api db:deploy

shell-api: ## Abre um shell no container da API
	$(COMPOSE) -f $(COMPOSE_FILE) exec api sh

shell-worker: ## Abre um shell no container do worker
	$(COMPOSE) -f $(COMPOSE_FILE) exec worker sh
