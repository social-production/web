<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import ProjectChatTab from '$lib/features/projects/detail/ProjectChatTab.svelte';
  import ProjectHistoryTab from '$lib/features/projects/detail/ProjectHistoryTab.svelte';
  import ProjectLifecyclePanel from '$lib/features/projects/detail/ProjectLifecyclePanel.svelte';
  import ProjectMembersPanel from '$lib/features/projects/detail/ProjectMembersPanel.svelte';
  import ProjectOverviewHeader from '$lib/features/projects/detail/ProjectOverviewHeader.svelte';
  import ProjectUpdatesSection from '$lib/features/projects/detail/ProjectUpdatesSection.svelte';
  import ContextualBackButton from '$lib/components/shared/ContextualBackButton.svelte';
  import PendingVotesPanel from '$lib/components/shared/PendingVotesPanel.svelte';
  import ParticipationSteps from '$lib/components/shared/ParticipationSteps.svelte';
  import { isPersonalServiceProject } from '$lib/features/projects/projectMode';
  import {
    setProjectEditVote,
    setProjectPhaseChangeVote,
    setProjectPlanOverallVote,
    setProjectPlanValueVote,
    setProjectUpdateVote
  } from '$lib/services/queries/details';
  import type { ProjectApprovalVote, ProjectPageData } from '$lib/types/detail';
  import {
    buildProjectParticipationSteps,
    resolveCurrentParticipationStep
  } from '$lib/utils/participationSteps';
  import { collectProjectPendingVotes, scrollToPendingVote, type PendingVoteItem } from '$lib/utils/pendingVotes';

  export let data: ProjectPageData;

  let highlightedCommentId: string | null = null;
  let highlightedUpdateId: string | null = null;
  let highlightedDecisionId: string | null = null;
  let lastRouteSignature = '';
  let showMembersPanel = false;
  let activeTab: 'overview' | 'chat' | 'history' = 'overview';
  let autoExpandVoteCards = false;
  let autoExpandVoteKind: string | null = null;
  let autoExpandVoteTarget: string | null = null;
  let isCompact = false;

  onMount(() => {
    const media = window.matchMedia('(max-width: 1080px)');
    const syncCompact = () => {
      isCompact = media.matches;
    };

    syncCompact();
    media.addEventListener('change', syncCompact);

    return () => {
      media.removeEventListener('change', syncCompact);
    };
  });

  async function focusVoteTarget(voteKind: string | null, voteTarget: string | null) {
    await tick();
    if (typeof document === 'undefined') {
      return;
    }

    if (voteKind && voteTarget) {
      scrollToPendingVote(voteKind, voteTarget);
      return;
    }

    document.getElementById('pending-votes-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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

  function readDecisionTarget(url: URL) {
    if (url.hash.startsWith('#decision-')) {
      return url.hash.slice('#decision-'.length) || null;
    }

    return url.searchParams.get('decision');
  }

  function selectTab(tab: 'overview' | 'chat' | 'history') {
    activeTab = tab;

    if (!browser) {
      return;
    }

    const nextUrl = new URL(window.location.href);

    if (tab === 'overview') {
      nextUrl.searchParams.delete('tab');
      nextUrl.searchParams.delete('comment');
      nextUrl.searchParams.delete('update');
      nextUrl.searchParams.delete('decision');
      nextUrl.hash = '';
    } else {
      nextUrl.searchParams.set('tab', tab);
      if (tab === 'history') {
        nextUrl.searchParams.delete('comment');
        nextUrl.hash = '';
      } else if (tab === 'chat') {
        nextUrl.searchParams.delete('update');
        nextUrl.searchParams.delete('decision');
      }
    }

    void goto(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  function scrollElementIntoView(element: HTMLElement | null) {
    if (!browser || !element) {
      return;
    }

    const topbarHeight = document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
    const topOffset = topbarHeight + 28;
    const nextTop = window.scrollY + element.getBoundingClientRect().top - topOffset;

    window.scrollTo({
      top: Math.max(nextTop, 0),
      behavior: 'smooth'
    });
  }

  async function handleMembersPanelOpen() {
    if (isPersonalServiceProject(data.projectMode)) {
      return;
    }

    if (showMembersPanel) {
      showMembersPanel = false;
      return;
    }

    showMembersPanel = true;
    await tick();
    scrollElementIntoView(document.getElementById('project-members-panel'));
  }

  $: {
    const routeSignature = `${$page.url.pathname}${$page.url.search}${$page.url.hash}`;

    if (routeSignature !== lastRouteSignature) {
      lastRouteSignature = routeSignature;
      highlightedCommentId = readCommentTarget($page.url);
      highlightedUpdateId = readUpdateTarget($page.url);
      highlightedDecisionId = readDecisionTarget($page.url);
      const requestedTab = $page.url.searchParams.get('tab');
      activeTab = highlightedCommentId
        ? 'chat'
        : highlightedDecisionId
          ? 'history'
        : requestedTab === 'history'
          ? 'history'
        : requestedTab === 'chat'
          ? 'chat'
          : 'overview';
    }
    autoExpandVoteCards = $page.url.searchParams.get('open') === 'vote';
    autoExpandVoteKind = autoExpandVoteCards ? ($page.url.searchParams.get('voteKind') || null) : null;
    autoExpandVoteTarget = autoExpandVoteCards ? ($page.url.searchParams.get('voteTarget') || null) : null;
    if (autoExpandVoteCards) void focusVoteTarget(autoExpandVoteKind, autoExpandVoteTarget);
  }

  $: if (isPersonalServiceProject(data.projectMode) && showMembersPanel) {
    showMembersPanel = false;
  }

  $: pendingVotes = collectProjectPendingVotes(data);
  $: participationSteps = buildProjectParticipationSteps(data, pendingVotes);
  $: currentParticipationStep = resolveCurrentParticipationStep(participationSteps);

  async function handlePendingVote(item: PendingVoteItem, vote: ProjectApprovalVote) {
    switch (item.voteKind) {
      case 'phase_change':
        await setProjectPhaseChangeVote(data.slug, item.id, vote);
        break;
      case 'update':
        await setProjectUpdateVote(data.slug, item.id, vote);
        break;
      case 'edit':
        await setProjectEditVote(data.slug, item.id, vote);
        break;
      case 'plan':
        if (item.planPhaseId && item.planValueId) {
          await setProjectPlanValueVote(data.slug, item.planPhaseId, item.id, item.planValueId, vote);
        } else if (item.planPhaseId) {
          await setProjectPlanOverallVote(data.slug, item.planPhaseId, item.id, vote);
        }
        break;
    }

    await invalidateAll();
  }
</script>

<section class="page" class:page-chat={activeTab === 'chat' && isCompact}>
  <section class="hero-card" class:chat-tab-active={activeTab === 'chat' && isCompact}>
    {#if !(activeTab === 'chat' && isCompact)}
      <ContextualBackButton fallbackHref="/" />
    {/if}
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
      <button
        class:active-tab={activeTab === 'history'}
        class="top-tab"
        role="tab"
        type="button"
        on:click={() => selectTab('history')}
      >
        History
      </button>
    </div>

    {#if activeTab === 'overview'}
      <ProjectOverviewHeader {data} />
      <ParticipationSteps steps={participationSteps} currentStepId={currentParticipationStep} />
      <PendingVotesPanel
        items={pendingVotes}
        onVote={handlePendingVote}
      />
      <ProjectUpdatesSection
        {data}
        {highlightedUpdateId}
        {showMembersPanel}
        votesRenderedInHub={pendingVotes.length > 0}
        on:togglemembers={handleMembersPanelOpen}
      />
      {#if showMembersPanel && !isPersonalServiceProject(data.projectMode)}
        <ProjectMembersPanel {data} panelId="project-members-panel" />
      {/if}
      <div id="governance">
        <ProjectLifecyclePanel
          {data}
          {autoExpandVoteCards}
          {autoExpandVoteKind}
          {autoExpandVoteTarget}
          votesRenderedInHub={pendingVotes.length > 0}
        />
      </div>
    {:else if activeTab === 'chat'}
      <ProjectChatTab {data} {highlightedCommentId} fullscreen={isCompact} />
    {:else}
      <ProjectHistoryTab {data} highlightedDecisionId={highlightedDecisionId} />
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
    padding: 32px 16px 16px;
    margin-top: 24px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    overflow: visible;
  }

  .top-tab-row {
    display: inline-flex;
    gap: 8px;
    padding: 2px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    width: fit-content;
    position: absolute;
    top: 0;
    left: 16px;
    transform: translateY(-44%);
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

  @media (max-width: 1080px) {
    .page {
      min-width: 0;
      overflow-x: clip;
    }

    .page-chat {
      grid-template-rows: minmax(0, 1fr);
      gap: 0;
      height: calc(100dvh - var(--topbar-height) - var(--shell-bottom-nav-offset));
      min-height: 0;
      overflow: hidden;
    }

    .hero-card {
      min-width: 0;
      overflow-x: clip;
      padding-top: 16px;
      margin-top: 12px;
    }

    .hero-card.chat-tab-active {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      margin-top: 0;
      padding: 8px 0 0;
      border: none;
      background: transparent;
      overflow: hidden;
    }

    .chat-tab-active .top-tab-row {
      position: sticky;
      top: 0;
      z-index: 2;
      margin: 0 8px 8px;
      background: var(--panel);
      flex-shrink: 0;
    }

    .chat-tab-active > :global(.chat-shell) {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }

    .top-tab-row {
      position: static;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      transform: none;
      box-shadow: none;
      margin-bottom: 12px;
    }

    .top-tab {
      min-width: 0;
      padding: 8px 6px;
      font-size: 12px;
    }
  }
</style>
