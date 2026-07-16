<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import EventChatTab from '$lib/features/events/detail/EventChatTab.svelte';
  import EventHistoryTab from '$lib/features/events/detail/EventHistoryTab.svelte';
  import EventLifecyclePanel from '$lib/features/events/detail/EventLifecyclePanel.svelte';
  import EventMembersPanel from '$lib/features/events/detail/EventMembersPanel.svelte';
  import EventOverviewHeader from '$lib/features/events/detail/EventOverviewHeader.svelte';
  import EventUpdatesSection from '$lib/features/events/detail/EventUpdatesSection.svelte';
  import PendingVotesPanel from '$lib/components/shared/PendingVotesPanel.svelte';
  import ParticipationSteps from '$lib/components/shared/ParticipationSteps.svelte';
  import PlanAssessmentWizard from '$lib/components/shared/PlanAssessmentWizard.svelte';
  import { setEventEditVote, setEventPhaseChangeVote, setEventPlanCriterionRating, setEventPlanOverallVote, setEventPlanValueVote, setEventUpdateVote } from '$lib/services/commands/events';
  import type { EventPageData, PlanCriterionRating, ProjectApprovalVote } from '$lib/types/detail';
  import {
    buildEventParticipationSteps,
    resolveCurrentParticipationStep
  } from '$lib/utils/participationSteps';
  import { collectEventPendingVotes, scrollToPendingVote, type PendingVoteItem } from '$lib/utils/pendingVotes';

  export let data: EventPageData;

  let highlightedCommentId: string | null = null;
  let highlightedUpdateId: string | null = null;
  let highlightedDecisionId: string | null = null;
  let lastRouteSignature = '';
  let showMembersPanel = false;
  let activeTab: 'overview' | 'chat' | 'history' = 'overview';
  let autoExpandVoteCards = false;
  let autoExpandVoteKind: string | null = null;
  let autoExpandVoteTarget: string | null = null;
  let autoAssess = false;
  let autoAssessCriterionId: string | null = null;
  let participationAssessPlanId: string | null = null;
  let participationAssessCriterionId: string | null = null;
  let pendingAssessmentOpen = false;
  let pendingAssessmentPlanId: string | null = null;
  let pendingAssessmentCriterionId: string | null = null;
  let isCompact = false;
  let signalRemovalNudge = false;

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
    if (showMembersPanel) {
      showMembersPanel = false;
      return;
    }

    showMembersPanel = true;
    await tick();
    scrollElementIntoView(document.getElementById('event-members-panel'));
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
    autoAssess = $page.url.searchParams.get('assess') === '1';
    autoAssessCriterionId = $page.url.searchParams.get('criterionId') || null;
    if ($page.url.hash === '#pending-votes-panel') {
      activeTab = 'overview';
      void focusVoteTarget(null, null);
    } else if (autoExpandVoteCards) {
      void focusVoteTarget(autoExpandVoteKind, autoExpandVoteTarget);
    }
  }

  $: pendingAssessmentPlan =
    pendingAssessmentPlanId == null
      ? null
      : data.lifecycle.phaseTwo.plans.find((plan) => plan.id === pendingAssessmentPlanId) ?? null;

  $: pendingVotes = collectEventPendingVotes(data);
  $: participationSteps = buildEventParticipationSteps(data, pendingVotes, {
    signalRemovalNudge,
    viewerUsername: $page.data.bootstrap?.viewer?.username ?? null
  });
  $: currentParticipationStep = resolveCurrentParticipationStep(participationSteps);
  $: if (
    data.lifecycle.phaseOne.viewerHasDemandSignal ||
    data.lifecycle.phaseOne.viewerHasOppositionSignal
  ) {
    signalRemovalNudge = false;
  }

  function handleSignalRemoved() {
    signalRemovalNudge = true;
  }

  function handleParticipationDismiss() {
    signalRemovalNudge = false;
  }

  function handlePendingAssess(item: PendingVoteItem) {
    pendingAssessmentPlanId = item.id;
    pendingAssessmentCriterionId = item.planCriterionId ?? null;
    pendingAssessmentOpen = true;
  }

  function closePendingAssessment() {
    pendingAssessmentOpen = false;
    pendingAssessmentPlanId = null;
    pendingAssessmentCriterionId = null;
  }

  async function handlePendingCriterionRate(criterionId: string, rating: PlanCriterionRating | null) {
    if (!pendingAssessmentPlanId) {
      return;
    }

    await setEventPlanCriterionRating(data.slug, pendingAssessmentPlanId, criterionId, rating);
    await invalidateAll();
  }

  async function handlePendingOverallVote(vote: ProjectApprovalVote | null) {
    if (!pendingAssessmentPlanId) {
      return;
    }

    await setEventPlanOverallVote(data.slug, pendingAssessmentPlanId, vote);
    await invalidateAll();
    closePendingAssessment();
  }

  async function handlePendingVote(item: PendingVoteItem, vote: ProjectApprovalVote) {
    switch (item.voteKind) {
      case 'phase_change':
        await setEventPhaseChangeVote(data.slug, item.id, vote);
        break;
      case 'update':
        await setEventUpdateVote(data.slug, item.id, vote);
        break;
      case 'edit':
        await setEventEditVote(data.slug, item.id, vote);
        break;
      case 'plan':
        if (item.planCriterionId) {
          await handlePendingAssess(item);
          break;
        }
        if (item.planValueId) {
          await setEventPlanValueVote(data.slug, item.id, item.planValueId, vote);
        } else {
          await setEventPlanOverallVote(data.slug, item.id, vote);
        }
        break;
    }

    await invalidateAll();
  }
