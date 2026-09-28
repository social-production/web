<script lang="ts">
  import DetailPhaseStepper from '$lib/features/detail/DetailPhaseStepper.svelte';
  import type { EventLifecyclePhase, EventLifecyclePhaseId } from '$lib/types/detail';
  import type { EventLifecycleTabItem } from '../lifecycle/eventLifecycleShared';

  export let tabs: EventLifecycleTabItem[] = [];
  export let activePhaseId: EventLifecyclePhaseId;
  export let selectPhase: (phase: EventLifecyclePhase) => void = () => {};

  function compactTitle(title: string) {
    const trimmed = title.trim();
    if (/^event\s+plan$/i.test(trimmed)) {
      return 'Plan';
    }
    return trimmed.replace(/\s+Plan$/i, '').trim() || trimmed;
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
