narrative AI - Render 기반 배포 및 운영 기획서

1. 배포 아키텍처 (Deployment Architecture)narrative AI는 클라이언트 사이드에서 모든 로직이 실행되는 SPA(Single Page Application) 구조이므로, Render의 Static Site 서비스를 이용하여 배포합니다.배포 방식: GitHub 레포지토리 연동형 지속적 배포 (CD)빌드 설정: 정적 HTML/JS 파일 구조 (별도 빌드 명령 불필요)보안 계층: API Key 노출 방지를 위한 환경 변수 및 프록시 고려

2. 프로젝트 파일 구조 (Project Structure)로컬 개발 및 테스트를 위해 아래와 같은 구조를 유지합니다./narrative-ai
├── index.html          # 메인 애플리케이션 코드 (UI 및 로직 통합)
├── .env                # 로컬 환경 변수 설정 (API Key 등)
├── .gitignore          # Git 제외 대상 설정 (보안)
├── assets/             # (옵션) 로컬 이미지 또는 아이콘
└── README.md           # 프로젝트 설명 및 실행 방법
A. .gitignore (보안 설정)API 키와 같은 민감한 정보가 GitHub에 업로드되지 않도록 반드시 설정해야 합니다.# .gitignore
.env
node_modules/
.DS_Store
B. .env (환경 변수 예시)로컬 테스트 시 사용할 변수입니다. (실제 Render 배포 시에는 대시보드에서 설정합니다.)GEMINI_API_KEY=your_api_key_here

3. 기술 스택 및 종속성 (Stack & Dependencies)A. 필수 Import 항목 (CDN)현재 코드의 안정적 실행을 위해 index.html 내에 반드시 포함되어야 할 항목들입니다.Tailwind CSS: UI 프레임워크 (https://cdn.tailwindcss.com)EXIF.js: 메타데이터 추출 라이브러리 (https://cdn.jsdelivr.net/npm/exif-js)Google Gemini API: 인공지능 멀티모달 추론용 (gemini-2.5-flash-preview-09-2025)B. 주요 함수 및 메소드 구조 (Logic)handleFile(file): 파일 읽기, base64 인코딩 및 EXIF 추출 호출.EXIF.getData(): 업로드 객체로부터 GPS(위도/경도), 날짜, 시간 태그 추출.fetchWithRetry(url, options): 지수 백오프를 이용한 API 호출 안정성 확보.renderInteractiveCaption(): 결과 데이터를 파싱하여 하이라이트 및 유의어 이벤트 바인딩.

4. Render 배포 가이드 (Step-by-Step)단계 1: 프로젝트 업로드GitHub에 새 레포지토리를 생성합니다.위 구조대로 파일을 업로드합니다. (단, .env는 제외)단계 2: Render 설정Render.com 로그인 후 New + > Static Site 선택.연결된 GitHub 레포지토리 선택.Build Command: 비워둠 (정적 사이트)Publish Directory: . (루트 경로)단계 3: 환경 변수(Environment Variables) 설정 (중요)Render 대시보드의 Environment 탭으로 이동합니다.GEMINI_API_KEY를 키 이름으로, 실제 발급받은 키를 값으로 입력합니다.주의: 클라이언트 사이드 JS에서 이 값을 가져오려면 별도의 API 서버(Node.js 등)를 거치거나, 프론트엔드 빌드 타임에 주입하는 과정이 필요합니다.

5. 운영 및 모니터링 계획A. 네트워크 최적화Retry 로직: API 호출 실패 시 자동 재시도 실행 (최대 5회).Cache 제어: Render의 기본 CDN 설정을 통해 로딩 속도 최적화.B. 예외 처리 (Error Handling)No Metadata: EXIF 정보가 없는 이미지 업로드 시에도 시각적 분석만으로 캡션을 생성하도록 예외 처리.API 할당량 관리: 무료 티어 사용 시 분당 호출 수(RPM) 초과 안내 메시지 구현.

6. 향후 확장 기술 (Post-Deployment)커스텀 도메인 연결: Render 대시보드에서 도메인 설정 가능.PWA(Progressive Web App): 모바일 사용자를 위한 앱 설치 환경 제공.최종 수정일: 2026. 01. 18.배포 전략: Render Static Hosting (Production Ready)

7. 리팩토링 및 개선 계획 (Refactoring Plan)

현재 코드와 문서 간의 실행 환경 불일치 및 보안 이슈를 해결하기 위해 다음과 같은 개선 작업을 진행합니다.

A. 실행 환경 통일 (Environment Unification)
- **이슈**: `main.js`는 Vite 환경(`import.meta.env`, ES Module)을 사용하나, 문서는 CDN 기반 정적 실행을 안내하고 있어 브라우저 에러 발생.
- **계획**: Vite를 공식 빌드 도구로 채택.
  - `package.json`에 빌드 스크립트(`npm run build`) 명시.
  - Render 배포 설정을 Static Site(Build Output: `dist`)로 변경.

B. 보안 강화 (Security Enhancements)
- **이슈**: 클라이언트 사이드에서 API Key가 노출됨.
- **계획**:
  - **단기**: Google Cloud Console에서 API Key에 **HTTP Referrer 제한** 설정 (배포 도메인만 허용).
  - **장기**: Netlify Functions 또는 Render Web Service를 도입하여 API 호출을 백엔드로 위임(Proxy).

C. 코드 품질 개선 (Code Quality)
- **프롬프트 분리**: `main.js` 내의 긴 프롬프트 문자열을 별도 상수나 함수로 분리하여 가독성 확보.
- **안전성 강화**: AI 응답(JSON) 파싱 실패에 대비한 예외 처리 로직(Markdown 코드 블록 제거 등) 추가.