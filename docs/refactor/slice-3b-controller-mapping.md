# Slice 3b Controller Mapping

Audit date: 2026-05-09

Scope: NotificationController and AccountController only. This document maps controller contracts, dependencies, state writes, source behavior, and open decisions for Slice 3b implementation planning; it does not implement controller code.

Reference docs:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:540-561` - Account controller contract.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:563-583` - Notification controller contract and fixed storage key.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:616-635` - `normalizeError` rules.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:654-675` - component conversion map for MyPage and Notice.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:780-805` - acceptance/risk rules for withdrawal, notifications, and toasts.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:73-84` - NotificationPort and AccountPort typedefs.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:12-20` - AuthPort typedef used by AccountController.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:93-99` - StoragePort typedef used by both controllers.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:16-27` - adapter decisions #6 and #7.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:272-282` - Slice 3a decision resolutions.

## 0. Decisions To Surface

The four items below are intentionally not resolved here. Each row reports source alignment and existing-doc alignment so the Slice 3b implementer can choose without re-reading the whole codebase.

| # | Question | Option A | Option B | Option C | Source alignment | Existing doc alignment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Does `notifications.init(navigation)` own `appPort.addListener('appStateChange', ...)`, or does bootstrap register it and call `handleAppStateChange(...)`? | Internal registration: controller calls `appPort.addListener('appStateChange', ...)` and dispatches to its own handler. | External registration: `createDomApp`/bootstrap registers app foreground listener and calls `notifications.handleAppStateChange({ isActive })`. | n/a | Current source registers the listener at module boot in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:116-121`, outside NoticeManager. Source therefore aligns more closely with B, unless Slice 3b intentionally moves listener ownership into the controller. | Instruction says Notification controller owns foreground reschedule at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:565-580`, while conversion map says `main.js` calls `core.notifications.init(core.navigation)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:665`. Both A and B are doc-compatible, but A centralizes the listed controller responsibility. |
| 2 | Where does `account.hydrateProfile()` get the current user? | Read cached `store.get('auth.user')` only. | Call `authPort.getUser()` for fresh user state. | Cache-first then fallback to `authPort.getUser()`. | Current MyPage uses cache-first plus fallback: `getCurrentUser() || this.user` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:35-38`, then `supabase.auth.getUser()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:41-42`; source aligns with C. | Instruction only says "user hydrate" at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:542-545`. AuthPort exposes `getUser()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:17-18`; all options are possible. |
| 3 | Which signout path does `account.logout()` use? | Call `authPort.signOut()` directly. | Call `AuthController.signOut()`. | n/a | Current source directly calls Supabase auth from MyPage at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:141-150`; source aligns with A. | Slice 3a resolved controllers should write own store slices and avoid cross-controller method calls at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:276-282`; AuthPort has `signOut` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:20`. Existing docs align with A; B conflicts with the locked Slice 3a pattern. |
| 4 | How deep is `notifications.setEnabled(enabled)` responsible? | Controller orchestrates `requestPermission`, `scheduleDailyNotification`, `cancelAll`, `storagePort.setItem('notificationEnabled', ...)`, and store writes. | Controller writes store only; a reactor performs permission/schedule/cancel/storage side effects. | n/a | Current NoticeManager toggle directly requests permission, schedules/cancels, writes `localStorage`, and updates local state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:95-123`; source aligns with A. | Instruction assigns request permission, schedule/cancel, foreground reschedule, and fixed storage key to Notification controller at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:563-583`, and conversion map says NoticeManager calls `setEnabled` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:675`; docs align more strongly with A. |

## 1. NotificationController

**Required methods (instruction section 6 그대로)** -

- `notifications.init(navigation)`: args `navigation: { navigate(viewName: string): void }|Object` / returns `Promise<void>|void` / initializes notification action listener and, if decision #1 selects it, app foreground listener.
- `notifications.loadSetting()`: args none / returns `void` or `Promise<void>` / reads persisted `notificationEnabled` and writes notification state.
- `notifications.setEnabled(enabled)`: args `enabled: boolean` / returns `Promise<void>` / toggles permission, scheduling, persistence, status, and error state.
- `notifications.handleAppStateChange({ isActive })`: args `{ isActive: boolean }` / returns `Promise<void>` / foreground recovery path that reschedules when active and enabled.
- `notifications.getViewModel()`: args none / returns notification view model / exposes render-safe toggle state and status.

