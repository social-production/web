<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import ReportControl from '$lib/components/shared/ReportControl.svelte';
  import ModerationRestrictionNotice from '$lib/components/shared/ModerationRestrictionNotice.svelte';
  import SignalEngagementButtons from '$lib/components/shared/SignalEngagementButtons.svelte';
  import SurfaceTypeLabel from '$lib/components/cards/shared/SurfaceTypeLabel.svelte';
  import TagList from '$lib/components/cards/shared/TagList.svelte';
  import MembershipSplitButton from '$lib/components/shared/MembershipSplitButton.svelte';
  import ProposeEditSheet from '$lib/components/shared/ProposeEditSheet.svelte';
  import AddUpdateSheet from '$lib/components/shared/AddUpdateSheet.svelte';
  import ContentMetaRow from '$lib/components/shared/ContentMetaRow.svelte';
  import VoteDockControl from '$lib/components/shared/VoteDockControl.svelte';
  import DetailActionDock from '$lib/features/detail/DetailActionDock.svelte';
  import {
    requestEventEdit,
    requestEventUpdate,
    shareEventWithUser,
    toggleEventMembership
  } from '$lib/services/commands/events';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import type { DetailMember, EventPageData, ProjectApprovalVote } from '$lib/types/detail';
  import type { PendingVoteItem } from '$lib/utils/pendingVotes';
  import type { SignalToggleResult } from '$lib/types/feed';
  import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';
  import { formatLocalDateTime } from '$lib/utils/time';
  import { requireViewer } from '$lib/utils/requireViewer';
  import { buildSharePrefill, buildShareUrl } from '$lib/utils/sharePrefill';
  import { invalidateEventDetail } from '$lib/utils/detailInvalidation';

  let {
    data,
    signalChange = undefined,
    onMembershipChange = undefined,
    showMembersPanel = false,
    onToggleMembers = undefined,
    actionsActive = false,
    detailVotes = [],
    onDetailVote = undefined,
    onDetailAssess = undefined,
    openVoteKind = null,
    openVoteId = null
  }: {
    data: EventPageData;
    signalChange?: (result: SignalToggleResult) => void;
    onMembershipChange?: (next: { viewerIsMember: boolean; memberCount: number }) => void;
    showMembersPanel?: boolean;
    onToggleMembers?: () => void;
    actionsActive?: boolean;
    detailVotes?: PendingVoteItem[];
    onDetailVote?: (item: PendingVoteItem, vote: ProjectApprovalVote | null) => void | Promise<void>;
    onDetailAssess?: (item: PendingVoteItem) => void | Promise<void>;
    openVoteKind?: string | null;
    openVoteId?: string | null;
  } = $props();

  let liveShareContacts = $state<DetailMember[]>([]);
  let draftEditTitle = $state('');
  let draftEditDescription = $state('');
  let showEditComposer = $state(false);
  let editPending = $state(false);
  let editMessage = $state('');
  let showUpdateComposer = $state(false);
  let draftUpdateBody = $state('');
  let updatePending = $state(false);
  let updateMessage = $state('');

  async function searchShareContacts(query: string): Promise<DetailMember[]> {
    try {
      const results = await getMessageContacts(query, 8);
      liveShareContacts = results.map((contact) => ({
        id: contact.id,
        username: contact.username,
        bio: contact.bio ?? '',
        profileImageUrl: contact.profileImageUrl ?? null
      }));
      return liveShareContacts;
    } catch {
      liveShareContacts = [];
      return [];
    }
  }

  const combinedTags = $derived([...data.channelTags, ...data.communityTags]);
  const isOrganizerControlled = $derived(data.governance === 'organizer_controlled');
  const signalSummary = $derived(data.lifecycle.phaseOne?.signalSummary ?? null);
  const canSignal = $derived(
    !isOrganizerControlled &&
      Boolean(signalSummary) &&
      (data.lifecycle.phaseOne.viewerCanSignalDemand || data.lifecycle.phaseOne.viewerCanSignalOpposition)
  );
  const timeLabel = $derived(
    data.scheduledAt
      ? formatLocalDateTime(data.scheduledAt)
      : isImplementedScheduleLabel(data.timeLabel)
        ? data.timeLabel.trim()
        : ''
  );
  const locationLabel = $derived(
    isImplementedScheduleLabel(data.locationLabel) ? data.locationLabel.trim() : ''
  );
  const controlLabel = $derived(
    data.isPrivate
      ? isOrganizerControlled
        ? 'Organizer-controlled'
        : 'Collaborative'
      : null
  );
  const memberButtonLabel = $derived(data.isPrivate ? 'Members / Editors' : 'Members');
  const initialViewerSignal = $derived(
    data.lifecycle.phaseOne.viewerHasDemandSignal
      ? 'demand'
      : data.lifecycle.phaseOne.viewerHasOppositionSignal
        ? 'opposition'
        : null
  );
  const canProposeEdit = $derived(data.viewerCanRequestEdit);
  const canProposeUpdate = $derived(data.viewerCanRequestUpdate);
  const latestUpdate = $derived(data.updates[0] ?? null);

  async function handleMembershipToggle() {
    if (!requireViewer($page.data.bootstrap?.viewer, 'Sign in to join this event.')) {
      return;
    }

    const wasMember = data.viewerIsMember;
    const previousCount = data.memberCount;
    onMembershipChange?.({
      viewerIsMember: !wasMember,
      memberCount: previousCount + (wasMember ? -1 : 1)
    });

    try {
      await toggleEventMembership(data.slug);
      void invalidateEventDetail(data.slug);
    } catch {
      onMembershipChange?.({
        viewerIsMember: wasMember,
        memberCount: previousCount
      });
    }
  }

  async function handleEventShare(username: string) {
    const result = await shareEventWithUser(data.slug, username);

    if (result.ok) {
      void invalidateEventDetail(data.slug);
    }

    return result;
  }

  async function handleCreatePostFromEvent() {
    const params = new URLSearchParams({
      prefill: buildSharePrefill(data.title, `/events/${data.slug}`)
    });
    await goto(`/create/post?${params.toString()}`);
  }

  function toggleEditComposer() {
    showEditComposer = !showEditComposer;

    if (showEditComposer) {
      editMessage = '';
      draftEditTitle = data.title;
      draftEditDescription = data.description;
      showUpdateComposer = false;
    }
  }

  function toggleUpdateComposer() {
    showUpdateComposer = !showUpdateComposer;
    if (showUpdateComposer) {
      updateMessage = '';
      showEditComposer = false;
    }
  }

  async function submitUpdate() {
    if (!draftUpdateBody.trim()) {
      updateMessage = 'Write an update before submitting.';
      return;
    }

    updatePending = true;
    updateMessage = '';

    try {
      await requestEventUpdate(data.slug, draftUpdateBody);
      draftUpdateBody = '';
      showUpdateComposer = false;
      void invalidateEventDetail(data.slug);
    } catch {
      updateMessage = 'This update request could not be submitted. Reload and try again.';
    } finally {
      updatePending = false;
    }
  }

  async function submitEdit() {
    if (!draftEditTitle.trim() || !draftEditDescription.trim()) {
      editMessage = 'Add both a title and description before submitting.';
      return;
    }

    editPending = true;
    editMessage = '';

    try {
      await requestEventEdit(data.slug, draftEditTitle, draftEditDescription);
      showEditComposer = false;
      void invalidateEventDetail(data.slug);
    } catch {
      editMessage = 'This edit request could not be submitted. Reload and try again.';
    } finally {
      editPending = false;
    }
  }
