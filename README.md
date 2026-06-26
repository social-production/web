# Social Production Web

This repo is the Phase 1 web frontend home for Social Production.

Phase 1 is a simpler web prototype used to test whether the platform can help real non-market production and coordination before the legal, funding, asset-holding, and p2p parts of the full model come online.

## Stack Direction

Phase 1 uses:

- SvelteKit for the frontend
- FastAPI as the likely conventional backend path
- PWA-first UX that still works well on desktop

Phase 1 absolutely includes a backend. This repo is just frontend-first for now. The backend may be built by a collaborator or here later, but the frontend should be planned so it can talk cleanly to a FastAPI backend now and a future p2p backend later.

## Current Status

Phase 1 is live and connected to the real FastAPI backend (`web-backend`).

The mock driver has been removed. The frontend requires a running backend at `http://localhost:8000`. All data flows through the FastAPI driver.

Current surfaces:

- the app shell is live
- the Public feed loads real posts, projects, threads, and events
- the Personal and Home feeds load content from followed users and joined channels/communities
- detail pages for projects, events, threads, posts, channels, and communities are implemented
- several routes are still placeholders for features in development

The adapter entry point lives here:

- `src/lib/services/adapters/index.ts`

The FastAPI driver lives here:

- `src/lib/api/drivers/fastapi/`

## First-Time Setup

The easiest way to run Social Production locally is to start the backend with Docker, then start the frontend with npm.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose for PostgreSQL, Redis, and the FastAPI backend
- [Node.js 18+](https://nodejs.org/) and npm for the SvelteKit frontend
- Git, if you are cloning the project for the first time

Check your installed versions:

```bash
docker --version
node --version
npm --version
```

### 1. Start the backend

```bash
cd ../web-backend
docker compose up -d --build
```

Wait a minute for the database, migrations, and seed data. Then open `http://localhost:8000/docs`.

### 2. Start the frontend

```bash
cd ../web
npm install
npm run dev
```

Then open `http://localhost:5173`. The backend API docs are at `http://localhost:8000/docs`.

See `web-backend/README.md` for full backend setup details.

## How To Run This

If you are new to programming, use these steps exactly.

### 1. Create your local environment file

Copy the template and edit if your backend URL differs:

```bash
cp .env.example .env.local
```

Or create `web/.env.local` manually with:

```env
VITE_BACKEND=fastapi
VITE_API_URL=http://localhost:8000
```

This file is gitignored and never committed. The frontend only needs public config (which API to call). Login tokens are issued at runtime and stored in the browser — they do not belong in env files.

The backend uses `web-backend/.env` for secrets (`DATABASE_URL`, `JWT_SECRET`, `MESSAGE_ENCRYPTION_KEY`, etc.). See `web-backend/.env.example` for that template.

The frontend defaults to the FastAPI driver and `http://localhost:8000`; use `.env.local` whenever your backend URL is different.

### 2. Open the frontend folder in a terminal

Make sure your terminal is inside the `web` folder.

### 3. Install the packages

Run:

```bash
npm install
```

You usually do this the first time, and again any time dependencies change.

### 4. Start the local development server

Run:

```bash
npm run dev
```

The terminal will show you a local address, usually something like:

```text
http://localhost:5173
```

Open that address in your browser.

### 5. What you should expect to see

At this stage you should be able to:

- open the Public feed and see real posts, projects, threads, and events from the backend
- open the Personal and Home feeds (requires being logged in)
- click around the shell navigation
- open detail pages for projects, events, threads, channels, and communities

Some routes are still placeholders on purpose. They exist now so the frontend structure is stable before deeper features are added.

If the Public feed shows an error or loads nothing, check that the backend is running at `http://localhost:8000` and that `.env.local` exists with the correct values.

### 6. Check whether the app is healthy

If you want to test whether the project is set up correctly, run:

```bash
npm run check
```

That checks the Svelte and TypeScript setup.

You can also run:

```bash
npm run build
```

That checks whether the app can build for production.

## Backend Driver System

The frontend is fully decoupled from any specific backend. All data access goes through a single `AppAdapter` interface (`src/lib/services/adapters/types.ts`). At runtime, a driver is selected based on the `VITE_BACKEND` environment variable and injected app-wide.

### Available drivers

| `VITE_BACKEND` | Driver | Description |
|---|---|---|
| `fastapi` | `createFastApiDriver()` | HTTP calls to the FastAPI/Python backend |

A Holochain driver (or any other backend) can be added by implementing `AppAdapter` and registering it in `src/lib/api/drivers/index.ts` — no routes or components need to change.

### Switching backends

Create or edit `web/.env.local` (gitignored, never committed):

**FastAPI (localhost):**
```env
VITE_BACKEND=fastapi
VITE_API_URL=http://localhost:8000
```

To point at a different backend host (for example a staging server), change `VITE_API_URL` to that URL. Restart `npm run dev` after any change to `.env.local`.

### Adding a new backend driver

1. Create `src/lib/api/drivers/<name>/index.ts` exporting `create<Name>Driver(): AppAdapter`
2. Implement every method in `AppAdapter` (see `src/lib/services/adapters/types.ts`)
3. Add the case to `src/lib/api/drivers/index.ts`
4. Set `VITE_BACKEND=<name>` in `.env.local`

The driver is the only layer that knows what backend it talks to. Auth strategy, data shapes, and transport are all internal to the driver.

### Known driver gaps (FastAPI)

All `AppAdapter` methods are currently implemented for the FastAPI backend. If you encounter a `"no backend endpoint yet"` error, the backend endpoint may need to be added or the adapter method may need updating.

### Partial implementations (FastAPI)

- `toggleEventGoing` — not yet wired to a backend endpoint; use `toggleEventMembership` instead

## Troubleshooting

### The feed shows an error or loads nothing

1. Check that the backend is running: open `http://localhost:8000/docs` in your browser. If it does not load, start the backend first (see `web-backend/README.md`).
2. Check that `.env.local` exists in the `web` folder and contains:
   ```env
   VITE_BACKEND=fastapi
   VITE_API_URL=http://localhost:8000
   ```
3. Restart `npm run dev` after editing `.env.local` — Vite does not hot-reload env file changes.

### The browser console shows a CORS error

The backend must allow `http://localhost:5173`. Check that `CORS_ORIGINS` in the backend environment includes `http://localhost:5173`. The default Docker Compose setup sets `CORS_ORIGINS` to `*`, which allows all origins.

### TypeScript says it cannot find type definitions

Run `npm install`, then close and reopen the editor window so TypeScript reloads the project. If that does not help, run `npm run check` to see the full error list.

### `npm run dev` fails immediately

Check that Node.js 18 or later is installed: `node --version`. If it shows a version below 18, update Node.js from [nodejs.org](https://nodejs.org).