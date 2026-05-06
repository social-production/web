<script lang="ts">
  export let title: string;
  export let body: string;
  export let meta: string;
</script>

<article class="preview-tile">
  <h3>{title}</h3>
  <p>{body}</p>
  <span>{meta}</span>
</article>

<style>
  .preview-tile {
    display: grid;
    gap: 6px;
    padding: 16px;
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
    border: 1px solid var(--panel-border);
  }

  h3 {
    font-size: 14px;
    font-weight: 700;
  }

  p,
  span {
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  span {
    font-size: 11.5px;
    font-weight: 700;
  }
</style>