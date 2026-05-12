# Headless Core Refactor — Clean PR (#9) Review
Audit date: 2026-05-12

## 0. Executive Summary

1. PR #9 identity: GO — `state=OPEN`, `base=main`, `head=refactor/headless-core-clean` (`PR #9 metadata`).
2. PR #8 superseded: GO — PR #8 is `CLOSED` and last comment links #9 (`PR #8 metadata/comments`).
3. Commit count: GO — PR #9 metadata contains exactly `1e756fa`, `dd01669`, `5c4ed27`; local `git log origin/main..origin/refactor/headless-core-clean` returns the same 3 commits.
4. Diff scope: GO — PR #9 name-only diff contains headless paths only; excluded prefixes `backend/**`, `control/**`, `context_portal/**`, `ios/App/**`, `.maestro/**`, `docs/verification/**` are absent (`PR #9 diff-name-only`).
5. CI/mergeability: GO — `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`, `CI/build=SUCCESS`, `CI/backend-smoke=SUCCESS` (`PR #9 metadata/statusCheckRollup`).
6. Commit layer split: GO — C1 has 37 core/adapter/config files; C2 has 15 bootstrap/component/DOM files; C3 has 17 cleanup/docs/delete files (`1e756fa`, `dd01669`, `5c4ed27 --stat`).
7. PR body supersedes note: GO — body explicitly says PR #9 supersedes #8 and cleanly restacks on `origin/main` (`PR #9 §supersedes note`).
8. PR body stale details: HOLD — old §Files changed and §Validation still claim C2/C3 stats and `325.19/87.69` from PR #8-era text, while top note says `319.62/85.90` (`PR #9 §Files changed`, `PR #9 §Validation`, `PR #9 §supersedes note`).
9. Control-change exclusion: FAIL — `backendOrigin`, backend log/credentials patterns, and daily-curation listener are absent, but AuthModal still includes control-style `duration-300` / `duration-200` transition classes vs `origin/main` (`dd01669:src/components/AuthModal.js:75-92`; `origin/main:src/components/AuthModal.js:95-106`).
10. Bundle-size explanation: HOLD — clean PR excludes PR #8 design/style files, supporting the smaller bundle claim, but no CI log line for `319.62/85.90` is captured here (`PR #9 §supersedes note`; `PR #9 diff-name-only`).
11. Worktree cleanup: GO — `narrative-ai-headless-clean` is absent from `git worktree list`; main worktree still sits on old `refactor/headless-core` (`/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`).
12. Post-merge queue: HOLD — manual smoke, old remote branch cleanup, legacy service/global cleanup, and LLM notes extraction remain follow-up work (`/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`).

Core recommendations: update PR #9 body to remove stale PR #8 stats, decide whether the AuthModal transition-duration residue is acceptable or should be removed, and after merge delete or archive the old `origin/refactor/headless-core` branch while keeping PR #9's clean branch active until merge.

## 1. PR #9 scope 정합성

| Scope bucket | Observed PR #9 paths | Evidence |
|---|---|---|
| Core package | `packages/core/**` 19 files | `PR #9 diff-name-only`; C1 file list from `1e756fa git show --name-only`. |
| App adapters | `src/adapters/**` 14 files | `PR #9 diff-name-only`; adapter assembler is introduced in `1e756fa --stat`. |
| DOM adapters | `src/ui/dom/createDomApp.js`, `domEvents.js`, `domRouterAdapter.js`, `toastPresenter.js` | `PR #9 diff-name-only`; C2 file list from `dd01669 git show --name-only`. |
| Refactor docs | 13 `docs/refactor/**` files, including `headless-core-post-push-review.md` | `PR #9 diff-name-only`; C3 stat includes `docs/refactor/headless-core-post-push-review.md` in `5c4ed27 --stat`. |
| Bootstrap/config | `main.js`, `package.json`, `package-lock.json`, `vite.config.js`, `jsconfig.json`, `.gitignore` | `PR #9 diff-name-only`; C1/C2/C3 file lists. |
| Components | `src/components/AuthModal.js`, `DropZone.js`, `HomeManager.js`, `InputManager.js`, `Modal.js`, `MyPageManager.js`, `NoticeManager.js`, `PermissionModal.js`, `ReportManager.js`, `ResultViewer.js` | `PR #9 diff-name-only`; `dd01669 git show --name-only`. |
| Legacy public index | `src/index.js` | `PR #9 diff-name-only`; `5c4ed27 git show --name-only`. |
| Deletions | `src/services/Router.js`, `src/utils/temp_handleUrl.js` | `PR #9 diff-name-only`; `5c4ed27 git show --name-only`. |

| Excluded prefix / file | PR #9 observed fact | Previous PR #8 contrast |
|---|---|---|
| `backend/**` | No PR #9 path under `backend/**` in `PR #9 diff-name-only`. | PR #8 had backend files recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:227`. |
| `control/**` | No PR #9 path under `control/**` in `PR #9 diff-name-only`. | PR #8 had control files recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:241`. |
| `context_portal/**` | No PR #9 path under `context_portal/**` in `PR #9 diff-name-only`. | PR #8 had context_portal entries recorded in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:34`. |
| `ios/App/**` | No PR #9 path under `ios/App/**` in `PR #9 diff-name-only`. | PR #8 had iOS files recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:333`. |
| `.maestro/**` | No PR #9 path under `.maestro/**` in `PR #9 diff-name-only`. | PR #8 diff had `.maestro/flows/ios/onboarding-auth-smoke.yaml` recorded by `PR #8 diff-name-only` in the previous review. |
| `recoco-design-system/**` | No PR #9 path under `recoco-design-system/**` in `PR #9 diff-name-only`. | `.gitignore` keeps `recoco-design-system/` local at `5c4ed27:.gitignore:109-110`. |
| `SKILLS_ANALYSIS_ISSUES.md` | No PR #9 path named `SKILLS_ANALYSIS_ISSUES.md` in `PR #9 diff-name-only`. | PR #8 diff had this file in the previous `PR #8 diff-name-only` output. |
| `docs/verification/**` | No PR #9 path under `docs/verification/**` in `PR #9 diff-name-only`. | PR #8 had `docs/verification/verification_packet_v5.md`; ignore rule is `5c4ed27:.gitignore:112-113`. |

