# Slice 5 Component Conversion Mapping
Audit date: 2026-05-10

## 0. Decisions To Surface

| # | Decision | Options | Source alignment facts | Existing-doc alignment facts |
|---|---|---|---|---|
| 1 | Component conversion order | A: Auth/Permission/Notice/Report/MyPage first, Input/Result/Home later. B: Home/Input/Result first. C: 8 components in one patch. | Slice 4 currently instantiates legacy components in `createDomApp`: Auth/Permission/Home eager at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:70-77`, lazy Report/MyPage/Notice/Input/Result at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:100-153`; high-mutation Home paths still call PhotoService at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12-14`. | Instruction conversion sequence lists Auth/Permission first, Notification/Account next, Report next, Input/DropZone/Result next, Home last at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:705-717`; slice 4 decision #3B kept non-auth/notification core calls inert until slice 5 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:363`. |
| 2 | Legacy StateManager residual scope | A: keep only `main.js` daily reset. B: keep `ResultViewer` currentResult until slice 6. C: remove HomeManager legacy state together. | `main.js` keeps `legacyStore.checkAndResetDaily()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:42`; `createDomApp` currently reads/writes legacyStore for ResultViewer at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-137`; InputManager still writes legacy state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:71-73`. | Slice 3c-1 kept legacy daily reset, and slice 4 maps it to `main.js` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:365`; instruction forbids `../state/StateManager.js` in components at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. |
| 3 | Component construction site | A: keep direct component imports in `createDomApp`. B: add `src/ui/dom/views/<name>View.js` adapters and import those. C: keep components and inject `core` or controller args. | `createDomApp` imports all eight legacy components directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:24-33`; constructors currently vary: `new AuthModal('auth-modal')` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:72`, `new HomeManager({ ... })` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:77-87`. | Instruction allows components to receive callbacks/actions from `createDomApp` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:699`; instruction layout already created `src/ui/dom` but no `views` directory requirement at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:681-699`. |
| 4 | View model rendering trigger | A: each component subscribes to `core.store`. B: `createDomApp` adds domain reactors that call manager render. C: rely on `domRouterAdapter` navigation render only. | `domRouterAdapter` renders manager on navigation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:75-87`; `createDomApp` already has inline auth/window reactors at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:197-229`. | Slice 4 decision #4 chose inline reactors for slice 4 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:364`; slice 3a cross-controller calls remain forbidden and reactors own cross-domain triggers at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:323-326`. |
| 5 | PermissionModal permission-resolved reactor | A: modal calls `core.permissions` and subscribes itself. B: `createDomApp` controls modal open/close from store. C: HomeController handles load; only modal close is external. | Slice 4 legacy callback still calls `homeManager.loadRealPhotos()` after permission at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:90-96`; HomeController already watches permission false-to-true at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:477-499`. | Instruction maps PermissionModal `checkAndOpen`, allow, skip to core permissions at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:668`; slice 4 says core permission methods were inert until slice 5 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:363`. |
| 6 | NoticeManager Korean storage key / direct storage removal | A: `loadSetting()` keeps same storage key. B: NoticeManager only reads VM and calls `setEnabled`. C: both paths run. | NoticeManager reads/writes `notificationEnabled` directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:12` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:112`; NotificationController exposes storage key in VM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172`. | Instruction maps NoticeManager to `core.notifications.getViewModel()` and `setEnabled` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:677`; slice 4 initialized notifications with navigation duck type at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:48`. |
| 7 | ResultViewer clipboard fallback | A: remove DOM fallback. B: keep component fallback. C: move fallback into clipboardPort adapter. | ResultViewer uses `navigator.clipboard.writeText` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:243`; fallback uses `document.execCommand('copy')` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:321`; core result calls `clipboardPort.writeText` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:125-140`. | Instruction says clipboardPort wraps native/web clipboard and DOM execCommand fallback in ResultViewer stays UI layer at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:692`; components should call injected actions and view models at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:655-660`. |
| 8 | Component test/smoke strategy | A: manual smoke only. B: add unit tests. C: add instrumentation counters for multi-fire guard. | Current duplicate-risk paths exist: legacy delete calls PhotoService directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12-14`, controller delete calls photoPort + history at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:213-252`; account deletion legacy calls fetch/signOut/clear at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:311-320`, controller deletion repeats those responsibilities at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:118-165`. | Instruction validation includes boundary scans at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:721-739` and acceptance/manual smoke at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786`; slice 4 warns multi-fire is the reason for Decision #3B at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:363`. |

## 1. AuthModal conversion mapping

### Direct dependency line table

| Source | Direct API | Current behavior |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:7` | `supabase` from `../services/supabase.js` | Imports singleton platform client into component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:8` | `Browser` from `@capacitor/browser` | Imports native browser bridge into component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:9` | `Capacitor` from `@capacitor/core` | Imports native/web platform detector into component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:10` | `showToast` from errorHandler | Component displays toast directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:33` | `Capacitor.isNativePlatform()` | Selects native redirect path. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:36-38` | `window.location.origin` | Builds web redirect URL inside component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:42-48` | `supabase.auth.signInWithOAuth` | Starts Google OAuth directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:52-56` | `Browser.open` | Opens native OAuth URL directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:60` | `showToast` | Displays OAuth failure toast directly. |

### AuthController mapping table

| Current line | Current action | Core replacement surface | View-side remaining work |
|---|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:33` | Native platform detection. | `core.auth.startGoogleOAuth()` delegates platform detection through `appPort.isNative()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:124-143`. | Component only binds click handler. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:36-38` | Web redirect build. | `createRecocoCore(ports, { webRedirectOrigin })` passes host origin at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:44-46`; auth uses redirect option at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:124-135`. | No host location read in component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:42-48` | Supabase OAuth. | `core.auth.startGoogleOAuth()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:124-143`. | Button disabled/loading from auth VM. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:52-56` | Native browser open. | Browser is behind `browserPort.open()` inside controller at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:136-140`. | None. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:60` | Direct toast. | Auth error stored through controller state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:139-143`; toastPresenter subscribes errors at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:33-64`. | Component may render inline state or no toast import. |

### View model usage

| Auth VM field | Source | Component usage candidate |
|---|---|---|
| `status` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:199-215` | Button loading text and modal disabled state. |
| `isAuthenticated` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:199-215` | Modal close condition when auth reactor reports signed in. |
| `canStartOAuth` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:199-215` | Guard for Google button click. |
| `error` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:199-215` | Optional inline error state; toast handled by presenter if retained. |

### Constructor signature candidates

| Candidate | Construction site | Impact |
|---|---|---|
| `new AuthModal(id, { core })` | Current `new AuthModal('auth-modal')` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:72` | Component can call `core.auth.startGoogleOAuth()` and read `core.auth.getViewModel()`. |
| `new AuthModal(id, { auth })` | Current `createDomApp({ core, rootEls })` signature at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:62` | Narrower dependency; no access to unrelated controllers. |
| `new AuthModal(id, { onGoogleLogin, getAuthViewModel })` | Instruction allows callbacks/actions from createDomApp at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:699` | Component remains DOM-only and controller-free. |

### Boundary check

| Category | After-conversion import status |
|---|---|
| Must not import | `../services/supabase.js`, `@capacitor/core`, `@capacitor/browser` per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. |
| Toast | Direct `showToast` import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:10` maps to toastPresenter path at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:10-22`. |
| May import | DOM-local helpers only; callbacks/view model access according to `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:655-660`. |
| Current slice 4 seal | AuthController is already initialized in `main.js` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:49`, but component still has direct OAuth calls until slice 5. |

## 2. PermissionModal conversion mapping

### Direct dependency line table

| Source | Direct API | Current behavior |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:7` | `Capacitor` | Native platform check in component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:8` | `RecocolPhotos` | Native photo permission plugin in component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:25` | `Capacitor.isNativePlatform()` | Web bypass decision. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:48` | `RecocolPhotos.getPhotoLibraryPermissionStatus()` | Checks permission directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:141` | `RecocolPhotos.requestPhotoLibraryPermission()` | Requests permission directly. |

### PermissionController mapping table

