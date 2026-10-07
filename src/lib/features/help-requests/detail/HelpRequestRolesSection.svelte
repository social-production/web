<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import ShareUserMenu from '$lib/components/shared/ShareUserMenu.svelte';
  import DetailActionDock from '$lib/features/detail/DetailActionDock.svelte';
  import { shareHelpRequestWithUser } from '$lib/services/commands/create';
  import { getMessageContacts } from '$lib/services/queries/inbox';
  import { commitHelpRequestRole, setVote, uncommitHelpRequestRole } from '$lib/services/commands/shared';
  import type { DetailMember, HelpRequestPageData, HelpRequestRoleData } from '$lib/types/detail';
  import { buildShareUrl } from '$lib/utils/sharePrefill';
  import type { VoteDirection } from '$lib/types/feed';

  export let data: HelpRequestPageData;
  export let actionsActive = true;

  let rolePending = '';
  let roleMessage = '';

  function roleHasOpenCapacity(role: HelpRequestRoleData) {
    return role.slots <= 0 || role.filledCount < role.slots;
  }

  function signupLabel(role: HelpRequestRoleData) {
    if (rolePending === role.roleId) {
      return 'Working...';
    }

    if (role.isViewerAssigned) {
      return 'Leave';
    }

    return roleHasOpenCapacity(role) ? 'Sign up' : 'Full';
  }

  async function searchShareContacts(query: string): Promise<DetailMember[]> {
    try {
      const results = await getMessageContacts(query, 8);
      return results.map((contact) => ({
        id: contact.id,
        username: contact.username,
        bio: contact.bio ?? '',
        profileImageUrl: contact.profileImageUrl ?? null
      }));
    } catch {
      return [];
    }
  }

  function handleHelpShare(username: string) {
    return shareHelpRequestWithUser(data.id, username);
  }

  async function handleVote({ vote }: { vote: VoteDirection }) {
    await setVote({ id: data.id, type: 'help_request' }, vote);
  }

  async function handleRoleCommitment(role: HelpRequestRoleData) {
    if (rolePending) {
      return;
    }

    rolePending = role.roleId;
    roleMessage = '';

    try {
      const result = role.isViewerAssigned
        ? await uncommitHelpRequestRole(data.id, role.roleId)
        : await commitHelpRequestRole(data.id, role.roleId);

      if (!result.ok) {
        roleMessage = result.error ?? 'Could not update role signup.';
        return;
      }

      void invalidate(`app:help_request:${data.id}`);
    } catch {
      roleMessage = 'Could not update role signup. Reload and try again.';
    } finally {
      rolePending = '';
    }
  }
</script>

<DetailActionDock active={actionsActive}>
  <div class="context-dock">
    {#if data.roles.length > 0}
      <div class="role-stack">
        {#each data.roles as role}
          <article class="role-bar">
            <div class="role-copy">
              <strong>{role.title}</strong>
              {#if role.description}
                <p>{role.description}</p>
              {/if}
              <span>
                {role.filledCount} signed up
                {#if role.slots > 0}
                  · {role.slots} needed
                {/if}
              </span>
            </div>
            <button
              class:selected={role.isViewerAssigned}
              class="signup"
              disabled={rolePending === role.roleId || (!role.isViewerAssigned && !roleHasOpenCapacity(role))}
              type="button"
              on:click={() => handleRoleCommitment(role)}
            >
              {signupLabel(role)}
            </button>
          </article>
        {/each}
      </div>
    {/if}

    <div class="signal-row">
      {#if $page.data.bootstrap?.viewer}
        <ShareUserMenu
          copyLinkUrl={buildShareUrl(`/help-requests/${data.id}`)}
          menuTitle="Share help request"
          searchContacts={searchShareContacts}
          submitShare={handleHelpShare}
        />
      {/if}
      <VoteStrip
        activeVote={data.activeVote}
        count={data.voteCount}
        docked
        syncKey={data.id}
        onvote={handleVote}
      />
    </div>
  </div>
</DetailActionDock>

{#if roleMessage}
  <p class="role-message">{roleMessage}</p>
{/if}

<style>
  .context-dock {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
  }

  .role-stack {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .role-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px 10px 16px;
    border-bottom: 1px solid var(--panel-border);
    background: var(--panel);
  }

  .role-copy {
    display: grid;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .role-copy strong {
    color: var(--text-main);
    font-size: 15px;
  }

  .role-copy p,
  .role-copy span {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
  }

  .signup {
    display: grid;
    place-items: center;
    flex: 0 0 56px;
    width: 56px;
    height: 56px;
    padding: 4px;
    border: 0;
    border-radius: 12px;
    background: var(--brand);
    color: var(--page-bg);
    font-size: 11px;
    font-weight: 800;
    line-height: 1.05;
    text-align: center;
    white-space: normal;
    cursor: pointer;
  }

  .signup.selected {
    background: var(--panel-strong);
    color: var(--text-main);
    box-shadow: inset 0 0 0 1px var(--panel-border);
  }

  .signup:hover:not(:disabled) {
    background: color-mix(in srgb, var(--brand) 78%, white);
    color: var(--page-bg);
    filter: none;
    transform: none;
  }

  .signup.selected:hover:not(:disabled) {
    background: var(--brand-soft);
    color: var(--brand-strong);
    filter: none;
    transform: none;
  }

  .signup:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .signal-row {
    display: flex;
    width: 100%;
    min-width: 0;
  }

  .signal-row :global(.share-shell) {
    flex: 0 0 56px;
    border-right: 1px solid var(--panel-border);
  }

  .signal-row :global(.vote-strip.docked) {
    flex: 1 1 auto;
    width: auto;
  }

  .role-message {
    margin: 8px 0 0;
    color: var(--danger);
    font-size: 13px;
    font-weight: 700;
  }
</style>
