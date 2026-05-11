# Slice 2 Adapter Mapping

Generated from read-only source inspection for Slice 2.

Repository root:
`/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai`

Reference contracts:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:12-111`
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:197-296`
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:632-649`

Cross-check result: `ports.js` and instruction doc section 4 are in lockstep for the 13 port typedefs. Instruction doc section 8 matches the required concrete adapter directions.

Decision log for surfaced mismatches:

| # | Decision |
| --- | --- |
| 1 | `PhotoPort.fetchDailyCuration` and `fetchCurationBatch` return `PhotoCurationResult`, matching the source object shape `{ photos, dayKey, totalCount, fromCache, needsRefresh, stale, nativeTimeout }`. |
| 2 | `AuthPort` adapters use one Supabase unwrap helper: throw `error`, return `data`, then method-specific projection where the port expects a narrower result. |
| 3 | `AiPort.generateStory(payload)` unpacks `payload.imageData` and `payload.context` before calling `GeminiService.generateStory(imageData, context)`. |
| 4 | `AiPort.generateSynonyms(payload)` maps to `GeminiService.getSynonyms(payload.keywords, payload.language)`. |
| 5 | `ClipboardPort.writeText(text)` dispatches native `Clipboard.write({ string: text })` vs web `navigator.clipboard.writeText(text)` inside the adapter; ResultViewer's DOM fallback remains outside the port. |
| 6 | `NotificationPort.setupActionListener(navigation)` accepts duck-typed `{ navigate(name): void }`; Slice 2 passes the existing Router instance. |
| 7 | `AccountPort.deleteAccount(payload)` wraps only the backend POST; signout and storage clear remain controller-slice responsibilities. |
| 8 | Adapter layout adds `clipboard/clipboardPort.js` and `stats/statsPort.js` directories that the original instruction §2 layout omitted. §4 typedefs and §8 mapping both require these ports; instruction §2 / §8 were patched in lockstep with this decision. See `docs/refactor/instruction-doc-consistency-audit.md:13-37` for the audit trail. |

## 1. AuthPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/supabase.js:1-21` - Supabase singleton creation and export.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:72-110` - OAuth callback URL handling, session token/code exchange.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:112-114` - app URL listener wiring for auth callback.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:310-324` - auth state listener and current-user global update.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:339-343` - launch URL and initial session read.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:7-61` - Google OAuth sign-in entrypoint.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:41-45` - user hydration.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:144-149` - logout.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:303-320` - withdrawal user lookup and global signout.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `signInWithOAuth(provider, options)` | `supabase.auth.signInWithOAuth({ provider, options })` | No - Supabase takes one object. | No - source returns `{ data, error }`, port wants `{ url? }`. | Yes, pack args, throw `error`, return `data`. |
| `setSession(tokens)` | `supabase.auth.setSession(tokens)` | Yes. | No - source returns `{ data, error }`, port wants `void`. | Yes, throw `error`, return void. |
| `exchangeCodeForSession(code)` | `supabase.auth.exchangeCodeForSession(code)` | Yes. | No - source returns `{ data, error }`, port wants `void`. | Yes, throw `error`, return void. |
| `getSession()` | `supabase.auth.getSession()` | Yes. | No - source nests session in `data.session`; port also wants `user`. | Yes, unwrap `data.session` and derive `user`. |
| `getUser()` | `supabase.auth.getUser()` | Yes. | No - source nests user in `data.user`. | Yes, unwrap `data.user`. |
| `onAuthStateChange(callback)` | `supabase.auth.onAuthStateChange(callback)` | Yes. | No - source returns Supabase subscription wrapper. | Yes, return `{ unsubscribe }`. |
| `signOut(options?)` | `supabase.auth.signOut(options)` | Yes. | No - source returns `{ error }`, port wants `void`. | Yes, throw `error`, return void. |

**Side effects** -

