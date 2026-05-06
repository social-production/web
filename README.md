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
- the product model as expressed by the frontend
- the route and page map
- the file and module rules for building the frontend cleanly
- the UI and card rules that shape Public, Personal, and detail surfaces
- the frontend-to-backend boundary the UI depends on

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
- [docs/PRODUCT_MODEL.md](docs/PRODUCT_MODEL.md)
- [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md)
- [docs/UI_BUILD_RULES.md](docs/UI_BUILD_RULES.md)
- [docs/ROUTES_AND_SURFACES.md](docs/ROUTES_AND_SURFACES.md)
- [docs/WEB_BACKEND_CONTRACT.md](docs/WEB_BACKEND_CONTRACT.md)
- [docs/ADAPTER_SHAPE.md](docs/ADAPTER_SHAPE.md)

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