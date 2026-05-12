# RECOCO

<p align="center">
  <img src="assets/readme/recoco-wordmark.svg" alt="RECOCO wordmark" width="180" />
</p>

RECOCO is a digital detox app that recommends photos to delete or preserve based on photo metadata and image content.

사진을 지우는 일을 파일 정리가 아니라 작은 작별로 바꾸는 앱.

The current `main` branch is built around a headless core architecture: business logic lives in `@recoco/core`, platform and service calls are isolated behind ports, and the existing UI is hosted by DOM-only components.

## Quick Start

Frontend in 5 minutes:

```bash
npm ci
cp .env.example .env
npm run dev
```

Backend in a separate terminal:

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .
uvicorn app.main:app --reload --port 8000
```

Then open the Vite dev server shown in the terminal.

## What RECOCO Does

RECOCO helps users reduce photo clutter without turning cleanup into a spreadsheet.

- It analyzes candidate photos with metadata and image context.
- It presents a fast daily curation carousel.
- It lets users decide with two primary actions: `고마웠어` for delete and `소중해` for keep/record.
- It reflects curation actions into home state, report stats, and account history.
- It keeps AI-generated stories as a supporting flow, not the main product bottleneck.

The product priority is not just AI generation quality. The critical path is `launch_to_carousel`, thumbnail delivery, delete-to-next-card latency, and report update consistency.

## Product Vision

RECOCO treats photo cleanup as a small act of closure, not file disposal.

The terms `고마웠어` and `소중해` are intentional:

- `고마웠어` frames deletion as gratitude for a moment that no longer needs to occupy space.
- `소중해` frames preservation as a deliberate choice to keep a memory close.

This language keeps the product closer to digital detox and emotional editing than a generic storage cleaner.

## Core User Flow

1. Open the app.
2. Authenticate with Google if needed.
3. Grant photo access on iOS.
4. Review the daily photo carousel.
5. Choose `고마웠어` to delete or `소중해` to preserve/record.
6. Continue to the next card.
7. Check report and account state after curation.

The UI should make deletion decisions feel quick, reversible in intent, and emotionally lightweight.

## Architecture

RECOCO is organized as a host-agnostic core plus thin platform adapters.

```text
main.js
  -> src/adapters/createAppPorts.js
  -> packages/core/src/createRecocoCore.js
  -> src/ui/dom/createDomApp.js
  -> src/components/*
```

### `@recoco/core`

`packages/core/` contains the headless business logic package.

- Reactive store
- Navigation controller
- Auth controller
- Permissions controller
- Notifications controller
- Account controller
- Home controller
- Input controller
- Result controller
- Report controller
- Pure helpers for report aggregation, caption formatting, curation reasoning, and error normalization

Core code must not import DOM APIs, Supabase clients, Capacitor plugins, browser storage, or app services directly. Those dependencies are supplied through ports.

### Platform ports

`src/adapters/` is the platform/service composition layer.

It wraps:

- Supabase auth and stats access
- Capacitor App, Browser, Clipboard, Local Notifications
- native `RecocolPhotos` bridge
- `PhotoService`
- `GeminiService`
- `ShareService`
- `ImageProcessor`
- browser storage
- system clock
- account API fetch

`src/adapters/createAppPorts.js` is the app-side composition root that builds the 13 ports consumed by core.

### DOM adapter

`src/ui/dom/` contains browser DOM integration.

- `createDomApp.js`: component composition, manager lifecycle, store reactors, teardown
- `domEvents.js`: bottom tabs, back button, custom navigation events
- `domRouterAdapter.js`: view visibility, header/bottom-bar state, scroll reset, render triggers
- `toastPresenter.js`: normalized core errors to UI toasts

### Components

`src/components/` contains DOM-only views. Components receive `core` or controller access through construction and should not import Supabase, Capacitor, native plugins, legacy state managers, or service modules directly.

## Repository Layout

```text
.
├── main.js                         # Thin bootstrap: ports -> core -> DOM app
├── packages/core/                  # @recoco/core headless package
├── src/
│   ├── adapters/                   # Platform/service port adapters
│   ├── components/                 # DOM-only UI components
│   ├── plugins/RecocolPhotos.ts    # Capacitor native photo bridge
│   ├── services/                   # Legacy services wrapped by adapters
│   ├── state/                      # Legacy StateManager retained for daily reset
│   └── ui/dom/                     # DOM app/router/events/toast adapters
├── backend/                        # FastAPI backend proxy
├── ios/App/                        # Capacitor iOS project
├── .github/workflows/              # CI and iOS simulator build workflows
├── docs/                           # Release, testing, refactor, and readiness docs
└── scripts/maestro/                # iOS smoke automation helpers
```

## Prerequisites

- Node.js 22
- npm
- Python 3.11
- `uv` for backend local development
- Xcode for iOS work
- Capacitor CLI via `npx cap`
- Maestro for optional iOS smoke automation

## Environment Variables

Copy the root template and fill in real values:

```bash
cp .env.example .env
```

Frontend / Vite variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- `VITE_BACKEND_PORT`

Backend / AI variables:

- `GEMINI_API_KEY`
- optional Gemini fallback keys
- `GOOGLE_CLOUD_API_KEY`
- `SERVICE_ROLE_KEY`
- optional `PORT`

The frontend reads the root `.env`. The backend reads process env, or `backend/.env` when run from `backend/`.

For backend-specific details, see [backend/README.md](backend/README.md).

## Local Development

Install frontend dependencies:

```bash
npm ci
```

Run the Vite dev server:

```bash
npm run dev
```

Run a production build:

```bash
npm run build
```

Preview the built app:

```bash
npm run preview
```

Current npm scripts:

```bash
npm run dev
npm run build
npm test
npm run preview
npm run maestro:install
npm run maestro:install:ios
npm run maestro:test:ios
npm run maestro:record:ios
```

`npm test` currently maps to `npm run build`.

## Backend API

Run the backend locally:

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

API docs when the backend is running:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Main backend endpoints:

- `GET /`
- `GET /health`
- `POST /api/v1/narrative`
- `POST /api/v1/synonyms`

## iOS / Capacitor

Build web assets and sync the iOS project:

```bash
npm run build
npx cap sync ios
```

Open the iOS project:

```bash
npx cap open ios
```

The Capacitor app uses:

- app id: `com.narrativeai.appv`
- app name: `NarrativeAI`
- web directory: `dist`
- iOS URL scheme: `com.narrativeai.appv`

The native photo bridge is `src/plugins/RecocolPhotos.ts`.

## Validation

Frontend build smoke:

```bash
npm test
```

Backend health smoke:

```bash
python -m pip install -e ./backend
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
curl http://127.0.0.1:8000/health
```

Boundary scans used during the headless-core refactor:

```bash
rg -n "document|window|localStorage|sessionStorage|navigator|fetch\\(|supabase|@capacitor|RecocolPhotos" packages/core/src -g '!contracts/ports.js'
rg -n "supabase|@capacitor|RecocolPhotos|PhotoService|GeminiService|NotificationService|StatsService|StateManager|ImageProcessor" src/components
rg -n "supabase|@capacitor|RecocolPhotos|PhotoService|GeminiService|NotificationService|StatsService|ImageProcessor|ShareService" src/ui/dom
```

CI workflows:

- [ci.yml](.github/workflows/ci.yml): frontend build + backend `/health` smoke
- [build-ios.yml](.github/workflows/build-ios.yml): iOS simulator app build artifact

## Manual Smoke Checklist

Before treating a release candidate as ready, manually check:

- Cold boot with no session opens the onboarding/auth path.
- Google OAuth works on web redirect.
- Google OAuth works on native deep link / `appUrlOpen`.
- Signed-in boot navigates to home.
- Permission allow loads daily curation exactly once.
- `소중해` records the curation action exactly once.
- `고마웠어` delete confirmation deletes and records exactly once.
- Withdrawal deletes account state, signs out, and clears storage exactly once.
- Notice toggle ON/OFF schedules/cancels notification exactly once.
- Input to result flow supports copy, share, and keyword replacement.
- Report view renders weekly and total stats.

## Visual Preview

Curated screenshots will be added after privacy review. Until then, this README uses the brand logo only.

Raw local captures are intentionally ignored by git and should not be bulk-published to GitHub. Some local Maestro and test screenshots include profile photos, email addresses, location metadata, personal names, or test photos.

README visual policy:

- Use 1-3 curated images only.
- Prefer screenshots without profile photos, email addresses, precise location coordinates, or personal names.
- Promote only reviewed assets into `assets/readme/`.
- Keep raw `build/`, `assets/test-assets/`, and `.maestro/*.png` captures ignored.

Recommended tracked assets after privacy review:

- `assets/readme/home-carousel.png`
- `assets/readme/curation-actions.gif`
- `assets/readme/result-caption.png`

## Documentation Map

Product and release docs:

- [docs/release-checklist.md](docs/release-checklist.md)
- [docs/github-readiness-checklist.md](docs/github-readiness-checklist.md)
- [docs/testing/maestro.md](docs/testing/maestro.md)

Headless-core refactor docs:

- [docs/refactor/headless-core-agent-instructions.md](docs/refactor/headless-core-agent-instructions.md)
- [docs/refactor/headless-core-final-review.md](docs/refactor/headless-core-final-review.md)
- [docs/refactor/headless-core-push-readiness.md](docs/refactor/headless-core-push-readiness.md)
- [docs/refactor/headless-core-post-push-review.md](docs/refactor/headless-core-post-push-review.md)
- [docs/refactor/headless-core-clean-pr-review.md](docs/refactor/headless-core-clean-pr-review.md)
- [docs/refactor/headless-core-final-merge-check.md](docs/refactor/headless-core-final-merge-check.md)
- [docs/refactor/slice-5-component-mapping.md](docs/refactor/slice-5-component-mapping.md)

The slice mapping documents under `docs/refactor/` preserve implementation decisions and line-cited audits for the headless-core migration.

## Current Project Status

[![CI](https://github.com/goodand/narrative-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/goodand/narrative-ai/actions/workflows/ci.yml)
[![Build iOS Simulator App](https://github.com/goodand/narrative-ai/actions/workflows/build-ios.yml/badge.svg)](https://github.com/goodand/narrative-ai/actions/workflows/build-ios.yml)
![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)

- `main` contains the headless-core refactor merged from the clean PR path.
- The app is still a Vite + Vanilla JS frontend with Capacitor iOS and FastAPI backend.
- `@recoco/core` is private workspace package source, not a published npm package.
- CI build and backend smoke run on pull requests and pushes to `main`.
- iOS simulator build runs on pushes to `main` and manual dispatch.
- Runtime release confidence still depends on manual smoke for auth, permissions, photo curation, destructive actions, notifications, and report flows.

The next README-level improvements should be visual: add screenshots or a short GIF of the home carousel and result flow once current UI capture assets are ready.

## License

This project is licensed under the ISC License.
