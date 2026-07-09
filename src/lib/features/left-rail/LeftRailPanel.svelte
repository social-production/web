<script lang="ts">
  import { page } from '$app/stores';
  import RailLinkRow from '$lib/components/shared/RailLinkRow.svelte';
  import { isAssetsSurfaceEnabled } from '$lib/config/features/phaseScope';
  import type { BootstrapPayload } from '$lib/types/bootstrap';
  import * as m from '$lib/paraglide/messages';

  export let bootstrap: BootstrapPayload;
  export let isActive: (href: string) => boolean;
  export let closePanels: () => void;

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
  <p class="section-subtitle">Channels, communities, and collective surfaces.</p>
</section>

<section class="rail-panel">
  <h2>Collective</h2>
  <div class="stack-links">
    <RailLinkRow
      active={$page.url.pathname === collectiveLink.href}
      href={collectiveLink.href}
      icon="platform"
      label={collectiveLink.label}
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
</section>

<section class="rail-panel">
  <h2>Channels</h2>
  <div class="stack-links">
    {#each nonPlatformChannels as link}
      <RailLinkRow active={isActive(link.href)} href={link.href} icon="channel" label={link.label} on:click={closePanels} />
    {/each}
  </div>
</section>

<section class="rail-panel">
  <h2>Communities</h2>
  <div class="stack-links">
    {#each bootstrap.directory.communities as link}
      <RailLinkRow active={isActive(link.href)} href={link.href} icon="community" label={link.label} on:click={closePanels} />
    {/each}
  </div>
</section>

<nav class="rail-utility">
  <RailLinkRow active={isActive('/feedback')} href="/feedback" icon="feedback" label={m.feedback_title()} on:click={closePanels} />
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
    gap: 2px;
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

  .rail-utility {
    padding: 4px 0 12px;
    border-bottom: 1px solid var(--panel-border);
  }
</style>
