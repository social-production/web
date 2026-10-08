<script lang="ts">
  export let results: Array<{ id: string; username: string }> = [];
  export let onSelect: (username: string) => void = () => {};
</script>

{#if results.length > 0}
  <div class="mention-menu" role="listbox">
    {#each results as person (person.id)}
      <button class="mention-item" role="option" type="button" on:mousedown|preventDefault on:click={() => onSelect(person.username)}>
        {person.username}
      </button>
    {/each}
  </div>
{/if}

<style>
  .mention-menu {
    position: absolute;
    z-index: 4;
    left: 0;
    right: 0;
    bottom: calc(100% + 6px);
    display: grid;
    max-height: 180px;
    overflow: auto;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    box-shadow: 0 10px 24px color-mix(in srgb, var(--page-background) 55%, transparent);
  }

  .mention-item {
    padding: 8px 12px;
    border: 0;
    background: transparent;
    color: var(--text-main);
    font-weight: 700;
    text-align: left;
  }

  .mention-item:hover,
  .mention-item:focus-visible {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }
</style>
