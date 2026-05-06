# Web Backend Contract

## Purpose

This document defines the first simple contract between the `web` frontend repo and the future `web-backend` repo.

The goal is not to finalize the whole backend. The goal is to know which fake endpoints to stand up first so the frontend can be built against a stable shape.

## Repo Split

- `web` owns routes, UI, feature composition, and frontend-side adapters
- `web-backend` owns HTTP endpoints, temporary fake responses, and later the real backend implementation

The frontend should be able to point at fake backend responses first and then keep the same adapter calls when the real backend logic replaces them.

## First Backend Goal

Support the shell and the first read-heavy surfaces before full write flows.

That means the first fake backend should let the frontend load:

- current viewer and feature flags
- Public feed
- Personal feed
- project detail
- thread detail
- standalone event detail
- channel page
- community page
- global search

## Phase 1 First Endpoint Set

### 1. Bootstrap

- `GET /api/bootstrap`

Use this to load the minimum shell state after app start.

Suggested response shape:

```json
{
  "viewer": {
    "id": "user_1",
    "handle": "mara",
    "displayName": "Mara Holt"
  },
  "featureFlags": {
    "assets": false,
    "funding": false,
    "platform": true
  },
  "unreadCounts": {
    "notifications": 4,
    "messages": 2
  }
}
```

### 2. Public Feed

- `GET /api/feed/public`

Optional query params can come later, but the first fake version should at least return a mixed list of project, thread, and standalone event summaries.

Suggested response shape:

```json
{
  "items": [
    {
      "kind": "project",
      "id": "project_1",
      "slug": "neighborhood-heat-pump-pilot",
      "title": "Neighborhood Heat Pump Pilot",
      "summary": "Research and coordinate a first retrofit round.",
      "channelTags": ["housing-build"],
      "communityTags": ["east-market"],
      "stage": "demand-signalling",
      "commentCount": 18,
      "signalCount": 124,
      "lastActivityAt": "2026-04-30T09:30:00Z"
    }
  ]
}
```

### 3. Personal Feed

- `GET /api/feed/personal`

This should return a mixed list of:

- direct personal posts
- followed-user public activity
- personal or private event entries when relevant

Suggested response shape:

```json
{
  "items": [
    {
      "kind": "post",
      "id": "post_1",
      "author": {
        "id": "user_2",
        "handle": "anika",
        "displayName": "Anika Shaw"
      },
      "body": "Anyone free to help sort donated tools tomorrow?",
      "commentCount": 6,
      "signalCount": 22,
      "createdAt": "2026-04-30T08:00:00Z"
    }
  ]
}
```

### 4. Project Detail

- `GET /api/projects/:slug`

This should return enough data to render the overview and the project tabs without forcing the frontend to guess at project structure.

Minimum fields:

- identity: `id`, `slug`, `title`, `summary`
- classification: `projectType`, `stage`
- context: `channelTags`, `communityTags`, `locationLabel`
- light counts: `memberCount`, `commentCount`, `signalCount`
- later tab payloads can be split into separate endpoints if needed

### 5. Thread Detail

- `GET /api/threads/:slug`

Minimum fields:

- `id`, `slug`, `title`, `body`
- `author`
- `channelTags`, `communityTags`
- `replyCount`, `signalCount`, `lastActivityAt`

### 6. Standalone Event Detail

- `GET /api/events/:slug`

Minimum fields:

- `id`, `slug`, `title`, `description`
- `isPrivate`
- `channelTags`, `communityTags`
- `timeLabel`, `locationLabel`
- `goingCount`

### 7. Channel Page

- `GET /api/channels/:slug`

Minimum fields:

- channel identity and description
- tagged projects
- tagged threads
- tagged standalone events

### 8. Community Page

- `GET /api/communities/:slug`

Minimum fields:

- community identity and description
- openness: `open` or `private`
- `requiresInvite`
- tagged projects, threads, and standalone events that the viewer is allowed to see

### 9. Search

- `GET /api/search?q=...`

Minimum fields:

- grouped or mixed results for projects, threads, events, channels, communities, and people

## First Write Endpoints After Read Surfaces

Once the shell and read surfaces are working, the next fake endpoints should be:

- `POST /api/personal/posts`
- `POST /api/projects`
- `POST /api/threads`
- `POST /api/events`

Those can stay simple at first.

## Backend Rules The Frontend Depends On

- every project must include at least one channel tag
- community tags are optional extra context for projects, not the only tag path
- communities may be private and invite-gated
- standalone events remain distinct from project activity
- feature flags must be able to turn assets and funding UI on or off

## Practical Start

If you want the smallest useful fake backend first, start with only these three endpoints:

- `GET /api/bootstrap`
- `GET /api/feed/public`
- `GET /api/feed/personal`

That is enough to start building the shell and both top-level feeds before the deeper detail routes are wired.