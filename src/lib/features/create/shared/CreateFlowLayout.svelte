<div class="flow-layout">
  <div class="primary-column">
    <slot name="primary" />
  </div>

  <div class="secondary-column">
    <slot name="secondary" />
  </div>
</div>

<style>
  .flow-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
    gap: 16px;
    align-items: start;
  }

  .primary-column,
  .secondary-column {
    display: grid;
    gap: 12px;
  }

  @media (max-width: 980px) {
    .flow-layout {
      grid-template-columns: 1fr;
    }
  }
</style>