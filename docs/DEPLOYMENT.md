# Railway deployment guide

This document describes deploying the **test environment** on Railway with managed Postgres and Redis, tracking `main` on both GitHub repos.

## Topology

| Service | Repo | Role |
|---------|------|------|
| `web` | [social-production/web](https://github.com/social-production/web) | SvelteKit frontend (`adapter-node`) |
| `web-backend` | [social-production/web-backend](https://github.com/social-production/web-backend) | FastAPI API |
| Postgres plugin | Railway | Database |
| Redis plugin | Railway | Cache, rate limits, token revocation |

## 1. Create Railway project

1. Log in to [Railway](https://railway.app)
2. New Project → **Deploy from GitHub repo**
3. Add **Postgres** and **Redis** plugins to the project

## 2. Deploy backend (`web-backend`)

1. Add service → GitHub → `social-production/web-backend` → branch `main`
2. Railway detects [`Dockerfile`](../Dockerfile) and [`railway.toml`](../railway.toml)
3. Set variables:

| Variable | Value |
|----------|--------|
| `APP_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | Generate a long random string |
| `MESSAGE_ENCRYPTION_KEY` | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `CORS_ORIGINS` | `https://<frontend-service>.up.railway.app` (set after frontend deploy) |

4. Enable **Auto Deploy** on push to `main`
5. Confirm `/readyz` returns 200 after first deploy

Migrations run automatically on container start (`alembic upgrade head`).

### Optional seed (one time)

Do **not** seed on every deploy. For initial test data, run once from Railway shell:

```bash
python scripts/seed.py
```

## 3. Deploy frontend (`web`)

1. Add service → GitHub → `social-production/web` → branch `main`
2. Set **build-time** variables (Docker build args):

| Variable | Value |
|----------|--------|
| `VITE_BACKEND` | `fastapi` |
| `VITE_API_URL` | `https://<backend-service>.up.railway.app` |

In Railway Docker settings, map these as build arguments or service variables consumed by the Dockerfile `ARG` lines.

3. Set runtime `PORT` (Railway injects automatically)
4. Enable **Auto Deploy** on `main`
5. Copy the public frontend URL and update backend `CORS_ORIGINS` to match exactly

## 4. Smoke test checklist

- [ ] Register / login
- [ ] Public feed loads
- [ ] Join open community; closed community invite flow
- [ ] Private community feed hidden from non-members
- [ ] Messages and notifications require auth
- [ ] Project/event detail and activity signup
- [ ] Right-rail bootstrap loads

## 5. Cost guardrails

- Redis: set memory alert in Railway; default app caps connections at 50
- Rate limits: 120 req/min default; search 30/min; auth 10/min
- Do not expose Postgres or Redis ports publicly

## Threat model (test deploy)

This configuration is for **trusted testers**, not unrestricted public production:

- httpOnly cookie sessions with CSRF double-submit (`X-CSRF-Token`); no JWT in `localStorage`
- Security headers on API and SvelteKit (HSTS when served over HTTPS, baseline CSP on frontend)
- Redis-backed rate limits fail-closed in production when Redis is unavailable
- Per-user rate limits on search, feeds, and bootstrap endpoints

See [`SECURITY.md`](SECURITY.md) for the full hardening checklist and deferred items.

## Updating

Push to `main` on either repo → Railway auto-deploys that service.

Ensure frontend rebuilds when `VITE_API_URL` changes (backend URL change requires frontend rebuild).
