# RECOCO

RECOCO는 사진 메타데이터와 이미지 내용을 바탕으로 `삭제할 이미지를 추천`해 주는 디지털 디톡스 앱입니다. 현재 코드베이스는 `Vite + Vanilla JS + Capacitor iOS + FastAPI` 조합으로 운영되며, 사진 캐러셀을 얼마나 빠르게 띄우고 삭제 흐름을 얼마나 매끄럽게 이어 가는지가 핵심 제품 가치입니다.

현재 이 저장소의 우선 목표는 `private GitHub push + CI readiness`입니다. 이 README는 그 목적에 맞는 실행/검증 안내를 먼저 두고, 기존 문서가 담고 있던 제품 의도와 설계 히스토리는 아래에 별도 섹션으로 보존합니다.

## 현재 프로젝트 의도

- 사진 메타데이터와 이미지 내용을 바탕으로 삭제 추천 후보를 빠르게 계산한다.
- 홈 캐러셀을 빠르게 띄워 사용자가 바로 삭제 결정을 내릴 수 있게 한다.
- 삭제 후 다음 카드, 통계, 리포트 반영까지의 흐름을 짧게 유지한다.
- 기록/스토리 생성은 보조 흐름으로 유지하되, 디지털 디톡스 경험을 해치지 않게 둔다.
- API 키와 AI 호출은 백엔드 경유 구조를 우선한다.

## 핵심 사용자 흐름

1. 앱 진입
2. 홈 캐러셀 표시
3. 추천된 사진에 대해 `고마웠어`로 삭제 또는 `소중해`로 보류/기록
4. 삭제/기록 후 홈과 리포트 상태 갱신

이 방향 때문에 현재 최적화의 중심은 `AI 생성 속도`보다 `launch_to_carousel`, `thumbnail 전달`, `delete 후 다음 카드 노출`, `report 반영`에 있습니다.

## 저장소 구조

- `src/`, `main.js`
  프론트엔드 애플리케이션 코드
- `ios/App/`
  Capacitor iOS 프로젝트와 native photo plugin
- `backend/`
  FastAPI 백엔드와 백엔드 전용 설정
- `.maestro/`, `scripts/maestro/`
  iOS smoke 자동화 도구
- `.github/workflows/`
  private GitHub CI workflow

## 환경 변수

루트 기준 템플릿:

```bash
cp .env.example .env
```

- 프론트엔드는 루트 `.env`를 읽습니다.
- Vite build/runtime은 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, 선택적으로 `VITE_API_BASE_URL`을 사용합니다.
- 개발용 프록시 포트는 `VITE_BACKEND_PORT`로 조정할 수 있습니다.
- 백엔드는 process env를 직접 읽거나, `backend/`에서 실행할 때 `backend/.env`를 읽습니다.
- 백엔드 세부 설명은 [backend/README.md](backend/README.md)를 참고하세요.

## 로컬 실행

프론트엔드:

```bash
npm install
npm run dev
```

백엔드:

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .
uvicorn app.main:app --reload --port 8000
```

웹 자산 변경 후 iOS 프로젝트 반영:

```bash
npm run build
npx cap sync ios
```

## 로컬 검증

프론트엔드 build smoke:

```bash
npm test
```

현재 `npm test`는 `npm run build`에 매핑됩니다.

백엔드 health smoke:

```bash
python -m pip install -e ./backend
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
curl http://127.0.0.1:8000/health
```

제품 방향 기준으로 우선 검증할 항목:

- 홈 캐러셀 첫 표시 속도
- 썸네일/캐러셀 이미지 로드 안정성
- `고마웠어` 삭제 후 다음 카드 전환
- 삭제 후 통계와 리포트 반영
- same-day refresh와 daily curation 재계산

## Maestro

설치:

```bash
npm run maestro:install
npm run maestro:install:ios
```

온보딩 smoke:

```bash
npm run maestro:test:ios
```

로컬 recording:

```bash
npm run maestro:record:ios
```

상세 사용법은 [docs/testing/maestro.md](docs/testing/maestro.md)에 있습니다.

## GitHub Actions

현재 private-repo 기준 workflow:

- [ci.yml](.github/workflows/ci.yml)
  frontend build + backend `/health` smoke
- [build-ios.yml](.github/workflows/build-ios.yml)
  iOS simulator app build artifact

이 저장소는 CI만으로 출시 준비 완료를 주장하지 않습니다. 특히 `캐러셀 첫 표시`, `delete/report`, `recorded/refresh` 같은 런타임 핵심 흐름은 별도 release gate로 남겨 둡니다.

## 체크리스트

- [docs/release-checklist.md](docs/release-checklist.md)
- [docs/github-readiness-checklist.md](docs/github-readiness-checklist.md)
- [docs/testing/maestro.md](docs/testing/maestro.md)

## 설계 히스토리와 문서 의도

기존 README는 단순 실행 안내만이 아니라 아래 성격의 문서를 함께 담고 있었습니다.

- RECOCO 리브랜딩과 BI/톤앤매너 정리
- 감정의 온도 UI 추가 의도
- 메타데이터 처리 UI/라이브러리 교체 배경
- 이미지 최적화, 에러 처리, 프롬프트 구조 개선 메모
- 보안과 배포에 대한 초기 방향성

현재는 그 위에 제품 방향이 한 번 더 정리됐습니다.

- 메인 제품 정체성: `삭제할 이미지를 추천하는` 디지털 디톡스 앱
- 성능 우선순위: `캐러셀 표시 속도`와 `삭제 액션 연속성`
- AI 기록 생성: 메인 플로우를 보조하는 서브 플로우

즉, 원래 README의 의도는 `프로젝트 소개 + 운영 가이드 + 설계 인터뷰 메모`를 한 파일에 함께 두는 것이었습니다. 현재는 private GitHub CI 준비가 우선이므로 상단은 운영 안내로 정리했지만, 이 문서가 단순한 설치 문서만은 아니었다는 점은 유지합니다.

## 운영 메모

- private GitHub CI 준비와 런타임 코어 앱 변경은 가능하면 분리해서 커밋합니다.
- CI, 문서, 환경 변수 정리는 좁은 배치로 먼저 정리하는 편이 안전합니다.
- 캐러셀/삭제 성능 최적화는 이 앱의 메인 가치에 직접 연결되므로, 회귀가 나면 우선순위를 가장 높게 둡니다.
