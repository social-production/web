<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import ProjectLifecyclePanel from '$lib/features/projects/detail/ProjectLifecyclePanel.svelte';
  import ProjectMembersPanel from '$lib/features/projects/detail/ProjectMembersPanel.svelte';
  import ProjectOverviewHeader from '$lib/features/projects/detail/ProjectOverviewHeader.svelte';
  import ProjectUpdatesSection from '$lib/features/projects/detail/ProjectUpdatesSection.svelte';
  import DetailTopTabs from '$lib/features/detail/DetailTopTabs.svelte';
  import type { DetailTabId } from '$lib/features/detail/detailTabs';
  import PendingVotesPanel from '$lib/components/shared/PendingVotesPanel.svelte';
  import ParticipationSteps from '$lib/components/shared/ParticipationSteps.svelte';
  import { isPersonalServiceProject } from '$lib/features/projects/projectMode';
  import {
    setProjectEditVote,
    setProjectMergeCapabilityChangeVote,
    setProjectPhaseChangeVote,
    setProjectPlanCriterionRating,
    setProjectPlanOverallVote,
    setProjectPlanValueVote,
    setProjectPullRequestVote,
    setProjectRepositoryReplacementVote,
    setProjectUpdateVote,
  } from '$lib/services/commands/projects';
  import type {
    DetailLinksFrameData,
    DecisionHistoryEntry,
    PlanCriterionRating,
    ProjectApprovalVote,
    ProjectPageData,
  } from '$lib/types/detail';
  import { getProjectHistory, getProjectLinks } from '$lib/services/queries/details';
  import { emptyLinksFrame } from '$lib/utils/emptyLinksFrame';
  import { invalidateProjectDetail } from '$lib/utils/detailInvalidation';
  import {
    buildProjectParticipationSteps,
    resolveCurrentParticipationStep,
  } from '$lib/utils/participationSteps';
  import {
    collectProjectPendingVotes,
    scrollToPendingVote,
    type PendingVoteItem,
  } from '$lib/utils/pendingVotes';
  import { applySignalToggleToDetailPhaseOneImmutable } from '$lib/utils/feedSignals';
  import type { SignalToggleResult } from '$lib/types/feed';

  export let data: ProjectPageData;

  let pageData = data;
  let lastLoaderData = data;

  $: if (data !== lastLoaderData) {
    lastLoaderData = data;
    pageData = data;
    if (data.slug !== linksSlug) {
      linksSlug = '';
    }
    if (data.slug !== historySlug) {
      historySlug = '';
      historyEntries = [];
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
  let ChatTab: typeof import('$lib/features/projects/detail/ProjectChatTab.svelte').default | null =
    null;
  let HistoryTab: typeof import('$lib/features/projects/detail/ProjectHistoryTab.svelte').default | null =
    null;
  let LinksTab: typeof import('$lib/features/detail-links/DetailLinksTab.svelte').default | null = null;
  let Wizard: typeof import('$lib/components/shared/PlanAssessmentWizard.svelte').default | null =
    null;
  let linksFrame: DetailLinksFrameData = data.linksFrame ?? emptyLinksFrame('project', data.slug);
  let linksSlug = '';
  let historyEntries: DecisionHistoryEntry[] = data.history ?? [];
  let historySlug = '';
  let historyLoading = false;

  async function ensureTabComponent(tab: DetailTabId) {
    if (tab === 'chat' && !ChatTab) {
      ChatTab = (await import('$lib/features/projects/detail/ProjectChatTab.svelte')).default;
    } else if (tab === 'history' && !HistoryTab) {
      HistoryTab = (await import('$lib/features/projects/detail/ProjectHistoryTab.svelte')).default;
    } else if (tab === 'links' && !LinksTab) {
      LinksTab = (await import('$lib/features/detail-links/DetailLinksTab.svelte')).default;
    }
  }

  function prefetchTab(tab: DetailTabId) {
    void ensureTabComponent(tab);
    if (tab === 'links' && linksSlug !== data.slug) {
      void loadLinks();
    }
    if (tab === 'history' && historySlug !== data.slug) {
      void loadHistory();
    }
  }

  async function loadLinks() {
    const slug = data.slug;
    try {
      linksFrame = await getProjectLinks(slug);
      linksSlug = slug;
    } catch {
      linksFrame = data.linksFrame ?? emptyLinksFrame('project', slug);
      linksSlug = slug;
    }
  }

  async function loadHistory() {
    const slug = data.slug;
    historyLoading = historyEntries.length === 0 || historySlug !== slug;
    try {
      historyEntries = await getProjectHistory(slug);
      historySlug = slug;
    } catch {
      if (historySlug !== slug) {
        historyEntries = data.history ?? [];
      }
    } finally {
      historyLoading = false;
    }
  }

  $: if (activeTab !== 'overview') {
    void ensureTabComponent(activeTab);
  }
  $: if ((activeTab === 'links' || LinksTab) && linksSlug !== data.slug) {
    void loadLinks();
  }
  $: if ((activeTab === 'history' || HistoryTab) && historySlug !== data.slug) {
    void loadHistory();
  }
  let autoExpandVoteKind: string | null = null;
  let autoExpandVoteTarget: string | null = null;
  let autoAssess = false;
  let autoAssessCriterionId: string | null = null;
  let softwareWizardRequest: { mode: 'record-merge' | 'vote-pr'; requestId: string } | null = null;
  let participationAssessPlanId: string | null = null;
  let participationAssessCriterionId: string | null = null;
  let pendingAssessmentOpen = false;
  let pendingAssessmentPlanId: string | null = null;
  let pendingAssessmentPhaseId: 'phase-2' | 'phase-3' | null = null;
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

      if (voteKind === 'pull_request' || voteKind === 'pull_request_merge') {
        window.setTimeout(() => {
          document
            .getElementById(`software-pr-card-${voteTarget}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 180);
      }
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
    if (
      autoExpandVoteCards &&
      autoExpandVoteTarget &&
      (autoExpandVoteKind === 'pull_request_merge' ||
        (autoExpandVoteKind === 'pull_request' && autoAssess))
    ) {
      softwareWizardRequest = {
        mode: autoExpandVoteKind === 'pull_request_merge' ? 'record-merge' : 'vote-pr',
        requestId: autoExpandVoteTarget,
      };
    }
    if ($page.url.hash === '#pending-votes-panel') {
      activeTab = 'overview';
      void focusVoteTarget(null, null);
    } else if ($page.url.hash === '#software-governance-panel') {
      activeTab = 'overview';
      void tick().then(() => {
        document
          .getElementById('software-governance-panel')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (autoExpandVoteCards) {
      void focusVoteTarget(autoExpandVoteKind, autoExpandVoteTarget);
    }
  }

  function findProjectPlan(planId: string) {
    const phaseTwoPlan = data.lifecycle.phaseTwo.plans.find((plan) => plan.id === planId);
    if (phaseTwoPlan) {
      return { plan: phaseTwoPlan, phaseId: 'phase-2' as const };
    }

    const phaseThreePlan = data.lifecycle.phaseThree.plans.find((plan) => plan.id === planId);
    if (phaseThreePlan) {
      return { plan: phaseThreePlan, phaseId: 'phase-3' as const };
    }

    return null;
  }

  $: pendingAssessmentMatch =
    pendingAssessmentPlanId == null ? null : findProjectPlan(pendingAssessmentPlanId);
  $: pendingAssessmentPlan = pendingAssessmentMatch?.plan ?? null;
  $: if (pendingAssessmentPlan && !Wizard) {
    void import('$lib/components/shared/PlanAssessmentWizard.svelte').then((module) => {
      Wizard = module.default;
    });
  }

  $: if (isPersonalServiceProject(data.projectMode) && showMembersPanel) {
    showMembersPanel = false;
  }

  $: pendingVotes = collectProjectPendingVotes(pageData);
  $: participationSteps = buildProjectParticipationSteps(pageData, pendingVotes, {
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
    pendingAssessmentPhaseId = item.planPhaseId ?? null;
    pendingAssessmentCriterionId = item.planCriterionId ?? null;
    pendingAssessmentOpen = true;
  }

  function closePendingAssessment() {
    pendingAssessmentOpen = false;
    pendingAssessmentPlanId = null;
    pendingAssessmentPhaseId = null;
    pendingAssessmentCriterionId = null;
  }

  async function handlePendingCriterionRate(
    criterionId: string,
    rating: PlanCriterionRating | null
  ) {
    if (!pendingAssessmentPlanId || !pendingAssessmentPhaseId) {
      return;
    }

    await setProjectPlanCriterionRating(data.slug, pendingAssessmentPlanId, criterionId, rating);
    void invalidateProjectDetail(data.slug);
  }

  async function handlePendingOverallVote(vote: ProjectApprovalVote | null) {
    if (!pendingAssessmentPlanId || !pendingAssessmentPhaseId) {
      return;
    }

    await setProjectPlanOverallVote(
      data.slug,
      pendingAssessmentPhaseId,
      pendingAssessmentPlanId,
      vote
    );
    void invalidateProjectDetail(data.slug);
    closePendingAssessment();
  }

  async function handlePendingVote(item: PendingVoteItem, vote: ProjectApprovalVote) {
    switch (item.voteKind) {
      case 'phase_change': {
        const result = await setProjectPhaseChangeVote(data.slug, item.id, vote);
        if (result?.passed && result.targetPhaseId) {
          pageData = {
            ...pageData,
            lifecycle: {
              ...pageData.lifecycle,
              currentPhaseId: result.targetPhaseId as typeof pageData.lifecycle.currentPhaseId
            }
          };
        }
        break;
      }
      case 'update':
        await setProjectUpdateVote(data.slug, item.id, vote);
        break;
      case 'edit':
        await setProjectEditVote(data.slug, item.id, vote);
        break;
      case 'pull_request':
        await setProjectPullRequestVote(data.slug, item.id, vote);
        break;
      case 'merge_capability':
        await setProjectMergeCapabilityChangeVote(data.slug, item.id, vote);
        break;
      case 'repository_replacement':
        await setProjectRepositoryReplacementVote(data.slug, item.id, vote);
        break;
      case 'plan':
        if (item.planCriterionId) {
          await handlePendingAssess(item);
          break;
        }
        if (item.planPhaseId && item.planValueId) {
          await setProjectPlanValueVote(
            data.slug,
            item.planPhaseId,
            item.id,
            item.planValueId,
            vote
          );
        } else if (item.planPhaseId) {
          await setProjectPlanOverallVote(data.slug, item.planPhaseId, item.id, vote);
        }
        break;
      default:
        return;
    }

    void invalidateProjectDetail(data.slug);
  }

  async function handlePendingAction(item: PendingVoteItem) {
    if (item.voteKind === 'pull_request_merge') {
      softwareWizardRequest = { mode: 'record-merge', requestId: item.id };
      activeTab = 'overview';
      await tick();
      scrollToPendingVote(item.voteKind, item.id);
      return;
    }

    if (item.voteKind === 'pull_request' && item.softwareStage) {
      softwareWizardRequest = { mode: 'vote-pr', requestId: item.id };
      activeTab = 'overview';
      await tick();
      scrollToPendingVote(item.voteKind, item.id);
    }
  }
</script>

<section class="page" class:page-chat={activeTab === 'chat' && isCompact}>
  <section class="hero-card" class:chat-tab-active={activeTab === 'chat' && isCompact}>
    <DetailTopTabs {activeTab} ariaLabel="Project detail tabs" {selectTab} {prefetchTab} />

    <div
      class="tab-panel"
      class:tab-panel-hidden={activeTab !== 'overview'}
      hidden={activeTab !== 'overview'}
      inert={activeTab !== 'overview'}
    >
      <ParticipationSteps
        steps={participationSteps}
        currentStepId={currentParticipationStep}
        {pendingVotes}
        {pageData}
        placement="lead"
        on:dismiss={handleParticipationDismiss}
      />
      <ProjectOverviewHeader
        data={pageData}
        signalChange={handleSignalChange}
        onMembershipChange={handleMembershipChange}
      />
      <PendingVotesPanel
        items={pendingVotes}
        onVote={handlePendingVote}
        onAssess={handlePendingAssess}
        onAction={handlePendingAction}
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
          data={pageData}
          {autoExpandVoteCards}
          {autoExpandVoteKind}
          {autoExpandVoteTarget}
          {autoAssess}
          {autoAssessCriterionId}
          {participationAssessPlanId}
          {participationAssessCriterionId}
          votesRenderedInHub={pendingVotes.length > 0}
          {softwareWizardRequest}
          onSoftwareWizardRequestHandled={() => {
            softwareWizardRequest = null;
          }}
          onPhaseAdvanced={(phaseId) => {
            pageData = {
              ...pageData,
              lifecycle: { ...pageData.lifecycle, currentPhaseId: phaseId }
            };
          }}
        />
      </div>
    </div>
    {#if ChatTab}
      <div
        class="tab-panel"
        class:tab-panel-hidden={activeTab !== 'chat'}
        hidden={activeTab !== 'chat'}
        inert={activeTab !== 'chat'}
      >
        <svelte:component this={ChatTab} {data} {highlightedCommentId} fullscreen={isCompact} active={activeTab === 'chat'} />
      </div>
    {:else if activeTab === 'chat'}
      <p class="tab-loading">Loading chat…</p>
    {/if}
    {#if LinksTab}
      <div
        class="tab-panel"
        class:tab-panel-hidden={activeTab !== 'links'}
        hidden={activeTab !== 'links'}
        inert={activeTab !== 'links'}
      >
        <svelte:component
          this={LinksTab}
          frame={linksFrame}
          highlightedRequestId={highlightedLinkRequestId}
        />
      </div>
    {:else if activeTab === 'links'}
      <p class="tab-loading">Loading links…</p>
    {/if}
    {#if HistoryTab}
      <div
        class="tab-panel"
        class:tab-panel-hidden={activeTab !== 'history'}
        hidden={activeTab !== 'history'}
        inert={activeTab !== 'history'}
      >
        <svelte:component
          this={HistoryTab}
          {data}
          {highlightedDecisionId}
          entries={historyEntries}
          loading={historyLoading}
          onReload={loadHistory}
        />
      </div>
    {:else if activeTab === 'history'}
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
      canVote={pendingAssessmentPhaseId === 'phase-3'
        ? data.lifecycle.phaseThree.viewerCanVoteOnPlans
        : data.lifecycle.phaseTwo.viewerCanVoteOnPlans}
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

  .tab-panel-hidden {
    display: none !important;
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

    .chat-tab-active > :global(.tab-panel:not([hidden])) {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .chat-tab-active > :global(.tab-panel:not([hidden]) .chat-shell) {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }
  }
</style>
