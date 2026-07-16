# Backend driver implementation guide

How to wire a new backend behind the frontend `AppAdapter` contract.

## Quick start

1. Copy [`src/lib/api/drivers/template/`](../src/lib/api/drivers/template/) to `src/lib/api/drivers/<your-backend>/`.
2. Implement HTTP (or other transport) in `client.ts`.
3. Fill in domain modules under `domains/` (mirror `fastapi/domains/*`).
4. Export `createYourDriver(): AppAdapter` from `index.ts`.
5. Register in [`src/lib/api/drivers/index.ts`](../src/lib/api/drivers/index.ts).
6. Set `VITE_BACKEND=<your-backend>` at build time.

Contract shapes: [`WEB_BACKEND_CONTRACT.md`](./WEB_BACKEND_CONTRACT.md). Adapter rules: [`ADAPTER_SHAPE.md`](./ADAPTER_SHAPE.md).

## Layering

```
Route (+page.ts) → queries/ or commands/ → AppAdapter → driver/domains → HTTP
```

Routes must **not** import `$lib/api/drivers/fastapi/*` directly. Use `$lib/services/errors`, `session`, `queries`, `commands`.

## AppAdapter method catalog

| AppAdapter method | FastAPI domain | HTTP | Auth |
|-------------------|----------------|------|------|
| `getBootstrap` | `bootstrap.ts` | `GET /bootstrap` | optional cookie |
| `getBootstrapSummary` | `bootstrap.ts` | `GET /bootstrap/summary` | optional |
| `getPublicFeed` | `feeds.ts` | `GET /feeds/public` | optional |
| `getHomeFeed` | `feeds.ts` | `GET /feeds/home` | optional |
| `getPersonalFeed` | `feeds.ts` | `GET /feeds/personal` | required |
| `signIn` / `signUp` / `signOut` | `auth.ts` | `POST /auth/login` etc. | sets cookies |
| `getProject` | `projects.ts` | `GET /projects/{slug}` | optional |
| `getEvent` | `events.ts` | `GET /events/{slug}` | optional |
| `getThread` | `content.ts` | `GET /content/threads/{slug}` | optional |
| `getMessages` | `messages.ts` | `GET /messages/conversations` | required |
| `getSearch` | `search.ts` | `GET /search?q=` | optional |
| `createProject` | `projects.ts` | `POST /projects` | required + CSRF |
| `requestProjectPhaseChange` | `projects.ts` | `POST /projects/{slug}/phase-requests` | required + CSRF |

Full interface: [`src/lib/services/adapters/types.ts`](../src/lib/services/adapters/types.ts) (~90 methods). FastAPI wiring reference: [`src/lib/api/drivers/fastapi/index.ts`](../src/lib/api/drivers/fastapi/index.ts).

## Auth + CSRF (cookie backends)

- All requests: `credentials: 'include'`.
- Mutating requests: header `X-CSRF-Token` matching `sp_csrf` cookie (see [`client.ts`](../src/lib/api/drivers/fastapi/client.ts)).
- Session refresh: `POST /auth/refresh` on 401.
- Tests/API clients may use `Authorization: Bearer` + `X-Include-Tokens: true` on login.

## Wire-up checklist

1. [ ] `client.ts` — base URL, JSON, credentials, CSRF, refresh
2. [ ] `domains/auth.ts` — login/register/logout; session flag in browser
3. [ ] `domains/bootstrap.ts` — bootstrap + summary
4. [ ] `domains/feeds.ts` — public/home/personal/scope feeds
5. [ ] `domains/projects.ts` — detail + mutations
6. [ ] `domains/events.ts` — detail + mutations
7. [ ] `domains/content.ts` — threads, posts, help requests
8. [ ] `domains/messages.ts` — conversations, contacts
9. [ ] `domains/search.ts`, `notifications.ts`, `scopes.ts`, `users.ts`, `governance.ts`
10. [ ] `index.ts` — assemble `AppAdapter`
11. [ ] Register driver in `drivers/index.ts`
12. [ ] `npm run check` + manual smoke against backend
13. [ ] Update this doc if you add adapter methods
14. [ ] Extend `WEB_BACKEND_CONTRACT.md` for new payload fields

## Template driver

[`src/lib/api/drivers/template/`](../src/lib/api/drivers/template/) provides `notImplemented()` stubs for every `AppAdapter` method — compile-time checklist for new backends.
