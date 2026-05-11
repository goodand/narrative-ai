# Slice 3c-3 Controller Mapping (Report)

Audit date: 2026-05-09

Reference docs:
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:521-539` — Report controller contract and helper extraction.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:86-91` — `StatsPort`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:12-20` — `AuthPort` user fallback methods.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:117-120` — `ClockPort`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:336-374` — StatsPort mapping and double-log risk.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:272-282` — Slice 3a cross-controller rule.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:224-232` — Slice 3b cache-first user pattern.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3c2-controller-mapping.md:289-304` — Slice 3c-2 resolved decisions and schema-addition precedent.

## 0. Decisions To Surface

| # | Question | Options | Source alignment | Existing-doc alignment |
|---|---|---|---|---|
| 1 | Should aggregation receive `nowDate` or should ReportController receive `ClockPort` directly? | A) `aggregateReportStats({ userStats, detoxLogs, nowDate })`; controller calls `clock.now()`. B) Helper calls `new Date()` directly. C) Controller passes timestamp number from `clock.now().getTime()`. | Source currently violates pure helper boundaries by calling `new Date()` inside `_analyzeWeeklyTrends` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-114` and `_isCurrentDay` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:156-159`. A/C preserve source behavior while making time injectable. | Instruction explicitly says extract pure aggregation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:539`. `ClockPort.now()` exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:117-120`, and `createAppPorts` already returns `clock` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:121-122`. |
| 2 | Who owns in-flight request sequencing? | A) ReportController keeps a request sequence counter and ignores stale responses. B) Omit stale response handling in slice 3c-3. C) Use AbortController and cancel earlier port requests. | Source aligns with A: `_requestSeq` is initialized at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:25`, incremented at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:167-170`, and checked before final render at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:177-180`. | Instruction does not mention sequencing; it only lists `report.load()` and `report.getViewModel()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:532-537`. A needs no port change. C would need `StatsPort` signal support because current typedef has only `getUserStats(userId)` and `getDetoxLogs(userId, sinceIso)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:86-91`. |
| 3 | Where should the static tips string live? | A) Helper returns `tips` in aggregate result. B) ReportController owns fallback `tips` and patches stats. C) `getViewModel()` derives tips from stats. | Source stores the tip in `DEFAULT_STATS.tips` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:8-15` and renders it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:263-270`. Source alignment is strongest for A or B because the string is part of the stats object, not DOM-only text. | Instruction requires default stats fallback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:530`. Current store has `report.stats` only, so any option can keep schema stable at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:68`. |
| 4 | Who computes the current day column highlight? | A) Aggregate result includes `todayUiIdx: 0..6`. B) View model calls `new Date()` on each read. C) Slice 5 DOM computes it directly. | Source aligns with C today: `_renderShell` calls `_isCurrentDay(i)` while rendering labels at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:234-238`, and `_isCurrentDay` reads `new Date()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:156-159`. A moves the same calculation into pure aggregation with injected time. | Instruction names daily graph data calculation as controller/helper scope at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:529`. B conflicts with the pure-helper direction. A needs no ports.js patch if Decision 1A/C already injects time. |
| 5 | Where does ReportController get the user id? | A) `store.get('auth.user')?.id` only. B) `authPort.getUser()` only. C) Cache-first store read, fallback to `authPort.getUser()`. | Source aligns with C: `loadStats()` tries `getCurrentUser() || this.user || (await supabase.auth.getUser()).data?.user` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:31-38`; `main.js` supplies `getCurrentUser: () => window.__recocoCurrentUser` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:180-182`. | Slice 3b resolved account hydrate as cache-first fallback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:228-229`. Slice 3a forbids direct controller method calls, but direct `authPort.getUser()` use is allowed by same-domain port orchestration pattern at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:276-282`. |

## 1. ReportController (createReportController.js)

**Required methods (instruction §6 그대로)**
- `report.load()`: no args; loads current user's report data through `StatsPort`, aggregates it, and writes `store.report`.
- `report.getViewModel()`: no args; returns UI-safe report state derived from `store.report`, auth profile, and decision-dependent fields.

