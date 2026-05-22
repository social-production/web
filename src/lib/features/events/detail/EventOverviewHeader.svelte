<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import Tablet from '$lib/components/cards/shared/Tablet.svelte';
  import {
    setEventSignal,
    shareEventWithUser,
    toggleEventGoing
  } from '$lib/services/queries/details';
  import type { EventPageData } from '$lib/types/detail';

  export let data: EventPageData;

  $: combinedTags = [...data.channelTags, ...data.communityTags];
  $: signalSummary = data.lifecycle.phaseOne.signalSummary;
  $: membershipButtonLabel = `${data.viewerIsGoing ? 'Joined' : 'Join'} · ${data.memberCount}`;
  $: timeLabel = data.timeLabel.trim();
  $: locationLabel = data.locationLabel.trim();
  $: showScheduledMeta = !!timeLabel || !!locationLabel;
  $: proposalMetaCopy = data.isPrivate
    ? 'This private event stays proposal-first until an approved plan sets the live schedule and location.'
    : 'This event stays proposal-first until an approved plan sets the live schedule and location.';
  $: quorumLabel =
    data.lifecycle.quorumVotesRequired <= 0
      ? 'No votes required yet'
      : `${data.lifecycle.quorumVotesRequired} ${data.lifecycle.quorumVotesRequired === 1 ? 'vote' : 'votes'} required from ${data.lifecycle.voteContextPopulation} ${data.lifecycle.voteContextLabel}`;

  async function handleSignalSet(signal: 'demand' | 'opposition') {
    await setEventSignal(data.slug, signal);
    await invalidateAll();
  }

  async function handleMembershipToggle() {
    await toggleEventGoing(data.id);
    await invalidateAll();
  }

  async function handleEventShare(username: string) {
    const result = await shareEventWithUser(data.slug, username);

    if (result.ok) {
      await invalidateAll();
    }

    return result;
  }

  async function handleCreatePostFromEvent() {
    const mention = `[${data.title}]`;
    const params = new URLSearchParams({
      prefill: `Sharing context from ${mention}`
    });
    await goto(`/create/post?${params.toString()}`);
  }
</script>

<div class="header-row">
  <div class="chips">
    <SubjectTablet kind="event" />
    <Tablet label={data.isPrivate ? 'Private' : 'Public'} variant="visibility" />
  </div>

  <div class="header-actions">
    <TagList tags={combinedTags} />
    <ReportControl
      itemLabel="event"
      report={data.report}
      ownerUsername={data.createdByUsername}
      subjectId={data.id}
      targetId={data.id}
    />
  </div>
</div>

<h1>{data.title}</h1>
<p class="overview-copy">{data.description}</p>

<section class="meta-block" aria-label="Event overview details">
  <ul class="event-meta-list">
    {#if signalSummary}
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
              Demand {signalSummary.demandCount}
            </button>
            <button
              aria-pressed={data.lifecycle.phaseOne.viewerHasOppositionSignal}
              class:active-opposition={data.lifecycle.phaseOne.viewerHasOppositionSignal}
              class="demand-button opposition-button"
              type="button"
              on:click={() => handleSignalSet('opposition')}
            >
              Opposition {signalSummary.oppositionCount}
            </button>
          </div>
          <span>
            Demand is {signalSummary.signalRatioPercent}% of current proposal signals.
            {#if signalSummary.usesPlatformVoteContext}
              Proposal advancement also needs {signalSummary.requiredDemandCount} demand signals from {signalSummary.voteContextPopulation} weekly active users.
            {:else}
              Proposal advancement opens once demand stays above 66% of active signals.
            {/if}
          </span>
        </div>
      </li>
    {/if}

    <li class="meta-item">
      <strong>Quorum</strong>
      <span>{quorumLabel}</span>
    </li>

    {#if timeLabel}
      <li class="meta-item">
        <strong>Time</strong>
        <span>{timeLabel}</span>
      </li>
    {/if}
    {#if locationLabel}
      <li class="meta-item">
        <strong>Location</strong>
        <span>{locationLabel}</span>
      </li>
    {/if}
    {#if !showScheduledMeta}
      <li class="meta-item">
        <strong>Proposal</strong>
        <span>{proposalMetaCopy}</span>
      </li>
    {/if}
    <li class="meta-item">
      <strong>Members</strong>
      <div class="meta-button-row">
        {#if data.viewerCanToggleGoing}
          <button
            aria-pressed={data.viewerIsGoing}
            class:active-demand={data.viewerIsGoing}
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
            buttonLabel={data.isPrivate ? 'Invite +' : 'Share +'}
            contacts={data.shareContacts}
            menuTitle={data.isPrivate ? 'Invite to event' : 'Share event'}
            placeholder="Type a username"
            submitLabel={data.isPrivate ? 'Invite' : 'Share'}
            submitShare={handleEventShare}
            createPost={handleCreatePostFromEvent}
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
    color: var(--text-main);
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
  }

  .demand-button.active-demand {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .meta-block {
    padding: 18px 0 20px;
    border-top: 1px solid var(--panel-border);
    border-bottom: 1px solid var(--panel-border);
  }

  .event-meta-list {
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

  .demand-button:hover {
    border-color: var(--brand);
    background: var(--brand-soft);
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