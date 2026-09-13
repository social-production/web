<script lang="ts">
  import ProjectSoftwareGovernancePanel from '$lib/features/projects/detail/components/ProjectSoftwareGovernancePanel.svelte';
  import type {
    ProjectApprovalVote,
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
  export let recordPullRequestMerge: (
    requestId: string,
    mergeId: string,
    mergeUrl: string
  ) => void | Promise<void> = () => {};
  export let votePullRequest: (requestId: string, vote: ProjectApprovalVote | null) => void | Promise<void> =
    () => {};
  export let softwareWizardRequest: { mode: 'record-merge' | 'vote-pr'; requestId: string } | null = null;
  export let onSoftwareWizardRequestHandled: () => void = () => {};
</script>

<section class="phase-surface">
  {#if data.lifecycle.usesPlatformLifecycle && data.lifecycle.phaseFive.softwareGovernance}
    <ProjectSoftwareGovernancePanel
      governance={data.lifecycle.phaseFive.softwareGovernance}
      createPullRequest={createPullRequest}
      requestMergeCapabilityChange={requestMergeCapabilityChange}
      requestRepositoryReplacement={requestRepositoryReplacement}
      recordMerge={recordPullRequestMerge}
      {votePullRequest}
      {softwareWizardRequest}
      {onSoftwareWizardRequestHandled}
    />
  {/if}
</section>

<style>
  .phase-surface {
    display: grid;
    gap: 12px;
  }
</style>