**Port dependencies** -

- `notificationPort`: `requestPermission`, `scheduleDailyNotification`, `cancelAll`, `setupActionListener` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:73-79`.
- `storagePort`: `getItem`, `setItem` for the fixed `notificationEnabled` key from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:93-96`.
- `appPort`: optional if decision #1 selects internal foreground listener registration; `addListener('appStateChange', callback)` is defined at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:29-33`.
- `store`: `notifications` slice initialized as `{ enabled: false, status: 'idle', error: null }` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:41`.
- `normalizeError`: every caught error should be normalized before store assignment, per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:616-635`.
- No direct `showToast` dependency; toast ownership remains DOM/UI per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:659` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:800-805`.

**Store writes** -

- `notifications.init(navigation)`:
  - set `notifications.status = 'initializing'` while registering listener(s).
  - call `notificationPort.setupActionListener(navigation)`; on success set `notifications.status = 'idle'` unless a pending operation is active.
  - if listener setup fails, set `notifications.status = 'error'` and `notifications.error = normalizeError(error, 'notifications')`.
- `notifications.loadSetting()`:
  - read `storagePort.getItem('notificationEnabled')`.
  - write `notifications.enabled = value === 'true'`.
  - write `notifications.status = 'idle'` and clear `notifications.error`.
- `notifications.setEnabled(true)`:
  - set `notifications.status = 'requesting_permission'`.
  - call `notificationPort.requestPermission()`.
  - if permission is false, set `notifications.enabled = false`, `notifications.status = 'permission_denied'`, persist `'false'` if decision #4 selects controller persistence, and leave UI toast to DOM.
  - if permission is true, set `notifications.status = 'scheduling'`, call `notificationPort.scheduleDailyNotification()`, persist `'true'`, set `notifications.enabled = true`, and set `notifications.status = 'enabled'`.
- `notifications.setEnabled(false)`:
  - set `notifications.status = 'cancelling'`.
  - call `notificationPort.cancelAll()`.
  - persist `'false'`, set `notifications.enabled = false`, clear error, and set `notifications.status = 'disabled'`.
- `notifications.handleAppStateChange({ isActive })`:
  - if inactive or disabled, no state write except optional status preservation.
  - if active and enabled, set `notifications.status = 'rescheduling'`, call `scheduleDailyNotification()`, then restore `status = 'enabled'` or write normalized error.

**View model shape** -

```js
{
  enabled: boolean,
  status: 'idle'|'initializing'|'requesting_permission'|'permission_denied'|'scheduling'|'enabled'|'cancelling'|'disabled'|'rescheduling'|'error',
  error: { message: string, context: string, code: string|null, cause: Error|string|null }|null,
  storageKey: 'notificationEnabled'
}
```

- `enabled` maps directly to `store.notifications.enabled`.
- `status` maps directly to `store.notifications.status`; the exact string set is inferred from the controller methods because instruction only names methods and responsibilities at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:563-580`.
- `error` must be normalized, not raw, per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:633-635`.
- `storageKey` is a constant exposed for UI/debug clarity only; source and instruction fix it as `notificationEnabled` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:11-12` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:583`.

**Init sequence** -

