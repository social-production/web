<script lang="ts">
  import {
    ABOUT_TABS,
    aboutBoard,
    aboutCosts,
    aboutGovernanceSummary,
    aboutJoin,
    aboutProduce,
    aboutWhy,
    moderationAudienceSteps,
    moderationExamples,
    platformVoteExamples,
    projectVoteExamples,
    quorumFormulaSteps,
    type AboutTabId
  } from './aboutContent';

  let activeTab: AboutTabId = 'why';
  let tablistEl: HTMLDivElement | null = null;

  function selectTab(id: AboutTabId) {
    activeTab = id;
  }

  function focusTabAt(index: number) {
    const buttons = tablistEl?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!buttons?.length) return;
    const next = ((index % buttons.length) + buttons.length) % buttons.length;
    const button = buttons[next];
    const id = ABOUT_TABS[next]?.id;
    if (id) activeTab = id;
    button?.focus();
  }

  function onTabKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusTabAt(index + 1);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusTabAt(index - 1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusTabAt(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusTabAt(ABOUT_TABS.length - 1);
    }
  }

  function panelId(id: AboutTabId) {
    return `about-panel-${id}`;
  }

  function tabId(id: AboutTabId) {
    return `about-tab-${id}`;
  }

  function formatCount(n: number) {
    return n.toLocaleString('en-US');
  }
</script>

