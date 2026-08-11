# Switching backends (beginner)

You switch backends by editing **one file**: `web/.env.local`.
Then restart the frontend (`Ctrl+C`, then `npm run dev`).

The two backends keep **separate data**. Accounts you create on FastAPI do not exist on Supabase, and vice versa.

## Prerequisites

| Backend | Must already be running |
|---------|-------------------------|
| FastAPI | `cd web-backend && docker compose up -d` → `http://localhost:8000/healthz` says ok |
| Supabase | `cd web-supabase && npm run start` **and** `npm run functions:serve` → gateway healthz ok |

## Switch to Supabase

Put this in `web/.env.local` (use the long `eyJ…` JWT anon key, not `sb_…`):

```bash
VITE_BACKEND=supabase
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_FUNCTIONS_URL=http://127.0.0.1:54321/functions/v1
VITE_USE_DEV_PROXY=false
```

In DEV, the browser calls **same-origin** `/functions/v1` and `/auth/v1` on `:5173`; Vite proxies those to `:54321`. That avoids Private Network Access / CORS “always 503” failures. Keep `VITE_SUPABASE_URL` pointed at `:54321` so the proxy knows the upstream.

Restart Vite. Open **only** `http://localhost:5173`.

## Switch to FastAPI

Put this in `web/.env.local`:

```bash
VITE_BACKEND=fastapi
VITE_USE_DEV_PROXY=true
```

Restart Vite. Open `http://localhost:5173`.

## After switching checklist

1. Restart `npm run dev` (Vite does not hot-reload env changes).
2. Hard-refresh the browser (or clear site data if auth looks weird).
3. Sign up / sign in again on the new backend.
4. Stay on one origin (`localhost:5173`) — do not mix with `127.0.0.1` or LAN IPs for Supabase.

## How to tell which backend you are on

- Supabase gateway health: `{"ok":true,"provider":"supabase","service":"gateway"}`
- FastAPI health: `{"status":"ok"}` at `http://localhost:8000/healthz`
- Browser Network tab: Supabase calls go to **same-origin** `/functions/v1/gateway/…` (Vite → `:54321`); FastAPI calls go to `/api/…` (via Vite proxy) or `:8000`.

## Full guides

- Local Supabase: [`../../web-supabase/docs/LOCAL_DEV.md`](../../web-supabase/docs/LOCAL_DEV.md)
- Signoff matrix: [`../../web-supabase/docs/SIGNOFF.md`](../../web-supabase/docs/SIGNOFF.md)
- Hosted (only after local pass): [`../../web-supabase/docs/HOSTED.md`](../../web-supabase/docs/HOSTED.md)
- GitHub `main` → hosted Supabase deploy: [`../../web-supabase/docs/DEPLOYMENT.md`](../../web-supabase/docs/DEPLOYMENT.md)
- Feature inventory / test matrix: [`../../web-supabase/docs/FEATURE_MATRIX.md`](../../web-supabase/docs/FEATURE_MATRIX.md)
