# Theme tokens — Social Production web

Source: `src/app.css` (+ shared surface/title rules from `FeedSurface.svelte`).

## Part 1: Compact token summary

### Base palette (`:root` — default dark)

| Token | Value | Role |
|-------|-------|------|
| `--page-background` | `#181a1b` | Page canvas |
| `--panel` | `#1e1f22` | Cards, surfaces |
| `--panel-strong` | `#2d3035` | Elevated panels, chips |
| `--panel-hover` | `#2d3035` | Hover state |
| `--panel-soft` | `#25282d` | Inputs, menus |
| `--panel-border` | `#33363c` | Borders |
| `--text-main` | `#f3f4f6` | Primary text |
| `--text-soft` | `#bbc0c9` | Secondary text |
| `--brand` | `#5dd691` | Primary accent |
| `--brand-strong` | `#8fd4a9` | Accent hover/active |
| `--brand-soft` | `#21372b` | Accent backgrounds |
| `--brand-badge` | `#2a4635` | Badge fill |
| `--status-yellow` / `-strong` / `-soft` | `#f0d34f` / `#ffe89c` / `#4a4016` | Status chips |
| `--accent-warm` / `-strong` / `-soft` | `#e59a55` / `#f1bd84` / `#3a281b` | Warm accent |
| `--thread-chip` / `-text` | `#1e3044` / `#a9cbff` | Thread chips |
| `--event-chip` / `-text` | `#302544` / `#c9b4ff` | Event chips |
| `--surface-thread` / `-border` | `#25282d` / `#353942` | Thread surfaces |
| `--toolbar-background` | `#1b1d21` | Topbar |
| `--side-panel-background` | `#222429` | Side rails |
| `--status-dark` / `--status-light` | `#50555d` / `#f3f4f6` | Status contrast |
| `--shadow` | `none` | Elevation |
| `--radius-lg` / `-md` / `-sm` | `8px` / `6px` / `4px` | Corner radius |

### Type / tablet accent tokens (`:root`)

Per-surface accent colors for feed rows and tablets: `--type-accent-thread`, `--type-accent-event`, `--type-accent-help-request`, `--type-accent-project-production`, `--type-accent-project-service`, `--type-accent-project-personal-service`, `--type-accent-post`, `--type-accent-channel`, `--type-accent-community`, `--type-accent-platform`, `--type-accent-neutral`.

Matching tablet bg/text pairs: `--tablet-thread-bg/text`, `--tablet-event-bg/text`, `--tablet-help-request-bg/text`, `--tablet-project-production-bg/text`, `--tablet-project-service-bg/text`, `--tablet-project-personal-service-bg/text`, `--tablet-post-bg/text`, `--tablet-channel-bg/text`, `--tablet-community-bg/text`, `--tablet-platform-bg/text`, `--tablet-neutral-bg/text`.

### Shell / layout tokens (`:root`)

| Token | Value |
|-------|-------|
| `--shell-safe-top/bottom/left/right` | env safe-area insets (bottom capped at 34px) |
| `--shell-touch-min` | `44px` |
| `--shell-bottom-nav-base` | `56px` |
| `--shell-bottom-nav-height` | base + safe bottom |
| `--shell-bottom-nav-offset` | `0px` (AppShell overrides) |
| `--shell-scrim` | `color-mix(in srgb, var(--text-main) 42%, transparent)` |

### Light theme overrides (`html[data-theme='light']`, `body[data-theme='light']`)

| Token | Light value |
|-------|-------------|
| `--page-background` | `#ffffff` |
| `--panel` / `--panel-strong` / `--panel-soft` | `#ffffff` |
| `--panel-hover` | `#f4f4f5` |
| `--panel-border` | `#e4e4e7` |
| `--text-main` | `#18181b` |
| `--text-soft` | `#71717a` |
| `--brand` / `--brand-strong` | `#2f8a57` |
| `--brand-soft` | `#e8f5ee` |
| `--brand-badge` | `#d6eadc` |
| `--toolbar-background` | `#ffffff` |
| `--side-panel-background` | `#fafafa` |
| `--surface-thread` / `-border` | `#ffffff` / `#e4e4e7` |
| `--status-dark` / `--status-light` | `#d4d4d8` / `#18181b` |

