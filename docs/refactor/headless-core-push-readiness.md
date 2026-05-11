# Headless Core Refactor — Pre-Push Readiness
Audit date: 2026-05-11

## 0. Executive Summary

1. Artifact scope: GO — refactor artifacts map to core, adapters, DOM UI, docs, configs.
2. Git command execution: HOLD — `git status`, `git diff --check`, and `git log` were not executed by instruction.
3. `.gitignore`: GO — five personal/local patterns are narrow; `docs/verification/` needs policy awareness.
4. Build readiness: GO with verification gap — line-cited build record is slice 5 size, not a post-slice-6 build.
5. CI readiness: GO — CI and iOS workflows already run `npm ci` + `npm run build`.
6. iOS readiness: GO with manual sync smoke — workflow runs `npx cap sync ios`.
7. Cold boot auth: GO by static path.
8. Destructive flows: GO by single controller caller paths.
9. Branch strategy: HOLD — current branch is control-themed and already ahead; refactor branch is cleaner for PR review.
10. Commit strategy: HOLD — 3 logical commits balance reviewability and history size.
11. Backend/uv.lock: HOLD — backend artifact is unrelated to headless refactor.
12. Push: HOLD until real `git diff --check`, build, and smoke are run.

Core recommendations: create a dedicated refactor branch or PR, use 3 logical commits, and run the mechanical checks before pushing.

## 1. Push artifact 분류

