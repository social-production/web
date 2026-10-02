# Sybil resistance

A person can make more than one account. This platform does not ask for real-world ID, so it cannot promise that every account is a different person. The defense is to make extra accounts expensive to create, expensive to make count, and eventually expensive to make look trusted.

These rules are ordinary domain rules (age, work done, one account one vote, a penalty when content is removed). They do not depend on a central server, so they can move with a later Holochain backend. Network addresses are an operations tool only. They are not part of the vote.

## Three layers

1. **Cost to create an account.** Cloudflare Turnstile on signup, plus the existing request rate limits. This stops cheap bot farms. It does not stop a patient person.
2. **Cost for an account to matter.** A new account can join, chat, post, and take an activity role immediately. It cannot cast a governance vote, count toward quorum, or volunteer as a platform moderator until it has waited and done a few real contributions. If moderation removes or hides that account's content, the wait starts again from a later time. This is built now, and it stays off until the switches below are raised above zero.
3. **Cost to look trustworthy.** One account vouches for another, or marks another as a bot. The ratio of those weights decides who can vote, who can vouch, and how freely someone can post. Channels and communities are only discovery routes. They are not trust membranes. This stays off until `GOVERNANCE_TRUST_RATIO_ENABLED=true`.

## What a new account can still do

Until the warm-up is finished the person can:

- Join projects, events, and communities.
- Message and chat.
- Post, comment, and create other content. Those contributions are what unlock voting.
- Sign up for a role inside an activity. That is participation, and a role signup does not by itself count as the activity that unlocks voting.
- React to content and vote on moderation reports, including flagging spam.

Until the warm-up is finished the person cannot:

- Cast a governance vote, whether the project or event is platform-tagged or only requires membership.
- Be counted in the weekly-active population `N` that sets how many votes a decision needs.
- Volunteer as a platform moderator (a board candidate).

Chat is how they can argue for a direction before their vote counts.

## What counts as meaningful activity

The app already stores notable actions. Only some of them count toward the warm-up, because a sock-puppet farm can click "join" all day.

Counted by default:

- `create-comment`
- `create-post`
- `create-thread`
- `create-help-request`
- `create-project`
- `create-event`
- `submit-project-plan`
- `submit-event-plan`
- `create-platform-feedback`

Not counted by default, because they are one click or would let votes unlock more votes:

- `join-project`, `join-event`, `join-scope`
- `follow-user`
- `signal-demand`
- `volunteer-board`
- `advance-project-phase`
- `cast-vote`

Change the counted list with `GOVERNANCE_MEANINGFUL_ACTION_TYPES` (comma-separated). Leave it unset to use the list above.

## Removal penalty

When a report resolves to `removed` or `hidden` for the first time, the author's warm-up start moves forward. The new start is the later of their signup time and the removal time plus `GOVERNANCE_REMOVAL_PENALTY_HOURS`. They then still need `GOVERNANCE_MIN_ACCOUNT_AGE_HOURS` after that start. A second vote on the same already-hidden item does not add another penalty.

`content-removed` never counts as a positive contribution.

## Quorum

`N` for governance votes is the weekly-active population. With the warm-up on, that population includes only accounts that would themselves be allowed to vote. Extra new accounts cannot inflate `N` or satisfy a quorum by themselves. Board standing uses the same population.

## Switches

Set these on the backend and restart. `0` means the check is off, which is the prototype default.

| Variable | Meaning | Suggested public value |
|----------|---------|------------------------|
| `GOVERNANCE_MIN_ACCOUNT_AGE_HOURS` | How long to wait | `24` |
| `GOVERNANCE_MIN_MEANINGFUL_ACTIONS` | How many counted contributions | `3` |
| `GOVERNANCE_REMOVAL_PENALTY_HOURS` | How far a removal pushes the wait start | `168` |
| `GOVERNANCE_MEANINGFUL_ACTION_TYPES` | Which actions count | leave unset |

Both the age and the action count must be met. Raising only one of them still turns the warm-up on.

## Honest limit

Without real-ID, a determined person can still warm up several accounts by hand. The warm-up makes that slow and visible. It does not make it impossible. The growth-stage answer is the trust graph below, not a harder captcha.

## Trust graph

Stances are account to account. One pair has one stance: vouch, bot, or clear. No self-stance, no cap, no time lock, and no penalty for vouching each other. `scope_confidence_votes` is not used.

`real_r` is vouch weight divided by vouch weight plus bot weight. No incoming stances means `real_r` is 0. The profile shows **real_r only**. It is display-only.

`effective_r` is what the rules use. For an ordinary account it matches the ratio that counts. For a bootstrap account it is `max(gate ratio, floor)` while the floor is above 0. Stances, votes, quorum, vouching, bot marks, and the activity bands all follow `effective_r`.

Each counting account has a vouch budget and a bot budget equal to its `effective_r`, split evenly across the accounts it vouches for or marks. A vouch for 100 accounts delivers 1/100 of that budget to each. The recipient can still show `real_r` of 1 when nobody has marked them. The vote cost is the license below, not the ratio alone.

Bot weight changes that gate ratio only after `GOVERNANCE_MIN_BOT_MARKS` independent marks (default 3). Accusers who were vouched only by others inside the same accuser pile count as one mark, and that pile can deliver at most one bot budget between them.

### Bootstrap

