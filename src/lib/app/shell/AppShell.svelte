<script lang="ts">
  import { goto, afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import brandIcon from '$lib/assets/brand/app-icon-no-background-full-white.png';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import AuthActionNotice from '$lib/components/shared/AuthActionNotice.svelte';
  import LeftRailPanel from '$lib/features/left-rail/LeftRailPanel.svelte';
  import RightRailPanel from '$lib/features/right-rail/RightRailPanel.svelte';
  import MapPanel from '$lib/features/map/MapPanel.svelte';
  import MobileBottomNav from '$lib/app/shell/MobileBottomNav.svelte';
  import MobileMoreSheet from '$lib/app/shell/MobileMoreSheet.svelte';
  import CreateFab from '$lib/app/shell/CreateFab.svelte';
  import GroupsIcon from '$lib/components/shared/GroupsIcon.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import { createLiveSearchScheduler } from '$lib/features/search/liveSearch';
  import SearchSuggestionsList from '$lib/features/search/SearchSuggestionsList.svelte';
  import { unreadCounts } from '$lib/stores/unreadCounts';
  import { refreshUnreadCounts, syncUnreadCountsFromBootstrap } from '$lib/services/commands/inbox';
  import * as m from '$lib/paraglide/messages';
  import { onMount, tick } from 'svelte';
  import type { BootstrapPayload, RightRailActivityItem } from '$lib/types/bootstrap';
  import type { SearchResultItem } from '$lib/types/search';
  import { countActionableRailItems } from '$lib/utils/activityRailCounts';
  import { getActivityRail } from '$lib/services/queries/bootstrap';
  import {
    dismissedRailRevision,
    dismissedRailStorageKey,
    readDismissedRailIds,
    readSeenRailIds,
    seenRailStorageKey
  } from '$lib/utils/dismissedRailItems';
  import {
    consumeCreateReturnScroll,
    isCreateEntrySurface,
    isFeedDiscoveryPath
  } from '$lib/stores/createReturnState';
  import { feedReturnHref, rememberFeedReturnState } from '$lib/stores/feedReturnState';

  export let bootstrap: BootstrapPayload;

  let isCompact = true;
  let activityRailItems: RightRailActivityItem[] = bootstrap.activityRail ?? [];
  let activityRailHistoryItems: RightRailActivityItem[] = bootstrap.activityRailHistory ?? [];
  let lastActivityRailViewerId: string | null = bootstrap.viewer?.id ?? null;
  let leftRailOpen = false;
  let rightRailOpen = false;
  let mapPanelOpen = false;
  let railsBeforeMap = { left: false, right: false };
  let toolbarQuery = '';
  let topbarElement: HTMLElement | null = null;
  let contentGridElement: HTMLDivElement | null = null;
  let topbarHeight = 53;
  let compactContentOffset = 0;
  let showThemeHint = false;
  let toolbarSuggestionsOpen = false;
  let toolbarLiveResults: SearchResultItem[] = [];
  let toolbarLiveLoading = false;
  let searchExpanded = false;
  let moreSheetOpen = false;
  let createFabOpen = false;
  let searchInputElement: HTMLInputElement | null = null;
  let mapPanel: MapPanel | null = null;
  let feedChromeHidden = false;
  let lastFeedScrollY = 0;
  let keyboardOpen = false;
  let textFieldFocused = false;

  const toolbarLiveSearch = createLiveSearchScheduler();

  function isCreateFabRoute(pathname: string): boolean {
    // Keep FAB on the same surfaces that collapse chrome while scrolling.
    return isFeedDiscoveryPath(pathname);
  }

  $: feedChromeActive = isCompact;
  $: dedicatedMapPage = $page.url.pathname === '/map';
  $: mapSurfaceActive = mapPanelOpen || dedicatedMapPage;
  $: if (!feedChromeActive || mapSurfaceActive || moreSheetOpen || searchExpanded) {
    feedChromeHidden = false;
  }
  // Reserve bottom space only while the nav is visible. When it slides away,
  // drop the inset so short pages and scroll-reveal don't leave a dead band.
  $: shellBottomNavOffset =
    isCompact &&
    !keyboardOpen &&
    !(feedChromeActive && feedChromeHidden && !mapSurfaceActive)
      ? 'var(--shell-bottom-nav-height)'
      : '0px';
  $: shellTopbarHeight =
    mapSurfaceActive || !(feedChromeActive && feedChromeHidden) ? topbarHeight : 0;
  $: topbarCollapsed =
    (feedChromeActive && feedChromeHidden && !mapSurfaceActive) || (isCompact && keyboardOpen);

  $: if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = mapSurfaceActive ? 'hidden' : '';
    document.body.style.overflow = mapSurfaceActive ? 'hidden' : '';
  }


  function deferUnreadRefresh() {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        void refreshUnreadCounts();
      }, { timeout: 2000 });
      return;
    }

    window.setTimeout(() => {
      void refreshUnreadCounts();
    }, 120);
  }

  function handleFeedChromeScroll() {
    if (!feedChromeActive || mapSurfaceActive || moreSheetOpen || searchExpanded || createFabOpen) {
      if (mapSurfaceActive) {
        feedChromeHidden = false;
      }
      lastFeedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      return;
    }

    const y = window.scrollY;
    const delta = y - lastFeedScrollY;
    if (y < 24) {
      feedChromeHidden = false;
    } else if (delta > 16) {
      feedChromeHidden = true;
    } else if (delta < -16) {
      feedChromeHidden = false;
    }
    lastFeedScrollY = y;
  }

  function updateLayoutMetrics() {
    if (topbarElement && (mapSurfaceActive || !(feedChromeActive && feedChromeHidden))) {
      const measured = topbarElement.getBoundingClientRect().height;
      topbarHeight = measured > 0 ? measured : isCompact ? 52 : 53;
      return;
    }

    if (mapSurfaceActive || !(feedChromeActive && feedChromeHidden)) {
      topbarHeight = isCompact ? 52 : 53;
    }
    compactContentOffset = 0;
  }

  afterNavigate(({ from, to }) => {
    const fromPath = from?.url?.pathname ?? null;
    const toPath = to?.url?.pathname ?? null;

    if (fromPath && toPath && fromPath !== toPath && mapPanelOpen) {
      closeMapPanel();
    }
    if (bootstrap.viewer) {
      deferUnreadRefresh();
    }
    if (isCompact) {
      searchExpanded = false;
      moreSheetOpen = false;
    }
    feedChromeHidden = false;
    lastFeedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    if (to?.url) {
      rememberFeedReturnState(to.url);
    }
    if (toPath && isCreateEntrySurface(toPath)) {
      const scrollY = consumeCreateReturnScroll(toPath);
      if (scrollY !== null) {
        void tick().then(() => {
          window.requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
            lastFeedScrollY = scrollY;
          });
        });
      }
    }
  });

  $: if (typeof window !== 'undefined') {
    rememberFeedReturnState($page.url);
  }

  function handleBrandClick(event: MouseEvent) {
    if (isCreateEntrySurface($page.url.pathname)) {
      return;
    }

    event.preventDefault();
    const target = feedReturnHref('/');
    if (`${$page.url.pathname}${$page.url.search}` === target) {
      return;
    }
    void goto(target);
  }

  $: displayUnreadCounts = $unreadCounts ?? bootstrap.unreadCounts;
  $: dismissedStorageKey = dismissedRailStorageKey(bootstrap.viewer?.id ?? null);
  $: seenStorageKey = seenRailStorageKey(bootstrap.viewer?.id ?? null);
  $: dismissedRailIds = readDismissedRailIds(dismissedStorageKey, $dismissedRailRevision);
  $: seenRailIds = readSeenRailIds(seenStorageKey, $dismissedRailRevision);
  $: rightRailActionCount = countActionableRailItems(activityRailItems, dismissedRailIds, seenRailIds);
  $: showCreateFab =
    Boolean(bootstrap.viewer) &&
    isCreateFabRoute($page.url.pathname) &&
    !$page.url.pathname.startsWith('/create/') &&
    $page.url.pathname !== '/onboarding' &&
    !mapPanelOpen;

  $: if ($page.url.pathname === '/search') {
    toolbarQuery = $page.url.searchParams.get('q') ?? '';
  }

  onMount(() => {
    syncUnreadCountsFromBootstrap(bootstrap.unreadCounts);
    showThemeHint = localStorage.getItem('theme-hint-dismissed') !== 'true';

    const refreshBadgeCounts = () => {
      if (bootstrap.viewer) {
        void refreshUnreadCounts();
      }
    };

    const loadActivityRail = () => {
      if (!bootstrap.viewer) {
        activityRailItems = [];
        activityRailHistoryItems = [];
        lastActivityRailViewerId = null;
        return;
      }
      const viewerId = bootstrap.viewer.id;
      void getActivityRail()
        .then((rail) => {
          if (lastActivityRailViewerId !== viewerId && lastActivityRailViewerId != null) {
            // Viewer changed while the request was in flight.
          }
          activityRailItems = rail.activityRail ?? [];
          activityRailHistoryItems = rail.activityRailHistory ?? [];
          lastActivityRailViewerId = viewerId;
        })
        .catch(() => {
          activityRailItems = bootstrap.activityRail ?? [];
          activityRailHistoryItems = bootstrap.activityRailHistory ?? [];
        });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshBadgeCounts();
      }
    };

    window.addEventListener('focus', refreshBadgeCounts);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('scroll', handleFeedChromeScroll, { passive: true });

    const isTextField = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isTextField(event.target)) {
        textFieldFocused = true;
        syncKeyboardState();
      }
    };
    const onFocusOut = () => {
      // Defer so focus moving between fields does not flicker chrome.
      window.setTimeout(() => {
        textFieldFocused = isTextField(document.activeElement);
        syncKeyboardState();
      }, 0);
    };

    const viewport = window.visualViewport;
    const syncKeyboardState = () => {
      // Firefox fires visualViewport resize for URL-bar show/hide. Only treat a
      // shrink as keyboard when a text field is focused.
      const viewportShrunk = Boolean(viewport && window.innerHeight - viewport.height > 120);
      const next = textFieldFocused && viewportShrunk;
      if (next !== keyboardOpen) {
        keyboardOpen = next;
        requestAnimationFrame(updateLayoutMetrics);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    viewport?.addEventListener('resize', syncKeyboardState);
    viewport?.addEventListener('scroll', syncKeyboardState);
    syncKeyboardState();

    const badgePoll = window.setInterval(refreshBadgeCounts, 30_000);
    loadActivityRail();

    const media = window.matchMedia('(max-width: 1080px)');
    const syncLayout = () => {
      isCompact = media.matches;
      if (media.matches) {
        leftRailOpen = false;
        rightRailOpen = false;
      } else {
        leftRailOpen = true;
        rightRailOpen = true;
        searchExpanded = false;
        moreSheetOpen = false;
        feedChromeHidden = false;
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

    const handleDocumentKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && searchExpanded) {
        searchExpanded = false;
      }
    };

    document.addEventListener('keydown', handleDocumentKeydown);

    return () => {
      window.removeEventListener('focus', refreshBadgeCounts);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('keydown', handleDocumentKeydown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('scroll', handleFeedChromeScroll);
      viewport?.removeEventListener('resize', syncKeyboardState);
      viewport?.removeEventListener('scroll', syncKeyboardState);
      window.clearInterval(badgePoll);
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
      mapPanelOpen = false;
      moreSheetOpen = false;
      createFabOpen = false;
    }
  }

  function toggleRightRail() {
    rightRailOpen = !rightRailOpen;
    if (isCompact && rightRailOpen) {
      leftRailOpen = false;
      mapPanelOpen = false;
      moreSheetOpen = false;
      createFabOpen = false;
    }
  }

  async function toggleMapPanel() {
    const opening = !mapPanelOpen;
    if (opening && !isCompact) {
      railsBeforeMap = { left: leftRailOpen, right: rightRailOpen };
    }
    mapPanelOpen = opening;
    if (mapPanelOpen) {
      leftRailOpen = false;
      rightRailOpen = false;
      moreSheetOpen = false;
      createFabOpen = false;
      feedChromeHidden = false;
      lastFeedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      await tick();
      updateLayoutMetrics();
      requestAnimationFrame(() => {
        updateLayoutMetrics();
      });
      await mapPanel?.refreshMap();
    } else if (!isCompact) {
      leftRailOpen = railsBeforeMap.left;
      rightRailOpen = railsBeforeMap.right;
    }
  }

  function closeMapPanel() {
    mapPanelOpen = false;
    if (!isCompact) {
      leftRailOpen = railsBeforeMap.left;
      rightRailOpen = railsBeforeMap.right;
    }
  }

  function closeCompactPanels() {
    if (isCompact) {
      leftRailOpen = false;
      rightRailOpen = false;
      mapPanelOpen = false;
    }
  }

  function openSearch() {
    searchExpanded = true;
    requestAnimationFrame(() => {
      searchInputElement?.focus();
      updateLayoutMetrics();
    });
  }

  function closeSearch() {
    searchExpanded = false;
    toolbarSuggestionsOpen = false;
    requestAnimationFrame(updateLayoutMetrics);
  }

  function toggleMoreSheet() {
    moreSheetOpen = !moreSheetOpen;
    if (moreSheetOpen) {
      leftRailOpen = false;
      rightRailOpen = false;
      mapPanelOpen = false;
      createFabOpen = false;
    }
  }

  async function submitToolbarSearch(event: SubmitEvent) {
    event.preventDefault();
    toolbarSuggestionsOpen = false;
    const query = toolbarQuery.trim();
    if (isCompact) {
      searchExpanded = false;
    }
    await goto(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  function handleToolbarInput() {
    toolbarSuggestionsOpen = true;
    toolbarLiveSearch.schedule(toolbarQuery, (results, loading) => {
      toolbarLiveResults = results;
      toolbarLiveLoading = loading;
    });
  }

  function handleToolbarFocus() {
    if (toolbarQuery.trim()) {
      toolbarSuggestionsOpen = true;
      toolbarLiveSearch.schedule(toolbarQuery, (results, loading) => {
        toolbarLiveResults = results;
        toolbarLiveLoading = loading;
      });
    }
  }

  function handleToolbarBlur() {
    window.setTimeout(() => {
      toolbarSuggestionsOpen = false;
    }, 150);
  }

  async function openToolbarSuggestion(href: string) {
    toolbarSuggestionsOpen = false;
    if (isCompact) {
      searchExpanded = false;
    }
    await goto(href);
  }

  $: if (topbarElement) {
    queueMicrotask(updateLayoutMetrics);
  }

  $: if (searchExpanded !== undefined) {
    queueMicrotask(updateLayoutMetrics);
  }

  function dismissThemeHint() {
    showThemeHint = false;
    localStorage.setItem('theme-hint-dismissed', 'true');
  }

</script>

<div
  class="shell"
  class:shell-compact={isCompact}
  class:shell-map-open={mapSurfaceActive}
  class:shell-map-page={dedicatedMapPage}
  class:feed-chrome-collapsed={topbarCollapsed}
  style={`--left-width: ${leftRailOpen && !isCompact ? '262px' : '0px'}; --right-width: ${rightRailOpen && !isCompact ? '292px' : '0px'}; --topbar-height: ${shellTopbarHeight}px; --topbar-natural-height: ${topbarHeight}px; --compact-content-offset: ${compactContentOffset}px; --shell-bottom-nav-offset: ${shellBottomNavOffset}; --main-frame-max-width: ${!isCompact && !leftRailOpen && !rightRailOpen ? '1280px' : !isCompact && (!leftRailOpen || !rightRailOpen) ? '1480px' : 'none'};`}
>
  {#if mapSurfaceActive}
    <div class="topbar-flow-spacer" style={`height: ${topbarHeight}px`} aria-hidden="true"></div>
  {/if}
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
        <button aria-label="Close search" class="search-close-button" type="button" on:click={closeSearch}>
          <svg aria-hidden="true" viewBox="0 0 24 24" class="search-icon">
            <path d="M15.5 8.5 8.5 15.5M8.5 8.5l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <div class="toolbar-search-wrap">
          <input
            bind:this={searchInputElement}
            aria-label="Search"
            bind:value={toolbarQuery}
            class="toolbar-search-input"
            on:blur={handleToolbarBlur}
            on:focus={handleToolbarFocus}
            on:input={handleToolbarInput}
            placeholder="Search projects, threads, events, and channels"
            type="search"
          />
          {#if toolbarSuggestionsOpen && toolbarQuery.trim()}
            <SearchSuggestionsList
              loading={toolbarLiveLoading}
              overlay
              results={toolbarLiveResults}
              onSelect={openToolbarSuggestion}
            />
          {/if}
        </div>
      </form>
    {:else}
      <a
        class="brand"
        href={isCreateEntrySurface($page.url.pathname) ? '/' : feedReturnHref('/')}
        aria-label={isCreateEntrySurface($page.url.pathname) ? 'Social Production home' : 'Back to feed'}
        on:click={handleBrandClick}
      >
        <span class="brand-mark">
          <img alt="" class="brand-icon" src={brandIcon} />
        </span>
        <span>
          <strong>Social Production</strong>
        </span>
      </a>

      <div class="panel-controls">
        <button
          aria-label="Open networks"
          aria-expanded={leftRailOpen}
          class="panel-toggle"
          data-active={leftRailOpen}
          type="button"
          on:click={toggleLeftRail}
        >
          <GroupsIcon className="panel-toggle-icon groups-icon" />
        </button>
        <button
          aria-label="Open map"
          aria-expanded={mapPanelOpen}
          class="panel-toggle panel-toggle-map"
          data-active={mapPanelOpen}
          type="button"
          on:click={toggleMapPanel}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" class="panel-toggle-icon">
            <path
              d="M5 6.5 9 4.5l5 2.5 5-2.5v13l-5 2.5-5-2.5-4 2V6.5Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path d="M9 4.5v13M14 7v13" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none" />
          </svg>
        </button>
        <button
          aria-label="Open schedule and votes"
          aria-expanded={rightRailOpen}
          class="panel-toggle panel-toggle-right"
          class:panel-toggle-actionable={rightRailActionCount > 0}
          data-active={rightRailOpen}
          type="button"
          on:click={toggleRightRail}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" class="panel-toggle-icon">
            <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
            <circle cx="17.5" cy="17.5" r="4.5" fill="var(--panel)" stroke="currentColor" stroke-width="1.6" />
            <path d="M15.8 17.5 16.9 18.6 19.3 16.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </svg>
          {#if rightRailActionCount > 0}
            <span class="panel-toggle-badge">
              <CountBadge count={rightRailActionCount} />
            </span>
          {/if}
        </button>
      </div>

      <div class="toolbar-center">
        {#if isCompact}
          <button aria-label="Open search" class="search-open-button" type="button" on:click={openSearch}>
            <svg aria-hidden="true" viewBox="0 0 24 24" class="search-icon">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.8 2.2-4.2-4.2"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2"
              />
            </svg>
          </button>
        {:else}
          <form class="toolbar-search" role="search" on:submit={submitToolbarSearch}>
            <div class="toolbar-search-wrap">
              <input
                aria-label="Search"
                bind:value={toolbarQuery}
                class="toolbar-search-input"
                on:blur={handleToolbarBlur}
                on:focus={handleToolbarFocus}
                on:input={handleToolbarInput}
                placeholder="Search projects, threads, events, and channels"
                type="search"
              />
              {#if toolbarSuggestionsOpen && toolbarQuery.trim()}
                <SearchSuggestionsList
                  loading={toolbarLiveLoading}
                  overlay
                  results={toolbarLiveResults}
                  onSelect={openToolbarSuggestion}
                />
              {/if}
            </div>
          </form>
        {/if}

        {#if !isCompact}
          <nav class="primary-nav" aria-label="Primary">
            <a
              aria-label={m.shell_nav_public()}
              class:active-link={isActive('/')}
              class="nav-link nav-link-icon"
              href="/"
            >
              <FeedToolbarIcon name="globe" />
            </a>
            <a
              aria-label={m.shell_nav_personal()}
              class:active-link={isActive('/personal')}
              class="nav-link nav-link-icon"
              href={bootstrap.viewer ? '/personal' : '/onboarding'}
            >
              <FeedToolbarIcon name="user" />
            </a>
            <a
              aria-label={m.shell_nav_notifications()}
              class:active-link={isActive('/notifications')}
              class="nav-link nav-link-icon"
              href={bootstrap.viewer ? '/notifications' : '/onboarding'}
            >
              <FeedToolbarIcon name="bell" />
              {#if displayUnreadCounts.notifications > 0}
                <CountBadge count={displayUnreadCounts.notifications} />
              {/if}
            </a>
            <a
              aria-label={m.shell_nav_messages()}
              class:active-link={isActive('/messages')}
              class="nav-link nav-link-icon"
              href={bootstrap.viewer ? '/messages' : '/onboarding'}
            >
              <FeedToolbarIcon name="message" />
              {#if displayUnreadCounts.messages > 0}
                <CountBadge count={displayUnreadCounts.messages} />
              {/if}
            </a>
          </nav>
        {/if}
      </div>

      <nav class="utility-nav" aria-label="Utilities">
        {#if !isCompact}
          <a class:active-link={isActive('/about') || isActive('/roadmap')} class="utility-link" href="/about">{m.shell_nav_about()}</a>
        {/if}
        {#if bootstrap.viewer}
          {#if !isCompact}
            <a
              class:active-link={isActive(`/profile/${bootstrap.viewer.username}`)}
              class="utility-link"
              href={`/profile/${bootstrap.viewer.username}`}
            >
              {bootstrap.viewer.username}
            </a>
          {/if}
          {#if !isCompact}
            <div class="settings-wrap">
              <a aria-label="Settings" class:active-link={isActive('/settings')} class="gear-button" href="/settings">
                <svg aria-hidden="true" viewBox="0 0 24 24" class="gear-icon">
                  <path
                    d="M10.3 2h3.4l.5 2.4c.5.2 1 .4 1.5.6l2.1-1.2 2.4 2.4-1.2 2.1c.2.5.4 1 .6 1.5L22 10.3v3.4l-2.4.5c-.2.5-.4 1-.6 1.5l1.2 2.1-2.4 2.4-2.1-1.2c-.5.2-1 .4-1.5.6L13.7 22h-3.4l-.5-2.4c-.5-.2-1-.4-1.5-.6l-2.1 1.2-2.4-2.4 1.2-2.1c-.2-.5-.4-1-.6-1.5L2 13.7v-3.4l2.4-.5c.2-.5.4-1 .6-1.5L3.8 6.2l2.4-2.4 2.1 1.2c.5-.2 1-.4 1.5-.6L10.3 2Zm1.7 6.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 0 0 12 8.2Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </a>
              {#if showThemeHint}
                <div class="theme-hint" role="status">
                  <p>{m.shell_theme_hint()}</p>
                  <button class="theme-hint-dismiss" type="button" on:click={dismissThemeHint}>{m.shell_theme_hint_dismiss()}</button>
                </div>
              {/if}
            </div>
          {/if}
        {:else if !isCompact}
          <a class="utility-link" href="/onboarding">{m.shell_nav_login()}</a>
        {/if}
      </nav>
    {/if}
  </header>

  {#if isCompact && (leftRailOpen || rightRailOpen)}
    <button aria-label="Close side panels" class="rail-backdrop" on:click={closeCompactPanels}></button>
  {/if}

  <section class="map-overlay" class:map-overlay--open={mapPanelOpen} aria-hidden={!mapPanelOpen}>
    {#if mapPanelOpen}
      <MapPanel bind:this={mapPanel} active embedded on:close={closeMapPanel} />
    {/if}
  </section>

  <div
    bind:this={contentGridElement}
    class="content-grid"
    class:content-grid--map-open={mapSurfaceActive}
  >
    <aside class="rail left-rail" data-open={leftRailOpen}>
      <LeftRailPanel
        {bootstrap}
        {isActive}
        closePanels={closeCompactPanels}
      />
    </aside>

    <main class="main-content" class:main-content-compact={isCompact}>
      <div class="main-frame">
        <slot />
      </div>

      {#if showCreateFab}
        <CreateFab bind:open={createFabOpen} viewerLoggedIn={Boolean(bootstrap.viewer)} />
      {/if}
    </main>

    <aside class="rail right-rail" data-open={rightRailOpen}>
      <RightRailPanel
        items={activityRailItems}
        historyItems={activityRailHistoryItems}
        viewerId={bootstrap.viewer?.id ?? null}
        on:close={closeCompactPanels}
      />
    </aside>
  </div>

  {#if isCompact}
    <MobileBottomNav
      viewerLoggedIn={Boolean(bootstrap.viewer)}
      notificationCount={displayUnreadCounts.notifications}
      messageCount={displayUnreadCounts.messages}
      moreActive={moreSheetOpen}
      collapsed={topbarCollapsed}
      {isActive}
      onMore={toggleMoreSheet}
    />
    <MobileMoreSheet
      {bootstrap}
      open={moreSheetOpen}
      {isActive}
      on:close={() => (moreSheetOpen = false)}
    />
  {/if}
</div>

<AuthActionNotice />

<style>
  .shell {
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--page-background);
    color: var(--text-main);
    overscroll-behavior: none;
    overflow-x: clip;
    max-width: 100%;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 60;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    height: var(--topbar-natural-height, var(--topbar-height, 53px));
    min-height: var(--topbar-natural-height, var(--topbar-height, 53px));
    max-height: var(--topbar-natural-height, var(--topbar-height, 53px));
    padding: calc(8px + var(--shell-safe-top)) 12px 8px;
    border-bottom: 1px solid var(--panel-border);
    background: var(--toolbar-background);
    overflow: visible;
    transition: transform 0.22s ease, margin-top 0.22s ease;
    will-change: transform, margin-top;
  }

  .topbar.chrome-collapsed {
    transform: translateY(-100%);
    margin-top: calc(-1 * var(--topbar-natural-height, var(--topbar-height, 53px)));
    pointer-events: none;
  }

  .topbar.topbar-map-pinned {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    transform: none;
    margin-top: 0;
    pointer-events: auto;
    z-index: 70;
  }

  .topbar-flow-spacer {
    flex-shrink: 0;
    width: 100%;
    pointer-events: none;
  }

  .topbar.search-expanded {
    height: auto;
    min-height: var(--shell-touch-min);
    max-height: none;
    align-items: stretch;
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
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--shell-touch-min);
    min-height: var(--shell-touch-min);
    padding: 0;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
  }

  .panel-toggle-icon,
  .panel-toggle :global(.panel-toggle-icon) {
    width: 20px;
    height: 20px;
  }

  .panel-toggle-actionable:not([data-active='true']) {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 45%, transparent);
    color: var(--brand-strong);
  }

  .panel-toggle-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    pointer-events: none;
  }

  .panel-toggle-badge :global(.count-badge) {
    min-width: 16px;
    padding: 1px 5px;
    font-size: 10px;
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

  .panel-toggle-map[data-active='true'] {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 65%, var(--panel-strong));
    color: var(--brand-strong);
  }

  .map-overlay {
    position: fixed;
    inset: var(--topbar-height) 0 var(--shell-bottom-nav-offset, 0px) 0;
    z-index: 35;
    padding: 12px;
    background: var(--page-background);
    overflow: hidden;
    overscroll-behavior: none;
    display: none;
    flex-direction: column;
    min-height: 0;
  }

  .map-overlay--open {
    display: flex;
  }

  .map-overlay :global(.map-panel) {
    flex: 1;
    min-height: 0;
  }

  @media (max-width: 760px) {
    .map-overlay {
      padding: 0;
    }
  }

  .toolbar-center {
    flex: 1 1 auto;
    min-width: 0;
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

  .toolbar-search-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .toolbar-search:hover,
  .toolbar-search:focus-within {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 50%, var(--panel-soft));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 30%, transparent);
  }

  .toolbar-search-input {
    width: 100%;
    border: none;
    background: transparent;
    color: var(--text-main);
    padding: 0 12px;
    min-height: 36px;
  }

  .toolbar-search-input:focus {
    border: none;
  }

  .toolbar-search-expanded {
    flex: 1 1 auto;
    width: 100%;
    display: flex;
    align-items: stretch;
    gap: 8px;
    min-height: var(--shell-touch-min);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    padding: 4px 8px 4px 4px;
  }

  .search-open-button,
  .search-close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--shell-touch-min);
    height: var(--shell-touch-min);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    flex-shrink: 0;
  }

  .search-icon {
    width: 20px;
    height: 20px;
  }

  .topbar-compact .toolbar-center {
    margin-left: auto;
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

  .nav-link-icon {
    position: relative;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
  }

  .nav-link-icon :global(.toolbar-icon) {
    width: 20px;
    height: 20px;
  }

  .nav-link-icon :global(.count-badge) {
    position: absolute;
    top: 2px;
    right: 2px;
  }

  .active-link,
  .nav-link:hover,
  .utility-link:hover {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .utility-nav {
    margin-left: auto;
    flex-shrink: 0;
    overflow: visible;
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

  .settings-wrap {
    position: relative;
  }

  .theme-hint {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 50;
    display: grid;
    gap: 8px;
    width: min(240px, calc(100vw - 24px));
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    box-shadow: 0 12px 28px color-mix(in srgb, var(--text-main) 12%, transparent);
  }

  .theme-hint p {
    margin: 0;
    color: var(--text-main);
    font-size: 12px;
    line-height: 1.45;
  }

  .theme-hint-dismiss {
    justify-self: start;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .rail-backdrop {
    position: fixed;
    inset: var(--topbar-height) 0 var(--shell-bottom-nav-offset, 0px) 0;
    z-index: 45;
    background: var(--shell-scrim);
    border: none;
    padding: 0;
  }

  .content-grid {
    display: grid;
    grid-template-columns: var(--left-width) minmax(0, 1fr) var(--right-width);
    min-height: calc(100vh - var(--topbar-height));
  }

  .shell.shell-map-open .content-grid {
    min-height: calc(100dvh - var(--topbar-height) - var(--shell-bottom-nav-offset, 0px));
    height: calc(100dvh - var(--topbar-height) - var(--shell-bottom-nav-offset, 0px));
    max-height: calc(100dvh - var(--topbar-height) - var(--shell-bottom-nav-offset, 0px));
  }

  .content-grid--map-open {
    overflow: hidden;
  }

  .shell.shell-map-page .main-content {
    padding: 0;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .shell.shell-map-page .main-frame {
    height: 100%;
    max-width: none;
    overflow: hidden;
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
    position: relative;
    min-width: 0;
    overflow-x: clip;
    padding: 16px 20px 20px;
    background: var(--page-background);
  }

  .main-content-compact {
    padding: 12px 12px calc(12px + var(--shell-bottom-nav-offset));
  }

  .main-frame {
    width: 100%;
    min-width: 0;
    max-width: var(--main-frame-max-width);
    margin: 0 auto;
    overflow-x: clip;
  }

  @media (min-width: 1081px) {
    .rail {
      position: sticky;
      top: var(--topbar-height);
      min-height: calc(100vh - var(--topbar-height));
    }
  }

  @media (max-width: 1080px) {
    .topbar {
      padding: calc(6px + var(--shell-safe-top)) 8px 6px;
      gap: 6px;
    }

    .topbar-compact:not(.search-expanded) {
      height: auto;
      min-height: calc(var(--shell-touch-min) + 12px + var(--shell-safe-top));
      max-height: none;
    }

    .brand > span:not(.brand-mark) {
      display: none;
    }

    .brand-mark {
      width: 34px;
      height: 34px;
    }

    .brand-icon {
      width: 24px;
      height: 24px;
    }

    .toolbar-center {
      flex: 0 0 auto;
      min-width: 0;
      gap: 6px;
    }

    .utility-nav {
      margin-left: 0;
      flex-shrink: 0;
    }

    .content-grid {
      grid-template-columns: 1fr;
      padding-top: 0;
      /* Let short pages stay short; don't force a full-viewport empty slab
         behind the fixed bottom nav (reads as a blank second footer). */
      min-height: 0;
    }

    .shell {
      /* Compact mobile: never invent an empty viewport-tall slab above the nav. */
      min-height: 0;
    }

    .rail {
      position: fixed;
      top: var(--topbar-height);
      bottom: var(--shell-bottom-nav-offset);
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

    .main-content-compact {
      padding: 8px 8px calc(8px + var(--shell-bottom-nav-offset));
      min-width: 0;
      overflow-x: clip;
    }

    .main-content-compact .main-frame {
      min-width: 0;
      overflow-x: clip;
      padding-bottom: 4px;
    }
  }
</style>