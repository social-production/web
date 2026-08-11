# Frontend provider readiness

## Accurate status phrase

The frontend is **provider-agnostic foundation ready**, with **two ready backends**:

- `fastapi` — production / Railway path today
- `supabase` — local-ready alternate (Auth + Postgres + Edge Function gateway); hosted cutover only after [SIGNOFF.md](../../web-supabase/docs/SIGNOFF.md) Hosted is green

Holochain remains unimplemented.

## What is ready now

- `AppAdapter` covers product reads/writes without FastAPI imports in features
- `SessionTransport` and `ErrorTransport` isolate cookie/CSRF/refresh and error parsing
- Shared types for invites, feedback, pagination, and governance live under `$lib/types`
- Boundary CI (`scripts/check-route-boundary.sh`) blocks FastAPI driver imports outside `src/lib/api/drivers`
- Provider registry: `fastapi` + `supabase` **ready**; `holochain` unimplemented; `template` experimental
- Supabase driver under `src/lib/api/drivers/supabase/` talks to `web-supabase` Auth + `gateway`
- Backend workspaces: `web-supabase` (parity local + hosted path), `web-holochain` (placeholder)
- Compatibility checklist: [`PROVIDER_CONTRACTS.md`](./PROVIDER_CONTRACTS.md)
- Implementation checklist: [`PROVIDER_IMPLEMENTATION_CHECKLIST.md`](./PROVIDER_IMPLEMENTATION_CHECKLIST.md)

## Deploy paths

| Path | Frontend env | Backend workspace | Status |
|------|--------------|-------------------|--------|
| FastAPI (live default) | `VITE_BACKEND=fastapi` | `web-backend` | Production / Railway |
| Supabase local | `VITE_BACKEND=supabase` + local JWT keys | `web-supabase` | Ready for local signoff |
| Supabase hosted | same + hosted `VITE_SUPABASE_*` | cloud project + deployed `gateway` | Dress rehearsal → [CUTOVER.md](../../web-supabase/docs/CUTOVER.md) |

Supabase is **not** required for FastAPI deploys. FastAPI remains the rollback target during hosted beta.

## Local guides
- Supabase: [`../../web-supabase/docs/LOCAL_DEV.md`](../../web-supabase/docs/LOCAL_DEV.md)
- Backend switching: [`BACKEND_SWITCHING.md`](./BACKEND_SWITCHING.md)
- Hosted: [`../../web-supabase/docs/HOSTED.md`](../../web-supabase/docs/HOSTED.md)
- Signoff: [`../../web-supabase/docs/SIGNOFF.md`](../../web-supabase/docs/SIGNOFF.md)
- Parity / oracle: [`../../web-supabase/docs/PARITY_AUDIT.md`](../../web-supabase/docs/PARITY_AUDIT.md), [`../../web-supabase/docs/FASTAPI_ORACLE.md`](../../web-supabase/docs/FASTAPI_ORACLE.md)
- FastAPI: [`../../web-backend/README.md`](../../web-backend/README.md)

## What is ready on the FastAPI backend

See [`../../web-backend/docs/PROVIDER_SEAMS.md`](../../web-backend/docs/PROVIDER_SEAMS.md):

- Domain errors + HTTP mapping
- Ports for auth, cache, token revocation, search, access policy, people suggestions, notifications, messaging, feeds
- Postgres/Redis adapters wrapping current behavior
- Pure tag visibility policy in `app/domain/access_policy.py`

## Holochain

Long-horizon track. Frontend driver scaffold and [`../../web-holochain/`](../../web-holochain/) placeholder exist for orientation. Do not attempt parity until feeds, moderation electorates, and messaging have non-centralized domain models. See `web-holochain/notes/REDESIGN_SURFACES.md`.
