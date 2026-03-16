#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
CONFIG_PATH="${SKM_CONFIG_PATH:-$BACKEND_DIR/skills.yaml}"
LOCK_PATH="${SKM_LOCK_PATH:-$BACKEND_DIR/skills-lock.yaml}"
STORE_PATH="${SKM_STORE_PATH:-$BACKEND_DIR/.skm/store}"

cd "$BACKEND_DIR"

if [ ! -d ".venv" ]; then
  echo "backend/.venv not found. Run 'uv venv' and 'uv sync --group tools' first." >&2
  exit 1
fi

mkdir -p "$STORE_PATH"

args=(
  --config "$CONFIG_PATH"
  --lock "$LOCK_PATH"
  --store "$STORE_PATH"
)

if [ -n "${SKM_AGENTS_DIR:-}" ]; then
  args+=(--agents-dir "$SKM_AGENTS_DIR")
fi

exec uv run --group tools skm "${args[@]}" "$@"
