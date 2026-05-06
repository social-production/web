# Adapter Shape

## Purpose

This is the plain-English shape of the frontend adapter layer before code is written.

The adapter layer exists so route files and feature components do not talk directly to raw backend endpoints.

## Short Version

The frontend should call its own adapter functions.

Those adapter functions should call the current backend implementation.

Right now that backend implementation will likely be HTTP calls into the `web-backend` repo.

Later, the implementation behind the adapter can change without forcing route files and card components to change.

## What The Adapter Is Not

It is not a separate product.

It is not a separate repo by default.

It is not the same as the backend.

It is the thin translation layer inside the frontend repo that says:

- how the frontend asks for data
- where that data comes from right now
- how backend payloads are converted into frontend-friendly shapes

## Mental Model

Think of the flow like this:

`route or page -> feature query or command -> adapter -> web-backend endpoint`

That keeps page code simple.

## Recommended Shape

Use the scaffolded folders like this:

- `src/lib/services/adapters/` holds adapter interfaces and implementations
- `src/lib/services/queries/` holds read-side calls used by routes and features
- `src/lib/services/commands/` holds write-side calls used by forms and buttons
- `src/lib/types/` holds frontend-owned types

## Suggested Adapter Split

Keep the adapter split by product area, not by every individual page.

Suggested first adapter files later:

- `bootstrap adapter`
- `feed adapter`
- `projects adapter`
- `threads adapter`
- `events adapter`
- `channels adapter`
- `communities adapter`
- `search adapter`
- `messages adapter`
- `notifications adapter`

## Two Implementations To Expect

### 1. HTTP Adapter

This is the normal Phase 1 path.

It calls the `web-backend` repo through HTTP.

Example responsibilities:

- call `/api/bootstrap`
- call `/api/feed/public`
- call `/api/feed/personal`
- call project, thread, event, channel, and community detail endpoints
- return frontend-friendly objects

### 2. Development Adapter

This is optional but useful while the backend is incomplete.

It returns local fixture data using the same adapter function names.

That lets the frontend work continue even if some backend endpoints are not ready yet.

The important rule is that routes still call the adapter interface, not the fixtures directly.

## What Routes Should Import

Routes should import query or command functions.

Those query or command functions can call the current adapter.

That means route code stays focused on:

- loading data
- choosing UI states
- composing sections and cards

It should not be responsible for:

- building raw fetch URLs everywhere
- mapping backend payload quirks in page files
- deciding which backend mode is active

## Who Owns Types

The frontend should own its display-facing types.

That means the adapter can translate backend payloads into cleaner frontend shapes when needed.

Example:

- backend may return `last_activity_at`
- frontend type may use `lastActivityAt`

The adapter is the right place to do that translation.

## Feature Flags

Feature flags should come through the bootstrap flow and be available to the adapter-aware query layer.

That matters especially for:

- assets
- funding
- platform-specific surfaces

The adapter does not decide product policy, but it should pass feature availability through in a predictable shape.

## Very Small Example In Plain English

When the Public page loads:

1. The route calls a public-feed query.
2. The public-feed query calls the current feed adapter.
3. The HTTP feed adapter requests `GET /api/feed/public` from `web-backend`.
4. The adapter maps the response into frontend feed item types.
5. The page renders public project, thread, and event cards.

When the backend later changes internally, the route should not care as long as the adapter still returns the same frontend shape.

## Practical Rule

If you are ever about to write `fetch(...)` inside a route or card component, stop and move that call behind the adapter layer instead.