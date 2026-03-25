#!/bin/bash
set -euo pipefail

tmp_script="$(mktemp /tmp/maestro-install.XXXXXX.sh)"
trap 'rm -f "$tmp_script"' EXIT

curl -fsSL "https://get.maestro.mobile.dev" -o "$tmp_script"
bash "$tmp_script"
