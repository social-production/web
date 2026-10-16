<script lang="ts">
  import type { DetailLinksFrameData } from '$lib/types/detail';
  import DetailLinksSection from './DetailLinksSection.svelte';
  import DetailLinkRequestsSection from './DetailLinkRequestsSection.svelte';
  import DetailLinkVoteHistorySection from './DetailLinkVoteHistorySection.svelte';
  import ProjectConversionLineageSection from '$lib/features/projects/detail/components/ProjectConversionLineageSection.svelte';
  import ProjectConversionWorkflowSection from '$lib/features/projects/detail/components/ProjectConversionWorkflowSection.svelte';

  export let frame: DetailLinksFrameData;
  export let highlightedRequestId: string | null = null;
  /** Outside links such as the repository and the venue map. */
  export let externalLinks: Array<{ label: string; href: string; detail: string }> = [];

  // Conversion links are shown in the conversion lineage section; keep them out of
  // the generic Active/Historical lists so the same record does not render twice.
  $: activeLinks = frame.activeLinks.filter((item) => item.linkKind !== 'conversion');
  $: historicalLinks = frame.historicalLinks.filter((item) => item.linkKind !== 'conversion');
</script>

<section class="links-tab">
  <header class="intro">
    <h1>Links</h1>
    <p>{frame.intro}</p>
    {#if frame.conversionNote}
      <p>{frame.conversionNote}</p>
    {/if}
  </header>

  {#if externalLinks.length > 0}
    <section class="external-links">
      {#each externalLinks as link (link.href)}
        <a class="external-link" href={link.href} target="_blank" rel="noopener noreferrer">
          <strong>{link.label}</strong>
          <span>{link.detail}</span>
        </a>
      {/each}
    </section>
  {/if}

  {#if frame.conversionLineage}
    <ProjectConversionLineageSection lineage={frame.conversionLineage} />
  {/if}

  {#if frame.conversionWorkflow.length > 0}
    <ProjectConversionWorkflowSection items={frame.conversionWorkflow} />
  {/if}

  <DetailLinksSection
    title="Active links"
    description="Approved connections to related projects and events. Active links stay voteable so members can sever them."
    items={activeLinks}
    emptyMessage="No active links yet."
    ownerKind={frame.ownerKind}
    ownerSlug={frame.ownerSlug}
    allowSever={frame.viewerCanProposeLinks}
    {highlightedRequestId}
  />

  <DetailLinkRequestsSection
    ownerKind={frame.ownerKind}
    ownerSlug={frame.ownerSlug}
    requests={frame.pendingLinkRequests}
    viewerCanProposeLinks={frame.viewerCanProposeLinks}
    {highlightedRequestId}
  />

  <DetailLinksSection
    title="Historical links"
    description="Inactive or past links stay visible for lineage."
    items={historicalLinks}
    emptyMessage="No historical links yet."
    ownerKind={frame.ownerKind}
    ownerSlug={frame.ownerSlug}
    allowSever={false}
  />

  <DetailLinkVoteHistorySection requests={frame.historicalLinkRequests} />
</section>

<style>
  .links-tab,
  .intro {
    display: grid;
    gap: 18px;
  }

  .intro {
    gap: 6px;
    padding: 0 2px 4px;
  }

  h1,
  p {
    margin: 0;
  }

  h1 {
    font-size: 20px;
  }

  p {
    color: var(--text-soft);
    line-height: 1.55;
  }

  .external-links {
    display: grid;
    gap: 8px;
  }

  .external-link {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    text-decoration: none;
  }

  .external-link span {
    color: var(--brand-strong);
    font-size: 13px;
    overflow-wrap: anywhere;
  }
</style>