| Current line | Current action | Core replacement surface | View-side remaining work |
|---|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:25` | Web/native branch. | `core.permissions.checkPhotoPermission()` does web bypass at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:41-51`. | Modal decides visibility from permissions VM. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:48` | Direct status call. | `core.permissions.checkPhotoPermission()` delegates to `photoPort.getPhotoLibraryPermissionStatus()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:74-111`. | No plugin import. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:141` | Direct request call. | `core.permissions.requestPhotoPermission()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:114-145`. | Close/open follows VM or reactor option. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:182-191` | Skip behavior. | `core.permissions.skipPhotoPermission()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:147-157`. | UI close can remain DOM-only. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:37-44` | Slow plugin guard. | Controller owns 2500ms timeout at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:57-72`. | Component timeout code becomes removable when mapping is applied. |

### View model usage

| Permissions VM field | Source | Component usage candidate |
|---|---|---|
| `photo.authorized` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:159-185` | Decide resolved state and close modal when true. |
| `photo.shouldPrompt` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:159-185` | Decide whether to open modal. |
| `photo.checking` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:159-185` | Loading spinner for check state. |
| `photo.requesting` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:159-185` | Disable allow button. |
| `photo.canRequest` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:159-185` | Guard request button. |
| `photo.canSkip` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:159-185` | Guard skip button. |

### Permission resolved callback decomposition

| Option | Current source | Replacement shape |
|---|---|---|
| Decision #5 A | `permissionModal.onPermissionResolved` is assigned in `createDomApp` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:90-96`. | PermissionModal calls controller and subscribes to VM itself; its callback no longer calls HomeManager. |
| Decision #5 B | `createDomApp` already owns auth reactor at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:197-216`. | `createDomApp` subscribes to `permissions.photo` and controls modal open/close. |
| Decision #5 C | HomeController permission subscriber exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:477-499`. | `createDomApp` only closes modal; HomeController owns load. |

### Constructor signature candidates

| Candidate | Construction site | Impact |
|---|---|---|
| `new PermissionModal(id, { core })` | Current `new PermissionModal('permission-modal')` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:70` | Direct access to permissions controller and store. |
| `new PermissionModal(id, { permissions })` | Core exposes controller at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:55-62` | Narrow component dependency. |
| `new PermissionModal(id, { check, request, skip, getViewModel })` | Instruction component conversion line at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:668` | DOM-only action injection. |

### Boundary check

| Category | After-conversion import status |
|---|---|
| Must not import | `@capacitor/core`, `../plugins/RecocolPhotos.ts` per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. |
| Timeout | Existing controller timeout at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:57-72` replaces modal-level timeout behavior. |
| Multi-fire guard | Do not run both direct plugin call and controller call for check/request; slice 4 decision #3B identifies this as sealed until slice 5 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:363`. |
| UI events | DOM open/close and button binding can remain in component. |

## 3. HomeManager + home/*Runtime.js conversion mapping

### Direct dependency line table

| Source | Direct API | Current behavior |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:7` | `supabase` | User lookup for stats/history action. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:8` | `photoService` | Photo access and prefetch. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:36` | `photoService.getPhotos()` | Reads current legacy photo array. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:41` | `photoService.getPhotoAsFile()` | Exposes selected image as file. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:45` | `photoService.getPhotoAsBase64()` | Exposes selected image base64. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:113` | `supabase.auth.getUser()` | Reads current user for UI/action path. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:331` | `photoService.triggerBackgroundPrefetch()` | Starts background prefetch directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:1` | `photoService` | Runtime direct photo access. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:2` | `handleError`, `showToast` | Runtime direct toast/error handling. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:21-23` | `localStorage` | Perf-run debug counter. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:30-38` | `showToast`, `handleError` | Error display on load failure. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:74` | `photoService.fetchDailyCuration()` | Fetches daily curation directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:91-115` | `photoService.getPhotos()` | Hydrates runtime photos. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:1` | `photoService` | Runtime direct delete/action history. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:2` | `handleError`, `showToast` | Runtime direct toast/error handling. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:5` | `photoService.getPhotos()` | Reads legacy current photo list. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12` | `photoService.deletePhoto()` | Destructive delete direct call. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:14` | `photoService.recordCurationAction()` | Records delete action directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:24-27` | `showToast`, `handleError` | Delete success/error UI. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:1` | `photoService` | Runtime direct photo cache/detail access. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:2-4` | `GeminiService` | Runtime direct AI analysis service construction. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:9-61` | `photoService.getPhotos()` | Direct image source resolution. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:72` | `photoService.getAnalysis()` | Reads analysis cache directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:91` | `photoService.getPhotoAsAnalysisBase64()` | Prepares analysis payload directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:130` | `photoService.registerAnalysis()` | Writes analysis result directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:198-256` | `photoService.getPhotos/loadPhotoDetails` | Reads/hydrates batches directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:292-342` | `photoService.getAnalysis/getPhotoAsAnalysisBase64/registerAnalysis` | Repeated analysis path. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:1` | `photoService` | Runtime direct refill service. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:14` | `photoService.fetchCurationBatch()` | Fetches next batch directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:35` | `photoService.hydrateThumbsForPhotos()` | Hydrates thumbs directly. |

### HomeController mapping table

| Runtime file | Current direct behavior | Core replacement surface | Notes |
|---|---|---|---|
| `homeLoadRuntime.js` | Daily fetch and getPhotos at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:74-115`. | `core.home.loadDailyCuration()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:103-133`. | Toast moves to core error store + toastPresenter. |
| `homeDeleteRuntime.js` | Delete and record action at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12-14`. | `core.home.deleteCurrent()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:213-252`. | Destructive double-fire guard required. |
| `homeImageRuntime.js` | Analyze/hydrate images with PhotoService + GeminiService at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:72-130`. | `core.home.ensureVisibleImages()` and `core.home.analyzeVisiblePhotos()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:349-395`. | Instruction flags homeImageRuntime split as high risk at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:797-800`. |
| `homeRefillRuntime.js` | Batch fetch/hydrate at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:14-35`. | `core.home.triggerBackgroundRefill()` and `core.home.switchToNextBatch()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:284-347`. | Refill state moves to home domain. |

### HomeManager public method mapping

| Current method / state | Current source | Core replacement surface |
|---|---|---|
| `loadRealPhotos()` | Legacy permission callback calls it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:90-96`. | `core.home.loadDailyCuration()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:103-133`. |
| `getCurrentPhotoMeta()` | Used by slice 4 precious callback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:79-86`. | `core.home.getCurrentPhotoMeta()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:136-161`. |
| `getCurrentImageAsFile()` | Component delegates to PhotoService at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:41`. | `core.home.getCurrentImageAsFile()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:163-167`. |
| `getCurrentPhotoBase64()` | Component delegates to PhotoService at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:45`. | `core.home.getCurrentPhotoBase64()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:169-173`. |
| previous button path | Instruction maps HomeManager buttons at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:669`. | `core.home.movePrevious()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:175-182`. |
| next button path | Instruction maps HomeManager buttons at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:669`. | `core.home.moveNext()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:184-191`. |
| precious click path | Slice 4 callback consumes photo after toast at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:79-86`. | `core.home.markPrecious()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:193-211`. |
| delete confirm path | Runtime direct delete at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12-14`. | `core.home.deleteCurrent()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:213-252`. |
| `consumePhoto()` | Slice 4 precious callback calls it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:84-86`. | `core.home.consumePhoto()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:254-282`. |
| background prefetch | `HomeManager` calls PhotoService at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:331`. | `core.home.triggerBackgroundRefill()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:284-328`. |
| batch switch | Current runtime batch handling lives in home runtimes. | `core.home.switchToNextBatch()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:330-347`. |
| image hydration | `homeImageRuntime.js` direct detail load at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:217-256`. | `core.home.ensureVisibleImages()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:349-371`. |
| analysis path | `homeImageRuntime.js` direct Gemini path at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:292-342`. | `core.home.analyzeVisiblePhotos()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:373-395`. |
| render data read | Component instance state currently includes `photos` and `isLoading`. | `core.home.getViewModel()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:397-399`. |

### Instance state to store/view model

| Legacy state | Current evidence | Store/view model replacement |
|---|---|---|
| `homeManager.photos` | Slice 4 checks `.photos.length` before load at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:90-96`; HomeManager reads PhotoService photos at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:36`. | Core store `home` domain is part of initial state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-75`; HomeController VM produced at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:397-399`. |
| `homeManager.isLoading` | Slice 4 checks `!homeManager.isLoading` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:90-96`. | HomeController writes loading/status through store in `loadDailyCuration()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:103-133`. |
| `homeManager.consumePhoto` | Slice 4 callback calls it directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:84-86`. | `core.home.markPrecious()` already records and consumes at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:193-211`. |
| Loaded analysis cache | Runtime reads/writes via `photoService.getAnalysis/registerAnalysis` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:72-130`. | HomeController analysis methods own cache interaction through ports at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:373-403`. |

