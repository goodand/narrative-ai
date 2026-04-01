# Caption Optimization Tool and Xcode Strategy

## Purpose
Define the implementation-time tool strategy for the caption-generation optimization branch so execution does not drift into the dirty `main` refactor stream or rely on unstable simulator tooling as a primary lane.

## Inputs
This strategy is aligned with:
- `control/project_agent_ops/resources/material/task_packets/issued/2026-04-01-16-58_caption-optimization-implementation-packet.md`
- `control/project_agent_ops/resources/references/2026-04-01-16-58_caption-optimization-pr-scope-checklist.md`
- `control/project_agent_ops/resources/references/2026-04-01-16-58_caption-optimization-branch-worktree-procedure.md`
- `control/project_agent_ops/resources/evidence/reports/main-worktree-verification-for-caption-optimization.md`
- `.user/workspace-available-tools.json`
- `.user/workspace-available-skills.json`

## Current Tool Reality
Observed from the current workspace catalog:
- no explicit `Xcode MCP` tool group is available in the current session tool catalog
- core implementation-capable tool groups are available:
  - shell execution
  - filesystem editing
  - git structured tools
  - GitHub structured tools
  - sub-agents
- iOS-related operational evidence exists in repo docs through Maestro and shell-based simulator tooling
- prior local runtime history indicates simulator instability risk (`CoreSimulatorService` / `simdiskimaged` failures)

## Primary Decision
Use `repo-native implementation tools` as the primary lane.
Use `Xcode / simulator / Maestro` only as a secondary validation lane.

This means:
1. code changes do not depend on Xcode availability
2. merge readiness is not blocked solely by simulator instability
3. iOS validation is still useful, but not the control plane for the implementation

## Primary Tool Lane
### 1. Branch / Worktree Control
Use:
- `git`
- `git worktree`
- structured git tools where useful

Purpose:
- isolate caption-only implementation from dirty `main`
- keep rollback trivial
- keep PR diff bounded

### 2. Code Reading and Editing
Use:
- `rg`
- `sed`
- `cat`
- filesystem edit tools
- patch-based edits

Primary target files:
- `main.js`
- `src/services/GeminiService.js`
- `src/components/InputManager.js`
- `src/components/ResultViewer.js`
- `backend/app/routers/narrative.py`
- `backend/app/services/gemini.py`

### 3. Parallel Analysis and Bounded Workers
Use:
- sub-agents for non-overlapping slices only

Good worker slices:
- `main.js`
- `src/services/GeminiService.js`
- `src/components/InputManager.js`
- `src/components/ResultViewer.js`
- `backend/app/routers/narrative.py`
- `backend/app/services/gemini.py`
- read-only flow mapping
- read-only PR guard

### 4. Required Build Validation
Use:
- `npm run build`
- backend route-focused validation

This is the mandatory validation lane.

## Secondary Validation Lane
### Maestro
Use Maestro for iOS user-flow confirmation when simulator health allows it.

Good uses:
- pending result shell appears immediately
- caption-only success flow
- error path check
- screenshot or smoke evidence

Not a good use:
- core implementation dependency
- architecture exploration
- file ownership decisions

### Xcode / Simulator / Xcode MCP
Use only as a late validation lane.

Role:
- optional confidence increase
- install/run smoke on iOS
- visual evidence for regression checks

Do not use as:
- the main implementation tool
- the primary debugging surface for JS/FastAPI logic
- the gate that decides whether the branch can be developed at all

## Why Xcode Is Not Primary Here
1. the target PR is JS + FastAPI centered
2. the critical code paths can be implemented and validated without iOS-native source edits
3. simulator health on this machine has already been unstable
4. relying on Xcode as the primary lane would slow implementation without reducing the main risk

## Skill Strategy
Recommended skills for this task:
- `agent-task-packet`
  - keep the implementation packet stable
- `codex-worktree-dispatch`
  - branch/worktree isolation and merge readiness
- `worktree-parallel`
  - parallel workers with disjoint write sets
- `evidence-trace-auditor`
  - before/after timing and route evidence collection

Not primary for this task:
- external `my-image-parser` skills
- image-specific artifact skills

Reason:
- this task is app flow optimization, not image asset pipeline work

## Step-by-step Tool Usage Strategy
### Step 1. Create and verify clean worktree
Use:
- git fetch
- git worktree add
- git status

Output:
- clean caption-only branch

### Step 2. Read and lock scope
Use:
- filesystem reads
- `rg`
- implementation packet and PR checklist docs

Output:
- no accidental expansion into `HomeManager.js` / `PhotoService.js` refactor

### Step 3. Implement frontend changes
Use:
- patch-based edits
- filesystem edits
- shell reads

Targets:
- `main.js`
- `src/services/GeminiService.js`
- `src/components/InputManager.js`
- `src/components/ResultViewer.js`

### Step 4. Implement backend changes
Use:
- patch-based edits
- filesystem edits
- shell reads

Targets:
- `backend/app/routers/narrative.py`
- `backend/app/services/gemini.py`

### Step 5. Mandatory validation
Use:
- `npm run build`
- backend route validation
- touched-file scope review

### Step 6. Optional iOS lane
Use only if simulator/runtime is healthy:
- Maestro
- simulator tools
- Xcode or Xcode-adjacent tools if available

Output:
- additional confidence only

## Merge Gate Order
Recommended merge gate order:
1. scope compliance
2. `npm run build`
3. backend route validation
4. caption-only flow evidence
5. optional Maestro / iOS smoke evidence

## Practical Rule
If Xcode or simulator tooling is unstable, continue implementation and primary validation anyway.
Do not widen the PR or block the branch solely because the secondary iOS lane is unavailable.

## One-line Summary
For caption optimization, `git + filesystem + patch edits + build validation` is the primary lane.
`Maestro / simulator / Xcode` is a secondary evidence lane, not the control plane.
