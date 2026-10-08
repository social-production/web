<script lang="ts">
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import * as m from '$lib/paraglide/messages';

  export let combineFeeds = false;
  export let viewerLoggedIn = false;
  export let notificationCount = 0;
  export let messageCount = 0;
  export let moreActive = false;
  export let collapsed = false;
  export let isActive: (href: string) => boolean = () => false;
  export let onMore: () => void = () => {};

  $: tabs = [
    combineFeeds
      ? { id: 'home', href: '/', label: 'Home', icon: 'home' as const }
      : { id: 'public', href: '/', label: m.shell_nav_public(), icon: 'globe' as const },
    ...(combineFeeds
      ? []
      : [
          {
            id: 'personal',
            href: viewerLoggedIn ? '/personal' : '/onboarding',
            label: m.shell_nav_personal(),
            icon: 'home' as const
          }
        ]),
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
      icon: 'send' as const,
      badge: messageCount
    }
  ];
</script>

<nav
  aria-label="Primary mobile"
  class="mobile-bottom-nav"
  class:chrome-collapsed={collapsed}
  aria-hidden={collapsed}
  style={`--bottom-nav-slots: ${tabs.length + 1}`}
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
    The bar still paints through the home-indicator band. Icons sit at the
    bottom of that band, lifted only --shell-nav-button-lift, so the strip
    under them is not an empty gap.
  */
  .mobile-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-shell-nav);
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(var(--bottom-nav-slots, 5), minmax(0, 1fr));
    align-content: end;
    gap: 2px;
    height: var(--shell-bottom-nav-height);
    min-height: var(--shell-bottom-nav-height);
    max-height: var(--shell-bottom-nav-height);
    margin: 0;
    padding: 0 var(--shell-safe-right) var(--shell-nav-button-lift, 0px) var(--shell-safe-left);
    border: none;
    border-top: 1px solid var(--panel-border);
    background: var(--toolbar-background);
    transition: transform 0.22s ease, visibility 0s;
    will-change: transform;
  }

  .mobile-bottom-nav.chrome-collapsed {
    transform: translateY(100%);
    pointer-events: none;
    visibility: hidden;
    transition: transform 0.22s ease, visibility 0s linear 0.22s;
  }

  .bottom-nav-item {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 0;
    height: var(--shell-bottom-nav-base);
    padding: 0;
    border: none;
    border-radius: 0;
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

  .bottom-nav-item:hover,
  .bottom-nav-item.active-link {
    color: var(--brand-strong);
    background: var(--brand-soft);
    filter: none;
    transform: none;
  }

  .bottom-nav-item :global(.count-badge) {
    position: absolute;
    top: 4px;
    right: calc(50% - 20px);
  }
</style>
