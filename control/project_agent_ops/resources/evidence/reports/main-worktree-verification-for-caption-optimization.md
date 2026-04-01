# Main Worktree Verification For Caption Optimization

## Current State Snapshot

- 판정: `차단`
- 검사 시점 기준 브랜치: `main`
- HEAD: `b09fee840b25cb9765b68c5f54b8c94b15725cd8`
- `git status --short --branch` 결과상 `main...origin/main` 상태이며, 로컬 작업트리는 dirty 상태다.
- 현재 dirty 상태는 최소 4개 축으로 섞여 있다.
  - iOS 인증/리소스 변경
  - iOS smoke 시나리오 변경
  - `HomeManager` / `PhotoService` 모듈 분해 리팩터
  - 로컬 문서/계획/DB 아티팩트

현재 상태에서 바로 `Gemini caption generation optimization` 구현을 시작하면, 코드 충돌보다 먼저 PR 범위 오염과 검증 경로 오염이 발생한다.

## Dirty Change Inventory

| Path | Status | 성격 | 수준 | Evidence | Caption Optimization와의 관계 |
| --- | --- | --- | --- | --- | --- |
| `.gitignore` | modified | iOS credential 파일 ignore 추가 | 주의 | `.gitignore:10-14` 에 `ios/App/App/credentials.plist` 추가 | 직접 충돌 없음. 별도 iOS 인증 작업 흔적 |
| `.maestro/flows/ios/onboarding-auth-smoke.yaml` | modified | 온보딩 smoke assertion 변경 | 주의 | `.maestro/flows/ios/onboarding-auth-smoke.yaml:7-15` 에서 onboarding 단계 assertion 변경 | 직접 충돌 없음. QA 범위 변경 |
| `ios/App/App.xcodeproj/project.pbxproj` | modified | `credentials.plist` 리소스 등록 | 주의 | `project.pbxproj:17,39,101,215` 에 `credentials.plist` 추가 | 직접 충돌 없음. iOS auth feature 성격 |
| `ios/App/App/Info.plist` | modified | Google Sign-In URL scheme 추가 | 주의 | `ios/App/App/Info.plist:52-69` | 직접 충돌 없음. iOS auth feature 성격 |
| `src/components/HomeManager.js` | modified | 홈 화면 로직을 `src/components/home/*` 로 분해 중 | 차단 | `src/components/HomeManager.js:6-10`, `:27-29`, `:73-79` | caption 진입 경로의 upstream. 간접 충돌 큼 |
| `src/services/PhotoService.js` | modified | 사진 서비스 로직을 `src/services/photo/*` 로 분해 중 | 차단 | `src/services/PhotoService.js:7-11`, `:19-32`, `:59-91` | caption 생성 후 기록/refresh 경로와 연결됨 |
| `src/components/home/` | untracked | `HomeManager.js` 가 이미 import 중인 신규 runtime 모듈 | 차단 | `src/components/HomeManager.js:8-10` 이 untracked 파일을 직접 import | 과거 흔적이 아니라 현재 미완료 refactor 일부 |
| `src/services/photo/` | untracked | `PhotoService.js` 가 이미 import 중인 신규 runtime 모듈 | 차단 | `src/services/PhotoService.js:8-11` 이 untracked 파일을 직접 import | 과거 흔적이 아니라 현재 미완료 refactor 일부 |
| `context_portal/` | untracked | 별도 DB/migration 로컬 작업공간 | 주의 | `context_portal/alembic.ini`, `context_portal/context.db`, `__pycache__` 존재 | caption과 직접 무관. PR scope 오염 요소 |
| `docs/demo-checklist.md` | untracked | Render demo readiness 문서 | 주의 | `docs/demo-checklist.md:1-120` | caption과 직접 무관. 문서성 변경 |
| `plans/gemini/gemini_feedback.md` | untracked | tool hook/feedback 로그 누적 파일 | 주의 | `plans/gemini/gemini_feedback.md:4-120` 에 `.claude` skill 평가 로그 기록 | caption 설계 문서라기보다 분석 로그. PR 포함 비권장 |