- `supabase.js` logs a configuration error when env vars are missing and writes `window.supabaseInstance`.
- `main.js` mutates `window.__recocoCurrentUser` at boot and on auth changes.
- Auth callbacks close the Capacitor Browser and may navigate modals/views through router callbacks.
- Withdrawal flow combines auth signout with storage clearing, so AccountPort/StoragePort must not be silently duplicated.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:42-48` - calls `supabase.auth.signInWithOAuth`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:96-105` - calls `setSession` or `exchangeCodeForSession` from callback URL.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:310-324` - subscribes via `onAuthStateChange`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:342-343` - calls `getSession`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:113-120` - calls `getUser`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:144-149` - calls `signOut`.

**Cross-service couplings** -

- Auth callback depends on BrowserPort and AppPort flow: native callback enters through `App.addListener('appUrlOpen')`, then `Browser.close()` is attempted.
- Stats and Report code also call `supabase.auth.getUser()`, so moving AuthPort later must avoid breaking those direct Supabase consumers before their own slices.

**Smoke validation path** - Run native/web Google sign-in, verify callback code/token exchange establishes a session, closes Browser on native, updates `window.__recocoCurrentUser`, then logout clears UI state.

## 2. BrowserPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:25` - `Browser` import.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:80` - `Browser.close()` in auth callback.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:8` - `Browser` import.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:52-56` - `Browser.open(...)` for native OAuth.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `open(options)` | `Browser.open(options)` | Yes. | Yes, source returns a promise. | No functional glue. |
| `close()` | `Browser.close()` | Yes. | Yes, source returns a promise. | No functional glue. |

**Side effects** -

- Native browser UI opens with `presentationStyle: 'fullscreen'`.
- `Browser.close()` failures are swallowed in `main.js:80`, so adapter-level callers should preserve the non-fatal close behavior where used.
- BrowserPort does not mutate app state directly, but it is part of auth UI control.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:52-56` - opens native OAuth URL.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:80` - closes browser after callback handling starts.

**Cross-service couplings** -

- BrowserPort is coupled to AuthPort only through OAuth flow.
- It should not own redirect parsing; redirect parsing stays in the auth/app-url controller slice.

**Smoke validation path** - On native login, tap Google login, confirm Browser opens the Supabase OAuth URL and closes after the app receives the callback URL.

## 3. AppPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:24` - `App` import.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:112-121` - `App.addListener(...)` for URL and app state.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:339-340` - `App.getLaunchUrl()`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:9` and `:33` - `Capacitor.isNativePlatform()`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:7` and `:25` - native platform check.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:6` and `:28` - native platform check.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `isNative()` | `Capacitor.isNativePlatform()` | Yes. | Yes, boolean. | No. |
| `getLaunchUrl()` | `App.getLaunchUrl()` | Yes. | Yes, promise of `{ url? }` or null-like value. | Minimal null normalization only if desired. |
| `addListener(eventName, callback)` | `App.addListener(eventName, callback)` | Yes for `appUrlOpen` and `appStateChange`. | Yes, Capacitor listener handle shape is compatible. | No functional glue. |

**Side effects** -

- Registers long-lived app listeners at module top level in current `main.js`.
- `appUrlOpen` invokes auth callback parsing.
- `appStateChange` reads storage and can schedule notifications when the app becomes active.
- `getLaunchUrl()` can invoke callback processing during cold launch.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:112-114` - registers `appUrlOpen`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:117-121` - registers `appStateChange`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:339-340` - reads launch URL.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:33` - checks native mode for redirect behavior.

**Cross-service couplings** -

- AppPort listener callbacks bridge to AuthPort, BrowserPort, StoragePort, and NotificationPort.
- The adapter must only expose platform primitives; controller slices should keep callback side effects out of AppPort itself.

**Smoke validation path** - Test cold-launch deep link and foreground resume; verify URL callback handling and notification scheduling still run through existing paths.

