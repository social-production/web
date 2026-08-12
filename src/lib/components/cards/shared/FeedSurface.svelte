<script lang="ts">
  import type { SurfaceTypeAccent } from '$lib/utils/surfaceType';
  import { surfaceAccentCssVar } from '$lib/utils/surfaceType';

  export let tone: 'public' | 'personal' = 'public';
  export let href: string | null = null;
  export let accent: SurfaceTypeAccent | null = null;
  export let isLast = false;
  /** Serious-harm restriction: keep card in feed but blur text/media with a warning. */
  export let contentRestricted = false;
  /** Feed cards clamp body/summary; detail surfaces that embed discussion should not. */
  export let clampExcerpts = true;

  let revealRestricted = false;

  $: skipScrollOnNavigate = href?.includes('comment=') ?? false;
  $: accentColor = accent ? surfaceAccentCssVar(accent) : null;
  $: blurContent = contentRestricted && !revealRestricted;
</script>

<article
  class:tone-public={tone === 'public'}
  class:tone-personal={tone === 'personal'}
  class:clickable={!!href}
  class:last-row={isLast}
  class:has-accent={!!accent}
  class:content-restricted={contentRestricted}
  class="surface"
  style={accentColor ? `--row-accent: ${accentColor};` : undefined}
>
  {#if href}
    <a
      aria-label="Open item"
      class="surface-link"
      data-sveltekit-noscroll={skipScrollOnNavigate || undefined}
      data-sveltekit-preload-data="off"
      {href}
    ></a>
  {/if}

  {#if contentRestricted}
    <div class="restriction-banner">
      <span>Serious harm report — content blurred until you choose to reveal it.</span>
      <button
        class="reveal-btn"
        type="button"
        on:click|stopPropagation={() => (revealRestricted = !revealRestricted)}
      >
        {revealRestricted ? 'Hide again' : 'Reveal'}
      </button>
    </div>
  {/if}

  <div class:blurred={blurContent} class:clamp-excerpts={clampExcerpts} class="content">
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

  .surface.content-restricted {
    background: color-mix(in srgb, var(--brand-soft) 35%, var(--panel));
  }

  .surface-link {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
  }

  .restriction-banner {
    position: relative;
    z-index: 2;
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 10px;
    padding: 8px 10px;
    border: 1px solid color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    pointer-events: auto;
  }

  .reveal-btn {
    padding: 4px 8px;
    border: 1px solid color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    border-radius: 999px;
    background: var(--panel);
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .content {
    position: relative;
    z-index: 1;
    min-width: 0;
    max-width: 100%;
    pointer-events: none;
  }

  .content.blurred {
    filter: blur(6px);
    user-select: none;
  }

  .content :global(.title),
  .content :global(a.title),
  .content :global(.subject-title) {
    display: block;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .content.clamp-excerpts :global(.body),
  .content.clamp-excerpts :global(.summary),
  .content.clamp-excerpts :global(.comment-excerpt),
  .content.clamp-excerpts :global(.linked-body.feed) {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 3;
    -webkit-line-clamp: 3;
  }

  .content.clamp-excerpts :global(.latest-summary) {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }

  .content:not(.clamp-excerpts) :global(.body),
  .content:not(.clamp-excerpts) :global(.summary),
  .content:not(.clamp-excerpts) :global(.comment-excerpt),
  .content:not(.clamp-excerpts) :global(.linked-body),
  .content:not(.clamp-excerpts) :global(.latest-summary) {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .content :global(a),
  .content :global(button),
  .content :global(input),
  .content :global(textarea),
  .content :global(select),
  .content :global(label),
  .content :global([role='link']),
  .content :global(.report-control),
  .content :global(.report-menu-shell) {
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
