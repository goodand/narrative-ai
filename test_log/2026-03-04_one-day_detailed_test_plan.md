# One-Day Detailed Test Plan (2026-03-04)

## 0) Goal
- In one day, complete what would normally be a week of backend upload reliability/performance validation.
- Produce decision-grade evidence for:
- `main (norm-on)` vs `exp/backend-norm-off (norm-off)`

## 1) Test Targets
- Control A (norm-on): `https://narrative-ai-backend.onrender.com`
- Control B (norm-off): `https://narrative-ai-backend-exp-norm-off.onrender.com`
- Endpoint: `POST /api/v1/narrative`
- Context payload: fixed JSON string (same for all tests)

## 2) Fixed Inputs
- Image set (5 files):
1. `assets/test-assets/스크린샷 2026-01-20 오전 12.21.22.png` (small)
2. `assets/test-assets/스크린샷 2026-01-19 오후 9.42.17.png` (medium)
3. `assets/test-assets/스크린샷 2026-01-19 오후 9.41.14.png` (medium)
4. `assets/test-assets/Gemini_Generated_Image_4gswtq4gswtq4gsw.png` (large png)
5. `assets/test-assets/IMG_9544.JPG` (large jpg)

## 3) Metrics (must collect)
- Success rate (`HTTP 200 / total`)
- Valid response rate (`original_caption` + `keywords`)
- Latency: `p50`, `p95`, `p99`, `max`
- Timeout count/rate (`curl --max-time` 기준)
- Cold-start outlier count
- Concurrency degradation slope (1/2/4/8)

## 4) Operational Rules
- Same test host/network for all runs.
- No app/server code change during the test window.
- Per-request timeout: `45s`.
- Log every run in CSV.
- Update latest pointer by minute timestamp:
- `test_log/scripts/rotate_latest.sh <report.md>`

## 5) Detailed Timeline (KST)

### 09:00-09:30 Environment freeze
1. Confirm both services are healthy (`/health`).
2. Confirm env keys are loaded (`GEMINI_API_KEY`, `_SUB`, `_INSU`).
3. Confirm branch mapping in Render:
- main service -> `main`
- experiment service -> `exp/backend-norm-off`

Deliverable:
- `test_log/raw_2026-03-04_0900_health_check.csv`

### 09:30-11:00 Baseline long-run (single-flight)
1. Run 30 requests per environment with fixed image mix.
2. Sequence pattern:
- 5 images x 3 rounds = 15
- Repeat once = 30
3. Store all rows with:
- env, file, run_id, http_code, time_total, has_caption, has_keywords

Pass criteria:
- Success >= 97%
- p95 <= 20s

Deliverables:
- `test_log/raw_2026-03-04_0930_baseline_main.csv`
- `test_log/raw_2026-03-04_0930_baseline_exp.csv`
- `test_log/2026-03-04_baseline_analysis.md`

### 11:00-12:00 Cold-start test block
1. For each environment:
- wait 15 minutes idle
- execute 1 request (small PNG)
- immediately execute 5 warm requests (mixed)
2. Repeat the set 3 times.

Metrics:
- cold request latency
- warm median latency
- cold/warm ratio

Deliverables:
- `test_log/raw_2026-03-04_1100_cold_warm.csv`
- `test_log/2026-03-04_cold_start_analysis.md`

### 12:00-13:00 Lunch + data integrity check
1. Validate CSV completeness.
2. Detect malformed rows.
3. Pre-compute rolling p95 by environment.

Deliverable:
- `test_log/2026-03-04_midday_integrity_report.md`

### 13:00-15:00 Concurrency test block
1. Levels: 1, 2, 4, 8 in-flight.
2. Per level per env:
- 20 requests (same image: `IMG_9544.JPG`)
3. Use `--max-time 45`.

Metrics:
- success rate by concurrency
- p50/p95/p99 by concurrency
- timeout rate by concurrency

Deliverables:
- `test_log/raw_2026-03-04_1300_concurrency_main.csv`
- `test_log/raw_2026-03-04_1300_concurrency_exp.csv`
- `test_log/2026-03-04_concurrency_analysis.md`

### 15:00-16:00 Format/size sensitivity block
1. 5 files x 10 requests each per env.
2. Alternate env every request to reduce drift bias.

Metrics:
- per-file success and p95
- compare norm-on vs norm-off sensitivity

Deliverables:
- `test_log/raw_2026-03-04_1500_file_matrix_ab.csv`
- `test_log/2026-03-04_file_matrix_analysis.md`

### 16:00-16:45 Key failover observability block
1. Trigger sustained requests (moderate load) 10-15 mins.
2. Inspect Render logs:
- key-switch warning events
- post-switch success continuity

Deliverables:
- `test_log/2026-03-04_key_failover_observation.md`
- (optional) screenshot links/log excerpts index

### 16:45-18:00 Final synthesis + decision
1. Merge all CSV stats into one conclusion table.
2. Evaluate go/no-go:
- Keep norm-on
- Rollback to norm-off
- Keep norm-on + additional tuning required
3. Write final decision memo.

Deliverables:
- `test_log/2026-03-04_final_decision_report.md`
- `test_log/raw_2026-03-04_summary_metrics.json`
- `test_log/latest_YYYY-MM-DD_HHMM.md` (rotated)

## 6) Decision Criteria
1. Reliability: success rate and valid response rate dominate.
2. Tail latency: p95/p99 and timeout rate dominate over p50.
3. Cold-start behavior: max latency and recovery slope matter.
4. If trade-off exists, prioritize lower timeout/tail risk.

## 7) Command Templates

### 7.1 Health check
```bash
curl -sS https://narrative-ai-backend.onrender.com/health
curl -sS https://narrative-ai-backend-exp-norm-off.onrender.com/health
```

### 7.2 Single request with timing
```bash
curl --max-time 45 -sS -o /tmp/resp.json -w "%{http_code},%{time_total}\n" \
  -X POST "https://narrative-ai-backend.onrender.com/api/v1/narrative" \
  -F "image=@assets/test-assets/IMG_9544.JPG" \
  -F 'context={"sns":"Instagram","mood":"emotional","temp":"Lukewarm","language":"Korean","tags":"","activity":"","bodyState":"","relationship":"","metadata":{},"systemPrompt":null}'
```

### 7.3 Latest pointer update
```bash
test_log/scripts/rotate_latest.sh test_log/2026-03-04_final_decision_report.md
```

## 8) Risk Controls
1. If timeout rate > 20% in any block:
- stop current block
- reduce concurrency by one level
- annotate reason before restart
2. If one service is temporarily down:
- log downtime window
- rerun the affected block after recovery
3. If key quota issue is suspected:
- preserve logs first, then continue tests

## 9) Expected Outputs by End of Day
1. A/B evidence table with p50/p95/p99 and timeout rates.
2. Cold-start and concurrency behavior profile.
3. Final recommendation with rollback safety statement.
