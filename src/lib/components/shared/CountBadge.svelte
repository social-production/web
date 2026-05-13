<script lang="ts">
  export let count: number | string;
</script>

<span class="count-badge">{count}</span>

<style>
  .count-badge {
    min-width: 18px;
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    background: var(--brand-badge);
    color: var(--brand-strong);
    text-align: center;
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.25;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
</style>