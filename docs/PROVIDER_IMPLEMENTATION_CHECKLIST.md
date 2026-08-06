# Provider Implementation Checklist

Deterministic steps to plug a new backend into Social Production without rewriting the frontend.

## Locked decisions

| Decision | Choice |
|----------|--------|
| Frontend repos | One: `web` |
| Switch mechanism | Build-time `VITE_BACKEND=fastapi\|supabase\|holochain` |
| Contract | Canonical `AppAdapter` + shared `$lib/types` + Session/Error transports |
| Backend layout | Separate workspaces/repos per provider |
| Access pattern | `queries/*` reads, `commands/*` writes |
| Governance | Explicit `GovernanceEntityRef` on vote / comment / report |

## Workspaces

| Workspace | Role |
|-----------|------|
| `web` | Single frontend; all drivers live under `src/lib/api/drivers/` |
| `web-backend` | FastAPI provider (ready; Railway live path) |
| `web-supabase` | Supabase starter workspace (scaffold; not ready) |
| `web-holochain` | Holochain minimal placeholder (orientation only) |

## Frontend switch point

File: [`src/lib/api/drivers/index.ts`](../src/lib/api/drivers/index.ts)

Registry + capability metadata: [`src/lib/api/drivers/registry.ts`](../src/lib/api/drivers/registry.ts)

```bash
VITE_BACKEND=fastapi npm run build   # production today / Railway
# VITE_BACKEND=supabase npm run build  # only after driver status=ready
```

## Scaffold layout already present

Supabase and Holochain frontend driver packages already have the beginner file structure:

```
src/lib/api/drivers/<supabase|holochain>/
  index.ts
  client.ts
  sessionTransport.ts
  errorTransport.ts
  README.md
  domains/
    auth.ts
    bootstrap.ts
    feeds.ts
    projects.ts
    events.ts
    content.ts
    helpRequests.ts
    messages.ts
    notifications.ts
    scopes.ts
    users.ts
    search.ts
    locations.ts
    feedback.ts
```

Backend starter workspaces:

- [`../../web-supabase/`](../../web-supabase/) — Auth/Postgres/Edge Function landing place + contract alignment docs
- [`../../web-holochain/`](../../web-holochain/) — redesign notes only; not an implementation project yet

## Checklist: finish a provider implementation

### A. Frontend driver (in `web`)

The package folders already exist for `supabase` and `holochain`. Remaining work:

1. [ ] Replace throw stubs in `client.ts`, transports, and `domains/*` with real implementations.
2. [ ] Map provider payloads into `$lib/types/*` (camelCase product shapes), including:
   - [ ] `$lib/types/pagination.ts` (`FeedPageResult`)
   - [ ] `$lib/types/governance.ts` (explicit entity refs)
3. [ ] Implement governance methods with **explicit** refs (no registry inference):
   - [ ] `setVote(target: VoteTargetRef, vote)`
   - [ ] `addComment(subject: CommentSubjectRef, body, parentId?)`
   - [ ] `submitReport(subjectId, target: ReportTargetRef, reason, details)`
4. [ ] Confirm transports + driver remain registered in `src/lib/api/drivers/index.ts`.
5. [ ] Fill `capabilities` map in `registry.ts` (`supported` / `planned` / `unsupported`).
6. [ ] Flip `status` from `unimplemented` → `ready` in `registry.ts`.
7. [ ] Run `bash scripts/check-route-boundary.sh && npm run check && npm run test`.
8. [ ] Smoke with `VITE_BACKEND=<name>` against the new backend.

For a brand-new provider name, copy from `src/lib/api/drivers/template/` / an existing scaffold package and register it the same way.

### B. Backend workspace (separate repo)

1. [ ] Use `web-supabase` (or create `web-<name>`).
2. [ ] Satisfy the smoke behaviors in [`PROVIDER_CONTRACTS.md`](./PROVIDER_CONTRACTS.md):
   - [ ] Auth restore / anonymous
   - [ ] Bootstrap + unread counts
   - [ ] Feed pagination (sort + window + `FeedPageResult`)
   - [ ] Closed-community / private-event visibility
   - [ ] Moderation states
   - [ ] Search + access filtering
   - [ ] Messaging + linked-chat comments
   - [ ] Notification mark-read coherence
   - [ ] Explicit governance entity types on vote / comment / report
3. [ ] Prefer implementing the same logical ports as `web-backend` (`AuthProvider`, `AccessPolicy`, `SearchProvider`, `CacheStore`, feeds/notifications/messaging ports).
4. [ ] Do **not** require the frontend to import provider SDKs outside the driver layer.
5. [ ] For Holochain: keep the placeholder minimal; mark `centralizedOnly` capabilities `unsupported` and expand only after redesign notes in `web-holochain/notes/`.

### C. Contract tests

1. [ ] Registry / capability / template / scaffold / governance tests pass (`src/lib/api/drivers/registry.test.ts`).
2. [ ] Add provider-specific smoke/e2e later under the provider workspace; keep UI tests backend-agnostic.

## Capability negotiation

Before enabling provider-specific UI, check:

```ts
import { providerSupports } from '$lib/api/drivers/registry';

if (providerSupports('fastapi', 'platformBoard')) {
  // show centralized board volunteering
}
```

| Class | Expectation |
|-------|-------------|
| `required` | Must be `supported` before `status=ready` |
| `centralizedOnly` | FastAPI/Supabase typically `supported`; Holochain may `unsupported` |
| `distributedRedesign` | Holochain track only; not required for Supabase |

## Supabase-first notes

Recommended first alternate **after** frontend contract hardening:

1. Keep relational domain semantics.
2. Implement auth with Supabase Auth in `web-supabase` (map `sub` → app user id).
3. Reuse Postgres where possible; swap Redis via `CacheStore` / `TokenRevocationStore` when needed.
4. Frontend driver may call Supabase directly **or** a thin BFF — as long as `AppAdapter` shapes stay identical.
5. Validate against `registry.test.ts` contract suite before expanding UI.
6. Keep Railway + FastAPI as the default deploy until registry `supabase` is `ready`.

## Holochain notes

Not a transport swap. Reuse frontend contracts and portable domain rules; redesign feeds, moderation electorates, messaging, and multi-table governance. Opt out of `centralizedOnly` capabilities via registry metadata. Keep `VITE_BACKEND=holochain` reserved until then. See [`../../web-holochain/`](../../web-holochain/).

## Related docs

- [`ADAPTERS.md`](./ADAPTERS.md) — adapter mental model + queries/commands split
- [`PROVIDER_CONTRACTS.md`](./PROVIDER_CONTRACTS.md) — stable shapes + capabilities + compatibility checklist
- [`PROVIDER_READINESS.md`](./PROVIDER_READINESS.md) — current readiness snapshot
- [`../../web-backend/docs/PROVIDER_SEAMS.md`](../../web-backend/docs/PROVIDER_SEAMS.md) — backend ports/adapters
- [`../../web-supabase/docs/CONTRACT_ALIGNMENT.md`](../../web-supabase/docs/CONTRACT_ALIGNMENT.md) — Supabase domain map
- [`../../web-holochain/docs/SCOPE.md`](../../web-holochain/docs/SCOPE.md) — Holochain scope limits