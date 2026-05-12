# Slice 3c-1 Controller Mapping (Home)

Audit date: 2026-05-09

Scope: HomeController, `createHomeViewModel.js`, `analyzeCurationReasons.js`, and the `homeImageRuntime.js` core/DOM split boundary only. This document maps current behavior for implementation planning; it does not implement controller code.

Reference docs:

- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:60-86` - target core layout with Home controller and two Home helpers.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:328-349` - required store initial state.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:403-462` - Home controller contract and DOM-only exclusions.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:661-676` - component conversion map.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:796-805` - known Home image runtime and toast risk rules.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:36-71` - PhotoPort and AiPort contracts.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:93-120` - StoragePort and ClockPort contracts.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:16-27` - Slice 2 adapter decisions.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:152-214` - PhotoPort mapping and delete/stat coupling.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:272-282` - Slice 3a decision resolutions.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:224-235` - Slice 3b decision resolutions and store-schema follow-up.

## 0. Decisions To Surface

The five decisions below are surfaced only. This document reports options and alignment facts; it does not choose implementation options.

| # | Decision | Options | Source alignment | Existing-doc alignment |
| --- | --- | --- | --- | --- |
| 1 | `daily-curation-updated` subscription path | A) Add `photoPort.onCurationUpdate(callback): unsubscribe`, adapter listens to the window event. B) Refactor PhotoService to emit through store/EventEmitter. C) Leave listener reaction out of Slice 3c-1 and rely on active calls only. | Source dispatches via `window.dispatchEvent(new CustomEvent('daily-curation-updated', ...))` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/dailyCurationRuntime.js:40-53`; source receives via `window.addEventListener` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:110-137`. Core cannot use `window`. | Instruction says Home owns "daily curation listener reaction" at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:407-415`, but current PhotoPort has no subscription method at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:47-63`; no option is explicitly defined in instruction. |
| 2 | AI batch analysis core/adapter split | A) Core owns all non-DOM analysis: batch trigger, common filter, AI call, photo state update. B) Adapter keeps AI registry/update work; HomeController calls an adapter routine. C) Hybrid: core helper owns common reason mapping, controller owns registry and AI call, individual display flow remains later. | `performBatchAnalysis` mixes common filter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:59-65`, DOM status at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:79-87`, AI call at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:89-107`, photo mutation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:109-121`, and DOM result updates at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:116-119`. | Instruction assigns "common curation reason mapping" and "batch and individual AI analysis registry coordination" to Home at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:414-415`, but risk says split `homeImageRuntime.js` last at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:798`; A/C align with §6, C is least disruptive to §13. |
| 3 | Photo list state location | A) `store.home.photos` is single source of truth after controller patches from PhotoPort. B) PhotoPort remains source of truth; store keeps metadata only. C) Hybrid cache like current manager plus PhotoService cache. | Current HomeManager copies `photoService.getPhotos()` into local state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:33-37` and `homeLoadRuntime` repeats that copy at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:91-92`; source aligns with C. | Store schema already includes `home.photos` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:43-50`, and conversion map says components render `home.getViewModel()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:668`. A gives stable view-model snapshots; B risks inconsistent UI reads; C preserves current duplication. |
| 4 | 17:00 daily reset handling | A) HomeController checks reset with ClockPort and StoragePort, preserving `last_reset_timestamp` and 17:00 cutoff. B) Leave legacy `store.checkAndResetDaily()` in bootstrap for this slice. C) Accept `deps.clock` but leave reset as placeholder for later. | `main.js` calls legacy reset at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:333-337`; legacy reset hardcodes `RESET_HOUR = 17`, reads `last_reset_timestamp`, and writes the same key at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:139-157`. | ClockPort exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:117-120`, and StoragePort supports the key at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:93-99`; instruction does not explicitly place reset under Home, so A/B/C all need a decision. |
| 5 | Profile name source | A) Read `store.get('auth.user')` only. B) Read `account.getViewModel().profile`. C) HomeController uses `authPort.getUser()` fallback. | Home currently calls `supabase.auth.getUser()` directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:111-123`, then uses `user_metadata.full_name` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:125-125`; MyPage uses the same name source at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:55-57`. | Slice 3a forbids direct cross-controller method calls at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:276-280`; Slice 3b chose account cache-first fallback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:229`. A avoids duplicate user fetches if AuthController has already filled `store.auth.user`; C matches current Home source but duplicates Account hydration. |

