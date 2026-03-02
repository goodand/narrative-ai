#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +"%Y-%m-%d_%H%M")"
TS_ISO="$(date +"%Y-%m-%dT%H:%M:%S%z")"
TARGET="$ROOT_DIR/latest_${STAMP}.md"
INDEX_FILE="$ROOT_DIR/LATEST_INDEX.json"

SOURCE="${1:-}"

if [[ -z "$SOURCE" ]]; then
  if ls "$ROOT_DIR"/latest_*.md >/dev/null 2>&1; then
    SOURCE="$(ls -t "$ROOT_DIR"/latest_*.md | head -1)"
  elif [[ -f "$ROOT_DIR/LATEST.md" ]]; then
    SOURCE="$ROOT_DIR/LATEST.md"
  else
    echo "No source file found. Pass a source markdown file path." >&2
    exit 1
  fi
fi

if [[ ! -f "$SOURCE" ]]; then
  echo "Source file not found: $SOURCE" >&2
  exit 1
fi

{
  echo "---"
  echo "updated_at: \"$TS_ISO\""
  echo "minute_key: \"$STAMP\""
  echo "source_file: \"$(basename "$SOURCE")\""
  echo "---"
  echo
  cat "$SOURCE"
} > "$TARGET"

cat > "$INDEX_FILE" <<EOF
{
  "updated_at": "$TS_ISO",
  "minute_key": "$STAMP",
  "latest_file": "$(basename "$TARGET")"
}
EOF

echo "Created: $TARGET"
echo "Updated: $INDEX_FILE"