**Port dependencies**
- `statsPort.getUserStats(userId)` for `user_stats` read, from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:86-91`.
- `statsPort.getDetoxLogs(userId, sinceIso)` for 14-day `detox_logs` read, same typedef range.
- `authPort.getUser()` only if Decision 5B or 5C is chosen; AuthPort exposes this at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:17-18`.
- `clock.now()` if Decision 1A or 1C is chosen; `createAppPorts()` already assembles `clock` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:107-122`.
- `store`, specifically `auth.user` and `report.status/error/stats`.
- `normalizeError(error, context)` for controller error state; no `ReportManager._normalizeError` clone.
- No direct Supabase import, no DOM API, and no `StatsService` import in the controller.

**Store writes**
- `report.load()` starts by writing `report.status = 'loading'` and `report.error = null`.
- If no user is available, `report.load()` writes `report.status = 'error'` and a normalized auth/user error into `report.error`.
- After successful port reads, `report.load()` writes `report.stats = aggregateReportStats(...)`.
- After successful aggregation, `report.load()` writes `report.status = 'ready'` or equivalent terminal success state.
- On failure, `report.load()` writes `report.status = 'error'` and `report.error = normalizeError(error, 'ReportController.load')`.
- If Decision 2A is chosen, stale responses should not write anything after their sequence check fails.
- `report.getViewModel()` writes nothing.
- Current store already has the needed report container: `{ status: 'idle', error: null, stats: null }` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:68`.

**View model shape**
- `status: 'idle' | 'loading' | 'ready' | 'error'` from `store.report.status`.
- `error: Object|string|null` from `store.report.error`.
- `isLoading: boolean`, derived from `status === 'loading'`.
- `profileName: string`, derived from `store.auth.user?.user_metadata?.full_name?.split(' ')[0] || '사용자'`, matching source fallback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:187-189`.
- `loadingText: string`, derived from loading/error/profile state, matching source copy at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:187-189`.
- `stats.weeklyCount: number`.
- `stats.weeklyChange: string`.
- `stats.totalBytesGB: string`.
- `stats.totalCount: string`.
- `stats.dailyData: [number, number, number, number, number, number, number]`.
- `stats.tips: string`.
- `stats.todayUiIdx?: number`, decision-dependent; include if Decision 4A is chosen.
- `controls.canRetry: boolean`, true when `status === 'error'`.

**Init sequence**
- n/a — instruction §6 defines `report.load()` but no `report.init()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:532-537`.
- In practice, `report.load()` is the load/init action for the report screen.
- Current `ReportManager.render()` calls `_hydrateStats()` immediately at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:162-165`; after conversion, slice 5 DOM navigation should call `report.load()` when the report view is entered.

**Expected `load()` flow**
1. Increment local request sequence if Decision 2A is chosen.
2. Patch `report.status = 'loading'` and `report.error = null`.
3. Resolve user id from `store.auth.user` and/or `authPort.getUser()` according to Decision 5.
4. If user id is missing, write error state and stop before any StatsPort call.
5. Read `now` from `clock.now()` if Decision 1A or 1C is chosen.
6. Compute `fourteenDaysAgo` from that injected time and convert it to ISO.
7. Call `statsPort.getUserStats(userId)` and `statsPort.getDetoxLogs(userId, sinceIso)` in parallel.
8. Pass returned rows plus injected time into `aggregateReportStats`.
9. Before writing final state, compare request sequence if Decision 2A is chosen.
10. Patch `report.stats`, `report.status = 'ready'`, and `report.error = null`.
11. On thrown error, normalize and write `report.status = 'error'`.
12. Never call `_renderShell`, `handleError`, toast, or Supabase from this flow.

**Source mapping**
- Direct Supabase reads in `loadStats()` map to `statsPort.getUserStats` and `statsPort.getDetoxLogs`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:31-85`.
- 14-day `sinceIso` computation maps to controller before `statsPort.getDetoxLogs`: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:41-42`.
- GB and count formatting source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:65-70`.
- Weekly trend aggregation source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-139`.
- Daily graph count source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:141-150`.
- Request sequencing source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:167-181`.
- DOM shell source stays outside core: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:184-275`.
- SVG path generation source stays UI/helper-level outside report core unless a later view-model decision changes it: `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:277-291`.

