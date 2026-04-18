# Skills 분석 이슈 리포트

> 정리일: 2026-04-19
> 프로젝트: `narrative-ai`
> 기준: 현재 코드베이스와 worktree에서 직접 확인되는 변경만 기록

---

## 1. 문서 축소 기준

- 과거 세션 회고, 외부 워크스페이스 역사, 성과 평가 문장은 제거했다.
- "완성", "혁신", "100% 확보" 같은 결과 해석은 남기지 않았다.
- 아래 항목은 모두 현재 파일에서 직접 확인 가능한 코드 변경만 요약한다.

---

## 2. 확인된 변경

### 2.1 네이티브/프론트 이미지 입력 경량화

- `ios/App/App/Plugins/RecocolPhotosPlugin/PhotoAssetManager.swift`
  - `quality == "analysis"` 분기가 추가되어 `1024x1024` 크기를 사용한다.
  - `options.isNetworkAccessAllowed = false`로 iCloud 원본 다운로드를 막는다.
- `src/services/PhotoService.js`
  - `getPhotoAsBase64ByAssetId(assetId, { quality = 'analysis', thumbSize = 1024 })`가 추가되었다.
  - `getPhotoAsBase64(index, ...)`는 내부적으로 `assetId` 기반 로더를 호출한다.
- `src/components/home/homeImageRuntime.js`
  - 배치 분석 시 `assetIds` 배열을 만들고 `batch:${assetIds.join('|')}` 키를 사용한다.
  - 분석용 이미지는 `getPhotoAsBase64ByAssetId(..., { quality: 'analysis', thumbSize: 1024 })`로 읽는다.

의미:
- 삭제 추천용 이미지 입력이 원본 중심 경로에서 분석 전용 프리뷰 경로로 이동했다.
- 프론트 분석 캐시와 이미지 로딩 키가 `index`보다 안정적인 `assetId` 기반으로 정리되었다.

### 2.2 배치 분석의 비동기 Job Polling 도입

- `backend/app/routers/narrative.py`
  - `POST /api/v1/delete-recommendation/batch`는 `202`와 `task_id`를 즉시 반환한다.
  - `GET /api/v1/delete-recommendation/jobs/{task_id}`가 작업 상태를 조회한다.
  - `run_batch_analysis_task(...)`가 백그라운드에서 결과를 채운다.
- `src/services/GeminiService.js`
  - 배치 요청 후 `task_id`를 받아 `jobs/{task_id}`를 폴링한다.
  - 완료 시 최종 결과를 반환하고, 실패 시 에러를 전달한다.

의미:
- 단일 장시간 HTTP 대기 대신, 작업 예약과 상태 조회가 분리되었다.
- 프론트는 서버 작업의 완료 여부를 단계적으로 확인할 수 있다.

### 2.3 Gemini 배치 호출 파라미터 전달 정리

- `backend/app/services/gemini.py`
  - `_fetch_with_retry(...)`가 `**kwargs`를 받는다.
  - `_fetch_with_key_failover(...)`도 `**kwargs`를 받고 하위 호출로 전달한다.
  - 배치 삭제 추천은 `self.settings.gemini_batch_model`, `self.settings.batch_max_retries`, `self.settings.batch_timeout`을 사용한다.

의미:
- 상위 호출에서 넘긴 `timeout`과 재시도 관련 인자가 중간 계층에서 유실되지 않는다.
- 배치 경로는 일반 스토리 생성과 분리된 설정값을 사용한다.

### 2.4 런타임 진단 및 개발 오리진 정리

- `backend/app/main.py`
  - `/health`는 기본적으로 `status`, `version`만 반환한다.
  - `DETAILED_HEALTH=true`일 때만 `gemini_keys_configured`, `active_models`, `performance_constraints`, `network`를 포함한 상세 진단을 노출한다.
- `vite.config.js`
  - 프록시 타깃이 `VITE_BACKEND_ORIGIN` 우선, 없으면 `http://localhost:${VITE_BACKEND_PORT || 8000}`로 계산되도록 바뀌었다.

의미:
- 헬스 체크는 운영 노출 범위를 줄이면서도 개발 환경에서 상세 진단을 켤 수 있다.
- 브라우저 개발 경로의 백엔드 오리진 설정이 단일 환경 변수로 수렴한다.

---

## 3. 이번 축약본에서 제외한 내용

다음 범주는 현재 변경 범위만으로 다시 입증하지 못해 제거했다.

- 세션 단계별 복기 표
- `safeInit`, `managerFactories` 중심의 부트 초기화 서사
- 시뮬레이터 `3302` 복구 절차와 환경 변수 회고
- 워크스페이스 Skills 진화 과정
- 다른 프로젝트 이슈와의 역사 연결
- 측정 근거 없이 서술된 성능 수치와 품질 평가

---

## 4. 요약

- 현재 코드에서 직접 확인되는 핵심 변화는 `analysis` 품질 티어, `assetId` 기반 로딩/바인딩, `task_id` 기반 배치 폴링, Gemini 배치 설정 분리다.
- 문서에 남기지 않은 항목은 "거짓"이라서가 아니라, 이번 변경 집합만으로 재검증되지 않았기 때문이다.
