# RECOCO (narrative AI) - Image Metadata-Based Storytelling Platform

**RECOCO**는 업로드된 이미지와 EXIF 메타데이터(위치, 시간, 날짜)를 분석하여 다양한 소셜 미디어 플랫폼에 최적화된 서사를 생성해주는 AI 어시스턴트입니다.

> **Architecture Update**: 본 프로젝트는 보안 강화 및 서버 측 로직 처리를 위해 **FastAPI 백엔드**와 **Vanilla JS 프론트엔드**가 결합된 클라이언트-사이드 아키텍처로 진화했습니다.

---

## 1. 주요 기능 (Key Features)

- **멀티모달 AI 분석**: Google Gemini API를 활용하여 이미지 인식 및 고품질 캡션 생성.
- **EXIF 데이터 추출**: 이미지의 GPS 좌표, 촬영 일시를 자동으로 추출하여 컨텍스트 기반의 서사 생성.
- **감정의 온도 (New)**: 사용자의 현재 감정 상태(🔵 차가움 / 🟡 미지근함 / 🔴 뜨거움)를 선택하여 문체와 톤 제어.
- **플랫폼별 최적화**: Instagram, Threads, Blog 등 각 SNS 특성에 맞는 텍스트 스타일 제공.
- **인터랙티브 에디팅**: 생성된 문장 내 주요 키워드를 클릭하여 AI가 추천하는 유의어로 즉시 변경 가능.
- **보안 설계**: API Key를 백엔드에서 안전하게 관리하여 클라이언트 노출 방지.

## 2. 기술 스택 (Tech Stack)

### Frontend
- **Core**: Vanilla JavaScript (ES Modules)
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **Libraries**: `exifreader` (Metadata extraction)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Package Manager**: `uv` (Fast Python package manager)
- **AI Integration**: Google Gemini API (via Vertex AI/Google AI SDK)

## 3. 프로젝트 구조 (Project Structure)

```bash
narrative-ai/
├── backend/                # FastAPI 백엔드 서버
│   ├── app/
│   │   ├── main.py         # 진입점 및 프록시 설정
│   │   ├── routers/        # API 엔드포인트 (narrative, synonyms)
│   │   └── services/       # Gemini API 연동 로직
│   ├── pyproject.toml      # Python 의존성 관리
│   └── run.py              # 서버 실행 스크립트 (Port 정리 포함)
├── src/                    # 프론트엔드 소스 코드
│   ├── components/         # UI 컴포넌트 (DropZone, Modal 등)
│   ├── services/           # 백엔드 연동 서비스
│   └── state/              # 상태 관리 (StateManager)
├── index.html              # 메인 엔트리
├── main.js                 # 애플리케이션 오케스트레이션
└── README.md               # 프로젝트 문서
```

## 4. 로컬 실행 방법 (Setup)

### Step 1: Backend 실행
```bash
cd backend
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -e .
python run.py --dev        # 8000 포트에서 실행
```

### Step 2: Frontend 실행
```bash
# Root 디렉토리에서
npm install
npm run dev                # http://localhost:5173
```

---

# 프로젝트 기술 인터뷰 및 로직 문서

---

## Development Interview: RECOCO Rebranding & Feature Addition (New)

### 배경 (Background)
- 서비스명을 기존 `vakita AI`에서 `RECOCO`로 변경하고, 이에 맞춘 전반적인 브랜드 아이덴티티(BI) 리뉴얼이 필요합니다.
- 기존의 노랑/남색 중심의 디자인에서 블랙 & 화이트 톤의 모던한 디자인으로 전환하고, 특정 요소에 포인트 컬러를 적용합니다.

### 문제 (Problem)
1. **브랜드명 및 로고 불일치**: UI 곳곳에 남아있는 `vakita AI` 명칭과 로고를 새로운 `RECOCO` 워드마크 및 캐릭터 로고로 교체해야 합니다.
2. **디자인 테마 노후화**: 기존의 연노랑/남색 조합을 걷어내고, 블랙 & 화이트 기반의 세련된 UI로 변경해야 합니다.
3. **가독성 및 폰트**: 기울임꼴이 적용된 폰트를 제거하고, 표준적이고 깔끔한 `Noto Sans KR`로 통일해야 합니다.
4. **신규 기능 부재**: 사용자의 감정 상태를 직관적으로 선택할 수 있는 "감정의 온도" UI가 필요합니다.