| Predicted status bucket | Files / directories | Slice intent mapping | Evidence |
|---|---|---|---|
| Branch metadata | Current branch pointer | Branch is `control/canonicalize-control-tree-shims`; origin remote is configured | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/config:39-42`. |
| Origin baseline metadata | `origin/main` packed ref | Read-only ref metadata, not `git log` execution | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/packed-refs:16-20`. |
| Root build config | `package.json`, `package-lock.json`, `vite.config.js`, `jsconfig.json` | Workspaces + core alias + lockfile workspace update | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:7-13`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package-lock.json:7-14`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:20-31`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/jsconfig.json:9-13`. |
| Bootstrap | `main.js` | Thin bootstrap: legacy daily reset, ports, core, DOM app, controller init | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:1-14`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:41-58`. |
| Core package | `packages/core/` | Headless core package and nine controllers | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:121-132`. |
| Port adapters | `src/adapters/` | Single app-side platform/service composition root plus 13 ports | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:21-39`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:109-123`. |
| DOM adapters | `src/ui/dom/` | `createDomApp`, DOM events, router adapter, toast presenter | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:1-15`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:1-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:1-10`. |
| Converted components | 8 components + `Modal.js` + `src/index.js` | Slice 5a-5e component-to-core conversion and slice 6 cleanup | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:6-12`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:1-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:1-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:1-11`. |
| Deleted home runtimes | `src/components/home/homeLoadRuntime.js`, `homeDeleteRuntime.js`, `homeImageRuntime.js`, `homeRefillRuntime.js` | Slice 5e deletes runtime helpers after HomeManager conversion | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:840-847`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:862-868`. |
| Deleted temp handler | `src/utils/temp_handleUrl.js` | Slice 4 cleanup after AuthController handles launch URL and appUrlOpen | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:300-312`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:101-121`. |
| Deleted legacy router | `src/services/Router.js` | Slice 6 M2 cleanup after domRouterAdapter replacement | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:880`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:8-17`. |
| Documentation artifacts | `docs/refactor/` | Slice mapping docs, final review, this pre-push readiness doc | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. |
| `.gitignore` reinforcement | `.gitignore` | Exclude local/personal artifacts before push | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-115`. |
| Predicted `git status --short` | Not executed | Classification above is file-read prediction only | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:719-733` lists validation commands but this review did not execute them. |
| Predicted `git diff --check` | Not executed; prior slice 5 record says 0 | Post-slice-6 real command still required | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:725-733`. |
| Predicted `git log origin/main..HEAD` | Not executed; user packet states 34 ahead | Branch/ref facts only | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/packed-refs:16-20`. |

## 2. .gitignore 보강 적절성

| Pattern | Current line | Personal / separate artifact signal | Overlap / masking facts |
|---|---:|---|---|
| `.history_uncommitted_diff.patch` | 103 | Scoped to one local backup patch | `.history/` is already ignored at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:20-23`; exact patch filename is separate at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-104`. |
| `backend/current_live_log.txt` | 106 | Runtime backend log, not source | Backend log glob covers `backend/backend_log*.txt` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:36-45`; current live log is explicitly added at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:105-107`. |
| `codex-reports/` | 109 | Local agent report directory | It does not overlap source dirs `packages/`, `src/`, or `docs/refactor/`; ignore pattern is exact directory at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:108-110`. |
| `recoco-design-system/` | 112 | Separate design-system workspace | Pattern is a top-level directory only; current app design files in `src/` are not matched by this exact path at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:111-112`. |
| `docs/verification/` | 115 | Local audit/verification scratch | It does not hide `docs/refactor/`, but it will hide all future verification artifacts under that path; pattern is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:114-115`. |
| Existing env ignores | 1-5 | Keeps secrets out | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:1-5`. |
| Existing Node build ignores | 6-7, 63-65 | Keeps dependencies/build output out | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:6-7`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:63-65`. |
| Existing Capacitor public ignore | 10-14 | Keeps generated iOS web assets out | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:10-14`; Capacitor webDir is `dist` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/capacitor.config.json:1-7`. |
| Existing temp ignores | 84-89 | Covers generic logs/temp files | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:84-89`. |
| Backend `.venv` ignore | 36-39 | Keeps Python virtualenv out | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:36-39`; backend venv files exist locally under `backend/.venv` based on filesystem reads, but no git command was executed. |

## 3. Build 출력 예측

| Build aspect | Static fact | Evidence |
|---|---|---|
| Build command | `npm run build` maps to `vite build` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:10-13`. |
| Workspace structure | Root package uses `packages/*` workspaces | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:7-9`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package-lock.json:7-14`. |
| Core package | `@recoco/core` is private ESM package | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`. |
| Vite alias | Alias resolves `@recoco/core` to source index | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:20-23`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/index.js:1`. |
| JS path alias | Editor/jsconfig alias mirrors Vite alias | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/jsconfig.json:9-13`. |
| Output directory | Vite output is `dist` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:25-31`. |
| Source maps | Production sourcemap is enabled | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:25-27`. |
| Rollup input | Single app entry is `index.html` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:28-31`. |
| Build artifacts ignored | `dist/` and `build/` ignored | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:63-65`. |
| Slice 5 line-cited build record | `325.28 kB`, gzip `87.63 kB` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:862-868`. |
| Slice 6 bundle size reference | User packet reports `325.19 kB` / gzip `87.69 kB`; inspected docs do not contain that exact number | The closest line-cited bundle record remains `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:853`. |
| CI build env | Placeholder Supabase/API env is set for CI build | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:24-32`. |
| iOS build env | Placeholder Supabase/API env is set before iOS sync | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:23-35`. |
| Capacitor public sync | iOS generated web assets are ignored | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:10-14`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:33-35`. |

## 4. iOS Capacitor 영향 평가

| Area | Static path | Evidence |
|---|---|---|
| Capacitor app id | Existing app id unchanged | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/capacitor.config.json:1-7`. |
| Web output | Capacitor uses `dist` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/capacitor.config.json:1-7`; Vite outputs `dist` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:25-31`. |
| Native photo bridge | RecocolPhotos plugin interface includes permission, curation, metadata, image, delete methods | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:35-78`. |
| Native/web plugin split | Web uses MockPlugin, native uses registered plugin | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:80-125`. |
| Port wrapper | `createAppPorts` passes RecocolPhotos into PhotoPort | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:21-39`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:80-83`. |
| Permission wrapper | PhotoPort delegates permission methods to plugin | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/photos/photoPort.js:66-70`. |
| Delete/action wrapper | PhotoPort delegates delete/action methods to PhotoService | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/photos/photoPort.js:60-65`. |
| Deep link app listener | AuthController registers `appUrlOpen` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:101-107`. |
| Launch URL handling | AuthController reads launch URL before restoreSession completes | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:112-121`. |
| Browser close / token exchange | AuthController closes Browser and exchanges tokens/code | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:145-175`. |
| Native OAuth redirect | Native redirect constant matches app id scheme | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:16-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:30`. |
| iOS CI sync | Workflow runs `npx cap sync ios` after build | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:23-35`. |
| iOS simulator build | Workflow builds iOS simulator app after sync | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:36-49`. |
| iOS artifact packaging | Workflow zips App.app artifact | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:50-77`. |

## 5. 회귀 시나리오 정적 분석

| # | Scenario | Static caller path / store transition | Static residual |
|---:|---|---|---|
| 1 | Cold boot, no session | `main.js` creates core/DOM, then `core.auth.init()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:46-51`; AuthController `restoreSession()` applies signed_out at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:177-186`; createDomApp opens onboarding on initial signed_out at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:181-203`. | Static path exists. |
| 2 | Cold boot, signed in | AuthController auth listener applies signed_in at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:63-72`; createDomApp closes auth, navigates home, and checks permission at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:191-195`. | Permission check is async fire from auth reactor. |
| 3 | Permission denied then reopen | PermissionModal check/request writes permission VM through controller at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:41-50` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:122-130`; controller denied/skipped reasons are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:114-157`. | `checkAndOpen()` opens when `shouldPrompt` or prompt reasons are set at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:49-50`. |
| 4 | Delete / precious consecutive clicks | HomeManager maps one click to one controller call at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:104-121`; controller records/deletes/consumes in `markPrecious` and `deleteCurrent` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:193-252`. | Buttons are disabled from VM controls in render at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:279-287`. |
| 5 | Report → MyPage → Home navigation accumulation | domEvents tabs call `navigation.navigate` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:37-58`; NavigationController pushes history on route change at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/navigation/createNavigationController.js:50-69`; domRouterAdapter applies route DOM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:97-139`. | History grows on non-replace tab navigation by design. |
| 6 | Account delete → new account login | MyPage calls `core.account.deleteAccount()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:319-348`; AccountController calls backend, global signOut, clears local/session storage, and writes deleted at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:118-165`; farewell reload is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/MyPageManager.js:350-379`. | New boot follows auth init path after reload. |
| 7 | Notification ON → background/foreground | NoticeManager calls `setEnabled` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/NoticeManager.js:109-139`; NotificationController schedules/persists on ON at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:101-144`; `appStateChange` reschedules when active at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:146-159`. | Init also schedules if persisted enabled at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:79-93`. |
| 8 | Result keyword replace + edit + share | ResultViewer keyword callback loads synonyms and calls replace at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:128-137`; ResultViewer edit/copy/share call core at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:144-190`; ResultController re-tokenizes caption and shares with optional input base64 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:84-164`. | Clipboard fallback is adapter-owned at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/clipboard/clipboardPort.js:23-58`. |

## 6. Branch 전략 비교표

| Option | Mechanics | Pros facts | Cons facts |
|---|---|---|---|
| 1. Same branch | Keep `control/canonicalize-control-tree-shims` | Current HEAD already points to this branch at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`; branch config tracks same branch name at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/config:39-42`. | Branch name is control/canonicalization themed while artifact scope is headless refactor; user packet states existing branch has many style/control commits. |
| 2. New refactor branch | Branch from current or from main and carry slice 1-6 changes | Refactor scope has clean directory boundaries: core package at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:13-18`, adapters at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`, DOM adapters at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`. | Cherry-pick or branch surgery must preserve deletes documented at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:840-847` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:880`. |
| 3. Rebase directly onto main | Rebase current branch then commit/push | `origin/main` ref exists in packed refs at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/packed-refs:20`. | User packet states branch is 34 commits ahead; rebasing a mixed branch can combine design/control commits with headless refactor review. |

## 7. Commit 분할 옵션 비교표

| Option | Shape | Pros facts | Cons facts |
|---|---|---|---|
| A. Single commit | One architecture commit | One commit captures the slice 1-6 architectural endpoint; current core factory returns all controllers at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:121-132`. | Large diff groups package/config/components/docs/deletes together; component conversions span multiple files such as `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:1-19` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1-15`. |
| B. Six slice commits | Slice-shaped history | Mirrors slice documentation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:801-847` and slice 6 addendum at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. | More commits require careful staging and increase conflict surface if current branch contains unrelated prior commits. |
| C. Three logical commits | Core/adapters, DOM/components, cleanup/docs | Separates core/adapters, UI conversion, cleanup/docs; boundaries match `packages/core`, `src/adapters`, `src/ui/dom`, and docs directories at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`. | Requires staging deletion/cleanup with the correct logical commit; legacy daily reset remains in `main.js` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:41-48`. |

