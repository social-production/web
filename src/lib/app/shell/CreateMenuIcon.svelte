<script lang="ts">
  import type { CreateMenuIconId } from '$lib/app/shell/createMenuItems';
  import GroupsIcon from '$lib/components/shared/GroupsIcon.svelte';

  export let icon: CreateMenuIconId;
</script>

{#if icon === 'community'}
  <GroupsIcon className="create-menu-icon groups-icon" />
{:else}
  <svg aria-hidden="true" viewBox="0 0 24 24" class="create-menu-icon">
    {#if icon === 'post'}
      <path
        d="M6 5.5h12a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 16.5H10l-4 3v-3H6A1.5 1.5 0 0 1 4.5 12V7A1.5 1.5 0 0 1 6 5.5Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    {:else if icon === 'thread'}
      <path d="M5 6h14M5 12h10M5 18h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
    {:else if icon === 'help-request'}
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path
        d="M9.5 9.2a2.7 2.7 0 1 1 4.8 1.6c-.8.5-1.3 1.1-1.3 2.2M12 17.2h.01"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        fill="none"
      />
    {:else if icon === 'project'}
      <path d="M5 8.5 12 4l7 4.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M9.5 19v-6h5v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
    {:else if icon === 'event'}
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
    {:else}
      <path d="M8 7.5h8M8 12h8M8 16.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
      <path d="M6.5 5.5h11A2.5 2.5 0 0 1 20 8v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18V8a2.5 2.5 0 0 1 2.5-2.5Z" fill="none" stroke="currentColor" stroke-width="1.8" />
    {/if}
  </svg>
{/if}

<style>
  .create-menu-icon {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    color: var(--brand-strong);
  }
</style>
