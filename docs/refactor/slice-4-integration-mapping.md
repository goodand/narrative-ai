# Slice 4 Integration Mapping

Audit date: 2026-05-09

Reference docs:
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:8-19` - operating contract and non-goals.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:60-114` - target package/app adapter layout.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:354-637` - controller responsibilities and error-normalization rule.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:638-678` - component conversion table.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:701-717` - execution sequence steps 5, 6, and 12.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786` - acceptance criteria and manual smoke scenarios.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:797-806` - known risk areas and toast compatibility rule.

## 0. Decisions To Surface

| # | Decision | Options to keep open | Source alignment facts | Existing-doc alignment facts |
| --- | --- | --- | --- | --- |
| 1 | Slice 4 integration mode | A1 parallel run; A2 selective replace; A3 pure additive. | Current `main.js` constructs direct-service components and binds destructive callbacks at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:147-228`; core controllers already own equivalent auth, permission, home, result, notification, account, and report logic at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:39-132`. | Execution order adds `createDomApp` and thins `main.js` before converting components at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:709-716`; conversion table still requires components to become DOM-only later at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:667-676`. |
| 2 | Window globals | A keep all; B drop now; C mirror via reactor. | `main.js` owns `window.__bootErrors` and `window.__recocoCurrentUser` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:49-51`; it passes the current-user global to report/mypage factories at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:179-186`; `src/components` has no direct `window.__recocoCurrentUser` hit, while `ReportManager` and `MyPageManager` consume injected getters at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:22-33` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:16-41`. | Store contract allows `window.__recocoCurrentUser` only as a compatibility mirror if `core.store.auth.user` is canonical at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:328-352`; `window.supabaseInstance` is called out as adapter-layer risk at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:797-806`. |
| 3 | Legacy modal/controller overlap | A disable legacy modal; B disable core controller call; C call both and assume idempotency. | `PermissionModal.checkAndOpen()` calls native permission status at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:24-75`; `PermissionController.checkPhotoPermission()` calls the same port method at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:41-112`; equivalent overlap exists for AuthModal OAuth, NoticeManager notification toggle, and MyPageManager withdrawal. | Component conversion rules say these direct imports must be removed later at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-660`; Slice 4 must not silently pick a double-fire behavior because conversion is not yet complete. |
| 4 | Reactor location | A inline in `createDomApp`; B new `reactors.js`; C component adapters subscribe by domain. | Core auth writes store only and explicitly leaves navigation reaction to `createDomApp` or a future reactor at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:8-19`; HomeController already subscribes to permission authorization at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:477-499`. | Target layout lists only four `src/ui/dom` files and omits `reactors.js` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:88-112`; B needs a scope/instruction patch, while A fits the listed files and C fits later component conversion. |
| 5 | Daily reset call | A keep in new `main.js`; B move to `createDomApp`; C migrate to core ports now. | Current bootstrap calls legacy reset at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:333-337`; legacy reset hardcodes 17:00 and `last_reset_timestamp` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:139-164`. | Slice 3c-1 resolved option B, leaving legacy reset in `main.js`, at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3c1-controller-mapping.md:354-362`; C reverses that decision and should not be selected without a new decision log. |
| 6 | Lazy manager pattern | A move unchanged to `createDomApp`; B eager instantiate all; C hybrid. | Current factories lazy-create report/mypage/notice/input/result and register them with Router at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:178-256`; home and critical modals are eager at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:146-176`. | `createDomApp` is the required component construction site at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:709-710`; C matches current behavior most closely, A is broader wording, B is a behavior/perf change. |

## 1. New main.js shape

**Required imports**

```js
import './style.css';
import { createAppPorts } from './src/adapters/createAppPorts.js';
import { createRecocoCore } from '@recoco/core';
import { createDomApp } from './src/ui/dom/createDomApp.js';
```

- These imports implement the conversion table requirement at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:664-666`.
- No new `main.js` import should reference Supabase, Capacitor, Browser, NotificationService, PhotoService, GeminiService, ShareService, or UI components directly; the old direct imports occupy `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:8-39`.
- If Decision 5A is selected, add only `import { store as legacyStore } from './src/state/StateManager.js';` for `legacyStore.checkAndResetDaily()`; that is decision-dependent, not part of instruction §6.

