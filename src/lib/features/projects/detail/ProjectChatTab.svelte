<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import { addComment } from '$lib/services/commands/shared';
  import { subscribeToSubjectComments } from '$lib/api/drivers/supabase/realtime';
  import { registerEntityType } from '$lib/services/governanceEntityRegistry';
  import type { DetailComment, ProjectPageData } from '$lib/types/detail';
  import { refreshSubjectDiscussion } from '$lib/utils/detailChat';
  import { startVisibilityPoll } from '$lib/utils/visibilityPoll';
  import {
    ChatSendError,
    createOptimisticComment,
    mergeDiscussion,
    pruneOptimisticComments,
    syncIncomingDiscussion,
  } from '$lib/utils/discussionState';

  export let data: ProjectPageData;
  export let highlightedCommentId: string | null = null;
  export let fullscreen = false;
  export let active = true;

  let isCompact = false;
  let serverDiscussion: DetailComment[] = data.discussion ?? [];
  let optimisticComments: DetailComment[] = [];
  let lastPropDiscussion = data.discussion;
  let chatStarted = false;
  let stopChatLive: (() => void) | null = null;

  $: if (data.discussion !== lastPropDiscussion) {
    lastPropDiscussion = data.discussion;
    serverDiscussion = syncIncomingDiscussion(serverDiscussion, data.discussion);
    optimisticComments = pruneOptimisticComments(serverDiscussion, optimisticComments);
  }

  $: discussion = mergeDiscussion(serverDiscussion, optimisticComments);

  async function refreshDiscussion() {
    try {
      const refreshed = await refreshSubjectDiscussion('project', data.id);
      serverDiscussion = refreshed;
      optimisticComments = pruneOptimisticComments(refreshed, optimisticComments);
    } catch {
      // Keep current discussion until the next successful refresh.
    }
  }

  function startChatLive() {
    if (chatStarted) return;
    chatStarted = true;
    const stopPolling = startVisibilityPoll(refreshDiscussion, {
      activeMs: 8_000,
      idleMs: 45_000,
      isActive: () => active,
    });
    const stopRealtime = subscribeToSubjectComments('project', data.id, () => {
      void refreshDiscussion();
    });
    void refreshDiscussion();
    stopChatLive = () => {
      stopPolling();
      stopRealtime();
    };
  }

  $: if (active) startChatLive();

  onMount(() => {
    const media = window.matchMedia('(max-width: 1080px)');
    const syncCompact = () => {
      isCompact = media.matches;
    };

    syncCompact();
    media.addEventListener('change', syncCompact);
    if (active) startChatLive();

    return () => {
      media.removeEventListener('change', syncCompact);
      stopChatLive?.();
    };
  });

  async function submitProjectMessage(body: string) {
    registerEntityType(data.id, 'project');

    const viewerUsername = $page.data.bootstrap?.viewer?.username ?? 'you';
    const optimistic = createOptimisticComment(viewerUsername, body);
    optimisticComments = [...optimisticComments, optimistic];

    try {
      await addComment({ id: data.id, type: 'project' }, body);
      void invalidate('inbox:messages');
    } catch {
      optimisticComments = optimisticComments.filter((comment) => comment.id !== optimistic.id);
      throw new ChatSendError();
    }

    await refreshDiscussion();
  }
</script>

<section
  class="chat-shell"
  class:chat-shell-compact={isCompact || fullscreen}
  class:chat-shell-fullscreen={fullscreen}
>
  <LinkedChatReadMarker subjectType="project" subjectId={data.id} />
  <LiveChatPanel
    comments={discussion}
    embedded={isCompact || fullscreen}
    emptyCopy="No project chat yet."
    fitViewport={isCompact || fullscreen}
    {highlightedCommentId}
    onModerated={async () => {
      await refreshDiscussion();
    }}
    onSubmitMessage={submitProjectMessage}
    placeholder="Message the project..."
    reportTargetType="comment"
    showHeader={!(isCompact || fullscreen)}
    subjectId={data.id}
    submitLabel="Send"
    title="# project-chat"
    variant="message"
  />
</section>

<style>
  .chat-shell {
    margin-top: 16px;
  }

  .chat-shell-compact,
  .chat-shell-fullscreen {
    margin: 0;
    min-height: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-shell-compact :global(.chat-panel),
  .chat-shell-fullscreen :global(.chat-panel) {
    flex: 1 1 auto;
    min-height: 0;
    max-height: 100%;
  }
</style>
