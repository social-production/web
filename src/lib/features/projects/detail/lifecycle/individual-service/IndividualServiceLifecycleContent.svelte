<script lang="ts">
  import IndividualServicePhaseOne from './phases/IndividualServicePhaseOne.svelte';
  import IndividualServicePhaseTwo from './phases/IndividualServicePhaseTwo.svelte';
  import type {
    ProjectActivityRoleInput,
    ProjectServiceHistoryCompletionRole,
    ProjectApprovalVote,
    ProjectLifecyclePhaseId,
    ProjectPageData,
    ProjectServiceRequestSettingsChangeInput,
    ProjectServiceRequestStatus
  } from '$lib/types/detail';

  type DraftActivityForm = {
    title: string;
    scheduledAt: string;
    endsAt: string;
    locationLabel: string;
    roleRequirements: ProjectActivityRoleInput[];
    linkedPlanPhaseId: string | null;
    note: string;
  };

  type DraftServiceRequestForm = {
    title: string;
    body: string;
    scheduledAt: string;
    endsAt: string;
  };

  export let data: ProjectPageData;
  export let activePhaseId: ProjectLifecyclePhaseId;
  export let activityForm: DraftActivityForm;
  export let serviceRequestForm: DraftServiceRequestForm;
  export let showPersonalActivityComposer = false;
  export let showPersonalServiceRequestComposer = false;
  export let activityComposerElement: HTMLElement | null = null;
  export let serviceRequestComposerElement: HTMLElement | null = null;
  export let activityStartInputElement: HTMLInputElement | null = null;
  export let activityEndInputElement: HTMLInputElement | null = null;

  export let openPersonalActivityComposer: () => void | Promise<void> = () => {};
  export let openPersonalServiceRequestComposer: () => void | Promise<void> = () => {};
  export let openPersonalServiceRequestComposerForDay: (isoDay: string) => void | Promise<void> = () => {};
  export let submitActivity: () => void | Promise<void> = () => {};
  export let submitServiceRequest: () => void | Promise<void> = () => {};
  export let updateRequestStatus: (
    requestId: string,
    status: ProjectServiceRequestStatus
  ) => void | Promise<void> = () => {};
  export let requestServiceRequestSettingsChange: (
    input: ProjectServiceRequestSettingsChangeInput
  ) => void | Promise<void> = () => {};
  export let voteOnRequestSettingsChange: (
    requestId: string,
    vote: ProjectApprovalVote | null
  ) => void | Promise<void> = () => {};
  export let toggleHistoryCompletion: (
    historyId: string,
    role: ProjectServiceHistoryCompletionRole
  ) => void | Promise<void> = () => {};
</script>

{#if activePhaseId === 'phase-1'}
  <IndividualServicePhaseOne
    {data}
    bind:activityComposerElement
    bind:activityEndInputElement
    bind:activityStartInputElement
    bind:serviceRequestComposerElement
    bind:showPersonalActivityComposer
    bind:showPersonalServiceRequestComposer
    {activityForm}
    {openPersonalActivityComposer}
    {openPersonalServiceRequestComposer}
    {openPersonalServiceRequestComposerForDay}
    {serviceRequestForm}
    {submitActivity}
    {submitServiceRequest}
    {updateRequestStatus}
    {requestServiceRequestSettingsChange}
    {voteOnRequestSettingsChange}
    {toggleHistoryCompletion}
  />
{:else}
  <IndividualServicePhaseTwo projectMode={data.projectMode} />
{/if}
