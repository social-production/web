# Railway beta runbook

Trusted-tester beta on a **single** Railway project (backend + frontend + Postgres + Redis).

## Pre-deploy checklist (local)

```bash
# Backend
cd web-backend
docker compose -f docker-compose.prod.yml up --build
export APP_ENV=development DATABASE_URL=... REDIS_URL=... JWT_SECRET=... MESSAGE_ENCRYPTION_KEY=...
python -m pytest tests/ -q

# Frontend
cd web
npm run smoke
```

## Deploy sequence

1. Generate secrets:
   - `JWT_SECRET`: `python -c "import secrets; print(secrets.token_hex(32))"`
   - `MESSAGE_ENCRYPTION_KEY`: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

2. Deploy **web-backend** from `main`; confirm `GET /readyz` → 200.

3. Deploy **web** with build args:
   - `VITE_BACKEND=fastapi`
   - `VITE_API_URL=https://<backend>.up.railway.app`

4. Set backend `CORS_ORIGINS` to the exact frontend URL (no trailing slash).

5. One-time seed (Railway shell, not on every deploy):
   ```bash
   python scripts/seed.py
   ```

## Post-deploy smoke

- [ ] Register / login (cookies; no token in response JSON)
- [ ] CSRF: mutation works in UI; direct API POST without `X-CSRF-Token` fails with cookie session
- [ ] Public + home feeds load
- [ ] Join community; private feed hidden from non-members
- [ ] Messages + notifications (auth required)
- [ ] Project phase vote or update request
- [ ] Search returns results (rate limit not tripped in normal use)
- [ ] `/readyz` and frontend `/` healthy

## Ops

- Set Railway Redis memory alert.
- Push to `main` auto-deploys; frontend must rebuild when `VITE_API_URL` changes.
- Feedback: optional `GITHUB_TOKEN` + `GITHUB_REPO` on backend.

Full topology: [`DEPLOYMENT.md`](DEPLOYMENT.md). Security: [`SECURITY.md`](SECURITY.md).