### 목표 (Goal)
1. **서비스명 변경**: 모든 텍스트 요소를 `RECOCO`로 변경합니다.
2. **로고 교체**:
   - 워드마크: 텍스트 기반에서 제공된 SVG 이미지(`word_mark_IMG_0056.svg`)로 변경.
   - 캐릭터 로고: 기존 이미지에서 제공된 SVG 이미지(`character_logo_IMG_0055.svg`)로 변경.
3. **색상 체계 개편**:
   - 기반: 블랙 (#000000) & 화이트 (#FFFFFF).
   - 포인트 컬러: `#B2A5CF` (버튼 및 강조 요소).
4. **폰트 적용**: `Noto Sans KR` 적용 및 모든 `italic` 스타일 제거.
5. **신규 UI 추가**: "감정의 온도" (🔵 차가움 / 🟡 미지근함 / 🔴 뜨거움) 선택용 Segmented UI 구현.

---

## 7. 가이드라인: 감정의 온도 UI (Emotion Temperature)

- **UI 형태**: Segmented Control (세그먼트 버튼)
- **옵션**: 🔵 차가움 (Cold) / 🟡 미지근함 (Lukewarm) / 🔴 뜨거움 (Hot)
- **로직**: 선택된 값은 AI 프롬프트 생성 시 "현재 사용자의 감정 온도" 컨텍스트로 주입됩니다.

---

## Development Interview: Metadata UI & Error Fix (Revised)

### 배경 (Background)
- `exif-js` 라이브러리의 Strict Mode 호환성 이슈로 인한 `Uncaught ReferenceError: n is not defined` 발생 확인.
- UI에서 불필요한 파일 정보 노출 및 CSS 우선순위 충돌 문제 해결 필요.

### 목표 (Goal)
1. **라이브러리 교체**: `exif-js`를 제거하고 **`exifreader`** 라이브러리로 교체.
2. **UI/CSS 수정**: `.metadata-pill`의 `hidden` 클래스 정상화 및 파일명/용량 정보 제거.
3. **날짜/위치 포맷**: `YYYY-MM-DD HH:MM` 형식 및 정규화된 GPS 데이터 표시.

---

## 1. 이미지 최적화 및 화질 저하 로직 (Image Optimization)

- **해상도 제어**: 긴 변 최대 1024px, 전체 면적 1MP 이하 유지.
- **압축 설정**: JPEG 품질 0.85 (85%) 적용.
- **목적**: 생성 속도 향상 및 API 토큰 비용 최적화.

---

## 2. 프로젝트 전체 기술 스택 및 주요 로직 (System Architecture)

### 핵심 비즈니스 로직
- **메타데이터 처리**: GPS(DMS to Decimal) 변환 및 데이터 정규화.
- **AI 인터랙티브 캡션**: 키워드 하이라이팅 및 유의어 실시간 교체 로직.
- **안정성**: `fetchWithRetry`를 통한 네트워크 오류 대응 (최대 5회).

---

## 3. 프로젝트 구조 및 아키텍처 개선 제안 (Refactoring Proposal)

### 모듈화 전략
- `GeminiService`: API 통신 전담 클래스.
- `ImageProcessor`: 이미지 리사이징 및 메타데이터 추출.
- `StateManager`: 중앙 집중식 상태 관리.
- `Component-based UI`: DropZone, ResultViewer 등 독립적 컴포넌트화.

---

## 4. 보안 및 배포 (Security & Deployment)

### API Key 보안
- 브라우저 노출 방지를 위해 **백엔드 프록시 서버** 도입 필수.
- 모든 API 요청은 클라이언트 -> 백엔드 -> Gemini 순으로 전달됨.

---

## 5. 알려진 이슈 (Known Issues)

- **Render 배포 오류**: `exif-js` 의존성 문제 해결 완료 (`exifreader` 교체).
- **Tailwind v4 적용**: CDN 방식 배포 지양 및 PostCSS 빌드 파이프라인 구축 완료.

---

## 12. 최신 수정 사항 (Latest Updates) - 2026-01-23

1. **기능 수정**: 단어 하이라이트(Word Suggestion) 정확도 향상을 위한 백엔드 프롬프트 강화.
2. **안정성 강화**: Gemini API `responseSchema` 적용 (Structured Output 보장).
3. **에러 핸들링**: 429(Rate Limit) 및 네트워크 오류에 대한 구체적인 한글 피드백 제공.

---
**최종 수정일**: 2026. 01. 23.
**개발자**: Jaehyun Tak