**Required calls**

```js
const rootEls = collectRootEls(document);
const ports = createAppPorts();
const core = createRecocoCore(ports, { webRedirectOrigin: window.location.origin });
const domApp = createDomApp({ core, rootEls });
await core.auth.init();
await core.notifications.init(core.navigation);
```

- `createAppPorts()` constructs 13 concrete ports at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:74-124`.
- `createRecocoCore(deps, options)` accepts `webRedirectOrigin` because core cannot read host location directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:35-52`.
- The nine controllers are wired in the core factory at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:42-119`.
- `core.auth.init()` replaces launch URL, app URL open, auth state subscription, and restore-session work from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:72-114` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:310-343`.
- `core.notifications.init(core.navigation)` replaces notification action listener setup, foreground reschedule, and boot schedule at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:116-121`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:337`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:352-353`.

**Source mapping**

- `main.js:1-6` maps to new `main.js`: keep style import and optionally replace header comments.
- `main.js:8-42` maps to `createAppPorts`, `createDomApp`, `toastPresenter`, and core imports; old direct service/component imports disappear.
- `main.js:44-67` maps to `createDomApp`: manager variables and `safeInit`.
- `main.js:69-121` maps to core auth/notification controllers; no direct Supabase, Browser, or App listener remains in `main.js`.
- `main.js:123-138` maps to new `main.js` root element collection or a small `collectRootEls` helper local to bootstrap.
- `main.js:140-142` maps to `domRouterAdapter` plus `core.navigation`, not `src/services/Router.js`.
- `main.js:144-256` maps to `createDomApp`: component construction, callback wiring, and lazy factories.
- `main.js:257-274` maps to `domEvents` and `createDomApp`: tab clicks and `nav-change` event proxy.
- `main.js:276-305` maps to `createDomApp`/`domEvents` or disappears into ResultController; the duplicate `handleSuggestionSelect` has no independent target.
- `main.js:307-324` maps to an auth reactor in `createDomApp` or a selected reactor location.
- `main.js:326-328` disappears; `setLoading` is empty.
- `main.js:330-365` maps to new bootstrap calls, plus Decision 5 handling.

## 2. createDomApp.js

**Signature**

```js
createDomApp({ core, rootEls }) -> { destroy, getManager, getModal? }
```

- The signature is required by instruction layout and conversion wording at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:107-112` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:664-666`.
- `core` must be the object returned by `createRecocoCore`, whose public shape is documented at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:121-132`.
- `rootEls` should carry the old `els` shape from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:123-138`.
- Return shape is not specified by instruction; `destroy` is useful because auth/nav/toast reactors and DOM listeners need teardown, but current `main.js` has no external consumer.

**Responsibilities**

