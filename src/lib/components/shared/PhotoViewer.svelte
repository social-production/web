<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { portal } from '$lib/utils/portal';

  export let url: string | null = null;
  export let alt = 'Photo';

  const dispatch = createEventDispatcher<{ close: void }>();

  let scale = 1;
  let pinchDistance = 0;
  let pinchScale = 1;

  function clamp(value: number) {
    return Math.min(4, Math.max(1, value));
  }

  function zoomBy(delta: number) {
    scale = clamp(Number((scale + delta).toFixed(2)));
  }

  function close() {
    scale = 1;
    pinchDistance = 0;
    dispatch('close');
  }

  function onKeydown(event: KeyboardEvent) {
    if (!url) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 0.2 : -0.2);
  }

  function touchDistance(touches: TouchList) {
    const [first, second] = [touches[0], touches[1]];
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
      pinchDistance = touchDistance(event.touches);
      pinchScale = scale;
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (event.touches.length !== 2 || pinchDistance <= 0) return;
    event.preventDefault();
    scale = clamp(pinchScale * (touchDistance(event.touches) / pinchDistance));
  }

  function onTouchEnd() {
    pinchDistance = 0;
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if url}
  <div class="photo-viewer" role="presentation" use:portal={'body'}>
    <button class="scrim" type="button" aria-label="Close photo" on:click={close}></button>
    <div
      aria-label={alt}
      aria-modal="true"
      class="frame"
      role="dialog"
      on:wheel|nonpassive={onWheel}
      on:touchstart={onTouchStart}
      on:touchmove|nonpassive={onTouchMove}
      on:touchend={onTouchEnd}
    >
      <img {alt} src={url} style={`transform: scale(${scale})`} />
      <div class="zoom-row">
        <button aria-label="Close photo" class="close" type="button" on:click={close}>×</button>
        <button type="button" on:click={() => zoomBy(-0.25)} disabled={scale <= 1}>Smaller</button>
        <button type="button" on:click={() => zoomBy(0.25)} disabled={scale >= 4}>Larger</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .photo-viewer {
    position: fixed;
    inset: 0;
    z-index: var(--z-sheet-elevated);
    display: grid;
  }

  .scrim {
    position: absolute;
    inset: 0;
    border: 0;
    background: color-mix(in srgb, #000 82%, transparent);
  }

  .frame {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    min-height: 0;
    height: 100%;
    touch-action: none;
  }

  img {
    width: auto;
    height: auto;
    max-width: calc(100vw - 32px);
    max-height: calc(100dvh - 160px - var(--shell-safe-bottom, 0px));
    margin: auto;
    object-fit: contain;
    transform-origin: center center;
  }

  .zoom-row {
    display: flex;
    width: 100%;
  }

  .zoom-row button,
  .close {
    min-height: 56px;
    border: 0;
    border-radius: 0;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
  }

  .zoom-row button {
    flex: 1 1 0;
    background: var(--panel-strong);
    color: var(--text-main);
    box-shadow: inset -1px 0 0 var(--panel-border);
  }

  .zoom-row button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .zoom-row .close {
    flex: 0 0 56px;
    width: 56px;
    background: transparent;
    color: var(--text-main);
    font-size: 22px;
    font-weight: 500;
  }
</style>
