# Caption Optimization Implementation Packet

## Title
Gemini caption generation optimization on clean `origin/main`

## Goal
Implement a dedicated caption-generation optimization branch/worktree without mixing with the current dirty `main` refactor/auth/smoke changes.

## Background
Current `main` is blocked for direct implementation.
Verified blockers are documented in `control/project_agent_ops/resources/evidence/reports/main-worktree-verification-for-caption-optimization.md`.
The target files for caption optimization are not currently dirty, but the runtime path is indirectly coupled to dirty refactor changes in `src/components/HomeManager.js`, `src/services/PhotoService.js`, `src/components/home/`, and `src/services/photo/`.

## Worktree / Branch Contract
- Base: `origin/main`
- New branch only
- New worktree only
- Do not modify the existing dirty `main` worktree

## Branch Hint
- `feat/caption-generation-optimizer`

## Worktree Hint
- `.worktrees/caption-generation-optimizer`

## Scope
Allowed implementation targets:
- `main.js`
- `src/services/GeminiService.js`
- `src/components/InputManager.js`
- `src/components/ResultViewer.js`
- `backend/app/routers/narrative.py`
- `backend/app/services/gemini.py`

Conditional target only if explicitly needed after scope review:
- `backend/app/services/geocoding.py`

## Required Product Decisions
These are already locked for this packet.
- `caption generation only`
- `synonyms` is not part of this implementation
- caption must be renderable without `keywords`
- result shell must appear immediately after generate
- backend reverse geocoding must not stay on the caption critical path

## Functional Changes
### Frontend
1. Replace the current generate flow with a staged caption generation flow
   - `preparing_image`
   - `uploading`
   - `generating_caption`
   - `rendering_result`
   - `error`
2. Show a pending result shell immediately after generate
3. Remove `getSynonyms()` from the active caption flow
4. Treat caption response as sufficient for success
5. Use `Blob` or `File` as the canonical request payload type
6. Keep preview behavior working

### Backend
1. Keep `POST /api/v1/narrative` contract stable
2. Keep image normalization behavior functionally correct
3. Remove reverse geocoding/address enrichment from the caption critical path
4. Keep response parsing and Gemini error handling coherent

## Non-goals
- No structure refactor PR
- No `HomeManager.js` cleanup
- No `PhotoService.js` cleanup
- No `src/components/home/` migration work
- No `src/services/photo/` migration work
- No iOS auth/smoke cleanup
- No synonyms redesign for a future ML model
- No streaming/SSE in this first pass

## Explicitly Forbidden Files
Do not modify:
- `src/components/HomeManager.js`
- `src/services/PhotoService.js`
- `src/components/home/**`
- `src/services/photo/**`
- `.gitignore`
- `.maestro/flows/ios/onboarding-auth-smoke.yaml`
- `ios/App/App.xcodeproj/project.pbxproj`
- `ios/App/App/Info.plist`

## Deliverables
1. Caption optimization implementation in the allowed files only
2. Pending result UX for caption generation
3. Caption-only success path with no active synonyms dependency
4. Critical-path backend reduction for narrative generation
5. Short validation note with before/after timing checkpoints

## Done Definition
The task is done only if all of the following are true.
1. Generate click transitions immediately to a pending result shell
2. Caption renders without waiting for synonyms
3. `main.js` no longer blocks on the active synonyms call in the caption flow
4. `ResultViewer` works when `keywords` is empty or omitted
5. Backend narrative generation no longer waits on reverse geocoding before Gemini call
6. `npm run build` passes
7. Backend tests or route smoke validation relevant to the changed files pass
8. No forbidden files were modified

## Validation Checklist
- `npm run build`
- Backend route validation for `/api/v1/narrative`
- Generate success path with image input
- Generate error path with invalid or failed request
- Confirm no active `getSynonyms()` dependency remains in the caption path
- Confirm touched files stay within scope

## Review Focus
- Does this PR stay caption-only?
- Did the implementation accidentally drift into refactor cleanup?
- Did it remove the user-visible latency bottleneck or only move it?
- Is `synonyms` truly inactive in the current caption path?
