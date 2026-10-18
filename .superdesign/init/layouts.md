# App shell layouts

## AppShell.svelte

**Path:** `src/lib/app/shell/AppShell.svelte` (1644 lines — structural summary + key excerpts)

### Structural summary

| Section | Lines (approx) | Purpose |
|---------|----------------|---------|
| Script | 1–604 | Bootstrap payload, compact/desktop mode, left/right rail toggles, map overlay, toolbar live search, theme hint, scroll-hide chrome, CreateFab visibility, unread counts |
| Template `.shell` | 606–992 | Sticky topbar, map overlay, 3-column grid (rails + main), mobile bottom nav + more sheet |
| Styles | 996–1644 | Topbar, search, nav links, rails, main content, responsive compact rules |

**Key imports:** `LeftRailPanel`, `RightRailPanel`, `MobileBottomNav`, `MobileMoreSheet`, `CreateFab`, `SearchSuggestionsList`, `CountBadge`, `FeedToolbarIcon`, `GroupsIcon`.

**CSS custom properties set on `.shell`:** `--left-width`, `--right-width`, `--topbar-height`, `--topbar-natural-height`, `--compact-content-offset`, `--shell-bottom-nav-offset`, `--main-frame-max-width`.

**Layout flow:**

```
.shell
├── .topbar-flow-spacer (map only)
├── header.topbar
│   ├── brand / panel toggles / search / primary-nav / utility-nav
│   └── .nav-progress (during navigation)
├── .rail-backdrop (compact, when rail open)
├── section.map-overlay
└── .content-grid
    ├── aside.rail.left-rail → LeftRailPanel
    ├── main.main-content
    │   ├── .main-frame → <slot /> + detail skeleton
    │   └── CreateFab (conditional)
    └── aside.rail.right-rail → RightRailPanel
MobileBottomNav + MobileMoreSheet (compact, non-auth)
AuthActionNotice (portal)
```

### Topbar markup excerpt (lines 618–915)

```svelte
<header
  bind:this={topbarElement}
  class="topbar"
  class:search-expanded={isCompact && searchExpanded}
  class:topbar-compact={isCompact}
  class:chrome-collapsed={topbarCollapsed}
  class:topbar-map-pinned={mapSurfaceActive}
>
  {#if isCompact && searchExpanded}
    <form class="toolbar-search toolbar-search-expanded" role="search" on:submit={submitToolbarSearch}>
      <!-- expanded search input + SearchSuggestionsList -->
    </form>
  {:else}
    <a class="brand" href={...} aria-label={...}>
      <span class="brand-mark"><img alt="" class="brand-icon" src={brandIcon} /></span>
      <span><strong>Social Production</strong></span>
    </a>
    {#if !isAuthSurface}
      <div class="panel-controls">
        <button class="panel-toggle" on:click={toggleLeftRail}>...</button>
        <button class="panel-toggle panel-toggle-map" on:click={toggleMapPanel}>...</button>
        <button class="panel-toggle panel-toggle-right" on:click={toggleRightRail}>...</button>
      </div>
      <div class="toolbar-center">
        <!-- compact: search-open-button; desktop: toolbar-search + primary-nav -->
      </div>
      <nav class="utility-nav" aria-label="Utilities">...</nav>
    {/if}
  {/if}
  {#if showNavProgress}
    <div class="nav-progress"><span class="nav-progress-bar"></span></div>
  {/if}
</header>
```

### Rails + main + FAB excerpt (lines 934–991)

```svelte
<div bind:this={contentGridElement} class="content-grid" class:content-grid--map-open={mapSurfaceActive}>
  <aside class="rail left-rail" data-open={leftRailOpen && !isAuthSurface}>
    {#if !isAuthSurface}
      <LeftRailPanel {bootstrap} {isActive} closePanels={closeCompactPanels} />
    {/if}
  </aside>

  <main class="main-content" class:main-content-compact={isCompact}>
    <div class="main-frame">
      <slot />
      {#if showDetailSkeleton}<!-- skeleton -->{/if}
    </div>
    {#if showCreateFab}
      <CreateFab bind:open={createFabOpen} viewerLoggedIn={Boolean(bootstrap.viewer)} />
    {/if}
  </main>

  <aside class="rail right-rail" data-open={rightRailOpen && !isAuthSurface}>
    {#if rightRailOpen && !isAuthSurface}
      <RightRailPanel items={activityRailItems} historyItems={activityRailHistoryItems} ... />
    {/if}
  </aside>
</div>

{#if isCompact && !isAuthSurface}
  <MobileBottomNav viewerLoggedIn={...} notificationCount={...} messageCount={...} ... />
  <MobileMoreSheet {bootstrap} open={moreSheetOpen} ... />
{/if}
```

