<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import DecisionHistoryList from '$lib/components/shared/DecisionHistoryList.svelte';
  import {
    setEventEditVote,
    setEventPhaseChangeVote,
    setEventUpdateVote
  } from '$lib/services/queries/details';
  import type { DecisionHistoryEntry, EventPageData, ProjectApprovalVote } from '$lib/types/detail';

  export let data: EventPageData;
    export let highlightedDecisionId: string | null = null;

  async function handleVote(entry: DecisionHistoryEntry, vote: ProjectApprovalVote | null) {
    switch (entry.kind) {
      case 'event-phase-change':
        await setEventPhaseChangeVote(data.slug, entry.id, vote);
        break;
      case 'event-update':
        await setEventUpdateVote(data.slug, entry.id, vote);
        break;
      case 'event-edit':
        await setEventEditVote(data.slug, entry.id, vote);
        break;
      default:
        return;
    }

    await invalidateAll();
  }
</script>

<DecisionHistoryList
  title="History"
  description="Open, approved, and rejected event decisions stay here in one timeline. Open decisions can still be voted from this tab."
  entries={data.history}
  {highlightedDecisionId}
  emptyMessage="No event decision history yet."
  onVote={handleVote}
/>
