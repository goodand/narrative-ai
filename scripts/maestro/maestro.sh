#!/bin/bash
set -euo pipefail

export MAESTRO_CLI_NO_ANALYTICS="${MAESTRO_CLI_NO_ANALYTICS:-1}"

if command -v maestro >/dev/null 2>&1; then
  exec "$(command -v maestro)" "$@"
fi

for candidate in \
  "$HOME/.maestro/bin/maestro" \
  "$HOME/.local/bin/maestro" \
  "/opt/homebrew/bin/maestro" \
  "/usr/local/bin/maestro"; do
  if [[ -x "$candidate" ]]; then
    exec "$candidate" "$@"
  fi
done

echo "Maestro CLI not found. Run: npm run maestro:install" >&2
exit 1
