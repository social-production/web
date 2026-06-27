<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ProjectCard from '$lib/components/cards/public-feed/ProjectCard.svelte';
  import DirectUsePolicyNotice from '$lib/components/shared/DirectUsePolicyNotice.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import CreateScopeTagSelector from '$lib/features/create/shared/CreateScopeTagSelector.svelte';
  import CreateTypeSelector from '$lib/features/create/shared/CreateTypeSelector.svelte';
  import { commitSingleSuggestion, mergeScopeOptions } from '$lib/features/create/shared/createFormActions';
  import { loadTaggableScopeOptions } from '$lib/features/create/shared/taggableScopes';
  import { createProject } from '$lib/services/queries/create';
  import {
    isPersonalServiceProject,
    projectCreateTypeOption,
    projectCreateTypeOptions,
    serviceRequestModeOptions
  } from '$lib/features/projects/projectMode';
  import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
  import type { ProjectMode, PublicProjectItem, TagRef } from '$lib/types/feed';

  const platformTagSlug = 'platform';
  const defaultProductiveLocation = 'Not specified';

  let selectedType: ProjectMode = 'productive';
  let title = '';
  let description = '';
  let locationLabel = '';
  let selectedChannelIds: string[] = [];
  let selectedCommunityIds: string[] = [];
  let primaryChannelQuery = '';
  let additionalChannelQuery = '';
  let communityQuery = '';
  let serviceRequestMode: 'calendar' | 'direct' | 'both' = 'both';
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
  $: updateTaggableScopes(primaryChannelQuery, additionalChannelQuery, communityQuery);
  $: allChannelOptions = mergeScopeOptions(channelSuggestionPool, selectedChannelOptions);
  $: allCommunityOptions = mergeScopeOptions(communitySuggestionPool, selectedCommunityOptionsCache);
  $: normalizedPrimaryChannelQuery = primaryChannelQuery.trim().toLowerCase();
  $: normalizedAdditionalChannelQuery = additionalChannelQuery.trim().toLowerCase();
  $: normalizedCommunityQuery = communityQuery.trim().toLowerCase();
  $: primaryChannelSuggestions = normalizedPrimaryChannelQuery
    ? channelSuggestionPool
        .filter((option) => matchesQuery(option, normalizedPrimaryChannelQuery))
        .filter((option) => !selectedChannelIds.includes(option.slug))
        .slice(0, 6)
    : [];
  $: additionalChannelSuggestions = normalizedAdditionalChannelQuery
    ? channelSuggestionPool
        .filter((option) => matchesQuery(option, normalizedAdditionalChannelQuery))
        .filter((option) => !selectedChannelIds.includes(option.slug))
        .slice(0, 6)
    : [];
  $: communitySuggestions = normalizedCommunityQuery
    ? communitySuggestionPool
        .filter((option) => matchesQuery(option, normalizedCommunityQuery))
        .filter((option) => !selectedCommunityIds.includes(option.slug))
        .slice(0, 6)
    : [];
  $: primaryChannelItems = selectedChannelIds.slice(0, 1)
    .map((slug) => allChannelOptions.find((option) => option.slug === slug))
    .filter((option): option is ScopeDirectoryItem => !!option)
    .map((option) => ({ key: option.slug, label: option.label }));
  $: additionalChannelItems = selectedChannelIds.slice(1)
    .map((slug) => allChannelOptions.find((option) => option.slug === slug))
    .filter((option): option is ScopeDirectoryItem => !!option)
    .map((option) => ({ key: option.slug, label: option.label }));
  $: selectedCommunityItems = selectedCommunityIds
    .map((slug) => allCommunityOptions.find((option) => option.slug === slug))
    .filter((option): option is ScopeDirectoryItem => !!option)
    .map((option) => ({ key: option.slug, label: option.label }));
  $: primaryChannelSuggestionItems = primaryChannelSuggestions.map((option) => ({
    key: option.slug,
    label: option.label
  }));
  $: additionalChannelSuggestionItems = additionalChannelSuggestions.map((option) => ({
    key: option.slug,
    label: option.label
  }));
  $: communitySuggestionItems = communitySuggestions.map((option) => ({
    key: option.slug,
    label: option.label
  }));
  $: selectedTypeOption = projectCreateTypeOption(selectedType);
  $: selectedServiceModeOption =
    serviceRequestModeOptions.find((option) => option.value === serviceRequestMode) ??
    serviceRequestModeOptions[2];
  $: showLocationField = isPersonalServiceProject(selectedType);
  $: resolvedLocationLabel = showLocationField ? locationLabel.trim() : defaultProductiveLocation;

  $: projectPreview = {
    kind: 'project',
    id: 'project-preview',
    slug: 'project-preview',
    href: '#',
    createdAt: new Date().toISOString(),
    title: title.trim() || 'Untitled project',
    authorUsername: viewer?.username ?? 'member',
    projectMode: selectedType,
    summary:
      description.trim() ||
      'Describe the project so need, labor interest, and overlap stay visible before planning begins.',
    channelTags: selectedScopeTags(selectedChannelIds, allChannelOptions, 'channel'),
    communityTags: selectedScopeTags(selectedCommunityIds, allCommunityOptions, 'community'),
    stage: isPersonalServiceProject(selectedType) ? 'Activity' : 'Proposal',
    locationLabel: resolvedLocationLabel,
    voteCount: 0,
    activeVote: 0,
    signalCount: 0,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: new Date().toISOString()
  } satisfies PublicProjectItem;

  $: usesPlatformTag = projectPreview.channelTags.some((tag) => tag.slug === platformTagSlug);
  $: personalServiceUsesPlatformTag = usesPlatformTag && isPersonalServiceProject(selectedType);
  $: viewerCanCreatePlatformProject = !usesPlatformTag || !!viewer;

  $: canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    selectedChannelIds.length > 0 &&
    (!showLocationField || locationLabel.trim().length > 0) &&
    viewerCanCreatePlatformProject &&
    !personalServiceUsesPlatformTag;

  async function updateTaggableScopes(
    primaryChannelText: string,
    additionalChannelText: string,
    communityText: string
  ) {
    const lookupKey = `${primaryChannelText.trim()}|${additionalChannelText.trim()}|${communityText.trim()}`;

    if (lookupKey === taggableLookupKey) {
      return;
    }

    taggableLookupKey = lookupKey;
    const requestId = ++taggableRequestId;

    try {
      const results = await loadTaggableScopeOptions(
        [primaryChannelText, additionalChannelText].filter((value) => value.trim()).at(-1) ?? '',
        communityText
      );

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

  function addPrimaryChannelTag(slug: string) {
    if (selectedChannelIds[0] === slug) {
      return;
    }

    const option = channelSuggestionPool.find((item) => item.slug === slug);
    if (option) {
      selectedChannelOptions = mergeScopeOptions(selectedChannelOptions, [option]);
    }
    selectedChannelIds = [slug, ...selectedChannelIds.filter((value) => value !== slug)];
    primaryChannelQuery = '';
  }

  function removePrimaryChannelTag(slug: string) {
    selectedChannelIds = selectedChannelIds.filter((value) => value !== slug);
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
      if (selectedChannelIds.length === 0) {
        statusMessage = 'Choose at least one channel tag from the suggestions.';
        return;
      }

      const result = await createProject({
        title,
        description,
        locationLabel: resolvedLocationLabel,
        projectMode: selectedType,
        channelTags: projectPreview.channelTags,
        communityTags: projectPreview.communityTags,
        serviceRequestMode
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The project could not be created.';
        return;
      }

      await invalidateAll();
      await goto(`/projects/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the page structure is now in place.';
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Project proposal"
      description="Choose the project type, describe the proposal, and anchor discovery with at least one channel tag."
    >
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <DirectUsePolicyNotice variant="create" context="project" />

        <CreateTypeSelector
          label="Project type"
          name="project-type"
          bind:selected={selectedType}
          options={projectCreateTypeOptions}
          showDetailPanel={false}
        />

        <label>
          <RequiredFieldLabel>Title</RequiredFieldLabel>
          <input bind:value={title} aria-required="true" />
        </label>

        <label>
          <RequiredFieldLabel>Proposal description</RequiredFieldLabel>
          <textarea bind:value={description} rows="5" aria-required="true"></textarea>
        </label>

        <CreateScopeTagSelector
          label="Primary channel tag"
          placeholder="Type to search channels"
          helperText="At least one channel tag is required. Suggestions only include channels."
          bind:query={primaryChannelQuery}
          selectedItems={primaryChannelItems}
          suggestionItems={primaryChannelSuggestionItems}
          onAdd={addPrimaryChannelTag}
          onRemove={removePrimaryChannelTag}
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
          selectedItems={selectedCommunityItems}
          suggestionItems={communitySuggestionItems}
          onAdd={addCommunityTag}
          onRemove={removeCommunityTag}
          onCommitSingleSuggestion={commitSingleSuggestion}
        />

        {#if showLocationField}
          <label>
            <span class="field-label">Suggested location</span>
            <input bind:value={locationLabel} placeholder="Where the service mainly happens" />
          </label>
        {/if}

        {#if isPersonalServiceProject(selectedType)}
          <CreateTypeSelector
            label="Service request mode"
            name="service-request-mode"
            bind:selected={serviceRequestMode}
            options={serviceRequestModeOptions}
            showDetailPanel={false}
          />
        {/if}

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Project'}
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
      description="Matches the current feed treatment for projects."
      surface="transparent"
    >
      <ProjectCard item={projectPreview} />
    </CreatePanel>

    <CreatePanel
      title="About this project type"
      description="What the selected type is for and what happens after creation."
    >
      <div class="type-guidance">
        <strong>{selectedTypeOption.label}</strong>
        <p>{selectedTypeOption.summary}</p>
        <div class="type-guidance-block">
          <span class="type-guidance-heading">Best for</span>
          <ul>
            {#each selectedTypeOption.bestFor as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
        <p class="type-guidance-lifecycle">{selectedTypeOption.lifecycleNote}</p>
        {#if isPersonalServiceProject(selectedType)}
          <p class="type-guidance-lifecycle">{selectedServiceModeOption.lifecycleNote}</p>
        {/if}
        {#if usesPlatformTag}
          <p class="type-guidance-note">
            {#if personalServiceUsesPlatformTag}
              Personal service projects cannot use the platform channel. The platform tag is only for collective governance surfaces.
            {:else}
              Platform-tagged projects stay open to any signed-in user.
            {/if}
          </p>
        {/if}
      </div>
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

  .type-guidance {
    display: grid;
    gap: 10px;
  }

  .type-guidance strong {
    color: var(--text-main);
    font-size: 14px;
  }

  .type-guidance p,
  .type-guidance-note,
  .type-guidance-lifecycle {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .type-guidance-block {
    display: grid;
    gap: 6px;
  }

  .type-guidance-heading {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .type-guidance ul {
    margin: 0;
    padding-left: 18px;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }
</style>
