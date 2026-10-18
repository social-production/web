<script lang="ts">
  import { page } from '$app/stores';
  import PeopleSheet, {
    type PeopleSheetPerson,
    type PeopleSheetSection,
  } from '$lib/components/shared/PeopleSheet.svelte';
  import { getScopeMembers } from '$lib/services/queries/scopes';
  import type { ScopeKind, ScopeMemberEntry } from '$lib/types/scope';

  export let open = false;
  export let kind: ScopeKind;
  export let slug: string;
  export let title = '';

  const STANDING_LABEL: Record<ScopeMemberEntry['standing'], string> = {
    full: 'Full member',
    warm: 'Warming up',
    new: 'New',
    paused: 'Paused',
  };

  let members: ScopeMemberEntry[] = [];
  let loading = false;
  let failed = false;
  let loadedFor = '';

  $: key = `${kind}:${slug}`;
  $: if (open && loadedFor !== key) void load(key);

  async function load(target: string) {
    loadedFor = target;
    loading = true;
    failed = false;
    try {
      members = await getScopeMembers(kind, slug);
    } catch {
      failed = true;
      members = [];
      loadedFor = '';
    } finally {
      loading = false;
    }
  }

  $: viewerName = $page.data.bootstrap?.viewer?.username ?? null;

  function toPerson(member: ScopeMemberEntry): PeopleSheetPerson {
    const badges = [
      member.username === viewerName ? 'You' : null,
      member.role === 'manager' ? 'Organizer' : null,
      STANDING_LABEL[member.standing],
    ].filter((badge): badge is string => Boolean(badge));
    return {
      id: member.id,
      username: member.username,
      profileImageUrl: member.profileImageUrl,
      badges,
    };
  }

  $: emptyCopy = loading
    ? 'Loading members…'
    : failed
      ? 'Could not load members.'
      : 'No members yet.';
  $: organizers = members.filter((member) => member.role === 'manager');
  $: full = members.filter((member) => member.standing === 'full');
  $: warming = members.filter((member) => member.standing === 'new' || member.standing === 'warm');
  $: paused = members.filter((member) => member.standing === 'paused');
  // Until the first load lands, show one plain list rather than tabs that all read 0.
  $: sections = (
    loading && members.length === 0
      ? [{ emptyCopy, members: [] }]
      : [
          { title: 'All', emptyCopy, members: members.map(toPerson) },
          ...(organizers.length
            ? [
                {
                  title: 'Organizers',
                  emptyCopy: 'No organizers.',
                  members: organizers.map(toPerson),
                },
              ]
            : []),
          { title: 'Full', emptyCopy: 'No full members yet.', members: full.map(toPerson) },
          { title: 'New', emptyCopy: 'No one is warming up.', members: warming.map(toPerson) },
          ...(paused.length
            ? [{ title: 'Paused', emptyCopy: 'No paused accounts.', members: paused.map(toPerson) }]
            : []),
        ]
  ) satisfies PeopleSheetSection[];
</script>

<PeopleSheet
  bind:open
  title={members.length
    ? `${members.length} ${members.length === 1 ? 'member' : 'members'}`
    : 'Members'}
  description={`People in ${title}. Full members' votes count fully; new accounts warm up first.`}
  {sections}
  sectionLayout="tabs"
  searchPlaceholder="Search members"
  on:close={() => (loadedFor = '')}
/>
