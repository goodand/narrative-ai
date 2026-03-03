# Search Keyword Plan (Performance-First Only)

## 1) Intent Lock
- Keep original intent: maximize performance and stability.
- Exclude UX-convenience discussions unless they directly affect latency/throughput/failure rate.
- Primary target metrics:
1. timeout rate
2. p99
3. p95
4. success rate

## 2) Search Strategy
- For each hypothesis:
1. collect 5-10 high-quality sources
2. extract measurable levers only
3. map to one concrete experiment
4. define pass/fail threshold

## 3) Query Sets by Hypothesis

### H1 Cold-start dominates tail
Queries:
1. `Render cold start latency web service metrics`
2. `serverless cold start vs warm start p99`
3. `how to measure cold start latency reliably`
Goal:
- Find methods to separate cold and warm latency distributions.

### H2 Upstream Gemini dominates total time
Queries:
1. `Gemini API latency best practices generateContent`
2. `Gemini API timeout and retry strategy`
3. `measure upstream inference time in backend`
Goal:
- Isolate upstream time from local preprocessing/network.

### H3 Image normalization trade-off
Queries:
1. `Pillow resize jpeg optimize speed vs quality`
2. `server-side image normalization performance benchmark`
3. `invalid argument image parse failures ai api`
Goal:
- Quantify failure reduction vs added preprocessing cost.

### H4 Large JPG tail under load
Queries:
1. `multipart upload large jpg backend latency`
2. `image size correlation with api latency`
3. `python image processing large file performance`
Goal:
- Validate whether size-sensitive tail is structural.

### H5 Concurrency saturation point
Queries:
1. `concurrency load test p95 p99 methodology`
2. `xargs parallel curl load test best practices`
3. `how to detect saturation knee in latency curve`
Goal:
- Identify 1/2/4/8 in-flight knee point.

### H6 Key failover outlier effect
Queries:
1. `api key failover retry latency impact`
2. `rate limit fallback strategy latency`
3. `observability patterns for failover events`
Goal:
- Correlate key-switch events with latency spikes.

### H7 Request size inflation effect
Queries:
1. `base64 overhead percentage performance`
2. `multipart body size and request latency`
3. `network upload throughput vs payload size`
Goal:
- Build size->latency model with regression or buckets.

### H8 Connection reuse inconsistency
Queries:
1. `URLSessionTaskMetrics isReusedConnection analysis`
2. `HTTP keep alive reuse impact on upload latency`
3. `TLS handshake cost mobile upload`
Goal:
- Verify handshake overhead in tail requests.

## 4) Query Templates (copy/paste)

### 4.1 Korean template
```text
<기술영역> 성능 병목 p95 p99 측정 방법 사례
```

### 4.2 English template
```text
<topic> performance bottleneck p95 p99 measurement benchmark
```

### 4.3 Root-cause template
```text
<symptom> root cause analysis timeout tail latency
```

### 4.4 A/B experiment template
```text
<featureA> vs <featureB> latency reliability experiment design
```

## 5) Source Quality Filter
1. First priority:
- official docs (Apple, FastAPI, Render, AWS, IETF)
2. Second priority:
- engineering blogs with metrics and reproducible setup
3. Reject:
- opinion-only posts without measurement

## 6) Evidence Extraction Format
- `source_url`
- `claim`
- `metric_used`
- `test_condition`
- `applicability_to_our_stack` (high/medium/low)
- `adopt_or_reject_reason`

## 7) Daily Research Workflow (one-day execution)
### 7.1 09:00-10:00
1. H1/H2 search and extraction.
2. Produce two concrete experiments.

### 7.2 10:00-12:00
1. H3/H4/H5 search and extraction.
2. Update concurrency and normalization test thresholds.

### 7.3 13:00-15:00
1. H6/H7/H8 search and extraction.
2. Add observability fields needed for failover/size/reuse.

### 7.4 15:00-17:00
1. Finalize experiment matrix from evidence.
2. Lock pass/fail criteria for decision report.

## 8) Concrete Output Files
1. `test_log/2026-03-04_search_keyword_plan_performance_first.md` (this file)
2. `test_log/raw_2026-03-04_source_evidence.csv`
3. `test_log/2026-03-04_experiment_matrix_from_research.md`
4. `test_log/2026-03-04_final_decision_report.md`

## 9) Non-Negotiables
1. Do not change objective to UX convenience.
2. Do not adopt optimization without metric-backed evidence.
3. Prefer lower timeout/p99 over better median.
