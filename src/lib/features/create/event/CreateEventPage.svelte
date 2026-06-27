<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import EventCard from '$lib/components/cards/public-feed/EventCard.svelte';
  import DirectUsePolicyNotice from '$lib/components/shared/DirectUsePolicyNotice.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import CreateScopeTagSelector from '$lib/features/create/shared/CreateScopeTagSelector.svelte';
  import { commitSingleSuggestion, mergeScopeOptions } from '$lib/features/create/shared/createFormActions';
  import { loadTaggableScopeOptions } from '$lib/features/create/shared/taggableScopes';
  import CreateEventVisibilityPanel from '$lib/features/create/event/components/CreateEventVisibilityPanel.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import { createEvent } from '$lib/services/queries/create';
  import type { ScopeDirectoryItem, ViewerSummary } from '$lib/types/bootstrap';
  import type { PublicEventItem, TagKind, TagRef } from '$lib/types/feed';

  type AudienceScopeItem = ScopeDirectoryItem & {
    visibility?: 'public' | 'private';
  };

  let title = '';
  let description = '';
  let selectedChannelIds: string[] = [];
  let selectedCommunityIds: string[] = [];
  let invitedUsernames: string[] = [];
  let channelQuery = '';
  let communityQuery = '';
  let peopleQuery = '';
  let statusMessage = '';
  let isSubmitting = false;
  let channelSuggestionPool: AudienceScopeItem[] = [];
  let communitySuggestionPool: AudienceScopeItem[] = [];
  let selectedChannelOptions: AudienceScopeItem[] = [];
  let selectedCommunityOptionsCache: AudienceScopeItem[] = [];
  let taggableLookupKey = '';
  let taggableRequestId = 0;

  function selectedScopeTags(
    selectedSlugs: string[],
    options: AudienceScopeItem[],
    kind: TagKind
  ): TagRef[] {
    return selectedSlugs
      .map((slug) => options.find((option) => option.slug === slug))
      .filter((option): option is AudienceScopeItem => !!option)
      .map((option) => ({ slug: option.slug, label: option.label, kind }));
  }

  function matchesQuery(option: Pick<AudienceScopeItem, 'slug' | 'label'>, normalizedQuery: string) {
    return (
      option.label.toLowerCase().includes(normalizedQuery) ||
      option.slug.toLowerCase().includes(normalizedQuery)
    );
  }

  $: viewer = $page.data.bootstrap?.viewer ?? null;
  $: updateTaggableScopes(channelQuery, communityQuery);
  $: allChannelOptions = mergeScopeOptions(channelSuggestionPool, selectedChannelOptions);
  $: allCommunityOptions = mergeScopeOptions(communitySuggestionPool, selectedCommunityOptionsCache);
  $: peopleSuggestionPool = ($page.data.bootstrap?.suggestedContacts ?? []) as ViewerSummary[];
  $: selectedCommunityOptions = allCommunityOptions.filter((option) =>
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
  $: publicEventNeedsChannelTag = !isPrivate && selectedChannelIds.length === 0;
  $: normalizedChannelQuery = channelQuery.trim().toLowerCase();
  $: normalizedCommunityQuery = communityQuery.trim().toLowerCase();
  $: normalizedPeopleQuery = peopleQuery.trim().toLowerCase();
  $: channelSuggestions = normalizedChannelQuery
    ? channelSuggestionPool
        .filter((option) => matchesQuery(option, normalizedChannelQuery))
        .filter((option) => !selectedChannelIds.includes(option.slug))
        .slice(0, 6)
    : [];
  $: communitySuggestions = normalizedCommunityQuery
    ? communitySuggestionPool
        .filter((option) => matchesQuery(option, normalizedCommunityQuery))
        .filter((option) => !selectedCommunityIds.includes(option.slug))
        .slice(0, 6)
    : [];
  $: peopleSuggestions = normalizedPeopleQuery
    ? peopleSuggestionPool
        .filter((contact: ViewerSummary) =>
          contact.username.toLowerCase().includes(normalizedPeopleQuery)
        )
        .filter((contact: ViewerSummary) => !invitedUsernames.includes(contact.username))
        .slice(0, 6)
    : [];
  $: selectedChannelItems = selectedChannelIds
    .map((slug) => allChannelOptions.find((option) => option.slug === slug))
    .filter((option): option is AudienceScopeItem => !!option)
    .map((option) => ({ key: option.slug, label: option.label }));
  $: selectedCommunityItems = selectedCommunityIds
    .map((slug) => allCommunityOptions.find((option) => option.slug === slug))
    .filter((option): option is AudienceScopeItem => !!option)
    .map((option) => ({
      key: option.slug,
      label: `${option.label}${option.visibility === 'private' ? ' (Private)' : ''}`
    }));
  $: selectedInviteeItems = invitedUsernames.map((username) => ({ key: username, label: username }));
  $: channelSuggestionItems = channelSuggestions.map((option) => ({
    key: option.slug,
    label: option.label
  }));
  $: communitySuggestionItems = communitySuggestions.map((option) => ({
    key: option.slug,
    label: `${option.label}${option.visibility === 'private' ? ' (Private)' : ''}`
  }));
  $: peopleSuggestionItems = peopleSuggestions.map((contact: ViewerSummary) => ({
    key: contact.username,
    label: contact.username
  }));

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
          'Describe the proposal, who it is for, and what an approved event plan should turn into.',
        isPrivate,
        stage: 'Proposal',
        channelTags: selectedScopeTags(selectedChannelIds, allChannelOptions, 'channel'),
        communityTags: selectedScopeTags(selectedCommunityIds, allCommunityOptions, 'community'),
        createdByUsername: viewer.username,
        timeLabel: '',
        locationLabel: '',
        voteCount: 0,
        activeVote: 0,
        commentCount: 0,
        memberCount: 1,
        lastActivityAt: new Date().toISOString()
      } satisfies PublicEventItem)
    : null;

  $: canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !publicEventNeedsChannelTag;

  async function handleCreate() {
    isSubmitting = true;
    statusMessage = '';

    try {
      const result = await createEvent({
        title,
        description,
        isPrivate,
        channelTags: selectedScopeTags(selectedChannelIds, allChannelOptions, 'channel'),
        communityTags: selectedScopeTags(selectedCommunityIds, allCommunityOptions, 'community'),
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

    const option = channelSuggestionPool.find((item) => item.slug === slug);
    if (option) {
      selectedChannelOptions = mergeScopeOptions(selectedChannelOptions, [option]);
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

    const option = communitySuggestionPool.find((item) => item.slug === slug);
    if (option) {
      selectedCommunityOptionsCache = mergeScopeOptions(selectedCommunityOptionsCache, [option]);
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

  async function updateTaggableScopes(channelText: string, communityText: string) {
    const normalizedChannelQuery = channelText.trim();
    const normalizedCommunityQuery = communityText.trim();
    const lookupKey = `${normalizedChannelQuery}|${normalizedCommunityQuery}`;

    if (lookupKey === taggableLookupKey) {
      return;
    }

    taggableLookupKey = lookupKey;
    const requestId = ++taggableRequestId;

    try {
      const results = await loadTaggableScopeOptions(normalizedChannelQuery, normalizedCommunityQuery);

      if (requestId !== taggableRequestId) {
        return;
      }

      channelSuggestionPool = results.channels;
      communitySuggestionPool = results.communities;
    } catch {
      if (requestId === taggableRequestId) {
        channelSuggestionPool = [];
        communitySuggestionPool = [];
      }
    }
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Event proposal"
      description="Privacy is derived from the tags and invitees you choose. The event starts as a proposal; time, date, and location are added by the approved event plan before activity begins."
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
          <RequiredFieldLabel>Event title</RequiredFieldLabel>
          <input bind:value={title} aria-required="true" />
        </label>

        <label>
          <RequiredFieldLabel>Proposal description</RequiredFieldLabel>
          <textarea bind:value={description} rows="4" aria-required="true"></textarea>
        </label>

        <DirectUsePolicyNotice variant="create" context="event" />

        <CreateScopeTagSelector
          label="Channel tags"
          bind:query={channelQuery}
          placeholder="Type to add a channel tag"
          selectedItems={selectedChannelItems}
          suggestionItems={channelSuggestionItems}
          onAdd={addChannelTag}
          onRemove={removeChannelTag}
          onCommitSingleSuggestion={commitSingleSuggestion}
        />

        <CreateScopeTagSelector
          label="Community tags"
          bind:query={communityQuery}
          placeholder="Type to add a community tag"
          selectedItems={selectedCommunityItems}
          suggestionItems={communitySuggestionItems}
          onAdd={addCommunityTag}
          onRemove={removeCommunityTag}
          onCommitSingleSuggestion={commitSingleSuggestion}
        />

        <CreateScopeTagSelector
          label="Add personal people"
          bind:query={peopleQuery}
          placeholder="Type to add people"
          helperText="Personal invitees only make the event private when you do not also tag a channel or community."
          selectedItems={selectedInviteeItems}
          suggestionItems={peopleSuggestionItems}
          onAdd={addPerson}
          onRemove={removePerson}
          onCommitSingleSuggestion={commitSingleSuggestion}
        />

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
      description="Shows how the proposal will appear in feeds and search before a plan adds schedule and location."
      surface="transparent"
    >
      {#if previewItem}
        <EventCard item={previewItem} />
      {/if}
    </CreatePanel>

    <CreateEventVisibilityPanel
      privateCommunityLabel={privateCommunity?.label ?? null}
      {personalInviteOnly}
    />
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

  .helper-text {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>