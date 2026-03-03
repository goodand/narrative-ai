# A/B Benchmark: main(norm-on) vs exp-norm-off (2026-03-04 01:31)

## Setup
- Endpoint A: `https://narrative-ai-backend.onrender.com/api/v1/narrative`
- Endpoint B: `https://narrative-ai-backend-exp-norm-off.onrender.com/api/v1/narrative`
- Inputs: 2 files (`11KB PNG`, `3.08MB JPG`)
- Repeats: 3 each (total 6 per env)
- Per-request timeout: 45s
- Raw: `test_log/raw_2026-03-04_0131_ab_norm.csv`

## Summary
| Env | Runs | HTTP 200 | Caption present | p50(s) | max(s) |
|---|---:|---:|---:|---:|---:|
| `main` | 6 | 6/6 | 6/6 | 12.351 | 39.848 |
| `exp_norm_off` | 6 | 5/6 | 6/6 | 11.712 | 45.005 |

## Observation
1. `exp_norm_off`에서 1건 timeout(45s)이 발생했고, max latency도 더 큼.
2. 짧은 샘플 기준에서는 p50 차이가 크지 않지만, tail latency는 norm-off가 불리한 신호.
3. 더 신뢰도 있는 결론을 위해 30+ runs 장기 측정이 필요.
