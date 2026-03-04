# Search Results Round3 (2026-03-04)

## Scope
- Diversify and modernize logging/measurement methods for experiments.
- Focus:
1. URLSession policy implications
2. server runtime/deployment effects
3. percentile reliability for decisioning

## New Findings (Official/Primary-first)

### 1) Render health check behavior can be used as automated gate
- Source: https://render.com/docs/health-checks
- Key points:
- Health probe timeout is short (5s).
- Failing health checks can remove instance from traffic and trigger restart behavior.
- Action:
- Add pre-block and recovery gates using `/health`.
- Record health status before each test block.

### 2) NGINX request buffering can alter upload bottleneck location
- Source: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- Key points:
- `proxy_request_buffering on` reads full client body before upstream.
- `off` streams body as it is received.
- Action:
- If proxy is in path, treat buffering policy as experiment variable.
- Add ingress vs upstream timing split when available.

### 3) URLSession background mode changes transfer execution model
- Source: https://developer.apple.com/documentation/foundation/urlsessionconfiguration/background%28withidentifier%3A%29
- Key points:
- Background transfer runs in separate process and can continue when app is suspended.
- Action:
- Do not mix foreground and background metrics in one distribution.
- Add `session_mode` field in CSV.

### 4) waitsForConnectivity changes failure profile
- Source: Apple Tech Talk transcript: https://developer.apple.com/videos/play/tech-talks/203/
- Key points:
- Enables waiting instead of immediate failure for non-background requests.
- Action:
- Add `wait_or_timeout` tag to classify long waits vs hard failures.

### 5) Uvicorn deployment update: worker package guidance changed
- Source: https://uvicorn.dev/deployment/
- Key points:
- `uvicorn.workers` is deprecated; `uvicorn-worker` package is recommended for Gunicorn integration.
- Action:
- If moving to multi-worker production benchmark, use updated worker package path.

### 6) Low-sample p99 remains weak for hard decisions
- Source: IBM note (previous round): https://www.ibm.com/support/pages/node/7258480
- Key points:
- Sparse traffic makes p99 unstable.
- Action:
- Decision threshold update:
1. p95 requires >=100 samples per env
2. p99 requires >=300 samples per env (or report as provisional)

## Logging Modernization Checklist (to adopt next)
1. Add `phase` fields:
- `cold_or_warm`
- `session_mode`
- `concurrency_level`
2. Add request-level fields:
- `request_bytes`
- `file_mime`
- `window_minute`
3. Add event fields:
- `wait_or_timeout`
- `failover_event_nearby`
4. Add system fields:
- `service_instance_id` (if accessible)
- `health_precheck_status`

## Updated Experiment Method (immediate)
1. Pre-block:
- run `/health` x3 per env; abort if unstable.
2. Run block:
- collect request CSV with new fields.
3. Post-block:
- compute p50/p95/p99 + timeout + valid-response rate.
4. Decision:
- use strict ordering (timeout -> p99 -> p95 -> success -> p50).

## Round3 Conclusion
- Current measurement approach is valid but can be improved by:
1. explicit session mode separation
2. health-gated execution
3. stronger percentile sample policy
4. proxy buffering awareness as a confounder
