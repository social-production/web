# Governance Rules (Web)

This document captures governance behavior expected in the web frontend while Phase 1 is active.

## Phase Boundary

- Phase 1 ships coordination and facilitation workflows.
- Funding and asset execution remain deferred by default.
- Deferred modules are development-only unless explicitly enabled in feature scope toggles.

## Voting Baseline

- Governance decisions use explicit yes/no voting states.
- Quorum and approval thresholds are computed in shared governance helpers.
- Open requests remain pending until quorum and approval requirements are satisfied.

## Change Requests

- Lifecycle phase changes are requested through explicit change-request surfaces.
- Votes on phase changes are auditable and visible in decision history.
- Reverts are recorded as governance events rather than silent state changes.

## Service and Access Rules

- Service request settings changes require explicit request + vote flow.
- Access-sensitive defaults should remain conservative in Phase 1.
- Follow/privacy behavior should remain consistent across shell, profile, and feed surfaces.

## Adapter Contract Requirement

- UI state must hydrate from adapter-backed page data.
- Component rendering should not depend on hardcoded local-only state.
- As mock data is removed, behavior should remain stable by preserving query/adapter contracts.

## Notes

- This file is intentionally concise and should stay aligned with README and PLAN.
- Detailed implementation rules should live with feature modules and typed contracts.
