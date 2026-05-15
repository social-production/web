# Moderation Rules

This file explains the current moderation behavior in the mock web app and points to the code that owns each rule.

## Launch scope

- Report reasons: `spam` and `serious-harm`.
- Non-destructive top-level reporting: posts, threads, projects, and events can be reported and voted on, but they are not auto-removed in v1.
- Destructive/direct moderation scope: direct messages, shared chat messages, and discussion comments.
- Excluded for now: channels and communities are not user-removable.

## Current outcomes by surface

- Direct messages: reporting deletes the exact message immediately.
- Group chats and linked project or event chats: reports stay attached to the message. Serious-harm reports hide the message body while the case is active. Approved shared-chat reports hide the message body instead of deleting the record, so people can reveal and re-hide it.
- Discussion comments: `serious-harm` hides the body behind the reveal control while the case is active. Approved `spam` reports remove the comment.
- Top-level posts, threads, projects, and events: reports create visible governance state only. They do not remove the subject yet.

## Report dismissal

- Hidden serious-harm cases remain votable after the first hide.
- If a report can no longer reach its threshold, it is automatically dismissed and disappears.
- When a serious-harm report is dismissed, the message or comment stops being hidden.
- A dismissed case can be reported again later as a new report.

## Voting and thresholds

- The reporter auto-casts a `yes` vote when they create a report, if they are part of the eligible electorate.
- `serious-harm` uses a simple `50% rounded up` threshold of eligible voters.
- `spam` now scales by both audience size and target stability.

### Spam scaling rule

The current mock rule starts from a 50% threshold and raises the required percentage as the target becomes harder to disturb:

- Age boost:
  - less than 1 day old: `+0%`
  - 1 to 7 days: `+10%`
  - 7 to 30 days: `+20%`
  - 30 to 180 days: `+30%`
  - older than 180 days: `+40%`
- Engagement boost:
  - score under 2: `+0%`
  - score 2 to 7: `+5%`
  - score 8 to 19: `+10%`
  - score 20 to 49: `+15%`
  - score 50 or more: `+20%`

`engagement score` currently means:

- posts, threads, projects, events: `abs(voteCount) + commentCount * 2`
- comments: `abs(voteCount) + replyCount * 2`
- shared chat messages: `0` for now, so only age and electorate size affect them

The result is capped at 95% of the eligible electorate, then rounded up to a whole-person vote requirement.

This is intentionally simple. It gives new, low-engagement content a lower removal bar while pushing old or highly engaged content toward near-unanimous removal.

## Electorates

- Direct messages: no vote flow, immediate removal.
- Group direct messages: current conversation participants other than the reported sender.
- Linked project and event chats: current project or event members other than the reported sender.
- Thread and post comments: signed-in viewers who can see the subject, excluding the reported author.
- Top-level posts, threads, projects, and events: the same electorate logic as their surface-specific subject rules, but the result is non-destructive in v1.

## Owning code

- Core moderation state and thresholds: [web/src/lib/services/adapters/dev/data.ts](../src/lib/services/adapters/dev/data.ts)
- Shared three-dot menu and active-report popup: [web/src/lib/components/shared/ReportMenu.svelte](../src/lib/components/shared/ReportMenu.svelte)
- Shared report composer modal: [web/src/lib/components/shared/ReportComposerModal.svelte](../src/lib/components/shared/ReportComposerModal.svelte)
- Top-level subject report entry: [web/src/lib/components/shared/ReportControl.svelte](../src/lib/components/shared/ReportControl.svelte)
- Discussion comment rendering and hide or reveal behavior: [web/src/lib/components/discussion/DiscussionComment.svelte](../src/lib/components/discussion/DiscussionComment.svelte)
- Shared chat message rendering and hide or reveal behavior: [web/src/lib/components/chat/LiveChatPanel.svelte](../src/lib/components/chat/LiveChatPanel.svelte)
- Shared report types: [web/src/lib/types/detail.ts](../src/lib/types/detail.ts)

## Not implemented yet

- User-removable channels and communities.
- Destructive top-level removal for posts, threads, projects, and events.
- More sophisticated spam weighting for separate like and dislike totals, trust signals, or richer age and engagement curves.