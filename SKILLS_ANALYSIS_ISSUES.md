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

---

## 5. Report/MyPage UI Blocking 패치 복기

> 추가일: 2026-04-22
> 범위: `main.js`, `src/components/ReportManager.js`, `src/components/MyPageManager.js`, `src/services/Router.js`
> 기준: 현재 작업트리의 대상 4개 파일 diff와 검증 명령 결과

### 5.1 Step-by-step 작업 복기

1. 사용자 지시서의 핵심 주장을 대상 파일 기준으로 확인했다.
   - `ReportManager.render()`는 화면 shell을 그리기 전에 `await this.loadStats()`를 수행하던 구조였다.
   - `MyPageManager.render()`는 `supabase.auth.getUser()` 완료 전까지 `innerHTML`을 설정하지 않던 구조였다.
   - `Router._showTargetView()`는 manager render 실패를 별도로 방어하지 않았다.
   - `main.js`에는 Report/MyPage lazy manager 생성 핸들러를 뒤쪽 직접 navigation handler가 덮어쓰는 구조가 있었다.

2. Report 화면은 skeleton-first 구조로 바꿨다.
   - `render()`를 동기 함수로 만들고 `_renderShell()`을 먼저 호출한다.
   - 실제 Supabase 조회는 `_hydrateStats()`에서 비동기로 수행한다.
   - `user_stats`와 `detox_logs` 조회는 `Promise.all()`로 병렬화했다.
   - 빈 `user_stats` 행은 `maybeSingle()`로 처리해 초기 사용자에서 예외 중심 흐름을 줄였다.

3. My Page 화면은 profile shell-first 구조로 바꿨다.
   - `render()`가 즉시 `_renderShell()`을 호출한다.
   - auth user 조회는 `_hydrateUser()`에서 뒤따라 수행한다.
   - 사용자 정보 확인 전에는 이름, 이메일, avatar 영역에 placeholder와 loading class를 표시한다.

4. Router는 manager render를 navigation의 hard dependency로 두지 않도록 보강했다.
   - `manager.render()` 호출은 유지하되 `await`하지 않는다.
   - 동기 예외와 rejected promise를 모두 catch해 unhandled rejection이 라우팅 전체를 깨지 않게 했다.

5. `main.js`의 Report/MyPage lazy initialization 경로를 정리했다.
   - manager factory에 `getCurrentUser` 주입을 추가했다.
   - `window.__recocoCurrentUser`를 auth state와 initial session에서 갱신한다.
   - lazy manager 생성용 nav handler를 덮어쓰던 중복 직접 navigation handler를 제거했다.

### 5.2 작업 중 반복된 Task

- 대상 파일만 분리해서 보는 작업이 반복되었다.
  - 전체 worktree에는 native/photo 관련 변경이 이미 많이 있었기 때문에, `git diff -- main.js ... Router.js`처럼 범위를 명시해야 했다.

- blocking render 여부를 함수 단위로 확인하는 작업이 반복되었다.
  - `render()`가 `async`인지, `await`가 남아 있는지, `innerHTML` 세팅이 I/O보다 먼저 실행되는지가 핵심 확인 포인트였다.

- auth user 조회 중복을 줄이는 작업이 반복되었다.
  - Report와 My Page가 각각 `supabase.auth.getUser()`를 직접 호출하면 탭 전환 시 같은 요청이 반복될 수 있어, 현재 세션 user를 주입하는 경로를 추가했다.

- hydration race를 막는 작업이 반복되었다.
  - 빠른 탭 전환이나 재렌더 중 이전 비동기 응답이 최신 화면을 덮지 않도록 `_requestSeq` 기반 stale guard를 사용했다.

- 검증 범위를 분리하는 작업이 반복되었다.
  - 대상 4개 파일의 `node --check`와 `git diff --check -- <targets>`는 통과했다.
  - 전체 `git diff --check`는 기존 native/photo 파일의 trailing whitespace 때문에 이번 패치 판단 근거로 쓰지 않았다.

### 5.3 작업 중 반복된 Issue

- READ-only 지시와 구현 지시의 경계가 무너졌다.
  - 사용자의 `step by step READ line by line READ`는 먼저 정독과 비판을 요구하는 패턴인데, 실제로는 코드 수정까지 진행되었다.
  - 이후 같은 유형의 요청에서는 먼저 진단 보고서를 내고, 명시적 구현 지시가 있을 때만 patch해야 한다.

- 전역 auth cache는 빠른 해결책이지만 장기 구조는 아니다.
  - `window.__recocoCurrentUser`는 중복 auth query를 줄이는 실용적 조치다.
  - 다만 전역 상태 오염과 테스트 복잡도를 만들 수 있으므로 `AuthStateService` 또는 `SessionStore`로 분리하는 후속 리팩토링이 필요하다.

- My Page hydration은 DOM 전체 재렌더가 반복된다.
  - 현재 `.onclick` 대입 방식이라 listener 중복 누수 가능성은 낮다.
  - 그러나 `_renderShell()`이 init/loading/final 단계에서 반복되므로, 장기적으로는 shell 최초 렌더 후 텍스트와 이미지 필드만 갱신하는 방식이 더 낫다.

