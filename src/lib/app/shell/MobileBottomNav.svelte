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
  .mobile-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 55;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 2px;
    min-height: var(--shell-bottom-nav-base);
    padding: 4px var(--shell-safe-right) calc(4px + var(--shell-safe-bottom)) var(--shell-safe-left);
    border-top: 1px solid var(--panel-border);
    background: color-mix(in srgb, var(--toolbar-background) 92%, transparent);
    backdrop-filter: blur(10px);
    transition: transform 0.22s ease;
    will-change: transform;
  }

  .mobile-bottom-nav.chrome-collapsed {
    transform: translateY(100%);
    pointer-events: none;
  }

  .bottom-nav-item {
    position: relative;
    display: grid;
    place-items: center;
    min-height: var(--shell-touch-min);
    padding: 6px 2px;
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
