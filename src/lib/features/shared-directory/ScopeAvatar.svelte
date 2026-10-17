<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';

  /** A channel/community picture, falling back to the standard icon. */
  export let imageUrl: string | null | undefined = null;
  export let kind: 'channel' | 'community' | 'platform' = 'channel';
  export let size = 40;
  export let label = '';
</script>

<span
  class="scope-avatar"
  style={`--avatar-size: ${size}px`}
  aria-hidden={label ? undefined : 'true'}
>
  {#if imageUrl}
    <img src={imageUrl} alt={label} />
  {:else}
    <SurfaceIcon
      icon={kind}
      size={size >= 40 ? 'md' : 'sm'}
    />
  {/if}
</span>

<style>
  .scope-avatar {
    display: inline-grid;
    flex: 0 0 auto;
    place-items: center;
    width: var(--avatar-size);
    height: var(--avatar-size);
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