### Topbar CSS excerpt (lines 1007–1032, 1449–1531)

```css
.topbar {
  position: sticky;
  top: 0;
  z-index: 60;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  height: var(--topbar-natural-height, var(--topbar-height, 53px));
  padding: calc(8px + var(--shell-safe-top)) 12px 8px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--toolbar-background);
  transition: transform 0.22s ease, margin-top 0.22s ease;
}

.topbar.chrome-collapsed {
  transform: translateY(-100%);
  margin-top: calc(-1 * var(--topbar-natural-height, var(--topbar-height, 53px)));
  pointer-events: none;
}

.rail-backdrop {
  position: fixed;
  inset: var(--topbar-height) 0 var(--shell-bottom-nav-offset, 0px) 0;
  z-index: 45;
  background: var(--shell-scrim);
}

.content-grid {
  display: grid;
  grid-template-columns: var(--left-width) minmax(0, 1fr) var(--right-width);
  min-height: calc(100vh - var(--topbar-height));
}

.rail {
  min-width: 0;
  overflow-y: auto;
  padding: 12px;
  background: var(--side-panel-background);
}

.main-content {
  position: relative;
  min-width: 0;
  padding: 16px 20px 20px;
  background: var(--page-background);
}

.main-content-compact {
  padding: 12px 12px calc(12px + var(--shell-bottom-nav-offset));
}
```

### Compact rail + bottom-nav CSS excerpt (lines 1591–1642)

```css
@media (max-width: 1080px) {
  .rail {
    position: fixed;
    top: var(--topbar-height);
    bottom: var(--shell-bottom-nav-offset);
    z-index: 50;
    width: min(86vw, 320px);
    transition: transform 0.2s ease;
  }

  .left-rail { left: 0; transform: translateX(-100%); }
  .right-rail { right: 0; transform: translateX(100%); }
  .left-rail[data-open='true'],
  .right-rail[data-open='true'] { transform: translateX(0); }

  .main-content-compact {
    padding: 8px 8px calc(8px + var(--shell-bottom-nav-offset));
  }
}
```

**Bottom nav:** rendered by `MobileBottomNav.svelte` (fixed bar, tabs: Public `/`, Personal, Notifications, Messages, More). Uses `--shell-bottom-nav-height` / `--shell-bottom-nav-offset` from `app.css` + AppShell inline style.

---

## CreateFab.svelte (full — 287 lines)

