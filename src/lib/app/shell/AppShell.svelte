<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import brandIcon from '$lib/assets/brand/app-icon-no-background-full-white.png';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import { setProjectActivityCommitment, toggleEventGoing } from '$lib/services/queries/details';
  import { formatCalendarTime } from '$lib/utils/time';
  import { onMount } from 'svelte';
  import type { BootstrapPayload, RightRailActivityItem } from '$lib/types/bootstrap';

  export let bootstrap: BootstrapPayload;

  const createLinks = [
    { href: '/create/post', label: 'Post' },
    { href: '/create/thread', label: 'Thread' },
    { href: '/create/project', label: 'Project' },
    { href: '/create/event', label: 'Event' },
    { href: '/create/community', label: 'Community' },
    { href: '/create/channel', label: 'Channel' }
  ];

  const railDescriptions = {
    create: 'Start a new production, service, or discussion surface.',
    collective: 'Shared governance and common platform work.',
    channels: 'Topic-based discovery across projects, threads, and events.',
    communities: 'Social coordination spaces around shared work.'
  };

  let isCompact = true;
  let leftRailOpen = false;
  let rightRailOpen = false;
  let pendingSubjectId = '';
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

  function isRailActionActive(item: RightRailActivityItem) {
    if (item.kind === 'project') {
      return !!item.viewerAssignedRoleLabel;
    }

    return !!item.viewerIsParticipating;
  }

  function isRailActionDisabled(item: RightRailActivityItem) {
    return item.kind === 'project' && !item.viewerAssignedRoleLabel && item.projectHasOpenRole === false;
  }

  async function submitToolbarSearch(event: SubmitEvent) {
    event.preventDefault();
    const query = toolbarQuery.trim();
    await goto(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  async function handleRailParticipation(item: RightRailActivityItem) {
    if (item.kind === 'project') {
      if (!item.projectSlug || !item.activityId) {
        return;
      }

      if (!item.viewerAssignedRoleLabel && item.projectHasOpenRole === false) {
        return;
      }

      if (item.viewerAssignedRoleLabel) {
        pendingSubjectId = item.subjectId;

        try {
          await setProjectActivityCommitment(item.projectSlug, item.activityId, null);
          await invalidateAll();
        } finally {
          pendingSubjectId = '';
        }

        return;
      }

      closeCompactPanels();
      await goto(item.href);
      return;
    }

    pendingSubjectId = item.subjectId;

    try {
      await toggleEventGoing(item.subjectId);

      await invalidateAll();
    } finally {
      pendingSubjectId = '';
    }
  }
</script>

<div
  class="shell"
  style={`--left-width: ${leftRailOpen && !isCompact ? '262px' : '0px'}; --right-width: ${rightRailOpen && !isCompact ? '292px' : '0px'}; --topbar-height: ${topbarHeight}px; --compact-content-offset: ${compactContentOffset}px;`}
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
        aria-label="Toggle scope panel"
        aria-expanded={leftRailOpen}
        class="panel-toggle"
        data-active={leftRailOpen}
        type="button"
        on:click={toggleLeftRail}
      >
        <span aria-hidden="true" class="panel-toggle-icon">|&lt;</span>
      </button>
      <button
        aria-label="Toggle activity and events panel"
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
          <span>{bootstrap.unreadCounts.notifications}</span>
        </a>
        <a
          class:active-link={isActive('/messages')}
          class="nav-link"
          href={bootstrap.viewer ? '/messages' : '/onboarding'}
        >
          Messages
          <span>{bootstrap.unreadCounts.messages}</span>
        </a>
      </nav>
    </div>

    <nav class="utility-nav" aria-label="Utilities">
      <a class:active-link={isActive('/roadmap')} class="utility-link" href="/roadmap">Roadmap</a>
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
      <div class="compact-rail-header">
        <h2>Scope</h2>
        <button class="close-rail" type="button" on:click={closeCompactPanels}>Close</button>
      </div>

      <section class="rail-panel">
        <h2>Create</h2>
        <p class="section-subtitle">{railDescriptions.create}</p>
        <div class="stack-links">
          {#each createLinks as link}
            <a
              class:active-link={isActive(link.href)}
              class="rail-link create-link"
              href={bootstrap.viewer ? link.href : '/onboarding'}
              on:click={closeCompactPanels}
            >
              <span class="create-plus">+</span>
              {link.label}
            </a>
          {/each}
        </div>
      </section>

      {#if bootstrap.directory.platform}
        <section class="rail-panel">
          <h2>Collective</h2>
          <p class="section-subtitle">{railDescriptions.collective}</p>
          <div class="stack-links">
            <a
              class:active-link={isActive(bootstrap.directory.platform.href)}
              class="rail-link"
              href={bootstrap.directory.platform.href}
              on:click={closeCompactPanels}
            >
              {bootstrap.directory.platform.label}
            </a>
          </div>
        </section>
      {/if}

      <section class="rail-panel">
        <h2>Channels</h2>
        <p class="section-subtitle">{railDescriptions.channels}</p>
        <div class="stack-links">
          {#each bootstrap.directory.channels as link}
            <a
              class:active-link={isActive(link.href)}
              class="rail-link"
              href={link.href}
              on:click={closeCompactPanels}
            >
              {link.label}
            </a>
          {/each}
        </div>
      </section>

      <section class="rail-panel">
        <h2>Communities</h2>
        <p class="section-subtitle">{railDescriptions.communities}</p>
        <div class="stack-links">
          {#each bootstrap.directory.communities as link}
            <a
              class:active-link={isActive(link.href)}
              class="rail-link"
              href={link.href}
              on:click={closeCompactPanels}
            >
              {link.label}
            </a>
          {/each}
        </div>
      </section>
    </aside>

    <main class="main-content">
      <div class="main-frame">
        <slot />
      </div>
    </main>

    <aside class="rail right-rail" data-open={rightRailOpen}>
      <div class="compact-rail-header">
        <h2>Activity and Events</h2>
        <button class="close-rail" type="button" on:click={closeCompactPanels}>Close</button>
      </div>

      <section class="rail-panel">
        <h2>Activity and Events</h2>
        <p class="section-subtitle">This rail is only for projects you belong to and events you are going to. Other updates belong in Notifications.</p>
        <div class="snapshot-stack">
          {#if bootstrap.activityRail.length === 0}
            <div class="snapshot-row">
              <strong>No activity yet</strong>
              <span>Project activity for your memberships and events you are going to will appear here. Other updates go to Notifications.</span>
            </div>
          {:else}
            {#each bootstrap.activityRail as item}
              <div class="snapshot-row activity-row">
                <a class="activity-link" href={item.href} on:click={closeCompactPanels}>
                  <div class="activity-topline">
                    <SubjectTablet kind={item.kind} projectMode={item.projectMode ?? 'productive'} />
                    <span class="snapshot-time">
                      {item.kind === 'event' && item.timeLabel ? item.timeLabel : formatCalendarTime(item.createdAt)}
                    </span>
                  </div>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </a>

                <div class="event-footer">
                  <span class="event-going">{item.countLabel}</span>
                  <button
                    aria-label={
                      item.kind === 'project'
                        ? item.viewerAssignedRoleLabel
                          ? `Leave ${item.title}`
                          : `Open ${item.title}`
                        : item.viewerIsParticipating
                          ? `Leave ${item.title}`
                          : `Join ${item.title}`
                    }
                    class:attendance-state={isRailActionActive(item)}
                    class="attendance-button"
                    disabled={pendingSubjectId === item.subjectId || isRailActionDisabled(item)}
                    type="button"
                    on:click={() => handleRailParticipation(item)}
                  >
                    {#if item.kind === 'project'}
                      {#if item.viewerAssignedRoleLabel}
                        Going
                      {:else if item.projectHasOpenRole === false}
                        Full
                      {:else}
                        +
                      {/if}
                    {:else}
                      {item.viewerIsParticipating ? 'Going' : '+'}
                    {/if}
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </section>
    </aside>
  </div>
</div>

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

  .panel-toggle,
  .close-rail {
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

  .panel-toggle:hover,
  .close-rail:hover {
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
  .utility-link,
  .rail-link {
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
  .utility-link:hover,
  .rail-link:hover {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .nav-link span {
    min-width: 18px;
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    background: var(--brand-badge);
    color: var(--brand-strong);
    text-align: center;
    font-size: 11.5px;
    font-weight: 700;
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

  .compact-rail-header {
    display: none;
  }

  .rail-panel {
    padding: 0 0 12px;
    border-bottom: 1px solid var(--panel-border);
  }

  .rail-panel h2 {
    font-size: 14px;
    color: var(--text-main);
  }

  .section-subtitle {
    margin: 4px 0 10px;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .stack-links,
  .snapshot-stack {
    display: grid;
    gap: 6px;
  }

  .rail-link {
    justify-content: flex-start;
    width: 100%;
    background: transparent;
  }

  .create-link {
    gap: 8px;
  }

  .create-plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 13px;
    font-weight: 800;
    line-height: 1;
  }

  .snapshot-row {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    transition: border-color 0.16s ease, background-color 0.16s ease;
  }

  .activity-row:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 42%, var(--panel-soft));
  }

  .snapshot-row strong {
    font-size: 13px;
    font-weight: 700;
  }

  .snapshot-row span {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .activity-row {
    gap: 8px;
  }

  .activity-link {
    display: grid;
    gap: 8px;
    color: inherit;
  }

  .activity-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .snapshot-time {
    white-space: nowrap;
  }

  .event-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .event-going {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .attendance-button,
  .attendance-button.attendance-state {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
  }

  .attendance-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--brand-strong);
    transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
  }

  .attendance-button:hover:not(:disabled) {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .attendance-button.attendance-state {
    border: 1px solid var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .attendance-button.attendance-state:hover:not(:disabled) {
    background: color-mix(in srgb, var(--brand-soft) 66%, white 8%);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 50%, transparent);
  }

  .main-content {
    min-width: 0;
    padding: 16px 20px 20px;
    background: var(--page-background);
  }

  .main-frame {
    width: 100%;
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

    .compact-rail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--panel-border);
    }

    .main-content {
      padding: 0;
    }
  }
</style>