# Provider Contracts

Stable contracts that any backend provider (FastAPI today, Supabase later, Holochain much later) must satisfy. Product UI depends on these shapes through `AppAdapter`, not on transport details.

## Layers

```
UI / routes
  → queries / commands / session / errors
    → AppAdapter + SessionTransport + ErrorTransport
      → driver (fastapi | future)
        → HTTP / SDK / other transport
```

Frontend-owned contracts live under `src/lib/types/`. Drivers map provider payloads into those shapes.

## Frontend product types (authoritative)

| Area | Module |
|------|--------|
| Auth / account | `src/lib/types/account.ts` |
| Bootstrap / viewer | `src/lib/types/bootstrap.ts` |
| Feeds / create inputs | `src/lib/types/feed.ts` |
| Pagination | `src/lib/types/pagination.ts` |
| Governance refs | `src/lib/types/governance.ts` |
| Detail pages | `src/lib/types/detail/` |
| Inbox / messages | `src/lib/types/inbox.ts` |
| Scopes | `src/lib/types/scope.ts` |
| Invites | `src/lib/types/invites.ts` |
| Feedback | `src/lib/types/feedback.ts` |
| Search | `src/lib/types/search.ts` |
| Locations | `src/lib/types/location.ts` |

Invite, feedback, pagination, and governance types are shared so `AppAdapter` and alternate drivers do not import feature folders or FastAPI modules.

## Governance contract (explicit refs)

| Method | Required input |
|--------|----------------|
| `setVote` | `VoteTargetRef { id, type }` |
| `addComment` | `CommentSubjectRef { id, type }` + body + optional parentId |
| `submitReport` | subjectId + `ReportTargetRef { id, type }` + reason + details |

`type` must be a `GovernanceEntityType` (`thread` \| `post` \| `comment` \| `event` \| `project` \| `help_request` \| `message`). Drivers must use the explicit type on the wire — do not resolve type from `$lib/services/governanceEntityRegistry`.

## Session and error transports

Beyond `AppAdapter` methods, every provider must supply:

- `SessionTransport` — refresh, CSRF/cookie hints, cold-start restore (`src/lib/services/sessionTransport.ts`)
- `ErrorTransport` — extract/normalize API errors (`src/lib/services/errorTransport.ts`)

FastAPI registers these in `src/lib/api/drivers/index.ts`.

## Capability model

Registry metadata includes capability negotiation (`src/lib/api/drivers/registry.ts`):

| Class | Meaning | Examples |
|-------|---------|----------|
| `required` | Universal contract every ready provider must support | session, feeds, governance, messaging |
| `optional` | Product may degrade when missing | (reserved) |
| `centralizedOnly` | Assumes a coordinating server; Holochain may opt out | platform board, IP geolocation hint, invite codes |
| `distributedRedesign` | Needs a different product model later | agent-centric identity |

Helpers:

- `getProviderCapability(name, id)`
- `providerSupports(name, id)`
- `listCapabilitiesByClass(class)`

Use these before exposing centralized-only UI behind alternate providers.

## Compatibility checklist for a new provider

A second provider is ready for smoke use when it can:

1. Restore an authenticated session on cold start (or clearly report anonymous).
2. Load bootstrap + unread counts.
3. Paginate public / home / personal feeds with sort + window filters (`FeedPageResult`).
4. Enforce the same visibility semantics for closed communities and private events.
5. Show moderation state (`visible` / `under_review` / `hidden` / `removed`) on feed and detail surfaces.
6. Search entities and respect access filtering.
7. Deliver messaging + linked-chat comments via adapter methods (no driver imports in UI).
8. Keep notification unread counts coherent with mark-read actions.
9. Accept **explicit** governance entity refs for vote / comment / report (no registry inference).

## Boundary rules

- `src/routes`, `src/lib/features`, `src/lib/utils`, and `src/lib/services` (except driver wiring) must not import `$lib/api/drivers/fastapi/*`.
- CI enforces this via `scripts/check-route-boundary.sh`.
- Reads go through `queries/*`; writes go through `commands/*`.
- Contract types live in `$lib/types/*`, not under `features/*`.

## HTTP contract today

Current FastAPI OpenAPI / router Pydantic models are the live wire format. Drivers translate snake_case HTTP fields into camelCase product types. Do not treat raw SQLAlchemy column names or internal service dict keys as the public contract.

See also: [ADAPTERS.md](./ADAPTERS.md), [PROVIDER_IMPLEMENTATION_CHECKLIST.md](./PROVIDER_IMPLEMENTATION_CHECKLIST.md), [WEB_BACKEND_CONTRACT.md](./WEB_BACKEND_CONTRACT.md).
