<script lang="ts">
  export let username: string;
  export let size: 'sm' | 'md' = 'md';

  $: initials = username.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || 'SP';
</script>

<span class:size-sm={size === 'sm'} class:size-md={size === 'md'} class="avatar-badge">
  {initials}
</span>

<style>
  .avatar-badge {
    display: inline-grid;
    place-items: center;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--brand-soft), var(--brand-badge));
    color: var(--brand-strong);
    font-weight: 800;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  .size-sm {
    width: 34px;
    height: 34px;
    font-size: 11px;
  }

  .size-md {
    width: 42px;
    height: 42px;
    font-size: 13px;
  }
</style>