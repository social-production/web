<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import HelpRequestOverviewHeader from '$lib/features/help-requests/detail/HelpRequestOverviewHeader.svelte';
  import HelpRequestRolesSection from '$lib/features/help-requests/detail/HelpRequestRolesSection.svelte';
  import { addComment } from '$lib/services/commands/shared';
  import { registerEntityType } from '$lib/api/drivers/fastapi/typeRegistry';
  import type { DetailComment, HelpRequestPageData } from '$lib/types/detail';
  import { refreshSubjectDiscussion } from '$lib/utils/detailChat';
  import {
    ChatSendError,
    createOptimisticComment,
    mergeDiscussion,
    pruneOptimisticComments,
    syncIncomingDiscussion
  } from '$lib/utils/discussionState';

  export let data: HelpRequestPageData;

  let highlightedCommentId: string | null = null;
  let lastRouteSignature = '';
  let activeTab: 'overview' | 'chat' = 'overview';
  let isCompact = false;
  let serverDiscussion: DetailComment[] = data.discussion ?? [];
  let optimisticComments: DetailComment[] = [];
  let lastPropDiscussion = data.discussion;

  $: if (data.discussion !== lastPropDiscussion) {
    lastPropDiscussion = data.discussion;
    serverDiscussion = syncIncomingDiscussion(serverDiscussion, data.discussion);
    optimisticComments = pruneOptimisticComments(serverDiscussion, optimisticComments);
  }

  $: discussion = mergeDiscussion(serverDiscussion, optimisticComments);

  onMount(() => {
    const media = window.matchMedia('(max-width: 1080px)');
    const syncCompact = () => {
      isCompact = media.matches;
    };

    syncCompact();
    media.addEventListener('change', syncCompact);

    return () => {
      media.removeEventListener('change', syncCompact);
    };
  });

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

  async function submitHelpRequestMessage(body: string) {
    registerEntityType(data.id, 'help_request');

    const viewerUsername = $page.data.bootstrap?.viewer?.username ?? 'you';
    const optimistic = createOptimisticComment(viewerUsername, body);
    optimisticComments = [...optimisticComments, optimistic];

    try {
      await addComment(data.id, body, undefined, 'help_request');
    } catch {
      optimisticComments = optimisticComments.filter((comment) => comment.id !== optimistic.id);
      throw new ChatSendError();
    }

    try {
      const refreshed = await refreshSubjectDiscussion('help_request', data.id);
      serverDiscussion = refreshed;
      optimisticComments = pruneOptimisticComments(refreshed, optimisticComments);
    } catch {
      // Comment was saved; keep optimistic row until the next refresh succeeds.
    }
  }
</script>

<section class="page" class:page-chat={activeTab === 'chat' && isCompact}>
  <section class="hero-card" class:chat-tab-active={activeTab === 'chat' && isCompact}>
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
      <section class="chat-shell" class:chat-shell-compact={activeTab === 'chat' && isCompact}>
        <LinkedChatReadMarker subjectType="help_request" subjectId={data.id} />
        <LiveChatPanel
          comments={discussion}
          embedded={activeTab === 'chat' && isCompact}
          emptyCopy="No help request chat yet."
          fitViewport={activeTab === 'chat' && isCompact}
          highlightedCommentId={highlightedCommentId}
          onSubmitMessage={submitHelpRequestMessage}
          placeholder="Write a message..."
          showHeader={!(activeTab === 'chat' && isCompact)}
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

  .chat-shell-compact {
    margin: 0;
    min-height: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-shell-compact :global(.chat-panel) {
    flex: 1 1 auto;
    min-height: 0;
    max-height: 100%;
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

  @media (max-width: 1080px) {
    .page {
      min-width: 0;
      overflow-x: clip;
    }

    .page-chat {
      grid-template-rows: minmax(0, 1fr);
      gap: 0;
      height: calc(100dvh - var(--topbar-height) - var(--shell-bottom-nav-offset));
      min-height: 0;
      overflow: hidden;
    }

    .hero-card {
      min-width: 0;
      overflow-x: clip;
      padding-top: 16px;
      margin-top: 12px;
    }

    .hero-card.chat-tab-active {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      margin-top: 0;
      padding: 8px 0 0;
      border: none;
      background: transparent;
      overflow: hidden;
    }

    .chat-tab-active .top-tab-row {
      position: sticky;
      top: 0;
      z-index: 2;
      margin: 0 8px 8px;
      background: var(--panel);
      flex-shrink: 0;
    }

    .chat-tab-active > :global(.chat-shell) {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }

    .top-tab-row {
      position: static;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      transform: none;
      box-shadow: none;
      margin-bottom: 12px;
    }

    .top-tab {
      min-width: 0;
      padding: 8px 6px;
      font-size: 12px;
    }
  }
</style>
