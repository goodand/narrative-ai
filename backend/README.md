# RECOCO Backend API

FastAPI 기반 RECOCO 백엔드 프록시 서버

## Quick Start (uv 사용)

### 1. 가상환경 생성 및 의존성 설치

```bash
cd backend

# uv로 가상환경 생성
uv venv

# 가상환경 활성화
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# 의존성 설치
uv pip install -e .
```

### 1-1. 개발용 CLI 도구 설치

`skm`은 사용자 레벨 skill 디렉토리(`~/.claude/skills`, `~/.codex/skills` 등)를 관리하는 도구이므로,
동작 범위는 사용자 레벨이지만 설치는 이 프로젝트의 `backend/.venv` 안에서 재현 가능하게 맞춘다.

```bash
cd backend

# 기존 .venv에 tools 그룹까지 동기화
uv sync --group tools

# 또는 즉시 실행
uv run --group tools skm --help
```

편의 실행 스크립트:

```bash
./scripts/skm.sh --help
```

프로젝트 고정 설정 파일:

- config: `backend/skills.yaml`
- lock: `backend/skills-lock.yaml`
- local store: `backend/.skm/store`

### 2. 환경변수 설정

```bash
cp .env.example .env
# .env 파일에 GEMINI_API_KEY 입력
```

### 3. 개발 서버 실행

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. API 문서 확인

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Developer Tools

### SKM (Skill Manager)

전역 `uv tool install ...` 대신 프로젝트 가상환경에서 실행하려면 아래 기준을 사용한다.

```bash
cd backend
uv sync --group tools
uv run --group tools skm list
```

또는:

```bash
cd backend
./scripts/skm.sh list
./scripts/skm.sh install
```

주의:

- `skm`이 관리하는 대상 디렉토리는 여전히 사용자 홈 기준이다.
- 즉 설치 위치만 `backend/.venv`로 통일한 것이고, skill 저장 위치 자체를 프로젝트 로컬로 바꾸는 것은 아니다.
- 다만 config/lock/store는 프로젝트 로컬(`backend/skills.yaml`, `backend/skills-lock.yaml`, `backend/.skm/store`)로 고정했다.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Detailed health status |
| POST | `/api/v1/narrative` | 이미지 기반 스토리 생성 |
| POST | `/api/v1/synonyms` | 키워드 유의어 추천 |

## 프로젝트 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 진입점
│   ├── config.py            # 환경변수 관리
│   ├── routers/
│   │   ├── narrative.py     # /api/v1/narrative
│   │   └── synonyms.py      # /api/v1/synonyms
│   ├── services/
│   │   └── gemini.py        # Gemini API 서비스
│   ├── models/
│   │   └── schemas.py       # Pydantic 스키마
│   └── utils/
│       └── prompts.py       # 프롬프트 템플릿
├── pyproject.toml           # uv 프로젝트 설정
├── .env.example
└── README.md
```
