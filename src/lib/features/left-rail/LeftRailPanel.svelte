<script lang="ts">
  import type { BootstrapPayload } from '$lib/types/bootstrap';

  export let bootstrap: BootstrapPayload;
  export let compact = false;
  export let isActive: (href: string) => boolean;
  export let closePanels: () => void;

  const createLinks = [
    { href: '/create/post', label: 'Post' },
    { href: '/create/thread', label: 'Thread' },
    { href: '/create/project', label: 'Project' },
    { href: '/create/event', label: 'Event' },
    { href: '/create/community', label: 'Community' },
    { href: '/create/channel', label: 'Channel' }
  ];

  const railDescriptions = {
    create: 'Start a new production, service, or discussion surface.',
    collective: 'Shared governance and common platform work.',
    channels: 'Topic-based discovery across projects, threads, and events.',
    communities: 'Social coordination spaces around shared work.'
  };
</script>

{#if compact}
  <div class="compact-rail-header">
    <h2>Left Rail</h2>
    <button class="close-rail" type="button" on:click={closePanels}>Close</button>
  </div>
{/if}

<section class="rail-panel">
  <h2>Create</h2>
  <p class="section-subtitle">{railDescriptions.create}</p>
  <div class="stack-links">
    {#each createLinks as link}
      <a
        class:active-link={isActive(link.href)}
        class="rail-link create-link"
        href={bootstrap.viewer ? link.href : '/onboarding'}
        on:click={closePanels}
      >
        <span class="create-plus">+</span>
        {link.label}
      </a>
    {/each}
  </div>
</section>

{#if bootstrap.directory.platform}
  <section class="rail-panel">
    <h2>Collective</h2>
    <p class="section-subtitle">{railDescriptions.collective}</p>
    <div class="stack-links">
      <a
        class:active-link={isActive(bootstrap.directory.platform.href)}
        class="rail-link"
        href={bootstrap.directory.platform.href}
        on:click={closePanels}
      >
        {bootstrap.directory.platform.label}
      </a>
    </div>
  </section>
{/if}

<section class="rail-panel">
  <h2>Channels</h2>
  <p class="section-subtitle">{railDescriptions.channels}</p>
  <div class="stack-links">
    {#each bootstrap.directory.channels as link}
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

<style>
  .compact-rail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--panel-border);
  }

  .close-rail {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 0 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
  }

  .close-rail:hover {
    border-color: var(--brand);
    color: var(--brand-strong);
    background: var(--brand-soft);
  }

  .rail-panel {
    padding: 0 0 12px;
    border-bottom: 1px solid var(--panel-border);
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
    justify-content: flex-start;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    background: transparent;
    transition: background-color 0.18s ease, color 0.18s ease;
  }

  .rail-link:hover,
  .rail-link.active-link {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .create-plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 13px;
    font-weight: 800;
    line-height: 1;
  }
</style>