## 4. PhotoPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/PhotoService.js:1-150` - public `PhotoService` and singleton `photoService`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/dailyCurationRuntime.js:1-162` - daily curation, thumbnails, update event dispatch.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/detailHydrator.js:1-104` - summary/detail hydration and geocoding.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/mutationRuntime.js:1-42` - delete and curation action mutation.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/legacyRankingRuntime.js:1-42` - legacy fetch/ranking path.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:1-125` - native/web plugin boundary.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:48-49` - direct permission status call.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:141-142` - direct permission request call.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `getPhotos()` | `photoService.getPhotos()` | Yes. | Yes, array. | No. |
| `fetchDailyCuration(options?)` | `photoService.fetchDailyCuration(options)` | Yes. | Yes - contract now uses `PhotoCurationResult`. | No. |
| `fetchCurationBatch(options?)` | `photoService.fetchCurationBatch(options)` | Yes. | Yes - contract now uses `PhotoCurationResult`. | No. |
| `hydrateThumbsForPhotos(photos, options?)` | `photoService.hydrateThumbsForPhotos(photos, options)` | Yes. | Yes, array. | No. |
| `loadPhotoDetails(index)` | `photoService.loadPhotoDetails(index)` | Yes. | Yes, object or null. | No. |
| `getPhotoAsBase64(index, options?)` | `photoService.getPhotoAsBase64(index)` | No - source ignores options. | Yes, string or null. | Yes only to discard/report options. |
| `getPhotoAsFile(index, options?)` | `photoService.getPhotoAsFile(index)` | No - source ignores options. | Yes, `File` or null. | Yes only to discard/report options. |
| `getPhotoAsAnalysisBase64(assetId)` | `photoService.getPhotoAsAnalysisBase64(assetId)` | Yes. | Yes, string or null. | No. |
| `getAnalysis(assetId)` | `photoService.getAnalysis(assetId)` | Yes. | Partly - source returns current map value, usually a promise, or undefined. | No unless strict promise normalization is desired. |
| `registerAnalysis(assetId, promise)` | `photoService.registerAnalysis(assetId, promise)` | Yes. | Yes, void. | No. |
| `deletePhoto(index)` | `photoService.deletePhoto(index)` | Yes. | Yes, boolean. | No. |
| `recordCurationAction(payload)` | `photoService.recordCurationAction(payload)` | Yes. | No - source may return boolean; port wants void. | Yes, ignore source return. |
| `getPhotoLibraryPermissionStatus()` | `RecocolPhotos.getPhotoLibraryPermissionStatus()` | Yes. | Yes. | Adapter must call plugin directly. |
| `requestPhotoLibraryPermission()` | `RecocolPhotos.requestPhotoLibraryPermission()` | Yes. | Yes. | Adapter must call plugin directly. |

**Side effects** -

