<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';

  export let open = false;
  export let ariaLabel: string;
  export let active = false;
  export let disabled = false;
  export let menuLabel = '';
  export let minWidth = 168;

  const dispatch = createEventDispatcher<{ close: void }>();

  let shell: HTMLDivElement;
  let triggerElement: HTMLButtonElement;
  let menuElement: HTMLDivElement;
  let menuStyle = '';

  async function positionMenu() {
    await tick();

    if (!triggerElement || !menuElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const gap = 4;
    const viewportPadding = 8;

    let top = triggerRect.bottom + gap;
    let left = triggerRect.right - menuRect.width;

    if (top + menuRect.height > window.innerHeight - viewportPadding) {
      top = triggerRect.top - menuRect.height - gap;
    }

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuRect.width - viewportPadding));
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - menuRect.height - viewportPadding));

    menuStyle = `top: ${top}px; left: ${left}px; min-width: ${minWidth}px;`;
  }

  async function toggle() {
    if (disabled) {
      return;
    }

    open = !open;

    if (open) {
      await positionMenu();
    }
  }

  function close() {
    if (!open) {
      return;
    }

    open = false;
    dispatch('close');
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      close();
    }
  }

  function handleViewportChange() {
    if (open) {
      void positionMenu();
    }
  }

  function handleDocumentClick(event: MouseEvent) {
    if (open && shell && !shell.contains(event.target as Node)) {
      close();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  });

  $: if (open) {
    void positionMenu();
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<div bind:this={shell} class="icon-popover-shell">
  <button
    bind:this={triggerElement}
    type="button"
    class="icon-popover-trigger"
    class:menu-open={open}
    class:menu-active={active}
    aria-label={ariaLabel}
    aria-expanded={open}
    aria-haspopup="menu"
    {disabled}
    on:click|stopPropagation={toggle}
  >
    <slot name="icon" />
  </button>

  {#if open}
    <div
      bind:this={menuElement}
      class="icon-popover-menu"
      role="menu"
      aria-label={menuLabel || ariaLabel}
      style={menuStyle}
    >
      <slot />
    </div>
  {/if}
</div>

<style>
  .icon-popover-shell {
    display: inline-flex;
  }

  .icon-popover-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
  }

  .icon-popover-trigger:hover:not(:disabled),
  .icon-popover-trigger.menu-open {
    background: color-mix(in srgb, var(--panel-border) 42%, transparent);
    color: var(--text-main);
  }

  .icon-popover-trigger.menu-active {
    box-shadow: inset 0 -2px 0 var(--text-soft);
  }

  .icon-popover-trigger:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .icon-popover-menu {
    position: fixed;
    z-index: 80;
    padding: 4px;
    display: grid;
    gap: 2px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    box-shadow: 0 10px 24px color-mix(in srgb, var(--text-main) 10%, transparent);
  }
</style>
