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
docker compose up -d postgres redis
source .venv/bin/activate
alembic upgrade head
PIPAPI_PYTHON_LOCATION="$(pwd)/.venv/bin/python" pip-audit
ruff check app tests
python -m pytest tests/ -q

# Frontend
cd web
bash scripts/check-route-boundary.sh
npm audit --audit-level=high
npm run check
npm run smoke
```

### Release verification notes (pre-deployment roadmap)

- Migration head should be `0021_project_conversion` (after location foundation `0020`).
- Confirm empty-database `alembic upgrade head` and upgrade-from-current both succeed before deploy.
- Manual security matrix: anonymous/private event access, session restart/logout, CSRF, invite leakage, location precision redaction, closed/conversion history lineage.
- Mobile viewport review for Public Region controls and `/map` list fallback; installable-app packaging remains deferred (see SECURITY.md).

## Simple guide (start here)

You are putting the app on the internet under your own Railway account. Railway gives you a real public address that looks like gibberish, for example `https://web-production-xxxx.up.railway.app`. 

After this is set up, pushing `main` updates the live site for you.

Do these four parts in order. Copy values exactly. Do not add a slash at the end of a web address.

### Part 1. Make two secret codes on your computer

Open a terminal in the `web-backend` folder and run these two commands. Each prints one long random line. Save both lines in a note. You will paste them into Railway. Do not post them in chat.

```bash
python -c "import secrets; print(secrets.token_hex(32))"
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

The first line is `JWT_SECRET`. The second line is `MESSAGE_ENCRYPTION_KEY`.

### Part 2. Turn on the signup captcha (Cloudflare)

On your computer, signup has no captcha because `VITE_TURNSTILE_SITE_KEY` in `.env.local` is empty. The live site should have a captcha so bots cannot create accounts.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and make a free account.
2. In the left menu, open **Turnstile**, then **Add widget**.
3. Name it `Social Production signup`. Mode: **Managed**.
4. For the website name, type `localhost` for now. You will add the real site address in Part 4.
5. Cloudflare shows two keys. Save both.
   - **Site key**: public. This goes on the website.
   - **Secret key**: private. This goes on the backend only.

### Part 3. Create the project on Railway

1. Go to [railway.app](https://railway.app) and log in with your own account.
2. Click **New Project**.
3. Add a database called **PostgreSQL**.
4. Add another database called **Redis**.
5. Click **Add a service**, choose **GitHub repo**, and pick `social-production/web-backend`. Use the branch `main`.
6. Open that service, then **Variables**, and add each row below. For the two database addresses, use Railway's variable picker (the `{{ }}` button) so you connect the Postgres and Redis you just added. The service names on screen might be `Postgres` and `Redis`.

| Name | What to paste |
|------|----------------|
| `APP_ENV` | `production` |
| `DATABASE_URL` | the Postgres `DATABASE_URL` from the picker |
| `REDIS_URL` | the Redis `REDIS_URL` from the picker |
| `JWT_SECRET` | the first secret from Part 1 |
| `MESSAGE_ENCRYPTION_KEY` | the second secret from Part 1 |
| `SIGNUP_ENABLED` | `true` |
| `TURNSTILE_SECRET_KEY` | the Turnstile secret key from Part 2 |

Leave `CORS_ORIGINS` empty until Part 4.

7. Open **Settings** for this service. The branch should be `main`. Turn on automatic deploys when `main` changes.
8. Wait until the deploy is green. Open the service URL and add `/readyz` at the end. You want a success message. Copy the service URL without `/readyz`. That is the backend address.

### Part 4. Put the website online

1. In the same Railway project, add another GitHub service: `social-production/web`, branch `main`.
2. Open **Variables** on this website service and add:

| Name | What to paste |
|------|----------------|
| `VITE_BACKEND` | `fastapi` |
| `VITE_API_URL` | the backend address from Part 3, with no slash at the end |
| `VITE_SIGNUP_ENABLED` | `true` |
| `VITE_PWA_ENABLED` | `true` |
| `VITE_PUSH_ENABLED` | `false` |
| `VITE_TURNSTILE_SITE_KEY` | the Turnstile site key from Part 2 |
| `VITE_USE_DEV_PROXY` | `false` |

3. Turn on automatic deploys for `main` on this service too.
4. Wait until it is green. Railway shows a public URL such as `https://web-production-xxxx.up.railway.app`. Open it. That is your site.
5. Go back to the **backend** service variables. Add `CORS_ORIGINS` and paste that exact website URL, with no slash at the end. Save. If the backend does not restart, redeploy it.
6. Go back to the Cloudflare Turnstile widget and add that same website hostname (the part after `https://`, with no slash).

