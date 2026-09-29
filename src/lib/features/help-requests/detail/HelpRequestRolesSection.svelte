<script lang="ts">
  import { invalidate } from '$app/navigation';
  import VoteStrip from '$lib/components/cards/shared/VoteStrip.svelte';
  import DetailActionDock from '$lib/features/detail/DetailActionDock.svelte';
  import { commitHelpRequestRole, setVote, uncommitHelpRequestRole } from '$lib/services/commands/shared';
  import type { HelpRequestPageData, HelpRequestRoleData } from '$lib/types/detail';
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
    display: grid;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    border-bottom: 1px solid var(--panel-border);
    background: var(--panel);
  }

  .role-copy {
    display: grid;
    gap: 2px;
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
    width: 100%;
    min-height: 48px;
    border: 0;
    border-radius: 0;
    background: var(--brand);
    color: var(--page-bg);
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
  }

  .signup.selected {
    background: var(--panel-strong);
    color: var(--text-main);
    box-shadow: inset 0 0 0 1px var(--panel-border);
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

  .signal-row :global(.vote-strip.docked) {
    width: 100%;
  }

  .role-message {
    margin: 8px 0 0;
    color: var(--danger);
    font-size: 13px;
    font-weight: 700;
  }
</style>
