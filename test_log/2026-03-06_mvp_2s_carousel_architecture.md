# MVP 2s Carousel Architecture (Performance-First)

## 1. Core Claim
1. `p95 <= 2s` for carousel is achieved by removing server/AI/full-scan from launch path.
2. Current slowness is structural: launch path includes full library fetch/ranking.
3. MVP must adopt `Daily Curation Cache-first`:
- launch: render cached curation immediately
- recompute: background once per day

## 2. Product Intent (Operational)
1. User must see “today’s deletion candidates” immediately on app open.
2. AI caption/reason is secondary and must not block deletion flow.
3. Day-level consistency matters:
- one recommendation per day
- stable across app relaunch

## 3. Bottleneck Framing
### 3.1 Vicious cycle
- Home enter -> full fetch/rank path -> slow UX -> early drop-off.

### 3.2 Root mismatch
- Product action is “deletion recommendation”.
- Launch path currently behaves like “full processing pipeline.”

## 4. Fixed MVP Policies
1. Carousel target: `p95 <= 2000ms`.
2. Daily recommendation fixed by day key (17:00 reset).
3. iCloud-only assets:
- include in candidate set
- skip on thumbnail failure (do not block carousel)
4. Home launch:
- ban `getPhotos()` path
- allow only `getDailyCuration()`.
5. Transport policy:
- MVP uses base64 thumbnail path.
- keep file URL option as future switch.
6. Album/favorite policy for MVP:
- conservative protection (exclude-first).

## 5. Target Architecture
```text
[App Launch]
  -> [HomeManager.js]
  -> [RecocolPhotosPlugin.getDailyCuration()]
  -> [UserDefaults cache hit]
  -> immediate top3~6 + thumbs render (<=2s)

[Background]
  -> compute/refresh pending today cache

[User mutation: delete or record]
  -> recordCurationAction()
  -> policy B apply pending(today) if conditions met
```

## 6. Design Principles
1. Cache-first launch.
2. No network on launch.
3. Expensive operations only for TopK.
4. Skip-not-block for iCloud/thumbnail failure.

## 7. JS Change Plan
### 7.1 Home entry
- Replace launch call path:
- remove `photoService.getPhotos()` from home entry
- use `photoService.getDailyCuration({...})` only

### 7.2 Mutation hook
- After delete/record:
- call `onUserMutationDone(dayKey)`
- allow policy-B promotion from pending->applied.

### 7.3 Scope split
- Keep `getPhotos()` for non-home contexts only (if needed).

## 8. Native Change Plan
### 8.1 New modules
1. `DailyCurationTime` (17:00 day key)
2. `DailyCurationStore` (applied/pending/mutation/skip map in UserDefaults)
3. `DailyCurationEngine` (candidate score/select)

### 8.2 Plugin APIs
1. `getDailyCuration({ limit, thumbSize, transport, forceRefresh })`
2. `recordCurationAction({ assetId, action, dayKey })`

### 8.3 Thumbnail policy
- support `thumbSize=420`.
- `isNetworkAccessAllowed=false`.
- if iCloud-only/thumbnail failure: skip and continue.

## 9. Scoring Policy (MVP)
1. old +10
2. screenshot +25
3. burst_day +5
4. large(pixel proxy) +20
5. unorganized +30
6. tie-break: older creation date first

## 10. Release Roadmap (Ordered Gates)
1. Home path switch to cache-first (`getDailyCuration` only)
2. Native cache store and day-key logic
3. Policy A/B (yesterday-applied + today-pending promotion)
4. iCloud skip-not-block
5. Rule/tie-break stabilization
6. Move AI caption call to on-demand (`record` action path only)

## 11. Go/No-Go Gates
1. `launch_to_carousel_ms p95 <= 2000`.
2. Works under network OFF.
3. iCloud-only failures do not block render.
4. Daily recommendation remains stable across relaunch.
5. Delete/record mutation can trigger policy-B promotion.

## 12. Deliverables
1. Architecture spec (this doc)
2. Code changes:
- JS home entry migration
- native plugin/cache engine
3. Validation report:
- launch p50/p95/p99
- cold/warm split
- timeout rate

## 13. Notes
- This is a performance-first MVP architecture.
- AI enrichment remains valuable but moved out of launch critical path.
