# Repeated Task: Capacitor Web Degradation Enforcement

## Context
Running a Capacitor cross-platform app (iOS Native + Web) locally in the browser (`npm run dev`) frequently hits errors when executing Native Plugins (`@capacitor/camera`, `@capacitor/local-notifications`, etc.).

## Repeated Action
Whenever implementing or refactoring UI components that call native device capabilities, the agent must defensively wrap the logic using an environment check. We had to inject skipping patterns in `PermissionModal.js` and `AuthModal.js`.

## Recommended Skill / Pattern
Always import `Capacitor` from `@capacitor/core` and enforce early returns or fallback behaviors:
```javascript
import { Capacitor } from '@capacitor/core';

async function callNativeFeature() {
    if (!Capacitor.isNativePlatform()) {
        console.log('Skipping native feature on web');
        return; // or return fallback data
    }
    // Native plugin call
}
```