### Permission load deduplication

| Current source | Duplicate source | Deduplication mapping point |
|---|---|---|
| `permissionModal.onPermissionResolved` invokes `homeManager.loadRealPhotos()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:90-96`. | HomeController subscribes to permission false-to-true and calls `loadDailyCuration()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:477-499`. | Slice 5 must choose one trigger path in Decision #5; both active means `photoService.fetchDailyCuration` and `photoPort.fetchDailyCuration` can run for one permission allow. |

### Double-fire risk table

| Flow | Legacy component path | Core controller path | Incident if both run |
|---|---|---|---|
| Delete | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12-14` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:213-252` | Same photo can be deleted twice and action history can record duplicate `deleted`. |
| Mark precious | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:79-86` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:193-211` | Same photo can record duplicate `recorded` action and consume twice. |
| Consume photo | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:84-86` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:254-282` | View index can skip extra photo or exhaust visible queue prematurely. |
| Daily load | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:74` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:103-133` | Duplicate fetch and inconsistent photo arrays. |

### View model usage

| Home VM field/group | Source | Component usage candidate |
|---|---|---|
| `photos/currentPhoto/index/loading` | `core.home.getViewModel()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:397-399` | Replace `this.photos`, current card, progress, skeleton/loading state. |
| `visible images` | Home view model factory is invoked by controller at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:397-399`. | Replace runtime direct `photoService.getPhotos()` reads. |
| `controls` | Instruction maps buttons to core.home methods at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:669`. | Disable previous/next/delete/precious buttons from VM. |
| `error/status` | HomeController catches and writes errors in controller methods such as `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:128-132`. | Inline error or toastPresenter path. |

### Boundary check

| Category | After-conversion import status |
|---|---|
| Must not import | `../services/supabase.js`, `../services/PhotoService.js`, `../services/GeminiService.js` per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. |
| Runtime split | Instruction explicitly calls `homeImageRuntime` split last because it is the highest risk at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:797-800`. |
| Toast | Runtime `showToast` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:30-33` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:24` maps to toastPresenter compatibility at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:33-64`. |
| User lookup | Direct `supabase.auth.getUser()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:113` maps to auth VM/user or controller-managed action context. |

## 4. MyPageManager conversion mapping

### Direct dependency line table

| Source | Direct API | Current behavior |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:6` | `supabase` | Auth/session operations in component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:8` | `handleError` | Error UI in component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:9` | NotificationService functions | Notification status in MyPage. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:41` | `supabase.auth.getUser()` | Loads profile/current user. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:144` | `supabase.auth.signOut()` | Logout direct call. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:148` | `handleError` | Logout error display. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:305` | `supabase.auth.getUser()` | Delete-account flow user lookup. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:311-315` | `fetch` delete-account endpoint | Backend account deletion call. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:318` | `supabase.auth.signOut({ scope: 'global' })` | Global sign-out after delete. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:319` | `localStorage.clear()` | Clears local browser storage. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:320` | `sessionStorage.clear()` | Clears session browser storage. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:324` | `handleError` | Delete-account error UI. |

### MyPage Controller mapping table

| Current line | Current action | Core replacement surface |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:41` | Get current user/profile. | `core.account.hydrateProfile()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:72-89`, with auth fallback through authPort. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:144` | Sign out. | `core.account.logout()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:91-105` or `core.auth.signOut()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:188-197`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:305` | Get user for deletion. | `core.account.deleteAccount()` resolves profile/user state and deletion payload at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:118-165`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:311-315` | `fetch` delete-account. | `accountPort.deleteAccount()` inside `core.account.deleteAccount()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:130-134`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:318` | Global sign-out. | `authPort.signOut({ scope: 'global' })` inside controller at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:143-145`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:319-320` | Clear local/session storage. | `storagePort.clearLocal()` and `storagePort.clearSession()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:147-152`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:9` | Direct notification service imports. | `core.notifications.getViewModel()` and `core.notifications.setEnabled()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:101-172`. |

### Delete-account duplication lines

| Component responsibility | Legacy line | Controller responsibility |
|---|---|---|
| Deletion request | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:311-315` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:130-134` |
| Sign out after deletion | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:318` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:143-145` |
| Storage clear | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:319-320` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:147-152` |
| Farewell state | MyPage DOM method source is `_showFarewellView` in component flow. | Account status becomes `deleted` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:154-158`. |

### Farewell view trigger options

| Option | Source alignment |
|---|---|
| Keep DOM method in component | Component owns actual MyPage DOM view and existing method can remain UI-only after controller call. |
| Trigger from `account.status === 'deleted'` reactor | Controller writes deleted status at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:154-158`; slice 4 inline reactor pattern exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:197-229`. |
| Component self-subscribe | Decision #4 A allows per-component store subscription; store API supports subscribe at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:168-176`. |

### View model usage

| VM field | Source | Component usage candidate |
|---|---|---|
| `account.profile` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:167-183` | Replace `supabase.auth.getUser()` profile rendering. |
| `account.status` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:167-183` | Logout/delete loading and deleted/farewell state. |
| `account.withdrawal.reason` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:167-183` | Withdrawal reason form value. |
| `account.withdrawal.confirmed` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:167-183` | Confirm checkbox state. |
| `account.canDelete` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:167-183` | Disable withdrawal submit. |
| `auth.user` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:199-215` | Replaces `getCurrentUser: () => window.__recocoCurrentUser` pattern in `createDomApp` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:100-108`. |
| `notifications.enabled/status` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172` | Replace direct NotificationService rendering in MyPage. |

### Constructor signature candidates

| Candidate | Construction site | Impact |
|---|---|---|
| `new MyPageManager({ core })` | Current lazy factory at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:100-108` | Component can call account/auth/notifications controllers. |
| `new MyPageManager({ account, auth, notifications })` | Core controllers wired at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:64-82` | Narrow explicit dependencies. |
| `new MyPageManager({ getUserViewModel, onLogout, onDeleteAccount, ... })` | Instruction permits callbacks/actions from createDomApp at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:699` | Component remains controller-free. |

### Boundary check

| Category | After-conversion import status |
|---|---|
| Must not import | `../services/supabase.js`, NotificationService, raw fetch/storage per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653` and MyPage row at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:676`. |
| Error handling | `handleError` import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:8` maps to store error + toastPresenter compatibility at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:805-806`. |
| Global user mirror | Slice 4 mirror remains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:221-229`; component conversion can replace `getCurrentUser` with auth VM read. |

## 5. NoticeManager conversion mapping

### Direct dependency line table

| Source | Direct API | Current behavior |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:5` | NotificationService functions | Imports request/schedule/cancel directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:6` | `showToast` | Direct toast display. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:12` | `localStorage.getItem('notificationEnabled')` | Reads Korean storage key directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:100` | `requestNotificationPermission()` | Requests permission directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:102` | `showToast` | Direct permission-denied toast. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:106` | `scheduleDailyNotification()` | Schedules directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:108` | `cancelAllNotifications()` | Cancels directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:112` | `localStorage.setItem('notificationEnabled', ...)` | Persists enabled state directly. |

### NotificationController mapping table

| Current line | Current action | Core replacement surface |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:12` | Read storage key. | `core.notifications.loadSetting()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:95-99`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:100` | Request permission. | `core.notifications.setEnabled(true)` requests permission at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:101-144`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:106` | Schedule daily notification. | `core.notifications.setEnabled(true)` schedules when permission succeeds at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:118-124`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:108` | Cancel all notifications. | `core.notifications.setEnabled(false)` cancels at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:126-128`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:112` | Store enabled boolean. | `setEnabled()` persists storage through `storagePort.set` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:130-134`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:102` | Direct toast. | Controller stores error/status, toastPresenter can display normalized errors at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:33-64`. |

### Storage key verification

| Fact | Citation |
|---|---|
| Component key is `notificationEnabled`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:12` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:112`. |
| Controller exposes `storageKey` in view model. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172`. |
| Controller `loadSetting()` owns storage read. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:95-99`. |
| Controller `setEnabled()` owns storage write. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:130-134`. |