- `PhotoService` mutates `photos`, `currentDayKey`, and `analysisRegistry`.
- `dailyCurationRuntime` dispatches `window` event `daily-curation-updated` and mutates photo thumbnail fields in place.
- `detailHydrator` mutates photo metadata and calls `geocodingService`, which has an in-memory cache.
- `mutationRuntime.deletePhoto` deletes through the native plugin, logs stats, then splices `service.photos`.
- `RecocolPhotos.ts` chooses native plugin vs mock at module load using `Capacitor.isNativePlatform()`.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:36` - copies `photoService.getPhotos()`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:41` - calls `getPhotoAsFile`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:45` - calls `getPhotoAsBase64`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:74-78` - calls `fetchDailyCuration`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:91` and `:115` - reads `getPhotos`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12-18` - calls `deletePhoto` then `recordCurationAction`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:72` and `:292` - calls `getAnalysis`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:91` and `:319` - calls `getPhotoAsAnalysisBase64`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:130` and `:342` - calls `registerAnalysis`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:217` and `:256` - calls `loadPhotoDetails`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:14-17` - calls `fetchCurationBatch`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:35` - calls `hydrateThumbsForPhotos`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:48` and `:141` - directly calls permission plugin methods.

**Cross-service couplings** -

- `mutationRuntime.deletePhoto` calls `StatsService.logDetox`; adapter wiring must not separately log the same deletion.
- `detailHydrator.loadPhotoDetails` calls `geocodingService.getAddress`; replacing PhotoPort must preserve this indirect backend/cache behavior.
- `dailyCurationRuntime` emits `daily-curation-updated`; UI currently depends on that event through `homeLoadRuntime`.

**Smoke validation path** - Load home curation, hydrate thumbnails/details, delete one photo, verify one stats log path, one curation action path, and one `daily-curation-updated` refresh path.

## 5. AiPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:12-249` - `GeminiService` implementation.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:25-100` - story generation.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:113-141` - single delete recommendation.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:151-180` - batch delete recommendation request.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:185-214` - async job polling.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:223-248` - synonyms source method.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `generateDeleteRecommendation(payload)` | `geminiService.generateDeleteRecommendation(payload)` | Yes. | Yes, object. | No. |
| `generateBatchDeleteRecommendations(payload)` | `geminiService.generateBatchDeleteRecommendations(payload)` | Yes. | Yes if backend result is `{ recommendations }`. | No, but preserve polling. |
| `generateStory(payload)` | `geminiService.generateStory(imageData, context)` | No - source takes two args. | Yes, object. | Yes, unpack `payload.imageData` and `payload.context` or equivalent. |
| `generateSynonyms(payload)` | `geminiService.getSynonyms(keywords, language)` | No - method name and args differ. | Yes, array. | Yes, map method name and unpack payload. |

**Side effects** -

- Uses backend network calls through `fetchWithRetry` and one direct `fetch` in `getJobStatus`.
- Converts base64 to `Blob`/`FormData` for story generation.
- Logs trace/info/warn/error messages.
- Polling waits with `setTimeout` up to 60 attempts.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:42` - instantiates `GeminiService`, but no direct method call was found.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:4` - instantiates `GeminiService`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:102-107` - calls `generateBatchDeleteRecommendations`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:320-327` - calls `generateDeleteRecommendation`.
- No current direct consumers were found for `generateStory` or `getSynonyms`.

**Cross-service couplings** -

- AiPort depends on `API_CONFIG`, `UI_MESSAGES`, and `fetchWithRetry`.
- Home image runtime couples AiPort to PhotoPort by fetching analysis base64 before calling AI.

**Smoke validation path** - Trigger home curation AI reasons for one photo and a batch; confirm the same payloads reach backend and UI messages update without duplicate analysis registry entries.

## 6. NotificationPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:6-122` - named notification exports.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:27-37` - `checkPermission`, extra source method not in port.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:43-53` - request permission.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:59-92` - daily schedule.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:97-109` - cancel all.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:115-122` - action listener.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `requestPermission()` | `requestPermission()` | Yes. | Yes, boolean. | No. |
| `scheduleDailyNotification()` | `scheduleDailyNotification()` | Yes. | Yes, boolean. | No. |
| `cancelAll()` | `cancelAll()` | Yes. | Yes, void is allowed. | No. |
| `setupActionListener(navigation)` | `setupActionListener(router)` | Partly - source expects `router.navigate('home')`. | Yes, void. | Yes if future navigation object is not the Router instance. |

**Side effects** -

- Calls Capacitor Local Notifications permission, pending, cancel, schedule, and listener APIs.
- `scheduleDailyNotification` first calls `cancelAll` to avoid duplicates.
- Randomly chooses a notification title/body.
- Logs notification schedule/cancel/action messages and delegates errors to `handleError`.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:26` - imports `scheduleDailyNotification` and `setupActionListener`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:119` - schedules on app active if storage flag is true.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:337` - registers action listener.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:352-353` - schedules after boot when storage flag is true.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:100-112` - requests permission, schedules/cancels, writes storage flag.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:9` - imports notification functions but no call was found in the inspected file.

**Cross-service couplings** -

- Notification scheduling depends on StoragePort flag `notificationEnabled` in callers.
- Notification action listener depends on Router navigation shape.

**Smoke validation path** - Toggle notifications on/off in Notice view, background/foreground app, and tap a local notification to confirm navigation to home.

## 7. AccountPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:292-320` - complete withdrawal flow.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:309-315` - inline delete-account `fetch`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/constants/env.js:10-14` - `API_CONFIG.BASE_URL`.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `deleteAccount(payload)` | `fetch(`${baseUrl}/api/v1/delete-account`, { method: 'POST', body: JSON.stringify(payload) })` | Yes for `{ user_id, reason }`. | Partly - source gets `Response` but swallows errors and continues. | Yes, hide `Response`; preserve warn-and-continue behavior if matching source. |

