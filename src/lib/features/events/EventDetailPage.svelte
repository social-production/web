<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { tick } from 'svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import EventHistoryTab from '$lib/features/events/detail/EventHistoryTab.svelte';
  import EventLifecyclePanel from '$lib/features/events/detail/EventLifecyclePanel.svelte';
  import EventMembersPanel from '$lib/features/events/detail/EventMembersPanel.svelte';
  import EventOverviewHeader from '$lib/features/events/detail/EventOverviewHeader.svelte';
  import EventUpdatesSection from '$lib/features/events/detail/EventUpdatesSection.svelte';
  import ContextualBackButton from '$lib/components/shared/ContextualBackButton.svelte';
  import { markLinkedChatRead } from '$lib/services/queries/inbox';
  import type { EventPageData } from '$lib/types/detail';

  export let data: EventPageData;

  let highlightedCommentId: string | null = null;
  let highlightedUpdateId: string | null = null;
  let highlightedDecisionId: string | null = null;
  let lastRouteSignature = '';
  let showMembersPanel = false;
  let activeTab: 'overview' | 'chat' | 'history' = 'overview';
  let autoExpandVoteCards = false;
  let autoExpandVoteKind: string | null = null;
  let autoExpandVoteTarget: string | null = null;

  $: if (browser && activeTab === 'chat') {
    void markLinkedChatRead('event', data.id).then(() => invalidateAll());
  }

  async function focusVoteTarget(voteKind: string | null, voteTarget: string | null) {
    await tick();
    if (typeof document === 'undefined') return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetCard = voteKind && voteTarget
          ? document.getElementById(`vote-card-${voteKind}-${voteTarget}`)
          : null;
        const fallbackCard = document.querySelector('.vote-request-card');
        const card = targetCard ?? fallbackCard;
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  function readUpdateTarget(url: URL) {
    if (url.hash.startsWith('#update-')) {
      return url.hash.slice('#update-'.length) || null;
    }

    return url.searchParams.get('update');
  }

  function readDecisionTarget(url: URL) {
    if (url.hash.startsWith('#decision-')) {
      return url.hash.slice('#decision-'.length) || null;
    }

    return url.searchParams.get('decision');
  }

  function selectTab(tab: 'overview' | 'chat' | 'history') {
    activeTab = tab;

    if (!browser) {
      return;
    }

    const nextUrl = new URL(window.location.href);

    if (tab === 'overview') {
      nextUrl.searchParams.delete('tab');
    } else {
      nextUrl.searchParams.set('tab', tab);
    }

    void goto(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  function scrollElementIntoView(element: HTMLElement | null) {
    if (!browser || !element) {
      return;
    }

    const topbarHeight = document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
    const topOffset = topbarHeight + 28;
    const nextTop = window.scrollY + element.getBoundingClientRect().top - topOffset;

    window.scrollTo({
      top: Math.max(nextTop, 0),
      behavior: 'smooth'
    });
  }

  async function handleMembersPanelOpen() {
    if (showMembersPanel) {
      showMembersPanel = false;
      return;
    }

    showMembersPanel = true;
    await tick();
    scrollElementIntoView(document.getElementById('event-members-panel'));
  }

  $: {
    const routeSignature = `${$page.url.pathname}${$page.url.search}${$page.url.hash}`;

    if (routeSignature !== lastRouteSignature) {
      lastRouteSignature = routeSignature;
      highlightedCommentId = readCommentTarget($page.url);
      highlightedUpdateId = readUpdateTarget($page.url);
      highlightedDecisionId = readDecisionTarget($page.url);
      const requestedTab = $page.url.searchParams.get('tab');
      activeTab = highlightedCommentId
        ? 'chat'
        : highlightedDecisionId
          ? 'history'
        : requestedTab === 'history'
          ? 'history'
        : requestedTab === 'chat'
            ? 'chat'
            : 'overview';
    }
    autoExpandVoteCards = $page.url.searchParams.get('open') === 'vote';
    autoExpandVoteKind = autoExpandVoteCards ? ($page.url.searchParams.get('voteKind') || null) : null;
    autoExpandVoteTarget = autoExpandVoteCards ? ($page.url.searchParams.get('voteTarget') || null) : null;
    if (autoExpandVoteCards) void focusVoteTarget(autoExpandVoteKind, autoExpandVoteTarget);
  }
</script>

<section class="page">
  <section class="hero-card">
    <ContextualBackButton fallbackHref="/" />
    <div class="top-tab-row" role="tablist" aria-label="Event detail tabs">
      <button
        class:active-tab={activeTab === 'overview'}
        class="top-tab"
        role="tab"
        type="button"
        on:click={() => selectTab('overview')}
      >
        Overview
      </button>
      <button
        class:active-tab={activeTab === 'chat'}
        class="top-tab"
        role="tab"
        type="button"
        on:click={() => selectTab('chat')}
      >
        Chat
      </button>
      <button
        class:active-tab={activeTab === 'history'}
        class="top-tab"
        role="tab"
        type="button"
        on:click={() => selectTab('history')}
      >
        History
      </button>
    </div>

    {#if activeTab === 'overview'}
      <EventOverviewHeader {data} />
      <EventUpdatesSection
        {data}
        {highlightedUpdateId}
        {showMembersPanel}
        {autoExpandVoteCards}
        {autoExpandVoteKind}
        on:togglemembers={handleMembersPanelOpen}
      />
      {#if showMembersPanel}
        <EventMembersPanel {data} panelId="event-members-panel" />
      {/if}
      <div id="governance">
        <EventLifecyclePanel {data} {autoExpandVoteCards} {autoExpandVoteKind} {autoExpandVoteTarget} />
      </div>
    {:else if activeTab === 'chat'}
      <section class="chat-shell">
        <LiveChatPanel
          comments={data.discussion}
          emptyCopy="No event chat yet."
          fitViewport={true}
          highlightedCommentId={highlightedCommentId}
          placeholder="Message members..."
          subjectId={data.id}
          submitLabel="Send message"
          title="Event chat"
          variant="message"
        />
      </section>
    {:else}
      <EventHistoryTab {data} highlightedDecisionId={highlightedDecisionId} />
    {/if}
  </section>
</section>

<style>
  .page {
    display: grid;
    gap: 20px;
  }

  .hero-card {
    position: relative;
    display: grid;
    gap: 0;
    padding: 32px 16px 16px;
    margin-top: 24px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    overflow: visible;
  }

  .top-tab-row {
    display: inline-flex;
    gap: 8px;
    padding: 2px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    width: fit-content;
    position: absolute;
    top: 0;
    left: 16px;
    transform: translateY(-44%);
    z-index: 1;
    box-shadow: 0 10px 24px color-mix(in srgb, var(--page-bg) 82%, transparent);
  }

  .chat-shell {
    margin-top: 16px;
  }

  .top-tab {
    min-width: 108px;
    padding: 9px 14px;
    border: 1px solid transparent;
    border-radius: calc(var(--radius-sm) - 2px);
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
  }

  .top-tab.active-tab {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }
</style>