## 1. HomeController (createHomeController.js)

**Required methods (instruction section 6 그대로)** -

- `home.loadDailyCuration(options)`: args `options?: Object` / returns `Promise<void>` or `Promise<PhotoCurationResult>` / loads daily curation, writes photos/status/error, and preserves PhotoCurationResult shape.
- `home.getCurrentPhotoMeta()`: args none / returns `Object` / maps current photo and raw asset into metadata for input/result flows.
- `home.getCurrentImageAsFile()`: args none / returns `Promise<File|null>` / delegates current index to PhotoPort file loader.
- `home.getCurrentPhotoBase64()`: args none / returns `Promise<string|null>` / delegates current index to PhotoPort base64 loader.
- `home.movePrevious()`: args none / returns `void` / decrements current index within visible window.
- `home.moveNext()`: args none / returns `void` / increments current index within visible window.
- `home.markPrecious()`: args none / returns `Promise<void>` / records curation action `recorded`, then consumes current photo.
- `home.deleteCurrent()`: args none / returns `Promise<void>` / deletes current photo, records action `deleted`, then consumes current photo.
- `home.consumePhoto(index)`: args `index: number` / returns `Promise<void>` / removes photo from active list and manages next-batch switching/refill.
- `home.triggerBackgroundRefill()`: args none / returns `Promise<void>` / prefetches next batch, hydrates thumbs, and pre-analyzes candidates.
- `home.switchToNextBatch()`: args none / returns `Promise<void>` / swaps next batch into visible photos or reloads daily curation.
- `home.ensureVisibleImages()`: args none / returns `Promise<void>` / ensures current/side/remaining details are loaded without DOM writes.
- `home.analyzeVisiblePhotos()`: args none / returns `Promise<void>` / coordinates batch/individual AI registry, common reason mapping, and photo context updates.
- `home.getViewModel()`: args none / returns Home view model / delegates derivation to `createHomeViewModel`.

**Port dependencies** -

- `photoPort`: all PhotoPort methods in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:47-63`, especially `fetchDailyCuration`, `fetchCurationBatch`, `hydrateThumbsForPhotos`, `loadPhotoDetails`, `getPhotoAsBase64`, `getPhotoAsFile`, `getPhotoAsAnalysisBase64`, `getAnalysis`, `registerAnalysis`, `deletePhoto`, and `recordCurationAction`.
- `aiPort`: `generateDeleteRecommendation` and `generateBatchDeleteRecommendations` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:65-71`.
- `store`: `home`, `permissions.photo`, and optionally `auth.user` slices from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-51`.
- `normalizeError`: controller writes normalized `home.error`, following `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:616-635`.
- Decision-dependent `clock`: required only if Decision 4A moves the 17:00 reset into HomeController; ClockPort is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:117-120`.
- Decision-dependent `storagePort`: required only if Decision 4A persists `last_reset_timestamp`; StoragePort is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:93-99`.
- Decision-dependent `authPort`: required only if Decision 5C uses fresh `authPort.getUser()` fallback; otherwise read `store.auth.user`.

**Store writes** -

- `home.loadDailyCuration(options)`:
  - set `home.status = 'loading'`, clear `home.error`.
  - call `photoPort.fetchDailyCuration({ limit: 3, thumbSize: 300, transport: 'base64', ...options })`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:73-88`.
  - write `home.photos = result.photos` or `photoPort.getPhotos()` depending on Decision 3.
  - set `home.currentIndex = 0` when photos exist, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:96-100`.
  - set empty/error message as normalized `home.error` rather than a raw string when failures occur.
  - set `home.status = 'ready'|'empty'|'error'` in finally equivalent.
- `home.getCurrentPhotoMeta()`:
  - no write; reads `home.photos[currentIndex]` and maps fields equivalent to `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:48-70`.
- `home.movePrevious()` and `home.moveNext()`:
  - set `home.currentIndex` within `0..visibleMax-1`, replacing DOM click branches at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:92-104`.
