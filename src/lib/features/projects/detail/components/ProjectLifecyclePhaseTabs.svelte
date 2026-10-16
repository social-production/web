<script lang="ts">
  import DetailPhaseStepper from '$lib/features/detail/DetailPhaseStepper.svelte';
  import type { ProjectLifecyclePhase, ProjectLifecyclePhaseId } from '$lib/types/detail';

  type LifecycleTabItem = {
    phase: ProjectLifecyclePhase;
    title: string;
    progressLabel: string;
    isFuture: boolean;
  };

  export let tabs: LifecycleTabItem[] = [];
  export let activePhaseId: ProjectLifecyclePhaseId;
  export let selectPhase: (phase: ProjectLifecyclePhase) => void = () => {};

  export let note = '';

  function compactTitle(title: string) {
    return title;
  }

  function selectStep(id: string) {
    const tab = tabs.find((item) => item.phase.id === id);
    if (tab) {
      selectPhase(tab.phase);
    }
  }
</script>

<DetailPhaseStepper
  activeId={activePhaseId}
  onSelect={selectStep}
  steps={tabs.map((tab) => ({
    id: tab.phase.id,
    title: compactTitle(tab.title),
    progressLabel: tab.progressLabel,
    progressState: tab.phase.progressState,
    isFuture: tab.isFuture,
  }))}
/>
{#if note}
  <p class="phase-note">{note}</p>
{/if}

<style>
  .phase-note {
    margin: 8px 0 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }
</style>
