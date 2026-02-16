# Perf Experiments Round2 (2026-02-16)

## Scope
- Goal: Find practical bottlenecks for iOS simulator album upload slowdown with low side effects.
- Context:
- iCloud-linked cause is excluded (simulator iCloud not connected).
- Worktree-based experiment topology was prepared.

## Baseline / Branch Context
- Baseline tag: `perf-baseline-2026-02-16`
- Metrics branch commit: `49fd92c` (`perf(exp-metrics): add perf-lab instrumentation for image and bridge path`)
- Branches:
- `perf-baseline`
- `perf-exp-metrics`
- `perf-exp-bridge`
- `perf-exp-render`

## Key Conclusions (for cross-agent reference)
1. `Base64` pipeline is the dominant bottleneck candidate.
- Base64 payload size inflation is consistently `+33.33%`.
- Large Base64 decode on JS/main thread is very expensive and blocking.
2. Big string payload parse/serialize cost is already high before any business logic.
- At 20MB class payload, JSON parse/stringify cost alone is non-trivial.
3. Chatty bridge-style patterns are significantly slower than batch/chunked patterns.
4. Worker offloading may increase total roundtrip time but reduces main-thread stall risk.

## Major Problems Observed
1. Main-thread decode risk
- 20MB decode (atob+charCode loop) showed ~`170ms` class cost in earlier run and ~`126ms avg` in repeat run.
- This magnitude is enough to produce visible UI freeze.
2. Payload overhead risk
- 20MB binary turns into ~27.96M chars Base64 before bridge/server transfer.
- Parse overhead grows sharply with payload size.
3. Bridge call pattern risk
- Simulated 20MB class transfer:
- `chatty100_avg_ms`: `239.77`
- `batch1_avg_ms`: `96.41`
- `chunked4_avg_ms`: `138.21`
- Chatty was ~2.5x slower than single-batch in this simulation.

## Issues / Caveats
1. Node microbench != real iOS WebView/Capacitor exact runtime.
- Use as directionally strong evidence, not final device truth.
2. Worker benchmark result nuance
- Worker roundtrip was slower in total time (`275.03ms`) vs main decode (`126.34ms`) for 20MB.
- But this does not mean worse UX; worker helps keep UI thread responsive.
3. Event-loop observation
- Main decode run produced no interval ticks during operation (`ticks: 0`), indicating hard blocking.
- Worker run had ticks (`ticks: 40`) with limited lag (`maxLagMs: 13.43`).

## Raw Results Snapshot
### Build Smoke
- `perf-baseline`: `10.69s`
- `perf-exp-render`: `11.12s`
- `perf-exp-metrics`: `11.50s`

### Base64 Decode (previous + current)
- 20MB:
- Buffer decode avg: `18.39ms` (previous run path)
- atob+loop avg: `170.47ms` (previous run path)
- main decode avg: `126.34ms` (repeat run)
- worker roundtrip avg: `275.03ms` (repeat run)

### Base64 Inflation
- 1/5/10/20/30MB all `+33.33%` inflation.

### JSON Payload Cost
- 20MB-class payload:
- stringify avg: `26.65ms`
- parse avg: `59.21ms`

### Bridge Pattern Simulation (20MB-class data)
- chatty100 avg: `239.77ms`
- batch1 avg: `96.41ms`
- chunked4 avg: `138.21ms`

## Recommended Next Tests (priority)
1. `perf-exp-render`: DOM virtualization A/B on large image list.
2. `perf-exp-render`: main-thread decode vs Web Worker decode A/B with visible UX metrics.
3. `perf-exp-bridge`: batch API contract and chunked transfer policy A/B.
4. Real iOS simulator run with `PERF_LAB` logs enabled and p95 extraction.

## Decision Guidance
- Keep original quality as product value.
- Optimize transport and processing path:
- preview/original split,
- Base64 minimization in hot path,
- batch/chunk transfer,
- worker offload for UI responsiveness.
