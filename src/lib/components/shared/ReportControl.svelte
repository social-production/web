<script lang="ts">
  import { page } from '$app/stores';
  import ReportComposerModal from '$lib/components/shared/ReportComposerModal.svelte';
  import ReportMenu from '$lib/components/shared/ReportMenu.svelte';
  import { setReportVote, submitReport } from '$lib/services/commands/shared';
  import type { ContentReportReason, ContentReportSummary, ModerationState } from '$lib/types/detail';
  import { isActiveReport } from '$lib/utils/moderation';
  import { invalidateAfterReport } from '$lib/utils/reportInvalidation';

  export let subjectId = '';
  export let targetId = '';
  export let targetType:
    | 'thread'
    | 'post'
    | 'comment'
    | 'event'
    | 'project'
    | 'help_request'
    | 'message'
    | undefined = undefined;
  export let itemLabel = 'item';
  export let report: ContentReportSummary | null = null;
  export let ownerUsername = '';
  export let moderationState: ModerationState | null | undefined = undefined;
  export let isUnderReview = false;
  export let hasActiveReport = false;
  /** When false, show status only (used on feed cards without report actions). */
  export let interactive = true;

  let modalOpen = false;
  let pending = false;
  let reason: ContentReportReason = 'spam';
  let description = '';
  let localReport: ContentReportSummary | null = null;
  let localModerationState: ModerationState | null | undefined = undefined;
  let menuEpoch = 0;
  let syncedReport: ContentReportSummary | null | undefined = undefined;
  let syncedModerationState: ModerationState | null | undefined = undefined;

  $: viewerUsername = $page.data.bootstrap?.viewer?.username ?? null;

  // Prefer optimistic local state, but never keep a dismissed/terminal report hanging around.
  $: activeReport = isActiveReport(localReport)
    ? localReport
    : isActiveReport(report)
      ? report
      : null;
  $: activeModerationState =
    localModerationState !== undefined && localModerationState !== null
      ? localModerationState
      : moderationState;
  $: activeUnderReview =
    isUnderReview ||
    activeModerationState === 'under_review' ||
    activeReport?.resolution === 'under_review' ||
    activeReport?.resolution === 'open';
  $: activeHasReport = hasActiveReport || !!activeReport;

  $: blockedMessage =
    viewerUsername && ownerUsername && viewerUsername === ownerUsername ? "You can't report yourself" : '';

  // Sync from parent when props refresh after invalidation, including clearing to null.
  // Skip while a mutation is in flight so a stale parent snapshot cannot wipe a fresher
  // optimistic vote/dismiss update; re-run when pending clears.
  $: if (!pending && report !== syncedReport) {
    const previousLocal = localReport;
    syncedReport = report;
    if (!isActiveReport(report)) {
      localReport = null;
      if (localModerationState === 'under_review' || localModerationState === 'hidden') {
        localModerationState = 'visible';
      }
      menuEpoch += 1;
    } else {
      const activeReport = report;
      if (
        activeReport &&
        (!previousLocal ||
          previousLocal.id !== activeReport.id ||
          activeReport.voteSummary.totalVotes >= previousLocal.voteSummary.totalVotes)
      ) {
        localReport = activeReport;
      }
    }
  }
  $: if (!pending && moderationState !== syncedModerationState) {
    syncedModerationState = moderationState;
    localModerationState = moderationState;
  }

  function closeComposer() {
    modalOpen = false;
    reason = 'spam';
    description = '';
  }

  function openComposer() {
    modalOpen = true;
  }

  function applyReport(nextReport: ContentReportSummary) {
    if (nextReport.resolution === 'dismissed') {
      localReport = null;
      localModerationState = 'visible';
      menuEpoch += 1;
      return;
    }

    localReport = nextReport;
    if (nextReport.resolution === 'hidden') {
      localModerationState = 'hidden';
    } else if (nextReport.resolution === 'removed') {
      localModerationState = 'removed';
    } else if (nextReport.resolution === 'under_review' || nextReport.resolution === 'open') {
      localModerationState = 'under_review';
    }
  }

  async function submitActiveReport() {
    if (!subjectId || !targetId) {
      return;
    }

    pending = true;

    try {
      const nextReport = await submitReport(subjectId, targetId, reason, description, targetType);
      if (nextReport) {
        applyReport(nextReport);
      } else {
        // Keep emblem optimistic without inventing a fake 1-vote threshold summary.
        localModerationState = 'under_review';
        localReport = null;
      }
      closeComposer();
      menuEpoch += 1;
      await invalidateAfterReport($page.url.pathname);
    } finally {
      pending = false;
    }
  }

  async function voteOnReport(vote: 'yes' | 'no') {
    if (!activeReport) {
      return;
    }

    pending = true;

    try {
      const nextReport = await setReportVote(activeReport.id, vote);
      if (nextReport) {
        applyReport(nextReport);
      }
      await invalidateAfterReport($page.url.pathname);
    } finally {
      pending = false;
    }
  }
</script>

<div class="report-control">
  {#key `${targetId}:${menuEpoch}:${activeReport?.id ?? 'none'}`}
    <ReportMenu
      blockedMessage={blockedMessage}
      hasActiveReport={activeHasReport}
      {interactive}
      isUnderReview={activeUnderReview}
      {itemLabel}
      moderationState={activeModerationState}
      {pending}
      report={activeReport}
      on:compose={openComposer}
      on:vote={(event) => voteOnReport(event.detail.vote)}
    />
  {/key}

  {#if interactive}
    <ReportComposerModal
      bind:description
      bind:reason
      itemLabel={itemLabel}
      open={modalOpen}
      pending={pending}
      on:close={closeComposer}
      on:submit={submitActiveReport}
    />
  {/if}
</div>

<style>
  .report-control {
    display: inline-grid;
    justify-items: start;
    flex: 0 0 auto;
    position: relative;
    z-index: 5;
    pointer-events: auto;
  }
</style>
