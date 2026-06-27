<script lang="ts">
  import { markLinkedChatRead } from '$lib/services/queries/inbox';
  import { onMount } from 'svelte';

  export let subjectType: string;
  export let subjectId: string;
  export let clearedCount = 1;

  onMount(() => {
    void markLinkedChatRead(subjectType, subjectId, clearedCount);
  });
</script>