**Path:** `src/lib/app/shell/CreateFab.svelte`
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import CreateMenuIcon from '$lib/app/shell/CreateMenuIcon.svelte';
  import { createContentLinks, createSurfaceLinks } from '$lib/app/shell/createMenuItems';
  import { captureCreateReturnState } from '$lib/stores/createReturnState';

  export let open = false;
  export let viewerLoggedIn = false;

  const dispatch = createEventDispatcher<{ close: void }>();

  function closeMenu() {
    open = false;
    dispatch('close');
  }

  function toggleMenu() {
    open = !open;
    if (!open) {
      dispatch('close');
    }
  }

  function handleNavigate() {
    captureCreateReturnState($page.url, typeof window !== 'undefined' ? window.scrollY : 0);
    closeMenu();
  }

  function handleBackdropClick() {
    closeMenu();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if viewerLoggedIn}
  {#if open}
    <button aria-label="Close create menu" class="fab-backdrop" type="button" on:click={handleBackdropClick}></button>
  {/if}

  <div class="create-fab-shell">
    {#if open}
      <div class="create-menu" role="menu" aria-label="Create">
        <div class="create-menu-header">
          <strong>Create</strong>
          <button class="create-menu-close" type="button" on:click={closeMenu}>Close</button>
        </div>
        <p class="menu-kicker">Content</p>
        {#each createContentLinks as link}
          <a class="create-menu-item" href={link.href} role="menuitem" on:click={handleNavigate}>
            <CreateMenuIcon icon={link.icon} />
            <span class="item-copy">
              <span class="item-label">{link.label}</span>
              <span class="item-description">{link.description}</span>
            </span>
          </a>
        {/each}

        <p class="menu-kicker menu-kicker-separated">Surfaces</p>
        {#each createSurfaceLinks as link}
          <a class="create-menu-item" href={link.href} role="menuitem" on:click={handleNavigate}>
            <CreateMenuIcon icon={link.icon} />
            <span class="item-copy">
              <span class="item-label">{link.label}</span>
              <span class="item-description">{link.description}</span>
            </span>
          </a>
        {/each}
      </div>
    {/if}

    <button
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={open ? 'Close create menu' : 'Create'}
      class="fab-button"
      class:fab-button-open={open}
      type="button"
      on:click={toggleMenu}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" class="fab-icon">
        {#if open}
          <path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none" />
        {:else}
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none" />
        {/if}
      </svg>
    </button>
  </div>
{/if}

<style>
  .fab-backdrop {
    position: fixed;
    inset: 0;
    z-index: 55;
    border: none;
    padding: 0;
    background: transparent;
    cursor: default;
  }

  .create-fab-shell {
    position: fixed;
    right: calc(var(--right-width, 0px) + 12px);
    bottom: calc(var(--shell-bottom-nav-offset, 0px) + 12px);
    z-index: 56;
    display: grid;
    justify-items: end;
    gap: 10px;
    pointer-events: none;
  }

  .create-fab-shell .fab-button,
  .create-fab-shell .create-menu {
    pointer-events: auto;
  }

  .fab-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--brand);
    color: #fff;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--brand) 35%, transparent);
    cursor: pointer;
    transition: transform 0.16s ease, background-color 0.16s ease;
  }

  .fab-button:hover {
    transform: scale(1.04);
  }

  .fab-button-open {
    background: var(--panel-strong);
    color: var(--text-main);
    border: 1px solid var(--panel-border);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--page-bg) 50%, transparent);
  }

  .fab-icon {
    width: 22px;
    height: 22px;
  }

  .create-menu {
    width: min(86vw, 320px);
    overflow: hidden;
    display: grid;
    gap: 2px;
    padding: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    box-shadow: 0 12px 32px color-mix(in srgb, var(--page-bg) 65%, transparent);
  }

  .create-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 8px 6px;
  }

  .create-menu-header strong {
    font-size: 13px;
    font-weight: 800;
  }

  .create-menu-close {
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .menu-kicker {
    margin: 0;
    padding: 4px 8px 2px;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .menu-kicker-separated {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
  }

  .create-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    text-decoration: none;
    transition: background-color 0.16s ease;
  }

  .create-menu-item:hover {
    background: var(--brand-soft);
  }

  .item-copy {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .item-label {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
  }

  .item-description {
    font-size: 12px;
    line-height: 1.3;
    color: var(--text-soft);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 1080px) {
    .fab-backdrop {
      background: color-mix(in srgb, var(--page-bg) 55%, transparent);
    }

    .create-fab-shell {
      right: 0;
      left: 0;
      bottom: 0;
      justify-items: stretch;
      padding: 0;
    }

    .create-menu {
      width: 100%;
      max-height: none;
      overflow: hidden;
      padding: 12px 12px calc(var(--shell-bottom-nav-offset, 0px) + 72px);
      border-radius: 16px 16px 0 0;
      border-bottom: none;
    }

    .create-menu-item {
      padding: 9px 8px;
    }

    .fab-button {
      position: absolute;
      right: 12px;
      bottom: calc(var(--shell-bottom-nav-offset, 0px) + 12px);
    }
  }

  @media (min-width: 1081px) {
    .create-fab-shell {
      right: calc(var(--right-width, 0px) + 20px);
      bottom: 20px;
    }
  }
</style>
```
