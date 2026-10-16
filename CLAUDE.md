# web (SvelteKit, Svelte 5 in legacy `export let` mode)

## Layout
- Data flow: `src/lib/services/{queries,commands}` → `currentAdapter` → `src/lib/api/drivers/fastapi/domains/*` (supabase/holochain drivers are stubs; keep the adapter boundary, `scripts/check-route-boundary.sh` enforces it).
- Shell: `src/lib/app/shell/AppShell.svelte` (rails, map panel, bottom nav `MobileBottomNav.svelte`, `CallHost`, `ToastHost`).
- Project/event detail: `src/lib/features/projects/ProjectDetailPage.svelte`, lifecycle phases under `features/projects/detail/lifecycle/**`, events under `features/events/detail/**`.
- Bottom action bar: `components/shared/PhaseWorkToolbar.svelte` packs buttons into one row; phase moves live in `components/shared/PhaseMenu.svelte` (one button → sheet of options).
- Activities: `features/projects/detail/components/ActivitySchedulingPanel.svelte`, agenda rows `components/cards/project-detail/ActivityAgendaList.svelte` + `CollapsibleActivityCard.svelte` (`agenda` prop), wizard `components/shared/ActivityCreationWizard.svelte` (modal via `PlanWizardShell`).
- Chat: `components/chat/LiveChatPanel.svelte` (all chats), DMs page `features/messages/MessagesPage.svelte`.
- Calls: `src/lib/calls/{session.ts,media.ts,CallHost.svelte,tones.ts}`.
- Map: `features/map/MapPanel.svelte`; `stores/mapFocus.ts` `openPlaceOnMap()` opens it on a place.
- Toasts: `stores/toast.ts` `showToast`; mutations wrapped with `services/commands/confirm.ts`.

## Gotcha
In these legacy components a template call to a function with no arguments (`{label()}`) does not re-run when the state it reads changes. Pass the state as arguments or compute it in a `$:` statement.

## Checks
- `npm run smoke` (svelte-check + builds; what CI runs), `bash scripts/check-route-boundary.sh`, `npx vitest run`, `npm audit --audit-level=high`.
- E2E against local dev: `E2E_SKIP_WEBSERVER=1 npx playwright test e2e/<spec>`.
- Only prettier new files; the repo isn't prettier-clean, so don't reformat whole files.
