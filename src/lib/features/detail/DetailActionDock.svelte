<script lang="ts">
  import { afterUpdate, onMount } from 'svelte';

  export let active = false;

  let node: HTMLDivElement;
  let home: HTMLElement | null = null;

  function columnSpan() {
    const shell = document.querySelector('.shell');
    const styles = shell instanceof HTMLElement ? getComputedStyle(shell) : null;
    const left = styles ? parseFloat(styles.getPropertyValue('--left-width')) || 0 : 0;
    const right = styles ? parseFloat(styles.getPropertyValue('--right-width')) || 0 : 0;
    return window.innerWidth - left - right;
  }

  function syncFrame() {
    if (!node || typeof document === 'undefined') {
      return;
    }

    const floating = window.matchMedia('(min-width: 1081px)').matches && columnSpan() > 720;
    node.classList.toggle('is-pad', floating);
    syncHeight();
  }

  function syncHeight() {
    if (!node || typeof document === 'undefined' || !active) {
      return;
    }

    const hidden = node.hidden || getComputedStyle(node).display === 'none';
    const inset = !hidden && node.classList.contains('is-pad') ? 12 : 0;
    const height = hidden ? 0 : node.offsetHeight + inset;
    document.documentElement.style.setProperty('--detail-action-dock-height', `${height}px`);
  }

  function place() {
    if (!node || typeof document === 'undefined') {
      return;
    }

    if (!home) {
      home = node.parentElement;
    }

    const shell = document.querySelector('.shell');
    if (active && shell instanceof HTMLElement) {
      if (node.parentElement !== shell) {
        shell.appendChild(node);
      }
    } else if (home && node.parentElement !== home) {
      home.appendChild(node);
    }

    syncFrame();
  }

  $: if (node) {
    active;
    place();
  }

  afterUpdate(place);

  onMount(() => {
    place();
    const observer = new ResizeObserver(() => syncFrame());
    observer.observe(node);
    const onResize = () => syncFrame();
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      if (home && node.parentElement !== home) {
        home.appendChild(node);
      }
      document.documentElement.style.setProperty('--detail-action-dock-height', '0px');
    };
  });
</script>

<div class="detail-action-dock" bind:this={node}>
  <slot />
</div>

<style>
  .detail-action-dock {
    position: fixed;
    z-index: var(--z-dock);
    left: var(--left-width, 0px);
    right: var(--right-width, 0px);
    bottom: var(--shell-bottom-nav-offset, 0px);
    display: flex;
    transform: translate3d(0, 0, 0);
    transition: transform 0.22s ease;
    will-change: transform;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
    padding: 10px 16px calc(10px + var(--shell-dock-safe-bottom, 0px));
    border-top: 1px solid var(--panel-border);
    background: color-mix(in srgb, var(--panel) 94%, transparent);
    backdrop-filter: blur(12px);
    box-shadow: 0 -10px 24px color-mix(in srgb, var(--page-bg) 55%, transparent);
  }

  .detail-action-dock:not(:has(:global(button))) {
    display: none;
  }

  .detail-action-dock:has(:global(.phase-action-group)),
  .detail-action-dock:has(:global(.context-dock)) {
    gap: 0;
    padding: 0;
    padding-bottom: var(--shell-dock-safe-bottom, 0px);
  }

  .detail-action-dock :global(.participation-membership) {
    display: flex;
    width: 100%;
    border-bottom: 1px solid var(--panel-border);
  }

  .detail-action-dock :global(.participation-membership .membership-split) {
    display: flex;
    flex: 1 1 auto;
    width: 100%;
    min-height: 44px;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .detail-action-dock :global(.participation-membership .membership-join),
  .detail-action-dock :global(.participation-membership .membership-count) {
    flex: 1 1 50%;
    box-sizing: border-box;
    width: 50%;
    max-width: 50%;
    min-width: 0;
    padding: 0;
    min-height: 44px;
    border-radius: 0;
    font-size: 13px;
  }

  .detail-action-dock :global(.participation-membership .membership-join:not(.joined)) {
    background: var(--brand);
    color: var(--page-bg);
  }

  .detail-action-dock :global(.participation-membership .membership-join:not(.joined):hover:not(:disabled)),
  .detail-action-dock :global(.participation-membership .membership-join:not(.joined):focus-visible) {
    background: color-mix(in srgb, var(--brand) 78%, white);
    color: var(--page-bg);
    filter: none;
    transform: none;
  }

  .detail-action-dock :global(.participation-membership .membership-count:hover:not(.static)) {
    background: var(--brand-soft);
    color: var(--brand-strong);
    filter: none;
    transform: none;
  }

  .detail-action-dock:has(:global(.participation-membership)) {
    background: var(--panel);
  }

  .detail-action-dock:has(:global(.participation-membership)):not(.is-pad) {
    border-top: 0;
    box-shadow: none;
  }

  .detail-action-dock :global(.participation-membership .membership-count) {
    border-left: 0;
    box-shadow: inset 1px 0 0 var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  @media (max-width: 1080px) {
    .detail-action-dock {
      bottom: var(--shell-bottom-nav-height);
    }

    :global(.feed-chrome-collapsed) .detail-action-dock {
      transform: translate3d(0, var(--shell-bottom-nav-height), 0);
    }
  }

  @media (min-width: 1081px) {
    .detail-action-dock {
      --detail-dock-span: calc(100vw - var(--left-width, 0px) - var(--right-width, 0px));
      width: min(720px, var(--detail-dock-span));
      left: calc(
        var(--left-width, 0px) + (var(--detail-dock-span) - min(720px, var(--detail-dock-span))) / 2
      );
      right: auto;
    }

    :global(.detail-action-dock.is-pad) {
      bottom: calc(var(--shell-bottom-nav-offset, 0px) + 12px);
      border: 1px solid var(--panel-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 24px color-mix(in srgb, var(--page-background) 55%, transparent);
    }
  }
</style>
