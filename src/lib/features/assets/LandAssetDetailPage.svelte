<script lang="ts">
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import type { AssetProjectReference, LandAssetRecord } from '$lib/types/assets';
  import type { ScopePageData } from '$lib/types/scope';

  export let scope: ScopePageData;
  export let asset: LandAssetRecord;
  export let featureOpen = false;

  const projectSections: Array<{
    title: string;
    description: string;
    projects: AssetProjectReference[];
  }> = [
    {
      title: 'Land management collective service',
      description: 'Every land asset stays attached to collective land stewardship work.',
      projects: asset.managementProjects
    },
    {
      title: 'Storage collective services on this land',
      description: 'Storage services can stack on the same land while staying distinct from stewardship.',
      projects: asset.storageProjects
    },
    {
      title: 'Other projects using this land',
      description: 'Projects can reference the land record even before the live asset registry opens.',
      projects: asset.linkedProjects
    }
  ];
</script>

<section class="asset-detail-page">
  <a class="back-link" href="/platform/assets">Back to {scope.title} assets</a>

  <div class="hero-card">
    <div class="hero-header">
      <div>
        <div class="badge-row">
          <span class="scope-badge">Land asset</span>
          <span class={`status-badge ${featureOpen ? 'open' : 'closed'}`}>
            {featureOpen ? 'Active registry' : 'Closed preview'}
          </span>
        </div>
        <h1>{asset.title}</h1>
        <p>{asset.locationLabel} · {asset.acreageLabel}</p>
      </div>
    </div>

    <p class="stewardship-note">{asset.stewardshipNote}</p>
  </div>

  {#each projectSections as section}
    <section class="section-stack">
      <div class="section-heading">
        <h2>{section.title}</h2>
        <p>{section.description}</p>
      </div>

      <div class="project-grid">
        {#each section.projects as project}
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
                {project.href ? 'Open project' : 'Project route not seeded yet'}
              </span>
            </div>
          </FeedSurface>
        {/each}
      </div>
    </section>
  {/each}
</section>

<style>
  .asset-detail-page,
  .hero-card,
  .section-stack,
  .section-heading,
  .project-grid,
  .project-card-shell {
    display: grid;
    gap: 14px;
  }

  .hero-card {
    padding: 18px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--brand-soft) 60%, transparent), transparent 48%),
      var(--panel);
  }

  .hero-header,
  .badge-row,
  .project-topline {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .project-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .back-link,
  .open-copy {
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-strong);
  }

  .scope-badge,
  .status-badge,
  .status-copy {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }

  .scope-badge,
  .status-copy {
    background: var(--panel-strong);
    color: var(--text-soft);
  }

  .status-badge.open {
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
  }

  .status-badge.closed {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
  }

  h1,
  h2,
  h3 {
    color: var(--text-main);
  }

  p,
  span {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.55;
  }

  .stewardship-note {
    padding: 14px;
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .relationship-copy {
    font-size: 12px;
    color: var(--text-main);
  }

  .muted-open-copy {
    color: var(--text-soft);
  }
</style>