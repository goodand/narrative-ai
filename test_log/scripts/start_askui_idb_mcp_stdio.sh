#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
PARENT_REPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd -P)"

if [[ -x "$ROOT_DIR/.venv-idb-mcp/bin/python" ]]; then
  DEFAULT_PYTHON_BIN="$ROOT_DIR/.venv-idb-mcp/bin/python"
elif [[ -x "$PARENT_REPO_ROOT/.venv-idb-mcp/bin/python" ]]; then
  DEFAULT_PYTHON_BIN="$PARENT_REPO_ROOT/.venv-idb-mcp/bin/python"
else
  DEFAULT_PYTHON_BIN=""
fi

PYTHON_BIN="${PYTHON_BIN:-$DEFAULT_PYTHON_BIN}"
IDB_WRAPPER="${IDB_WRAPPER:-$ROOT_DIR/test_log/scripts/idb_wrapper.sh}"
TARGET_WIDTH="${TARGET_WIDTH:-1179}"
TARGET_HEIGHT="${TARGET_HEIGHT:-2556}"
MODE="${1:-stdio}"

if [[ -z "$PYTHON_BIN" || ! -x "$PYTHON_BIN" ]]; then
  echo "python runtime for idb_mcp not found. Set PYTHON_BIN or install into .venv-idb-mcp." >&2
  exit 1
fi

if [[ ! -x "$IDB_WRAPPER" ]]; then
  echo "idb wrapper not found: $IDB_WRAPPER" >&2
  exit 1
fi

export ASKUI_IDB_PATH="$IDB_WRAPPER"

# Keep coordinates in raw simulator pixel space to match PNG screenshots captured by idb.
exec "$PYTHON_BIN" -m idb_mcp start --target-screen-size "$TARGET_WIDTH" "$TARGET_HEIGHT" "$MODE"
