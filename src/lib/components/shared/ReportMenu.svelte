<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ContentReportSummary, ContentReportVote } from '$lib/types/detail';

  export let itemLabel = 'item';
  export let report: ContentReportSummary | null = null;
  export let pending = false;
  export let blockedMessage = '';

  const dispatch = createEventDispatcher<{
    compose: void;
    vote: { vote: ContentReportVote };
  }>();

  let menuOpen = false;
  let showingBlockedMessage = false;

  function closeMenu() {
    menuOpen = false;
    showingBlockedMessage = false;
  }

  function toggleMenu() {
    if (menuOpen) {
      closeMenu();
      return;
    }

    menuOpen = true;
    showingBlockedMessage = false;
  }

  function openComposer() {
    if (blockedMessage.trim()) {
      showingBlockedMessage = true;
      return;
    }

    closeMenu();
    dispatch('compose');
  }

  function vote(voteValue: ContentReportVote) {
    closeMenu();
    dispatch('vote', { vote: voteValue });
  }

  function reasonLabel(reasonValue: ContentReportSummary['reason']) {
    return reasonValue === 'spam' ? 'Spam' : 'Serious harm';
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeMenu();
    }
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeMenu();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (menuOpen && event.key === 'Escape') {
      closeMenu();
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<div class="report-menu-shell">
  <button
    aria-expanded={menuOpen}
    aria-label={report ? `View ${itemLabel} report` : `Report ${itemLabel}`}
    class:active-report={!!report}
    class="report-trigger"
    type="button"
    on:click={toggleMenu}
  >
    <span aria-hidden="true" class="menu-dots"></span>
    {#if report}
      <span aria-hidden="true" class="report-indicator"></span>
    {/if}
  </button>
</div>

{#if menuOpen}
  <div
    aria-hidden="true"
    class="report-menu-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    role="presentation"
    tabindex="-1"
  >
    <div aria-modal="true" class="report-menu" role="dialog">
      {#if report}
        <p class="menu-label">Active report - {reasonLabel(report.reason)}</p>
        {#if report.description}
          <p class="menu-copy">{report.description}</p>
        {/if}

        {#if report.resolution !== 'removed'}
          <div class="menu-actions">
            <button
              class:active-vote={report.voteSummary.activeVote === 'yes'}
              class="vote-chip"
              disabled={pending}
              type="button"
              on:click={() => vote('yes')}
            >
              Yes
            </button>
            <button
              class:active-vote={report.voteSummary.activeVote === 'no'}
              class="vote-chip"
              disabled={pending}
              type="button"
              on:click={() => vote('no')}
            >
              No
            </button>
          </div>
        {/if}
      {:else if showingBlockedMessage}
        <p class="menu-label">You can't report yourself</p>
        <div class="menu-actions">
          <button class="menu-dismiss" type="button" on:click={closeMenu}>Close</button>
        </div>
      {:else}
        <button class="menu-item" role="menuitem" type="button" on:click={openComposer}>
          Report {itemLabel}
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .report-menu-shell {
    display: inline-grid;
  }

  .report-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--text-soft);
    transition: background-color 120ms ease, color 120ms ease;
  }

  .report-trigger.active-report {
    background: color-mix(in srgb, var(--brand-soft) 78%, transparent);
    color: var(--brand-strong);
  }

  .menu-dots {
    display: inline-block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 -5px 0 currentColor, 0 5px 0 currentColor;
  }

  .report-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--brand);
  }

  .report-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
    padding: 24px;
    background: color-mix(in srgb, var(--text-main) 20%, transparent);
  }

  .report-menu {
    width: min(320px, calc(100vw - 40px));
    padding: 12px;
    display: grid;
    gap: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    box-shadow: 0 14px 30px color-mix(in srgb, var(--text-main) 10%, transparent);
  }

  .menu-label,
  .menu-copy {
    margin: 0;
  }

  .menu-label {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 800;
  }

  .menu-copy {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .menu-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .vote-chip,
  .menu-item,
  .menu-dismiss {
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-chip {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  .vote-chip.active-vote {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 78%, white 22%);
    color: var(--brand-strong);
  }

  .menu-item {
    width: 100%;
    padding-left: 0;
    padding-right: 0;
    border: none;
    background: transparent;
    color: var(--text-main);
    text-align: left;
  }

  .menu-dismiss {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }
</style>