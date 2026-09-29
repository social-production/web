<script lang="ts">
  import PhaseWorkToolbar from '$lib/components/shared/PhaseWorkToolbar.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
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

  let softwareGovernancePanel: ProjectSoftwareGovernancePanel | null = null;
</script>

<section class="phase-surface">
  {#if data.lifecycle.usesPlatformLifecycle && data.lifecycle.phaseFive.softwareGovernance}
    {@const governance = data.lifecycle.phaseFive.softwareGovernance}
    <ProjectSoftwareGovernancePanel
      bind:this={softwareGovernancePanel}
      {governance}
      createPullRequest={createPullRequest}
      requestMergeCapabilityChange={requestMergeCapabilityChange}
      requestRepositoryReplacement={requestRepositoryReplacement}
      recordMerge={recordPullRequestMerge}
      {votePullRequest}
      {softwareWizardRequest}
      {onSoftwareWizardRequestHandled}
    />
    <PhaseWorkToolbar>
      <svelte:fragment slot="governance">
      {#if governance.viewerCanCreatePullRequests}
        <RoundPlusButton
          label="Pull request"
          ariaLabel="New pull request"
          participationAction="make-pull-request"
          action={() => softwareGovernancePanel?.openCreatePullRequest()}
        />
      {/if}
      {#if governance.viewerCanRequestRepositoryReplacement}
        <RoundPlusButton
          label="Replace repository"
          ariaLabel="Replace repository"
          participationAction="replace-repository"
          action={() => softwareGovernancePanel?.openSoftwareWizard('repository-replacement')}
        />
      {/if}
      {#if governance.viewerCanRequestMergeCapabilityChanges}
        <RoundPlusButton
          label="Merge capability"
          ariaLabel="Change merge capability"
          participationAction="change-merge-capability"
          action={() => softwareGovernancePanel?.openSoftwareWizard('merge-capability')}
        />
      {/if}
      </svelte:fragment>
    </PhaseWorkToolbar>
  {/if}
</section>

<style>
  .phase-surface {
    display: grid;
    gap: 12px;
  }
</style>