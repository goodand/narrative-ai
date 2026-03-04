# Search Results Round2 (2026-03-04)

## Scope
- Performance-first deepening for:
1. URLSession behavior and connection policy
2. request buffering and ingress behavior
3. percentile reliability (especially p99 with low sample counts)

## Evidence and Practical Application

### 1) Apple URLSession background transfer
- Source: https://developer.apple.com/documentation/foundation/urlsessionconfiguration/background%28withidentifier%3A%29
- Key point:
- Background session runs transfers in a separate process, can continue when app is suspended/terminated.
- Practical use:
- For reliability experiments, separate foreground and background upload modes.
- Do not mix results from different session types in one percentile bucket.

### 2) Apple Multipath TCP option
- Source: https://developer.apple.com/documentation/foundation/urlsessionconfiguration/multipathservicetype-swift.property
- Source: https://developer.apple.com/documentation/foundation/improving-network-reliability-using-multipath-tcp
- Key point:
- Multipath can improve handover reliability/performance, but needs entitlement and server support.
- Practical use:
- Treat multipath as a separate experiment axis; keep default `none` in baseline.

### 3) waitsForConnectivity behavior
- Source (Apple Tech Talk transcript): https://developer.apple.com/videos/play/tech-talks/203/
- Key point:
- `waitsForConnectivity=true` can convert immediate failures into waits.
- Practical use:
- In test logs, classify waits separately from timeouts.
- If enabled, expect lower hard-failure rate but potential latency-tail expansion.

### 4) NGINX proxy_request_buffering effect
- Source: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- Key point:
- With buffering ON, request body is fully read before proxying upstream.
- Practical use:
- If ingress/proxy is involved, buffering policy can shift bottleneck from upstream to ingress.
- Add proxy timing split where available.

### 5) Render cold-start reminder
- Source: https://render.com/docs/free
- Key point:
- Free services spin down after inactivity; spin-up delay can be large.
- Practical use:
- Keep explicit cold/warm label in CSV.
- Remove cold runs from steady-state p95/p99.

### 6) Percentile reliability caution at low traffic
- Source: https://www.ibm.com/support/pages/node/7258480
- Key point:
- P99 is unstable with low sample sizes and sparse traffic.
- Practical use:
- Minimum sample policy for decision:
1. p95: at least 100 requests per env
2. p99: at least 300 requests per env (preferred)

### 7) Window-based SLO interpretation
- Source: https://cloud.google.com/stackdriver/docs/solutions/slo-monitoring/sli-metrics/lb-metrics
- Key point:
- Percentile metrics are often window-based and should be interpreted as such.
- Practical use:
- Keep 1-minute window summary in addition to global percentiles.

## Immediate Protocol Updates
1. Add `session_mode` field: `foreground|background`.
2. Add `cold_or_warm` field: `cold|warm`.
3. Add `wait_or_timeout` field: `wait|timeout|none`.
4. Add `window_minute` field for minute-bucket analysis.
5. Increase sample count target for p99 confidence.

## Revised Statistical Guardrails
1. Do not use p99 for go/no-go when `n < 100`.
2. Use p95 + timeout rate for low-volume windows.
3. For p99 decision, require:
- `n >= 300` per environment
- separate cold and warm distributions

## Next Search Batch (Round3)
1. URLSessionTaskMetrics fields that can be exported reliably from iOS app logs.
2. FastAPI/Uvicorn worker model impact on long-tail latency.
3. Gemini request-size governance patterns (<20MB inline best practice).
