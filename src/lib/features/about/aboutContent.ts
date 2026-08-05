export type AboutTabId = 'why' | 'produce' | 'costs' | 'governance' | 'join';

export type AboutTab = {
  id: AboutTabId;
  label: string;
};

export const ABOUT_TABS: AboutTab[] = [
  { id: 'why', label: 'Why' },
  { id: 'produce', label: 'Strategy' },
  { id: 'costs', label: 'Costs & Ownership' },
  { id: 'governance', label: 'Governance' },
  { id: 'join', label: 'Join' }
];

export type QuorumExample = {
  title: string;
  audience: string;
  n: number;
  required: number;
  percent: string;
  note: string;
};

export type ModerationExample = {
  title: string;
  audience: string;
  n: number;
  reason: 'spam' | 'serious-harm';
  deleteQuorum: number;
  hideQuorum?: number;
  yesShare: string;
  note: string;
};

export type ReadingLink = {
  label: string;
  href: string;
  blurb: string;
};

/** Condensed About explainer copy derived from Why Social Production.md. */
export const aboutWhy = {
  lead: 'Social Production exists to organise useful activity outside markets, wages, and private profit.',
  framing: [
    {
      title: 'Use-value',
      body: 'A thing’s use-value is its concrete usefulness: food when you are hungry, a hammer that drives nails, software that helps people coordinate. It satisfies a want or need directly.'
    },
    {
      title: 'Exchange-value',
      body: 'Exchange-value is not a physical property of the thing. It is a social relation in which value appears only through exchange. Price is a symbol of that real abstraction — value mediated by the market rather than by need.'
    }
  ],
  points: [
    'Under capitalism, production is organised mainly for exchange, not because something is needed.',
    'We already organise outside exchange every day: meals, mutual aid, open-source software, protests, community work.',
    'Corporate social networks enclose that coordination and turn it into ads, data extraction, and attention markets.',
    'Social Production is the reverse enclosure: tools for collective coordination, owned and governed by the people using them.',
    'No ads. No data sales. No production for exchange. The only reason to organise here is because something needs doing.'
  ],
  reading: [
    {
      label: 'Mode of production',
      href: 'https://en.wikipedia.org/wiki/Mode_of_production',
      blurb: 'How a society organises production, ownership, and the relations through which people make and share things.'
    },
    {
      label: 'Value-form theory',
      href: 'https://en.wikipedia.org/wiki/Value-form',
      blurb: 'Why value under capitalism is a social form expressed in exchange, not a natural property of useful things.'
    },
    {
      label: 'Communization',
      href: 'https://en.wikipedia.org/wiki/Communization',
      blurb: 'Currents that emphasise abolishing exchange and building communist relations rather than managing capitalism under new owners.'
    }
  ] as ReadingLink[]
};

export const aboutProduce = {
  lead: 'The strategy is to build new relations of production first — not to wait for political power, and not to seize factories only to reproduce the same market logic under new managers.',
  steps: [
    {
      title: 'Coordinate for use',
      body: 'Start with facilitation: projects, events, help requests, discussion, and shared decision-making oriented to need.'
    },
    {
      title: 'Prove the relations',
      body: 'Show that collective activity can run for use rather than sale before trying to hold large means of production.'
    },
    {
      title: 'Grow the material base',
      body: 'As participation grows, the network can fund and steward tools, land, and infrastructure under community control.'
    }
  ],
  note: 'Historically, “seize the means first” often reproduced exchange under new owners. Social Production takes the opposite path: new non-market relations first, then a growing material base.'
};

export const aboutCosts = {
  lead: 'Servers cost money. That does not mean the network has to become a product, an equity play, or a market.',
  cards: [
    {
      title: 'Phase 1',
      body: 'Hosting is covered by people who believe in the use-value of the network. There is no promised return except the network itself.'
    },
    {
      title: 'Phase 2',
      body: 'A community-controlled non-profit can hold donated funds for specific means of production. Transparent purchases, elected and recallable stewardship, no discretionary slush fund.'
    },
    {
      title: 'Phase 3',
      body: 'Move toward peer-to-peer infrastructure so users collectively host the network and reduce reliance on centralised commercial hosting.'
    }
  ]
};

export const aboutGovernanceSummary = {
  lead: 'Nobody owns Social Production. Users govern it collectively. Decisions pass with 66% approval of votes cast, once a derived quorum is met.',
  rules: [
    'Approval is always 66% of votes cast. That never changes.',
    'Quorum is derived from weekly active users in the relevant audience. It is not “every active user must vote.”',
    'Ordinary projects and events use their own weekly active members for quorum.',
    'Platform-tagged projects and events use platform weekly actives, because they affect everyone. If platform is tagged alongside other channels or communities, platform still sets the quorum context.',
    'On platform-tagged items, any signed-in user can cast signals and governance votes — membership is not required.',
    'Meeting a threshold unlocks a transition vote. It does not auto-advance anything.',
    'Moderation uses the same audience-derived approach: required votes cast + yes share, not unanimous turnout.'
  ]
};

