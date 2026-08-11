/**
 * Domain path contract tests — mock apiClient and assert domains hit expected routes.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls: Array<{ method: string; url: string; body?: unknown }> = [];

vi.mock('$lib/api/drivers/supabase/client', async () => {
  const actual = await vi.importActual<typeof import('$lib/api/drivers/supabase/client')>(
    '$lib/api/drivers/supabase/client'
  );
  const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    calls.push({ method, url: path, body });
    if (path.includes('/governance/comments')) return { items: [] } as T;
    if (path.includes('/governance/reports')) return { report: { id: 'r1', voteSummary: {} } } as T;
    if (path === '/users/me/follow-requests') return { items: [] } as T;
    if (path === '/notifications') {
      return { viewer: null, items: [], unreadCount: 0 } as T;
    }
    if (path.startsWith('/feeds/') || path.startsWith('/map/')) {
      return { items: [], hasMore: false } as T;
    }
    if (path === '/search') return { results: [], items: [], query: '' } as T;
    if (path === '/messages/conversations') {
      return { viewer: null, conversations: [], linkedChats: [], suggestedContacts: [] } as T;
    }
    if (path.startsWith('/messages/contacts')) return { items: [] } as T;
    if (path === '/bootstrap' || path === '/bootstrap/summary') {
      return { viewer: null, unreadCounts: { notifications: 0, messages: 0 } } as T;
    }
    if (path === '/onboarding') {
      return {
        title: 'Sign in or create an account',
        intro: 'x',
        accountModes: [
          { value: 'signup', label: 'Sign up', description: 'Create a new account.' },
          { value: 'login', label: 'Log in', description: 'Use an existing account.' }
        ],
        starterChannels: [],
        starterCommunities: []
      } as T;
    }
    if (path.startsWith('/scopes/taggable')) return { items: [] } as T;
    if (path.startsWith('/locations')) return { items: [] } as T;
    return { ok: true, id: '1', slug: 's', followStatus: 'accepted' } as T;
  };
  return {
    ...actual,
    apiClient: {
      provider: 'supabase',
      get: <T>(path: string) => request<T>('GET', path),
      post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
      put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
      patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
      delete: <T>(path: string) => request<T>('DELETE', path)
    }
  };
});

function hasCall(method: string, urlPart: string) {
  return calls.some((c) => c.method === method && c.url.includes(urlPart));
}

describe('supabase domain gateway routes', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('covers content, votes, comments, reports', async () => {
    const content = await import('$lib/api/drivers/supabase/domains/content');
    await content.fetchCreateThread({ title: 't', body: 'b', channelTags: [], communityTags: [] });
    await content.fetchCreatePost({ body: 'p', audience: 'public' });
    await content.fetchThread('hello');
    await content.fetchPost('pid');
    await content.fetchSetVote({ id: 'tid', type: 'thread' }, 1);
    await content.fetchComments('thread', 'tid');
    await content.fetchAddComment({ id: 'tid', type: 'thread' }, 'hi');
    await content.fetchSubmitReport('tid', { id: 'tid', type: 'thread' }, 'spam', 'details');
    await content.fetchSetReportVote('rid', 'yes');
    expect(hasCall('POST', '/content/threads')).toBe(true);
    expect(hasCall('POST', '/governance/votes')).toBe(true);
    expect(hasCall('POST', '/governance/reports/rid/vote')).toBe(true);
  });

  it('covers follows and notifications', async () => {
    const users = await import('$lib/api/drivers/supabase/domains/users');
    const notifications = await import('$lib/api/drivers/supabase/domains/notifications');
    await users.fetchFollowUser('alice');
    await users.fetchUnfollowUser('alice');
    await users.fetchAcceptFollowRequest('bob');
    await users.fetchRejectFollowRequest('bob');
    await users.fetchFollowRequests();
    await notifications.fetchNotifications();
    await notifications.fetchMarkNotificationRead('n1');
    await notifications.fetchMarkAllNotificationsRead();
    expect(hasCall('POST', '/users/alice/follow')).toBe(true);
    expect(hasCall('DELETE', '/users/alice/follow')).toBe(true);
    expect(hasCall('POST', '/notifications/n1/read')).toBe(true);
    expect(hasCall('POST', '/notifications/read-all')).toBe(true);
  });

  it('covers feeds, search, bootstrap, messages, scopes', async () => {
    const feeds = await import('$lib/api/drivers/supabase/domains/feeds');
    const search = await import('$lib/api/drivers/supabase/domains/search');
    const bootstrap = await import('$lib/api/drivers/supabase/domains/bootstrap');
    const messages = await import('$lib/api/drivers/supabase/domains/messages');
    const scopes = await import('$lib/api/drivers/supabase/domains/scopes');
    await feeds.fetchPublicFeedPage({ limit: 5 });
    await feeds.fetchHomeFeedPage({ limit: 5 });
    await feeds.fetchPersonalFeedPage({ limit: 5 });
    await feeds.fetchRegionFeedPage({ lat: 1, lon: 2, radiusKm: 25 });
    await feeds.fetchScopeFeedPage({ kind: 'channel', slug: 'news' });
    await feeds.fetchUserFeedPage({ username: 'alice' });
    await feeds.fetchMapMarkers({ lat: 1, lon: 2 });
    await search.fetchSearch('projects');
    await bootstrap.fetchBootstrap();
    await bootstrap.fetchBootstrapSummary();
    await messages.fetchMessages();
    await messages.fetchStartDirectMessage('alice', 'hi');
    await messages.fetchCreateGroupConversation({ title: 'g', memberUsernames: ['a'], body: 'hi' });
    await messages.fetchMarkConversationRead('c1');
    await scopes.fetchChannel('news');
    await scopes.fetchCommunity('local');
    await scopes.fetchPlatform();
    await scopes.fetchVolunteerForBoard();
    await scopes.fetchCastModeratorVote('u1', 'yes');
    await scopes.fetchCreateScopeInvite('community', 'local');
    await scopes.fetchToggleScopeMembership('platform', 'platform', false);
    expect(hasCall('GET', '/feeds/public')).toBe(true);
    expect(hasCall('GET', '/feeds/region')).toBe(true);
    expect(hasCall('GET', '/search')).toBe(true);
    expect(hasCall('GET', '/messages/conversations')).toBe(true);
    expect(hasCall('GET', '/scopes/platform')).toBe(true);
    expect(hasCall('POST', '/scopes/platform/volunteer')).toBe(true);
    const membershipCall = calls.find((c) => c.method === 'POST' && c.url.includes('/scopes/membership'));
    expect(membershipCall?.body).toEqual({
      kind: 'channel',
      slug: 'platform',
      viewerIsMember: false
    });
    const groupCall = calls.find((c) => c.method === 'POST' && c.url.includes('/messages/groups'));
    expect(groupCall?.body).toMatchObject({ memberUsernames: ['a'] });
  });

  it('covers projects, events, help requests, locations, feedback', async () => {
    const projects = await import('$lib/api/drivers/supabase/domains/projects');
    const events = await import('$lib/api/drivers/supabase/domains/events');
    const help = await import('$lib/api/drivers/supabase/domains/helpRequests');
    const locations = await import('$lib/api/drivers/supabase/domains/locations');
    const feedback = await import('$lib/api/drivers/supabase/domains/feedback');
    await projects.fetchCreateProject({ title: 'p', description: 'd', projectMode: 'productive' } as never);
    await projects.fetchProject('p1');
    await projects.fetchToggleProjectMembership('p1');
    await projects.fetchSetProjectSignal('p1', 'demand');
    await projects.fetchSetProjectPlanOverallVote('p1', 'phase-2', 'plan1', 'yes');
    await projects.fetchSetProjectPhaseChangeVote('p1', 'req1', 'yes');
    await projects.fetchAddProjectPullRequest('p1', { title: 'pr' } as never);
    await events.fetchCreateEvent({
      title: 'e',
      description: 'd',
      audience: 'public',
      governance: 'collaborative',
      channelTags: [],
      communityTags: [],
      invitedUsernames: []
    });
    await events.fetchEvent('e1');
    await events.fetchToggleEventMembership('e1');
    await events.fetchSetEventPlanOverallVote('e1', 'plan1', 'yes');
    await help.fetchCreateHelpRequest({ title: 'h', body: 'b' } as never);
    await help.fetchHelpRequest('h1');
    await help.fetchCommitHelpRequestRole('h1', 'r1');
    await locations.fetchLocationSearch('mel');
    await locations.fetchLocationReverse(-37.8, 144.9);
    await feedback.fetchSubmitFeedback({ category: 'bug', title: 't', description: 'x' });
    expect(hasCall('POST', '/projects')).toBe(true);
    expect(hasCall('POST', '/projects/p1/membership')).toBe(true);
    expect(hasCall('POST', '/projects/p1/plans/overall-vote')).toBe(true);
    expect(hasCall('POST', '/projects/p1/phase-change/vote')).toBe(true);
    expect(hasCall('POST', '/projects/p1/pull-requests')).toBe(true);
    expect(hasCall('POST', '/events')).toBe(true);
    expect(hasCall('POST', '/events/e1/plans/overall-vote')).toBe(true);
    expect(hasCall('POST', '/help-requests')).toBe(true);
    expect(hasCall('POST', '/help-requests/h1/roles/r1/commit')).toBe(true);
    expect(hasCall('GET', '/locations/search')).toBe(true);
    expect(hasCall('GET', '/locations/reverse')).toBe(true);
    expect(hasCall('POST', '/feedback')).toBe(true);
  });

  it('covers invites, board vote, notifications mark-one, messaging follow-ups', async () => {
    const scopes = await import('$lib/api/drivers/supabase/domains/scopes');
    const notifications = await import('$lib/api/drivers/supabase/domains/notifications');
    const messages = await import('$lib/api/drivers/supabase/domains/messages');
    const projects = await import('$lib/api/drivers/supabase/domains/projects');
    await scopes.fetchCreateScopeInvite('community', 'closed-one');
    await scopes.fetchRedeemScopeInvite('community', 'closed-one', 'code');
    await scopes.fetchCastModeratorVote('u1', 'yes');
    await notifications.fetchMarkNotificationRead('n1');
    await messages.fetchSendMessage('c1', 'hi again');
    await messages.fetchRenameGroupConversation('c1', 'renamed');
    await projects.fetchSetProjectActivityCommitment('p1', 'a1', 'Helper');
    expect(hasCall('POST', '/scopes/invites')).toBe(true);
    expect(hasCall('POST', '/scopes/invites/redeem')).toBe(true);
    expect(hasCall('POST', '/scopes/platform/moderator-vote')).toBe(true);
    expect(hasCall('POST', '/notifications/n1/read')).toBe(true);
    expect(hasCall('POST', '/messages/conversations/c1/messages')).toBe(true);
    expect(hasCall('POST', '/projects/p1/activities/commitment')).toBe(true);
  });
});
