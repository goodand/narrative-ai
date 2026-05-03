# Narrative AI Handoff

> Last updated: 2026-04-19
> Branch: `control/canonicalize-control-tree-shims`
> Scope: 삭제 추천 배치 분석 지연 완화와 개발 진단 정리

---

## 1. 이번 변경의 범위

- 사진 삭제 추천 경로에서 원본 이미지 대신 분석 전용 프리뷰를 사용하도록 조정했다.
- 프론트 분석 캐시와 매칭 키를 `assetId` 중심으로 정리했다.
- 배치 삭제 추천 API를 `task_id` 기반 비동기 폴링 구조로 바꿨다.
- 배치 Gemini 호출에 전용 모델/타임아웃/재시도 설정을 분리했다.
- `/health`와 Vite proxy 설정은 개발 진단에 맞게 정리했다.

---

## 2. 현재 코드에서 확인되는 핵심 구현

### 2.1 입력 경량화

- `ios/App/App/Plugins/RecocolPhotosPlugin/PhotoAssetManager.swift`
  - `quality == "analysis"`일 때 `1024x1024`
  - `isNetworkAccessAllowed = false`
- `src/services/PhotoService.js`
  - `getPhotoAsBase64ByAssetId(...)`
  - 기본 분석 품질은 `analysis`

### 2.2 배치 분석 흐름

- `backend/app/routers/narrative.py`
  - `POST /api/v1/delete-recommendation/batch`
  - `GET /api/v1/delete-recommendation/jobs/{task_id}`
  - `analysis_tasks` 인메모리 저장소
- `src/services/GeminiService.js`
  - 배치 요청 후 `task_id` 수신
  - 기본 폴링 상한 `60`회

### 2.3 배치 모델 설정

- `backend/app/services/gemini.py`
  - 배치 경로는 `gemini_batch_model`, `batch_timeout`, `batch_max_retries` 사용
  - `_fetch_with_retry(...)`와 `_fetch_with_key_failover(...)`는 `**kwargs` 전달 지원

### 2.4 개발 진단 설정

- `backend/app/main.py`
  - `/health`는 기본적으로 `status`, `version`만 반환
  - `DETAILED_HEALTH=true`일 때만 상세 진단 노출
- `vite.config.js`
  - proxy target은 `VITE_BACKEND_ORIGIN` 우선

---

## 3. 현재 설계의 의도적 한계

- `analysis_tasks`는 인메모리 저장소다.
  - 단일 로컬 서버에서 병목 완화 검증용이다.
  - 멀티 워커나 재시작 내구성은 없다.
- 폴링은 최대 횟수 제한은 있지만 `AbortController` 연동이 아직 없다.
  - 화면 이탈 정리와 명시적 취소는 후속 작업이다.
- `assetId` 기반 전환은 주 경로에 적용됐지만, 일부 mock/비네이티브 fallback이 남아 있다.
- 동일한 `assetIds` 조합에 대한 서버측 멱등 캐시나 TTL cleanup은 아직 없다.

---

## 4. 다음 작업 우선순위

1. `analysis_tasks`를 Redis 또는 DB 기반 상태 저장소로 교체
2. 프론트 폴링에 `AbortController`와 화면 이탈 cleanup 추가
3. 배치 작업 TTL cleanup 및 중복 요청 dedupe 추가
4. `idx-${index}` fallback 제거 조건 정의

---

## 5. 참조 문서

- `SKILLS_ANALYSIS_ISSUES.md`
- `docs/verification/verification_packet_v5.md`
