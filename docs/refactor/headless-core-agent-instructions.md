# RECOCO Headless Core Refactor Agent Instructions

Status: execution handoff draft  
Date: 2026-05-09  
Target repo: `narrative-ai`  
Primary goal: separate UI rendering from business/application logic so future designs can be swapped without rewriting auth, photo, AI, notification, report, account, and result logic.

## 1. Operating Contract

This document is an implementation instruction for another agent. Treat every item below as a required contract unless the current code proves it impossible. If current code and this document conflict, verify the code first, patch this document or the implementation plan, then continue.

Non-goals:

- Do not redesign screens.
- Do not change backend API routes or payloads.
- Do not change the native iOS plugin public methods.
- Do not replace vanilla JS with React/Vue/Svelte.
- Do not remove existing user-visible behavior unless explicitly marked dead code.

Required outcome:

- Add a real internal package at `packages/core`.
- Keep the current DOM UI as the first UI adapter.
- Move application logic behind headless controllers and ports.
- Remove direct business/platform dependencies from UI components.
- Keep `npm run build` passing.
- Keep existing Maestro smoke entrypoint usable: `npm run maestro:test:ios`.

Current known facts:

- Root package is ESM via `"type": "module"`.
- Build command is `npm run build`, which runs `vite build`.
- Current mixed UI/logic files are:
  - `main.js`
  - `src/components/AuthModal.js`
  - `src/components/PermissionModal.js`
  - `src/components/HomeManager.js`
  - `src/components/home/homeImageRuntime.js`
  - `src/components/DropZone.js`
  - `src/components/InputManager.js`
  - `src/components/ResultViewer.js`
  - `src/components/ReportManager.js`
  - `src/components/MyPageManager.js`
  - `src/components/NoticeManager.js`
  - `src/services/Router.js`
- Existing logic/service files that must be wrapped or moved, not deleted blindly:
  - `src/services/PhotoService.js`
  - `src/services/GeminiService.js`
  - `src/services/StatsService.js`
  - `src/services/NotificationService.js`
  - `src/services/ShareService.js`
  - `src/services/supabase.js`
  - `src/processors/ImageProcessor.js`
  - `src/state/StateManager.js`
  - `src/services/photo/dailyCurationRuntime.js`
  - `src/services/photo/detailHydrator.js`
  - `src/services/photo/legacyRankingRuntime.js`
  - `src/services/photo/mutationRuntime.js`

## 2. Target Architecture

Create this package layout:

```text
packages/core/
  package.json
  src/
    index.js
    createRecocoCore.js
    contracts/ports.js
    state/createStore.js
    navigation/createNavigationController.js
    auth/createAuthController.js
    permissions/createPermissionController.js
    notifications/createNotificationController.js
    home/createHomeController.js
    home/createHomeViewModel.js
    home/analyzeCurationReasons.js
    input/createInputController.js
    result/createResultController.js
    result/formatCaption.js
    report/createReportController.js
    report/aggregateReportStats.js
    account/createAccountController.js
    errors/normalizeError.js
```

Create this app adapter layout:

```text
src/adapters/
  createAppPorts.js
  auth/supabaseAuthPort.js
  auth/capacitorAppPort.js
  auth/capacitorBrowserPort.js
  account/accountApiPort.js
  ai/geminiAiPort.js
  clipboard/clipboardPort.js
  image/imageProcessorPort.js
  notifications/capacitorNotificationPort.js
  photos/photoPort.js
  share/sharePort.js
  stats/statsPort.js
  storage/browserStoragePort.js
  time/systemClockPort.js

src/ui/dom/
  createDomApp.js
  domEvents.js
  domRouterAdapter.js
  toastPresenter.js
```

Keep current components in `src/components` during the first refactor pass, but convert them into DOM-only adapters. Do not move files only for aesthetics. File moves are allowed only when they reduce import confusion or when the old name becomes misleading.

Root configuration changes:

- Add `"workspaces": ["packages/*"]` to root `package.json`.
- Add Vite alias in `vite.config.js`:

```js
resolve: {
  alias: {
    '@recoco/core': resolve(rootDir, 'packages/core/src/index.js')
  }
}
```