**Side effects** -

- Sends network POST to `${API_CONFIG.BASE_URL}/api/v1/delete-account`.
- Source catches fetch failure and logs `[WITHDRAW] Server error`, then continues.
- Same withdrawal method signs out globally, clears `localStorage`, clears `sessionStorage`, and renders farewell UI.
- Button state and modal text are mutated around the async operation.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:284` - modal confirm calls `_performWithdrawal()`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:309-315` - posts delete-account request if `userId` exists.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:318-320` - signs out and clears storage after delete request attempt.

**Cross-service couplings** -

- Account deletion is coupled to AuthPort through `supabase.auth.getUser()` and `supabase.auth.signOut({ scope: 'global' })`.
- It is coupled to StoragePort because the same flow clears local and session storage.
- Adapter should wrap only the backend account-delete POST in Slice 2; controller extraction can separate the full workflow later.

**Smoke validation path** - Confirm withdrawal with a fake or real logged-in user, inspect POST body `{ user_id, reason }`, and verify signout/storage clear still happen once.

## 8. StatsPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/StatsService.js:6-75` - existing stats log behavior.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/StatsService.js:14-54` - `logDetox`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/StatsService.js:59-74` - fallback `user_stats` upsert.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:31-79` - direct Supabase reads for `user_stats` and `detox_logs`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/mutationRuntime.js:27-32` - delete flow invokes `StatsService.logDetox`.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `getUserStats(userId)` | `supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle()` | Yes, source query uses user id. | No - source returns Supabase result wrapper. | Yes, unwrap `data` and handle `error`. |
| `getDetoxLogs(userId, sinceIso)` | `supabase.from('detox_logs').select('cleared_at').eq('user_id', userId).gte('cleared_at', sinceIso)` | Yes. | No - source returns Supabase result wrapper. | Yes, unwrap `data` to array and handle `error`. |
| `logCurationAction(payload)` | `StatsService.logDetox(payload)` | Partly - source expects `{ fileSize, reason, photoDate, location }`. | Yes, source returns void promise. | Yes, map name and payload semantics. |

**Side effects** -

