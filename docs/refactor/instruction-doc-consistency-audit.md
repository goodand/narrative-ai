# Instruction Doc Consistency Audit

Audit date: 2026-05-09

Reference docs:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md`
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js`
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md`

One-line recommendation: patch instruction doc section 2 and section 8 before Slice 3, and add one mapping-doc decision for adapter layout naming; do not rely on the existing mapping decision log alone because Slice 3 agents will follow the instruction doc first.

## 1. Confirmed Inconsistencies

### 1.1 Section 2 src/adapters layout missing `clipboard/` and `stats/`

Severity: low.

Status: confirmed. Workaround exists because Slice 2b reportedly added both adapter areas, but the instruction doc still does not describe them.

Evidence:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:88-104` lists `src/adapters/` files and omits `clipboard/clipboardPort.js` and a `stats/` adapter file.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:272-290` defines `StatsPort` and `ClipboardPort`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:647-660` maps `statsPort` but omits `clipboardPort`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:422-457` has a complete `ClipboardPort` mapping, proving the port is not intentionally absent.

Patch options:

A) Patch section 2 layout to add `clipboard/clipboardPort.js` and `stats/statsPort.js`, and patch section 8 to add `clipboardPort` mapping.

B) Add decision #8 to `slice-2-adapter-mapping.md` only, stating that Slice 2b added these adapters despite instruction layout drift.

C) Both.

Recommendation: C. The instruction doc is the execution contract, while the mapping doc is evidence and handoff context; both should agree before a controller slice consumes the adapters.

### 1.2 Section 8 names `clock`, while the contract and mapping use ClockPort semantics

Severity: low.

Status: confirmed naming drift.

Evidence:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:303-305` defines `ClockPort`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:117-119` defines `ClockPort`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:660` says `clock` returns `new Date()`, while other mapping bullets use `*Port` names.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:534-566` documents `ClockPort` as the port section.

Patch options:

A) Rename the section 8 bullet to `clockPort` for naming consistency.

B) Leave as `clock` if `createAppPorts()` intentionally exposes `deps.clock`, and add a note that the variable name is shorter than the typedef name.

Recommendation: A unless existing Slice 2b code already exports `clock`; if it exports `clock`, use B and document the intentional alias.

### 1.3 `errors/normalizeError.js` is in layout but has no responsibility section

Severity: medium.

Status: confirmed responsibility gap.

Evidence:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:64-86` includes `packages/core/src/errors/normalizeError.js`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:352-600` defines nine controller responsibilities but no error normalization helper contract.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:760-765` warns that `errorHandler.js` creates toast DOM and core must return errors/status, but does not define the core error shape.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/utils/errorHandler.js:70-86` currently couples console logging to toast display.

Patch options:

A) Add a short subsection after Store or Controller Responsibilities defining `normalizeError(error, context?)` return fields.

B) Move `errors/normalizeError.js` out of section 2 until a later slice defines the shape.

Recommendation: A. Slice 3 controllers will otherwise invent incompatible error objects.

### 1.4 Navigation DOM adapter responsibilities are under-specified relative to Router.js

Severity: medium.

Status: confirmed under-spec, not a contract contradiction.

Evidence:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:105-109` lists `src/ui/dom/domRouterAdapter.js`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:583-585` says route state moves to core and DOM display manipulation stays in `domRouterAdapter.js`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:25-52` hides all views, toggles bottom bar/header, updates tabs, shows target view, and scrolls the window.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:65-118` updates tab classes, renders view managers, and updates header title.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:731-748` manual smoke scenarios cover user behavior, but do not explicitly catch header title, tab fill state, or scroll reset regressions.

Patch options:

A) Add a bullet list under Navigation controller requiring `domRouterAdapter.js` to own view hide/show, bottom bar child visibility, header visibility/title, tab active state, target render trigger, and scroll reset.

B) Add these details only to Slice 4+ DOM adapter handoff.

Recommendation: A before Slice 3 if navigation controller APIs are being designed now; it prevents core from absorbing DOM responsibilities by accident.

### 1.5 Toast boundary conflicts with legacy service side effects

Severity: medium.

Status: confirmed boundary gap.

