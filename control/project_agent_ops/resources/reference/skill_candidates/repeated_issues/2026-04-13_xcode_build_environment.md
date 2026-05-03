# Repeated Issue: Xcode Build Environment Blockers

## Issue Description
When building the Capacitor iOS app from the terminal (`npx cap run ios` or `xcodebuild`), two distinct environment issues repeatedly block the build pipeline.

### 1. SDK / Simulator Runtime Version Mismatch
`xcodebuild` fails with `Unable to find a destination matching the provided destination specifier` and reports `Ineligible destinations`. This happens when the Xcode SDK version (e.g. 26.4) is newer than the installed simulator runtime (e.g. 26.3.1).

**Symptoms:**
```
xcodebuild: error: Unable to find a destination matching the provided destination specifier:
    { id:890CC53F-... }
Ineligible destinations for the "App" scheme:
    { platform:iOS, ..., error:iOS 26.4 is not installed. }
```

**Resolution:**
```bash
# Check current state
xcodebuild -version          # SDK version
xcrun simctl list runtimes   # Installed runtimes

# Download matching runtime
xcodebuild -downloadPlatform iOS
```

After download, new simulators matching the SDK version are auto-created. Use `xcrun simctl list devices available | grep iPhone` to find the new UDIDs.

### 2. Korean Path UTF-8 Encoding Error
`pod install` (called internally by `npx cap sync ios`) crashes with `Encoding::CompatibilityError: Unicode Normalization not appropriate for ASCII-8BIT` when the project path contains Korean characters.

**Resolution:**
```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
```
This must be set before any command that triggers CocoaPods.

## Diagnostic Checklist
When `xcodebuild` or `cap run ios` fails, check in this order:
1. `xcodebuild -version` — note the SDK version
2. `xcrun simctl list runtimes | grep iOS` — confirm runtime matches SDK
3. `echo $LANG` — must be `en_US.UTF-8`, not empty
4. `xcode-select -p` — must point to the correct Xcode installation
