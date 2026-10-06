<script lang="ts">
  export let title = '';
  export let description = '';
  export let surface: 'panel' | 'transparent' = 'panel';
  export let bare = false;
</script>

<section class:bare class:transparent={surface === 'transparent'} class="panel">
  {#if !bare}
    {#if title}
      <h2>{title}</h2>
    {/if}
    {#if description}
      <p class="description">{description}</p>
    {/if}
  {/if}
  <div class="body">
    <slot />
  </div>
</section>

<style>
  .panel {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .transparent,
  .bare {
    padding: 0;
    border: none;
    background: transparent;
  }

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .description {
    margin-top: 8px;
    color: var(--text-soft);
    font-size: 15px;
    line-height: 1.5;
  }

  .body {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .transparent .body,
  .bare .body {
    margin-top: 0;
  }
</style>