<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import EventCard from '$lib/components/cards/public-feed/EventCard.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import { createEvent } from '$lib/services/queries/create';
  import {
    channelOptions,
    communityOptions,
    followingUsernames,
    selectedTags
  } from '$lib/features/create/shared/options';
  import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
  import type { PublicEventItem } from '$lib/types/feed';

  let title = '';
  let description = '';
  let startTimeLabel = '';
  let finishTimeLabel = '';
  let locationLabel = '';
  let selectedChannelIds: string[] = [];
  let selectedCommunityIds: string[] = [];
  let invitedUsernames: string[] = [];
  let channelQuery = '';
  let communityQuery = '';
  let peopleQuery = '';
  let statusMessage = '';
  let isSubmitting = false;

  $: viewer = $page.data.bootstrap?.viewer ?? null;
  $: memberChannelSlugs = ($page.data.bootstrap?.directory.channels ?? []).map(
    (item: ScopeDirectoryItem) => item.slug
  );
  $: memberCommunitySlugs = ($page.data.bootstrap?.directory.communities ?? []).map(
    (item: ScopeDirectoryItem) => item.slug
  );
  $: channelSuggestionPool = channelOptions.filter(
    (option) => memberChannelSlugs.length === 0 || memberChannelSlugs.includes(option.slug)
  );
  $: communitySuggestionPool = communityOptions.filter(
    (option) => memberCommunitySlugs.length === 0 || memberCommunitySlugs.includes(option.slug)
  );
  $: peopleSuggestionPool = followingUsernames;
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
    selectedChannelIds.length === 0 && selectedCommunityIds.length === 0 && invitedUsernames.length > 0;
  $: isPrivate = !!privateCommunity || personalInviteOnly;
  $: timeLabel = [startTimeLabel.trim(), finishTimeLabel.trim()].filter(Boolean).join(' to ');
  $: normalizedChannelQuery = channelQuery.trim().toLowerCase();
  $: normalizedCommunityQuery = communityQuery.trim().toLowerCase();
  $: normalizedPeopleQuery = peopleQuery.trim().toLowerCase();
  $: channelSuggestions = channelSuggestionPool
    .filter((option) =>
      option.label.toLowerCase().includes(normalizedChannelQuery) ||
      option.slug.includes(normalizedChannelQuery)
    )
    .filter((option) => !selectedChannelIds.includes(option.slug))
    .slice(0, 6);
  $: communitySuggestions = communitySuggestionPool
    .filter((option) =>
      option.label.toLowerCase().includes(normalizedCommunityQuery) ||
      option.slug.includes(normalizedCommunityQuery)
    )
    .filter((option) => !selectedCommunityIds.includes(option.slug))
    .slice(0, 6);
  $: peopleSuggestions = peopleSuggestionPool
    .filter((username) => username.toLowerCase().includes(normalizedPeopleQuery))
    .filter((username) => !invitedUsernames.includes(username))
    .slice(0, 6);

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

  async function handleCreate() {
    isSubmitting = true;
    statusMessage = '';

    try {
      const result = await createEvent({
        title,
        description,
        startTimeLabel,
        finishTimeLabel,
        locationLabel,
        channelTags: selectedTags(selectedChannelIds, channelOptions, 'channel'),
        communityTags: selectedTags(selectedCommunityIds, communityOptions, 'community'),
        invitedUsernames
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The event could not be created.';
        return;
      }

      await invalidateAll();
      await goto(`/events/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the event flow is now modular and previewable.';
  }

  function addChannelTag(slug: string) {
    if (selectedChannelIds.includes(slug)) {
      return;
    }

    selectedChannelIds = [...selectedChannelIds, slug];
    channelQuery = '';
  }

  function removeChannelTag(slug: string) {
    selectedChannelIds = selectedChannelIds.filter((value) => value !== slug);
  }

  function addCommunityTag(slug: string) {
    if (selectedCommunityIds.includes(slug)) {
      return;
    }

    selectedCommunityIds = [...selectedCommunityIds, slug];
    communityQuery = '';
  }

  function removeCommunityTag(slug: string) {
    selectedCommunityIds = selectedCommunityIds.filter((value) => value !== slug);
  }

  function addPerson(username: string) {
    if (invitedUsernames.includes(username)) {
      return;
    }

    invitedUsernames = [...invitedUsernames, username];
    peopleQuery = '';
  }

  function removePerson(username: string) {
    invitedUsernames = invitedUsernames.filter((value) => value !== username);
  }

  function commitSingleSuggestion(
    event: KeyboardEvent,
    suggestions: string[],
    handler: (value: string) => void
  ) {
    if (event.key === 'Enter' && suggestions.length === 1) {
      event.preventDefault();
      handler(suggestions[0]);
    }
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
          <div class="token-input-stack">
            <div class="chip-row wrap-row">
              {#each selectedChannelIds as selectedSlug}
                {@const selectedOption = channelOptions.find((option) => option.slug === selectedSlug)}
                {#if selectedOption}
                  <button class="toggle-chip active" type="button" on:click={() => removeChannelTag(selectedSlug)}>
                    {selectedOption.label} x
                  </button>
                {/if}
              {/each}
            </div>
            <input
              bind:value={channelQuery}
              placeholder="Type to add a channel tag"
              on:keydown={(event) =>
                commitSingleSuggestion(
                  event,
                  channelSuggestions.map((item) => item.slug),
                  addChannelTag
                )}
            />
            {#if channelSuggestions.length > 0}
              <div class="suggestion-row">
                {#each channelSuggestions as option}
                  <button class="suggestion-chip" type="button" on:click={() => addChannelTag(option.slug)}>
                    {option.label}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div>
          <span class="field-label">Community tags</span>
          <div class="token-input-stack">
            <div class="chip-row wrap-row">
              {#each selectedCommunityIds as selectedSlug}
                {@const selectedOption = communityOptions.find((option) => option.slug === selectedSlug)}
                {#if selectedOption}
                  <button class="toggle-chip active" type="button" on:click={() => removeCommunityTag(selectedSlug)}>
                    {selectedOption.label}{selectedOption.visibility === 'private' ? ' (Private)' : ''} x
                  </button>
                {/if}
              {/each}
            </div>
            <input
              bind:value={communityQuery}
              placeholder="Type to add a community tag"
              on:keydown={(event) =>
                commitSingleSuggestion(
                  event,
                  communitySuggestions.map((item) => item.slug),
                  addCommunityTag
                )}
            />
            {#if communitySuggestions.length > 0}
              <div class="suggestion-row">
                {#each communitySuggestions as option}
                  <button class="suggestion-chip" type="button" on:click={() => addCommunityTag(option.slug)}>
                    {option.label}{option.visibility === 'private' ? ' (Private)' : ''}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div>
          <span class="field-label">Add personal people</span>
          <div class="token-input-stack">
            <div class="chip-row wrap-row">
              {#each invitedUsernames as username}
                <button class="toggle-chip active" type="button" on:click={() => removePerson(username)}>
                  {username} x
                </button>
              {/each}
            </div>
            <input
              bind:value={peopleQuery}
              placeholder="Type to add people"
              on:keydown={(event) => commitSingleSuggestion(event, peopleSuggestions, addPerson)}
            />
            {#if peopleSuggestions.length > 0}
              <div class="suggestion-row">
                {#each peopleSuggestions as username}
                  <button class="suggestion-chip" type="button" on:click={() => addPerson(username)}>
                    {username}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          <p class="helper-text">
            Personal invitees only make the event private when you do not also tag a channel or community.
          </p>
        </div>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
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

  .token-input-stack,
  .suggestion-row {
    display: grid;
    gap: 8px;
  }

  .suggestion-row {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .suggestion-chip {
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    text-align: left;
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