Bootstrap accounts are the first `GOVERNANCE_BOOTSTRAP_MARKERS` accounts to finish Layer 2 (default 10). They are not a named list and they are not the first signups. Order is the moment each account first cleared the warm-up. If both warm-up thresholds are 0, every account is already established, so bootstrap is the first accounts created.

If a bot finishes Layer 2 before your humans do, wipe the database and redeploy. That is the operational answer. There is no code lock for it.

The floor is `max(0, 1 - mature_count / GOVERNANCE_BOOTSTRAP_TARGET)`. `mature_count` is non-bootstrap accounts whose `real_r` is at least 0.66. Target default is 20. Examples: 0 mature accounts, floor 1; 10 mature, floor 0.5; 20 mature, floor 0. Once `mature_count` reaches the target, the floor stays 0. There is no second phase. Bootstrap accounts are ordinary from then on.

Bootstrap stances keep counting at that floor until it hits 0, including at 0.5. Cutting them off at 0.66 would stop the fade around 7 mature accounts. Earned trust above the floor is kept, because the formula is `max(real gate ratio, floor)`.

While the floor is above `real_r`, a bootstrap account stays at the floor. Marks that drag `real_r` to 0.4 while the floor is 0.8 leave `effective_r` at 0.8, so they stay trusted. That is intentional: a minority cannot drag a founder down before the network matures. The protection fades with the floor. The profile shows a bootstrap badge in that gap and does not show `effective_r` as the number.

Bootstrap accounts can vouch for each other before they themselves have 5 licensing vouches. Otherwise the first accounts can never start. They can also keep placing vouches while the floor is still above 0, even after it falls under 0.66. A cleared vouch must not leave the network with nobody able to vouch. The weight of those vouches is still the floor. They cannot mark bots until they have those 5. When the floor hits 0 they follow the same vouch rule as everyone else.

### Who can do what

While `GOVERNANCE_TRUST_RATIO_ENABLED` is false, votes, posts, and joins stay as they are. The graph can still be filled in.

When the switch is on:

- No incoming stances: the account can still join, post, comment, and take activity roles at the normal rate. It cannot vote, count in quorum, vouch, or mark.
- Licensed, and `effective_r` at least 0.66: can vote and count in quorum, and can vouch. Can mark a bot only with the license as well. Layer 2 is still required to vote. Licensed means at least 5 incoming vouches from accounts that already count (bootstrap counts while the floor is above 0; everyone else needs `effective_r` at least 0.66) and each of those vouchers is already licensed or is a bootstrap account. The 5 is a count of vouchers, not a weight.
- `0.30 <= effective_r < 0.66`: can post, comment, and join, with a tighter rate limit. Cannot vote or mark. Cannot vouch, unless the account is still on a bootstrap floor above 0.
- `0.10 <= effective_r < 0.30`: the same bans, with a much tighter rate limit.
- `effective_r < 0.10` because bot weight pulled it there: inert. Cannot post, comment, or join. The zero-stance case is not inert.

Silence under 0.10 is an accepted property. A licensed majority can silence a smaller group. Names are public, the silencing is visible, and new accounts are free.

Activity roles stay open. Moderator volunteering is separate: when the ratio switch is on, it also needs vouch weight of at least 0.66 (the weight itself, not the ratio) plus Layer 2. The board still chooses moderators. The weight is a minimum bar. It is not the selection method. When the switch is off, that bar is not added.

### Switches

Set these on the backend. `web-backend/.env.local` overrides `.env`. Restart the API after changes. The frontend env does not carry them.

| Variable | Default | Meaning |
|----------|---------|---------|
| `GOVERNANCE_TRUST_RATIO_ENABLED` | `false` | Turn vote, quorum, and activity bands on |
| `GOVERNANCE_MIN_BOT_MARKS` | `3` | Independent marks before bot weight changes the gate ratio |
| `GOVERNANCE_MARK_LICENSE_VOUCHES` | `5` | Licensing vouches |
| `GOVERNANCE_VOTE_THRESHOLD` | `0.66` | Vote, vouch, and moderator weight bar |
| `GOVERNANCE_LIMITED_THRESHOLD` | `0.30` | Start of the tighter activity band |
| `GOVERNANCE_INERT_THRESHOLD` | `0.10` | Below this, bot-pulled accounts are paused |
| `GOVERNANCE_BOOTSTRAP_MARKERS` | `10` | First Layer 2 finishers |
| `GOVERNANCE_BOOTSTRAP_TARGET` | `20` | Mature accounts that bring the floor to 0 |

### What this still does not stop

Five already-licensed people can vouch a spare account in. The cost is five trusted vouchers per voter, plus the warm-up. New accounts shed old bot marks. The warm-up slows that, and opening another account is free.

A closed group that only vouches inside itself still shows a high ratio and about one full vouch weight each (`(n-1) * (1/(n-1)) = 1`). Dilution does not shrink that weight. They cannot vote until an already-licensed outsider, or the bootstrap chain, supplies the 5.

### Holochain

A stance is a record signed by the source agent and linked to the target. `effective_r` is a pure function of those records plus which accounts finished Layer 2 first. See `web-holochain/notes/VOUCH_MEMBRANE.md`. No conductor or DNA is built yet.

## Not built yet

- **Optional proof of personhood.** BrightID, Gitcoin Passport, or Idena as an opt-in signal behind the backend adapter, swappable when the server goes away.
- **Cluster spotting.** A coarse hashed network signal on signup, reviewed by the moderation board. Centralized only, never an input to the vote math.
