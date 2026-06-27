<script lang="ts">
  import LinkedChatReadMarker from '$lib/components/chat/LinkedChatReadMarker.svelte';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import type { ProjectPageData } from '$lib/types/detail';

  export let data: ProjectPageData;
  export let highlightedCommentId: string | null = null;
</script>

<section class="chat-shell">
  <LinkedChatReadMarker subjectType="project" subjectId={data.id} />
  <LiveChatPanel
    comments={data.discussion}
    emptyCopy="No project chat yet."
    fitViewport={true}
    {highlightedCommentId}
    placeholder="Message the project..."
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
</style>
