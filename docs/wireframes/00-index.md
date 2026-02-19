# Social Production — Wireframe Documentation

Wireframe specifications for the Social Production federated platform.

## Overview

Social Production is a federated system for localized production management. The UI follows a flex-based layout with responsive columns and conditional elements based on authentication state.

### Tech Stack

- Vite + ReactJS + TypeScript
- GRPC for backend communication

---

## Document Index

| Document | Description |
| -------- | ----------- |
| [01 — Shared Layout](01-layout.md) | Top Bar, Content Wrapper, and Global Actions |
| [02 — Front Page: Logged Out](02-front-page-logged-out.md) | Landing page for unauthenticated users |
| [03 — Front Page: Logged In](03-front-page-logged-in.md) | Dashboard for authenticated users |
| [04 — Post Page: Thread](04-post-page-thread.md) | Full view of a Thread post with comments |
| [05 — Post Page: Project](05-post-page-project.md) | Full view of a Project post with members, events, and updates |
| [06 — Reusable Components](06-components.md) | Feed Post, Event, Comment, Fund, and other shared components |

---

## Wireframe Images

| Image | Description |
| ----- | ----------- |
| [Front Page — Logged Out](images/front-page-logged-out.png) | Three-column layout with public feeds and activities |
| [Front Page — Logged In](images/front-page-logged-in.png) | Full dashboard with personal feeds, search, and actions |
| [Post Page — Thread](images/post-page-thread.png) | Thread post with nested comment discussion |
| [Post Page — Project](images/post-page-project.png) | Project post with members, events, updates, and comments |

---

## Authentication States

The UI changes significantly based on whether a user is logged in. Key differences:

### Logged Out
- Top bar shows Log In / Sign Up buttons
- No search bar
- No "My Feed" tab or menu item
- No action buttons (Add Thread, Add Project)
- No RSVP controls on events
- No Contribute button on funds
- No comment form
- No Reply button on comments
- No New Channel button

### Logged In
- Top bar shows Alerts, Notifications, Log Out
- Search bar in page actions
- "My Feed" tab and menu item visible
- Add Thread / Add Project buttons in feed actions
- RSVP dropdowns on events
- Contribute button on fund campaigns
- Comment form visible on post pages
- Reply button on comments
- New Channel button in sidebar
- My Events section in activities sidebar

---

## Layout System

All layouts use CSS flexbox with the following ratios:

| Context | Flex Values | Purpose |
| ------- | ----------- | ------- |
| Page structure | Top Bar `1` / Content `3` | Vertical page split |
| Top Bar | Logo `1` / Page Actions `3` / Global Actions `1` | Horizontal bar sections |
| Content Wrapper | Padding `1` / Content `3` / Padding `1` | Centered content |
| Front Page Content | Menu `1` / Feeds `3` / Activities `1` | Three-column layout |
| Feed Header | Tabs `3` / Actions `1` | Tab bar with action buttons |
| Feed Post | Vote `1` / Details `3` | Post card layout |
| Post Wrapper | Vote `1` / Post `3` | Full post layout |
