<script lang="ts">
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import type { ProjectPageData } from '$lib/types/detail';

  export let data: ProjectPageData;
  export let highlightedCommentId: string | null = null;
</script>

<section class="chat-shell">
  <LiveChatPanel
    comments={data.discussion}
    emptyCopy="No project chat yet."
    {highlightedCommentId}
    placeholder="Message the project..."
    subjectId={data.id}
    submitLabel="Send"
    title="# project-chat"
  />
</section>

<style>
  .chat-shell {
    margin-top: 12px;
  }
</style>
