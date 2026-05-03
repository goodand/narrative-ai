# Repeated Task: Local Dev Server Startup

## Context
When verifying UI changes or testing flows like authentication, Xcode Simulator causes bottlenecks and crashes (`CoreSimulatorService`). The project uses Vite + Vanilla JS + Capacitor.

## Repeated Action
Starting the frontend and backend servers required specific paths and interactive shell features.
- Frontend: `zsh -ic 'npm run dev'` (Requires `npm` from user profile)
- Backend: `cd backend && ./.venv/bin/python -m uvicorn app.main:app --reload --port 8000` (Path must be `.venv` not `venv`)

## Shell Environment Prerequisites
Non-interactive shell sessions (e.g. agent tool calls) do not load the user's PATH. Two environment fixes must be applied before any build command:
- `source ~/.zshrc` — required for `npx`, `npm`, `node`, `pod` to be found
- `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` — required when the project path contains Korean characters (e.g. `Project_____현재_진행중인`). Without this, `pod install` crashes with `Encoding::CompatibilityError: Unicode Normalization not appropriate for ASCII-8BIT`.

Combined prefix for all iOS build commands:
```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 && source ~/.zshrc && <command>
```

## Recommended Skill / Automation
Create a startup script or compound NPM script like `npm run dev:all` that gracefully launches both Vite and Uvicorn. The AI agent should always default to running `npm run dev` and `uvicorn` rather than attempting Xcode builds for rapid logic iteration.