- Skeleton-first는 코드상 보강됐지만 실제 slow-network UX는 아직 별도 확인이 필요하다.
  - `npm run build`는 통과했다.
  - 브라우저 또는 iOS WebView에서 네트워크 throttling을 걸고 100ms 내 shell 표시, placeholder 전환, error fallback을 눈으로 확인한 기록은 아직 없다.

- Vite build 경고는 이번 패치와 직접 관련 없지만 반복 관찰된다.
  - `dailyCurationRuntime.js`와 `homeLoadRuntime.js`는 정적 import와 동적 import가 동시에 존재해 chunk 분리가 되지 않는다는 경고가 나온다.
  - 이는 Report/MyPage 커밋을 막는 문제는 아니지만, 성능 최적화 문맥에서는 별도 정리가 필요하다.

### 5.4 보강된 후속 체크리스트

- Report 탭 클릭 직후 shell이 즉시 표시되는지 slow network에서 확인한다.
- My Page 탭 클릭 직후 profile placeholder가 표시되는지 slow network에서 확인한다.
- Supabase 401/403 또는 timeout 발생 시 blank screen이 아니라 fallback 문구가 남는지 확인한다.
- Report/MyPage 탭을 빠르게 왕복할 때 이전 hydration 응답이 최신 화면을 덮지 않는지 확인한다.
- logout/withdraw 버튼이 hydration 전후 모두에서 정상 동작하는지 확인한다.
- `window.__recocoCurrentUser`를 전역 변수에서 `AuthStateService` 또는 `SessionStore`로 옮기는 후속 리팩토링을 검토한다.
- MyPage shell 재렌더를 전체 `innerHTML` 교체 방식에서 부분 DOM 업데이트 방식으로 줄이는 후속 개선을 검토한다.

---

## 6. 작업 우선순위와 삭제 후보 관리 원칙

> 추가일: 2026-04-22
> 목적: 구현보다 복원이 비싼 파일/상태를 보호하고, 반복 작업의 검증성과 재사용성을 높이기 위한 운영 기준

### 6.1 우선순위 규칙

- 구현은 상대적으로 저렴하지만 복원은 비싸다.
- 따라서 변경 전후의 의도 정합성, 검증 가능성, 재사용성을 우선한다.
- 기본 우선순위는 아래 순서로 둔다.

1. 의도와 효과성의 정합성
2. 사용자 확인 가능한 수준의 완료
3. 빠른 사용자 확인
4. 재읽기
5. 재사용성 높이기
6. 검증
7. 읽기
8. 최적화
9. 복사
10. line-by-line patch
11. 신규 작성
12. 삭제

의미:
- 삭제는 마지막 수단이다.
- 새로 쓰기보다 기존 것을 읽고 고쳐 쓰는 쪽이 우선이다.
- patch도 가능한 한 line-by-line으로 작게 해야 복구 비용과 검증 비용이 낮다.
- 완료는 "내부적으로 끝났다"가 아니라 사용자가 확인 가능한 상태를 뜻한다.

### 6.2 반복 작업 기준

- 가장 많이 반복되는 작업은 READ다.
- 검증에도 READ가 필요하므로, 문서와 코드의 재사용성은 READ 비용을 줄이는 방향으로 설계해야 한다.
- "Step by step READ" 요청은 기본적으로 구현 지시가 아니라 진단/비판/전략 수립 지시로 해석한다.
- 구현은 사용자가 명시적으로 patch, 반영, 수정, 커밋 등을 요청했을 때만 진행한다.

### 6.3 삭제 후보는 실행하지 말고 먼저 목록화한다

- 삭제 가능한 파일은 즉시 삭제하지 않는다.
- 삭제 후보는 파일 성격, 추적 상태, 보존 가치, 검증 필요 조건을 함께 기록한다.
- 삭제 판단은 현재 context를 반영해야 하므로 검증 비용이 높다.
- 증거물일 가능성이 있는 파일은 삭제 전에 `docs/verification/`으로 승격할지 먼저 판단한다.

### 6.4 현재 관찰된 삭제/정리 후보

