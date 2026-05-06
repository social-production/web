<script lang="ts">
  export let title: string;
  export let description = '';
  export let surface: 'panel' | 'transparent' = 'panel';
</script>

<section class:transparent={surface === 'transparent'} class="panel">
  <h2>{title}</h2>
  {#if description}
    <p class="description">{description}</p>
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

  .transparent {
    padding: 0;
    border: none;
    background: transparent;
  }

  h2 {
    font-size: 14px;
    font-weight: 700;
  }

  .description {
    margin-top: 4px;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.4;
  }

  .body {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .transparent .body {
    margin-top: 0;
  }
</style>