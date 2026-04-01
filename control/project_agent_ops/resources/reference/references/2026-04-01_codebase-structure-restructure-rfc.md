# Codebase Structure Restructure RFC

## Status
- Draft RFC
- Scope: repo structure, ownership boundaries, PR decomposition
- Non-goal: implementation details for caption optimization

## Executive Verdict
- Current verdict: `주의`
- Core problem: code quality issues exist, but the larger issue is that the repo has too many top-level surfaces with unclear ownership.
- Guiding rule: do not attempt a big-bang restructure. Close the current drift first, then introduce feature slices and infra boundaries in staged PRs.

## Current Structural Problems

### 1. Root Surface Sprawl
- Runtime, governance, experiments, local artifacts, and worktrees coexist at the repo root.
- Examples:
  - runtime: [`src`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src), [`backend`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend), [`ios`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/ios)
  - governance: [`control`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control)
  - spike/prototype/artifact: [`nerrative-ai`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/nerrative-ai), [`new_design`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/new_design), [`test_log`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/test_log), [`build`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/build)
  - local/editor state: [`.history`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.history), [`.user`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.user), [`.worktrees`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.worktrees)

### 2. Frontend Half-Migration
- The frontend is split between flat legacy facades and nested feature runtimes.
- Examples:
  - [`src/components/HomeManager.js`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js) plus [`src/components/home`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home)
  - [`src/services/PhotoService.js`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/PhotoService.js) plus [`src/services/photo`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo)
- [`main.js`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js) owns too much orchestration.

### 3. Backend Responsibility Collapse
- [`backend/app/services/gemini.py`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/app/services/gemini.py) owns failover, retry, GPS extraction, geocoding, story generation, synonyms generation, and response parsing.
- [`backend/app/routers/narrative.py`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/app/routers/narrative.py) contains heavy image preprocessing.
- [`backend/app/services/geocoding.py`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/app/services/geocoding.py) is sync `requests` inside an otherwise async service flow.

### 4. Governance Direction Is Right but Not Fully Closed
- [`control`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control) as canonical and [`docs`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs) / [`plans`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/plans) as shim-only is the correct direction.
- [`control/project_agent_ops/registry/tools`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control/project_agent_ops/registry/tools) is structurally correct but still not closed as a canonical tracked registry in the current worktree state.

### 5. Platform Duplication
- Canonical iOS runtime is ambiguous because both [`ios/App`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/ios/App) and [`nerrative-ai`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/nerrative-ai) exist.
- Maestro automation is split across [`.maestro`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.maestro), [`scripts/maestro`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/scripts/maestro), and [`test_log/scripts`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/test_log/scripts).

## Target Shape

### Root
```text
repo root/
  src/
  backend/
  ios/App/
  assets/
  public/
  scripts/
  control/
  docs/      # shim only
  plans/     # shim only
  package.json
  capacitor.config.json
  vite.config.js
```

### Frontend
```text
src/
  app/
    bootstrap/
    router/
    state/
  features/
    caption/
      ui/
      services/
      model/
    home/
      ui/
      runtime/
      services/
    photo/
      runtime/
      services/
    auth/
    report/
    notice/
    mypage/
  platform/
    capacitor/
    plugins/
    workers/
  shared/
    ui/
    services/
    utils/
    constants/
```

### Backend
```text
backend/app/
  core/
    config.py
    lifespan.py
  api/
    routers/
      narrative.py
      synonyms.py
      geo.py
      account.py
      health.py
  features/
    caption/
      service.py
      image_pipeline.py
      prompts.py
      schemas.py
    synonyms/
      service.py
      prompts.py
      schemas.py
    geo/
      service.py
      schemas.py
    account/
      service.py
      schemas.py
  infra/
    gemini/
      client.py
      retry.py
      parser.py
    geocoding/
      client.py
  shared/
    errors.py
```

### Governance
- [`control`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control) remains canonical
- [`docs`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs) and [`plans`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/plans) remain shim-only
- [`test_log`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/test_log) migrates to `control/.../resources/evidence/**`
- [`.history`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.history) and [`.user`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.user) remain local-only and non-canonical

