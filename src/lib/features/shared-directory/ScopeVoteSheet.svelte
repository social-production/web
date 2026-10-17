<script lang="ts">
  import { errorMessage } from '$lib/services/errors';
  import { invalidateAll } from '$app/navigation';
  import { refreshBootstrap } from '$lib/services/queries/bootstrap';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import ScopeAvatar from './ScopeAvatar.svelte';
  import { describeScopeProposal } from './scopeProposals';
  import { scopeSettingsApi } from '$lib/services/commands/scopes';
  import { showToast } from '$lib/stores/toast';
  import type { ScopeProposal, ScopeSettings, ScopeSettingsKind } from '$lib/types/scopeSettings';

  /** Open settings votes for a channel/community, one at a time; voting moves to the next. */
  export let open = false;
  export let kind: ScopeSettingsKind;
  export let slug: string;

  let settings: ScopeSettings | null = null;
  let index = 0;
  let busy = false;

  $: if (open) void load();
  $: if (!open) settings = null;
  $: votable = settings?.proposals.filter((item) => item.viewerCanVote) ?? [];
  $: current = votable[index] ?? null;
  $: unvotedCount = votable.filter((item) => !item.viewerVote).length;

  function formatWhen(value: string) {
    return new Date(value).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  async function load() {
    const api = scopeSettingsApi();
    if (!api) return;
    settings = await api.get(kind, slug);
    const firstUnvoted = settings.proposals
      .filter((item) => item.viewerCanVote)
      .findIndex((item) => !item.viewerVote);
    index = Math.max(0, firstUnvoted);
  }

  async function cast(item: ScopeProposal, vote: 'yes' | 'no') {
    const api = scopeSettingsApi();
    if (!api || busy) return;
    busy = true;
    try {
      settings = await api.vote(item.id, vote);
      showToast('Vote recorded');
      const remaining = settings.proposals.filter((p) => p.viewerCanVote && !p.viewerVote);
      if (remaining.length === 0) {
        open = false;
      } else {
        index = Math.max(
          0,
          votable.findIndex((p) => p.id === remaining[0].id)
        );
      }
      await refreshBootstrap();
      await invalidateAll();
    } catch (err) {
      showToast(errorMessage(err, 'Could not record that vote.'), 'error');
    } finally {
      busy = false;
    }
  }
</script>

<OverlaySheet bind:open title="Vote" labelledById="scope-vote-title">
  <div class="vote-body">
    {#if current}
      <p class="what">{describeScopeProposal(current)}</p>
      {#if current.proposer}
        <p class="meta">Proposed by {current.proposer}</p>
      {/if}
      {#if current.payload.imageUrl}
        <ScopeAvatar imageUrl={current.payload.imageUrl} kind={slug === 'platform' ? 'platform' : kind} size={72} />
      {/if}
      {#if current.payload.description}
        <blockquote>{current.payload.description}</blockquote>
      {/if}
      <p class="meta">
        {current.yes} yes · {current.no} no · {current.votesRequired} votes needed
      </p>
      <p class="meta">
        {#if current.createdAt}Proposed {formatWhen(current.createdAt)} · {/if}Closes
        {formatWhen(current.closesAt)}
      </p>
      {#if current.viewerVote}
        <p class="voted">You voted {current.viewerVote === 'yes' ? 'Yes' : 'No'}. Tap the other to change it.</p>
      {/if}
      <div class="choices">
        <button
          class="no"
          type="button"
          class:chosen={current.viewerVote === 'no'}
          aria-pressed={current.viewerVote === 'no'}
          disabled={busy}
          on:click={() => current && cast(current, 'no')}>No</button
        >
        <button
          class="yes"
          type="button"
          class:chosen={current.viewerVote === 'yes'}
          aria-pressed={current.viewerVote === 'yes'}
          disabled={busy}
          on:click={() => current && cast(current, 'yes')}>Yes</button
        >
      </div>
      {#if votable.length > 1}
        <div class="nav">
          <span class="meta">{index + 1} of {votable.length} · {unvotedCount} not voted yet</span>
          <button class="next" type="button" on:click={() => (index = (index + 1) % votable.length)}>
            Next
          </button>
        </div>
      {/if}
    {:else if !settings}
      <p class="meta">Loading…</p>
    {:else}
      <p class="meta">No open votes.</p>
    {/if}
  </div>
</OverlaySheet>

<style>
  .vote-body {
    display: grid;
    gap: 12px;
    padding: 16px 20px 24px;
  }

  .what {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
  }

  .meta {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
  }

  blockquote {
    margin: 0;
    padding: 8px 12px;
    border-left: 3px solid var(--brand);
    background: var(--panel-strong);
    white-space: pre-wrap;
  }

  .choices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .choices button,
  .next {
    min-height: 44px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  /* Outlined until chosen, so it's clear whether you've voted. */
  .choices .yes {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .choices .yes.chosen {
    background: var(--brand);
    color: var(--on-brand, #fff);
  }

  .choices .no {
    border-color: var(--danger);
    color: var(--danger);
  }

  .choices .no.chosen {
    background: var(--danger);
    color: #fff;
  }

  .voted {
    margin: 0;
    font-weight: 700;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .next {
    justify-self: end;
    padding: 0 16px;
  }
</style>
