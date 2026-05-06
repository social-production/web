<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import { supportsProjectDemandSignals } from '$lib/features/projects/projectMode';
  import { toggleProjectDemandSignal, toggleProjectMembership } from '$lib/services/queries/details';
  import type { ProjectPageData } from '$lib/types/detail';

  export let data: ProjectPageData;

  $: combinedTags = [...data.channelTags, ...data.communityTags];
  $: demandButtonLabel = `${data.signalCount}`;
  $: membershipButtonLabel = `${data.memberCount}`;

  async function handleDemandToggle() {
    await toggleProjectDemandSignal(data.slug);
    await invalidateAll();
  }

  async function handleMembershipToggle() {
    await toggleProjectMembership(data.slug);
    await invalidateAll();
  }
</script>

<div class="header-row">
  <div class="chips">
    <SubjectTablet kind="project" projectMode={data.projectMode} />
  </div>

  <div class="tag-stack">
    <TagList columns={4} tags={combinedTags} />
  </div>
</div>

<h1>{data.title}</h1>
<p class="overview-copy">{data.overview}</p>

<section class="meta-block" aria-label="Project overview details">
  <ul class="project-meta-list">
    {#if supportsProjectDemandSignals(data.projectMode)}
      <li class="meta-item demand-item">
        <strong>Demand</strong>
        <button
          aria-pressed={data.lifecycle.phaseOne.viewerHasDemandSignal}
          class:active-demand={data.lifecycle.phaseOne.viewerHasDemandSignal}
          class="demand-button"
          type="button"
          on:click={handleDemandToggle}
        >
          {demandButtonLabel}
        </button>
      </li>
    {/if}

    {#if data.lifecycle.supportsPlanning}
      <li class="meta-item">
        <strong>Threshold</strong>
        <span>{data.lifecycle.quorumThresholdPercent}% approval</span>
      </li>
    {:else if data.lifecycle.personalService}
      <li class="meta-item">
        <strong>Availability</strong>
        <span>{data.lifecycle.personalService.availabilitySummary}</span>
      </li>
    {/if}

    <li class="meta-item">
      <strong>Location</strong>
      <span>{data.locationLabel}</span>
    </li>

    {#if data.lifecycle.personalService?.travelRadiusLabel}
      <li class="meta-item">
        <strong>Travel Radius</strong>
        <span>{data.lifecycle.personalService.travelRadiusLabel}</span>
      </li>
    {/if}

    <li class="meta-item">
      <strong>Members</strong>
      {#if data.viewerCanToggleMembership}
        <button
          aria-pressed={data.viewerIsMember}
          class:active-demand={data.viewerIsMember}
          class="demand-button"
          type="button"
          on:click={handleMembershipToggle}
        >
          {membershipButtonLabel}
        </button>
      {:else}
        <span>{data.memberCount}</span>
      {/if}
    </li>
  </ul>
</section>

<style>
  .header-row,
  .chips {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-row {
    justify-content: space-between;
  }

  .tag-stack {
    display: grid;
    gap: 12px;
  }

  h1 {
    margin-top: 10px;
    font-size: 24px;
    letter-spacing: -0.02em;
  }

  strong {
    font-size: 14px;
    color: var(--text-main);
  }

  .overview-copy {
    margin: 8px 0 24px;
    max-width: 78ch;
    color: var(--text-soft);
    line-height: 1.55;
  }

  .meta-block {
    padding: 18px 0 20px;
    border-top: 1px solid var(--panel-border);
    border-bottom: 1px solid var(--panel-border);
  }

  .project-meta-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 14px;
  }

  .meta-item {
    display: grid;
    gap: 6px;
    color: var(--text-soft);
    font-size: 13px;
  }

  .meta-item span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .demand-button {
    justify-self: start;
    min-width: 84px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
  }

  .demand-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .demand-button.active-demand {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  @media (max-width: 760px) {
    .header-row {
      align-items: start;
    }
  }
</style>