- `home.markPrecious()`:
  - get current photo metadata.
  - call `photoPort.recordCurationAction({ assetId: current.id, action: 'recorded', dayKey: current.dayKey })`.
  - then call `home.consumePhoto(currentIndex)`.
  - current source only toast/consume happens at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:164-170`; `recorded` is supported by plugin contract at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:64-68`.
- `home.deleteCurrent()`:
  - set `home.status = 'deleting'`.
  - call `photoPort.deletePhoto(currentIndex)`.
  - if success, call `photoPort.recordCurationAction({ assetId, action: 'deleted', dayKey })`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:11-18`.
  - call `home.consumePhoto(currentIndex)`.
  - do not call `statsPort.logCurationAction`; delete already logs stats through `mutationRuntime.deletePhoto` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/mutationRuntime.js:24-35`.
- `home.consumePhoto(index)`:
  - remove photo from `home.photos` when Decision 3A/C stores active list.
  - if one photo remains and no next batch/refill, call `triggerBackgroundRefill()`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:300-319`.
  - if no photos remain, call `switchToNextBatch()`.
  - clamp `home.currentIndex`.
- `home.triggerBackgroundRefill()`:
  - set `home.isRefilling = true`.
  - call `photoPort.fetchCurationBatch({ limit: 3, forceRefresh: true })`, dedupe against current ids, hydrate thumbs, analyze batch, then set `home.nextBatch`.
  - clear `home.isRefilling` in finally, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:9-53`.
- `home.switchToNextBatch()`:
  - if `home.nextBatch` exists, move it to `home.photos`, clear `home.nextBatch`, set `home.currentIndex = 0`.
  - otherwise call `loadDailyCuration()` and then set `home.currentIndex = 0`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:343-356`.
- `home.ensureVisibleImages()`:
  - call `photoPort.loadPhotoDetails` for current/side/remaining candidates without touching DOM.
- `home.analyzeVisiblePhotos()`:
  - coordinate batch and individual analysis registry through `photoPort.getAnalysis` and `photoPort.registerAnalysis`.
  - call `aiPort.generateBatchDeleteRecommendations` and `aiPort.generateDeleteRecommendation`.
  - mutate photo fields in state or cloned photo copies according to Decision 3.
  - update `home.headerMessage` from `analyzeCurationReasons`.

**View model shape** -

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

- The shape is copied from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:436-451`.
- `profileName` currently comes from `HomeManager.user.user_metadata.full_name` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:111-125`; Decision 5 determines future source.
- `headerMessage` maps to `home.headerMessage` initialized at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:48`.
- `visiblePhotos` is `photos.slice(0, 3)` by current UI's visible max at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:192-203`.
- `progress.clearedCount` currently derives as `7 - visibleMax` in the UI at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:217-225`.
- `meta.date`, `meta.location`, and `meta.contextMessage` map to the visible current photo fields rendered at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:261-265`.
- `controls.canPrevious` and `controls.canNext` mirror `isFirst`/`isLast` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:196-203`.
- `controls.canDelete` and `controls.canMarkPrecious` are true only when `currentPhoto` exists and no destructive operation is active.

**Init sequence** -

1. Construct HomeController with `photoPort`, `aiPort`, `store`, `normalizeError`, and decision-dependent ports.
2. Register one `store.subscribe` listener.
3. Track previous `permissions.photo.authorized` value from `store.get('permissions.photo.authorized')`.
4. When `permissions.photo.authorized` transitions `false -> true`, call `home.loadDailyCuration()` if `home.photos.length === 0` and `home.status` is not loading.
5. This replaces the current callback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:147-155`.
6. The rule is locked by Slice 3a decision #5 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:280` and mirrored in PermissionController comments at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:8-13`.
7. If Decision 1A is chosen, register `photoPort.onCurationUpdate` and update `home.photos/currentIndex/error` from the callback.
8. If Decision 4A is chosen, run reset check before `loadDailyCuration()` or during `init`, using `clock.now()` and `storagePort`.
9. Do not perform DOM render, toast, `window` dispatch/listen, carousel setup, or `scrollIntoView` in init.

