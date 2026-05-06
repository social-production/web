<script lang="ts">
  import type { ProjectActivityRoleInput } from '$lib/types/detail';
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';

  export let roles: ProjectActivityRoleInput[] = [{ label: '', requiredCount: 1 }];
  export let title = 'Roles needed';

  function normalizeRequiredCount(value: number) {
    return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
  }

  function emptyRole(): ProjectActivityRoleInput {
    return { label: '', requiredCount: 1 };
  }

  function ensureAtLeastOneRole(nextRoles: ProjectActivityRoleInput[]) {
    return nextRoles.length > 0 ? nextRoles : [emptyRole()];
  }

  function updateRoleLabel(index: number, label: string) {
    roles = roles.map((role, roleIndex) =>
      roleIndex === index ? { ...role, label } : role
    );
  }

  function updateRoleCount(index: number, requiredCount: number) {
    roles = roles.map((role, roleIndex) =>
      roleIndex === index
        ? { ...role, requiredCount: normalizeRequiredCount(requiredCount) }
        : role
    );
  }

  function addRole() {
    roles = [...roles, emptyRole()];
  }

  function removeRole(index: number) {
    roles = ensureAtLeastOneRole(roles.filter((_, roleIndex) => roleIndex !== index));
  }
</script>

<div class="role-editor-shell">
  <div class="role-editor-header">
    <div>
      <span class="field-inline-label">{title}</span>
      <p class="role-editor-note">Add one row per role and set how many people are needed for that role.</p>
    </div>
  </div>

  <div class="role-row-stack">
    {#each roles as role, index}
      <div class="role-row">
        <label class="role-field role-name-field">
          <span class="field-inline-label">Role</span>
          <input
            maxlength="80"
            placeholder="For example: Intake desk"
            type="text"
            value={role.label}
            on:input={(event) =>
              updateRoleLabel(index, (event.currentTarget as HTMLInputElement).value)}
          />
        </label>

        <label class="role-field role-count-field">
          <span class="field-inline-label">Needed</span>
          <input
            min="1"
            type="number"
            value={role.requiredCount}
            on:input={(event) =>
              updateRoleCount(index, (event.currentTarget as HTMLInputElement).valueAsNumber)}
          />
        </label>

        <div class="role-remove-cell">
          {#if roles.length > 1}
            <button class="secondary-button" type="button" on:click={() => removeRole(index)}>
              Remove
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="role-add-row">
    <RoundPlusButton ariaLabel="Add role" action={addRole} />
  </div>
</div>

<style>
  .role-editor-shell,
  .role-row-stack {
    display: grid;
    gap: 12px;
  }

  .role-editor-note {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
  }

  .role-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 132px auto;
    gap: 12px;
    align-items: end;
  }

  .role-field {
    display: grid;
    gap: 6px;
  }

  .field-inline-label {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .role-remove-cell,
  .role-add-row {
    display: flex;
  }

  .role-remove-cell {
    align-items: end;
    min-height: 100%;
  }

  .role-add-row {
    justify-content: flex-start;
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  .secondary-button {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  @media (max-width: 760px) {
    .role-row {
      grid-template-columns: 1fr;
    }

    .role-remove-cell {
      justify-content: flex-start;
    }
  }
</style>