### nav-change dependency

| Event direction | Current / slice 4 source | Conversion note |
|---|---|---|
| Emit navigation changes | `dispatchNavChange` emits `nav-change` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:19-23`. | Component-side navigation emit can remain only if it emits UI intent; core navigation should own route state. |
| Listen for nav-change | `bindNavChange` listens at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:25-35`. | Components should not add separate listeners if `createDomApp/domEvents` owns proxy. |
| Router render | `domRouterAdapter` renders manager on route at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:75-87`. | Notice render can be triggered by navigation plus notifications VM reactor option. |

### View model usage

| Notifications VM field | Source | Component usage candidate |
|---|---|---|
| `enabled` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172` | Toggle checked state. |
| `status` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172` | Toggle loading/disabled state. |
| `error` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172` | Inline error or toastPresenter path. |
| `storageKey` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172` | Verification/debug only; no direct storage access. |

### Constructor signature candidates

| Candidate | Construction site | Impact |
|---|---|---|
| `new NoticeManager({ core })` | Current lazy factory at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:110` | Component can call notification controller directly. |
| `new NoticeManager({ notifications })` | Core notifications wired at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:64-72` | Narrow dependency. |
| `new NoticeManager({ getViewModel, setEnabled })` | Instruction row maps NoticeManager to VM + `setEnabled` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:677` | DOM-only callbacks. |

### Boundary check

| Category | After-conversion import status |
|---|---|
| Must not import | NotificationService and direct localStorage per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. |
| Toast | Direct `showToast` import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:6` maps to toastPresenter compatibility at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:10-22`. |
| Multi-fire guard | Do not run direct `scheduleDailyNotification()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:106` and controller `setEnabled(true)` schedule at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:118-124` for one toggle. |

## 6. ReportManager conversion mapping

### Direct dependency line table

| Source | Direct API | Current behavior |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:6` | `supabase` | Component owns Supabase queries. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:33` | `supabase.auth.getUser()` | Current user lookup. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:41-42` | `Date` | Computes 14-day window in component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:45-49` | `user_stats.select` | Queries user stats directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:50-55` | `detox_logs.select` | Queries detox logs directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-149` | Aggregation Date logic | Computes weekly trends/Monday-start in component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:156-159` | `new Date()` current-day check | Direct time reference in component render helper. |

### ReportController mapping table

| Current line | Current action | Core replacement surface |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:33` | Get user. | `core.report.load()` resolves current user through store/authPort at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:78-96`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:41-42` | Build 14-day date window. | `core.report.load()` uses injected `clock.now()` and computes `sinceIso` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:97-98`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:45-49` | Query user stats. | `statsPort.getUserStats()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:103-104`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:50-55` | Query detox logs. | `statsPort.getDetoxLogs()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:104-105`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-149` | Aggregate weekly trends. | `aggregateReportStats()` is called by controller at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:120-125`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:156-159` | Determine today UI day. | `todayUiIdx` is produced in report VM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178`. |

### Aggregation boundary

| Aggregation item | Component source | Controller/VM source |
|---|---|---|
| 14-day window | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:41-42` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:97-105` |
| Monday-start/current week | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-149` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:120-125` |
| Current day highlighting | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:156-159` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` |
| DOM/SVG render | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:184-291` | Remains component view logic fed by report VM. |

### View model usage

| Report VM field | Source | DOM render candidate |
|---|---|---|
| `weeklyCount` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` | Existing weekly stat render around `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:214`. |
| `weeklyChange` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` | Existing trend text render around `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:219`. |
| `totalBytesGB` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` | Existing bytes render around `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:249`. |
| `totalCount` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` | Existing total count render around `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:258`. |
| `dailyData` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` | Existing graph/path render around `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:269-291`. |
| `tips` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` | Existing tip text area in component view. |
| `todayUiIdx` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` | Replaces `_isCurrentDay()` Date helper. |
| `isLoading/status/error` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178` | Loading/error branch in report view. |

### Constructor signature candidates

| Candidate | Construction site | Impact |
|---|---|---|
| `new ReportManager({ core })` | Current lazy factory at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:100-104` | Component can call report and auth VM. |
| `new ReportManager({ report })` | Core report wired at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:111-119` | Narrow dependency. |
| `new ReportManager({ load, getViewModel })` | Instruction row maps ReportManager at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:675` | DOM-only action injection. |

### Boundary check

| Category | After-conversion import status |
|---|---|
| Must not import | `../services/supabase.js` per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. |
| Time | Component direct `Date` references at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:41-42`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-149`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:156-159` map to `clock.now()` controller usage at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:97`. |
| View logic remaining | DOM/SVG render can stay because instruction maps data fetch and aggregation, not visual markup, at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:675`. |

## 7. InputManager + DropZone conversion mapping

### Direct dependency line table

| Source | Direct API | Current behavior |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:7` | `store` from `../state/StateManager.js` | Imports legacy store. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:71-73` | `store.setState('base64'/'dataUrl'/'metadata')` | Writes processed image into legacy state. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:109-111` | `store.setState(...)` | Clears image state on reset. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:130-132` | `store.setState(...)` | Writes preview image. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:6` | `ImageProcessor` | Imports image processor directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:44` | `new ImageProcessor()` | Constructs processor in component. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:147` | `imageProcessor.process(file)` | Processes file directly. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:157-165` | `onFileLoaded` callback | Emits processed base64/dataUrl/metadata to InputManager. |

### InputController mapping table

| Current line | Current action | Core replacement surface |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:147` | Process file through ImageProcessor. | `core.input.processFile(file)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:57-74`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:71-73` | Write base64/dataUrl/metadata. | `processFile()` writes `input.base64`, `input.dataUrl`, and `input.metadata` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:57-74`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:109-111` | Reset image values. | `core.input.reset()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:98-108`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:130-132` | Set preview image state. | `core.input.setPreviewImage({ base64, dataUrl, metadata })` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:83-96`. |
| Meaning/tags input fields | User requirement names `setMeaning` / `setTags`. | Current controller has `setTextFields({ meaning, tags })` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:76-81`; no separate `setMeaning` or `setTags` method is wired in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:93-99`. |
| Submit data read | Legacy state used by later Result flow. | `core.input.getInputData()` returns input payload at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:110-119`. |

### DropZone boundary options

| Option | Source alignment |
|---|---|
| DropZone calls `core.input.processFile(file)` directly | DropZone currently owns file processing at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:147`. |
| DropZone emits raw file and InputManager calls controller | Instruction says DropZone removes ImageProcessor and emits file to injected `onFileSelected(file)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:671`. |
| createDomApp owns file action callback | Instruction permits injected actions from createDomApp at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:699`. |

### View model usage

| Input VM field | Source | Component usage candidate |
|---|---|---|
| `hasImage` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:121-138` | Preview vs empty dropzone state. |
| `dataUrl` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:121-138` | Preview image source. |
| `metadata` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:121-138` | Metadata UI. |
| `meaning` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:121-138` | Meaning text field value. |
| `tags` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:121-138` | Tags text field value. |
| `isProcessing` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:121-138` | Disable dropzone/actions during processing. |
| `error` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:121-138` | Inline error or toastPresenter. |

### Constructor signature candidates

| Candidate | Construction site | Impact |
|---|---|---|
| `new InputManager({ core })` | Current lazy factory at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:111` | Component and nested DropZone can reach input controller. |
| `new InputManager({ input })` | Core input wired at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:93-99` | Narrow controller dependency. |
| `new InputManager({ getViewModel, processFile, setTextFields, reset, setPreviewImage })` | Instruction row maps InputManager to core input actions at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:672` | DOM-only callbacks; DropZone can receive `onFileSelected`. |

### Boundary check

| Category | After-conversion import status |
|---|---|
| Must not import | `../state/StateManager.js` and `../processors/ImageProcessor.js` per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. |
| Store schema | Input domain already exists in initial store at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-75`; controller writes all current image/text fields. |
| Method name mismatch | User requested `setMeaning` / `setTags`, but implemented surface is `setTextFields` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:76-81`. |

## 8. ResultViewer conversion mapping

### Direct dependency line table

