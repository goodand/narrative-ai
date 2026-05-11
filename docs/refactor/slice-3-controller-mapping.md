# Slice 3 Controller Mapping

Audit date: 2026-05-09

Scope: AuthController, PermissionController, NavigationController only. This is a controller mapping document for Slice 3a implementation planning; it does not implement controller code.

Reference docs:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:163-193` - core public API and forbidden core imports.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:356-382` - Auth controller contract.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:384-401` - Permission controller contract.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:585-614` - Navigation controller and `domRouterAdapter.js` split.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:616-635` - `normalizeError` helper.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:12-35` - Auth/App/Browser port contracts.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:48-62` - Photo permission methods through PhotoPort.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:16-27` - previous adapter decisions.

## 0. Decisions To Surface

The following five items are intentionally not decided in this document. The table reports source alignment and prior-doc alignment only.

| # | Question | Option A | Option B | Source alignment | Existing doc alignment |
| --- | --- | --- | --- | --- | --- |
| 1 | Does `auth.init()` call `navigation.navigate(...)` directly? | AuthController directly calls NavigationController, e.g. `navigation.navigate('home')` after signed-in restore/state event. | AuthController writes `auth.*` only; `createDomApp.js` or a reactor observes auth state and navigates. | A matches current `main.js` side effect at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:313-319` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:346-357`. | Instruction says main calls `core.auth.init()` and `core.notifications.init(core.navigation)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:665`, but does not specify auth-navigation coupling. |
| 2 | What is the `navigation` argument to `NotificationController.init(navigation)`? | Full NavigationController instance. | Duck-typed `{ navigate(name): void }`. | Current notification service needs only `.navigate('home')` via router at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:115-122`. | Decision #6 already says duck type at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:25`. No conflict. |
| 3 | Does `auth.handleUrl(url)` call `browserPort.close()` itself? | Yes, close browser inside `handleUrl` before parsing tokens/code. | No, a native-auth reaction closes browser around URL handling. | A matches current source at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:76-80`. | Instruction lists Browser open/close inside Auth controller responsibilities at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:358-366`, so A is doc-compatible. |
| 4 | Does `auth.restoreSession()` also process `appPort.getLaunchUrl()`? | `restoreSession()` processes launch URL and then reads session. | `init()` has separate launch URL branch; `restoreSession()` only calls `authPort.getSession()`. | B matches current source: launch URL handled first at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:339-343`. | Instruction lists both launch URL handling and `restoreSession()` but does not bind them at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:356-376`. |
| 5 | How does PermissionController trigger Home curation after permission resolves? | HomeController subscribes to `permissions.photo.authorized` and reacts. | PermissionController directly calls `home.loadDailyCuration()` or equivalent. | B matches current source callback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:147-155`. | Instruction does not specify this cross-controller edge; direct DOM/component coupling should not be preserved blindly. |

## 1. AuthController

**Required methods (instruction section 6 그대로)** -

- `auth.init()`: args none / returns `Promise<void>` / registers auth listeners, restores launch/session state, and prepares OAuth callback handling.
- `auth.startGoogleOAuth()`: args none / returns `Promise<void>` / starts Google OAuth using the exact native/web redirect rule.
- `auth.handleUrl(url)`: args `url: string` / returns `Promise<void>` / parses OAuth deep-link URL and applies token/code session exchange.
- `auth.restoreSession()`: args none / returns `Promise<void>` / reads current auth session and writes canonical auth state.
- `auth.signOut(options)`: args `options?: Object` / returns `Promise<void>` / signs out and writes signed-out auth state.
- `auth.getViewModel()`: args none / returns auth view model / exposes render-safe auth state.

**Port dependencies** -

- `authPort`: `signInWithOAuth`, `setSession`, `exchangeCodeForSession`, `getSession`, `getUser`, `onAuthStateChange`, `signOut` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:12-20`.
- `appPort`: `isNative`, `getLaunchUrl`, `addListener` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:29-33`.
- `browserPort`: `open`, `close` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:23-26`.
- `store`: `get`, `set`, `patch`, `subscribe` behavior from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:124-195`.
- `normalizeError`: pure error object mapping from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:616-635`.
- Non-port config: web redirect origin supplied by app adapter/options because core cannot read `window.location.origin`; instruction source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:379-382`.

**Store writes** -

- `auth.init()`:
  - set `auth.status = 'checking'` before launch/session restore.
  - on successful session restore, set `auth.user`, `auth.session`, `auth.status = 'signed_in'`, `auth.error = null`.
  - on no session, set `auth.user = null`, `auth.session = null`, `auth.status = 'signed_out'`.
  - on init failure, set `auth.status = 'error'` and `auth.error = normalizeError(error, 'auth')`.
- `auth.startGoogleOAuth()`:
  - set `auth.status = 'oauth_starting'` before calling `authPort.signInWithOAuth`.
  - on successful native Browser open or web redirect handoff, set `auth.status = 'oauth_pending'`.
  - on failure, set `auth.status = 'error'` and `auth.error = normalizeError(error, 'auth')`.
- `auth.handleUrl(url)`:
  - if no URL, no state write.
  - after token/code exchange succeeds, state may be updated by `onAuthStateChange`; if not relying on that event, set `auth.status = 'checking'` before exchange and `auth.error = null` after success.
  - on parse/exchange failure, set `auth.status = 'error'` and normalized `auth.error`.
- `auth.restoreSession()`:
  - set `auth.status = 'checking'`; then set signed-in or signed-out fields based on `authPort.getSession()`.
- `auth.signOut(options)`:
  - set `auth.status = 'checking'` or `'signing_out'`; after success set `auth.user = null`, `auth.session = null`, `auth.status = 'signed_out'`, `auth.error = null`.
- Auth state listener:
  - on `SIGNED_IN`, set `auth.user`, `auth.session`, `auth.status = 'signed_in'`, `auth.error = null`.
  - on `SIGNED_OUT`, set `auth.user = null`, `auth.session = null`, `auth.status = 'signed_out'`.

**View model shape** -

```js
{
  user: Object|null,
  session: Object|null,
  status: 'unknown'|'checking'|'oauth_starting'|'oauth_pending'|'signed_in'|'signed_out'|'signing_out'|'error',
  error: { message: string, context: string, code: string|null, cause: Error|string|null }|null,
  isAuthenticated: boolean,
  isChecking: boolean,
  canStartOAuth: boolean
}
```

Rationale: base keys come from initial store state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-31`; normalized error shape comes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:620-635`.

**Init sequence (해당하는 경우)** -

1. Set `auth.status = 'checking'`.
2. Register `authPort.onAuthStateChange(...)` before launch/session restore, matching current top-level listener before `initApp()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:310-324`.
3. Register `appPort.addListener('appUrlOpen', ({ url }) => auth.handleUrl(url))`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:112-114`.
4. Get launch URL with `appPort.getLaunchUrl()`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:339-340`.
5. If launch URL exists, await `auth.handleUrl(launchUrl.url)` before session restore.
6. Await `auth.restoreSession()`.
7. Failure branch: set `auth.status = 'error'`, set normalized `auth.error`; do not toast from controller.
8. Navigation and permission side effects are decision-dependent; see decisions #1 and #5.

**Source mapping** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:72-110` - current `handleUrl`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:112-114` - `appUrlOpen` listener.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:310-324` - auth state listener and signed-in/signed-out reactions.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:333-365` - current boot/session/launch flow.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:30-62` - Google OAuth start.

