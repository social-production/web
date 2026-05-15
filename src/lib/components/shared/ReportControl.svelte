<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ReportComposerModal from '$lib/components/shared/ReportComposerModal.svelte';
  import ReportMenu from '$lib/components/shared/ReportMenu.svelte';
  import { setReportVote, submitReport } from '$lib/services/queries/details';
  import type { ContentReportReason, ContentReportSummary } from '$lib/types/detail';

  export let subjectId = '';
  export let targetId = '';
  export let itemLabel = 'item';
  export let report: ContentReportSummary | null = null;
  export let ownerUsername = '';

  let modalOpen = false;
  let pending = false;
  let reason: ContentReportReason = 'spam';
  let description = '';

  $: viewerUsername = $page.data.bootstrap?.viewer?.username ?? null;

  $: blockedMessage =
    viewerUsername && ownerUsername && viewerUsername === ownerUsername ? "You can't report yourself" : '';

  function closeComposer() {
    modalOpen = false;
    reason = 'spam';
    description = '';
  }

  function openComposer() {
    modalOpen = true;
  }

  async function submitActiveReport() {
    if (!subjectId || !targetId) {
      return;
    }

    pending = true;

    try {
      await submitReport(subjectId, targetId, reason, description);
      await invalidateAll();
      closeComposer();
    } finally {
      pending = false;
    }
  }

  async function voteOnReport(vote: 'yes' | 'no') {
    if (!report) {
      return;
    }

    pending = true;

    try {
      await setReportVote(report.targetId, vote);
      await invalidateAll();
    } finally {
      pending = false;
    }
  }
</script>

<div class="report-control">
  <ReportMenu
    {blockedMessage}
    {itemLabel}
    {pending}
    {report}
    on:compose={openComposer}
    on:vote={(event) => voteOnReport(event.detail.vote)}
  />

  <ReportComposerModal
    bind:description
    bind:reason
    itemLabel={itemLabel}
    open={modalOpen}
    pending={pending}
    on:close={closeComposer}
    on:submit={submitActiveReport}
  />
</div>

<style>
  .report-control {
    display: grid;
    justify-items: end;
  }
</style>