**Source mapping** -

- HomeManager constructor state maps to store initialization and controller setup: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:13-31`.
- `loadRealPhotos()` maps to `home.loadDailyCuration(options)`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:33-38` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:56-108`.
- `getCurrentImageAsFile()` maps to `home.getCurrentImageAsFile()`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:40-42`.
- `getCurrentPhotoBase64()` maps to `home.getCurrentPhotoBase64()`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:44-46`.
- `getCurrentPhotoMeta()` maps to `home.getCurrentPhotoMeta()`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:48-70`.
- Event branches for precious/delete/retry/prev/next are split: controller actions come from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:72-107`; actual DOM event delegation remains Slice 5.
- `render()` data derivation for profile, visible photos, progress, meta, and controls maps to `createHomeViewModel`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:109-203`.
- `render()` DOM templates and `innerHTML` remain Slice 5: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:127-281`.
- `requestAnimationFrame`, `scrollIntoView`, and carousel setup remain Slice 5 DOM adapter: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:283-291`.
- `consumePhoto`, refill trigger, and batch switching map to controller: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:300-357`.
- Daily curation result shape maps to Slice 2 decision #1 and PhotoCurationResult: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:20` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:36-45`.
- Background prefetch maps to `triggerBackgroundRefill()` and `analyzeVisiblePhotos()`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:9-53`.
- Delete flow maps to `deleteCurrent()` plus confirm modal outside core: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:4-41`.
- Home image runtime split is detailed in Section 4.

**Method-by-method implementation notes** -

- `loadDailyCuration(options)` should preserve the source global timeout intent from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:5-10`, but it must not call `performance.now()` or `localStorage` unless those are explicitly provided as ports or kept outside core.
- `loadDailyCuration(options)` must consume the rich result object from Slice 2 decision #1 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:20`, not collapse it into an array.
- `loadDailyCuration(options)` should convert timeout/permission failures into `normalizeError(error, 'home')`; legacy `isPhotoPermissionError` and `handleError` behavior comes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:36-48`.
- `getCurrentPhotoMeta()` must preserve `assetId`, `dayKey`, `curationScore`, and `curationReasons` because `main.js` currently uses `assetId` to find and consume the precious target at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:164-170`.
- `getCurrentImageAsFile()` keeps the file path used by future Input/Result handoff; current source directly delegates to `photoService.getPhotoAsFile(this.currentIndex)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:40-42`.
- `getCurrentPhotoBase64()` keeps the base64 handoff path; current source directly delegates to `photoService.getPhotoAsBase64(this.currentIndex)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:44-46`.
- `movePrevious()` and `moveNext()` should not call render; Slice 5 DOM subscribes to store updates and rerenders after `home.currentIndex` changes.
- `markPrecious()` should not call `showToast`; current toast text lives in `main.js` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:167` and belongs to UI adapter or toast presenter.
- `markPrecious()` should use `recordCurationAction` before `consumePhoto`, because after consumption the current photo may no longer be addressable by index.
- `deleteCurrent()` should leave confirm modal ownership out of core; modal source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:31-40`.
- `deleteCurrent()` must treat `photoPort.deletePhoto(index)` returning false as a non-consume path, matching current source branch at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:12-25`.
- `consumePhoto(index)` should be index-based for parity with current code, but the implementation should capture `assetId` before mutation for logging and action calls.
- `triggerBackgroundRefill()` should dedupe by `id`, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:25-32`.
- `triggerBackgroundRefill()` should use `Promise.allSettled` style tolerance for hydrate and analysis, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeRefillRuntime.js:34-45`.
- `switchToNextBatch()` should not duplicate loading state when it falls back to `loadDailyCuration()`, matching source comment at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:350-354`.
- `ensureVisibleImages()` should load current first and sides/remaining after, preserving the perceived priority encoded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:32-43`.
- `analyzeVisiblePhotos()` should batch at least two pending targets, preserving `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:18-30`.
- `analyzeVisiblePhotos()` should keep registry keys stable: current batch key is `batch:${assetIds.join('|')}` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:70-76`.
- `getViewModel()` should be sync and side-effect free; async loads belong to controller methods so DOM adapters can render deterministic snapshots.

