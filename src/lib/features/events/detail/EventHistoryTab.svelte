<script lang="ts">
  import DecisionHistoryList from '$lib/components/shared/DecisionHistoryList.svelte';
  import { invalidateEventDetail } from '$lib/utils/detailInvalidation';
  import {
    setEventEditVote,
    setEventManualLinkVote,
    setEventPhaseChangeVote,
    setEventUpdateVote
  } from '$lib/services/commands/events';
  import type { DecisionHistoryEntry, EventPageData, ProjectApprovalVote } from '$lib/types/detail';

  export let data: EventPageData;
  export let highlightedDecisionId: string | null = null;
  export let entries: DecisionHistoryEntry[] = [];
  export let loading = false;
  export let onReload: () => Promise<void> = async () => {};

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
      case 'event-link-create':
      case 'event-link-sever':
        if (!vote) return;
        await setEventManualLinkVote(data.slug, entry.id, vote);
        break;
      default:
        return;
    }

    void invalidateEventDetail(data.slug);
    void onReload();
  }
</script>

<DecisionHistoryList
  title="History"
  description="Open, approved, and rejected event decisions stay here in one timeline. Open decisions can still be voted from this tab."
  {entries}
  {highlightedDecisionId}
  emptyMessage={loading ? 'Loading event history…' : 'No event decision history yet.'}
  onVote={handleVote}
/>
