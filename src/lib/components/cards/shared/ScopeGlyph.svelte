<script lang="ts">
  import SurfaceIcon from '$lib/components/cards/shared/SurfaceIcon.svelte';
  import type { SurfaceIconId } from '$lib/utils/surfaceType';

  /** A scope's uploaded picture at icon size, or its standard icon when it has none. */
  export let icon: SurfaceIconId;
  export let imageUrl: string | null | undefined = null;
  export let size: 'sm' | 'md' = 'sm';
</script>

{#if imageUrl}
  <img class="scope-glyph" class:md={size === 'md'} src={imageUrl} alt="" loading="lazy" />
{:else}
  <SurfaceIcon {icon} {size} />
{/if}

<style>
  .scope-glyph {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    object-fit: cover;
  }

  .scope-glyph.md {
    width: 18px;
    height: 18px;
  }
</style>