**Out-of-core behavior to preserve elsewhere** -

- Performance persistence to `perf_runs` currently writes localStorage at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:12-24`; this is not HomeController unless a StoragePort-backed telemetry decision is made.
- Stale/native-timeout toast behavior currently lives at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:26-34` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:50-54`; this belongs to DOM/toastPresenter.
- `daily-curation-updated` visible-container detection currently reads `manager.container` and classes at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:129-135`; core should replace that with state updates only.
- Carousel snapping geometry currently reads `scrollLeft`, `offsetWidth`, and item offsets at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:221-252`; DOM adapter calls `home.movePrevious()` or `home.moveNext()` after determining direction.
- Current image `backgroundImage` reflection at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:254-276` becomes view-model-driven image URL rendering in Slice 5.

**Cross-controller couplings** -

- Permissions: HomeController subscribes to `store.permissions.photo.authorized`; PermissionController does not call Home directly, per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:280`.
- Auth: profile name should prefer `store.auth.user` if Decision 5A is chosen; direct AuthController method calls remain forbidden by `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:276-282`.
- Account: avoid calling AccountController for profile unless Decision 5B explicitly accepts that coupling.
- Navigation: HomeController should not call NavigationController; DOM app can navigate home and then HomeController reacts to permissions/state.
- Notifications: no direct coupling. Notification action may navigate home through NavigationController, then DOM/Home subscription can render current state.
- Stats: `deleteCurrent()` must not call StatsPort; Slice 2 notes `mutationRuntime.deletePhoto` already logs stats at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:210` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:370`.

**Smoke validation path** - Set `permissions.photo.authorized` from false to true, expect one `photoPort.fetchDailyCuration` call, `store.home.photos` populated, `home.getViewModel().visiblePhotos.length <= 3`, `markPrecious()` records `action: 'recorded'` then consumes current photo, and `deleteCurrent()` deletes once without any StatsPort call.

## 2. createHomeViewModel.js (helper)

**Input** -

- `state.home.status` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:43-50`.
- `state.home.error` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:44-45`.
- `state.home.photos` and `state.home.currentIndex` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:46-47`.
- `state.home.headerMessage` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:48`.
- `state.auth.user` if Decision 5A is chosen, from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:31`.
- Optional `now` or clock-derived value only if a future date display requires current time; current source uses photo date, not clock.

**Output shape** -