Option A commit message draft:

```text
refactor(fe): introduce headless core and DOM adapters

- add @recoco/core package with store/controllers
- add app ports and DOM adapters
- convert legacy components to core-driven DOM views
- remove obsolete router/temp/home runtime files
```

Option B commit message draft:

```text
refactor(core): add headless store and controller contracts
refactor(adapters): add app port layer
refactor(core): wire auth permissions notifications account home input result report
refactor(dom): add createDomApp and DOM router adapters
refactor(components): convert legacy managers to core-driven views
chore(refactor): cleanup router state exports and local ignore rules
```

Option C commit message draft:

```text
refactor(core): add headless core package and platform ports
refactor(dom): route bootstrap and converted components through core
chore(refactor): remove dead legacy paths and document push readiness
```

## 8. CI 영향 평가

| Workflow | Current behavior | Workspace/build impact facts |
|---|---|---|
| `ci.yml` trigger | Runs on pull_request, push to main, manual | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:1-8`. |
| `ci.yml` Node setup | Node 22, npm cache | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:19-23`. |
| `ci.yml` install/build | `npm ci` then `npm run build` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:24-32`; root package has workspaces at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:7-9`. |
| `ci.yml` backend smoke | Installs `./backend`, runs uvicorn, checks `/health` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`; backend package is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/pyproject.toml:1-17`. |
| `build-ios.yml` trigger | Runs on push to main and manual | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:1-7`. |
| `build-ios.yml` Node build | `npm ci` then `npm run build` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:18-31`. |
| `build-ios.yml` Capacitor sync | Runs `npx cap sync ios` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:33-35`. |
| `build-ios.yml` Xcode build | Builds App workspace for simulator | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:36-49`. |
| Lockfile drift | Lockfile now includes root workspaces | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package-lock.json:1-14`; `packages/core/package.json` is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`. |

## 9. PR description fact bullets

| PR section | Fact bullets to use | Evidence |
|---|---|---|
| `## Summary` | Headless core package added as `@recoco/core`; all nine controllers are wired; DOM app composes converted components | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:13-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:86-107`. |
| `## Summary` | 8 legacy components now receive `{ core }` or call controllers | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:8-12`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:12-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:23-31`. |
| `## Summary` | Legacy router moved to DOM adapter and deleted in slice 6 | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:880`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:8-17`. |
| `## Slices (6)` | Slice 5 final verification and slice 6 addendum are documented | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-884`. |
| `## Files changed` | New directories: `packages/core`, `src/adapters`, `src/ui/dom`, `docs/refactor` | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`. |
| `## Files changed` | Deleted runtime/temp/router paths | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:840-847`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:300-312`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:880`. |
| `## Validation` | Slice 5 line-cited build and boundary scans | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; final review boundary summary is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:6-18`. |
| `## Manual smoke (TBD)` | Use instruction smoke list as manual checklist source | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:770-785`. |
| `## Out of scope` | Backend changes and remaining legacy services are not core refactor target | Legacy services remain adapter dependencies at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`; backend package metadata is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/pyproject.toml:1-17`. |

## 10. 추가 검증 권장 항목

| Priority basis | Candidate check | Supporting facts |
|---|---|---|
| P0 mechanical | `git diff --check` | Instruction validation names it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:725-733`; slice 5 had a pre-slice-6 `0` record at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:860`. |
| P0 build | `npm run build` | Build script is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:10-13`; CI build uses same command at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:24-32`. |
| P0 diff review | `git diff --stat origin/main..HEAD` | User packet asks push artifact classification; branch/ref metadata is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/packed-refs:20`. |
| P1 web smoke | Vite dev/preview manual smoke | Scripts exist at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:10-18`; smoke list is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:770-785`. |
| P1 iOS smoke | `npx cap sync ios` plus simulator smoke | CI workflow syncs iOS at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:33-35`; iOS build command is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:36-49`. |
| P2 static JS check | TypeScript/JS check status | `jsconfig.json` has `checkJs: false` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/jsconfig.json:2-8`; no `tsc` script appears in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:10-18`. |
| P2 lint | ESLint availability | No lint script appears in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:10-18`. |

## 11. 신규 4 디렉터리 일관성

