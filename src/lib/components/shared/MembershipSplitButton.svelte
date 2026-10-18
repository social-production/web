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
  /** Visible words on the join half, so it isn't an unlabelled icon. */
  export let joinLabel = 'Join';
  export let joinedLabel = 'Joined';
  export let pendingLabel = 'Requested';
  /** Optional word after the count, e.g. "followers". */
  export let countNoun = '';
  export let onToggleJoin: () => void | Promise<void> = () => {};
  export let onOpenMembers: () => void = () => {};
</script>

{#if canToggle || canOpenMembers}
  <div class="membership-split" class:joined class:pending class:members-open={membersOpen}>
    {#if canToggle}
      <button
        id="participation-join"
        aria-label={joinAriaLabel}
        title={joinAriaLabel}
        aria-pressed={joined}
        class="membership-join"
        class:joined
        class:pending
        disabled={disabled}
        type="button"
        on:click={() => onToggleJoin()}
      >
        <FeedToolbarIcon name={joined ? 'person-check' : 'person-plus'} />
        <span class="join-text">{pending ? pendingLabel : joined ? joinedLabel : joinLabel}</span>
      </button>
    {/if}

    {#if canOpenMembers}
      <button
        aria-expanded={membersOpen}
        aria-label={membersAriaLabel} title={membersAriaLabel}
        class="membership-count"
        class:solo={!canToggle}
        type="button"
        on:click={onOpenMembers}
      >
        {count}{#if countNoun}&nbsp;{countNoun}{/if}
      </button>
    {:else}
      <span class="membership-count static">{count}{#if countNoun}&nbsp;{countNoun}{/if}</span>
    {/if}
  </div>
{:else}
  <span class="member-count">{count} members</span>
{/if}

<style>
  .membership-split {
    display: inline-flex;
    align-items: stretch;
    min-height: 40px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-border);
    overflow: hidden;
    flex: 0 0 auto;
    gap: 1px;
  }

  .membership-split:has(:global(.participation-action-highlight)) {
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
    gap: 6px;
    min-width: 40px;
    padding: 0 12px 0 10px;
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
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
