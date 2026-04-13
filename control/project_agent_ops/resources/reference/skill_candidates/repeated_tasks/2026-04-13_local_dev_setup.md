# Repeated Task: Local Dev Server Startup

## Context
When verifying UI changes or testing flows like authentication, Xcode Simulator causes bottlenecks and crashes (`CoreSimulatorService`). The project uses Vite + Vanilla JS + Capacitor.

## Repeated Action
Starting the frontend and backend servers required specific paths and interactive shell features.
- Frontend: `zsh -ic 'npm run dev'` (Requires `npm` from user profile)
- Backend: `cd backend && ./.venv/bin/python -m uvicorn app.main:app --reload --port 8000` (Path must be `.venv` not `venv`)

## Recommended Skill / Automation
Create a startup script or compound NPM script like `npm run dev:all` that gracefully launches both Vite and Uvicorn. The AI agent should always default to running `npm run dev` and `uvicorn` rather than attempting Xcode builds for rapid logic iteration.
