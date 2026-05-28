# Social Production Web

This repo is the Phase 1 web frontend home for Social Production.

Phase 1 is a simpler web prototype used to test whether the platform can help real non-market production and coordination before the legal, funding, asset-holding, and p2p parts of the full model come online.

## Stack Direction

Phase 1 uses:

- SvelteKit for the frontend
- FastAPI as the likely conventional backend path
- PWA-first UX that still works well on desktop

Phase 1 absolutely includes a backend. This repo is just frontend-first for now. The backend may be built by a collaborator or here later, but the frontend should be planned so it can talk cleanly to a FastAPI backend now and a future p2p backend later.

## Current Status

This repo now contains a real SvelteKit frontend starter app.

Right now it uses a development adapter with local fake data so the frontend can be built and tested before the `web-backend` repo exists.

That means:

- the app shell is real
- the Public route is real
- the Personal route is real
- several other routes already exist as placeholders
- the current fake data lives in the frontend repo only as a temporary development tool

This is temporary on purpose.

The fake data is currently in the frontend repo because we are still building the frontend structure first. That lets us test layout, navigation, cards, and route ownership without also building the backend at the same time.

Later, when the `web-backend` repo exists, the frontend will stop reading from the local development adapter and will start reading from backend endpoints instead.

So the short version is:

- now: fake data in `web` so frontend work can move quickly
- later: fake or real data in `web-backend`, with the frontend talking to it through the adapter layer

The current development data lives here:

- `src/lib/services/adapters/dev/data.ts`

The current adapter entry point lives here:

- `src/lib/services/adapters/index.ts`

That split is there so we can swap the data source later without rewriting the route files.

## How To Run This

If you are new to programming, use these steps exactly.

### 1. Open the repo folder in a terminal

Make sure your terminal is inside the `web` folder.

### 2. Install the packages

Run:

```powershell
npm install
```

You usually do this the first time, and again any time dependencies change.

### 3. Start the local development server

Run:

```powershell
npm run dev
```

The terminal will show you a local address, usually something like:

```text
http://localhost:5173
```

Open that address in your browser.

### 4. What you should expect to see

At this stage you should be able to:

- open the Public feed
- open the Personal feed
- click around the shell navigation
- open placeholder routes for roadmap, notifications, messages, settings, create pages, and detail pages

Some routes are still placeholders on purpose. They exist now so the frontend structure is stable before deeper features are added.

### 5. Check whether the app is healthy

If you want to test whether the project is set up correctly, run:

```powershell
npm run check
```

That checks the Svelte and TypeScript setup.

You can also run:

```powershell
npm run build
```

That checks whether the app can build for production.

## Turn On Phase 2 Locally (Preview Only)

Phase 1 keeps acquisition and asset workflows off by default.

If you want to preview or edit those deferred screens on localhost, use these toggles.

### 1. Open the Phase scope toggle file

Edit:

- `src/lib/config/features/phaseScope.ts`

Set any deferred feature you want to test from `true` to `false` inside `phaseOneDeferredFeatures`.

Current deferred flags:

- `assets`
- `inventory`
- `acquisition`
- `assetManagementSubtype`

Example:

```ts
export const phaseOneDeferredFeatures = {
	assets: false,
	inventory: false,
	acquisition: false,
	assetManagementSubtype: false
} as const;
```

`false` means the feature is enabled locally.

### 2. Optional: show assets in shell bootstrap data

If you are testing navigation visibility tied to bootstrap flags, also edit:

- `src/lib/services/adapters/dev/data.ts`

Inside `getBootstrapFixture()`, set:

```ts
featureFlags: {
	assets: true,
	funding: false,
	platform: true
}
```

### 3. Restart and verify

After changing toggles:

```powershell
npm run dev
```

Then run:

```powershell
npm run check
```

Use this only for local development and editing. Keep defaults in Phase 1 mode unless you are intentionally working on Phase 2 behavior.

## What To Do If You See An Error About Node Types

If your editor says it cannot find the type definition file for `node`, that usually means dependencies were not installed yet, or the local package state is stale.

Run:

```powershell
npm install
```

Then rerun:

```powershell
npm run check
```

If that still fails, close and reopen the editor window so TypeScript reloads the project.

## What This Repo Is For

This repo should hold:

- the web frontend plan
- the implementation source for the frontend product model, routes, and adapters

This repo should not yet hold:

