<script lang="ts">
  import type { SurfaceTypeAccent } from '$lib/utils/surfaceType';
  import { surfaceAccentCssVar } from '$lib/utils/surfaceType';

  export let tone: 'public' | 'personal' = 'public';
  export let href: string | null = null;
  export let accent: SurfaceTypeAccent | null = null;
  export let isLast = false;

  $: skipScrollOnNavigate = href?.includes('comment=') ?? false;
  $: accentColor = accent ? surfaceAccentCssVar(accent) : null;
</script>

<article
  class:tone-public={tone === 'public'}
  class:tone-personal={tone === 'personal'}
  class:clickable={!!href}
  class:last-row={isLast}
  class:has-accent={!!accent}
  class="surface"
  style={accentColor ? `--row-accent: ${accentColor};` : undefined}
>
  {#if href}
    <a
      aria-label="Open item"
      class="surface-link"
      data-sveltekit-noscroll={skipScrollOnNavigate || undefined}
      {href}
    ></a>
  {/if}

  <div class="content">
    <slot />
  </div>
</article>

<style>
  .surface {
    position: relative;
    min-width: 0;
    max-width: 100%;
    padding: 18px 12px;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    box-shadow: none;
    background: var(--panel);
    transition: background-color 0.16s ease;
  }

  .surface.has-accent {
    border-left: 3px solid var(--row-accent, var(--type-accent-neutral));
    padding-left: 9px;
  }

  .surface.last-row {
    border-bottom: none;
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
    min-width: 0;
    max-width: 100%;
    pointer-events: none;
  }

  .content :global(.title),
  .content :global(a.title) {
    display: block;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .content :global(.body),
  .content :global(.summary),
  .content :global(.comment-excerpt),
  .content :global(.linked-body.feed) {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 3;
    -webkit-line-clamp: 3;
  }

  .content :global(.subject-title) {
    display: block;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .content :global(.latest-summary) {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }

  .content :global(a),
  .content :global(button),
  .content :global(input),
  .content :global(textarea),
  .content :global(select),
  .content :global(label),
  .content :global([role='link']) {
    pointer-events: auto;
    cursor: pointer;
  }

  .tone-public,
  .tone-personal {
    background: var(--panel);
  }

  .clickable {
    cursor: pointer;
  }

  .clickable:hover {
    background: var(--panel-hover);
  }
</style>
