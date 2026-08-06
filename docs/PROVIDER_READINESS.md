# Frontend provider readiness

## Accurate status phrase

The frontend is **provider-agnostic foundation ready** — not fully backend-agnostic ready.

That means:

- Product UI depends on `AppAdapter` + shared `$lib/types` + session/error transports
- Alternate backends can be scaffolded without rewriting routes/features
- Only `fastapi` is production-ready today

## What is ready now

- `AppAdapter` covers product reads/writes without FastAPI imports in features
- `SessionTransport` and `ErrorTransport` isolate cookie/CSRF/refresh and error parsing
- Shared types for invites, feedback, pagination, and governance live under `$lib/types`
- Boundary CI (`scripts/check-route-boundary.sh`) blocks FastAPI driver imports outside `src/lib/api/drivers`
- Provider registry reserves `fastapi` (ready), `supabase` / `holochain` (unimplemented scaffolds), `template` (experimental)
- Supabase and Holochain frontend driver packages have full beginner layouts (`client`, transports, `domains/*`)
- Backend workspaces exist: `web-supabase` (starter), `web-holochain` (minimal placeholder)
- Compatibility checklist: [`PROVIDER_CONTRACTS.md`](./PROVIDER_CONTRACTS.md)
- Implementation checklist: [`PROVIDER_IMPLEMENTATION_CHECKLIST.md`](./PROVIDER_IMPLEMENTATION_CHECKLIST.md)

## Deploy path (unchanged)

Railway + FastAPI remains the live path:

- Frontend build: `VITE_BACKEND=fastapi`
- Backend workspace: `web-backend`
- Supabase is **not** a prerequisite for deploys

## What is ready on the backend

See [`../../web-backend/docs/PROVIDER_SEAMS.md`](../../web-backend/docs/PROVIDER_SEAMS.md):

- Domain errors + HTTP mapping
- Ports for auth, cache, token revocation, search, access policy, people suggestions, notifications, messaging, feeds
- Postgres/Redis adapters wrapping current behavior
- Pure tag visibility policy in `app/domain/access_policy.py`

## Recommended next provider: Supabase

1. Implement real logic in [`../../web-supabase/`](../../web-supabase/) against the contract alignment doc.
2. Replace throw stubs under `src/lib/api/drivers/supabase/`.
3. Flip registry `status` to `ready`.
4. Only then deploy with `VITE_BACKEND=supabase`.

Follow [`PROVIDER_IMPLEMENTATION_CHECKLIST.md`](./PROVIDER_IMPLEMENTATION_CHECKLIST.md).

## Holochain

Long-horizon track. Frontend driver scaffold and [`../../web-holochain/`](../../web-holochain/) placeholder exist for orientation. Do not attempt parity until feeds, moderation electorates, and messaging have non-centralized domain models. See `web-holochain/notes/REDESIGN_SURFACES.md`.
