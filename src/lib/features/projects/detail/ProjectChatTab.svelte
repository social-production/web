<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import LiveChatPanel from '$lib/components/chat/LiveChatPanel.svelte';
  import { markLinkedChatRead } from '$lib/services/queries/inbox';
  import type { ProjectPageData } from '$lib/types/detail';
  import { onMount } from 'svelte';

  export let data: ProjectPageData;
  export let highlightedCommentId: string | null = null;

  onMount(() => {
    void markLinkedChatRead('project', data.id).then(() => invalidateAll());
  });
</script>

<section class="chat-shell">
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
