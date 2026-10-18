# Shared UI components

Full source embeds from `src/lib/components`. Settings toggle styles live in `src/lib/features/settings/SettingsPage.svelte` (see `.toggle` / `.toggle.on` in that file's `<style>` block, lines ~772–807).

## `src/lib/components/cards/shared/FeedSurface.svelte`

```svelte
<script lang="ts">
  import type { SurfaceTypeAccent } from '$lib/utils/surfaceType';
  import { surfaceAccentCssVar } from '$lib/utils/surfaceType';

  export let tone: 'public' | 'personal' = 'public';
  export let href: string | null = null;
  export let accent: SurfaceTypeAccent | null = null;
  export let isLast = false;
  /** Serious-harm restriction: keep card in feed but blur text/media with a warning. */
  export let contentRestricted = false;
  /** Feed cards clamp body/summary; detail surfaces that embed discussion should not. */
  export let clampExcerpts = true;

  let revealRestricted = false;

  $: skipScrollOnNavigate = href?.includes('comment=') ?? false;
  $: accentColor = accent ? surfaceAccentCssVar(accent) : null;
  $: blurContent = contentRestricted && !revealRestricted;
</script>

<article
  class:tone-public={tone === 'public'}
  class:tone-personal={tone === 'personal'}
  class:clickable={!!href}
  class:last-row={isLast}
  class:has-accent={!!accent}
  class:content-restricted={contentRestricted}
  class="surface"
  style={accentColor ? `--row-accent: ${accentColor};` : undefined}
>
  {#if href}
    <a
      aria-label="Open item"
      class="surface-link"
      data-sveltekit-noscroll={skipScrollOnNavigate || undefined}
      data-sveltekit-preload-data="hover"
      {href}
    ></a>
  {/if}

  {#if contentRestricted}
    <div class="restriction-banner">
      <span>Serious harm report — content blurred until you choose to reveal it.</span>
      <button
        class="reveal-btn"
        type="button"
        on:click|stopPropagation={() => (revealRestricted = !revealRestricted)}
      >
        {revealRestricted ? 'Hide again' : 'Reveal'}
      </button>
    </div>
  {/if}

  <div class:blurred={blurContent} class:clamp-excerpts={clampExcerpts} class="content">
    <slot />
  </div>
</article>

<style>
  .surface {
    position: relative;
    min-width: 0;
    max-width: 100%;
    padding: 18px 12px;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    box-shadow: none;
    background: var(--panel);
    transition: background-color 0.16s ease;
  }

  .surface.has-accent {
    border-left: 3px solid var(--row-accent, var(--type-accent-neutral));
    padding-left: 9px;
  }

  .surface.last-row {
    border-bottom: none;
  }

  .surface.content-restricted {
    background: color-mix(in srgb, var(--brand-soft) 35%, var(--panel));
  }

  .surface-link {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
  }

  .restriction-banner {
    position: relative;
    z-index: 2;
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 10px;
    padding: 8px 10px;
    border: 1px solid color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    pointer-events: auto;
  }

  .reveal-btn {
    padding: 4px 8px;
    border: 1px solid color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    border-radius: 999px;
    background: var(--panel);
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .content {
    position: relative;
    z-index: 1;
    min-width: 0;
    max-width: 100%;
    pointer-events: none;
  }

  .content.blurred {
    filter: blur(6px);
    user-select: none;
  }

  .content :global(.title),
  .content :global(a.title),
  .content :global(.subject-title) {
    display: block;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .content.clamp-excerpts :global(.body),
  .content.clamp-excerpts :global(.summary),
  .content.clamp-excerpts :global(.comment-excerpt),
  .content.clamp-excerpts :global(.linked-body.feed) {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 3;
    -webkit-line-clamp: 3;
  }

  .content.clamp-excerpts :global(.latest-summary) {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }

  .content:not(.clamp-excerpts) :global(.body),
  .content:not(.clamp-excerpts) :global(.summary),
  .content:not(.clamp-excerpts) :global(.comment-excerpt),
  .content:not(.clamp-excerpts) :global(.linked-body),
  .content:not(.clamp-excerpts) :global(.latest-summary) {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .content :global(a),
  .content :global(button),
  .content :global(input),
  .content :global(textarea),
  .content :global(select),
  .content :global(label),
  .content :global([role='link']),
  .content :global(.report-control),
  .content :global(.report-menu-shell) {
    pointer-events: auto;
    cursor: pointer;
  }

  .tone-public,
  .tone-personal {
    background: var(--panel);
  }

  .clickable {
    cursor: pointer;
  }

  .clickable:hover {
    background: var(--panel-hover);
  }
</style>
```

## `src/lib/components/cards/shared/SurfaceTypeLabel.svelte`

```svelte
<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { ProjectMode, SubjectKind } from '$lib/types/feed';
  import {
    surfaceAccentCssVar,
    surfaceIconForKind,
    surfaceTypeAccent,
    surfaceTypeLabel
  } from '$lib/utils/surfaceType';

  export let kind: SubjectKind;
  export let projectMode: ProjectMode = 'productive';

  $: label = surfaceTypeLabel(kind, projectMode);
  $: accent = surfaceTypeAccent(kind, projectMode);
  $: icon = surfaceIconForKind(kind);
  $: accentColor = surfaceAccentCssVar(accent);
</script>

<span class="surface-type-label" style={`--surface-accent: ${accentColor}`}>
  <SurfaceIcon {icon} size="sm" />
  <span class="label-copy">{label}</span>
</span>

<style>
  .surface-type-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
  }

  .label-copy {
    color: var(--text-soft);
    white-space: nowrap;
  }
</style>
```

## `src/lib/components/cards/shared/ScopeChip.svelte`

```svelte
<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  export let label: string;
  export let icon: SurfaceIconId = 'channel';
  export let href: string | null = null;
</script>

{#if href}
  <a class="scope-chip" {href} title={label} aria-label={label}>
    <SurfaceIcon {icon} size="sm" />
    <span>{label}</span>
  </a>
{:else}
  <span class="scope-chip" title={label} aria-label={label}>
    <SurfaceIcon {icon} size="sm" />
    <span>{label}</span>
  </span>
{/if}

<style>
  .scope-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    max-width: 100%;
    padding: 3px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: transparent;
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    white-space: nowrap;
  }

  a.scope-chip:hover {
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .scope-chip span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 760px) {
    .scope-chip {
      gap: 3px;
      padding: 2px 5px;
      font-size: clamp(8px, 2.4vw, 10px);
      max-width: 100%;
    }

    .scope-chip :global(svg),
    .scope-chip :global(.surface-icon) {
      width: 11px;
      height: 11px;
    }
  }
</style>
```

## `src/lib/components/cards/shared/TagList.svelte`

```svelte
<script lang="ts">
  import ScopeChip from '$lib/components/cards/shared/ScopeChip.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';
  import type { TagRef } from '$lib/types/feed';

  export let tags: TagRef[] = [];
  export let columns: number | null = null;
  /** Collapsed chip count. `null` shows every tag (detail headers). */
  export let maxVisible: number | null = 1;

  let expanded = false;

  $: hiddenCount =
    maxVisible == null || expanded ? 0 : Math.max(0, tags.length - maxVisible);
  $: visibleTags = maxVisible == null || expanded ? tags : tags.slice(0, maxVisible);

  function iconFor(tag: TagRef): SurfaceIconId {
    if (tag.kind === 'community') {
      return 'community';
    }

    return tag.slug === 'platform' ? 'platform' : 'channel';
  }

  function hrefFor(tag: TagRef) {
    if (tag.slug === 'platform') {
      return '/platform';
    }

    return tag.kind === 'community' ? `/communities/${tag.slug}` : `/channels/${tag.slug}`;
  }

  function toggleOverflow(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    expanded = !expanded;
  }
</script>

{#if tags.length > 0}
  <div
    class:grid-layout={!!columns}
    class:expanded
    class="tag-list"
    style:--tag-columns={columns ? `${columns}` : undefined}
  >
    {#each visibleTags as tag}
      <ScopeChip href={hrefFor(tag)} icon={iconFor(tag)} label={tag.label} />
    {/each}
    {#if maxVisible != null && tags.length > maxVisible}
      <button
        type="button"
        class="tag-overflow-btn"
        aria-expanded={expanded}
        aria-label={expanded ? 'Show fewer tags' : `Show ${hiddenCount} more tags`}
        on:click={toggleOverflow}
      >
        {expanded ? '−' : `+${hiddenCount}`}
      </button>
    {/if}
  </div>
{/if}

<style>
  .tag-list {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: nowrap;
    min-width: 0;
    max-width: 100%;
  }

  .tag-list.expanded,
  .tag-list.grid-layout {
    flex-wrap: wrap;
  }

  .tag-list.grid-layout {
    display: grid;
    grid-template-columns: repeat(var(--tag-columns), max-content);
    justify-content: end;
  }

  .tag-list.expanded {
    justify-content: flex-end;
  }

  .tag-overflow-btn {
    flex: 0 0 auto;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
  }

  .tag-list :global(.scope-chip) {
    min-width: 0;
    max-width: 11rem;
  }

  @media (max-width: 760px) {
    .tag-list {
      width: auto;
      min-width: 0;
      gap: 4px;
    }

    .tag-list.grid-layout:not(.expanded) {
      display: flex;
      flex-wrap: nowrap;
      justify-content: flex-end;
    }

    .tag-list :global(.scope-chip) {
      flex: 0 1 auto;
      max-width: min(7.5rem, 42vw);
    }
  }
</style>
```

## `src/lib/components/shared/IconMenuButton.svelte`

```svelte
<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';
  import { portal } from '$lib/utils/portal';

  export let value: string;
  export let ariaLabel: string;
  export let options: Array<{ value: string; label: string; icon?: SurfaceIconId }> = [];
  export let showOptionIcons = false;
  export let showTriggerLabel = false;
  export let defaultValue: string | null = null;
  export let portaled = false;
  export let preferAbove = false;

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  let open = false;
  let shell: HTMLDivElement;
  let triggerElement: HTMLButtonElement;
  let menuElement: HTMLDivElement;
  let menuStyle = '';

  $: baselineValue = defaultValue ?? options[0]?.value ?? '';
  $: isActive = value !== baselineValue;
  $: triggerLabel = options.find((option) => option.value === value)?.label ?? ariaLabel;

  async function positionMenu() {
    await tick();

    if (!triggerElement || !menuElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const gap = 4;
    const viewportPadding = 8;

    let top: number;
    let left = triggerRect.right - menuRect.width;

    if (preferAbove) {
      top = triggerRect.top - menuRect.height - gap;
    } else {
      top = triggerRect.bottom + gap;
      if (top + menuRect.height > window.innerHeight - viewportPadding) {
        top = triggerRect.top - menuRect.height - gap;
      }
    }

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuRect.width - viewportPadding));
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - menuRect.height - viewportPadding));

    menuStyle = `top: ${top}px; left: ${left}px;`;
  }

  async function toggle() {
    open = !open;

    if (open) {
      await positionMenu();
    }
  }

  function close() {
    open = false;
  }

  function selectOption(nextValue: string) {
    // Always emit change so selecting the baseline default (e.g. "All time")
    // still triggers feed reloads when local state was previously out of sync.
    const changed = nextValue !== value;
    value = nextValue;
    if (changed || nextValue === baselineValue) {
      dispatch('change', { value: nextValue });
    }

    close();
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      close();
    }
  }

  function handleViewportChange() {
    if (open) {
      void positionMenu();
    }
  }

  function handleDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (!open) {
      return;
    }
    if (shell?.contains(target)) {
      return;
    }
    if (menuElement?.contains(target)) {
      return;
    }
    close();
  }

  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  });
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<div bind:this={shell} class="icon-menu-shell">
  <button
    bind:this={triggerElement}
    type="button"
    class="icon-menu-trigger"
    class:has-label={showTriggerLabel}
    class:menu-open={open}
    class:menu-active={isActive}
    aria-label={ariaLabel}
    aria-expanded={open}
    aria-haspopup="menu"
    on:click|stopPropagation={toggle}
  >
    <slot />
    {#if showTriggerLabel}
      <span class="trigger-label">{triggerLabel}</span>
    {/if}
  </button>

  {#if open}
    <div
      bind:this={menuElement}
      class="icon-menu"
      role="menu"
      style={menuStyle}
      use:portal={portaled ? 'body' : false}
    >
      {#each options as option (option.value)}
        <button
          type="button"
          role="menuitemradio"
          aria-checked={option.value === value}
          class="icon-menu-item"
          class:selected={option.value === value}
          on:mousedown|preventDefault
          on:click={() => selectOption(option.value)}
        >
          {#if showOptionIcons && option.icon}
            <SurfaceIcon icon={option.icon} size="sm" />
          {/if}
          <span class="item-label">{option.label}</span>
          {#if option.value === value}
            <span aria-hidden="true" class="check">✓</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .icon-menu-shell {
    display: inline-flex;
  }

  .icon-menu-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
  }

  .icon-menu-trigger.has-label {
    width: auto;
    min-height: 32px;
    padding: 4px 8px;
    gap: 6px;
  }

  .trigger-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-main);
    white-space: nowrap;
  }

  .icon-menu-trigger:hover,
  .icon-menu-trigger.menu-open {
    background: color-mix(in srgb, var(--panel-border) 42%, transparent);
    color: var(--text-main);
  }

  .icon-menu-trigger.menu-active {
    box-shadow: inset 0 -2px 0 var(--text-soft);
  }

  .icon-menu {
    position: fixed;
    z-index: 80;
    min-width: 168px;
    padding: 4px;
    display: grid;
    gap: 2px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    box-shadow: 0 10px 24px color-mix(in srgb, var(--text-main) 10%, transparent);
  }

  .icon-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 8px;
    border: none;
    border-radius: calc(var(--radius-sm) - 2px);
    background: transparent;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    transition: background-color 120ms ease;
  }

  .icon-menu-item:hover,
  .icon-menu-item.selected {
    background: color-mix(in srgb, var(--panel-border) 38%, transparent);
  }

  .item-label {
    flex: 1 1 auto;
    min-width: 0;
  }

  .check {
    flex: 0 0 auto;
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 800;
  }
</style>
```

## `src/lib/components/shared/ContentMetaRow.svelte`

```svelte
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
```

