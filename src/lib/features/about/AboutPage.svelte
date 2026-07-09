<script lang="ts">
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
</script>

<section class="page">
  <PageHeader description="A coordination platform for collective activity." title="About" />

  <div class="intro-prose">
    <p>
      Social Production is a coordination platform for collective activity. It is a social network built to help people
      organize work, events, services, software, mutual aid, and eventually larger real-world production outside the
      logic of markets, wages, and private profit.
    </p>
    <p>
      The Phase 1 web prototype is focused on facilitation: helping people find each other, create projects and events,
      coordinate requests and activity, and test the social mechanics before legal, funding, asset-holding, and
      peer-to-peer infrastructure come online.
    </p>
  </div>

  <h2 class="roadmap-title">Roadmap</h2>

  <div class="stack">
    <section class="phase-card current-phase">
      <div class="phase-head">
        <div class="phase-label current-label">Phase 1 · Current</div>
        <h3>Web Prototype</h3>
        <span aria-hidden="true" class="phase-head-spacer"></span>
      </div>
      <ul>
        <li>Conventional FastAPI backend and SvelteKit PWA frontend.</li>
        <li>Facilitation only, with no asset holding.</li>
        <li>Testing for usability, security, and governance behavior.</li>
        <li>Open to public use as the prototype becomes stable.</li>
      </ul>
    </section>

    <section class="phase-card">
      <div class="phase-head">
        <div class="phase-label">Phase 2</div>
        <h3>Legal Entity and Funding</h3>
        <span aria-hidden="true" class="phase-head-spacer"></span>
      </div>
      <ul>
        <li>Non-profit foundation formed.</li>
        <li>Community funding and stewardship activated inside Social Production.</li>
        <li>Asset holding and physical asset coordination come online.</li>
      </ul>
    </section>

    <section class="phase-card">
      <div class="phase-head">
        <div class="phase-label">Phase 3</div>
        <h3>Peer-to-Peer Backend</h3>
        <span aria-hidden="true" class="phase-head-spacer"></span>
      </div>
      <ul>
        <li>Research and development toward Holochain, p2panda, or similar infrastructure.</li>
        <li>Gradual migration away from the conventional backend.</li>
      </ul>
    </section>

    <section class="phase-card">
      <div class="phase-head">
        <div class="phase-label">Phase 4</div>
        <h3>Full Model</h3>
        <span aria-hidden="true" class="phase-head-spacer"></span>
      </div>
      <ul>
        <li>Shutdown-resistant infrastructure.</li>
        <li>Non-market coordination at scale.</li>
      </ul>
    </section>
  </div>

  <section class="hero-card community-card">
    <h2>Community</h2>
    <ul class="community-links">
      <li>
        <a href="https://discord.gg/VvbJ3hhEPb" rel="noreferrer" target="_blank">Discord</a>
      </li>
      <li>
        <a href="https://www.reddit.com/r/SocialProduction/" rel="noreferrer" target="_blank">Reddit</a>
      </li>
    </ul>
  </section>
</section>

<style>
  .page,
  .stack {
    display: grid;
    gap: 12px;
  }

  .intro-prose {
    max-width: 65ch;
    display: grid;
    gap: 12px;
  }

  .intro-prose p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
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

  h2,
  h3 {
    margin-top: 4px;
    font-size: 16px;
    color: var(--text-main);
  }

  .roadmap-title {
    margin: 0;
    font-size: 18px;
    letter-spacing: -0.01em;
    text-align: left;
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

  li {
    margin-top: 8px;
    color: var(--text-soft);
    line-height: 1.45;
  }

  ul {
    margin: 8px 0 0;
    padding-left: 18px;
  }

  .community-links {
    list-style: none;
    padding-left: 0;
  }

  .community-links a {
    color: var(--brand-strong);
    font-weight: 700;
    text-decoration: none;
  }

  .community-links a:hover {
    text-decoration: underline;
  }
</style>
