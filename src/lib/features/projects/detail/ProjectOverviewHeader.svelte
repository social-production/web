<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import { isPersonalServiceProject, supportsProjectDemandSignals } from '$lib/features/projects/projectMode';
  import {
    setProjectSignal,
    shareProjectWithUser,
    toggleProjectMembership
  } from '$lib/services/queries/details';
  import type { ProjectPageData } from '$lib/types/detail';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { requireViewer } from '$lib/utils/requireViewer';

  export let data: ProjectPageData;

  $: combinedTags = [...data.channelTags, ...data.communityTags];
  $: signalSummary = data.lifecycle.phaseOne?.signalSummary ?? null;
  $: implementedLocation = isImplementedScheduleLabel(data.locationLabel) ? data.locationLabel.trim() : '';
  $: showProposalLocationCopy =
    supportsProjectDemandSignals(data.projectMode) &&
    data.lifecycle.currentPhaseId === 'phase-1' &&
    !implementedLocation;
  $: membershipMetaLabel = 'Members';
  $: membershipButtonLabel = isPersonalServiceProject(data.projectMode)
    ? `${data.viewerIsMember ? 'Joined' : 'Join'} · ${data.memberCount}`
    : `${data.memberCount}`;
  $: quorumLabel =
    data.lifecycle.quorumVotesRequired <= 0
      ? 'No votes required yet'
      : `${data.lifecycle.quorumVotesRequired} ${data.lifecycle.quorumVotesRequired === 1 ? 'vote' : 'votes'} required from ${data.lifecycle.voteContextPopulation} ${data.lifecycle.voteContextLabel}`;

  async function handleSignalSet(signal: 'demand' | 'opposition') {
    if (!requireViewer($page.data.bootstrap?.viewer)) {
      return;
    }

    await setProjectSignal(data.slug, signal);
    await invalidateAll();
  }

  async function handleMembershipToggle() {
    if (!requireViewer($page.data.bootstrap?.viewer)) {
      return;
    }

    await toggleProjectMembership(data.slug);
    await invalidateAll();
  }

  async function handleProjectShare(username: string) {
    const result = await shareProjectWithUser(data.slug, username);

    if (result.ok) {
      await invalidateAll();
    }

    return result;
  }

  async function handleCreatePostFromProject() {
    const mention = `[${data.title}]`;
    const params = new URLSearchParams({
      prefill: `Sharing context from ${mention}`
    });
    await goto(`/create/post?${params.toString()}`);
  }
</script>

<div class="header-row">
  <div class="chips">
    <SubjectTablet kind="project" projectMode={data.projectMode} />
  </div>

  <div class="header-actions">
    <TagList tags={combinedTags} />
    <ReportControl
      itemLabel="project"
      report={data.report}
      ownerUsername={data.authorUsername}
      subjectId={data.id}
      targetId={data.id}
    />
  </div>
</div>

<h1>{data.title}</h1>
<p class="overview-copy">{data.description}</p>

<section class="meta-block" aria-label="Project overview details">
  <ul class="project-meta-list">
    {#if supportsProjectDemandSignals(data.projectMode)}
      <li class="meta-item demand-item">
        <strong>Signals</strong>
        <div class="signal-stack">
          <div class="meta-button-row">
            <button
              aria-pressed={data.lifecycle.phaseOne.viewerHasDemandSignal}
              class:active-demand={data.lifecycle.phaseOne.viewerHasDemandSignal}
              class="demand-button"
              type="button"
              on:click={() => handleSignalSet('demand')}
            >
              Demand {signalSummary?.demandCount ?? data.signalCount}
            </button>
            <button
              aria-pressed={data.lifecycle.phaseOne.viewerHasOppositionSignal}
              class:active-opposition={data.lifecycle.phaseOne.viewerHasOppositionSignal}
              class="demand-button opposition-button"
              type="button"
              on:click={() => handleSignalSet('opposition')}
            >
              Opposition {signalSummary?.oppositionCount ?? 0}
            </button>
          </div>
          {#if signalSummary}
            <span>
              Demand is {signalSummary.signalRatioPercent}% of current proposal signals.
              {#if signalSummary.usesPlatformVoteContext}
                Proposal advancement also needs {signalSummary.requiredDemandCount} demand signals from {signalSummary.voteContextPopulation} weekly active users.
              {:else}
                Proposal advancement opens once demand stays above 66% of active signals.
              {/if}
            </span>
          {/if}
        </div>
      </li>
    {/if}

    {#if data.lifecycle.supportsPlanning}
      <li class="meta-item">
        <strong>Quorum</strong>
        <span>{quorumLabel}</span>
      </li>
    {/if}

    {#if data.lifecycle.currentSubtypeLabel}
      <li class="meta-item">
        <strong>Subtype</strong>
        <span>{data.lifecycle.currentSubtypeLabel}</span>
      </li>
    {/if}

    {#if implementedLocation}
      <li class="meta-item">
        <strong>Location</strong>
        <span>{implementedLocation}</span>
      </li>
    {:else if showProposalLocationCopy}
      <li class="meta-item">
        <strong>Proposal</strong>
        <span>This project stays proposal-first until an approved plan sets the live location.</span>
      </li>
    {/if}

    {#if data.lifecycle.personalService?.travelRadiusLabel}
      <li class="meta-item">
        <strong>Travel Radius</strong>
        <span>{data.lifecycle.personalService.travelRadiusLabel}</span>
      </li>
    {/if}

    <li class="meta-item">
      <strong>{membershipMetaLabel}</strong>
      <div class="meta-button-row">
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

        {#if data.viewerCanShare}
          <ShareUserMenu
            buttonLabel="Share +"
            contacts={data.shareContacts}
            menuTitle="Share project"
            placeholder="Type a username"
            submitLabel="Share"
            submitShare={handleProjectShare}
            createPost={handleCreatePostFromProject}
            createPostLabel="Create post"
          />
        {/if}
      </div>
    </li>
  </ul>
</section>

<style>
  .header-row,
  .chips,
  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-row {
    justify-content: space-between;
    align-items: flex-start;
  }

  .chips {
    min-width: 0;
    flex: 1 1 auto;
  }

  .header-actions {
    flex: 0 1 auto;
    margin-left: auto;
    justify-content: flex-end;
  }

  .header-actions :global(.tag-list) {
    justify-content: flex-end;
  }

  :global(.report-control) {
    flex: 0 0 auto;
  }

  h1 {
    margin-top: 10px;
    font-size: 24px;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
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
    overflow-wrap: anywhere;
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

  .signal-stack {
    display: grid;
    gap: 8px;
  }

  .meta-button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
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

  .opposition-button.active-opposition {
    border-color: var(--tablet-community-bg);
    color: var(--tablet-community-text);
  }

  @media (max-width: 760px) {
    .header-row {
      align-items: start;
    }
  }
</style>