**PR #9 Diff Ledger**

- PR9-DIFF-001: `.gitignore`.
- PR9-DIFF-002: `docs/refactor/headless-core-agent-instructions.md`.
- PR9-DIFF-003: `docs/refactor/headless-core-final-review.md`.
- PR9-DIFF-004: `docs/refactor/headless-core-post-push-review.md`.
- PR9-DIFF-005: `docs/refactor/headless-core-push-readiness.md`.
- PR9-DIFF-006: `docs/refactor/instruction-doc-consistency-audit.md`.
- PR9-DIFF-007: `docs/refactor/slice-2-adapter-mapping.md`.
- PR9-DIFF-008: `docs/refactor/slice-3-controller-mapping.md`.
- PR9-DIFF-009: `docs/refactor/slice-3b-controller-mapping.md`.
- PR9-DIFF-010: `docs/refactor/slice-3c1-controller-mapping.md`.
- PR9-DIFF-011: `docs/refactor/slice-3c2-controller-mapping.md`.
- PR9-DIFF-012: `docs/refactor/slice-3c3-controller-mapping.md`.
- PR9-DIFF-013: `docs/refactor/slice-4-integration-mapping.md`.
- PR9-DIFF-014: `docs/refactor/slice-5-component-mapping.md`.
- PR9-DIFF-015: `jsconfig.json`.
- PR9-DIFF-016: `main.js`.
- PR9-DIFF-017: `package-lock.json`.
- PR9-DIFF-018: `package.json`.
- PR9-DIFF-019: `packages/core/package.json`.
- PR9-DIFF-020: `packages/core/src/account/createAccountController.js`.
- PR9-DIFF-021: `packages/core/src/auth/createAuthController.js`.
- PR9-DIFF-022: `packages/core/src/contracts/ports.js`.
- PR9-DIFF-023: `packages/core/src/createRecocoCore.js`.
- PR9-DIFF-024: `packages/core/src/errors/normalizeError.js`.
- PR9-DIFF-025: `packages/core/src/home/analyzeCurationReasons.js`.
- PR9-DIFF-026: `packages/core/src/home/createHomeController.js`.
- PR9-DIFF-027: `packages/core/src/home/createHomeViewModel.js`.
- PR9-DIFF-028: `packages/core/src/index.js`.
- PR9-DIFF-029: `packages/core/src/input/createInputController.js`.
- PR9-DIFF-030: `packages/core/src/navigation/createNavigationController.js`.
- PR9-DIFF-031: `packages/core/src/notifications/createNotificationController.js`.
- PR9-DIFF-032: `packages/core/src/permissions/createPermissionController.js`.
- PR9-DIFF-033: `packages/core/src/report/aggregateReportStats.js`.
- PR9-DIFF-034: `packages/core/src/report/createReportController.js`.
- PR9-DIFF-035: `packages/core/src/result/createResultController.js`.
- PR9-DIFF-036: `packages/core/src/result/formatCaption.js`.
- PR9-DIFF-037: `packages/core/src/state/createStore.js`.
- PR9-DIFF-038: `src/adapters/account/accountApiPort.js`.
- PR9-DIFF-039: `src/adapters/ai/geminiAiPort.js`.
- PR9-DIFF-040: `src/adapters/auth/capacitorAppPort.js`.
- PR9-DIFF-041: `src/adapters/auth/capacitorBrowserPort.js`.
- PR9-DIFF-042: `src/adapters/auth/supabaseAuthPort.js`.
- PR9-DIFF-043: `src/adapters/clipboard/clipboardPort.js`.
- PR9-DIFF-044: `src/adapters/createAppPorts.js`.
- PR9-DIFF-045: `src/adapters/image/imageProcessorPort.js`.
- PR9-DIFF-046: `src/adapters/notifications/capacitorNotificationPort.js`.
- PR9-DIFF-047: `src/adapters/photos/photoPort.js`.
- PR9-DIFF-048: `src/adapters/share/sharePort.js`.
- PR9-DIFF-049: `src/adapters/stats/statsPort.js`.
- PR9-DIFF-050: `src/adapters/storage/browserStoragePort.js`.
- PR9-DIFF-051: `src/adapters/time/systemClockPort.js`.
- PR9-DIFF-052: `src/components/AuthModal.js`.
- PR9-DIFF-053: `src/components/DropZone.js`.
- PR9-DIFF-054: `src/components/HomeManager.js`.
- PR9-DIFF-055: `src/components/InputManager.js`.
- PR9-DIFF-056: `src/components/Modal.js`.
- PR9-DIFF-057: `src/components/MyPageManager.js`.
- PR9-DIFF-058: `src/components/NoticeManager.js`.
- PR9-DIFF-059: `src/components/PermissionModal.js`.
- PR9-DIFF-060: `src/components/ReportManager.js`.
- PR9-DIFF-061: `src/components/ResultViewer.js`.
- PR9-DIFF-062: `src/index.js`.
- PR9-DIFF-063: `src/services/Router.js`.
- PR9-DIFF-064: `src/ui/dom/createDomApp.js`.
- PR9-DIFF-065: `src/ui/dom/domEvents.js`.
- PR9-DIFF-066: `src/ui/dom/domRouterAdapter.js`.
- PR9-DIFF-067: `src/ui/dom/toastPresenter.js`.
- PR9-DIFF-068: `src/utils/temp_handleUrl.js`.
- PR9-DIFF-069: `vite.config.js`.

## 2. Commit 수 + content 일치성

