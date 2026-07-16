# Contributing to Social Production (web)

Thank you for helping improve the frontend. This repo is the SvelteKit client for [social-production](https://github.com/social-production).

## Prerequisites

- Node.js 22+
- npm
- A running backend from [`social-production/web-backend`](https://github.com/social-production/web-backend) (Docker or local)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Set `VITE_BACKEND=fastapi` and `VITE_API_URL=http://localhost:8000` in `.env`.

## Architecture

- UI routes live in `src/routes/`
- Feature modules live in `src/lib/features/`
- All backend access goes through the **AppAdapter** (`src/lib/services/adapters/`)
- API contract docs: [`docs/WEB_BACKEND_CONTRACT.md`](docs/WEB_BACKEND_CONTRACT.md)
- Frontend architecture: [`docs/FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md)
- Adapters / drivers: [`docs/ADAPTERS.md`](docs/ADAPTERS.md)

Do not call `fetch()` directly from components — add methods to the FastAPI driver under `src/lib/api/drivers/fastapi/domains/`, then expose them via `queries/` or `commands/`.

## Checks before opening a PR

```bash
npm run smoke      # typecheck + production build
npm run format:check
```

CI runs the same checks on pull requests to `main`.

## Branching

1. Branch from `main`
2. Keep changes focused (one concern per PR when possible)
3. Ensure `npm run smoke` passes
4. Open a PR against `main`

## Canonical documentation

Architecture and contract docs live in **`web/docs/`**. The `planning` repo may mirror some files; treat `web/docs/` as the source of truth for implementation.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for Railway test-environment setup.