- `StatsService.logDetox` calls `supabase.auth.getUser()` internally.
- It inserts into `detox_logs`, calls RPC `increment_user_stats`, and fallback-upserts `user_stats` on RPC error.
- It logs to console and uses `handleError` with warning level.
- Fallback uses `new Date().toISOString().split('T')[0]` for `last_activity_date`.
- `ReportManager.loadStats` mutates component state after direct reads; adapter should only expose data reads.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/mutationRuntime.js:27-32` - calls `StatsService.logDetox` after successful photo delete.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:44-55` - directly reads `user_stats` and `detox_logs`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:65-79` - derives dashboard stats from returned rows.

**Cross-service couplings** -

- Photo deletion already logs stats through `mutationRuntime`; any controller or adapter must not call `logCurationAction` a second time for the same deletion.
- StatsPort depends on Auth/Supabase session state because `logDetox` fetches the current user internally.
- Report reads are currently component-local and not present in `StatsService`, so adapter must include direct Supabase query behavior.

**Smoke validation path** - Delete a photo, verify one `detox_logs` insert and one `user_stats` increment/fallback path, then load Report and verify stats query values render.

## 9. StoragePort

**Source mapping** - Adapter wraps browser globals:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:118` - reads `notificationEnabled` on app active.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:352` - reads `notificationEnabled` on boot.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:319-320` - clears local and session storage on withdrawal.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:12` - reads initial notification toggle state.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:112` - writes notification toggle state.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:21-23` - reads/writes `perf_runs`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:144` - reads `last_reset_timestamp`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:156` - writes `last_reset_timestamp`.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `getItem(key)` | `localStorage.getItem(key)` | Yes. | Yes, string or null. | No. |
| `setItem(key, value)` | `localStorage.setItem(key, value)` | Yes. | Yes, void. | No. |
| `clearLocal()` | `localStorage.clear()` | Yes. | Yes, void. | No. |
| `clearSession()` | `sessionStorage.clear()` | Yes. | Yes, void. | No. |

**Side effects** -

- Persists notification preference and perf samples across sessions.
- Withdrawal clears all local and session keys, not only RECOCO-specific keys.
- `homeLoadRuntime` parses `perf_runs` with `JSON.parse`; corrupt storage can throw before write.
- `StateManager.checkAndResetDaily` stores 17:00 daily reset timestamps.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:118` - `localStorage.getItem('notificationEnabled')`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:352` - `localStorage.getItem('notificationEnabled')`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:319-320` - `localStorage.clear()` and `sessionStorage.clear()`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:12` - initial toggle read.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:112` - toggle write.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:21-23` - `perf_runs` read/write.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:144` and `:156` - daily reset key read/write.

**Cross-service couplings** -

- Notification scheduling is controlled by `notificationEnabled` storage state.
- Account withdrawal clears storage after auth signout.
- State daily reset behavior depends on storage plus direct clock use; ClockPort does not own this yet.

**Smoke validation path** - Toggle notification flag, resume app, verify scheduling; complete withdrawal and verify local/session storage are cleared; load home and verify `perf_runs` appends.

## 10. ClipboardPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:7` - Capacitor Clipboard import.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:43` - native `Clipboard.write`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:73` - web caption fallback write.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:85` - web share backup clipboard write.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:240-248` - direct web clipboard copy.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `writeText(text)` | `Clipboard.write({ string: text })` | No - native source wraps text in object. | Yes, promise void. | Yes, pack `{ string }`. |
| `writeText(text)` | `navigator.clipboard.writeText(text)` | Yes. | Yes, promise void. | No. |

**Side effects** -

- Writes to system clipboard.
- ResultViewer fallback uses a temporary DOM textarea and `document.execCommand('copy')`; this fallback is outside the port contract.
- ShareService uses clipboard as part of share flow, so ClipboardPort and SharePort can overlap if extracted carelessly.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:243-248` - copies caption via `navigator.clipboard.writeText`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:316-324` - DOM fallback copy path.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:43` - copies caption before native image share.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:73` and `:85` - web share fallback/backup copy.

**Cross-service couplings** -

- SharePort currently performs clipboard writes internally.
- ResultViewer copy UI owns success toast and fallback behavior; adapter should not own toast display.

**Smoke validation path** - Copy a generated caption from ResultViewer and share a caption/image; verify clipboard text is populated on web and native.

## 11. SharePort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:4-9` - Capacitor Share/Filesystem/Clipboard setup.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:16-31` - native temp image file helper.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:40-58` - `shareWithImage`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:63-76` - `shareCaption`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:82-122` - web share fallback.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/ShareService.js:127-134` - private DOM `downloadImage` helper; keep outside adapter unless a future port adds download.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `shareWithImage(payload)` | `shareWithImage({ imageBase64, caption })` | Yes. | Yes, promise void. | No. |
| `shareCaption(caption)` | `shareCaption(caption)` | Yes. | Yes, promise void. | No. |