1. `notifications.init(navigation)` receives a duck-typed object with `navigate(name)`, not necessarily a full NavigationController, per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:25`.
2. Call `notifications.loadSetting()` before any app-active reschedule so `store.notifications.enabled` reflects persisted storage.
3. Call `notificationPort.setupActionListener(navigation)`; source listener calls `router.navigate('home')` when notification action fires at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:115-122`.
4. If decision #1 selects internal listener ownership, call `appPort.addListener('appStateChange', ({ isActive }) => notifications.handleAppStateChange({ isActive }))`.
5. If persisted enabled is true and boot needs immediate schedule parity, call `notificationPort.scheduleDailyNotification()` after load; this preserves source boot behavior at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:352-353`.
6. On any failure, assign normalized error and do not call `showToast`.

**Source mapping** -

- Controller source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:43-53` maps to `notificationPort.requestPermission()` used by `notifications.setEnabled(true)`.
- Controller source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:59-92` maps to schedule step in `setEnabled(true)` and foreground reschedule.
- Controller source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:97-109` maps to `setEnabled(false)`.
- Controller source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:115-122` maps to `notifications.init(navigation)`.
- Controller source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:116-121` maps to `notifications.handleAppStateChange({ isActive })`.
- Controller source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:333-353` maps to boot-time setup action listener and schedule-if-enabled behavior.
- Controller source from NoticeManager constructor: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:9-12` maps only to storage key and initial enabled read.
- Controller source from NoticeManager `_bindEvents`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:95-112` maps to `setEnabled(enabled)` side effects.
- DOM-only NoticeManager source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:15-82` remains Slice 5 UI rendering; the toggle UI rendering is outside Slice 3b.
- DOM-only NoticeManager source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:84-93` remains Slice 5 DOM navigation wiring; core should not dispatch window events.
- DOM-only NoticeManager source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:114-121` remains Slice 5 UI status text rendering.
- Out-of-port source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:27-37` is `checkPermission()`, not present in `NotificationPort` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:73-79`; Slice 3b should not depend on it unless a new decision widens the port.
- Existing import-only fact: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:9` imports notification functions but inspected MyPage code does not call them.

**Cross-controller couplings** -

- `notifications.init(navigation)` depends on a navigation duck type with `navigate(name)`, confirmed by Slice 2 decision #6 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:25` and Slice 3a resolution #2 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:277`.
- NavigationController instance satisfies that duck type, but NotificationController should not call NavigationController-specific methods beyond `navigate('home')`.
- NotificationController reads/writes `store.notifications.*`; it should not write `store.navigation.*` directly.
- AccountController does not depend on NotificationController.
- AuthController is unrelated except for boot order; `main.js` conversion later calls `core.auth.init()` and `core.notifications.init(core.navigation)` separately at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:665`.

**Smoke validation path** - Load setting with `notificationEnabled=true`, call `notifications.init({ navigate })`, trigger `handleAppStateChange({ isActive: true })`, then expect one schedule call, `store.notifications.enabled === true`, and a notification action calling `navigate('home')`.

## 2. AccountController

**Required methods (instruction section 6 그대로)** -

- `account.hydrateProfile()`: args none / returns `Promise<void>` / loads current user profile into account state.
- `account.logout()`: args none / returns `Promise<void>` / signs out and clears auth/account-facing state without calling AuthController directly.
- `account.setWithdrawalReason(reason)`: args `reason: string` / returns `void` / stores selected withdrawal reason.
- `account.setWithdrawalConfirmed(confirmed)`: args `confirmed: boolean` / returns `void` / stores whether destructive delete is confirmed.
- `account.deleteAccount()`: args none / returns `Promise<void>` / posts backend delete-account through AccountPort, signs out, clears local/session storage, and updates account state.
- `account.getViewModel()`: args none / returns account view model / exposes profile, status, withdrawal fields, and normalized error.

**Port dependencies** -

- `accountPort`: `deleteAccount(payload)` only, defined at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:81-84`.
- `authPort`: `getUser()` for profile fallback/user id lookup and `signOut(options?)` for logout/delete flows, defined at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:17-20`.
- `storagePort`: `clearLocal()` and `clearSession()` after delete-account, defined at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:97-98`.
- `store`: `account.profile`, `account.status`, and `account.withdrawal` are initialized at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:60-64`.
- `store`: `auth.user`, `auth.session`, and `auth.status` are initialized at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:31`, and AccountController may write them on direct signout to preserve cross-controller decoupling.
- `normalizeError`: errors are stored normalized only, per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:616-635`.

**Store writes** -

- `account.hydrateProfile()`:
  - set `account.status = 'hydrating'`.
  - choose user source according to decision #2.
  - on success set `account.profile = user || null`, set `account.status = 'idle'`, and clear account error.
  - on failure set `account.status = 'error'` and `account.error = normalizeError(error, 'account')`; store currently lacks `account.error`, so implementation must either add it in Slice 3b patch or use agreed extension.
- `account.logout()`:
  - set `account.status = 'logging_out'`.
  - call `authPort.signOut()` directly if decision #3 follows existing doc alignment.
  - set `auth.user = null`, `auth.session = null`, `auth.status = 'signed_out'`, `account.profile = null`, `account.status = 'logged_out'`, and clear account error.
- `account.setWithdrawalReason(reason)`:
  - set `account.withdrawal.reason = reason || 'not_specified'`.
- `account.setWithdrawalConfirmed(confirmed)`:
  - set `account.withdrawal.confirmed = Boolean(confirmed)`.
- `account.deleteAccount()`:
  - set `account.status = 'deleting'`.
  - read user id from `account.profile?.id`, then `store.auth.user?.id`, then `authPort.getUser()` fallback if decision #2/C-style behavior is preserved.
  - call `accountPort.deleteAccount({ user_id: userId, reason })` when `userId` exists.
  - call `authPort.signOut({ scope: 'global' })` directly, then `storagePort.clearLocal()` and `storagePort.clearSession()` directly, per Slice 2 decision #7.
  - set `account.status = 'deleted'`, `account.profile = null`, reset `account.withdrawal`, and set auth state to signed out.
  - on failure set `account.status = 'error'` and `account.error = normalizeError(error, 'account')`; controller must not render farewell UI or toast.

**View model shape** -

```js
{
  profile: Object|null,
  status: 'idle'|'hydrating'|'logging_out'|'logged_out'|'deleting'|'deleted'|'error',
  withdrawal: {
    reason: string,
    confirmed: boolean
  },
  error: { message: string, context: string, code: string|null, cause: Error|string|null }|null,
  canDelete: boolean
}
```

- `profile` maps to `store.account.profile`.
- `status` maps to `store.account.status`; exact states are inferred because instruction lists responsibilities but not status enum at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:540-560`.
- `withdrawal` maps to `store.account.withdrawal` initialized at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:60-64`.
- `error` requires a store extension because current initial account slice has no `error` key at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:60-64`, while global controller error rules require normalized domain errors at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:618-635`.
- `canDelete = Boolean(withdrawal.confirmed)` mirrors UI enablement from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:264-274`.

