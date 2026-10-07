<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { ProjectMode, SubjectKind } from '$lib/types/feed';
  import {
    surfaceAccentCssVar,
    surfaceIconForKind,
    surfaceTypeAccent,
    surfaceTypeLabel
  } from '$lib/utils/surfaceType';

  export let kind: SubjectKind;
  export let projectMode: ProjectMode = 'productive';

  $: label = surfaceTypeLabel(kind, projectMode);
  $: accent = surfaceTypeAccent(kind, projectMode);
  $: icon = surfaceIconForKind(kind);
  $: accentColor = surfaceAccentCssVar(accent);
</script>

<span class="surface-type-label" style={`--surface-accent: ${accentColor}`}>
  <SurfaceIcon {icon} size="sm" />
  <span class="label-copy">{label}</span>
</span>

<style>
  .surface-type-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    color: color-mix(in srgb, var(--text-soft) 78%, transparent);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.2;
  }

  .label-copy {
    color: inherit;
    min-width: 0;
    white-space: normal;
  }

  @media (max-width: 760px) {
    .surface-type-label {
      font-size: 10px;
      letter-spacing: 0.02em;
    }
  }
</style>
