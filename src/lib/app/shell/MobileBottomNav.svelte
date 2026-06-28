<script lang="ts">
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import * as m from '$lib/paraglide/messages';

  export let viewerLoggedIn = false;
  export let notificationCount = 0;
  export let messageCount = 0;
  export let moreActive = false;
  export let isActive: (href: string) => boolean = () => false;
  export let onMore: () => void = () => {};

  $: tabs = [
    { id: 'public', href: '/', label: m.shell_nav_public(), icon: 'public' as const },
    {
      id: 'personal',
      href: viewerLoggedIn ? '/personal' : '/onboarding',
      label: m.shell_nav_personal(),
      icon: 'personal' as const
    },
    {
      id: 'notifications',
      href: viewerLoggedIn ? '/notifications' : '/onboarding',
      label: m.shell_nav_notifications(),
      icon: 'notifications' as const,
      badge: notificationCount
    },
    {
      id: 'messages',
      href: viewerLoggedIn ? '/messages' : '/onboarding',
      label: m.shell_nav_messages(),
      icon: 'messages' as const,
      badge: messageCount
    }
  ];
</script>

<nav aria-label="Primary mobile" class="mobile-bottom-nav">
  {#each tabs as tab}
    <a
      class:active-link={isActive(tab.href)}
      class="bottom-nav-item"
      href={tab.href}
    >
      <span class="bottom-nav-icon" aria-hidden="true">
        {#if tab.icon === 'public'}
          <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" fill="currentColor" /></svg>
        {:else if tab.icon === 'personal'}
          <svg viewBox="0 0 24 24"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-7 9a7 7 0 1 1 14 0H5Z" fill="currentColor" /></svg>
        {:else if tab.icon === 'notifications'}
          <svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z" fill="currentColor" /></svg>
        {:else}
          <svg viewBox="0 0 24 24"><path d="M4 4h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" fill="currentColor" /></svg>
        {/if}
      </span>
      <span class="bottom-nav-label">{tab.label}</span>
      {#if tab.badge && tab.badge > 0}
        <CountBadge count={tab.badge} />
      {/if}
    </a>
  {/each}

  <button
    class="bottom-nav-item"
    class:active-link={moreActive}
    aria-expanded={moreActive}
    aria-haspopup="dialog"
    type="button"
    on:click={onMore}
  >
    <span class="bottom-nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M5 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm7 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm7 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm7 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm7 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" /></svg>
    </span>
    <span class="bottom-nav-label">More</span>
  </button>
</nav>

<style>
  .mobile-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 55;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 2px;
    min-height: var(--shell-bottom-nav-base);
    padding: 4px var(--shell-safe-right) calc(4px + var(--shell-safe-bottom)) var(--shell-safe-left);
    border-top: 1px solid var(--panel-border);
    background: color-mix(in srgb, var(--toolbar-background) 92%, transparent);
    backdrop-filter: blur(10px);
  }

  .bottom-nav-item {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 2px;
    min-height: var(--shell-touch-min);
    padding: 4px 2px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    font-size: 10px;
    font-weight: 700;
    text-align: center;
    transition: color 0.16s ease, background-color 0.16s ease;
  }

  .bottom-nav-icon {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
  }

  .bottom-nav-icon :global(svg) {
    width: 20px;
    height: 20px;
  }

  .bottom-nav-label {
    line-height: 1.1;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bottom-nav-item.active-link {
    color: var(--brand-strong);
    background: var(--brand-soft);
  }

  .bottom-nav-item :global(.count-badge) {
    position: absolute;
    top: 2px;
    right: calc(50% - 22px);
  }
</style>
