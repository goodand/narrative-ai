narrative AI - 이미지 메타데이터 기반 스토리텔링 플랫폼

narrative AI는 업로드된 이미지의 EXIF 메타데이터(위치, 시간, 날짜 등)를 분석하여 플랫폼별 최적화된 서사를 생성해주는 AI 어시스턴트입니다.

1. 프로젝트 개요 (Overview)

이 프로젝트는 단순히 이미지를 인식하는 것을 넘어, 사진이 찍힌 **장소(GPS)**와 시간이라는 컨텍스트를 활용하여 사용자에게 더 깊이 있는 기록을 제공하는 것을 목적으로 합니다. Render의 Static Site 서비스를 통해 빠르고 안정적으로 배포되도록 설계되었습니다.

2. 주요 기능 (Core Features)

멀티모달 AI 분석: Google Gemini API를 활용한 고성능 이미지 인식 및 캡션 생성.

EXIF 데이터 추출: 이미지에 포함된 위도, 경도, 촬영 날짜 및 시간을 실시간으로 분석.

커스텀 시스템 프롬프트: AI의 페르소나를 사용자가 직접 설정하여 문체와 톤 제어 가능.

플랫폼별 최적화: Instagram, Threads, 블로그 등 각 SNS 특성에 맞는 텍스트 스타일 제공.

인터랙티브 에디팅: 생성된 문장 중 주요 키워드를 클릭하여 AI가 추천하는 유의어로 즉시 변경 가능.

3. 기술 스택 (Tech Stack)

Frontend: Vanilla JS, Tailwind CSS, HTML5

AI Engine: Google Gemini 2.5 Flash Preview

Libraries: EXIF.js (Metadata extraction)

Deployment: Render (Static Site)

4. 프로젝트 파일 구조 (Project Structure)

/narrative-ai
├── index.html          # 메인 애플리케이션 코드 (UI 및 로직 통합)
├── .env                # 로컬 환경 변수 설정 (API Key 등) - Git 제외 대상
├── .gitignore          # Git 제외 대상 설정 (보안)
├── assets/             # 로컬 이미지 및 정적 자산
└── README.md           # 프로젝트 상세 설명


5. 설치 및 로컬 실행 방법 (Setup)

레포지토리를 클론합니다.

git clone [https://github.com/your-username/narrative-ai.git](https://github.com/your-username/narrative-ai.git)


의존성 패키지를 설치합니다.

npm install


루트 디렉토리에 .env 파일을 생성하고 API 키를 입력합니다. (Vite 환경 변수 규칙 준수)

VITE_GEMINI_API_KEY=your_api_key_here

개발 서버를 실행합니다.

npm run dev

6. 배포 가이드 (Deployment on Render)

단계 1: 보안 설정 (.gitignore)

API 키 노출 방지를 위해 .gitignore에 반드시 아래 내용을 포함하세요.

.env
node_modules/
.DS_Store


단계 2: Render 대시보드 설정

New Static Site를 생성하고 GitHub 레포지토리를 연결합니다.

Build Command: npm run build

Publish Directory: dist

Environment Variables: 대시보드에서 VITE_GEMINI_API_KEY를 추가합니다.

7. 라이선스 (License)

이 프로젝트는 MIT License를 따릅니다.

최종 수정일: 2026. 01. 18.
개발자: Jaehyun Tak