Evidence:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:619-625` allows `showToast` only through `toastPresenter.js` for components and says core must not call `showToast`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:760-765` says `errorHandler.js` creates toast DOM and core must return errors/status.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/utils/errorHandler.js:17-25` auto-creates a DOM toast container.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/utils/errorHandler.js:34-52` creates and displays toast nodes.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/StatsService.js:31-52` uses `handleError` without `silent: true`, which can create DOM toast as an indirect StatsPort side effect.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:34-107` uses `handleError(..., { silent: true })`, so not every legacy service has the same toast behavior.

Patch options:

A) Specify that adapters may preserve legacy service toasts until the service is split, and controllers must not duplicate toasts.

B) Specify that adapters must suppress or replace legacy `handleError` toast side effects before core calls them.

C) Move toast behavior decision to Slice 4 DOM adapter work, but add a risk note now.

Recommendation: B for clean headless boundaries. If B is too large for Slice 3, use A explicitly as a temporary compatibility rule.

### 1.6 `legacyRankingRuntime` is listed as wrap/move but has no port or deprecation decision

Severity: low.

Status: confirmed documentation ambiguity.

Evidence:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:46-58` lists `src/services/photo/legacyRankingRuntime.js` as a logic/service file that must be wrapped or moved, not deleted blindly.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/legacyRankingRuntime.js:10-42` implements `fetchAndRankPhotos`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/PhotoService.js:34-36` exposes `fetchAndRankPhotos(limit = 30)`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:48-62` does not expose `fetchAndRankPhotos`.
- Search evidence found no current external call sites outside definitions in the inspected scope.

Patch options:

A) Add an instruction note that legacy ranking remains internal/deprecated and is intentionally not part of `PhotoPort`.

B) Add `fetchAndRankPhotos` to `PhotoPort`.

Recommendation: A. The current consumer path uses daily curation, and adding a port method would widen the contract for dead or legacy behavior.

## 2. Internal Cross-References

### Axis A Findings

Finding A1: adapters layout, port contracts, and adapter mapping are not fully aligned.

- Section 2 adapter layout omits ClipboardPort and StatsPort files: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:90-103`.
- Section 4 contains the corresponding typedefs: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:272-290`.
- Section 8 contains `statsPort` but not `clipboardPort`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:647-660`.

Finding A2: packages/core layout, public API, and controller responsibilities mostly align.

- Section 3 return keys are `store` plus nine controller keys: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:161-175`.
- Section 6 defines nine controllers: auth, permissions, home, input, result, report, account, notifications, navigation across `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:354-600`.
- Store is separately defined in section 5: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:311-350`.
- The only layout item without a defined responsibility is `errors/normalizeError.js`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:85`.

Finding A3: section 4 typedefs and `ports.js` are lockstep after Slice 2a.

- Instruction doc `PhotoCurationResult` and `PhotoPort`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:222-248`.
- Current `ports.js` matching `PhotoCurationResult` and `PhotoPort`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:36-62`.
- Other typedef ranges match by method names and signatures: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:198-305` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:12-119`.

Finding A4: section 1 mixed files and section 7 conversion table align.

- Section 1 lists 12 mixed UI/logic files: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:33-45`.
- Section 7 conversion map has 12 rows, including `src/services/Router.js`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:626-641`.
- Conclusion: no conversion target is missing; the prompt's "11 rows" premise is stale against the current file.

### Axis B Findings

Finding B1: `domRouterAdapter.js` exists in layout but its required DOM parity surface is incomplete.

- Current Router owns more than route state: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:25-52` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/Router.js:65-118`.
- Instruction only says DOM display manipulation stays in `domRouterAdapter.js`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:583-585`.
- Missing explicit parity items: `headerTitle`, tab fill state, `bottomBar` child visibility, target manager render trigger, and `window.scrollTo(0, 0)`.

Finding B2: `toastPresenter.js` is named, but wrapping boundary is ambiguous.

- Layout names `toastPresenter.js`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:105-109`.
- Section 7 permits `showToast` only through presenter for components: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:619-625`.
- Current `errorHandler` exposes both `showToast` and `handleError`, and both can create DOM side effects: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/utils/errorHandler.js:17-86`.
- Recommendation: define whether presenter wraps only `showToast(message, level)` or also owns `handleError` presentation.

