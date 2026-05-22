<script lang="ts">
  import ProjectAcquisitionPreview from '$lib/features/projects/detail/components/ProjectAcquisitionPreview.svelte';
  import type { ProjectAcquisitionExecutionInput, ProjectApprovalVote, ProjectPhaseFourData } from '$lib/types/detail';

  export let phaseFour: ProjectPhaseFourData | null = null;
  export let recordExecution: (input: ProjectAcquisitionExecutionInput) => boolean | Promise<boolean> = async () => false;
  export let setConfirmationVote: (vote: ProjectApprovalVote | null) => void | Promise<void> = () => {};
</script>

<section class="phase-surface">
  {#if phaseFour}
    <ProjectAcquisitionPreview preview={phaseFour} submitExecution={recordExecution} {setConfirmationVote} />
  {:else}
    <div class="empty-card locked-card">
      Acquisition is not active for this project yet.
    </div>
  {/if}
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
    line-height: 1.5;
  }

  .empty-card {
    background: var(--panel);
    color: var(--text-soft);
  }

  .locked-card {
    border-color: var(--tablet-community-bg);
    color: var(--tablet-community-text);
    background: color-mix(in srgb, var(--tablet-community-bg) 14%, var(--panel));
  }
</style>