**Cross-controller couplings**
- Auth dependency is store/port-based only. ReportController should not call AuthController methods, following slice 3a decision #1 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:276-282`.
- Navigation does not call ReportController directly today; it lazily creates `ReportManager` then navigates at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:259-262`.
- Slice 5 DOM adapter should trigger `report.load()` when report view enters, replacing `ReportManager.render() -> _hydrateStats()`.
- ReportController must not call `statsPort.logCurationAction`; Report reads use only `getUserStats` and `getDetoxLogs`.
- Home deletion double-log risk remains outside ReportController; slice 2 flags it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:368-372`.

**Smoke validation path**
- With `auth.user.id` set and fake `statsPort` returning one current-week log plus `userStats`, call `report.load()`; expect `store.report.status = 'ready'`, `weeklyCount = 1`, `dailyData.length = 7`, formatted totals, and no DOM or Supabase import from core.

## 2. aggregateReportStats.js (helper)

**Source extraction range**
- Default stats shape comes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:8-15`.
- User total formatting comes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:65-70`.
- Monday-start weekly grouping comes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-123`.
- Weekly count and weekly change calculation comes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:125-138`.
- Daily graph 7-element array calculation comes from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:141-150`.
- Current-day UI index calculation source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:156-159`.

**Function signature**
- Preferred Decision 1A signature: `aggregateReportStats({ userStats, detoxLogs, nowDate, tips })`.
- Decision 1C variant: `aggregateReportStats({ userStats, detoxLogs, nowMs, tips })`.
- `userStats`: `{ total_cleared_bytes?: number|string|null, total_cleared_count?: number|string|null, last_activity_date?: string|null } | null`.
- `detoxLogs`: `Array<{ cleared_at: string }>`; should already be filtered to the 14-day query window by `ReportController`.
- `nowDate`: Date-like value supplied by `clock.now()`, not read inside helper.
- `tips`: optional string fallback; default source string is `'비움 분석을 위해 더 많은 사진을 정리해보세요!'`.
- Output: `{ weeklyCount: number, weeklyChange: string, totalBytesGB: string, totalCount: string, dailyData: number[], tips: string, todayUiIdx?: number }`.

**Aggregation rules**
- 14-day window: controller computes `fourteenDaysAgo` with `setDate(now.getDate() - 14)` before `statsPort.getDetoxLogs`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:41-42`.
- Monday-start calculation: `const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1);`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:105-112`.
- Current week logs: `new Date(log.cleared_at) >= thisMonday`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:118-123`.
- Previous week logs: `lastMonday <= logDate < thisMonday`, same source range.
- `weeklyCount`: `currentWeekLogs.length`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:125-127`.
- Weekly change: if `prevCount === 0`, return `'+100%'` when `currentCount > 0`, otherwise `'0%'`; else `Math.round(((currentCount - prevCount) / prevCount) * 100)` with explicit sign, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:129-138`.
- Daily graph: initialize `[0,0,0,0,0,0,0]`, compute `dayIdx = date.getDay() - 1`, remap Sunday `-1` to `6`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:141-150`.
- GB conversion: `(clearedBytes / (1024 * 1024 * 1024)).toFixed(1)`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:65-69`.
- Total count formatting: `Number(...).toLocaleString()`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:66-70`.

**Edge cases**
- Empty logs: `weeklyCount = 0`, `weeklyChange = '0%'`, `dailyData = [0,0,0,0,0,0,0]`.
- Null `userStats`: totals fall back to `totalBytesGB = '0.0'` and `totalCount = '0'`, matching current default stats at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:8-15`.
- Fewer than seven current-week logs still produce a 7-element `dailyData` array; missing days remain zero.
- Sunday handling must map `Date.getDay() === 0` to UI index `6`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:145-147`.
- Invalid or missing `cleared_at` should be ignored or treated as zero-impact; current source does not guard this, so implementation should choose the smallest non-crashing behavior and document it.
- `prevCount === 0` is a special branch and must not divide by zero.

