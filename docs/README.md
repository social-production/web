# Canonical documentation

Implementation docs for the web frontend and API contract live in this directory.

| Doc | Purpose |
|-----|---------|
| [`FRONTEND_ARCHITECTURE.md`](./FRONTEND_ARCHITECTURE.md) | Package layout, data flow, add-a-feature recipe |
| [`ADAPTERS.md`](./ADAPTERS.md) | Adapter model, driver checklist, audit status |
| [`WEB_BACKEND_CONTRACT.md`](./WEB_BACKEND_CONTRACT.md) | Frontend ↔ API payload contract |
| [`ROUTES_AND_SURFACES.md`](./ROUTES_AND_SURFACES.md) | Route map and surfaces |
| [`UI_BUILD_RULES.md`](./UI_BUILD_RULES.md) | UI construction rules |
| [`governance-rules.md`](./governance-rules.md) | Product governance rules |
| [`MODERATION_RULES.md`](./MODERATION_RULES.md) | Moderation policy |
| [`SECURITY.md`](./SECURITY.md) | Frontend security checklist |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Railway deploy + beta runbook |

If you find duplicated copies under the [`planning`](https://github.com/social-production/planning) repository, treat **`web/docs/`** as the source of truth for current Phase 1 (FastAPI + SvelteKit) development.

Long-term P2P / Rust architecture notes remain in `planning/LEGACY/` for historical context only.
