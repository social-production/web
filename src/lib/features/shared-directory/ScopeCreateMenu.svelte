<script lang="ts">
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import IconPopoverMenu from '$lib/components/shared/IconPopoverMenu.svelte';
  import { buildScopedCreateHref } from '$lib/utils/createScopePrefill';
  import type { ScopePageData } from '$lib/types/scope';

  export let pageData: ScopePageData;
  export let title: string;

  let open = false;

  const createLinks = [
    { label: 'Thread', href: '/create/thread' as const },
    { label: 'Project', href: '/create/project' as const },
    { label: 'Event', href: '/create/event' as const },
    { label: 'Help request', href: '/create/help-request' as const }
  ];

  function closeMenu() {
    open = false;
  }
</script>

<IconPopoverMenu
  bind:open
  active={open}
  ariaLabel={`Create content in ${title}`}
  menuLabel="Create content"
  minWidth={176}
>
  <FeedToolbarIcon slot="icon" name="plus" />

  {#each createLinks as link}
    <a
      class="create-link"
      href={buildScopedCreateHref(link.href, pageData.kind, pageData.slug)}
      role="menuitem"
      on:click={closeMenu}
    >
      {link.label}
    </a>
  {/each}
</IconPopoverMenu>

<style>
  .create-link {
    display: block;
    padding: 7px 8px;
    border-radius: calc(var(--radius-sm) - 2px);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: background-color 120ms ease;
  }

  .create-link:hover {
    background: color-mix(in srgb, var(--panel-border) 38%, transparent);
  }
</style>
