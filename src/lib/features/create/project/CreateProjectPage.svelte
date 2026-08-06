<script lang="ts">
  import { page } from '$app/stores';
  import ProjectCard from '$lib/components/cards/public-feed/ProjectCard.svelte';
  import DirectUsePolicyNotice from '$lib/components/shared/DirectUsePolicyNotice.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreateLocationIntent from '$lib/features/create/shared/CreateLocationIntent.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import CreateScopeTagSelector from '$lib/features/create/shared/CreateScopeTagSelector.svelte';
  import CreateTypeSelector from '$lib/features/create/shared/CreateTypeSelector.svelte';
  import CreateWizard from '$lib/features/create/shared/CreateWizard.svelte';
  import { commitSingleSuggestion, mergeScopeOptions } from '$lib/features/create/shared/createFormActions';
  import { loadTaggableScopeOptions } from '$lib/features/create/shared/taggableScopes';
  import { createProject } from '$lib/services/commands/create';
  import {
    isPersonalServiceProject,
    projectCreateTypeOption,
    projectCreateTypeOptions,
    serviceRequestModeOptions
  } from '$lib/features/projects/projectMode';
  import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
  import type { ProjectMode, PublicProjectItem, TagRef } from '$lib/types/feed';
  import { emptyLocationPickerValue, type LocationPickerValue } from '$lib/types/locationPicker';
  import {
    applyScopePrefillToSelections,
    readScopePrefillFromSearchParams
  } from '$lib/utils/createScopePrefill';
  import { navigateAfterCreate } from '$lib/utils/navigateAfterCreate';

  const platformTagSlug = 'platform';
  const defaultProductiveLocation = '';

  const wizardSteps = [
    { id: 'type', title: 'Type' },
    { id: 'basics', title: 'Basics' },
    { id: 'location', title: 'Location' },
    { id: 'scope', title: 'Scope' },
    { id: 'overview', title: 'Overview' }
  ];

  let selectedType: ProjectMode = 'productive';
  let title = '';
  let description = '';
  let locationIntent: 'physical' | 'online' | 'later' = 'later';
  let locationValue: LocationPickerValue = emptyLocationPickerValue();
  let selectedChannelIds: string[] = [];
  let selectedCommunityIds: string[] = [];
  let primaryChannelQuery = '';
  let additionalChannelQuery = '';
  let communityQuery = '';
  let serviceRequestMode: 'calendar' | 'direct' | 'both' = 'both';
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
  $: resolvedLocationLabel =
    locationIntent === 'online'
      ? 'Online'
      : locationIntent === 'physical'
        ? locationValue.displayLabel.trim()
        : defaultProductiveLocation;
  $: resolvedLocationId = locationIntent === 'physical' ? locationValue.locationId : null;

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
    locationLabel:
      locationIntent === 'online'
        ? 'Online'
        : locationIntent === 'physical'
          ? locationValue.displayLabel.trim() || 'Physical location'
          : 'Location TBD',
    voteCount: 0,
    activeVote: 0,
    signalCount: 0,
    supportCount: 0,
    opposeCount: 0,
    favorability: null,
    viewerSignal: null,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: new Date().toISOString()
  } satisfies PublicProjectItem;

  $: usesPlatformTag = projectPreview.channelTags.some((tag) => tag.slug === platformTagSlug);
  $: personalServiceUsesPlatformTag = usesPlatformTag && isPersonalServiceProject(selectedType);
  $: viewerCanCreatePlatformProject = !usesPlatformTag || !!viewer;

  $: canContinueBasics = title.trim().length > 0 && description.trim().length > 0;
  $: canContinueLocation =
    locationIntent !== 'physical' || Boolean(locationValue.displayLabel.trim());
  $: canContinueScope = selectedChannelIds.length > 0;
  $: canContinue =
    wizardSteps[stepIndex]?.id === 'basics'
      ? canContinueBasics
      : wizardSteps[stepIndex]?.id === 'location'
        ? canContinueLocation
        : wizardSteps[stepIndex]?.id === 'scope'
          ? canContinueScope
          : true;

  $: canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    selectedChannelIds.length > 0 &&
    canContinueLocation &&
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
        locationId: resolvedLocationId,
        projectMode: selectedType,
        channelTags: projectPreview.channelTags,
        communityTags: projectPreview.communityTags,
        serviceRequestMode
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The project could not be created.';
        return;
      }

      await navigateAfterCreate(`/projects/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Create project"
      description="Choose the type, fill the details, then review before creating."
    >
      <CreateWizard
        steps={wizardSteps}
        bind:stepIndex
        {canContinue}
        {canSubmit}
        {isSubmitting}
        submitLabel="Create Project"
        on:submit={handleCreate}
      >
        <svelte:fragment slot="step" let:currentStep>
          {#if currentStep?.id === 'type'}
            <div class="form-stack">
              <CreateTypeSelector
                label="Project type"
                name="project-type"
                bind:selected={selectedType}
                options={projectCreateTypeOptions}
                showDetailPanel={false}
              />
              {#if isPersonalServiceProject(selectedType)}
                <CreateTypeSelector
                  label="Service request mode"
                  name="service-request-mode"
                  bind:selected={serviceRequestMode}
                  options={serviceRequestModeOptions}
                  showDetailPanel={false}
                />
              {/if}
            </div>
          {:else if currentStep?.id === 'basics'}
            <div class="form-stack">
              <label>
                <RequiredFieldLabel>Title</RequiredFieldLabel>
                <input bind:value={title} aria-required="true" />
              </label>
              <label>
                <RequiredFieldLabel>Proposal description</RequiredFieldLabel>
                <textarea bind:value={description} rows="5" aria-required="true"></textarea>
              </label>
              <DirectUsePolicyNotice variant="create" context="project" />
            </div>
          {:else if currentStep?.id === 'location'}
            <CreateLocationIntent bind:intent={locationIntent} bind:locationValue />
          {:else if currentStep?.id === 'scope'}
            <div class="form-stack">
              <CreateScopeTagSelector
                label="Primary channel tag"
                placeholder="Type to search channels"
                helperText="At least one channel tag is required."
                bind:query={primaryChannelQuery}
                selectedItems={primaryChannelItems}
                suggestionItems={primaryChannelSuggestionItems}
                onAdd={addPrimaryChannelTag}
                onRemove={removePrimaryChannelTag}
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
                label="Community tags"
                placeholder="Optional"
                bind:query={communityQuery}
                selectedItems={selectedCommunityItems}
                suggestionItems={communitySuggestionItems}
                onAdd={addCommunityTag}
                onRemove={removeCommunityTag}
                onCommitSingleSuggestion={commitSingleSuggestion}
              />
            </div>
          {:else}
            <div class="form-stack overview">
              <button class="overview-row" type="button" on:click={() => (stepIndex = 0)}>
                <strong>Type</strong>
                <span>
                  {selectedTypeOption.label}
                  {#if isPersonalServiceProject(selectedType)}
                    · {selectedServiceModeOption.label}
                  {/if}
                </span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = 1)}>
                <strong>Basics</strong>
                <span>{title.trim() || 'Untitled project'}</span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = 2)}>
                <strong>Location</strong>
                <span>
                  {locationIntent === 'online'
                    ? 'Online'
                    : locationIntent === 'physical'
                      ? locationValue.displayLabel.trim() || 'Physical'
                      : 'Decide later'}
                </span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = 3)}>
                <strong>Scope</strong>
                <span>
                  {selectedChannelIds.length} channels · {selectedCommunityIds.length} communities
                </span>
              </button>
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
    <CreatePanel
      title="Live preview"
      description="How the project will appear in the feed."
      surface="transparent"
    >
      <ProjectCard item={projectPreview} />
    </CreatePanel>

    <CreatePanel title="About this type" description={selectedTypeOption.summary}>
      <div class="type-guidance">
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
        {#if personalServiceUsesPlatformTag}
          <p class="type-guidance-note">
            Personal service projects cannot use the platform channel.
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

  .overview-row {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--panel) 94%, transparent);
    text-align: left;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }

  .overview-row span {
    color: var(--text-soft);
    font-size: 13px;
  }

  .status-note {
    margin: 0;
    color: var(--danger, #c0392b);
  }

  .type-guidance {
    display: grid;
    gap: 10px;
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
