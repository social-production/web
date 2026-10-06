<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import { syncChatImmersive } from '$lib/stores/chatChrome';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import HelpRequestOverviewHeader from '$lib/features/help-requests/detail/HelpRequestOverviewHeader.svelte';
  import HelpRequestRolesSection from '$lib/features/help-requests/detail/HelpRequestRolesSection.svelte';
  import { addComment } from '$lib/services/commands/shared';
  import { subscribeToSubjectComments } from '$lib/api/drivers/supabase/realtime';
  import { registerEntityType } from '$lib/services/governanceEntityRegistry';
  import type { DetailComment, HelpRequestPageData } from '$lib/types/detail';
  import { refreshSubjectDiscussion } from '$lib/utils/detailChat';
  import { startVisibilityPoll } from '$lib/utils/visibilityPoll';
  import {
    ChatSendError,
    createOptimisticComment,
    mergeDiscussion,
    pruneOptimisticComments,
    syncIncomingDiscussion,
  } from '$lib/utils/discussionState';

  export let data: HelpRequestPageData;

  let highlightedCommentId: string | null = null;
  let lastRouteSignature = '';
  let activeTab: 'overview' | 'chat' = 'overview';
  let chatHold = 0;
  $: chatHold = syncChatImmersive(activeTab === 'chat', chatHold);
  onDestroy(() => {
    chatHold = syncChatImmersive(false, chatHold);
  });
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

  async function refreshDiscussion() {
    try {
      const refreshed = await refreshSubjectDiscussion('help_request', data.id);
      serverDiscussion = refreshed;
      optimisticComments = pruneOptimisticComments(refreshed, optimisticComments);
    } catch {
      // Keep current discussion until the next successful refresh.
    }
  }

  onMount(() => {
    const media = window.matchMedia('(max-width: 1080px)');
    const syncCompact = () => {
      isCompact = media.matches;
    };

    syncCompact();
    media.addEventListener('change', syncCompact);
    const stopPolling = startVisibilityPoll(refreshDiscussion, {
      activeMs: 8_000,
      idleMs: 45_000,
      isActive: () => activeTab === 'chat',
    });
    const stopRealtime = subscribeToSubjectComments('help_request', data.id, () => {
      if (activeTab === 'chat') void refreshDiscussion();
    });
    if (activeTab === 'chat') void refreshDiscussion();

    return () => {
      media.removeEventListener('change', syncCompact);
      stopPolling();
      stopRealtime();
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
    if (tab === 'chat') void refreshDiscussion();

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
      keepFocus: true,
    });
  }

  $: {
    const routeSignature = `${$page.url.pathname}${$page.url.search}${$page.url.hash}`;

    if (routeSignature !== lastRouteSignature) {
      lastRouteSignature = routeSignature;
      highlightedCommentId = readCommentTarget($page.url);
      const requestedTab = $page.url.searchParams.get('tab');
      activeTab = highlightedCommentId ? 'chat' : requestedTab === 'chat' ? 'chat' : 'overview';
      if (activeTab === 'chat') void refreshDiscussion();
    }
  }

  const fastapiChat =
    (import.meta.env.VITE_BACKEND ?? '').trim().toLowerCase() === 'fastapi';

  async function submitHelpRequestMessage(body: string, files?: File[]) {
    registerEntityType(data.id, 'help_request');

    const viewerUsername = $page.data.bootstrap?.viewer?.username ?? 'you';
    const optimistic = createOptimisticComment(viewerUsername, body, files);
    optimisticComments = [...optimisticComments, optimistic];

    try {
      await addComment({ id: data.id, type: 'help_request' }, body, undefined, files);
      void invalidate('inbox:messages');
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
    <div class="top-tab-row" class:chat-immersive={activeTab === 'chat'} role="tablist" aria-label="Help request detail tabs">
      <button
        aria-label="Details"
        aria-selected={activeTab === 'overview'}
        class:active-tab={activeTab === 'overview'}
        class="top-tab detail-surface-tab"
        role="tab"
        type="button"
        on:click={() => selectTab('overview')}
      >
        <span class="tab-icon" aria-hidden="true">
          <FeedToolbarIcon name="list" />
        </span>
        <span class="tab-label">Details</span>
      </button>
      <button
        aria-label="Chat"
        aria-selected={activeTab === 'chat'}
        class:active-tab={activeTab === 'chat'}
        class="top-tab detail-surface-tab"
        role="tab"
        type="button"
        on:click={() => selectTab('chat')}
      >
        <span class="tab-icon" aria-hidden="true">
          <FeedToolbarIcon name="message" />
        </span>
        <span class="tab-label">Chat</span>
      </button>
    </div>

    {#if activeTab === 'overview'}
      <div class="context-tab">
        <HelpRequestOverviewHeader {data} />
        <HelpRequestRolesSection {data} actionsActive={activeTab === 'overview'} />
      </div>
    {:else}
      <section class="chat-shell" class:chat-shell-compact={activeTab === 'chat' && isCompact}>
        <LinkedChatReadMarker subjectType="help_request" subjectId={data.id} />
        <LiveChatPanel
          allowAttachments={fastapiChat}
          comments={discussion}
          embedded={activeTab === 'chat' && isCompact}
          emptyCopy="No help request chat yet."
          fitViewport={activeTab === 'chat' && isCompact}
          {highlightedCommentId}
          onModerated={async () => {
            const refreshed = await refreshSubjectDiscussion('help_request', data.id);
            serverDiscussion = refreshed;
            optimisticComments = pruneOptimisticComments(refreshed, optimisticComments);
          }}
          onSubmitMessage={submitHelpRequestMessage}
          placeholder="Write a message..."
          reportTargetType="comment"
          showHeader={true}
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
    min-width: 0;
    padding-bottom: calc(var(--detail-action-dock-height, 0px) + 12px);
  }

  .page:has(> .hero-card > .context-tab) {
    padding-bottom: 0;
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
    min-width: 0;
    overflow: visible;
  }

  .context-tab {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
    overflow: visible;
  }

  .hero-card:has(> .context-tab) {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-height: calc(
      100dvh - var(--topbar-height, 56px) - var(--shell-bottom-nav-offset, 0px) - 32px
    );
    margin-bottom: -16px;
    padding-bottom: var(--detail-action-dock-height, 0px);
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

  .tab-icon {
    display: none;
    width: 18px;
    height: 18px;
  }

  .tab-icon :global(.toolbar-icon) {
    width: 18px;
    height: 18px;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 108px;
    padding: 9px 12px;
    border-radius: calc(var(--radius-sm) - 2px);
    font-size: 13px;
    font-weight: 700;
  }

  @media (max-width: 1080px) {
    .page {
      min-width: 0;
      overflow-x: clip;
      overflow-y: clip;
    }

    .page-chat {
      grid-template-rows: minmax(0, 1fr);
      gap: 0;
      height: calc(
        var(--shell-visual-viewport-height, 100dvh) - var(--topbar-height) -
          var(--shell-bottom-nav-offset)
      );
      min-height: 0;
      overflow: hidden;
    }

    .hero-card {
      min-width: 0;
      overflow: visible;
      padding-top: 0;
      margin-top: 0;
      border-radius: 0;
    }

    .hero-card:has(> .context-tab) {
      min-height: calc(
        100dvh - var(--topbar-height, 56px) - var(--shell-bottom-nav-offset, 0px)
      );
      margin-bottom: -4px;
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

    .top-tab-row.chat-immersive {
      padding-top: calc(8px + var(--shell-safe-top, 0px));
    }

    .chat-tab-active > :global(.chat-shell) {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }

    .top-tab-row {
      position: sticky;
      top: var(--topbar-height, 0px);
      z-index: var(--z-detail-tabs);
      width: auto;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      transform: none;
      margin: 0 -16px 12px;
      padding: 8px 16px;
      border: 0;
      border-bottom: 1px solid var(--panel-border);
      border-radius: 0;
      background: var(--toolbar-background, var(--panel));
      box-shadow: 0 8px 16px color-mix(in srgb, var(--page-bg) 55%, transparent);
    }

    .top-tab {
      min-width: 0;
      padding: 10px 6px;
      font-size: 12px;
    }

    .tab-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .tab-label {
      display: none;
    }
  }
</style>