export const quorumFormulaSteps = [
  'Start from audience size N: weekly unique users with at least one meaningful action in the last 7 days, in the relevant scope.',
  'Choose a margin of error that tightens as N grows: roughly 10% → 7% for small groups, 7% → 5% into the mid hundreds, then down toward about 2% at very large scale.',
  'Use the Cochran sample-size formula to estimate how many votes you need for that confidence level, then adjust for finite population size.',
  'For tiny groups, also apply a small-group ceiling of ceil(0.75 × N). The final quorum is the minimum of that ceiling and the Cochran result. Rounding can still push a tiny group slightly above 75% — for example N = 10 → 8 votes (80%).',
  'A decision passes only when total votes cast ≥ quorum and yes / total ≥ 66%.'
];

export const projectVoteExamples: QuorumExample[] = [
  {
    title: 'Small project',
    audience: 'Project weekly actives',
    n: 10,
    required: 8,
    percent: '80%',
    note: 'Tiny groups need a high share of N. The 75% ceiling is a bound on the formula; after rounding, N = 10 needs 8 votes cast.'
  },
  {
    title: 'Growing project',
    audience: 'Project weekly actives',
    n: 50,
    required: 37,
    percent: '74%',
    note: 'Not every member has to vote. The sample is sized to represent the active membership.'
  },
  {
    title: 'Large project',
    audience: 'Project weekly actives',
    n: 500,
    required: 218,
    percent: '44%',
    note: 'As N grows, required votes grow much more slowly than raw membership.'
  }
];

export const platformVoteExamples: QuorumExample[] = [
  {
    title: 'Early platform',
    audience: 'Platform weekly actives',
    n: 100,
    required: 67,
    percent: '67%',
    note: 'Platform-tagged items affect the whole network, so quorum is sized from platform weekly actives — even if other channels or communities are also tagged.'
  },
  {
    title: 'Mid-scale platform',
    audience: 'Platform weekly actives',
    n: 1_000,
    required: 301,
    percent: '30%',
    note: 'About 30% of weekly actives. Still far from “everyone must vote.” Any signed-in user can cast the vote.'
  },
  {
    title: 'Large platform',
    audience: 'Platform weekly actives',
    n: 10_000,
    required: 619,
    percent: '6.2%',
    note: 'Larger audiences get a tighter margin of error, but a much smaller percentage of N can still form a valid quorum.'
  }
];

export const moderationAudienceSteps = [
  'Public posts use platform weekly actives as N (or follower count for follower-only posts).',
  'Threads, help requests, projects, and events use a hybrid audience: the larger of weekly-active members (or platform weekly actives for public thread/help surfaces), distinct commenters, and distinct content voters — with a small public floor so one person cannot set N alone.',
  'Comments inherit the parent surface’s audience.',
  'Private messages use conversation participant count. Only a true 1:1 DM can use a 1-vote delete path.',
  'The reported author is excluded from N. Quorum is then derived from that N; quorum is not equal to N.'
];

export const moderationExamples: ModerationExample[] = [
  {
    title: 'Spam on a small public surface',
    audience: 'Hybrid weekly-active audience for that content',
    n: 10,
    reason: 'spam',
    deleteQuorum: 8,
    yesShare: '66%+',
    note: 'Spam removal needs the delete quorum in votes cast, plus at least 66% yes among those votes. Age and popularity can raise the yes share above 66%.'
  },
  {
    title: 'Spam on a larger surface',
    audience: 'Hybrid weekly-active audience for that content',
    n: 40,
    reason: 'spam',
    deleteQuorum: 30,
    yesShare: '66%+',
    note: 'The bar is derived from audience N. It is not equal to N, and it is not a one-person dogpile.'
  },
  {
    title: 'Serious harm hide threshold',
    audience: 'Hybrid weekly-active audience for that content',
    n: 40,
    reason: 'serious-harm',
    deleteQuorum: 20,
    hideQuorum: 10,
    yesShare: '66%+',
    note: 'Serious harm can blur/hide sooner with a lower hide quorum, then remove later with a higher delete quorum. Both still require a yes share of at least 66%.'
  },
  {
    title: 'Serious harm at platform scale',
    audience: 'Hybrid weekly-active audience for that content',
    n: 1_000,
    reason: 'serious-harm',
    deleteQuorum: 199,
    hideQuorum: 100,
    yesShare: '66%+',
    note: 'Serious harm lowers quorum relative to spam, but never drops the yes-share floor below 66%. Older or highly engaged content can require a higher yes share.'
  }
];

export const aboutBoard = {
  lead: 'Platform moderators / board members execute community decisions. They do not rule the platform.',
  points: [
    'They stay in place only while they keep 66% approval and meet the platform quorum derived from weekly actives.',
    'Any signed-in user can cast or change a standing yes/no vote on a board member at any time.',
    'If approval or quorum falls below threshold, they can be removed automatically.',
    'Their job is to execute software merges and community-directed purchases, not invent policy on their own.'
  ]
};

export const aboutJoin = {
  lead: 'Social Production is a prototype, an experiment, and a call to action. Use it, shape it, and help build production for use.',
  recap: [
    'Capitalism is not only private property. It is production for exchange.',
    'The strategy is to build non-market relations of production first.',
    'Phase 1 builds the facilitation tools and governance mechanics.',
    'Later phases add community-controlled assets and decentralised infrastructure.',
    'Votes and moderation both use derived quorums from weekly actives, not unanimous turnout.'
  ],
  links: [
    { label: 'Discord', href: 'https://discord.gg/VvbJ3hhEPb' },
    { label: 'Reddit', href: 'https://www.reddit.com/r/SocialProduction/' }
  ]
};
