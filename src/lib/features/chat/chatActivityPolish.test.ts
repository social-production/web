import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createOptimisticComment, pruneOptimisticComments } from '$lib/utils/discussionState';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('activity and chat presentation', () => {
  it('uses month arrows and a green add-activity control', () => {
    const calendar = source('src/lib/components/cards/project-detail/ProjectActivityCalendarCard.svelte');
    expect(calendar).toContain('aria-label="Previous month"');
    expect(calendar).toContain('aria-label="Next month"');
    expect(calendar).toContain('shiftVisibleMonth(-1)');
    expect(calendar).toContain('shiftVisibleMonth(1)');
    expect(calendar).toContain('standout');
  });

  it('keeps history cards neutral and marks status with a left stripe', () => {
    const history = source(
      'src/lib/features/projects/detail/components/ActivityHistorySection.svelte'
    );
    expect(history).toContain('--history-stripe: #22c55e');
    expect(history).toContain('--history-stripe: var(--status-yellow)');
    expect(history).toContain('--history-stripe: var(--danger)');
    expect(history).toContain('box-shadow: inset 4px 0 0 var(--history-stripe)');
    expect(history).toContain('background: var(--panel-strong)');
  });

  it('gives activity details a full-screen sheet on small screens', () => {
    const sheet = source('src/lib/components/shared/OverlaySheet.svelte');
    const card = source('src/lib/components/cards/project-detail/CollapsibleActivityCard.svelte');
    expect(sheet).toContain('export let activity = false');
    expect(sheet).toContain('height: 100dvh');
    expect(card).toContain('<OverlaySheet activity');
  });

  it('places help-request location under the title and docks role actions', () => {
    const header = source('src/lib/features/help-requests/detail/HelpRequestOverviewHeader.svelte');
    const roles = source('src/lib/features/help-requests/detail/HelpRequestRolesSection.svelte');
    expect(header).toContain('class="live-fact">{locationLabel}');
    expect(header).not.toContain('>Location<');
    expect(header).not.toContain('signed up');
    expect(roles).toContain('DetailActionDock');
    expect(roles).toContain('Sign up');
    expect(roles).toContain('docked');
  });

  it('compacts the composer and colors chat usernames separately', () => {
    const chat = source('src/lib/components/chat/LiveChatPanel.svelte');
    expect(chat).toContain('color: var(--brand-strong)');
    expect(chat).toContain('width="14"');
    expect(chat).toContain('border: 0');
    expect(chat).toContain('focus-visible');
  });

  it('keeps a file bubble and inline footer when a message also has photos', () => {
    const chat = source('src/lib/components/chat/LiveChatPanel.svelte');
    expect(chat).toContain('class="file-row"');
    expect(chat).toContain('class="message-file-bubble"');
    expect(chat).toContain('class="message-footer"');
    expect(chat).toContain('.message-copy.photo-stack .message-file-bubble');
  });

  it('docks personal and collective service actions', () => {
    const personal = source(
      'src/lib/features/projects/detail/lifecycle/individual-service/phases/IndividualServicePhaseOne.svelte'
    );
    const collective = source(
      'src/lib/features/projects/detail/lifecycle/collective-service/phases/CollectiveServicePhaseFive.svelte'
    );
    expect(personal).toContain('<PhaseWorkToolbar>');
    expect(personal).toContain('label="Add availability"');
    expect(personal).toContain('label="Request service"');
    expect(personal).toContain('label="Request settings"');
    expect(collective).toContain('<PhaseWorkToolbar>');
    expect(collective).toContain('label="Create activity"');
    expect(collective).toContain('participationAction="request-service"');
    expect(collective).toContain('participationAction="request-settings"');
  });

  it('fits region filters on one toolbar row', () => {
    const feed = source('src/lib/features/public-feed/PublicFeed.svelte');
    expect(feed).not.toContain('controls-row-region');
    expect(feed).toContain('placeSearchExpanded');
    expect(feed).toContain('compact');
  });
});

describe('linked comment attachments', () => {
  it('keeps an optimistic photo until the server comment with the same file arrives', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'notes.txt', { type: 'text/plain' });
    const optimistic = createOptimisticComment('ada', 'notes', file);
    const pending = pruneOptimisticComments(
      [
        {
          id: 'server-1',
          authorUsername: 'ada',
          body: 'notes',
          createdAt: new Date().toISOString(),
          voteCount: 0,
          activeVote: 0,
          attachments: [
            {
              id: 'server-file',
              kind: 'file',
              filename: 'other.txt',
              contentType: 'text/plain',
              byteSize: 3,
              url: '/governance/attachments/server-file'
            }
          ],
          replies: []
        }
      ],
      [optimistic]
    );

    expect(pending).toHaveLength(1);
    expect(optimistic.attachments?.[0].filename).toBe('notes.txt');
  });
});
