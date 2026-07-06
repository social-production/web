<script lang="ts">
  import groupsIconSrc from '$lib/assets/icons/groups-icon.png';

  export let className = 'groups-icon';
</script>

<span
  aria-hidden="true"
  class={className}
  style:--groups-icon-mask={`url("${groupsIconSrc}")`}
></span>

<style>
  span {
    display: block;
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    background-color: currentColor;
    mask-image: var(--groups-icon-mask);
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: contain;
    -webkit-mask-image: var(--groups-icon-mask);
    -webkit-mask-position: center;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: contain;
  }

  :global(.panel-toggle-icon) {
    width: 20px;
    height: 20px;
  }

  :global(.create-menu-icon) {
    width: 20px;
    height: 20px;
    color: var(--brand-strong);
  }
</style>
