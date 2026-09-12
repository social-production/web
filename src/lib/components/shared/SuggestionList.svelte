<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';

  type SuggestionItem = {
    key: string;
    label: string;
    imageUrl?: string | null;
  };

  export let items: SuggestionItem[] = [];
  export let query = '';
  export let showAvatars = false;
  export let emptyCopy = 'No matches.';

  const dispatch = createEventDispatcher<{ select: { key: string } }>();

  $: needle = query.trim();
</script>

{#if needle}
  {#if items.length > 0}
    <div class="suggestion-list" role="listbox">
      {#each items as item (item.key)}
        <button
          class="suggestion-row"
          role="option"
          type="button"
          on:click={() => dispatch('select', { key: item.key })}
        >
          {#if showAvatars}
            <AvatarBadge size="sm" username={item.label} imageUrl={item.imageUrl ?? null} />
          {/if}
          <span>{item.label}</span>
        </button>
      {/each}
    </div>
  {:else}
    <p class="empty-row">{emptyCopy}</p>
  {/if}
{/if}

<style>
  .suggestion-list {
    display: grid;
    gap: 0;
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .suggestion-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    border: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
    background: transparent;
    color: var(--text-main);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }

  .suggestion-row:last-child {
    border-bottom: none;
  }

  .suggestion-row:hover {
    background: color-mix(in srgb, var(--panel-hover) 70%, transparent);
  }

  .suggestion-row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-row {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 13px;
  }
</style>
