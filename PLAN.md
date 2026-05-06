# Social Production Web Plan

## Purpose

Phase 1 exists to test whether Social Production works as a simpler web platform with a conventional backend before moving into legal asset holding, platform funding, and a future p2p backend.

The point is not to abandon the p2p direction. The point is to learn faster with a cleaner, usable web product now while p2p research can continue in parallel.

## Development Roadmap

### Phase 1 — Web Prototype

- conventional backend path
- FastAPI backend
- SvelteKit frontend
- PWA-first UX
- funding and legal asset-holding modules designed to be optional and off by default
- facilitation and coordination only

If this phase proves useful and productive, move to Phase 2.

### Phase 2 — Legal Entity And Funding

- nonprofit foundation formed
- community funding inside Social Production activated
- legal asset-holding layer comes online
- physical asset network becomes operational

### Phase 3 — P2P Backend

- ongoing R&D around Holochain, p2panda, or another viable path
- gradual migration away from the conventional backend
- frontend kept compatible through an adapter boundary rather than a full rewrite

### Phase 4 — Full Model

- shutdown-resistant infrastructure live
- broader non-market coordination at scale

## Phase 1 Frontend Goals

- make the product understandable and usable as a real web app
- keep the frontend clean enough that each major surface has its own file ownership
- preserve the product model already worked out in the mock app
- work especially well as a PWA on mobile while still being strong on desktop through a responsive shell rather than one fixed desktop layout
- separate settled phase-one features from later-phase features so the UI does not imply things that are not shipping yet
- allow funding and asset-holding UI modules to be designed now but hidden cleanly behind feature flags until the organization is ready

## Phase 1 Shipping Focus

This first web version should focus on:

- Public feed
- Personal feed
- Projects
- Threads
- Standalone events
- Channels
- Communities
- Platform
- Assets
- Search
- Notifications
- Messages
- Profiles
- Settings
- Roadmap tab
- Create flows for the main content families

## Phase 1 Explicit Exclusions

Do not treat these as launch requirements for the first web build:

- p2p runtime or p2p-specific UX assumptions
- full collective asset network operations

Community funding and legal asset-holding surfaces may still be designed in the frontend, but they should be off by default and the rest of the product must work cleanly without them.

## Implementation Order

1. Lock documentation and build rules.
2. Build the shell and route map.
3. Build Public and Personal feed composition.
4. Build detail surfaces for projects, threads, events, posts, channels, and communities.
5. Build search, notifications, messages, profile, settings, and roadmap.
6. Add creation flows.
7. Add PWA polish and responsive refinement.

## Core Constraint

The frontend must be written so it can speak to a normal backend now and a future p2p backend later through a replaceable adapter layer.

That means one frontend codebase, one product model, and one route system, with responsive layout changes between desktop and PWA/mobile rather than separate frontend products.