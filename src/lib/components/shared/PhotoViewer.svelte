<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { portal } from '$lib/utils/portal';

  export let url: string | null = null;
  export let alt = 'Photo';

  const dispatch = createEventDispatcher<{ close: void }>();

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let pinchDistance = 0;
  let pinchScale = 1;
  let pinchMidX = 0;
  let pinchMidY = 0;
  let pinchTranslateX = 0;
  let pinchTranslateY = 0;
  let drag: { x: number; y: number; tx: number; ty: number } | null = null;
  let imageElement: HTMLImageElement | null = null;

  function clamp(value: number) {
    return Math.min(4, Math.max(1, value));
  }

  function clampPan() {
    if (!imageElement || scale <= 1) {
      translateX = 0;
      translateY = 0;
      return;
    }

    const maxX = Math.max(0, (imageElement.offsetWidth * (scale - 1)) / 2);
    const maxY = Math.max(0, (imageElement.offsetHeight * (scale - 1)) / 2);
    translateX = Math.min(maxX, Math.max(-maxX, translateX));
    translateY = Math.min(maxY, Math.max(-maxY, translateY));
  }

  function close() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    pinchDistance = 0;
    drag = null;
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
    scale = clamp(scale + (event.deltaY < 0 ? 0.2 : -0.2));
    clampPan();
  }

  function touchDistance(touches: TouchList) {
    const [first, second] = [touches[0], touches[1]];
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'touch' || scale <= 1 || event.button !== 0) {
      return;
    }
    drag = { x: event.clientX, y: event.clientY, tx: translateX, ty: translateY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!drag) {
      return;
    }
    translateX = drag.tx + (event.clientX - drag.x);
    translateY = drag.ty + (event.clientY - drag.y);
    clampPan();
  }

  function onPointerUp() {
    drag = null;
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
      drag = null;
      pinchDistance = touchDistance(event.touches);
      pinchScale = scale;
      pinchMidX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      pinchMidY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      pinchTranslateX = translateX;
      pinchTranslateY = translateY;
      return;
    }

    if (event.touches.length === 1 && scale > 1) {
      drag = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        tx: translateX,
        ty: translateY
      };
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (event.touches.length === 2 && pinchDistance > 0) {
      event.preventDefault();
      const [first, second] = [event.touches[0], event.touches[1]];
      const midX = (first.clientX + second.clientX) / 2;
      const midY = (first.clientY + second.clientY) / 2;
      scale = clamp(pinchScale * (touchDistance(event.touches) / pinchDistance));
      translateX = pinchTranslateX + (midX - pinchMidX);
      translateY = pinchTranslateY + (midY - pinchMidY);
      clampPan();
      return;
    }

    if (event.touches.length === 1 && drag && scale > 1) {
      event.preventDefault();
      translateX = drag.tx + (event.touches[0].clientX - drag.x);
      translateY = drag.ty + (event.touches[0].clientY - drag.y);
      clampPan();
    }
  }

  function onTouchEnd(event: TouchEvent) {
    if (event.touches.length < 2) {
      pinchDistance = 0;
    }
    if (event.touches.length === 0) {
      drag = null;
    }
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
      tabindex="-1"
      on:wheel|nonpassive={onWheel}
      on:pointerdown={onPointerDown}
      on:pointermove={onPointerMove}
      on:pointerup={onPointerUp}
      on:pointercancel={onPointerUp}
      on:touchstart={onTouchStart}
      on:touchmove|nonpassive={onTouchMove}
      on:touchend={onTouchEnd}
    >
      <img
        bind:this={imageElement}
        {alt}
        src={url}
        style={`transform: translate(${translateX}px, ${translateY}px) scale(${scale})`}
      />
      <button aria-label="Close photo" class="close" type="button" on:click={close}>×</button>
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
    min-height: 0;
    height: 100%;
    overflow: hidden;
    touch-action: none;
    cursor: grab;
    pointer-events: none;
  }

  img {
    width: auto;
    height: auto;
    max-width: calc(100vw - 32px);
    max-height: calc(100dvh - 96px - var(--shell-safe-bottom, 0px));
    margin: auto;
    object-fit: contain;
    transform-origin: center center;
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: auto;
  }

  .close {
    position: absolute;
    top: calc(12px + var(--shell-safe-top, 0px));
    right: calc(12px + var(--shell-safe-right, 0px));
    z-index: 2;
    pointer-events: auto;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, #000 55%, transparent);
    color: #fff;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
  }
</style>
