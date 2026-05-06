# UI Build Rules

## Goal

These rules exist to keep the real web frontend cleaner than the mock app while preserving the same product logic.

## PWA-First Rule

The main target is repeated use through a mobile PWA.

That means:

- touch-friendly controls
- stable navigation without awkward browser friction
- fast surface changes
- clear installable-app behavior later
- no desktop-only assumptions baked into the core layout

Desktop still matters and should feel fully supported, but desktop should not define the whole information architecture.

This is one frontend used for both desktop and PWA/mobile. The product model and routes stay the same, but the shell must respond to screen size. Desktop can show more surrounding context. Mobile should usually show one active panel at a time and turn supporting navigation into drawers, sheets, tabs, or stacked pages.

## Public Versus Personal Rule

The frontend must keep Public and Personal visibly distinct.

### Public

Public is context-first.

It is more Reddit-like:

- topic and project context matter
- cards should foreground what the item is and where it belongs
- channel/community relevance matters
- threads, projects, governance activity, and open events can coexist in one shared stream

In Public, project, thread, and event cards should still feel like one public-feed family, but that does not mean they should match Personal cards. The public feed is about context, tags, and where something belongs in the network.

### Personal

Personal is actor-first.

It is more Twitter-like:

- the person matters first
- native posts live here
- followed-user public activity can appear here
- cards should foreground the actor and their action

Personal cards should visibly prioritize the actor, the action, and direct posting behavior. In the mock app, this shows up through the actor header and the different content rhythm compared with Public.

## Card Rule

Feeds use cards hydrated with the information that matters for that card type.

Recommended structure:

- one public feed-card composer or dispatcher
- one personal feed-card composer or dispatcher
- separate public card files for project, thread, and standalone event items
- separate personal card files for direct posts and followed-user public activity
- shared low-level primitives only where they truly overlap

The mock app suggests this split:

- Public shares some outer interaction treatment across project, thread, and event cards
- Personal also reuses some of that low-level treatment
- but Public and Personal are not the same card system and should not be described that way

What can be shared safely:

- tappable row container behavior
- vote and count controls when the interaction is the same
- tag chips and tag wraps
- text rendering helpers

What should stay separate:

- public-feed card composition
- personal-feed card composition
- actor-first headers versus context-first headers
- metadata ordering and emphasis

## Page Composition Rule

Pages shape feeds and detail surfaces, but they should take cards and sections as inputs rather than holding all markup inline.

Examples:

- Public feed page composes project, thread, and event cards
- Personal feed page composes post cards and personal activity cards
- profile page composes profile sections and activity cards

## Shell Rule

Keep the shell separate from pages.

The shell includes:

- top nav
- route switching
- shared layout regions
- mobile navigation behavior
- desktop navigation behavior
- global actions like search, notifications, messages, and settings entry

## Domain Language Rule

Do not collapse distinct product concepts into one generic UI shape.

Keep these distinctions visible:

- project activity versus standalone events
- channels versus communities
- notifications versus messages
- projects versus threads versus posts
- service projects versus production projects
- board members versus ordinary project managers

## File Ownership Rule

Each major page gets its own file.

Each major card composer gets its own file.

Public and Personal feed composers should each have their own file.

Type-specific card files can then sit underneath each feed system.

Shared low-level primitives can live in a shared folder, but do not force Public and Personal through one giant common card component.

Each major create flow gets its own file.

Avoid monolithic files that mix unrelated surfaces.

## Phase 1 Exclusion Rule

The UI must not imply that these later-phase features are already active by default in the first web build:

- community funds
- legal asset holding
- live collective asset network execution
- p2p-only infrastructure assumptions

These can appear in roadmap, future-facing explanation, or feature-flagged modules, but not as if they are automatically active product features.