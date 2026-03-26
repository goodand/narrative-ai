#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
PARENT_REPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd -P)"

if [[ -x "$ROOT_DIR/.venv-idb-mcp/bin/idb" ]]; then
  DEFAULT_IDB_BIN="$ROOT_DIR/.venv-idb-mcp/bin/idb"
elif [[ -x "$PARENT_REPO_ROOT/.venv-idb-mcp/bin/idb" ]]; then
  DEFAULT_IDB_BIN="$PARENT_REPO_ROOT/.venv-idb-mcp/bin/idb"
else
  DEFAULT_IDB_BIN=""
fi

IDB_BIN="${IDB_BIN:-$DEFAULT_IDB_BIN}"
COMPANION_PATH="${COMPANION_PATH:-/tmp/idb-companion-manual/idb-companion.universal/bin/idb_companion}"
DEVELOPER_DIR="${DEVELOPER_DIR:-$(xcode-select -p 2>/dev/null || true)}"

if [[ -z "$IDB_BIN" || ! -x "$IDB_BIN" ]]; then
  echo "idb client not found. Set IDB_BIN or install into .venv-idb-mcp/bin/idb." >&2
  exit 1
fi

if [[ ! -x "$COMPANION_PATH" ]]; then
  echo "idb companion not found: $COMPANION_PATH" >&2
  echo "Set COMPANION_PATH to a valid idb_companion binary." >&2
  exit 1
fi

if [[ -n "$DEVELOPER_DIR" ]]; then
  export DEVELOPER_DIR
fi

# Prefer an explicit companion binary so local Xcode/CLT drift does not break simulator control.
exec "$IDB_BIN" --companion-path "$COMPANION_PATH" "$@"