| Source | Direct API | Current behavior |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1` | `showToast` | Direct copy/share toast surface. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:243` | `navigator.clipboard.writeText()` | Clipboard copy primary path. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:304` | `showToast` | Copy success toast. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:321` | `document.execCommand('copy')` | Clipboard fallback. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-137` | `legacyStore.getState/setResult` | Result keyword callback reads/writes legacy result. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:135-137` | `viewer.renderCaption` | Manual caption re-render after legacy mutation. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:139-151` | dynamic `ShareService` import | Share action implemented outside ResultController. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:145` | `legacyStore.getState('base64')` | Reads share image source from legacy store. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:149` | `handleError` | Share error direct handling in DOM app. |

### ResultController mapping table

| Current line | Current action | Core replacement surface |
|---|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:243` | Clipboard primary copy. | `core.result.copyCaption()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:125-140`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:321` | Clipboard fallback. | Decision #7 decides keep UI fallback or move into `clipboardPort`; controller already depends on `clipboardPort.writeText()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:125-140`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-137` | Replace keyword through legacy result mutation. | `core.result.replaceKeyword(keyword, replacement)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:84-97`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:139-151` | Share caption via ShareService dynamic import. | `core.result.shareCaption()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:142-164`. |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:145` | Read legacy `base64`. | `shareCaption()` reads `store.get('input.base64')` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:142-164`. |
| Save callback in ResultViewer factory | `onSave` currently reads legacy store at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:139-143`. | `core.result.saveCaption()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:99-106`. |
| Edit mode callbacks | ResultViewer currently owns edit UI. | `core.result.enterEditMode()` and `core.result.exitEditMode()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:108-123`. |

### Caption segments mapping

| Current behavior | Current source | Core VM replacement |
|---|---|---|
| Format caption and highlight keywords in component | Instruction maps ResultViewer to structured segments at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:673`. | `result.getViewModel().captionSegments` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226`. |
| Keyword click callback reads current legacy result | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-126` | Use selected segment keyword + controller `replaceKeyword` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:84-97`. |
| Manual `viewer.renderCaption()` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:135-137` | Store reactor or component self-render from `getViewModel()` per Decision #4. |

### View model usage

| Result VM field | Source | Component usage candidate |
|---|---|---|
| `hasResult` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Empty/result view switch. |
| `captionSegments` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Keyword highlighting. |
| `originalCaption` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Copy/share/save payload preview. |
| `keywords` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Synonym modal/source keyword list. |
| `isEditMode` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Edit state. |
| `copyStatus` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Copy button feedback. |
| `shareStatus` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Share button feedback. |
| `controls.canShare` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Disable share button when no caption. |
| `controls.hasShareImage` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226` | Decide image-share path visibility. |

### Callback signature candidates

| Callback | Current source | Candidate replacement |
|---|---|---|
| `onKeywordClick(keyword, replacement)` | Factory callback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-137` | Direct call to `core.result.replaceKeyword(keyword, replacement)` or injected `replaceKeyword`. |
| `onSave(caption)` | Factory callback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:139-143` | Direct call to `core.result.saveCaption()` or injected save action. |
| `onShare(caption)` | Factory callback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:144-151` | Direct call to `core.result.shareCaption()` or injected share action. |
| Copy button | Component direct clipboard at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:243` | Direct call to `core.result.copyCaption()` or injected copy action. |

### Constructor signature candidates

| Candidate | Construction site | Impact |
|---|---|---|
| `new ResultViewer({ core })` | Current lazy factory at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-153` | Component can call result/input store surfaces. |
| `new ResultViewer({ result })` | Core result wired at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:101-109` | Narrow controller dependency. |
| `new ResultViewer({ getViewModel, copyCaption, shareCaption, saveCaption, replaceKeyword })` | Instruction row maps ResultViewer to injected actions at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:673` | DOM-only callbacks. |

### Boundary check

| Category | After-conversion import status |
|---|---|
| Direct clipboard | Decision #7 determines whether `navigator.clipboard` and `execCommand` remain in UI; instruction specifically mentions fallback stays UI layer at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:692`. |
| Must not import | `StateManager` and service share path; components should use callbacks/view models per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:655-660`. |
| ShareService | Slice 4 dynamic import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:144` can map to result controller/sharePort path at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:142-164`. |
| Toast | Direct `showToast` import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1` maps to toastPresenter or copy/share VM statuses. |

## 9. createDomApp.js 변경 영향

### Component construction impact

| Component | Current construction | Slice 5 injection candidates |
|---|---|---|
| AuthModal | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:72` | `{ core }`, `{ auth }`, or `{ onGoogleLogin, getAuthViewModel }`. |
| PermissionModal | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:70` | `{ core }`, `{ permissions }`, or permission callbacks/VM. |
| HomeManager | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:77-87` | `{ core }`, `{ home }`, or explicit home actions/VM. |
| MyPageManager | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:100-108` | Replace `getCurrentUser: () => window.__recocoCurrentUser` with auth/account VM path. |
| NoticeManager | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:110` | Inject notifications VM/actions. |
| ReportManager | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:100-104` | Inject report load/VM. |
| InputManager | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:111` | Inject input methods/VM. |
| ResultViewer | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-153` | Replace legacy callbacks with result controller methods/VM. |

### Callback removals and replacements

| Current callback | Current line | Replacement surface |
|---|---|---|
| Home `onPreciousClick` wrapper | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:79-86` | `core.home.markPrecious()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:193-211`. |
| Permission resolved load | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:90-96` | Decision #5; HomeController permission reactor exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:477-499`. |
| Result keyword callback | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-137` | `core.result.replaceKeyword()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:84-97`. |
| Result save callback | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:139-143` | `core.result.saveCaption()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:99-106`. |
| Result share dynamic import | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:144-151` | `core.result.shareCaption()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:142-164`. |

### ShareService dynamic import removal facts

| Fact | Citation |
|---|---|
| Slice 4 `createDomApp` dynamically imports ShareService. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:144` |
| ResultController already contains share flow and chooses image share based on input base64. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:142-164` |
| Slice 3c-2 decision says `result.shareCaption()` reads `store.input.base64`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:329-331` |
| Instruction flags ShareService DOM download helper as risk during conversion. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:801-803` |

### Reactor additions by Decision #4 option

| Option | `createDomApp` change | Source alignment |
|---|---|---|
| A: component self-subscribe | Pass `core.store` or controller/VM to each component. | Store subscribe API at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:168-176`. |
| B: app-level reactors | Add domain reactors beside auth/global mirror. | Existing auth reactor at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:197-216`; existing mirror reactor at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:221-229`. |
| C: navigation render only | Keep `domRouterAdapter.renderManager()` on route change. | Router render source at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:75-87`. |

### Destroy/unsubscribe impact

| Current cleanup | Source | Slice 5 impact |
|---|---|---|
| `unsubscribers` array returned by `createDomApp`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:197-243` | Any new reactor must push unsubscribe into same cleanup path. |
| `destroy()` runs all unsubscribers and router cleanup. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:235-243` | Validation should confirm all domain subscriptions release. |

## 10. Store schema 변경 (필요 시 0)

### Existing nine domains

| Domain | Source |
|---|---|
| `auth` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:31` |
| `permissions` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:32-40` |
| `notifications` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:41` |
| `navigation` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:42` |
| `home` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:43-51` |
| `input` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:52-60` |
| `result` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:61-67` |
| `report` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:68` |
| `account` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:69-74` |

### Coverage check by component

| Component | Existing domain coverage | Potential local-only state |
|---|---|---|
| AuthModal | `auth` VM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:199-215` covers status/user/error. | Modal DOM open animation can remain local. |
| PermissionModal | `permissions` VM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:159-185` covers prompt/check/request states. | Modal open/close animation can remain local or reactor-controlled. |
| HomeManager | `home` VM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:397-399` covers curation data. | Card animation state can remain local. |
| MyPageManager | `account`, `auth`, `notifications` VMs cover profile/delete/logout/notice state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:167-183`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:199-215`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172`. | Confirmation modal open state can remain local. |
| NoticeManager | `notifications` VM covers enabled/status/error/storageKey at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:161-172`. | Toggle animation local. |
| ReportManager | `report` VM covers stats and loading at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:135-178`. | SVG hover state local. |
| InputManager/DropZone | `input` VM covers image/text/processing/error at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:121-138`. | Drag hover state local. |
| ResultViewer | `result` VM covers caption segments/status/controls at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:189-226`. | Popover/modal open state local unless existing DOM requires cross-route persistence. |

### Store schema change candidates

