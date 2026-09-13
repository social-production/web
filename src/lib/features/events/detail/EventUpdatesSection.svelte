<script lang="ts">
  import AddUpdateSheet from '$lib/components/shared/AddUpdateSheet.svelte';
  import DetailUpdateCard from '$lib/components/cards/details/DetailUpdateCard.svelte';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import { requestEventUpdate } from '$lib/services/commands/events';
  import type { EventPageData } from '$lib/types/detail';
  import { invalidateEventDetail } from '$lib/utils/detailInvalidation';

  export let data: EventPageData;
  export let highlightedUpdateId: string | null = null;

  let showUpdateComposer = false;
  let draftUpdateBody = '';
  let updatePending = false;
  let updateMessage = '';

  $: canProposeUpdate = data.viewerCanRequestUpdate && data.updateRequests.length === 0;

  function toggleUpdateComposer() {
    showUpdateComposer = !showUpdateComposer;
    if (showUpdateComposer) {
      updateMessage = '';
    }
  }

  async function submitUpdate() {
    if (!draftUpdateBody.trim()) {
      updateMessage = 'Write an update before submitting.';
      return;
    }

    updatePending = true;
    updateMessage = '';

    try {
      await requestEventUpdate(data.slug, draftUpdateBody);
      draftUpdateBody = '';
      showUpdateComposer = false;
      void invalidateEventDetail(data.slug);
    } catch {
      updateMessage = 'This update request could not be submitted. Reload and try again.';
    } finally {
      updatePending = false;
    }
  }
</script>

<section class="updates-shell overview-updates" id="updates">
  <div class="updates-title-row">
    <h2>Updates</h2>
    {#if canProposeUpdate}
      <RoundPlusButton
        active={showUpdateComposer}
        label="Add update"
        ariaLabel="Add update"
        action={toggleUpdateComposer}
      />
    {/if}
  </div>

  <AddUpdateSheet
    bind:open={showUpdateComposer}
    bind:body={draftUpdateBody}
    message={updateMessage}
    pending={updatePending}
    sheetTitle="Add update"
    submitLabel="Propose update"
    placeholder="Share what changed for this event..."
    labelledById="event-add-update-sheet"
    onSubmit={submitUpdate}
  />

  <div class:scrollable={data.updates.length > 4} class="stack updates-list">
    {#if data.updates.length === 0}
      <div class="empty-card">
        <p>No updates yet.</p>
      </div>
    {:else}
      {#each data.updates as update}
        <DetailUpdateCard {update} {highlightedUpdateId} />
      {/each}
    {/if}
  </div>
</section>

<style>
  .updates-shell,
  .stack {
    display: grid;
    gap: 18px;
    min-width: 0;
  }

  .updates-list {
    gap: 0;
  }

  .updates-list :global(.update-card) {
    border-radius: 0;
  }

  .updates-list :global(.update-card + .update-card) {
    border-top: none;
  }

  .updates-list :global(.update-card:first-child) {
    border-top-left-radius: var(--radius-sm);
    border-top-right-radius: var(--radius-sm);
  }

  .updates-list :global(.update-card:last-child) {
    border-bottom-left-radius: var(--radius-sm);
    border-bottom-right-radius: var(--radius-sm);
  }

  .updates-shell {
    padding: 24px 0 22px;
    border-bottom: 1px solid var(--panel-border);
  }

  .updates-title-row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }

  h2 {
    margin: 0;
    font-size: 18px;
    text-align: center;
    color: var(--text-main);
  }

  p {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    min-width: 0;
  }

  .updates-list.scrollable {
    overflow: visible;
    overflow-y: auto;
    padding-right: 6px;
    scrollbar-gutter: stable;
  }
</style>