| Directory | Observed file count from read-only listing | Header / top-line citations |
|---|---:|---|
| `packages/core/` | 19 files | Package header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`; public index `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/index.js:1`; factory `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-18`. |
| `packages/core/src/contracts` | 1 file | Ports header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:1-10`. |
| `packages/core/src/state` | 1 file | Store header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:1-18`. |
| `packages/core/src/auth` | 1 file | Auth header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:1-19`. |
| `packages/core/src/permissions` | 1 file | Permission header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:1-13`. |
| `packages/core/src/notifications` | 1 file | Notification header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:1-17`. |
| `packages/core/src/account` | 1 file | Account header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:1-23`. |
| `packages/core/src/home` | 3 files | Home controller header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:1-23`; VM entry `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeViewModel.js:1-20`. |
| `packages/core/src/input` | 1 file | Input header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:1-19`. |
| `packages/core/src/result` | 2 files | Result header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:1-24`; format helper import usage `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:37`. |
| `packages/core/src/report` | 2 files | Report header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:1-20`; aggregate helper is consumed at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:34`. |
| `packages/core/src/navigation` | 1 file | Navigation header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/navigation/createNavigationController.js:1-16`. |
| `packages/core/src/errors` | 1 file | Normalize helper is imported by factory at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-2`; final review cites normalize contract at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:119-134`. |
| `src/adapters/` | 14 files | Root assembler `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`; auth adapter use `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:41-53`; return bundle `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:109-123`. |
| `src/adapters/photos` | 1 file | PhotoPort header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/photos/photoPort.js:1-19`. |
| `src/adapters/clipboard` | 1 file | Clipboard header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/clipboard/clipboardPort.js:1-15`. |
| `src/adapters/share` | 1 file | SharePort header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/share/sharePort.js:1-8`. |
| `src/adapters/account` | 1 file | AccountApiPort header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/account/accountApiPort.js:1-16`. |
| `src/ui/dom/` | 4 files | createDomApp header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`; domEvents header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:1-15`; router header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:1-19`; toast header `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:1-10`. |
| `docs/refactor/` | 12 files after this artifact | Instructions `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:1-19`; final review `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`; slice 5 addendum `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. |

**File Header Evidence Ledger**

| ID | Artifact | Header / boundary evidence |
|---|---|---|
| FH001 | `packages/core/package.json` | Package identity and export entry are declared at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`. |
| FH002 | `packages/core/src/index.js` | Public core exports begin at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/index.js:1-16`. |
| FH003 | `packages/core/src/createRecocoCore.js` | Factory imports and comments define headless wiring at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-18`. |
| FH004 | `packages/core/src/createRecocoCore.js` | Controller factory import set is visible at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:3-11`. |
| FH005 | `packages/core/src/createRecocoCore.js` | Dependency normalization starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:20-24`. |
| FH006 | `packages/core/src/createRecocoCore.js` | Store creation is centralized at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:26-31`. |
| FH007 | `packages/core/src/contracts/ports.js` | Port contract header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:1-10`. |
| FH008 | `packages/core/src/state/createStore.js` | Store builder header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:1-18`. |
| FH009 | `packages/core/src/auth/createAuthController.js` | Auth controller import boundary is at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:1-19`. |
| FH010 | `packages/core/src/auth/createAuthController.js` | Auth controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:21-27`. |
| FH011 | `packages/core/src/permissions/createPermissionController.js` | Permission controller header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:1-13`. |
| FH012 | `packages/core/src/permissions/createPermissionController.js` | Permission controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:15-21`. |
| FH013 | `packages/core/src/notifications/createNotificationController.js` | Notification controller header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:1-17`. |
| FH014 | `packages/core/src/notifications/createNotificationController.js` | Notification controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:19-25`. |
| FH015 | `packages/core/src/account/createAccountController.js` | Account controller header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:1-23`. |
| FH016 | `packages/core/src/account/createAccountController.js` | Account controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:25-32`. |
| FH017 | `packages/core/src/home/createHomeController.js` | Home controller header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:1-23`. |
| FH018 | `packages/core/src/home/createHomeController.js` | Home controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:27-37`. |
| FH019 | `packages/core/src/home/createHomeViewModel.js` | Home view-model helper header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeViewModel.js:1-20`. |
| FH020 | `packages/core/src/home/analyzeCurationReasons.js` | Curation reason helper exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/analyzeCurationReasons.js:1`. |
| FH021 | `packages/core/src/input/createInputController.js` | Input controller header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:1-19`. |
| FH022 | `packages/core/src/input/createInputController.js` | Input controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/input/createInputController.js:21-28`. |
| FH023 | `packages/core/src/result/createResultController.js` | Result controller header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:1-24`. |
| FH024 | `packages/core/src/result/createResultController.js` | Result controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:39-47`. |
| FH025 | `packages/core/src/result/formatCaption.js` | Result formatting helper exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/formatCaption.js:1`. |
| FH026 | `packages/core/src/report/createReportController.js` | Report controller header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:1-20`. |
| FH027 | `packages/core/src/report/createReportController.js` | Report controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/createReportController.js:36-42`. |
| FH028 | `packages/core/src/report/aggregateReportStats.js` | Report aggregation helper exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/report/aggregateReportStats.js:1`. |
| FH029 | `packages/core/src/navigation/createNavigationController.js` | Navigation controller header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/navigation/createNavigationController.js:1-16`. |
| FH030 | `packages/core/src/navigation/createNavigationController.js` | Navigation controller factory signature starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/navigation/createNavigationController.js:18-24`. |
| FH031 | `packages/core/src/errors/normalizeError.js` | Normalize helper exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/errors/normalizeError.js:1`. |
| FH032 | `src/adapters/createAppPorts.js` | Adapter assembler imports start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`. |
| FH033 | `src/adapters/createAppPorts.js` | Auth adapter creation is grouped at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:41-53`. |
| FH034 | `src/adapters/createAppPorts.js` | Photo and AI adapter creation is grouped at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:55-70`. |
| FH035 | `src/adapters/createAppPorts.js` | Adapter return bundle starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:109-123`. |
| FH036 | `src/adapters/account/accountApiPort.js` | Account API adapter header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/account/accountApiPort.js:1-16`. |
| FH037 | `src/adapters/ai/geminiAiPort.js` | Gemini AI adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/ai/geminiAiPort.js:1`. |
| FH038 | `src/adapters/auth/capacitorAppPort.js` | Capacitor app adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/auth/capacitorAppPort.js:1`. |
| FH039 | `src/adapters/auth/capacitorBrowserPort.js` | Capacitor browser adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/auth/capacitorBrowserPort.js:1`. |
| FH040 | `src/adapters/auth/supabaseAuthPort.js` | Supabase auth adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/auth/supabaseAuthPort.js:1`. |
| FH041 | `src/adapters/clipboard/clipboardPort.js` | Clipboard adapter header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/clipboard/clipboardPort.js:1-15`. |
| FH042 | `src/adapters/image/imageProcessorPort.js` | Image processor adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/image/imageProcessorPort.js:1`. |
| FH043 | `src/adapters/notifications/capacitorNotificationPort.js` | Notification adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/notifications/capacitorNotificationPort.js:1`. |
| FH044 | `src/adapters/photos/photoPort.js` | Photo adapter header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/photos/photoPort.js:1-19`. |
| FH045 | `src/adapters/share/sharePort.js` | Share adapter header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/share/sharePort.js:1-8`. |
| FH046 | `src/adapters/stats/statsPort.js` | Stats adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/stats/statsPort.js:1`. |
| FH047 | `src/adapters/storage/browserStoragePort.js` | Browser storage adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/storage/browserStoragePort.js:1`. |
| FH048 | `src/adapters/time/systemClockPort.js` | System clock adapter exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/time/systemClockPort.js:1`. |
| FH049 | `src/ui/dom/createDomApp.js` | DOM composition header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`. |
| FH050 | `src/ui/dom/createDomApp.js` | Slice 6 H1/H2/M4/M5 comments are at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:12-17`. |
| FH051 | `src/ui/dom/createDomApp.js` | Component imports start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:26-39`. |
| FH052 | `src/ui/dom/createDomApp.js` | `TOAST_DOMAINS` includes eight error-bearing domains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:41-50`. |
| FH053 | `src/ui/dom/createDomApp.js` | `makeSafeInit` takes injected `bootErrors` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:52-65`. |
| FH054 | `src/ui/dom/createDomApp.js` | `tryDestroy` helper starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:67-72`. |
| FH055 | `src/ui/dom/createDomApp.js` | `createDomApp` signature includes `bootErrors` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:74-86`. |
| FH056 | `src/ui/dom/createDomApp.js` | Eager component construction starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:94-105`. |
| FH057 | `src/ui/dom/createDomApp.js` | Lazy manager factories start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:107-144`. |
| FH058 | `src/ui/dom/createDomApp.js` | Manager accessors start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:146-166`. |
| FH059 | `src/ui/dom/createDomApp.js` | Router/event setup starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:168-179`. |
| FH060 | `src/ui/dom/createDomApp.js` | Auth reactor starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:181-203`. |
| FH061 | `src/ui/dom/createDomApp.js` | Error subscription to all toast domains is at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:205-206`. |
| FH062 | `src/ui/dom/createDomApp.js` | Destroy cascade starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:208-234`. |
| FH063 | `src/ui/dom/domEvents.js` | DOM event adapter header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:1-15`. |
| FH064 | `src/ui/dom/domEvents.js` | Nav event constants start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:17-21`. |
| FH065 | `src/ui/dom/domRouterAdapter.js` | Router adapter header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:1-19`. |
| FH066 | `src/ui/dom/domRouterAdapter.js` | View map definition starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:21-30`. |
| FH067 | `src/ui/dom/toastPresenter.js` | Toast presenter header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:1-10`. |
| FH068 | `src/ui/dom/toastPresenter.js` | Toast creation starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:12-24`. |
| FH069 | `docs/refactor/headless-core-agent-instructions.md` | Instruction document header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:1-19`. |
| FH070 | `docs/refactor/headless-core-agent-instructions.md` | Conversion contract uses component conversion lines at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:680-699`. |
| FH071 | `docs/refactor/headless-core-agent-instructions.md` | Acceptance criteria start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:754-786`. |
| FH072 | `docs/refactor/headless-core-final-review.md` | Final review header and summary start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`. |
| FH073 | `docs/refactor/headless-core-final-review.md` | Final review recommendations start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:795-812`. |
| FH074 | `docs/refactor/slice-2-adapter-mapping.md` | Slice 2 mapping exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:1`. |
| FH075 | `docs/refactor/slice-3-controller-mapping.md` | Slice 3a mapping exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:1`. |
| FH076 | `docs/refactor/slice-3b-controller-mapping.md` | Slice 3b mapping exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:1`. |
| FH077 | `docs/refactor/slice-3c1-controller-mapping.md` | Slice 3c-1 mapping exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3c1-controller-mapping.md:1`. |
| FH078 | `docs/refactor/slice-3c2-controller-mapping.md` | Slice 3c-2 mapping exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3c2-controller-mapping.md:1`. |
| FH079 | `docs/refactor/slice-3c3-controller-mapping.md` | Slice 3c-3 mapping exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3c3-controller-mapping.md:1`. |
| FH080 | `docs/refactor/slice-4-integration-mapping.md` | Slice 4 mapping exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-4-integration-mapping.md:1`. |
| FH081 | `docs/refactor/slice-5-component-mapping.md` | Slice 5 mapping header starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:1`. |
| FH082 | `docs/refactor/slice-5-component-mapping.md` | Slice 6 addendum starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. |
| FH083 | `docs/refactor/instruction-doc-consistency-audit.md` | Consistency audit exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/instruction-doc-consistency-audit.md:1`. |
| FH084 | `main.js` | Bootstrap ownership comments start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:1-14`. |
| FH085 | `main.js` | Main imports are limited to core/adapters/ui/store at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:16-20`. |
| FH086 | `main.js` | Boot error buffer is local plus explicit mirror at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:22-23`. |
| FH087 | `main.js` | Root element collection starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:25-39`. |
| FH088 | `main.js` | Init sequence creates ports/core/app at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:41-58`. |
| FH089 | `package.json` | Workspaces and scripts are declared at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:7-18`. |
| FH090 | `package.json` | Runtime dependencies are declared at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:23-36`. |
| FH091 | `package-lock.json` | Lockfile workspace metadata starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package-lock.json:1-14`. |
| FH092 | `vite.config.js` | Alias config starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:20-23`. |
| FH093 | `vite.config.js` | Build output config starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:25-31`. |
| FH094 | `jsconfig.json` | JS config and check setting start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/jsconfig.json:1-13`. |
| FH095 | `.github/workflows/ci.yml` | CI trigger starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:1-8`. |
| FH096 | `.github/workflows/ci.yml` | Frontend build sequence starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-33`. |
| FH097 | `.github/workflows/ci.yml` | Backend smoke sequence starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`. |
| FH098 | `.github/workflows/build-ios.yml` | iOS workflow trigger starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:1-7`. |
| FH099 | `.github/workflows/build-ios.yml` | iOS npm build sequence starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:18-31`. |
| FH100 | `.github/workflows/build-ios.yml` | iOS Capacitor sync starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:33-35`. |
| FH101 | `.github/workflows/build-ios.yml` | Xcode archive starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:36-49`. |
| FH102 | `capacitor.config.json` | Capacitor appId/webDir config starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/capacitor.config.json:1-7`. |
| FH103 | `src/plugins/RecocolPhotos.ts` | Native plugin imports start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:1-9`. |
| FH104 | `src/plugins/RecocolPhotos.ts` | Plugin interface starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:35-78`. |
| FH105 | `src/plugins/RecocolPhotos.ts` | Native/mock split starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:80-125`. |
| FH106 | `src/components/Modal.js` | Modal base starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/Modal.js:6-72`. |
| FH107 | `src/components/Modal.js` | SuggestionModal starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/Modal.js:74-118`. |
| FH108 | `src/components/Modal.js` | SettingsModal removal comment is at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/Modal.js:120-121`. |
| FH109 | `src/components/Modal.js` | ConfirmModal starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/Modal.js:123-185`. |
| FH110 | `src/index.js` | Legacy export removal comments start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:1-11`. |
| FH111 | `src/index.js` | Public component exports start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:13-36`. |
| FH112 | `.gitignore` | Build/dependency ignores start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:1-15`. |
| FH113 | `.gitignore` | Runtime/log ignores start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:36-45`. |
| FH114 | `.gitignore` | Local artifact additions start at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-115`. |
| FH115 | `.git/HEAD` | Current branch ref is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`. |
| FH116 | `.git/config` | Branch remote/merge config is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/config:39-42`. |
| FH117 | `.git/packed-refs` | Origin main ref is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/packed-refs:20`. |
| FH118 | `backend/pyproject.toml` | Backend package metadata starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/pyproject.toml:1-17`. |
| FH119 | `backend/pyproject.toml` | Backend tool config starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/pyproject.toml:36-40`. |
| FH120 | `backend/uv.lock` | Backend uv lock metadata starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/uv.lock:1-12`. |

