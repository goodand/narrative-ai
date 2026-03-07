#!/bin/zsh
set -euo pipefail

# Usage:
#   ./test_log/scripts/perf_eval.sh <log_file>
#   pbpaste | ./test_log/scripts/perf_eval.sh
#
# Expected line format:
# [PERF] launch_to_carousel_ms=842 dayKey=2026-03-07 fromCache=true needsRefresh=false

INPUT="${1:-}"
TMP_TSV="$(mktemp /tmp/perf_eval.XXXXXX.tsv)"
trap 'rm -f "$TMP_TSV"' EXIT

if [[ -n "$INPUT" ]]; then
  if [[ ! -f "$INPUT" ]]; then
    echo "ERROR: file not found: $INPUT" >&2
    exit 1
  fi
  SRC_CMD=(cat "$INPUT")
else
  SRC_CMD=(cat)
fi

"${SRC_CMD[@]}" | awk '
{
  if (match($0, /launch_to_carousel_ms=[0-9]+/)) {
    ms = substr($0, RSTART + 22, RLENGTH - 22)

    day = ""
    fc = ""
    nr = ""

    if (match($0, /dayKey=[^ ]+/)) {
      day = substr($0, RSTART + 7, RLENGTH - 7)
    }
    if (match($0, /fromCache=[^ ]+/)) {
      fc = tolower(substr($0, RSTART + 10, RLENGTH - 10))
    }
    if (match($0, /needsRefresh=[^ ]+/)) {
      nr = tolower(substr($0, RSTART + 13, RLENGTH - 13))
    }

    print ms "\t" day "\t" fc "\t" nr "\t" $0
  }
}
' > "$TMP_TSV"

N="$(wc -l < "$TMP_TSV" | tr -d ' ')"
if [[ "$N" -eq 0 ]]; then
  echo "ERROR: no PERF lines found."
  echo "Expected: launch_to_carousel_ms=... dayKey=... fromCache=... needsRefresh=..."
  exit 1
fi

SORTED_MS=($(cut -f1 "$TMP_TSV" | sort -n))
P50_IDX=$(( (N + 1) / 2 ))
P95_IDX=$(( (95 * N + 99) / 100 ))
if [[ "$P95_IDX" -lt 1 ]]; then P95_IDX=1; fi
if [[ "$P95_IDX" -gt "$N" ]]; then P95_IDX="$N"; fi

P50="${SORTED_MS[$P50_IDX]}"
P95="${SORTED_MS[$P95_IDX]}"
MAX="${SORTED_MS[$N]}"

CACHE_HITS="$(awk -F'\t' '$3=="true"{c++} END{print c+0}' "$TMP_TSV")"
REFRESH_TRUE="$(awk -F'\t' '$4=="true"{c++} END{print c+0}' "$TMP_TSV")"
UNIQUE_DAYKEYS="$(cut -f2 "$TMP_TSV" | sed '/^$/d' | sort -u | wc -l | tr -d ' ')"
UNIQUE_PATTERNS="$(awk -F'\t' '{print $3 "|" $4}' "$TMP_TSV" | sort | uniq -c | sed 's/^ *//' )"

PASS="FAIL"
if [[ "$P95" -le 2000 ]]; then
  PASS="PASS"
fi

echo "=== Perf Summary ==="
echo "samples=$N"
echo "p50_ms=$P50"
echo "p95_ms=$P95"
echo "max_ms=$MAX"
echo
echo "=== Cache Pattern Stability ==="
echo "cache_hit_ratio=$(awk -v h="$CACHE_HITS" -v n="$N" 'BEGIN{printf "%.2f", (n==0?0:h/n)}') ($CACHE_HITS/$N)"
echo "needsRefresh_true_count=$REFRESH_TRUE"
echo "unique_dayKey_count=$UNIQUE_DAYKEYS"
echo "pattern_counts:"
echo "$UNIQUE_PATTERNS" | sed 's/^/  - /'
echo
echo "=== KPI Check ==="
echo "p95<=2000ms: $PASS"
echo
echo "=== Next Priority Fixes (Top 2) ==="
if [[ "$P95" -gt 2000 ]]; then
  echo "1) launch payload 축소: thumbSize 420->320, initial limit 6->3로 내려 p95 먼저 안정화"
else
  echo "1) KPI 통과 상태 유지: thumbSize/limit 고정 후 회귀 방지용 PERF 로그를 CI 또는 수동 체크리스트에 추가"
fi

if [[ "$CACHE_HITS" -lt $((N * 8 / 10)) ]]; then
  echo "2) cache hit 강화: 홈 런치에서 forceRefresh 경로 차단, applied/pending 승격 조건 재검토"
elif [[ "$REFRESH_TRUE" -gt 1 && "$UNIQUE_DAYKEYS" -le 1 ]]; then
  echo "2) needsRefresh 흔들림 완화: dayKey 동일 구간에서는 needsRefresh=false 고정"
else
  echo "2) 삭제/기록 후 정책 B 전환 시점만 검증 강화 (recordCurationAction -> refresh 한 번만 호출)"
fi
