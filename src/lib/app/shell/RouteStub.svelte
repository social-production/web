<script lang="ts">
  export let title: string;
  export let body: string;
</script>

<section class="stub-page">
  <div class="stub-card">
    <h1>{title}</h1>
    <p>{body}</p>
    <div class="divider"></div>
  </div>
</section>

<style>
  .stub-page {
    display: grid;
    gap: 1rem;
  }

  .stub-card {
    padding: 1.5rem;
    border-radius: var(--radius-sm);
    background: var(--panel);
    border: 1px solid var(--panel-border);
    box-shadow: var(--shadow);
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 20px;
    color: var(--brand-strong);
  }

  p {
    margin: 0;
    max-width: 60ch;
    color: var(--text-soft);
    line-height: 1.45;
  }

  .divider {
    height: 1px;
    margin-top: 12px;
    background: var(--panel-border);
  }
</style>