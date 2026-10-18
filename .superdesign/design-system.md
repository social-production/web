# Social Production — design system (visual polish)

Use this as the source of truth for every draft. Prefer existing tokens over inventing new colors.

## Brand & product

- Product: **Social Production** — civic / mutual-aid style social network (threads, events, help requests, projects).
- Tone: calm, utilitarian, trustworthy — not flashy SaaS marketing.
- Dark-first UI (default). Light theme exists; drafts may show dark unless asked otherwise.

## Color tokens (must reuse)

| Role | Token | Dark value |
|------|-------|------------|
| Page | `--page-background` | `#181a1b` |
| Surface / card | `--panel` | `#1e1f22` |
| Elevated | `--panel-strong` | `#2d3035` |
| Soft / input | `--panel-soft` | `#25282d` |
| Border | `--panel-border` | `#33363c` |
| Text | `--text-main` | `#f3f4f6` |
| Muted | `--text-soft` | `#bbc0c9` |
| Brand | `--brand` | `#5dd691` |
| Brand strong | `--brand-strong` | `#8fd4a9` |
| Brand soft | `--brand-soft` | `#21372b` |
| Warm accent | `--accent-warm` | `#e59a55` |
| Toolbar | `--toolbar-background` | `#1b1d21` |
| Side rail | `--side-panel-background` | `#222429` |

Type accents (left bar / chips): `--type-accent-thread` `#37679e`, `--type-accent-event` `#6d46a4`, `--type-accent-help-request` `#c56a24`, `--type-accent-project-production` `#2f8a57`, and siblings for service / post / channel / community / platform / neutral.

Radius: `--radius-lg` 8px, `--radius-md` 6px, `--radius-sm` 4px. Shadow: none by default.

## Typography

- Family today: Inter / Segoe UI (product may later shift — do not invent decorative display fonts for app chrome).
- Body ~14px / 1.45. Titles heavier; meta quieter (`--text-soft`).
- Hierarchy: title > meta line > body excerpt > footer actions.

## Layout patterns (keep)

- **Feed rows**: full-bleed list rows on `--panel`, hairline bottom border, optional **3px left type accent** (not cards-in-cards unless exploring that branch).
- **Settings**: section list + content; danger zone for Sign out.
- **Messages**: conversation list + thread pane; unread must be obvious; empty states quiet.
- Shell: icon-only top toggles stay icon-only — do not redesign the shell chrome in these drafts.

## Fidelity constraints

1. Do not invent a purple SaaS theme, cream+serif editorial look, or neon glow aesthetic.
2. Keep green brand `#5dd691` as primary interactive accent.
3. Prefer denser, clearer rhythm over decorative chrome.
4. Mobile target ~390px width; desktop feed ~720–900px content column inside shell.
5. Accessibility: touch targets ≥44px where primary actions sit; readable contrast on soft text.
