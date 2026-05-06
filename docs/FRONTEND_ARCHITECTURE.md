# Frontend Architecture

## Goal

Build the Phase 1 frontend so it is clean, modular, PWA-first, and able to talk to a simple conventional backend now while remaining compatible with a future p2p backend later.

Phase 1 includes a real backend. This repo is just frontend-first right now.

## Stack Direction

- SvelteKit
- TypeScript
- PWA-capable web app
- FastAPI as the likely phase-one backend path
- backend access through a replaceable adapter layer

## Architectural Rules

### 1. Route Files Own Surfaces

Each major product surface should have its own route-level file.

Examples:

- Public feed
- Personal feed
- Roadmap
- Notifications
- Messages
- Search
- Profile
- Settings
- Project detail
- Thread detail
- Event detail
- Channel page
- Community page

Avoid one giant route file that tries to hold the whole app.

### 2. Pages Compose; They Do Not Contain Everything

Route files should compose smaller domain pieces.

Pages should not also own all card markup, navigation logic, form internals, and data shaping in one place.

### 3. Domain Features Stay Separate

Use feature folders for distinct product domains such as:

- public feed
- personal feed
- projects
- threads
- events
- channels
- communities
- messages
- notifications
- settings
- profile
- search
- roadmap

### 4. Cards Are First-Class Components

Keep Public cards and Personal cards as separate card systems.

Recommended structure:

- one public feed card dispatcher or composer file
- one personal feed card dispatcher or composer file
- public card files for project, thread, and standalone event items
- personal card files for direct posts and followed-user public activity
- shared low-level primitives only where they are genuinely common, such as clickable row treatment, vote strips, count pills, tag wraps, and body text rendering

The mock app already shows the right separation here: Public cards are tag and context first, while Personal cards are actor and action first. They can share small UI primitives, but they should not be forced into one base card abstraction if that makes the two feeds blur together.

### 5. Shared Shell Stays Separate

The app shell should live separately from feature surfaces.

Shell concerns include:

- top navigation
- global layout
- feed shell
- mobile navigation behavior
- desktop navigation behavior
- cross-app search entry
- notifications/messages access

This is one frontend for both desktop and PWA/mobile.

That does not mean the layout stays identical at every size.

Desktop can use multi-region layouts when useful. Mobile and PWA layouts should collapse into a single active content panel with drawers, sheets, stacked navigation, or similar responsive patterns. Do not force persistent left and right rails onto phones.

### 6. Backend Calls Must Go Through An Adapter Boundary

The frontend should not bind route files or card components directly to one backend implementation.

Use an adapter or service layer so the UI can later swap from a conventional backend to a p2p backend without rewriting the whole frontend.

By default, keep that adapter layer inside the frontend repo under the normal services area. Do not create a separate adapter repo unless you later have multiple frontends or multiple clients that truly need to share the same client SDK.

In simple terms:

- SvelteKit owns pages, navigation, forms, and client-side UI state
- FastAPI would own the ordinary backend endpoints, auth, and server-side data operations
- the frontend should call its own services or adapters, not hardcode backend assumptions into page files
- later, a different adapter can replace the FastAPI one without changing the surface-level UI structure

If temporary fixtures are needed during frontend work, keep them isolated behind a development-only adapter. Do not bake mock data directly into route files or domain components.

If the backend work lives in a separate `web-backend` repo, that is fine. It can expose temporary stub or mock endpoints while the frontend is being built, and later those endpoints can be replaced by the real backend implementation without changing the frontend route structure.

## Proposed File Shape

This is the recommended starting shape once implementation begins:

```text
src/
  routes/
    +layout.svelte
    +page.svelte
    personal/+page.svelte
    roadmap/+page.svelte
    notifications/+page.svelte
    messages/+page.svelte
    search/+page.svelte
    settings/+page.svelte
    profile/[handle]/+page.svelte
    channels/[slug]/+page.svelte
    communities/[slug]/+page.svelte
    projects/[slug]/+page.svelte
    threads/[slug]/+page.svelte
    events/[slug]/+page.svelte
    create/project/+page.svelte
    create/thread/+page.svelte
    create/event/+page.svelte
    create/community/+page.svelte
    create/channel/+page.svelte

  lib/
    app/
      shell/
      navigation/
      roadmap/
    features/
      public-feed/
      personal-feed/
      projects/
      threads/
      events/
      channels/
      communities/
      messages/
      notifications/
      search/
      profile/
      settings/
    components/
      cards/
        public-feed/
        personal-feed/
        shared/
      forms/
      layout/
      navigation/
      feedback/
    config/
      features/
    services/
      adapters/
      queries/
      commands/
    stores/
    types/
    utils/
```

## State Boundaries

### UI State

Keep local UI state near the component or route that owns it.

Examples:

- open/closed panels
- selected feed filter
- selected project tab
- temporary draft text

### Shared Client State

Use shared stores only for app-wide state such as:

- current session/user
- theme and appearance
- unread counts
- shell preferences
- active adapter/backend mode

### Server-Facing State

Server-facing data should come through feature-level queries or loaders, not ad hoc calls scattered through the component tree.

## Mock-App Mapping Rule

The mock app is the main behavior reference.

Its Flutter structure should not be copied literally, but these semantic separations should survive:

- Public versus Personal
- standalone events versus project activity
- channels versus communities
- notifications versus messages
- shell navigation versus page content
- cards as reusable content surfaces

## Phase 1 Constraint

Do not design the frontend around legal asset holding, funding execution, or p2p-only assumptions.

Phase 1 should stay clean for a conventional backend while keeping the adapter seam ready for later phases.

Funding and asset-holding modules may still be designed now, but they should be controlled by explicit feature flags and the platform must behave cleanly with those flags off.