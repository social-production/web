<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import ContextualBackButton from '$lib/components/shared/ContextualBackButton.svelte';
  import HelpRequestOverviewHeader from '$lib/features/help-requests/detail/HelpRequestOverviewHeader.svelte';
  import HelpRequestRolesSection from '$lib/features/help-requests/detail/HelpRequestRolesSection.svelte';
  import type { HelpRequestPageData } from '$lib/types/detail';

  export let data: HelpRequestPageData;

  let highlightedCommentId: string | null = null;
  let lastRouteSignature = '';
  let activeTab: 'overview' | 'chat' = 'overview';

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  function selectTab(tab: 'overview' | 'chat') {
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

  $: {
    const routeSignature = `${$page.url.pathname}${$page.url.search}${$page.url.hash}`;

    if (routeSignature !== lastRouteSignature) {
      lastRouteSignature = routeSignature;
      highlightedCommentId = readCommentTarget($page.url);
      const requestedTab = $page.url.searchParams.get('tab');
      activeTab = highlightedCommentId ? 'chat' : requestedTab === 'chat' ? 'chat' : 'overview';
    }
  }
</script>

<section class="page">
  <section class="hero-card">
    <ContextualBackButton fallbackHref="/" />
    <div class="top-tab-row" role="tablist" aria-label="Help request detail tabs">
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
    </div>

    {#if activeTab === 'overview'}
      <HelpRequestOverviewHeader {data} />
      <HelpRequestRolesSection {data} />
    {:else}
      <section class="chat-shell">
        <LinkedChatReadMarker subjectType="help_request" subjectId={data.id} />
        <LiveChatPanel
          comments={data.discussion}
          emptyCopy="No help request chat yet."
          fitViewport={true}
          highlightedCommentId={highlightedCommentId}
          placeholder="Write a message..."
          subjectId={data.id}
          submitLabel="Send message"
          title="Help request chat"
          variant="message"
        />
      </section>
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
    cursor: pointer;
  }

  .top-tab.active-tab {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }
</style>