### Axis C Findings

Finding C1: `NotificationService.checkPermission()` is intentionally out of port unless future UI needs it.

- Source method exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/NotificationService.js:27-37`.
- `NotificationPort` omits it: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:73-79`.
- Existing consumers found in inspected scope call request/schedule/cancel/setup, not `checkPermission`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:284-291`.
- Conclusion: no patch needed unless notification view model later needs read-only permission display.

Finding C2: `PhotoService.ensurePhotoSummary()` is internal workflow support.

- Source method exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/PhotoService.js:56-58`.
- Delete flow injects it internally: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/PhotoService.js:137-139` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/mutationRuntime.js:19-21`.
- `PhotoPort` omits it: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:48-62`.
- Conclusion: leave as-is; it is not a UI/controller action.

Finding C3: `PhotoService.fetchAndRankPhotos()` is an undocumented legacy exclusion.

- Source method exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/PhotoService.js:34-36`.
- Legacy implementation exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/legacyRankingRuntime.js:10-42`.
- `PhotoPort` omits it: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:48-62`.
- Section 1 says legacy ranking must be wrapped or moved, not deleted blindly: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:46-58`.
- Conclusion: add an explicit "legacy internal/deprecated" note; do not add a port method.

Finding C4: AuthPort covers all observed Supabase auth methods in current inspected code.

- Observed auth usage includes `signInWithOAuth`, `setSession`, `exchangeCodeForSession`, `onAuthStateChange`, `getSession`, `getUser`, and `signOut`.
- Evidence lines include `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:96-105`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:310-342`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:42-48`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:144-318`.
- No `signUp`, `resetPasswordForEmail`, or `updateUser` call was found in the inspected scope.

## 3. Patch Plan Summary

| # | Section | Patch description | File(s) | Risk |
| --- | --- | --- | --- | --- |
| 1 | Section 2 and Section 8 | Add `clipboard/clipboardPort.js`, `stats/statsPort.js`, and `clipboardPort` mapping; clarify `clockPort` naming. | `docs/refactor/headless-core-agent-instructions.md`, optional mapping doc decision #8 | low |
| 2 | Section 6 or Section 13 | Define `errors/normalizeError.js` responsibility and normalized error shape. | `docs/refactor/headless-core-agent-instructions.md` | medium |
| 3 | Section 6 Navigation | Enumerate DOM parity responsibilities for `domRouterAdapter.js`. | `docs/refactor/headless-core-agent-instructions.md` | medium |
| 4 | Section 7, Section 8, Section 13 | Decide whether legacy service `handleError` toasts are suppressed by adapters or temporarily preserved. | `docs/refactor/headless-core-agent-instructions.md`, optional mapping doc decision | medium |
| 5 | Section 1 or Section 4 PhotoPort notes | Mark `legacyRankingRuntime` / `fetchAndRankPhotos` as internal legacy behavior intentionally outside `PhotoPort`. | `docs/refactor/headless-core-agent-instructions.md` | low |

## 4. Items Intentionally Left As-Is

- `NotificationPort.checkPermission()` remains omitted because current UI/controller flow does not call it; request/schedule/cancel/setup cover observed behavior.
- `PhotoPort.ensurePhotoSummary()` remains omitted because it is only an internal detail/delete helper, not a controller-facing operation.
- `PhotoPort.fetchAndRankPhotos()` should remain omitted unless the product revives the legacy ranking path; document it as internal/deprecated instead.
- AuthPort does not need sign-up/password-reset methods because current inspected code does not use those Supabase auth APIs.
- Section 7 conversion table is not missing a row in the current document; it has 12 rows matching the 12 mixed files listed in section 1.

## 5. Closed Checks

- Section 4 typedefs and `packages/core/src/contracts/ports.js` are lockstep after `PhotoCurationResult`.
- Section 3 public return keys align with section 6 controllers when `store` is treated as section 5 state, not as a controller.
- Section 7 conversion table covers all current mixed UI/logic files from section 1.
- `slice-2-adapter-mapping.md` already records the seven Slice 2 decisions at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:16-26`.
