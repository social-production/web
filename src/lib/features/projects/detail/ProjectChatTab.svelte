<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import { addComment } from '$lib/services/queries/details';
  import type { DetailComment, ProjectPageData } from '$lib/types/detail';
  import { refreshSubjectDiscussion } from '$lib/utils/detailChat';

  export let data: ProjectPageData;
  export let highlightedCommentId: string | null = null;
  export let fullscreen = false;

  let isCompact = false;
  let discussion: DetailComment[] = data.discussion ?? [];
  let discussionSyncKey = '';

  $: nextDiscussionKey = `${data.id}:${data.discussion?.length ?? 0}:${data.discussion?.[0]?.id ?? ''}`;
  $: if (nextDiscussionKey !== discussionSyncKey) {
    discussionSyncKey = nextDiscussionKey;
    discussion = data.discussion ?? [];
  }

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

  async function submitProjectMessage(body: string) {
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
      discussion = await refreshSubjectDiscussion('project', data.id);
      void invalidateAll();
    } catch {
      discussion = discussion.filter((comment) => comment.id !== optimisticId);
      throw new Error('Could not send this message. Try again.');
    }
  }
</script>

<section class="chat-shell" class:chat-shell-compact={isCompact || fullscreen} class:chat-shell-fullscreen={fullscreen}>
  <LinkedChatReadMarker subjectType="project" subjectId={data.id} />
  <LiveChatPanel
    comments={discussion}
    embedded={isCompact || fullscreen}
    emptyCopy="No project chat yet."
    fitViewport={!isCompact || fullscreen}
    {highlightedCommentId}
    onSubmitMessage={submitProjectMessage}
    placeholder="Message the project..."
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
    min-height: 0;
  }

  .chat-shell-compact,
  .chat-shell-fullscreen {
    margin: 0;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .chat-shell-compact :global(.chat-panel),
  .chat-shell-fullscreen :global(.chat-panel) {
    flex: 1 1 auto;
    min-height: 0;
  }

  .chat-shell-compact :global(.chat-panel.embedded),
  .chat-shell-fullscreen :global(.chat-panel.embedded) {
    height: 100%;
    min-height: 0;
  }

  .chat-shell-fullscreen :global(.chat-panel.fit-viewport) {
    height: 100%;
    min-height: 0;
  }
</style>
