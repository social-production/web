<script lang="ts">
  import { page } from '$app/stores';
  import { isAssetsSurfaceEnabled } from '$lib/config/features/phaseScope';
  import type { BootstrapPayload } from '$lib/types/bootstrap';
  import * as m from '$lib/paraglide/messages';

  export let bootstrap: BootstrapPayload;
  export let isActive: (href: string) => boolean;
  export let closePanels: () => void;

  const railDescriptions = {
    collective: 'Shared governance and common platform work.',
    assets: 'Land stewardship, storage services, and collective funds under platform governance.',
    channels: 'Topic-based discovery across projects, threads, and events.',
    communities: 'Coordination spaces around shared activity.'
  };

  $: collectiveLink = bootstrap.directory.platform ?? {
    slug: 'platform',
    label: 'Platform',
    href: '/platform'
  };

  $: nonPlatformChannels = bootstrap.directory.channels.filter(
    (c: { slug: string }) => c.slug !== 'platform' && c.slug !== 'stewardship'
  );
</script>

<section class="rail-panel rail-intro">
  <h2>Networks</h2>
  <p class="section-subtitle">Channels, communities, and collective surfaces to discover and coordinate shared activity.</p>
</section>

<section class="rail-panel">
  <h2>Collective</h2>
  <p class="section-subtitle">{railDescriptions.collective}</p>
  <div class="stack-links">
    <a
      class:active-link={$page.url.pathname === collectiveLink.href}
      class="rail-link"
      href={collectiveLink.href}
      on:click={closePanels}
    >
      {collectiveLink.label}
    </a>
    {#if isAssetsSurfaceEnabled(bootstrap.featureFlags)}
      <a
        class:active-link={$page.url.pathname === '/platform/assets' || $page.url.pathname.startsWith('/platform/assets/')}
        class="rail-link"
        href="/platform/assets"
        on:click={closePanels}
      >
        <span>Assets</span>
        <span class="feature-pill open">
          Open
        </span>
      </a>
    {/if}
  </div>
</section>

<section class="rail-panel">
  <h2>Channels</h2>
  <p class="section-subtitle">{railDescriptions.channels}</p>
  <div class="stack-links">
    {#each nonPlatformChannels as link}
      <a class:active-link={isActive(link.href)} class="rail-link" href={link.href} on:click={closePanels}>
        {link.label}
      </a>
    {/each}
  </div>
</section>

<section class="rail-panel">
  <h2>Communities</h2>
  <p class="section-subtitle">{railDescriptions.communities}</p>
  <div class="stack-links">
    {#each bootstrap.directory.communities as link}
      <a class:active-link={isActive(link.href)} class="rail-link" href={link.href} on:click={closePanels}>
        {link.label}
      </a>
    {/each}
  </div>
</section>

<nav class="rail-utility">
  <a class:active-link={isActive('/feedback')} class="rail-link utility-link" href="/feedback" on:click={closePanels}>
    {m.feedback_title()}
  </a>
</nav>

<style>
  .rail-panel {
    padding: 0 0 12px;
    border-bottom: 1px solid var(--panel-border);
  }

  .rail-intro {
    padding-top: 2px;
  }

  .rail-panel h2 {
    font-size: 14px;
    color: var(--text-main);
  }

  .section-subtitle {
    margin: 4px 0 10px;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .stack-links {
    display: grid;
    gap: 6px;
  }

  .rail-link {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    background: transparent;
    cursor: pointer;
    transition: background-color 0.18s ease, color 0.18s ease;
  }

  .rail-link:hover,
  .rail-link.active-link {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .feature-pill {
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid var(--panel-border);
    font-size: 10px;
    font-weight: 700;
  }

  .feature-pill.open {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .rail-utility {
    padding: 4px 0 12px;
    border-bottom: 1px solid var(--panel-border);
  }

  .utility-link {
    color: var(--text-soft);
  }
</style>
