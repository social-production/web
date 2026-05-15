<script lang="ts">
  import MemberListPanel from '$lib/components/shared/MemberListPanel.svelte';
  import type { ProjectPageData } from '$lib/types/detail';

  export let data: ProjectPageData;
  export let panelId = 'project-members-panel';

  $: sections = [
    {
      emptyCopy: 'No members listed yet.',
      members: data.members.map((member) => ({
        id: member.id,
        username: member.username
      }))
    }
  ];
</script>

<MemberListPanel
  description="Members coordinate planning, updates, and activity together."
  {panelId}
  {sections}
  title="Project members"
/>
