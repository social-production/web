<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import type { SearchableSelectOption } from '$lib/types/searchableSelect';

  export let options: SearchableSelectOption[] = [];
  export let value = '';
  export let placeholder = 'Search…';
  export let emptyLabel = 'No matches';
  export let disabled = false;
  export let allowEmpty = false;
  export let emptyValue = '';
  export let emptyOptionLabel = 'None';
  export let ariaLabel = 'Searchable select';

  const dispatch = createEventDispatcher<{ change: string }>();

  let query = '';
  let open = false;
  let activeIndex = -1;
  let inputElement: HTMLInputElement | null = null;
  let listElement: HTMLUListElement | null = null;

  $: selected = options.find((option) => option.value === value) ?? null;
  $: displayValue = open ? query : selected?.label ?? '';
  $: filtered = options.filter((option) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle);
  });

  onMount(() => {
    query = selected?.label ?? '';
  });

  $: if (!open && selected && query !== selected.label) {
    query = selected.label;
  }

  function setValue(next: string) {
    value = next;
    const match = options.find((option) => option.value === next);
    query = match?.label ?? '';
    open = false;
    activeIndex = -1;
    dispatch('change', next);
  }

  async function openList() {
    if (disabled) return;
    open = true;
    query = '';
    activeIndex = filtered.length > 0 ? 0 : -1;
    await tick();
    inputElement?.focus();
  }

  function closeList() {
    open = false;
    query = selected?.label ?? '';
    activeIndex = -1;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        void openList();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeList();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0 && filtered[activeIndex]) {
      event.preventDefault();
      setValue(filtered[activeIndex].value);
    }
  }
</script>

<div class="searchable-select">
  <div class="control" class:open>
    <input
      bind:this={inputElement}
      aria-autocomplete="list"
      aria-controls="searchable-select-list"
      aria-expanded={open}
      aria-label={ariaLabel}
      class="input"
      {disabled}
      placeholder={selected ? selected.label : placeholder}
      role="combobox"
      type="text"
      value={displayValue}
      on:blur={() => setTimeout(closeList, 120)}
      on:focus={openList}
      on:keydown={handleKeydown}
      on:input={(event) => {
        query = (event.currentTarget as HTMLInputElement).value;
        open = true;
        activeIndex = filtered.length > 0 ? 0 : -1;
      }}
    />
    <button
      aria-label="Toggle options"
      class="toggle"
      {disabled}
      type="button"
      on:mousedown|preventDefault={openList}
    >
      ▾
    </button>
  </div>

  {#if open}
    <ul bind:this={listElement} class="list" id="searchable-select-list" role="listbox">
      {#if allowEmpty}
        <li>
          <button
            class="option"
            class:active={activeIndex === -1 && !value}
            type="button"
            on:mousedown|preventDefault={() => setValue(emptyValue)}
          >
            {emptyOptionLabel}
          </button>
        </li>
      {/if}
      {#if filtered.length === 0}
        <li class="empty">{emptyLabel}</li>
      {:else}
        {#each filtered as option, index (option.value)}
          <li>
            <button
              class="option"
              class:active={index === activeIndex}
              disabled={option.disabled}
              type="button"
              on:mousedown|preventDefault={() => setValue(option.value)}
            >
              {option.label}
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  {/if}
</div>

<style>
  .searchable-select {
    position: relative;
    min-width: 220px;
  }

  .control {
    display: flex;
    align-items: center;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: var(--panel);
    overflow: hidden;
  }

  .control.open {
    border-color: var(--brand);
  }

  .input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--text);
    padding: 8px 10px;
    font: inherit;
  }

  .toggle {
    border: none;
    background: transparent;
    color: var(--text-muted);
    padding: 0 10px;
    cursor: pointer;
  }

  .list {
    position: absolute;
    z-index: 30;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    margin: 0;
    padding: 4px;
    list-style: none;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    background: var(--panel-strong, var(--panel));
    max-height: 260px;
    overflow: auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .option {
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--text);
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }

  .option.active,
  .option:hover:not(:disabled) {
    background: var(--brand-soft);
  }

  .option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty {
    padding: 8px 10px;
    color: var(--text-muted);
    font-size: 13px;
  }
</style>
