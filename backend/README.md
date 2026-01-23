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
