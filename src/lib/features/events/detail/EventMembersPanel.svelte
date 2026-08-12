<script lang="ts">
  import MemberListPanel from '$lib/components/shared/MemberListPanel.svelte';
  import { invalidateEventDetail } from '$lib/utils/detailInvalidation';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import { grantEventEditAccess, revokeEventEditAccess, shareEventWithUser } from '$lib/services/commands/events';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import type { EventPageData, EventRoleMember, DetailMember } from '$lib/types/detail';

  export let data: EventPageData;
  export let panelId = 'event-members-panel';

  let editorActionPendingId: string | null = null;
  let liveInviteContacts: DetailMember[] = [];

  function isCreator(member: EventRoleMember) {
    return member.username === data.createdByUsername;
  }

  async function handleGrantEditAccess(userId: string) {
    editorActionPendingId = userId;

    try {
      await grantEventEditAccess(data.slug, userId);
      await invalidateEventDetail(data.slug);
    } finally {
      editorActionPendingId = null;
    }
  }

  async function handleRevokeEditAccess(userId: string) {
    editorActionPendingId = userId;

    try {
      await revokeEventEditAccess(data.slug, userId);
      await invalidateEventDetail(data.slug);
    } finally {
      editorActionPendingId = null;
    }
  }

  async function handleInvite(username: string) {
    const result = await shareEventWithUser(data.slug, username);
    if (result.ok) {
      await invalidateEventDetail(data.slug);
    }
    return result;
  }

  async function searchInviteContacts(query: string): Promise<DetailMember[]> {
    try {
      const results = await getMessageContacts(query, 8);
      const memberNames = new Set([
        ...data.eventEditors.map((member) => member.username.toLowerCase()),
        ...data.members.map((member) => member.username.toLowerCase())
      ]);
      liveInviteContacts = results
        .filter((contact) => !memberNames.has(contact.username.toLowerCase()))
        .map((contact) => ({
          id: contact.id,
          username: contact.username,
          bio: contact.bio ?? ''
        }));
      return liveInviteContacts;
    } catch {
      liveInviteContacts = [];
      return [];
    }
  }

  $: isOrganizerControlled = data.governance === 'organizer_controlled';
  $: isCollaborativePrivate = data.isPrivate && !isOrganizerControlled;
  $: primaryHeading = data.isPrivate ? 'Organizers' : 'Event members';
  $: primaryCopy = isOrganizerControlled
    ? 'Organizers can invite people, promote organizers, create activities, and manage event decisions directly.'
    : isCollaborativePrivate
      ? 'Organizers can invite people. Members can still propose values, plans, activities, and lifecycle decisions.'
      : 'Public event members can propose and vote on lifecycle, update, and detail decisions.';
  $: secondaryHeading = 'Members';
  $: secondaryCopy = isOrganizerControlled
    ? 'Members can attend and sign up for activity roles. Promote a member to organizer when they should help manage the event.'
    : isCollaborativePrivate
      ? 'Members can propose, vote, attend, and sign up for roles. Only organizers can invite people.'
      : 'Everyone who joined the event stays visible here so the event surface matches the actual member group.';

  $: sections = data.isPrivate
    ? [
        {
          title: primaryHeading,
          description: primaryCopy,
          emptyCopy: 'No organizers yet.',
          members: data.eventEditors.map((member) => ({
            id: member.id,
            username: member.username,
            badges: isCreator(member) ? ['Creator', 'Organizer'] : ['Organizer'],
            actionLabel:
              data.viewerCanManageEditors && !isCreator(member) ? 'Remove organizer' : undefined,
            actionKind:
              data.viewerCanManageEditors && !isCreator(member) ? 'revoke' : undefined,
            actionTone: 'danger' as const,
            actionDisabled: editorActionPendingId === member.id
          }))
        },
        {
          title: secondaryHeading,
          description: secondaryCopy,
          emptyCopy: 'No additional members have joined yet.',
          members: data.members.map((member) => ({
            id: member.id,
            username: member.username,
            actionLabel: data.viewerCanManageEditors ? 'Promote to organizer' : undefined,
            actionKind: data.viewerCanManageEditors ? 'grant' : undefined,
            actionDisabled: editorActionPendingId === member.id
          }))
        }
      ]
    : [
        {
          emptyCopy: 'No one has joined this event yet.',
          members: data.members.map((member) => ({
            id: member.id,
            username: member.username,
            badges: isCreator(member) ? ['Creator'] : undefined
          }))
        }
      ];

  async function handleMemberAction(event: CustomEvent<{ memberId: string; actionKind: string }>) {
    if (event.detail.actionKind === 'grant') {
      await handleGrantEditAccess(event.detail.memberId);
      return;
    }

    if (event.detail.actionKind === 'revoke') {
      await handleRevokeEditAccess(event.detail.memberId);
    }
  }
</script>

<MemberListPanel
  description={isOrganizerControlled
    ? 'Invite people and promote organizers from this panel. Members join to attend and sign up for roles.'
    : isCollaborativePrivate
      ? 'Invite people and promote organizers from this panel. Members can still propose and vote inside this private audience.'
      : data.isPrivate
        ? 'Invite people and promote organizers from this panel. Creators already have full organizer authority.'
        : 'Public event members can propose and vote on update and detail edit decisions.'}
  on:action={handleMemberAction}
  {panelId}
  {sections}
  title={data.isPrivate ? 'People' : 'Event members'}
>
  <svelte:fragment slot="actions">
    {#if data.isPrivate && data.viewerCanShare}
      <ShareUserMenu
        buttonLabel="Invite +"
        contacts={liveInviteContacts.length > 0 ? liveInviteContacts : data.shareContacts}
        menuTitle="Invite to event"
        placeholder="Search people"
        submitLabel="Invite"
        submitShare={handleInvite}
        searchContacts={searchInviteContacts}
      />
    {/if}
  </svelte:fragment>
</MemberListPanel>
