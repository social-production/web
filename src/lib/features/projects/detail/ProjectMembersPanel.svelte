<script lang="ts">
  import PeopleSheet from '$lib/components/shared/PeopleSheet.svelte';
  import type { ProjectPageData } from '$lib/types/detail';
  import { trustBadges } from '$lib/utils/trustBadges';

  export let data: ProjectPageData;
  export let open = false;

  $: people = data.members.map((member) => ({
    id: member.id,
    username: member.username,
    profileImageUrl: member.profileImageUrl ?? null,
    badges: trustBadges(member.realR, member.bootstrapFloor),
  }));
</script>

<PeopleSheet
  {open}
  description="Members coordinate planning, updates, and activity together."
  emptyCopy="No members listed yet."
  {people}
  title="Project members"
  on:close
/>
