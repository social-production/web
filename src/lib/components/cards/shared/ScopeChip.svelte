<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  export let label: string;
  export let icon: SurfaceIconId = 'channel';
  export let href: string | null = null;
</script>

{#if href}
  <a class="scope-chip" {href} title={label} aria-label={label}>
    <SurfaceIcon {icon} size="sm" />
    <span>{label}</span>
  </a>
{:else}
  <span class="scope-chip" title={label} aria-label={label}>
    <SurfaceIcon {icon} size="sm" />
    <span>{label}</span>
  </span>
{/if}

<style>
  .scope-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    max-width: 100%;
    padding: 3px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: transparent;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    white-space: nowrap;
  }

  a.scope-chip:hover {
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .scope-chip span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 760px) {
    .scope-chip {
      gap: 3px;
      padding: 2px 5px;
      font-size: clamp(8px, 2.6vw, 10px);
    }
  }
</style>