**Cross-controller couplings** -

- Potentially depends on NavigationController if decision #1 selects direct `navigation.navigate('home')`.
- Potentially invokes PermissionController after signed-in state if the current `permissionModal.checkAndOpen()` behavior is preserved from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:313-319`.
- NotificationController owns app foreground handling from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:117-121`; AuthController should not absorb that listener.

**Smoke validation path** - Boot with no session, expect `auth.status = 'signed_out'`, `auth.user = null`, and no controller toast; then complete OAuth callback and expect signed-in store state.

## 2. PermissionController

**Required methods (instruction section 6 그대로)** -

- `permissions.checkPhotoPermission()`: args none / returns `Promise<void>` / checks native/web photo permission and updates prompt/view state.
- `permissions.requestPhotoPermission()`: args none / returns `Promise<void>` / requests native photo permission and records granted/denied/error result.
- `permissions.skipPhotoPermission()`: args none / returns `void` or `Promise<void>` / records explicit user skip.
- `permissions.getViewModel()`: args none / returns permission view model / exposes render-safe prompt and status fields.

**Port dependencies** -

- `appPort.isNative()`: needed for web/non-native bypass, corresponding to source `Capacitor.isNativePlatform()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:24-33`.
- `photoPort.getPhotoLibraryPermissionStatus()`: source `RecocolPhotos.getPhotoLibraryPermissionStatus()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:46-49`.
- `photoPort.requestPhotoLibraryPermission()`: source `RecocolPhotos.requestPhotoLibraryPermission()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:138-142`.
- `store`: initial permission state from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:32-39`.
- `normalizeError`: pure normalized error writes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:616-635`.