### Check it

- The website opens.
- Sign up shows a captcha, then creates an account.
- Log in works.
- On a phone, you can add it to the home screen. iPhone: Share, then Add to Home Screen.

### Later, if you want to change something

Change the variable in Railway and save. The site rebuilds on its own.

- `VITE_BACKEND=fastapi` means this FastAPI server. Switching backends later is a different value here.
- `SIGNUP_ENABLED=false` on the backend turns new signups off after a restart. Also set `VITE_SIGNUP_ENABLED=false` on the website so the form hides.
- `VITE_PWA_ENABLED=true` lets people install the app. `false` turns that off.
- `VITE_PUSH_ENABLED` stays `false` for now. Phone notifications are a later step.
- Clear both Turnstile keys only if you want the captcha off. On the live site, leave them filled in.
- Governance warm-up stays off while these are `0`. To turn it on, set `GOVERNANCE_MIN_ACCOUNT_AGE_HOURS` (how long to wait, for example `24`) and `GOVERNANCE_MIN_MEANINGFUL_ACTIONS` (how many real contributions, for example `3`). `GOVERNANCE_REMOVAL_PENALTY_HOURS` (for example `168`) pushes that wait further out when someone's post or comment is removed. Trust ratios stay off until `GOVERNANCE_TRUST_RATIO_ENABLED=true`. Restart the backend after changing them. Details are in [SYBIL_RESISTANCE.md](SYBIL_RESISTANCE.md).

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
| `SIGNUP_ENABLED` | `true` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `GOVERNANCE_MIN_ACCOUNT_AGE_HOURS` | `0` (set `24` to require a day's wait before voting) |
| `GOVERNANCE_MIN_MEANINGFUL_ACTIONS` | `0` (set `3` to require a few real contributions) |
| `GOVERNANCE_REMOVAL_PENALTY_HOURS` | `0` (set `168` to extend the wait after removed content) |
| `GOVERNANCE_MEANINGFUL_ACTION_TYPES` | optional comma-separated list; leave unset to use the built-in list |
| `GOVERNANCE_TRUST_RATIO_ENABLED` | `false` (set `true` to gate votes and activity bands on trust) |
| `GOVERNANCE_MIN_BOT_MARKS` | `3` independent bot marks before bot weight changes the ratio |
| `GOVERNANCE_MARK_LICENSE_VOUCHES` | `5` licensing vouches before an account can vote or mark bots |
| `GOVERNANCE_VOTE_THRESHOLD` | `0.66` |
| `GOVERNANCE_LIMITED_THRESHOLD` | `0.30` tighter post, comment, and join limit |
| `GOVERNANCE_INERT_THRESHOLD` | `0.10` pause posting, commenting, and joining |
| `GOVERNANCE_BOOTSTRAP_MARKERS` | `10` first accounts to finish the warm-up |
| `GOVERNANCE_BOOTSTRAP_TARGET` | `20` mature accounts before the bootstrap floor reaches 0 |

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
| `VITE_SIGNUP_ENABLED` | `true` |
| `VITE_PWA_ENABLED` | `true` |
| `VITE_PUSH_ENABLED` | `false` |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `VITE_USE_DEV_PROXY` | `false` |

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

## Alternate path: Supabase backend

Production today tracks FastAPI on Railway. To run the frontend against hosted Supabase instead:

1. Deploy backend from the dedicated [`web-supabase`](../../web-supabase) GitHub repo (auto-deploy on `main` — see [`web-supabase/docs/DEPLOYMENT.md`](../../web-supabase/docs/DEPLOYMENT.md)).
2. Build this frontend with Supabase build args:

| Variable | Value |
|----------|--------|
| `VITE_BACKEND` | `supabase` |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Hosted JWT anon key (`eyJ…`) |
| `VITE_SUPABASE_FUNCTIONS_URL` | `https://<ref>.supabase.co/functions/v1` |

3. Keep FastAPI Railway warm until hosted browser signoff passes; rollback via [`web-supabase/docs/CUTOVER.md`](../../web-supabase/docs/CUTOVER.md).
4. Switching backends locally: [`BACKEND_SWITCHING.md`](BACKEND_SWITCHING.md).
