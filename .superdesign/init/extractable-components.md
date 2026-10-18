# Extractable components catalog

Components suitable for Superdesign extraction — name, source, category, props, hardcoded values.

## Layout

### AppShell topbar

| Field | Value |
|-------|-------|
| **Name** | AppShell Topbar |
| **Source** | `src/lib/app/shell/AppShell.svelte` (lines ~618–915 markup, ~1007–1447 styles) |
| **Category** | layout |
| **Props** | `bootstrap`, `isCompact`, `leftRailOpen`, `rightRailOpen`, `searchExpanded`, `topbarCollapsed`, `mapSurfaceActive`, `isAuthSurface` (internal state + bootstrap payload) |
| **Hardcoded** | Brand text "Social Production"; brand icon PNG path `$lib/assets/brand/app-icon-no-background-full-white.png`; search placeholder "Search projects, threads, events, and channels"; rail widths 262px / 292px via CSS vars; topbar height ~53px |

### AppShell left rail

| Field | Value |
|-------|-------|
| **Name** | Left Rail Panel |
| **Source** | `AppShell.svelte` aside `.left-rail` + `src/lib/features/left-rail/LeftRailPanel.svelte` |
| **Category** | layout |
| **Props** | `bootstrap`, `isActive`, `closePanels`; `data-open` on aside |
| **Hardcoded** | Background `var(--side-panel-background)`; compact width `min(86vw, 320px)`; slide transform |

### AppShell right rail

| Field | Value |
|-------|-------|
| **Name** | Right Rail / Activity Panel |
| **Source** | `AppShell.svelte` aside `.right-rail` + `src/lib/features/right-rail/RightRailPanel.svelte` |
| **Category** | layout |
| **Props** | `items`, `historyItems`, `viewerId`; `data-open` on aside |
| **Hardcoded** | Same rail dimensions/scrim as left; activity badge on toggle via `CountBadge` |

### Mobile bottom nav

| Field | Value |
|-------|-------|
| **Name** | Mobile Bottom Nav |
| **Source** | `src/lib/app/shell/MobileBottomNav.svelte` (mounted from AppShell) |
| **Category** | layout |
| **Props** | `viewerLoggedIn`, `notificationCount`, `messageCount`, `moreActive`, `collapsed`, `isActive`, `onMore` |
| **Hardcoded** | Tab hrefs `/`, `/personal`, `/notifications`, `/messages`; height from `--shell-bottom-nav-height` (56px + safe area) |

---

## Basic / feed chrome

### FeedSurface

| Field | Value |
|-------|-------|
| **Name** | FeedSurface |
| **Source** | `src/lib/components/cards/shared/FeedSurface.svelte` |
| **Category** | basic |
| **Props** | `tone: 'public' \| 'personal'`, `href`, `accent`, `isLast`, `contentRestricted`, `clampExcerpts` |
| **Hardcoded** | Padding 18px 12px; border-bottom only; left accent border 3px; restriction banner copy "Serious harm report — content blurred until you choose to reveal it." |

### CreateFab

| Field | Value |
|-------|-------|
| **Name** | CreateFab |
| **Source** | `src/lib/app/shell/CreateFab.svelte` |
| **Category** | layout |
| **Props** | `open` (bindable), `viewerLoggedIn` |
| **Hardcoded** | FAB 52×52px, brand green `#fff` icon; menu width `min(86vw, 320px)`; section kickers "Content" / "Surfaces"; menu items from `createMenuItems.ts` |

### IconMenuButton

| Field | Value |
|-------|-------|
| **Name** | IconMenuButton |
| **Source** | `src/lib/components/shared/IconMenuButton.svelte` |
| **Category** | basic |
| **Props** | `value`, `ariaLabel`, `options[]`, `showOptionIcons`, `showTriggerLabel`, `defaultValue`, `portaled`, `preferAbove` |
| **Hardcoded** | Trigger 32×32px; menu min-width 168px; z-index 80; checkmark "✓" for selected item |

### SurfaceTypeLabel

| Field | Value |
|-------|-------|
| **Name** | SurfaceTypeLabel |
| **Source** | `src/lib/components/cards/shared/SurfaceTypeLabel.svelte` |
| **Category** | basic |
| **Props** | `kind: SubjectKind`, `projectMode: ProjectMode` (default `'productive'`) |
| **Hardcoded** | Font 12px weight 600; gap 6px; label/color from `surfaceTypeLabel()` / `surfaceTypeAccent()` utils |

### Settings toggles

| Field | Value |
|-------|-------|
| **Name** | Settings Toggle |
| **Source** | `src/lib/features/settings/SettingsPage.svelte` (`.toggle` / `.toggle.on` classes, lines ~507–603 markup, ~772–807 styles) |
| **Category** | basic |
| **Props** | N/A — page-level; toggles bind to `data.*` settings fields via `on:click` handlers |
| **Hardcoded** | Off: `border 1px panel-border`, `background panel-soft`; On: `border-color brand`, `background brand-soft`, `color brand-strong`; padding 8px 14px; radius `var(--radius-sm)` |

### Related extractables (used inside above)

| Name | Source | Category | Props |
|------|--------|----------|-------|
| ScopeChip | `ScopeChip.svelte` | basic | `label`, `icon`, `href` |
| TagList | `TagList.svelte` | basic | `tags`, `columns`, `maxVisible` |
| ContentMetaRow | `ContentMetaRow.svelte` | basic | `authorUsername`, `authorHref`, `memberCount`, `createdAt`, `updatedAt`, `timeOnly` |
