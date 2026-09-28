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

  function compactTitle(title: string) {
    return title.replace(/\s+Plan$/i, '').trim() || title;
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
