# Adapters

The frontend adapter layer sits between routes/features and backend transport so product UI never talks to raw endpoints.

## Mental model

```
route or feature → queries/ (reads) or commands/ (writes) → AppAdapter → driver domains → transport
```

- `src/lib/services/adapters/` — `AppAdapter` interface and driver selection
- `src/lib/services/queries/` — **read-only** helpers used by routes and features
- `src/lib/services/commands/` — **write** helpers used by forms and buttons
- `src/lib/api/drivers/<backend>/` — transport + domain modules
- `src/lib/types/` — frontend-owned display and contract types

Routes **and features** import **queries/commands/session/errors only**. They must not import `$lib/api/drivers/fastapi/*` or call `fetch()` with hardcoded API paths. CI enforces the boundary via `scripts/check-route-boundary.sh` (routes, features, utils, and service facades).

Session restore and error formatting go through `SessionTransport` / `ErrorTransport` registered by the active driver — not FastAPI client imports.

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

Auth: httpOnly cookies (`credentials: 'include'`), CSRF double-submit (`X-CSRF-Token` ↔ `sp_csrf`), silent cold-start `/auth/refresh` when a remembered CSRF cookie is present, then refresh on 401. `sessionStorage` `sp_session` is a same-tab UX hint only — never the refresh gate. Tests may use `Authorization: Bearer` with `X-Include-Tokens: true` on login.

### Method catalog (subset)

| AppAdapter method | FastAPI domain | HTTP |
|-------------------|----------------|------|
| `getBootstrap` / `getBootstrapSummary` | `bootstrap.ts` | `GET /bootstrap` |
| `getPublicFeedPage` / `getHomeFeedPage` / `getPersonalFeedPage` | `feeds.ts` | `GET /feeds/...` |
| `signIn` / `signUp` / `signOut` | `auth.ts` | `POST /auth/...` |
| `getProject` / project mutations | `projects.ts` | `/projects/...` |
| `getEvent` / event mutations | `events.ts` | `/events/...` |
| `getThread` / content | `content.ts` | `/content/...` |
| `setVote(target, vote)` | `content.ts` | `POST /governance/votes` |
| `addComment(subject, body, parentId?)` | `content.ts` | `POST /governance/comments` |
| `submitReport(subjectId, target, reason, details)` | `content.ts` | `POST /governance/reports` |
| `getMessages` | `messages.ts` | `/messages/...` |
| `getSearch` | `search.ts` | `GET /search` |

Full interface: ~90 methods in `adapters/types.ts`. Contract payloads: [`WEB_BACKEND_CONTRACT.md`](./WEB_BACKEND_CONTRACT.md).

### Governance entity refs (required)

Vote / comment / report calls take explicit refs from `$lib/types/governance`:

```ts
setVote({ id, type: 'thread' }, vote);
addComment({ id, type: 'project' }, body);
submitReport(subjectId, { id, type: 'comment' }, reason, details);
```

Drivers must **not** infer entity type from a frontend in-memory registry at the wire boundary. `governanceEntityRegistry` is optional UI convenience only.

## Queries vs commands

| Facade | Responsibility | Examples |
|--------|----------------|----------|
| `queries/*` | Reads / cache wrappers | `getPublicFeedPage`, `getSettings`, `getMessages` |
| `commands/*` | Mutations | `setVote`, `updateSettings`, `sendMessage`, `createProject` |

Command modules:

- `commands/shared.ts` — votes, comments, reports, help-request roles
- `commands/account.ts` — auth + follow + settings writes
- `commands/inbox.ts` — messaging / notification mark-read
- `commands/scopes.ts` — membership / invites / board votes
- `commands/create.ts` — create entity flows
- `commands/feedback.ts` — feedback submit
- `commands/locations.ts` — create location
- `commands/projects.ts` / `commands/events.ts` — detail mutations

## Shared contract types

| Module | Contents |
|--------|----------|
| `$lib/types/governance.ts` | `GovernanceEntityRef`, vote/comment/report refs |
| `$lib/types/pagination.ts` | `FeedPageResult`, `DEFAULT_FEED_PAGE_SIZE` |
| `$lib/types/feed.ts` | Feed item unions + create inputs |
| `$lib/types/detail/` | Detail page payloads |
| `$lib/types/invites.ts` / `feedback.ts` | Invite + feedback results |

Drivers must depend on `$lib/types/*`, not on `features/*` folders.

## Switching providers

Build-time only (`VITE_BACKEND`):

| Value | Status | Backend workspace |
|-------|--------|-------------------|
| `fastapi` | ready | `web-backend` (Railway live path) |
| `supabase` | unimplemented scaffold | `web-supabase` (starter workspace exists) |
| `holochain` | unimplemented scaffold | `web-holochain` (minimal placeholder) |
| `template` | experimental scaffold | n/a |

### Driver package shape (supabase / holochain)

Both alternate drivers now mirror the FastAPI package layout under `src/lib/api/drivers/<name>/`:

- `index.ts` — assembles `AppAdapter` from domain modules
- `client.ts` — SDK/HTTP placeholder
- `sessionTransport.ts` / `errorTransport.ts`
- `domains/*.ts` — one throw-stub file per required domain
- `README.md` — fill order / scope notes

Shared helpers: [`src/lib/api/drivers/scaffold.ts`](../src/lib/api/drivers/scaffold.ts).

Registry + capability metadata: [`src/lib/api/drivers/registry.ts`](../src/lib/api/drivers/registry.ts). Unimplemented providers fail at driver creation with a clear message. **Do not** set `VITE_BACKEND=supabase|holochain` for Railway deploys until registry `status` is flipped to `ready`.

Full plug-in steps: [`PROVIDER_IMPLEMENTATION_CHECKLIST.md`](./PROVIDER_IMPLEMENTATION_CHECKLIST.md).

## Contract tests

Provider-agnostic coverage lives in [`src/lib/api/drivers/registry.test.ts`](../src/lib/api/drivers/registry.test.ts):

- registry / `VITE_BACKEND` parsing
- capability negotiation
- template driver exhaustiveness
- supabase / holochain scaffold domain assembly
- AppAdapter / SessionTransport / ErrorTransport method coverage
- governance entity ref helpers
- pagination contract types
- compatibility checklist sync

## Audit status

- Bootstrap, feeds, search, notifications, messages: queries + FastAPI domains
- Mutations: `commands/*` (account, inbox, scopes, create, feedback, locations, shared, projects, events)
- Session/auth helpers: `SessionTransport` (no FastAPI imports outside the driver)
- Discussion refresh: `AppAdapter.getComments` via `queries/inbox` / `utils/detailChat`
- Shared invite + feedback + governance + pagination types: `$lib/types/*`
- Provider swap checklist: [`PROVIDER_CONTRACTS.md`](./PROVIDER_CONTRACTS.md)
- Alternate backend workspaces: [`../../web-supabase/`](../../web-supabase/), [`../../web-holochain/`](../../web-holochain/)
