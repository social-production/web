<script lang="ts">
  let open = false;
</script>

<div class="role-rules">
  <button class="rules-toggle" type="button" on:click={() => (open = !open)}>
    {open ? 'Hide how moderator roles work' : 'How moderator roles work'}
  </button>

  {#if open}
    <ul>
      <li>
        Moderators execute platform outcomes only after users approve them. They do not gate creation or decide platform direction on their own.
      </li>
      <li>Moderator standing follows the weekly active platform vote context rather than raw member counts.</li>
      <li>Roles that keep approval but temporarily fall short on required votes enter a one-week grace period before removal.</li>
    </ul>
  {/if}
</div>

<style>
  .role-rules {
    display: grid;
    gap: 8px;
  }

  .rules-toggle {
    width: fit-content;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.5;
  }
</style>
