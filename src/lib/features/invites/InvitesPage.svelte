<script lang="ts">
  import { goto } from '$app/navigation';
  import { answerInvite } from '$lib/services/commands/invites';
  import { formatLocalDateTimeRange, formatRelativeTime } from '$lib/utils/time';
  import type { PendingInvite } from '$lib/types/invites';

  /** Invites to private communities and events; nobody joins until they accept. */
  export let invites: PendingInvite[] = [];

  let busyId: string | null = null;

  async function answer(invite: PendingInvite, accept: boolean) {
    busyId = invite.id;
    try {
      const result = await answerInvite(invite.id, accept);
      invites = invites.filter((item) => item.id !== invite.id);
      if (result.accepted && result.href) await goto(result.href);
    } catch {
      // The command shows why it failed.
    } finally {
      busyId = null;
    }
  }
</script>

<section class="invites">
  <h1>Invites</h1>
  {#if invites.length === 0}
    <p class="muted">
      No invites waiting. When someone invites you to a private community or event, it shows up
      here.
    </p>
  {:else}
    <ul>
      {#each invites as invite (invite.id)}
        <li>
          <p class="kind">
            {invite.kind === 'community'
              ? 'Private community'
              : 'Private event'}{#if invite.invitedBy}
              · from {invite.invitedBy}{/if} · {formatRelativeTime(invite.createdAt)}
          </p>
          <strong>{invite.title}</strong>
          {#if invite.scheduledAt}
            <span class="when">{formatLocalDateTimeRange(invite.scheduledAt, invite.endsAt)}</span>
          {/if}
          {#if invite.description}
            <p class="description">{invite.description}</p>
          {/if}
          <div class="actions">
            <button
              class="decline"
              type="button"
              disabled={busyId === invite.id}
              on:click={() => answer(invite, false)}
            >
              Decline
            </button>
            <button
              class="accept"
              type="button"
              disabled={busyId === invite.id}
              on:click={() => answer(invite, true)}
            >
              Accept
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .invites {
    display: grid;
    gap: 14px;
    max-width: 640px;
    margin: 24px auto;
    padding: 0 16px 48px;
  }

  h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
  }

  ul {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    gap: 6px;
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .kind,
  .muted,
  .when {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
  }

  .description {
    margin: 0;
    color: var(--text-main);
    line-height: 1.5;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 4px;
  }

  .actions button {
    min-height: 40px;
    border-radius: var(--radius-sm);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .accept {
    border: 0;
    background: var(--brand);
    color: var(--on-brand, #fff);
  }

  .decline {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-main);
  }
</style>
