# Adapters

The frontend adapter layer sits between routes/features and backend transport so product UI never talks to raw endpoints.

## Mental model

```
route or feature → queries/ (reads) or commands/ (writes) → AppAdapter → driver domains → HTTP
```

- `src/lib/services/adapters/` — `AppAdapter` interface and driver selection
- `src/lib/services/queries/` — read-side helpers used by routes and features
- `src/lib/services/commands/` — write-side helpers used by forms and buttons
- `src/lib/api/drivers/<backend>/` — transport + domain modules
- `src/lib/types/` — frontend-owned display types

Routes import **queries/commands only**. They must not import `$lib/api/drivers/fastapi/*` or call `fetch()` with hardcoded API paths. CI enforces the route boundary via `scripts/check-route-boundary.sh`.

## What the adapter is (and is not)

It is the thin translation layer inside the frontend repo:

- how the frontend asks for data
- which backend is active (`VITE_BACKEND`)
- how backend payloads become frontend shapes (`last_activity_at` → `lastActivityAt`)

It is not a separate product or repo, and it is not the backend itself.

## Production FastAPI driver

| Layer | Path |
|-------|------|
| Adapter interface | [`src/lib/services/adapters/types.ts`](../src/lib/services/adapters/types.ts) |
| Driver selection | [`src/lib/services/adapters/index.ts`](../src/lib/services/adapters/index.ts) |
| FastAPI driver | [`src/lib/api/drivers/fastapi/index.ts`](../src/lib/api/drivers/fastapi/index.ts) |
| HTTP client | [`src/lib/api/drivers/fastapi/client.ts`](../src/lib/api/drivers/fastapi/client.ts) |

Auth: httpOnly cookies (`credentials: 'include'`), CSRF double-submit (`X-CSRF-Token` ↔ `sp_csrf`), refresh on 401. Tests may use `Authorization: Bearer` with `X-Include-Tokens: true` on login.

### Method catalog (subset)

| AppAdapter method | FastAPI domain | HTTP |
|-------------------|----------------|------|
| `getBootstrap` / `getBootstrapSummary` | `bootstrap.ts` | `GET /bootstrap` |
| `getPublicFeed` / `getHomeFeed` / `getPersonalFeed` | `feeds.ts` | `GET /feeds/...` |
| `signIn` / `signUp` / `signOut` | `auth.ts` | `POST /auth/...` |
| `getProject` / project mutations | `projects.ts` | `/projects/...` |
| `getEvent` / event mutations | `events.ts` | `/events/...` |
| `getThread` / content | `content.ts` | `/content/...` |
| `getMessages` | `messages.ts` | `/messages/...` |
| `getSearch` | `search.ts` | `GET /search` |

Full interface: ~90 methods in `adapters/types.ts`. Contract payloads: [`WEB_BACKEND_CONTRACT.md`](./WEB_BACKEND_CONTRACT.md).

## Implementing a new backend driver

1. Copy [`src/lib/api/drivers/template/`](../src/lib/api/drivers/template/) to `src/lib/api/drivers/<name>/`.
2. Implement `client.ts` (base URL, JSON, credentials, CSRF, refresh).
3. Fill `domains/` mirroring `fastapi/domains/*`.
4. Export `createYourDriver(): AppAdapter` from `index.ts`.
5. Register in [`src/lib/api/drivers/index.ts`](../src/lib/api/drivers/index.ts).
6. Build with `VITE_BACKEND=<name>`.
7. Run `npm run check` and smoke against the backend.
8. Extend `WEB_BACKEND_CONTRACT.md` for new fields.

### Wire-up checklist

1. [ ] `client.ts`
2. [ ] `domains/auth.ts`, `bootstrap.ts`, `feeds.ts`
3. [ ] `domains/projects.ts`, `events.ts`, `content.ts`
4. [ ] `domains/messages.ts`, `search.ts`, `notifications.ts`, `scopes.ts`, `users.ts`, `governance.ts`
5. [ ] Assemble `AppAdapter` in `index.ts` and register the driver
6. [ ] `npm run check` + manual smoke

## Audit status

- Bootstrap, feeds, search, notifications, messages: queries + FastAPI domains
- Project/event detail mutations: `commands/projects` and `commands/events`
- Shared mutations (comments, reports, help-request roles): `commands/shared`
- Remaining cleanup: move layout bootstrap recovery further into `queries/bootstrap.ts`; keep shrinking oversized detail panels incrementally

## Practical rule

If you are about to write `fetch(...)` inside a route or card component, stop and put the call behind queries/commands → adapter instead.