</script>

<section class="page" class:page-chat={activeTab === 'chat' && isCompact}>
  <section class="hero-card" class:chat-tab-active={activeTab === 'chat' && isCompact}>
    <div class="top-tab-row" role="tablist" aria-label="Event detail tabs">
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
      <ParticipationSteps
        steps={participationSteps}
        currentStepId={currentParticipationStep}
        {pendingVotes}
        pageData={data}
        placement="lead"
        on:dismiss={handleParticipationDismiss}
      />
      <EventOverviewHeader {data} onSignalRemoved={handleSignalRemoved} />
      <PendingVotesPanel items={pendingVotes} onVote={handlePendingVote} onAssess={handlePendingAssess} />
      <EventUpdatesSection
        {data}
        {highlightedUpdateId}
        {showMembersPanel}
        votesRenderedInHub={pendingVotes.length > 0}
        on:togglemembers={handleMembersPanelOpen}
      />
      {#if showMembersPanel}
        <EventMembersPanel {data} panelId="event-members-panel" />
      {/if}
      <div id="governance">
        <EventLifecyclePanel
          {data}
          {autoExpandVoteCards}
          {autoExpandVoteKind}
          {autoExpandVoteTarget}
          {autoAssess}
          {autoAssessCriterionId}
          assessPlanId={participationAssessPlanId}
          assessCriterionId={participationAssessCriterionId}
          votesRenderedInHub={pendingVotes.length > 0}
        />
      </div>
    {:else if activeTab === 'chat'}
      <EventChatTab {data} highlightedCommentId={highlightedCommentId} fullscreen={isCompact} />
    {:else}
      <EventHistoryTab {data} highlightedDecisionId={highlightedDecisionId} />
    {/if}
  </section>

  {#if pendingAssessmentPlan}
    <PlanAssessmentWizard
      open={pendingAssessmentOpen}
      plan={pendingAssessmentPlan}
      planTitle={pendingAssessmentPlan.title}
      criteria={pendingAssessmentPlan.criterionAssessments ?? []}
      canVote={data.lifecycle.phaseTwo.viewerCanVoteOnPlans}
      initialCriterionId={pendingAssessmentCriterionId}
      overallActiveVote={pendingAssessmentPlan.overallApproval.activeVote}
      onRate={handlePendingCriterionRate}
      onOverallVote={handlePendingOverallVote}
      onClose={closePendingAssessment}
    />
  {/if}
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
