<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import ScopeAvatar from './ScopeAvatar.svelte';
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
  $: votable = settings?.proposals.filter((item) => item.viewerCanVote) ?? [];
  $: current = votable[index] ?? null;

  async function load() {
    const api = scopeSettingsApi();
    if (!api) return;
    settings = await api.get(kind, slug);
    const firstUnvoted = settings.proposals
      .filter((item) => item.viewerCanVote)
      .findIndex((item) => !item.viewerVote);
    index = Math.max(0, firstUnvoted);
  }

  function describe(item: ScopeProposal) {
    switch (item.kind) {
      case 'edit': {
        const parts = [];
        if (item.payload.name) parts.push(`rename to “${item.payload.name}”`);
        if (item.payload.description) parts.push('new description');
        if (item.payload.imageUrl) parts.push('new picture');
        return `Change: ${parts.join(', ') || 'settings'}`;
      }
      case 'remove_member':
        return `Remove ${item.payload.username ?? 'a member'}`;
      case 'to_collaborative':
        return 'Let all members decide';
      case 'to_organizer':
        return `Hand decisions to organizers: ${(item.payload.organizerUsernames ?? [item.proposer]).join(', ')}`;
    }
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
      await invalidateAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not record that vote.', 'error');
    } finally {
      busy = false;
    }
  }
</script>

<OverlaySheet bind:open title="Vote" labelledById="scope-vote-title">
  <div class="vote-body">
    {#if current}
      <p class="what">{describe(current)}</p>
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
        {current.yes} yes · {current.no} no · {current.votesRequired} votes needed · closes
        {new Date(current.closesAt).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
        })}
      </p>
      <div class="choices">
        <button
          class="no"
          type="button"
          class:chosen={current.viewerVote === 'no'}
          disabled={busy}
          on:click={() => current && cast(current, 'no')}>No</button
        >
        <button
          class="yes"
          type="button"
          class:chosen={current.viewerVote === 'yes'}
          disabled={busy}
          on:click={() => current && cast(current, 'yes')}>Yes</button
        >
      </div>
      {#if votable.length > 1}
        <button class="next" type="button" on:click={() => (index = (index + 1) % votable.length)}>
          Next · {votable.filter((item) => !item.viewerVote).length} left
        </button>
      {/if}
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

  .choices .yes {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--on-brand, #fff);
  }

  .choices .no.chosen {
    border-color: var(--danger);
    color: var(--danger);
  }

  .next {
    justify-self: end;
    padding: 0 16px;
  }
</style>
