<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ThreadCard from '$lib/components/cards/public-feed/ThreadCard.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import { createThread } from '$lib/services/queries/create';
  import {
    splitCommaValues
  } from '$lib/features/create/shared/options';
  import type { ScopeDirectoryItem } from '$lib/types/bootstrap';
  import type { PublicThreadItem } from '$lib/types/feed';
  import type { TagKind, TagRef } from '$lib/types/feed';

  const platformTagSlug = 'platform';

  let title = '';
  let body = '';
  let primaryTagType: 'Channel' | 'Community' = 'Channel';
  let primaryTagValue = '';
  let additionalChannels = '';
  let taggedCommunities = '';
  let statusMessage = '';
  let isSubmitting = false;
  let channelOptions: ScopeDirectoryItem[] = [];
  let communityOptions: ScopeDirectoryItem[] = [];

  $: viewer = $page.data.bootstrap?.viewer ?? null;
  $: channelOptions = ($page.data.bootstrap?.directory.channels ?? []) as ScopeDirectoryItem[];
  $: communityOptions = ($page.data.bootstrap?.directory.communities ?? []) as ScopeDirectoryItem[];

  function labelToSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function makeTagRef(label: string, kind: TagKind): TagRef {
    const normalized = label.trim().toLowerCase();
    const options = kind === 'channel' ? channelOptions : communityOptions;
    const match = options.find(
      (option) => option.label.toLowerCase() === normalized || option.slug.toLowerCase() === normalized
    );

    return {
      slug: match?.slug ?? labelToSlug(label),
      label: match?.label ?? label,
      kind
    };
  }

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

  $: canSubmit =
    title.trim().length > 0 && body.trim().length > 0 && primaryTagValue.trim().length > 0;
  $: usesPlatformTag =
    (primaryTagType === 'Channel' && primaryTagValue.trim().toLowerCase() === platformTagSlug) ||
    splitCommaValues(additionalChannels).some((value) => value.trim().toLowerCase() === platformTagSlug);

  async function handleCreate() {
    isSubmitting = true;
    statusMessage = '';

    try {
      const result = await createThread({
        title,
        body,
        channelTags: previewItem?.channelTags ?? [],
        communityTags: previewItem?.communityTags ?? []
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The thread could not be created.';
        return;
      }

      await invalidateAll();
      await goto(`/threads/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
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
            {#each channelOptions as option}
              <option value={option.label}></option>
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
          <button class="button-primary" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Thread'}
          </button>
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
        {usesPlatformTag
          ? 'Platform keeps public discussion open to regular users, and platform-tagged projects can also be proposed by any signed-in user.'
          : 'Threads keep lightweight public discussion and idea comparison outside the project logistics view.'}
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