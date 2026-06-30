<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import { addComment } from '$lib/services/queries/details';
  import { registerEntityType } from '$lib/api/drivers/fastapi/typeRegistry';
  import type { DetailComment, ProjectPageData } from '$lib/types/detail';
  import { refreshSubjectDiscussion } from '$lib/utils/detailChat';
  import {
    ChatSendError,
    createOptimisticComment,
    mergeDiscussion,
    pruneOptimisticComments,
    syncIncomingDiscussion
  } from '$lib/utils/discussionState';

  export let data: ProjectPageData;
  export let highlightedCommentId: string | null = null;
  export let fullscreen = false;

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

  async function submitProjectMessage(body: string) {
    registerEntityType(data.id, 'project');

    const viewerUsername = $page.data.bootstrap?.viewer?.username ?? 'you';
    const optimistic = createOptimisticComment(viewerUsername, body);
    optimisticComments = [...optimisticComments, optimistic];

    try {
      await addComment(data.id, body, undefined, 'project');
    } catch {
      optimisticComments = optimisticComments.filter((comment) => comment.id !== optimistic.id);
      throw new ChatSendError();
    }

    try {
      const refreshed = await refreshSubjectDiscussion('project', data.id);
      serverDiscussion = refreshed;
      optimisticComments = pruneOptimisticComments(refreshed, optimisticComments);
    } catch {
      // Comment was saved; keep optimistic row until the next refresh succeeds.
    }
  }
</script>

<section class="chat-shell" class:chat-shell-compact={isCompact || fullscreen} class:chat-shell-fullscreen={fullscreen}>
  <LinkedChatReadMarker subjectType="project" subjectId={data.id} />
  <LiveChatPanel
    comments={discussion}
    embedded={isCompact || fullscreen}
    emptyCopy="No project chat yet."
    fitViewport={isCompact || fullscreen}
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
