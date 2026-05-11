# Headless Core Refactor — Post-Push Review
Audit date: 2026-05-11

## 0. Executive Summary

1. PR branch identity: GO — PR #8 targets `main` from `refactor/headless-core` (`PR #8 metadata: base=main, head=refactor/headless-core`).
2. PR commit set: FAIL — GitHub PR #8 contains 37 commits, not only the 3 headless-core commits (`PR #8 commits query: length=37`).
3. Headless 3-commit internal split: GO — `3a03555`, `8ea1104`, `61b25cc` stats match the PR body's three split rows (`3a03555/8ea1104/61b25cc git show --stat`).
4. PR diff scope: FAIL — PR #8 diff includes backend/control/iOS/design/docs files outside the headless refactor (`PR #8 diff-name-only`).
5. PR description factuality: HOLD — core/component claims are mostly line-backed, but the 3-commit and build-size claims have PR-scope or local-doc mismatches (`PR #8 §Files changed`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`).
6. Validation claims: HOLD — PR body claims build/diff scans; GitHub CI build passed, but backend-smoke failed (`PR #8 statusCheckRollup`).
7. LLM Workflow Notes: HOLD — several patterns are supported by docs, while tool outage and exact universal 7-step coverage remain not independently verifiable (`PR #8 §LLM Workflow Notes`).
8. Final-review remediation: GO — H1/H2/H3 and M1-M5 are reflected in slice 6 addendum and code (`/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`).
9. Push-readiness remediation: HOLD — refactor branch and 3 logical commits exist, but PR still carries 37 commits and CI is unstable (`PR #8 metadata`, `PR #8 statusCheckRollup`).
10. Mergeability: HOLD — `mergeable=MERGEABLE`, but `mergeStateStatus=UNSTABLE` and `backend-smoke=FAILURE` (`PR #8 statusCheckRollup`).
11. PR body readability: HOLD — Summary is reviewable, but the long LLM Workflow Notes section competes with merge-critical facts (`PR #8 §LLM Workflow Notes`).
12. Post-merge queue: HOLD — deferred legacy service/global items remain documented, and unrelated backend/control artifacts are present in PR diff (`/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`, `PR #8 diff-name-only`).

Core recommendations: fix PR scope before merge, resolve the failing `backend-smoke` check or remove unrelated backend changes from this PR, and move the long LLM Workflow Notes to a PR comment or separate playbook while keeping a concise PR body.

## 1. 3 Commit 분할 정합성

| Commit | Message / claimed layer | Stat fact | File-class fact | Claim alignment fact | Co-author fact |
|---|---|---|---|---|---|
| `3a03555` | `refactor(core): add headless core package and platform ports` | 37 files, +3,631/-12 (`3a03555 git show --stat`) | Changed files are package/config, `packages/core/**`, and `src/adapters/**`; no `src/components/**` file appears in `3a03555 git show --name-only`. | `@recoco/core` private package exists at `3a03555:packages/core/package.json:1-9`; all 9 controllers are imported/wired/returned at `3a03555:packages/core/src/createRecocoCore.js:1-11` and `3a03555:packages/core/src/createRecocoCore.js:121-132`; 13 deps are named in `3a03555:packages/core/src/createRecocoCore.js:20-34`. | Author/committer is `goodand <superarraman@naver.com>` and trailer is `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` (`git log --pretty=fuller origin/main..refactor/headless-core`, commit `3a03555`). |
| `8ea1104` | `refactor(dom): route bootstrap and components through headless core` | 15 files, +1,153/-1,276 (`8ea1104 git show --stat`) | Changed files are `main.js`, 10 component files, and 4 `src/ui/dom/**` files (`8ea1104 git show --name-only`). | Thin bootstrap is in `8ea1104:main.js:16-58`; DOM adapter imports and converted component construction are in `8ea1104:src/ui/dom/createDomApp.js:26-39` and `8ea1104:src/ui/dom/createDomApp.js:94-140`. | Author/committer is `goodand <superarraman@naver.com>` and trailer is `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` (`git log --pretty=fuller origin/main..refactor/headless-core`, commit `8ea1104`). |
| `61b25cc` | `chore(refactor): remove dead legacy paths and document headless-core slices` | 20 files, +5,697/-743 (`61b25cc git show --stat`) | Changed files are `.gitignore`, 12 `docs/refactor/**` files, `src/index.js`, and deletions for 4 home runtimes, `src/services/Router.js`, `src/utils/temp_handleUrl.js` (`61b25cc git show --name-only`). | Slice 6 addendum records H/M cleanup at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`; `.gitignore` local patterns are at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-115`; `src/index.js` no longer exports `StateManager` or `SettingsModal` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:1-36`. | Author/committer is `goodand <superarraman@naver.com>` and trailer is `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` (`git log --pretty=fuller origin/main..refactor/headless-core`, commit `61b25cc`). |

| Check | Observed fact | Evidence |
|---|---|---|
| C1 cross-contamination | No component or DOM app file in C1 file list. | `3a03555 git show --name-only` lists `jsconfig.json`, `package*.json`, `vite.config.js`, `packages/core/**`, and `src/adapters/**`. |
| C2 cross-contamination | No docs/refactor file in C2 file list. | `8ea1104 git show --name-only` lists only `main.js`, converted components, and `src/ui/dom/**`. |
| C3 cross-contamination | C3 includes docs and cleanup plus deletions, not core/controller implementation. | `61b25cc git show --name-only`; slice 6 cleanup rows are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:876-884`. |
| PR-level commit count | PR #8 is not limited to the three headless commits. | `PR #8 commits query: length=37`; PR #8 commit list includes `b1b354e`, `12ca6b9`, style commits, backend/native commits, then `3a03555`, `8ea1104`, `61b25cc`. |
| PR-level file scope | PR #8 includes files outside the three headless commit file lists. | `PR #8 diff-name-only` includes `backend/app/*`, `context_portal/*`, `control/**`, `ios/App/**`, `docs/verification/verification_packet_v5.md`, and older frontend/style files. |

## 2. PR description 주장 검증

| PR section | Claim | Evidence | Verification fact |
|---|---|---|---|
| `PR #8 §Summary` | Adds `@recoco/core` private package. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`; `3a03555:packages/core/package.json:1-9`. | Package name is `@recoco/core`, `private` is `true`, and export entry is `./src/index.js`. |
| `PR #8 §Summary` | Reactive store has 9 domains. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-75`. | Initial state contains `auth`, `permissions`, `notifications`, `navigation`, `home`, `input`, `result`, `report`, `account`. |
| `PR #8 §Summary` | Core exposes 9 controllers. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:121-132`. | Return object includes `navigation`, `auth`, `permissions`, `notifications`, `home`, `input`, `result`, `report`, `account`; `store` is not a controller. |
| `PR #8 §Summary` | Core has 13 port typedef contracts. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:12-120`. | Typedefs cover Auth, Browser, App, Photo, Ai, Notification, Account, Stats, Storage, Clipboard, Share, ImageProcessor, Clock. |
| `PR #8 §Summary` | `src/adapters/` wraps platform/services into 13 port objects. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:21-53`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:74-123`. | Concrete platform/service imports are assembled and returned as 13 named ports. |
| `PR #8 §Summary` | `src/ui/dom/` contains createDomApp, domEvents, domRouterAdapter, toastPresenter. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:1-15`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domRouterAdapter.js:1-19`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/toastPresenter.js:1-10`. | Four DOM adapter files exist and match the named layer. |
| `PR #8 §Summary` | Converts 8 legacy components. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:26-35`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:8-38`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:1-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1-15`. | Eight converted views are represented by Auth, Permission, Home, MyPage, Notice, Report, Input+DropZone, Result; createDomApp also imports support modals/onboarding. |
| `PR #8 §Summary` | Removes `Router.js`, `temp_handleUrl.js`, 4 home runtimes. | `61b25cc git show --name-only`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:838-847`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:880`. | C3 delete list contains those runtime paths; slice 6 addendum records Router deletion. |
| `PR #8 §Files changed` | `refactor(core)` = 37 files +3,631/-12. | `3a03555 git show --stat`. | Stat matches. |
| `PR #8 §Files changed` | `refactor(dom)` = 15 files +1,153/-1,276. | `8ea1104 git show --stat`. | Stat matches. |
| `PR #8 §Files changed` | `chore(refactor)` = 20 files +5,697/-743. | `61b25cc git show --stat`. | Stat matches. |
| `PR #8 §Files changed` | PR is a 3-commit change. | `PR #8 commits query: length=37`; `PR #8 diff-name-only`. | PR-level metadata does not match the section's 3-commit framing; the 3 rows describe only the last three headless commits. |
| `PR #8 §Validation` | `npm run build`: 325.19 kB / gzip 87.69 kB. | `PR #8 §Validation`; local slice 5 record is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; push-readiness warned about exact build citation at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:529`. | Exact `325.19/87.69` is PR-body-only in this review; local line-cited doc has `325.28/87.63`, while CI build status is success (`PR #8 statusCheckRollup`). |
| `PR #8 §Validation` | `git diff --check`: 0. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:860`; `PR #8 §Validation`. | Slice 5 has line-cited `git diff --check` 0; PR says post-push 0 but no local line-cited post-push log exists. |
| `PR #8 §Validation` | Core purity scan is 0. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:22-24`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-11`. | Final review and current imports support the claim. |
| `PR #8 §Validation` | Component boundary scan is 0. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:24-25`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:6`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:15`. | Final review and converted imports support the claim. |
| `PR #8 §Validation` | DOM adapter boundary scan is 0. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:19-24`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:854-859`. | Current createDomApp has forbidden tokens only in constraint comments; slice 5 verification says UI/dom scan was 0 except JSDoc constraint statement. |
| `PR #8 §Validation` | Final review PASS 11/13 and 2 cleanup items closed by slice 6. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:6-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. | Final review summary has 3 FAIL lines, not a literal 11/13 PASS count; slice 6 addendum closes High/Medium items. |
| `PR #8 §Manual smoke` | Manual smoke is TBD. | `PR #8 §Manual smoke`; spec scenarios are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. | Checklist matches instruction scenario family and remains unchecked. |
| `PR #8 §Out of scope` | Backend changes are out of scope. | `PR #8 diff-name-only` includes `backend/app/config.py`, `backend/app/main.py`, `backend/app/models/schemas.py`, `backend/app/routers/*`, `backend/app/services/*`, `backend/run.py`. | PR diff contradicts a strict "backend changes out of scope" reading; `backend/uv.lock` itself is not listed in PR #8 diff-name-only. |
| `PR #8 §Out of scope` | Legacy services retained as adapter dependencies. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. | Claim is supported for services used by adapters. |
| `PR #8 §Out of scope` | Native plugin interface preserved. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:35-78`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:80-125`. | Plugin interface and registration remain. |

## 3. LLM Workflow Notes 사실 검증

| Note item | PR claim | Evidence | Fact result |
|---|---|---|---|
| 1.1 | Korean path NFC/NFD mismatch caused edit failures. | `PR #8 §LLM Workflow Notes 1.1`; user packet repeatedly required Korean path NFC preservation; push-readiness cites branch paths with Korean absolute path at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-3`. | FACT NOT VERIFIABLE from repo artifacts alone; no local error log line for `string not found in file` was found in the cited docs. |
| 1.2 | Boundary scan false positives from JSDoc forbidden tokens. | `PR #8 §LLM Workflow Notes 1.2`; final review records a comment-only `ShareService` hit at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:6`; createDomApp still has constraint comment tokens at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:19-24`. | Supported as a documented scan-noise pattern. |
| 1.3 | Scan regex drift from `@supabase` vs `supabase`. | `PR #8 §LLM Workflow Notes 1.3`; instruction validation uses unscoped `supabase` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:721-739`; component conversion rules list `../services/supabase.js` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:640-653`. | Supported by later docs using corrected unscoped pattern; exact "5a 16 vs 13" count is FACT NOT VERIFIABLE from the retained docs. |
| 1.4 | Cross-controller direct call was a recurring risk. | `PR #8 §LLM Workflow Notes 1.4`; final review summary records cross-controller PASS at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:11`; createRecocoCore wires controllers independently at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:42-119`. | Supported by decision/evidence docs. |
| 1.5 | Store reference vs clone consistency risk. | `PR #8 §LLM Workflow Notes 1.5`; store contract states `getState()` deep clones and arrays replace at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:4-18`; home slice risk appears in slice mapping at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:777-786`. | Supported as a documented risk and mitigation family. |
| 1.6 | Vite warning from dynamic + static `ShareService` import was removed. | `PR #8 §LLM Workflow Notes 1.6`; slice 5 records ShareService warning eliminated at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:829-835` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:859`. | Supported. |
| 1.7 | Slice 5 scope expanded and was split 5a-5e. | `PR #8 §LLM Workflow Notes 1.7`; slice 5 decision log and sub-slice plan are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-810`. | Supported. |
| 1.8 | Large mapping docs required offset/limit reads. | `PR #8 §LLM Workflow Notes 1.8`; final review is 812 lines at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18` and push-readiness is 532 lines at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`. | Document sizes are supported; exact tool error text is FACT NOT VERIFIABLE from repo artifacts. |
| 1.9 | Bash tool was temporarily unavailable. | `PR #8 §LLM Workflow Notes 1.9`. | FACT NOT VERIFIABLE from repository artifacts; no retained local log or doc line proves the transient model/tool outage. |
| 1.10 | Decision deadlock solved by "Decisions To Surface" without external-agent decisions. | `PR #8 §LLM Workflow Notes 1.10`; slice 5 decision table is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-799`; slice 4 mapping has decision log references in main comments at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:5-14`. | Supported as a documented workflow pattern. |

| 7-step task flow item | PR claim | Evidence | Fact result |
|---|---|---|---|
| Step 1 | Packet 작성 → external analysis. | The retained mapping docs exist for slice 2/3/4/5 at `61b25cc git show --name-only`; instruction header is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:1-19`. | Supported generally; not every individual packet exchange is retained as line evidence. |
| Step 2 | Mapping doc 통독 + §0 Decisions. | Slice 5 decisions are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-799`; slice 6 addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. | Supported for retained docs. |
| Step 3 | Decision log append. | Slice 5 decision log at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-799`; addendum at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. | Supported for slice 5/6; not line-verified for every earlier slice in this post-push review. |
| Step 4 | Implementation via write/edit/delete. | Commit split shows C1 implementation, C2 DOM/component implementation, C3 cleanup/docs (`3a03555`, `8ea1104`, `61b25cc git show --stat`). | Supported by commit objects. |
| Step 5 | Build, scans, diff-check. | Instruction validation loop is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:719-746`; slice 5 verification is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; PR #8 §Validation claims post-push checks. | Supported for slice 5 and PR claims; exact post-slice-6 build size remains PR-body-only. |
| Step 6 | JSDoc token cleanup after scan false positives. | `PR #8 §LLM Workflow Notes 1.2`; final review notes comment-only hit at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:6`; createDomApp constraint comment remains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:19-24`. | Supported as a recurring pattern, not fully line-verified for every sub-slice. |
| Step 7 | Sub-slice termination report. | Slice 5 sub-slice execution notes are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:811-847`; final slice verification is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-868`. | Supported for slice 5. |

| Methodology item | PR claim | Evidence | Fact result |
|---|---|---|---|
| Decision To Surface | External agent surfaces options/facts; main agent decides. | Slice 5 decision table is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-799`. | Supported. |
| Sub-slice risk ordering | Low-risk read flows before Home/Permission. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:801-810`. | Supported. |
| Instruction-doc patch | Clipboard fallback rule patched. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:679-699`; slice 6 H3 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:878`. | Supported. |
| Final review + push readiness separated | Two docs exist and are separately scoped. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`. | Supported. |
| Absolute path line citations | Docs use absolute path:line citation style. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:22-25`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:522-532`. | Supported. |
| Commit split | Three logical headless commits exist. | `3a03555`, `8ea1104`, `61b25cc git show --stat`. | Supported for headless commits; PR-level commit list contains 37 commits. |

## 4. Final review §13 처리 상태

| ID | Severity | Recommendation / finding | Status | Evidence |
|---|---|---|---|---|
| C0 | Critical | No critical cross-controller/destructive multi-fire regression found; keep smoke/counters. | STILL RUNTIME-TBD | Final review row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:797-799`; PR manual smoke remains unchecked in `PR #8 §Manual smoke`. |
| H1 | High | `createDomApp.destroy()` cascade. | RESOLVED IN COMMIT `8ea1104` / documented in `61b25cc` | Code cascade is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:208-234`; slice 6 addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:876`. |
| H2 | High | `window.__bootErrors` scope. | RESOLVED IN COMMIT `8ea1104` / documented in `61b25cc` | `main.js` owns the window binding at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:22-23`; `createDomApp` accepts injected `bootErrors` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:52-65`; addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:877`. |
| H3 | High | Clipboard fallback doc drift. | RESOLVED IN COMMIT `61b25cc` with adapter code already present | Instruction line now assigns fallback to adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:679-699`; adapter implements it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/clipboard/clipboardPort.js:1-60`; addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:878`. |
| M1 | Medium | Hybrid reactors vs createDomApp domain reactors. | DOCUMENTED AS ACCEPTED HYBRID IN `61b25cc` | Addendum row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:879`; auth/toast reactors are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:181-206`; component subscriptions exist at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:33-51`. |
| M2 | Medium | Delete unused `src/services/Router.js`. | RESOLVED IN COMMIT `61b25cc` | `61b25cc git show --name-only` lists `src/services/Router.js`; addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:880`. |
| M3 | Medium | Remove public `StateManager` / `store` export. | RESOLVED IN COMMIT `61b25cc` | `src/index.js` cleanup comment is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:1-11`; exports omit StateManager/store at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:13-36`; addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:881`. |
| M4 | Medium | Remove unused `SettingsModal`. | RESOLVED IN COMMIT `8ea1104` / documented in `61b25cc` | Modal comment is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/Modal.js:120-121`; createDomApp imports only Suggestion/Confirm from Modal at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:26-35`; addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:882`. |
| M5 | Medium | Expand toast subscription beyond auth/notifications. | RESOLVED IN COMMIT `8ea1104` / documented in `61b25cc` | `TOAST_DOMAINS` covers eight error-bearing domains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:41-50`; subscription line is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:205-206`; addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:883`. |
| L1 | Low | Keep/remove `dispatchNavChange`. | DEFERRED — slice 6 addendum | Helper remains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:19-35`; deferral is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. |
| L2 | Low | Legacy `src/index.js` non-state exports. | DEFERRED — slice 6 addendum | Non-state exports remain at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:21-36`; deferral is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. |
| L3 | Low | Supabase global singleton in service layer. | DEFERRED — adapter-internal | Final review row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:808-811`; adapter imports `supabase` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26`. |
| L4 | Low | Legacy services remain. | DEFERRED — adapter dependencies | Adapter service imports are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`; final review row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:811`. |
| L5 | Low | Read-only review did not run build/smoke. | PARTIALLY ADDRESSED BY PR CLAIM + CI BUILD; SMOKE TBD | Final review row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:812`; CI build success is in `PR #8 statusCheckRollup`; manual smoke remains TBD in `PR #8 §Manual smoke`. |

## 5. Push-readiness §13 처리 상태

| ID | Severity | Recommendation | Status | Evidence |
|---|---|---|---|---|
| P0 | Critical | Run real `git diff --check`, `npm run build`, final diff review before push. | PARTIAL | PR body claims build + diff-check at `PR #8 §Validation`; GitHub build check passed in `PR #8 statusCheckRollup`; backend-smoke failed in `PR #8 statusCheckRollup`; original recommendation is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:522-524`. |
| P1 | High | Use dedicated `refactor/headless-core` branch. | PARTIAL | PR head is `refactor/headless-core` in `PR #8 metadata`; PR commit list still has 37 commits in `PR #8 commits query: length=37`; original recommendation is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:525`. |
| P2 | High | Prefer 3 logical commit split. | PARTIAL | Headless commits exist as `3a03555`, `8ea1104`, `61b25cc`; PR #8 contains 37 commits by metadata; original recommendation is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:526`. |
| P3 | High | Treat `backend/uv.lock` as separate PR material. | PARTIAL | `backend/uv.lock` is absent from `PR #8 diff-name-only`; backend source files are present in `PR #8 diff-name-only`; original recommendation is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:527`. |
| P4 | Medium | Include final review and push-readiness docs as supporting artifacts. | ADDRESSED | Docs are included in C3 stat and file list (`61b25cc git show --stat`); original recommendation is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:528`. |
| P5 | Medium | Mark exact post-slice-6 build log if no newer line-cited log exists. | PARTIAL | PR body gives exact `325.19/87.69` at `PR #8 §Validation`; local line-cited doc has slice 5 `325.28/87.63` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; original recommendation is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:529`. |
| P6 | Medium | Document `docs/verification/` ignore impact. | PARTIAL | `.gitignore` ignores `docs/verification/` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:114-115`; PR diff includes `docs/verification/verification_packet_v5.md` in `PR #8 diff-name-only`; original recommendation is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:530`. |
| P7 | Low | Keep `dispatchNavChange` compat helper. | ADDRESSED AS DEFERRED | Helper remains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:19-35`; push-readiness row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:531`; slice 6 deferral is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. |
| P8 | Low | Keep legacy `src/services/*` while adapters wrap them. | ADDRESSED AS DEFERRED | Adapter imports legacy services at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`; push-readiness row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:532`; slice 6 deferral is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. |

## 6. PR Mergeability + CI Status

| Field | Observed value | Evidence |
|---|---|---|
| Base ref | `main` | `PR #8 metadata: base=main`. |
| Head ref | `refactor/headless-core` | `PR #8 metadata: head=refactor/headless-core`. |
| Additions / deletions | `+18,029 / -2,549` | `PR #8 metadata: additions=18029, deletions=2549`. |
| Commit count | 37 | `PR #8 commits query: length=37`. |
| Mergeable | `MERGEABLE` | `PR #8 metadata: mergeable=MERGEABLE`. |
| Merge state | `UNSTABLE` | `PR #8 metadata: mergeStateStatus=UNSTABLE`. |
| Review decision | empty / no approving state returned | `PR #8 metadata: reviewDecision=""`. |
| CI build check | `CI / build` completed SUCCESS | `PR #8 statusCheckRollup`; workflow runs `npm ci` and `npm run build` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:19-32`. |
| CI backend-smoke check | `CI / backend-smoke` completed FAILURE | `PR #8 statusCheckRollup`; backend smoke installs and runs backend at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`. |
| iOS workflow in PR rollup | Not present in returned `statusCheckRollup` | `PR #8 statusCheckRollup`; iOS workflow triggers on `push` to `main` and `workflow_dispatch`, not PR, at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:1-7`. |

## 7. 잔여 회귀 위험

| Risk area | Observed fact | Evidence |
|---|---|---|
| PR scope contamination | PR #8 contains 37 commits and non-headless files. | `PR #8 commits query: length=37`; `PR #8 diff-name-only` includes backend/control/context_portal/iOS/design files. |
| Backend CI coupling | Failing check is `backend-smoke`, not frontend build. | `PR #8 statusCheckRollup`; backend-smoke workflow lines are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`. |
| Build-size claim drift | PR body's `325.19/87.69` does not match local slice 5 line `325.28/87.63`. | `PR #8 §Validation`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:529`. |
| Ignored verification path with tracked diff | `.gitignore` hides future `docs/verification/`, but PR diff includes a verification packet. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:114-115`; `PR #8 diff-name-only` includes `docs/verification/verification_packet_v5.md`. |
| Native/iOS unvalidated on PR | iOS workflow is not a PR check. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:1-7`; PR #8 status rollup contains only CI build and backend-smoke (`PR #8 statusCheckRollup`). |
| Manual smoke open | PR body keeps smoke TBD. | `PR #8 §Manual smoke`; acceptance scenarios are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. |
| Legacy service debt | Legacy services remain adapter dependencies. | `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`; `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. |
| PR review focus dilution | The PR body frames 3 headless commits while diff includes older history. | `PR #8 §Files changed`; `PR #8 commits query: length=37`; `PR #8 diff-name-only`. |

## 8. 중간 commit 빌드 가능성

| Commit state | Static build inputs | Static build prediction fact | Evidence |
|---|---|---|---|
| After `3a03555` only | Adds workspace, alias, core package, adapters; old UI still exists. | Build likely does not import adapters unless old app references them; no component rewrite is present in C1 file list. | `3a03555 git show --name-only`; workspace is `3a03555:package.json` via current `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:7-18`; alias is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:20-31`. |
| After `8ea1104` on top of C1 | New main imports createAppPorts, core, createDomApp; UI/dom files are present; components converted; old Router/runtimes not yet deleted. | Static dependency graph for main can resolve because C1 introduced `@recoco/core` and adapters, and C2 adds `src/ui/dom/**`. | `8ea1104:main.js:16-58`; `8ea1104:src/ui/dom/createDomApp.js:26-39`; `8ea1104 git show --name-only`. |
| After `61b25cc` final | Deletes unused Router/temp/home runtimes and adds docs/.gitignore cleanup. | Static frontend build has GitHub CI success, while backend-smoke fails separately. | `61b25cc git show --name-only`; PR #8 `CI / build` SUCCESS and `CI / backend-smoke` FAILURE in `PR #8 statusCheckRollup`. |
| PR branch as a whole | Includes 37 commits, not only 3 final commits. | Commit-by-commit buildability of old pre-headless commits is outside the 3-headless-commit analysis and is not established by the PR status rollup. | `PR #8 commits query: length=37`; `PR #8 statusCheckRollup`. |

## 9. PR body 가독성 + 구조

| Body region | Observed structure | Evidence |
|---|---|---|
| Summary | Five bullets cover package, adapters, DOM adapter, components, deletions. | `PR #8 §Summary`; matching code facts are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`, `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`, and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`. |
| Slice history | Table maps six slices to docs. | `PR #8 §Slice history`; docs are included in C3 at `61b25cc git show --stat`. |
| Files changed | Three commit rows are readable but omit PR-level 37-commit reality. | `PR #8 §Files changed`; `PR #8 commits query: length=37`. |
| Validation | Lists build/diff/scans/final-review/push-readiness. | `PR #8 §Validation`; validation loop is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:719-746`. |
| Manual smoke | Checkbox list is explicit and TBD. | `PR #8 §Manual smoke`; smoke source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. |
| Out of scope | Lists backend/native/legacy service boundaries. | `PR #8 §Out of scope`; PR diff includes backend files in `PR #8 diff-name-only`. |
| LLM Workflow Notes | Long retrospective section with 10 issues, 7-step flow, 5 methodology items. | `PR #8 §LLM Workflow Notes`. |
| First-30-second facts | Title, Summary, Slice history, Files changed, Validation appear before the retrospective. | `PR #8 §Summary` through `PR #8 §Validation`. |
| Reviewer-load fact | Body includes both merge-critical validation and process retrospective in one PR description. | `PR #8 §Validation`; `PR #8 §LLM Workflow Notes`. |

## 10. Post-merge 후속 작업 큐

| Queue item | Source fact | Current PR fact |
|---|---|---|
| Backend artifact separation | Push-readiness marked backend/uv.lock separate at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:527`. | `backend/uv.lock` absent from PR #8 diff-name-only, but backend source files are present in PR #8 diff-name-only. |
| Manual web/iOS smoke evidence | PR body keeps smoke TBD at `PR #8 §Manual smoke`; spec scenarios are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. | CI build passes; no manual smoke result is in PR #8 body. |
| Deferred `dispatchNavChange` cleanup | Deferred in slice 6 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`. | Helper remains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:19-35`. |
| Deferred `window.supabaseInstance` cleanup | Final review low row cites Supabase global at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:810`. | Adapter imports `supabase` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26`. |
| Deferred legacy services cleanup | Slice 6 deferral is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`; final review low row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:811`. | Legacy services are adapter dependencies at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`. |
| Docs consolidation | C3 adds 12 docs/refactor files. | C3 stat lists docs at `61b25cc git show --stat`; `docs/refactor/headless-core-final-review.md` and push-readiness exist at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`. |
| PR-scope cleanup | PR #8 diff includes control/context_portal/backend/iOS/design files. | `PR #8 diff-name-only`. |

## 11. LLM Workflow Notes 일반화 가치

| Pattern | Narrative-ai-specific evidence | General-pattern evidence | Fact classification |
|---|---|---|---|
| Korean path NFC/NFD | Repo path and user packets use Korean absolute paths; push-readiness file path line is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-3`. | `PR #8 §LLM Workflow Notes 1.1`. | Narrative-specific trigger, generalizable path-normalization category. |
| Boundary scan false positives | createDomApp constraint comments contain forbidden words at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:19-24`; final review notes comment-only hit at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:6`. | `PR #8 §LLM Workflow Notes 1.2`. | General static-scan hygiene pattern. |
| Regex drift | Instruction validation uses unscoped `supabase` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:721-739`. | `PR #8 §LLM Workflow Notes 1.3`. | General verifier-pattern drift. |
| Cross-controller boundary | Core factory wires independent controllers at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:42-119`. | `PR #8 §LLM Workflow Notes 1.4`. | General architecture-boundary pattern. |
| Store clone/reference risk | Store clone/deep-merge contract is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:4-18`. | `PR #8 §LLM Workflow Notes 1.5`. | General mutable-state migration pattern. |
| Vite static/dynamic import warning | ShareService warning resolved in `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:829-835`. | `PR #8 §LLM Workflow Notes 1.6`. | Toolchain-specific but repo-portable pattern. |
| Sub-slice split | Slice plan is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:801-810`. | `PR #8 §LLM Workflow Notes 1.7`. | General large-refactor governance pattern. |
| Mapping doc token limits | Large docs exist at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`. | `PR #8 §LLM Workflow Notes 1.8`. | General context-management pattern; exact tool error not retained. |
| Tool outage | No retained repo artifact. | `PR #8 §LLM Workflow Notes 1.9`. | FACT NOT VERIFIABLE, but category is operationally general. |
| Decision separation | Decision log is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-799`. | `PR #8 §LLM Workflow Notes 1.10`. | General human/agent responsibility-boundary pattern. |

## 12. Cross-doc consistency

| Topic | Final review fact | Push-readiness fact | PR body fact | Consistency fact |
|---|---|---|---|---|
| Core architecture | PASS summary for controllers/ports at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:9-11`. | Artifact scope GO at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:6`. | `PR #8 §Summary`. | Consistent for core/adapters/DOM claim. |
| Cleanup H/M items | Final review H/M rows are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:800-807`. | Slice 6 addendum referenced at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:528`. | `PR #8 §Slice history` slice 6. | Consistent with slice 6 addendum `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`. |
| Build record | Final review predicted build only at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:17-18`. | Push-readiness says exact post-slice-6 build log should be marked if missing at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:529`. | `PR #8 §Validation` gives `325.19/87.69`. | PR body adds a value not found in local line-cited docs reviewed here. |
| PR branch | Push-readiness recommended dedicated refactor branch at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:525`. | Same row cites current old branch as control-themed. | PR #8 metadata says head=`refactor/headless-core`. | Branch name consistency is addressed, but PR commit ancestry still contains 37 commits. |
| Commit split | Push-readiness recommended 3 logical commits at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:526`. | Three headless commits exist: `3a03555`, `8ea1104`, `61b25cc`. | `PR #8 §Files changed` says 3 commits. | Headless split is consistent; PR-level commit count is inconsistent (`PR #8 commits query: length=37`). |
| Backend separation | Push-readiness high row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:527`. | PR body out-of-scope says backend changes excluded. | `PR #8 §Out of scope`; `PR #8 diff-name-only` includes backend source files. | `backend/uv.lock` exclusion is consistent; broader backend diff scope is inconsistent. |
| Manual smoke | Final review low row says smoke not executed at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:812`. | Push-readiness asks smoke before push at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:524`. | PR body marks manual smoke TBD. | Consistent that smoke is still open. |
| CI status | Push-readiness predicted CI build readiness at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:10`. | Workflow build job is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-32`. | PR #8 statusCheckRollup shows build SUCCESS and backend-smoke FAILURE. | Frontend build consistency holds; backend-smoke introduces merge-state instability. |

**Expanded PR Diff Scope Ledger**

- DIFF001: `.gitignore` is in PR #8 diff-name-only; headless cleanup also changes `.gitignore` in `61b25cc git show --name-only`.
- DIFF002: `.maestro/flows/ios/onboarding-auth-smoke.yaml` is in PR #8 diff-name-only.
- DIFF003: `SKILLS_ANALYSIS_ISSUES.md` is in PR #8 diff-name-only.
- DIFF004: `backend/app/config.py` is in PR #8 diff-name-only.
- DIFF005: `backend/app/main.py` is in PR #8 diff-name-only.
- DIFF006: `backend/app/models/schemas.py` is in PR #8 diff-name-only.
- DIFF007: `backend/app/routers/geo.py` is in PR #8 diff-name-only.
- DIFF008: `backend/app/routers/narrative.py` is in PR #8 diff-name-only.
- DIFF009: `backend/app/services/gemini.py` is in PR #8 diff-name-only.
- DIFF010: `backend/app/services/geocoding.py` is in PR #8 diff-name-only.
- DIFF011: `backend/run.py` is in PR #8 diff-name-only.
- DIFF012: `context_portal/alembic.ini` is in PR #8 diff-name-only.
- DIFF013: `context_portal/alembic/__pycache__/env.cpython-312.pyc` is in PR #8 diff-name-only.
- DIFF014: `context_portal/alembic/env.py` is in PR #8 diff-name-only.
- DIFF015: `context_portal/alembic/versions/2025_06_17_initial_schema.py` is in PR #8 diff-name-only.
- DIFF016: `context_portal/alembic/versions/__pycache__/2025_06_17_initial_schema.cpython-312.pyc` is in PR #8 diff-name-only.
- DIFF017: `context_portal/context.db` is in PR #8 diff-name-only.
- DIFF018: `control/README.md` is in PR #8 diff-name-only.
- DIFF019: `control/project_agent_ops/registry/README.md` is in PR #8 diff-name-only.
- DIFF020: `control/project_agent_ops/registry/runtime/README.md` is in PR #8 diff-name-only.
- DIFF021: `control/project_agent_ops/registry/tools/my-image-parser-tool-list-verified.json` is in PR #8 diff-name-only.
- DIFF022: `control/project_agent_ops/registry/tools/workspace-available-skills.json` is in PR #8 diff-name-only.
- DIFF023: `control/project_agent_ops/registry/tools/workspace-available-tools.json` is in PR #8 diff-name-only.
- DIFF024: `control/project_agent_ops/resources/codebase_graph` is in PR #8 diff-name-only.
- DIFF025: `control/project_agent_ops/resources/contracts` is in PR #8 diff-name-only.
- DIFF026: `control/project_agent_ops/resources/evidence/feedback/gemini/gemini_feedback.md` is in PR #8 diff-name-only.
- DIFF027: `control/project_agent_ops/resources/evidence/reports/control-commit-readiness-report.md` is in PR #8 diff-name-only.
- DIFF028: `control/project_agent_ops/resources/evidence/reports/main-worktree-verification-for-caption-optimization.md` is in PR #8 diff-name-only.
- DIFF029: `control/project_agent_ops/resources/experiment_plans` is in PR #8 diff-name-only.
- DIFF030: `control/project_agent_ops/resources/feedback` is in PR #8 diff-name-only.
- DIFF031: `control/project_agent_ops/resources/handoffs` is in PR #8 diff-name-only.
- DIFF032: `control/project_agent_ops/resources/manifests` is in PR #8 diff-name-only.
- DIFF033: `control/project_agent_ops/resources/material/task_packets/issued/2026-04-01-16-58_caption-optimization-implementation-packet.md` is in PR #8 diff-name-only.
- DIFF034: `control/project_agent_ops/resources/reference/references/2026-04-01-16-58_caption-optimization-branch-worktree-procedure.md` is in PR #8 diff-name-only.
- DIFF035: `control/project_agent_ops/resources/reference/references/2026-04-01-16-58_caption-optimization-pr-scope-checklist.md` is in PR #8 diff-name-only.
- DIFF036: `control/project_agent_ops/resources/reference/references/2026-04-01_codebase-structure-restructure-rfc.md` is in PR #8 diff-name-only.
- DIFF037: `control/project_agent_ops/resources/reference/references/maestro.md` is in PR #8 diff-name-only.
- DIFF038: `control/project_agent_ops/resources/reference/skill_candidates/repeated_issues/2026-04-13_capacitor_is_native_bug.md` is in PR #8 diff-name-only.
- DIFF039: `control/project_agent_ops/resources/reference/skill_candidates/repeated_issues/2026-04-13_xcode_build_environment.md` is in PR #8 diff-name-only.
- DIFF040: `control/project_agent_ops/resources/reference/skill_candidates/repeated_tasks/2026-04-13_capacitor_web_degradation.md` is in PR #8 diff-name-only.
- DIFF041: `control/project_agent_ops/resources/reference/skill_candidates/repeated_tasks/2026-04-13_local_dev_setup.md` is in PR #8 diff-name-only.
- DIFF042: `control/project_agent_ops/resources/reference/tools_inventory/2026-04-01-17-48_caption-optimization-tool-and-xcode-strategy.md` is in PR #8 diff-name-only.
- DIFF043: `control/project_agent_ops/resources/references` is in PR #8 diff-name-only.
- DIFF044: `control/project_agent_ops/resources/reports` is in PR #8 diff-name-only.
- DIFF045: `control/project_agent_ops/resources/skill_candidates` is in PR #8 diff-name-only.
- DIFF046: `control/project_agent_ops/resources/smoke` is in PR #8 diff-name-only.
- DIFF047: `control/project_agent_ops/resources/task_packets` is in PR #8 diff-name-only.
- DIFF048: `control/project_agent_ops/resources/tools_inventory` is in PR #8 diff-name-only.
- DIFF049: `control/project_agent_ops/resources/troubleshooting` is in PR #8 diff-name-only.
- DIFF050: `control/project_domain/registry/README.md` is in PR #8 diff-name-only.
- DIFF051: `control/project_domain/resources/assets` is in PR #8 diff-name-only.
- DIFF052: `control/project_domain/resources/checklists` is in PR #8 diff-name-only.
- DIFF053: `control/project_domain/resources/context_packages` is in PR #8 diff-name-only.
- DIFF054: `control/project_domain/resources/cross_validation` is in PR #8 diff-name-only.
- DIFF055: `control/project_domain/resources/experiment_plans` is in PR #8 diff-name-only.
- DIFF056: `control/project_domain/resources/knowledge_bases` is in PR #8 diff-name-only.
- DIFF057: `control/project_domain/resources/legacy` is in PR #8 diff-name-only.
- DIFF058: `control/project_domain/resources/manifests` is in PR #8 diff-name-only.
- DIFF059: `control/project_domain/resources/master_plans` is in PR #8 diff-name-only.
- DIFF060: `control/project_domain/resources/reference/checklists/demo-checklist.md` is in PR #8 diff-name-only.
- DIFF061: `control/project_domain/resources/reference/checklists/github-readiness-checklist.md` is in PR #8 diff-name-only.
- DIFF062: `control/project_domain/resources/reference/checklists/release-checklist.md` is in PR #8 diff-name-only.
- DIFF063: `control/project_domain/resources/reference/experiment_plans/worktree-experiment-plan.md` is in PR #8 diff-name-only.
- DIFF064: `control/project_domain/resources/references` is in PR #8 diff-name-only.
- DIFF065: `control/project_domain/resources/reports` is in PR #8 diff-name-only.
- DIFF066: `control/project_domain/resources/smoke` is in PR #8 diff-name-only.
- DIFF067: `control/project_domain/resources/specs` is in PR #8 diff-name-only.
- DIFF068: `control/project_domain/resources/wiki` is in PR #8 diff-name-only.
- DIFF069: `control/team/registry/README.md` is in PR #8 diff-name-only.
- DIFF070: `control/team/registry/control-plane-path-map.json` is in PR #8 diff-name-only.
- DIFF071: `control/team/resources/evidence/migration/2026-04-01-18-02_gemini-control-surface-root-revert.md` is in PR #8 diff-name-only.
- DIFF072: `control/team/resources/evidence/migration/2026-04-01-18-06_plans-and-docs-control-migration.md` is in PR #8 diff-name-only.
- DIFF073: `control/team/resources/evidence/migration/2026-04-01-18-08_resources-secondary-kind-restructure.md` is in PR #8 diff-name-only.
- DIFF074: `control/team/resources/evidence/migration/2026-04-01-18-13_gemini-control-surface-relocation.md` is in PR #8 diff-name-only.
- DIFF075: `control/team/resources/external_repos` is in PR #8 diff-name-only.
- DIFF076: `control/team/resources/metrics` is in PR #8 diff-name-only.
- DIFF077: `control/team/resources/migration` is in PR #8 diff-name-only.
- DIFF078: `control/team/resources/reference/rules/RULES_control_legacy_entry_surfaces.md` is in PR #8 diff-name-only.
- DIFF079: `control/team/resources/reference/rules/RULES_registry_runtime_semantics.md` is in PR #8 diff-name-only.
- DIFF080: `control/team/resources/reports` is in PR #8 diff-name-only.
- DIFF081: `control/team/resources/rules` is in PR #8 diff-name-only.
- DIFF082: `control/team/resources/templates` is in PR #8 diff-name-only.
- DIFF083: `control/team/resources/vendor_skills` is in PR #8 diff-name-only.
- DIFF084: `control/user_decisions/registry/README.md` is in PR #8 diff-name-only.
- DIFF085: `control/user_decisions/resources/adr` is in PR #8 diff-name-only.
- DIFF086: `control/user_decisions/resources/assets` is in PR #8 diff-name-only.
- DIFF087: `control/user_decisions/resources/closed_questions` is in PR #8 diff-name-only.
- DIFF088: `control/user_decisions/resources/notes` is in PR #8 diff-name-only.
- DIFF089: `control/user_decisions/resources/reports` is in PR #8 diff-name-only.
- DIFF090: `docs/HANDOFF.md` is in PR #8 diff-name-only.
- DIFF091: `docs/demo-checklist.md` is in PR #8 diff-name-only.
- DIFF092: `docs/github-readiness-checklist.md` is in PR #8 diff-name-only.
- DIFF093: `docs/perf/worktree-experiment-plan.md` is in PR #8 diff-name-only.
- DIFF094: `docs/refactor/headless-core-agent-instructions.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF095: `docs/refactor/headless-core-final-review.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF096: `docs/refactor/headless-core-push-readiness.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF097: `docs/refactor/instruction-doc-consistency-audit.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF098: `docs/refactor/slice-2-adapter-mapping.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF099: `docs/refactor/slice-3-controller-mapping.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF100: `docs/refactor/slice-3b-controller-mapping.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF101: `docs/refactor/slice-3c1-controller-mapping.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF102: `docs/refactor/slice-3c2-controller-mapping.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF103: `docs/refactor/slice-3c3-controller-mapping.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF104: `docs/refactor/slice-4-integration-mapping.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF105: `docs/refactor/slice-5-component-mapping.md` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF106: `docs/release-checklist.md` is in PR #8 diff-name-only.
- DIFF107: `docs/testing/maestro.md` is in PR #8 diff-name-only.
- DIFF108: `docs/verification/verification_packet_v5.md` is in PR #8 diff-name-only while future `docs/verification/` is ignored at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:114-115`.
- DIFF109: `index.html` is in PR #8 diff-name-only.
- DIFF110: `ios/App/App.xcodeproj/project.pbxproj` is in PR #8 diff-name-only.
- DIFF111: `ios/App/App/Info.plist` is in PR #8 diff-name-only.
- DIFF112: `ios/App/App/Plugins/RecocolPhotosPlugin/MetadataExtractor.swift` is in PR #8 diff-name-only.
- DIFF113: `ios/App/App/Plugins/RecocolPhotosPlugin/PhotoAssetManager.swift` is in PR #8 diff-name-only.
- DIFF114: `ios/App/App/Plugins/RecocolPhotosPlugin/RecocolPhotosPlugin.m` is in PR #8 diff-name-only.
- DIFF115: `ios/App/App/Plugins/RecocolPhotosPlugin/RecocolPhotosPlugin.swift` is in PR #8 diff-name-only.
- DIFF116: `jsconfig.json` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF117: `main.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF118: `package-lock.json` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF119: `package.json` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF120: `packages/core/package.json` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF121: `packages/core/src/account/createAccountController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF122: `packages/core/src/auth/createAuthController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF123: `packages/core/src/contracts/ports.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF124: `packages/core/src/createRecocoCore.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF125: `packages/core/src/errors/normalizeError.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF126: `packages/core/src/home/analyzeCurationReasons.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF127: `packages/core/src/home/createHomeController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF128: `packages/core/src/home/createHomeViewModel.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF129: `packages/core/src/index.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF130: `packages/core/src/input/createInputController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF131: `packages/core/src/navigation/createNavigationController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF132: `packages/core/src/notifications/createNotificationController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF133: `packages/core/src/permissions/createPermissionController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF134: `packages/core/src/report/aggregateReportStats.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF135: `packages/core/src/report/createReportController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF136: `packages/core/src/result/createResultController.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF137: `packages/core/src/result/formatCaption.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF138: `packages/core/src/state/createStore.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF139: `public/privacy_policy.html` is in PR #8 diff-name-only.
- DIFF140: `public/terms_of_service.html` is in PR #8 diff-name-only.
- DIFF141: `src/adapters/account/accountApiPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF142: `src/adapters/ai/geminiAiPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF143: `src/adapters/auth/capacitorAppPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF144: `src/adapters/auth/capacitorBrowserPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF145: `src/adapters/auth/supabaseAuthPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF146: `src/adapters/clipboard/clipboardPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF147: `src/adapters/createAppPorts.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF148: `src/adapters/image/imageProcessorPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF149: `src/adapters/notifications/capacitorNotificationPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF150: `src/adapters/photos/photoPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF151: `src/adapters/share/sharePort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF152: `src/adapters/stats/statsPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF153: `src/adapters/storage/browserStoragePort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF154: `src/adapters/time/systemClockPort.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.
- DIFF155: `src/components/AuthModal.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF156: `src/components/DropZone.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF157: `src/components/HomeManager.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF158: `src/components/InputManager.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF159: `src/components/Modal.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF160: `src/components/MyPageManager.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF161: `src/components/NoticeManager.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF162: `src/components/OnboardingModal.js` is in PR #8 diff-name-only.
- DIFF163: `src/components/PermissionModal.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF164: `src/components/ReportManager.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF165: `src/components/ResultViewer.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF166: `src/constants/env.js` is in PR #8 diff-name-only.
- DIFF167: `src/index.js` is in PR #8 diff-name-only and in `61b25cc git show --name-only`.
- DIFF168: `src/plugins/RecocolPhotos.ts` is in PR #8 diff-name-only.
- DIFF169: `src/services/GeminiService.js` is in PR #8 diff-name-only.
- DIFF170: `src/services/PhotoService.js` is in PR #8 diff-name-only.
- DIFF171: `src/services/Router.js` is in PR #8 diff-name-only and in `61b25cc git show --name-only` as a deleted path.
- DIFF172: `src/services/photo/dailyCurationRuntime.js` is in PR #8 diff-name-only.
- DIFF173: `src/services/photo/detailHydrator.js` is in PR #8 diff-name-only.
- DIFF174: `src/services/photo/legacyRankingRuntime.js` is in PR #8 diff-name-only.
- DIFF175: `src/services/photo/mutationRuntime.js` is in PR #8 diff-name-only.
- DIFF176: `src/ui/dom/createDomApp.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF177: `src/ui/dom/domEvents.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF178: `src/ui/dom/domRouterAdapter.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF179: `src/ui/dom/toastPresenter.js` is in PR #8 diff-name-only and in `8ea1104 git show --name-only`.
- DIFF180: `src/utils/fetch.js` is in PR #8 diff-name-only.
- DIFF181: `src/utils/photoPermission.js` is in PR #8 diff-name-only.
- DIFF182: `src/utils/temp_handleUrl.js` is in PR #8 diff-name-only and in `61b25cc git show --name-only` as a deleted path.
- DIFF183: `style.css` is in PR #8 diff-name-only.
- DIFF184: `tailwind.config.js` is in PR #8 diff-name-only.
- DIFF185: `vite.config.js` is in PR #8 diff-name-only and in `3a03555 git show --name-only`.

**Headless Core Evidence Ledger**

- CORE001: Package name/private/export are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`.
- CORE002: Core imports only local controller/helper modules at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:1-11`.
- CORE003: Core factory doc lists nine controllers at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:13-18`.
- CORE004: Core deps include auth/app/browser/photo/ai/notification/account/stats/storage/clipboard/share/imageProcessor/clock at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:20-34`.
- CORE005: Core creates store at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:39-42`.
- CORE006: Auth controller wiring is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:44-53`.
- CORE007: Permission controller wiring is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:55-62`.
- CORE008: Notification controller wiring is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:64-72`.
- CORE009: Account controller wiring is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:74-82`.
- CORE010: Home controller wiring is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:84-91`.
- CORE011: Input controller wiring is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:93-99`.
- CORE012: Result controller wiring is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:101-109`.
- CORE013: Report controller wiring is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:111-119`.
- CORE014: Core return bundle is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:121-132`.
- CORE015: Store contract says deep clone/deep merge/subscribe at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:1-18`.
- CORE016: Store auth domain is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-31`.
- CORE017: Store permissions domain is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:32-40`.
- CORE018: Store notifications and navigation domains are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:41-42`.
- CORE019: Store home domain is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:43-51`.
- CORE020: Store input domain is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:52-60`.
- CORE021: Store result domain is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:61-67`.
- CORE022: Store report/account domains are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:68-75`.
- CORE023: Port contract header is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:1-10`.
- CORE024: AuthPort typedef is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:12-21`.
- CORE025: BrowserPort and AppPort typedefs are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:23-34`.
- CORE026: PhotoPort typedef is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:36-63`.
- CORE027: AiPort typedef is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:65-71`.
- CORE028: NotificationPort typedef is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:73-79`.
- CORE029: AccountPort and StatsPort typedefs are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:81-91`.
- CORE030: Storage/Clipboard/Share/ImageProcessor/Clock typedefs are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:93-120`.
- ADAPT001: Adapter assembler boundary comment is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:1-19`.
- ADAPT002: Adapter platform/service imports are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:21-39`.
- ADAPT003: Adapter factory imports are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:41-53`.
- ADAPT004: Adapter return typedef names are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:55-72`.
- ADAPT005: Adapter creates auth/browser/app/photo/ai ports at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:74-84`.
- ADAPT006: Adapter creates notification/account/stats/storage ports at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:85-99`.
- ADAPT007: Adapter creates clipboard/share/imageProcessor/clock ports at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:100-107`.
- ADAPT008: Adapter returns all 13 ports at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:109-123`.
- DOM001: createDomApp decision header is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`.
- DOM002: createDomApp imports converted components at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:26-35`.
- DOM003: createDomApp imports DOM adapters at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:37-39`.
- DOM004: createDomApp `TOAST_DOMAINS` are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:41-50`.
- DOM005: createDomApp bootErrors safeInit is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:52-65`.
- DOM006: createDomApp `tryDestroy` helper is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:67-72`.
- DOM007: createDomApp signature is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:74-86`.
- DOM008: createDomApp eager component construction is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:94-105`.
- DOM009: createDomApp lazy manager factories are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:107-140`.
- DOM010: createDomApp lazy modal factory is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:142-144`.
- DOM011: createDomApp manager accessors are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:146-166`.
- DOM012: createDomApp router setup is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:168-179`.
- DOM013: createDomApp auth reactor is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:181-203`.
- DOM014: createDomApp toast subscription is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:205-206`.
- DOM015: createDomApp destroy cascade is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:208-234`.
- MAIN001: main.js header decisions are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:1-14`.
- MAIN002: main.js imports are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:16-20`.
- MAIN003: main.js bootErrors binding is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:22-23`.
- MAIN004: main.js rootEls are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:25-39`.
- MAIN005: main.js init sequence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:41-58`.
- COMP001: AuthModal imports only Modal at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:1-8`.
- COMP002: AuthModal accepts core and calls OAuth at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/AuthModal.js:9-38`.
- COMP003: PermissionModal conversion header is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:1-16`.
- COMP004: PermissionModal core subscription is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:20-39`.
- COMP005: PermissionModal checkAndOpen delegates to core at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/PermissionModal.js:41-52`.
- COMP006: HomeManager conversion header is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:1-19`.
- COMP007: HomeManager subscribes to core store at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:23-51`.
- COMP008: HomeManager legacy compatibility getters are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:53-91`.
- COMP009: HomeManager click handlers call core.home at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:93-130`.
- COMP010: ResultViewer conversion header is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1-15`.
- COMP011: ResultViewer constructor accepts core at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:17-50`.
- COMP012: ResultViewer destroy unsubscribes at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:52-57`.
- MODAL001: SettingsModal removal comment is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/Modal.js:120-121`.
- INDEX001: Legacy public export cleanup comment is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:1-11`.
- INDEX002: Remaining public exports are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/index.js:13-36`.
- CONFIG001: npm workspaces/scripts are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:7-18`.
- CONFIG002: runtime dependencies are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/package.json:23-36`.
- CONFIG003: Vite alias/build settings are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/vite.config.js:20-31`.
- CONFIG004: jsconfig paths are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/jsconfig.json:1-16`.
- CI001: CI frontend build workflow is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-32`.
- CI002: CI backend smoke workflow is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`.
- CI003: iOS workflow trigger/build/sync is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:1-49`.
- IGNORE001: local ignore patterns are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.gitignore:102-115`.

**PR Body And Workflow Note Evidence Ledger**

- BODY001: PR Summary package claim is `PR #8 §Summary`; code evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/package.json:1-9`.
- BODY002: PR Summary store-domain claim is `PR #8 §Summary`; code evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:30-75`.
- BODY003: PR Summary controller claim is `PR #8 §Summary`; code evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:121-132`.
- BODY004: PR Summary adapter claim is `PR #8 §Summary`; code evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:21-123`.
- BODY005: PR Summary DOM claim is `PR #8 §Summary`; code evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:1-24`.
- BODY006: PR Summary component claim is `PR #8 §Summary`; code evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/createDomApp.js:26-35`.
- BODY007: PR Slice history slice 1 claim is `PR #8 §Slice history`; instruction doc exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:1-19`.
- BODY008: PR Slice history slice 2 claim is `PR #8 §Slice history`; slice 2 doc is in `61b25cc git show --name-only`.
- BODY009: PR Slice history slice 3 claim is `PR #8 §Slice history`; slice 3 docs are in `61b25cc git show --name-only`.
- BODY010: PR Slice history slice 4 claim is `PR #8 §Slice history`; slice 4 doc is in `61b25cc git show --name-only`.
- BODY011: PR Slice history slice 5 claim is `PR #8 §Slice history`; slice 5 decision log is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-847`.
- BODY012: PR Slice history slice 6 claim is `PR #8 §Slice history`; slice 6 addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`.
- BODY013: PR Files changed C1 row is `PR #8 §Files changed`; stat evidence is `3a03555 git show --stat`.
- BODY014: PR Files changed C2 row is `PR #8 §Files changed`; stat evidence is `8ea1104 git show --stat`.
- BODY015: PR Files changed C3 row is `PR #8 §Files changed`; stat evidence is `61b25cc git show --stat`.
- BODY016: PR Validation build claim is `PR #8 §Validation`; local retained value is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`.
- BODY017: PR Validation diff-check claim is `PR #8 §Validation`; local retained value is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:860`.
- BODY018: PR Validation core scan claim is `PR #8 §Validation`; final review evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:22-24`.
- BODY019: PR Validation component scan claim is `PR #8 §Validation`; final review evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:24-25`.
- BODY020: PR Validation final-review claim is `PR #8 §Validation`; final review summary is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:4-18`.
- BODY021: PR Validation push-readiness claim is `PR #8 §Validation`; push-readiness summary is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:4-19`.
- BODY022: PR Manual smoke claim is `PR #8 §Manual smoke`; spec source is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`.
- BODY023: PR Out of scope backend claim is `PR #8 §Out of scope`; diff evidence is `PR #8 diff-name-only`.
- BODY024: PR Out of scope legacy-service claim is `PR #8 §Out of scope`; adapter imports are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`.
- BODY025: PR Out of scope native plugin claim is `PR #8 §Out of scope`; native plugin interface is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/plugins/RecocolPhotos.ts:35-78`.
- LLM001: Workflow note 1.1 is `PR #8 §LLM Workflow Notes 1.1`; repo artifact proof is not retained beyond Korean path citations.
- LLM002: Workflow note 1.2 is `PR #8 §LLM Workflow Notes 1.2`; final-review comment-only hit is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:6`.
- LLM003: Workflow note 1.3 is `PR #8 §LLM Workflow Notes 1.3`; validation regex is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:721-739`.
- LLM004: Workflow note 1.4 is `PR #8 §LLM Workflow Notes 1.4`; controller wiring evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:42-119`.
- LLM005: Workflow note 1.5 is `PR #8 §LLM Workflow Notes 1.5`; store contract is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:4-18`.
- LLM006: Workflow note 1.6 is `PR #8 §LLM Workflow Notes 1.6`; slice 5 warning cleanup is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:829-835`.
- LLM007: Workflow note 1.7 is `PR #8 §LLM Workflow Notes 1.7`; sub-slice plan is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:801-810`.
- LLM008: Workflow note 1.8 is `PR #8 §LLM Workflow Notes 1.8`; doc sizes are represented by `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`.
- LLM009: Workflow note 1.9 is `PR #8 §LLM Workflow Notes 1.9`; repository evidence is FACT NOT VERIFIABLE.
- LLM010: Workflow note 1.10 is `PR #8 §LLM Workflow Notes 1.10`; decision log evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-799`.
- LLM011: Workflow task step 1 is `PR #8 §LLM Workflow Notes 2`; retained mapping docs are in `61b25cc git show --name-only`.
- LLM012: Workflow task step 2 is `PR #8 §LLM Workflow Notes 2`; decision sections are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-799`.
- LLM013: Workflow task step 3 is `PR #8 §LLM Workflow Notes 2`; slice 6 addendum is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:870-884`.
- LLM014: Workflow task step 4 is `PR #8 §LLM Workflow Notes 2`; implementation commit evidence is `3a03555/8ea1104/61b25cc git show --stat`.
- LLM015: Workflow task step 5 is `PR #8 §LLM Workflow Notes 2`; validation loop is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:719-746`.
- LLM016: Workflow task step 6 is `PR #8 §LLM Workflow Notes 2`; comment-token issue is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:6`.
- LLM017: Workflow task step 7 is `PR #8 §LLM Workflow Notes 2`; slice 5 verification/summary are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-868`.
- LLM018: Methodology Decision To Surface is `PR #8 §LLM Workflow Notes 3`; evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:788-799`.
- LLM019: Methodology sub-slice split is `PR #8 §LLM Workflow Notes 3`; evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:801-810`.
- LLM020: Methodology instruction patch is `PR #8 §LLM Workflow Notes 3`; evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:679-699`.
- LLM021: Methodology final/push audit split is `PR #8 §LLM Workflow Notes 3`; evidence is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`.
- LLM022: Methodology commit split is `PR #8 §LLM Workflow Notes 3`; evidence is `3a03555/8ea1104/61b25cc git show --stat`, with PR-level mismatch in `PR #8 commits query: length=37`.

**CI And Mergeability Evidence Ledger**

- CIROLL001: PR #8 metadata reports `mergeable=MERGEABLE`.
- CIROLL002: PR #8 metadata reports `mergeStateStatus=UNSTABLE`.
- CIROLL003: PR #8 metadata reports empty `reviewDecision`.
- CIROLL004: PR #8 statusCheckRollup reports `CI / build` completed SUCCESS.
- CIROLL005: PR #8 statusCheckRollup reports `CI / backend-smoke` completed FAILURE.
- CIROLL006: PR #8 statusCheckRollup build details URL is `https://github.com/goodand/narrative-ai/actions/runs/25677254198/job/75378596183`.
- CIROLL007: PR #8 statusCheckRollup backend-smoke details URL is `https://github.com/goodand/narrative-ai/actions/runs/25677254198/job/75378595966`.
- CIROLL008: CI workflow trigger is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:1-8`.
- CIROLL009: CI uses checkout at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:13-18`.
- CIROLL010: CI uses Node 22 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:19-23`.
- CIROLL011: CI installs frontend with `npm ci` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:24-25`.
- CIROLL012: CI builds frontend with `npm run build` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:27-32`.
- CIROLL013: CI backend-smoke starts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-40`.
- CIROLL014: CI backend installs `./backend` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:43-47`.
- CIROLL015: CI backend starts uvicorn at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:48-53`.
- CIROLL016: CI health wait loop is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:54-64`.
- CIROLL017: CI health payload assertion is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:65-73`.
- CIROLL018: CI backend log dump is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:75-77`.
- CIROLL019: CI backend stop step is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:79-84`.
- CIROLL020: iOS workflow trigger excludes PR events at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:1-7`.
- CIROLL021: iOS workflow runs Node setup at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:18-24`.
- CIROLL022: iOS workflow runs web build at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:26-31`.
- CIROLL023: iOS workflow runs `npx cap sync ios` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:33-35`.
- CIROLL024: iOS workflow xcodebuild command is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:36-49`.
- CIROLL025: iOS workflow artifact upload is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/build-ios.yml:50-77`.

**Commit Chain Evidence Ledger**

- CHAIN001: PR #8 commit list begins with `b1b354e refactor(control): canonicalize control tree shims`.
- CHAIN002: PR #8 commit list includes `12ca6b9 feat: implement AI-driven delete recommendations and optimize home ca…`.
- CHAIN003: PR #8 commit list includes `0d33c51 feat: integrate AI deletion recommendation and update control documen…`.
- CHAIN004: PR #8 commit list includes `5896c6a chore(config): default to local backend for batch feature testing`.
- CHAIN005: PR #8 commit list includes `a4af71f perf(carousel): optimize batch analysis and image loading workflow`.
- CHAIN006: PR #8 commit list includes `f7afcba feat(carousel): implement AI batch curation with smart background buf…`.
- CHAIN007: PR #8 commit list includes `8e771f3 fix(ui): carousel navigation for small batches and AI batch tone crys…`.
- CHAIN008: PR #8 commit list includes `2cb6091 fix(stable): ensure bootability and resolve event-loop crashes in leg…`.
- CHAIN009: PR #8 commit list includes `15c848a feat(core): remove unplanned features (Analyze Memories) and finalize…`.
- CHAIN010: PR #8 commit list includes `18f8fd4 feat: optimize AI photo curation architecture and stabilize system pe…`.
- CHAIN011: PR #8 commit list includes `d0a3f58 feat: optimize boot stability with lazy loading and fix infinite load…`.
- CHAIN012: PR #8 commit list includes `0941489 feat(native/fe): optimize image quality tier and implement assetId re…`.
- CHAIN013: PR #8 commit list includes `ed88633 feat(backend/ai): add async polling and lean Gemini batch flow`.
- CHAIN014: PR #8 commit list includes `e70dbef refactor(fe): bind AI analysis flow to assetId keys`.
- CHAIN015: PR #8 commit list includes `24f4560 chore(assets): remove stale smoke screenshots`.
- CHAIN016: PR #8 commit list includes `aa56d5f docs(issues): trim SKILLS_ANALYSIS_ISSUES to verified changes`.
- CHAIN017: PR #8 commit list includes `2b82a3c chore(dev): gate health diagnostics and align verification docs`.
- CHAIN018: PR #8 commit list includes `2ee2a14 fix(ios): guarantee thumbnail callback completion in getDailyCuration`.
- CHAIN019: PR #8 commit list includes `580c8b7 fix(frontend): correct timeout messages and fix timer leak`.
- CHAIN020: PR #8 commit list includes `125ae01 fix(fe): render report and mypage shells before async loads`.
- CHAIN021: PR #8 commit list includes `7f65ba7 docs: record report mypage review and cleanup policy`.
- CHAIN022: PR #8 commit list includes `92d4805 feat(fe/ios): wire permission-gated curation and local thumb flow`.
- CHAIN023: PR #8 commit list includes `da037c2 refactor(fe): formalize permission resolution and gate home loading`.
- CHAIN024: PR #8 commit list includes `58ff427 docs: record ui capture cleanup candidates and boot notes`.
- CHAIN025: PR #8 commit list includes `016da6c style(fe): adopt Pretendard + canonical bg/paper tokens (RECOCO DS v1…`.
- CHAIN026: PR #8 commit list includes `384b226 style(fe): align buttons to spec geometry (h-14 px-6 rounded-3xl) + f…`.
- CHAIN027: PR #8 commit list includes `3ab3254 style(fe): convert precious/thanks buttons to spec single-line layout…`.
- CHAIN028: PR #8 commit list includes `7a7d0b1 style(fe): finalize radius/glass/transition per spec (Phase C)`.
- CHAIN029: PR #8 commit list includes `81f7551 style(fe): tokenize canonical spacing + normalize arbitrary scale (Ph…`.
- CHAIN030: PR #8 commit list includes `57e528e style(fe): respond to audit FAIL — surface canonical tokens, fix R5/R…`.
- CHAIN031: PR #8 commit list includes `e70f68d chore(fe): remove tailwind.config.js borderRadius dead code (v4 build…`.
- CHAIN032: PR #8 commit list includes `937de4a style(fe): align input-field to spec metrics (Phase E2 — Coverage Gap…`.
- CHAIN033: PR #8 commit list includes `6d41586 style(fe): force canonical token emission + fix accent border (Phase …`.
- CHAIN034: PR #8 commit list includes `dd23d38 style(fe): finalize R2 transitions + input typography + modal backdro…`.
- CHAIN035: PR #8 commit list includes `3a03555 refactor(core): add headless core package and platform ports`.
- CHAIN036: PR #8 commit list includes `8ea1104 refactor(dom): route bootstrap and components through headless core`.
- CHAIN037: PR #8 commit list includes `61b25cc chore(refactor): remove dead legacy paths and document headless-core …`.

## 13. Recommendations (Critical/High/Medium/Low)

| Severity | Recommendation | Evidence |
|---|---|---|
| Critical | Do not merge PR #8 in current form while `mergeStateStatus=UNSTABLE` and `CI / backend-smoke` is failing. | `PR #8 statusCheckRollup` reports `backend-smoke=FAILURE`; backend-smoke workflow is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.github/workflows/ci.yml:34-84`. |
| Critical | Re-scope PR #8 or retarget/rebase so the PR contains the headless refactor artifacts rather than 37 historical control/design/backend commits. | `PR #8 commits query: length=37`; `PR #8 diff-name-only` includes backend/control/context_portal/iOS/design paths; headless 3-commit split itself is `3a03555`, `8ea1104`, `61b25cc`. |
| High | Preserve the three logical headless commits, but make the PR commit list match the PR description before requesting merge review. | `PR #8 §Files changed` presents 3 commits; GitHub metadata returns 37 commits; `3a03555/8ea1104/61b25cc git show --stat` matches the intended split. |
| High | Either remove unrelated backend changes from this PR or explicitly convert the PR scope/body to include backend CI maintenance. | `PR #8 §Out of scope` says backend is out of scope; `PR #8 diff-name-only` includes backend source files; push-readiness backend separation row is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:527`. |
| Medium | Update PR validation wording so the exact bundle size has a line-cited source or state that it comes from the latest local build log. | PR body claims `325.19/87.69` in `PR #8 §Validation`; local retained line-cited value is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:849-860`; push-readiness warning is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:529`. |
| Medium | Move or compress `LLM Workflow Notes` if the PR description is meant to optimize merge review; keep the detailed version as a comment or later playbook. | `PR #8 §LLM Workflow Notes` contains 10 issue sections, 7 task steps, and methodology notes; core merge facts are already in `PR #8 §Summary` through `PR #8 §Validation`. |
| Medium | Add manual smoke evidence as PR comment after web/iOS checks, especially auth/deep-link/permission/destructive flows. | PR body marks `Manual smoke (TBD)`; smoke scenarios are `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:768-785`. |
| Low | Keep the post-merge cleanup queue visible for deferred `dispatchNavChange`, Supabase singleton, and legacy services. | Slice 6 deferral is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-5-component-mapping.md:884`; helper remains at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/ui/dom/domEvents.js:19-35`; legacy service imports remain at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/adapters/createAppPorts.js:26-39`. |
| Low | Consider extracting reusable LLM collaboration patterns after merge rather than keeping all process notes in the merge-critical PR body. | General patterns are visible in `PR #8 §LLM Workflow Notes`; retained docs already include final-review and push-readiness artifacts at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-final-review.md:1-18` and `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-push-readiness.md:1-19`. |
