<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ThreadCard from '$lib/components/cards/public-feed/ThreadCard.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import CreateScopeTagSelector from '$lib/features/create/shared/CreateScopeTagSelector.svelte';
  import { commitSingleSuggestion, mergeScopeOptions } from '$lib/features/create/shared/createFormActions';
  import { loadTaggableScopeOptions } from '$lib/features/create/shared/taggableScopes';
  import { createThread } from '$lib/services/queries/create';
  import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
  import type { PublicThreadItem, TagRef } from '$lib/types/feed';

  const platformTagSlug = 'platform';

  let title = '';
  let body = '';
  let selectedChannelIds: string[] = [];
  let selectedCommunityIds: string[] = [];
  let primaryTagType: 'channel' | 'community' = 'channel';
  let primaryQuery = '';
  let additionalChannelQuery = '';
  let communityQuery = '';
  let statusMessage = '';
  let isSubmitting = false;
  let channelSuggestionPool: ScopeDirectoryItem[] = [];
  let communitySuggestionPool: ScopeDirectoryItem[] = [];
  let selectedChannelOptions: ScopeDirectoryItem[] = [];
  let selectedCommunityOptionsCache: ScopeDirectoryItem[] = [];
  let taggableLookupKey = '';
  let taggableRequestId = 0;

  function selectedScopeTags(
    selectedSlugs: string[],
    options: ScopeDirectoryItem[],
    kind: 'channel' | 'community'
  ): TagRef[] {
    return selectedSlugs
      .map((slug) => options.find((option) => option.slug === slug))
      .filter((option): option is ScopeDirectoryItem => !!option)
      .map((option) => ({ slug: option.slug, label: option.label, kind }));
  }

  function matchesQuery(option: Pick<ScopeDirectoryItem, 'slug' | 'label'>, normalizedQuery: string) {
    return (
      option.label.toLowerCase().includes(normalizedQuery) ||
      option.slug.toLowerCase().includes(normalizedQuery)
    );
  }

  $: viewer = $page.data.bootstrap?.viewer ?? null;
  $: updateTaggableScopes(primaryTagType, primaryQuery, additionalChannelQuery, communityQuery);
  $: allChannelOptions = mergeScopeOptions(channelSuggestionPool, selectedChannelOptions);
  $: allCommunityOptions = mergeScopeOptions(communitySuggestionPool, selectedCommunityOptionsCache);
  $: normalizedPrimaryQuery = primaryQuery.trim().toLowerCase();
  $: normalizedAdditionalChannelQuery = additionalChannelQuery.trim().toLowerCase();
  $: normalizedCommunityQuery = communityQuery.trim().toLowerCase();
  $: primaryChannelSuggestions =
    primaryTagType === 'channel' && normalizedPrimaryQuery
      ? channelSuggestionPool
          .filter((option) => matchesQuery(option, normalizedPrimaryQuery))
          .filter((option) => !selectedChannelIds.includes(option.slug))
          .slice(0, 6)
      : [];
  $: primaryCommunitySuggestions =
    primaryTagType === 'community' && normalizedPrimaryQuery
      ? communitySuggestionPool
          .filter((option) => matchesQuery(option, normalizedPrimaryQuery))
          .filter((option) => !selectedCommunityIds.includes(option.slug))
          .slice(0, 6)
      : [];
  $: additionalChannelSuggestions = normalizedAdditionalChannelQuery
    ? channelSuggestionPool
        .filter((option) => matchesQuery(option, normalizedAdditionalChannelQuery))
        .filter((option) => !selectedChannelIds.includes(option.slug))
        .slice(0, 6)
    : [];
  $: extraCommunitySuggestions = normalizedCommunityQuery
    ? communitySuggestionPool
        .filter((option) => matchesQuery(option, normalizedCommunityQuery))
        .filter((option) => !selectedCommunityIds.includes(option.slug))
        .slice(0, 6)
    : [];
  $: primaryItems =
    primaryTagType === 'channel'
      ? selectedChannelIds.slice(0, 1)
          .map((slug) => allChannelOptions.find((option) => option.slug === slug))
          .filter((option): option is ScopeDirectoryItem => !!option)
          .map((option) => ({ key: option.slug, label: option.label }))
      : selectedCommunityIds.slice(0, 1)
          .map((slug) => allCommunityOptions.find((option) => option.slug === slug))
          .filter((option): option is ScopeDirectoryItem => !!option)
          .map((option) => ({ key: option.slug, label: option.label }));
  $: additionalChannelItems = selectedChannelIds.slice(1)
    .map((slug) => allChannelOptions.find((option) => option.slug === slug))
    .filter((option): option is ScopeDirectoryItem => !!option)
    .map((option) => ({ key: option.slug, label: option.label }));
  $: communityItems = (primaryTagType === 'community' ? selectedCommunityIds.slice(1) : selectedCommunityIds)
    .map((slug) => allCommunityOptions.find((option) => option.slug === slug))
    .filter((option): option is ScopeDirectoryItem => !!option)
    .map((option) => ({ key: option.slug, label: option.label }));
  $: primaryChannelSuggestionItems = primaryChannelSuggestions.map((option) => ({
    key: option.slug,
    label: option.label
  }));
  $: primaryCommunitySuggestionItems = primaryCommunitySuggestions.map((option) => ({
    key: option.slug,
    label: option.label
  }));
  $: additionalChannelSuggestionItems = additionalChannelSuggestions.map((option) => ({
    key: option.slug,
    label: option.label
  }));
  $: extraCommunitySuggestionItems = extraCommunitySuggestions.map((option) => ({
    key: option.slug,
    label: option.label
  }));

  $: previewItem = viewer
    ? ({
        kind: 'thread',
        id: 'thread-preview',
        slug: 'thread-preview',
        href: '#',
        createdAt: new Date().toISOString(),
        title: title.trim() || 'Untitled thread',
        body: body.trim() || 'Describe the question or comparison you want people to discuss.',
        authorUsername: viewer.username,
        channelTags: selectedScopeTags(selectedChannelIds, allChannelOptions, 'channel'),
        communityTags: selectedScopeTags(selectedCommunityIds, allCommunityOptions, 'community'),
        voteCount: 0,
        activeVote: 0,
        commentCount: 0,
        lastActivityAt: new Date().toISOString()
      } satisfies PublicThreadItem)
    : null;

  $: hasPrimaryTag =
    primaryTagType === 'channel' ? selectedChannelIds.length > 0 : selectedCommunityIds.length > 0;
  $: canSubmit = title.trim().length > 0 && body.trim().length > 0 && hasPrimaryTag;
  $: usesPlatformTag = selectedChannelIds.includes(platformTagSlug);

  async function updateTaggableScopes(
    primaryKind: 'channel' | 'community',
    primaryText: string,
    additionalChannelText: string,
    communityText: string
  ) {
    const lookupKey = `${primaryKind}|${primaryText.trim()}|${additionalChannelText.trim()}|${communityText.trim()}`;

    if (lookupKey === taggableLookupKey) {
      return;
    }

    taggableLookupKey = lookupKey;
    const requestId = ++taggableRequestId;

    try {
      const channelLookup = [primaryKind === 'channel' ? primaryText : '', additionalChannelText]
        .filter((value) => value.trim())
        .at(-1) ?? '';
      const communityLookup = primaryKind === 'community' ? primaryText : communityText;
      const results = await loadTaggableScopeOptions(channelLookup, communityLookup);

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

  function addPrimaryTag(slug: string) {
    if (primaryTagType === 'channel') {
      if (selectedChannelIds[0] === slug) {
        return;
      }
      const option = channelSuggestionPool.find((item) => item.slug === slug);
      if (option) {
        selectedChannelOptions = mergeScopeOptions(selectedChannelOptions, [option]);
      }
      selectedChannelIds = [slug, ...selectedChannelIds.filter((value) => value !== slug)];
      primaryQuery = '';
      return;
    }

    if (selectedCommunityIds[0] === slug) {
      return;
    }
    const option = communitySuggestionPool.find((item) => item.slug === slug);
    if (option) {
      selectedCommunityOptionsCache = mergeScopeOptions(selectedCommunityOptionsCache, [option]);
    }
    selectedCommunityIds = [slug, ...selectedCommunityIds.filter((value) => value !== slug)];
    primaryQuery = '';
  }

  function removePrimaryTag(slug: string) {
    if (primaryTagType === 'channel') {
      selectedChannelIds = selectedChannelIds.filter((value) => value !== slug);
      return;
    }
    selectedCommunityIds = selectedCommunityIds.filter((value) => value !== slug);
  }

  function addAdditionalChannelTag(slug: string) {
    if (selectedChannelIds.includes(slug)) {
      return;
    }
    const option = channelSuggestionPool.find((item) => item.slug === slug);
    if (option) {
      selectedChannelOptions = mergeScopeOptions(selectedChannelOptions, [option]);
    }
    selectedChannelIds = [...selectedChannelIds, slug];
    additionalChannelQuery = '';
  }

  function removeAdditionalChannelTag(slug: string) {
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

  async function handleCreate() {
    isSubmitting = true;
    statusMessage = '';

    try {
      const result = await createThread({
        title,
        body,
        channelTags: previewItem?.channelTags ?? [],
        communityTags: previewItem?.communityTags ?? []
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The thread could not be created.';
        return;
      }

      await invalidateAll();
      await goto(`/threads/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the route and preview are now real.';
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Thread proposal"
      description="Start the discussion, choose a primary discovery tag, and add optional tags for wider reach."
    >
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <label>
          <span class="field-label">Thread title</span>
          <input bind:value={title} />
        </label>

        <label>
          <span class="field-label">Primary tag type</span>
          <select bind:value={primaryTagType}>
            <option value="channel">Channel</option>
            <option value="community">Community</option>
          </select>
        </label>

        <CreateScopeTagSelector
          label={primaryTagType === 'community' ? 'Primary community tag' : 'Primary channel tag'}
          placeholder={primaryTagType === 'community' ? 'Type to search communities' : 'Type to search channels'}
          helperText="Required. Suggestions only include the selected tag type."
          bind:query={primaryQuery}
          selectedItems={primaryItems}
          suggestionItems={primaryTagType === 'community' ? primaryCommunitySuggestionItems : primaryChannelSuggestionItems}
          onAdd={addPrimaryTag}
          onRemove={removePrimaryTag}
          onCommitSingleSuggestion={commitSingleSuggestion}
        />

        <CreateScopeTagSelector
          label="Additional channel tags"
          placeholder="Type to add another channel"
          helperText="Optional. Only channel matches appear here."
          bind:query={additionalChannelQuery}
          selectedItems={additionalChannelItems}
          suggestionItems={additionalChannelSuggestionItems}
          onAdd={addAdditionalChannelTag}
          onRemove={removeAdditionalChannelTag}
          onCommitSingleSuggestion={commitSingleSuggestion}
        />

        <CreateScopeTagSelector
          label="Community tags"
          placeholder="Type to search communities"
          helperText="Optional. Only community matches appear here."
          bind:query={communityQuery}
          selectedItems={communityItems}
          suggestionItems={extraCommunitySuggestionItems}
          onAdd={addCommunityTag}
          onRemove={removeCommunityTag}
          onCommitSingleSuggestion={commitSingleSuggestion}
        />

        <label>
          <span class="field-label">Opening post</span>
          <textarea bind:value={body} rows="5"></textarea>
        </label>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Thread'}
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
      description="Threads sit on the same surface as the feed background."
      surface="transparent"
    >
      {#if previewItem}
        <ThreadCard item={previewItem} />
      {/if}
    </CreatePanel>

    <CreatePanel title="Discussion note" description="How the tag choice affects discovery.">
      <p class="helper-text">
        {usesPlatformTag
          ? 'Platform keeps public discussion open to regular users, and platform-tagged projects can also be proposed by any signed-in user.'
          : 'Threads keep lightweight public discussion and idea comparison outside the project logistics view.'}
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
</style>