## PR Decomposition

### PR-1: Control Registry Closure And Local Surface Policy
- Objective:
  - close canonical tool/skill registry under [`control/project_agent_ops/registry/tools`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control/project_agent_ops/registry/tools)
  - codify local-only vs canonical surface policy
- Include:
  - [`control/project_agent_ops/registry/tools/**`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control/project_agent_ops/registry/tools)
  - supporting control docs or rules only
- Exclude:
  - runtime code
  - optimizer code
  - iOS shell decisions
- Risk:
  - low
- Success criteria:
  - tool registry is tracked
  - docs/plans shim-only rule is explicit
  - `.history` / `.user` / `.worktrees` are clearly documented as non-canonical

### PR-2: Frontend Drift Closure For Home/Photo Runtime
- Objective:
  - resolve the current flat-vs-nested drift in `home` and `photo`
  - make nested runtime paths tracked and intentional
- Include:
  - [`src/components/home/**`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home)
  - [`src/services/photo/**`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo)
  - thin-facade updates in [`src/components/HomeManager.js`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js) and [`src/services/PhotoService.js`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/PhotoService.js)
- Exclude:
  - caption optimization behavior changes
  - large `main.js` breakup
  - backend refactor
- Risk:
  - low to medium
- Success criteria:
  - `home` and `photo` ownership is explicit
  - no untracked feature-runtime directories remain
  - old facades become thin compatibility layers only

### PR-3: Caption/App Skeleton + Backend Boundary Extraction
- Objective:
  - introduce the first real feature-slice skeleton for frontend and backend
  - reduce orchestration overload without route/path churn
- Include:
  - frontend:
    - `src/app/*`
    - `src/features/caption/*`
    - `src/shared/*`
    - minimal slimming of [`main.js`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js)
  - backend:
    - extraction from [`backend/app/services/gemini.py`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/app/services/gemini.py)
    - extraction from [`backend/app/routers/narrative.py`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/backend/app/routers/narrative.py)
    - `core/api/features/infra` skeleton introduction
    - removal of tracked `__pycache__`
- Exclude:
  - iOS shell unification
  - geocoding client redesign beyond boundary extraction
  - moving root-level evidence/prototype directories
- Risk:
  - medium
- Success criteria:
  - `main.js` is thinner
  - caption contract normalization has a single owner
  - Gemini transport and narrative business logic are no longer collapsed into one module

## Deferred After PR-3
- Single iOS canonical shell decision:
  - keep [`ios/App`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/ios/App) as canonical
  - move [`nerrative-ai`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/nerrative-ai) to archive or separate repo
- Artifact relocation:
  - move [`test_log`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/test_log) under control evidence
  - relocate or archive [`new_design`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/new_design)
  - decide ownership of [`context_portal`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/context_portal)
- Worktree externalization:
  - move [`.worktrees`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.worktrees) outside the repo root for future sessions

## Repeated Tasks Observed During Codex Execution

### 1. Scope-Locking Work Repeats Every Time A Mixed Worktree Is Used
- Repeated task:
  - isolate a clean worktree
  - re-check `git status`
  - restate allowed paths
  - re-verify that unrelated dirty paths are excluded
- Why this repeats:
  - the root worktree mixes control, runtime, iOS, local evidence, and experimental surfaces
  - path-level intent is not obvious from branch name alone
- Takeaway:
  - future PR packets should start with an explicit `allowed paths` block and a `must-not-mix` block

### 2. Canonical Versus Shim Re-Verification Repeats
- Repeated task:
  - verify whether a document belongs in [`control`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control), [`docs`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs), [`plans`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/plans), or root
  - verify whether a path is canonical, compatibility-only, or local-only
- Why this repeats:
  - governance direction is correct, but repo history still contains legacy entry surfaces and compatibility aliases
- Takeaway:
  - every follow-up governance PR should carry an explicit table of `canonical / shim / local-only` ownership for touched paths

