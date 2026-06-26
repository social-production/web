<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';

  type MemberListItem = {
    id: string;
    username: string;
    badges?: string[];
    actionLabel?: string;
    actionKind?: string;
    actionTone?: 'default' | 'danger';
    actionDisabled?: boolean;
  };

  type MemberListSection = {
    title?: string;
    description?: string;
    emptyCopy: string;
    members: MemberListItem[];
  };

  export let panelId = 'members-panel';
  export let title = 'Members';
  export let description = '';
  export let sections: MemberListSection[] = [];
  export let scrollAfterCount = 20;

  const dispatch = createEventDispatcher<{
    action: { memberId: string; actionKind: string };
  }>();

  function handleAction(member: MemberListItem) {
    if (!member.actionKind) {
      return;
    }

    dispatch('action', {
      memberId: member.id,
      actionKind: member.actionKind
    });
  }

  $: totalMembers = sections.reduce((count, section) => count + section.members.length, 0);
  $: scrollable = totalMembers > scrollAfterCount;
</script>

<section class="members-panel" id={panelId}>
  <div class="members-header">
    <div class="section-copy">
      <h2>{title}</h2>
      {#if description}
        <p>{description}</p>
      {/if}
    </div>
  </div>

  <div class:scrollable class="members-scroll-shell">
    {#each sections as section, index}
      {#if section.title || section.description}
        <div class="subsection-copy">
          {#if section.title}
            <h3>{section.title}</h3>
          {/if}
          {#if section.description}
            <p>{section.description}</p>
          {/if}
        </div>
      {/if}

      <div class="member-list">
        {#if section.members.length === 0}
          <div class="empty-row">
            <p>{section.emptyCopy}</p>
          </div>
        {:else}
          {#each section.members as member}
            <div class="member-row">
              <div class="member-main">
                <a class="member-link" href={`/profile/${member.username}?from=${encodeURIComponent($page.url.pathname)}`}>{member.username}</a>
                {#if member.badges?.length}
                  <div class="member-badges">
                    {#each member.badges as badge}
                      <span class="status-chip">{badge}</span>
                    {/each}
                  </div>
                {/if}
              </div>

              {#if member.actionLabel && member.actionKind}
                <button
                  class:danger={member.actionTone === 'danger'}
                  class="member-action"
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

      {#if index < sections.length - 1}
        <div class="members-divider"></div>
      {/if}
    {/each}
  </div>
</section>

<style>
  .members-panel,
  .members-scroll-shell,
  .section-copy,
  .subsection-copy,
  .member-main,
  .member-badges {
    display: grid;
    gap: 10px;
  }

  .members-panel {
    padding: 18px 0 24px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--panel-border);
  }

  .members-scroll-shell {
    gap: 16px;
  }

  .members-scroll-shell.scrollable {
    max-height: 720px;
    overflow-y: auto;
    padding-right: 6px;
    scrollbar-gutter: stable;
  }

  .member-list {
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: color-mix(in srgb, var(--panel-strong) 86%, white 14%);
  }

  .member-row,
  .empty-row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
  }

  .member-row + .member-row {
    border-top: 1px solid var(--panel-border);
  }

  .member-main {
    min-width: 0;
  }

  .member-link {
    width: fit-content;
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    border-radius: 999px;
    padding: 2px 6px;
    margin: -2px -6px;
    transition: color 140ms ease, background 140ms ease;
  }

  .member-link:hover,
  .member-link:focus-visible {
    color: var(--brand-strong);
    background: var(--brand-soft);
    outline: none;
  }

  .member-badges {
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    align-items: center;
    gap: 6px;
  }

  .status-chip {
    padding: 3px 7px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-soft);
    background: var(--panel);
  }

  .member-action {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .member-action.danger {
    color: var(--accent-warm-strong);
  }

  .member-action:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .members-divider {
    border-top: 1px solid var(--panel-border);
  }

  h2,
  h3 {
    margin: 0;
    color: var(--text-main);
  }

  h2 {
    font-size: 14px;
  }

  h3 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-soft);
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }

  @media (max-width: 760px) {
    .member-row,
    .empty-row {
      align-items: flex-start;
      flex-wrap: wrap;
    }
  }
</style>