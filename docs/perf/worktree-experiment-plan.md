# Worktree Experiment Plan (Album Upload Performance)

## 1) Goals
- Test easiest and lowest-risk hypotheses first.
- Keep production path stable while running experiments.
- Make rollback points explicit with baseline commit and per-experiment commits.

## 2) Baseline and Worktree Topology
- Baseline branch: `perf-baseline`
- Baseline tag: `perf-baseline-2026-02-16`
- Worktrees:
- `.worktrees/perf-metrics` -> branch `perf-exp-metrics`
- `.worktrees/perf-bridge` -> branch `perf-exp-bridge`
- `.worktrees/perf-render` -> branch `perf-exp-render`

## 3) Branch Responsibilities
- `perf-exp-metrics`:
- Add instrumentation only (no behavior change).
- Measure native, bridge, and JS timings.
- `perf-exp-bridge`:
- Bridge payload/call strategy experiments.
- Base64 vs URL/file-handle handoff experiments.
- `perf-exp-render`:
- Web-only experiments for Render deployment.
- DOM virtualization, Worker decode, batch API tests.

## 4) Safety Rules (Side-Effect Control)
- Use feature flags for all experiments.
- Default all flags to `off`.
- Keep experiments behind debug route or debug toggle.
- One experiment per commit.
- If metrics regress, revert only that commit.
- Do not mix product changes with perf experiments in the same commit.

## 5) Experiment Order (Easy -> Hard, Low Risk -> Higher Risk)
1. Metrics-only instrumentation (`perf-exp-metrics`)
2. Render debug route + synthetic dataset (`perf-exp-render`)
3. DOM virtualization on image list (`perf-exp-render`)
4. JS main-thread decode vs Web Worker decode (`perf-exp-render`)
5. Chatty calls vs batch calls (`perf-exp-bridge`)
6. Base64 payload vs URL/blob URL handoff (`perf-exp-bridge`)
7. iOS PhotoKit request policy split (preview vs original) (`perf-exp-bridge`)

## 6) KPI and Exit Criteria
- KPI:
- `p50/p95` time-to-first-preview
- `p50/p95` time-to-ready-for-upload
- long task count/time in JS thread
- bridge call count per user action
- payload bytes per bridge call
- Exit criteria:
- At least 30% improvement on `p95` of first preview and end-to-end upload prep.
- No regression in image quality for final uploaded original.

## 7) Commit and Rollback Protocol
1. Start from `perf-baseline`.
2. For each experiment:
- Implement behind a flag.
- Commit message format:
- `perf(exp-<area>): <what changed>`
3. Capture results in commit body or experiment note.
4. Rollback options:
- Single experiment rollback: `git revert <commit_sha>`
- Full reset to baseline tag (on experiment branch only): `git reset --hard perf-baseline-2026-02-16`

## 8) Suggested Commands
```bash
# Move to each worktree
cd .worktrees/perf-metrics
cd .worktrees/perf-bridge
cd .worktrees/perf-render

# Example commit flow
git add <changed_files>
git commit -m "perf(exp-render): add list virtualization behind PERF_VIRT_LIST"

# If regression occurs
git revert <commit_sha>
```

## 9) Notes for Current Session
- iCloud-linked hypothesis is excluded for now (simulator iCloud was not connected).
- Prioritize web-verifiable bottlenecks first because Render-based tests are fastest and safest.