### 3. PR Boundary And Merge Readiness Checks Repeat
- Repeated task:
  - compare touched paths against existing PR scopes
  - verify that stacked follow-up work does not collide with active optimizer work
  - confirm whether a branch should remain `draft` or `ready`
- Why this repeats:
  - multiple active branches exist with different ownership models
  - control work and runtime work are both active at the same time
- Takeaway:
  - `merge-safe` path inventories should be maintained as a first-class control artifact, not only as conversational output

### 4. Local Scratch Notes Need Repeated Exclusion Handling
- Repeated task:
  - identify temporary notes created for planning or baseline capture
  - keep them local-only with `.git/info/exclude` or by avoiding stage entirely
- Why this repeats:
  - planning notes are useful during execution, but they are not always PR material
- Takeaway:
  - local execution notes should default to local-only unless a control promotion decision is made explicitly

## Repeated Issues Observed During Codex Execution

### 1. Mixed Dirty Root Worktree Causes Continuous Context Risk
- Issue:
  - unrelated dirty paths in runtime, iOS, and experimental surfaces repeatedly threaten commit scope contamination
- Evidence examples:
  - [`src/components/HomeManager.js`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js)
  - [`src/services/PhotoService.js`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/PhotoService.js)
  - [`.maestro/flows/ios/onboarding-auth-smoke.yaml`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/.maestro/flows/ios/onboarding-auth-smoke.yaml)
  - [`context_portal`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/context_portal)
- Structural implication:
  - worktree isolation is not optional operational polish
  - it is a required control mechanism

### 2. Untracked Runtime Drift Creates Ownership Ambiguity
- Issue:
  - nested runtime paths exist and are already referenced, but remain untracked or half-promoted
- Evidence examples:
  - [`src/components/home`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/home)
  - [`src/services/photo`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/photo)
- Structural implication:
  - these paths should be closed in a dedicated runtime drift PR before more feature work accumulates around them

### 3. Control Truth Is Correct In Principle But Not Yet Operationally Closed
- Issue:
  - `control` is the declared truth plane, but some important registries and follow-up references were still untracked or conversational only
- Evidence examples:
  - [`control/project_agent_ops/registry/tools`](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control/project_agent_ops/registry/tools)
  - this RFC itself as a control follow-up planning artifact
- Structural implication:
  - governance architecture is only reliable when canonical registries are committed and reviewable

### 4. Tooling Capability Needs Explicit Runtime Classification
- Issue:
  - the effective tool stack was repeatedly re-explained because availability, verification, and production-readiness were not captured in one committed place
- Evidence examples:
  - GitHub MCP and shell git were usable
  - some `mcp__git__*` flows were less reliable on this path setup than plain shell git
  - iOS/Xcode MCP was not available for a required merge gate
- Structural implication:
  - tool registry should distinguish `available`, `verified in this repo`, and `safe for merge/deploy gates`

## Operational Reinforcement
- Every new PR packet should declare:
  - worktree path
  - allowed paths
  - excluded dirty paths
  - canonical versus shim versus local-only status for touched docs
- Every follow-up control PR should answer:
  - what repeated task does this PR remove from future sessions
  - what repeated issue does this PR structurally close
- Every runtime PR should answer:
  - whether it depends on unresolved runtime drift
  - whether it introduces any new compatibility shim that must later be retired

## Guardrails
- Do not mix active optimizer PR work with restructure PRs.
- Do not mix control-plane canonicalization PRs with runtime code PRs.
- Do not rename routes or move many files at once without preserving imports and smoke checks.
- Treat iOS shell unification as a separate decision, not incidental cleanup.

## Recommended Sequence
1. Merge the current control shim PR and close the tool registry gap in a follow-up control PR.
2. Promote `home` and `photo` runtime directories into tracked, intentional structure.
3. Introduce frontend `app/features/shared/platform` skeleton and backend `core/api/features/infra` skeleton incrementally.
4. Only then decide iOS shell unification and root artifact relocation.

## One-Line Summary
- First reduce surface ambiguity.
- Then close frontend drift.
- Then extract feature boundaries.
- Only after that touch root-level ownership and platform unification.
