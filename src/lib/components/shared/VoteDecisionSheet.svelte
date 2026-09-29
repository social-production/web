<script lang="ts">
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import VoteChoiceBar from '$lib/components/shared/VoteChoiceBar.svelte';
  import VoteDecisionBody from '$lib/components/shared/VoteDecisionBody.svelte';
  import type { ProjectApprovalVote } from '$lib/types/detail';
  import type { PendingVoteItem } from '$lib/utils/pendingVotes';

  export let item: PendingVoteItem | null = null;
  export let sheetId = 'pending-vote-sheet';
  export let onVote: (vote: ProjectApprovalVote | null) => void | Promise<void> = () => {};
  export let onAssess: () => void | Promise<void> = () => {};
  export let onAction: () => void | Promise<void> = () => {};
  export let onClose: () => void = () => {};

  function voteAndClose(vote: ProjectApprovalVote) {
    if (!item) {
      return;
    }
    const next = item.voteSummary.activeVote === vote ? null : vote;
    onClose();
    void onVote(next);
  }

  function assessAndClose() {
    onClose();
    void onAssess();
  }

  function actionAndClose() {
    onClose();
    void onAction();
  }
</script>

{#if item}
  <OverlaySheet open={true} title={item.label} labelledById={sheetId} on:close={onClose}>
    <div class="sheet-body">
      <VoteDecisionBody
        {item}
        hideChoices
        onAssess={assessAndClose}
        onAction={actionAndClose}
      />
    </div>
    <svelte:fragment slot="footer">
      {#if item.canVote && !item.actionLabel && !item.planCriterionId}
        <VoteChoiceBar activeVote={item.voteSummary.activeVote} onChoose={voteAndClose} />
      {/if}
    </svelte:fragment>
  </OverlaySheet>
{/if}

<style>
  .sheet-body {
    padding: 4px 16px 20px;
  }

  .sheet-body :global(.vote-sheet) {
    padding-bottom: 0;
  }
</style>
