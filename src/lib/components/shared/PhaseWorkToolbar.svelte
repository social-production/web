<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';

  const MIN_CELL_WIDTH = 112;

  let node: HTMLDivElement;
  let observer: MutationObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
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
    const width = node.clientWidth || MIN_CELL_WIDTH;
    const perRow = Math.max(1, Math.floor(width / MIN_CELL_WIDTH));
    cells.forEach((cell, index) => {
      const rowStart = Math.floor(index / perRow) * perRow;
      const rowCount = Math.min(perRow, cells.length - rowStart);
      const share = 100 / rowCount;
      cell.classList.add('phase-pack-cell');
      cell.classList.toggle('row-start', index % perRow === 0);
      cell.classList.toggle('wrapped', index >= perRow);
      cell.style.flex = `1 1 ${share}%`;
      cell.style.maxWidth = `${share}%`;
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
    resizeObserver = new ResizeObserver(schedulePack);
    resizeObserver.observe(node);
    schedulePack();
  });

  afterUpdate(() => {
    place();
    schedulePack();
  });

  onDestroy(() => {
    cancelAnimationFrame(packFrame);
    observer?.disconnect();
    resizeObserver?.disconnect();
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

  .phase-nav-bar :global(.phase-shift-button.phase-shift-button) {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    max-width: none;
    height: auto;
    min-height: 44px;
    margin: 0;
    padding: 8px 10px;
    justify-content: center;
    border-radius: 0;
    border-width: 0;
    box-sizing: border-box;
  }

  .phase-nav-bar :global(.phase-shift-button .label) {
    white-space: normal;
    line-height: 1.15;
    text-align: center;
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

  :global(.phase-pack-cell.round-plus-button.round-plus-button),
  :global(.phase-pack-cell.phase-shift-button.phase-shift-button) {
    width: 100%;
    min-width: 0;
    height: auto;
    min-height: 44px;
    justify-content: center;
    border-radius: 0;
    box-sizing: border-box;
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
