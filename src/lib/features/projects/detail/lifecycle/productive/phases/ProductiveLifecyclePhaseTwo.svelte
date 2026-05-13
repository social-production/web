<script lang="ts">
  import { isCollectiveServiceProject, isPersonalServiceProject } from '$lib/features/projects/projectMode';
  import type { ProjectApprovalVote, ProjectPageData } from '$lib/types/detail';
  import ProjectLifecyclePlanPhaseContent from './ProjectLifecyclePlanPhaseContent.svelte';

  type DraftPlanPhase = {
    title: string;
    details: string;
    materialsLabel: string;
    costLabel: string;
  };

  type DraftPlanForm = {
    title: string;
    description: string;
    totalCostLabel: string;
    planPhases: DraftPlanPhase[];
    requestSystemEnabled?: boolean;
  };

  export let data: ProjectPageData;
  export let form: DraftPlanForm;
  export let showComposer = false;
  export let addPlanPhase: () => void = () => {};
  export let removePlanPhase: (index: number) => void = () => {};
  export let submitPlan: () => void | Promise<void> = () => {};
  export let isExpandedPlan: (planId: string) => boolean = () => false;
  export let valuevote: (planId: string, valueId: string, vote: ProjectApprovalVote | null) => void = () => {};
  export let overallvote: (planId: string, vote: ProjectApprovalVote | null) => void = () => {};

  $: submitLabel = isCollectiveServiceProject(data.projectMode)
    ? 'Submit operations plan'
    : 'Submit production plan';
</script>

{#if isPersonalServiceProject(data.projectMode)}
  <section class="phase-surface">
    <div class="empty-card">
      This phase closes the current personal service or converts it into a collective service or productive project when the work grows beyond one person.
    </div>
  </section>
{:else}
  <ProjectLifecyclePlanPhaseContent
    data={data}
    phaseId="phase-2"
    {form}
    bind:showComposer
    {submitLabel}
    {addPlanPhase}
    {removePlanPhase}
    {submitPlan}
    {isExpandedPlan}
    {valuevote}
    {overallvote}
  />
{/if}

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