| Item | Observed fact | Evidence |
|---|---|---|
| PR commit count | Exactly three commit objects: `1e756fa`, `dd01669`, `5c4ed27`. | `PR #9 metadata`; local log shows the same three lines: `5c4ed27`, `dd01669`, `1e756fa`. |
| New C1 | 37 files, +3,631/-12. | `1e756fa --stat`. |
| New C2 | 15 files, +1,221/-1,367. | `dd01669 --stat`. |
| New C3 | 17 files, +6,325/-159. | `5c4ed27 --stat`. |
| Old C1 comparison | Old `3a03555` was 37 files, +3,631/-12. | Previous review cites old C1 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:25`. |
| Old C2 comparison | Old `8ea1104` was 15 files, +1,153/-1,276. | Previous review cites old C2 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:26`. |
| Old C3 comparison | Old `61b25cc` was 20 files, +5,697/-743. | Previous review cites old C3 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:27`. |

| Commit | Expected layer | Observed files |
|---|---|---|
| `1e756fa` | `packages/`, `src/adapters/`, package/config | `jsconfig.json`, `package*.json`, `vite.config.js`, `packages/core/**`, `src/adapters/**` in `1e756fa git show --name-only`. |
| `dd01669` | `main.js`, `src/ui/`, 10 component files | `main.js`, 10 `src/components/*.js`, and 4 `src/ui/dom/*.js` in `dd01669 git show --name-only`. |
| `5c4ed27` | cleanup docs/index/deletions | `.gitignore`, 13 `docs/refactor/**`, `src/index.js`, `src/services/Router.js`, `src/utils/temp_handleUrl.js` in `5c4ed27 git show --name-only`. |

| Old-vs-new comparison point | Observed fact | Evidence |
|---|---|---|
| C1 file list | Same layer and same count as old C1. | `1e756fa git show --name-only`; previous old C1 file class at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:25`. |
| C2 component set | New C2 still changes the same 10 component files listed by old C2. | `dd01669 git show --name-only`; old C2 file class is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:26`. |
| C2 stat drift | Line counts changed because clean C2 applies to `origin/main`, not the control branch. | `dd01669 --stat`; old C2 stat at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:26`. |
| C3 file count | New C3 is 17 files, not old 20. | `5c4ed27 --stat`; commit body states home runtimes were not on `origin/main` (`PR #9 metadata`, commit `5c4ed27` message body). |
| C3 docs count | New C3 has 13 docs/refactor files because it includes `headless-core-post-push-review.md`. | `5c4ed27 --stat`; PR #9 diff ledger entries PR9-DIFF-002 through PR9-DIFF-014. |

**Clean Commit File Ledger**

- C1-001: `jsconfig.json`.
- C1-002: `package-lock.json`.
- C1-003: `package.json`.
- C1-004: `packages/core/package.json`.
- C1-005: `packages/core/src/account/createAccountController.js`.
- C1-006: `packages/core/src/auth/createAuthController.js`.
- C1-007: `packages/core/src/contracts/ports.js`.
- C1-008: `packages/core/src/createRecocoCore.js`.
- C1-009: `packages/core/src/errors/normalizeError.js`.
- C1-010: `packages/core/src/home/analyzeCurationReasons.js`.
- C1-011: `packages/core/src/home/createHomeController.js`.
- C1-012: `packages/core/src/home/createHomeViewModel.js`.
- C1-013: `packages/core/src/index.js`.
- C1-014: `packages/core/src/input/createInputController.js`.
- C1-015: `packages/core/src/navigation/createNavigationController.js`.
- C1-016: `packages/core/src/notifications/createNotificationController.js`.
- C1-017: `packages/core/src/permissions/createPermissionController.js`.
- C1-018: `packages/core/src/report/aggregateReportStats.js`.
- C1-019: `packages/core/src/report/createReportController.js`.
- C1-020: `packages/core/src/result/createResultController.js`.
- C1-021: `packages/core/src/result/formatCaption.js`.
- C1-022: `packages/core/src/state/createStore.js`.
- C1-023: `src/adapters/account/accountApiPort.js`.
- C1-024: `src/adapters/ai/geminiAiPort.js`.
- C1-025: `src/adapters/auth/capacitorAppPort.js`.
- C1-026: `src/adapters/auth/capacitorBrowserPort.js`.
- C1-027: `src/adapters/auth/supabaseAuthPort.js`.
- C1-028: `src/adapters/clipboard/clipboardPort.js`.
- C1-029: `src/adapters/createAppPorts.js`.
- C1-030: `src/adapters/image/imageProcessorPort.js`.
- C1-031: `src/adapters/notifications/capacitorNotificationPort.js`.
- C1-032: `src/adapters/photos/photoPort.js`.
- C1-033: `src/adapters/share/sharePort.js`.
- C1-034: `src/adapters/stats/statsPort.js`.
- C1-035: `src/adapters/storage/browserStoragePort.js`.
- C1-036: `src/adapters/time/systemClockPort.js`.
- C1-037: `vite.config.js`.
- C2-001: `main.js`.
- C2-002: `src/components/AuthModal.js`.
- C2-003: `src/components/DropZone.js`.
- C2-004: `src/components/HomeManager.js`.
- C2-005: `src/components/InputManager.js`.
- C2-006: `src/components/Modal.js`.
- C2-007: `src/components/MyPageManager.js`.
- C2-008: `src/components/NoticeManager.js`.
- C2-009: `src/components/PermissionModal.js`.
- C2-010: `src/components/ReportManager.js`.
- C2-011: `src/components/ResultViewer.js`.
- C2-012: `src/ui/dom/createDomApp.js`.
- C2-013: `src/ui/dom/domEvents.js`.
- C2-014: `src/ui/dom/domRouterAdapter.js`.
- C2-015: `src/ui/dom/toastPresenter.js`.
- C3-001: `.gitignore`.
- C3-002: `docs/refactor/headless-core-agent-instructions.md`.
- C3-003: `docs/refactor/headless-core-final-review.md`.
- C3-004: `docs/refactor/headless-core-post-push-review.md`.
- C3-005: `docs/refactor/headless-core-push-readiness.md`.
- C3-006: `docs/refactor/instruction-doc-consistency-audit.md`.
- C3-007: `docs/refactor/slice-2-adapter-mapping.md`.
- C3-008: `docs/refactor/slice-3-controller-mapping.md`.
- C3-009: `docs/refactor/slice-3b-controller-mapping.md`.
- C3-010: `docs/refactor/slice-3c1-controller-mapping.md`.
- C3-011: `docs/refactor/slice-3c2-controller-mapping.md`.
- C3-012: `docs/refactor/slice-3c3-controller-mapping.md`.
- C3-013: `docs/refactor/slice-4-integration-mapping.md`.
- C3-014: `docs/refactor/slice-5-component-mapping.md`.
- C3-015: `src/index.js`.
- C3-016: `src/services/Router.js`.
- C3-017: `src/utils/temp_handleUrl.js`.

## 3. CI Status + Mergeability

| Field | Observed value | Evidence |
|---|---|---|
| PR state | `OPEN` | `PR #9 metadata: state=OPEN`. |
| Mergeable | `MERGEABLE` | `PR #9 metadata: mergeable=MERGEABLE`. |
| Merge state | `CLEAN` | `PR #9 metadata: mergeStateStatus=CLEAN`. |
| Review decision | empty string returned | `PR #9 metadata: reviewDecision=""`. |
| CI build | `SUCCESS`, completed at `2026-05-11T15:48:43Z` | `PR #9 statusCheckRollup`, details URL `https://github.com/goodand/narrative-ai/actions/runs/25680883065/job/75391718057`. |
| CI backend-smoke | `SUCCESS`, completed at `2026-05-11T15:48:42Z` | `PR #9 statusCheckRollup`, details URL `https://github.com/goodand/narrative-ai/actions/runs/25680883065/job/75391718342`. |
| CI workflow build definition | `npm ci` then `npm run build`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-32`. |
| CI workflow backend-smoke definition | Install backend, start uvicorn, wait health, assert payload. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`. |
| PR #8 contrast | PR #8 had `mergeStateStatus=UNSTABLE` and backend-smoke failure. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:14-15`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:616-617`. |

## 4. Control 변경 제외 검증

| Control-change probe | Observed clean PR fact | Evidence |
|---|---|---|
| Vite proxy variable | `backendOrigin` is not present; file uses `backendPort` and `backendUrl`. | `1e756fa:vite.config.js:10-14`; `1e756fa:vite.config.js:42-45`. |
| `.gitignore` credentials/backend log patterns | `credentials.plist` and `backend_log` are not present; clean C3 adds only `backend/current_live_log.txt` among backend log-like lines. | `5c4ed27:.gitignore:100-113`; direct pattern probe output only line `104 backend/current_live_log.txt`. |
| HomeManager daily event listener | `_setupDailyCurationListener` and `daily-curation-updated` are not present in clean C2; constructor calls `_setupEventDelegation` only. | `dd01669:src/components/HomeManager.js:23-43`; `dd01669:src/components/HomeManager.js:93-130`; direct pattern probe returns only `_setupEventDelegation`. |
| AuthModal transition style | `duration-300 ease-in-out` and `duration-200 ease-in-out` are present in clean C2. | `dd01669:src/components/AuthModal.js:75-92`; base `origin/main` had `transition-all` and `transition-colors` without explicit duration at `origin/main:src/components/AuthModal.js:95-106`. |

| Reference baseline | Observed fact | Evidence |
|---|---|---|
| `origin/main` Vite baseline | Uses `backendPort` and `backendUrl`. | `origin/main:vite.config.js:10-14`; `origin/main:vite.config.js:37-40`. |
| `origin/main` `.gitignore` baseline | Ends before slice-local additions at line 94. | `origin/main:.gitignore:1-94`. |
| `origin/main` HomeManager baseline | Contains `_setupDailyCurationListener` and `daily-curation-updated`. | `origin/main:src/components/HomeManager.js:21-22`; `origin/main:src/components/HomeManager.js:143-145`. |
| `origin/main` AuthModal baseline | Google button has `transition-all`; signup button has `transition-colors`. | `origin/main:src/components/AuthModal.js:95-106`. |

## 5. PR body 정합성

| Body area | Observed fact | Evidence |
|---|---|---|
| Supersedes note | Body begins with `Supersedes #8`, identifies the 37-commit/foreign-diff issue, and states this PR restacks on `origin/main`. | `PR #9 §supersedes note`; PR #8 close comment also links #9 (`PR #8 comments[-1]`). |
| Clean scope claim | Body says exactly 3 commits and backend/control/iOS/context_portal/design-system files 0 changed. | `PR #9 §supersedes note`; matching diff facts are `PR #9 diff-name-only` and `PR #9 metadata commits`. |
| Bundle note | Top note says `319.62 kB / gzip 85.90 kB`. | `PR #9 §supersedes note`. |
| Summary | Retains `@recoco/core`, adapters, DOM layer, 8 components, Router/temp deletion claims. | `PR #9 §Summary`; code/file evidence is `1e756fa`, `dd01669`, `5c4ed27` file lists. |
| Files changed rows | Still says C2 `+1,153/-1,276` and C3 `20 files, +5,697/-743`. | `PR #9 §Files changed`; actual new stats are `dd01669 --stat` and `5c4ed27 --stat`. |
| Runtime deletions sentence | Still names 4 home runtime helper deletions. | `PR #9 §Files changed`; clean C3 message says home runtimes were never present on `origin/main` and no deletion was needed (`PR #9 metadata`, commit `5c4ed27` body). |
| Validation bundle row | Still says `325.19 kB / gzip 87.69 kB`. | `PR #9 §Validation`; top supersedes note says `319.62/85.90`; previous push-readiness warned about build-size citation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:529`. |
| Manual smoke | Remains TBD by reviewer. | `PR #9 §Manual smoke`; source scenario list is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. |
| LLM Workflow Notes | Retained unchanged. | `PR #9 §LLM Workflow Notes`; prior review suggested moving/compressing it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:621`. |

## 6. Bundle size 차이 분석

| Item | Observed fact | Evidence |
|---|---|---|
| PR #9 top bundle claim | `319.62 kB / gzip 85.90 kB`. | `PR #9 §supersedes note`. |
| PR #9 old validation claim | `325.19 kB / gzip 87.69 kB`. | `PR #9 §Validation`. |
| Prior PR #8 old value | Previous review recorded PR #8 validation body claiming `325.19/87.69`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:620`. |
| Local retained slice 5 value | `325.28 kB gzipped 87.63 kB`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`. |
| Design/style exclusion | PR #9 diff-name-only has no `style.css`, `tailwind.config.js`, `public/privacy_policy.html`, or `public/terms_of_service.html`. | `PR #9 diff-name-only`; PR #8 previously included these at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:362` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:406-407`. |
| Config diff | C1 only adds alias to otherwise origin/main Vite config. | `1e756fa:vite.config.js:20-24`; `origin/main:vite.config.js:21-33`. |
| CI check | GitHub CI build succeeds but statusCheckRollup does not expose bundle-size text. | `PR #9 statusCheckRollup`; CI build workflow is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:27-32`. |

## 7. PR #8 closed 상태

| Item | Observed fact | Evidence |
|---|---|---|
| PR #8 state | `CLOSED`. | `PR #8 metadata: state=CLOSED`. |
| Closed time | `2026-05-11T15:48:33Z`. | `PR #8 metadata: closedAt=2026-05-11T15:48:33Z`. |
| PR #8 head branch | `refactor/headless-core`. | `PR #8 metadata: headRefName=refactor/headless-core`. |
| Last comment | Begins `Superseded by #9 (clean scope).` | `PR #8 comments[-1]`. |
| Last comment reason | Mentions 37 commits + non-headless backend/control/iOS/context_portal/design-system diff and `CI/backend-smoke=FAILURE`. | `PR #8 comments[-1]`; previous review summary is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:6-19`. |
| Last comment PR #9 link | Contains `#9`. | `PR #8 comments[-1]`. |

## 8. 원격 branch cleanup 평가

| Branch / ref | Observed fact | Evidence |
|---|---|---|
| Old remote branch | `origin/refactor/headless-core` still exists. | `git branch -r --list 'origin/refactor/headless-core*'`. |
| Clean remote branch | `origin/refactor/headless-core-clean` exists. | `git branch -r --list 'origin/refactor/headless-core*'`. |
| PR #8 head | `refactor/headless-core`. | `PR #8 metadata: headRefName=refactor/headless-core`. |
| PR #9 head | `refactor/headless-core-clean`. | `PR #9 metadata: headRefName=refactor/headless-core-clean`. |
| Main worktree checkout | Main worktree still points at local `refactor/headless-core`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`; `git worktree list`. |
| Historical reference | PR #8 remains closed with comment linking #9. | `PR #8 metadata/comments`. |

## 9. 잔여 회귀 위험

| Risk area | Observed fact | Evidence |
|---|---|---|
| Main worktree branch divergence | Main worktree remains on old local `refactor/headless-core`, while PR #9 head is `origin/refactor/headless-core-clean`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`; `PR #9 metadata`. |
| Clean temporary worktree residue | `git worktree list` does not show `/Users/.../narrative-ai-headless-clean`; several unrelated worktrees remain. | `git worktree list`. |
| PR body stale stats | Body has both `319.62/85.90` and old `325.19/87.69`, plus old C2/C3 stats. | `PR #9 §supersedes note`; `PR #9 §Files changed`; `PR #9 §Validation`. |
| Control style residue | AuthModal transition duration classes are present in clean C2 despite origin/main not having them. | `dd01669:src/components/AuthModal.js:75-92`; `origin/main:src/components/AuthModal.js:95-106`. |
| Manual smoke still open | PR body keeps manual smoke as TBD. | `PR #9 §Manual smoke`; smoke list is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. |
| Legacy adapter debt | Legacy service/global cleanup remains deferred. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`; adapter imports services in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`. |

## 10. Post-merge 후속 작업 갱신

| Queue item | Existing source | PR #9 observed fact |
|---|---|---|
| Backend/uv.lock separate PR | Push-readiness row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:527`. | PR #9 diff-name-only has no `backend/**` or `backend/uv.lock`. |
| Manual smoke PR comment | Smoke list is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. | PR #9 body keeps checkboxes unchecked in `PR #9 §Manual smoke`. |
| Main worktree branch decision | Main worktree is old branch. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`. |
| Old remote branch cleanup | PR #8 is closed and head is `refactor/headless-core`. | `PR #8 metadata`. |
| Clean PR branch lifecycle | PR #9 head is `refactor/headless-core-clean`. | `PR #9 metadata`. |
| LLM Workflow Notes extraction | Previous review recommended extraction/compression. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:621`; PR #9 retains notes in `PR #9 §LLM Workflow Notes`. |
| Deferred compatibility cleanup | Slice 6 deferred helper/global/service cleanup. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. |

## 11. 3자 협업 흐름 메타 평가

| Audit chain step | Artifact / action | Evidence |
|---|---|---|
| Work audit | Final review captured architecture/scans/risks. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`. |
| Push readiness | Push-readiness identified branch/commit/backend risks. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:520-532`. |
| PR #8 post-push review | Post-push review found 37 commits and non-headless diff. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:6-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:616-618`. |
| PR #8 remediation | PR #8 closed with superseding #9 comment. | `PR #8 metadata/comments`. |
| PR #9 clean restack | PR #9 has three commits and clean head branch. | `PR #9 metadata`; local `git log origin/main..origin/refactor/headless-core-clean`. |
| Documentation carry-forward | PR #9 includes the post-push review doc as part of clean C3. | `5c4ed27 --stat`; `PR #9 diff-name-only`. |
| Remaining workflow artifact | Main worktree remains on old branch while PR #9 is remote clean branch. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`; `PR #9 metadata`. |

## 12. Cross-doc consistency

| Topic | Prior doc fact | PR #9 fact | Consistency observation |
|---|---|---|---|
| PR #8 scope failure | Post-push review says PR #8 had 37 commits and foreign diff. | PR #8 is closed and comment cites that reason. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:6-19`; `PR #8 comments[-1]`. |
| Clean branch recommendation | Push-readiness recommended clean/refactor PR branch. | PR #9 head is `refactor/headless-core-clean`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:525`; `PR #9 metadata`. |
| 3 logical commits | Push-readiness recommended 3 logical commits. | PR #9 metadata has exactly three commits. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:526`; `PR #9 metadata`; local `git log origin/main..origin/refactor/headless-core-clean`. |
| Backend separation | Push-readiness said backend/uv.lock separate. | PR #9 diff-name-only has no `backend/**`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:527`; `PR #9 diff-name-only`. |
| Final review cleanup | Slice 6 addendum closed H/M items. | PR #9 includes slice 6 docs and clean C2/C3 code. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`; `5c4ed27 --stat`. |
| Old PR body stats | Post-push review asked to update old bundle wording. | PR #9 top note adds new size but old validation row remains. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:620`; `PR #9 §supersedes note`; `PR #9 §Validation`. |
| Manual smoke | Final review and PR body both leave runtime smoke as non-executed/TBD. | PR #9 still has `Manual smoke (TBD by reviewer)`. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:17-18`; `PR #9 §Manual smoke`. |
| Legacy defer items | Slice 6 defers dispatchNavChange/supabase/service cleanup. | PR #9 does not include a later cleanup beyond slice 6. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`; `PR #9 diff-name-only`. |

**Cross-Doc Evidence Ledger**

- XREF001: Final review summary starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`.
- XREF002: Push-readiness summary starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`.
- XREF003: Push-readiness recommendations are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:520-532`.
- XREF004: Post-push review summary is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:4-19`.
- XREF005: Post-push review PR #8 recommendations are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:612-624`.
- XREF006: Slice 6 addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`.
- XREF007: Smoke scenarios are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`.
- XREF008: PR #9 metadata records `additions=11177`, `deletions=1538`, `base=main`, `head=refactor/headless-core-clean`.
- XREF009: PR #9 statusCheckRollup records `build=SUCCESS`.
- XREF010: PR #9 statusCheckRollup records `backend-smoke=SUCCESS`.
- XREF011: PR #9 metadata records `mergeStateStatus=CLEAN`.
- XREF012: PR #9 body records `Supersedes #8`.
- XREF013: PR #9 body records `319.62 kB / gzip 85.90 kB`.
- XREF014: PR #9 body also records old `325.19 kB / gzip 87.69 kB`.
- XREF015: PR #8 metadata records `state=CLOSED`.
- XREF016: PR #8 comments[-1] records `Superseded by #9 (clean scope)`.
- XREF017: `origin/refactor/headless-core-clean` log has exactly `5c4ed27`, `dd01669`, `1e756fa`.
- XREF018: Remote branches still include `origin/refactor/headless-core` and `origin/refactor/headless-core-clean`.
- XREF019: Main worktree HEAD remains `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`.
- XREF020: Clean C2 AuthModal transition line is `dd01669:src/components/AuthModal.js:75`.
- XREF021: Base AuthModal transition line is `origin/main:src/components/AuthModal.js:95`.
- XREF022: Clean C1 Vite proxy lines are `1e756fa:vite.config.js:10-14`.
- XREF023: Clean C3 `.gitignore` local patterns are `5c4ed27:.gitignore:100-113`.
- XREF024: Clean C2 HomeManager constructor lines are `dd01669:src/components/HomeManager.js:23-43`.
- XREF025: Clean C2 HomeManager event handler lines are `dd01669:src/components/HomeManager.js:93-130`.
- XREF026: Clean PR excludes PR #8 style files, while PR #8 included them at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:362` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:406-407`.
- XREF027: CI frontend workflow is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-32`.
- XREF028: CI backend workflow is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`.
- XREF029: Adapter service defer context is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`.
- XREF030: Deferred legacy cleanup row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`.

**Negative Scope Evidence Ledger**

- NEG001: PR #9 diff-name-only contains no `backend/app/config.py`.
- NEG002: PR #9 diff-name-only contains no `backend/app/main.py`.
- NEG003: PR #9 diff-name-only contains no `backend/app/models/schemas.py`.
- NEG004: PR #9 diff-name-only contains no `backend/app/routers/geo.py`.
- NEG005: PR #9 diff-name-only contains no `backend/app/routers/narrative.py`.
- NEG006: PR #9 diff-name-only contains no `backend/app/services/gemini.py`.
- NEG007: PR #9 diff-name-only contains no `backend/app/services/geocoding.py`.
- NEG008: PR #9 diff-name-only contains no `backend/run.py`.
- NEG009: PR #9 diff-name-only contains no `context_portal/alembic.ini`.
- NEG010: PR #9 diff-name-only contains no `context_portal/context.db`.
- NEG011: PR #9 diff-name-only contains no `control/README.md`.
- NEG012: PR #9 diff-name-only contains no `control/project_agent_ops/registry/README.md`.
- NEG013: PR #9 diff-name-only contains no `control/project_agent_ops/resources/evidence/reports/control-commit-readiness-report.md`.
- NEG014: PR #9 diff-name-only contains no `control/project_domain/registry/README.md`.
- NEG015: PR #9 diff-name-only contains no `control/team/registry/README.md`.
- NEG016: PR #9 diff-name-only contains no `control/user_decisions/registry/README.md`.
- NEG017: PR #9 diff-name-only contains no `.maestro/flows/ios/onboarding-auth-smoke.yaml`.
- NEG018: PR #9 diff-name-only contains no `ios/App/App.xcodeproj/project.pbxproj`.
- NEG019: PR #9 diff-name-only contains no `ios/App/App/Info.plist`.
- NEG020: PR #9 diff-name-only contains no `ios/App/App/Plugins/RecocolPhotosPlugin/MetadataExtractor.swift`.
- NEG021: PR #9 diff-name-only contains no `ios/App/App/Plugins/RecocolPhotosPlugin/PhotoAssetManager.swift`.
- NEG022: PR #9 diff-name-only contains no `ios/App/App/Plugins/RecocolPhotosPlugin/RecocolPhotosPlugin.m`.
- NEG023: PR #9 diff-name-only contains no `ios/App/App/Plugins/RecocolPhotosPlugin/RecocolPhotosPlugin.swift`.
- NEG024: PR #9 diff-name-only contains no `SKILLS_ANALYSIS_ISSUES.md`.
- NEG025: PR #9 diff-name-only contains no `docs/verification/verification_packet_v5.md`.
- NEG026: PR #9 diff-name-only contains no `public/privacy_policy.html`.
- NEG027: PR #9 diff-name-only contains no `public/terms_of_service.html`.
- NEG028: PR #9 diff-name-only contains no `style.css`.
- NEG029: PR #9 diff-name-only contains no `tailwind.config.js`.
- NEG030: PR #9 diff-name-only contains no `src/plugins/RecocolPhotos.ts`.
- NEG031: PR #9 diff-name-only contains no `src/services/GeminiService.js`.
- NEG032: PR #9 diff-name-only contains no `src/services/PhotoService.js`.
- NEG033: PR #9 diff-name-only contains no `src/services/photo/dailyCurationRuntime.js`.
- NEG034: PR #9 diff-name-only contains no `src/services/photo/detailHydrator.js`.
- NEG035: PR #9 diff-name-only contains no `src/services/photo/legacyRankingRuntime.js`.
- NEG036: PR #9 diff-name-only contains no `src/services/photo/mutationRuntime.js`.
- NEG037: PR #9 diff-name-only contains no `src/components/home/homeLoadRuntime.js`.
- NEG038: PR #9 diff-name-only contains no `src/components/home/homeDeleteRuntime.js`.
- NEG039: PR #9 diff-name-only contains no `src/components/home/homeImageRuntime.js`.
- NEG040: PR #9 diff-name-only contains no `src/components/home/homeRefillRuntime.js`.
- NEG041: PR #9 diff-name-only contains no `main-worktree-verification-for-caption-optimization.md`.
- NEG042: PR #9 diff-name-only contains no `plans/gemini/2026-04-01-16-58_caption-optimization-branch-worktree-procedure.md`.
- NEG043: PR #9 diff-name-only contains no `plans/gemini/2026-04-01-16-58_caption-optimization-implementation-packet.md`.
- NEG044: PR #9 diff-name-only contains no `plans/gemini/2026-04-01-16-58_caption-optimization-pr-scope-checklist.md`.
- NEG045: PR #9 diff-name-only contains no `plans/gemini/2026-04-01-17-48_caption-optimization-tool-and-xcode-strategy.md`.
- NEG046: PR #9 diff-name-only contains no `plans/gemini/gemini_feedback.md`.
- NEG047: PR #9 diff-name-only contains no `docs/HANDOFF.md`.
- NEG048: PR #9 diff-name-only contains no `docs/demo-checklist.md`.
- NEG049: PR #9 diff-name-only contains no `docs/github-readiness-checklist.md`.
- NEG050: PR #9 diff-name-only contains no `docs/perf/worktree-experiment-plan.md`.
- NEG051: PR #9 diff-name-only contains no `docs/release-checklist.md`.
- NEG052: PR #9 diff-name-only contains no `docs/testing/maestro.md`.
- NEG053: PR #9 diff-name-only contains no `src/constants/env.js`.
- NEG054: PR #9 diff-name-only contains no `src/utils/fetch.js`.
- NEG055: PR #9 diff-name-only contains no `src/utils/photoPermission.js`.
- NEG056: PR #9 diff-name-only contains no `src/components/OnboardingModal.js`.
- NEG057: PR #9 diff-name-only contains no `backend/uv.lock`.
- NEG058: PR #9 diff-name-only contains no `recoco-design-system/`.
- NEG059: PR #9 diff-name-only contains no `context_portal/alembic/__pycache__/env.cpython-312.pyc`.
- NEG060: PR #9 diff-name-only contains no `context_portal/alembic/versions/__pycache__/2025_06_17_initial_schema.cpython-312.pyc`.

**Command Observation Ledger**

- OBS001: `gh pr view 9 --json state,...` returned `state=OPEN`.
- OBS002: `gh pr view 9 --json baseRefName,headRefName` returned `baseRefName=main`.
- OBS003: `gh pr view 9 --json baseRefName,headRefName` returned `headRefName=refactor/headless-core-clean`.
- OBS004: `gh pr view 9 --json additions,deletions` returned `additions=11177`.
- OBS005: `gh pr view 9 --json additions,deletions` returned `deletions=1538`.
- OBS006: `gh pr view 9 --json commits` returned commit `1e756facfb4e1a1685226114fef62a5455761aca`.
- OBS007: `gh pr view 9 --json commits` returned commit `dd016699c5ca60001b38125af24cc68e5cc08082`.
- OBS008: `gh pr view 9 --json commits` returned commit `5c4ed2758dd4f8ee53735510954c2ba393a4b501`.
- OBS009: `git log --oneline origin/main..origin/refactor/headless-core-clean` returned `5c4ed27`.
- OBS010: `git log --oneline origin/main..origin/refactor/headless-core-clean` returned `dd01669`.
- OBS011: `git log --oneline origin/main..origin/refactor/headless-core-clean` returned `1e756fa`.
- OBS012: `1e756fa --stat` returned `37 files changed`.
- OBS013: `1e756fa --stat` returned `3631 insertions(+)`.
- OBS014: `1e756fa --stat` returned `12 deletions(-)`.
- OBS015: `dd01669 --stat` returned `15 files changed`.
- OBS016: `dd01669 --stat` returned `1221 insertions(+)`.
- OBS017: `dd01669 --stat` returned `1367 deletions(-)`.
- OBS018: `5c4ed27 --stat` returned `17 files changed`.
- OBS019: `5c4ed27 --stat` returned `6325 insertions(+)`.
- OBS020: `5c4ed27 --stat` returned `159 deletions(-)`.
- OBS021: `PR #9 statusCheckRollup` returned `build` conclusion `SUCCESS`.
- OBS022: `PR #9 statusCheckRollup` returned `backend-smoke` conclusion `SUCCESS`.
- OBS023: `PR #9 statusCheckRollup` returned build details URL `https://github.com/goodand/narrative-ai/actions/runs/25680883065/job/75391718057`.
- OBS024: `PR #9 statusCheckRollup` returned backend-smoke details URL `https://github.com/goodand/narrative-ai/actions/runs/25680883065/job/75391718342`.
- OBS025: `PR #9 metadata` returned `mergeable=MERGEABLE`.
- OBS026: `PR #9 metadata` returned `mergeStateStatus=CLEAN`.
- OBS027: `PR #9 metadata` returned empty `reviewDecision`.
- OBS028: `PR #8 metadata` returned `state=CLOSED`.
- OBS029: `PR #8 metadata` returned `closedAt=2026-05-11T15:48:33Z`.
- OBS030: `PR #8 metadata` returned `headRefName=refactor/headless-core`.
- OBS031: `PR #8 comments[-1]` begins `Superseded by #9 (clean scope).`.
- OBS032: `git branch -r --list 'origin/refactor/headless-core*'` returned `origin/refactor/headless-core`.
- OBS033: `git branch -r --list 'origin/refactor/headless-core*'` returned `origin/refactor/headless-core-clean`.
- OBS034: `git worktree list` returned main worktree path `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai`.
- OBS035: `git worktree list` returned no `/Users/.../narrative-ai-headless-clean` path.
- OBS036: `git show 1e756fa:vite.config.js` has `backendPort` at `1e756fa:vite.config.js:11`.
- OBS037: `git show 1e756fa:vite.config.js` has `backendUrl` at `1e756fa:vite.config.js:12`.
- OBS038: `git show 1e756fa:vite.config.js` has proxy target line `1e756fa:vite.config.js:44`.
- OBS039: `git show 5c4ed27:.gitignore` has `backend/current_live_log.txt` at `5c4ed27:.gitignore:104`.
- OBS040: `git show dd01669:src/components/HomeManager.js` has `_setupEventDelegation` call at `dd01669:src/components/HomeManager.js:31`.
- OBS041: `git show dd01669:src/components/HomeManager.js` has `_setupEventDelegation` definition at `dd01669:src/components/HomeManager.js:93`.
- OBS042: `git show dd01669:src/components/AuthModal.js` has `duration-300 ease-in-out` at `dd01669:src/components/AuthModal.js:75`.
- OBS043: `git show dd01669:src/components/AuthModal.js` has `duration-200 ease-in-out` at `dd01669:src/components/AuthModal.js:86`.
- OBS044: `git show dd01669:src/components/AuthModal.js` has link `duration-200 ease-in-out` at `dd01669:src/components/AuthModal.js:92`.
- OBS045: `git show origin/main:src/components/AuthModal.js` has bare `transition-all` at `origin/main:src/components/AuthModal.js:95`.
- OBS046: `git show origin/main:src/components/AuthModal.js` has bare `transition-colors` at `origin/main:src/components/AuthModal.js:106`.
- OBS047: `git show origin/main:src/components/HomeManager.js` has `_setupDailyCurationListener` call at `origin/main:src/components/HomeManager.js:22`.
- OBS048: `git show origin/main:src/components/HomeManager.js` has `_setupDailyCurationListener` definition at `origin/main:src/components/HomeManager.js:143`.
- OBS049: `git show origin/main:src/components/HomeManager.js` has `daily-curation-updated` at `origin/main:src/components/HomeManager.js:145`.
- OBS050: `PR #9 body` top note records `319.62 kB / gzip 85.90 kB`.
- OBS051: `PR #9 body` validation row records `325.19 kB / gzip 87.69 kB`.
- OBS052: `PR #9 body` files row records old C2 `+1,153/-1,276`.
- OBS053: `PR #9 body` files row records old C3 `20 files`.
- OBS054: `PR #9 body` files row records old C3 `+5,697/-743`.
- OBS055: `PR #9 body` deletion sentence still mentions four home runtime helpers.
- OBS056: `5c4ed27` commit body says `src/components/home/*Runtime.js` were never present on `origin/main`.
- OBS057: `PR #9 body` retains `LLM Workflow Notes`.
- OBS058: `PR #9 body` retains `Manual smoke (TBD by reviewer)`.
- OBS059: `PR #9 diff-name-only` includes `docs/refactor/headless-core-post-push-review.md`.
- OBS060: `PR #9 diff-name-only` includes no path outside the headless scope categories listed in §1.

## 13. Recommendations (Critical/High/Medium/Low) — merge 가능 여부 포함

| Severity | Recommendation | Evidence |
|---|---|---|
| Critical | No CI/mergeability blocker is visible for PR #9: `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`, `CI/build=SUCCESS`, `CI/backend-smoke=SUCCESS`; merge-readiness is now blocked only by review/content hygiene decisions, not GitHub status. | `PR #9 metadata/statusCheckRollup`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-84`. |
| High | Update PR #9 body before merge: replace stale C2/C3 stats, remove the home-runtime deletion claim, and reconcile `319.62/85.90` with the old `325.19/87.69` validation row. | `PR #9 §Files changed`; `PR #9 §Validation`; `dd01669 --stat`; `5c4ed27 --stat`. |
| High | Decide whether `dd01669:src/components/AuthModal.js:75-92` transition-duration classes are acceptable as incidental UI cleanup or should be reverted to keep the clean PR strictly headless. | `dd01669:src/components/AuthModal.js:75-92`; `origin/main:src/components/AuthModal.js:95-106`. |
| Medium | After PR #9 merge, delete or archive `origin/refactor/headless-core` once no further PR #8 forensic reference is needed; keep `origin/refactor/headless-core-clean` until PR #9 is merged. | `git branch -r --list 'origin/refactor/headless-core*'`; `PR #8 metadata`; `PR #9 metadata`. |
| Medium | Switch the main worktree away from old local `refactor/headless-core` before continuing headless work, or explicitly document that local branch as superseded. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`; `git worktree list`; `PR #9 metadata`. |
| Medium | Attach manual smoke results to PR #9 after web/iOS checks, especially auth/deep-link/permission/destructive flows. | `PR #9 §Manual smoke`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. |
| Low | Keep backend/uv.lock and legacy-service/global cleanup as separate follow-up work. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:527`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`. |
| Low | Preserve the four-stage audit chain as a reusable release gate pattern, but move long LLM Workflow Notes to a separate playbook after merge. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-post-push-review.md:1-19`; `PR #9 §LLM Workflow Notes`. |
