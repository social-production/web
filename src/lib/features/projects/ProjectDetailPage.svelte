<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import ProjectLifecyclePanel from '$lib/features/projects/detail/ProjectLifecyclePanel.svelte';
  import ProjectMembersPanel from '$lib/features/projects/detail/ProjectMembersPanel.svelte';
  import ProjectOverviewHeader from '$lib/features/projects/detail/ProjectOverviewHeader.svelte';
  import DetailTopTabs from '$lib/features/detail/DetailTopTabs.svelte';
  import DetailActionDock from '$lib/features/detail/DetailActionDock.svelte';
  import { detailTabFromParam, type DetailTabId } from '$lib/features/detail/detailTabs';
  import VoteDockControl from '$lib/components/shared/VoteDockControl.svelte';
  import { isPersonalServiceProject } from '$lib/features/projects/projectMode';
  import MembershipSplitButton from '$lib/components/shared/MembershipSplitButton.svelte';
  import {
    setProjectEditVote,
    setProjectMergeCapabilityChangeVote,
    setProjectPhaseChangeVote,
    setProjectPlanCriterionRating,
    setProjectPlanOverallVote,
    setProjectPlanValueVote,
    setProjectPullRequestVote,
    setProjectRepositoryReplacementVote,
    setProjectServiceRequestSettingsChangeVote,
    setProjectUpdateVote,
    toggleProjectMembership,
  } from '$lib/services/commands/projects';
  import type {
    DetailLinksFrameData,
    DecisionHistoryEntry,
    PlanCriterionRating,
    ProjectApprovalVote,
    ProjectLifecyclePhaseId,
    ProjectPageData,
  } from '$lib/types/detail';
  import { getProjectHistory, getProjectLinks } from '$lib/services/queries/details';
  import { emptyLinksFrame } from '$lib/utils/emptyLinksFrame';
  import { invalidateProjectDetail } from '$lib/utils/detailInvalidation';
  import {
    collectProjectPendingVotes,
    scrollToPendingVote,
    type PendingVoteItem,
  } from '$lib/utils/pendingVotes';
  import { applySignalToggleToDetailPhaseOneImmutable } from '$lib/utils/feedSignals';
  import type { SignalToggleResult } from '$lib/types/feed';
  import { scrollElementIntoViewWithOffset } from '$lib/utils/scrollAnchors';
  import { requireViewer } from '$lib/utils/requireViewer';

  export let data: ProjectPageData;

  let pageData = data;
  let lastLoaderData = data;
  let selectedPhaseId: ProjectLifecyclePhaseId = data.lifecycle.currentPhaseId;

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
  let activeTab: DetailTabId = 'context';
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

  $: if (activeTab === 'chat' || activeTab === 'links' || activeTab === 'history') {
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
  let assessmentRatingOverlay: Record<string, PlanCriterionRating | null> = {};
  let assessmentPlanSnapshot: NonNullable<ReturnType<typeof findProjectPlan>>['plan'] | null = null;
  let isCompact = false;

  onMount(() => {
    const media = window.matchMedia('(max-width: 1080px)');
    const syncCompact = () => {
      isCompact = media.matches;
    };

    syncCompact();
    media.addEventListener('change', syncCompact);

    // Keep phase/vote state fresh without manual reloads. Skips hidden tabs and
    // moments where the viewer is typing into a composer.
    const detailPoll = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      const active = document.activeElement;
      const typing =
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (typing) {
        return;
      }
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }
      void invalidateProjectDetail(pageData.slug);
    }, 45_000);

    return () => {
      media.removeEventListener('change', syncCompact);
      window.clearInterval(detailPoll);
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
          const card = document.getElementById(`software-pr-card-${voteTarget}`);
          if (card) {
            scrollElementIntoViewWithOffset(card);
          }
        }, 180);
      }
      return;
    }

    const panel = document.getElementById('pending-votes-panel');
    if (panel) {
      scrollElementIntoViewWithOffset(panel);
    }
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

    if (tab === 'context' || tab === 'participation') {
      nextUrl.searchParams.delete('comment');
      nextUrl.searchParams.delete('update');
      nextUrl.searchParams.delete('decision');
      nextUrl.searchParams.delete('linkRequest');
      nextUrl.hash = '';
      if (tab === 'context') {
        nextUrl.searchParams.delete('tab');
      } else {
        nextUrl.searchParams.set('tab', 'participation');
      }
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

    showMembersPanel = !showMembersPanel;
  }

  $: {
    const routeSignature = `${$page.url.pathname}${$page.url.search}${$page.url.hash}`;

    autoExpandVoteCards = $page.url.searchParams.get('open') === 'vote';
    autoExpandVoteKind = autoExpandVoteCards
      ? $page.url.searchParams.get('voteKind') || null
      : null;
    autoExpandVoteTarget = autoExpandVoteCards
      ? $page.url.searchParams.get('voteTarget') || null
      : null;
    autoAssess = $page.url.searchParams.get('assess') === '1';
    autoAssessCriterionId = $page.url.searchParams.get('criterionId') || null;

    if (routeSignature !== lastRouteSignature) {
      lastRouteSignature = routeSignature;
      highlightedCommentId = readCommentTarget($page.url);
      highlightedUpdateId = readUpdateTarget($page.url);
      highlightedDecisionId = readDecisionTarget($page.url);
      highlightedLinkRequestId = $page.url.searchParams.get('linkRequest');
      const requestedTab = detailTabFromParam($page.url.searchParams.get('tab'));
      activeTab = highlightedCommentId
        ? 'chat'
        : highlightedDecisionId
          ? 'history'
          : highlightedLinkRequestId
            ? 'links'
            : requestedTab ?? 'context';
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
      if (autoExpandVoteCards && (autoExpandVoteKind === 'edit' || autoExpandVoteKind === 'update')) {
        activeTab = 'context';
      } else if (
        $page.url.hash === '#pending-votes-panel' ||
        $page.url.hash === '#phase-change-votes-panel' ||
        $page.url.hash === '#software-governance-panel' ||
        autoExpandVoteCards
      ) {
        activeTab = 'participation';
      }
      if ($page.url.hash === '#pending-votes-panel') {
        void focusVoteTarget(null, null);
      } else if ($page.url.hash === '#software-governance-panel') {
        void tick().then(() => {
          const panel = document.getElementById('software-governance-panel');
          if (panel) {
            scrollElementIntoViewWithOffset(panel);
          }
        });
      } else if (autoExpandVoteCards) {
        void focusVoteTarget(autoExpandVoteKind, autoExpandVoteTarget);
      }
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
  $: if (pendingAssessmentPlan) {
    assessmentPlanSnapshot = pendingAssessmentPlan;
  }
  $: pendingWizardCriteria = (assessmentPlanSnapshot?.criterionAssessments ?? []).map((entry) =>
    Object.prototype.hasOwnProperty.call(assessmentRatingOverlay, entry.criterionId)
      ? { ...entry, activeRating: assessmentRatingOverlay[entry.criterionId] ?? null }
      : entry
  );
  $: if (pendingAssessmentPlan && !Wizard) {
    void import('$lib/components/shared/PlanAssessmentWizard.svelte').then((module) => {
      Wizard = module.default;
    });
  }

  $: if (isPersonalServiceProject(data.projectMode) && showMembersPanel) {
    showMembersPanel = false;
  }

  $: dockVotes = collectProjectPendingVotes(pageData);
  $: detailVotes = dockVotes.filter((item) => item.voteKind === 'edit' || item.voteKind === 'update');
  $: phaseChangeVotes = dockVotes.filter((item) => item.voteKind === 'phase_change');
  $: participationVotes = dockVotes.filter(
    (item) => item.voteKind !== 'edit' && item.voteKind !== 'update'
  );
  $: showParticipationJoin =
    !isPersonalServiceProject(pageData.projectMode) &&
    !pageData.viewerIsMember &&
    pageData.viewerCanToggleMembership;

  function handleSignalChange(result: SignalToggleResult) {
    pageData = applySignalToggleToDetailPhaseOneImmutable(pageData, result);
  }

  function handleMembershipChange(next: { viewerIsMember: boolean; memberCount: number }) {
    pageData = { ...pageData, ...next };
  }

  async function handleMembershipToggle() {
    if (!requireViewer($page.data.bootstrap?.viewer, 'Sign in to join this project.')) {
      return;
    }

    const wasMember = pageData.viewerIsMember;
    const previousCount = pageData.memberCount;
    handleMembershipChange({
      viewerIsMember: !wasMember,
      memberCount: previousCount + (wasMember ? -1 : 1)
    });

    try {
      await toggleProjectMembership(pageData.slug);
      void invalidateProjectDetail(pageData.slug);
    } catch {
      handleMembershipChange({
        viewerIsMember: wasMember,
        memberCount: previousCount
      });
    }
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
    assessmentPlanSnapshot = null;
    assessmentRatingOverlay = {};
  }

  async function handlePendingCriterionRate(
    criterionId: string,
    rating: PlanCriterionRating | null
  ) {
    if (!pendingAssessmentPlanId || !pendingAssessmentPhaseId) {
      return;
    }

    assessmentRatingOverlay = { ...assessmentRatingOverlay, [criterionId]: rating };
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

  async function handlePendingVote(item: PendingVoteItem, vote: ProjectApprovalVote | null) {
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
      case 'request_settings':
        await setProjectServiceRequestSettingsChangeVote(data.slug, item.id, vote);
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
      activeTab = 'participation';
      await tick();
      scrollToPendingVote(item.voteKind, item.id);
      return;
    }

    if (item.voteKind === 'pull_request' && item.softwareStage) {
      softwareWizardRequest = { mode: 'vote-pr', requestId: item.id };
      activeTab = 'participation';
      await tick();
      scrollToPendingVote(item.voteKind, item.id);
    }
  }
</script>

<section class="page" class:page-chat={activeTab === 'chat' && isCompact}>
  <section class="hero-card" class:chat-tab-active={activeTab === 'chat' && isCompact}>
    <DetailTopTabs {activeTab} ariaLabel="Project detail tabs" {selectTab} {prefetchTab} />

    <div
      class="tab-panel context-tab"
      class:tab-panel-hidden={activeTab !== 'context'}
      hidden={activeTab !== 'context'}
      inert={activeTab !== 'context'}
    >
      <ProjectOverviewHeader
        data={pageData}
        {showMembersPanel}
        onToggleMembers={handleMembersPanelOpen}
        signalChange={handleSignalChange}
        onMembershipChange={handleMembershipChange}
        actionsActive={activeTab === 'context'}
        {detailVotes}
        onDetailVote={handlePendingVote}
        onDetailAssess={handlePendingAssess}
        onDetailAction={handlePendingAction}
        openVoteKind={autoExpandVoteKind}
        openVoteId={autoExpandVoteTarget}
      />
    </div>

    <div
      class="tab-panel participation-tab"
      class:tab-panel-hidden={activeTab !== 'participation'}
      hidden={activeTab !== 'participation'}
      inert={activeTab !== 'participation'}
    >
      <DetailActionDock active={activeTab === 'participation'}>
        {#if showParticipationJoin}
          <div class="participation-membership">
            <MembershipSplitButton
              joined={pageData.viewerIsMember}
              count={pageData.memberCount}
              canToggle={pageData.viewerCanToggleMembership}
              canOpenMembers={!isPersonalServiceProject(pageData.projectMode)}
              membersOpen={showMembersPanel}
              joinAriaLabel="Join project"
              membersAriaLabel={`${pageData.memberCount} members`}
              onToggleJoin={handleMembershipToggle}
              onOpenMembers={handleMembersPanelOpen}
            />
          </div>
        {/if}
        <div id="detail-participation-actions"></div>
        <VoteDockControl
          items={participationVotes}
          sheetId="project-participation-votes"
          buttonTarget="phase-nav-vote"
          revealKind={autoExpandVoteKind === 'edit' || autoExpandVoteKind === 'update' ? null : autoExpandVoteKind}
          revealId={autoExpandVoteKind === 'edit' || autoExpandVoteKind === 'update' ? null : autoExpandVoteTarget}
          onVote={handlePendingVote}
          onAssess={handlePendingAssess}
          onAction={handlePendingAction}
        />
      </DetailActionDock>
      <div id="governance" class="overview-governance">
        <ProjectLifecyclePanel
          data={pageData}
          bind:selectedPhaseId
          {autoExpandVoteCards}
          {autoExpandVoteKind}
          {autoExpandVoteTarget}
          {autoAssess}
          {autoAssessCriterionId}
          {participationAssessPlanId}
          {participationAssessCriterionId}
          votesRenderedInHub={phaseChangeVotes.length > 0}
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
        class="tab-panel chat-tab"
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

  {#if !isPersonalServiceProject(pageData.projectMode)}
    <ProjectMembersPanel
      data={pageData}
      open={showMembersPanel}
      on:close={() => (showMembersPanel = false)}
    />
  {/if}

  {#if assessmentPlanSnapshot && Wizard && pendingAssessmentOpen}
    <svelte:component
      this={Wizard}
      open={pendingAssessmentOpen}
      plan={assessmentPlanSnapshot}
      planTitle={assessmentPlanSnapshot.title}
      criteria={pendingWizardCriteria}
      canVote={pendingAssessmentPhaseId === 'phase-3'
        ? data.lifecycle.phaseThree.viewerCanVoteOnPlans
        : data.lifecycle.phaseTwo.viewerCanVoteOnPlans}
      initialCriterionId={pendingAssessmentCriterionId}
      openAtOverallStep={!pendingAssessmentCriterionId}
      overallActiveVote={assessmentPlanSnapshot.overallApproval.activeVote}
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
    min-width: 0;
    overflow-x: clip;
  }

  .tab-loading {
    margin: 16px 4px;
    color: var(--text-muted);
  }

  .tab-panel {
    min-width: 0;
    overflow-x: clip;
  }

  .tab-panel.context-tab,
  .tab-panel.participation-tab,
  .context-tab,
  .participation-tab {
    display: flex;
    flex-direction: column;
    overflow: visible;
    padding-bottom: calc(var(--detail-action-dock-height, 0px) + 12px);
  }

  .hero-card:has(> .context-tab:not(.tab-panel-hidden)),
  .hero-card:has(> .participation-tab:not(.tab-panel-hidden)) {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-height: calc(
      100dvh - var(--topbar-height, 56px) - var(--shell-bottom-nav-offset, 0px) - 32px
    );
    margin-bottom: -16px;
    padding-bottom: var(--detail-action-dock-height, 0px);
  }

  .tab-panel.context-tab,
  .tab-panel.participation-tab {
    flex: 1 1 auto;
    padding-bottom: 0;
  }

  .participation-tab > :global(*) {
    order: 50;
  }

  .participation-tab :global(.detail-action-dock) {
    order: 0;
  }

  .participation-tab :global(.overview-governance) {
    display: contents;
  }

  .participation-tab :global(.overview-phase-tabs) {
    order: 1;
    margin: 0;
  }

  .participation-tab :global(.pending-votes-panel.phase-title) {
    order: 2;
    margin-top: 12px;
  }

  .participation-tab :global(.overview-phase-context) {
    order: 3;
    margin-top: 16px;
  }

  .participation-tab :global(.pending-votes-panel) {
    order: 4;
  }

  .participation-tab :global(.overview-phase-work) {
    order: 5;
    margin-top: 16px;
  }

  .participation-tab :global(.overview-composer),
  .participation-tab :global(.overview-edit-votes) {
    order: 5;
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
    min-width: 0;
    overflow: visible;
  }

  @media (min-width: 1081px) {
    .hero-card:has(> .chat-tab:not(.tab-panel-hidden)) {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      height: calc(100dvh - var(--topbar-height, 56px) - var(--shell-bottom-nav-offset, 0px) - 32px);
      min-height: 0;
      padding: 0;
      overflow: visible;
    }

    .chat-tab:not(.tab-panel-hidden) {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .chat-tab :global(.chat-shell) {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
      margin: 0;
    }

    .chat-tab :global(.chat-panel) {
      flex: 1 1 auto;
      height: auto;
      min-height: 0;
      max-height: none;
      border: 0;
      border-radius: 0;
      background: transparent;
    }

    .chat-tab :global(.chat-header) {
      min-height: 72px;
      padding: 30px 16px 14px;
      align-content: end;
    }
  }

  @media (max-width: 1080px) {
    .page {
      overflow-x: clip;
      overflow-y: visible;
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
      overflow: visible;
      padding-top: 0;
      margin-top: 0;
      border-radius: 0;
    }

    .hero-card:has(> .context-tab:not(.tab-panel-hidden)),
    .hero-card:has(> .participation-tab:not(.tab-panel-hidden)) {
      min-height: calc(
        100dvh - var(--topbar-height, 56px) - var(--shell-bottom-nav-offset, 0px)
      );
      margin-bottom: -4px;
    }

    .hero-card.chat-tab-active {
      overflow: hidden;
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
