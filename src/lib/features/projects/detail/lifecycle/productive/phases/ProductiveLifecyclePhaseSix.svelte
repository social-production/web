<script lang="ts">
  import { isCollectiveServiceProject, isPersonalServiceProject } from '$lib/features/projects/projectMode';
  import ProjectSoftwareGovernancePanel from '$lib/features/projects/detail/components/ProjectSoftwareGovernancePanel.svelte';
  import type {
    ProjectPageData,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwarePullRequestInput,
    ProjectSoftwareRepositoryReplacementInput
  } from '$lib/types/detail';

  export let data: ProjectPageData;
  export let createPullRequest: (input: ProjectSoftwarePullRequestInput) => void | Promise<void> = () => {};
  export let requestMergeCapabilityChange: (
    input: ProjectSoftwareMergeCapabilityChangeInput
  ) => void | Promise<void> = () => {};
  export let requestRepositoryReplacement: (
    input: ProjectSoftwareRepositoryReplacementInput
  ) => void | Promise<void> = () => {};
  export let recordPullRequestMerge: (requestId: string, mergeId: string) => void | Promise<void> = () => {};

  function completionCopy() {
    if (data.linksFrame.conversionLineage) {
      return 'This project is already framed as a governed conversion. Keep the permanent predecessor/successor link and inherited inventory note visible in Links while the follow-on service history takes over.';
    }

    if (isPersonalServiceProject(data.projectMode)) {
      return 'This phase records the service as closed, while still leaving room to point people toward a future collective service or productive project if the work grows beyond one person.';
    }

    if (isCollectiveServiceProject(data.projectMode)) {
      return 'This phase closes the service while keeping its history visible. If related work continues later, it should either move back into planning or link to a new project.';
    }

    return 'This phase records the project as closed or converted into an ongoing service. The history above stays visible either way.';
  }
</script>

<section class="phase-surface">
  {#if data.lifecycle.usesPlatformLifecycle && data.lifecycle.phaseFive.softwareGovernance}
    <ProjectSoftwareGovernancePanel
      governance={data.lifecycle.phaseFive.softwareGovernance}
      createPullRequest={createPullRequest}
      requestMergeCapabilityChange={requestMergeCapabilityChange}
      requestRepositoryReplacement={requestRepositoryReplacement}
      recordMerge={recordPullRequestMerge}
    />
  {/if}

  <div class="empty-card">{completionCopy()}</div>
</section>

<style>
  .phase-surface,
  .empty-card {
    display: grid;
    gap: 12px;
  }

  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    line-height: 1.5;
  }
</style>