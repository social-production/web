<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import brandIcon from '$lib/assets/brand/app-icon-no-background-full-white.png';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import AuthActionNotice from '$lib/components/shared/AuthActionNotice.svelte';
  import LeftRailPanel from '$lib/features/left-rail/LeftRailPanel.svelte';
  import RightRailPanel from '$lib/features/right-rail/RightRailPanel.svelte';
  import { onMount } from 'svelte';
  import type { BootstrapPayload } from '$lib/types/bootstrap';

  export let bootstrap: BootstrapPayload;

  let isCompact = true;
  let leftRailOpen = false;
  let rightRailOpen = false;
  let toolbarQuery = '';
  let topbarElement: HTMLElement | null = null;
  let contentGridElement: HTMLDivElement | null = null;
  let topbarHeight = 53;
  let compactContentOffset = 0;

  $: if ($page.url.pathname === '/search') {
    toolbarQuery = $page.url.searchParams.get('q') ?? '';
  }

  function updateLayoutMetrics() {
    topbarHeight = Math.max(53, topbarElement?.getBoundingClientRect().height ?? 53);

    if (!isCompact || !contentGridElement) {
      compactContentOffset = 0;
      return;
    }

    const contentTop = contentGridElement.getBoundingClientRect().top;
    compactContentOffset = Math.max(0, topbarHeight - contentTop);
  }

  onMount(() => {
    const media = window.matchMedia('(max-width: 1080px)');
    const syncLayout = () => {
      isCompact = media.matches;
      if (media.matches) {
        leftRailOpen = false;
        rightRailOpen = false;
      } else {
        leftRailOpen = true;
        rightRailOpen = true;
      }

      requestAnimationFrame(updateLayoutMetrics);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateLayoutMetrics();
    });

    if (topbarElement) {
      resizeObserver.observe(topbarElement);
    }

    if (contentGridElement) {
      resizeObserver.observe(contentGridElement);
    }

    syncLayout();
    media.addEventListener('change', syncLayout);
    window.addEventListener('resize', updateLayoutMetrics);

    return () => {
      resizeObserver.disconnect();
      media.removeEventListener('change', syncLayout);
      window.removeEventListener('resize', updateLayoutMetrics);
    };
  });

  function isActive(href: string) {
    const pathname = $page.url.pathname;
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function toggleLeftRail() {
    leftRailOpen = !leftRailOpen;
    if (isCompact && leftRailOpen) {
      rightRailOpen = false;
    }
  }

  function toggleRightRail() {
    rightRailOpen = !rightRailOpen;
    if (isCompact && rightRailOpen) {
      leftRailOpen = false;
    }
  }

  function closeCompactPanels() {
    if (isCompact) {
      leftRailOpen = false;
      rightRailOpen = false;
    }
  }

  async function submitToolbarSearch(event: SubmitEvent) {
    event.preventDefault();
    const query = toolbarQuery.trim();
    await goto(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

</script>

<div
  class="shell"
  style={`--left-width: ${leftRailOpen && !isCompact ? '262px' : '0px'}; --right-width: ${rightRailOpen && !isCompact ? '292px' : '0px'}; --topbar-height: ${topbarHeight}px; --compact-content-offset: ${compactContentOffset}px; --main-frame-max-width: ${!isCompact && !leftRailOpen && !rightRailOpen ? '1280px' : !isCompact && (!leftRailOpen || !rightRailOpen) ? '1480px' : 'none'};`}
>
  <header bind:this={topbarElement} class="topbar">
    <a class="brand" href="/">
      <span class="brand-mark">
        <img alt="" class="brand-icon" src={brandIcon} />
      </span>
      <span>
        <strong>Social Production</strong>
      </span>
    </a>

    <div class="panel-controls">
      <button
        aria-label="Toggle left rail"
        aria-expanded={leftRailOpen}
        class="panel-toggle"
        data-active={leftRailOpen}
        type="button"
        on:click={toggleLeftRail}
      >
        <span aria-hidden="true" class="panel-toggle-icon">|&lt;</span>
      </button>
      <button
        aria-label="Toggle right rail"
        aria-expanded={rightRailOpen}
        class="panel-toggle"
        data-active={rightRailOpen}
        type="button"
        on:click={toggleRightRail}
      >
        <span aria-hidden="true" class="panel-toggle-icon">&gt;|</span>
      </button>
    </div>

    <div class="toolbar-center">
      <form class="toolbar-search" role="search" on:submit={submitToolbarSearch}>
        <input
          aria-label="Search"
          bind:value={toolbarQuery}
          class="toolbar-search-input"
          placeholder="Search projects, threads, events, and channels"
          type="search"
        />
      </form>

      <nav class="primary-nav" aria-label="Primary">
        <a class:active-link={isActive('/')} class="nav-link" href="/">Public</a>
        <a
          class:active-link={isActive('/personal')}
          class="nav-link"
          href={bootstrap.viewer ? '/personal' : '/onboarding'}
        >
          Personal
        </a>
        <a
          class:active-link={isActive('/notifications')}
          class="nav-link"
          href={bootstrap.viewer ? '/notifications' : '/onboarding'}
        >
          Notifications
          {#if bootstrap.unreadCounts.notifications > 0}
            <CountBadge count={bootstrap.unreadCounts.notifications} />
          {/if}
        </a>
        <a
          class:active-link={isActive('/messages')}
          class="nav-link"
          href={bootstrap.viewer ? '/messages' : '/onboarding'}
        >
          Messages
          {#if bootstrap.unreadCounts.messages > 0}
            <CountBadge count={bootstrap.unreadCounts.messages} />
          {/if}
        </a>
      </nav>
    </div>

    <nav class="utility-nav" aria-label="Utilities">
      <a class:active-link={isActive('/about') || isActive('/roadmap')} class="utility-link" href="/about">About</a>
      {#if bootstrap.viewer}
        <a
          class:active-link={isActive(`/profile/${bootstrap.viewer.username}`)}
          class="utility-link"
          href={`/profile/${bootstrap.viewer.username}`}
        >
          {bootstrap.viewer.username}
        </a>
        <a aria-label="Settings" class:active-link={isActive('/settings')} class="gear-button" href="/settings">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="gear-icon">
            <path
              d="M10.3 2h3.4l.5 2.4c.5.2 1 .4 1.5.6l2.1-1.2 2.4 2.4-1.2 2.1c.2.5.4 1 .6 1.5L22 10.3v3.4l-2.4.5c-.2.5-.4 1-.6 1.5l1.2 2.1-2.4 2.4-2.1-1.2c-.5.2-1 .4-1.5.6L13.7 22h-3.4l-.5-2.4c-.5-.2-1-.4-1.5-.6l-2.1 1.2-2.4-2.4 1.2-2.1c-.2-.5-.4-1-.6-1.5L2 13.7v-3.4l2.4-.5c.2-.5.4-1 .6-1.5L3.8 6.2l2.4-2.4 2.1 1.2c.5-.2 1-.4 1.5-.6L10.3 2Zm1.7 6.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 0 0 12 8.2Z"
              fill="currentColor"
            ></path>
          </svg>
        </a>
      {:else}
        <a class="utility-link" href="/onboarding">Signup/Login</a>
      {/if}
    </nav>
  </header>

  {#if isCompact && (leftRailOpen || rightRailOpen)}
    <button aria-label="Close side panels" class="rail-backdrop" on:click={closeCompactPanels}></button>
  {/if}

  <div bind:this={contentGridElement} class="content-grid">
    <aside class="rail left-rail" data-open={leftRailOpen}>
      <LeftRailPanel
        {bootstrap}
        compact={isCompact}
        {isActive}
        closePanels={closeCompactPanels}
      />
    </aside>

    <main class="main-content">
      <div class="main-frame">
        <slot />
      </div>
    </main>

    <aside class="rail right-rail" data-open={rightRailOpen}>
      <RightRailPanel compact={isCompact} items={bootstrap.activityRail} on:close={closeCompactPanels} />
    </aside>
  </div>
</div>

<AuthActionNotice />

<style>
  .shell {
    min-height: 100vh;
    background: var(--page-background);
    color: var(--text-main);
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    min-height: 52px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--panel-border);
    background: var(--toolbar-background);
  }

  .brand,
  .panel-controls,
  .toolbar-center,
  .primary-nav,
  .utility-nav {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .brand {
    gap: 10px;
    min-width: fit-content;
  }

  .brand strong {
    display: block;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--brand);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  }

  .brand-icon {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }

  .panel-controls {
    flex-wrap: wrap;
  }

  .panel-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 0 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
  }

  .panel-toggle {
    width: 36px;
    padding: 0;
  }

  .panel-toggle-icon {
    letter-spacing: -0.04em;
    font-weight: 800;
  }

  .panel-toggle:hover {
    border-color: var(--brand);
    color: var(--brand-strong);
    background: var(--brand-soft);
  }

  .panel-toggle[data-active='true'] {
    background: var(--panel-strong);
    color: var(--brand);
  }

  .toolbar-center {
    flex: 1 1 520px;
    min-width: 280px;
  }

  .toolbar-search {
    display: flex;
    align-items: stretch;
    flex: 0 1 320px;
    min-height: 38px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
  }

  .toolbar-search:hover,
  .toolbar-search:focus-within {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 50%, var(--panel-soft));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 30%, transparent);
  }

  .toolbar-search-input {
    border: none;
    background: transparent;
    color: var(--text-main);
    padding: 0 12px;
    min-height: 36px;
  }

  .toolbar-search-input:focus {
    border: none;
  }

  .primary-nav {
    flex: 1 1 260px;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .primary-nav::-webkit-scrollbar,
  .utility-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-link,
  .utility-link {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    transition: background-color 0.18s ease, color 0.18s ease;
  }

  .active-link,
  .nav-link:hover,
  .utility-link:hover {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .utility-nav {
    margin-left: auto;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .gear-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  }

  .gear-icon {
    width: 18px;
    height: 18px;
  }

  .gear-button:hover,
  .gear-button.active-link {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .rail-backdrop {
    position: fixed;
    inset: var(--topbar-height) 0 0;
    z-index: 45;
    background: rgba(7, 8, 10, 0.66);
    border: none;
    padding: 0;
  }

  .content-grid {
    display: grid;
    grid-template-columns: var(--left-width) minmax(0, 1fr) var(--right-width);
    min-height: calc(100vh - var(--topbar-height));
  }

  .rail {
    min-width: 0;
    overflow-y: auto;
    display: grid;
    gap: 12px;
    align-content: start;
    padding: 12px;
    background: var(--side-panel-background);
  }

  .left-rail {
    border-right: 1px solid var(--panel-border);
  }

  .right-rail {
    border-left: 1px solid var(--panel-border);
  }

  .rail[data-open='false'] {
    padding: 0;
    opacity: 0;
    pointer-events: none;
    border: none;
  }

  .main-content {
    min-width: 0;
    padding: 16px 20px 20px;
    background: var(--page-background);
  }

  .main-frame {
    width: 100%;
    max-width: var(--main-frame-max-width);
    margin: 0 auto;
  }

  @media (min-width: 1081px) {
    .rail {
      position: sticky;
      top: var(--topbar-height);
      min-height: calc(100vh - var(--topbar-height));
    }
  }

  @media (max-width: 1080px) {
    .toolbar-center {
      order: 4;
      flex-basis: 100%;
      flex-direction: column;
      align-items: stretch;
    }

    .toolbar-search {
      width: 100%;
      flex-basis: auto;
    }

    .primary-nav,
    .utility-nav {
      width: 100%;
      margin-left: 0;
    }

    .content-grid {
      grid-template-columns: 1fr;
      padding-top: var(--compact-content-offset);
    }

    .main-content {
      padding: 12px;
    }

    .rail {
      position: fixed;
      top: var(--topbar-height);
      bottom: 0;
      z-index: 50;
      width: min(86vw, 320px);
      padding: 12px;
      overflow-y: auto;
      opacity: 1;
      pointer-events: auto;
      transition: transform 0.2s ease;
    }

    .rail[data-open='false'] {
      padding: 12px;
      opacity: 1;
    }

    .left-rail {
      left: 0;
      transform: translateX(-100%);
      border-right: 1px solid var(--panel-border);
    }

    .right-rail {
      right: 0;
      transform: translateX(100%);
      border-left: 1px solid var(--panel-border);
    }

    .left-rail[data-open='true'],
    .right-rail[data-open='true'] {
      transform: translateX(0);
      pointer-events: auto;
    }

    .left-rail[data-open='false'],
    .right-rail[data-open='false'] {
      pointer-events: none;
    }

    .main-content {
      padding: 0;
    }
  }
</style>