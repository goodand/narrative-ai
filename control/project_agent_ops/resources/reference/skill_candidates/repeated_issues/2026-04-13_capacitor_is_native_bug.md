# Repeated Issue: Capacitor window Object Detection Bug on Web

## Issue Description
When checking for a native Capacitor environment, developers incorrectly used `window.Capacitor !== undefined` (or similar object existence checks). This fails because Vite/Rollup bundles `@capacitor/core` and injects `window.Capacitor` even in the standard web browser environment.

## Symptoms & Impact
- **Authentication**: `supabase.auth.signInWithOAuth` tries to redirect to the deep link (`com.narrativeai.appv://login-callback`) instead of `window.location.origin`, causing the browser to fail the OAuth callback.
- **Modals/UI Flow**: Flow controllers (like `PermissionModal`) will call native device libraries (like iOS photo permissions) on the browser, either crashing the UI or entering a silent wait state.

## Resolution
Replace all existence checks with the official runtime check:
```javascript
import { Capacitor } from '@capacitor/core';
const isNative = Capacitor.isNativePlatform();
```
