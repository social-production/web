<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import EventLifecyclePanel from '$lib/features/events/detail/EventLifecyclePanel.svelte';
  import EventMembersPanel from '$lib/features/events/detail/EventMembersPanel.svelte';
  import EventOverviewHeader from '$lib/features/events/detail/EventOverviewHeader.svelte';
  import EventUpdatesSection from '$lib/features/events/detail/EventUpdatesSection.svelte';
  import DetailTopTabs from '$lib/features/detail/DetailTopTabs.svelte';
  import type { DetailTabId } from '$lib/features/detail/detailTabs';
  import PendingVotesPanel from '$lib/components/shared/PendingVotesPanel.svelte';
  import ParticipationSteps from '$lib/components/shared/ParticipationSteps.svelte';
  import {
    setEventEditVote,
    setEventPhaseChangeVote,
    setEventPlanCriterionRating,
    setEventPlanOverallVote,
    setEventPlanValueVote,
    setEventUpdateVote,
  } from '$lib/services/commands/events';
  import type {
    DetailLinksFrameData,
    EventPageData,
    PlanCriterionRating,
    ProjectApprovalVote
  } from '$lib/types/detail';
  import { getEventLinks } from '$lib/services/queries/details';
  import { emptyLinksFrame } from '$lib/utils/emptyLinksFrame';
  import { invalidateEventDetail } from '$lib/utils/detailInvalidation';
  import {
    buildEventParticipationSteps,
    resolveCurrentParticipationStep,
  } from '$lib/utils/participationSteps';
  import {
    collectEventPendingVotes,
    scrollToPendingVote,
    type PendingVoteItem,
  } from '$lib/utils/pendingVotes';
  import { applySignalToggleToDetailPhaseOneImmutable } from '$lib/utils/feedSignals';
  import type { SignalToggleResult } from '$lib/types/feed';

  export let data: EventPageData;

  let pageData = data;
  let lastLoaderData = data;

  $: if (data !== lastLoaderData) {
    lastLoaderData = data;
    pageData = data;
    if (activeTab === 'links') {
      linksSlug = '';
    }
  }

  let highlightedCommentId: string | null = null;
  let highlightedUpdateId: string | null = null;
  let highlightedDecisionId: string | null = null;
  let lastRouteSignature = '';
  let showMembersPanel = false;
  let activeTab: DetailTabId = 'overview';
  let highlightedLinkRequestId: string | null = null;
  let autoExpandVoteCards = false;
  let ChatTab: typeof import('$lib/features/events/detail/EventChatTab.svelte').default | null = null;
  let HistoryTab: typeof import('$lib/features/events/detail/EventHistoryTab.svelte').default | null =
    null;
  let LinksTab: typeof import('$lib/features/detail-links/DetailLinksTab.svelte').default | null = null;
  let Wizard: typeof import('$lib/components/shared/PlanAssessmentWizard.svelte').default | null =
    null;
  let linksFrame: DetailLinksFrameData = data.linksFrame ?? emptyLinksFrame('event', data.slug);
  let linksSlug = '';

  async function ensureTabComponent(tab: DetailTabId) {
    if (tab === 'chat' && !ChatTab) {
      ChatTab = (await import('$lib/features/events/detail/EventChatTab.svelte')).default;
    } else if (tab === 'history' && !HistoryTab) {
      HistoryTab = (await import('$lib/features/events/detail/EventHistoryTab.svelte')).default;
    } else if (tab === 'links' && !LinksTab) {
      LinksTab = (await import('$lib/features/detail-links/DetailLinksTab.svelte')).default;
    }
  }

  async function loadLinks() {
    const slug = data.slug;
    try {
      linksFrame = await getEventLinks(slug);
      linksSlug = slug;
    } catch {
      linksFrame = data.linksFrame ?? emptyLinksFrame('event', slug);
      linksSlug = slug;
    }
  }

  $: if (activeTab !== 'overview') {
    void ensureTabComponent(activeTab);
  }
  $: if (activeTab === 'links' && linksSlug !== data.slug) {
    void loadLinks();
  }
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

    document
      .getElementById('pending-votes-panel')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  function selectTab(tab: DetailTabId) {
    activeTab = tab;
    void ensureTabComponent(tab);

    if (!browser) {
      return;
    }

    const nextUrl = new URL(window.location.href);

    if (tab === 'overview') {
      nextUrl.searchParams.delete('tab');
      nextUrl.searchParams.delete('comment');
      nextUrl.searchParams.delete('update');
      nextUrl.searchParams.delete('decision');
      nextUrl.searchParams.delete('linkRequest');
      nextUrl.hash = '';
    } else {
      nextUrl.searchParams.set('tab', tab);
      if (tab === 'history') {
        nextUrl.searchParams.delete('comment');
        nextUrl.searchParams.delete('linkRequest');
        nextUrl.hash = '';
      } else if (tab === 'chat') {
        nextUrl.searchParams.delete('update');
        nextUrl.searchParams.delete('decision');
        nextUrl.searchParams.delete('linkRequest');
      } else if (tab === 'links') {
        nextUrl.searchParams.delete('comment');
        nextUrl.searchParams.delete('update');
        nextUrl.searchParams.delete('decision');
        nextUrl.hash = '';
      }
    }

    void goto(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }

  function scrollElementIntoView(element: HTMLElement | null) {
    if (!browser || !element) {
      return;
    }

    const topbarHeight =
      document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
    const topOffset = topbarHeight + 28;
    const nextTop = window.scrollY + element.getBoundingClientRect().top - topOffset;

    window.scrollTo({
      top: Math.max(nextTop, 0),
      behavior: 'smooth',
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
      highlightedLinkRequestId = $page.url.searchParams.get('linkRequest');
      const requestedTab = $page.url.searchParams.get('tab');
      activeTab = highlightedCommentId
        ? 'chat'
        : highlightedDecisionId
          ? 'history'
          : highlightedLinkRequestId || requestedTab === 'links'
            ? 'links'
            : requestedTab === 'history'
              ? 'history'
              : requestedTab === 'chat'
                ? 'chat'
                : 'overview';
    }
    autoExpandVoteCards = $page.url.searchParams.get('open') === 'vote';
    autoExpandVoteKind = autoExpandVoteCards
      ? $page.url.searchParams.get('voteKind') || null
      : null;
    autoExpandVoteTarget = autoExpandVoteCards
      ? $page.url.searchParams.get('voteTarget') || null
      : null;
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
      : (data.lifecycle.phaseTwo.plans.find((plan) => plan.id === pendingAssessmentPlanId) ?? null);
  $: if (pendingAssessmentPlan && !Wizard) {
    void import('$lib/components/shared/PlanAssessmentWizard.svelte').then((module) => {
      Wizard = module.default;
    });
  }

  $: pendingVotes = collectEventPendingVotes(pageData);
  $: participationSteps = buildEventParticipationSteps(pageData, pendingVotes, {
    signalRemovalNudge,
    viewerUsername: $page.data.bootstrap?.viewer?.username ?? null,
  });
  $: currentParticipationStep = resolveCurrentParticipationStep(participationSteps);
  $: if (
    pageData.lifecycle.phaseOne.viewerHasDemandSignal ||
    pageData.lifecycle.phaseOne.viewerHasOppositionSignal
  ) {
    signalRemovalNudge = false;
  }

  function handleSignalChange(result: SignalToggleResult) {
    pageData = applySignalToggleToDetailPhaseOneImmutable(pageData, result);
    if (result.action === 'removed') {
      signalRemovalNudge = true;
    }
  }

  function handleMembershipChange(next: { viewerIsMember: boolean; memberCount: number }) {
    pageData = { ...pageData, ...next };
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

  async function handlePendingCriterionRate(
    criterionId: string,
    rating: PlanCriterionRating | null
  ) {
    if (!pendingAssessmentPlanId) {
      return;
    }

    await setEventPlanCriterionRating(data.slug, pendingAssessmentPlanId, criterionId, rating);
    await invalidateEventDetail(data.slug);
  }

  async function handlePendingOverallVote(vote: ProjectApprovalVote | null) {
    if (!pendingAssessmentPlanId) {
      return;
    }

    await setEventPlanOverallVote(data.slug, pendingAssessmentPlanId, vote);
    await invalidateEventDetail(data.slug);
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

    await invalidateEventDetail(data.slug);
  }
</script>

<section class="page" class:page-chat={activeTab === 'chat' && isCompact}>
  <section class="hero-card" class:chat-tab-active={activeTab === 'chat' && isCompact}>
    <DetailTopTabs {activeTab} ariaLabel="Event detail tabs" {selectTab} />

    {#if activeTab === 'overview'}
      <ParticipationSteps
        steps={participationSteps}
        currentStepId={currentParticipationStep}
        {pendingVotes}
        {pageData}
        placement="lead"
        on:dismiss={handleParticipationDismiss}
      />
      <EventOverviewHeader
        data={pageData}
        signalChange={handleSignalChange}
        onMembershipChange={handleMembershipChange}
      />
      <PendingVotesPanel
        items={pendingVotes}
        onVote={handlePendingVote}
        onAssess={handlePendingAssess}
      />
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
          data={pageData}
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
      {#if ChatTab}
        <svelte:component this={ChatTab} {data} {highlightedCommentId} fullscreen={isCompact} />
      {:else}
        <p class="tab-loading">Loading chat…</p>
      {/if}
    {:else if activeTab === 'links'}
      {#if LinksTab}
        <svelte:component
          this={LinksTab}
          frame={linksFrame}
          highlightedRequestId={highlightedLinkRequestId}
        />
      {:else}
        <p class="tab-loading">Loading links…</p>
      {/if}
    {:else if HistoryTab}
      <svelte:component this={HistoryTab} {data} {highlightedDecisionId} />
    {:else}
      <p class="tab-loading">Loading history…</p>
    {/if}
  </section>

  {#if pendingAssessmentPlan && Wizard}
    <svelte:component
      this={Wizard}
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

  .tab-loading {
    margin: 16px 4px;
    color: var(--text-muted);
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

  @media (max-width: 1080px) {
    .page {
      min-width: 0;
      overflow-x: clip;
    }

    .page-chat {
      grid-template-rows: minmax(0, 1fr);
      gap: 0;
      height: calc(
        var(--shell-visual-viewport-height, 100dvh) - var(--topbar-height) -
          var(--shell-bottom-nav-offset)
      );
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

    .chat-tab-active :global(.top-tab-row) {
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
  }
</style>
