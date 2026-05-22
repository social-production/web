<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import MemberListPanel from '$lib/components/shared/MemberListPanel.svelte';
  import { grantEventEditAccess, revokeEventEditAccess } from '$lib/services/queries/details';
  import type { EventPageData, EventRoleMember } from '$lib/types/detail';

  export let data: EventPageData;
  export let panelId = 'event-members-panel';

  let editorActionPendingId: string | null = null;

  function isCreator(member: EventRoleMember) {
    return member.username === data.createdByUsername;
  }

  async function handleGrantEditAccess(userId: string) {
    editorActionPendingId = userId;

    try {
      await grantEventEditAccess(data.slug, userId);
      await invalidateAll();
    } finally {
      editorActionPendingId = null;
    }
  }

  async function handleRevokeEditAccess(userId: string) {
    editorActionPendingId = userId;

    try {
      await revokeEventEditAccess(data.slug, userId);
      await invalidateAll();
    } finally {
      editorActionPendingId = null;
    }
  }

  $: primaryHeading = data.isPrivate ? 'Event editors' : 'Event members';
  $: primaryCopy = data.isPrivate
    ? 'Private events keep change decisions with the creator and any members the creator promotes to editor.'
    : 'Public event members can propose and vote on lifecycle, update, and detail decisions.';
  $: secondaryHeading = 'Other members';
  $: secondaryCopy = data.isPrivate
    ? 'Members can attend normally, and the creator can grant edit access when they need help managing decisions.'
    : 'Everyone who joined the event stays visible here so the event surface matches the actual member group.';

  $: sections = data.isPrivate
    ? [
        {
          title: primaryHeading,
          description: primaryCopy,
          emptyCopy: 'No editors are assigned yet.',
          members: data.eventEditors.map((member) => ({
            id: member.id,
            username: member.username,
            badges: isCreator(member) ? ['Creator', 'Can edit'] : ['Can edit'],
            actionLabel: data.viewerCanManageEditors && !isCreator(member) ? 'Remove edit access' : undefined,
            actionKind: data.viewerCanManageEditors && !isCreator(member) ? 'revoke' : undefined,
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
            actionLabel: data.viewerCanManageEditors ? 'Grant edit access' : undefined,
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
  description={data.isPrivate
    ? 'Private events keep change decisions with the creator and any members the creator promotes to editor.'
    : 'Public event members can propose and vote on update and detail edit decisions.'}
  on:action={handleMemberAction}
  {panelId}
  {sections}
  title="Event members"
/>