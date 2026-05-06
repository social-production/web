<script lang="ts">
  export let tone: 'public' | 'personal' = 'public';
  export let href: string | null = null;
</script>

<article class:tone-public={tone === 'public'} class:tone-personal={tone === 'personal'} class:clickable={!!href} class="surface">
  {#if href}
    <a aria-label="Open item" class="surface-link" href={href}></a>
  {/if}

  <div class="content">
    <slot />
  </div>
</article>

<style>
  .surface {
    position: relative;
    padding: 16px;
    border-radius: 0;
    border: 1px solid var(--surface-thread-border);
    box-shadow: var(--shadow);
  }

  .surface-link {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
  }

  .content {
    position: relative;
    z-index: 1;
    pointer-events: none;
  }

  .content :global(a),
  .content :global(button),
  .content :global(input),
  .content :global(textarea),
  .content :global(select),
  .content :global(label) {
    pointer-events: auto;
  }

  .tone-public {
    background: var(--panel);
    border-color: var(--panel-border);
  }

  .tone-personal {
    background: var(--panel);
    border-color: var(--panel-border);
  }

  .clickable {
    cursor: pointer;
  }

  .clickable:hover {
    border-color: var(--brand);
  }
</style>