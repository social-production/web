<section class="page">
  <section class="hero-card">
    <h1>Social Production - Development Roadmap</h1>
  </section>

  <div class="stack">
    <section class="phase-card current-phase">
      <div class="phase-label current-label">Phase 1 · Current</div>
      <h2>Web prototype</h2>
      <p>Current workstream: build and stabilize the frontend interaction model across public/personal feeds, project/event detail, inbox, and shell navigation.</p>
      <p>Immediate backend milestone: ship an adapter-backed FastAPI API surface so hydration no longer depends on local dev fixtures.</p>
      <p>Scope in this phase: auth/session, feed hydration, detail mutations, notifications/messages hydration, and route-level loading/error handling.</p>
      <p>Delivery target before Phase 2: reliable PWA baseline with adapter contract unchanged so backend can evolve independently of UI.</p>
    </section>

    <section class="phase-card">
      <div class="phase-label">Phase 2</div>
      <h2>Legal entity and funding</h2>
      <p>Non-profit foundation formed.</p>
      <p>Once the foundation is formed, community and funding activate within Social Production.</p>
      <p>Asset holding comes online. Physical asset network becomes operational.</p>
    </section>

    <section class="phase-card">
      <div class="phase-label">Phase 3</div>
      <h2>P2P backend</h2>
      <p>Holochain or p2panda. Research and development can continue while in Phase 1.</p>
      <p>Gradual migration from the conventional backend.</p>
    </section>

    <section class="phase-card">
      <div class="phase-label">Phase 4</div>
      <h2>Full model</h2>
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

  h2 {
    margin-top: 6px;
    font-size: 16px;
  }

  .phase-label {
    display: inline-flex;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .phase-label.current-label {
    border: 1px solid var(--brand);
  }

  p {
    margin-top: 8px;
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>