- Add matching `jsconfig.json` paths:

```json
"baseUrl": ".",
"paths": {
  "@recoco/core": ["packages/core/src/index.js"],
  "@recoco/core/*": ["packages/core/src/*"]
}
```

Do not add new runtime dependencies for this refactor.

`packages/core/package.json` must be:

```json
{
  "name": "@recoco/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.js"
  }
}
```

## 3. Core Public API

`packages/core/src/index.js` must export:

```js
export { createRecocoCore } from './createRecocoCore.js';
```

`createRecocoCore(deps, options = {})` must return:

```js
{
  store,
  navigation,
  auth,
  permissions,
  notifications,
  home,
  input,
  result,
  report,
  account
}
```

Core must not import or reference:

- `document`
- `window`
- `localStorage`
- `sessionStorage`
- `navigator`
- `fetch`
- `supabase`
- `@capacitor/*`
- `RecocolPhotos`
- app DOM components

Core may use plain JavaScript, `Date` only through the injected `clock` port when time affects behavior, and `console` for temporary diagnostics only.

## 4. Port Contracts

Implement JSDoc typedefs in `packages/core/src/contracts/ports.js`. Use these names and methods exactly so app adapters and core controllers remain stable.

```js
/**
 * @typedef {Object} AuthPort
 * @property {(provider: 'google', options: { redirectTo: string, skipBrowserRedirect: boolean }) => Promise<{ url?: string }>} signInWithOAuth
 * @property {(tokens: { access_token: string, refresh_token: string }) => Promise<void>} setSession
 * @property {(code: string) => Promise<void>} exchangeCodeForSession
 * @property {() => Promise<{ user: Object|null, session: Object|null }>} getSession
 * @property {() => Promise<{ user: Object|null }>} getUser
 * @property {(callback: Function) => { unsubscribe?: Function }} onAuthStateChange
 * @property {(options?: Object) => Promise<void>} signOut
 */

/**
 * @typedef {Object} BrowserPort
 * @property {(options: { url: string, presentationStyle?: string }) => Promise<void>} open
 * @property {() => Promise<void>} close
 */

/**
 * @typedef {Object} AppPort
 * @property {() => boolean} isNative
 * @property {() => Promise<{ url?: string }|null>} getLaunchUrl
 * @property {(eventName: 'appUrlOpen'|'appStateChange', callback: Function) => Promise<{ remove?: Function }>|{ remove?: Function }} addListener
 */

/**
 * @typedef {Object} PhotoCurationResult
 * @property {Array<Object>} photos
 * @property {string|null} dayKey
 * @property {number} totalCount
 * @property {boolean} fromCache
 * @property {boolean} needsRefresh
 * @property {boolean} stale
 * @property {boolean} nativeTimeout
 */

/**
 * @typedef {Object} PhotoPort
 * @property {() => Array<Object>} getPhotos
 * @property {(options?: Object) => Promise<PhotoCurationResult>} fetchDailyCuration
 * @property {(options?: Object) => Promise<PhotoCurationResult>} fetchCurationBatch
 * @property {(photos: Array<Object>, options?: Object) => Promise<Array<Object>>} hydrateThumbsForPhotos
 * @property {(index: number) => Promise<Object|null>} loadPhotoDetails
 * @property {(index: number, options?: Object) => Promise<string|null>} getPhotoAsBase64
 * @property {(index: number, options?: Object) => Promise<File|null>} getPhotoAsFile
 * @property {(assetId: string) => Promise<string|null>} getPhotoAsAnalysisBase64
 * @property {(assetId: string) => Promise<any>|undefined} getAnalysis
 * @property {(assetId: string, promise: Promise<any>) => void} registerAnalysis
 * @property {(index: number) => Promise<boolean>} deletePhoto
 * @property {(payload: { assetId: string, action: string, dayKey?: string }) => Promise<void>} recordCurationAction
 * @property {() => Promise<{ status: string, authorized: boolean }>} getPhotoLibraryPermissionStatus
 * @property {() => Promise<{ status: string, authorized: boolean }>} requestPhotoLibraryPermission
 */

/**
 * @typedef {Object} AiPort
 * @property {(payload: Object) => Promise<Object>} generateDeleteRecommendation
 * @property {(payload: Object) => Promise<{ recommendations: Array<Object> }>} generateBatchDeleteRecommendations
 * @property {(payload: Object) => Promise<Object>} generateStory
 * @property {(payload: Object) => Promise<Array<Object>>} generateSynonyms
 */

/**
 * @typedef {Object} NotificationPort
 * @property {() => Promise<boolean>} requestPermission
 * @property {() => Promise<boolean>} scheduleDailyNotification
 * @property {() => Promise<boolean|void>} cancelAll
 * @property {(navigation: Object) => Promise<void>|void} setupActionListener
 */

/**
 * @typedef {Object} AccountPort
 * @property {(payload: { user_id: string, reason: string }) => Promise<void>} deleteAccount
 */

/**
 * @typedef {Object} StatsPort
 * @property {(userId: string) => Promise<Object|null>} getUserStats
 * @property {(userId: string, sinceIso: string) => Promise<Array<{ cleared_at: string }>>} getDetoxLogs
 * @property {(payload: Object) => Promise<void>} logCurationAction
 */

/**
 * @typedef {Object} StoragePort
 * @property {(key: string) => string|null} getItem
 * @property {(key: string, value: string) => void} setItem
 * @property {() => void} clearLocal
 * @property {() => void} clearSession
 */

/**
 * @typedef {Object} ClipboardPort
 * @property {(text: string) => Promise<void>} writeText
 */

/**
 * @typedef {Object} SharePort
 * @property {(payload: { imageBase64: string, caption: string }) => Promise<void>} shareWithImage
 * @property {(caption: string) => Promise<void>} shareCaption
 */

/**
 * @typedef {Object} ImageProcessorPort
 * @property {(file: File) => Promise<{ base64: string, dataUrl: string, width: number, height: number, metadata: Object }>} process
 */

/**
 * @typedef {Object} ClockPort
 * @property {() => Date} now
 */
```