**Store writes** -

- `permissions.checkPhotoPermission()`:
  - set `permissions.photo.checking = true`, `permissions.photo.requesting = false`.
  - web/non-native: set `authorized = true`, `status = 'authorized'`, `reason = 'web_non_native'`, `checking = false`.
  - native authorized: set `authorized = true`, `status = status.status || 'authorized'`, `reason = 'already_authorized'`, `checking = false`.
  - native not authorized: set `authorized = false`, `status = status.status || null`, `reason = 'needs_prompt'`, `checking = false`.
  - timeout at 2500 ms: set `checking = false`, `authorized = false`, `reason = 'timeout_prompt'`; UI decides modal/prompt display.
  - error: set `checking = false`, `authorized = false`, `reason = 'check_error'`, `permissions.photo.error = normalizeError(error, 'permissions')`.
- `permissions.requestPhotoPermission()`:
  - set `requesting = true`.
  - if granted: set `authorized = true`, `status = result.status || 'authorized'`, `reason = 'user_granted'`, `requesting = false`.
  - if denied: set `authorized = false`, `status = result.status || 'denied'`, `reason = 'user_denied'`, `requesting = false`.
  - on request error: set `authorized = false`, preserve known `status`, `reason = 'request_error'`, normalized error, `requesting = false`.
- `permissions.skipPhotoPermission()`:
  - set `authorized = false`, `status = previous status || 'not_requested'`, `reason = 'user_skipped'`, `checking = false`, `requesting = false`.

**View model shape** -

```js
{
  photo: {
    authorized: boolean,
    status: string|null,
    reason: string|null,
    checking: boolean,
    requesting: boolean,
    error: { message: string, context: string, code: string|null, cause: Error|string|null }|null,
    shouldPrompt: boolean,
    canRequest: boolean,
    canSkip: boolean
  }
}
```

Rationale: base fields are already in store at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:32-39`. `error`, `shouldPrompt`, `canRequest`, and `canSkip` are inferred view-model fields because DOM modal opening/closing must leave core, while source previously called `this.open()` and `this.close()` in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:57-66`.

**Init sequence (해당하는 경우)** -

- n/a - instruction section 6 does not define `permissions.init()`.
- `checkPhotoPermission()` is the boot/post-login equivalent of current `permissionModal.checkAndOpen()`:
  1. If `!appPort.isNative()`, write authorized web bypass and return without awaiting native plugin.
  2. Start 2500 ms timeout before awaiting permission status.
  3. Await `photoPort.getPhotoLibraryPermissionStatus()`.
  4. If status resolves before timeout, clear timeout and write authorized or prompt-needed state.
  5. If timeout fires first, write prompt-needed timeout state and ignore late mutation unless explicitly guarded by a request id.
  6. On error before timeout, write prompt-needed error state; do not toast.

**Source mapping** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:18-22` - permission resolution callback payload.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:24-76` - check flow and 2500 ms timeout.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:138-172` - request flow.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:182-191` - skip flow.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:147-155` - current permission-resolved to home-load coupling.

**Cross-controller couplings** -

- AuthController currently triggers permission check after signed-in state via `permissionModal?.checkAndOpen()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:313-319` and after signed-in boot at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:346-357`.
- HomeController load after permission is decision #5; current source directly calls `homeManager.loadRealPhotos()` from a permission callback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:149-152`.
- NavigationController is not required by PermissionController unless a future UX chooses to navigate on permission result.

**Smoke validation path** - Signed-in native boot with denied photo permission should set `permissions.photo.authorized = false`, `reason = 'needs_prompt'` or `'timeout_prompt'`, and leave DOM prompt rendering to the UI adapter.

## 3. NavigationController

**Required methods (instruction section 6 그대로)** -

- `navigation.navigate(viewName, options)`: args `viewName: string`, `options?: Object` / returns `void` / updates route state and history only.
- `navigation.goBack()`: args none / returns `void` / pops history or falls back to home.
- `navigation.getViewModel()`: args none / returns navigation view model / exposes current route, tabs, and history metadata.
- `navigation.subscribe(callback)`: args `callback: Function` / returns unsubscribe / notifies route state changes for DOM adapters/reactors.

**Port dependencies** -

- None. NavigationController is pure core state. It must not import `document`, `window`, DOM components, or Router.
- `store`: writes `navigation.currentView` and `navigation.history` from initial state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:41-42`.
- Optional injected allowed view list can be config, not a port. Default must match instruction allowed views at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:610-614`.

