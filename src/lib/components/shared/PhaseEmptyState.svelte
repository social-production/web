<script lang="ts">
  export let title = '';
  export let body = '';
</script>

<div class="phase-empty">
  <strong>{title}</strong>
  {#if body}
    <p>{body}</p>
  {/if}
</div>

<style>
  .phase-empty {
    display: grid;
    gap: 4px;
    max-width: 62ch;
    padding: 4px 0 8px;
  }

  strong {
    color: var(--text-main);
    font-size: 14px;
    font-weight: 800;
  }

  p {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.5;
  }
</style>