- detailed backend implementation work
- p2p backend design work
- legal/foundation implementation work
- live funding or asset-holding execution logic turned on by default

## Phase 1 Rules

- Build for a conventional backend now, but keep the frontend able to plug into a future p2p backend later.
- Treat the mock app as the main UX and flow reference.
- Treat the planning repo as the source for settled terminology.
- Keep Public and Personal as distinct feed experiences.
- Keep standalone events distinct from project activity.
- Treat land asset management and storage management as service projects, not separate project types.
- Reserve the Platform surface for nonprofit governance and board members, not ordinary project managers.
- Require projects to have at least one public channel tag. Community tags can be additional context, but projects must never be community-only.
- Treat communities as open or private social spaces. Private communities can require invite access, but they cannot become the only access path to a project.
- Design funding and asset-holding modules so they can be turned on later through feature flags without breaking the rest of the platform.
- Do not make mock data the default implementation path. If temporary fixtures are needed during development, keep them behind explicit development-only adapters.

## Document Map

- [PLAN.md](PLAN.md)

Supporting guidance is intentionally consolidated into this README and [PLAN.md](PLAN.md) so the Phase 1 frontend stays easier to maintain.

## Frontend Scaffold

The repo now includes a starter `src/` folder scaffold so implementation can begin without deciding every final file upfront.

It is intentionally light:

- route ownership starts in `src/routes/`
- domain work starts in `src/lib/features/`
- feed cards are split between `src/lib/components/cards/public-feed/` and `src/lib/components/cards/personal-feed/`
- low-level reusable card parts live in `src/lib/components/cards/shared/`
- backend adapters live in `src/lib/services/adapters/`

## Reference Sources

Use these as the main references while building:

- the mock app repo for current UX, navigation, and surface behavior
- the planning repo for product terminology and phase boundaries

The mock app is a design reference, not literal implementation truth. The web frontend should become cleaner than the mock app while preserving the same core model.

## Backend Driver System

The frontend is fully decoupled from any specific backend. All data access goes through a single `AppAdapter` interface (`src/lib/services/adapters/types.ts`). At runtime, a driver is selected based on the `VITE_BACKEND` environment variable and injected app-wide.

### Available drivers

| `VITE_BACKEND` | Driver | Description |
|---|---|---|
| `fastapi` | `createFastApiDriver()` | Real HTTP calls to a FastAPI/Python backend |
| `mock` (default) | `createMockDriver()` | In-memory dev adapter with seeded fixture data |

A Holochain driver (or any other backend) can be added by implementing `AppAdapter` and registering it in `src/lib/api/drivers/index.ts` - no routes or components need to change.

### Switching backends

Create or edit `web/.env.local` (gitignored, never committed):

**FastAPI (localhost):**
```env
VITE_BACKEND=fastapi
VITE_API_URL=http://localhost:8000
```

**Mock (offline dev, no backend needed):**
```env
VITE_BACKEND=mock
```

Or just delete `.env.local` entirely - mock is the default.

### Adding a new backend driver

1. Create `src/lib/api/drivers/<name>/index.ts` exporting `create<Name>Driver(): AppAdapter`
2. Implement every method in `AppAdapter` (see `src/lib/services/adapters/types.ts`)
3. Add the case to `src/lib/api/drivers/index.ts`
4. Set `VITE_BACKEND=<name>` in `.env.local`

The driver is the only layer that knows what backend it talks to. Auth strategy, data shapes, and transport are all internal to the driver.

### Known driver gaps (FastAPI)

These `AppAdapter` methods currently throw `"no backend endpoint yet"` - backend endpoints need adding before they work:

- `updateProjectDetails` - use `requestProjectEdit` (governance-approved) instead
- `setProjectActivityCommitment` / `setEventActivityCommitment` - adapter sends `roleLabel`, backend needs `role_id`
- `createProjectManualLinkRequest` / `setProjectManualLinkVote`
- `planProjectServiceRequest`
- `requestProjectServiceRequestSettingsChange` / `setProjectServiceRequestSettingsChangeVote`
- `toggleProjectServiceHistoryCompletion`

### Partial implementations (FastAPI)

These work but return incomplete data - backend endpoints need enriching:

- `getThread` / `getPost` - `authorUsername` defaults to `''`, discussion/comments not loaded
- `getChannel` / `getCommunity` - `feed` is always empty (no channel-scoped feed endpoint yet)
- `toggleEventGoing` - requires `getEvent(slug)` to have been called first in the same session