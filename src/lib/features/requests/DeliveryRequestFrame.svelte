<script lang="ts">
  import RequestFrameCard from './RequestFrameCard.svelte';

  export let title = 'Delivery request flow';
  export let body =
    'This frame is reserved for delivery requests with origin, destination, timing, volunteer coordination, and completed-transfer records.';
  export let statusLabel = 'Frame only';
</script>

<RequestFrameCard {title} {body} {statusLabel} />