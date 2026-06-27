<script lang="ts">
  import EventActivityPhase from './phases/EventActivityPhase.svelte';
  import EventClosedPhase from './phases/EventClosedPhase.svelte';
  import EventPlanPhase from './phases/EventPlanPhase.svelte';
  import EventProposalPhase from './phases/EventProposalPhase.svelte';
  import type {
    EventLifecyclePhaseId,
    EventPageData,
    EventPlan,
    GovernanceSignalSummary,
    ProjectApprovalVote,
    ProjectImportanceVoteValue
  } from '$lib/types/detail';
  import type { EventActivityForm, EventPlanForm } from './eventLifecycleShared';

  export let data: EventPageData;
  export let activePhaseId: EventLifecyclePhaseId;
  export let signalSummary: GovernanceSignalSummary | null = null;
  export let selectedPlan: EventPlan | null = null;
  export let importanceOptions: Array<{ value: ProjectImportanceVoteValue; label: string }> = [];
  export let draftValue = '';
  export let showValueComposer = false;
  export let showPlanComposer = false;
  export let showActivityComposer = false;
  export let selectedDayIso = '';
  export let highlightedActivityId: string | null = null;
  export let targetedPlanId: string | null = null;
  export let planForm: EventPlanForm = {
    title: '',
    description: '',
    demandConsiderationNote: '',
    scheduleMode: 'date',
    scheduledDate: '',
    rangeStartDate: '',
    rangeEndDate: '',
    startTimeLabel: '',
    finishTimeLabel: '',
    locationLabel: '',
    planPhases: [{ title: '', details: '' }]
  };
  export let activityForm: EventActivityForm = {
    title: '',
    scheduledAt: '',
    endsAt: '',
    locationLabel: '',
    roleRequirements: [{ label: '', requiredCount: 1 }],
    linkedPlanPhaseId: null,
    note: ''
  };
  export let minimumParticipants = 0;
  export let submitValue: () => void | Promise<void> = () => {};
  export let voteOnValue: (
    valueId: string,
    vote: ProjectImportanceVoteValue
  ) => void | Promise<void> = () => {};
  export let addPlanPhase: () => void = () => {};
  export let removePlanPhase: (index: number) => void = () => {};
  export let submitPlan: () => void | Promise<void> = () => {};
  export let voteOnPlanValue: (
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let voteOnPlanOverall: (
    planId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let openActivityComposerForDay: (isoDay?: string) => void = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let changeCommitment: (
    activityId: string,
    roleLabel: string | null
  ) => void | Promise<void> = () => {};
  export let activityComposerElement: HTMLDivElement | null = null;
</script>

{#if activePhaseId === 'proposal'}
  <EventProposalPhase
    {data}
    {signalSummary}
    {importanceOptions}
    bind:draftValue
    bind:showValueComposer
    {submitValue}
    {voteOnValue}
  />
{:else if activePhaseId === 'event-plan'}
  <EventPlanPhase
    {data}
    {signalSummary}
    bind:showPlanComposer
    bind:planForm
    {addPlanPhase}
    {removePlanPhase}
    {submitPlan}
    {targetedPlanId}
    {voteOnPlanValue}
    {voteOnPlanOverall}
  />
{:else if activePhaseId === 'activity'}
  <EventActivityPhase
    {data}
    {selectedPlan}
    bind:showActivityComposer
    bind:activityForm
    {minimumParticipants}
    bind:selectedDayIso
    bind:highlightedActivityId
    bind:activityComposerElement
    {openActivityComposerForDay}
    {submitActivity}
    changeCommitment={changeCommitment}
  />
{:else}
  <EventClosedPhase />
{/if}