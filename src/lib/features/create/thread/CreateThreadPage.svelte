<script lang="ts">
  import { page } from '$app/stores';
  import ThreadCard from '$lib/components/cards/public-feed/ThreadCard.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import CreateScopeTagSelector from '$lib/features/create/shared/CreateScopeTagSelector.svelte';
  import CreateWizard from '$lib/features/create/shared/CreateWizard.svelte';
  import { commitSingleSuggestion, mergeScopeOptions } from '$lib/features/create/shared/createFormActions';
  import { loadTaggableScopeOptions } from '$lib/features/create/shared/taggableScopes';
  import { createThread } from '$lib/services/queries/create';
  import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
  import type { PublicThreadItem, TagRef } from '$lib/types/feed';
  import {
    applyScopePrefillToSelections,
    readScopePrefillFromSearchParams
  } from '$lib/utils/createScopePrefill';
  import { navigateAfterCreate } from '$lib/utils/navigateAfterCreate';

  const wizardSteps = [
    { id: 'basics', title: 'Basics' },
    { id: 'scope', title: 'Tags' }
  ];

  let title = '';
  let body = '';
  let selectedChannelIds: string[] = [];
  let selectedCommunityIds: string[] = [];
  let primaryTagType: 'channel' | 'community' = 'channel';
  let primaryQuery = '';
  let additionalChannelQuery = '';
  let communityQuery = '';
  let stepIndex = 0;
  let statusMessage = '';
  let isSubmitting = false;
  let channelSuggestionPool: ScopeDirectoryItem[] = [];
  let communitySuggestionPool: ScopeDirectoryItem[] = [];
  let selectedChannelOptions: ScopeDirectoryItem[] = [];
  let selectedCommunityOptionsCache: ScopeDirectoryItem[] = [];
  let taggableLookupKey = '';
  let taggableRequestId = 0;
  let appliedScopePrefillKey = '';

  $: scopePrefillKey = `${$page.url.searchParams.get('channel') ?? ''}:${$page.url.searchParams.get('community') ?? ''}`;
  $: if (scopePrefillKey && scopePrefillKey !== appliedScopePrefillKey) {
    appliedScopePrefillKey = scopePrefillKey;
    const prefill = readScopePrefillFromSearchParams($page.url.searchParams);
    const applied = applyScopePrefillToSelections(
      prefill,
      $page.data.bootstrap?.directory?.channels ?? [],
      $page.data.bootstrap?.directory?.communities ?? [],
      selectedChannelIds,
      selectedCommunityIds
    );
    primaryTagType = applied.primaryTagType;
    selectedChannelIds = applied.selectedChannelIds;
    selectedCommunityIds = applied.selectedCommunityIds;
    selectedChannelOptions = mergeScopeOptions(selectedChannelOptions, applied.selectedChannelOptions);
    selectedCommunityOptionsCache = mergeScopeOptions(
      selectedCommunityOptionsCache,
      applied.selectedCommunityOptions
    );
  }

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
      ? selectedChannelIds
          .slice(0, 1)
          .map((slug) => allChannelOptions.find((option) => option.slug === slug))
          .filter((option): option is ScopeDirectoryItem => !!option)
          .map((option) => ({ key: option.slug, label: option.label }))
      : selectedCommunityIds
          .slice(0, 1)
          .map((slug) => allCommunityOptions.find((option) => option.slug === slug))
          .filter((option): option is ScopeDirectoryItem => !!option)
          .map((option) => ({ key: option.slug, label: option.label }));
  $: additionalChannelItems = selectedChannelIds
    .slice(1)
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
  $: canContinueBasics = title.trim().length > 0 && body.trim().length > 0;
  $: canContinueScope = hasPrimaryTag;
  $: canContinue =
    wizardSteps[stepIndex]?.id === 'basics'
      ? canContinueBasics
      : wizardSteps[stepIndex]?.id === 'scope'
        ? canContinueScope
        : true;
  $: canSubmit = canContinueBasics && canContinueScope;

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
      const channelLookup =
        [primaryKind === 'channel' ? primaryText : '', additionalChannelText]
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

      await navigateAfterCreate(`/threads/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel title="Create thread" description="Write the opening post, add a discovery tag, then publish.">
      <CreateWizard
        steps={wizardSteps}
        bind:stepIndex
        {canContinue}
        {canSubmit}
        {isSubmitting}
        submitLabel="Create Thread"
        on:submit={handleCreate}
      >
        <svelte:fragment slot="step" let:currentStep>
          {#if currentStep?.id === 'basics'}
            <div class="form-stack">
              <label>
                <RequiredFieldLabel>Thread title</RequiredFieldLabel>
                <input bind:value={title} aria-required="true" />
              </label>
              <label>
                <RequiredFieldLabel>Opening post</RequiredFieldLabel>
                <textarea bind:value={body} rows="5" aria-required="true"></textarea>
              </label>
            </div>
          {:else}
            <div class="form-stack">
              <p class="helper-text">Choose one primary tag so people can discover this thread.</p>
              <label>
                <span class="field-label">Primary tag type</span>
                <select bind:value={primaryTagType}>
                  <option value="channel">Channel</option>
                  <option value="community">Community</option>
                </select>
              </label>
              <CreateScopeTagSelector
                label={primaryTagType === 'community' ? 'Primary community tag' : 'Primary channel tag'}
                placeholder={primaryTagType === 'community'
                  ? 'Type to search communities'
                  : 'Type to search channels'}
                helperText="Required."
                bind:query={primaryQuery}
                selectedItems={primaryItems}
                suggestionItems={primaryTagType === 'community'
                  ? primaryCommunitySuggestionItems
                  : primaryChannelSuggestionItems}
                onAdd={addPrimaryTag}
                onRemove={removePrimaryTag}
                onCommitSingleSuggestion={commitSingleSuggestion}
              />
              <CreateScopeTagSelector
                label="Additional channel tags"
                placeholder="Optional"
                bind:query={additionalChannelQuery}
                selectedItems={additionalChannelItems}
                suggestionItems={additionalChannelSuggestionItems}
                onAdd={addAdditionalChannelTag}
                onRemove={removeAdditionalChannelTag}
                onCommitSingleSuggestion={commitSingleSuggestion}
              />
              <CreateScopeTagSelector
                label="Additional community tags"
                placeholder="Optional"
                bind:query={communityQuery}
                selectedItems={communityItems}
                suggestionItems={extraCommunitySuggestionItems}
                onAdd={addCommunityTag}
                onRemove={removeCommunityTag}
                onCommitSingleSuggestion={commitSingleSuggestion}
              />
              {#if !hasPrimaryTag}
                <p class="status-note">Add one primary channel or community tag.</p>
              {/if}
              {#if statusMessage}
                <p class="status-note">{statusMessage}</p>
              {/if}
            </div>
          {/if}
        </svelte:fragment>
      </CreateWizard>
    </CreatePanel>
  </svelte:fragment>

  <svelte:fragment slot="secondary">
    <CreatePanel title="Live preview" description="How the thread will look in the feed." surface="transparent">
      {#if previewItem}
        <ThreadCard item={previewItem} />
      {/if}
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

  .helper-text,
  .status-note {
    margin: 0;
  }

  .helper-text {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .status-note {
    color: var(--danger, #c0392b);
  }
</style>