- `status`: copied from `state.home.status`.
- `error`: copied from `state.home.error`.
- `profileName`: `state.auth.user?.user_metadata?.full_name || '사용자'` for Decision 5A, matching source fallback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:125`.
- `headerMessage`: copied from state, defaulting to `'기기에서 찾아낸 비우기 좋은 기록들입니다.'`.
- `photos`: full active array snapshot.
- `currentIndex`: clamped index.
- `visiblePhotos`: currently first 3 photos, because HomeManager uses `VISIBLE_COUNT = 3` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:192-193`.
- `currentPhoto`: `visiblePhotos[currentIndex] || null`.
- `progress`: `{ clearedCount, targetCount: 7, percent }`, deriving `targetCount = 7` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:219-224`.
- `meta`: `{ date: currentPhoto?.date || '', location: currentPhoto?.location || '', contextMessage: currentPhoto?.contextMessage || '' }`.
- `controls`: `{ canPrevious, canNext, canDelete, canMarkPrecious }`.
- The exact required top-level shape is fixed by `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:436-451`.

**Pure-ness rule** -

- The helper receives a state snapshot and optional derived inputs; it must not call `store.get`, `store.set`, or `store.patch`.
- The helper must not call `photoPort`, `aiPort`, `authPort`, `account`, `navigation`, `window`, `document`, `localStorage`, `performance`, or `console`.
- The helper must not mutate `photos`; it should derive arrays/objects from input values only.
- The helper may accept `now` as a primitive input if Decision 4A later needs date-derived fields; it should not call `clock.now()` itself.
- The helper must preserve UI freedom: no Korean UI paragraph beyond existing data strings except default fallback values that already exist in current source.
- The helper is the only place that should compute `canPrevious`, `canNext`, `canDelete`, and `canMarkPrecious` so any future design gets consistent controls.

## 3. analyzeCurationReasons.js (helper)

**Source extraction range** -

- Move the common-reason intersection logic from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:137-147`.
- Move the header reason mapping and priority logic from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:152-194`.
- Do not move DOM reads/writes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:153-158` or `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:191-193`.
- Preserve the default message currently assigned at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:156-158`.

**Function signature** -

```js
analyzeCurationReasons(photosOrReasons, options = {}) => {
  commonReasons: Array<string>,
  headerMessage: string,
  matchedReason: string|null
}
```

- `photosOrReasons` may be an array of photos or an array of reason strings; implementation should choose one stable contract before coding.
- If photos are passed, compute intersection from each `photo.rawAsset?.curationReasons || []`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:137-147`.
- `options.locale` is not present in current source; current mapping is Korean-only.
- `matchedReason` should expose the flag that selected `headerMessage` for debugging/tests.

**Mapping table** -

- `unorganized` -> `앨범에 정리되지 않은 사진들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:164`.
- `screenshot` -> `스크린샷 기록들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:165`.
- `large` -> `공간을 많이 차지하는 대용량 파일들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:166`.
- `old` -> `1년 이상 된 오래된 사진들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:167`.
- `burst_day` -> `비슷한 사진이 많은 날의 기록들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:168`.
- `icloud_only` -> `iCloud에만 저장된 사진들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:169`.
- `앨범 미분류` -> `앨범에 정리되지 않은 사진들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:171`.
- `스크린샷` -> `스크린샷 기록들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:172`.
- `대용량 파일` -> `공간을 많이 차지하는 대용량 파일들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:173`.
- `오래된 사진` -> `1년 이상 된 오래된 사진들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:174`.
- `즐겨찾기 됨` -> `특별히 아꼈던 기록들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:175`.
- Unknown first reason -> `정리하기 좋은 기록들을 모아봤어요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:180-181`.
- Empty reasons -> `기기에서 찾아낸 비우기 좋은 기록들입니다.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:156-158`.
- Priority override: `(old || 오래된 사진) && (unorganized || 앨범 미분류)` -> `1년 넘게 앨범에 정리되지 않은 사진들이에요.` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:183-186`.

**Edge cases** -

- Empty photo array returns empty `commonReasons` and default header.
- A photo without `rawAsset` or `curationReasons` contributes an empty set, matching current optional chaining at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:140`.
- Unknown flags should not throw; use fallback header.
- Locale is currently Korean-only. If `options.locale !== 'ko'`, preserve Korean fallback unless a later slice adds localized strings.
- The helper must not call DOM, manager methods, PhotoPort, AiPort, `console`, or `normalizeError`.

## 4. homeImageRuntime Split Boundary Mapping

**Stays in core (controller / helper)** -

