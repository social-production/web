<script lang="ts">
  export let title = '';
  export let description = '';
</script>

<header class="page-header">
  <div class="copy">
    <h1>{title}</h1>
    {#if description}
      <p>{description}</p>
    {/if}
  </div>

  {#if $$slots.actions}
    <div class="actions">
      <slot name="actions" />
    </div>
  {/if}
</header>

<style>
  .page-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 18px 20px;
    border: 1px solid var(--panel-border);
    border-radius: 0;
    background: var(--panel);
  }

  .copy {
    display: grid;
    gap: 6px;
    max-width: 60ch;
  }

  h1 {
    margin: 0;
    font-size: 22px;
    letter-spacing: -0.02em;
    color: var(--brand-strong);
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
</style>