**Boundary Scan Evidence Ledger**

| ID | Scan target | Evidence |
|---|---|---|
| BS001 | Core browser globals scan | Final review expected core scan 0 matches at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:22-31`. |
| BS002 | Component service import scan | Final review expected component scan 0 matches at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:32-43`. |
| BS003 | DOM service import scan | Final review expected DOM scan residuals at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:44-53`. |
| BS004 | Main StateManager scan | Final review allowed only daily reset at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:54-61`. |
| BS005 | Slice 6 H1 | Component destroy coverage is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:876`. |
| BS006 | Slice 6 H2 | Boot error injection is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:877`. |
| BS007 | Slice 6 H3 | Clipboard fallback ownership patch is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:878`. |
| BS008 | Slice 6 M1 | Hybrid reactor acceptance is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:879`. |
| BS009 | Slice 6 M2 | Router file deletion is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:880`. |
| BS010 | Slice 6 M3 | StateManager export removal is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:881`. |
| BS011 | Slice 6 M4 | SettingsModal removal is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:882`. |
| BS012 | Slice 6 M5 | Error-domain subscription expansion is recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:883`. |
| BS013 | Slice 6 L deferrals | Remaining deferrals are recorded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. |
| BS014 | DOM residual ShareService | Final review still saw ShareService imports in DOM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:44-53`. |
| BS015 | Window bootErrors | Final review reports `window.__bootErrors` in main at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:756-763`. |
| BS016 | Window supabase instance | Final review reports adapter/service-only `window.supabaseInstance` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:764-771`. |
| BS017 | Nav dispatch residual | Final review reports dispatchNavChange residuals at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:772-779`. |
| BS018 | Dead temp handler | Final review reports `temp_handleUrl` cleanup at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:621-626`. |
| BS019 | Router import cleanup | Final review reports Router cleanup at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:646-653`. |
| BS020 | StateManager residual | Final review reports StateManager residuals at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:638-645`. |
| BS021 | Build prediction source | Slice 5 recorded build output at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:853`. |
| BS022 | Whitespace check source | Slice 5 recorded `git diff --check` 0 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:860`. |
| BS023 | Required validation source | Instruction doc lists validation commands at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:719-733`. |
| BS024 | Manual smoke source | Instruction doc lists manual acceptance scenarios at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:770-785`. |

**Regression Scenario Evidence Ledger**

| ID | Scenario | Static path evidence |
|---|---|---|
| RS001 | Cold boot no session | Main calls `core.auth.init()` after app creation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:46-51`. |
| RS002 | Cold boot no session | Auth reactor observes VM status at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:181-203`. |
| RS003 | Cold boot signed in | Core factory wires auth/navigation/permissions at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:26-31`. |
| RS004 | Cold boot signed in | Permission controller is available through factory wiring at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-18`. |
| RS005 | Permission denied/reopen | Permission controller owns permission request surface at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/permissions/createPermissionController.js:1-13`. |
| RS006 | Permission denied/reopen | Permission modal is constructed with `core` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:94-105`. |
| RS007 | Delete/precious rapid click | Home controller surface is centralized at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/home/createHomeController.js:27-37`. |
| RS008 | Delete/precious rapid click | Home manager factory receives `core` through DOM composition at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:107-144`. |
| RS009 | Report to mypage to home | Router adapter setup is created once at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:168-179`. |
| RS010 | Report to mypage to home | DOM router view mapping starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:21-30`. |
| RS011 | Withdrawal/new login | Account controller owns deletion flow at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/account/createAccountController.js:25-32`. |
| RS012 | Withdrawal/new login | Auth controller remains separately wired at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/auth/createAuthController.js:21-27`. |
| RS013 | Notification background/foreground | Notifications init is invoked after auth init at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:50-51`. |
| RS014 | Notification background/foreground | Notification controller factory uses app/navigation dependencies at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/notifications/createNotificationController.js:19-25`. |
| RS015 | Result keyword/share | Result controller formatting helper is imported at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/result/createResultController.js:37`. |
| RS016 | Result keyword/share | Result manager factory receives `core` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:107-144`. |

**PR Fact Evidence Ledger**

| ID | PR fact area | Citation |
|---|---|---|
| PR001 | Headless core package | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`. |
| PR002 | Headless factory | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:13-18`. |
| PR003 | Shared store | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:1-18`. |
| PR004 | Port contract | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:1-10`. |
| PR005 | Adapter assembler | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`. |
| PR006 | DOM app composition | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`. |
| PR007 | DOM event adapter | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:1-15`. |
| PR008 | DOM router adapter | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:1-19`. |
| PR009 | Toast presenter | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:1-10`. |
| PR010 | Main bootstrap rewrite | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:1-58`. |
| PR011 | Workspace package change | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:7-18`. |
| PR012 | Vite alias change | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:20-31`. |
| PR013 | JS path alias change | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/jsconfig.json:1-13`. |
| PR014 | CI frontend build | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-33`. |
| PR015 | iOS build sync | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:33-49`. |
| PR016 | Slice 6 cleanup record | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. |
| PR017 | Final review summary | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`. |
| PR018 | Final review follow-up | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:795-812`. |
| PR019 | Ignore local diff artifact | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-103`. |
| PR020 | Ignore backend local log | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:105-107`. |
| PR021 | Ignore codex reports | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:109-110`. |
| PR022 | Ignore design system copy | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:112-113`. |
| PR023 | Ignore verification docs | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:115`. |
| PR024 | Backend package separate scope | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/pyproject.toml:1-17`. |
| PR025 | Backend lock separate scope | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/uv.lock:1-12`. |

**Build, CI, And Push Artifact Evidence Ledger**

| ID | Evidence area | Citation |
|---|---|---|
| BP001 | NPM package type | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:1-6`. |
| BP002 | NPM workspace declaration | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:7-9`. |
| BP003 | NPM dev script | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:10-11`. |
| BP004 | NPM build script | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:12-13`. |
| BP005 | NPM preview script | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:14-15`. |
| BP006 | NPM cap sync script | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:16-18`. |
| BP007 | Frontend dependencies block | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:23-36`. |
| BP008 | Frontend dev dependencies block | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:37-46`. |
| BP009 | Package lock root metadata | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package-lock.json:1-14`. |
| BP010 | Vite import block | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:1-7`. |
| BP011 | Vite alias root | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:20-23`. |
| BP012 | Vite build sourcemap setting | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:25-31`. |
| BP013 | JS config compiler options | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/jsconfig.json:1-8`. |
| BP014 | JS config path alias | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/jsconfig.json:9-13`. |
| BP015 | CI workflow name and trigger | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:1-8`. |
| BP016 | CI frontend job declaration | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-18`. |
| BP017 | CI Node setup | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:19-23`. |
| BP018 | CI frontend install/build | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:24-32`. |
| BP019 | CI backend job declaration | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-40`. |
| BP020 | CI backend install | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:43-47`. |
| BP021 | CI backend smoke server | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:49-55`. |
| BP022 | CI backend smoke request | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:57-84`. |
| BP023 | iOS workflow name and trigger | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:1-7`. |
| BP024 | iOS workflow runner | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:10-17`. |
| BP025 | iOS workflow Node setup | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:18-23`. |
| BP026 | iOS workflow npm install/build | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:24-31`. |
| BP027 | iOS Capacitor sync | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:33-35`. |
| BP028 | iOS Xcode archive | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:36-49`. |
| BP029 | iOS artifact upload | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:50-77`. |
| BP030 | Capacitor webDir | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/capacitor.config.json:1-7`. |
| BP031 | Main HTML entry | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/index.html:1`. |
| BP032 | Main JS bootstrap comment | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:1-14`. |
| BP033 | Main import boundary | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:16-20`. |
| BP034 | Main boot error buffer | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:22-23`. |
| BP035 | Main root element map | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:25-39`. |
| BP036 | Main init try block | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:41-58`. |
| BP037 | Legacy daily reset line | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:44`. |
| BP038 | Core creation line | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:46-48`. |
| BP039 | Notification/auth init line | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:50-51`. |
| BP040 | Main boot catch line | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:53-58`. |
| BP041 | Core factory input comment | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:13-18`. |
| BP042 | Core store creation | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:26-31`. |
| BP043 | Core controller wiring start | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:33-44`. |
| BP044 | Core controller wiring middle | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:46-86`. |
| BP045 | Core controller wiring end | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:88-127`. |
| BP046 | Core return bundle | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:129-143`. |
| BP047 | Adapter assembler auth group | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:41-53`. |
| BP048 | Adapter assembler photo group | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:55-70`. |
| BP049 | Adapter assembler account group | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:72-85`. |
| BP050 | Adapter assembler return group | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:109-123`. |
| BP051 | DOM app import block | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:26-39`. |
| BP052 | DOM app signature | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:74-86`. |
| BP053 | DOM app eager construction | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:94-105`. |
| BP054 | DOM app lazy factories | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:107-144`. |
| BP055 | DOM app router setup | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:168-179`. |
| BP056 | DOM app auth reactor | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:181-203`. |
| BP057 | DOM app error subscriptions | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:205-206`. |
| BP058 | DOM app destroy cascade | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:208-234`. |
| BP059 | DOM events nav helper | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:17-21`. |
| BP060 | DOM router view map | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:21-30`. |
| BP061 | Toast presenter creation | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:12-24`. |
| BP062 | Native photo plugin imports | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:1-9`. |
| BP063 | Native photo plugin interface | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:35-78`. |
| BP064 | Native photo plugin registration | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:80-125`. |
| BP065 | Modal Settings removal | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/Modal.js:120-121`. |
| BP066 | Public index legacy removal | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:1-11`. |
| BP067 | Public index exports | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:13-36`. |
| BP068 | Ignore personal patch | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-103`. |
| BP069 | Ignore backend live log | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:105-107`. |
| BP070 | Ignore codex reports | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:109-110`. |
| BP071 | Ignore design system tree | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:112-113`. |
| BP072 | Ignore verification docs | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:115`. |
| BP073 | Current branch ref | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`. |
| BP074 | Current branch config | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/config:39-42`. |
| BP075 | Origin main ref | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/packed-refs:20`. |
| BP076 | Backend package metadata | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/pyproject.toml:1-17`. |
| BP077 | Backend lock metadata | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/uv.lock:1-12`. |
| BP078 | Final review critical follow-up | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:795-812`. |
| BP079 | Slice 6 addendum cleanup | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. |
| BP080 | Validation command contract | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:719-733`. |

