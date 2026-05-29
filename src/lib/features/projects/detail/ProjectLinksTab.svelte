<script lang="ts">
  import ProjectManualLinkRequestsSection from './components/ProjectManualLinkRequestsSection.svelte';
  import ProjectLinksNetwork from './components/ProjectLinksNetwork.svelte';
  import type { ProjectLinksFrameData } from '$lib/types/detail';

  export let frame: ProjectLinksFrameData;
</script>

<section class="links-tab">
  <div class="intro-card">
    <h1>Links</h1>
    <p>{frame.intro}</p>
  </div>

  <ProjectLinksNetwork
    title="Auto-created links"
    description="These links come from adapter-backed automation such as approved asset-use relationships, deliveries, and later conversion events."
    items={frame.autoLinks}
    emptyMessage="No auto-created links are available yet."
  />

  <ProjectLinksNetwork
    title="Manual links"
    description="These links already passed approval on both linked projects."
    items={frame.manualLinks}
    emptyMessage="No manual links are available yet."
  />

  <ProjectManualLinkRequestsSection
    projectSlug={frame.projectSlug}
    requests={frame.manualLinkRequests}
    linkableProjects={frame.linkableProjects}
    viewerCanProposeLinks={frame.viewerCanProposeLinks}
  />
</section>

<style>
  .links-tab,
  .intro-card {
    display: grid;
    gap: 12px;
  }

  .intro-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  h1 {
    margin: 0;
    color: var(--text-main);
    font-size: 20px;
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }
</style>