### `src/components/home/` 와 `src/services/photo/` 의 의미

- 판정: `과거/실험 흔적`이 아니라 `현재 진행 중인 구조 분해`다.
- 근거:
  - `src/components/HomeManager.js:8-10` 이 `homeLoadRuntime.js`, `homeDeleteRuntime.js`, `homeImageRuntime.js` 를 import 한다.
  - `src/services/PhotoService.js:8-11` 이 `dailyCurationRuntime.js`, `detailHydrator.js`, `mutationRuntime.js`, `legacyRankingRuntime.js` 를 import 한다.
  - untracked 파일 내부도 실제 runtime 구현이다.
    - `src/components/home/homeLoadRuntime.js:4-46`
    - `src/services/photo/mutationRuntime.js:4-41`
- 결론: 현재 `main` 작업트리에는 flat 구조에서 split 구조로 이동하는 refactor가 반쯤 풀린 상태로 존재한다.

## Conflict With Caption Optimization

### A. 직접 overlap

아래 caption optimization 후보 파일은 현재 dirty 상태와 직접 겹치지 않는다.

- `main.js`
- `src/services/GeminiService.js`
- `src/components/InputManager.js`
- `src/components/ResultViewer.js`
- `backend/app/routers/narrative.py`
- `backend/app/services/gemini.py`

근거:

- `git status --short -- <target-files>` 결과가 비어 있다.
- `git diff --name-only -- <target-files>` 결과도 비어 있다.

즉, 현재 dirty 상태는 위 6개 파일을 직접 수정하고 있지는 않다.

### B. 간접 구조 충돌

직접 overlap은 없지만, caption 흐름은 이미 dirty refactor 코드에 의존한다.

1. `main.js` 는 caption 생성 orchestration의 중심이다.
   - `main.js:18-21` 에서 `GeminiService` 와 `photoService` 를 함께 import 한다.
   - `main.js:188-204` 에서 `HomeManager` 의 선택 사진을 `InputManager.setPreviewImage()` 로 넘기고 `input` view 로 이동한다.
   - `main.js:254-329` 에서 caption 생성, synonyms 조회, 결과 렌더, 그리고 native metadata가 있을 경우 `photoService.recordCurationAction()` 및 `refreshDailyCurationAfterMutation()` 까지 실행한다.

2. `InputManager` 는 `HomeManager` 가 넘긴 이미지/metadata를 그대로 caption 입력 상태로 채운다.
   - `src/components/InputManager.js:119-133`

3. `PhotoService` dirty refactor는 caption 생성 후 post-action 경로와 연결된다.
   - `main.js:298-312`
   - `src/services/PhotoService.js:59-91`

4. `HomeManager` dirty refactor는 caption 진입 직전 경로와 연결된다.
   - `main.js:188-204`
   - `src/components/HomeManager.js:35-60`

### C. scope drift: `synonyms 비활성` 전제와 현재 런타임 불일치

이번 최적화 전제는 `synonyms` 비활성 처리이지만, 현재 런타임은 아직 synonyms 호출을 적극 사용한다.

- 프론트:
  - `main.js:279-285` 에서 `geminiService.getSynonyms(...)` 호출
  - `src/services/GeminiService.js:102-133` 에서 `/api/v1/synonyms` 호출
- 백엔드:
  - `backend/app/routers/synonyms.py:12-39` 에 `/api/v1/synonyms` endpoint 존재
  - `backend/app/services/gemini.py:244-297` 에 synonyms generation 로직 존재

결론:

- caption optimization 범위를 `caption generation only` 로 유지하려면, 현재 코드 기준으로는 `synonyms` 를 건드리지 않고 두는지, 아니면 이번 작업에서 비활성화까지 포함하는지 먼저 명시해야 한다.
- 이 scope drift는 구현 난이도보다 PR 경계 정의 문제다.