`createAppPorts.js` must construct these ports from existing implementation files. It is the only app module allowed to import platform services directly.

## 5. Store Contract

Replace direct UI usage of `src/state/StateManager.js` with `core.store`.

Core store methods:

```js
store.getState()
store.get(key)
store.set(key, value)
store.patch(partial)
store.subscribe(callback)
store.resetTransient()
```

Required initial state:

```js
{
  auth: { user: null, session: null, status: 'unknown', error: null },
  permissions: { photo: { authorized: false, status: null, reason: null, checking: false, requesting: false } },
  notifications: { enabled: false, status: 'idle', error: null },
  navigation: { currentView: 'home', history: ['home'] },
  home: {
    status: 'idle',
    error: null,
    photos: [],
    currentIndex: 0,
    headerMessage: '기기에서 찾아낸 비우기 좋은 기록들입니다.',
    nextBatch: null,
    isRefilling: false
  },
  input: { base64: null, dataUrl: null, metadata: {}, meaning: '', tags: '' },
  result: { currentResult: null, editMode: false, copyStatus: 'idle', shareStatus: 'idle' },
  report: { status: 'idle', error: null, stats: null },
  account: { profile: null, status: 'idle', withdrawal: { reason: 'not_specified', confirmed: false } }
}
```

Do not keep `window.__recocoCurrentUser` as source of truth after the refactor. During migration, it may remain as a compatibility mirror only if `core.store.auth.user` is the canonical value.

## 6. Controller Responsibilities

### Auth controller

Move from `main.js` and `src/components/AuthModal.js`:

- OAuth start.
- Native redirect URL decision.
- Browser open/close.
- Deep link parsing.
- `setSession` and `exchangeCodeForSession`.
- launch URL handling.
- auth-state subscription.

Required methods:

```js
auth.init()
auth.startGoogleOAuth()
auth.handleUrl(url)
auth.restoreSession()
auth.signOut(options)
auth.getViewModel()
```

Use redirect URL exactly as current behavior:

