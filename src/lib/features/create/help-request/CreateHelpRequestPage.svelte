<script lang="ts">
  import { page } from '$app/stores';
  import HelpRequestCard from '$lib/components/cards/public-feed/HelpRequestCard.svelte';
  import DirectUsePolicyNotice from '$lib/components/shared/DirectUsePolicyNotice.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreateLocationIntent from '$lib/features/create/shared/CreateLocationIntent.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import CreateScopeTagSelector from '$lib/features/create/shared/CreateScopeTagSelector.svelte';
  import CreateWizard from '$lib/features/create/shared/CreateWizard.svelte';
  import { commitSingleSuggestion, mergeScopeOptions } from '$lib/features/create/shared/createFormActions';
  import { loadTaggableScopeOptions } from '$lib/features/create/shared/taggableScopes';
  import { createHelpRequest } from '$lib/services/queries/create';
  import { emptyLocationPickerValue, type LocationPickerValue } from '$lib/types/locationPicker';
  import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
  import type { PublicHelpRequestItem, TagRef } from '$lib/types/feed';
  import {
    applyScopePrefillToSelections,
    readScopePrefillFromSearchParams
  } from '$lib/utils/createScopePrefill';
  import { navigateAfterCreate } from '$lib/utils/navigateAfterCreate';

  type RoleDraft = {
    roleLabel: string;
    description: string;
    slots: number;
  };

  const wizardSteps = [
    { id: 'basics', title: 'Basics' },
    { id: 'location', title: 'Location' },
    { id: 'timing', title: 'Timing' },
    { id: 'scope', title: 'Scope' },
    { id: 'roles', title: 'Roles' },
    { id: 'overview', title: 'Overview' }
  ];

  let requestTitle = '';
  let body = '';
  let locationIntent: 'physical' | 'online' | 'later' = 'physical';
  let locationValue: LocationPickerValue = emptyLocationPickerValue();
  let neededAt = defaultNeededAt();
  let endsAt = defaultEndsAt(neededAt);
  let roles: RoleDraft[] = [{ roleLabel: '', description: '', slots: 1 }];
  let selectedChannelIds: string[] = [];
  let selectedCommunityIds: string[] = [];
  let primaryTagType: 'channel' | 'community' = 'channel';
  let primaryQuery = '';
  let additionalChannelQuery = '';
  let communityQuery = '';
  let stepIndex = 0;
  let statusMessage = '';
  let isSubmitting = false;
  let validationMessages: string[] = [];
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

  function defaultNeededAt() {
    const next = new Date();
    next.setHours(next.getHours() + 2, 0, 0, 0);
    return toLocalDateTimeInput(next);
  }

  function defaultEndsAt(startValue: string) {
    const start = new Date(startValue);
    if (Number.isNaN(start.getTime())) {
      return '';
    }
    start.setHours(start.getHours() + 2);
    return toLocalDateTimeInput(start);
  }

  function formatScheduleRange(startValue: string, endValue: string) {
    if (!startValue) {
      return 'Time TBD';
    }
    const start = new Date(startValue);
    if (Number.isNaN(start.getTime())) {
      return 'Time TBD';
    }
    const startLabel = start.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    if (!endValue) {
      return startLabel;
    }
    const end = new Date(endValue);
    if (Number.isNaN(end.getTime()) || end <= start) {
      return startLabel;
    }
    if (end.toDateString() === start.toDateString()) {
      return `${startLabel} – ${end.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      })}`;
    }
    return `${startLabel} – ${end.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })}`;
  }

  function toLocalDateTimeInput(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function selectedScopeTags(
    selectedSlugs: string[],
    options: ScopeDirectoryItem[],
    kind: 'channel' | 'community'
  ): TagRef[] {
    return selectedSlugs.map((slug) => {
      const option = options.find((item) => item.slug === slug);
      return {
        slug,
        label: option?.label ?? slug,
        kind
      };
    });
  }

  function matchesQuery(option: Pick<ScopeDirectoryItem, 'slug' | 'label'>, normalizedQuery: string) {
    return (
      option.label.toLowerCase().includes(normalizedQuery) ||
      option.slug.toLowerCase().includes(normalizedQuery)
    );
  }

  function scopeFallback(slug: string, kind: 'channel' | 'community'): ScopeDirectoryItem {
    return {
      slug,
      label: slug,
      href: kind === 'channel' ? `/channels/${slug}` : `/communities/${slug}`
    };
  }

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
      ? selectedChannelIds.slice(0, 1).map((slug) => {
          const option = allChannelOptions.find((item) => item.slug === slug);
          return { key: slug, label: option?.label ?? slug };
        })
      : selectedCommunityIds.slice(0, 1).map((slug) => {
          const option = allCommunityOptions.find((item) => item.slug === slug);
          return { key: slug, label: option?.label ?? slug };
        });
  $: additionalChannelItems = selectedChannelIds.slice(1).map((slug) => {
    const option = allChannelOptions.find((item) => item.slug === slug);
    return { key: slug, label: option?.label ?? slug };
  });
  $: communityItems = (primaryTagType === 'community' ? selectedCommunityIds.slice(1) : selectedCommunityIds).map(
    (slug) => {
      const option = allCommunityOptions.find((item) => item.slug === slug);
      return { key: slug, label: option?.label ?? slug };
    }
  );
  $: previewChannelTags = selectedScopeTags(selectedChannelIds, allChannelOptions, 'channel');
  $: previewCommunityTags = selectedScopeTags(selectedCommunityIds, allCommunityOptions, 'community');
  $: scheduleLabel = formatScheduleRange(neededAt, endsAt);
  $: resolvedLocationLabel =
    locationIntent === 'online'
      ? 'Online'
      : locationIntent === 'physical'
        ? locationValue.displayLabel.trim()
        : '';
  $: resolvedLocationId = locationIntent === 'physical' ? locationValue.locationId : null;
  $: previewLocationLabel =
    locationIntent === 'online'
      ? 'Online'
      : locationIntent === 'physical'
        ? locationValue.displayLabel.trim() || 'Add a location'
        : 'Choose physical or online';

  $: previewItem = ({
    kind: 'help-request',
    id: 'help-request-preview',
    href: '#',
    createdAt: new Date().toISOString(),
    title: requestTitle.trim() || 'Help request title',
    body: body.trim() || 'Describe the one-off help you need, like a lift or moving assistance.',
    authorUsername: $page.data.bootstrap?.viewer?.username ?? 'you',
    locationLabel: previewLocationLabel,
    scheduleLabel,
    roles: roles
      .filter((role) => role.roleLabel.trim())
      .map((role) => ({ title: role.roleLabel.trim(), description: role.description.trim(), slots: role.slots })),
    channelTags: previewChannelTags,
    communityTags: previewCommunityTags,
    voteCount: 0,
    activeVote: 0,
    commentCount: 0,
    lastActivityAt: new Date().toISOString()
  }) satisfies PublicHelpRequestItem;

  $: canContinueBasics = requestTitle.trim().length > 0 && body.trim().length > 0;
  $: canContinueLocation =
    locationIntent !== 'later' &&
    (locationIntent !== 'physical' || Boolean(locationValue.displayLabel.trim()));
  $: canContinueTiming =
    Boolean(neededAt) && Boolean(endsAt) && new Date(endsAt).getTime() > new Date(neededAt).getTime();
  $: canContinueScope = selectedChannelIds.length > 0 || selectedCommunityIds.length > 0;
  $: canContinueRoles = roles.some((role) => role.roleLabel.trim());
  $: canContinue =
    wizardSteps[stepIndex]?.id === 'basics'
      ? canContinueBasics
      : wizardSteps[stepIndex]?.id === 'location'
        ? canContinueLocation
        : wizardSteps[stepIndex]?.id === 'timing'
          ? canContinueTiming
          : wizardSteps[stepIndex]?.id === 'scope'
            ? canContinueScope
            : wizardSteps[stepIndex]?.id === 'roles'
              ? canContinueRoles
              : true;

  $: canSubmit =
    canContinueBasics &&
    canContinueLocation &&
    canContinueTiming &&
    canContinueScope &&
    canContinueRoles;

  function buildValidationMessages() {
    const messages: string[] = [];
    if (!requestTitle.trim()) messages.push('Help request title is required.');
    if (!body.trim()) messages.push('Description is required.');
    if (locationIntent === 'later') {
      messages.push('Choose a physical or online location before publishing.');
    } else if (locationIntent === 'physical' && !locationValue.displayLabel.trim()) {
      messages.push('Location is required.');
    }
    if (!neededAt) messages.push('When you need help is required.');
    if (!endsAt) messages.push('An end time is required.');
    if (neededAt && endsAt && new Date(endsAt).getTime() <= new Date(neededAt).getTime()) {
      messages.push('End time must be after the start time.');
    }
    if (selectedChannelIds.length === 0 && selectedCommunityIds.length === 0) {
      messages.push('Choose at least one channel or community tag.');
    }
    if (roles.every((role) => !role.roleLabel.trim())) {
      messages.push('Add at least one role (for example, Driver).');
    }
    return messages;
  }

  function setRequestTitle(event: Event) {
    requestTitle = (event.currentTarget as HTMLInputElement).value;
  }

  function setBody(event: Event) {
    body = (event.currentTarget as HTMLTextAreaElement).value;
  }

  function setNeededAt(event: Event) {
    neededAt = (event.currentTarget as HTMLInputElement).value;
    if (!endsAt || new Date(endsAt).getTime() <= new Date(neededAt).getTime()) {
      endsAt = defaultEndsAt(neededAt);
    }
  }

  function setEndsAt(event: Event) {
    endsAt = (event.currentTarget as HTMLInputElement).value;
  }

  function setPrimaryTagType(event: Event) {
    primaryTagType = (event.currentTarget as HTMLSelectElement).value as 'channel' | 'community';
  }

  function setRoleLabel(index: number, event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    roles = roles.map((role, roleIndex) => (roleIndex === index ? { ...role, roleLabel: value } : role));
  }

  function setRoleDescription(index: number, event: Event) {
    const value = (event.currentTarget as HTMLTextAreaElement).value;
    roles = roles.map((role, roleIndex) => (roleIndex === index ? { ...role, description: value } : role));
  }

  function setRoleSlots(index: number, event: Event) {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    roles = roles.map((role, roleIndex) =>
      roleIndex === index ? { ...role, slots: Number.isFinite(value) ? value : 0 } : role
    );
  }

  async function updateTaggableScopes(
    primaryKind: 'channel' | 'community',
    primaryText: string,
    additionalChannelText: string,
    communityText: string
  ) {
    const lookupKey = `${primaryKind}|${primaryText.trim()}|${additionalChannelText.trim()}|${communityText.trim()}`;
    if (lookupKey === taggableLookupKey) return;
    taggableLookupKey = lookupKey;
    const requestId = ++taggableRequestId;

    try {
      const channelLookup = [primaryKind === 'channel' ? primaryText : '', additionalChannelText]
        .filter((value) => value.trim())
        .at(-1) ?? '';
      const communityLookup = primaryKind === 'community' ? primaryText : communityText;
      const results = await loadTaggableScopeOptions(channelLookup, communityLookup);
      if (requestId !== taggableRequestId) return;
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
      const option = channelSuggestionPool.find((item) => item.slug === slug) ?? scopeFallback(slug, 'channel');
      selectedChannelOptions = mergeScopeOptions(selectedChannelOptions, [option]);
      selectedChannelIds = [slug, ...selectedChannelIds.filter((value) => value !== slug)];
      primaryQuery = '';
      return;
    }
    const option = communitySuggestionPool.find((item) => item.slug === slug) ?? scopeFallback(slug, 'community');
    selectedCommunityOptionsCache = mergeScopeOptions(selectedCommunityOptionsCache, [option]);
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
    if (selectedChannelIds.includes(slug)) return;
    const option = channelSuggestionPool.find((item) => item.slug === slug) ?? scopeFallback(slug, 'channel');
    selectedChannelOptions = mergeScopeOptions(selectedChannelOptions, [option]);
    selectedChannelIds = [...selectedChannelIds, slug];
    additionalChannelQuery = '';
  }

  function removeAdditionalChannelTag(slug: string) {
    selectedChannelIds = selectedChannelIds.filter((value) => value !== slug);
  }

  function addCommunityTag(slug: string) {
    if (selectedCommunityIds.includes(slug)) return;
    const option = communitySuggestionPool.find((item) => item.slug === slug) ?? scopeFallback(slug, 'community');
    selectedCommunityOptionsCache = mergeScopeOptions(selectedCommunityOptionsCache, [option]);
    selectedCommunityIds = [...selectedCommunityIds, slug];
    communityQuery = '';
  }

  function removeCommunityTag(slug: string) {
    selectedCommunityIds = selectedCommunityIds.filter((value) => value !== slug);
  }

  function addRole() {
    roles = [...roles, { roleLabel: '', description: '', slots: 1 }];
  }

  function removeRole(index: number) {
    if (roles.length === 1) return;
    roles = roles.filter((_, roleIndex) => roleIndex !== index);
  }

  async function handleCreate() {
    validationMessages = buildValidationMessages();
    if (validationMessages.length > 0) {
      statusMessage = validationMessages[0] ?? 'Complete the required fields.';
      return;
    }

    isSubmitting = true;
    statusMessage = '';

    try {
      const result = await createHelpRequest({
        title: requestTitle.trim(),
        body: body.trim(),
        locationLabel: resolvedLocationLabel,
        locationId: resolvedLocationId,
        neededAt,
        endsAt,
        channelTags: previewChannelTags,
        communityTags: previewCommunityTags,
        roles: roles
          .filter((role) => role.roleLabel.trim())
          .map((role) => ({
            title: role.roleLabel.trim(),
            description: role.description.trim(),
            slots: Math.max(0, Number(role.slots) || 0)
          }))
      });

      if (!result.ok || !result.id) {
        statusMessage = result.error ?? 'The help request could not be created.';
        return;
      }

      await navigateAfterCreate(`/help-requests/${result.id}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Ask for help"
      description="Describe what you need, then review before publishing."
    >
      <CreateWizard
        steps={wizardSteps}
        bind:stepIndex
        {canContinue}
        {canSubmit}
        {isSubmitting}
        submitLabel="Publish help request"
        submittingLabel="Publishing…"
        on:submit={handleCreate}
      >
        <svelte:fragment slot="step" let:currentStep>
          {#if currentStep?.id === 'basics'}
            <div class="form-stack">
              <div class="field">
                <RequiredFieldLabel forId="help-request-title">Title</RequiredFieldLabel>
                <input
                  id="help-request-title"
                  name="requestTitle"
                  value={requestTitle}
                  on:input={setRequestTitle}
                  aria-required="true"
                  placeholder="e.g. Need a lift to the station"
                />
              </div>
              <div class="field">
                <RequiredFieldLabel forId="help-request-body">What do you need?</RequiredFieldLabel>
                <textarea
                  id="help-request-body"
                  name="body"
                  value={body}
                  on:input={setBody}
                  rows="4"
                  aria-required="true"
                  placeholder="Describe the one-off help needed."
                ></textarea>
              </div>
              <DirectUsePolicyNotice variant="request" context="help" />
            </div>
          {:else if currentStep?.id === 'location'}
            <div class="form-stack">
              <CreateLocationIntent
                bind:intent={locationIntent}
                bind:locationValue
                helperText="Help requests need a physical or online location so people know where to show up."
              />
              {#if locationIntent === 'later'}
                <p class="status-message">Choose physical or online before publishing. Decide later is not available for help requests.</p>
              {/if}
            </div>
          {:else if currentStep?.id === 'timing'}
            <div class="form-stack">
              <div class="field-grid">
                <div class="field">
                  <RequiredFieldLabel forId="help-request-needed-at">Start time</RequiredFieldLabel>
                  <input
                    id="help-request-needed-at"
                    name="neededAt"
                    value={neededAt}
                    on:input={setNeededAt}
                    aria-required="true"
                    type="datetime-local"
                  />
                </div>
                <div class="field">
                  <RequiredFieldLabel forId="help-request-ends-at">End time</RequiredFieldLabel>
                  <input
                    id="help-request-ends-at"
                    name="endsAt"
                    value={endsAt}
                    on:input={setEndsAt}
                    min={neededAt || undefined}
                    aria-required="true"
                    type="datetime-local"
                  />
                </div>
              </div>
            </div>
          {:else if currentStep?.id === 'scope'}
            <div class="form-stack">
              <div class="field">
                <RequiredFieldLabel forId="help-request-primary-tag-type">Primary tag type</RequiredFieldLabel>
                <select id="help-request-primary-tag-type" value={primaryTagType} on:change={setPrimaryTagType}>
                  <option value="channel">Channel</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <CreateScopeTagSelector
                label={primaryTagType === 'community' ? 'Primary community tag' : 'Primary channel tag'}
                placeholder={primaryTagType === 'community' ? 'Type to search communities' : 'Type to search channels'}
                helperText="Required. Help requests must be tagged like threads."
                bind:query={primaryQuery}
                selectedItems={primaryItems}
                suggestionItems={primaryTagType === 'community'
                  ? primaryCommunitySuggestions.map((option) => ({ key: option.slug, label: option.label }))
                  : primaryChannelSuggestions.map((option) => ({ key: option.slug, label: option.label }))}
                onAdd={addPrimaryTag}
                onRemove={removePrimaryTag}
                onCommitSingleSuggestion={commitSingleSuggestion}
              />
              <CreateScopeTagSelector
                label="Additional channel tags"
                placeholder="Type to add another channel"
                helperText="Optional."
                bind:query={additionalChannelQuery}
                selectedItems={additionalChannelItems}
                suggestionItems={additionalChannelSuggestions.map((option) => ({ key: option.slug, label: option.label }))}
                onAdd={addAdditionalChannelTag}
                onRemove={removeAdditionalChannelTag}
                onCommitSingleSuggestion={commitSingleSuggestion}
              />
              <CreateScopeTagSelector
                label="Additional community tags"
                placeholder="Type to add another community"
                helperText="Optional."
                bind:query={communityQuery}
                selectedItems={communityItems}
                suggestionItems={extraCommunitySuggestions.map((option) => ({ key: option.slug, label: option.label }))}
                onAdd={addCommunityTag}
                onRemove={removeCommunityTag}
                onCommitSingleSuggestion={commitSingleSuggestion}
              />
            </div>
          {:else if currentStep?.id === 'roles'}
            <section class="roles-block">
              <div class="roles-header">
                <RequiredFieldLabel>Roles needed</RequiredFieldLabel>
                <button class="ghost-button" type="button" on:click={addRole}>Add role</button>
              </div>
              {#each roles as role, index}
                <div class="role-card">
                  <div class="field">
                    <RequiredFieldLabel forId={`role-label-${index}`}>Role title</RequiredFieldLabel>
                    <input
                      id={`role-label-${index}`}
                      name={`roleLabel-${index}`}
                      value={role.roleLabel}
                      on:input={(event) => setRoleLabel(index, event)}
                      aria-required="true"
                      placeholder="e.g. Driver"
                    />
                  </div>
                  <div class="field">
                    <RequiredFieldLabel forId={`role-description-${index}`} required={false}>Role details</RequiredFieldLabel>
                    <textarea
                      id={`role-description-${index}`}
                      value={role.description}
                      on:input={(event) => setRoleDescription(index, event)}
                      rows="2"
                    ></textarea>
                  </div>
                  <div class="field">
                    <RequiredFieldLabel forId={`role-slots-${index}`}>Slots needed</RequiredFieldLabel>
                    <input
                      id={`role-slots-${index}`}
                      type="number"
                      min="0"
                      value={role.slots}
                      on:input={(event) => setRoleSlots(index, event)}
                      aria-required="true"
                    />
                  </div>
                  {#if roles.length > 1}
                    <button class="ghost-button danger" type="button" on:click={() => removeRole(index)}>Remove role</button>
                  {/if}
                </div>
              {/each}
            </section>
          {:else}
            <div class="form-stack overview">
              <button class="overview-row" type="button" on:click={() => (stepIndex = 0)}>
                <strong>Basics</strong>
                <span>{requestTitle.trim() || 'Untitled help request'}</span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = 1)}>
                <strong>Location</strong>
                <span>{previewLocationLabel}</span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = 2)}>
                <strong>Timing</strong>
                <span>{scheduleLabel}</span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = 3)}>
                <strong>Scope</strong>
                <span>
                  {selectedChannelIds.length} channels · {selectedCommunityIds.length} communities
                </span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = 4)}>
                <strong>Roles</strong>
                <span>
                  {roles.filter((role) => role.roleLabel.trim()).length || 0} roles
                </span>
              </button>
              {#if validationMessages.length > 0}
                <ul class="status-message-list">
                  {#each validationMessages as message}
                    <li>{message}</li>
                  {/each}
                </ul>
              {:else if statusMessage}
                <p class="status-message">{statusMessage}</p>
              {/if}
            </div>
          {/if}
        </svelte:fragment>
      </CreateWizard>
    </CreatePanel>
  </svelte:fragment>

  <svelte:fragment slot="secondary">
    <HelpRequestCard item={previewItem} />
  </svelte:fragment>
</CreateFlowLayout>

<style>
  .form-stack {
    display: grid;
    gap: 14px;
  }

  .field {
    display: grid;
    gap: 6px;
  }

  .field-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    .field-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .roles-block {
    display: grid;
    gap: 12px;
  }

  .roles-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .role-card {
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel-strong);
  }

  .ghost-button {
    border: 1px solid var(--panel-border);
    background: transparent;
    color: var(--text-main);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    cursor: pointer;
  }

  .ghost-button.danger {
    justify-self: start;
    color: var(--accent-warm-strong);
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

  .status-message,
  .status-message-list {
    margin: 0;
    color: var(--accent-warm-strong);
    font-size: 13px;
  }

  .status-message-list {
    padding-left: 18px;
  }
</style>