- `loadAndReflectImages` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:9-30`: chooses current/prev/next/index-2 targets and marks batch targets; maps to `home.ensureVisibleImages()` and `home.analyzeVisiblePhotos()` if Decision 2A/C is chosen.
- `triggerBatchAnalysis` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:48-51`: core wrapper around batch analysis.
- `performBatchAnalysis` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:56-78`: target validation, common reason calculation, fetch registry key, existing promise reuse.
- `performBatchAnalysis` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:89-107`: PhotoPort analysis base64 calls and AiPort batch recommendation call.
- `performBatchAnalysis` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:109-131`: photo context mutation, fetch flag clearing, registry registration, error reset behavior.
- `calculateCommonFilter` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:137-147`: pure intersection logic, moved to `analyzeCurationReasons.js`.
- `updateCurationHeader` mapping lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:161-186`: pure mapping/priority logic, moved to `analyzeCurationReasons.js`.
- `prefetchRemaining` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:197-219`: non-DOM detail prefetch through PhotoPort.
- `loadSingleImageAndUpdate` line `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:256`: `loadPhotoDetails(index)` maps to `photoPort.loadPhotoDetails`.
- `handleAIContextDisplay` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:290-343`: individual analysis registry, PhotoPort analysis base64 call, AiPort delete recommendation call, context mutation.

**Moves to slice 5 DOM adapter** -

- `loadAndReflectImages` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:32-43`: current/side image load sequencing is split; DOM adapter owns element IDs and visual reflection.
- `performBatchAnalysis` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:79-87`: `document.getElementById('meta-context')`, text update, and `animate-pulse`.
- `performBatchAnalysis` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:116-119`: immediate meta-context DOM result update.
- `updateCurationHeader` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:153-158` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:188-193`: header element lookup/text write; controller should set `home.headerMessage` only.
- `setupCarouselSnap` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:221-252`: scroll listener, geometry, debounce, and DOM wrapper state.
- `loadSingleImageAndUpdate` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:257-276`: element lookup, `backgroundImage`, location text, and meta-context wiring.
- `handleAIContextDisplay` lines `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:282-289`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:294-315`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:328-339`: DOM status/result/fallback text and `animate-pulse`.
- Instruction lists these exact DOM-only exclusions at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:454-462`.

**Currently coupled, needs Decision 2 to fully split** -

- `performBatchAnalysis` currently updates both photo objects and visible `meta-context`; Decision 2 selects whether AI registry/Promise coordination moves now or remains adapter-bound.
- `handleAIContextDisplay` currently owns both individual AI Promise coordination and DOM loading text; Decision 2C can postpone this individual flow to Slice 4/5 while still extracting batch helper logic now.
- `loadSingleImageAndUpdate` returns no view model event; after split, controller must expose loaded photo/context state and DOM adapter must observe it.
- The current file imports `GeminiService` directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeImageRuntime.js:1-4`; core controller must use AiPort and PhotoPort instead.
- The current file has 344 lines, confirmed by `wc -l`; all DOM paths must remain outside core until Slice 5.

## 5. Cross-slice Impact Summary (read-only)

