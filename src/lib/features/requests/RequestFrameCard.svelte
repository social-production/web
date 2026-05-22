<script lang="ts">
  export let title = '';
  export let body = '';
  export let statusLabel = 'Frame only';
</script>

<article class="frame-card">
  <div class="frame-head">
    <strong>{title}</strong>
    <span class="status-pill">{statusLabel}</span>
  </div>
  <p>{body}</p>
</article>

<style>
  .frame-card {
    display: grid;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .frame-head {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  strong {
    color: var(--text-main);
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .status-pill {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent-warm) 14%, var(--panel));
    color: var(--accent-warm-strong);
    font-size: 11px;
    font-weight: 700;
  }
</style>