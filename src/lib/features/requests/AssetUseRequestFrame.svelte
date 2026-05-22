<script lang="ts">
  import RequestFrameCard from './RequestFrameCard.svelte';

  export let title = 'Project-use asset request flow';
  export let body =
    'This frame is reserved for plan-blocking asset availability requests, steward votes, and confirmed in-house asset allocations.';
  export let statusLabel = 'Frame only';
</script>

<RequestFrameCard {title} {body} {statusLabel} />