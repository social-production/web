<script lang="ts">
  import type { ProjectApprovalVote } from '$lib/types/detail';

  export let activeVote: ProjectApprovalVote | null = null;
  export let onChoose: (vote: ProjectApprovalVote) => void | Promise<void> = () => {};
</script>

<div class="choice-bar" class:chosen={Boolean(activeVote)}>
  <button
    class="choice yes"
    class:selected={activeVote === 'yes'}
    type="button"
    aria-pressed={activeVote === 'yes'}
    on:click={() => onChoose('yes')}
  >Yes</button>
  <button
    class="choice no"
    class:selected={activeVote === 'no'}
    type="button"
    aria-pressed={activeVote === 'no'}
    on:click={() => onChoose('no')}
  >No</button>
</div>

<style>
  .choice-bar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    width: 100%;
    min-height: 44px;
    margin: 0;
  }

  .choice {
    min-height: 44px;
    border: 0;
    border-radius: 0;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .choice-bar:not(.chosen) .yes,
  .choice-bar:not(.chosen) .yes:hover {
    background: var(--brand);
    color: var(--page-bg);
  }

  .choice-bar:not(.chosen) .no,
  .choice-bar:not(.chosen) .no:hover {
    background: var(--danger);
    color: white;
  }

  .choice-bar.chosen .choice,
  .choice-bar.chosen .choice:hover {
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .choice-bar.chosen .yes.selected,
  .choice-bar.chosen .yes.selected:hover {
    color: #22c55e;
  }

  .choice-bar.chosen .no.selected,
  .choice-bar.chosen .no.selected:hover {
    color: #ef4444;
  }

  .no {
    box-shadow: inset 1px 0 0 var(--panel-border);
  }

  :global(.overlay-footer:has(.choice-bar)) {
    padding: 0 0 env(safe-area-inset-bottom, 0px);
    gap: 0;
  }
</style>
