#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
FLOW_PATH="${MAESTRO_FLOW_PATH:-flows/ios/onboarding-auth-smoke.yaml}"
RESULTS_DIR="$ROOT_DIR/build/maestro-results"
TARGET_UDID="$("$ROOT_DIR/scripts/maestro/resolve-ios-udid.sh")"

if [[ "${INSTALL_APP:-1}" == "1" ]]; then
  UDID="$TARGET_UDID" "$ROOT_DIR/scripts/maestro/install-ios-debug.sh"
fi

mkdir -p "$RESULTS_DIR"

cd "$ROOT_DIR/.maestro"
"$ROOT_DIR/scripts/maestro/maestro.sh" \
  --device "$TARGET_UDID" \
  test \
  --config config.yaml \
  --test-output-dir ../build/maestro-results \
  --debug-output ../build/maestro-results \
  --format junit \
  --output ../build/maestro-results/report.xml \
  "$FLOW_PATH" \
  "$@"