**Init sequence** -

1. There is no required `account.init()` method in instruction; account initialization is lazy through `account.hydrateProfile()` when MyPage renders.
2. `hydrateProfile()` starts by setting loading/hydrating state, matching MyPage setting `isHydratingUser = true` before rendering at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:29-33`.
3. Read cached user and/or fresh user according to decision #2; source uses cache-first then Supabase fallback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:35-42`.
4. Write profile and reset status; do not render shell from controller.
5. `logout()` and `deleteAccount()` are user-triggered flows, not boot flows.
6. `deleteAccount()` should keep DOM modal/farewell rendering outside core; the DOM owner can react to `account.status === 'deleted'`.

**Source mapping** -

- MyPageManager `constructor`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:12-19` mixes DOM container/options with account state; controller owns user/status fields, DOM remains Slice 5.
- MyPageManager `render`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:24-27` calls shell render plus hydrate; controller owns `hydrateProfile()`, DOM render remains Slice 5.
- MyPageManager `_hydrateUser`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:29-50` maps to `account.hydrateProfile()`, except `_renderShell()` calls are DOM-only.
- MyPageManager `_renderShell`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:52-121` is Slice 5 DOM rendering, using future `account.getViewModel()`.
- MyPageManager `_bindEvents`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:123-156` splits into DOM navigation wiring at lines 129-138, controller `account.logout()` at lines 141-150, and DOM transition to withdrawal view at lines 153-155.
- MyPageManager `_showWithdrawView`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:161-250` is Slice 5 DOM rendering; only radio/confirm values feed `account.setWithdrawalReason` and `account.setWithdrawalConfirmed`.
- MyPageManager `_bindWithdrawEvents`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:252-290` is mostly Slice 5 DOM event binding; confirm checkbox maps to `setWithdrawalConfirmed`, reason inputs map to `setWithdrawalReason`, modal confirm maps to `deleteAccount()`.
- MyPageManager `_performWithdrawal`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:292-330` maps to `account.deleteAccount()`, except button text/disabled state at lines 297-301 and 325-328 are DOM-only.
- MyPageManager `_showFarewellView`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:332-360` is explicitly outside Slice 3b and belongs to Slice 5 DOM; controller should only expose a deleted status for DOM to render.
- Main factory source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:183-186` supplies cached user and reload callback; future DOM app should replace these with core view model/subscription and app-level reaction.
- AccountPort source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:309-315` is the backend POST that Slice 2 isolates behind `AccountPort.deleteAccount(payload)`.
- Auth/storage source: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:318-320` maps to AccountController orchestration, not AccountPort.

