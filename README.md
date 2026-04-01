# Social Production Web Prototype

This README is for human readers.

If you are working with an AI agent or implementation tooling, start with [PLAN.md](PLAN.md).

## Status

This repo is an older React prototype and reference workspace.

It is not the lead product implementation track.

The canonical current product direction lives in:

- [planning/README.md](https://github.com/social-production/planning/blob/main/README.md)
- [planning/CONTRIBUTOR_GUIDE.md](https://github.com/social-production/planning/blob/main/CONTRIBUTOR_GUIDE.md)
- [planning/APPLICATION/README.md](https://github.com/social-production/planning/blob/main/APPLICATION/README.md)
- [app/README.md](https://github.com/social-production/app/blob/main/README.md)

## What This Repo Is Still Good For

- older wireframes and screen ideas
- prototype copy, layout experiments, and reference flows
- extracting useful UI ideas into the planning repo or Flutter app

## What This Repo Is Not

- not the canonical architecture source of truth
- not the active backend integration track
- not the repo to use for current phase planning
- not evidence of the current product scope

Some older files in this repo describe superseded assumptions from an earlier prototype direction. Prefer the planning repo whenever there is any conflict.

## Current Prototype Scope

This repo still contains a runnable mock-data web prototype built with Vite and React.

Useful areas include:

- [docs/wireframes](docs/wireframes): older reference wireframes
- [src](src): mock-data prototype implementation
- [src/PROJECT_OVERVIEW.md](src/PROJECT_OVERVIEW.md): older product framing and copy references

## Running The Prototype

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

Treat it as a reference prototype, not as the current real app path.

## Contributing

Only make changes here if one of these is true:

- you are preserving or clarifying useful reference material
- you are cleaning up stale prototype documentation
- you are extracting ideas that should later move into [the planning repo](https://github.com/social-production/planning) or [the app repo](https://github.com/social-production/app)

If you want to work on the current product direction, start in [planning/CONTRIBUTOR_GUIDE.md](https://github.com/social-production/planning/blob/main/CONTRIBUTOR_GUIDE.md).
