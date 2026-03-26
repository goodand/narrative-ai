#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
IDB_WRAPPER="${IDB_WRAPPER:-$ROOT_DIR/test_log/scripts/idb_wrapper.sh}"
SIM_NAME="${SIM_NAME:-iPhone 17}"
UDID="${UDID:-}"
BUNDLE_ID="${BUNDLE_ID:-com.narrativeai.appv}"
RUNS="${RUNS:-5}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-45}"
STAMP="$(date +%Y-%m-%d-%H-%M)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/test_log/${STAMP}_perf-trace-runs}"
SUMMARY_FILE="$OUTPUT_DIR/summary.tsv"

usage() {
  cat <<'EOF'
Usage: run_perf_trace_measurements.sh [--runs N] [--timeout SEC] [--udid UDID] [--sim-name NAME] [--bundle-id ID] [--output-dir DIR]

This script:
1. boots or reuses a simulator,
2. launches the app,
3. auto-approves the iOS Photos prompt when visible,
4. waits for the current `[PERF] launch_to_carousel_ms=...` line,
5. stores run logs, screenshots, and a TSV summary.

Preconditions:
- the app bundle is already installed in the target simulator
- the session is already authenticated far enough that home carousel can appear
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs)
      RUNS="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT_SECONDS="$2"
      shift 2
      ;;
    --udid)
      UDID="$2"
      shift 2
      ;;
    --sim-name)
      SIM_NAME="$2"
      shift 2
      ;;
    --bundle-id)
      BUNDLE_ID="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      SUMMARY_FILE="$OUTPUT_DIR/summary.tsv"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing command: $1" >&2
    exit 1
  }
}

resolve_udid() {
  if [[ -n "$UDID" ]]; then
    echo "$UDID"
    return 0
  fi

  python3 - "$SIM_NAME" <<'PY'
import json
import subprocess
import sys

sim_name = sys.argv[1]
raw = subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "-j"], text=True)
data = json.loads(raw)

booted_match = None
named_match = None
booted_any = None

for runtime_devices in data.get("devices", {}).values():
    for device in runtime_devices:
        if not device.get("isAvailable"):
            continue
        if device.get("state") == "Booted" and booted_any is None:
            booted_any = device["udid"]
        if device.get("name") == sim_name and named_match is None:
            named_match = device["udid"]
        if device.get("name") == sim_name and device.get("state") == "Booted":
            booted_match = device["udid"]

print(booted_match or named_match or booted_any or "")
PY
}

require_cmd xcrun
require_cmd python3

if [[ ! -x "$IDB_WRAPPER" ]]; then
  echo "idb wrapper not found: $IDB_WRAPPER" >&2
  exit 1
fi

UDID="$(resolve_udid)"
if [[ -z "$UDID" ]]; then
  echo "Unable to resolve a simulator UDID. Set UDID or SIM_NAME explicitly." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
printf "run\tstatus\tlaunch_to_carousel_ms\tperf_line\n" > "$SUMMARY_FILE"

boot_and_wait() {
  xcrun simctl boot "$UDID" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "$UDID" -b >/dev/null
}

take_screenshot() {
  local dest="$1"
  "$IDB_WRAPPER" screenshot --udid "$UDID" "$dest" >/dev/null
}

dump_accessibility() {
  "$IDB_WRAPPER" ui describe-all --udid "$UDID"
}

popup_visible() {
  local ax_json="$1"
  grep -qE '전체 접근 허용|Allow Full Access|Allow Access to All Photos' "$ax_json"
}

calc_allow_button_pixel_center() {
  local ax_json="$1"
  local screenshot="$2"

  python3 - "$ax_json" "$screenshot" <<'PY'
import json
import struct
import sys

ax_path, screenshot_path = sys.argv[1], sys.argv[2]
with open(ax_path, "r", encoding="utf-8") as f:
    items = json.load(f)

root = next(
    (
        item
        for item in items
        if item.get("type") == "Application"
        and item.get("frame", {}).get("width")
        and item.get("frame", {}).get("height")
    ),
    None,
)
button = next(
    (
        item
        for item in items
        if item.get("AXLabel") in {
            "전체 접근 허용",
            "Allow Full Access",
            "Allow Access to All Photos",
        }
    ),
    None,
)

if root is None or button is None:
    sys.exit(1)

with open(screenshot_path, "rb") as f:
    header = f.read(24)

if header[:8] != b"\x89PNG\r\n\x1a\n":
    sys.exit(2)

pixel_width, pixel_height = struct.unpack(">II", header[16:24])
frame = button["frame"]
root_frame = root["frame"]

center_x = frame["x"] + frame["width"] / 2
center_y = frame["y"] + frame["height"] / 2
scale_x = pixel_width / root_frame["width"]
scale_y = pixel_height / root_frame["height"]

print(f"{int(round(center_x * scale_x))} {int(round(center_y * scale_y))}")
PY
}

approve_popup_if_needed() {
  local run_index="$1"
  local screenshot="$OUTPUT_DIR/run-${run_index}-prompt.png"
  local ax_json="$OUTPUT_DIR/run-${run_index}-prompt.json"

  take_screenshot "$screenshot"
  dump_accessibility > "$ax_json" || true

  if popup_visible "$ax_json"; then
    local coords
    coords="$(calc_allow_button_pixel_center "$ax_json" "$screenshot")"
    local x y
    read -r x y <<<"$coords"
    "$IDB_WRAPPER" ui tap --udid "$UDID" --duration 0.2 "$x" "$y" >/dev/null
    sleep 2
  fi
}

extract_launch_ms() {
  sed -n 's/.*launch_to_carousel_ms=\([^ ]*\).*/\1/p' <<<"$1"
}

run_once() {
  local run_index="$1"
  local run_log="$OUTPUT_DIR/run-${run_index}.log"

  xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  xcrun simctl launch --console --terminate-running-process "$UDID" "$BUNDLE_ID" >"$run_log" 2>&1 &
  local launch_pid=$!

  sleep 2
  approve_popup_if_needed "$run_index"

  local perf_line=""
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  while (( SECONDS < deadline )); do
    perf_line="$(grep '\[PERF\] launch_to_carousel_ms=' "$run_log" | tail -n 1 || true)"
    if [[ -n "$perf_line" ]]; then
      break
    fi
    sleep 1
  done

  local status="timeout"
  local launch_ms=""

  if [[ -n "$perf_line" ]]; then
    status="ok"
    launch_ms="$(extract_launch_ms "$perf_line")"
  else
    take_screenshot "$OUTPUT_DIR/run-${run_index}-timeout.png" || true
  fi

  printf "%s\t%s\t%s\t%s\n" \
    "$run_index" \
    "$status" \
    "${launch_ms:-}" \
    "${perf_line:-}" >> "$SUMMARY_FILE"

  xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  wait "$launch_pid" >/dev/null 2>&1 || true
}

boot_and_wait

for ((run_index=1; run_index<=RUNS; run_index++)); do
  run_once "$run_index"
done

echo "Wrote logs to: $OUTPUT_DIR"
echo "Summary: $SUMMARY_FILE"