</script>

<div class="context-panel">
  <div class="type-row overview-type-row">
    <div class="header-row">
      <div class="chips">
        <SurfaceTypeLabel kind="event" />
        <span class="meta-note">· {data.isPrivate ? 'Private' : 'Public'}</span>
        {#if controlLabel}
          <span class="meta-note">· {controlLabel}</span>
        {/if}
        <ReportControl
          hasActiveReport={Boolean(data.report)}
          isUnderReview={data.moderationState === 'under_review' || data.report?.resolution === 'under_review' || data.report?.resolution === 'open'}
          itemLabel="event"
          moderationState={data.moderationState}
          report={data.report}
          ownerUsername={data.createdByUsername}
          subjectId={data.id}
          targetId={data.id}
          targetType="event"
        />
      </div>
      <div class="header-tags">
        <TagList tags={combinedTags} maxVisible={1} />
      </div>
    </div>
  </div>

  <div class="heading overview-heading">
    <div class="identity-row">
      <div class="identity-copy">
        <ModerationRestrictionNotice active={data.moderationState === 'hidden' || data.report?.resolution === 'hidden'}>
          <h1>{data.title}</h1>
        </ModerationRestrictionNotice>
        {#if timeLabel}
          <p class="live-fact">{timeLabel}</p>
        {/if}
        {#if locationLabel}
          <p class="live-fact">{locationLabel}</p>
        {/if}
        <p class="overview-copy">{data.description}</p>
        {#if latestUpdate}
          <p class="overview-update">Update: {latestUpdate.body}</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="context-meta">
    <ContentMetaRow authorUsername={data.createdByUsername} createdAt={data.createdAt} />
  </div>
</div>

<DetailActionDock active={actionsActive}>
  <div class="context-dock">
    {#if canSignal && signalSummary}
      <div id="participation-signals" class="signal-row">
        <SignalEngagementButtons
          entityKind="event"
          slug={data.slug}
          syncKey={data.id}
          supportCount={signalSummary?.demandCount ?? 0}
          opposeCount={signalSummary?.oppositionCount ?? 0}
          viewerSignal={initialViewerSignal}
          canSignalDemand={data.lifecycle.phaseOne.viewerCanSignalDemand}
          canSignalOpposition={data.lifecycle.phaseOne.viewerCanSignalOpposition}
          {signalChange}
        />
      </div>
    {/if}

    <div class="control-actions">
      {#if !$page.data.bootstrap?.viewer}
        <a class="guest-signin" href="/onboarding">Sign in</a>
      {/if}
      <MembershipSplitButton
        joined={data.viewerIsMember}
        count={data.memberCount}
        canToggle={data.viewerCanToggleMembership}
        canOpenMembers={true}
        membersOpen={showMembersPanel}
        joinAriaLabel={data.viewerIsMember ? 'Leave event' : 'Join event'}
        membersAriaLabel={memberButtonLabel}
        onToggleJoin={handleMembershipToggle}
        onOpenMembers={() => onToggleMembers?.()}
      />

      <VoteDockControl
        items={detailVotes}
        sheetId="event-detail-votes"
        revealKind={openVoteKind}
        revealId={openVoteId}
        onVote={(item, vote) => onDetailVote?.(item, vote)}
        onAssess={(item) => onDetailAssess?.(item)}
      />

      {#if data.viewerCanShare}
        <ShareUserMenu
          buttonLabel={data.isPrivate ? 'Invite +' : 'Share +'}
          contacts={liveShareContacts.length > 0 ? liveShareContacts : data.shareContacts}
          menuTitle={data.isPrivate ? 'Invite to event' : 'Share event'}
          placeholder="Search people"
          submitLabel={data.isPrivate ? 'Invite' : 'Share'}
          submitShare={handleEventShare}
          searchContacts={searchShareContacts}
          createPost={data.isPrivate ? null : handleCreatePostFromEvent}
          createPostLabel="Create post"
          copyLinkUrl={buildShareUrl(`/events/${data.slug}`)}
        />
      {/if}

      {#if canProposeEdit}
        <button
          type="button"
          class="quiet-control"
          class:open={showEditComposer}
          aria-expanded={showEditComposer}
          onclick={toggleEditComposer}
        >
          Edit
        </button>
      {/if}
      {#if canProposeUpdate}
        <button
          type="button"
          class="quiet-control"
          class:open={showUpdateComposer}
          aria-expanded={showUpdateComposer}
          onclick={toggleUpdateComposer}
        >
          Update
        </button>
      {/if}
    </div>
  </div>
</DetailActionDock>

<ProposeEditSheet
  bind:open={showEditComposer}
  bind:title={draftEditTitle}
  bind:description={draftEditDescription}
  message={editMessage}
  pending={editPending}
  sheetTitle="Propose Edit"
  submitLabel="Propose Edit"
  titlePlaceholder="Event title"
  descriptionPlaceholder="Describe the event and what members should know..."
  labelledById="event-propose-edit-sheet"
  onSubmit={submitEdit}
/>

<AddUpdateSheet
  bind:open={showUpdateComposer}
  bind:body={draftUpdateBody}
  message={updateMessage}
  pending={updatePending}
  sheetTitle="Post an update"
  submitLabel="Propose"
  placeholder="Share what changed for this event..."
  labelledById="event-add-update-sheet"
  onSubmit={submitUpdate}
/>

<style>
  .context-panel {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
  }

  .type-row,
  .heading,
  .header-row,
  .chips {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    min-width: 0;
  }

  .type-row,
  .heading {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .heading {
    flex: 1 1 auto;
    margin-top: 16px;
    padding-bottom: 12px;
  }

  .identity-row {
    display: grid;
    min-width: 0;
  }

  .identity-copy {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .header-row {
    justify-content: space-between;
    align-items: center;
    flex-wrap: nowrap;
    gap: 8px;
  }

  .chips {
    min-width: 0;
    flex: 0 1 auto;
    flex-wrap: nowrap;
    align-items: center;
  }

  .header-tags {
    margin-left: auto;
    min-width: 0;
    flex: 1 1 0;
    overflow: hidden;
    display: flex;
    justify-content: flex-end;
  }

  .header-tags :global(.tag-list) {
    min-width: 0;
    max-width: 100%;
    flex-wrap: nowrap;
    overflow: hidden;
  }

  .header-tags :global(.scope-chip) {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  .header-tags :global(.tag-overflow-btn) {
    flex: 0 0 auto;
  }

  .meta-note {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  :global(.report-control) {
    flex: 0 0 auto;
  }

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    color: var(--text-main);
    overflow-wrap: break-word;
  }

  @media (max-width: 760px) {
    h1 {
      font-size: clamp(18px, 5.4vw, 24px);
    }
  }

  .live-fact {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .context-dock {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    min-width: 0;
  }

  .control-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 0;
    width: 100%;
  }

  .control-actions > .guest-signin,
  .control-actions > :global(.quiet-control),
  .control-actions > :global(.membership-split),
  .control-actions > :global(.share-shell),
  .control-actions > :global(.vote-dock) {
    display: flex;
    flex: 1 1 0;
    align-items: stretch;
    justify-content: center;
    box-sizing: border-box;
    width: 0;
    min-width: 72px;
    max-width: 100%;
    padding: 0;
    border: 0;
    border-radius: 0;
    border-right: 1px solid var(--panel-border);
  }

  .control-actions > :global(:last-child) {
    border-right: 0;
  }

  .control-actions > :global(.quiet-control) {
    align-items: center;
    height: 44px;
    line-height: 1;
  }

  .quiet-control,
  .control-actions :global(.share-button),
  .control-actions :global(.membership-join),
  .control-actions :global(.membership-count) {
    width: auto;
    min-width: 0;
    min-height: 44px;
    flex: 1 1 auto;
    border: 0;
    border-radius: 0;
  }

  .signal-row + .control-actions {
    border-top: 1px solid var(--panel-border);
  }

  .quiet-control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 0;
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .quiet-control.open,
  .quiet-control:hover,
  .quiet-control:focus-visible {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .control-actions :global(.membership-split),
  .control-actions :global(.share-shell) {
    display: flex;
    overflow: hidden;
    border-radius: 0;
  }

  .control-actions > .guest-signin {
    align-items: center;
    background: var(--brand);
    color: var(--page-bg);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  .control-actions :global(.membership-join) {
    width: auto;
    flex: 1 1 auto;
  }

  .control-actions :global(.membership-join),
  .control-actions :global(.membership-count) {
    min-height: 44px;
    border-radius: 0;
    font-size: 13px;
  }

  .control-actions :global(.membership-join:not(.joined)) {
    background: var(--brand);
    color: var(--page-bg);
  }

  .control-actions :global(.membership-join:not(.joined):hover:not(:disabled)),
  .control-actions :global(.membership-join:not(.joined):focus-visible) {
    background: color-mix(in srgb, var(--brand) 78%, white);
    color: var(--page-bg);
    filter: none;
    transform: none;
  }

  .control-actions :global(.share-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0 8px;
    border: 0;
    border-radius: 0;
    font-size: 13px;
  }

  .context-meta {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    min-width: 0;
    margin-top: auto;
    padding-top: 12px;
  }

  .context-meta :global(.content-meta-row) {
    margin-left: auto;
    max-width: 100%;
  }

  .signal-row {
    display: flex;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
  }

  .signal-row :global(.signal-strip.labeled) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: stretch;
    width: 100%;
    height: 100%;
    gap: 0;
    border-radius: 0;
  }

  .signal-row :global(.signal-strip.labeled .vote-button) {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 44px;
    align-self: stretch;
    border: 0;
    border-radius: 0;
    font-size: 14px;
  }

  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button),
  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:hover:not(:disabled)),
  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:focus),
  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:focus-visible) {
    background: var(--brand);
    color: var(--page-bg);
  }

  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child),
  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child:hover:not(:disabled)),
  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child:focus),
  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child:focus-visible) {
    background: var(--danger);
    color: white;
  }

  .signal-row :global(.signal-strip.labeled:has(.active-support) .vote-button),
  .signal-row :global(.signal-strip.labeled:has(.active-oppose) .vote-button),
  .signal-row :global(.signal-strip.labeled:has(.active-support) .vote-button:hover:not(:disabled)),
  .signal-row :global(.signal-strip.labeled:has(.active-oppose) .vote-button:hover:not(:disabled)),
  .signal-row :global(.signal-strip.labeled:has(.active-support) .vote-button:focus),
  .signal-row :global(.signal-strip.labeled:has(.active-oppose) .vote-button:focus),
  .signal-row :global(.signal-strip.labeled:has(.active-support) .vote-button:focus-visible),
  .signal-row :global(.signal-strip.labeled:has(.active-oppose) .vote-button:focus-visible) {
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .signal-row :global(.signal-strip.labeled .vote-button:not(.active-support):not(.active-oppose) .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button:not(.active-support):not(.active-oppose) .signal-count),
  .signal-row :global(.signal-strip.labeled .vote-button:not(.active-support):not(.active-oppose):hover:not(:disabled) .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button:not(.active-support):not(.active-oppose):hover:not(:disabled) .signal-count),
  .signal-row :global(.signal-strip.labeled .vote-button:not(.active-support):not(.active-oppose):focus .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button:not(.active-support):not(.active-oppose):focus .signal-count) {
    color: inherit;
  }

  .signal-row :global(.signal-strip.labeled .vote-button.active-support),
  .signal-row :global(.signal-strip.labeled .vote-button.active-support:hover:not(:disabled)),
  .signal-row :global(.signal-strip.labeled .vote-button.active-support:focus),
  .signal-row :global(.signal-strip.labeled .vote-button.active-support:focus-visible) {
    background: var(--panel-strong);
    color: #22c55e;
  }

  .signal-row :global(.signal-strip.labeled .vote-button.active-support .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button.active-support .signal-count),
  .signal-row :global(.signal-strip.labeled .vote-button.active-support:hover:not(:disabled) .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button.active-support:hover:not(:disabled) .signal-count),
  .signal-row :global(.signal-strip.labeled .vote-button.active-support:focus .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button.active-support:focus .signal-count) {
    color: #22c55e;
  }

  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose),
  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose:hover:not(:disabled)),
  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose:focus),
  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose:focus-visible) {
    background: var(--panel-strong);
    color: #ef4444;
  }

  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose .signal-count),
  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose:hover:not(:disabled) .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose:hover:not(:disabled) .signal-count),
  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose:focus .signal-label),
  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose:focus .signal-count) {
    color: #ef4444;
  }

  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:first-child:hover:not(:disabled)) {
    background: color-mix(in srgb, var(--brand) 78%, white);
    color: var(--page-bg);
    filter: none;
    transform: none;
  }

  .signal-row :global(.signal-strip.labeled:not(:has(.active-support)):not(:has(.active-oppose)) .vote-button:last-child:hover:not(:disabled)) {
    background: color-mix(in srgb, var(--danger) 78%, white);
    color: white;
    filter: none;
    transform: none;
  }

  .signal-row :global(.signal-strip.labeled:is(:has(.active-support), :has(.active-oppose)) .vote-button:not(.active-support):not(.active-oppose):hover:not(:disabled)) {
    background: var(--brand-soft);
    color: var(--brand-strong);
    filter: none;
    transform: none;
  }

  .signal-row :global(.signal-strip.labeled .vote-button.active-support:hover:not(:disabled)) {
    background: color-mix(in srgb, #22c55e 18%, var(--panel-strong));
    color: #22c55e;
    filter: none;
    transform: none;
  }

  .signal-row :global(.signal-strip.labeled .vote-button.active-oppose:hover:not(:disabled)) {
    background: color-mix(in srgb, #ef4444 18%, var(--panel-strong));
    color: #ef4444;
    filter: none;
    transform: none;
  }

  .signal-row :global(.signal-strip.labeled .signal-percent) {
    display: flex;
    align-items: center;
    align-self: stretch;
    justify-content: center;
    height: 100%;
    min-width: 72px;
    min-height: 44px;
    padding: 0 18px;
    border-right: 1px solid var(--panel-border);
    border-left: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    pointer-events: none;
    cursor: default;
    user-select: none;
  }

  .overview-copy {
    margin: 0;
    max-width: 78ch;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 500;
    line-height: 1.55;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }

  .overview-update {
    margin: 0;
    max-width: 78ch;
    color: var(--text-soft);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }

  #participation-signals {
    scroll-margin-top: 120px;
  }

  @media (max-width: 760px) {
    .header-row {
      align-items: center;
      flex-wrap: nowrap;
    }
  }
</style>
