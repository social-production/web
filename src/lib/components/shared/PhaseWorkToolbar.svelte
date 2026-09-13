<div class="phase-nav-row">
  <div id="phase-nav-start" class="phase-nav-side"></div>
  <div class="phase-nav-center">
    <slot />
  </div>
  <div id="phase-nav-end" class="phase-nav-side end"></div>
</div>

<style>
  .phase-nav-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .phase-nav-side,
  .phase-nav-center {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .phase-nav-center {
    justify-content: center;
  }

  .phase-nav-side.end {
    justify-content: flex-end;
  }
</style>
