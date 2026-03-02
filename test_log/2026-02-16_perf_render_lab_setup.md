# Perf Render Lab Setup (2026-02-16)

## What was added
- Branch: `perf-exp-render`
- Commit: `2adcfab`
- Change:
- Added browser-side perf runner panel behind query flag `?perf_lab=1`.
- Added synthetic tests for:
- Base64 decode (main vs worker)
- Payload JSON stringify/parse cost
- Transfer pattern simulation (chatty100 vs batch1 vs chunked4)

## Why this matters
- Enables fast, repeatable test execution on Render web deployment without touching production flow.
- Produces JSON output that can be copied directly for LLM/agent analysis.

## How to run on Render
1. Open app with query: `?perf_lab=1`
2. Use panel at bottom-right.
3. Click `Run 20MB` (or adjust payload MB).
4. Copy JSON via `Copy JSON`.

## Side-effect profile
- Production behavior unchanged unless `perf_lab=1` is present.
- No existing route logic replaced.

## Known limitations
- Current result is synthetic browser workload, not PhotoKit-native path.
- Final validation still required on iOS simulator/device with native plugin path.

## Related references
- Detailed benchmark result: `test_log/2026-02-16_perf_experiments_round2.md`
- Latest status index: `test_log/LATEST_INDEX.json`
