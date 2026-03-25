#!/bin/bash
set -euo pipefail

SIM_NAME="${SIM_NAME:-iPhone 17}"

if [[ -n "${UDID:-}" ]]; then
  printf '%s\n' "$UDID"
  exit 0
fi

devices="$(xcrun simctl list devices available)"
found="$(printf '%s\n' "$devices" | sed -nE "s/.*${SIM_NAME} \\(([A-F0-9-]+)\\) \\(Booted\\).*/\\1/p" | head -n 1)"

if [[ -z "$found" ]]; then
  found="$(printf '%s\n' "$devices" | sed -nE "s/.*${SIM_NAME} \\(([A-F0-9-]+)\\) \\(Shutdown\\).*/\\1/p" | head -n 1)"
fi

if [[ -z "$found" ]]; then
  echo "Simulator not found: $SIM_NAME. Set SIM_NAME or UDID to a device available on this machine." >&2
  exit 1
fi

printf '%s\n' "$found"