| 경로 | 상태 | 분류 | 판단 |
|---|---|---|---|
| `backend/current_live_log.txt` | untracked, 현재 `.gitignore` 미적용 | 런타임 로그 후보 | 삭제 또는 `.gitignore` 추가 후보. 단, 최근 장애 증거가 들어 있으면 요약 후 보존 필요 |
| `backend/backend_log.txt` | ignored by `.gitignore` | 런타임 로그 | 삭제 후보. 필요한 에러 라인만 문서화한 뒤 정리 가능 |
| `backend/backend_log_v2.txt` | ignored by `.gitignore` | 런타임 로그 | 삭제 후보. 필요한 에러 라인만 문서화한 뒤 정리 가능 |
| `backend/backend_log_v3.txt` | ignored by `.gitignore` | 런타임 로그 | 삭제 후보. 필요한 에러 라인만 문서화한 뒤 정리 가능 |
| `.maestro/onboarding-auth-smoke.png` | ignored by `.gitignore` | smoke 증거 이미지 | 삭제 후보가 아니라 증거물 후보. 필요한 경우 `docs/verification/` 승격 후 원본 정리 |
| `/tmp/narrative-ui-local.png` | local temp, untracked | local 브라우저 UI 평가용 캡처 | 삭제 예정. 현재 permission/home UI 평가용으로만 생성되었으며, 필요한 판독이 끝나면 정리 |
| `/tmp/narrative-ui-safari-step1.png` 외 3건 (`step2`~`step4`) | local temp, untracked | Safari 단계별 UI 판독 캡처 | 삭제 예정. local UI 자동 검증 시도 중 생성된 중간 산출물이며, 최종 판독이 끝나면 정리 |
| `/tmp/narrative-ui-safari-postclick.png` | local temp, untracked | Safari 좌표 클릭 재시도 캡처 | 삭제 예정. 좌표 클릭 실패 검증용 중간 산출물이며, 판독 후 정리 |
| `/tmp/narrative-ui-chrome-domclick-1.png`, `/tmp/narrative-ui-chrome-domclick-2.png`, `/tmp/narrative-ui-chrome-auth-after-onboarding.png`, `/tmp/narrative-ui-chrome-home-shell.png` | local temp, untracked | Chrome DevTools DOM 클릭 기반 UI 검증 캡처 | 삭제 예정. 온보딩/인증/home shell 판독용이며, 필요한 결과를 문서화한 뒤 정리 |
| `.venv-idb-mcp/__pycache__/protoc_compiler_template.cpython-313.pyc` | ignored by nested `.gitignore` | Python cache | 삭제 후보. 재생성 가능성이 높음 |
| `src/utils/temp_handleUrl.js` | tracked | 임시/중복 코드 의심 | 삭제 금지. `main.js`의 `handleUrl`과 중복 여부를 line-by-line 검증한 뒤 별도 판단 필요 |

### 6.5 삭제 전 필수 체크

- `git ls-files <path>`로 tracked 여부를 확인한다.
- `git check-ignore -v <path>`로 ignore 근거를 확인한다.
- `rg -n "<filename or exported symbol>" .`로 참조 여부를 확인한다.
- 로그/이미지는 삭제 전 증거 가치가 있는지 확인한다.
- 삭제가 필요하면 먼저 목록과 이유를 사용자에게 보여주고 승인받는다.

---

## 7. 부팅 시퀀스 최적화 및 UI 렌더링 블로킹 해소 (Race Condition 해결)

> 추가일: 2026-04-22
> 범위: `main.js`, `src/components/PermissionModal.js`, `src/components/home/homeLoadRuntime.js`
> 목적: 비동기 흐름 제충돌 방지 및 1회성 상태(권한)의 명시적 검증 과정 기록

### 7.1 반복된 핵심 Issue: 비동기 오케스트레이션 (Orchestration Collision)
- **현상**: 권한 팝업을 수락하기도 전에 뒤에서 "사진 처리 오류!" 빨간 토스트가 발생하며, 로딩이 동일하게 두 번 실행됨.
- **원인 코드 구조**: `main.js`의 부팅 로직에 질서가 부재. `supabase.auth.getSession()` (초기 세션 확인)과 `supabase.auth.onAuthStateChange('SIGNED_IN')`(자동 트리거 이벤트)가 동시에 `navigateToHome()`과 `permissionModal.checkAndOpen()`을 트리거하여 초기화 로직이 2배수 병렬 처리됨.
- **해결 방안 (Centralized Boot Flow)**:
  1. **순서 보장**: 사진 로딩 자체를 `navigateToHome`에서 떼어내어, 권한 결과가 명시적으로 확인된 `permissionModal.onPermissionResolved` 내부로 이관함.
  2. **중복 통제 (Idempotence)**: `if (!homeManager.isLoading)` 가드를 씌워, 중복 트리거 이벤트가 오더라도 현재 로딩 중이라면 무시하도록 처리.

### 7.2 반복된 작업 Task: 무결점 상태(Clean State) 강제 초기화 및 빌드 파이프라인
- **배경**: 권한 모달(Permission)과 로컬 스토리지 캐시, Supabase 인증 세션은 한 번 통과하면 다시는 재현되지 않는 1회성 로직.
- **반복 검증 파이프라인**:
  1. `npm run build`
  2. `npx cap copy`
  3. `xcrun simctl erase <Device_ID>`
  4. `npx cap run ios`
- **시사점**: 네이티브 플러그인과 브라우저 JS가 결합된 구조상 코드 한 줄 변경 시에도 "최초 기동 시" 버그 재현을 위해 4단계를 무조건 반복해야 했으며, 이는 [6.1절]의 "구현보다 복원이 비싸므로 Line-by-Line 최소 변경" 원칙을 철저히 따라야 할 당위성을 증명함.

### 7.3 향후 구조 개선 제언
- 데이터 로딩과 View 렌더를 혼합하는 `async render()` 패턴을 지양하고, 부팅 파이프라인을 통제할 단일 `BootManager`나 상태 기계 도입의 필요성이 매우 큼을 재확인함.
