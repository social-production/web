<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';

  export let username: string;
  export let profileImageUrl: string | null = null;
  export let action = '';
</script>

<div class="identity">
  {#if action}
    <p class="action-note">{action}</p>
  {/if}
  <div class="identity-row">
    <AvatarBadge size="sm" {username} imageUrl={profileImageUrl} />
    <a class="header-name" href={`/profile/${username}`} title={username}>{username}</a>
  </div>
</div>

<style>
  .identity {
    display: grid;
    gap: 6px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .identity-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .action-note {
    margin: 0 0 0 calc(34px + 0.6rem + 10px);
    overflow: hidden;
    color: color-mix(in srgb, var(--text-soft) 78%, transparent);
    font-family: ui-monospace, 'SFMono-Regular', 'Cascadia Code', Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 450;
    letter-spacing: 0.01em;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-name {
    overflow: hidden;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 800;
    line-height: 1.2;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