- native: `com.narrativeai.appv://login-callback`
- web: current origin supplied by app adapter, not accessed by core directly

### Permission controller

Move from `src/components/PermissionModal.js`:

- Web/non-native bypass.
- photo status check.
- 2500 ms timeout rule.
- request permission.
- skip handling.

Required methods:

```js
permissions.checkPhotoPermission()
permissions.requestPhotoPermission()
permissions.skipPhotoPermission()
permissions.getViewModel()
```

### Home controller

Move from `src/components/HomeManager.js`, `src/components/home/homeLoadRuntime.js`, `src/components/home/homeRefillRuntime.js`, `src/components/home/homeDeleteRuntime.js`, and the non-DOM parts of `src/components/home/homeImageRuntime.js`:

- daily curation load.
- daily curation listener reaction.
- current photo metadata.
- current image as file/base64.
- previous/next current index.
- delete/precious consume.
- next batch prefetch/refill.
- common curation reason mapping.
- batch and individual AI analysis registry coordination.

Required methods:

```js
home.loadDailyCuration(options)
home.getCurrentPhotoMeta()
home.getCurrentImageAsFile()
home.getCurrentPhotoBase64()
home.movePrevious()
home.moveNext()
home.markPrecious()
home.deleteCurrent()
home.consumePhoto(index)
home.triggerBackgroundRefill()
home.switchToNextBatch()
home.ensureVisibleImages()
home.analyzeVisiblePhotos()
home.getViewModel()
```

`home.getViewModel()` must return enough data for any UI design:

```js
{
  status,
  error,
  profileName,
  headerMessage,
  photos,
  currentIndex,
  visiblePhotos,
  currentPhoto,
  progress: { clearedCount, targetCount: 7, percent },
  meta: { date, location, contextMessage },
  controls: { canPrevious, canNext, canDelete, canMarkPrecious }
}
```

DOM-only logic must remain outside core:

- `innerHTML`
- `scrollIntoView`
- carousel scroll listener
- `backgroundImage`
- `animate-pulse`
- element IDs such as `img-curr`, `meta-context`, `curation-header-desc`

### Input controller

Move from `src/components/InputManager.js` and `src/components/DropZone.js`:

- image processing orchestration.
- base64/dataUrl/metadata state writes.
- meaning/tags state writes.
- reset behavior.

Required methods:

```js
input.processFile(file)
input.setTextFields({ meaning, tags })
input.setPreviewImage({ dataUrl, metadata })
input.reset()
input.getInputData()
input.getViewModel()
```

The DOM DropZone must only handle click/drag/drop/preview rendering and call `input.processFile(file)`.

### Result controller

Move from `main.js` and `src/components/ResultViewer.js`:

- keyword replacement.
- caption save.
- caption formatting/highlight segmentation.
- copy/share orchestration.
- edit mode state.

Required methods:

```js
result.setResult(result)
result.replaceKeyword({ originalWord, suggestion })
result.saveCaption(text)
result.enterEditMode()
result.exitEditMode(text)
result.copyCaption()
result.shareCaption()
result.loadSynonyms(word)
result.getFormattedCaption()
result.getViewModel()
```

`formatCaption.js` must return structured segments, not HTML:

```js
[
  { type: 'text', text: '...' },
  { type: 'keyword', text: '...', word: '...' }
]
```

The DOM ResultViewer is responsible for converting segments to spans.

### Report controller

Move from `src/components/ReportManager.js`:

- Supabase stats load through `StatsPort`.
- 14-day window.
- Monday-start week grouping.
- weekly change calculation.
- daily graph data calculation.
- default stats fallback.

Required methods:

```js
report.load()
report.getViewModel()
```

Extract pure aggregation to `packages/core/src/report/aggregateReportStats.js`.

### Account controller

Move from `src/components/MyPageManager.js`:

- user hydrate.
- logout.
- withdrawal reason state.
- withdrawal confirm state.
- delete-account API call through `AccountPort`.
- sign out after delete.
- local/session storage cleanup through `StoragePort`.

Required methods:

