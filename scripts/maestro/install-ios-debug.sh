#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
WORKSPACE_PATH="${WORKSPACE_PATH:-$ROOT_DIR/ios/App/App.xcworkspace}"
SCHEME="${SCHEME:-App}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-/tmp/narrative-ai-maestro-derived-data}"
BUNDLE_ID="${BUNDLE_ID:-com.narrativeai.appv}"
SIM_NAME="${SIM_NAME:-iPhone 17}"
TARGET_UDID="$("$ROOT_DIR/scripts/maestro/resolve-ios-udid.sh")"
APP_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/App.app"

xcrun simctl boot "$TARGET_UDID" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$TARGET_UDID" -b >/dev/null

xcodebuild \
  -workspace "$WORKSPACE_PATH" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "id=$TARGET_UDID" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  build >/dev/null

xcrun simctl install "$TARGET_UDID" "$APP_PATH" >/dev/null

echo "Installed $BUNDLE_ID on $SIM_NAME ($TARGET_UDID)"
