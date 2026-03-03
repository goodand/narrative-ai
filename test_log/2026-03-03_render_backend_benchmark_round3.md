# Render Backend Benchmark Round3 (2026-03-03 14:17)

## Objective
- Verify current backend stability/performance for multipart narrative generation after image-normalization + key-failover changes.

## Setup
- Endpoint: `POST https://narrative-ai-backend.onrender.com/api/v1/narrative`
- Dataset: 5 images from `assets/test-assets` (11KB to 3.08MB)
- Repeats: 3 runs per file (total 15 requests)
- Raw data: `test_log/raw_2026-03-03_1417.csv`

## Results
| File | Success | p50(s) | max(s) | Caption/Keywords |
|---|---:|---:|---:|---:|
| `스크린샷 2026-01-20 오전 12.21.22.png` | 3/3 | 6.846 | 48.720 | 3/3 / 3/3 |
| `스크린샷 2026-01-19 오후 9.42.17.png` | 3/3 | 6.267 | 6.926 | 3/3 / 3/3 |
| `스크린샷 2026-01-19 오후 9.41.14.png` | 3/3 | 7.098 | 8.215 | 3/3 / 3/3 |
| `Gemini_Generated_Image_4gswtq4gswtq4gsw.png` | 3/3 | 6.696 | 8.610 | 3/3 / 3/3 |
| `IMG_9544.JPG` | 3/3 | 10.006 | 11.962 | 3/3 / 3/3 |

## Overall
- Success rate: **15/15 (100%)**
- p50 latency: **6.926s**
- max latency: **48.720s**
- Note: first request showed warm-up style outlier (`48.720s`) on the smallest PNG; subsequent runs were normal range.

## Interpretation
1. Backend path is stable for mixed image sizes/formats in current dataset (all requests returned valid caption+keywords).
2. Core latency band is roughly 5-12s in this run, with occasional cold-start/outlier risk.
3. Current priority should shift from correctness to p95/p99 latency control and cold-start mitigation.

## Next Tests
1. 30-run long test for p95/p99 confidence.
2. Concurrency test (1/2/4 in-flight) to observe saturation behavior.
3. Compare warm instance vs cold instance separately in logs.