All `--type-accent-*` and `--tablet-*` tokens also remap to lighter palette values (see Part 2).

### Global typography & controls (app.css)

- Font: `'Inter', 'Segoe UI', sans-serif` at 14px / 1.45 line-height
- Headings: weight 800
- Shared button classes: `.button-primary`, `.button-secondary`, `.button-ghost`, `.toggle-chip`
- Detail actions: `.detail-action-button`, `.detail-surface-tab`
- Helper: `.helper-text`, `.status-note`

---

## Part 2: CSS variable blocks

### `:root` (lines 3–80)

```css
:root {
  color-scheme: light dark;
  --page-background: #181a1b;
  --panel: #1e1f22;
  --panel-strong: #2d3035;
  --panel-hover: #2d3035;
  --panel-soft: #25282d;
  --panel-border: #33363c;
  --text-main: #f3f4f6;
  --text-soft: #bbc0c9;
  --brand: #5dd691;
  --brand-strong: #8fd4a9;
  --brand-soft: #21372b;
  --brand-badge: #2a4635;
  --status-yellow: #f0d34f;
  --status-yellow-strong: #ffe89c;
  --status-yellow-soft: #4a4016;
  --accent-warm: #e59a55;
  --accent-warm-strong: #f1bd84;
  --accent-warm-soft: #3a281b;
  --thread-chip: #1e3044;
  --thread-chip-text: #a9cbff;
  --event-chip: #302544;
  --event-chip-text: #c9b4ff;
  --tablet-thread-bg: #37679e;
  --tablet-thread-text: #a9cbff;
  --tablet-event-bg: #6d46a4;
  --tablet-event-text: #c9b4ff;
  --tablet-help-request-bg: #c56a24;
  --tablet-help-request-text: #f1bd84;
  --tablet-project-production-bg: #2f8a57;
  --tablet-project-production-text: #95e2aa;
  --tablet-project-service-bg: #a16207;
  --tablet-project-service-text: #fde68a;
  --tablet-project-personal-service-bg: #924317;
  --tablet-project-personal-service-text: #e1a17f;
  --tablet-post-bg: #6f4a30;
  --tablet-post-text: #e0c3ff;
  --tablet-channel-bg: #9e7b12;
  --tablet-channel-text: #f3dc84;
  --tablet-community-bg: #be4646;
  --tablet-community-text: #ffb4bf;
  --tablet-platform-bg: #5489c6;
  --tablet-platform-text: #9fd4ff;
  --tablet-neutral-bg: #676b73;
  --tablet-neutral-text: #d5dae2;
  --type-accent-thread: #37679e;
  --type-accent-event: #6d46a4;
  --type-accent-help-request: #c56a24;
  --type-accent-project-production: #2f8a57;
  --type-accent-project-service: #ca8a04;
  --type-accent-project-personal-service: #924317;
  --type-accent-post: #6f4a30;
  --type-accent-channel: #9e7b12;
  --type-accent-community: #be4646;
  --type-accent-platform: #5489c6;
  --type-accent-neutral: #676b73;
  --surface-thread: #25282d;
  --surface-thread-border: #353942;
  --toolbar-background: #1b1d21;
  --side-panel-background: #222429;
  --status-dark: #50555d;
  --status-light: #f3f4f6;
  --shadow: none;
  --radius-lg: 8px;
  --radius-md: 6px;
  --radius-sm: 4px;
  --shell-safe-top: env(safe-area-inset-top, 0px);
  --shell-safe-bottom: min(env(safe-area-inset-bottom, 0px), 34px);
  --shell-safe-left: env(safe-area-inset-left, 0px);
  --shell-safe-right: env(safe-area-inset-right, 0px);
  --shell-touch-min: 44px;
  --shell-bottom-nav-base: 56px;
  --shell-bottom-nav-height: calc(var(--shell-bottom-nav-base) + var(--shell-safe-bottom));
  --shell-bottom-nav-offset: 0px;
  --shell-scrim: color-mix(in srgb, var(--text-main) 42%, transparent);
}
```

