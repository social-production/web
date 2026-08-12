<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import { addComment } from '$lib/services/commands/shared';
  import { subscribeToSubjectComments } from '$lib/api/drivers/supabase/realtime';
  import { registerEntityType } from '$lib/services/governanceEntityRegistry';
  import type { DetailComment, EventPageData } from '$lib/types/detail';
  import { refreshSubjectDiscussion } from '$lib/utils/detailChat';
  import { startVisibilityPoll } from '$lib/utils/visibilityPoll';
  import {
    ChatSendError,
    createOptimisticComment,
    mergeDiscussion,
    pruneOptimisticComments,
    syncIncomingDiscussion,
  } from '$lib/utils/discussionState';

  export let data: EventPageData;
  export let highlightedCommentId: string | null = null;
  export let fullscreen = false;

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
      const refreshed = await refreshSubjectDiscussion('event', data.id);
      serverDiscussion = refreshed;
      optimisticComments = pruneOptimisticComments(refreshed, optimisticComments);
    } catch {
      // Keep current discussion until the next successful refresh.
    }
  }

  onMount(() => {
    const stopPolling = startVisibilityPoll(refreshDiscussion, {
      activeMs: 8_000,
      idleMs: 45_000,
    });
    const stopRealtime = subscribeToSubjectComments('event', data.id, () => {
      void refreshDiscussion();
    });
    return () => {
      stopPolling();
      stopRealtime();
    };
  });

  async function submitEventMessage(body: string) {
    registerEntityType(data.id, 'event');

    const viewerUsername = $page.data.bootstrap?.viewer?.username ?? 'you';
    const optimistic = createOptimisticComment(viewerUsername, body);
    optimisticComments = [...optimisticComments, optimistic];

    try {
      await addComment({ id: data.id, type: 'event' }, body);
      void invalidate('inbox:messages');
    } catch {
      optimisticComments = optimisticComments.filter((comment) => comment.id !== optimistic.id);
      throw new ChatSendError();
    }

    await refreshDiscussion();
  }
</script>

<section class="chat-shell" class:chat-shell-fullscreen={fullscreen}>
  <LinkedChatReadMarker subjectType="event" subjectId={data.id} />
  <LiveChatPanel
    comments={discussion}
    embedded={fullscreen}
    emptyCopy="No event chat yet."
    fitViewport={fullscreen}
    {highlightedCommentId}
    onModerated={async () => {
      await refreshDiscussion();
    }}
    onSubmitMessage={submitEventMessage}
    placeholder="Message members..."
    reportTargetType="comment"
    showHeader={!fullscreen}
    subjectId={data.id}
    submitLabel="Send message"
    title="Event chat"
    variant="message"
  />
</section>

<style>
  .chat-shell {
    margin-top: 16px;
  }

  .chat-shell-fullscreen {
    margin: 0;
    min-height: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-shell-fullscreen :global(.chat-panel) {
    flex: 1 1 auto;
    min-height: 0;
    max-height: 100%;
  }
</style>
