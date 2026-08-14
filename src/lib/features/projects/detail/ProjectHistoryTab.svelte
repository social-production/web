<script lang="ts">
  import DecisionHistoryList from '$lib/components/shared/DecisionHistoryList.svelte';
  import { invalidateProjectDetail } from '$lib/utils/detailInvalidation';
  import {
    setProjectEditVote,
    setProjectManualLinkVote,
    setProjectMergeCapabilityChangeVote,
    setProjectPhaseChangeVote,
    setProjectPullRequestVote,
    setProjectRepositoryReplacementVote,
    setProjectServiceRequestSettingsChangeVote,
    setProjectUpdateVote
  } from '$lib/services/commands/projects';
  import type { DecisionHistoryEntry, ProjectApprovalVote, ProjectPageData } from '$lib/types/detail';

  export let data: ProjectPageData;
  export let highlightedDecisionId: string | null = null;
  export let entries: DecisionHistoryEntry[] = [];
  export let loading = false;
  export let onReload: () => Promise<void> = async () => {};

  async function handleVote(entry: DecisionHistoryEntry, vote: ProjectApprovalVote | null) {
    switch (entry.kind) {
      case 'project-phase-change':
        await setProjectPhaseChangeVote(data.slug, entry.id, vote);
        break;
      case 'project-update':
        await setProjectUpdateVote(data.slug, entry.id, vote);
        break;
      case 'project-edit':
        await setProjectEditVote(data.slug, entry.id, vote);
        break;
      case 'project-request-settings-change':
        await setProjectServiceRequestSettingsChangeVote(data.slug, entry.id, vote);
        break;
      case 'project-pull-request-approval':
      case 'project-pull-request-confirmation':
        await setProjectPullRequestVote(data.slug, entry.id, vote);
        break;
      case 'project-merge-capability-change':
        await setProjectMergeCapabilityChangeVote(data.slug, entry.id, vote);
        break;
      case 'project-repository-replacement':
        await setProjectRepositoryReplacementVote(data.slug, entry.id, vote);
        break;
      case 'project-link-create':
      case 'project-link-sever':
        if (!vote) return;
        await setProjectManualLinkVote(data.slug, entry.id, vote);
        break;
      default:
        return;
    }

    await invalidateProjectDetail(data.slug);
    await onReload();
  }
</script>

<DecisionHistoryList
  title="History"
  description="Open, approved, and rejected project decisions stay here in one timeline. Open decisions can still be voted from this tab."
  {entries}
  {highlightedDecisionId}
  emptyMessage={loading ? 'Loading project history…' : 'No project decision history yet.'}
  onVote={handleVote}
/>
