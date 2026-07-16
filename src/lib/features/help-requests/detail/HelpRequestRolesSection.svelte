<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { commitHelpRequestRole, uncommitHelpRequestRole } from '$lib/services/commands/shared';
  import type { HelpRequestPageData, HelpRequestRoleData } from '$lib/types/detail';

  export let data: HelpRequestPageData;

  let rolePending = '';
  let roleMessage = '';

  function roleHasOpenCapacity(role: HelpRequestRoleData) {
    return role.slots <= 0 || role.filledCount < role.slots;
  }

  function commitmentButtonLabel(role: HelpRequestRoleData) {
    if (role.isViewerAssigned) {
      return 'Leave role';
    }

    return roleHasOpenCapacity(role) ? 'Take role' : 'Role full';
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

      await invalidateAll();
    } catch {
      roleMessage = 'Could not update role signup. Reload and try again.';
    } finally {
      rolePending = '';
    }
  }
</script>

<section class="roles-section" aria-label="Roles needed">
  <div class="section-header">
    <h2>Roles needed</h2>
  </div>

  {#if data.roles.length === 0}
    <p class="empty-copy">No roles listed yet.</p>
  {:else}
    <div class="roles-grid">
      {#each data.roles as role}
        <article class="role-card">
          <h3>{role.title}</h3>
          {#if role.description}
            <p>{role.description}</p>
          {/if}
          <span class="slots">
            {role.filledCount} signed up
            {#if role.slots > 0}
              · {role.slots} needed
            {/if}
          </span>
          <button
            class:selected={role.isViewerAssigned}
            class="vote-chip"
            disabled={rolePending === role.roleId || (!role.isViewerAssigned && !roleHasOpenCapacity(role))}
            type="button"
            on:click={() => handleRoleCommitment(role)}
          >
            {rolePending === role.roleId ? 'Working...' : commitmentButtonLabel(role)}
          </button>
        </article>
      {/each}
    </div>
  {/if}

  {#if roleMessage}
    <p class="role-message">{roleMessage}</p>
  {/if}
</section>

<style>
  .roles-section {
    padding-top: 8px;
    border-top: 1px solid var(--panel-border);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .section-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--text-main);
  }

  .empty-copy,
  .role-message {
    color: var(--text-soft);
  }

  .roles-grid {
    display: grid;
    gap: 10px;
  }

  .role-card {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .role-card h3 {
    margin: 0 0 6px;
    font-size: 16px;
  }

  .role-card p {
    margin: 0 0 8px;
    color: var(--text-soft);
  }

  .slots {
    display: block;
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-main);
  }

  .vote-chip {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .vote-chip.selected {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .vote-chip:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