<section class="explainer" aria-label="How Social Production works">
  <div
    bind:this={tablistEl}
    class="tab-row"
    role="tablist"
    aria-label="About topics"
  >
    {#each ABOUT_TABS as tab, index}
      <button
        id={tabId(tab.id)}
        class:active-tab={activeTab === tab.id}
        class="tab-button"
        role="tab"
        type="button"
        aria-selected={activeTab === tab.id}
        aria-controls={panelId(tab.id)}
        tabindex={activeTab === tab.id ? 0 : -1}
        on:click={() => selectTab(tab.id)}
        on:keydown={(event) => onTabKeydown(event, index)}
      >
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </div>

  <div
    id={panelId(activeTab)}
    class="panel"
    role="tabpanel"
    aria-labelledby={tabId(activeTab)}
  >
    {#if activeTab === 'why'}
      <p class="lead">{aboutWhy.lead}</p>
      <div class="card-grid two">
        {#each aboutWhy.framing as card}
          <article class="mini-card">
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </article>
        {/each}
      </div>
      <ul class="point-list">
        {#each aboutWhy.points as point}
          <li>{point}</li>
        {/each}
      </ul>
      <section class="reading-block" aria-label="Further reading">
        <h3>Further reading</h3>
        <ul class="reading-list">
          {#each aboutWhy.reading as link}
            <li>
              <a href={link.href} rel="noreferrer" target="_blank">{link.label}</a>
              <p>{link.blurb}</p>
            </li>
          {/each}
        </ul>
      </section>
    {:else if activeTab === 'produce'}
      <p class="lead">{aboutProduce.lead}</p>
      <div class="card-grid three">
        {#each aboutProduce.steps as step, i}
          <article class="mini-card">
            <div class="step-index">Step {i + 1}</div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        {/each}
      </div>
      <p class="note">{aboutProduce.note}</p>
    {:else if activeTab === 'costs'}
      <p class="lead">{aboutCosts.lead}</p>
      <div class="card-grid three">
        {#each aboutCosts.cards as card}
          <article class="mini-card">
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </article>
        {/each}
      </div>
    {:else if activeTab === 'governance'}
      <p class="lead">{aboutGovernanceSummary.lead}</p>
      <div class="rules-block">
        <h3>Core rules</h3>
        <ul class="point-list">
          {#each aboutGovernanceSummary.rules as rule}
            <li>{rule}</li>
          {/each}
        </ul>
      </div>

      <details class="expander">
        <summary>How quorum works</summary>
        <div class="expander-body">
          <ol class="formula-steps">
            {#each quorumFormulaSteps as step}
              <li>{step}</li>
            {/each}
          </ol>
          <div class="math-card" aria-label="Quorum formula summary">
            <p><strong>Audience N</strong> = weekly unique active users in scope</p>
            <p><strong>Margin of error</strong> tightens as N grows (about 10% → 2%)</p>
            <p><strong>Quorum</strong> = min(ceil(0.75 × N), Cochran sample size for that margin)</p>
            <p><strong>Pass</strong> when votes cast ≥ quorum and yes / total ≥ 66%</p>
          </div>
        </div>
      </details>

      <details class="expander">
        <summary>Worked vote examples</summary>
        <div class="expander-body">
          <h4>Project votes</h4>
          <div class="example-grid">
            {#each projectVoteExamples as example}
              <article class="example-card">
                <h5>{example.title}</h5>
                <p class="meta">{example.audience}</p>
                <p class="stat">
                  N = {formatCount(example.n)} → quorum <strong>{formatCount(example.required)}</strong>
                  <span class="pct">({example.percent})</span>
                </p>
                <p>{example.note}</p>
              </article>
            {/each}
          </div>

          <h4>Platform votes</h4>
          <p class="note">
            Platform-tagged projects and events affect everyone, so quorum is sized from platform weekly actives.
            That override still applies when other channels or communities are also tagged.
          </p>
          <div class="example-grid">
            {#each platformVoteExamples as example}
              <article class="example-card">
                <h5>{example.title}</h5>
                <p class="meta">{example.audience}</p>
                <p class="stat">
                  N = {formatCount(example.n)} → quorum <strong>{formatCount(example.required)}</strong>
                  <span class="pct">({example.percent})</span>
                </p>
                <p>{example.note}</p>
              </article>
            {/each}
          </div>
        </div>
      </details>

      <details class="expander">
        <summary>Moderation thresholds</summary>
        <div class="expander-body">
          <p class="note">
            Moderation also uses audience-derived quorums and a 66%+ yes share among votes cast.
            Serious harm can hide sooner, then remove with a higher bar. Spam uses the full delete quorum.
            Older or highly engaged content can raise the required yes share above 66%.
          </p>
          <h4>Where moderation N comes from</h4>
          <ol class="formula-steps">
            {#each moderationAudienceSteps as step}
              <li>{step}</li>
            {/each}
          </ol>
          <div class="example-grid">
            {#each moderationExamples as example}
              <article class="example-card">
                <h5>{example.title}</h5>
                <p class="meta">{example.audience}</p>
                <p class="stat">
                  N = {formatCount(example.n)}
                  {#if example.reason === 'spam'}
                    → delete quorum <strong>{formatCount(example.deleteQuorum)}</strong>
                  {:else}
                    → hide <strong>{formatCount(example.hideQuorum ?? 0)}</strong>, delete
                    <strong>{formatCount(example.deleteQuorum)}</strong>
                  {/if}
                </p>
                <p class="meta">Yes share floor: {example.yesShare}</p>
                <p>{example.note}</p>
              </article>
            {/each}
          </div>
        </div>
      </details>

      <details class="expander">
        <summary>Board / moderator accountability</summary>
        <div class="expander-body">
          <p class="note">{aboutBoard.lead}</p>
          <ul class="point-list">
            {#each aboutBoard.points as point}
              <li>{point}</li>
            {/each}
          </ul>
        </div>
      </details>
    {:else}
      <p class="lead">{aboutJoin.lead}</p>
      <ul class="point-list">
        {#each aboutJoin.recap as point}
          <li>{point}</li>
        {/each}
      </ul>
      <section class="community-card">
        <h3>Community</h3>
        <ul class="community-links">
          {#each aboutJoin.links as link}
            <li>
              <a href={link.href} rel="noreferrer" target="_blank">{link.label}</a>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
</section>

<style>
  .explainer {
    display: grid;
    gap: 14px;
    margin-top: 4px;
  }

  .tab-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    width: 100%;
    padding: 4px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .tab-button {
    min-width: 0;
    width: 100%;
    padding: 11px 8px;
    border: 1px solid transparent;
    border-radius: calc(var(--radius-sm) - 1px);
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.25;
    text-align: center;
    cursor: pointer;
  }

  .tab-label {
    display: block;
    overflow-wrap: anywhere;
  }

  .tab-button.active-tab {
    border-color: color-mix(in srgb, var(--brand-strong) 62%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 56%, var(--panel));
    color: var(--brand-strong);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 18%, transparent);
  }

  .panel {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .lead {
    margin: 0;
    max-width: 72ch;
    color: var(--text-main);
    font-size: 16px;
    line-height: 1.6;
  }

  .note,
  .point-list li,
  .formula-steps li,
  .mini-card p,
  .example-card p,
  .math-card p,
  .reading-list p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
    font-size: 14px;
  }

  .card-grid {
    display: grid;
    gap: 10px;
  }

  .card-grid.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card-grid.three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .mini-card,
  .example-card,
  .rules-block,
  .math-card,
  .community-card,
  .reading-block,
  .expander {
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .mini-card h3,
  .rules-block h3,
  .community-card h3,
  .reading-block h3,
  .expander-body h4,
  .example-card h5 {
    margin: 0 0 8px;
    color: var(--text-main);
    font-size: 15px;
    letter-spacing: -0.01em;
  }

  .example-card h5 {
    font-size: 14px;
  }

  .step-index {
    display: inline-flex;
    margin-bottom: 8px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
  }

  .point-list,
  .formula-steps,
  .community-links,
  .reading-list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 10px;
  }

  .reading-list {
    list-style: none;
    padding-left: 0;
  }

  .reading-list a,
  .community-links a {
    color: var(--brand-strong);
    font-weight: 700;
    text-decoration: none;
  }

  .reading-list a:hover,
  .community-links a:hover {
    text-decoration: underline;
  }

  .community-links {
    list-style: none;
    padding-left: 0;
  }

  .expander {
    padding: 0;
    overflow: hidden;
  }

  summary {
    cursor: pointer;
    list-style: none;
    padding: 13px 14px;
    color: var(--brand-strong);
    font-size: 14px;
    font-weight: 700;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .expander-body {
    display: grid;
    gap: 12px;
    padding: 0 14px 14px;
    border-top: 1px solid var(--panel-border);
    padding-top: 12px;
  }

  .example-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .meta {
    font-size: 12px !important;
    margin-bottom: 6px !important;
  }

  .stat {
    margin-bottom: 8px !important;
    color: var(--text-main) !important;
    font-size: 14px !important;
  }

  .pct {
    color: var(--text-soft);
    font-weight: 600;
  }

  .math-card {
    display: grid;
    gap: 8px;
  }

  @media (max-width: 900px) {
    .tab-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .tab-button {
      min-height: 44px;
      font-size: 12px;
      padding: 10px 6px;
    }

    .card-grid.three,
    .example-grid,
    .card-grid.two {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .tab-row {
      grid-template-columns: 1fr;
    }

    .lead {
      font-size: 15px;
    }
  }
</style>
