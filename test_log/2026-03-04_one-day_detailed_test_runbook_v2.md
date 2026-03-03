# One-Day Test Runbook v2 (Very Detailed)

## A. Test Mission
- Complete a one-day equivalent of one-week backend validation.
- Compare:
1. `main` (image normalization ON)
2. `exp/backend-norm-off` (image normalization OFF)
- Decision output by end of day:
1. keep ON
2. rollback to OFF
3. ON + further tuning

## B. Preconditions (Must be true before 09:00)
1. Render services live:
- `https://narrative-ai-backend.onrender.com`
- `https://narrative-ai-backend-exp-norm-off.onrender.com`
2. Env vars set on both:
- `GEMINI_API_KEY`
- `GEMINI_API_KEY_SUB`
- `GEMINI_API_KEY_INSU`
- `GOOGLE_CLOUD_API_KEY`
- `SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
3. Local repo on latest `main`.
4. `test_log/scripts/rotate_latest.sh` executable.

## C. Fixed Test Contract
### C.1 Endpoint
- `POST /api/v1/narrative`

### C.2 Fixed context payload
```json
{"sns":"Instagram","mood":"emotional","temp":"Lukewarm","language":"Korean","tags":"","activity":"","bodyState":"","relationship":"","metadata":{},"systemPrompt":null}
```

### C.3 Image set
1. `assets/test-assets/스크린샷 2026-01-20 오전 12.21.22.png`
2. `assets/test-assets/스크린샷 2026-01-19 오후 9.42.17.png`
3. `assets/test-assets/스크린샷 2026-01-19 오후 9.41.14.png`
4. `assets/test-assets/Gemini_Generated_Image_4gswtq4gswtq4gsw.png`
5. `assets/test-assets/IMG_9544.JPG`

### C.4 Timing rules
1. Per-request timeout: `45s`
2. All tests run from same machine/network
3. No deploy/config change during one block

## D. CSV Schemas
### D.1 Common schema
```csv
env,file,run,http_code,time_total_sec,response_bytes,has_caption,has_keywords,error_class,started_at,ended_at
```

### D.2 Concurrency schema
```csv
env,concurrency,idx,http_code,time_total_sec,has_caption,error_class,started_at,ended_at
```

## E. 15-Minute Timeline (KST)

### 09:00-09:15 Block 0-1 (health and branch lock)
1. `/health` both services 3 times each.
2. Save response JSON and status.
3. Confirm branch mapping screenshot in Render.

### 09:15-09:30 Block 0-2 (dry run)
1. One sample upload to each service.
2. Validate JSON keys (`original_caption`,`keywords`).
3. Confirm CSV writer and output paths.

### 09:30-10:30 Block 1 (baseline main, n=30)
1. Sequence:
- 5 images x 6 rounds = 30
2. Record all rows.
3. Abort threshold:
- timeout > 20% in first 10 requests -> pause and annotate.

### 10:30-11:30 Block 2 (baseline exp, n=30)
1. Same pattern as Block 1.
2. Use same request order.

### 11:30-12:00 Block 3 (baseline analysis)
1. Compute per env:
- success rate
- p50/p95/p99
- timeout rate
- valid response rate
2. Generate markdown summary.

### 12:00-12:45 Block 4 (cold/warm main)
1. idle 15m -> 1 cold request
2. immediate 5 warm requests
3. repeat x2 cycles

### 12:45-13:30 Block 5 (cold/warm exp)
1. Same as Block 4.

### 13:30-14:15 Block 6 (concurrency main)
1. Levels 1,2,4,8
2. 20 requests per level
3. File fixed: `IMG_9544.JPG`

### 14:15-15:00 Block 7 (concurrency exp)
1. Same as Block 6.

### 15:00-15:45 Block 8 (file matrix AB alternating)
1. For each file:
- send 10 requests alternating env every request
2. Goal: reduce time drift bias.

### 15:45-16:15 Block 9 (key failover observation)
1. Run sustained traffic (light burst, 10-15 min).
2. Check Render logs:
- fallback switch events
- post-switch success continuity

### 16:15-17:00 Block 10 (retest of anomalies)
1. Re-run only cases that timed out or failed.
2. Mark as retest group in CSV.

### 17:00-18:00 Block 11 (final synthesis and decision)
1. Merge all CSV to one JSON summary.
2. Fill decision matrix:
- reliability winner
- tail latency winner
- cold-start winner
3. Write final report + rotate latest.

## F. Execution Commands (ready to paste)

### F.1 Health check quick
```bash
curl -sS https://narrative-ai-backend.onrender.com/health
curl -sS https://narrative-ai-backend-exp-norm-off.onrender.com/health
```

### F.2 Single upload with timing
```bash
curl --max-time 45 -sS -o /tmp/resp.json -w "%{http_code},%{time_total},%{size_download}\n" \
  -X POST "https://narrative-ai-backend.onrender.com/api/v1/narrative" \
  -F "image=@assets/test-assets/IMG_9544.JPG" \
  -F 'context={"sns":"Instagram","mood":"emotional","temp":"Lukewarm","language":"Korean","tags":"","activity":"","bodyState":"","relationship":"","metadata":{},"systemPrompt":null}'
```

### F.3 Rotate latest pointer
```bash
test_log/scripts/rotate_latest.sh test_log/2026-03-04_final_decision_report.md
```

## G. Analysis Formulas
1. `success_rate = http_200_count / total`
2. `valid_rate = has_caption_and_keywords / total`
3. `timeout_rate = timeout_count / total`
4. `p50/p95/p99` from `time_total_sec` sorted list
5. `cold_warm_ratio = cold_time / median(warm_times)`

## H. Pass/Fail Gates
1. Reliability gate:
- success >= 99%
- valid_rate >= 99%
2. Tail gate:
- p95 <= 20s
- p99 <= 35s
3. Stability gate:
- timeout_rate <= 2%
4. Decision gate:
- if one env violates any gate and the other passes -> pick passing env.

## I. Incident Playbook
1. If both env fail > 20%:
- pause 10 min
- run health checks
- resume with reduced concurrency.
2. If only one env fails:
- keep other env running baseline
- isolate failing env and collect logs.
3. If repeated 429/quota-like issues:
- continue with `_SUB/_INSU` observation note
- tag affected rows `error_class=quota_or_rate_limit`.

## J. Deliverables Checklist (end of day)
1. Raw CSV files for all blocks
2. Per-block analysis markdown
3. Final decision report
4. Updated latest pointer:
- `test_log/LATEST_INDEX.json`
- `test_log/latest_YYYY-MM-DD_HHMM.md`

## K. File Naming Convention
1. Raw:
- `raw_YYYY-MM-DD_HHMM_<block>.csv`
2. Analysis:
- `YYYY-MM-DD_<block>_analysis.md`
3. Final:
- `YYYY-MM-DD_final_decision_report.md`
