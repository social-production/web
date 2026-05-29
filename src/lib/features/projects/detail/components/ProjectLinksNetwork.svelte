<script lang="ts">
  import ProjectCard from '$lib/components/cards/public-feed/ProjectCard.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import type { ProjectLinksFrameItem } from '$lib/types/detail';

  export let title = '';
  export let description = '';
  export let items: ProjectLinksFrameItem[] = [];
  export let emptyMessage = 'No linked records yet.';
</script>

<section class="network-stack">
  <div class="section-heading">
    <h2>{title}</h2>
    {#if description}
      <p>{description}</p>
    {/if}
  </div>

  {#if items.length === 0}
    <div class="empty-card">{emptyMessage}</div>
  {:else}
    <div class="link-list">
      {#each items as item}
        <article class="link-card">
          <div class="link-copy">
            <span class="relationship-pill">{item.relationshipLabel}</span>
            <p>{item.summary}</p>
          </div>

          {#if item.publicItem}
            <ProjectCard item={item.publicItem} />
          {:else}
            <FeedSurface href={item.href ?? null} tone="public">
              <div class="fallback-card">
                <div class="fallback-topline">
                  <SubjectTablet kind="project" projectMode="productive" />
                </div>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                {#if item.href}
                  <a class="open-link" href={item.href}>Open linked project</a>
                {:else}
                  <span class="open-link muted">Route not available yet</span>
                {/if}
              </div>
            </FeedSurface>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .network-stack,
  .link-list,
  .link-card,
  .link-copy,
  .fallback-card {
    display: grid;
    gap: 12px;
  }

  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .link-card {
    gap: 10px;
  }

  h2,
  strong {
    margin: 0;
    color: var(--text-main);
  }

  p,
  .empty-card {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .relationship-pill {
    width: fit-content;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .open-link {
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .open-link.muted {
    color: var(--text-soft);
  }

  .fallback-topline {
    display: flex;
    align-items: center;
  }
</style>