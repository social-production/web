# Moderation Rules

Audience-governed moderation for Social Production.
This document is the product source of truth for report reasons, electorates,
thresholds, and outcomes.

Detailed implementation design lives in
[../../planning/WEB/docs/MODERATION_REDESIGN.md](../../planning/WEB/docs/MODERATION_REDESIGN.md).

## Settled principles

- No platform moderators and no platform emergency override.
- No account bans or posting penalties in v1; moderation is content-only.
- The first eligible report immediately marks content **Under review**.
- Decisions use **quorum + yes-ratio**, not “X of Y eligible people must vote yes”.
- The minimum approval ratio is always **66%**. Age and popularity only raise it.
- Quorum size uses the existing governance `required_votes(N)` formula on a
  weekly-active hybrid audience.
- Serious harm is faster than spam by using a **lower hide/delete quorum**, not
  by dropping below 66%.
- Top-level content stays listed while under review; serious-harm restriction
  blurs it with a warning before deletion.
- Comments and chat messages hide (with reveal/re-hide) under serious-harm
  restriction.
- Only true **1:1 DMs** may delete in a single yes vote.
- Raw views do **not** affect thresholds yet.
- Image posting stays disabled until attachment moderation exists end-to-end.

## Launch scope

### In scope
- Report reasons: `spam`, `serious-harm`
- Targets: comments, chat messages, posts, threads, events, projects, help requests

### Out of scope for v1
- Channel/community removal as first-class targets
- Account penalties / reputation-weighted voting
- Formal appeals
- Image/attachment uploads
- View-count-weighted popularity

## Report lifecycle

1. `open` — insert-only transitional state
2. `under_review` — first eligible yes has landed; status shows Under review
3. `hidden` — serious-harm restriction blur/hide while voting continues
4. `removed` — final approved removal
5. `dismissed` — remaining voters can no longer pass; temporary hides clear

### What quorum means

- Quorum is **not** the bar to enter Under review.
- Under review starts on the first eligible report.
- Quorum is the minimum number of **votes cast** before hide/delete can happen.
- Percentage is the minimum **yes ratio among votes cast**.

## Outcomes by surface

### Comments and chat messages
- First report → immediate `under_review`
- Serious harm: after hide quorum + hide yes-ratio → body hidden with reveal/re-hide
- Spam: stays visible but marked until delete threshold
- Final removal needs delete quorum + delete yes-ratio
- True 1:1 DMs (`message` with audience size 1 after excluding the sender) may
  remove in one confirming yes

### Posts, threads, events, projects, help requests
- First report → visible Under review
- Remain discoverable while under review
- Serious-harm restriction: stay listed, blur text/media with a warning
- Full removal only after delete quorum + delete yes-ratio
- No 1-vote delete shortcut on top-level surfaces

## Audience size (`N`) for quorum

`N` is the weekly-active hybrid audience for the surface:

| Target | `N` |
|---|---|
| Public post / thread / help request | Weekly-active visible audience, with engaged-participant floor |
| Follower-scoped post | Followers, with engaged-participant floor |
| Project / event | Weekly-active members, with engaged-participant floor |
| Comment | Inherits parent surface audience |
| Direct / group chat | Current conversation participants excluding reported sender |

One engaged user must not dictate outcomes on a surface whose real weekly-active
audience is much larger.

## Popularity score (weighting)

| Signal | Weight | Notes |
|---|---|---|
| Unique content voter (up or down) | `+1` | Distinct voters |
| Unique commenter / replier | `+2` | Stronger participation signal |
| Members / followers / visible audience | `0` in popularity | Used for `N` / eligible size |
| Raw / anonymous views | `0` for now | Too easy to inflate |

## Threshold families

### Base quorum
Reuse the governance required-votes formula:

`baseQuorum = required_votes(N)`

### Applied quorums
- `spamDeleteQuorum = baseQuorum`
- `seriousHarmDeleteQuorum = max(5, ceil(baseQuorum * 0.66))`
- `seriousHarmHideQuorum = max(3, ceil(baseQuorum * 0.33))`
- True 1:1 DM override: hide/delete quorum = `1`

