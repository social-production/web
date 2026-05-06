<script lang="ts">
  import { page } from '$app/stores';
  import PersonalPostCard from '$lib/components/cards/personal-feed/PersonalPostCard.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import type { PersonalPostItem } from '$lib/types/feed';

  let body =
    'Use this space for direct personal posting that should not start inside Public.';
  let statusMessage = '';

  $: viewer = $page.data.bootstrap?.viewer ?? null;

  $: previewItem = viewer
    ? ({
        kind: 'post',
        id: 'post-preview',
        href: '#',
        author: viewer,
        audience: 'followers',
        voteTargetId: 'post-preview',
        body: body.trim() || 'Share a direct post to your personal timeline...',
        voteCount: 0,
        activeVote: 0,
        commentCount: 0,
        createdAt: new Date().toISOString()
      } satisfies PersonalPostItem)
    : null;

  $: canSubmit = body.trim().length > 0;

  function handleCreate() {
    statusMessage =
      'Frontend preview only for now. Personal posting will be wired into adapter state next.';
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the Personal create surface is now real.';
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Post To Personal"
      description="Text posts live here directly. Image posts can layer in later without changing the Personal/Public split."
    >
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <label>
          <span class="field-label">Post body</span>
          <textarea bind:value={body} rows="8" placeholder="Share a direct post to your personal timeline..."></textarea>
        </label>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit} type="submit">Post</button>
          <button class="button-ghost" type="button" on:click={handleDraft}>Save Draft</button>
        </div>

        {#if statusMessage}
          <p class="status-note">{statusMessage}</p>
        {/if}
      </form>
    </CreatePanel>
  </svelte:fragment>

  <svelte:fragment slot="secondary">
    <CreatePanel
      title="Live preview"
      description="Shows how the new post will read in Personal."
      surface="transparent"
    >
      {#if previewItem}
        <PersonalPostCard item={previewItem} />
      {/if}
    </CreatePanel>

    <CreatePanel title="Personal rule" description="Why this surface stays separate.">
      <p class="helper-text">
        Personal follows people instead of tags. Direct posts belong here first instead of being forced into the Public stream.
      </p>
    </CreatePanel>
  </svelte:fragment>
</CreateFlowLayout>

<style>
  .form-stack {
    display: grid;
    gap: 12px;
  }

  .field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 700;
  }
</style>