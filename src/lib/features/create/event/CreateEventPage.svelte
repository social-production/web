<script lang="ts">
  import { page } from '$app/stores';
  import EventCard from '$lib/components/cards/public-feed/EventCard.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import {
    channelOptions,
    communityOptions,
    followingUsernames,
    selectedTags,
    toggleSelection
  } from '$lib/features/create/shared/options';
  import type { PublicEventItem } from '$lib/types/feed';

  let title = 'Transit Fare Protest Rally';
  let description =
    'A one-off public rally with speakers, sign-making, and a short station march.';
  let startTimeLabel = 'Apr 12, 1:00 PM';
  let finishTimeLabel = 'Apr 12, 3:00 PM';
  let locationLabel = 'East Market Station Plaza';
  let selectedChannelIds = ['mutual-aid'];
  let selectedCommunityIds = ['east-market-makers'];
  let invitedUserIds: string[] = [];
  let statusMessage = '';

  $: viewer = $page.data.bootstrap?.viewer ?? null;
  $: selectedCommunityOptions = communityOptions.filter((option) =>
    selectedCommunityIds.includes(option.slug)
  );
  $: privateCommunity =
    selectedChannelIds.length === 0 &&
    selectedCommunityOptions.length === 1 &&
    selectedCommunityOptions[0]?.visibility === 'private'
      ? selectedCommunityOptions[0]
      : null;
  $: personalInviteOnly =
    selectedChannelIds.length === 0 && selectedCommunityIds.length === 0 && invitedUserIds.length > 0;
  $: isPrivate = !!privateCommunity || personalInviteOnly;
  $: timeLabel = [startTimeLabel.trim(), finishTimeLabel.trim()].filter(Boolean).join(' to ');

  $: previewItem = viewer
    ? ({
        kind: 'event',
        id: 'event-preview',
        slug: 'event-preview',
        href: '#',
        createdAt: new Date().toISOString(),
        title: title.trim() || 'Untitled event',
        description:
          description.trim() ||
          'Describe the one-off gathering, who it is for, and what should happen.',
        isPrivate,
        channelTags: selectedTags(selectedChannelIds, channelOptions, 'channel'),
        communityTags: selectedTags(selectedCommunityIds, communityOptions, 'community'),
        createdByUsername: viewer.username,
        timeLabel: timeLabel || 'Time not set',
        locationLabel: locationLabel.trim() || 'Location not set',
        voteCount: 0,
        activeVote: 0,
        commentCount: 0,
        goingCount: 1,
        lastActivityAt: new Date().toISOString()
      } satisfies PublicEventItem)
    : null;

  $: canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    startTimeLabel.trim().length > 0 &&
    finishTimeLabel.trim().length > 0 &&
    locationLabel.trim().length > 0;

  function handleCreate() {
    statusMessage =
      'Frontend preview only for now. Event persistence will be added once the mutable dev adapter arrives.';
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the event flow is now modular and previewable.';
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Event setup"
      description="Privacy is derived from the tags and invitees you choose. Events stay public unless they are only personal-invite or only inside one private community."
    >
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <div>
          <span class="field-label">Visibility</span>
          <p class="helper-text">
            {#if privateCommunity}
              Private because this event is tagged only to the private {privateCommunity.label} community.
            {:else if personalInviteOnly}
              Private because it only includes directly added people and no channel or community tags.
            {:else}
              Public because it is discoverable through its tags or has no private-only audience.
            {/if}
          </p>
        </div>

        <label>
          <span class="field-label">Event title</span>
          <input bind:value={title} />
        </label>

        <label>
          <span class="field-label">Start time</span>
          <input bind:value={startTimeLabel} />
        </label>

        <label>
          <span class="field-label">Finish time</span>
          <input bind:value={finishTimeLabel} />
        </label>

        <label>
          <span class="field-label">Location</span>
          <input bind:value={locationLabel} />
        </label>

        <label>
          <span class="field-label">Description</span>
          <textarea bind:value={description} rows="4"></textarea>
        </label>

        <div>
          <span class="field-label">Channel tags</span>
          <div class="chip-row wrap-row">
            {#each channelOptions as option}
              <button
                type="button"
                class:active={selectedChannelIds.includes(option.slug)}
                class="toggle-chip"
                on:click={() => (selectedChannelIds = toggleSelection(selectedChannelIds, option.slug))}
              >
                {option.label}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <span class="field-label">Community tags</span>
          <div class="chip-row wrap-row">
            {#each communityOptions as option}
              <button
                type="button"
                class:active={selectedCommunityIds.includes(option.slug)}
                class="toggle-chip"
                on:click={() =>
                  (selectedCommunityIds = toggleSelection(selectedCommunityIds, option.slug))}
              >
                {option.label}{option.visibility === 'private' ? ' (Private)' : ''}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <span class="field-label">Add personal people</span>
          <div class="chip-row wrap-row">
            {#each followingUsernames as username}
              <button
                type="button"
                class:active={invitedUserIds.includes(username)}
                class="toggle-chip"
                on:click={() => (invitedUserIds = toggleSelection(invitedUserIds, username))}
              >
                {username}
              </button>
            {/each}
          </div>
          <p class="helper-text">
            Personal invitees only make the event private when you do not also tag a channel or community.
          </p>
        </div>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit} type="submit">Create Event</button>
          <button class="button-ghost" type="button" on:click={handleDraft}>Save Draft</button>
        </div>

        {#if statusMessage}
          <p class="status-note">{statusMessage}</p>
        {/if}
      </form>
    </CreatePanel>
  </svelte:fragment>

  <svelte:fragment slot="secondary">
    <CreatePanel
      title="Live preview"
      description="Shows how the event will appear in feeds and search."
      surface="transparent"
    >
      {#if previewItem}
        <EventCard item={previewItem} />
      {/if}
    </CreatePanel>

    <CreatePanel title="Visibility rule" description="How discovery works in this frontend slice.">
      <p class="helper-text">
        {#if privateCommunity}
          Private events can live inside a single private community without leaking into Public.
        {:else if personalInviteOnly}
          Private personal events stay invite-only when they are only tied to directly added people.
        {:else}
          Public events can be untagged or tagged. Channels, public communities, and mixed tagging keep them discoverable in Public.
        {/if}
      </p>
    </CreatePanel>
  </svelte:fragment>
</CreateFlowLayout>

<style>
  .form-stack {
    display: grid;
    gap: 12px;
  }

  .field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 700;
  }

  .chip-row {
    display: flex;
    gap: 8px;
  }

  .wrap-row {
    flex-wrap: wrap;
  }

  .helper-text {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>