**Minimum helper validation cases**
- Monday now + one Monday log: `weeklyCount = 1`, `dailyData[0] = 1`.
- Sunday now + one Sunday log: Monday-start week still maps Sunday to `dailyData[6]`.
- Current week 2 logs, previous week 1 log: `weeklyChange = '+100%'`.
- Current week 0 logs, previous week 0 logs: `weeklyChange = '0%'`.
- Current week 1 log, previous week 0 logs: `weeklyChange = '+100%'`.
- Current week 1 log, previous week 2 logs: `weeklyChange = '-50%'`.
- `total_cleared_bytes = 1073741824`: `totalBytesGB = '1.0'`.
- `total_cleared_count = 1200`: `totalCount` uses locale string formatting.
- Null `userStats` and empty logs: exact default stats shape.
- Logs outside the queried 14-day window should not appear if controller computes `sinceIso` correctly.
- If helper defensively filters logs by `nowDate`, older rows should not affect weekly counts.
- Helper output must never include DOM markup, class names, SVG paths, or localized label text like `월`.

**Pure-ness rule**
- No DOM access.
- No store reads or writes.
- No port calls.
- No console logging.
- No zero-argument `new Date()` or implicit current time reads; date objects may be constructed from explicit inputs.
- No mutation of input arrays or input row objects.
- No localization side effects beyond deterministic `toLocaleString()` behavior already present in source.

## 3. ReportManager.js — core/DOM line 분리

| Method | Source lines | Classification | Mapping |
|---|---:|---|---|
| `constructor` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:18-26` | Mixed — 분리 필요 | `document.getElementById` is DOM slice 5; `user`, `stats`, `isLoading`, `loadError`, `_requestSeq` map to `store.report` plus optional controller-local sequence. |
| `loadStats` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:31-85` | Mixed — 분리 필요 | User resolution and port reads map to ReportController; Supabase direct import disappears; aggregation lines move to helper; console warnings are adapter/controller diagnostic only. |
| `_normalizeError` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:87-96` | Core (controller) | Replace with shared `normalizeError(error, context)`; no bespoke method needed in ReportController. |
| `_analyzeWeeklyTrends` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:101-139` | Core (helper) | Move Monday-start grouping, current/previous week counts, weekly count, and weekly change to `aggregateReportStats.js`. |
| `_processWeeklyGraphData` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:141-150` | Core (helper) | Move 7-element daily array and Sunday remap to `aggregateReportStats.js`. |
| `_isCurrentDay` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:152-160` | Mixed — 분리 필요 | If Decision 4A, helper returns `todayUiIdx`; if Decision 4C, DOM keeps this; B should be avoided for pure view model. |
| `render` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:162-165` | Mixed — 분리 필요 | Shell rendering is DOM slice 5; data load trigger maps to slice 5 calling `report.load()` on report view entry. |
| `_hydrateStats` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:167-181` | Mixed — 분리 필요 | Request sequence/status/error maps to ReportController; `_renderShell()` calls stay DOM and react to view model changes. |
| `_renderShell` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:184-275` | DOM (slice 5) | Convert to renderer consuming `report.getViewModel()`. Profile/loading text can be view model fields; SVG and labels remain UI render work. |
| `_generateSVGPath` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:277-291` | DOM (slice 5) | It is deterministic, but returns SVG markup. Keep it in DOM adapter or UI utility, not headless report core. |

Additional split notes:
- `DEFAULT_STATS` itself is core-compatible data and should be recreated in `aggregateReportStats.js` or ReportController, not imported from the component.
- `supabase` import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:6` disappears from converted UI and controller.
- `profileName` calculation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:187` should move to view model, not helper.
- `loadingClass` is DOM styling state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:188`; view model should expose `isLoading`, not class names.
- Graph label emphasis currently calls `_isCurrentDay(i)` inside template at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ReportManager.js:234-238`; Decision 4 determines whether that value is precomputed.

## 4. Cross-slice impact summary

