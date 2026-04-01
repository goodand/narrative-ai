# Caption Optimization Branch / Worktree Procedure

This procedure assumes the current `main` worktree stays dirty and untouched.
The new implementation must start from clean `origin/main`.

## Step 1. Refresh remote state
From the repository root:

```bash
git fetch origin
```

## Step 2. Create a dedicated branch + worktree
Recommended names:
- branch: `feat/caption-generation-optimizer`
- worktree: `.worktrees/caption-generation-optimizer`

Create them from `origin/main`:

```bash
git worktree add -b feat/caption-generation-optimizer .worktrees/caption-generation-optimizer origin/main
```

Expected result:
- new branch created from `origin/main`
- new worktree exists at `./.worktrees/caption-generation-optimizer`

## Step 3. Enter the new worktree and verify cleanliness

```bash
cd .worktrees/caption-generation-optimizer
git status --short
git branch --show-current
git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null || true
```

Expected result:
- no modified or untracked files
- current branch is `feat/caption-generation-optimizer`
- base is effectively `origin/main`

## Step 4. Lock scope before editing
Open these three canonical documents first:
- `control/project_agent_ops/resources/material/task_packets/issued/2026-04-01-16-58_caption-optimization-implementation-packet.md`
- `control/project_agent_ops/resources/references/2026-04-01-16-58_caption-optimization-pr-scope-checklist.md`
- `control/project_agent_ops/resources/evidence/reports/main-worktree-verification-for-caption-optimization.md`

Before writing code, verify that the intended changes stay inside:
- `main.js`
- `src/services/GeminiService.js`
- `src/components/InputManager.js`
- `src/components/ResultViewer.js`
- `backend/app/routers/narrative.py`
- `backend/app/services/gemini.py`

## Step 5. Implement in two passes
### Pass A. Frontend
Target files:
- `main.js`
- `src/services/GeminiService.js`
- `src/components/InputManager.js`
- `src/components/ResultViewer.js`

Required outcomes:
- pending result shell appears immediately
- no active synonyms dependency in the caption flow
- request image payload is normalized around `Blob` / `File`

### Pass B. Backend
Target files:
- `backend/app/routers/narrative.py`
- `backend/app/services/gemini.py`

Required outcomes:
- route contract stays stable
- critical path excludes reverse geocoding before Gemini call
- response remains frontend-compatible

## Step 6. Do not widen scope unless re-approved
If implementation pressure pushes toward any of the following, stop and re-evaluate before proceeding:
- `backend/app/services/geocoding.py`
- `src/components/HomeManager.js`
- `src/services/PhotoService.js`
- `src/components/home/**`
- `src/services/photo/**`
- iOS files

## Step 7. Validate locally
Minimum validation:

```bash
npm run build
```

Then run backend validation appropriate to the changed route/service environment.
If the backend test environment is ready, prefer route-focused validation over broad unrelated suites.

Recommended checks:
- successful caption generation request
- failed caption generation request
- result rendering without synonyms
- no touched forbidden files

## Step 8. Review touched files before commit

```bash
git status --short
git diff --stat
```

Check against the PR scope checklist.
If unrelated files appear, remove them from this branch before proceeding.

## Step 9. Prepare PR evidence
Collect these before opening the PR:
- touched files list
- short before/after timing note
- confirmation that synonyms is not on the active caption path
- confirmation that reverse geocoding is not blocking caption generation

## Step 10. Open PR as caption-only
PR body should explicitly include:
1. Why `main` was not used directly
2. Which files were allowed
3. Which files were intentionally excluded
4. How synonyms was handled
5. How backend critical path was reduced
