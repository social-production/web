<script lang="ts">
  import { page } from '$app/stores';
  import ThreadCard from '$lib/components/cards/public-feed/ThreadCard.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import {
    communityOptions,
    makeTagRef,
    splitCommaValues
  } from '$lib/features/create/shared/options';
  import type { PublicThreadItem } from '$lib/types/feed';

  let title = 'How should we coordinate first-round retrofit walkthroughs?';
  let body =
    'Looking for a discussion space that stays separate from the project logistics view so people can compare options without cluttering the project page.';
  let primaryTagType: 'Channel' | 'Community' = 'Channel';
  let primaryTagValue = 'Housing & Build';
  let additionalChannels = '';
  let taggedCommunities = '';
  let statusMessage = '';

  $: viewer = $page.data.bootstrap?.viewer ?? null;

  $: previewItem = viewer
    ? ({
        kind: 'thread',
        id: 'thread-preview',
        slug: 'thread-preview',
        href: '#',
      createdAt: new Date().toISOString(),
        title: title.trim() || 'Untitled thread',
        body: body.trim() || 'Describe the question or comparison you want people to discuss.',
        authorUsername: viewer.username,
        channelTags: [
          ...(primaryTagType === 'Channel' && primaryTagValue.trim()
            ? [makeTagRef(primaryTagValue.trim(), 'channel')]
            : []),
          ...splitCommaValues(additionalChannels).map((value) => makeTagRef(value, 'channel'))
        ],
        communityTags: [
          ...(primaryTagType === 'Community' && primaryTagValue.trim()
            ? [makeTagRef(primaryTagValue.trim(), 'community')]
            : []),
          ...splitCommaValues(taggedCommunities).map((value) => makeTagRef(value, 'community'))
        ],
        voteCount: 0,
        activeVote: 0,
        commentCount: 0,
        lastActivityAt: new Date().toISOString()
      } satisfies PublicThreadItem)
    : null;

  $: canSubmit = title.trim().length > 0 && primaryTagValue.trim().length > 0;

  function handleCreate() {
    statusMessage =
      'Frontend preview only for now. The thread form is modular and ready for adapter-backed creation next.';
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the route and preview are now real.';
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Thread setup"
      description="Start the discussion, choose a primary discovery tag, and add optional tags for wider reach."
    >
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <label>
          <span class="field-label">Thread title</span>
          <input bind:value={title} />
        </label>

        <label>
          <span class="field-label">Primary tag type</span>
          <select bind:value={primaryTagType}>
            <option value="Channel">Channel</option>
            <option value="Community">Community</option>
          </select>
        </label>

        <label>
          <span class="field-label">
            {primaryTagType === 'Community' ? 'Primary community tag' : 'Primary channel tag'}
          </span>
          <input
            bind:value={primaryTagValue}
            list={primaryTagType === 'Community' ? 'thread-communities' : 'thread-channels'}
          />
          <datalist id="thread-channels">
            {#each ['Housing & Build', 'Mutual Aid', 'Energy Retrofit'] as option}
              <option value={option}></option>
            {/each}
          </datalist>
          <datalist id="thread-communities">
            {#each communityOptions as option}
              <option value={option.label}></option>
            {/each}
          </datalist>
        </label>

        <label>
          <span class="field-label">Additional channel tags</span>
          <input bind:value={additionalChannels} placeholder="Comma-separated" />
        </label>

        <label>
          <span class="field-label">Community tags</span>
          <input bind:value={taggedCommunities} placeholder="Comma-separated" />
        </label>

        <label>
          <span class="field-label">Opening post</span>
          <textarea bind:value={body} rows="5"></textarea>
        </label>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit} type="submit">Create Thread</button>
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
      description="Threads now sit on the same surface as the feed background."
      surface="transparent"
    >
      {#if previewItem}
        <ThreadCard item={previewItem} />
      {/if}
    </CreatePanel>

    <CreatePanel
      title="Discussion note"
      description="How the tag choice affects discovery."
    >
      <p class="helper-text">
        Threads keep lightweight public discussion and idea comparison outside the project logistics view.
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