- Own old component construction that currently lives at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:146-176`.
- Own lazy manager factories and `getManager(name)` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:178-248`.
- Own lazy `SuggestionModal` and `SettingsModal` factories from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:231-255`.
- Create `AuthModal`, `PermissionModal`, `HomeManager`, `ReportManager`, `MyPageManager`, `NoticeManager`, `InputManager`, and `ResultViewer` until Slice 5 converts their internals.
- Wire `AuthModal` buttons to `core.auth.startGoogleOAuth()` only if Decision 1/3 selects selective replacement; otherwise legacy AuthModal keeps internal Supabase OAuth at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:30-61`.
- Wire `PermissionModal` actions to `core.permissions` only if Decision 1/3 selects replacement; otherwise legacy modal calls native plugin at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:24-75` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:138-171`.
- Move the current `onPreciousClick` callback from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:162-172`; if replaced, call `core.home.markPrecious()` and leave toast to `toastPresenter`.
- Move ResultViewer keyword/save/share callbacks from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:189-228`; if replaced, call `core.result.replaceKeyword`, `core.result.saveCaption`, and `core.result.shareCaption`.
- Avoid calling `home.loadDailyCuration()` on permission store changes because HomeController already owns that false-to-true reaction at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:477-499`.
- If Decision 4A is selected, host auth/account/toast/window mirror subscribers inline here.
- If Decision 4B is selected, call `subscribe*Reactor()` functions from the new module, but that adds a file not listed in instruction §2.
- If Decision 4C is selected, limit Slice 4 to navigation/toast/global compatibility and defer domain render subscriptions to Slice 5 component adapters.

**Returns**

- `destroy`: remove `nav-change`, tab, back, navigation, toast, and store subscriptions.
- `getManager(name)`: useful for domRouterAdapter render trigger and future smoke/debug hooks.
- `getModal(name)`: optional; no current external caller exists.
- `managers` or `modals` should not be exposed as mutable maps unless a test or adapter needs them.
- No returned API should expose Supabase, Capacitor, PhotoService, NotificationService, or legacy StateManager.

**Cross-deps**

- Imports components from `src/components/*` until Slice 5, matching the temporary adapter phase.
- Imports `createDomRouterAdapter` from `src/ui/dom/domRouterAdapter.js`.
- Imports `createToastPresenter` or `subscribeErrorToasts` from `src/ui/dom/toastPresenter.js`.
- Imports `bindNavChange`, `dispatchNavChange`, and button bind helpers from `src/ui/dom/domEvents.js`.
- Uses `core.navigation` for route state and `core.store` for reactors.

## 3. domEvents.js

**Responsibilities**

- Own the `window.addEventListener('nav-change', ...)` proxy currently in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:268-274`.
- Own dispatch compatibility for existing components that call `window.dispatchEvent(new CustomEvent('nav-change', ...))`.
- Current dispatch sources are MyPage back and notice settings at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:123-138` and Notice back at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:84-92`.
- Move bottom tab click binding from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:257-266`.
- Move back button binding from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:302-305`.
- Convert event handlers to call `core.navigation.navigate(name)` or `core.navigation.goBack()`.
- Preserve `getManager(viewName)` side effect before navigating to lazy views, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:259-265`.
- Return unbind functions so `createDomApp.destroy()` can clean up.

**API surface**

- `dispatchNavChange(viewName)`: dispatches `CustomEvent('nav-change', { detail: viewName })`.
- `bindNavChange({ target = window, onNavigate })`: listens to legacy `nav-change` and returns unsubscribe.
- `bindBottomTabs({ rootEls, navigation, ensureManager })`: wires home/report/mypage tab clicks.
- `bindBackButton({ rootEls, navigation })`: wires `backBtn.onclick` to `navigation.goBack()`.
- `bindClick(el, handler)`: optional small helper if repeated null checks stay local.
- `isAllowedDomView(viewName)`: optional; can also rely on `core.navigation.navigate()` validation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/navigation/createNavigationController.js:16-51`.
- `domEvents` should not import components, ports, or services.
- It may reference `window` and `CustomEvent` because it is a DOM adapter file.
- It must not call `render()` itself; render triggering belongs to `domRouterAdapter`.
- It must not own toast behavior; toast belongs to `toastPresenter`.

## 4. domRouterAdapter.js

**Responsibilities**

- Subscribe to `core.navigation.subscribe(handler)` and apply DOM state for every route change.
- Hide all view containers ending with `View`, preserving current Router behavior at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:25-31`.
- Toggle the bottom action bar first child based on the `input` route, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:33-37`.
- Toggle main header visibility for non-main routes, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:39-44`.
- Update tab active state and Material Symbols fill variation, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:65-86`.
- Show the target view by route name, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:88-100`.
- Trigger the target manager's `render()` and catch async rejections, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:101-113`.
- Update header title for `input` and `result`, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:115-118`.
- Reset scroll on each navigation, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:52`.
- Match the seven DOM responsibilities required by instruction at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:586-600`.

**Subscription**

- Initial sync should call `sync(core.navigation.getViewModel())` after subscribing so the first route renders.
- Route state should be read from `navigation.getViewModel()`, which supplies current view, tabs, and header title at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/navigation/createNavigationController.js:89-108`.
- `ensureManager(viewName)` should run before showing/rendering lazy views.
- `viewManagers` registration can remain internal to createDomApp via `getManager`, instead of re-creating the old Router class map from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:6-15`.
- Adapter should return an unsubscribe/destroy function.
- Adapter should not import `src/services/Router.js` unless an explicit compatibility wrapper decision is made.
- Adapter should not mutate core navigation state; it is a view of route state only.
- Render errors should remain console-only as current Router does at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:106-111`.

## 5. toastPresenter.js

**Responsibilities**

- Be the only new UI/dom file that imports `showToast` from legacy errorHandler.
- Preserve the legacy showToast DOM implementation from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/utils/errorHandler.js:34-52`.
- Leave legacy `handleError` behavior intact for still-unsplit services during slices 3-5, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:797-806`.
- Subscribe to core store error slices if Decision 4A/4B selects a central reactor path.
- Candidate observed slices: `auth.error`, `permissions.photo.error`, `notifications.error`, `home.error`, `input.error`, `result.error`, `report.error`, and `account.error`, matching schema at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-74`.
- De-duplicate toasts by remembering last `{ context, message, code }` per domain.
- Do not toast for domains where the legacy component/service already calls `handleError` during the same path unless selective replacement has removed that legacy call.
- Keep "소중한 기억으로 기록되었습니다." as UI toast only if `home.markPrecious()` is the selected replacement for `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:164-170`.
- Keep notification permission denial toast mapping from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:99-104` only if NoticeManager toggle is routed through `core.notifications.setEnabled`.
- Keep copy-success toast UI-owned because ResultController writes terminal copy status only at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:125-139`.

**API surface**

- `presentToast(message, level, options?)`: thin wrapper around legacy `showToast`.
- `subscribeCoreErrors({ store, domains, shouldToast? })`: optional reactor helper returning unsubscribe.
- `presentNormalizedError(error, fallbackLevel)`: reads normalized `{ message, context, code }`, not raw causes.
- `mapErrorLevel(domain, status)`: optional mapping if statuses like `permission_denied` need non-error levels.
- `ErrorLevel` can be re-exported for adapters; core must not import it.
- `toastPresenter` may import `ErrorLevel` from legacy errorHandler; components should use presenter after Slice 5 per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:655-660`.
- It must not call controller methods.
- It must not own business decisions such as retrying photo load or account delete.

## 6. Reactor wiring

**Auth reactor**

- Current auth source reacts to Supabase events by closing auth modal, hiding onboarding, navigating home, and checking permission at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:310-324`.
- Boot source opens onboarding when no session and navigates home plus permission check when session exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:342-358`.
- Core auth writes `auth.status`, `auth.user`, and `auth.session` but does not navigate at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:63-72`.
- Reactor should observe `auth.status` transitions to `signed_in` and `signed_out`.
- On `signed_in`, UI effect candidates are `authModal.close()`, hide onboarding, `core.navigation.navigate('home')`, and maybe `core.permissions.checkPhotoPermission()`.
- On `signed_out`, UI effect candidate is `onboardingModal.open()`.
- To avoid double fire under Decision 1A3, do not also keep legacy `supabase.auth.onAuthStateChange`; that listener is removed when `core.auth.init()` owns auth subscription at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:90-122`.

**Permission reactor**

- PermissionController writes only `store.permissions.photo.*` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:8-13`.
- HomeController already reacts to `false -> true` authorization and calls `loadDailyCuration()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:477-499`.
- Slice 4 permission reactor should therefore limit itself to modal prompt/close rendering unless Decision 3 disables legacy modal and routes all actions to core.
- Do not replicate `main.js:147-155` home load callback in createDomApp if core HomeController is active, because that would duplicate curation load.

**Account reactor**

- Current farewell view is a DOM-only MyPageManager method at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:332-360`.
- Core account deletion writes `account.status = 'deleted'` after backend delete, signout, and storage clear at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:118-165`.
- If MyPageManager withdrawal remains legacy, do not also call `core.account.deleteAccount()`.
- If selective replacement is chosen, MyPageManager confirm button should drive `core.account` methods and account reactor should call `_showFarewellView()` or a DOM-only equivalent after `deleted`.

**Notification reactor**

- No foreground reactor is needed in createDomApp if `core.notifications.init(core.navigation)` is called, because NotificationController registers `appStateChange` internally at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:53-93`.
- Slice 3b explicitly resolved that internal ownership at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:224-230`.
- Notice toggle UI can be legacy until Slice 5 or selectively replaced with `core.notifications.setEnabled(enabled)`.

**Other reactor candidates**

- Window mirror reactor: observe `auth.user` and set `window.__recocoCurrentUser` if Decision 2C is selected.
- Toast reactor: observe normalized errors and call toastPresenter, subject to duplicate-toast suppression.
- Report-on-navigation reactor: on navigation to `report`, call `core.report.load()` only after ReportManager is converted; legacy ReportManager already loads in render at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:162-181`.
- Result render reactor: after Slice 5, render from `core.result.getViewModel()` rather than mutating legacy StateManager from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:199-218`.

## 7. Component compatibility analysis

| Component | Direct platform/service calls found | Core overlap | Duplicate-fire risk |
| --- | --- | --- | --- |
| AuthModal | Imports Supabase, Browser, Capacitor, and showToast at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:6-10`; calls `Capacitor.isNativePlatform`, `supabase.auth.signInWithOAuth`, and `Browser.open` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:30-61`. | AuthController owns OAuth start and browser open at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:124-143`. | Medium: duplicate OAuth start only if the same button wires both legacy `_handleGoogleLogin()` and `core.auth.startGoogleOAuth()`. |
| PermissionModal | Imports Capacitor and RecocolPhotos at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:6-8`; calls permission status and request at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:24-75` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:138-171`. | PermissionController owns web bypass, status check, timeout, request, and skip at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:41-157`. | Medium: status check may be idempotent, but native plugin double calls are not documented as safe. |
| HomeManager | Imports Supabase and PhotoService at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:7-10`; direct photo calls appear at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:33-46`; user fetch appears at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:109-123`; sub-runtimes call PhotoService/Gemini at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:56-108`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:4-29`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:56-132`. | HomeController owns daily load, current media, precious, delete, consume, refill, and batch analysis at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:103-399`. | High: delete and record/consume are destructive or stateful; do not run legacy `handleDelete` and `core.home.deleteCurrent()` for one click. |
| MyPageManager | Imports Supabase, API config, handleError, and notification functions at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:6-9`; calls getUser, signOut, delete-account fetch, localStorage clear, and sessionStorage clear at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:29-50`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:141-150`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:292-330`. | AccountController owns profile hydration, logout, withdrawal state, delete-account, signout, and storage clear at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:72-165`. | High: duplicate withdrawal may call backend delete and signout twice; select one owner. |
| NoticeManager | Imports NotificationService functions and showToast at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:1-6`; reads/writes localStorage and calls request/schedule/cancel at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:8-13` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:95-123`. | NotificationController owns loadSetting, setEnabled, schedule/cancel, storage, and foreground reschedule at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:53-172`. | Medium: duplicate schedule/cancel is probably idempotent but can produce permission prompts or status flicker. |
| ReportManager | Imports Supabase at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:1-7`; queries auth/user_stats/detox_logs at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:31-85`. | ReportController owns stats load, 14-day window, aggregation, and view model at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:77-178`. | Low/Medium: duplicate read queries are non-destructive but wasteful and can race UI states. |
| InputManager | Imports legacy StateManager at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:6-8`; writes base64/dataUrl/metadata at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:62-75`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:93-112`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:119-134`; composed DropZone imports ImageProcessor at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:6-7` and processes files at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:140-172`. | InputController owns `processFile`, text fields, preview image, reset, and view model at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:56-138`. | Medium: duplicate image processing can be expensive; duplicate store writes can desync legacy/core state. |
| ResultViewer | Imports showToast at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1`; calls navigator clipboard and execCommand fallback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:240-249` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:301-324`; main.js share callback imports ShareService at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:219-226`. | ResultController owns keyword replacement, save, copy/share, synonym load, and formatted caption at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:73-226`. | Medium: duplicate copy/share can call platform APIs twice; keyword/save duplication can mutate two stores. |

## 8. main.js full line classification

| Lines | Bucket | Target / note |
| --- | --- | --- |
| 1-7 | NEW main.js (남음) | Optional bootstrap header, style import, and spacer. |
| 8-10 | 사라짐 (core controller로 흡수됨) | Old constants import is not used by new bootstrap. |
| 11-13 | toastPresenter | Legacy toast import moves behind `toastPresenter`. |
| 14-16 | NEW main.js (남음) | Decision 5A only: legacy reset import; otherwise removed. |
| 17-22 | 사라짐 (core controller로 흡수됨) | Direct service imports move to `createAppPorts` and core. |
| 23-27 | 사라짐 (core controller로 흡수됨) | Direct Capacitor/notification imports move to app ports/controllers. |
| 28-40 | createDomApp | Component imports move to `createDomApp`. |
| 41-43 | 사라짐 (core controller로 흡수됨) | Direct GeminiService instance not needed in bootstrap. |
| 44-48 | createDomApp | Manager/modal references move to app composition. |
| 49-52 | createDomApp | Boot globals handled by Decision 2 compatibility mirror or dropped. |
| 53-68 | createDomApp | `safeInit` belongs with component construction. |
| 69-111 | 사라짐 (core controller로 흡수됨) | Auth deep link handling moves to AuthController. |
| 112-115 | 사라짐 (core controller로 흡수됨) | `appUrlOpen` listener moves to `auth.init`. |
| 116-122 | 사라짐 (core controller로 흡수됨) | `appStateChange` notification reschedule moves to NotificationController. |
| 123-139 | NEW main.js (남음) | Root element collection passed as `rootEls`. |
| 140-143 | domRouterAdapter | Old Router instantiation becomes core navigation + DOM adapter. |
| 144-145 | createDomApp | Section comments removed or local to `createDomApp`. |
| 146-155 | createDomApp | PermissionModal construction and callback; callback may be removed if HomeController subscription is active. |
| 156-161 | createDomApp | Confirm/Auth/Onboarding modal construction. |
| 162-174 | createDomApp | HomeManager construction and precious callback. |
| 175-177 | domRouterAdapter | Initial manager registration becomes adapter/getManager concern. |
| 178-188 | createDomApp | Lazy manager factory definitions. |
| 189-198 | createDomApp | ResultViewer construction. |
| 199-211 | slice 5 deferral (component conversion 시점에) | Keyword modal/render wiring remains DOM adapter until ResultViewer conversion; core action is `result.replaceKeyword`. |
| 212-218 | slice 5 deferral (component conversion 시점에) | Save callback maps to `result.saveCaption`; can be selectively replaced earlier. |
| 219-226 | slice 5 deferral (component conversion 시점에) | Share callback maps to `result.shareCaption`; direct ShareService import should disappear from bootstrap. |
| 227-230 | createDomApp | Factory close. |
| 231-235 | createDomApp | Lazy modal factory definitions. |
| 236-249 | createDomApp | `managers`, `modals`, and `getManager`. |
| 250-256 | createDomApp | `getSuggestionModal`. |
| 257-258 | domEvents | Home nav click binding. |
| 259-262 | domEvents | Report nav click with lazy manager ensure. |
| 263-267 | domEvents | Mypage nav click with lazy manager ensure. |
| 268-275 | domEvents | Legacy `nav-change` listener proxy. |
| 276-291 | 사라짐 (core controller로 흡수됨) | Duplicate suggestion selection helper maps to ResultController or disappears. |
| 292-301 | createDomApp | `navigateToHome` becomes auth reactor/navigation helper; permission fallback is decision-dependent. |
| 302-306 | domEvents | Back button binding. |
| 307-325 | createDomApp | Auth reactor replaces direct Supabase listener side effects. |
| 326-329 | 사라짐 (core controller로 흡수됨) | Empty `setLoading` removed. |
| 330-335 | NEW main.js (남음) | Bootstrap `initApp` shell. |
| 336 | NEW main.js (남음) | Decision 5A legacy `checkAndResetDaily`; otherwise no line. |
| 337-338 | 사라짐 (core controller로 흡수됨) | Notification action listener moves to `core.notifications.init(core.navigation)`. |
| 339-341 | 사라짐 (core controller로 흡수됨) | Launch URL handling moves to `core.auth.init()`. |
| 342-343 | 사라짐 (core controller로 흡수됨) | Initial session restore moves to `core.auth.init()` plus auth reactor/global mirror. |
| 344-358 | createDomApp | Initial signed-in/signed-out UI reaction moves to auth reactor. |
| 359-362 | NEW main.js (남음) | Bootstrap catch can navigate home through `core.navigation` if retained. |
| 363-365 | NEW main.js (남음) | Call bootstrap. |

Coverage: ranges cover `main.js:1-365` continuously with no omitted lines.

## 9. temp_handleUrl.js removal

**Verification**

- `src/utils/temp_handleUrl.js` is a duplicate deep-link handler body at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/utils/temp_handleUrl.js:1-42`.
- Code search `rg -n "temp_handleUrl" main.js src packages --glob '!src/utils/temp_handleUrl.js'` returned no matches on 2026-05-09.
- The file references `Browser`, `supabase`, and `handleError` without imports at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/utils/temp_handleUrl.js:11-40`.
- Instruction step 12 permits removal/quarantine after `auth.handleUrl` covers launch URL and `appUrlOpen` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:701-717`.
- AuthController covers `appUrlOpen`, launch URL, and `handleUrl` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:90-175`.

**Removal action**

- Slice 4 may delete `src/utils/temp_handleUrl.js` together with the `main.js` rewrite, if the implementation actually calls `core.auth.init()`.
- Removal should be in the same patch as the bootstrap rewrite or immediately after, so the codebase does not contain two auth URL handlers.

**Risk**

- Runtime import risk is 0 based on the code search above.
- Audit/history references exist outside runtime, but they are documentation only and do not block deletion.

## 10. Cross-slice impact summary

| Area | Impact |
| --- | --- |
| Decision 1 A1 | Lowest source churn, highest double-fire risk. Legacy components and core controllers may both listen or act. |
| Decision 1 A2 | Requires precise callback replacement in `createDomApp`; safest for destructive paths but changes behavior before full Slice 5 conversion. |
| Decision 1 A3 | Best preserves behavior; core is initialized for auth/notifications but destructive component flows remain legacy until Slice 5. |
| Decision 2 | Store already has canonical `auth.user` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:31`; mirror option C matches instruction compatibility wording. |
| Decision 3 | Permission, auth, notification, and account flows need one active owner each; delete/withdraw must not run both legacy and core. |
| Decision 4 | A fits listed files; B needs new file and instruction/scope patch; C defers most store-to-component rendering until Slice 5. |
| Decision 5 | A matches Slice 3c-1 resolution; B hides legacy dependency in `createDomApp`; C changes core scope and should be rejected unless re-decided. |
| Decision 6 | C preserves current lazy/eager split from `main.js`; B can regress boot time. |
| Store schema | No new store keys are required for Slice 4; current schema includes auth, permissions, notifications, navigation, home, input, result, report, and account at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-74`. |
| Ports | No new port is required; `createAppPorts` already returns all ports consumed by `createRecocoCore` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:109-123`. |
| Instruction patch | Only Decision 4B would require adding `src/ui/dom/reactors.js` to layout; otherwise §6/§7/§13 can stand. |
| Web redirect URL | Because `createRecocoCore` is created before `createDomApp`, the clean wiring is `createRecocoCore(ports, { webRedirectOrigin: window.location.origin })` in `main.js`, supported by `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:35-52`. |

## 11. Validation strategy

- Run `npm ci` only if dependencies are not installed; otherwise avoid churn.
- Run `npm run build`, matching the instruction validation loop at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:719-739`.
- Run `git diff --check`.
- Run boundary scan: `rg -n "supabase|@capacitor/core|@capacitor/browser|RecocolPhotos|PhotoService|GeminiService|NotificationService|StatsService|StateManager|ImageProcessor" src/components main.js`.
- Run core purity scan from instruction at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:721-739`.
- Manual smoke: cold boot without session opens onboarding/auth, matching acceptance at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-772`.
- Manual smoke: signed-in boot navigates to home and permission flow does not block navigation, matching current source at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:346-358`.
- Manual smoke: permission allow triggers exactly one daily curation load; instrument `photoPort.fetchDailyCuration` or legacy `photoService.fetchDailyCuration` call count.
- Manual smoke: precious click records/consumes exactly once; instrument `recordCurationAction` for `action: 'recorded'`.
- Manual smoke: delete click calls native delete and record action exactly once; use a confirm path that cannot double-submit.
- Manual smoke: report navigation constructs/loads the report once per navigation intent.
- Manual smoke: withdrawal confirm calls delete-account, signout, local clear, and session clear exactly once.
- Manual smoke: notice toggle on calls request permission and schedule exactly once; toggle off calls cancel exactly once.
- Manual smoke: result share chooses image share when `input.base64` is present and caption share otherwise, matching Slice 3c-2 option 5A at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3c2-controller-mapping.md:289-297`.
- Multi-fire guard: add temporary counters in test doubles or dev logs around auth listener, permission status check, fetchDailyCuration, deletePhoto, recordCurationAction, scheduleDailyNotification, cancelAll, and deleteAccount.
- Toast guard: trigger one controller error and one legacy service error separately; verify `toastPresenter` does not duplicate legacy `handleError` toasts.
- Cleanup guard: if `temp_handleUrl.js` is deleted, rerun the runtime search and ensure no imports were introduced.

## 12. Decision Log (2026-05-10, slice 4 implementation)

| # | Decision | Selected | Rationale |
| --- | --- | --- | --- |
| 1 | Integration mode | **A3 (pure additive)** | Minimize behavior change. Core `auth.init()` + `notifications.init(navigation)` replace `main.js`'s direct Supabase + App listeners. All other controllers are constructed but never called in slice 4 — legacy components own those flows until slice 5. |
| 2 | Window globals | **C (mirror via reactor)** | Legacy `ReportManager`/`MyPageManager` consume `getCurrentUser: () => window.__recocoCurrentUser` (`main.js:181-184`). Under A3 those components remain, so the global must keep the same value. Reactor subscribes to `auth.user` store changes and writes the global. |
| 3 | Legacy modal/controller overlap | **B (disable core controller call)** for non-auth/notifications domains | A3 implies permission/home/result/account/input/report controllers are wired but inert in slice 4. `createDomApp` does not call `core.permissions.*`, `core.home.*`, `core.result.*`, `core.account.*`, `core.input.*`, `core.report.*`. Legacy components retain their direct service calls. No double-fire risk. Auth/notifications are the only owners moved to core (single owner, no duplication). |
| 4 | Reactor location | **A (inline in `createDomApp`)** | Matches instruction §2 listed files exactly (no new `reactors.js`). Auth reactor + window-mirror reactor live as private helpers inside `createDomApp.js`. |
| 5 | Daily reset | **A (keep in new `main.js`)** | Preserves slice-3c-1 decision #4B. `main.js` imports `legacyStore` from `StateManager.js` only for `checkAndResetDaily()` call before `core.*.init()`. |
| 6 | Lazy manager pattern | **A (move unchanged to `createDomApp`)** | Preserves current eager (home/modals) + lazy (report/mypage/notice/input/result/suggestion/settings) split from `main.js:178-256`. Same `getManager(name)` signature for `domRouterAdapter` consumption. |

### Implementation deltas

- **5 file changes**:
  - NEW `src/ui/dom/createDomApp.js`
  - NEW `src/ui/dom/domEvents.js`
  - NEW `src/ui/dom/domRouterAdapter.js`
  - NEW `src/ui/dom/toastPresenter.js`
  - REWRITE `main.js` (thin bootstrap)
- **1 deletion**: `src/utils/temp_handleUrl.js` (instruction §9 step 12; runtime imports verified 0).

### Boundary preservation

- New `src/ui/dom/*` files may import `window`, `document`, `CustomEvent` (DOM adapter layer).
- New files **must not** import: `@capacitor/*`, `supabase`, `PhotoService`, `GeminiService`, `NotificationService`, `StatsService`, `StateManager`, `ImageProcessor`, `ShareService` directly. Platform access flows through `core` and its ports.
- `toastPresenter.js` is the **only** new file allowed to import `showToast`/`ErrorLevel` from legacy `errorHandler.js`.
- `main.js` may import `legacyStore` from `StateManager.js` for daily reset (Decision 5A) — this is an explicit, documented exception.
