<script lang="ts">
  import ProjectCard from '$lib/components/cards/public-feed/ProjectCard.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import type { AssetProjectReference } from '$lib/types/assets';

  export let title = '';
  export let description = '';
  export let projects: AssetProjectReference[] = [];
</script>

<section class="section-stack">
  <div class="section-heading">
    <h2>{title}</h2>
    <p>{description}</p>
  </div>

  <div class="project-grid">
    {#each projects as project}
      {#if project.publicItem}
        <ProjectCard item={project.publicItem} />
      {:else}
        <FeedSurface href={project.href ?? null} tone="public">
          <div class="project-card-shell">
            <div class="project-topline">
              <SubjectTablet kind="project" projectMode={project.projectMode} />
              <span class="status-copy">{project.statusLabel}</span>
            </div>
            <h3>{project.title}</h3>
            <span class="relationship-copy">{project.relationshipLabel}</span>
            <p>{project.summary}</p>
            <span class:muted-open-copy={!project.href} class="open-copy">
              {project.href ? 'Open project' : 'Project route not available yet'}
            </span>
          </div>
        </FeedSurface>
      {/if}
    {/each}
  </div>
</section>

<style>
  .section-stack,
  .section-heading,
  .project-grid,
  .project-card-shell {
    display: grid;
    gap: 14px;
  }

  .project-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .project-topline {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  h2,
  h3 {
    margin: 0;
    color: var(--text-main);
  }

  p,
  span {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.55;
  }

  .status-copy {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    font-size: 11px;
    font-weight: 700;
  }

  .relationship-copy {
    font-size: 12px;
    color: var(--text-main);
  }

  .open-copy {
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-strong);
  }

  .muted-open-copy {
    color: var(--text-soft);
  }
</style>