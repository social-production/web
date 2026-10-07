<script lang="ts">
  import brandIcon from '$lib/assets/brand/app-icon-no-background-full-white.png';

  export let size = 18;
</script>

<span
  class="platform-mark"
  style={`--mark-size:${size}px;--mark-url:url('${brandIcon}')`}
  aria-hidden="true"
></span>

<style>
  .platform-mark {
    display: inline-block;
    width: var(--mark-size);
    height: var(--mark-size);
    flex: 0 0 auto;
    background: currentColor;
    mask: var(--mark-url) center / contain no-repeat;
    -webkit-mask: var(--mark-url) center / contain no-repeat;
  }
</style>
