<script lang="ts">
  export let username: string;
  export let size: 'sm' | 'md' = 'md';
  export let imageUrl: string | null = null;

  $: initials = username.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || 'SP';
  // A picture that fails to load falls back to initials instead of clipped alt text.
  let failedUrl: string | null = null;
  $: hasImage = !!imageUrl && imageUrl.trim().length > 0 && failedUrl !== imageUrl;
</script>

<span class:size-sm={size === 'sm'} class:size-md={size === 'md'} class="avatar-badge">
  {#if hasImage}
    <img
      alt=""
      class="avatar-image"
      src={imageUrl ?? ''}
      on:error={() => (failedUrl = imageUrl)}
    />
  {:else}
    {initials}
  {/if}
</span>

<style>
  .avatar-badge {
    display: inline-grid;
    place-items: center;
    overflow: hidden;
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

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>