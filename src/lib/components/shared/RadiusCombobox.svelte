<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { portal } from '$lib/utils/portal';

  export let value = '25';
  export let ariaLabel = 'Search radius';
  export let options: Array<{ value: string; label: string }> = [];
  export let portaled = true;
  export let preferAbove = false;
  export let compact = false;

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  let open = false;
  let shell: HTMLDivElement;
  let inputElement: HTMLInputElement;
  let menuElement: HTMLDivElement;
  let menuStyle = '';
  let draft = value;
  let displayLabel = '';

  $: displayLabel = formatDisplay(value);
  $: if (!open) {
    draft = value;
  }

  function formatDisplay(next: string) {
    if (next === 'global') {
      return 'Global';
    }
    const parsed = Number(next);
    if (!Number.isFinite(parsed)) {
      return next;
    }
    return `${Math.round(parsed)} km`;
  }

  async function positionMenu() {
    await tick();
    if (!inputElement || !menuElement) {
      return;
    }

    const triggerRect = inputElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const gap = 4;
    const viewportPadding = 8;

    let top: number;
    let left = triggerRect.left;

    if (preferAbove) {
      top = triggerRect.top - menuRect.height - gap;
    } else {
      top = triggerRect.bottom + gap;
      if (top + menuRect.height > window.innerHeight - viewportPadding) {
        top = triggerRect.top - menuRect.height - gap;
      }
    }

    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - menuRect.width - viewportPadding)
    );
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - menuRect.height - viewportPadding));

    menuStyle = `top: ${top}px; left: ${left}px; width: ${Math.max(triggerRect.width, 168)}px;`;
  }

  async function openMenu() {
    if (!open) {
      open = true;
      draft = value === 'global' ? '' : value;
      await positionMenu();
      inputElement?.select();
    }
  }

  async function toggleMenu() {
    if (open) {
      closeMenu();
      return;
    }
    await openMenu();
  }

  function closeMenu() {
    open = false;
  }

  function applyValue(next: string) {
    if (!next.trim() || next === value) {
      return;
    }
    value = next;
    dispatch('change', { value: next });
  }

  function selectOption(nextValue: string) {
    applyValue(nextValue);
    closeMenu();
  }

  function commitDraft() {
    const trimmed = draft.trim().toLowerCase();
    if (!trimmed) {
      closeMenu();
      return;
    }
    if (trimmed === 'global') {
      selectOption('global');
      return;
    }
    const parsed = Number(trimmed.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(parsed)) {
      closeMenu();
      return;
    }
    selectOption(String(Math.max(1, Math.round(parsed))));
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitDraft();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  }

  function handleDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (!open) {
      return;
    }
    if (shell?.contains(target)) {
      return;
    }
    if (menuElement?.contains(target)) {
      return;
    }
    closeMenu();
  }

  function handleViewportChange() {
    if (open) {
      void positionMenu();
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

<svelte:window on:keydown={(event) => open && event.key === 'Escape' && closeMenu()} />

<div bind:this={shell} class="radius-combobox" class:compact>
  <div class="input-shell" class:open>
    <input
      bind:this={inputElement}
      class="radius-input"
      type="text"
      inputmode="numeric"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      value={open ? draft : displayLabel}
      on:focus={() => void openMenu()}
      on:input={(event) => {
        open = true;
        draft = event.currentTarget.value;
        void positionMenu();
      }}
      on:keydown={handleInputKeydown}
      on:blur={() => {
        window.setTimeout(() => {
          if (open) {
            commitDraft();
          }
        }, 120);
      }}
    />
    <button
      class="toggle-button"
      type="button"
      aria-label="Open radius options"
      on:mousedown|preventDefault
      on:click|stopPropagation={toggleMenu}
    >
      ▾
    </button>
  </div>

  {#if open}
    <div
      bind:this={menuElement}
      class="radius-menu"
      class:portaled
      role="listbox"
      style={menuStyle}
      use:portal={portaled ? 'body' : false}
    >
      {#each options as option (option.value)}
        <button
          type="button"
          role="option"
          aria-selected={option.value === value}
          class="radius-option"
          class:selected={option.value === value}
          on:mousedown|preventDefault
          on:click={() => selectOption(option.value)}
        >
          <span>{option.label}</span>
          {#if option.value === value}
            <span aria-hidden="true" class="check">✓</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .radius-combobox {
    position: relative;
    display: inline-flex;
    min-width: 88px;
    flex-shrink: 0;
  }

  .radius-combobox.compact {
    min-width: 64px;
    max-width: 72px;
  }

  .radius-combobox.compact .input-shell {
    min-height: 28px;
  }

  .radius-combobox.compact .radius-input {
    font-size: 11px;
    padding: 4px 6px;
  }

  .radius-combobox.compact .toggle-button {
    width: 20px;
    font-size: 10px;
  }

  .input-shell {
    display: inline-flex;
    align-items: center;
    width: 100%;
    min-height: 32px;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: var(--panel);
    overflow: hidden;
  }

  .input-shell.open {
    border-color: var(--brand);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 35%, transparent);
  }

  .radius-input {
    width: 100%;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 8px;
  }

  .radius-input:focus {
    outline: none;
  }

  .toggle-button {
    flex-shrink: 0;
    width: 24px;
    border: none;
    border-left: 1px solid var(--panel-border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
  }

  .radius-menu {
    position: fixed;
    z-index: 80;
    display: grid;
    gap: 2px;
    padding: 4px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    box-shadow: 0 10px 24px color-mix(in srgb, var(--text-main) 10%, transparent);
    max-height: 240px;
    overflow: auto;
  }

  .radius-menu.portaled {
    z-index: 80;
  }

  .radius-option {
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
    cursor: pointer;
  }

  .radius-option:hover,
  .radius-option.selected {
    background: color-mix(in srgb, var(--panel-border) 38%, transparent);
  }

  .radius-option span:first-child {
    flex: 1 1 auto;
    min-width: 0;
  }

  .check {
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 800;
  }
</style>
