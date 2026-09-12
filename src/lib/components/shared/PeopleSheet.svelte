<script context="module" lang="ts">
  export type PeopleSheetPerson = {
    id: string;
    username: string;
    profileImageUrl?: string | null;
    badges?: string[];
    actionLabel?: string;
    actionKind?: string;
    actionTone?: 'default' | 'danger';
    actionDisabled?: boolean;
  };

  export type PeopleSheetSection = {
    title?: string;
    description?: string;
    emptyCopy: string;
    members: PeopleSheetPerson[];
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import AvatarBadge from '$lib/components/shared/AvatarBadge.svelte';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';

  export let open = false;
  export let title = 'People';
  export let description = '';
  export let people: PeopleSheetPerson[] = [];
  export let sections: PeopleSheetSection[] | null = null;
  export let emptyCopy = 'No people yet.';
  export let searchPlaceholder = 'Search people';

  const dispatch = createEventDispatcher<{
    close: void;
    action: { memberId: string; actionKind: string };
  }>();

  let query = '';

  $: if (!open) {
    query = '';
  }

  $: resolvedSections =
    sections ??
    ([
      {
        emptyCopy,
        members: people
      }
    ] satisfies PeopleSheetSection[]);

  function sortPeople(list: PeopleSheetPerson[]) {
    return [...list].sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: 'base' }));
  }

  $: searchNeedle = query.trim().toLowerCase();
  $: filteredSections = resolvedSections.map((section) => ({
    ...section,
    members: sortPeople(
      section.members.filter(
        (member) => !searchNeedle || member.username.toLowerCase().includes(searchNeedle)
      )
    )
  }));

  function handleAction(member: PeopleSheetPerson) {
    if (!member.actionKind) {
      return;
    }
    dispatch('action', { memberId: member.id, actionKind: member.actionKind });
  }

  function handleClose() {
    open = false;
    dispatch('close');
  }
</script>

<OverlaySheet {open} {title} on:close={handleClose}>
  <svelte:fragment slot="subtitle">
    {#if description}
      <p class="sheet-description">{description}</p>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="header-actions">
    <slot name="actions" />
  </svelte:fragment>

  <svelte:fragment slot="toolbar">
    <div class="sheet-search">
      <label class="sr-only" for="people-sheet-search">Search people</label>
      <input
        id="people-sheet-search"
        bind:value={query}
        placeholder={searchPlaceholder}
        type="search"
      />
    </div>
  </svelte:fragment>

  {#each filteredSections as section, index}
    {#if section.title || section.description}
      <div class="section-copy">
        {#if section.title}
          <h3>{section.title}</h3>
        {/if}
        {#if section.description}
          <p>{section.description}</p>
        {/if}
      </div>
    {/if}

    <div class="people-list">
      {#if section.members.length === 0}
        <p class="empty-row">{query.trim() ? 'No matches.' : section.emptyCopy}</p>
      {:else}
        {#each section.members as member (member.id)}
          <div class="person-row">
            <a
              class="person-main"
              href={`/profile/${member.username}?from=${encodeURIComponent($page.url.pathname)}`}
              on:click={handleClose}
            >
              <AvatarBadge size="sm" username={member.username} imageUrl={member.profileImageUrl ?? null} />
              <span class="person-copy">
                <strong>{member.username}</strong>
                {#if member.badges?.length}
                  <span class="badge-row">
                    {#each member.badges as badge}
                      <span class="badge">{badge}</span>
                    {/each}
                  </span>
                {/if}
              </span>
            </a>
            {#if member.actionLabel && member.actionKind}
              <button
                class:danger={member.actionTone === 'danger'}
                class="row-action"
                disabled={member.actionDisabled}
                type="button"
                on:click={() => handleAction(member)}
              >
                {member.actionLabel}
              </button>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    {#if index < filteredSections.length - 1}
      <div class="section-divider"></div>
    {/if}
  {/each}
</OverlaySheet>

<style>
  .sheet-description {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  .sheet-search {
    padding: 10px 16px 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .sheet-search input {
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
  }

  .section-copy {
    display: grid;
    gap: 4px;
    padding: 12px 16px 4px;
  }

  .section-copy h3 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .section-copy p {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  .people-list {
    display: grid;
  }

  .person-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    min-height: 52px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .person-row:last-child {
    border-bottom: none;
  }

  .person-row:hover {
    background: color-mix(in srgb, var(--panel-hover) 70%, transparent);
  }

  .person-main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1 1 auto;
    color: inherit;
    text-decoration: none;
  }

  .person-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .person-copy strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .badge {
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 10px;
    font-weight: 700;
  }

  .row-action {
    flex-shrink: 0;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .row-action.danger {
    border-color: color-mix(in srgb, #b91c1c 45%, var(--panel-border));
    color: #b91c1c;
  }

  .empty-row {
    margin: 0;
    padding: 20px 16px;
    color: var(--text-soft);
    font-size: 13px;
    text-align: center;
  }

  .section-divider {
    height: 1px;
    margin: 8px 16px;
    background: color-mix(in srgb, var(--panel-border) 75%, transparent);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