| Decision | Store schema impact | Instruction §6 impact | `createRecocoCore` wiring impact | Ports impact |
|---|---|---|---|---|
| 1A | None beyond `report.stats`. | None. | Inject `clock` into ReportController. `createRecocoCore` already accepts `clock` in deps at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:19-33`. | None; ClockPort exists. |
| 1B | None. | Conflicts with pure helper direction. | No clock injection. | None, but not recommended by existing contract. |
| 1C | None beyond possible `todayUiIdx`. | None. | Inject `clock`, then pass timestamp. | None; ClockPort exists. |
| 2A | No store key needed if sequence is controller-local. | None. | No extra dependency. | None. |
| 2B | None. | None, but drops source stale-response behavior. | None. | None. |
| 2C | None. | Likely method/adapter behavior clarification needed. | No controller dependency beyond abort handles. | `StatsPort` would need abort/signal support because current methods accept no options. |
| 3A | `stats.tips` included inside `report.stats`. | None. | None. | None. |
| 3B | `stats.tips` still included before store write. | None. | None. | None. |
| 3C | No stats schema change if tips is view model only. | None. | None. | None. |
| 4A | Add `stats.todayUiIdx` or top-level view model field. | None. | Depends on Decision 1 clock injection. | None. |
| 4B | None. | Conflicts with pure view model/helper direction. | Depends on clock if not using raw Date. | None. |
| 4C | None. | None, but leaves date UI logic in slice 5 DOM. | None. | None. |
| 5A | None; uses existing `auth.user`. | None. | No `authPort` required for report. | None. |
| 5B | None. | None. | Inject `authPort` into ReportController. | None; AuthPort exists. |
| 5C | None. | None. | Inject `authPort` and read store cache first. | None; matches slice 3b cache-first pattern. |

Current core wiring status:
- `createRecocoCore` imports all controllers through result only; no ReportController import exists yet at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-10`.
- `input` and `result` are wired, but report remains a placeholder at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:110-121`.
- Slice 3c-3 implementation should add `packages/core/src/report/createReportController.js` and `packages/core/src/report/aggregateReportStats.js`.
- `StatsPort` is already assembled in `createAppPorts()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:95-117`.
- `ClockPort` is already assembled at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/time/systemClockPort.js:11-16`.
- No ports.js change is required for the expected path.
- No StatsService change is required; `StatsService.logDetox` remains write-side behavior at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/StatsService.js:14-74`.
- `statsPort.logCurationAction(payload)` stays unrelated to ReportController; report reads are `getUserStats` and `getDetoxLogs` only.

Implementation guardrails for the next agent:
- Keep `aggregateReportStats.js` pure and unit-testable.
- Keep DOM graph markup and `_generateSVGPath` outside the headless core.
- Preserve 14-day query window before fetching `detox_logs`.
- Preserve Monday-start semantics and Sunday index remap.
- Preserve default stats fallback when stats rows or logs are absent.
- Preserve existing stale request guard if Decision 2A is chosen.
- Use `normalizeError` and write `store.report.error`; do not call toast or `handleError` from core.

## Decision Resolutions (Slice 3c-3)

| # | Resolved option | Rationale |
| --- | --- | --- |
| 1 | **A** — `aggregateReportStats({ userStats, detoxLogs, nowDate, tips })` receives a `Date` object; controller calls `clock.now()`. | Helper stays pure. Date object is simpler than ms conversion. ClockPort already wired; no ports.js change. |
| 2 | **A** — ReportController keeps a controller-local request sequence counter and ignores stale responses. | Preserves source `_requestSeq` behavior. No store schema change. C would require StatsPort signal support (not in current typedef). |
| 3 | **A** — Helper returns `tips` in aggregate result; controller patches it into `report.stats`. | Source alignment strongest — tips currently lives inside DEFAULT_STATS. Future stats-aware tip generation moves naturally to helper. |
| 4 | **A** — Helper output includes `todayUiIdx: 0..6`. | Consistent with Decision 1A: time-derived fields live in helper output, not in the view model. View model and DOM stay pure. |
| 5 | **C** — Cache-first: read `store.get('auth.user')?.id`, fallback to `authPort.getUser()` only when cache is null. | Matches slice-3b decision #2 (account hydrate). Avoids redundant network calls when AuthController.init has already filled cache. |

### No store-schema additions

Current `report: { status: 'idle', error: null, stats: null }` is sufficient. `tips` and `todayUiIdx` live inside the `stats` object written by `report.load()`; they require no top-level keys.

### No instruction §6 patch

Decisions 1A/2A/3A/4A/5C all preserve current method shape (`report.load()`, `report.getViewModel()`); no signature change.

Slice 3c-3 controllers are constructed by `createRecocoCore(ports)` and not yet consumed by `main.js`. `ReportManager.js` remains untouched (slice 5).
