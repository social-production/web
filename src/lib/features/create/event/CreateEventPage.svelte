<script lang="ts">
  import { page } from '$app/stores';
  import EventCard from '$lib/components/cards/public-feed/EventCard.svelte';
  import DirectUsePolicyNotice from '$lib/components/shared/DirectUsePolicyNotice.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import TimePicker from '$lib/components/shared/TimePicker.svelte';
  import CreateScopeTagSelector from '$lib/features/create/shared/CreateScopeTagSelector.svelte';
  import { commitSingleSuggestion, mergeScopeOptions } from '$lib/features/create/shared/createFormActions';
  import { loadTaggableScopeOptions } from '$lib/features/create/shared/taggableScopes';
  import CreateEventVisibilityPanel from '$lib/features/create/event/components/CreateEventVisibilityPanel.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreateLocationIntent from '$lib/features/create/shared/CreateLocationIntent.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import CreateWizard from '$lib/features/create/shared/CreateWizard.svelte';
  import {
    createDraftPlanPhase,
    createEventPlanForm,
    eventPlanScheduleFromForm,
    type EventPlanForm
  } from '$lib/features/events/detail/lifecycle/eventLifecycleShared';
  import { createEvent } from '$lib/services/commands/create';
  import type { ScopeDirectoryItem, ViewerSummary } from '$lib/types/bootstrap';
  import type { EventAudience, EventGovernance, PublicEventItem, TagKind, TagRef } from '$lib/types/feed';
  import { emptyLocationPickerValue, type LocationPickerValue } from '$lib/types/locationPicker';
  import {
    applyScopePrefillToSelections,
    readScopePrefillFromSearchParams
  } from '$lib/utils/createScopePrefill';
  import {
    eventScheduleBounds,
    eventScheduleIsValid,
    eventScheduleStartsInFuture
  } from '$lib/utils/eventSchedule';
  import { navigateAfterCreate } from '$lib/utils/navigateAfterCreate';
  import { getMessageContacts } from '$lib/services/queries/inbox';

  type AudienceScopeItem = ScopeDirectoryItem & {
    visibility?: 'public' | 'private';
  };

  type WizardStep = { id: string; title: string };

  let title = '';
  let description = '';
  let selectedAudience: EventAudience = 'public';
  let selectedChannelIds: string[] = [];
  let selectedCommunityIds: string[] = [];
  let invitedUsernames: string[] = [];
  let editorUsernames: string[] = [];
  let selectedGovernance: 'collaborative' | 'organizer_controlled' = 'organizer_controlled';
  let locationIntent: 'physical' | 'online' | 'later' = 'later';
  let locationValue: LocationPickerValue = emptyLocationPickerValue();
  let planForm: EventPlanForm = createEventPlanForm();
  let stepIndex = 0;
  let channelQuery = '';
  let communityQuery = '';
  let peopleQuery = '';
  let editorQuery = '';
  let statusMessage = '';
  let isSubmitting = false;
  let channelSuggestionPool: AudienceScopeItem[] = [];
  let communitySuggestionPool: AudienceScopeItem[] = [];
  let selectedChannelOptions: AudienceScopeItem[] = [];
  let selectedCommunityOptionsCache: AudienceScopeItem[] = [];
  let taggableLookupKey = '';
  let taggableRequestId = 0;
  let appliedScopePrefillKey = '';
  let peopleSuggestionPool: ViewerSummary[] = [];
  let peopleSearchRequestId = 0;
  let peopleSearchTimer: ReturnType<typeof setTimeout> | null = null;

  async function refreshPeopleSuggestions(query: string) {
    const requestId = ++peopleSearchRequestId;
    try {
      const results = await getMessageContacts(query, 12);
      if (requestId !== peopleSearchRequestId) {
        return;
      }
      peopleSuggestionPool = results;
    } catch {
      if (requestId !== peopleSearchRequestId) {
        return;
      }
      if (peopleSuggestionPool.length === 0) {
        peopleSuggestionPool = ($page.data.bootstrap?.suggestedContacts ?? []) as ViewerSummary[];
      }
    }
  }

  function schedulePeopleSuggestions(query: string) {
    if (typeof window === 'undefined') {
      return;
    }
    if (peopleSearchTimer) {
      clearTimeout(peopleSearchTimer);
    }
    peopleSearchTimer = setTimeout(() => {
      void refreshPeopleSuggestions(query);
    }, 180);
  }

  $: schedulePeopleSuggestions(peopleQuery.trim() || editorQuery.trim());
  $: if (
    peopleSuggestionPool.length === 0 &&
    ($page.data.bootstrap?.suggestedContacts?.length ?? 0) > 0
  ) {
    peopleSuggestionPool = ($page.data.bootstrap?.suggestedContacts ?? []) as ViewerSummary[];
  }

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
  $: selectedCommunityOptions = allCommunityOptions.filter((option) =>
    selectedCommunityIds.includes(option.slug)
  );
  $: privateCommunity =
    selectedAudience === 'private_community' &&
    selectedCommunityOptions.length === 1 &&
    selectedCommunityOptions[0]?.visibility === 'private'
      ? selectedCommunityOptions[0]
      : null;
  $: isPrivate = selectedAudience !== 'public';
  $: audience = selectedAudience;
  $: governance = (
    audience === 'public' ? 'collaborative' : selectedGovernance
  ) as EventGovernance;
  $: requiresUpfrontPlan = isPrivate && governance === 'organizer_controlled';

  $: wizardSteps = (
    requiresUpfrontPlan
      ? [
          { id: 'basics', title: 'Basics' },
          { id: 'audience', title: 'Audience' },
          { id: 'scope', title: 'Who' },
          { id: 'control', title: 'Control' },
          { id: 'location', title: 'Location' },
          { id: 'plan', title: 'Plan' },
          { id: 'overview', title: 'Overview' }
        ]
      : isPrivate
        ? [
            { id: 'basics', title: 'Basics' },
            { id: 'audience', title: 'Audience' },
            { id: 'scope', title: 'Who' },
            { id: 'control', title: 'Control' },
            { id: 'location', title: 'Location' },
            { id: 'overview', title: 'Overview' }
          ]
        : [
            { id: 'basics', title: 'Basics' },
            { id: 'audience', title: 'Audience' },
            { id: 'scope', title: 'Tags' },
            { id: 'location', title: 'Location' },
            { id: 'overview', title: 'Overview' }
          ]
  ) as WizardStep[];

  $: if (stepIndex >= wizardSteps.length) {
    stepIndex = Math.max(0, wizardSteps.length - 1);
  }

  $: publicEventNeedsTag =
    audience === 'public' && selectedChannelIds.length === 0 && selectedCommunityIds.length === 0;
  $: privateCommunityNeedsSelection =
    audience === 'private_community' &&
    (selectedCommunityIds.length !== 1 || !privateCommunity);
  $: normalizedChannelQuery = channelQuery.trim().toLowerCase();
  $: normalizedCommunityQuery = communityQuery.trim().toLowerCase();
  $: normalizedPeopleQuery = peopleQuery.trim().toLowerCase();
  $: normalizedEditorQuery = editorQuery.trim().toLowerCase();
  $: channelSuggestions = normalizedChannelQuery
    ? channelSuggestionPool
        .filter((option) => matchesQuery(option, normalizedChannelQuery))
        .filter((option) => !selectedChannelIds.includes(option.slug))
        .slice(0, 6)
    : [];
  $: communitySuggestions = normalizedCommunityQuery
    ? communitySuggestionPool
        .filter((option) => matchesQuery(option, normalizedCommunityQuery))
        .filter((option) => option.visibility === 'private' || audience === 'public')
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
  $: editorSuggestions = normalizedEditorQuery
    ? peopleSuggestionPool
        .filter((contact: ViewerSummary) =>
          contact.username.toLowerCase().includes(normalizedEditorQuery)
        )
        .filter((contact: ViewerSummary) => !editorUsernames.includes(contact.username))
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
  $: selectedEditorItems = editorUsernames.map((username) => ({ key: username, label: username }));
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
  $: editorSuggestionItems = editorSuggestions.map((contact: ViewerSummary) => ({
    key: contact.username,
    label: contact.username
  }));

  $: if (locationIntent === 'physical' && locationValue.displayLabel.trim()) {
    planForm = { ...planForm, locationLabel: locationValue.displayLabel.trim(), locationId: locationValue.locationId };
  } else if (locationIntent === 'online') {
    planForm = { ...planForm, locationLabel: 'Online', locationId: null, locationIsOnline: true };
  }

  function validatePrivatePlan(form: EventPlanForm) {
    const schedule = eventPlanScheduleFromForm(form);
    const scheduleBounds = eventScheduleBounds(schedule);
    const validationMessages: string[] = [];
    const hasStartTime = !!form.startTimeLabel.trim();
    const hasFinishTime = !!form.finishTimeLabel.trim();
    const hasRequiredScheduleDates =
      schedule.mode === 'date'
        ? !!schedule.startDate
        : schedule.mode === 'range'
          ? !!schedule.startDate && !!schedule.endDate
          : false;
    const hasAnyCompleteStage = form.planPhases.some(
      (phase) => !!phase.title.trim() && !!phase.details.trim()
    );
    const hasPartialStage = form.planPhases.some(
      (phase) =>
        (!!phase.title.trim() || !!phase.details.trim()) &&
        !(!!phase.title.trim() && !!phase.details.trim())
    );

    if (!form.title.trim()) {
      validationMessages.push('Add a plan title.');
    }
    if (!form.description.trim()) {
      validationMessages.push('Add a plan description.');
    }
    if (!form.locationLabel.trim() && locationIntent === 'physical') {
      validationMessages.push('Add a location for the event plan.');
    }
    if (form.scheduleMode === 'date' && !schedule.startDate) {
      validationMessages.push('Choose the event date.');
    }
    if (form.scheduleMode === 'range' && (!schedule.startDate || !schedule.endDate)) {
      validationMessages.push('Choose both the start date and end date.');
    }
    if (!hasStartTime) {
      validationMessages.push('Choose a start time.');
    }
    if (!hasFinishTime) {
      validationMessages.push('Choose a finish time.');
    }
    if (hasRequiredScheduleDates && hasStartTime && hasFinishTime) {
      if (!eventScheduleIsValid(schedule) || !scheduleBounds.start || !scheduleBounds.end) {
        validationMessages.push('Finish must be after the event start.');
      } else if (!eventScheduleStartsInFuture(schedule)) {
        validationMessages.push('Event plans cannot start in the past.');
      }
    }
    if (!hasAnyCompleteStage) {
      validationMessages.push('Add at least one stage with both a title and details.');
    } else if (hasPartialStage) {
      validationMessages.push('Finish every stage you start.');
    }

    return { schedule, validationMessages };
  }

  $: planValidation = requiresUpfrontPlan
    ? validatePrivatePlan(planForm)
    : { schedule: null, validationMessages: [] as string[] };
  $: canContinuePlan = planValidation.validationMessages.length === 0;

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
          'Describe the event, who it is for, and what should happen.',
        isPrivate,
        stage: requiresUpfrontPlan
          ? 'Activity'
          : 'Proposal',
        channelTags: selectedScopeTags(selectedChannelIds, allChannelOptions, 'channel'),
        communityTags: selectedScopeTags(selectedCommunityIds, allCommunityOptions, 'community'),
        createdByUsername: viewer.username,
        timeLabel: planForm.startTimeLabel.trim() || '',
        locationLabel:
          locationIntent === 'online'
            ? 'Online'
            : locationIntent === 'physical'
              ? locationValue.displayLabel.trim() || 'Physical location'
              : 'Location TBD',
        voteCount: 0,
        activeVote: 0,
        supportCount: 0,
        opposeCount: 0,
        favorability: null,
        viewerSignal: null,
        commentCount: 0,
        memberCount: 1 + invitedUsernames.length,
        lastActivityAt: new Date().toISOString()
      } satisfies PublicEventItem)
    : null;

  $: canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !publicEventNeedsTag &&
    !privateCommunityNeedsSelection &&
    (audience !== 'invite_only' || invitedUsernames.length > 0) &&
    (locationIntent !== 'physical' || Boolean(locationValue.displayLabel.trim())) &&
    (!requiresUpfrontPlan || canContinuePlan);

  $: canContinueBasics = title.trim().length > 0 && description.trim().length > 0;
  $: canContinueScope =
    !publicEventNeedsTag &&
    !privateCommunityNeedsSelection &&
    (audience !== 'invite_only' || invitedUsernames.length > 0);
  $: canContinueLocation =
    locationIntent !== 'physical' || Boolean(locationValue.displayLabel.trim());
  $: canContinue =
    wizardSteps[stepIndex]?.id === 'basics'
      ? canContinueBasics
      : wizardSteps[stepIndex]?.id === 'scope'
        ? canContinueScope
        : wizardSteps[stepIndex]?.id === 'location'
          ? canContinueLocation
          : wizardSteps[stepIndex]?.id === 'plan'
            ? canContinuePlan
            : true;

  async function handleCreate() {
    isSubmitting = true;
    statusMessage = '';

    try {
      const privatePlan = requiresUpfrontPlan ? validatePrivatePlan(planForm) : null;
      if (privatePlan && privatePlan.validationMessages.length > 0) {
        statusMessage = privatePlan.validationMessages[0];
        return;
      }

      const result = await createEvent({
        title,
        description,
        isPrivate,
        audience,
        governance,
        homeCommunitySlug: privateCommunity?.slug ?? null,
        channelTags: selectedScopeTags(selectedChannelIds, allChannelOptions, 'channel'),
        communityTags: selectedScopeTags(selectedCommunityIds, allCommunityOptions, 'community'),
        invitedUsernames,
        editorUsernames: isPrivate ? editorUsernames : [],
        locationLabel:
          locationIntent === 'online'
            ? 'Online'
            : locationIntent === 'physical'
              ? locationValue.displayLabel.trim()
              : 'TBD',
        locationId: locationIntent === 'physical' ? locationValue.locationId : null,
        timeLabel: requiresUpfrontPlan ? planForm.startTimeLabel.trim() || 'TBD' : 'TBD',
        planTitle: requiresUpfrontPlan ? planForm.title.trim() : undefined,
        planDescription: requiresUpfrontPlan ? planForm.description.trim() : undefined,
        schedulePayload: requiresUpfrontPlan && privatePlan
          ? (privatePlan.schedule as unknown as Record<string, unknown>)
          : undefined,
        planPayload: requiresUpfrontPlan
          ? {
              planPhases: planForm.planPhases
                .filter((phase) => phase.title.trim() && phase.details.trim())
                .map((phase) => ({
                  title: phase.title.trim(),
                  details: phase.details.trim()
                }))
            }
          : undefined
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The event could not be created.';
        return;
      }

      await navigateAfterCreate(`/events/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
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
    if (selectedAudience === 'private_community') {
      selectedCommunityIds = [slug];
    } else if (!selectedCommunityIds.includes(slug)) {
      selectedCommunityIds = [...selectedCommunityIds, slug];
    }

    const option = communitySuggestionPool.find((item) => item.slug === slug);
    if (option) {
      selectedCommunityOptionsCache = mergeScopeOptions(selectedCommunityOptionsCache, [option]);
    }
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

  function addEditor(username: string) {
    if (editorUsernames.includes(username)) {
      return;
    }
    editorUsernames = [...editorUsernames, username];
    if (!invitedUsernames.includes(username) && selectedAudience === 'invite_only') {
      invitedUsernames = [...invitedUsernames, username];
    }
    editorQuery = '';
  }

  function removeEditor(username: string) {
    editorUsernames = editorUsernames.filter((value) => value !== username);
  }

  function addPlanPhase() {
    planForm = { ...planForm, planPhases: [...planForm.planPhases, createDraftPlanPhase()] };
  }

  function removePlanPhase(index: number) {
    if (planForm.planPhases.length <= 1) {
      return;
    }
    planForm = {
      ...planForm,
      planPhases: planForm.planPhases.filter((_, phaseIndex) => phaseIndex !== index)
    };
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

  function overviewStepIndex(stepId: string) {
    return wizardSteps.findIndex((step) => step.id === stepId);
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Create event"
      description="Choose audience first, then fill the sections that apply."
    >
      <CreateWizard
        steps={wizardSteps}
        bind:stepIndex
        {canContinue}
        {canSubmit}
        {isSubmitting}
        submitLabel="Create Event"
        on:submit={handleCreate}
      >
        <svelte:fragment slot="step" let:currentStep>
          {#if currentStep?.id === 'basics'}
            <div class="form-stack">
              <label>
                <RequiredFieldLabel>Event title</RequiredFieldLabel>
                <input bind:value={title} aria-required="true" />
              </label>
              <label>
                <RequiredFieldLabel>Description</RequiredFieldLabel>
                <textarea bind:value={description} rows="4" aria-required="true"></textarea>
              </label>
              <DirectUsePolicyNotice variant="create" context="event" />
            </div>
          {:else if currentStep?.id === 'audience'}
            <CreateEventVisibilityPanel
              bind:audience={selectedAudience}
              {governance}
              bind:selectedGovernance
              mode="audience"
            />
          {:else if currentStep?.id === 'control'}
            <CreateEventVisibilityPanel
              audience={selectedAudience}
              {governance}
              bind:selectedGovernance
              mode="control"
              privateCommunityLabel={privateCommunity?.label ?? null}
              inviteeCount={invitedUsernames.length}
            />
          {:else if currentStep?.id === 'location'}
            <CreateLocationIntent bind:intent={locationIntent} bind:locationValue />
          {:else if currentStep?.id === 'scope'}
            <div class="form-stack">
              {#if audience === 'public'}
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
                {#if publicEventNeedsTag}
                  <p class="status-note">Public events need at least one channel or community tag.</p>
                {/if}
              {:else if audience === 'private_community'}
                <CreateScopeTagSelector
                  label="Private community"
                  bind:query={communityQuery}
                  placeholder="Type to choose one private community"
                  helperText="Pick exactly one private community. Its members can discover this event."
                  selectedItems={selectedCommunityItems}
                  suggestionItems={communitySuggestionItems}
                  onAdd={addCommunityTag}
                  onRemove={removeCommunityTag}
                  onCommitSingleSuggestion={commitSingleSuggestion}
                />
                {#if privateCommunityNeedsSelection}
                  <p class="status-note">Choose one private community.</p>
                {/if}
                <CreateScopeTagSelector
                  label="Organizers (optional)"
                  bind:query={editorQuery}
                  placeholder="People with organizer authority"
                  helperText={governance === 'organizer_controlled'
                    ? 'You keep full organizer authority. Chosen organizers can invite people, create activities, and manage event decisions.'
                    : 'You keep full organizer authority. Chosen organizers can invite people; members can still create activities, plans, and proposals.'}
                  selectedItems={selectedEditorItems}
                  suggestionItems={editorSuggestionItems}
                  onAdd={addEditor}
                  onRemove={removeEditor}
                  onCommitSingleSuggestion={commitSingleSuggestion}
                />
              {:else}
                <CreateScopeTagSelector
                  label="Invite people"
                  bind:query={peopleQuery}
                  placeholder="Type to add people"
                  helperText="Invitees can join and take part once the event is underway."
                  selectedItems={selectedInviteeItems}
                  suggestionItems={peopleSuggestionItems}
                  onAdd={addPerson}
                  onRemove={removePerson}
                  onCommitSingleSuggestion={commitSingleSuggestion}
                />
                <CreateScopeTagSelector
                  label="Organizers (optional)"
                  bind:query={editorQuery}
                  placeholder="People with organizer authority"
                  helperText={governance === 'organizer_controlled'
                    ? 'You keep full organizer authority. Chosen organizers can invite people, create activities, and manage event decisions; other invitees can only attend and sign up.'
                    : 'You keep full organizer authority. Chosen organizers can invite people; other invitees can create activities, plans, and proposals, but only organizers can invite.'}
                  selectedItems={selectedEditorItems}
                  suggestionItems={editorSuggestionItems}
                  onAdd={addEditor}
                  onRemove={removeEditor}
                  onCommitSingleSuggestion={commitSingleSuggestion}
                />
                {#if invitedUsernames.length === 0}
                  <p class="status-note">Invite at least one person for invite-only events.</p>
                {/if}
              {/if}
            </div>
          {:else if currentStep?.id === 'plan'}
            <div class="form-stack plan-step">
              <p class="helper-text">
                Organizer-controlled private events skip signals, values, and proposal votes. Set the
                plan now so the event can start in Activity. Members can still join and sign up for
                roles once activities exist.
              </p>
              <label>
                <RequiredFieldLabel>Plan title</RequiredFieldLabel>
                <input bind:value={planForm.title} aria-required="true" />
              </label>
              <label>
                <RequiredFieldLabel>Plan description</RequiredFieldLabel>
                <textarea bind:value={planForm.description} rows="3" aria-required="true"></textarea>
              </label>
              <fieldset class="schedule-fieldset">
                <legend>Schedule</legend>
                <div class="schedule-mode-row" role="radiogroup" aria-label="Schedule mode">
                  <label class="schedule-mode-option" class:active={planForm.scheduleMode === 'date'}>
                    <input type="radio" bind:group={planForm.scheduleMode} value="date" />
                    Single date
                  </label>
                  <label class="schedule-mode-option" class:active={planForm.scheduleMode === 'range'}>
                    <input type="radio" bind:group={planForm.scheduleMode} value="range" />
                    Date range
                  </label>
                </div>
                <div class="schedule-fields" class:is-range={planForm.scheduleMode === 'range'}>
                  {#if planForm.scheduleMode === 'date'}
                    <label>
                      <RequiredFieldLabel>Date</RequiredFieldLabel>
                      <input type="date" bind:value={planForm.scheduledDate} />
                    </label>
                  {:else}
                    <label>
                      <RequiredFieldLabel>Start date</RequiredFieldLabel>
                      <input type="date" bind:value={planForm.rangeStartDate} />
                    </label>
                    <label>
                      <RequiredFieldLabel>End date</RequiredFieldLabel>
                      <input type="date" bind:value={planForm.rangeEndDate} />
                    </label>
                  {/if}
                </div>
                <div class="schedule-fields is-range">
                  <label>
                    <RequiredFieldLabel>Start time</RequiredFieldLabel>
                    <TimePicker bind:value={planForm.startTimeLabel} />
                  </label>
                  <label>
                    <RequiredFieldLabel>Finish time</RequiredFieldLabel>
                    <TimePicker bind:value={planForm.finishTimeLabel} />
                  </label>
                </div>
              </fieldset>
              <div class="stages">
                <div class="stages-header">
                  <div>
                    <strong>Plan stages</strong>
                    <p class="stages-helper">Break the plan into ordered stages people can follow.</p>
                  </div>
                  <button type="button" class="secondary-button" on:click={addPlanPhase}>Add stage</button>
                </div>
                {#each planForm.planPhases as phase, index}
                  <div class="stage-card">
                    <div class="stage-card-header">
                      <strong>Stage {index + 1}</strong>
                      {#if planForm.planPhases.length > 1}
                        <button type="button" class="remove-stage" on:click={() => removePlanPhase(index)}>
                          Remove
                        </button>
                      {/if}
                    </div>
                    <label>
                      <RequiredFieldLabel>Title</RequiredFieldLabel>
                      <input bind:value={phase.title} />
                    </label>
                    <label>
                      <RequiredFieldLabel>Details</RequiredFieldLabel>
                      <textarea bind:value={phase.details} rows="2"></textarea>
                    </label>
                  </div>
                {/each}
              </div>
              {#if planValidation.validationMessages.length > 0}
                <ul class="validation-list">
                  {#each planValidation.validationMessages as message}
                    <li>{message}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          {:else}
            <div class="form-stack overview">
              <button class="overview-row" type="button" on:click={() => (stepIndex = overviewStepIndex('basics'))}>
                <strong>Basics</strong>
                <span>{title.trim() || 'Untitled event'}</span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = overviewStepIndex('audience'))}>
                <strong>Audience</strong>
                <span>{audience.replace('_', ' ')}</span>
              </button>
              <button class="overview-row" type="button" on:click={() => (stepIndex = overviewStepIndex('scope'))}>
                <strong>{audience === 'public' ? 'Tags' : 'Who'}</strong>
                <span>
                  {#if audience === 'public'}
                    {selectedChannelIds.length} channels · {selectedCommunityIds.length} communities
                  {:else if audience === 'private_community'}
                    {privateCommunity?.label ?? 'No community'}{#if isPrivate && editorUsernames.length}
                      · {editorUsernames.length} organizers{/if}
                  {:else}
                    {invitedUsernames.length} invites{#if isPrivate && editorUsernames.length}
                      · {editorUsernames.length} organizers{/if}
                  {/if}
                </span>
              </button>
              {#if isPrivate}
                <button class="overview-row" type="button" on:click={() => (stepIndex = overviewStepIndex('control'))}>
                  <strong>Control</strong>
                  <span>{governance === 'collaborative' ? 'Collaborative' : 'Organizer-controlled'}</span>
                </button>
              {/if}
              <button class="overview-row" type="button" on:click={() => (stepIndex = overviewStepIndex('location'))}>
                <strong>Location</strong>
                <span>
                  {locationIntent === 'online'
                    ? 'Online'
                    : locationIntent === 'physical'
                      ? locationValue.displayLabel.trim() || 'Physical'
                      : 'Decide later'}
                </span>
              </button>
              {#if requiresUpfrontPlan}
                <button class="overview-row" type="button" on:click={() => (stepIndex = overviewStepIndex('plan'))}>
                  <strong>Plan</strong>
                  <span>{planForm.title.trim() || 'Untitled plan'} · {planForm.planPhases.length} stages</span>
                </button>
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
    <CreatePanel
      title="Live preview"
      description={requiresUpfrontPlan
        ? 'Organizer-controlled private events start in Activity once the plan is set. Members join and sign up for roles; organizers manage the plan and activities.'
        : isPrivate
          ? 'Collaborative private events follow the same signals → values → plans flow as public events.'
          : 'Shows how the proposal will appear before schedule details are finalized.'}
      surface="transparent"
    >
      {#if previewItem}
        <EventCard item={previewItem} />
      {/if}
    </CreatePanel>
  </svelte:fragment>
</CreateFlowLayout>

<style>
  .form-stack {
    display: grid;
    gap: 12px;
  }

  .helper-text {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }

  .plan-step {
    gap: 14px;
  }

  .schedule-fieldset {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: 10px;
  }

  .schedule-mode-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .schedule-mode-option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 94%, transparent);
    cursor: pointer;
  }

  .schedule-mode-option.active {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-weight: 600;
  }

  .schedule-mode-option input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .schedule-fields {
    display: grid;
    gap: 10px;
  }

  .schedule-fields.is-range {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stages,
  .stage-card {
    display: grid;
    gap: 10px;
  }

  .stages-header,
  .stage-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .stages-helper {
    margin: 4px 0 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  .secondary-button,
  .remove-stage {
    font: inherit;
    cursor: pointer;
  }

  .secondary-button {
    flex-shrink: 0;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .stage-card,
  .overview-row {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--panel) 94%, transparent);
  }

  .overview-row {
    gap: 4px;
    text-align: left;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }

  .overview-row span,
  .remove-stage {
    color: var(--text-soft);
    font-size: 13px;
  }

  .remove-stage {
    border: 0;
    background: transparent;
    padding: 0;
  }

  @media (max-width: 640px) {
    .schedule-fields.is-range {
      grid-template-columns: 1fr;
    }
  }

  .validation-list,
  .status-note {
    margin: 0;
    color: var(--danger, #c0392b);
  }

  .validation-list {
    padding-left: 18px;
  }
</style>
