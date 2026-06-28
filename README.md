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

## Share on your local Wi-Fi (LAN)

Use this when friends or family on the **same Wi-Fi** should try the app from their phones or laptops. The script detects your machine’s LAN address at runtime and writes it to `.env.local` (gitignored). Nothing personal is stored in the script itself.

### What you need

- Docker and Node.js (same as [First-Time Setup](#first-time-setup))
- Your computer and testers connected to the **same Wi-Fi network**
- Ports **5173** (frontend) and **8000** (backend) reachable on your machine

### Start everything for LAN testing

From the `web` folder:

```bash
./scripts/lan-dev.sh
```

The script will:

1. Detect your LAN IP (or use `LAN_IP=192.168.x.x ./scripts/lan-dev.sh` if detection fails)
2. Write `web/.env.local` so API calls are **proxied through the frontend** (testers only need port 5173)
3. Start the backend in Docker with CORS allowed for that IP
4. Start the frontend bound to all interfaces (`0.0.0.0`) so other devices can connect

**Important:** Share only the `192.168.x.x` link printed by the script. Ignore Docker addresses like `172.17.x.x` or `172.18.x.x` — those only work on your computer.

When it is ready, the terminal prints a link like:

```text
http://192.168.1.50:5173
```

**Send that link** to people on your Wi-Fi. They open it in a browser — no install needed.

### What testers do

1. Connect to the same Wi-Fi as your computer.
2. Open the link you shared (for example `http://192.168.1.50:5173`).
3. Sign up or log in and use the app like normal.

Phones and tablets work too, as long as they are on the same network.

**Refresh and reopen on mobile:** The Vite dev server can behave differently from a production build when you close and reopen a tab. If refresh feels flaky during LAN testing, verify with a production preview on the same network:

```bash
npm run build && npm run preview -- --host 0.0.0.0
```

Then share the preview URL (same port rules as above) instead of the dev server link.

### Stop LAN mode

| Action | Command |
|--------|---------|
| Stop the frontend | Press `Ctrl+C` in the terminal running the script |
| Stop the backend | `cd web-backend && docker compose down` |

To go back to localhost-only development, run `npm run dev` again. You can delete `.env.local` or set `VITE_API_URL=http://localhost:8000` in it.

### If others cannot connect

Run diagnostics:

```bash
./scripts/lan-diagnose.sh
```

**Wrong URL:** Vite may also print `http://172.18.0.1:5173` — that is a Docker internal address. Only share the `192.168.x.x` URL.

**Router client / AP isolation (most common):** Many home routers block devices on Wi-Fi from talking to each other. Symptoms: your computer works, but phones and other laptops time out. Fixes:

- Turn off “AP isolation”, “client isolation”, or “wireless isolation” in router settings
- Do not use **guest Wi-Fi** for testing
- **Workaround:** create a hotspot on your phone, connect your PC and testers to that hotspot, run `./scripts/lan-dev.sh` again, share the new IP

**Test from another device:**

```bash
ping 192.168.1.148
```

(replace with your printed IP). If ping fails, it is a network/router issue, not the app.

**Firewall (common on Linux):** allow the dev port while testing, then remove when done.

Fedora / RHEL:

```bash
sudo firewall-cmd --add-port=5173/tcp
# when finished:
sudo firewall-cmd --remove-port=5173/tcp
```

Ubuntu (ufw):

```bash
sudo ufw allow 5173/tcp
```

With LAN mode, testers only need port **5173** open (the API is proxied through Vite). Port 8000 is only used on your computer.

**Wrong IP after switching networks?** Stop the script, run `./scripts/lan-dev.sh` again. It re-detects your IP and rewrites `.env.local`.

**CORS or API errors in the browser console?** Make sure you started via `./scripts/lan-dev.sh`, not plain `npm run dev`. The script sets backend CORS for your LAN frontend URL.

**Guest Wi-Fi / client isolation:** Some routers block devices from talking to each other. If that happens, use a network without isolation or test from your computer only.

### Security note

LAN mode uses **development defaults** (weak JWT secret, default DB password, etc.). Only use this on a network you trust, for short testing sessions — not on the public internet.

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

For LAN testing with friends on the same Wi-Fi, skip manual setup and run `./scripts/lan-dev.sh` instead (see [Share on your local Wi-Fi (LAN)](#share-on-your-local-wi-fi-lan)).

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

The backend must allow your frontend origin. For localhost, `CORS_ORIGINS` should include `http://localhost:5173`. For LAN testing, use `./scripts/lan-dev.sh`, which sets CORS for your detected LAN IP. You can also set `CORS_ORIGINS` manually when starting Docker, for example:

```bash
CORS_ORIGINS=http://localhost:5173,http://192.168.1.50:5173 docker compose up -d --build
```

### TypeScript says it cannot find type definitions

Run `npm install`, then close and reopen the editor window so TypeScript reloads the project. If that does not help, run `npm run check` to see the full error list.

### `npm run dev` fails immediately

Check that Node.js 18 or later is installed: `node --version`. If it shows a version below 18, update Node.js from [nodejs.org](https://nodejs.org).