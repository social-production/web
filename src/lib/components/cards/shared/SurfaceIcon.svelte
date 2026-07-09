<script lang="ts">
  import GroupsIcon from '$lib/components/shared/GroupsIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  export let icon: SurfaceIconId;
  export let size: 'sm' | 'md' = 'md';
  export let className = '';

  $: dimension = size === 'sm' ? '16px' : '18px';
</script>

{#if icon === 'community'}
  <GroupsIcon className={`surface-icon ${size === 'sm' ? 'sm' : ''} ${className}`.trim()} />
{:else}
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    class={`surface-icon ${className}`.trim()}
    style={`width: ${dimension}; height: ${dimension};`}
  >
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
    {:else if icon === 'help-request' || icon === 'feedback'}
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
    {:else if icon === 'channel'}
      <path d="M8 7.5h8M8 12h8M8 16.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
      <path d="M6.5 5.5h11A2.5 2.5 0 0 1 20 8v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18V8a2.5 2.5 0 0 1 2.5-2.5Z" fill="none" stroke="currentColor" stroke-width="1.8" />
    {:else if icon === 'platform'}
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path
        d="M4.5 12h15M12 3.5a14.5 14.5 0 0 1 0 17M12 3.5a14.5 14.5 0 0 0 0 17"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    {:else}
      <path d="M8 7.5h8M8 12h8M8 16.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
      <path d="M6.5 5.5h11A2.5 2.5 0 0 1 20 8v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18V8a2.5 2.5 0 0 1 2.5-2.5Z" fill="none" stroke="currentColor" stroke-width="1.8" />
    {/if}
  </svg>
{/if}

<style>
  :global(.surface-icon) {
    flex: 0 0 auto;
    color: var(--text-soft);
  }

  :global(.groups-icon.surface-icon) {
    width: 18px;
    height: 18px;
  }

  :global(.groups-icon.surface-icon.sm) {
    width: 16px;
    height: 16px;
  }
</style>
