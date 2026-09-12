<script lang="ts">
  import PeopleSheet from '$lib/components/shared/PeopleSheet.svelte';
  import type { ProjectPageData } from '$lib/types/detail';

  export let data: ProjectPageData;
  export let open = false;

  $: people = data.members.map((member) => ({
    id: member.id,
    username: member.username,
    profileImageUrl: member.profileImageUrl ?? null
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
