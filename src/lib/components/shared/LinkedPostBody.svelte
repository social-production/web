<script lang="ts">
  import type { PostBodyLink } from '$lib/types/feed';

  type Segment =
    | { kind: 'text'; value: string }
    | { kind: 'link'; value: string; href: string };

  export let body = '';
  export let links: PostBodyLink[] = [];
  export let variant: 'feed' | 'detail' = 'feed';

  function buildSegments(text: string, rawLinks: PostBodyLink[]): Segment[] {
    const normalizedLinks = rawLinks
      .filter((link) => link.label.trim().length > 0)
      .sort((left, right) => right.label.length - left.label.length);

    if (normalizedLinks.length === 0) {
      return [{ kind: 'text', value: text }];
    }

    const lowerText = text.toLowerCase();
    const segments: Segment[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      let nextMatch: { index: number; link: PostBodyLink } | null = null;

      for (const link of normalizedLinks) {
        const index = lowerText.indexOf(link.label.toLowerCase(), cursor);

        if (index === -1) {
          continue;
        }

        if (!nextMatch || index < nextMatch.index || (index === nextMatch.index && link.label.length > nextMatch.link.label.length)) {
          nextMatch = { index, link };
        }
      }

      if (!nextMatch) {
        segments.push({ kind: 'text', value: text.slice(cursor) });
        break;
      }

      if (nextMatch.index > cursor) {
        segments.push({ kind: 'text', value: text.slice(cursor, nextMatch.index) });
      }

      segments.push({
        kind: 'link',
        value: text.slice(nextMatch.index, nextMatch.index + nextMatch.link.label.length),
        href: nextMatch.link.href
      });

      cursor = nextMatch.index + nextMatch.link.label.length;
    }

    return segments.length > 0 ? segments : [{ kind: 'text', value: text }];
  }

  $: segments = buildSegments(body, links);
</script>

<p class:detail={variant === 'detail'} class:feed={variant === 'feed'} class="linked-body">
  {#each segments as segment}
    {#if segment.kind === 'link'}
      <a class="linked-subject" href={segment.href}>{segment.value}</a>
    {:else}
      {segment.value}
    {/if}
  {/each}
</p>

<style>
  .linked-body {
    margin: 0;
    color: var(--text-soft);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .linked-body.feed {
    margin-top: 10px;
    font-size: 14px;
    line-height: 1.45;
  }

  .linked-body.detail {
    margin-top: 14px;
    margin-bottom: 18px;
    font-size: 15px;
    line-height: 1.5;
  }

  .linked-subject {
    color: var(--brand-strong);
    font-weight: 700;
    text-decoration: underline;
  }
</style>