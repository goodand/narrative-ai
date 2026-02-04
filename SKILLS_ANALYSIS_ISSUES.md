# Skills 분석 이슈 리포트

> 분석일: 2026-02-04
> 프로젝트: narrative-ai
> 분석 도구: codebase-architecture-mapper, depsolve-analyzer, graph-structure-classifier

---

## 1. 즉시 해결 필요 (HIGH)

### 1.1 Phantom Dependencies (유령 의존성)

코드에서 사용하지만 `requirements.txt`에 선언되지 않은 패키지들:

| 패키지 | 사용 위치 | 심각도 |
|--------|-----------|--------|
| `pydantic_settings` | `backend/app/config.py:8` | HIGH |
| `pydantic` | `backend/app/models/schemas.py:7` | HIGH |
| `requests` | `backend/app/services/geocoding.py:1` | HIGH |

**문제점:**
- 새 환경에서 `pip install -r requirements.txt` 실행 시 import 에러 발생
- CI/CD 파이프라인 실패 가능성
- Docker 이미지 빌드 실패 가능성

**해결 방법:**
```bash
# backend/requirements.txt에 추가
pydantic>=2.0.0
pydantic-settings>=2.0.0
requests>=2.28.0
```

---

## 2. 버전 충돌 (MEDIUM)

### 2.1 Diamond Dependencies (다이아몬드 의존성)

동일 패키지를 서로 다른 버전으로 요구하는 의존성 충돌:

#### 2.1.1 postcss 충돌
```
narrative-ai
├── vite ──────────────► postcss@^8.5.6
└── @tailwindcss/postcss ► postcss@^8.4.41
```
**영향:** CSS 빌드 시 예기치 않은 동작 가능

#### 2.1.2 tslib 충돌
```
narrative-ai
├── @capacitor/cli ──► tslib@^2.4.0
└── @capacitor/core ─► tslib@^2.1.0
```
**영향:** Capacitor 플러그인 호환성 문제 가능

#### 2.1.3 @ionic 유틸리티 충돌 (다수)
```
@capacitor/cli
├── @ionic/cli-framework-output ─► @ionic/utils-terminal@2.3.5
├── @ionic/utils-subprocess ─────► @ionic/utils-terminal@2.3.3
└── native-run ──────────────────► @ionic/utils-terminal@^2.3.4
```

#### 2.1.4 debug 패키지 충돌
```
@capacitor/cli
├── @ionic/cli-framework-output ─► debug@^4.0.0
├── @ionic/utils-fs ─────────────► debug@^4.0.0
├── @ionic/utils-subprocess ─────► debug@^4.0.0
└── native-run ──────────────────► debug@^4.3.4
```

#### 2.1.5 xmlbuilder 충돌
```
@capacitor/cli
├── plist ───► xmlbuilder@^15.1.1
└── xml2js ──► xmlbuilder@~11.0.0
```
**영향:** iOS 빌드 시 plist 파싱 문제 가능

**해결 방법:**
```bash
# package.json에 resolutions 추가 (yarn) 또는 overrides (npm)
{
  "resolutions": {
    "postcss": "^8.5.6",
    "tslib": "^2.6.0",
    "debug": "^4.3.4"
  }
}
```

---

## 3. 구조적 이슈 (INFO)

### 3.1 순환 의존성 (외부 라이브러리)

| 위치 | 순환 경로 | 영향 |
|------|-----------|------|
| click 패키지 | `click/__init__.py` ↔ `click/core.py` | 외부 라이브러리 내부 - 무시 가능 |

**참고:** 프로젝트 자체 코드(src/)에는 순환 의존성 없음 (DAG 구조)

### 3.2 Hub 모듈 (높은 결합도)

여러 모듈에서 import하는 핵심 모듈들:

| 모듈 | In-degree | 역할 |
|------|-----------|------|
| `components/Modal.js` | 5 | UI 공통 컴포넌트 |
| `services/supabase.js` | 4 | 데이터베이스 연결 |
| `constants/config.js` | 4 | 설정값 |
| `utils/fetch.js` | 3 | API 호출 |
| `processors/ImageProcessor.js` | 3 | 이미지 처리 |

**권장:** 이 모듈들 변경 시 영향 범위 테스트 필수

---

## 4. Skills 실행 중 발생한 기술적 이슈

### 4.1 경로 문제
- **문제:** 한글 경로(`현재 진행중인`)가 포함된 디렉토리에서 bash 명령어 실패
- **해결:** 경로를 따옴표로 감싸야 함 (`"경로"`)

### 4.2 Python 명령어
- **문제:** `python` 명령어 미존재 (macOS)
- **해결:** `python3` 사용 필요

### 4.3 대용량 출력
- **문제:** mapper 출력이 2MB 초과하여 파일로 저장됨
- **해결:** `--exclude` 옵션으로 node_modules, .venv 등 제외 필수

---

## 5. 조치 체크리스트

### 즉시 (HIGH)
- [ ] `backend/requirements.txt`에 pydantic, pydantic-settings, requests 추가
- [ ] `pip freeze > requirements.txt` 또는 수동 버전 명시

### 단기 (MEDIUM)
- [ ] `npm ls postcss` 확인 후 버전 통일
- [ ] @capacitor 관련 패키지 최신 버전으로 업데이트
- [ ] package.json에 resolutions/overrides 추가 검토

### 장기 (LOW)
- [ ] Hub 모듈 테스트 커버리지 강화
- [ ] 의존성 업데이트 자동화 (dependabot, renovate)

---

## 6. 분석 통계

| 항목 | 값 |
|------|-----|
| 총 분석 파일 | 2,307개 |
| 의존성 관계 | 2,458개 |
| Diamond 의존성 | 17개 |
| Phantom 의존성 | 3개 |
| 순환 의존성 (프로젝트) | 0개 |
| Hub 모듈 | 6개 |

---

## 참조

- 생성된 아키텍처 문서: `PROJECT_ARCHITECTURE.md`
- Skills 경로: `.claude/skills/`
