<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  export let href: string;
  export let icon: SurfaceIconId;
  export let label: string;
  export let active = false;
</script>

<a class="rail-link-row" class:active {href} on:click>
  <SurfaceIcon {icon} size="sm" />
  <span class="label">{label}</span>
  <span class="trailing"><slot name="trailing" /></span>
</a>

<style>
  .rail-link-row {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    background: transparent;
    transition: background-color 0.16s ease, color 0.16s ease;
  }

  .rail-link-row:hover {
    background: var(--panel-strong);
  }

  .rail-link-row.active {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trailing {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .trailing:empty {
    display: none;
  }
</style>
