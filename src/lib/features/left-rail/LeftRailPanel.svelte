<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import RailLinkRow from '$lib/components/shared/RailLinkRow.svelte';
  import ScopeDiscoverSheet from '$lib/components/shared/ScopeDiscoverSheet.svelte';
  import { isAssetsSurfaceEnabled } from '$lib/config/features/phaseScope';
  import type { BootstrapPayload } from '$lib/types/bootstrap';

  export let bootstrap: BootstrapPayload;
  export let isActive: (href: string) => boolean;
  export let closePanels: () => void;

  type RailSection = 'collective' | 'channels' | 'communities';

  const STORAGE_PREFIX = 'left-rail-open:';

  let collectiveOpen = true;
  let channelsOpen = true;
  let communitiesOpen = true;
  let sectionsHydrated = false;
  let discoverOpen = false;

  $: collectiveLink = bootstrap.directory.platform ?? {
    slug: 'platform',
    label: 'Platform',
    href: '/platform'
  };

  $: nonPlatformChannels = bootstrap.directory.channels.filter(
    (c: { slug: string }) => c.slug !== 'platform' && c.slug !== 'stewardship'
  );

  function readOpen(section: RailSection): boolean {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}${section}`) !== 'false';
    } catch {
      return true;
    }
  }

  function writeOpen(section: RailSection, open: boolean) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${section}`, open ? 'true' : 'false');
    } catch {
      // ignore storage failures
    }
  }

  onMount(() => {
    collectiveOpen = readOpen('collective');
    channelsOpen = readOpen('channels');
    communitiesOpen = readOpen('communities');
    sectionsHydrated = true;
  });

  $: if (sectionsHydrated) writeOpen('collective', collectiveOpen);
  $: if (sectionsHydrated) writeOpen('channels', channelsOpen);
  $: if (sectionsHydrated) writeOpen('communities', communitiesOpen);

  function handleDiscoverNavigate() {
    discoverOpen = false;
    closePanels();
  }
</script>

<section class="rail-panel">
  <details class="rail-section" bind:open={collectiveOpen}>
    <summary class="rail-section-summary">
      <span class="summary-label">
        <span class="chevron" aria-hidden="true"></span>
        <span>Collective</span>
      </span>
    </summary>
    <div class="stack-links">
      <RailLinkRow
        active={$page.url.pathname === collectiveLink.href && !$page.url.searchParams.has('board')}
        href={collectiveLink.href}
        icon="platform"
        label={collectiveLink.label}
        on:click={closePanels}
      />
      <RailLinkRow
        active={$page.url.pathname === '/platform' && $page.url.searchParams.get('board') === '1'}
        href="/platform?board=1"
        icon="shield"
        label="Moderators"
        on:click={closePanels}
      />
      {#if isAssetsSurfaceEnabled(bootstrap.featureFlags)}
        <RailLinkRow
          active={$page.url.pathname === '/platform/assets' || $page.url.pathname.startsWith('/platform/assets/')}
          href="/platform/assets"
          icon="project"
          label="Assets"
          on:click={closePanels}
        >
          <span slot="trailing" class="feature-pill open">Open</span>
        </RailLinkRow>
      {/if}
    </div>
  </details>
</section>

<section class="rail-panel">
  <details class="rail-section" bind:open={channelsOpen}>
    <summary class="rail-section-summary">
      <span class="summary-label">
        <span class="chevron" aria-hidden="true"></span>
        <span>Channels</span>
      </span>
    </summary>
    <div class="stack-links">
      {#each nonPlatformChannels as link}
        <RailLinkRow active={isActive(link.href)} href={link.href} icon="channel" label={link.label} on:click={closePanels} />
      {:else}
        <p class="empty-hint">Join channels to see them here.</p>
      {/each}
    </div>
  </details>
</section>

<section class="rail-panel">
  <details class="rail-section" bind:open={communitiesOpen}>
    <summary class="rail-section-summary">
      <span class="summary-label">
        <span class="chevron" aria-hidden="true"></span>
        <span>Communities</span>
      </span>
    </summary>
    <div class="stack-links">
      {#each bootstrap.directory.communities as link}
        <RailLinkRow active={isActive(link.href)} href={link.href} icon="community" label={link.label} on:click={closePanels} />
      {:else}
        <p class="empty-hint">Join communities to see them here.</p>
      {/each}
    </div>
  </details>
</section>

<section class="rail-panel">
  <div class="action-stack">
    <button class="rail-action discover-button" type="button" on:click={() => (discoverOpen = true)}>
      <FeedToolbarIcon name="plus" />
      <span>Discover</span>
    </button>

    <a class="rail-action feedback-button" href="/feedback" on:click={closePanels}>
      <FeedToolbarIcon name="pencil" />
      <span>Feedback</span>
    </a>
  </div>
</section>

<ScopeDiscoverSheet
  bind:open={discoverOpen}
  on:close={() => (discoverOpen = false)}
  on:navigate={handleDiscoverNavigate}
/>

<style>
  .rail-panel {
    padding: 0 0 12px;
    border-bottom: 1px solid var(--panel-border);
  }

  .rail-section {
    display: grid;
  }

  .rail-section[open] > .rail-section-summary {
    margin-bottom: 8px;
  }

  .rail-section-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 28px;
    cursor: pointer;
    list-style: none;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
  }

  .rail-section-summary::-webkit-details-marker {
    display: none;
  }

  .summary-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .chevron {
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 6px solid currentColor;
    transition: transform 0.16s ease;
    flex-shrink: 0;
  }

  details[open] > .rail-section-summary .chevron {
    transform: rotate(90deg);
  }

  .action-stack {
    display: grid;
    gap: 8px;
    width: 100%;
    padding-top: 2px;
  }

  .rail-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 38px;
    padding: 0 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }

  .discover-button {
    border: 1px solid color-mix(in srgb, var(--brand) 74%, transparent);
    background: var(--brand);
    color: white;
  }

  .discover-button:hover {
    background: color-mix(in srgb, var(--brand) 86%, black);
  }

  .feedback-button {
    border: 1px solid color-mix(in srgb, var(--panel-border) 88%, transparent);
    background: color-mix(in srgb, var(--panel-soft) 90%, transparent);
    color: var(--text-main);
  }

  .feedback-button:hover {
    background: color-mix(in srgb, var(--brand) 10%, var(--panel-soft));
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
  }

  .stack-links {
    display: grid;
    gap: 2px;
  }

  .empty-hint {
    margin: 0;
    padding: 4px 10px;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .feature-pill {
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    font-size: 10px;
    font-weight: 700;
  }

  .feature-pill.open {
    background: transparent;
    color: var(--text-soft);
  }
</style>
