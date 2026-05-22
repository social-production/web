<section class="page">
  <section class="hero-card">
    <h1>About</h1>
    <p>
      Social Production is a coordination platform, a social network who's purpose is to help in the facilitation of collective activity. From birthday parties to protests, software creation, and eventually real world major construction.
    </p>
  </section>

  <section class="hero-card">
    <h2 class="roadmap-title">Roadmap</h2>
  </section>

  <div class="stack">
    <section class="phase-card current-phase">
      <div class="phase-head">
        <div class="phase-label current-label">Phase 1 · Current</div>
        <h3>Web prototype</h3>
        <span aria-hidden="true" class="phase-head-spacer"></span>
      </div>
      <ul>
        <li>Build a conventional backend, PWA frontend.</li>
        <li>No asset holding, facilitation only.</li>
        <li>Invite-only test for functionality and security.</li>
        <li>Open to public use.</li>
        <li>If it proves useful and productive, move to Phase 2.</li>
      </ul>
    </section>

    <section class="phase-card">
      <div class="phase-head">
        <div class="phase-label">Phase 2</div>
        <h3>Legal entity and funding</h3>
        <span aria-hidden="true" class="phase-head-spacer"></span>
      </div>
      <p>Non-profit foundation formed.</p>
      <p>Once the foundation is formed, community and funding activate within Social Production.</p>
      <p>Asset holding comes online. Physical asset network becomes operational.</p>
    </section>

    <section class="phase-card">
      <div class="phase-head">
        <div class="phase-label">Phase 3</div>
        <h3>P2P backend</h3>
        <span aria-hidden="true" class="phase-head-spacer"></span>
      </div>
      <p>Holochain or p2panda. Research and development can continue while in Phase 1.</p>
      <p>Gradual migration from the conventional backend.</p>
    </section>

    <section class="phase-card">
      <div class="phase-head">
        <div class="phase-label">Phase 4</div>
        <h3>Full model</h3>
        <span aria-hidden="true" class="phase-head-spacer"></span>
      </div>
      <p>Shutdown-resistant infrastructure live.</p>
      <p>Non-market coordination at scale.</p>
    </section>
  </div>
</section>

<style>
  .page,
  .stack {
    display: grid;
    gap: 12px;
  }

  .hero-card,
  .phase-card {
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .phase-card.current-phase {
    border-color: var(--brand);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 35%, transparent);
    background: color-mix(in srgb, var(--brand-soft) 22%, var(--panel));
  }

  h1 {
    font-size: 22px;
    letter-spacing: -0.02em;
    color: var(--brand-strong);
  }

  h2,
  h3 {
    margin-top: 4px;
    font-size: 16px;
    color: var(--text-main);
  }

  .roadmap-title {
    text-align: center;
  }

  .phase-head {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
  }

  .phase-head h3 {
    margin: 0;
    text-align: center;
  }

  .phase-head-spacer {
    justify-self: end;
  }

  .phase-label {
    display: inline-flex;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
    justify-self: start;
  }

  .phase-label.current-label {
    border: 1px solid var(--brand);
  }

  p,
  li {
    margin-top: 8px;
    color: var(--text-soft);
    line-height: 1.45;
  }

  ul {
    margin: 8px 0 0;
    padding-left: 18px;
  }
</style>
