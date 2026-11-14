#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-warm}"
COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
PROFILE="${PROFILE:-full}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="/tmp/nexo-build-${MODE}-$(date +%Y%m%d-%H%M%S).log"

restore_file=""
cleanup() {
  if [[ -n "$restore_file" ]]; then
    git -C "$ROOT" checkout -- "$restore_file"
  fi
}
trap cleanup EXIT

case "$MODE" in
  cold)
    build_args=(build --no-cache --progress=plain)
    ;;
  warm)
    build_args=(build --progress=plain)
    ;;
  code)
    restore_file="apps/api/src/main.ts"
    if ! git -C "$ROOT" diff --quiet -- "$restore_file"; then
      echo "Arquivo $restore_file tem mudanças locais; abortando." >&2
      exit 1
    fi
    printf "\nconsole.log('benchmark: cache bust de código');\n" >> "$ROOT/$restore_file"
    build_args=(build --progress=plain)
    ;;
  deps)
    restore_file="pnpm-lock.yaml"
    if ! git -C "$ROOT" diff --quiet -- "$restore_file"; then
      echo "Arquivo $restore_file tem mudanças locais; abortando." >&2
      exit 1
    fi
    printf '\n# benchmark: cache bust de dependências\n' >> "$ROOT/$restore_file"
    build_args=(build --progress=plain)
    ;;
  *)
    echo "Uso: $0 [cold|warm|code|deps]" >&2
    exit 1
    ;;
esac

{
  echo "mode=$MODE"
  echo "date=$(date -Iseconds)"
  echo "host=$(uname -srm)"
  echo "cpus=$(nproc)"
  free -h || true
  docker version --format 'docker={{.Server.Version}}' || true
  docker compose version || true
} >"$LOG"

start="$(date +%s)"
set +e
(
  cd "$ROOT"
  DOCKER_BUILDKIT=1 docker compose -f "$COMPOSE_FILE" --profile "$PROFILE" \
    "${build_args[@]}"
) >>"$LOG" 2>&1
rc=$?
set -e
end="$(date +%s)"

if [[ $rc -ne 0 ]]; then
  echo "Build falhou (exit=$rc). Log: $LOG" >&2
  exit "$rc"
fi

echo "mode=$MODE elapsed=$((end - start))s log=$LOG"
