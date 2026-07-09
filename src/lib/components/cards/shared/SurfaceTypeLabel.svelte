<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { ProjectMode, SubjectKind } from '$lib/types/feed';
  import { surfaceAccentCssVar, surfaceIconForKind, surfaceTypeAccent, surfaceTypeLabel } from '$lib/utils/surfaceType';

  export let kind: SubjectKind;
  export let projectMode: ProjectMode = 'productive';

  $: label = surfaceTypeLabel(kind, projectMode);
  $: accent = surfaceTypeAccent(kind, projectMode);
  $: icon = surfaceIconForKind(kind);
  $: accentColor = surfaceAccentCssVar(accent);
</script>

<span class="surface-type-label">
  <SurfaceIcon {icon} size="sm" />
  <span class="label-copy">{label}</span>
</span>

<style>
  .surface-type-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
  }

  .label-copy {
    color: var(--text-soft);
    white-space: nowrap;
  }
</style>
