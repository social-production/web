<script lang="ts">
  import GroupsIcon from '$lib/components/shared/GroupsIcon.svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';
  import {
    activityStampInstant,
    describeUpdateTime,
    formatRelativeTimeCompact,
  } from '$lib/utils/time';

  /** Shared author / members / activity meta chips for feed and detail cards. */
  export let authorUsername: string | null = null;
  export let authorHref: string | null = null;
  export let memberCount: number | null = null;
  export let createdAt: string | null = null;
  export let updatedAt: string | null = null;
  /** When true, only show the clock stamp (no author/members). */
  export let timeOnly = false;

  $: activityLabel = createdAt ? describeUpdateTime(createdAt, updatedAt) : '';
  $: activityInstant = createdAt ? activityStampInstant(createdAt, updatedAt) : '';
  $: resolvedAuthorHref = authorHref ?? (authorUsername ? `/profile/${authorUsername}` : null);
  $: isUpdated = Boolean(createdAt && updatedAt && +new Date(updatedAt) > +new Date(createdAt));
</script>

<span class="content-meta-row" class:time-only={timeOnly}>
  {#if !timeOnly && authorUsername && resolvedAuthorHref}
    <a class="inline-link" href={resolvedAuthorHref} title={authorUsername}>{authorUsername}</a>
  {:else if !timeOnly && authorUsername}
    <span class="inline-link" title={authorUsername}>{authorUsername}</span>
  {/if}

  {#if memberCount != null}
    <span class="meta-chip" title={`${memberCount} members`}>
      <GroupsIcon className="meta-icon" />
      <span>{memberCount}</span>
    </span>
  {/if}

  {#if createdAt}
    <span class="meta-chip activity-stamp" title={activityLabel} aria-label={activityLabel}>
      <span class="meta-icon-wrap" aria-hidden="true">
        <FeedToolbarIcon name={isUpdated ? 'loudspeaker' : 'clock'} />
      </span>
      <span>{formatRelativeTimeCompact(activityInstant)}</span>
    </span>
  {/if}
</span>

<style>
  .content-meta-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
    min-width: 0;
    color: var(--text-soft);
    white-space: nowrap;
  }

  .content-meta-row.time-only {
    gap: 4px;
  }

  .inline-link {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-main);
    font-weight: 700;
  }

  .meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-soft);
  }

  .meta-chip :global(.meta-icon),
  .meta-icon-wrap {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
  }

  .meta-icon-wrap :global(.toolbar-icon),
  .meta-icon-wrap :global(svg) {
    width: 14px;
    height: 14px;
  }

  .activity-stamp {
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .content-meta-row {
      width: auto;
      max-width: 100%;
      min-width: 0;
      gap: 4px;
      overflow: hidden;
      font-size: clamp(8px, 2.6vw, 11px);
    }

    .inline-link {
      flex: 1 1 auto;
    }

    .meta-chip {
      flex: 0 0 auto;
      gap: 2px;
    }

    .meta-chip :global(.meta-icon),
    .meta-icon-wrap,
    .meta-icon-wrap :global(.toolbar-icon),
    .meta-icon-wrap :global(svg) {
      width: 12px;
      height: 12px;
    }
  }
</style>
