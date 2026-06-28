<script lang="ts">
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import FeedSurface from '$lib/components/cards/shared/FeedSurface.svelte';
  import SubjectTablet from '$lib/components/cards/shared/SubjectTablet.svelte';
  import type { PersonalCommentActivityItem } from '$lib/types/feed';
  import { formatRelativeTime } from '$lib/utils/time';

  export let item: PersonalCommentActivityItem;
</script>

<FeedSurface href={item.href} tone="personal">
  <div class="header-row">
    <div class="identity-row">
      <AvatarBadge size="sm" username={item.author.username} imageUrl={item.author.profileImageUrl ?? null} />
      <div class="identity-copy">
        <div class="name-line">
          <a class="name" href={`/profile/${item.author.username}`}>{item.author.username}</a>
          <span class="action">- commented on</span>
          <SubjectTablet kind={item.subjectKind} projectMode="productive" />
        </div>
      </div>
    </div>
    <span class="time">{formatRelativeTime(item.createdAt)}</span>
  </div>

  <a class="subject-title" data-sveltekit-noscroll href={item.href}>{item.subjectTitle}</a>
  <p class="comment-excerpt">{item.commentExcerpt}</p>
</FeedSurface>

<style>
  .header-row,
  .identity-row,
  .name-line {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .header-row {
    justify-content: space-between;
  }

  .identity-copy {
    display: grid;
    gap: 4px;
  }

  .name {
    color: var(--text-main);
    font-weight: 800;
  }

  .action,
  .time,
  .comment-excerpt {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .subject-title {
    color: var(--text-main);
    font-size: 15px;
    font-weight: 800;
    line-height: 1.35;
  }

  .comment-excerpt {
    margin: 0;
    font-size: 13px;
  }
</style>