### Yes-share family (never below 66%)
Age boost: `<1d +0`, `1–7d +10`, `7–30d +20`, `30–180d +30`, `>180d +35`  
Popularity boost: `<2 +0`, `2–7 +5`, `8–19 +10`, `20–49 +15`, `≥50 +20`

- Spam delete: `min(90%, 66% + age + popularity)`
- Serious-harm delete: `min(85%, 66% + floor((age + popularity) / 2))`
- Serious-harm hide: `min(80%, 66% + floor((age + popularity) / 4))`

### Pass conditions
Delete passes when:
1. `totalVotes >= deleteQuorum`
2. `yesCount / totalVotes >= deleteYesShare`

Serious-harm hide passes when:
1. `totalVotes >= hideQuorum`
2. `yesCount / totalVotes >= hideYesShare`

### Worked examples

**Fresh spam on a mid-size public surface**
- `N = 40`, `baseQuorum = required_votes(40)`
- Delete at that quorum · 66% yes
- First report only marks Under review

**Fresh serious-harm**
- Hide at `max(3, ceil(baseQuorum * 0.33))` · 66% yes
- Delete later at `max(5, ceil(baseQuorum * 0.66))` · 66%+ yes

**Older popular spam**
- Same governance-derived quorum base
- Yes-share rises toward 90%

**1:1 DM**
- Audience size 1
- Quorum 1 · 66% yes (one yes = 100%)
- May delete in one step

**Not enough votes yet**
- `13 yes / 6 no`, delete quorum 20, 66% needed → not enough votes cast

**Enough votes, not enough yes**
- `22 yes / 8 no`, delete quorum 20, 75% needed → fails ratio

## UI expectations

Report popup should stay short:

- status + reason
- reporter message
- `Hide at X votes · Y% yes` (serious harm only)
- `Delete at X votes · Y% yes`
- `Current: A yes · B no · C total`
- Yes / No vote controls

Do not show dense “eligible viewers / raw views” essays in the popup.
Longer rationale lives in this doc.

Opening an active report must show the reporter’s typed message before voting.
Feed/detail emblems should update immediately after report/vote without a manual
refresh.

## Abuse resistance (current barriers and limits)

Current barriers:
- Reported authors cannot vote on their own case
- Quorum is sized from weekly-active hybrid audience, not one engager
- Delete needs both quorum and ≥66% yes-ratio
- Age/popularity only raise the bar
- Serious harm can be contained earlier via blur/hide

Not claimed yet:
- Reputation-weighted voting
- Bot / sockpuppet detection
- View-count weighting

## Implementation status

- Backend: [`web-backend/app/services/moderation/`](../../web-backend/app/services/moderation/)
- Quorum formula source: [`web-backend/app/utils/votes.py`](../../web-backend/app/utils/votes.py) `required_votes`
- Shared UI: [`ReportControl.svelte`](../../web/src/lib/components/shared/ReportControl.svelte), [`ReportMenu.svelte`](../../web/src/lib/components/shared/ReportMenu.svelte)

## Owning code

- Redesign design doc: [../../planning/WEB/docs/MODERATION_REDESIGN.md](../../planning/WEB/docs/MODERATION_REDESIGN.md)
- Backend report endpoints: [`web-backend/app/routers/governance.py`](../../web-backend/app/routers/governance.py)
- Shared report UI: [`web/src/lib/components/shared/ReportControl.svelte`](../../web/src/lib/components/shared/ReportControl.svelte), [`ReportMenu.svelte`](../../web/src/lib/components/shared/ReportMenu.svelte), [`ReportComposerModal.svelte`](../../web/src/lib/components/shared/ReportComposerModal.svelte)
- Comment hide/reveal UI: [`web/src/lib/components/discussion/DiscussionComment.svelte`](../../web/src/lib/components/discussion/DiscussionComment.svelte)
- Chat hide/reveal UI: [`web/src/lib/components/chat/LiveChatPanel.svelte`](../../web/src/lib/components/chat/LiveChatPanel.svelte)
- Shared report types: [`web/src/lib/types/detail/shared.ts`](../../web/src/lib/types/detail/shared.ts)
