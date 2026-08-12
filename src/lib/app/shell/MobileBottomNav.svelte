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
    Lift the chrome row above the safe-area inset instead of painting a second
    strip under the buttons. Dark page/toolbar colors are nearly identical, so
    any attached safe-area bar reads as a doubled footer.
  */
  .mobile-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--shell-safe-bottom);
    z-index: 55;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 2px;
    height: var(--shell-bottom-nav-base);
    min-height: var(--shell-bottom-nav-base);
    max-height: var(--shell-bottom-nav-base);
    margin: 0;
    padding: 0 var(--shell-safe-right) 0 var(--shell-safe-left);
    border: none;
    border-top: 1px solid var(--panel-border);
    background: var(--toolbar-background);
    transition: transform 0.22s ease, visibility 0.22s ease;
    will-change: transform;
  }

  .mobile-bottom-nav.chrome-collapsed {
    transform: translateY(calc(100% + var(--shell-safe-bottom)));
    pointer-events: none;
    visibility: hidden;
  }

  .bottom-nav-item {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 0;
    height: 100%;
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
