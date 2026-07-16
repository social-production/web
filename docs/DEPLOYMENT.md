# Railway deployment guide

Trusted-tester beta on a **single** Railway project (backend + frontend + Postgres + Redis), tracking `main` on both GitHub repos.

## Topology

| Service | Repo | Role |
|---------|------|------|
| `web` | [social-production/web](https://github.com/social-production/web) | SvelteKit frontend (`adapter-node`) |
| `web-backend` | [social-production/web-backend](https://github.com/social-production/web-backend) | FastAPI API |
| Postgres plugin | Railway | Database |
| Redis plugin | Railway | Cache, rate limits, token revocation |

## Pre-deploy checklist (local)

```bash
# Backend
cd web-backend
docker compose -f docker-compose.prod.yml up --build
export APP_ENV=development DATABASE_URL=... REDIS_URL=... JWT_SECRET=... MESSAGE_ENCRYPTION_KEY=...
python -m pytest tests/ -q
ruff check app tests && ruff format --check app tests

# Frontend
cd web
npm run smoke
# or: bash scripts/check-route-boundary.sh && npm run check
```

## 1. Create Railway project

1. Log in to [Railway](https://railway.app)
2. New Project → **Deploy from GitHub repo**
3. Add **Postgres** and **Redis** plugins to the project

## 2. Deploy backend (`web-backend`)

1. Add service → GitHub → `social-production/web-backend` → branch `main`
2. Railway detects [`Dockerfile`](../Dockerfile) and [`railway.toml`](../railway.toml)
3. Generate secrets:
   - `JWT_SECRET`: `python -c "import secrets; print(secrets.token_hex(32))"`
   - `MESSAGE_ENCRYPTION_KEY`: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
4. Set variables:

| Variable | Value |
|----------|--------|
| `APP_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | Generated secret |
| `MESSAGE_ENCRYPTION_KEY` | Generated Fernet key |
| `CORS_ORIGINS` | `https://<frontend-service>.up.railway.app` (set after frontend deploy; no trailing slash) |

5. Enable **Auto Deploy** on push to `main`
6. Confirm `GET /readyz` → 200 after first deploy

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

3. Set runtime `PORT` (Railway injects automatically)
4. Enable **Auto Deploy** on `main`
5. Copy the public frontend URL and update backend `CORS_ORIGINS` to match exactly

## 4. Post-deploy smoke

- [ ] Register / login (cookies; no token in response JSON)
- [ ] CSRF: mutation works in UI; direct API POST without `X-CSRF-Token` fails with cookie session
- [ ] Public + home feeds load
- [ ] Join community; private feed hidden from non-members
- [ ] Messages + notifications (auth required)
- [ ] Project/event detail, activity signup, phase vote or update request
- [ ] Search returns results (rate limit not tripped in normal use)
- [ ] Right-rail bootstrap loads
- [ ] `/readyz` and frontend `/` healthy

## 5. Cost guardrails and ops

- Redis: set memory alert in Railway; default app caps connections at 50
- Rate limits: 120 req/min default; search 30/min; auth 10/min
- Do not expose Postgres or Redis ports publicly
- Push to `main` auto-deploys; frontend must rebuild when `VITE_API_URL` changes
- Feedback: optional `GITHUB_TOKEN` + `GITHUB_REPO` on backend

## Threat model (trusted testers)

This configuration is for **trusted testers**, not unrestricted public production:

- httpOnly cookie sessions with CSRF double-submit (`X-CSRF-Token`); no JWT in `localStorage`
- Security headers on API and SvelteKit (HSTS when served over HTTPS, baseline CSP on frontend)
- Redis-backed rate limits fail-closed in production when Redis is unavailable
- Per-user rate limits on search, feeds, and bootstrap endpoints

See [`SECURITY.md`](SECURITY.md) for the full hardening checklist and deferred items.
