<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import { addComment } from '$lib/services/queries/details';
  import type { DetailComment, EventPageData } from '$lib/types/detail';
  import { refreshSubjectDiscussion } from '$lib/utils/detailChat';

  export let data: EventPageData;
  export let highlightedCommentId: string | null = null;
  export let fullscreen = false;

  let discussion: DetailComment[] = data.discussion ?? [];
  let discussionSyncKey = '';

  $: nextDiscussionKey = `${data.id}:${data.discussion?.length ?? 0}:${data.discussion?.[0]?.id ?? ''}`;
  $: if (nextDiscussionKey !== discussionSyncKey) {
    discussionSyncKey = nextDiscussionKey;
    discussion = data.discussion ?? [];
  }

  async function submitEventMessage(body: string) {
    const viewerUsername = $page.data.bootstrap?.viewer?.username ?? 'you';
    const optimisticId = `pending-${Date.now()}`;
    const optimisticComment: DetailComment = {
      id: optimisticId,
      authorUsername: viewerUsername,
      body,
      createdAt: new Date().toISOString(),
      voteCount: 0,
      activeVote: 0,
      report: null,
      replies: []
    };

    discussion = [...discussion, optimisticComment];

    try {
      await addComment(data.id, body);
      discussion = await refreshSubjectDiscussion('event', data.id);
      void invalidateAll();
    } catch {
      discussion = discussion.filter((comment) => comment.id !== optimisticId);
      throw new Error('Could not send this message. Try again.');
    }
  }
</script>

<section class="chat-shell" class:chat-shell-fullscreen={fullscreen}>
  <LinkedChatReadMarker subjectType="event" subjectId={data.id} />
  <LiveChatPanel
    comments={discussion}
    embedded={fullscreen}
    emptyCopy="No event chat yet."
    fitViewport={true}
    {highlightedCommentId}
    onSubmitMessage={submitEventMessage}
    placeholder="Message members..."
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
    min-height: 0;
  }

  .chat-shell-fullscreen {
    margin: 0;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .chat-shell-fullscreen :global(.chat-panel) {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }
</style>