```js
account.hydrateProfile()
account.logout()
account.setWithdrawalReason(reason)
account.setWithdrawalConfirmed(confirmed)
account.deleteAccount()
account.getViewModel()
```

### Notification controller

Move from `src/components/NoticeManager.js` and app foreground handling in `main.js`:

- persistent `notificationEnabled` key.
- request permission.
- schedule/cancel.
- foreground reschedule.
- action listener setup.

Required methods:

```js
notifications.init(navigation)
notifications.loadSetting()
notifications.setEnabled(enabled)
notifications.handleAppStateChange({ isActive })
notifications.getViewModel()
```

Keep storage key exactly: `notificationEnabled`.

### Navigation controller

Move route state from `src/services/Router.js`, but keep DOM display manipulation in `domRouterAdapter.js`.

`domRouterAdapter.js` must own the following DOM responsibilities (current `Router.js` parity surface):

- Hide all view containers ending with `View` and show only the target view.
- Toggle `#bottom-action-bar` first child visibility based on the `input` view.
- Toggle the main `<header>` visibility (hidden on `home`/`report`/`mypage`/`notice`).
- Update `#header-title` text on `input` and `result` views.
- Update tab active state on `#nav-home`/`#nav-report`/`#nav-mypage` (text color + icon `FILL` variation).
- Trigger the target view's manager `render()` (catching async render rejections).
- Reset window scroll to `(0, 0)` on every navigation.

Core `navigation` controller must not touch any of the above DOM artifacts directly.

Required methods:

```js
navigation.navigate(viewName, options)
navigation.goBack()
navigation.getViewModel()
navigation.subscribe(callback)
```

Allowed view names:

```js
home, input, result, report, mypage, notice
```

### Error normalization helper

`packages/core/src/errors/normalizeError.js` is a pure helper used by every controller before assigning errors to `store.set('<domain>.error', ...)` so that view models render a consistent shape across UIs.

Required signature:

```js
normalizeError(error, context = '') => {
  message: string,           // user-facing message; falls back to error.message or String(error)
  context: string,           // controller domain ('auth', 'home', 'report', etc.) or ''
  code: string|null,         // platform/service-specific code if present (e.g. supabase.error.code)
  cause: Error|string|null   // original error preserved for logging only
}
```

Rules:

- `normalizeError` must not call `console`, must not call `showToast`, and must not throw.
- Controllers store the normalized object on the corresponding `<domain>.error` slice and never the raw error.
- DOM adapters (`toastPresenter`, etc.) decide whether to surface `message` to the user.

## 7. Component Conversion Rules

After refactor, these imports must be absent from `src/components/**/*.js`:

```text
../services/supabase.js
@capacitor/core
@capacitor/browser
../plugins/RecocolPhotos.ts
../services/PhotoService.js
../services/GeminiService.js
../services/NotificationService.js
../services/StatsService.js
../state/StateManager.js
../processors/ImageProcessor.js
```

Permitted component dependencies:

- plain DOM APIs.
- callbacks/actions passed from `createDomApp.js`.
- view models passed from core.
- `showToast` only through `src/ui/dom/toastPresenter.js`; do not call `showToast` from core.

Conversion map:

| Current file | Required conversion |
| --- | --- |
| `main.js` | Import style, create ports, create core, call `createDomApp({ core, rootEls })`, call `core.auth.init()` and `core.notifications.init(core.navigation)`. No direct Supabase or Capacitor imports. |
| `src/components/AuthModal.js` | Remove Supabase/Browser/Capacitor. Render only. Google/signup buttons call injected `onGoogleLogin`. |
| `src/components/PermissionModal.js` | Remove Capacitor and RecocolPhotos. Render only. `checkAndOpen` delegates to `core.permissions.checkPhotoPermission`; allow button delegates to `requestPhotoPermission`; skip delegates to `skipPhotoPermission`. |
| `src/components/HomeManager.js` | Remove Supabase and PhotoService. Render `home.getViewModel()`. Buttons call `home.markPrecious`, `home.deleteCurrent`, `home.movePrevious`, `home.moveNext`, `home.loadDailyCuration`. |
| `src/components/home/homeImageRuntime.js` | Split into core analysis and DOM renderer. Core gets `analyzeCurationReasons.js`; DOM keeps carousel and element updates. |
| `src/components/DropZone.js` | Remove ImageProcessor. Emit selected file to injected `onFileSelected(file)`. |
| `src/components/InputManager.js` | Remove store. Use `core.input` actions and view model. |
| `src/components/ResultViewer.js` | Use structured caption segments. Clipboard/share/save/keyword replacement call injected actions. |
| `src/components/ReportManager.js` | Remove Supabase. Render `core.report.getViewModel()` and call `core.report.load()`. |
| `src/components/MyPageManager.js` | Remove Supabase/fetch/localStorage/sessionStorage. Use `core.account` and `core.notifications` actions. |
| `src/components/NoticeManager.js` | Remove NotificationService/localStorage. Render `core.notifications.getViewModel()` and call `setEnabled`. |
| `src/services/Router.js` | Replace with core route state plus DOM adapter. Keep old file only as compatibility wrapper if necessary. |

