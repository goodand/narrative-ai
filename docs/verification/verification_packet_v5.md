# Verification Packet v5

> Created: 2026-04-19
> Scope: 삭제 추천 배치 분석 경로의 지연 완화와 개발 진단 노출 검증

---

## 1. 검증 목표

이 packet은 아래 다섯 가지를 확인한다.

- 분석 전용 이미지 티어가 원본 경로를 대체하는가
- 프론트 분석 매칭이 `assetId` 중심으로 정리되었는가
- 배치 삭제 추천이 `task_id` 기반 비동기 폴링으로 동작하는가
- 배치 Gemini 호출이 전용 모델/타임아웃/재시도 설정을 사용하는가
- `/health`와 Vite proxy가 개발 진단 목적에 맞게 정리되었는가

---

## 2. Claims to Verify

| # | Claim | Priority |
|---|-------|----------|
| C1 | 네이티브 분석 이미지 경로는 `1024x1024`와 `isNetworkAccessAllowed = false`를 사용한다 | HIGH |
| C2 | 프론트 배치 분석은 `assetId` 기반 키와 `getPhotoAsBase64ByAssetId(...)`를 사용한다 | HIGH |
| C3 | 배치 삭제 추천 API는 `202 + task_id`를 반환하고 상태 조회 endpoint를 제공한다 | HIGH |
| C4 | 배치 Gemini 호출은 `gemini_batch_model`, `batch_timeout`, `batch_max_retries`를 사용한다 | HIGH |
| C5 | `/health`는 기본 최소 응답을 유지하고 `DETAILED_HEALTH=true`에서만 상세 진단을 노출한다 | MEDIUM |
| C6 | Vite proxy는 `VITE_BACKEND_ORIGIN`을 단일 우선값으로 사용한다 | MEDIUM |

---

## 3. Source-of-Truth Files

| Concern | File | Anchor |
|---------|------|--------|
| Native analysis tier | `ios/App/App/Plugins/RecocolPhotosPlugin/PhotoAssetManager.swift` | `quality == "analysis"` |
| AssetId image loading | `src/services/PhotoService.js` | `getPhotoAsBase64ByAssetId(` |
| Batch binding | `src/components/home/homeImageRuntime.js` | `batch:${assetIds.join('|')}` |
| Async batch route | `backend/app/routers/narrative.py` | `/delete-recommendation/batch` |
| Job polling route | `backend/app/routers/narrative.py` | `/delete-recommendation/jobs/{task_id}` |
| Batch Gemini config | `backend/app/services/gemini.py` | `self.settings.gemini_batch_model` |
| Health detail gate | `backend/app/main.py` | `settings.detailed_health` |
| Health config | `backend/app/config.py` | `detailed_health` |
| Vite backend origin | `vite.config.js` | `VITE_BACKEND_ORIGIN` |

---

## 4. Expected Behavior

### 4.1 이미지 입력 경량화

- 분석용 로딩은 원본 대신 `analysis` 품질을 사용해야 한다.
- 네이티브 경로에서 iCloud 원본 다운로드를 강제하지 않아야 한다.
- 프론트 배치 로딩은 각 사진의 `assetId`를 기준으로 이미지를 가져와야 한다.

### 4.2 배치 분석 실행

- 프론트 배치 요청은 즉시 최종 결과를 받지 않고 `task_id`를 먼저 받아야 한다.
- 이후 `jobs/{task_id}`를 폴링하여 `processing`, `completed`, `failed` 상태를 확인해야 한다.
- 현재 구현 기준 폴링 상한은 60회이며, 강제 취소는 아직 없다.

### 4.3 배치 Gemini 설정

- 배치 삭제 추천은 스토리 생성과 분리된 설정을 사용해야 한다.
- `timeout`과 재시도 관련 인자가 `_fetch_with_retry(...)`까지 전달되어야 한다.

### 4.4 개발 진단 노출

- `/health`는 기본적으로 최소 상태만 반환해야 한다.
- `DETAILED_HEALTH=true`에서만 모델, 키 개수, 네트워크, 성능 제약 정보를 포함해야 한다.
- 브라우저 개발 프록시는 `VITE_BACKEND_ORIGIN`을 우선해야 한다.

---

## 5. Reproduction Commands

### 5.1 코드 앵커 확인

```bash
rg -n 'quality == "analysis"|isNetworkAccessAllowed' ios/App/App/Plugins/RecocolPhotosPlugin/PhotoAssetManager.swift
rg -n 'getPhotoAsBase64ByAssetId|batch:\$\{assetIds.join' src/services/PhotoService.js src/components/home/homeImageRuntime.js
rg -n 'delete-recommendation/batch|jobs/\{task_id\}|analysis_tasks' backend/app/routers/narrative.py
rg -n 'gemini_batch_model|batch_timeout|batch_max_retries|\*\*kwargs' backend/app/services/gemini.py
rg -n 'detailed_health|VITE_BACKEND_ORIGIN' backend/app/config.py backend/app/main.py vite.config.js
```

### 5.2 Health smoke

```bash
curl http://127.0.0.1:8000/health
DETAILED_HEALTH=true curl http://127.0.0.1:8000/health
```

### 5.3 Frontend build smoke

```bash
npm test
python3 -m compileall backend/app
```

---

## 6. Known Limitations

| # | Limitation | Impact | Planned follow-up |
|---|------------|--------|-------------------|
| L1 | `analysis_tasks`는 인메모리 저장소 | 재시작/멀티워커에서 상태 유실 | Redis 또는 DB로 교체 |
| L2 | 배치 폴링에 `AbortController` 미연동 | 화면 이탈 시 네트워크 정리 불가 | 폴링 취소와 cleanup 추가 |
| L3 | `idx-${index}` fallback 일부 잔존 | mock 경로에서 정합성 규칙 완전 일관성 없음 | 프로덕션 조건에서 제거 |
| L4 | 배치 작업 TTL cleanup 없음 | 장기 구동 시 메모리 누수 가능 | TTL worker 또는 정리 훅 추가 |
| L5 | 동일 자산 리스트 dedupe 없음 | 중복 비용 발생 가능 | `assetIds` 해시 기반 캐시 검토 |

---

## 7. Pass/Fail Rules

| Rule | Pass | Fail |
|------|------|------|
| C1 | `analysis` 경로와 `1024x1024`가 확인됨 | 원본 경로만 사용됨 |
| C2 | `assetId` 기반 키와 로더가 확인됨 | `index` 중심으로만 동작함 |
| C3 | `202 + task_id`와 상태 조회 경로가 확인됨 | 단일 동기 응답만 존재함 |
| C4 | 배치 설정과 `**kwargs` 전달이 확인됨 | 배치 경로가 스토리 설정을 재사용함 |
| C5 | 최소 `/health`와 상세 `/health` 분기가 확인됨 | 항상 상세 정보가 노출됨 |
| C6 | Vite proxy가 `VITE_BACKEND_ORIGIN` 우선 사용 | `localhost` 하드코딩만 존재 |
