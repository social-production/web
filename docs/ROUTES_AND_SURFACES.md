# Routes And Surfaces

## Goal

This document defines the surface map for the first web frontend.

It is not the final implementation, but it is the route and page ownership contract the implementation should follow.

## Top-Level Surfaces

### Public

- route: `/`
- purpose: shared public network feed
- content: public projects, public threads, public standalone events, and other shared network activity

### Personal

- route: `/personal`
- purpose: follow-based feed plus native posts
- content: personal posts and followed-user activity

### Assets

- route: `/assets`
- purpose: collective asset visibility surface
- note: this surface should be able to exist in a reduced or hidden mode when asset-holding features are turned off

### Roadmap

- route: `/roadmap`
- purpose: visible roadmap surface in the top navigation
- content: current roadmap, phase explanation, and future direction

### Notifications

- route: `/notifications`
- purpose: inbox for project, governance, and logistics updates

### Messages

- route: `/messages`
- purpose: direct and group conversation surface

### Search

- route: `/search`
- purpose: cross-entity discovery

### Settings

- route: `/settings`
- purpose: account, appearance, feed, and future frontend settings

## Discovery And Scope Surfaces

### Channel Page

- route: `/channels/[slug]`
- purpose: public topic-based feed of tagged projects, threads, and standalone events

### Community Page

- route: `/communities/[slug]`
- purpose: social coordination space around shared work and identity
- note: communities can be open or private and may require invite access

### Platform

- route: `/platform`
- purpose: governance surface for platform coordination and board discussion
- note: board members are the moderators of this channel

## Detail Surfaces

### Project Detail

- route: `/projects/[slug]`
- purpose: structured work surface

Project discovery rules:

- every project must have at least one channel tag
- community tags are optional additional context
- a project must never be discoverable only through a private community

Expected phase-one subviews inside the page:

- Overview
- Discussion
- Updates
- Activity
- Tasks
- Plans
- Managers

Later-phase subviews can be added later without changing the route identity.

### Thread Detail

- route: `/threads/[slug]`
- purpose: focused discussion page

### Standalone Event Detail

- route: `/events/[slug]`
- purpose: one-off event page

### Profile

- route: `/profile/[handle]`
- purpose: user page with activity, roles, channels, communities, following, and followers

## Create Surfaces

These should each get their own page file even if some later open in modal form.

- `/create/project`
- `/create/thread`
- `/create/event`
- `/create/community`
- `/create/channel`
- `/create/post`

## Phase 1 Versus Later Phases

### Phase 1 Core Surfaces

- Public
- Personal
- Roadmap
- Notifications
- Messages
- Search
- Settings
- Profile
- Channels
- Communities
- Projects
- Threads
- Standalone events
- Create flows

### Later-Phase Or Deferred Surfaces

The following may appear later, but should not shape the first web build as if they are active:

- community funding execution when feature flags are off
- legal asset-holding execution when feature flags are off
- collective asset network operations
- p2p-specific surfaces

## Mock-App Mapping

The web frontend should preserve these surface distinctions from the mock app:

- Public and Personal are separate top-level feeds
- project activity stays inside project detail
- standalone events keep their own detail surfaces
- channels and communities are distinct scope pages
- notifications and messages are distinct surfaces
- settings and profile are distinct surfaces
- roadmap is first-class, not hidden in documentation only

## Ownership Rule

Every surface listed here should have its own route-level page file.

Do not collapse these surfaces into one generic feed page plus conditionals.