<script lang="ts">
  import { onMount } from 'svelte';
  import DecisionHistoryList from '$lib/components/shared/DecisionHistoryList.svelte';
  import { getEventHistory } from '$lib/services/queries/details';
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

  let entries: DecisionHistoryEntry[] = data.history ?? [];
  let loading = entries.length === 0;
  let loadedForSlug = '';

  async function loadHistory() {
    const slug = data.slug;
    loading = entries.length === 0;
    try {
      entries = await getEventHistory(slug);
      loadedForSlug = slug;
    } catch {
      if (loadedForSlug !== slug) {
        entries = data.history ?? [];
      }
    } finally {
      loading = false;
    }
  }

  $: if (data.slug && data.slug !== loadedForSlug) {
    void loadHistory();
  }

  onMount(() => {
    void loadHistory();
  });

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

    await invalidateEventDetail(data.slug);
    loadedForSlug = '';
    await loadHistory();
  }
</script>

<DecisionHistoryList
  title="History"
  description="Open, approved, and rejected event decisions stay here in one timeline. Open decisions can still be voted from this tab."
  entries={entries}
  {highlightedDecisionId}
  emptyMessage={loading ? 'Loading event history…' : 'No event decision history yet.'}
  onVote={handleVote}
/>
