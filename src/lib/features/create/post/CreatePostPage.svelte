<script lang="ts">
  import { page } from '$app/stores';
  import PersonalPostCard from '$lib/components/cards/personal-feed/PersonalPostCard.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import { createPost } from '$lib/services/commands/create';
  import type { PersonalPostItem } from '$lib/types/feed';
  import { navigateAfterCreate } from '$lib/utils/navigateAfterCreate';

  let body = '';
  let statusMessage = '';
  let isSubmitting = false;
  let hasAppliedPrefill = false;

  $: viewer = $page.data.bootstrap?.viewer ?? null;
  $: prefillBody = $page.url.searchParams.get('prefill')?.trim() ?? '';
  $: if (!hasAppliedPrefill && prefillBody && !body.trim()) {
    body = prefillBody;
    hasAppliedPrefill = true;
  }

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

  async function handleCreate() {
    if (!canSubmit || isSubmitting) {
      return;
    }

    isSubmitting = true;
    statusMessage = '';

    try {
      const result = await createPost({
        body,
        audience: 'followers'
      });

      if (!result.ok || !result.id) {
        statusMessage = result.error ?? 'The post could not be created.';
        return;
      }

      await navigateAfterCreate(`/posts/${result.id}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel title="New post" description="Share directly with your followers.">
      <div class="composer">
        <p class="audience-cue">Followers only</p>
        <label>
          <RequiredFieldLabel>What's on your mind?</RequiredFieldLabel>
          <textarea
            bind:value={body}
            rows="8"
            placeholder="Share a direct post to your personal timeline..."
            aria-required="true"
          ></textarea>
        </label>
        {#if statusMessage}
          <p class="status-note">{statusMessage}</p>
        {/if}
        <div class="actions">
          <button
            class="button-primary"
            type="button"
            disabled={!canSubmit || isSubmitting}
            on:click={handleCreate}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </CreatePanel>
  </svelte:fragment>

  <svelte:fragment slot="secondary">
    <CreatePanel title="Live preview" description="How this will read in Personal." surface="transparent">
      {#if previewItem}
        <PersonalPostCard item={previewItem} />
      {/if}
    </CreatePanel>
  </svelte:fragment>
</CreateFlowLayout>

<style>
  .composer {
    display: grid;
    gap: 12px;
  }

  .audience-cue {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .status-note {
    margin: 0;
    color: var(--danger, #c0392b);
  }
</style>
