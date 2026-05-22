<script lang="ts">
  import RequestFrameCard from './RequestFrameCard.svelte';

  export let title = 'Borrowing request flow';
  export let body =
    'This frame is reserved for user borrowing requests, return dates, steward review, and overdue state once borrowing is activated.';
  export let statusLabel = 'Frame only';
</script>

<RequestFrameCard {title} {body} {statusLabel} />