| Candidate key | Reason it might be requested | Alternative with existing state |
|---|---|---|
| `ui.modals.permissionOpen` | Permission modal open/close can be derived from permission status. | Use `permissions.photo.shouldPrompt` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:159-185` plus DOM-local transition. |
| `ui.modals.withdrawalOpen` | MyPage withdrawal confirmation flow. | Keep modal visibility local and store only withdrawal reason/confirmed via account controller at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:107-116`. |
| `result.keywordPopover` | Keyword replacement UI state. | Keep selected keyword/popover local; persist caption changes through `replaceKeyword()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:84-97`. |
| `home.cardAnimation` | Swipe/transition state. | Keep animation local; persist actual index/actions through home controller methods at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:175-282`. |

### Schema-change fact boundary

| Fact | Citation |
|---|---|
| `createRecocoCore` wires nine controllers only. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:39-132` |
| Initial store is created with nine domains. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-75` |
| Slice 5 out-of-scope includes store schema change in user request. | This document preserves that as a mapping fact and exposes gaps as candidates only. |

## 11. Boundary scan 사후 예측

### Current matching lines at slice 5 start

| Current match | Absorption section |
|---|---|
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:7` `../services/supabase.js` | §1 AuthModal |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:8` `@capacitor/browser` | §1 AuthModal |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:9` `@capacitor/core` | §1 AuthModal |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:7` `@capacitor/core` | §2 PermissionModal |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:8` `RecocolPhotos` | §2 PermissionModal |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:7` `../services/supabase.js` | §3 HomeManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:8` `../services/PhotoService.js` | §3 HomeManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:1` `PhotoService` | §3 HomeManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:1` `PhotoService` | §3 HomeManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:1` `PhotoService` | §3 HomeManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:2` `GeminiService` | §3 HomeManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:1` `PhotoService` | §3 HomeManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:6` `../services/supabase.js` | §4 MyPageManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:9` `NotificationService` | §4 MyPageManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:5` `NotificationService` | §5 NoticeManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:6` `../services/supabase.js` | §6 ReportManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:7` `../state/StateManager.js` | §7 InputManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:6` `../processors/ImageProcessor.js` | §7 InputManager |
| `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1` `showToast` from errorHandler | §8 ResultViewer, residual option because scan command does not include `errorHandler`. |

### Legacy StateManager method trace

| Method | Definition | Current call sites | Mapping |
|---|---|---|---|
| `getState(key)` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:35-40` | Result bridge reads `currentResult` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-126`; share bridge reads `base64` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:145`. | `core.result.getViewModel()` and `core.input.getInputData()` / result controller share flow. |
| `setState(key, value)` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:47-53` | InputManager writes image data at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:71-73`, clears at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:109-111`, and sets preview at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:130-132`. | `core.input.processFile()`, `core.input.reset()`, and `core.input.setPreviewImage()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:57-108`. |
| `setResult(result)` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:97-99` | Result bridge writes updated caption/currentResult at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:127-134`. | `core.result.setResult()` and `core.result.replaceKeyword()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:74-97`. |
| `checkAndResetDaily()` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:142-158` | New bootstrap keeps daily reset at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:42`. | Slice 4 Decision #5A keeps this `main.js` exception at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:365`. |
| `_notifyListeners()` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:135-137` | Called by `setState()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:47-53`. | Instruction flags no-op listener risk at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:803-804`. |

### Expected post-conversion scan

| Command | Expected result | Source rule |
|---|---|---|
| `rg -n "@supabase\|@capacitor\|RecocolPhotos\|PhotoService\|GeminiService\|NotificationService\|StatsService\|StateManager\|ImageProcessor" src/components` | 0 matches after slice 5 component conversion. | Forbidden imports list at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. |
| `rg -n "errorHandler\|showToast" src/components` | Decision-dependent residual: ResultViewer fallback/status may remain or route through toastPresenter. | Toast compatibility risk at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:805-806`; toastPresenter source at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:10-22`. |
| `rg -n "ShareService" src/ui/dom src/components` | 0 if ResultViewer share uses controller/sharePort. | Current dynamic import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:144`; core replacement at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:142-164`. |

### Residual possibilities

| Residual | Why it can remain | Decision link |
|---|---|---|
| `navigator.clipboard` / `document.execCommand` in ResultViewer | Instruction states DOM fallback can stay UI layer at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:692`. | Decision #7 |
| `window.__recocoCurrentUser` in createDomApp | Slice 4 mirror remains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:221-229`. | Decision #2 from slice 4 |
| `legacyStore.checkAndResetDaily()` in main.js | Slice 4 daily reset kept at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:42`. | Decision #2 / slice 3c-1 daily reset |
| Component local DOM state | Not platform/service boundary. | Store schema §10 candidates |

## 12. Validation strategy

### Automated checks

| Check | Command | Expected result |
|---|---|---|
| Build | `npm run build` | Exit 0. |
| Core purity scan | `rg -n "document\|window\|localStorage\|sessionStorage\|navigator\|fetch\\(\|supabase\|@capacitor\|RecocolPhotos" packages/core/src -g '!contracts/ports.js'` | 0 matches outside allowed contracts/adapters. |
| Component boundary scan | `rg -n "@supabase\|@capacitor\|RecocolPhotos\|PhotoService\|GeminiService\|NotificationService\|StatsService\|StateManager\|ImageProcessor" src/components` | 0 matches after conversion. |
| DOM toast boundary | `rg -n "showToast\|handleError" src/components src/ui/dom` | Matches only if routed through `src/ui/dom/toastPresenter.js` or explicit Decision #7 fallback. |
| ShareService cleanup | `rg -n "ShareService" src/components src/ui/dom` | 0 if `core.result.shareCaption()` fully replaces dynamic import. |

### Manual smoke scenarios from instruction §11

| Scenario | Instruction source | Slice 5 focus |
|---|---|---|
| Cold boot with no session opens login/onboarding. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | AuthModal reads auth VM and no direct Supabase. |
| OAuth on web redirects through Supabase. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | AuthModal calls `core.auth.startGoogleOAuth()`. |
| OAuth on native opens Browser and handles appUrlOpen. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | No component Capacitor/Browser import. |
| Signed-in boot navigates home. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | Auth reactor remains single route trigger. |
| Permission allow loads daily curation. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | PermissionModal + HomeController dedupe. |
| Precious click records action once. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | `core.home.markPrecious()` only. |
| Delete confirm deletes once and advances UI. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | `core.home.deleteCurrent()` only. |
| Withdrawal deletes account, signs out, clears storage once. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | `core.account.deleteAccount()` only. |
| Notice toggle schedules/cancels once and persists same key. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | `core.notifications.setEnabled()` only. |
| Input image processing feeds result/share image. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | `core.input.processFile()` populates `input.base64`. |
| Result copy/share/save/keyword replacement works. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` | `core.result.copyCaption/shareCaption/saveCaption/replaceKeyword()`. |

### Multi-fire guard counters

| Counter | Expected per user action | Current duplicate sources |
|---|---|---|
| `photoService.fetchDailyCuration` / `photoPort.fetchDailyCuration` | 1 per permission allow. | Legacy load at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:74`; controller load at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:103-133`. |
| `recordCurationAction({ action: 'recorded' })` | 1 per precious click. | Slice 4 wrapper at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:79-86`; controller mark at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:193-211`. |
| `deletePhoto` | 1 per delete confirm. | Legacy delete at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12`; controller delete at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:213-252`. |
| Delete-account fetch/port call | 1 per withdrawal confirm. | Legacy fetch at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:311-315`; controller accountPort at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:130-134`. |
| `scheduleDailyNotification` | 1 per notice toggle ON. | Legacy schedule at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:106`; controller schedule at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:118-124`. |

### Reactor leak validation

