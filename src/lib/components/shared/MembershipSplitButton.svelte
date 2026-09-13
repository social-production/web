<script lang="ts">
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';

  export let joined = false;
  export let pending = false;
  export let count = 0;
  export let canToggle = false;
  export let canOpenMembers = false;
  export let membersOpen = false;
  export let disabled = false;
  export let joinAriaLabel = 'Join';
  export let membersAriaLabel = 'Members';
  export let onToggleJoin: () => void | Promise<void> = () => {};
  export let onOpenMembers: () => void = () => {};
</script>

{#if canToggle || canOpenMembers}
  <div class="membership-split" class:joined class:pending class:members-open={membersOpen}>
    {#if canToggle}
      <button
        id="participation-join"
        aria-label={joinAriaLabel}
        aria-pressed={joined}
        class="membership-join"
        class:joined
        class:pending
        disabled={disabled}
        type="button"
        on:click={() => onToggleJoin()}
      >
        <FeedToolbarIcon name={joined ? 'person-check' : 'person-plus'} />
      </button>
    {/if}

    {#if canOpenMembers}
      <button
        aria-expanded={membersOpen}
        aria-label={membersAriaLabel}
        class="membership-count"
        class:solo={!canToggle}
        type="button"
        on:click={onOpenMembers}
      >
        {count}
      </button>
    {:else}
      <span class="membership-count static">{count}</span>
    {/if}
  </div>
{:else}
  <span class="member-count">{count} members</span>
{/if}

<style>
  .membership-split {
    display: inline-flex;
    align-items: stretch;
    min-height: 36px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-border);
    overflow: hidden;
    flex: 0 0 auto;
    gap: 1px;
  }

  .membership-split:has(.participation-action-highlight) {
    overflow: visible;
  }

  .membership-split.joined {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
  }

  .membership-split.pending {
    border-color: color-mix(in srgb, var(--status-yellow, var(--brand)) 55%, var(--panel-border));
  }

  .membership-split.members-open {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
  }

  .membership-join,
  .membership-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    border: 0;
    background: var(--panel);
    color: var(--text-soft);
    cursor: pointer;
  }

  .membership-join {
    width: 36px;
    padding: 0;
    color: var(--text-main);
  }

  .membership-join :global(.toolbar-icon) {
    width: 16px;
    height: 16px;
  }

  .membership-join.joined,
  .membership-split.joined .membership-count {
    color: var(--brand-strong);
  }

  .membership-join.pending,
  .membership-split.pending .membership-count {
    color: var(--text-main);
  }

  .membership-join:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .membership-count {
    min-width: 32px;
    padding: 0 10px;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .membership-count.solo {
    border-left: 0;
  }

  .membership-count.static {
    cursor: default;
  }

  .membership-join:hover:not(:disabled),
  .membership-count:hover:not(.static) {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .member-count {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }
</style>
