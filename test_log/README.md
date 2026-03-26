# test_log Naming Rule

## Policy
- Do not use ambiguous names like `LATEST.md`.
- Use minute-level timestamped filenames for latest snapshots:
- `latest_YYYY-MM-DD_HHMM.md`

## Metadata index
- `LATEST_INDEX.json` stores:
- `updated_at`
- `minute_key`
- `latest_file`

## Update command
```bash
test_log/scripts/rotate_latest.sh <source_markdown_file>
```

Example:
```bash
test_log/scripts/rotate_latest.sh test_log/2026-02-17_backend_image_normalization_validation.md
```

## Perf Tooling

현재 repo에 남겨두는 저수준 iOS perf helper:

- `test_log/scripts/idb_wrapper.sh`
  - `idb` client와 수동 `idb_companion` 경로를 강제로 묶습니다.
- `test_log/scripts/start_askui_idb_mcp_stdio.sh`
  - `askui/idb-mcp`를 stdio 모드로 띄울 때 사용합니다.
- `test_log/scripts/run_perf_trace_measurements.sh`
  - 현재 `main`의 `[PERF] launch_to_carousel_ms=...` 로그를 기준으로 여러 런을 수집합니다.
  - 전제:
    - 앱이 target simulator에 이미 설치되어 있어야 합니다.
    - 로그인은 이미 통과되어 home 캐러셀이 보일 수 있어야 합니다.

예시:
```bash
test_log/scripts/run_perf_trace_measurements.sh --runs 5 --sim-name "iPhone 17"
```