| Check | Source |
|---|---|
| Every `core.store.subscribe()` from `createDomApp` is pushed into cleanup. | Current unsubscribers pattern at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:197-243`. |
| Component self-subscriptions expose `destroy()` or return unsubscribe. | Store subscribe returns unsubscribe at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:168-176`. |
| Router cleanup still runs. | `routerAdapter.destroy()` is called in createDomApp cleanup at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:235-243`. |

## 13. Known risks

| Risk | Source fact | Slice 5 mapping impact |
|---|---|---|
| Legacy StateManager `_notifyListeners` placeholder dependency can survive indirectly. | Instruction lists StateManager no-op notify as known risk at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:803-804`; InputManager imports StateManager at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:7`; createDomApp uses legacyStore for ResultViewer at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:112-137`. | Decision #2 governs whether any component or createDomApp ResultViewer bridge keeps legacy state. |
| `window.__recocoCurrentUser` mirror reactor remains after slice 4. | Mirror reactor source at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:221-229`; slice 4 decision #2C at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:362`. | MyPage/Report `getCurrentUser` can move to auth/account VM; mirror cleanup timing remains separate. |
| `window.__bootErrors` boot global cleanup timing. | Boot globals are set in `main.js` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:20-21`. | Component conversion does not require boot global removal. |
| HomeManager instance state vs store single truth race. | Slice 4 permission callback reads `homeManager.photos` and `homeManager.isLoading` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:90-96`; HomeController owns store-driven VM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:397-399`. | Duplicate load/consume risks remain until Home legacy state reads are replaced. |
| ShareService static/dynamic import warning path. | Current dynamic import in `createDomApp` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:144`; instruction risk mentions ShareService DOM helper at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:801-803`. | ResultController share path can remove `createDomApp` dynamic import if sharePort preserves DOM behavior. |
| Toast duplication during component conversion. | Components and runtimes import `showToast` directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:10`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:6`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:2`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:2`; toastPresenter subscribes core errors at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:33-64`. | Direct toast and controller error toast can duplicate if both remain active. |
| Permission modal/native permission double fire. | Legacy modal direct calls at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:48` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:141`; controller calls port at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:74-145`. | Decision #5 controls whether modal or app reactor owns transition. |
| Notice toggle double schedule/cancel. | Legacy schedule/cancel at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:106-108`; controller schedule/cancel at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:118-128`. | Conversion must remove one caller per toggle path. |
| Report date logic drift during migration. | Component currently computes date windows at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:41-42` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-159`; controller uses injected clock at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:97-125`. | Data math belongs to controller; DOM graph remains view-only. |
| Missing `setMeaning` / `setTags` controller aliases. | InputController only exposes `setTextFields` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:76-81`; core factory wires input controller without aliases at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:93-99`. | Mapping uses existing method or requires a surfaced decision outside this document. |

## 14. Decision Log (2026-05-10, slice 5 implementation)

| # | Decision | Selected | Rationale |
| --- | --- | --- | --- |
| 1 | Component conversion order | **A** (low-risk first → Home last) | Aligns with instruction §9 step 6-7 ordering. Destructive paths (delete/markPrecious) deferred to last sub-slice. |
| 2 | Legacy StateManager residual | **A** (only `main.js` daily reset) | Removes all component imports of `../state/StateManager.js` and the createDomApp legacyStore bridge. Daily reset stays per slice 4 #5A. |
| 3 | Component construction site | **C** (component + `{ core }` arg) | No new wrapper directory; `new X(id, { core })` minimal change. Layout in instruction §2 unchanged. |
| 4 | View model rendering trigger | **B** (createDomApp domain reactor → manager.render) | Single source of truth. Components remain passive view; store changes outside navigation also trigger render. Components may also self-subscribe for narrow domain when convenient. |
| 5 | PermissionModal permission-resolved | **C** (HomeController owns load; createDomApp closes modal only) | `createHomeController.js:477-499` already subscribes false→true and calls `loadDailyCuration()`. Slice 4 wrapper line `createDomApp.js:90-96` is removed in 5e (when HomeManager itself migrates). |
| 6 | NoticeManager storage | **B** (VM read + `setEnabled` only) | Direct `localStorage` calls removed. Controller owns storage key lifecycle. |
| 7 | ResultViewer clipboard fallback | **C** (move fallback into clipboardPort adapter) | ResultViewer becomes DOM-only. `execCommand('copy')` lives in adapter layer; component calls `core.result.copyCaption()` only. |
| 8 | Test/smoke strategy | **C** (instrumentation counters + manual smoke) | Multi-fire guard for 4 destructive paths (daily load / delete / markPrecious / consumePhoto / scheduleDailyNotification / deleteAccount). |

### Sub-slice plan (5a → 5e)