**Store writes** -

- `navigation.navigate(viewName, options)`:
  - validate `viewName` against `home`, `input`, `result`, `report`, `mypage`, `notice`.
  - if `options?.replace === true` or `options?.addToHistory === false`, set `navigation.currentView = viewName` without pushing.
  - otherwise, if `viewName !== currentView`, append to `navigation.history` and set `navigation.currentView`.
  - do not write DOM state such as header display, active tab classes, or scroll position.
- `navigation.goBack()`:
  - if history length > 1, remove current item and set `currentView` to previous item.
  - if history length <= 1, set `currentView = 'home'` and `history = ['home']`.
- `navigation.subscribe(callback)`:
  - can proxy `store.subscribe` and filter changes for `navigation.*`, or maintain a navigation-specific listener set.
  - write no state.

**View model shape** -

```js
{
  currentView: 'home'|'input'|'result'|'report'|'mypage'|'notice',
  history: Array<string>,
  canGoBack: boolean,
  tabs: {
    active: 'home'|'report'|'mypage'|null,
    items: Array<{ name: 'home'|'report'|'mypage', active: boolean }>
  },
  header: {
    visible: boolean,
    title: string
  }
}
```

Rationale: route state is core-owned, while DOM application of header/tab state is adapter-owned. Current Router derives active nav and header title at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:39-47` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:115-118`; view model may expose semantic flags, but `domRouterAdapter.js` owns DOM writes per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:587-599`.

**Init sequence (해당하는 경우)** -

- n/a - instruction section 6 does not define `navigation.init()`.
- Construction sequence:
  1. Read current `navigation` state from store.
  2. Initialize internal subscribers if not using store-level subscriptions directly.
  3. Expose methods and default current view `home`.
  4. Do not trigger initial DOM render directly; `createDomApp.js`/`domRouterAdapter.js` can read `navigation.getViewModel()` and subscribe.

**Source mapping** -

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:5-10` - current route state and manager registry.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:17-23` - current history/currentView writes.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:25-52` - DOM responsibilities to move to `domRouterAdapter.js`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:55-63` - back navigation logic.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:65-118` - tab/header/render DOM responsibilities to move out.

**Cross-controller couplings** -

- AuthController may call `navigation.navigate('home')` if decision #1 chooses direct coupling; otherwise a reactor does it.
- NotificationController receives either NavigationController or duck-typed navigation per decision #2.
- AccountController logout/delete flows may later navigate to onboarding/home, but that is outside Slice 3a.
- PermissionController currently has no route change behavior.

**Smoke validation path** - Call `navigation.navigate('report')`, then `navigation.goBack()`, and expect only `store.navigation.currentView/history` to change while DOM updates happen through `domRouterAdapter.js`.

## Decision Resolutions (Slice 3a)

| # | Resolved option | Rationale |
| --- | --- | --- |
| 1 | **B** — `auth.init()` writes `store.auth.*` only; navigation reaction lives outside the controller (future `createDomApp.js`/reactor). | Keeps controllers pure store-writers. Instruction §6 lists no `navigation` in Auth controller methods. Slice 3a leaves `main.js` unchanged so no runtime regression occurs. |
| 2 | **B** — `NotificationController.init(navigation)` accepts duck-typed `{ navigate(name): void }`. | Confirms slice-2 mapping decision #6 — no new conflict. |
| 3 | **A** — `auth.handleUrl(url)` calls `browserPort.close()` itself (with try/catch swallow, matching `main.js:80`). | Instruction §6 explicitly assigns Browser open/close to Auth controller; cohesion within OAuth callback. |
| 4 | **B** — `auth.restoreSession()` only calls `authPort.getSession()`; `auth.init()` orchestrates launch URL via `appPort.getLaunchUrl()` + `auth.handleUrl(...)` separately. | Keeps `restoreSession()` reusable as a focused "read current session" call (e.g., for future refresh actions). |
| 5 | **A** — `permissions.checkPhotoPermission()` writes `store.permissions.photo.*` only. Home curation reaction subscribes in slice 3c (HomeController). | Decouples permission lifecycle from home; eliminates the current direct `homeManager.loadRealPhotos()` callback coupling. |

Slice 3a controllers are constructed by `createRecocoCore(ports)` and not yet consumed by `main.js` (which keeps direct service imports until slice 5). Behavior changes only occur once `createDomApp.js` is wired in slice 4+/5.