**Cross-controller couplings** -

- `account.deleteAccount()` must call `accountPort.deleteAccount(payload)` for backend POST only, because Slice 2 decision #7 states signout and storage clear remain controller-slice responsibilities at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:26`.
- `account.deleteAccount()` must then call `authPort.signOut({ scope: 'global' })` directly; this mirrors current source at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:318`.
- `account.deleteAccount()` must then call `storagePort.clearLocal()` and `storagePort.clearSession()` directly; this mirrors current source at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:319-320` and is forced by Slice 2 decision #7.
- `account.logout()` should call `authPort.signOut()` directly rather than `AuthController.signOut()`, aligning with Slice 3a resolution that controllers avoid direct cross-controller method calls at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:276-282`.
- AccountController may write `store.auth.*` after direct signout/delete to keep app auth state coherent; if implementation forbids cross-slice writes, this must be replaced by a store-level auth reactor before wiring UI.
- AccountController should not call NavigationController directly after logout/delete; the current source reloads the page through UI callback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:183-186`, which is a Slice 5 app reaction.
- NotificationController is not involved in account flows; MyPage's notification import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:9` is unused in inspected account logic.

**Smoke validation path** - With store auth user present and withdrawal confirmed, call `account.deleteAccount()`, expect one backend delete payload `{ user_id, reason }`, then direct `authPort.signOut({ scope: 'global' })`, `storagePort.clearLocal()`, `storagePort.clearSession()`, `account.status === 'deleted'`, and no DOM farewell render from core.

## Decision Resolutions (Slice 3b)

| # | Resolved option | Rationale |
| --- | --- | --- |
| 1 | **A** — `notifications.init(navigation)` registers `appPort.addListener('appStateChange', ...)` internally and dispatches to its own `handleAppStateChange({isActive})`. | Centralizes Notification controller's "foreground reschedule" responsibility (instruction §6). Same pattern as slice-3a AuthController.init registering `appUrlOpen` internally. |
| 2 | **C** — `account.hydrateProfile()` reads `store.get('auth.user')` first, falls back to `authPort.getUser()` if cache is null. | Matches `MyPageManager._hydrateUser:35-42` exactly. AuthController.init pre-fills the cache, so fresh fetches are rare. |
| 3 | **A** — `account.logout()` and `account.deleteAccount()` call `authPort.signOut()` directly (no cross-controller call). | Slice-3a decision #1 forbids cross-controller direct method calls. AuthController's `onAuthStateChange` listener (registered in `auth.init`) updates `store.auth.*` automatically when signOut fires. |
| 4 | **A** — `notifications.setEnabled(enabled)` orchestrates requestPermission/schedule/cancel/storage writes itself. | Matches `NoticeManager.onchange:96-122` and instruction §6 Notification controller responsibility list. |

### Additional store-schema decision (surfaced during Slice 3b coding)

- **`store.account.error`**: initial state currently lacks `error: null` at `packages/core/src/state/createStore.js:60-64`. Slice 3b must add `error: null` to the account slice initial state so AccountController's normalized error writes do not synthesize a missing key. This is a 1-line append; `resetTransient()` semantics for `account.withdrawal` are unaffected.

Slice 3b controllers are constructed by `createRecocoCore(ports)` and not yet consumed by `main.js`. Behavior changes only occur once `createDomApp.js` is wired in slice 4+/5.
