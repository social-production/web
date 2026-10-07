<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';

  let node: HTMLDivElement;
  let observer: MutationObserver | null = null;
  let packFrame = 0;

  function place() {
    const target = document.getElementById('detail-participation-actions');
    if (target && node && node.parentElement !== target) {
      target.appendChild(node);
    }
  }

  function hasVisibleControl(element: HTMLElement) {
    const controls = element.matches('button, a')
      ? [element]
      : [...element.querySelectorAll<HTMLElement>('button, a')];
    return controls.some((control) => getComputedStyle(control).display !== 'none');
  }

  function collectCells(root: Element, cells: HTMLElement[]) {
    for (const child of Array.from(root.children)) {
      if (!(child instanceof HTMLElement)) {
        continue;
      }
      const display = getComputedStyle(child).display;
      if (display === 'none') {
        continue;
      }
      if (display === 'contents') {
        collectCells(child, cells);
        continue;
      }
      if (!hasVisibleControl(child)) {
        continue;
      }
      cells.push(child);
    }
  }

  function pack() {
    if (!node) {
      return;
    }
    const cells: HTMLElement[] = [];
    for (const root of [
      node.querySelector(':scope > .adds'),
      node.querySelector(':scope > .governance-row'),
      node.querySelector(':scope > #phase-nav-vote')
    ]) {
      if (root) {
        collectCells(root, cells);
      }
    }
    node.querySelectorAll<HTMLElement>('.phase-pack-cell').forEach((cell) => {
      if (!cells.includes(cell)) {
        cell.classList.remove('phase-pack-cell', 'row-start', 'wrapped');
        cell.style.flex = '';
        cell.style.maxWidth = '';
      }
    });
    cells.forEach((cell, index) => {
      const rowStart = Math.floor(index / 3) * 3;
      const rowCount = Math.min(3, cells.length - rowStart);
      const alone = rowCount === 1;
      cell.classList.add('phase-pack-cell');
      cell.classList.toggle('row-start', index % 3 === 0);
      cell.classList.toggle('wrapped', index >= 3);
      cell.style.flex = alone ? '1 1 100%' : `1 1 ${100 / rowCount}%`;
      cell.style.maxWidth = alone ? '100%' : `${100 / rowCount}%`;
    });
  }

  function schedulePack() {
    cancelAnimationFrame(packFrame);
    packFrame = requestAnimationFrame(pack);
  }

  onMount(() => {
    place();
    observer = new MutationObserver(schedulePack);
    observer.observe(node, { childList: true, subtree: true });
    schedulePack();
  });

  afterUpdate(() => {
    place();
    schedulePack();
  });

  onDestroy(() => {
    cancelAnimationFrame(packFrame);
    observer?.disconnect();
    node?.remove();
  });
</script>

<div class="phase-action-group" bind:this={node}>
  <div class="adds">
    <slot />
  </div>
  <div class="governance-row">
    <slot name="governance" />
  </div>
  <div id="phase-nav-vote" class="phase-action-slot"></div>
  <div class="phase-nav-bar">
    <div id="phase-nav-start" class="phase-action-slot"></div>
    <div id="phase-nav-end" class="phase-action-slot"></div>
  </div>
</div>

<style>
  .phase-action-group {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    width: 100%;
    min-width: 0;
  }

  .phase-action-group:not(:has(:global(button))) {
    display: none;
  }

  .adds,
  .governance-row,
  #phase-nav-vote,
  :global(.phase-nav-side) {
    display: contents;
  }

  .adds:not(:has(:global(button))),
  .governance-row:not(:has(:global(button))),
  #phase-nav-vote:empty,
  :global(.phase-nav-side:empty) {
    display: none;
  }

  .phase-nav-bar {
    display: flex;
    flex: 1 1 100%;
    width: 100%;
    min-width: 0;
    border-top: 1px solid var(--panel-border);
  }

  .phase-nav-bar:not(:has(:global(button))) {
    display: none;
  }

  .phase-nav-bar .phase-action-slot {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
  }

  .phase-nav-bar :global(.phase-shift-button) {
    flex: 1 1 auto;
    width: 100%;
    min-height: 44px;
    margin: 0;
    justify-content: center;
    border-radius: 0;
  }

  .phase-nav-bar:has(#phase-nav-start :global(button)) #phase-nav-end :global(.phase-shift-button) {
    border-left: 1px solid var(--panel-border);
  }

  :global(.phase-pack-cell) {
    box-sizing: border-box;
    min-width: 0;
    min-height: 44px;
    margin: 0;
  }

  :global(.phase-pack-cell:not(.row-start)) {
    border-left: 1px solid var(--panel-border);
  }

  :global(.phase-pack-cell.wrapped.row-start) {
    border-top: 1px solid var(--panel-border);
  }

  :global(.phase-pack-cell.round-plus-button),
  :global(.phase-pack-cell.phase-shift-button) {
    width: 100%;
    height: auto;
    min-height: 44px;
    justify-content: center;
    border-radius: 0;
  }

  :global(.phase-pack-cell.vote-dock) {
    display: flex;
    align-items: stretch;
  }

  :global(.phase-pack-cell.vote-dock .round-plus-button),
  :global(.phase-pack-cell.phase-nav-side .phase-shift-button) {
    flex: 1 1 auto;
    width: 100%;
    min-height: 44px;
    margin: 0;
    justify-content: center;
    border-radius: 0;
  }

  :global(.phase-pack-cell .plus-label),
  :global(.phase-pack-cell .label) {
    white-space: normal;
    line-height: 1.15;
    text-align: center;
  }
</style>