## 12. 잔존 backend/uv.lock 처리 권고

| Artifact | Current source fact | PR relation facts |
|---|---|---|
| `backend/pyproject.toml` | Backend package is `recoco-backend` with FastAPI/uvicorn dependencies | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/pyproject.toml:1-17`; CI backend smoke installs `./backend` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:43-47`. |
| `backend/uv.lock` | Lockfile is Python/uv dependency lock | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/uv.lock:1-12`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/uv.lock:23-34`. |
| Backend runtime logs | Local logs are ignored except lockfile | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:36-45`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:105-107`. |
| Headless refactor frontend scope | Core/adapters/DOM app are frontend/headless artifacts | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:13-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`. |
| CI coupling | Backend CI exists independently of frontend build job | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-33`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`. |
| Lockfile push artifact | No `.gitignore` pattern excludes `backend/uv.lock` | Backend ignore patterns are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:36-45`; explicit local additions are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-115`. |

## 13. Recommendations (Critical/High/Medium/Low)

| Severity | Recommendation | Evidence |
|---|---|---|
| Critical | Do not push until real `git diff --check`, `npm run build`, and final diff review are executed outside this read-only audit. | Validation command is part of the instruction contract at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:719-733`; this review did not execute those commands by user constraint. |
| High | Use a dedicated `refactor/headless-core` PR branch or clean PR branch rather than pushing the mixed control branch directly. | Current branch is control-themed at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/HEAD:1`; branch config is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.git/config:39-42`; refactor artifacts are clearly bounded at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:13-18` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`. |
| High | Prefer the 3 logical commit split for reviewability: core+ports, DOM/components, cleanup/docs. | Commit option C maps to package boundaries shown at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`, and cleanup addendum `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. |
| High | Treat `backend/uv.lock` as separate PR material unless the final diff proves it is already part of intended backend CI maintenance. | Backend package and lockfile are unrelated to headless frontend refactor paths at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/pyproject.toml:1-17` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/uv.lock:1-12`; backend CI is separate at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`. |
| Medium | Include `docs/refactor/headless-core-final-review.md` and this push readiness doc as PR supporting artifacts, not runtime changes. | Final review first lines are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`; slice 6 addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. |
| Medium | In the PR body, cite the slice 5 build result and explicitly mark the post-slice-6 build as to-be-run if no newer build log is added. | Slice 5 build record is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; build command is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:10-13`. |
| Medium | Keep `.gitignore` additions, but document that `docs/verification/` hides all future verification artifacts under that path. | New ignore patterns are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-115`. |
| Low | Keep `dispatchNavChange` compatibility helper until a later cleanup PR if no emitter remains. | Slice 6 deferred it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`; helper/listener are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:19-35`. |
| Low | Keep legacy `src/services/*` while adapters still wrap those services. | `createAppPorts` imports legacy services at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`; slice 6 deferred service cleanup at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. |
