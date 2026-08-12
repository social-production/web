<script lang="ts">
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import * as m from '$lib/paraglide/messages';

  export let viewerLoggedIn = false;
  export let notificationCount = 0;
  export let messageCount = 0;
  export let moreActive = false;
  export let collapsed = false;
  export let isActive: (href: string) => boolean = () => false;
  export let onMore: () => void = () => {};

  $: tabs = [
    { id: 'public', href: '/', label: m.shell_nav_public(), icon: 'globe' as const },
    {
      id: 'personal',
      href: viewerLoggedIn ? '/personal' : '/onboarding',
      label: m.shell_nav_personal(),
      icon: 'user' as const
    },
    {
      id: 'notifications',
      href: viewerLoggedIn ? '/notifications' : '/onboarding',
      label: m.shell_nav_notifications(),
      icon: 'bell' as const,
      badge: notificationCount
    },
    {
      id: 'messages',
      href: viewerLoggedIn ? '/messages' : '/onboarding',
      label: m.shell_nav_messages(),
      icon: 'message' as const,
      badge: messageCount
    }
  ];
</script>

<nav
  aria-label="Primary mobile"
  class="mobile-bottom-nav"
  class:chrome-collapsed={collapsed}
  aria-hidden={collapsed}
>
  {#each tabs as tab}
    <a
      aria-label={tab.label}
      class:active-link={isActive(tab.href)}
      class="bottom-nav-item"
      href={tab.href}
    >
      <span class="bottom-nav-icon" aria-hidden="true">
        <FeedToolbarIcon name={tab.icon} />
      </span>
      {#if tab.badge && tab.badge > 0}
        <CountBadge count={tab.badge} />
      {/if}
    </a>
  {/each}

  <button
    aria-label="More"
    class="bottom-nav-item"
    class:active-link={moreActive}
    aria-expanded={moreActive}
    aria-haspopup="dialog"
    type="button"
    on:click={onMore}
  >
    <span class="bottom-nav-icon" aria-hidden="true">
      <FeedToolbarIcon name="more" />
    </span>
  </button>
</nav>

<style>
  /*
    Only the 56px icon row is toolbar-colored. Safe-area below matches the page so
    phones with a home indicator don't read as a second footer strip (desktop
    narrow windows have 0 safe-area and already looked fine).
  */
  .mobile-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 55;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-content: start;
    gap: 2px;
    height: var(--shell-bottom-nav-height);
    min-height: var(--shell-bottom-nav-height);
    max-height: var(--shell-bottom-nav-height);
    margin: 0;
    padding: 0 var(--shell-safe-right) var(--shell-safe-bottom) var(--shell-safe-left);
    border: none;
    border-top: none;
    background: var(--page-background);
    transition: transform 0.22s ease, visibility 0.22s ease;
    will-change: transform;
  }

  .mobile-bottom-nav::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: var(--shell-bottom-nav-base);
    border-top: 1px solid var(--panel-border);
    background: var(--toolbar-background);
    pointer-events: none;
  }

  .mobile-bottom-nav.chrome-collapsed {
    transform: translateY(100%);
    pointer-events: none;
    visibility: hidden;
  }

  .bottom-nav-item {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    min-height: 0;
    height: var(--shell-bottom-nav-base);
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    transition: color 0.16s ease, background-color 0.16s ease;
  }

  .bottom-nav-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
  }

  .bottom-nav-icon :global(.toolbar-icon) {
    width: 22px;
    height: 22px;
  }

  .bottom-nav-item.active-link {
    color: var(--brand-strong);
    background: var(--brand-soft);
  }

  .bottom-nav-item :global(.count-badge) {
    position: absolute;
    top: 4px;
    right: calc(50% - 20px);
  }
</style>