### Light theme (lines 87–151)

```css
html[data-theme='light'],
body[data-theme='light'] {
  color-scheme: light;
  --page-background: #ffffff;
  --panel: #ffffff;
  --panel-strong: #ffffff;
  --panel-hover: #f4f4f5;
  --panel-soft: #ffffff;
  --panel-border: #e4e4e7;
  --text-main: #18181b;
  --text-soft: #71717a;
  --brand: #2f8a57;
  --brand-strong: #2f8a57;
  --brand-soft: #e8f5ee;
  --brand-badge: #d6eadc;
  --status-yellow: #d3ae1b;
  --status-yellow-strong: #7e6600;
  --status-yellow-soft: #fef9c3;
  --accent-warm: #c2410c;
  --accent-warm-strong: #c2410c;
  --accent-warm-soft: #ffedd5;
  --thread-chip: #e8f0fa;
  --thread-chip-text: #225799;
  --event-chip: #f0e8fa;
  --event-chip-text: #6b43a8;
  --tablet-thread-bg: #3f70ab;
  --tablet-thread-text: #225799;
  --tablet-event-bg: #7b50b2;
  --tablet-event-text: #6b43a8;
  --tablet-help-request-bg: #d97736;
  --tablet-help-request-text: #9d5410;
  --tablet-project-production-bg: #2f8a57;
  --tablet-project-production-text: #266740;
  --tablet-project-service-bg: #ca8a04;
  --tablet-project-service-text: #854d0e;
  --tablet-project-personal-service-bg: #8e3e12;
  --tablet-project-personal-service-text: #6e3413;
  --tablet-post-bg: #7a5234;
  --tablet-post-text: #714c91;
  --tablet-channel-bg: #b28715;
  --tablet-channel-text: #866800;
  --tablet-community-bg: #ca5050;
  --tablet-community-text: #a0394a;
  --tablet-platform-bg: #5e91d0;
  --tablet-platform-text: #266a8a;
  --tablet-neutral-bg: #a1a1aa;
  --tablet-neutral-text: #52525b;
  --type-accent-thread: #3f70ab;
  --type-accent-event: #7b50b2;
  --type-accent-help-request: #d97736;
  --type-accent-project-production: #2f8a57;
  --type-accent-project-service: #ca8a04;
  --type-accent-project-personal-service: #8e3e12;
  --type-accent-post: #7a5234;
  --type-accent-channel: #b28715;
  --type-accent-community: #ca5050;
  --type-accent-platform: #5e91d0;
  --type-accent-neutral: #a1a1aa;
  --surface-thread: #ffffff;
  --surface-thread-border: #e4e4e7;
  --toolbar-background: #ffffff;
  --side-panel-background: #fafafa;
  --status-dark: #d4d4d8;
  --status-light: #18181b;
}
```

### Shared `.surface` / `.title` rules

Not defined in `app.css`; live in `FeedSurface.svelte`:

```css
.surface {
  position: relative;
  min-width: 0;
  max-width: 100%;
  padding: 18px 12px;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid var(--panel-border);
  box-shadow: none;
  background: var(--panel);
  transition: background-color 0.16s ease;
}

.surface.has-accent {
  border-left: 3px solid var(--row-accent, var(--type-accent-neutral));
  padding-left: 9px;
}

.surface.last-row {
  border-bottom: none;
}

.content :global(.title),
.content :global(a.title),
.content :global(.subject-title) {
  display: block;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  font-weight: 800;
  letter-spacing: -0.02em;
}
```
