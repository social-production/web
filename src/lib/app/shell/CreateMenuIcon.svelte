<script lang="ts">
  import type { CreateMenuIconId } from '$lib/app/shell/createMenuItems';
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  export let icon: CreateMenuIconId;

  const iconMap: Record<CreateMenuIconId, SurfaceIconId> = {
    post: 'post',
    thread: 'thread',
    'help-request': 'help-request',
    project: 'project',
    event: 'event',
    community: 'community',
    channel: 'channel'
  };
</script>

<span class="create-menu-icon-wrap">
  <SurfaceIcon icon={iconMap[icon]} className="create-menu-icon" />
</span>

<style>
  .create-menu-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .create-menu-icon-wrap :global(.create-menu-icon) {
    color: var(--brand-strong);
  }
</style>