## 8. Adapter Implementation Rules

`src/adapters/createAppPorts.js` must be the single place where concrete platform modules are assembled.

Required concrete mappings:

- `authPort` wraps `src/services/supabase.js`.
- `appPort` wraps `@capacitor/app` and `Capacitor.isNativePlatform()`.
- `browserPort` wraps `@capacitor/browser`.
- `photoPort` wraps `src/services/PhotoService.js` and `src/plugins/RecocolPhotos.ts`.
- `aiPort` wraps `src/services/GeminiService.js`.
- `notificationPort` wraps `src/services/NotificationService.js`.
- `sharePort` wraps `src/services/ShareService.js`.
- `clipboardPort` wraps `@capacitor/clipboard` (native) and `navigator.clipboard.writeText` (web), dispatched by `Capacitor.isNativePlatform()`. The DOM `execCommand` fallback is owned by the adapter (slice-5 decision #7C, `docs/refactor/slice-5-component-mapping.md`): on web, if `navigator.clipboard.writeText` rejects or is unavailable, the adapter falls back to a hidden textarea + `document.execCommand('copy')`. `ResultViewer.js` calls `core.result.copyCaption()` exclusively and stays DOM-only.
- `imageProcessorPort` wraps `src/processors/ImageProcessor.js`.
- `storagePort` wraps `localStorage` and `sessionStorage`.
- `accountPort` posts to `${API_CONFIG.BASE_URL}/api/v1/delete-account`.
- `statsPort` wraps Supabase `user_stats`, `detox_logs`, and existing `StatsService` behavior.
- `clock` is the assembled handle for `ClockPort` and returns `new Date()`. The shorter key is an intentional alias of the typedef name `ClockPort`; adapters and consumers refer to it as `deps.clock`.

No UI component may import an adapter directly. Components receive action callbacks from `createDomApp.js`.

## 9. Execution Sequence

Work in this order. Do not skip the boundary checks between steps.

1. Add `packages/core` package and root alias/workspace config.
2. Add core store and contracts.
3. Add app adapters with behavior equivalent to existing services.
4. Add controllers in core with no DOM/platform imports.
5. Add `src/ui/dom/createDomApp.js` and route all existing component construction through it.
6. Convert `main.js` into a thin bootstrap.
7. Convert Auth and Permission components.
8. Convert Notification and Account components.
9. Convert Report component and aggregation.
10. Convert Input, DropZone, and Result components.
11. Convert Home and split `homeImageRuntime.js`.
12. Remove or quarantine `src/utils/temp_handleUrl.js` only after `auth.handleUrl` covers launch URL and `appUrlOpen`.
13. Run validation loop until all checks pass.

## 10. Validation Loop

After each major conversion step, run:

```bash
npm run build
git diff --check
rg -n "supabase|@capacitor/core|@capacitor/browser|RecocolPhotos|PhotoService|GeminiService|NotificationService|StatsService|StateManager|ImageProcessor" src/components main.js
rg -n "document|window|localStorage|sessionStorage|navigator|fetch\\(|supabase|@capacitor|RecocolPhotos" packages/core/src
```

Expected results:

- `npm run build` exits 0.
- `git diff --check` exits 0.
- The `src/components main.js` scan has no matches except comments that describe removed dependencies. Prefer no matches at all.
- The `packages/core/src` scan has no matches except JSDoc text in `contracts/ports.js`. If JSDoc causes noise, narrow the scan to runtime files:

```bash
rg -n "document|window|localStorage|sessionStorage|navigator|fetch\\(|supabase|@capacitor|RecocolPhotos" packages/core/src -g '!contracts/ports.js'
```

If a check fails:

1. Identify whether the failure is code, test, or this instruction doc.
2. Patch the smallest incorrect area.
3. Re-run the same check.
4. Repeat until clean.

Optional iOS smoke after build passes:

```bash
npm run maestro:test:ios
```

## 11. Acceptance Criteria

The refactor is complete only when all conditions are true:

- `packages/core` exists and exports `createRecocoCore`.
- Core has no runtime DOM/platform imports.
- Current UI still renders through the existing `index.html` shell.
- Current UI can be replaced by another UI consuming only core view models/actions and app ports.
- `main.js` is a bootstrap, not an application logic owner.
- Mixed files from the audit no longer own business/platform logic.
- `src/utils/temp_handleUrl.js` is removed or proven unused and documented.
- `npm run build` passes.
- Boundary scans pass.

Manual smoke scenarios:

- cold boot without session opens onboarding/auth.
- Google OAuth starts and native browser opens on iOS.
- launch URL and `appUrlOpen` restore session.
- signed-in boot navigates to home.
- photo permission allow/deny/skip all unblock correctly.
- daily curation loads, empty/error/loading states render.
- previous/next carousel navigation still works.
- precious action consumes current photo.
- delete action records/delete/consumes current photo.
- next batch refill works when photos are exhausted.
- report loads default and Supabase-backed stats.
- mypage profile hydrate/logout works.
- withdrawal calls delete-account and clears storage.
- notice toggle requests permission, schedules, cancels, and persists `notificationEnabled`.
- input image processing updates preview and core state.
- result caption edit, keyword replacement, copy, and share work.

## 12. Patch Discipline for the Implementing Agent

- Preserve existing user changes. Check `git status --short` before editing and before final response.
- Do not run destructive git commands.
- Use `apply_patch` for manual edits.
- Keep commits or PR creation out of scope unless explicitly requested.
- Prefer moving code into core with behavior-preserving wrappers before deleting old code.
- If a behavior is unclear, preserve current behavior and add a TODO in the implementation notes, not in runtime UI.
- Do not introduce new formatting-only diffs.

## 13. Known Risk Areas

- `src/components/home/homeImageRuntime.js` currently mixes AI analysis and DOM updates. Split it last if earlier controllers depend on existing home behavior.
- `src/services/ShareService.js` contains a DOM download helper. Keep that helper in an adapter or UI utility, not core.
- `src/utils/errorHandler.js` creates toast DOM. Core must return errors/status; DOM adapter decides how to toast.
- `src/state/StateManager.js` has a no-op `_notifyListeners` placeholder. Do not rely on it for core subscriptions.
- `src/services/supabase.js` stores the singleton on `window.supabaseInstance`. Keep this inside the adapter layer only.
- `src/utils/temp_handleUrl.js` references auth/deep-link dependencies without imports and must not survive as an active runtime path.
- `src/services/photo/legacyRankingRuntime.js` and `PhotoService.fetchAndRankPhotos` are intentionally NOT exposed through `PhotoPort`. They remain internal/deprecated; current curation flow uses `fetchDailyCuration` only. Do not widen `PhotoPort` for legacy ranking.
- `src/utils/errorHandler.handleError` creates DOM toasts as a side effect. As a temporary compatibility rule for slices 3–5, adapters MAY preserve the legacy toast behavior of services that already call `handleError` (e.g., `StatsService` on RPC failure). Controllers MUST NOT raise additional toasts for the same domain error; instead they normalize via `errors/normalizeError.js` and let UI decide via `toastPresenter`. This rule is replaced by full toast-suppression in adapters once each service is split.