- Decision 1A requires a typedef patch: add `PhotoPort.onCurationUpdate(callback): unsubscribe` to `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:47-63`, then patch the adapter and instruction doc in lockstep.
- Decision 1B requires service refactor in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo/dailyCurationRuntime.js:40-53`, which is broader than controller-only work.
- Decision 1C leaves automatic daily update reaction for Slice 4+ reactor/DOM adapter while preserving active `loadDailyCuration()` paths in Slice 3c-1.
- Decision 2A/C requires `createHomeController.js` to receive both `photoPort` and `aiPort`; `createRecocoCore.js` currently leaves `home: null` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:80-94`.
- Decision 3A needs no store schema addition because `home.photos` already exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:43-50`.
- Decision 3B would make `getViewModel()` depend on PhotoPort reads; that weakens snapshot consistency for Slice 5 UI subscriptions.
- Decision 4A requires `createRecocoCore` to inject `clock` and `storagePort` into HomeController; `clock` is already accepted in deps at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:16-30`.
- Decision 4A must preserve `last_reset_timestamp` and the 17:00 cutoff from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/state/StateManager.js:139-157`.
- Decision 5A needs no schema change because `auth.user` already exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:31`.
- Decision 5C requires `authPort` injection into HomeController and risks duplicate user fetches with AccountController's cache-first hydrate decision at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:229`.
- `home.markPrecious()` must use `recordCurationAction({ action: 'recorded' })`; plugin action values are fixed at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:64-68`.
- `home.deleteCurrent()` must not call `statsPort.logCurationAction`; Slice 2 already flags duplicate stats risk at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:210`.
- Toasts stay outside controller: current load/delete paths call `showToast` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeLoadRuntime.js:26-34` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home/homeDeleteRuntime.js:23-28`; controllers must only set normalized `home.error` per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:805`.

**Implementation validation checklist for Slice 3c-1** -

- Verify `packages/core/src/home/createHomeController.js` imports no DOM, platform, service singleton, Supabase, or Capacitor code.
- Verify `packages/core/src/home/createHomeViewModel.js` is synchronous and side-effect free.
- Verify `packages/core/src/home/analyzeCurationReasons.js` has no store, port, DOM, or console dependency.
- Verify `createRecocoCore.js` replaces `home: null` with a HomeController only when the selected dependency set is present.
- Verify `home.loadDailyCuration()` uses `PhotoCurationResult.photos`, not a bare array assumption.
- Verify `home.markPrecious()` records `action: 'recorded'` before consuming.
- Verify `home.deleteCurrent()` records `action: 'deleted'` only after `photoPort.deletePhoto` returns success.
- Verify `home.deleteCurrent()` has no StatsPort dependency.
- Verify permission subscription fires only on `false -> true`, not on every store update.
- Verify `home.getViewModel()` exposes `visiblePhotos`, `currentPhoto`, `progress`, `meta`, and `controls` for DOM-only HomeManager rendering.
- Verify Decision 1A is not implemented unless `PhotoPort.onCurationUpdate` is patched first.
- Verify Decision 4A is not implemented unless `clock` and `storagePort` are injected into HomeController.
- Verify all legacy toast behavior is delegated to UI/toastPresenter or left in existing components until Slice 5.
- Verify `homeImageRuntime.js` remains untouched in Slice 3c-1 unless the implementation task explicitly includes code extraction.

## Decision Resolutions (Slice 3c-1)

| # | Resolved option | Rationale |
| --- | --- | --- |
| 1 | **C** — listener reaction is left out of Slice 3c-1; HomeController relies on active call paths only (`loadDailyCuration`, `triggerBackgroundRefill`, etc.). | Instruction §13 "split it last" + main.js still owns the legacy `window` event listener until slice 5; no `PhotoPort` typedef change in this slice. Slice 4+ reactor will introduce `onCurationUpdate` if needed. |
| 2 | **C** — Hybrid: `analyzeCurationReasons.js` extracted as pure helper; HomeController owns batch registry + AI call orchestration; individual per-photo display flow (`handleAIContextDisplay` style) is deferred to slice 4/5. | Aligns §13 deferral rule with §6 Home responsibility list. Pure helper is movable now without risking AI/DOM coupling regression. |
| 3 | **A** — `store.home.photos` is the single source of truth. HomeController patches `store.home.photos` after every PhotoPort fetch/mutation. | Snapshot-consistent view models for slice 5. No store schema change (`home.photos` already exists). |
| 4 | **B** — legacy `store.checkAndResetDaily()` stays in `main.js`. HomeController does not consume `clock` or `storagePort` for reset in Slice 3c-1. | Reset is orthogonal to curation flow. main.js is untouched until slice 4. Migration can move into a later slice with its own decision log. |
| 5 | **A** — view model reads `state.auth.user.user_metadata.full_name` only, falling back to `'사용자'` if null. | Matches slice-3a/3b "no cross-controller method calls" pattern. AuthController.init prefills the cache. Avoids duplicate user fetch with AccountController. |

Slice 3c-1 controllers are constructed by `createRecocoCore(ports)` and not yet consumed by `main.js`. `homeImageRuntime.js` remains untouched (per decision 2C); pure helpers (`analyzeCurationReasons.js`) are independently authored in core without removing the original duplicate code (DOM-coupled copy stays until slice 5).
