<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';

  export let username: string;
  export let profileImageUrl: string | null = null;
  export let action = '';
</script>

<div class="identity">
  <AvatarBadge size="sm" {username} imageUrl={profileImageUrl} />
  <div class="identity-copy">
    {#if action}
      <p class="action-note">{action}</p>
    {/if}
    <a class="header-name" href={`/profile/${username}`} title={username}>{username}</a>
  </div>
</div>

<style>
  .identity {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 34px;
  }

  .identity-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    min-width: 0;
    min-height: 34px;
  }

  .action-note {
    margin: 0;
    transform: translateY(-3px);
    overflow: hidden;
    color: color-mix(in srgb, var(--text-soft) 78%, transparent);
    font-family: ui-monospace, 'SFMono-Regular', 'Cascadia Code', Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 450;
    letter-spacing: 0.01em;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-name {
    overflow: hidden;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 800;
    line-height: 1.05;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
