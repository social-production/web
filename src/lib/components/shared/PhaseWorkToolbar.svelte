<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';

  let node: HTMLDivElement;

  function place() {
    const target = document.getElementById('detail-participation-actions');
    if (target && node && node.parentElement !== target) {
      target.appendChild(node);
    }
  }

  onMount(place);
  afterUpdate(place);
  onDestroy(() => node?.remove());
</script>

<div class="phase-action-group" bind:this={node}>
  <div class="phase-action-slot adds">
    <slot />
  </div>
  <div class="phase-shifts">
    <div id="phase-nav-start" class="phase-action-slot"></div>
    <div id="phase-nav-end" class="phase-action-slot"></div>
  </div>
</div>

<style>
  .phase-action-group {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    min-width: 0;
  }

  .phase-action-group:not(:has(:global(button))) {
    display: none;
  }

  .adds,
  .phase-shifts {
    display: flex;
    align-items: stretch;
    gap: 0;
    width: 100%;
    min-width: 0;
  }

  .adds:not(:has(:global(button))),
  .phase-shifts:not(:has(:global(button))) {
    display: none;
  }

  .phase-action-slot {
    display: flex;
    flex: 1 1 0;
    align-items: stretch;
    min-width: 0;
  }

  .phase-action-slot:empty {
    display: none;
  }

  .phase-action-slot :global(.phase-nav-side) {
    display: flex;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
  }

  .phase-action-slot + .phase-action-slot:not(:empty) {
    border-left: 1px solid var(--panel-border);
  }

  .phase-shifts:not(:empty) {
    border-top: 1px solid var(--panel-border);
  }

  .adds:not(:has(:global(button))) + .phase-shifts {
    border-top: 0;
  }

  .adds :global(.round-plus-button),
  .phase-action-slot :global(.phase-shift-button) {
    flex: 1 1 auto;
    width: 100%;
    min-height: 44px;
    margin: 0;
    justify-content: center;
    border-radius: 0;
  }

  .phase-action-slot :global(.phase-shift-button) {
    border-color: var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
    box-shadow: none;
  }
</style>