### D. 파일별 충돌 판정

| Target File | 현재 상태 | 판정 | 이유 |
| --- | --- | --- | --- |
| `main.js` | clean | 주의 | 직접 dirty는 없지만 caption orchestration hub 이고 dirty `HomeManager` / `PhotoService` 와 연결됨 |
| `src/services/GeminiService.js` | clean | 안전 | 직접 dirty 없음. 단, synonyms path가 살아 있어 scope drift 존재 |
| `src/components/InputManager.js` | clean | 주의 | `HomeManager` 가 주입한 이미지/metadata에 의존 |
| `src/components/ResultViewer.js` | clean | 안전 | 직접 dirty 없음. 결과 렌더만 담당 |
| `backend/app/routers/narrative.py` | clean | 안전 | 직접 dirty 없음. narrative endpoint 독립성 높음 |
| `backend/app/services/gemini.py` | clean | 안전 | 직접 dirty 없음. 다만 synonyms 로직이 같은 서비스 내부에 공존 |

## Merge/PR Readiness Verdict

### 명시적 판정

- `1. main에서 바로 구현 가능`
  - 판정: `아님`
- `2. 새 branch/worktree에서 구현 후 PR`
  - 판정: `맞음`
- `3. 기존 구조 정리 변경을 먼저 정리/merge한 뒤 구현`
  - 판정: `부분적으로 맞음`
  - 이유: 특히 `HomeManager` / `PhotoService` refactor 출처는 caption 작업과 섞이면 안 된다.
- `4. 현재 dirty 상태의 출처를 먼저 정리해야 함`
  - 판정: `최우선으로 맞음`

### 최종 verdict

현재 `main` 작업트리는 `caption optimization` 기준으로 `PR readiness = 차단` 이다.

차단 사유는 다음 두 가지다.

- dirty 상태가 하나의 작업이 아니라 `iOS auth + smoke + home/photo refactor + local artifacts` 로 섞여 있다.
- caption 경로가 직접 dirty 파일을 건드리지는 않지만, 런타임상 dirty `HomeManager` / `PhotoService` refactor에 의존한다.

따라서 현재 상태에서 `main` 위에 바로 구현을 얹는 것은 안전하지 않다.

## Recommended Next Action

### 추천 전략

`4 -> 2` 순서로 진행하는 것이 가장 안전하다.

1. 먼저 현재 dirty 상태의 출처를 분리한다.
   - `HomeManager.js` / `PhotoService.js` / `src/components/home/` / `src/services/photo/` 는 하나의 refactor change set 으로 본다.
   - iOS auth 및 smoke 변경은 별도 change set 으로 본다.
   - `context_portal/`, `plans/gemini/gemini_feedback.md`, `docs/demo-checklist.md` 는 feature PR 범위에서 분리한다.

2. caption optimization 구현은 `clean origin/main` 기준 새 branch/worktree에서 시작한다.
   - 권장 이유: 현재 dirty worktree와 기능 PR을 분리하면 merge base와 PR 설명이 명확해진다.

3. caption optimization PR 범위는 아래 파일로 최대한 제한한다.
   - `main.js`
   - `src/services/GeminiService.js`
   - `src/components/InputManager.js`
   - `src/components/ResultViewer.js`
   - `backend/app/routers/narrative.py`
   - `backend/app/services/gemini.py`

4. 구현 전에 `synonyms` 처리 방침을 먼저 잠근다.
   - 옵션 A: 이번 PR에서는 synonyms 호출 유지, caption generation 경로만 최적화
   - 옵션 B: 이번 PR에서 synonyms 비활성화까지 포함

### 한 줄 권고

현재 `main` 에서 바로 구현하지 말고, 먼저 dirty change 출처를 분리한 뒤 `clean main` 기반 새 branch/worktree에서 caption optimization 전용 PR로 진행하는 것이 안전하다.
