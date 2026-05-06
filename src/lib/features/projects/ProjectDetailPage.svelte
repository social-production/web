<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ProjectChatTab from '$lib/features/projects/detail/ProjectChatTab.svelte';
  import ProjectLifecyclePanel from '$lib/features/projects/detail/ProjectLifecyclePanel.svelte';
  import ProjectMembersPanel from '$lib/features/projects/detail/ProjectMembersPanel.svelte';
  import ProjectOverviewHeader from '$lib/features/projects/detail/ProjectOverviewHeader.svelte';
  import ProjectUpdatesSection from '$lib/features/projects/detail/ProjectUpdatesSection.svelte';
  import type { ProjectPageData } from '$lib/types/detail';

  export let data: ProjectPageData;

  let highlightedCommentId: string | null = null;
  let highlightedUpdateId: string | null = null;
  let lastRouteSignature = '';
  let showMembersPanel = false;
  let activeTab: 'overview' | 'chat' = 'overview';

  function readCommentTarget(url: URL) {
    if (url.hash.startsWith('#comment-')) {
      return url.hash.slice('#comment-'.length) || null;
    }

    return url.searchParams.get('comment');
  }

  function readUpdateTarget(url: URL) {
    if (url.hash.startsWith('#update-')) {
      return url.hash.slice('#update-'.length) || null;
    }

    return url.searchParams.get('update');
  }

  function selectTab(tab: 'overview' | 'chat') {
    activeTab = tab;

    if (!browser) {
      return;
    }

    const nextUrl = new URL(window.location.href);

    if (tab === 'chat') {
      nextUrl.searchParams.set('tab', 'chat');
    } else {
      nextUrl.searchParams.delete('tab');
    }

    void goto(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  $: {
    const routeSignature = `${$page.url.pathname}${$page.url.search}${$page.url.hash}`;

    if (routeSignature !== lastRouteSignature) {
      lastRouteSignature = routeSignature;
      highlightedCommentId = readCommentTarget($page.url);
      highlightedUpdateId = readUpdateTarget($page.url);
      activeTab = $page.url.searchParams.get('tab') === 'chat' || !!highlightedCommentId ? 'chat' : 'overview';
    }
  }
</script>

<section class="page">
  <section class="hero-card">
    <div class="top-tab-row" role="tablist" aria-label="Project detail tabs">
      <button
        class:active-tab={activeTab === 'overview'}
        class="top-tab"
        role="tab"
        type="button"
        on:click={() => selectTab('overview')}
      >
        Overview
      </button>
      <button
        class:active-tab={activeTab === 'chat'}
        class="top-tab"
        role="tab"
        type="button"
        on:click={() => selectTab('chat')}
      >
        Chat
      </button>
    </div>

    {#if activeTab === 'overview'}
      <ProjectOverviewHeader {data} />
      <ProjectUpdatesSection
        {data}
        {highlightedUpdateId}
        {showMembersPanel}
        on:togglemembers={() => (showMembersPanel = !showMembersPanel)}
      />
      {#if showMembersPanel}
        <ProjectMembersPanel {data} />
      {/if}
      <ProjectLifecyclePanel {data} />
    {:else}
      <ProjectChatTab {data} {highlightedCommentId} />
    {/if}
  </section>
</section>

<style>
  .page {
    display: grid;
    gap: 20px;
  }

  .hero-card {
    position: relative;
    display: grid;
    gap: 0;
    padding: 28px 16px 16px;
    margin-top: 22px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    overflow: visible;
  }

  .top-tab-row {
    display: inline-flex;
    gap: 6px;
    padding: 2px;
    margin-bottom: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    width: fit-content;
    position: absolute;
    top: 0;
    left: 16px;
    transform: translateY(-50%);
    z-index: 1;
    box-shadow: 0 10px 24px color-mix(in srgb, var(--page-bg) 82%, transparent);
  }

  .top-tab {
    min-width: 108px;
    padding: 9px 14px;
    border: 1px solid transparent;
    border-radius: calc(var(--radius-sm) - 2px);
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
  }

  .top-tab.active-tab {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }
</style>
