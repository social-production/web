<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  export let value: string;
  export let ariaLabel: string;
  export let options: Array<{ value: string; label: string; icon?: SurfaceIconId }> = [];
  export let showOptionIcons = false;
  export let defaultValue: string | null = null;

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  let open = false;
  let shell: HTMLDivElement;
  let triggerElement: HTMLButtonElement;
  let menuElement: HTMLDivElement;
  let menuStyle = '';

  $: baselineValue = defaultValue ?? options[0]?.value ?? '';
  $: isActive = value !== baselineValue;

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

    menuStyle = `top: ${top}px; left: ${left}px;`;
  }

  async function toggle() {
    open = !open;

    if (open) {
      await positionMenu();
    }
  }

  function close() {
    open = false;
  }

  function selectOption(nextValue: string) {
    if (nextValue !== value) {
      value = nextValue;
      dispatch('change', { value: nextValue });
    }

    close();
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
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<div bind:this={shell} class="icon-menu-shell">
  <button
    bind:this={triggerElement}
    type="button"
    class="icon-menu-trigger"
    class:menu-open={open}
    class:menu-active={isActive}
    aria-label={ariaLabel}
    aria-expanded={open}
    aria-haspopup="menu"
    on:click|stopPropagation={toggle}
  >
    <slot />
  </button>

  {#if open}
    <div bind:this={menuElement} class="icon-menu" role="menu" style={menuStyle}>
      {#each options as option (option.value)}
        <button
          type="button"
          role="menuitemradio"
          aria-checked={option.value === value}
          class="icon-menu-item"
          class:selected={option.value === value}
          on:click={() => selectOption(option.value)}
        >
          {#if showOptionIcons && option.icon}
            <SurfaceIcon icon={option.icon} size="sm" />
          {/if}
          <span class="item-label">{option.label}</span>
          {#if option.value === value}
            <span aria-hidden="true" class="check">✓</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .icon-menu-shell {
    display: inline-flex;
  }

  .icon-menu-trigger {
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

  .icon-menu-trigger:hover,
  .icon-menu-trigger.menu-open {
    background: color-mix(in srgb, var(--panel-border) 42%, transparent);
    color: var(--text-main);
  }

  .icon-menu-trigger.menu-active {
    box-shadow: inset 0 -2px 0 var(--text-soft);
  }

  .icon-menu {
    position: fixed;
    z-index: 80;
    min-width: 168px;
    padding: 4px;
    display: grid;
    gap: 2px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    box-shadow: 0 10px 24px color-mix(in srgb, var(--text-main) 10%, transparent);
  }

  .icon-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 8px;
    border: none;
    border-radius: calc(var(--radius-sm) - 2px);
    background: transparent;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    transition: background-color 120ms ease;
  }

  .icon-menu-item:hover,
  .icon-menu-item.selected {
    background: color-mix(in srgb, var(--panel-border) 38%, transparent);
  }

  .item-label {
    flex: 1 1 auto;
    min-width: 0;
  }

  .check {
    flex: 0 0 auto;
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 800;
  }
</style>
