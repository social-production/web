<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    ABOUT_SECTIONS,
    aboutBoard,
    aboutCosts,
    aboutGovernanceSummary,
    aboutJoin,
    aboutProduce,
    aboutRoadmap,
    aboutWhy,
    moderationAudienceSteps,
    moderationExamples,
    platformVoteExamples,
    projectVoteExamples,
    quorumFormulaSteps,
    type AboutTabId
  } from './aboutContent';

  const sectionIds = new Set(ABOUT_SECTIONS.map((section) => section.id));

  function readSection(value: string | null): AboutTabId {
    return value && sectionIds.has(value as AboutTabId) ? (value as AboutTabId) : 'purpose';
  }

  $: active = readSection($page.url.searchParams.get('section'));

  function selectSection(id: AboutTabId) {
    const nextUrl = new URL($page.url);
    if (id === 'purpose') {
      nextUrl.searchParams.delete('section');
    } else {
      nextUrl.searchParams.set('section', id);
    }
    void goto(`${nextUrl.pathname}${nextUrl.search}`, {
      replaceState: true,
      noScroll: false,
      keepFocus: true
    });
  }

  function formatCount(n: number) {
    return n.toLocaleString('en-US');
  }
</script>

<section class="page">
  <header class="hero">
    <p class="eyebrow">About</p>
    <h1>Collective coordination of activity and production without exchange.</h1>
  </header>

  <div class="reader">
    <div class="tab-row" role="tablist" aria-label="About">
      {#each ABOUT_SECTIONS as section (section.id)}
        <button
          aria-selected={active === section.id}
          class:active-tab={active === section.id}
          class="detail-surface-tab tab"
          role="tab"
          type="button"
          on:click={() => selectSection(section.id)}
        >
          <span class="tab-label-full">{section.label}</span>
          <span class="tab-label-compact">
            {section.id === 'governance' ? 'Gov' : section.id === 'moderation' ? 'Mod' : section.label}
          </span>
        </button>
      {/each}
    </div>

    <article class="essay">
      {#if active === 'purpose'}
        <h2>Purpose</h2>
        <p>{aboutWhy.lead}</p>
        <p class="definition-intro">
          The key to understanding what Social Production is trying to do is understanding the difference
          between use-value and exchange-value.
        </p>
        {#each aboutWhy.framing as item (item.title)}
          <section class="definition">
            <p class="definition-label">Definition</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </section>
        {/each}
        {#each aboutWhy.points as point}
          <p>{point}</p>
        {/each}
        <h3>Further reading</h3>
        {#each aboutWhy.reading as link}
          <p>
            <a href={link.href} rel="noreferrer" target="_blank">{link.label}</a>
            {link.blurb}
          </p>
        {/each}
      {:else if active === 'strategy'}
        <h2>Strategy</h2>
        <p>{aboutProduce.lead}</p>
        {#each aboutProduce.steps as step, index (step.title)}
          <h3>{index + 1}. {step.title}</h3>
          <p>{step.body}</p>
        {/each}
        <p>{aboutProduce.note}</p>
      {:else if active === 'roadmap'}
        <h2>Roadmap</h2>
        <p>
          The prototype comes first. A legal home for funds comes next. Peer-to-peer infrastructure is later.
          The aim is coordination that is hard to capture or switch off.
        </p>
        {#each aboutRoadmap as phase (phase.title)}
          <div class="phase-heading">
            <span class:current={phase.current} class="phase-tag">{phase.label}</span>
            <h3>{phase.title}</h3>
          </div>
          {#each phase.points as point}
            <p>{point}</p>
          {/each}
        {/each}
      {:else if active === 'costs'}
        <h2>Costs and ownership</h2>
        <p>{aboutCosts.lead}</p>
        {#each aboutCosts.cards as card (card.title)}
          <div class="phase-heading">
            <span class:current={card.title === 'Phase 1'} class="phase-tag">{card.title}</span>
          </div>
          <p>{card.body}</p>
        {/each}
      {:else if active === 'governance'}
        <h2>Governance</h2>
        <p>{aboutGovernanceSummary.lead}</p>
        {#each aboutGovernanceSummary.rules as rule}
          <p>{rule}</p>
        {/each}
        <h3>How quorum is derived</h3>
        {#each quorumFormulaSteps as step, index}
          <p>{index + 1}. {step}</p>
        {/each}
        <h3>Project votes</h3>
        {#each projectVoteExamples as example}
          <p>
            <strong>{example.title}.</strong>
            {example.audience}. N = {formatCount(example.n)}, quorum {formatCount(example.required)} ({example.percent}).
            {example.note}
          </p>
        {/each}
        <h3>Platform votes</h3>
        <p>
          Platform-tagged projects and events affect everyone, so quorum is sized from platform weekly actives.
          That still applies when other channels or communities are also tagged.
        </p>
        {#each platformVoteExamples as example}
          <p>
            <strong>{example.title}.</strong>
            N = {formatCount(example.n)}, quorum {formatCount(example.required)} ({example.percent}).
            {example.note}
          </p>
        {/each}
        <h3>Board</h3>
        <p>{aboutBoard.lead}</p>
        {#each aboutBoard.points as point}
          <p>{point}</p>
        {/each}
      {:else if active === 'moderation'}
        <h2>Moderation</h2>
        <p>
          Moderation uses the same audience-derived quorum and a yes share of at least 66% among votes cast.
          Serious harm can blur and hide sooner, then remove at a higher bar. Spam uses the full delete quorum.
          Older or highly engaged content can raise the required yes share above 66%.
        </p>
        <h3>Where the audience comes from</h3>
        {#each moderationAudienceSteps as step}
          <p>{step}</p>
        {/each}
        {#each moderationExamples as example}
          <p>
            <strong>{example.title}.</strong>
            {example.audience}. N = {formatCount(example.n)}.
            {#if example.reason === 'spam'}
              Delete quorum {formatCount(example.deleteQuorum)}.
            {:else}
              Hide quorum {formatCount(example.hideQuorum ?? 0)}, delete quorum {formatCount(example.deleteQuorum)}.
            {/if}
            Yes share floor {example.yesShare}. {example.note}
          </p>
        {/each}
      {:else}
        <h2>Join</h2>
        <p>{aboutJoin.lead}</p>
        {#each aboutJoin.recap as point}
          <p>{point}</p>
        {/each}
        <h3>Community</h3>
        {#each aboutJoin.links as link}
          <p><a href={link.href} rel="noreferrer" target="_blank">{link.label}</a></p>
        {/each}
      {/if}

      <a class="discover" href="/">Get involved!</a>
    </article>
  </div>
</section>

<style>
  .page {
    display: grid;
    gap: 20px;
    box-sizing: border-box;
    width: min(100%, 96ch);
    max-width: 100%;
    margin: 0 auto;
    padding: 8px var(--page-gutter) 48px;
    overflow-x: clip;
  }

  .hero {
    display: grid;
    gap: 8px;
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  h1 {
    color: var(--text-main);
    font-size: clamp(32px, 5vw, 44px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.08;
  }

  .eyebrow {
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .reader {
    display: grid;
    gap: 0;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid var(--panel-border);
    border-left: 0;
    border-right: 0;
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .tab-row {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 2px;
    align-items: center;
    min-width: 0;
    padding: 10px 12px;
    overflow: hidden;
    border-bottom: 1px solid var(--panel-border);
    background: var(--panel-strong);
  }

  .tab {
    min-width: 0;
    min-height: 40px;
    padding: 0 2px;
    border-radius: calc(var(--radius-sm) - 2px);
    overflow: hidden;
    font-size: clamp(9px, 1.1vw, 14px);
    font-weight: 700;
    letter-spacing: -0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tab-label-compact {
    display: none;
  }

  @media (min-width: 761px) {
    .tab {
      overflow: visible;
      font-size: 13px;
      text-overflow: clip;
    }
  }

  .phase-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }

  .phase-heading h3 {
    margin-top: 0;
  }

  .phase-tag {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 0 9px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .phase-tag.current {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--page-bg);
  }

  .essay {
    display: grid;
    gap: 14px;
    padding: 28px 22px 22px;
  }

  h2 {
    color: var(--text-main);
    font-size: clamp(28px, 4vw, 36px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }

  h3 {
    margin-top: 8px;
    color: var(--text-main);
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.3;
  }

  p {
    max-width: 68ch;
    color: var(--text-main);
    font-size: 17px;
    font-weight: 500;
    line-height: 1.65;
  }

  .definition-intro {
    margin-top: 8px;
    color: var(--text-main);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.5;
  }

  .definition {
    display: grid;
    gap: 6px;
    margin-top: 4px;
    padding: 16px;
    border-left: 4px solid var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 58%, var(--panel));
  }

  .definition h3 {
    margin-top: 0;
    font-size: 22px;
  }

  .definition-label {
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  a {
    color: var(--brand-strong);
    font-weight: 700;
  }

  .discover {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    min-height: 48px;
    margin-top: 12px;
    padding: 0 18px;
    border-radius: var(--radius-sm);
    background: var(--brand);
    color: var(--page-bg);
    font-size: 16px;
    font-weight: 800;
    text-decoration: none;
  }

  @media (max-width: 760px) {
    .page {
      width: 100%;
      gap: 12px;
      padding: 12px 0 32px;
    }

    .hero {
      padding: 0 16px;
    }

    h1 {
      font-size: 32px;
    }

    .reader {
      border-right: 0;
      border-left: 0;
      border-radius: 0;
    }

    .tab-row {
      position: sticky;
      top: var(--topbar-height, 56px);
      z-index: var(--z-detail-tabs);
      padding: 8px 12px;
    }

    .tab-label-full {
      display: none;
    }

    .tab-label-compact {
      display: inline;
    }

    .essay {
      padding: 22px 16px 20px;
    }

    p {
      font-size: 16px;
    }

    .definition-intro {
      font-size: 18px;
    }

    .discover {
      width: 100%;
    }
  }
</style>