| Sub-slice | Components | Boundary matches removed | Risk | Note |
|---|---|---|---|---|
| **5a** | AuthModal, NoticeManager | 4 (Auth 3 + Notice 1) | low | First conversion. PermissionModal moved to 5e because of strong coupling to HomeController permission reactor. |
| **5b** | ReportManager, MyPageManager | 3 (Report 1 + MyPage 2) | low | Read-flows + delete-account single-owner switch. |
| **5c** | InputManager + DropZone | 2 | mid | Severs InputManager↔legacy StateManager + DropZone↔ImageProcessor. May surface `setMeaning`/`setTags` decision (alias vs. direct `setTextFields`). |
| **5d** | ResultViewer + createDomApp legacy bridge cleanup | 1 (Result `showToast`) + 4 bridge lines (`:112-137`, `:139-151`) | mid | Decision #7C requires clipboardPort adapter update. ShareService dynamic import removed. |
| **5e** | HomeManager + 4 home runtimes + PermissionModal | 8 (Home 6 + Permission 2) | high | Highest risk per instruction §13 (`homeImageRuntime` split). PermissionModal moved here so reactor owner switch (Decision #5C) and HomeManager photo-load owner switch happen in same patch — avoids transitional double-fetch. |

### Slice 5a scope (this commit)

- Convert `src/components/AuthModal.js`: remove `supabase`, `@capacitor/browser`, `@capacitor/core`, direct `showToast`. Accept `{ core }`. Button → `core.auth.startGoogleOAuth()`. Auth error toast surfaces through `createDomApp` toastPresenter subscription (slice 4 already wired).
- Convert `src/components/NoticeManager.js`: remove `NotificationService` direct functions, direct `localStorage`, direct `showToast`. Accept `{ core }`. Toggle → `core.notifications.setEnabled(boolean)`. Initial state from `core.notifications.getViewModel().enabled`. Permission-denied toast read from VM status. Back button → `core.navigation.navigate('mypage')` (replaces `dispatchEvent('nav-change')`).
- Update `src/ui/dom/createDomApp.js`: pass `{ core }` to AuthModal + NoticeManager construction.

### Slice 5b execution (this commit)

- Convert `src/components/ReportManager.js`: remove `supabase` direct import + 14-day Date math + Monday-start aggregation. Constructor accepts `{ core }`. `render()` calls `core.report.load()` then reads `getViewModel()`. `todayUiIdx` consumed from VM (no `new Date()` in component except docstring example).
- Convert `src/components/MyPageManager.js`: remove `supabase` / `API_CONFIG` / `handleError` / `NotificationService` direct imports + direct `localStorage.clear()` + direct `sessionStorage.clear()` + direct `fetch(...delete-account)`. Constructor accepts `{ core, onLogout }`. Profile read from `core.account.getViewModel().profile` with `core.auth.getViewModel().user` fallback. Logout → `core.account.logout()`. Withdrawal → `setWithdrawalReason` + `setWithdrawalConfirmed` + `deleteAccount()`. Farewell view triggered by `core.store.subscribe` watching `account.status === 'deleted'`. Toast routed through `toastPresenter`. Back/notice nav via `core.navigation.navigate(...)`.
- Update `src/ui/dom/createDomApp.js`: ReportManager + MyPageManager factories now pass `{ core }` instead of `getCurrentUser` callback. (Slice 5e will remove the `window.__recocoCurrentUser` mirror reactor.)

### Slice 5c execution (this commit)

- Convert `src/components/DropZone.js`: remove `ImageProcessor` import + `new ImageProcessor()` construction + private `imageProcessor` field. Constructor accepts `{ core }`. `_handleFile(file)` calls `core.input.processFile(file)` and uses returned payload for `setPreview` + `showMetadata`. `onError` callback retained as DOM-side hook.
- Convert `src/components/InputManager.js`: remove `store` import from `../state/StateManager.js`. Constructor accepts `{ core }`. DropZone constructed with `{ core }` instead of `onFileLoaded` callback (controller writes store directly). Meaning/tags textareas wire `oninput` → `core.input.setTextFields({ meaning })` / `setTextFields({ tags })` (Decision: use existing `setTextFields` rather than adding `setMeaning`/`setTags` aliases). `getInputData()` and `setPreviewImage()` route through `core.input` with DOM fallback.
- Update `src/ui/dom/createDomApp.js`: InputManager factory now passes `{ core }`.

### Slice 5d execution (this commit)

- Convert `src/components/ResultViewer.js`: remove `showToast`/`ErrorLevel` direct import + `navigator.clipboard.writeText` + `_copyFallback` (`document.execCommand('copy')`). Constructor accepts `{ core, onKeywordSelected }`. Caption render driven by `core.result.getViewModel().captionSegments` (controller computes keyword highlight). Edit mode → `core.result.enterEditMode()` / `exitEditMode(text)`. Copy → `core.result.copyCaption()`. Share → `core.result.shareCaption()`. Copy-success toast triggered by `vm.copyStatus === 'copied'` transition (store subscribe). Toast routes through `toastPresenter`.
- Update `src/adapters/clipboard/clipboardPort.js` (Decision #7C): absorb `execCommand('copy')` fallback. Web branch tries `navigator.clipboard.writeText` first; on failure (missing permission, older browsers) falls back to hidden textarea + `document.execCommand`. ResultViewer no longer needs clipboard fallback.
- Rewrite `src/ui/dom/createDomApp.js` ResultViewer factory: remove all `legacyStore.getState/setResult` reads/writes (`onSave`, `onKeywordClick` legacy bridge), remove `ShareService` dynamic import, remove `handleError`/`showToast` direct imports. New `onKeywordSelected(word)` callback fetches synonyms via `core.result.loadSynonyms(word)` then renders `SuggestionModal`; on selection calls `core.result.replaceKeyword({ originalWord, suggestion })` and triggers re-render. Toast uses `presentToast`.
- Net result: `createDomApp.js` no longer imports legacy `StateManager` / `errorHandler.handleError` / `ShareService`. ShareService static + dynamic import warning eliminated from vite build (only static import via `createAppPorts.js` remains).

### Slice 5e execution (this commit)

- Convert `src/components/PermissionModal.js`: remove `@capacitor/core` + `RecocolPhotos` direct imports + 2500ms safety timeout (controller owns it). Constructor accepts `{ core }`. `checkAndOpen()` → `core.permissions.checkPhotoPermission()` then opens modal based on `vm.shouldPrompt`. Allow → `core.permissions.requestPhotoPermission()`. Skip → `core.permissions.skipPhotoPermission()`. `onPermissionResolved` callback removed (HomeController permission false→true subscriber owns the load trigger per Decision #5C). Modal subscribes to `store.permissions.photo` to auto-close when authorized.
- Rewrite `src/components/HomeManager.js`: remove `supabase` + `photoService` + 4 home runtime imports. Constructor accepts `{ core, confirmModal }`. All business logic now flows through `core.home.*` (loadDailyCuration / movePrevious / moveNext / markPrecious / deleteCurrent / ensureVisibleImages / analyzeVisiblePhotos / getViewModel). DOM-only: HTML render from VM, carousel snap inlined. Subscribes to `store.home` for auto re-render. Profile name from `vm.profileName`. Backwards-compat getters (`photos`, `isLoading`) wired to VM. Click handlers: precious → `markPrecious`, thanks → `confirmModal` then `deleteCurrent`, prev/next → `movePrevious`/`moveNext`, retry → `loadDailyCuration`.
- Delete `src/components/home/` directory and 4 runtime files (`homeLoadRuntime.js`, `homeDeleteRuntime.js`, `homeImageRuntime.js`, `homeRefillRuntime.js`). All four were imported only by `HomeManager.js` and are now dead code.
- Update `src/ui/dom/createDomApp.js`:
  - Pass `{ core }` to PermissionModal + HomeManager constructors.
  - Remove `onPreciousClick` wrapper (HomeManager → `core.home.markPrecious()` directly).
  - Remove `permissionModal.onPermissionResolved` bridge (HomeController owns load trigger).
  - Remove `window.__recocoCurrentUser` mirror reactor (no converted component reads it; only legacy doc references remain).
- Remove `window.__recocoCurrentUser = null;` declaration from `main.js` bootstrap.
- (Decision #7C deferred from 5d) clipboardPort already absorbs `execCommand` fallback.

### Final slice 5 verification

| Check | Result |
| --- | --- |
| `npm run build` | ✅ exit 0 (325.28 kB gzipped 87.63 kB; ~10 kB smaller after home runtime removal) |
| `rg -n "supabase\|@capacitor\|RecocolPhotos\|PhotoService\|GeminiService\|NotificationService\|StatsService\|StateManager\|ImageProcessor" src/components` | ✅ 0 matches |
| `rg -n "...same..." src/ui/dom` | ✅ 0 matches (JSDoc constraint statement only) |
| Core purity scan (`packages/core/src` minus `contracts/ports.js`) | ✅ 0 matches |
| `window.__recocoCurrentUser` runtime references | ✅ 0 (only JSDoc/comment references remain in `supabaseAuthPort.js` and `createDomApp.js` historical notes) |
| `src/components/home/` directory | ✅ removed (4 runtime files deleted) |
| ShareService dynamic+static import warning | ✅ eliminated |
| `git diff --check` | ✅ 0 |

### Slice 5 summary

- **Files changed**: 8 components rewritten (AuthModal, NoticeManager, ReportManager, MyPageManager, InputManager, DropZone, ResultViewer, HomeManager, PermissionModal), 1 adapter updated (clipboardPort with execCommand fallback), 1 composition root rewritten (createDomApp), 1 main bootstrap simplified.
- **Files deleted**: 4 home runtime files + parent `src/components/home/` directory.
- **Build size**: 337.70 kB → 325.28 kB (-12 kB; -3.6%).
- **Net component → core controller couplings**: 8 components × controllers (auth/permissions/notifications/account/home/input/result/report) all use `{ core }` injection.
- **Legacy holdovers retained**: `legacyStore.checkAndResetDaily()` in `main.js` (Decision #5A from slice 4), boot global `window.__bootErrors`.

## 15. Decision Log addendum — Slice 6 cleanup (2026-05-11)

Slice 6 closes the High/Medium items surfaced by `docs/refactor/headless-core-final-review.md` §13. No new architectural decisions; only follow-ups on prior slice decisions.

| # | Finding | Resolution |
|---|---|---|
| H1 | `createDomApp.destroy()` did not call component-side `destroy()` (subscription leak). | `createDomApp.destroy()` now drains eager modals + home + lazy managers + modals and calls `destroy()` when present, then drains the teardown stack. |
| H2 | `window.__bootErrors` was mutated outside `main.js` by `createDomApp.safeInit`. | `createDomApp` now accepts a `bootErrors` object via `deps`; `main.js` owns the `window.__bootErrors` declaration and passes the same object in. `createDomApp` touches no `window.*`. |
| H3 | Clipboard fallback location drifted between slice-5 #7C and instruction §8. | Instruction §8 patched to reflect the adapter-owned fallback decision; `clipboardPort` doc-comment was already aligned. |
| M1 | Slice-5 #4B (createDomApp domain reactors) is observed as hybrid: `createDomApp` owns auth/toast subscriptions, while Home/Permission/MyPage/Result self-subscribe for their own slices. | Recorded as accepted hybrid: createDomApp reactors handle cross-domain UI effects (auth → navigate/permission/modal open-close, error toast surface); component self-subscriptions handle their own re-render. `createDomApp.destroy()` cascade (H1) keeps cleanup correct in both directions. |
| M2 | `src/services/Router.js` was dead after slice 4 `domRouterAdapter`. | Deleted. No live import path remained. |
| M3 | `StateManager` / `store` were re-exported from legacy `src/index.js` even though only `main.js` uses them. | Removed from `src/index.js`. `main.js` keeps the direct import for `legacyStore.checkAndResetDaily()` per slice-4 decision #5A. |
| M4 | `SettingsModal` factory + import + class were retained without a caller. | Class removed from `Modal.js`; createDomApp lazy factory and `lazyModals.settingsModal` removed; `src/index.js` export removed. |
| M5 | Toast subscription only covered `auth` + `notifications`. | `subscribeCoreErrors` now subscribes to all eight error-bearing controller domains (`auth`, `permissions`, `notifications`, `account`, `home`, `input`, `result`, `report`). |
| L | `dispatchNavChange` helper, `window.supabaseInstance`, legacy `src/index.js` non-state exports, `src/services/*` legacy files. | Deferred. `dispatchEvent('nav-change')` emit count in `src/` is 0 (verified), so the helper/listener act as compat-only no-ops. Other items remain adapter-internal and do not break boundary scans. |
