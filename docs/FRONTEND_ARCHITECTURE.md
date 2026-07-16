# Frontend architecture

Phase 1 frontend: SvelteKit + TypeScript, talking to FastAPI through a replaceable adapter so a future backend can swap in without rewriting routes.

## Data flow

```
Route (+page.ts / +page.svelte)
  → queries/ (reads) or commands/ (writes)
  → AppAdapter (currentAdapter)
  → driver domains (fastapi/domains/*)
  → HTTP client (cookies + CSRF)
```

Facades:

- `$lib/services/errors` — normalize API/load errors for routes
- `$lib/services/session` — session helpers for UI (not raw cookies)

Boundary rule (CI): route files must not import `$lib/api/drivers/fastapi/*`. Enforced by `scripts/check-route-boundary.sh`.

See [`ADAPTERS.md`](./ADAPTERS.md) for driver implementation and audit status.

## Layout

```
src/
  routes/                 # Surfaces only — load data, compose features
  lib/
    features/             # Domain UI (projects, events, feeds, messages, …)
    components/           # Shared primitives (discussion, chat, report, …)
    services/
      adapters/           # AppAdapter types + selection
      queries/            # Read helpers (details.ts = get* only)
      commands/           # Write helpers (projects, events, shared)
      errors.ts
      session.ts
    api/drivers/fastapi/  # Transport + domains (not imported from routes)
    types/                # Frontend-owned shapes
```

## Architectural rules

1. **Route files own surfaces** — one major product surface per route family; avoid a single mega-route.
2. **Pages compose** — routes assemble feature components; they do not own all card markup and form internals.
3. **Domain features stay separate** — projects, events, feeds, messages, etc. live under `lib/features/`.
4. **Cards are first-class** — public vs personal feed cards stay separate systems; share only true primitives.
5. **Shared shell stays separate** — nav, rails, layout chrome are not mixed into domain pages.
6. **Queries vs commands** — reads in `queries/`, mutations in `commands/`. Do not re-export mutations from `queries/details.ts`.
7. **Component size** — prefer focused panels (~200–400 lines). When a detail panel grows, extract sections under `features/<domain>/detail/` without changing behavior.

## Adding a feature (recipe)

1. **Type** — add or extend shapes in `src/lib/types/`.
2. **Adapter method** — add to `AppAdapter` in `services/adapters/types.ts`.
3. **Driver domain** — implement in `api/drivers/fastapi/domains/<area>.ts` and wire in `fastapi/index.ts`.
4. **Query or command** — thin wrapper in `services/queries/` or `services/commands/`.
5. **Feature component** — UI under `lib/features/<domain>/`.
6. **Route** — `+page.ts` loads via query; page composes the feature component.
7. **Contract** — update [`WEB_BACKEND_CONTRACT.md`](./WEB_BACKEND_CONTRACT.md) if the payload shape is new.
8. **Verify** — `bash scripts/check-route-boundary.sh && npm run check`.

## Feature-folder conventions

- Prefer `FeaturePage.svelte` plus `detail/` sections for large entities.
- Keep mutation handlers near the control that triggers them; call `commands/*`, then refresh via invalidate/reload patterns already used on detail pages.
- Do not hardcode `/api/...` URLs in features.

## Related docs

- [`ADAPTERS.md`](./ADAPTERS.md) — adapters and new-backend checklist
- [`ROUTES_AND_SURFACES.md`](./ROUTES_AND_SURFACES.md) — route map
- [`UI_BUILD_RULES.md`](./UI_BUILD_RULES.md) — UI construction
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Railway + beta runbook
- [`SECURITY.md`](./SECURITY.md) — cookie auth, CSP, boundary
