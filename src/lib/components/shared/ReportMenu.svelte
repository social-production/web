<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ContentReportSummary, ContentReportVote, ModerationState } from '$lib/types/detail';
  import { formatReportThresholdLines, moderationStatusLabel } from '$lib/utils/moderation';
  import { portal } from '$lib/utils/portal';

  export let itemLabel = 'item';
  export let report: ContentReportSummary | null = null;
  export let pending = false;
  export let blockedMessage = '';
  export let moderationState: ModerationState | null | undefined = undefined;
  export let isUnderReview = false;
  export let hasActiveReport = false;
  /** When false, only the status trigger is shown (no compose/vote actions). */
  export let interactive = true;

  const dispatch = createEventDispatcher<{
    compose: void;
    vote: { vote: ContentReportVote };
  }>();

  let menuOpen = false;
  let showingBlockedMessage = false;

  $: statusLabel = moderationStatusLabel({
    moderationState,
    report,
    isUnderReview,
    hasActiveReport: hasActiveReport || !!report
  });
  $: canVote = !!report && report.resolution !== 'removed' && report.resolution !== 'dismissed';
  $: triggerLabel = statusLabel
    ? `${statusLabel} · ${report ? `View ${itemLabel} report` : `Report ${itemLabel}`}`
    : report
      ? `View ${itemLabel} report`
      : `Report ${itemLabel}`;
  $: thresholdLines = report ? formatReportThresholdLines(report) : [];
  $: voteCountCopy = report
    ? `Current: ${report.voteSummary.yesCount} yes · ${report.voteSummary.noCount} no · ${report.voteSummary.totalVotes} total`
    : null;

  function closeMenu() {
    menuOpen = false;
    showingBlockedMessage = false;
  }

  function toggleMenu() {
    if (!interactive) {
      return;
    }
    if (menuOpen) {
      closeMenu();
      return;
    }

    menuOpen = true;
    showingBlockedMessage = false;
  }

  function handleTriggerClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleMenu();
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

  function resolutionLabel(resolution: ContentReportSummary['resolution']) {
    switch (resolution) {
      case 'open':
      case 'under_review':
        return 'Under review';
      case 'hidden':
        return 'Hidden';
      case 'removed':
        return 'Removed';
      case 'dismissed':
        return 'Dismissed';
      default:
        return 'Under review';
    }
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
    aria-expanded={interactive ? menuOpen : undefined}
    aria-label={triggerLabel}
    class:active-report={!!report || !!statusLabel}
    class:under-review={statusLabel === 'Under review'}
    class:hidden-state={statusLabel === 'Hidden'}
    class:read-only={!interactive}
    class="report-trigger"
    type="button"
    on:click={handleTriggerClick}
  >
    {#if statusLabel}
      <span class="status-token">{statusLabel}</span>
    {/if}
    {#if interactive}
      <span aria-hidden="true" class="menu-dots"></span>
    {/if}
    {#if report && !statusLabel}
      <span aria-hidden="true" class="report-indicator"></span>
    {/if}
  </button>
</div>

{#if interactive && menuOpen}
  <div
    aria-hidden="true"
    class="report-menu-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    role="presentation"
    style="position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:24px;background:color-mix(in srgb, var(--text-main) 20%, transparent);"
    tabindex="-1"
    use:portal={'body'}
  >
    <div
      aria-modal="true"
      class="report-menu"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      style="position:relative;z-index:1;width:min(340px, calc(100vw - 40px));"
      tabindex="-1"
    >
      {#if report}
        <p class="menu-label">{resolutionLabel(report.resolution)} - {reasonLabel(report.reason)}</p>
        <p class="menu-copy report-message">
          {report.description?.trim() ? report.description : 'No additional message was provided.'}
        </p>
        {#each thresholdLines as line}
          <p class="menu-copy threshold-copy">{line}</p>
        {/each}
        {#if voteCountCopy}
          <p class="menu-copy vote-summary">{voteCountCopy}</p>
        {/if}

        {#if canVote}
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
    flex: 0 0 auto;
    position: relative;
    z-index: 5;
    pointer-events: auto;
  }

  .report-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    color: var(--text-soft);
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
  }

  .report-trigger:not(.read-only):hover,
  .report-trigger:not(.read-only):focus-visible {
    background: color-mix(in srgb, var(--panel-border) 42%, transparent);
    color: var(--text-main);
    border-color: color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .report-trigger.active-report {
    background: var(--brand-soft);
    color: var(--brand-strong);
    border: 1px solid color-mix(in srgb, var(--brand) 45%, var(--panel-border));
  }

  .report-trigger.active-report:not(.read-only):hover,
  .report-trigger.active-report:not(.read-only):focus-visible {
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    border-color: var(--brand);
  }

  .report-trigger.under-review {
    border: 1px solid var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .report-trigger.hidden-state {
    border: 1px solid color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: var(--brand-badge);
    color: var(--brand-strong);
  }

  .report-trigger.read-only {
    cursor: default;
  }

  .status-token {
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
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

  /* Position/z-index also set inline so they survive portal out of scoped CSS trees. */
  .report-menu-backdrop {
    isolation: isolate;
  }

  .report-menu {
    padding: 12px;
    display: grid;
    gap: 8px;
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
    line-height: 1.4;
  }

  .report-message {
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-main);
    font-size: 13px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .threshold-copy,
  .vote-summary {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-main);
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
    background: var(--brand-soft);
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

  .menu-item:hover,
  .menu-item:focus-visible {
    color: var(--brand-strong);
  }

  .menu-dismiss {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }
</style>