**Side effects** -

- Native path writes a temporary file in Capacitor cache and opens the native share sheet.
- Native image share also writes caption to Clipboard.
- Web path writes clipboard backup, creates a `File` from fetched image data, and uses `navigator.share` when available.
- Web fallback logs warnings/errors and may silently stop when `navigator.share` is unavailable.
- `downloadImage` creates/removes an anchor in `document.body`, but it is not exported or currently used.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:221` - dynamically imports `ShareService`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:223` - calls `shareWithImage` when image base64 exists.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:224` - calls `shareCaption` fallback.

**Cross-service couplings** -

- SharePort overlaps ClipboardPort because image sharing copies caption before sharing.
- SharePort depends on Filesystem, Share, Capacitor platform detection, web `navigator.share`, web `fetch`, and `File`.

**Smoke validation path** - Generate a result, share with image and without image on web/native, verify caption copy and share sheet behavior are unchanged.

## 12. ImageProcessorPort

**Source mapping** - Adapter wraps:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/processors/ImageProcessor.js:10-11` - config and Vite worker import.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/processors/ImageProcessor.js:13-22` - ArrayBuffer to base64 helper.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/processors/ImageProcessor.js:24-64` - class and `process(file)`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/processors/ImageProcessor.js:66` - singleton export.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `process(file)` | `new ImageProcessor().process(file)` | Yes. | Yes, `{ base64, dataUrl, width, height, metadata }`. | No. |

**Side effects** -

- Creates a new web worker per processed file and terminates it on message/error.
- Posts `file` and image config to the worker.
- Creates an object URL with `URL.createObjectURL(blob)`; current source does not revoke it.
- Converts image buffer to base64 on the main thread after worker processing.

**Existing consumers** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:6` - imports `ImageProcessor`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:44` - creates `new ImageProcessor()`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:147-164` - calls `process(file)` and forwards result to state/UI callback.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:21` - re-exports `ImageProcessor` and `imageProcessor`.

**Cross-service couplings** -

- Depends on `IMAGE_CONFIG` constants and Vite worker bundling behavior.
- DropZone stores processed output into `StateManager`, so later controller extraction must preserve the result object shape exactly.

**Smoke validation path** - Upload an image through DropZone, verify preview URL, base64, dimensions, and metadata reach the existing state callback.

## 13. ClockPort

**Source mapping** - Adapter source is:

- `() => new Date()` as required by `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:649`.
- No dedicated source file exists for ClockPort in Slice 2.
- Existing direct date call sites are not ClockPort consumers yet and should remain unchanged in this adapter-only slice.

**Signature alignment table** -

| Port method | Source method | Args match? | Return match? | Glue needed? |
| --- | --- | --- | --- | --- |
| `now()` | `() => new Date()` | Yes. | Yes, `Date`. | No. |

**Side effects** -

- None for the adapter function itself.
- Existing direct clock users include daily reset, report grouping, stats fallback date, share temp file naming, perf entries, and plugin mock dates.
- Those call sites are intentionally not migrated in Slice 2.

**Existing consumers** -

- n/a - no current code imports or consumes ClockPort.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:145` is a future candidate, not a Slice 2 consumer.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:41-42` and `:102-109` are future candidates, not Slice 2 consumers.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:14` is a future candidate, not a Slice 2 consumer.

**Cross-service couplings** -

- n/a for current Slice 2 wiring because no consumer is migrated.
- Later controller/state slices may use ClockPort for deterministic daily reset, report windows, and generated timestamps.

**Smoke validation path** - Instantiate the adapter and assert `clock.now()` returns a `Date`; do not migrate existing date consumers in Slice 2.
