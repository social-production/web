# Frontend adapter audit

Audit date: March 2026. Goal: all product surfaces call the adapter boundary, not raw backend URLs.

## Entry points

| Layer | Path | Role |
|-------|------|------|
| Adapter interface | [`src/lib/services/adapters/types.ts`](../src/lib/services/adapters/types.ts) | `AppAdapter` contract |
| FastAPI driver | [`src/lib/api/drivers/fastapi/index.ts`](../src/lib/api/drivers/fastapi/index.ts) | Production driver |
| HTTP client | [`src/lib/api/drivers/fastapi/client.ts`](../src/lib/api/drivers/fastapi/client.ts) | Cookie auth, CSRF, refresh |
| Driver selection | [`src/lib/services/adapters/index.ts`](../src/lib/services/adapters/index.ts) | `VITE_BACKEND` switch |

## Rules (enforced by convention)

1. Route files (`src/routes/**`) import from `$lib/services/queries/*` or `$lib/services/commands/*`, not `apiClient` directly.
2. Domain modules (`src/lib/features/**`) do not call `fetch()` with hardcoded API paths.
3. Auth tokens live in httpOnly cookies; the driver uses `credentials: 'include'`.
4. Future P2P driver implements the same `AppAdapter` interface.

## Verified surfaces

- Bootstrap, feeds, search, notifications, messages: via queries + FastAPI domains
- Project/event detail mutations: via `commands/*` wrappers
- Auth: cookie session via [`domains/auth.ts`](../src/lib/api/drivers/fastapi/domains/auth.ts)

## Remaining cleanup targets

- [`+layout.ts`](../src/routes/+layout.ts) still coordinates bootstrap cache recovery; consider moving to `queries/bootstrap.ts`
- Detail panels (`ProjectLifecyclePanel`, `EventLifecyclePanel`, `ActivityHistorySection`) are large but domain-scoped; extract subcomponents incrementally without behavior changes

## CI

`npm run check` (svelte-check + paraglide) runs in GitHub Actions on every PR.
