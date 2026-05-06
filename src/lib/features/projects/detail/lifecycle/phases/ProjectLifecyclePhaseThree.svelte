<script lang="ts">
  import { isCollectiveServiceProject } from '$lib/features/projects/projectMode';
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
    ? 'Submit access plan'
    : 'Submit distribution plan';
</script>

<ProjectLifecyclePlanPhaseContent
  data={data}
  phaseId="phase-3"
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