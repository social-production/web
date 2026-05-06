import { browser } from '$app/environment';
import {
  isPersonalServiceProject,
  projectFeedPhaseLabel,
  supportsProjectDemandSignals,
  supportsProjectPlanning
} from '$lib/features/projects/projectMode';
import type {
  BootstrapPayload,
  RightRailActivityItem,
  ScopeDirectoryItem,
  ViewerSummary
} from '$lib/types/bootstrap';
import type {
  OnboardingPageData,
  ProfilePageData,
  SettingsPageData,
  SettingsUpdateInput
} from '$lib/types/account';
import type {
  DetailComment,
  DetailMember,
  DetailUpdate,
  EventPageData,
  PostPageData,
  ProjectActivityPlanPhaseOption,
  ProjectActivityItem,
  ProjectActivityInput,
  ProjectApprovalVote,
  ProjectDistributionPlan,
  ProjectDistributionPlanInput,
  ProjectImportanceVoteValue,
  ProjectLifecycleData,
  ProjectLifecyclePhase,
  ProjectLifecyclePhaseId,
  ProjectLifecycleRevertEntry,
  ProjectPlanPhaseItem,
  ProjectPlanValueAssessment,
  ProjectPlanVoteSummary,
  ProjectPageData,
  ProjectProductionPlan,
  ProjectProductionPlanInput,
  ProjectRoleMember,
  ProjectServiceRequestItem,
  ProjectServiceRequestStatus,
  ProjectValueItem,
  ThreadPageData
} from '$lib/types/detail';
import type {
  MessageThread,
  MessagesPageData,
  NotificationItem,
  NotificationsPageData
} from '$lib/types/inbox';
import type {
  ProjectMode,
  PersonalFeedItem,
  PersonalPostItem,
  PublicEventItem,
  PublicFeedItem,
  PublicProjectItem,
  PublicThreadItem,
  TagRef,
  VoteDirection
} from '$lib/types/feed';
import type { SearchPageData, SearchResultItem } from '$lib/types/search';
import type {
  ScopeKind,
  ScopeMemberSummary,
  ScopeMembershipState,
  ScopePageData,
  ScopeStats
} from '$lib/types/scope';

const patchbayUser: ViewerSummary = {
  id: 'viewer-1',
  username: 'patchbay',
  bio: 'Repair rounds, heat planning, and neighborhood logistics.'
};

const users: ViewerSummary[] = [
  patchbayUser,
  {
    id: 'user-rowan',
    username: 'rowanloop',
    bio: 'Laundry fixes, walkthrough notes, and block-level scheduling.'
  },
  {
    id: 'user-tool',
    username: 'toolorbit',
    bio: 'Tool library intake, chargers, and volunteer night coverage.'
  },
  {
    id: 'user-mika',
    username: 'mika',
    bio: 'Release notes, accessibility checks, and public-facing coordination.'
  },
  {
    id: 'user-ember',
    username: 'quietember',
    bio: 'Neighborhood mapping, facilitation, and follow-up summaries.'
  }
];

const usersById = new Map(users.map((user) => [user.id, user]));
const usersByUsername = new Map(users.map((user) => [user.username, user]));

export const mockSessionFixture = {
  currentViewerId: 'viewer-1' as string | null
};

function userById(id: string | null): ViewerSummary | null {
  if (!id) {
    return null;
  }

  return usersById.get(id) ?? null;
}

function userByUsername(username: string): ViewerSummary | null {
  return usersByUsername.get(username.trim().toLowerCase()) ?? null;
}

function currentViewer() {
  return userById(mockSessionFixture.currentViewerId);
}

function activeViewer() {
  return currentViewer() ?? patchbayUser;
}

function followingIdsFor(userId: string) {
  return followsByUserId[userId] ?? [];
}

function followerIdsFor(userId: string) {
  return Object.entries(followsByUserId)
    .filter(([, followedIds]) => followedIds.includes(userId))
    .map(([id]) => id);
}

function viewerCanSeeFollowersPosts(profileUserId: string) {
  const viewer = currentViewer();

  return (
    viewerCanSeePersonalFeed(profileUserId) &&
    !!viewer &&
    (viewer.id === profileUserId || followingIdsFor(viewer.id).includes(profileUserId))
  );
}

function shouldHidePublicActivityFromPersonalFeeds(userId: string) {
  return settingsForUser(userId)?.hidePublicActivityFromPersonalFeeds ?? false;
}

const followsByUserId: Record<string, string[]> = {
  'viewer-1': ['user-rowan', 'user-tool', 'user-mika'],
  'user-rowan': ['viewer-1', 'user-mika'],
  'user-tool': ['viewer-1'],
  'user-mika': ['viewer-1', 'user-rowan'],
  'user-ember': ['viewer-1']
};

const housingBuild: TagRef = {
  slug: 'housing-build',
  label: 'Housing & Build',
  kind: 'channel'
};

const mutualAid: TagRef = {
  slug: 'mutual-aid',
  label: 'Mutual Aid',
  kind: 'channel'
};

const eastMarket: TagRef = {
  slug: 'east-market-makers',
  label: 'East Market Makers',
  kind: 'community'
};

const toolLibrary: TagRef = {
  slug: 'tool-library-crew',
  label: 'Tool Library Crew',
  kind: 'community'
};

const platform: TagRef = {
  slug: 'platform',
  label: 'Platform',
  kind: 'channel'
};

const platformDirectory: ScopeDirectoryItem = {
  slug: 'platform',
  label: 'Platform',
  href: '/platform'
};

const channelDirectory: ScopeDirectoryItem[] = [
  {
    slug: housingBuild.slug,
    label: housingBuild.label,
    href: `/channels/${housingBuild.slug}`
  },
  {
    slug: mutualAid.slug,
    label: mutualAid.label,
    href: `/channels/${mutualAid.slug}`
  }
];

const communityDirectory: ScopeDirectoryItem[] = [
  {
    slug: eastMarket.slug,
    label: eastMarket.label,
    href: `/communities/${eastMarket.slug}`
  },
  {
    slug: toolLibrary.slug,
    label: toolLibrary.label,
    href: `/communities/${toolLibrary.slug}`
  }
];

const settingsStorageKey = 'social-production.web.settings';

let settingsState: SettingsPageData | null = currentViewer()
  ? {
      profileUsername: activeViewer().username,
      profileBio: activeViewer().bio ?? '',
      appearanceThemeMode: 'dark',
      defaultFeed: 'public',
      hidePublicActivityFromPersonalFeeds: false,
      hidePersonalFeedFromNonFollowers: false,
      requireFollowApproval: false
    }
  : null;

function settingsForUser(userId: string) {
  const viewer = currentViewer();

  if (!settingsState || !viewer || viewer.id !== userId) {
    return null;
  }

  return settingsState;
}

function syncViewerProfileFromSettings() {
  const viewer = currentViewer();

  if (!viewer || !settingsState) {
    return;
  }

  viewer.bio = settingsState.profileBio.trim() ? settingsState.profileBio.trim() : undefined;
}

function persistSettingsState() {
  if (!browser) {
    return;
  }

  try {
    if (!settingsState) {
      window.localStorage.removeItem(settingsStorageKey);
      return;
    }

    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settingsState));
  } catch {
    return;
  }
}

function hydratePersistedSettingsState() {
  if (!browser || !settingsState) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(settingsStorageKey);

    if (!raw) {
      return false;
    }

    const persisted = JSON.parse(raw) as Partial<SettingsPageData>;
    settingsState = {
      ...settingsState,
      ...persisted,
      profileBio: typeof persisted.profileBio === 'string' ? persisted.profileBio : settingsState.profileBio
    };
    settingsState.requireFollowApproval = settingsState.hidePersonalFeedFromNonFollowers;
    syncViewerProfileFromSettings();

    return true;
  } catch {
    return false;
  }
}

function viewerCanSeePersonalFeed(profileUserId: string) {
  const profileSettings = settingsForUser(profileUserId);

  if (!profileSettings?.hidePersonalFeedFromNonFollowers) {
    return true;
  }

  const viewer = currentViewer();

  return !!viewer && (viewer.id === profileUserId || followingIdsFor(viewer.id).includes(profileUserId));
}

const publicFeedBase: PublicFeedItem[] = [
  {
    kind: 'project',
    id: 'project-heat-pump',
    slug: 'neighborhood-heat-pump-pilot',
    href: '/projects/neighborhood-heat-pump-pilot',
    createdAt: '2026-04-28T16:40:00Z',
    title: 'Neighborhood Heat Pump Pilot',
    authorUsername: 'patchbay',
    projectMode: 'productive',
    summary:
      'Research a first retrofit round and keep demand, labor interest, and vendor questions visible before planning locks.',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: 'Demand Signalling',
    locationLabel: 'East Market retrofit cluster',
    voteCount: 84,
    activeVote: 1,
    signalCount: 124,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T09:30:00Z'
  },
  {
    kind: 'thread',
    id: 'thread-shared-laundry',
    slug: 'shared-laundry-repair-round',
    href: '/threads/shared-laundry-repair-round',
    createdAt: '2026-04-29T13:20:00Z',
    title: 'Shared Laundry Repair Round',
    body:
      'Should the first repair round focus on three machines in one building, or spread parts and labor across the block?',
    authorUsername: 'rowanloop',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    voteCount: 34,
    activeVote: 0,
    commentCount: 0,
    lastActivityAt: '2026-04-30T07:20:00Z'
  },
  {
    kind: 'event',
    id: 'event-tool-audit',
    slug: 'tool-library-spring-swap-social',
    href: '/events/tool-library-spring-swap-social',
    createdAt: '2026-04-28T18:00:00Z',
    title: 'Tool Library Spring Swap Social',
    description:
      'An open evening for snacks, a tool swap table, repair stories, and summer volunteer signups.',
    isPrivate: false,
    scheduledAt: '2026-05-01T19:00:00Z',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    createdByUsername: 'toolorbit',
    timeLabel: 'Thu 7:00 PM to 9:00 PM',
    locationLabel: 'Tool Library Courtyard',
    voteCount: 12,
    activeVote: 1,
    commentCount: 0,
    goingCount: 0,
    lastActivityAt: '2026-04-29T20:15:00Z'
  },
  {
    kind: 'project',
    id: 'project-release-governance',
    slug: 'platform-release-governance-round',
    href: '/projects/platform-release-governance-round',
    createdAt: '2026-04-29T17:30:00Z',
    title: 'Platform Release Governance Round',
    authorUsername: 'quietember',
    projectMode: 'collective-service',
    summary:
      'Review the next public web release, moderation defaults, and accessibility blockers before shipping.',
    channelTags: [platform],
    communityTags: [],
    stage: 'Planning',
    locationLabel: 'Collective software and release coordination',
    voteCount: 28,
    activeVote: 0,
    signalCount: 28,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T10:10:00Z'
  },
  {
    kind: 'thread',
    id: 'thread-release-notes',
    slug: 'should-platform-publish-weekly-release-notes',
    href: '/threads/should-platform-publish-weekly-release-notes',
    createdAt: '2026-04-30T11:05:00Z',
    title: 'Should platform publish weekly release notes?',
    body:
      'A lightweight public note each week might make platform changes less opaque without turning updates into marketing copy.',
    authorUsername: 'mika',
    channelTags: [platform],
    communityTags: [],
    voteCount: 19,
    activeVote: -1,
    commentCount: 0,
    lastActivityAt: '2026-04-30T11:05:00Z'
  },
  {
    kind: 'event',
    id: 'event-retrofit-walk',
    slug: 'retrofit-night-walk',
    href: '/events/retrofit-night-walk',
    createdAt: '2026-04-29T19:10:00Z',
    title: 'Retrofit Night Walk',
    description:
      'Walk the first retrofit block, mark building quirks, and confirm which doors are ready for the pilot round.',
    isPrivate: true,
    scheduledAt: '2026-05-03T18:30:00Z',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    createdByUsername: 'mika',
    timeLabel: 'Sat 6:30 PM to 8:30 PM',
    locationLabel: 'East Market corner survey',
    voteCount: 9,
    activeVote: 0,
    commentCount: 0,
    goingCount: 0,
    lastActivityAt: '2026-04-30T08:40:00Z'
  },
  {
    kind: 'project',
    id: 'project-fridge-restock-route',
    slug: 'community-fridge-restock-route',
    href: '/projects/community-fridge-restock-route',
    createdAt: '2026-04-30T07:50:00Z',
    title: 'Community Fridge Restock Route',
    authorUsername: 'rowanloop',
    projectMode: 'collective-service',
    summary:
      'The route is past initial planning and is now deciding how neighborhood access and weekly restock distribution should work.',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: 'Planning',
    locationLabel: 'East Market fridge network',
    voteCount: 31,
    activeVote: 1,
    signalCount: 47,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T11:20:00Z'
  },
  {
    kind: 'project',
    id: 'project-repair-cafe-shift-grid',
    slug: 'repair-cafe-shift-grid',
    href: '/projects/repair-cafe-shift-grid',
    createdAt: '2026-04-29T14:40:00Z',
    title: 'Repair Cafe Shift Grid',
    authorUsername: 'toolorbit',
    projectMode: 'collective-service',
    summary:
      'The repair cafe has approved its working plan and is now scheduling roles, shifts, and room setup through contingent activities.',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: 'Activity',
    locationLabel: 'Tool Library workshop floor',
    voteCount: 26,
    activeVote: 1,
    signalCount: 36,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T13:05:00Z'
  },
  {
    kind: 'project',
    id: 'project-blade-sharpening-service',
    slug: 'tool-library-blade-sharpening-service',
    href: '/projects/tool-library-blade-sharpening-service',
    createdAt: '2026-04-27T16:10:00Z',
    title: 'Tool Library Blade Sharpening Service',
    authorUsername: 'toolorbit',
    projectMode: 'collective-service',
    summary:
      'The first sharpening pilot finished and converted into an ongoing service with recurring intake, sharpening, and pickup coordination.',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: 'Completed',
    locationLabel: 'Tool Library bench room',
    voteCount: 42,
    activeVote: 1,
    signalCount: 52,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T15:10:00Z'
  },
  {
    kind: 'project',
    id: 'project-insulation-kit-round',
    slug: 'neighborhood-insulation-kit-round',
    href: '/projects/neighborhood-insulation-kit-round',
    createdAt: '2026-04-30T16:20:00Z',
    title: 'Neighborhood Insulation Kit Round',
    authorUsername: 'patchbay',
    projectMode: 'productive',
    summary:
      'Demand and values are complete. Members are now voting on the production plan for a first insulation-kit build run.',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: 'Planning',
    locationLabel: 'East Market community hall',
    voteCount: 33,
    activeVote: 1,
    signalCount: 61,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T16:20:00Z'
  },
  {
    kind: 'project',
    id: 'project-solar-battery-share',
    slug: 'community-solar-battery-share',
    href: '/projects/community-solar-battery-share',
    createdAt: '2026-04-30T16:45:00Z',
    title: 'Community Solar Battery Share',
    authorUsername: 'rowanloop',
    projectMode: 'productive',
    summary:
      'The production plan is set and the team is voting on fair distribution windows for battery access during outage season.',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: 'Planning',
    locationLabel: 'East Market resilience cluster',
    voteCount: 29,
    activeVote: 0,
    signalCount: 54,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T16:45:00Z'
  },
  {
    kind: 'project',
    id: 'project-air-sealing-build-day',
    slug: 'hallway-air-sealing-build-day',
    href: '/projects/hallway-air-sealing-build-day',
    createdAt: '2026-04-30T17:05:00Z',
    title: 'Hallway Air Sealing Build Day',
    authorUsername: 'toolorbit',
    projectMode: 'productive',
    summary:
      'Planning is approved and the project is now in role-based scheduling, only activating each work block when every role is filled.',
    channelTags: [housingBuild],
    communityTags: [toolLibrary],
    stage: 'Activity',
    locationLabel: 'Tool Library annex workshop',
    voteCount: 24,
    activeVote: 1,
    signalCount: 39,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T17:05:00Z'
  },
  {
    kind: 'project',
    id: 'project-weatherization-pilot-wrap',
    slug: 'block-weatherization-pilot-wrap',
    href: '/projects/block-weatherization-pilot-wrap',
    createdAt: '2026-04-30T17:30:00Z',
    title: 'Block Weatherization Pilot Wrap',
    authorUsername: 'mika',
    projectMode: 'productive',
    summary:
      'The weatherization pilot closed its active work and is now in completion review, with conversion notes logged for follow-on rounds.',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: 'Completed',
    locationLabel: 'East Market retrofit blocks',
    voteCount: 37,
    activeVote: 1,
    signalCount: 66,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T17:30:00Z'
  },
  {
    kind: 'project',
    id: 'project-ride-request-desk',
    slug: 'mutual-aid-ride-request-desk',
    href: '/projects/mutual-aid-ride-request-desk',
    createdAt: '2026-04-30T18:00:00Z',
    title: 'Mutual Aid Ride Request Desk',
    authorUsername: 'quietember',
    projectMode: 'collective-service',
    summary:
      'This collective service is in demand signalling and value ranking before opening plan votes for dispatch and rider access.',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: 'Demand Signalling',
    locationLabel: 'East Market neighborhood rides',
    voteCount: 22,
    activeVote: 0,
    signalCount: 41,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T18:00:00Z'
  },
  {
    kind: 'project',
    id: 'project-bike-light-tuneups',
    slug: 'patchbay-bike-light-tuneups',
    href: '/projects/patchbay-bike-light-tuneups',
    createdAt: '2026-04-30T18:25:00Z',
    title: 'Patchbay Bike Light Tuneups',
    authorUsername: 'patchbay',
    projectMode: 'personal-service',
    summary:
      'A personal service currently running with open request intake and direct scheduling for evening bike-light tuneups.',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: 'Activity',
    locationLabel: 'Tool Library side bench',
    voteCount: 18,
    activeVote: 1,
    signalCount: 27,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T18:25:00Z'
  },
  {
    kind: 'project',
    id: 'project-device-checks-closed',
    slug: 'rowan-after-school-device-checks',
    href: '/projects/rowan-after-school-device-checks',
    createdAt: '2026-04-30T18:50:00Z',
    title: 'Rowan After School Device Checks',
    authorUsername: 'rowanloop',
    projectMode: 'personal-service',
    summary:
      'This personal service wrapped and is marked complete; request history remains visible but no new scheduling is active.',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: 'Completed',
    locationLabel: 'East Market school commons',
    voteCount: 21,
    activeVote: 0,
    signalCount: 33,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T18:50:00Z'
  }
];

const socialPostsBase: PersonalPostItem[] = [
  {
    kind: 'post',
    id: 'post-spare-filters',
    href: '/posts/post-spare-filters',
    author: patchbayUser,
    audience: 'followers',
    voteTargetId: 'post-spare-filters',
    body:
      'I found six spare intake filters after cleanup. If anyone needs them for the pilot, I can bring them Saturday.',
    voteCount: 15,
    activeVote: 1,
    commentCount: 0,
    createdAt: '2026-04-30T08:05:00Z'
  },
  {
    kind: 'post',
    id: 'post-rowan-checklist',
    href: '/posts/post-rowan-checklist',
    author: userById('user-rowan') ?? patchbayUser,
    audience: 'followers',
    voteTargetId: 'post-rowan-checklist',
    body:
      'I cleaned up the laundry-room checklist so the first repair night has fewer duplicate steps.',
    voteCount: 11,
    activeVote: 0,
    commentCount: 0,
    createdAt: '2026-04-29T18:35:00Z'
  },
  {
    kind: 'post',
    id: 'post-mika-brief',
    href: '/posts/post-mika-brief',
    author: userById('user-mika') ?? patchbayUser,
    audience: 'followers',
    voteTargetId: 'post-mika-brief',
    body:
      'Drafting a shorter release brief so people can track changes without reading every thread.',
    voteCount: 8,
    activeVote: 0,
    commentCount: 0,
    createdAt: '2026-04-29T15:10:00Z'
  }
];

const publicCommentActivitySeeds = [
  {
    id: 'activity-comment-project-heat-pump',
    subjectId: 'project-heat-pump',
    commentId: 'comment-project-heat-pump-1'
  },
  {
    id: 'activity-comment-thread-shared-laundry',
    subjectId: 'thread-shared-laundry',
    commentId: 'comment-thread-shared-2'
  }
];

const projectMembersBySlug: Record<string, string[]> = {
  'neighborhood-heat-pump-pilot': ['viewer-1', 'user-rowan', 'user-mika'],
  'platform-release-governance-round': ['user-mika', 'user-ember'],
  'community-fridge-restock-route': ['viewer-1', 'user-rowan', 'user-tool'],
  'repair-cafe-shift-grid': ['viewer-1', 'user-tool', 'user-rowan', 'user-mika'],
  'tool-library-blade-sharpening-service': ['viewer-1', 'user-tool', 'user-mika'],
  'neighborhood-insulation-kit-round': ['viewer-1', 'user-rowan', 'user-mika'],
  'community-solar-battery-share': ['viewer-1', 'user-rowan', 'user-mika'],
  'hallway-air-sealing-build-day': ['viewer-1', 'user-tool', 'user-rowan'],
  'block-weatherization-pilot-wrap': ['viewer-1', 'user-mika', 'user-ember'],
  'mutual-aid-ride-request-desk': ['viewer-1', 'user-rowan', 'user-ember'],
  'patchbay-bike-light-tuneups': ['viewer-1', 'user-tool'],
  'rowan-after-school-device-checks': ['viewer-1', 'user-rowan', 'user-mika']
};

type ScopeMembershipConfig = {
  memberIds: string[];
  joinPolicy: 'open' | 'invite_only';
  hiddenFeedCopy?: string;
  inviteToken?: string;
};

type RoleConfig = {
  managerIds: string[];
  candidateIds: string[];
  confidenceTargetIdsByUserId: Record<string, string>;
};

const scopeMembershipByKey: Record<string, ScopeMembershipConfig> = {
  'channel:housing-build': {
    memberIds: ['viewer-1', 'user-rowan', 'user-mika'],
    joinPolicy: 'open'
  },
  'channel:mutual-aid': {
    memberIds: ['viewer-1', 'user-rowan', 'user-tool'],
    joinPolicy: 'open'
  },
  'community:east-market-makers': {
    memberIds: ['viewer-1', 'user-rowan', 'user-mika'],
    joinPolicy: 'open'
  },
  'community:tool-library-crew': {
    memberIds: ['user-tool'],
    joinPolicy: 'invite_only',
    inviteToken: 'tool-library-circle',
    hiddenFeedCopy:
      'This closed community only shows its feed to members. Join with an invite link before the work and discussion unlock here.'
  },
  'platform:platform': {
    memberIds: ['viewer-1', 'user-rowan', 'user-tool', 'user-mika', 'user-ember'],
    joinPolicy: 'open'
  }
};

const projectManagersBySlug: Record<string, RoleConfig> = {
  'neighborhood-heat-pump-pilot': {
    managerIds: ['viewer-1'],
    candidateIds: ['user-rowan'],
    confidenceTargetIdsByUserId: {
      'user-rowan': 'confidence-project-manager-neighborhood-heat-pump-pilot-user-rowan'
    }
  },
  'platform-release-governance-round': {
    managerIds: ['user-ember'],
    candidateIds: ['user-mika'],
    confidenceTargetIdsByUserId: {
      'user-mika': 'confidence-project-manager-platform-release-governance-round-user-mika',
      'user-ember': 'confidence-project-manager-platform-release-governance-round-user-ember'
    }
  },
  'community-fridge-restock-route': {
    managerIds: ['user-rowan'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'repair-cafe-shift-grid': {
    managerIds: ['user-tool'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'tool-library-blade-sharpening-service': {
    managerIds: ['user-tool'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'neighborhood-insulation-kit-round': {
    managerIds: ['viewer-1'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'community-solar-battery-share': {
    managerIds: ['user-rowan'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'hallway-air-sealing-build-day': {
    managerIds: ['user-tool'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'block-weatherization-pilot-wrap': {
    managerIds: ['user-mika'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'mutual-aid-ride-request-desk': {
    managerIds: ['user-ember'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'patchbay-bike-light-tuneups': {
    managerIds: ['viewer-1'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'rowan-after-school-device-checks': {
    managerIds: ['user-rowan'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  }
};

const eventManagersBySlug: Record<string, RoleConfig> = {
  'tool-library-spring-swap-social': {
    managerIds: ['user-tool'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'retrofit-night-walk': {
    managerIds: ['user-mika'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  }
};

const productiveProjectPhaseBlueprints: Array<
  Omit<ProjectLifecyclePhase, 'progressState' | 'betaLocked' | 'projectStatus'>
> = [
  {
    id: 'phase-1',
    order: 1,
    shortLabel: 'Phase 1',
    title: 'Proposal & Demand Signalling',
    summary:
      'A productive project begins as a tagged proposal with demand signalling and member-ranked values that carry into every later decision.',
    mechanics: [
      'A member proposes the project with the required channel tags and any relevant community tags.',
      'Members can add value criteria such as accessibility, local sourcing, or making use of unused space.',
      'Each value is voted on by importance, and that ranked list stays visible through the whole lifecycle.'
    ]
  },
  {
    id: 'phase-2',
    order: 2,
    shortLabel: 'Phase 2',
    title: 'Production Plan',
    summary:
      'Members submit concrete plans for what will be produced or built, then vote on how well each plan satisfies the Phase 1 values.',
    mechanics: [
      'Each plan spells out the output, required inputs, materials, costs, and any specific acquisitions needed.',
      'Members vote yes or no on whether a plan meets each value, then cast an overall approval vote.',
      'Any member can vote on multiple plans; the highest approval above quorum wins.'
    ]
  },
  {
    id: 'phase-3',
    order: 3,
    shortLabel: 'Phase 3',
    title: 'Distribution Plan',
    summary:
      'Once the work itself is defined, members decide how the output will be distributed or accessed.',
    mechanics: [
      'Distribution plans explain who receives the output, in what proportions, and under what access rules.',
      'Members use the same quorum-based approval model as Phase 2, and can vote across multiple options.',
      'The highest-rated plan above quorum becomes the project’s active distribution plan.'
    ]
  },
  {
    id: 'phase-4',
    order: 4,
    shortLabel: 'Phase 4',
    title: 'Funding & Resource Acquisition',
    summary:
      'After both plans are approved, the project would normally activate funding and resource acquisition.',
    mechanics: [
      'The community fund opens once production and distribution planning have both passed.',
      'Members can contribute funds or source required inputs from existing platform asset holdings.',
      'In beta this phase stays visible in the lifecycle but remains locked and unavailable.'
    ],
    note: 'This phase is part of the target model, but the current beta skips acquisition tooling entirely.'
  },
  {
    id: 'phase-5',
    order: 5,
    shortLabel: 'Phase 5',
    title: 'Scheduling & Activity',
    summary:
      'Project managers schedule concrete activities that only activate when every required role is filled.',
    mechanics: [
      'Activities specify dates, times, roles needed, and the minimum participants required.',
      'The activity only activates once all required roles are filled, using a contingent commitment model.',
      'Managers can return the project to Phase 2 or Phase 3 with a stated reason if the current plans no longer hold.'
    ]
  },
  {
    id: 'phase-6',
    order: 6,
    shortLabel: 'Phase 6',
    title: 'Completion or Conversion',
    summary:
      'A finished project can close cleanly or convert into a new ongoing project type without losing its planning history.',
    mechanics: [
      'Project managers can mark the work complete once the agreed plan has been carried out.',
      'Managers can also return the project to Phase 2 or Phase 3 with a stated reason if a later problem appears.',
      'The project keeps its history, values, and follow-on coordination visible after completion or conversion.'
    ]
  }
];

const collectiveServicePhaseBlueprints: Array<
  Omit<ProjectLifecyclePhase, 'progressState' | 'betaLocked' | 'projectStatus'>
> = [
  {
    id: 'phase-1',
    order: 1,
    shortLabel: 'Phase 1',
    title: 'Proposal & Demand Signalling',
    summary:
      'A collective service starts as a tagged proposal with demand signalling and shared service values.',
    mechanics: [
      'At least one channel tag is required so the service proposal enters a working context immediately.',
      'Members rank the values that later operations and access plans should be judged against.',
      'Demand signalling stays open through the full cycle so members can keep signalling ongoing need.'
    ]
  },
  {
    id: 'phase-2',
    order: 2,
    shortLabel: 'Phase 2',
    title: 'Operations Plan',
    summary:
      'Members propose and vote on the operating model that should shape how the service actually runs.',
    mechanics: [
      'Operations plans describe the working cadence, staffing, capacity, and practical service flow.',
      'Members vote on whether each plan satisfies the Phase 1 values and then cast an overall approval vote.',
      'The highest approval above quorum becomes the active operations plan.'
    ]
  },
  {
    id: 'phase-3',
    order: 3,
    shortLabel: 'Phase 3',
    title: 'Access Plan',
    summary:
      'Once the operating model is clear, members decide how people access the service and whether requests should be enabled.',
    mechanics: [
      'Access plans define eligibility, scheduling rules, limits, reserve handling, and the optional request system.',
      'Members use the same quorum-based approval model as Phase 2, and can vote across multiple options.',
      'The highest-rated plan above quorum becomes the active access plan for the service cycle.'
    ]
  },
  {
    id: 'phase-4',
    order: 4,
    shortLabel: 'Phase 4',
    title: 'Funding & Resource Acquisition',
    summary:
      'Once operations and access are approved, the service would normally activate any needed funding or shared resources.',
    mechanics: [
      'Community fund support and asset sourcing would open here once both plans have passed.',
      'In beta this phase remains visible but locked, so current service cycles skip directly into scheduling.',
      'Distribution is never based on labor contribution alone; access still follows the approved plan.'
    ],
    note: 'This phase remains visible for the full model, but beta currently skips acquisition tooling.'
  },
  {
    id: 'phase-5',
    order: 5,
    shortLabel: 'Phase 5',
    title: 'Scheduling & Service Activity',
    summary:
      'Members schedule service activities here. Any enabled request system stays visible as ongoing demand.',
    mechanics: [
      'Any project member can schedule a concrete service session and assign role-based slots.',
      'If the access plan enabled requests, members can see the active request count and submit new requests here.',
      'Managers can send the service back to Phase 2 or Phase 3 with a stated reason if the current plan needs revision.'
    ]
  },
  {
    id: 'phase-6',
    order: 6,
    shortLabel: 'Phase 6',
    title: 'Completion',
    summary:
      'A collective service can close here, or return to planning if the current approach needs revision.',
    mechanics: [
      'Managers can close the service once the scheduled activity is complete.',
      'If the service is continuing without changes, it should stay in Phase 5 rather than advancing here.',
      'Managers can return the service to Phase 2 or Phase 3 with a stated reason if the plan needs updating.'
    ]
  }
];

const personalServicePhaseBlueprints: Array<
  Omit<ProjectLifecyclePhase, 'progressState' | 'betaLocked' | 'projectStatus'>
> = [
  {
    id: 'phase-1',
    order: 1,
    shortLabel: 'Phase 1',
    title: 'Activity Scheduling & Requests',
    summary:
      'A personal service opens directly into availability, requests, and scheduled service activity for the creator.',
    mechanics: [
      'The creator sets their availability, operating range, and any direct scheduling notes.',
      'Users can submit service requests immediately without a separate planning or quorum phase.',
      'The creator can schedule work directly and accept or decline requests as they come in.'
    ]
  },
  {
    id: 'phase-2',
    order: 2,
    shortLabel: 'Phase 2',
    title: 'Complete or Convert',
    summary:
      'The personal service can close cleanly or convert into a collective or productive project when the work outgrows one person.',
    mechanics: [
      'The creator can mark the service complete when they are no longer offering it.',
      'If the service needs more people or formal planning, it can convert into a collective service or productive project.',
      'There is no quorum or planning vote in this personal service path.'
    ]
  }
];

function projectLifecyclePhaseBlueprintsForMode(projectMode: ProjectMode) {
  if (projectMode === 'collective-service') {
    return collectiveServicePhaseBlueprints;
  }

  if (projectMode === 'personal-service') {
    return personalServicePhaseBlueprints;
  }

  return productiveProjectPhaseBlueprints;
}

type ProjectLifecyclePhaseConfig = {
  projectStatus: string;
  progressState?: ProjectLifecyclePhase['progressState'];
  betaLocked?: boolean;
  note?: string;
};

type ProjectLifecycleConfig = {
  currentPhaseId: ProjectLifecyclePhaseId;
  phases: Partial<Record<ProjectLifecyclePhaseId, ProjectLifecyclePhaseConfig>>;
};

const projectLifecycleBySlug: Record<string, ProjectLifecycleConfig> = {
  'neighborhood-heat-pump-pilot': {
    currentPhaseId: 'phase-1',
    phases: {
      'phase-1': {
        projectStatus:
          'This pilot is still collecting values, demand, and likely retrofit buildings before any plan vote opens.'
      },
      'phase-2': {
        projectStatus:
          'No production plan has gone to vote yet. Project managers will open submissions once the Phase 1 value ranking stabilizes.'
      },
      'phase-3': {
        projectStatus:
          'Distribution options stay parked until a production plan wins quorum and gives members something concrete to distribute.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus:
          'Funding and acquisitions are intentionally unavailable in this beta, so any plan here must either wait for a later release or skip to no-cost activity work.'
      },
      'phase-5': {
        projectStatus:
          'Managers can schedule walkthroughs and low-cost prep activities later, but only after the planning path is clear.'
      },
      'phase-6': {
        projectStatus:
          'If the pilot succeeds it can either close after the first retrofit round or convert into an ongoing neighborhood retrofit service.'
      }
    }
  },
  'platform-release-governance-round': {
    currentPhaseId: 'phase-2',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus:
          'The initial release-governance proposal already has a shared purpose and value set, so this phase is treated as complete.'
      },
      'phase-2': {
        projectStatus:
          'Members are still shaping the actual release process, acceptance criteria, and accessibility gates that should define the working plan.'
      },
      'phase-3': {
        projectStatus:
          'Distribution here means deciding how release outputs, notes, and access should be shared once the working plan is approved.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus:
          'Funding and asset acquisition are out of scope for this beta surface, so the release round keeps that step visible but unavailable.'
      },
      'phase-5': {
        projectStatus:
          'Once the working plan is approved, managers can schedule concrete release tasks, review windows, and handoff activities.'
      },
      'phase-6': {
        projectStatus:
          'This governance round can close after the release or convert into an ongoing platform service if the practice needs to persist.'
      }
    }
  },
  'community-fridge-restock-route': {
    currentPhaseId: 'phase-3',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus:
          'Demand and core values are already clear enough that the route moved out of proposal and into real planning.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus:
          'The working restock model passed the production vote and now gives the group something concrete to distribute.'
      },
      'phase-3': {
        projectStatus:
          'Members are deciding which households and pickup windows should get first priority in the weekly route.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus:
          'No funding tooling is available in beta, so the route stays focused on volunteer labor and existing donated stock.'
      },
      'phase-5': {
        projectStatus:
          'Once the distribution model lands, managers can schedule concrete restock runs and handoff windows.'
      },
      'phase-6': {
        projectStatus:
          'If the route stabilizes it can convert into an ongoing neighborhood service instead of closing.'
      }
    }
  },
  'repair-cafe-shift-grid': {
    currentPhaseId: 'phase-5',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus: 'The cafe already has a shared purpose and value set, so proposal work is complete.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus:
          'The working repair-cafe plan is settled and no longer competing with alternatives.'
      },
      'phase-3': {
        progressState: 'complete',
        projectStatus:
          'The access and intake model has already been approved, so the project can move into concrete scheduling.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus:
          'The current repair-cafe round avoids any funding or asset acquisition requirements that would depend on the locked beta phase.'
      },
      'phase-5': {
        projectStatus:
          'Managers are scheduling real shifts now, and each activity only activates once the needed roles are filled.'
      },
      'phase-6': {
        projectStatus:
          'If the shift grid keeps working, the project can either close after the pilot month or convert into an ongoing service.'
      }
    }
  },
  'tool-library-blade-sharpening-service': {
    currentPhaseId: 'phase-6',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus: 'The original sharpening pilot already established strong demand and a clear value ranking.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus:
          'The service workflow was approved and tested in the pilot round.'
      },
      'phase-3': {
        progressState: 'complete',
        projectStatus:
          'Pickup, turnaround, and member access rules are already in place from the pilot phase.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus:
          'The service converted without needing platform funding, so the locked acquisition phase remains informational only.'
      },
      'phase-5': {
        progressState: 'complete',
        projectStatus:
          'Recurring intake and sharpening shifts were used during the pilot and continue under the converted service model.'
      },
      'phase-6': {
        projectStatus:
          'The project has already converted into an ongoing service, so completion here means continuing the work in its service form.'
      }
    }
  },
  'neighborhood-insulation-kit-round': {
    currentPhaseId: 'phase-2',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus:
          'Demand and ranked values are complete, so this project is now choosing its production path.'
      },
      'phase-2': {
        projectStatus:
          'Members are voting on the first insulation-kit production run and role assignments.'
      },
      'phase-3': {
        projectStatus: 'Distribution opens once a production plan wins quorum.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus: 'Acquisition remains locked in beta.'
      },
      'phase-5': {
        projectStatus: 'Scheduling starts after planning closes.'
      },
      'phase-6': {
        projectStatus: 'The project can close after the build round or convert into ongoing service work.'
      }
    }
  },
  'community-solar-battery-share': {
    currentPhaseId: 'phase-3',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus: 'Initial demand and values are complete.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus: 'A production model has already passed vote.'
      },
      'phase-3': {
        projectStatus: 'Members are now choosing access and reserve rules for battery use windows.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus: 'Acquisition remains locked in beta.'
      },
      'phase-5': {
        projectStatus: 'Scheduling starts once the access plan is approved.'
      },
      'phase-6': {
        projectStatus: 'The project can close or convert after the first outage season.'
      }
    }
  },
  'hallway-air-sealing-build-day': {
    currentPhaseId: 'phase-5',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus: 'Demand and values were completed in an earlier round.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus: 'Production scope is approved.'
      },
      'phase-3': {
        progressState: 'complete',
        projectStatus: 'Distribution and access criteria are approved.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus: 'Acquisition remains locked in beta.'
      },
      'phase-5': {
        projectStatus: 'Managers are now coordinating contingent role-based activities.'
      },
      'phase-6': {
        projectStatus: 'Once the sessions finish, the project can be completed or rolled forward.'
      }
    }
  },
  'block-weatherization-pilot-wrap': {
    currentPhaseId: 'phase-6',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus: 'Demand and values are complete.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus: 'Production planning is complete.'
      },
      'phase-3': {
        progressState: 'complete',
        projectStatus: 'Distribution planning is complete.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus: 'Acquisition remained locked throughout this pilot.'
      },
      'phase-5': {
        progressState: 'complete',
        projectStatus: 'All planned activity sessions are complete.'
      },
      'phase-6': {
        projectStatus: 'The project is in completion review with conversion notes logged for future rounds.'
      }
    }
  },
  'mutual-aid-ride-request-desk': {
    currentPhaseId: 'phase-1',
    phases: {
      'phase-1': {
        projectStatus: 'The service is still collecting demand and ranking values before operations planning opens.'
      },
      'phase-2': {
        projectStatus: 'Operations planning has not opened yet.'
      },
      'phase-3': {
        projectStatus: 'Access planning and request-system setup follow operations approval.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus: 'Acquisition remains locked in beta.'
      },
      'phase-5': {
        projectStatus: 'Service scheduling starts once planning phases complete.'
      },
      'phase-6': {
        projectStatus: 'Managers can close or cycle once the first service window completes.'
      }
    }
  },
  'patchbay-bike-light-tuneups': {
    currentPhaseId: 'phase-1',
    phases: {
      'phase-1': {
        projectStatus: 'This personal service is active with open requests and direct scheduling by the creator.'
      },
      'phase-2': {
        projectStatus: 'When the creator stops running this service, it can be marked complete or converted.'
      }
    }
  },
  'rowan-after-school-device-checks': {
    currentPhaseId: 'phase-2',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus: 'The personal service previously ran with active scheduling and requests.'
      },
      'phase-2': {
        projectStatus: 'The service is complete and no longer accepts new requests.'
      }
    }
  }
};

type RawProjectValue = {
  id: string;
  label: string;
  authorUsername: string;
  votesByUserId: Record<string, ProjectImportanceVoteValue>;
};

type RawProjectPlanBase = {
  id: string;
  title: string;
  authorUsername: string;
  createdAt: string;
  overallVotesByUserId: Record<string, ProjectApprovalVote>;
  valueVotesByValueId: Record<string, Record<string, ProjectApprovalVote>>;
};

type RawPlanPhase = {
  id: string;
  title: string;
  details: string;
  materialsLabel: string;
  costLabel: string;
};

type RawProductionPlan = RawProjectPlanBase & {
  description?: string;
  planPhases?: RawPlanPhase[];
  outputSummary: string;
  materialsSummary: string;
  totalCostLabel: string;
  acquisitionsSummary: string;
};

type RawDistributionPlan = RawProjectPlanBase & {
  description?: string;
  totalCostLabel?: string;
  planPhases?: RawPlanPhase[];
  distributionSummary: string;
  accessSummary: string;
  reserveSummary: string;
  requestSystemEnabled?: boolean;
};

type RawProjectServiceRequest = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  status: ProjectServiceRequestStatus;
};

type RawProjectRevertEntry = {
  id: string;
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>;
  reason: string;
  authorUsername: string;
  createdAt: string;
};

type RawProjectActivity = {
  id: string;
  title: string;
  authorUsername: string;
  scheduledAt: string;
  endsAt?: string;
  locationLabel: string;
  minimumParticipants: number;
  maximumParticipants?: number;
  linkedPlanPhaseId?: string | null;
  roles: Array<{
    label: string;
    requiredCount: number;
    assignedUsernames: string[];
  }>;
  extraAssignedUsernames?: string[];
  note: string;
};

type ProjectWorkflowState = {
  signalCount: number;
  signalUserIds: string[];
  values: RawProjectValue[];
  phaseTwoPlans: RawProductionPlan[];
  phaseThreePlans: RawDistributionPlan[];
  phaseFiveActivities: RawProjectActivity[];
  serviceRequests?: RawProjectServiceRequest[];
  revertHistory?: RawProjectRevertEntry[];
  availabilitySummary?: string;
  travelRadiusLabel?: string;
};

const importanceVoteLabels: Record<ProjectImportanceVoteValue, string> = {
  1: 'Unnecessary',
  2: 'Very low importance',
  3: 'Low importance',
  4: 'Light importance',
  5: 'Moderate importance',
  6: 'Useful',
  7: 'Important',
  8: 'High priority',
  9: 'Near required',
  10: 'Required'
};

function normalizeLegacyImportanceVote(vote: ProjectImportanceVoteValue) {
  switch (vote) {
    case 1:
      return 1;
    case 2:
      return 4;
    case 3:
      return 7;
    case 4:
      return 10;
    default:
      return vote;
  }
}

function migrateLegacyImportanceVotes(workflowStates: Record<string, ProjectWorkflowState>) {
  Object.values(workflowStates).forEach((workflow) => {
    workflow.values.forEach((value) => {
      const votes = Object.values(value.votesByUserId);

      if (votes.length === 0 || votes.some((vote) => vote > 4)) {
        return;
      }

      Object.keys(value.votesByUserId).forEach((userId) => {
        value.votesByUserId[userId] = normalizeLegacyImportanceVote(value.votesByUserId[userId]);
      });
    });
  });
}

const projectWorkflowStateBySlug: Record<string, ProjectWorkflowState> = {
  'neighborhood-heat-pump-pilot': {
    signalCount: 124,
    signalUserIds: ['viewer-1', 'user-rowan'],
    values: [
      {
        id: 'value-heat-pump-1',
        label: 'Keep the first retrofit round small enough to actually finish.',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 4,
          'user-mika': 3
        }
      },
      {
        id: 'value-heat-pump-2',
        label: 'Prioritize buildings where neighbors already want to participate.',
        authorUsername: 'patchbay',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 3,
          'user-mika': 4
        }
      },
      {
        id: 'value-heat-pump-3',
        label: 'Keep vendor comparisons readable enough for non-specialists to follow.',
        authorUsername: 'mika',
        votesByUserId: {
          'viewer-1': 3,
          'user-rowan': 2,
          'user-mika': 4
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: []
  },
  'platform-release-governance-round': {
    signalCount: 18,
    signalUserIds: ['user-ember', 'user-mika'],
    values: [
      {
        id: 'value-release-1',
        label: 'Shipping should stay accessible by keyboard before any release is considered ready.',
        authorUsername: 'quietember',
        votesByUserId: {
          'user-ember': 4,
          'user-mika': 4
        }
      },
      {
        id: 'value-release-2',
        label: 'Every release note should point back to the exact work surfaces it is summarizing.',
        authorUsername: 'patchbay',
        votesByUserId: {
          'user-ember': 4,
          'user-mika': 3
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-release-1',
        title: 'Accessibility gate plus linked release notes',
        authorUsername: 'mika',
        createdAt: '2026-04-30T09:55:00Z',
        outputSummary:
          'Ship a release checklist that blocks deployment until keyboard, focus, and linked work-surface notes are complete.',
        materialsSummary:
          'Needs a compact checklist, keyboard pass, focus pass, linked release note template, and a final review window.',
        totalCostLabel: '$0 direct spend',
        acquisitionsSummary: 'Uses existing maintainers, issue queues, and release tooling already on hand.',
        overallVotesByUserId: {
          'user-ember': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-release-1': {
            'user-ember': 'yes',
            'user-mika': 'yes'
          },
          'value-release-2': {
            'user-ember': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [],
    phaseFiveActivities: [
      {
        id: 'project-activity-release-1',
        title: 'Final release review window',
        authorUsername: 'quietember',
        scheduledAt: '2026-05-04T17:30:00Z',
        locationLabel: 'Remote review session',
        minimumParticipants: 2,
        roles: [
          {
            label: 'Accessibility reviewer',
            requiredCount: 1,
            assignedUsernames: ['mika']
          },
          {
            label: 'Release signoff',
            requiredCount: 1,
            assignedUsernames: ['quietember']
          }
        ],
        note: 'Only activates when both the accessibility review and the final signoff slots are filled.'
      }
    ]
  },
  'community-fridge-restock-route': {
    signalCount: 47,
    signalUserIds: ['viewer-1', 'user-rowan', 'user-tool'],
    values: [
      {
        id: 'value-fridge-1',
        label: 'Keep the route predictable enough that fridge volunteers can actually sustain it week to week.',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 4,
          'user-tool': 3
        }
      },
      {
        id: 'value-fridge-2',
        label: 'Prioritize households and pickup points with the least flexible food access first.',
        authorUsername: 'patchbay',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 4,
          'user-tool': 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-fridge-1',
        title: 'Weekly two-stop restock run',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-29T19:40:00Z',
        outputSummary:
          'Run a predictable two-stop restock each week with one neighborhood prep slot and one visible handoff window.',
        materialsSummary:
          'Needs donated food intake, volunteer prep, cooler checks, and one driver or cart team.',
        totalCostLabel: '$0 direct spend',
        acquisitionsSummary: 'Uses the existing fridge network and already-donated food streams.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-tool': 'yes'
        },
        valueVotesByValueId: {
          'value-fridge-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-tool': 'yes'
          },
          'value-fridge-2': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-tool': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-fridge-1',
        title: 'Neighborhood-first pickup windows',
        authorUsername: 'patchbay',
        createdAt: '2026-04-30T11:20:00Z',
        distributionSummary:
          'Hold one early pickup window for nearby households and one later overflow window for anyone still waiting.',
        accessSummary:
          'Nearby households get first priority, but any unclaimed food opens to the wider route by the end of the evening.',
        reserveSummary: 'Keep a small emergency reserve for same-day need reports before opening overflow pickup.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-tool': 'no'
        },
        valueVotesByValueId: {
          'value-fridge-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-tool': 'yes'
          },
          'value-fridge-2': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-tool': 'no'
          }
        }
      }
    ],
    phaseFiveActivities: []
  },
  'repair-cafe-shift-grid': {
    signalCount: 36,
    signalUserIds: ['viewer-1', 'user-tool', 'user-rowan', 'user-mika'],
    values: [
      {
        id: 'value-repair-1',
        label: 'Keep the repair floor legible so newcomers can find the right table without staff bottlenecks.',
        authorUsername: 'toolorbit',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 4,
          'user-rowan': 3,
          'user-mika': 3
        }
      },
      {
        id: 'value-repair-2',
        label: 'Only schedule sessions that already have enough roles filled to actually open on time.',
        authorUsername: 'mika',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 4,
          'user-rowan': 4,
          'user-mika': 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-repair-1',
        title: 'Two-table repair night model',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-28T17:20:00Z',
        outputSummary:
          'Run the cafe with one intake table and one active repair table so tools and repairs do not collapse into one queue.',
        materialsSummary:
          'Needs an intake lead, bench support, triage checklist, and simple signage for arrivals.',
        totalCostLabel: '$0 direct spend',
        acquisitionsSummary: 'Uses the existing workshop room, tools, and volunteer time already available.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-repair-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          },
          'value-repair-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-repair-1',
        title: 'Intake by visible queue',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-29T14:40:00Z',
        distributionSummary:
          'Use a visible queue board so arrivals can see the current order and decide whether to wait or return later.',
        accessSummary:
          'Every arrival can join the queue, but the board shows repair categories so quick fixes are not buried under larger jobs.',
        reserveSummary: 'Keep one overflow slot open for urgent mobility or safety-related repairs.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-repair-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          },
          'value-repair-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseFiveActivities: [
      {
        id: 'project-activity-repair-1',
        title: 'Thursday repair cafe shift',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-05T18:00:00Z',
        locationLabel: 'Tool Library workshop floor',
        minimumParticipants: 3,
        roles: [
          {
            label: 'Intake table',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          },
          {
            label: 'Bench repair support',
            requiredCount: 1,
            assignedUsernames: ['toolorbit']
          },
          {
            label: 'Queue board runner',
            requiredCount: 1,
            assignedUsernames: []
          }
        ],
        note: 'This shift only goes live once all three floor roles are covered.'
      }
    ]
  },
  'tool-library-blade-sharpening-service': {
    signalCount: 52,
    signalUserIds: ['viewer-1', 'user-tool', 'user-mika'],
    values: [
      {
        id: 'value-sharpening-1',
        label: 'Keep turnaround times clear so members know exactly when their tools will be ready again.',
        authorUsername: 'toolorbit',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 4,
          'user-mika': 3
        }
      },
      {
        id: 'value-sharpening-2',
        label: 'Preserve a simple intake path so the service stays lightweight instead of becoming workshop bureaucracy.',
        authorUsername: 'mika',
        votesByUserId: {
          'viewer-1': 3,
          'user-tool': 4,
          'user-mika': 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-sharpening-1',
        title: 'Weekly intake plus weekend sharpening block',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-27T19:00:00Z',
        outputSummary:
          'Take blades during the week, sharpen them in a weekend block, and return them in the next pickup window.',
        materialsSummary:
          'Needs one intake steward, one sharpening lead, tracking tags, and one pickup handoff window.',
        totalCostLabel: '$0 direct spend',
        acquisitionsSummary: 'Relies on the existing sharpening bench and volunteer labor already proven in the pilot.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-sharpening-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-mika': 'yes'
          },
          'value-sharpening-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-sharpening-1',
        title: 'Tagged pickup windows',
        authorUsername: 'mika',
        createdAt: '2026-04-28T12:10:00Z',
        distributionSummary:
          'Return sharpened tools through tagged pickup windows with a fallback shelf for members who miss the main slot.',
        accessSummary:
          'Members get a clear pickup window first, then unclaimed completed work moves to the labeled fallback shelf.',
        reserveSummary: 'Keep one emergency slot for tools needed for accessibility or urgent household work.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-sharpening-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-mika': 'yes'
          },
          'value-sharpening-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseFiveActivities: [
      {
        id: 'project-activity-sharpening-1',
        title: 'Weekly intake and sharpening shift',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-02T17:00:00Z',
        locationLabel: 'Tool Library bench room',
        minimumParticipants: 2,
        roles: [
          {
            label: 'Intake desk',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          },
          {
            label: 'Sharpening bench',
            requiredCount: 1,
            assignedUsernames: ['toolorbit']
          }
        ],
        note: 'This recurring shift is the service form the original pilot converted into.'
      }
    ]
  },
  'neighborhood-insulation-kit-round': {
    signalCount: 61,
    signalUserIds: ['viewer-1', 'user-rowan', 'user-mika'],
    values: [
      {
        id: 'value-insulation-1',
        label: 'Prioritize buildings with immediate draft and heat loss risk.',
        authorUsername: 'patchbay',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 4,
          'user-mika': 3
        }
      },
      {
        id: 'value-insulation-2',
        label: 'Keep assembly steps simple enough for first-time volunteers.',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 3,
          'user-mika': 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-insulation-1',
        title: 'Two-evening prep plus one weekend install block',
        authorUsername: 'patchbay',
        createdAt: '2026-04-30T16:20:00Z',
        outputSummary: 'Build and install one round of insulation kits across three priority hallways.',
        materialsSummary: 'Needs measured cut lists, prep tables, and one install team per hallway.',
        totalCostLabel: '$0 direct spend',
        acquisitionsSummary: 'Uses donated materials and existing tool inventory.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-insulation-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          },
          'value-insulation-2': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [],
    phaseFiveActivities: []
  },
  'community-solar-battery-share': {
    signalCount: 54,
    signalUserIds: ['viewer-1', 'user-rowan'],
    values: [
      {
        id: 'value-battery-1',
        label: 'Prioritize outage-sensitive households first.',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 4,
          'user-mika': 3
        }
      },
      {
        id: 'value-battery-2',
        label: 'Keep handoff times predictable so swaps do not fail mid-week.',
        authorUsername: 'mika',
        votesByUserId: {
          'viewer-1': 3,
          'user-rowan': 4,
          'user-mika': 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-battery-1',
        title: 'Shared battery prep and maintenance cadence',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-30T15:55:00Z',
        outputSummary: 'Run a predictable prep, charge, and maintenance loop for shared battery kits.',
        materialsSummary: 'Needs one prep steward, one diagnostics check, and a weekly charge window.',
        totalCostLabel: '$0 direct spend',
        acquisitionsSummary: 'Relies on existing kit stock and maintenance tools.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-battery-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          },
          'value-battery-2': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-battery-1',
        title: 'Tiered outage access windows',
        authorUsername: 'mika',
        createdAt: '2026-04-30T16:45:00Z',
        distributionSummary: 'Use priority windows for outage-sensitive households, then open overflow pickup.',
        accessSummary: 'Priority tiers open first, then remaining slots become first-come once reserve is set.',
        reserveSummary: 'Keep one reserve unit per day for urgent medical and accessibility needs.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-battery-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          },
          'value-battery-2': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseFiveActivities: []
  },
  'hallway-air-sealing-build-day': {
    signalCount: 39,
    signalUserIds: ['viewer-1', 'user-tool'],
    values: [
      {
        id: 'value-airseal-1',
        label: 'Only schedule install windows that already have full role coverage.',
        authorUsername: 'toolorbit',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 4,
          'user-rowan': 3
        }
      },
      {
        id: 'value-airseal-2',
        label: 'Keep prep and install materials staged by hallway to reduce downtime.',
        authorUsername: 'patchbay',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 3,
          'user-rowan': 3
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: [
      {
        id: 'project-activity-airseal-1',
        title: 'Saturday hallway sealing block',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-06T10:00:00Z',
        locationLabel: 'Tool Library annex workshop',
        minimumParticipants: 3,
        roles: [
          {
            label: 'Prep lead',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          },
          {
            label: 'Install team',
            requiredCount: 2,
            assignedUsernames: ['toolorbit']
          }
        ],
        note: 'This session only activates when all required install roles are filled.'
      }
    ]
  },
  'block-weatherization-pilot-wrap': {
    signalCount: 66,
    signalUserIds: ['viewer-1', 'user-rowan', 'user-mika'],
    values: [
      {
        id: 'value-weather-wrap-1',
        label: 'Preserve a clean handoff note so the next cycle starts from real evidence.',
        authorUsername: 'mika',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 3,
          'user-mika': 4
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: []
  },
  'mutual-aid-ride-request-desk': {
    signalCount: 41,
    signalUserIds: ['viewer-1', 'user-rowan', 'user-ember'],
    values: [
      {
        id: 'value-ride-1',
        label: 'Make same-day ride requests visible and fair.',
        authorUsername: 'quietember',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 3,
          'user-ember': 4
        }
      },
      {
        id: 'value-ride-2',
        label: 'Keep dispatcher workload small enough for one coordinator.',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 3,
          'user-rowan': 4,
          'user-ember': 4
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: []
  },
  'patchbay-bike-light-tuneups': {
    signalCount: 27,
    signalUserIds: ['viewer-1', 'user-tool'],
    values: [
      {
        id: 'value-bike-light-1',
        label: 'Keep appointments short and evening-friendly.',
        authorUsername: 'patchbay',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 3
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: [
      {
        id: 'project-activity-bike-light-1',
        title: 'Tuesday bike light tuneup block',
        authorUsername: 'patchbay',
        scheduledAt: '2026-05-03T18:30:00Z',
        locationLabel: 'Tool Library side bench',
        minimumParticipants: 1,
        roles: [
          {
            label: 'Service lead',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          }
        ],
        note: 'Personal service session managed directly by the creator.'
      }
    ],
    serviceRequests: [
      {
        id: 'service-request-bike-light-1',
        title: 'Rear light wiring check',
        body: 'Need a quick wiring check before early-morning commute shifts.',
        createdAt: '2026-04-30T18:30:00Z',
        status: 'open'
      }
    ],
    availabilitySummary: 'Weeknights after 6 PM, plus Saturday mornings by request.',
    travelRadiusLabel: 'Within 2 km of Tool Library'
  },
  'rowan-after-school-device-checks': {
    signalCount: 33,
    signalUserIds: ['viewer-1', 'user-rowan', 'user-mika'],
    values: [
      {
        id: 'value-device-checks-1',
        label: 'Keep check-ins fast so students can leave with working devices the same day.',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 4,
          'user-mika': 3
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: [],
    serviceRequests: [
      {
        id: 'service-request-device-checks-1',
        title: 'Screen cable reseat',
        body: 'Closed with successful fix during the final service week.',
        createdAt: '2026-04-26T16:10:00Z',
        status: 'accepted'
      },
      {
        id: 'service-request-device-checks-2',
        title: 'Charging-port replacement',
        body: 'Declined because replacement part was not available in the closing week.',
        createdAt: '2026-04-26T16:50:00Z',
        status: 'declined'
      }
    ],
    availabilitySummary: 'Service concluded after spring session.',
    travelRadiusLabel: 'No active travel radius'
  }
};

migrateLegacyImportanceVotes(projectWorkflowStateBySlug);

function summarizeOverviewForFeed(overview: string, maxLength = 170) {
  const trimmed = overview.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

function summarizeProjectCardCopy(text: string, maxLength = 108) {
  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

function stageLabelForProject(slug: string, fallback: string, projectMode: ProjectMode) {
  const currentPhaseId = projectLifecycleBySlug[slug]?.currentPhaseId;

  if (!currentPhaseId) {
    return fallback;
  }

  return projectFeedPhaseLabel(projectMode, currentPhaseId) ?? fallback;
}

function readProjectWorkflowState(slug: string) {
  return projectWorkflowStateBySlug[slug];
}

function importanceLabelFromScore(score: number) {
  if (score <= 0) {
    return 'No rating';
  }

  const roundedScore = Math.max(1, Math.min(10, Math.round(score))) as ProjectImportanceVoteValue;

  return importanceVoteLabels[roundedScore];
}

function buildProjectVoteSummary(
  votesByUserId: Record<string, ProjectApprovalVote>,
  quorumThresholdPercent: number,
  memberCount: number
): ProjectPlanVoteSummary {
  const viewer = currentViewer();
  const votes = Object.values(votesByUserId);
  const yesCount = votes.filter((vote) => vote === 'yes').length;
  const noCount = votes.filter((vote) => vote === 'no').length;
  const totalVotes = yesCount + noCount;
  const approvalPercent = totalVotes === 0 ? 0 : Math.round((yesCount / totalVotes) * 100);
  const participationPercent = memberCount <= 0 ? 0 : Math.round((totalVotes / memberCount) * 100);

  return {
    yesCount,
    noCount,
    totalVotes,
    approvalPercent,
    activeVote: viewer ? votesByUserId[viewer.id] ?? null : null,
    meetsQuorum: totalVotes > 0 && participationPercent >= quorumThresholdPercent
  };
}

function buildProjectValues(slug: string): ProjectValueItem[] {
  const workflow = readProjectWorkflowState(slug);
  const viewer = currentViewer();

  if (!workflow) {
    return [];
  }

  return workflow.values
    .map((value) => {
      const votes = Object.values(value.votesByUserId);
      const voteCount = votes.length;
      const importanceScore =
        voteCount === 0 ? 0 : Number((votes.reduce((sum, vote) => sum + vote, 0) / voteCount).toFixed(1));

      return {
        id: value.id,
        label: value.label,
        authorUsername: value.authorUsername,
        voteCount,
        importanceScore,
        importanceLabel: importanceLabelFromScore(importanceScore),
        activeImportanceVote: viewer ? value.votesByUserId[viewer.id] ?? 0 : 0
      } satisfies ProjectValueItem;
    })
    .sort((left, right) => right.importanceScore - left.importanceScore || right.voteCount - left.voteCount);
}

function buildProjectValueAssessments(
  values: ProjectValueItem[],
  votesByValueId: Record<string, Record<string, ProjectApprovalVote>>,
  quorumThresholdPercent: number,
  memberCount: number
) {
  return values.map((value) => ({
    valueId: value.id,
    valueLabel: value.label,
    ...buildProjectVoteSummary(votesByValueId[value.id] ?? {}, quorumThresholdPercent, memberCount)
  })) satisfies ProjectPlanValueAssessment[];
}

function buildProductionPlanPhases(plan: RawProductionPlan): ProjectPlanPhaseItem[] {
  if (plan.planPhases?.length) {
    return plan.planPhases.map((phase, index) => ({
      ...phase,
      title: phase.title.trim() || `Stage ${index + 1}`
    }));
  }

  return [
    {
      id: `${plan.id}-phase-1`,
      title: 'Stage 1',
      details: plan.materialsSummary,
      materialsLabel: plan.acquisitionsSummary,
      costLabel: plan.totalCostLabel
    }
  ];
}

function buildDistributionPlanPhases(plan: RawDistributionPlan): ProjectPlanPhaseItem[] {
  if (plan.planPhases?.length) {
    return plan.planPhases.map((phase, index) => ({
      ...phase,
      title: phase.title.trim() || `Stage ${index + 1}`
    }));
  }

  return [
    {
      id: `${plan.id}-phase-1`,
      title: 'Stage 1',
      details: plan.accessSummary,
      materialsLabel: plan.reserveSummary,
      costLabel: plan.totalCostLabel ?? 'No direct cost'
    }
  ];
}

function buildProductionPlans(
  slug: string,
  values: ProjectValueItem[],
  quorumThresholdPercent: number,
  memberCount: number
) {
  const workflow = readProjectWorkflowState(slug);

  if (!workflow) {
    return {
      plans: [] as ProjectProductionPlan[],
      winningPlanId: null as string | null
    };
  }

  const plans = workflow.phaseTwoPlans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    authorUsername: plan.authorUsername,
    createdAt: plan.createdAt,
    description: plan.description ?? plan.outputSummary,
    planPhases: buildProductionPlanPhases(plan),
    outputSummary: plan.outputSummary,
    materialsSummary: plan.materialsSummary,
    totalCostLabel: plan.totalCostLabel,
    acquisitionsSummary: plan.acquisitionsSummary,
    valueAssessments: buildProjectValueAssessments(values, plan.valueVotesByValueId, quorumThresholdPercent, memberCount),
    overallApproval: buildProjectVoteSummary(plan.overallVotesByUserId, quorumThresholdPercent, memberCount),
    isLeading: false
  }));
  const winningPlan = [...plans]
    .filter((plan) => plan.overallApproval.meetsQuorum)
    .sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];

  return {
    plans: plans.map((plan) => ({ ...plan, isLeading: plan.id === winningPlan?.id })),
    winningPlanId: winningPlan?.id ?? null
  };
}

function buildDistributionPlans(
  slug: string,
  values: ProjectValueItem[],
  quorumThresholdPercent: number,
  memberCount: number
) {
  const workflow = readProjectWorkflowState(slug);

  if (!workflow) {
    return {
      plans: [] as ProjectDistributionPlan[],
      winningPlanId: null as string | null
    };
  }

  const plans = workflow.phaseThreePlans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    authorUsername: plan.authorUsername,
    createdAt: plan.createdAt,
    description: plan.description ?? plan.distributionSummary,
    totalCostLabel: plan.totalCostLabel ?? 'No direct cost',
    planPhases: buildDistributionPlanPhases(plan),
    distributionSummary: plan.distributionSummary,
    accessSummary: plan.accessSummary,
    reserveSummary: plan.reserveSummary,
    requestSystemEnabled: plan.requestSystemEnabled ?? false,
    valueAssessments: buildProjectValueAssessments(values, plan.valueVotesByValueId, quorumThresholdPercent, memberCount),
    overallApproval: buildProjectVoteSummary(plan.overallVotesByUserId, quorumThresholdPercent, memberCount),
    isLeading: false
  }));
  const winningPlan = [...plans]
    .filter((plan) => plan.overallApproval.meetsQuorum)
    .sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];

  return {
    plans: plans.map((plan) => ({ ...plan, isLeading: plan.id === winningPlan?.id })),
    winningPlanId: winningPlan?.id ?? null
  };
}

function buildSelectableActivityPlanPhases(
  phaseTwo: { plans: ProjectProductionPlan[]; winningPlanId: string | null },
  phaseThree: { plans: ProjectDistributionPlan[]; winningPlanId: string | null }
) {
  const winningProduction = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);

  return [
    ...(winningProduction?.planPhases.map((phase, index) => ({
      id: phase.id,
      label: `${winningProduction.title} · ${/^stage\s+\d+$/i.test(phase.title) ? phase.title : `Stage ${index + 1}: ${phase.title}`}`
    })) ?? [])
  ] satisfies ProjectActivityPlanPhaseOption[];
}

function buildProjectActivities(slug: string, selectablePlanPhases: ProjectActivityPlanPhaseOption[]) {
  const workflow = readProjectWorkflowState(slug);
  const viewer = currentViewer();
  const planPhaseLabelById = new Map(selectablePlanPhases.map((option) => [option.id, option.label]));

  if (!workflow) {
    return [] as ProjectActivityItem[];
  }

  return [...workflow.phaseFiveActivities]
    .sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
    )
    .map((activity) => {
    const extraAssignedUsernames = activity.extraAssignedUsernames ?? [];
    const maximumParticipants = Math.max(activity.maximumParticipants ?? 0, activity.minimumParticipants, 1);
    const extraCapacity = Math.max(maximumParticipants - activity.minimumParticipants, 0);
    const startAt = activity.scheduledAt;
    const endAt =
      activity.endsAt ??
      new Date(new Date(activity.scheduledAt).getTime() + 60 * 60 * 1000).toISOString();
    const viewerAssignedRoleLabel =
      activity.roles.find((role) => viewer && role.assignedUsernames.includes(viewer.username))?.label ??
      (viewer && extraAssignedUsernames.includes(viewer.username) ? 'Extras' : null);
    const roles = [
      ...activity.roles.map((role) => ({
        label: role.label,
        filledCount: role.assignedUsernames.length,
        requiredCount: role.requiredCount,
        isViewerAssigned: !!viewer && role.assignedUsernames.includes(viewer.username),
        isExtraSlot: false
      })),
      ...(extraCapacity > 0
        ? [{
            label: 'Extras',
            filledCount: extraAssignedUsernames.length,
            requiredCount: extraCapacity,
            isViewerAssigned: !!viewer && extraAssignedUsernames.includes(viewer.username),
            isExtraSlot: true
          }]
        : [])
    ];
    const committedCount = Array.from(
      new Set([
        ...activity.roles.flatMap((role) => role.assignedUsernames),
        ...extraAssignedUsernames
      ])
    ).length;
    const statusTone =
      committedCount >= activity.minimumParticipants ? 'green' : committedCount > 1 ? 'yellow' : 'red';

    return {
      id: activity.id,
      title: activity.title,
      authorUsername: activity.authorUsername,
      scheduledAt: startAt,
      startAt,
      endAt,
      locationLabel: activity.locationLabel,
      minimumParticipants: activity.minimumParticipants,
      maximumParticipants,
      committedCount,
      viewerAssignedRoleLabel,
      linkedPlanPhaseLabel: activity.linkedPlanPhaseId
        ? planPhaseLabelById.get(activity.linkedPlanPhaseId) ?? null
        : null,
      statusTone,
      roles,
      note: activity.note,
      isActive:
        committedCount >= activity.minimumParticipants &&
        roles.every((role) => role.isExtraSlot || role.filledCount >= role.requiredCount)
    } satisfies ProjectActivityItem;
    });
}

function buildProjectServiceRequestState(
  slug: string,
  enabled: boolean,
  viewerCanSubmitRequests: boolean,
  viewerCanReviewRequests: boolean
) {
  const workflow = readProjectWorkflowState(slug);

  if (!workflow) {
    return {
      enabled,
      requestCount: 0,
      requests: [] as ProjectServiceRequestItem[],
      viewerCanSubmitRequests,
      viewerCanReviewRequests
    };
  }

  return {
    enabled,
    requestCount: (workflow.serviceRequests ?? []).filter((request) => request.status === 'open').length,
    requests: (workflow.serviceRequests ?? []).map((request) => ({
      id: request.id,
      title: request.title,
      body: request.body,
      createdAt: request.createdAt,
      status: request.status
    })),
    viewerCanSubmitRequests,
    viewerCanReviewRequests
  };
}

function buildProjectRevertHistory(slug: string) {
  const workflow = readProjectWorkflowState(slug);

  if (!workflow) {
    return [] as ProjectLifecycleRevertEntry[];
  }

  return (workflow.revertHistory ?? []).map((entry) => ({
    id: entry.id,
    targetPhaseId: entry.targetPhaseId,
    reason: entry.reason,
    authorUsername: entry.authorUsername,
    createdAt: entry.createdAt
  }));
}

function nextProjectPhaseId(
  currentPhaseId: ProjectLifecyclePhaseId,
  projectMode: ProjectMode
): ProjectLifecyclePhaseId | null {
  if (projectMode === 'personal-service') {
    switch (currentPhaseId) {
      case 'phase-1':
        return 'phase-2';
      default:
        return null;
    }
  }

  switch (currentPhaseId) {
    case 'phase-1':
      return 'phase-2';
    case 'phase-2':
      return 'phase-3';
    case 'phase-3':
      return 'phase-5';
    case 'phase-5':
      return 'phase-6';
    default:
      return null;
  }
}

function calculateProjectQuorumThreshold(memberCount: number) {
  if (memberCount <= 5) {
    return 100;
  }

  if (memberCount >= 1000) {
    return 30;
  }

  const minMembers = Math.log10(5);
  const maxMembers = Math.log10(1000);
  const scaledMembers = Math.log10(Math.max(memberCount, 5));
  const progress = (scaledMembers - minMembers) / (maxMembers - minMembers);

  return Math.round(100 - progress * 70);
}

function activityPhaseIdForProject(projectMode: ProjectMode) {
  return isPersonalServiceProject(projectMode) ? 'phase-1' : 'phase-5';
}

function revertableProjectPhaseIds(
  projectMode: ProjectMode,
  currentPhaseId: ProjectLifecyclePhaseId
) {
  if (projectMode === 'personal-service') {
    return [] as Array<Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>>;
  }

  if (currentPhaseId === 'phase-3') {
    return ['phase-2'] as Array<Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>>;
  }

  if (currentPhaseId === 'phase-5' || currentPhaseId === 'phase-6') {
    return ['phase-2', 'phase-3'] as Array<Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>>;
  }

  return [] as Array<Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>>;
}

function buildProjectLifecycleNotes(
  projectMode: ProjectMode,
  quorumThresholdPercent: number,
  requestSystemEnabled: boolean
) {
  if (projectMode === 'personal-service') {
    return [
      {
        title: 'Direct scheduling',
        body: 'Personal services skip planning and quorum. The creator schedules activity directly and handles incoming requests.'
      },
      {
        title: 'Requests stay open',
        body: 'Requests are open by default for personal services so people can ask for help without waiting for a planning cycle.'
      }
    ];
  }

  return [
    {
      title: 'Values carry forward',
      body: 'Values added in Phase 1 stay visible and should be referenced again when members judge later plans.'
    },
    {
      title: 'Demand signalling stays open',
      body: 'Members can keep expressing demand and interest throughout the full lifecycle, not just during proposal.'
    },
    {
      title: `Current quorum: ${quorumThresholdPercent}%`,
      body: `This mock rule starts at 100% for projects with 5 members or fewer and eases toward 30% as groups approach 1000 members. The project group should eventually be able to tune it.`
    },
    ...(projectMode === 'collective-service'
      ? [
          {
            title: requestSystemEnabled ? 'Requests are enabled' : 'Requests are optional',
            body: requestSystemEnabled
              ? 'The current access plan enabled service requests, so users can keep adding requests during active service.'
              : 'Collective service requests stay off until an access plan explicitly enables them.'
          }
        ]
      : [])
  ];
}

function buildProjectLifecycle(
  slug: string,
  projectMode: ProjectMode,
  memberCount: number
): ProjectLifecycleData {
  const config = projectLifecycleBySlug[slug] ?? projectLifecycleBySlug['neighborhood-heat-pump-pilot'];
  const workflow = readProjectWorkflowState(slug);
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];
  const viewerIsMember = !!viewer && memberIds.includes(viewer.id);
  const phaseBlueprints = projectLifecyclePhaseBlueprintsForMode(projectMode);
  const supportsDemandSignals = supportsProjectDemandSignals(projectMode);
  const supportsPlanning = supportsProjectPlanning(projectMode);
  const values = buildProjectValues(slug);
  const quorumThresholdPercent = supportsPlanning ? calculateProjectQuorumThreshold(memberCount) : 0;
  const memberState = buildProjectMemberState(slug);
  const phaseTwo = supportsPlanning
    ? buildProductionPlans(slug, values, quorumThresholdPercent, memberCount)
    : { plans: [] as ProjectProductionPlan[], winningPlanId: null as string | null };
  const phaseThree = supportsPlanning
    ? buildDistributionPlans(slug, values, quorumThresholdPercent, memberCount)
    : { plans: [] as ProjectDistributionPlan[], winningPlanId: null as string | null };
  const normalizedCurrentPhaseId = (() => {
    if (projectMode === 'personal-service') {
      return config.currentPhaseId;
    }

    if (values.length === 0) {
      return 'phase-1' as ProjectLifecyclePhaseId;
    }

    if (
      ['phase-3', 'phase-4', 'phase-5', 'phase-6'].includes(config.currentPhaseId) &&
      !phaseTwo.winningPlanId
    ) {
      return 'phase-2' as ProjectLifecyclePhaseId;
    }

    if (['phase-5', 'phase-6'].includes(config.currentPhaseId) && !phaseThree.winningPlanId) {
      return 'phase-3' as ProjectLifecyclePhaseId;
    }

    return config.currentPhaseId;
  })();
  config.currentPhaseId = normalizedCurrentPhaseId;
  const currentPhaseOrder =
    phaseBlueprints.find((phase) => phase.id === config.currentPhaseId)?.order ?? 1;
  const nextPhaseId = nextProjectPhaseId(config.currentPhaseId, projectMode);
  const selectablePlanPhases = buildSelectableActivityPlanPhases(phaseTwo, phaseThree);
  const phaseFiveActivities = buildProjectActivities(slug, selectablePlanPhases);
  const activityPhaseId = activityPhaseIdForProject(projectMode);
  const activeAccessPlan = phaseThree.plans.find((plan) => plan.id === phaseThree.winningPlanId);
  const requestSystemEnabled =
    projectMode === 'personal-service'
      ? true
      : projectMode === 'collective-service'
        ? activeAccessPlan?.requestSystemEnabled ?? false
        : false;
  const requestSystem =
    projectMode === 'productive'
      ? null
      : buildProjectServiceRequestState(
          slug,
          requestSystemEnabled,
          requestSystemEnabled && !!viewer && config.currentPhaseId === activityPhaseId,
          requestSystemEnabled && memberState.viewerIsProjectManager
        );
  const personalService =
    projectMode === 'personal-service'
      ? {
          availabilitySummary:
            workflow?.availabilitySummary ??
            'The service creator will keep a direct availability schedule visible here.',
          travelRadiusLabel: workflow?.travelRadiusLabel
        }
      : null;
  const revertablePhaseIds = revertableProjectPhaseIds(projectMode, config.currentPhaseId);

  return {
    projectMode,
    supportsDemandSignals,
    supportsPlanning,
    currentPhaseId: config.currentPhaseId,
    quorumThresholdPercent,
    notes: buildProjectLifecycleNotes(projectMode, quorumThresholdPercent, requestSystemEnabled),
    viewerCanAdvancePhase: memberState.viewerIsProjectManager && !!nextPhaseId,
    nextPhaseId,
    nextPhaseLabel: nextPhaseId
      ? phaseBlueprints.find((phase) => phase.id === nextPhaseId)?.title ?? null
      : null,
    viewerCanRevertPhase: memberState.viewerIsProjectManager && revertablePhaseIds.length > 0,
    revertablePhaseIds,
    revertHistory: buildProjectRevertHistory(slug),
    requestSystem,
    personalService,
    phaseOne: {
      values,
      viewerCanSignalDemand: supportsDemandSignals && !!viewer,
      viewerHasDemandSignal: supportsDemandSignals && !!viewer && !!workflow?.signalUserIds.includes(viewer.id),
      viewerCanAddValue: supportsPlanning && viewerIsMember && config.currentPhaseId === 'phase-1',
      viewerCanVoteOnValues: supportsPlanning && viewerIsMember && config.currentPhaseId === 'phase-1',
      availabilitySummary: personalService?.availabilitySummary,
      travelRadiusLabel: personalService?.travelRadiusLabel
    },
    phaseTwo: {
      plans: phaseTwo.plans,
      winningPlanId: phaseTwo.winningPlanId,
      viewerCanSubmitPlans: supportsPlanning && viewerIsMember && config.currentPhaseId === 'phase-2',
      viewerCanVoteOnPlans: supportsPlanning && viewerIsMember && config.currentPhaseId === 'phase-2'
    },
    phaseThree: {
      plans: phaseThree.plans,
      winningPlanId: phaseThree.winningPlanId,
      viewerCanSubmitPlans: supportsPlanning && viewerIsMember && config.currentPhaseId === 'phase-3',
      viewerCanVoteOnPlans: supportsPlanning && viewerIsMember && config.currentPhaseId === 'phase-3',
      requestSystemEnabled
    },
    phaseFive: {
      activities: phaseFiveActivities,
      viewerCanCreateActivities: canViewerCreateProjectActivity(slug),
      selectablePlanPhases
    },
    phases: phaseBlueprints.map((phase) => {
      const phaseConfig = config.phases[phase.id];
      const progressState =
        phaseConfig?.betaLocked
          ? 'locked'
          : phase.id === config.currentPhaseId
            ? 'current'
            : phase.order < currentPhaseOrder
              ? 'complete'
              : 'upcoming';

      return {
        ...phase,
        progressState,
        betaLocked: phaseConfig?.betaLocked ?? false,
        projectStatus: phaseConfig?.projectStatus ?? phase.summary,
        note: phaseConfig?.note ?? phase.note
      };
    })
  };
}

const projectDetailExtras: Record<
  string,
  Pick<ProjectPageData, 'overview' | 'updates' | 'discussionNote' | 'discussion'>
> = {
  'neighborhood-heat-pump-pilot': {
    overview:
      'This project is still in demand signalling so the first pilot stays small, legible, and finishable. The goal is to keep labor needs, vendor questions, and likely building candidates visible in one place before planning hardens.',
    updates: [
      {
        id: 'project-update-heat-pump-1',
        title: 'First site walk proposed',
        body: 'Two neighbors offered to host a Saturday walkthrough so the pilot can scope electrical constraints before formal planning.',
        authorUsername: 'patchbay',
        createdAt: '2026-04-30T09:30:00Z'
      },
      {
        id: 'project-update-heat-pump-2',
        title: 'Vendor questions collected',
        body: 'The list now separates equipment availability, maintenance burden, and noise concerns so comparisons stay readable.',
        authorUsername: 'mika',
        createdAt: '2026-04-29T18:10:00Z'
      }
    ],
    discussionNote:
      'Project chat stays live here so planning notes, coordination, and quick follow-ups can move more like a working room than a forum thread.',
    discussion: []
  },
  'platform-release-governance-round': {
    overview:
      'This platform-tagged project keeps release planning public while still separating broader platform coordination from the main public feed.',
    updates: [
      {
        id: 'project-update-release-1',
        title: 'Accessibility fixes queued',
        body: 'Keyboard and focus passes were added to the next release gate before the shipping checklist closes.',
        authorUsername: 'mika',
        createdAt: '2026-04-30T10:10:00Z'
      }
    ],
    discussionNote:
      'This live project chat is where release blockers, moderation defaults, and quick coordination notes stay visible before the next ship date.',
    discussion: []
  },
  'community-fridge-restock-route': {
    overview:
      'This project is already past the core route design and is now focused on deciding how weekly fridge stock gets distributed across the neighborhood without losing clarity or fairness.',
    updates: [
      {
        id: 'project-update-fridge-1',
        title: 'Pickup windows narrowed',
        body: 'The draft distribution plan now uses one nearby pickup window and one overflow window so volunteers can predict the route more easily.',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-30T11:20:00Z'
      }
    ],
    discussionNote:
      'Project chat stays live here so route changes, pickup questions, and volunteer coordination feel like working notes instead of forum posts.',
    discussion: []
  },
  'repair-cafe-shift-grid': {
    overview:
      'This project is already in its activity phase, so the main work is no longer deciding what the repair cafe should be, but scheduling shifts that can actually run when the needed roles are covered.',
    updates: [
      {
        id: 'project-update-repair-1',
        title: 'Floor roles reopened',
        body: 'One queue-runner slot is still open for Thursday, so the next shift will only activate once that final role is filled.',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-30T13:05:00Z'
      }
    ],
    discussionNote:
      'This live project chat is where last-minute role swaps, intake questions, and workshop coordination stay visible.',
    discussion: []
  },
  'tool-library-blade-sharpening-service': {
    overview:
      'This project completed its pilot and converted into an ongoing service, so the page now acts more like an operating surface for the continuing sharpening workflow than a one-off proposal.',
    updates: [
      {
        id: 'project-update-sharpening-1',
        title: 'Recurring pickup window set',
        body: 'The converted service now uses the same pickup shelf each week so people can find completed tools without extra coordination overhead.',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-30T15:10:00Z'
      }
    ],
    discussionNote:
      'Service chat stays live here so intake notes, turnaround questions, and recurring workflow tweaks remain visible to the operating group.',
    discussion: []
  },
  'neighborhood-insulation-kit-round': {
    overview:
      'This productive project already completed demand ranking and is now deciding the final production model for the first insulation-kit round.',
    updates: [
      {
        id: 'project-update-insulation-1',
        title: 'Cut list template published',
        body: 'A shared cut-list template was added so every hallway team can prep kits in the same format.',
        authorUsername: 'patchbay',
        createdAt: '2026-04-30T16:20:00Z'
      }
    ],
    discussionNote:
      'Use this chat to keep production vote notes and prep details in one working room.',
    discussion: []
  },
  'community-solar-battery-share': {
    overview:
      'This productive project is in access planning, with members deciding reserve and overflow battery windows before scheduling begins.',
    updates: [
      {
        id: 'project-update-battery-1',
        title: 'Reserve policy draft posted',
        body: 'A reserve draft now holds one emergency slot per day before overflow windows open.',
        authorUsername: 'mika',
        createdAt: '2026-04-30T16:45:00Z'
      }
    ],
    discussionNote: 'Use chat to compare access options and edge cases before the distribution vote closes.',
    discussion: []
  },
  'hallway-air-sealing-build-day': {
    overview:
      'This productive project is in scheduling and only activates each build block when all listed roles are filled.',
    updates: [
      {
        id: 'project-update-airseal-1',
        title: 'Install role still open',
        body: 'One install slot remains unfilled, so the next build block has not activated yet.',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-30T17:05:00Z'
      }
    ],
    discussionNote: 'Use chat for role swaps, setup notes, and final activation checks.',
    discussion: []
  },
  'block-weatherization-pilot-wrap': {
    overview:
      'This productive pilot is complete and is now documenting completion notes and conversion options for the next cycle.',
    updates: [
      {
        id: 'project-update-weather-wrap-1',
        title: 'Completion notes posted',
        body: 'Final completion notes were posted with carry-forward items for a future neighborhood round.',
        authorUsername: 'mika',
        createdAt: '2026-04-30T17:30:00Z'
      }
    ],
    discussionNote: 'Use chat for completion review and conversion suggestions.',
    discussion: []
  },
  'mutual-aid-ride-request-desk': {
    overview:
      'This collective service is still in demand signalling and value ranking, prior to operations and access plan voting.',
    updates: [
      {
        id: 'project-update-ride-1',
        title: 'Demand pulse updated',
        body: 'Members logged another round of demand signals for school pickup and clinic routes.',
        authorUsername: 'quietember',
        createdAt: '2026-04-30T18:00:00Z'
      }
    ],
    discussionNote: 'Use chat to capture operating constraints before planning opens.',
    discussion: []
  },
  'patchbay-bike-light-tuneups': {
    overview:
      'This personal service is active and handles requests directly without collective planning phases.',
    updates: [
      {
        id: 'project-update-bike-light-1',
        title: 'Tuesday slots opened',
        body: 'Two evening slots opened for quick bike-light checks this week.',
        authorUsername: 'patchbay',
        createdAt: '2026-04-30T18:25:00Z'
      }
    ],
    discussionNote: 'Use chat to coordinate tuneup timing and request follow-ups.',
    discussion: []
  },
  'rowan-after-school-device-checks': {
    overview:
      'This personal service is complete and no longer running, but its request history remains visible for reference.',
    updates: [
      {
        id: 'project-update-device-checks-1',
        title: 'Service closed for season',
        body: 'The after-school support window closed after the final session and now shows as complete.',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-30T18:50:00Z'
      }
    ],
    discussionNote: 'Use chat for wrap-up notes and conversion ideas if this service returns.',
    discussion: []
  }
};

const threadDiscussionNotes: Record<string, string> = {
  'shared-laundry-repair-round':
    'Thread detail keeps discussion first without folding nearby context back into project logistics.',
  'should-platform-publish-weekly-release-notes':
    'Public governance threads should stay understandable without turning into announcement-only pages.'
};

const postDiscussionNotes: Record<string, string> = {
  'post-spare-filters':
    'Personal posts should still open into a real discussion surface so replies and follow-up notes stay visible instead of disappearing into the feed.',
  'post-rowan-checklist':
    'This post stays in the personal feed, but discussion still deserves the same threaded structure as public threads.',
  'post-mika-brief':
    'Short personal notes can still collect replies without pretending they belong in the public feed.'
};

const eventDetailExtras: Record<
  string,
  Pick<EventPageData, 'attendanceNote' | 'agenda' | 'updates' | 'discussionNote' | 'discussion'>
> = {
  'tool-library-spring-swap-social': {
    attendanceNote:
      'Standalone events stay light-weight: clear purpose, visible tags, and social coordination without pretending every gathering is a long-running project.',
    agenda: [
      'Open the swap table and shared snack spread.',
      'Collect summer volunteer signups and repair requests.',
      'Close with a short round of repair stories and next-step intros.'
    ],
    updates: [
      {
        id: 'event-update-swap-1',
        title: 'Welcome table pinned',
        body: 'The welcome table, swap table, and snack table are now mapped to the courtyard entrance so late arrivals can orient quickly.',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-30T12:15:00Z'
      }
    ],
    discussionNote:
      'Event chat stays live here so logistics, reminders, and quick coordination notes feel immediate instead of forum-like.',
    discussion: []
  },
  'retrofit-night-walk': {
    attendanceNote:
      'Private events stay useful when they can still carry discussion, attendance, and small planning notes without becoming a separate project surface.',
    agenda: [
      'Walk the first retrofit cluster.',
      'Flag access and wiring constraints.',
      'Confirm which buildings are ready for the first pilot round.'
    ],
    updates: [
      {
        id: 'event-update-walk-1',
        title: 'Starting corner confirmed',
        body: 'The invite list will meet at the east corner first so access notes can be captured before the light drops.',
        authorUsername: 'mika',
        createdAt: '2026-04-30T08:40:00Z'
      }
    ],
    discussionNote:
      'Private event chat stays live here so access details and follow-up questions remain inside the invited group without turning into a public thread.',
    discussion: []
  }
};

const eventParticipationById: Record<string, { goingUserIds: string[]; invitedUserIds: string[] }> = {
  'event-tool-audit': {
    goingUserIds: ['viewer-1', 'user-tool', 'user-rowan'],
    invitedUserIds: ['user-mika']
  },
  'event-retrofit-walk': {
    goingUserIds: ['user-mika', 'user-rowan'],
    invitedUserIds: ['viewer-1', 'user-ember']
  }
};

const voteState = new Map<string, { voteCount: number; activeVote: VoteDirection }>();
const confidenceState = new Map<string, { upVotes: number; downVotes: number; activeVote: VoteDirection }>();

function seedVoteTarget(id: string, voteCount: number, activeVote: VoteDirection) {
  voteState.set(id, { voteCount, activeVote });
}

function seedConfidenceTarget(
  id: string,
  upVotes: number,
  downVotes: number,
  activeVote: VoteDirection
) {
  confidenceState.set(id, { upVotes, downVotes, activeVote });
  seedVoteTarget(id, upVotes - downVotes, activeVote);
}

for (const item of publicFeedBase) {
  seedVoteTarget(item.id, item.voteCount, item.activeVote);
}

for (const post of socialPostsBase) {
  seedVoteTarget(post.voteTargetId, post.voteCount, post.activeVote);
}

const scopeConfidenceSeeds: Record<
  string,
  { upVotes: number; downVotes: number; activeVote: VoteDirection }
> = {
  'confidence-channel-housing-build-user-mika': { upVotes: 18, downVotes: 4, activeVote: 0 },
  'confidence-channel-housing-build-user-ember': { upVotes: 15, downVotes: 5, activeVote: 1 },
  'confidence-channel-mutual-aid-user-tool': { upVotes: 20, downVotes: 6, activeVote: 0 },
  'confidence-channel-mutual-aid-viewer-1': { upVotes: 16, downVotes: 4, activeVote: 1 },
  'confidence-community-east-market-user-mika': { upVotes: 19, downVotes: 4, activeVote: 0 },
  'confidence-community-east-market-user-ember': { upVotes: 14, downVotes: 5, activeVote: 0 },
  'confidence-community-tool-library-user-tool': { upVotes: 17, downVotes: 4, activeVote: 1 },
  'confidence-community-tool-library-user-rowan': { upVotes: 15, downVotes: 5, activeVote: 0 },
  'confidence-stewardship-user-mika': { upVotes: 21, downVotes: 5, activeVote: 1 },
  'confidence-stewardship-user-ember': { upVotes: 17, downVotes: 6, activeVote: 0 }
};

const projectManagerConfidenceSeeds: Record<
  string,
  { upVotes: number; downVotes: number; activeVote: VoteDirection }
> = {
  'confidence-project-manager-neighborhood-heat-pump-pilot-user-rowan': {
    upVotes: 16,
    downVotes: 4,
    activeVote: 0
  },
  'confidence-project-manager-platform-release-governance-round-user-mika': {
    upVotes: 18,
    downVotes: 5,
    activeVote: 1
  },
  'confidence-project-manager-platform-release-governance-round-user-ember': {
    upVotes: 15,
    downVotes: 6,
    activeVote: 0
  }
};

for (const [targetId, seed] of Object.entries(scopeConfidenceSeeds)) {
  seedConfidenceTarget(targetId, seed.upVotes, seed.downVotes, seed.activeVote);
}

for (const [targetId, seed] of Object.entries(projectManagerConfidenceSeeds)) {
  seedConfidenceTarget(targetId, seed.upVotes, seed.downVotes, seed.activeVote);
}

const commentsBySubjectId: Record<string, DetailComment[]> = {
  'project-heat-pump': [
    {
      id: 'comment-project-heat-pump-1',
      authorUsername: 'rowanloop',
      body: 'Keep the first pilot on one side of the block so we can finish a real round instead of spreading people thin.',
      createdAt: '2026-04-30T07:42:00Z',
      voteCount: 16,
      activeVote: 0,
      replies: [
        {
          id: 'comment-project-heat-pump-1a',
          authorUsername: 'patchbay',
          body: 'Agreed. I would rather finish one building cleanly than half-scope three at once.',
          createdAt: '2026-04-30T08:04:00Z',
          voteCount: 9,
          activeVote: 1,
          replies: []
        }
      ]
    },
    {
      id: 'comment-project-heat-pump-2',
      authorUsername: 'mika',
      body: 'I added a shorter vendor questionnaire so people can compare answers without reading three separate threads.',
      createdAt: '2026-04-29T18:16:00Z',
      voteCount: 7,
      activeVote: 0,
      replies: []
    }
  ],
  'project-release-governance': [
    {
      id: 'comment-project-release-1',
      authorUsername: 'quietember',
      body: 'The release note should link to the exact work surfaces instead of trying to summarize every change in prose.',
      createdAt: '2026-04-30T10:18:00Z',
      voteCount: 6,
      activeVote: 0,
      replies: [
        {
          id: 'comment-project-release-1a',
          authorUsername: 'patchbay',
          body: 'Yes. Short note on top, detailed links underneath, and the rest can stay in the project tabs.',
          createdAt: '2026-04-30T10:31:00Z',
          voteCount: 5,
          activeVote: 0,
          replies: []
        }
      ]
    }
  ],
  'thread-shared-laundry': [
    {
      id: 'comment-thread-shared-1',
      authorUsername: 'patchbay',
      body: 'I would start in one building first. Finishing a tight round gives us clearer estimates than scattering labor too early.',
      createdAt: '2026-04-30T08:02:00Z',
      voteCount: 14,
      activeVote: 0,
      replies: [
        {
          id: 'comment-thread-shared-1a',
          authorUsername: 'rowanloop',
          body: 'That also keeps the parts list honest. We only learn the gaps once one room is actually finished.',
          createdAt: '2026-04-30T08:18:00Z',
          voteCount: 8,
          activeVote: 0,
          replies: [
            {
              id: 'comment-thread-shared-1b',
              authorUsername: 'toolorbit',
              body: 'If the first room is tight enough, I can bring the charger bench and spare kits without turning the night into a full inventory move.',
              createdAt: '2026-04-30T08:36:00Z',
              voteCount: 5,
              activeVote: 0,
              replies: []
            }
          ]
        }
      ]
    },
    {
      id: 'comment-thread-shared-2',
      authorUsername: 'mika',
      body: 'We should post the one-building option and the wider-block option side by side so people can compare labor assumptions directly.',
      createdAt: '2026-04-30T10:42:00Z',
      voteCount: 4,
      activeVote: 0,
      replies: []
    }
  ],
  'thread-release-notes': [
    {
      id: 'comment-thread-release-1',
      authorUsername: 'patchbay',
      body: 'A short weekly note is enough if it links outward. The note should orient people, not replace the actual work surfaces.',
      createdAt: '2026-04-30T11:05:00Z',
      voteCount: 6,
      activeVote: 0,
      replies: []
    }
  ],
  'event-tool-audit': [
    {
      id: 'comment-event-audit-1',
      authorUsername: 'toolorbit',
      body: 'Bring a snack if you can. We are saving one table for swaps, repair stories, and summer signups.',
      createdAt: '2026-04-29T20:32:00Z',
      voteCount: 5,
      activeVote: 0,
      replies: [
        {
          id: 'comment-event-audit-1a',
          authorUsername: 'patchbay',
          body: 'I can bring tea and a folding card for the swap table.',
          createdAt: '2026-04-29T20:41:00Z',
          voteCount: 3,
          activeVote: 0,
          replies: []
        }
      ]
    }
  ],
  'event-retrofit-walk': [
    {
      id: 'comment-event-walk-1',
      authorUsername: 'mika',
      body: 'This one stays private because two buildings only want the walkthrough if the first note pass stays within the invite list.',
      createdAt: '2026-04-30T08:52:00Z',
      voteCount: 2,
      activeVote: 0,
      replies: []
    }
  ],
  'post-spare-filters': [
    {
      id: 'comment-post-filters-1',
      authorUsername: 'rowanloop',
      body: 'I can take two of them for the Saturday walkthrough if nobody needs them earlier in the week.',
      createdAt: '2026-04-30T08:24:00Z',
      voteCount: 5,
      activeVote: 0,
      replies: [
        {
          id: 'comment-post-filters-1a',
          authorUsername: 'patchbay',
          body: 'That works. I will bring the rest in case the first building wants to swap all six at once.',
          createdAt: '2026-04-30T08:41:00Z',
          voteCount: 3,
          activeVote: 0,
          replies: []
        }
      ]
    },
    {
      id: 'comment-post-filters-2',
      authorUsername: 'toolorbit',
      body: 'If there are extras after Saturday, keep two at the tool library intake desk so people stop improvising with mismatched sizes.',
      createdAt: '2026-04-30T09:02:00Z',
      voteCount: 4,
      activeVote: 0,
      replies: []
    }
  ],
  'post-rowan-checklist': [
    {
      id: 'comment-post-checklist-1',
      authorUsername: 'patchbay',
      body: 'The shorter list is much better. People can actually scan it while carrying tools now.',
      createdAt: '2026-04-29T18:49:00Z',
      voteCount: 4,
      activeVote: 0,
      replies: []
    },
    {
      id: 'comment-post-checklist-2',
      authorUsername: 'mika',
      body: 'Can you pin the breaker note near the top so nobody misses it on mobile?',
      createdAt: '2026-04-29T19:04:00Z',
      voteCount: 2,
      activeVote: 0,
      replies: []
    }
  ],
  'post-mika-brief': [
    {
      id: 'comment-post-brief-1',
      authorUsername: 'quietember',
      body: 'Short note on top and linked work surfaces underneath would make the release rhythm much easier to follow.',
      createdAt: '2026-04-29T15:26:00Z',
      voteCount: 3,
      activeVote: 0,
      replies: []
    }
  ]
};

function seedCommentVotes(comments: DetailComment[]) {
  for (const comment of comments) {
    seedVoteTarget(comment.id, comment.voteCount, comment.activeVote);
    seedCommentVotes(comment.replies);
  }
}

for (const comments of Object.values(commentsBySubjectId)) {
  seedCommentVotes(comments);
}

const notificationsState: NotificationsPageData['items'] = currentViewer()
  ? [
      {
        id: 'notification-post-filters',
        kind: 'reply',
        surface: 'personal',
        subjectKind: 'post',
        actorUsername: 'rowanloop',
        actionLabel: 'Commented',
        title: '',
        body: 'I can take two of them for the Saturday walkthrough if nobody needs them earlier in the week.',
        href: buildCommentHref('/posts/post-spare-filters', 'comment-post-filters-1'),
        createdAt: '2026-04-30T08:24:00Z',
        isUnread: true,
        channelTags: [],
        communityTags: []
      },
      {
        id: 'notification-project-heat-pump',
        kind: 'project',
        surface: 'public',
        subjectKind: 'project',
        projectMode: 'productive',
        title: 'Neighborhood Heat Pump Pilot posted an update',
        body: 'The first site walk is now pinned and the vendor questions were condensed into one checklist.',
        href: buildUpdateHref('/projects/neighborhood-heat-pump-pilot', 'project-update-heat-pump-1'),
        createdAt: '2026-04-30T09:25:00Z',
        isUnread: true,
        channelTags: [housingBuild],
        communityTags: [eastMarket]
      },
      {
        id: 'notification-project-release',
        kind: 'project',
        surface: 'public',
        subjectKind: 'project',
        projectMode: 'collective-service',
        title: 'Platform Release Governance Round moved forward',
        body: 'The accessibility pass is queued and the release note draft now points to the live work tabs.',
        href: buildUpdateHref('/projects/platform-release-governance-round', 'project-update-release-1'),
        createdAt: '2026-04-30T10:10:00Z',
        isUnread: true,
        channelTags: [platform],
        communityTags: []
      },
      {
        id: 'notification-event-audit',
        kind: 'event',
        surface: 'public',
        subjectKind: 'event',
        title: 'Reminder: Tool Library Spring Swap Social',
        body: 'You are marked as going, and toolorbit confirmed the snack table and swap table are set.',
        href: '/events/tool-library-spring-swap-social',
        createdAt: '2026-04-29T21:10:00Z',
        isUnread: false,
        channelTags: [mutualAid],
        communityTags: [toolLibrary]
      },
      {
        id: 'notification-event-walk',
        kind: 'event',
        surface: 'public',
        subjectKind: 'event',
        title: 'You were invited to Retrofit Night Walk',
        body: 'mika added you to the invite list for the private block walkthrough on Saturday evening.',
        href: '/events/retrofit-night-walk',
        createdAt: '2026-04-30T08:40:00Z',
        isUnread: true,
        channelTags: [housingBuild],
        communityTags: [eastMarket]
      }
    ]
  : [];

const readNotificationHrefs = new Set<string>();

const messageThreadsState: MessageThread[] = currentViewer()
  ? [
      {
        id: 'dm-rowan',
        participant: userById('user-rowan') ?? patchbayUser,
        preview: 'Can you sanity-check the laundry-room parts list before I post it publicly?',
        lastMessageAt: '2026-04-30T09:18:00Z',
        unreadCount: 1,
        messages: [
          {
            id: 'dm-rowan-1',
            sender: userById('user-rowan') ?? patchbayUser,
            body: 'Can you sanity-check the laundry-room parts list before I post it publicly?',
            createdAt: '2026-04-30T09:12:00Z',
            isOwn: false
          },
          {
            id: 'dm-rowan-2',
            sender: activeViewer(),
            body: 'Yes. I can check the item names and the rough labor notes before noon.',
            createdAt: '2026-04-30T09:18:00Z',
            isOwn: true
          }
        ]
      },
      {
        id: 'dm-toolorbit',
        participant: userById('user-tool') ?? patchbayUser,
        preview: 'Audit night still needs one more person on chargers.',
        lastMessageAt: '2026-04-29T21:04:00Z',
        unreadCount: 0,
        messages: [
          {
            id: 'dm-toolorbit-1',
            sender: userById('user-tool') ?? patchbayUser,
            body: 'Audit night still needs one more person on chargers.',
            createdAt: '2026-04-29T20:58:00Z',
            isOwn: false
          },
          {
            id: 'dm-toolorbit-2',
            sender: activeViewer(),
            body: 'I can cover chargers if the intake desk is already staffed.',
            createdAt: '2026-04-29T21:04:00Z',
            isOwn: true
          }
        ]
      }
    ]
  : [];

function buildSuggestedMessageContacts(viewerId: string) {
  const relatedIds = new Set([...followingIdsFor(viewerId), ...followerIdsFor(viewerId)]);
  relatedIds.delete(viewerId);

  return Array.from(relatedIds)
    .map((userId) => userById(userId))
    .filter((user): user is ViewerSummary => !!user)
    .sort((left, right) => left.username.localeCompare(right.username));
}

function moveMessageThreadToFront(threadId: string) {
  const threadIndex = messageThreadsState.findIndex((item) => item.id === threadId);

  if (threadIndex <= 0) {
    return;
  }

  const [thread] = messageThreadsState.splice(threadIndex, 1);
  messageThreadsState.unshift(thread);
}

function formatMetaFromTags(tags: TagRef[]) {
  return tags.map((tag) => tag.label).join(' · ');
}

function readConfidenceTarget(targetId: string) {
  return confidenceState.get(targetId) ?? null;
}

function buildConfidenceFields(confidenceTargetId?: string) {
  const confidence = confidenceTargetId ? readConfidenceTarget(confidenceTargetId) : null;
  const reviewCount = confidence ? confidence.upVotes + confidence.downVotes : undefined;
  const confidenceRatio = confidence && reviewCount ? Math.round((confidence.upVotes / reviewCount) * 100) : undefined;

  return {
    confidenceTargetId,
    confidenceVoteCount: confidence ? confidence.upVotes - confidence.downVotes : undefined,
    confidenceActiveVote: confidence?.activeVote,
    confidenceRatio,
    confidenceReviewCount: reviewCount
  };
}

function toScopeMember(userId: string, confidenceTargetId?: string): ScopeMemberSummary {
  const user = userById(userId) ?? patchbayUser;

  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    ...buildConfidenceFields(confidenceTargetId)
  };
}

function toDetailMember(userId: string): DetailMember {
  const user = userById(userId) ?? patchbayUser;

  return {
    id: user.id,
    username: user.username,
    bio: user.bio
  };
}

function toProjectRoleMember(
  userId: string,
  confidenceTargetId?: string,
  isManagerCandidate = false
): ProjectRoleMember {
  const user = userById(userId) ?? patchbayUser;

  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    isManagerCandidate,
    ...buildConfidenceFields(confidenceTargetId)
  };
}

function buildCommentHref(href: string, commentId: string) {
  const url = new URL(href, 'https://socialproduction.local');

  if (url.pathname.startsWith('/projects/')) {
    url.searchParams.set('tab', 'chat');
  }

  url.searchParams.set('comment', commentId);
  url.hash = `comment-${commentId}`;

  return `${url.pathname}${url.search}${url.hash}`;
}

function buildUpdateHref(href: string, updateId: string) {
  return `${href}?update=${updateId}#update-${updateId}`;
}

function latestProjectUpdateForSlug(slug: string): DetailUpdate | null {
  return projectDetailExtras[slug]?.updates[0] ?? null;
}

function latestEventUpdateForSlug(slug: string): DetailUpdate | null {
  return eventDetailExtras[slug]?.updates[0] ?? null;
}

function newestTimestamp(...values: Array<string | null | undefined>) {
  let latest: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) {
      continue;
    }

    const candidateTime = new Date(value).getTime();

    if (Number.isNaN(candidateTime) || candidateTime <= latestTime) {
      continue;
    }

    latest = value;
    latestTime = candidateTime;
  }

  return latest;
}

function latestCommentTimestamp(comments: DetailComment[]): string | null {
  return comments.reduce<string | null>((latest, comment) => {
    const nestedLatest = latestCommentTimestamp(comment.replies);
    return newestTimestamp(latest, comment.createdAt, nestedLatest);
  }, null);
}

function meetsConfidenceThreshold(confidenceRatio?: number, reviewCount?: number) {
  return !!reviewCount && (confidenceRatio ?? 0) >= 70;
}

function countComments(comments: DetailComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}

function buildUnreadCounts() {
  if (!currentViewer()) {
    return {
      notifications: 0,
      messages: 0
    };
  }

  const notificationItems = buildNotificationsFixture()?.items ?? notificationsState;

  return {
    notifications: notificationItems.filter((item) => item.isUnread).length,
    messages: messageThreadsState.reduce((sum, thread) => sum + thread.unreadCount, 0)
  };
}

function readVoteTarget(id: string, fallbackCount: number, fallbackVote: VoteDirection) {
  return voteState.get(id) ?? {
    voteCount: fallbackCount,
    activeVote: fallbackVote
  };
}

function buildPublicFeedFixture(): PublicFeedItem[] {
  return publicFeedBase.map((item) => {
    const vote = readVoteTarget(item.id, item.voteCount, item.activeVote);
    const commentCount = countComments(commentsBySubjectId[item.id] ?? []);

    if (item.kind === 'project') {
      const overview = projectDetailExtras[item.slug]?.overview ?? item.summary;
      const workflow = readProjectWorkflowState(item.slug);
      const latestUpdate = latestProjectUpdateForSlug(item.slug);
      const memberCount = projectMembersBySlug[item.slug]?.length ?? item.memberCount;
      const latestUpdateAt = latestUpdate?.createdAt ?? null;
      const lastActivityAt =
        newestTimestamp(item.createdAt, item.lastActivityAt, latestUpdateAt) ??
        item.lastActivityAt;

      return {
        ...item,
        summary: summarizeProjectCardCopy(overview, 124),
        latestDescription: latestUpdate ? summarizeProjectCardCopy(latestUpdate.body, 92) : undefined,
        stage: stageLabelForProject(item.slug, item.stage, item.projectMode),
        voteCount: vote.voteCount,
        activeVote: vote.activeVote,
        commentCount,
        signalCount: workflow?.signalCount ?? item.signalCount,
        memberCount,
        lastActivityAt
      } satisfies PublicProjectItem;
    }

    if (item.kind === 'event') {
      const participation = eventParticipationById[item.id];
      const latestUpdateAt = latestEventUpdateForSlug(item.slug)?.createdAt ?? null;
      const lastActivityAt =
        newestTimestamp(item.createdAt, item.lastActivityAt, latestUpdateAt) ?? item.lastActivityAt;

      return {
        ...item,
        voteCount: vote.voteCount,
        activeVote: vote.activeVote,
        commentCount,
        goingCount: participation?.goingUserIds.length ?? item.goingCount,
        lastActivityAt
      } satisfies PublicEventItem;
    }

    return {
      ...item,
      voteCount: vote.voteCount,
      activeVote: vote.activeVote,
      commentCount,
      lastActivityAt: item.createdAt
    } satisfies PublicThreadItem;
  });
}

function buildPublicActivityItem(item: PublicFeedItem): PersonalFeedItem {
  const authorUsername =
    item.kind === 'project'
      ? item.authorUsername
      : item.kind === 'thread'
        ? item.authorUsername
        : item.createdByUsername;
  const author = userByUsername(authorUsername) ?? patchbayUser;
  const latestUpdate =
    item.kind === 'project'
      ? latestProjectUpdateForSlug(item.slug)
      : item.kind === 'event'
        ? latestEventUpdateForSlug(item.slug)
        : null;
  const isUpdated =
    !!latestUpdate && new Date(item.lastActivityAt).getTime() > new Date(item.createdAt).getTime();

  return {
    kind: 'activity',
    id: `activity-${item.id}`,
    subjectId: item.id,
    href: isUpdated && latestUpdate ? buildUpdateHref(item.href, latestUpdate.id) : item.href,
    author,
    actionLabel: isUpdated ? 'Updated' : 'Created',
    subjectKind: item.kind,
    subjectProjectMode: item.kind === 'project' ? item.projectMode : undefined,
    title: item.title,
    body:
      isUpdated && latestUpdate
        ? latestUpdate.body
        : item.kind === 'project'
          ? item.summary
          : item.kind === 'thread'
            ? item.body
            : item.description,
    meta:
      item.kind === 'project'
        ? isUpdated && latestUpdate
          ? latestUpdate.title
          : `${item.stage} · ${item.locationLabel}`
        : item.kind === 'thread'
          ? formatMetaFromTags([...item.channelTags, ...item.communityTags])
          : isUpdated && latestUpdate
            ? latestUpdate.title
            : item.locationLabel,
    voteCount: item.voteCount,
    activeVote: item.activeVote,
    commentCount: item.commentCount,
    createdAt: isUpdated && latestUpdate ? latestUpdate.createdAt : item.createdAt,
    channelTags: item.channelTags,
    communityTags: item.communityTags
  };
}

function findCommentById(comments: DetailComment[], commentId: string): DetailComment | null {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }

    const nestedComment = findCommentById(comment.replies, commentId);

    if (nestedComment) {
      return nestedComment;
    }
  }

  return null;
}

function buildPublicCommentActivities(publicFeed: PublicFeedItem[]) {
  const activities: PersonalFeedItem[] = [];

  for (const seed of publicCommentActivitySeeds) {
    const subject = publicFeed.find((item) => item.id === seed.subjectId);
    const comment = findCommentById(commentsBySubjectId[seed.subjectId] ?? [], seed.commentId);

    if (!subject || !comment || subject.kind === 'event') {
      continue;
    }

    const author = userByUsername(comment.authorUsername) ?? patchbayUser;
    activities.push({
      kind: 'activity',
      id: seed.id,
      subjectId: subject.id,
      href: `${subject.href}?comment=${comment.id}#comment-${comment.id}`,
      author,
      actionLabel: 'Commented on',
      subjectKind: subject.kind,
      title: subject.title,
      body: comment.body,
      meta:
        subject.kind === 'project'
          ? `${subject.stage} · ${subject.locationLabel}`
          : formatMetaFromTags([...subject.channelTags, ...subject.communityTags]),
      voteCount: subject.voteCount,
      activeVote: subject.activeVote,
      commentCount: countComments(commentsBySubjectId[seed.subjectId] ?? []),
      createdAt: comment.createdAt,
      channelTags: subject.channelTags,
      communityTags: subject.communityTags
    } satisfies PersonalFeedItem);
  }

  return activities;
}

function buildSocialPostItem(post: PersonalPostItem): PersonalPostItem {
  const vote = readVoteTarget(post.voteTargetId, post.voteCount, post.activeVote);
  const commentCount = countComments(commentsBySubjectId[post.id] ?? []);

  return {
    ...post,
    voteCount: vote.voteCount,
    commentCount
  } satisfies PersonalPostItem;
}

function buildSocialPostsForUser(profileUserId: string) {
  const canSeePersonalFeed = viewerCanSeePersonalFeed(profileUserId);
  const canSeeFollowersOnly = viewerCanSeeFollowersPosts(profileUserId);

  return socialPostsBase
    .filter((post) => {
      if (post.author.id !== profileUserId) {
        return false;
      }

      return post.audience === 'public' ? canSeePersonalFeed : canSeeFollowersOnly;
    })
    .map(buildSocialPostItem);
}

function buildProfileFeed(profileUserId: string): PersonalFeedItem[] {
  const publicFeed = buildPublicFeedFixture();
  const publicActivities = publicFeed
    .filter((item) => {
      if (item.kind === 'project') {
        return userByUsername(item.authorUsername)?.id === profileUserId;
      }

      if (item.kind === 'thread') {
        return userByUsername(item.authorUsername)?.id === profileUserId;
      }

      return userByUsername(item.createdByUsername)?.id === profileUserId;
    })
    .map(buildPublicActivityItem);
  const commentActivities = buildPublicCommentActivities(publicFeed).filter(
    (item) => item.author.id === profileUserId
  );

  const followerPosts = buildSocialPostsForUser(profileUserId);

  return [...followerPosts, ...publicActivities, ...commentActivities].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
}

function buildPersonalFeedFixture(): PersonalFeedItem[] {
  const viewer = currentViewer();

  if (!viewer) {
    return [];
  }

  const followedIds = new Set([viewer.id, ...followingIdsFor(viewer.id)]);
  const publicFeed = buildPublicFeedFixture();
  const publicActivities = publicFeed
    .filter((item) => {
      const authorId =
        item.kind === 'project'
          ? userByUsername(item.authorUsername)?.id ?? ''
          : item.kind === 'thread'
            ? userByUsername(item.authorUsername)?.id ?? ''
            : userByUsername(item.createdByUsername)?.id ?? '';

      if (!authorId || shouldHidePublicActivityFromPersonalFeeds(authorId)) {
        return false;
      }

      return followedIds.has(authorId);
    })
    .map(buildPublicActivityItem);
  const commentActivities = buildPublicCommentActivities(publicFeed).filter(
    (item) => followedIds.has(item.author.id) && !shouldHidePublicActivityFromPersonalFeeds(item.author.id)
  );

  const followerPosts = socialPostsBase
    .filter((post) => followedIds.has(post.author.id))
    .map(buildSocialPostItem);

  return [...followerPosts, ...publicActivities, ...commentActivities].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
}

function filterByTag(items: PublicFeedItem[], slug: string, kind: TagRef['kind']) {
  return items.filter((item) => {
    const tags = kind === 'channel' ? item.channelTags : item.communityTags;
    return tags.some((tag) => tag.slug === slug);
  });
}

function scopeMembershipKey(kind: ScopeKind, slug: string) {
  return `${kind}:${slug}`;
}

function readScopeMembership(kind: ScopeKind, slug: string): ScopeMembershipConfig {
  return (
    scopeMembershipByKey[scopeMembershipKey(kind, slug)] ?? {
      memberIds: [],
      joinPolicy: 'open'
    }
  );
}

function buildScopeMembers(kind: ScopeKind, slug: string) {
  return readScopeMembership(kind, slug).memberIds.map((userId) => toScopeMember(userId));
}

function scopePath(kind: ScopeKind, slug: string) {
  if (kind === 'platform') {
    return '/platform';
  }

  return kind === 'channel' ? `/channels/${slug}` : `/communities/${slug}`;
}

function buildScopeInviteLink(kind: ScopeKind, slug: string, inviteToken: string) {
  return `${scopePath(kind, slug)}?invite=${encodeURIComponent(inviteToken)}`;
}

function buildScopeMembershipState(kind: ScopeKind, slug: string): ScopeMembershipState {
  const viewer = currentViewer();
  const membership = readScopeMembership(kind, slug);
  const viewerIsMember = !!viewer && membership.memberIds.includes(viewer.id);
  const viewerCanToggleMembership = membership.joinPolicy === 'open' || viewerIsMember;

  return {
    memberCount: membership.memberIds.length,
    viewerIsMember,
    viewerCanToggleMembership,
    joinPolicy: membership.joinPolicy,
    viewerCanSeeFeed: membership.joinPolicy === 'open' || viewerIsMember,
    hiddenFeedCopy: membership.hiddenFeedCopy,
    inviteLink:
      membership.joinPolicy === 'invite_only' && viewerIsMember && membership.inviteToken
        ? buildScopeInviteLink(kind, slug, membership.inviteToken)
        : undefined
  };
}

function buildProjectMemberState(slug: string) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];
  const managerConfig = projectManagersBySlug[slug] ?? {
    managerIds: [],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  };
  const explicitManagerIds = managerConfig.managerIds.filter((userId) => memberIds.includes(userId));
  const candidateIds = managerConfig.candidateIds.filter(
    (userId) => memberIds.includes(userId) && !explicitManagerIds.includes(userId)
  );
  const thresholdManagers = candidateIds
    .map((userId) =>
      toProjectRoleMember(userId, managerConfig.confidenceTargetIdsByUserId[userId], true)
    )
    .filter((member) =>
      meetsConfidenceThreshold(member.confidenceRatio, member.confidenceReviewCount)
    );
  const managerIds = new Set([...explicitManagerIds, ...thresholdManagers.map((member) => member.id)]);
  const projectManagers = [
    ...explicitManagerIds.map((userId) => toProjectRoleMember(userId)),
    ...thresholdManagers
  ];

  return {
    memberCount: memberIds.length,
    projectManagers,
    members: memberIds
      .filter((userId) => !managerIds.has(userId))
      .map((userId) =>
        toProjectRoleMember(
          userId,
          managerConfig.confidenceTargetIdsByUserId[userId],
          candidateIds.includes(userId)
        )
      ),
    viewerIsMember: !!viewer && memberIds.includes(viewer.id),
    viewerCanToggleMembership: !!viewer,
    viewerCanToggleManagerNomination: !!viewer && memberIds.includes(viewer.id),
    viewerIsManagerCandidate: !!viewer && candidateIds.includes(viewer.id),
    viewerIsProjectManager: !!viewer && managerIds.has(viewer.id)
  };
}

function buildEventMemberState(item: PublicEventItem) {
  const viewer = currentViewer();
  const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
  const participation =
    eventParticipationById[item.id] ??
    (eventParticipationById[item.id] = { goingUserIds: [], invitedUserIds: [] });
  const memberIds = Array.from(
    new Set([...(creatorId ? [creatorId] : []), ...participation.goingUserIds])
  );
  const managerConfig = eventManagersBySlug[item.slug] ?? {
    managerIds: creatorId ? [creatorId] : [],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  };
  const explicitManagerIds = managerConfig.managerIds.filter((userId) => memberIds.includes(userId));
  const candidateIds = managerConfig.candidateIds.filter(
    (userId) => memberIds.includes(userId) && !explicitManagerIds.includes(userId)
  );
  const thresholdManagers = candidateIds
    .map((userId) =>
      toProjectRoleMember(userId, managerConfig.confidenceTargetIdsByUserId[userId], true)
    )
    .filter((member) =>
      meetsConfidenceThreshold(member.confidenceRatio, member.confidenceReviewCount)
    );
  const managerIds = new Set([...explicitManagerIds, ...thresholdManagers.map((member) => member.id)]);
  const viewerIsGoing = !!viewer && memberIds.includes(viewer.id);
  const viewerCanToggleGoing =
    !!viewer && (!item.isPrivate || viewerIsGoing || participation.invitedUserIds.includes(viewer.id));

  return {
    eventManagers: [
      ...explicitManagerIds.map((userId) => toProjectRoleMember(userId)),
      ...thresholdManagers
    ],
    members: memberIds
      .filter((userId) => !managerIds.has(userId))
      .map((userId) =>
        toProjectRoleMember(
          userId,
          managerConfig.confidenceTargetIdsByUserId[userId],
          candidateIds.includes(userId)
        )
      ),
    memberCount: memberIds.length,
    viewerIsGoing,
    viewerCanToggleGoing,
    viewerCanToggleManagerNomination: !item.isPrivate && !!viewer && memberIds.includes(viewer.id),
    viewerIsManagerCandidate: !!viewer && candidateIds.includes(viewer.id),
    viewerIsEventManager: !!viewer && managerIds.has(viewer.id),
    viewerCanInviteEventManagers: !!viewer && !!creatorId && item.isPrivate && viewer.id === creatorId,
    availableManagerInvitees:
      !!viewer && !!creatorId && item.isPrivate && viewer.id === creatorId
        ? users.filter((user) => !managerIds.has(user.id)).map((user) => toDetailMember(user.id))
        : []
  };
}

function buildScopeStats(feed: PublicFeedItem[], members: ScopeMemberSummary[]): ScopeStats {
  return {
    projects: feed.filter((item) => item.kind === 'project').length,
    threads: feed.filter((item) => item.kind === 'thread').length,
    events: feed.filter((item) => item.kind === 'event').length,
    members: members.length
  };
}

function buildChannelScopeFixtures(): ScopePageData[] {
  const publicFeed = buildPublicFeedFixture();
  const housingMembers = buildScopeMembers('channel', housingBuild.slug);
  const mutualAidMembers = buildScopeMembers('channel', mutualAid.slug);

  return [
    {
      kind: 'channel',
      slug: housingBuild.slug,
      title: housingBuild.label,
      description:
        'Channel pages keep tagged projects, threads, and standalone events together while each content type stays distinct.',
      note:
        'Channels are topic-based discovery surfaces. They are not the same thing as communities.',
      badges: ['Topic channel'],
      moderationLabel: 'Moderators',
      membersNote:
        'Members can participate in discussion and stay discoverable without crowding the header.',
      moderatorsNote:
        'Moderators should keep at least 70% positive confidence to stay in role, so the confidence vote stays visible here.',
      emptyFeedText: 'No content matches this channel right now.',
      membership: buildScopeMembershipState('channel', housingBuild.slug),
      feed: filterByTag(publicFeed, housingBuild.slug, 'channel'),
      members: housingMembers,
      moderators: [
        toScopeMember('user-mika', 'confidence-channel-housing-build-user-mika'),
        toScopeMember('user-ember', 'confidence-channel-housing-build-user-ember')
      ],
      stats: buildScopeStats(filterByTag(publicFeed, housingBuild.slug, 'channel'), housingMembers)
    },
    {
      kind: 'channel',
      slug: mutualAid.slug,
      title: mutualAid.label,
      description:
        'Channels stay broad enough to gather repair work, local coordination, and standalone events without flattening them into one card type.',
      badges: ['Topic channel'],
      moderationLabel: 'Moderators',
      membersNote: 'Members stay visible here without taking over the content feed.',
      moderatorsNote:
        'Moderators should keep at least 70% positive confidence to stay in role, so the confidence vote stays visible here.',
      emptyFeedText: 'No content matches this channel right now.',
      membership: buildScopeMembershipState('channel', mutualAid.slug),
      feed: filterByTag(publicFeed, mutualAid.slug, 'channel'),
      members: mutualAidMembers,
      moderators: [
        toScopeMember('user-tool', 'confidence-channel-mutual-aid-user-tool'),
        toScopeMember('viewer-1', 'confidence-channel-mutual-aid-viewer-1')
      ],
      stats: buildScopeStats(filterByTag(publicFeed, mutualAid.slug, 'channel'), mutualAidMembers)
    }
  ];
}

function buildCommunityScopeFixtures(): ScopePageData[] {
  const publicFeed = buildPublicFeedFixture();
  const eastMarketMembers = buildScopeMembers('community', eastMarket.slug);
  const toolLibraryMembers = buildScopeMembers('community', toolLibrary.slug);

  return [
    {
      kind: 'community',
      slug: eastMarket.slug,
      title: eastMarket.label,
      description:
        'Communities stay people-centered while keeping tagged projects and discussion visible without turning into topic channels.',
      badges: ['Open community'],
      moderationLabel: 'Moderators',
      membersNote: 'Members stay visible here without crowding the community header.',
      moderatorsNote:
        'Moderators should keep at least 70% positive confidence to stay in role, so the confidence vote stays visible here.',
      emptyFeedText: 'No content matches this community right now.',
      membership: buildScopeMembershipState('community', eastMarket.slug),
      feed: filterByTag(publicFeed, eastMarket.slug, 'community'),
      members: eastMarketMembers,
      moderators: [
        toScopeMember('user-mika', 'confidence-community-east-market-user-mika'),
        toScopeMember('user-ember', 'confidence-community-east-market-user-ember')
      ],
      stats: buildScopeStats(filterByTag(publicFeed, eastMarket.slug, 'community'), eastMarketMembers)
    },
    {
      kind: 'community',
      slug: toolLibrary.slug,
      title: toolLibrary.label,
      description:
        'This community holds the social coordination around the tool library while keeping its projects, threads, and events visible together.',
      note: 'This one is closed right now, so the feed stays locked unless you already have access.',
      badges: ['Invite-only community'],
      moderationLabel: 'Moderators',
      membersNote: 'Members stay visible here without crowding the community header.',
      moderatorsNote:
        'Moderators should keep at least 70% positive confidence to stay in role, so the confidence vote stays visible here.',
      emptyFeedText: 'No content matches this community right now.',
      membership: buildScopeMembershipState('community', toolLibrary.slug),
      feed: filterByTag(publicFeed, toolLibrary.slug, 'community'),
      members: toolLibraryMembers,
      moderators: [
        toScopeMember('user-tool', 'confidence-community-tool-library-user-tool'),
        toScopeMember('user-rowan', 'confidence-community-tool-library-user-rowan')
      ],
      stats: buildScopeStats(filterByTag(publicFeed, toolLibrary.slug, 'community'), toolLibraryMembers)
    }
  ];
}

function buildPlatformScopeFixture(): ScopePageData {
  const publicFeed = buildPublicFeedFixture();
  const platformMembers = buildScopeMembers('platform', platform.slug);

  return {
    kind: 'platform',
    slug: platform.slug,
    title: platform.label,
    description:
      'Platform keeps software governance and collective coordination public without turning the people involved into permanent profile roles.',
    note:
      'All users can read and post threads here. Coordination stays visible, but usernames stay just usernames.',
    badges: ['Collective governance'],
    moderationLabel: 'Board members',
    membersNote:
      'Platform stays visible to the whole network, and people listed here are shown for context rather than rank.',
    moderatorsNote:
      'Board members should keep at least 70% positive confidence to stay in role, so the confidence vote stays visible here.',
    emptyFeedText: 'No platform-tagged work is visible yet.',
    membership: buildScopeMembershipState('platform', platform.slug),
    feed: filterByTag(publicFeed, platform.slug, 'channel'),
    members: platformMembers,
    moderators: [
      toScopeMember('user-mika', 'confidence-stewardship-user-mika'),
      toScopeMember('user-ember', 'confidence-stewardship-user-ember')
    ],
    stats: buildScopeStats(filterByTag(publicFeed, platform.slug, 'channel'), platformMembers)
  };
}

export const onboardingFixture: OnboardingPageData = {
  title: 'Signup / Login',
  intro:
    'Anonymous visitors can read public surfaces first. To post, follow people, or open create flows, sign up or log in.',
  accountModes: [
    {
      value: 'signup',
      label: 'Sign up',
      description: 'Start a fresh username and local profile.'
    },
    {
      value: 'login',
      label: 'Log in',
      description: 'Use an existing account once authentication is wired.'
    }
  ],
  visibilityOptions: [
    {
      value: 'public',
      label: 'Public profile',
      description: 'Your profile can be discovered across the network.'
    },
    {
      value: 'limited',
      label: 'Limited profile',
      description: 'Only the surfaces you participate in will expose your profile.'
    }
  ],
  starterChannels: channelDirectory.map((item) => item.label),
  starterCommunities: communityDirectory.map((item) => item.label)
};

function buildProfileFixture(username: string): ProfilePageData | null {
  const profileUser = userByUsername(username);

  if (!profileUser) {
    return null;
  }

  const followerIds = followerIdsFor(profileUser.id);
  const followingIds = followingIdsFor(profileUser.id);

  return {
    username: profileUser.username,
    bio: profileUser.bio,
    followersCount: followerIds.length,
    followingCount: followingIds.length,
    followers: followerIds.map((userId) => userById(userId)).filter((user): user is ViewerSummary => !!user),
    following: followingIds.map((userId) => userById(userId)).filter((user): user is ViewerSummary => !!user),
    canViewPersonalFeed: viewerCanSeePersonalFeed(profileUser.id),
    feed: buildProfileFeed(profileUser.id)
  };
}

function buildRightRailItems(): RightRailActivityItem[] {
  const viewer = currentViewer();

  if (!viewer) {
    return [];
  }

  const publicFeed = buildPublicFeedFixture();
  const projectItems = publicFeed
    .filter((item): item is PublicProjectItem => item.kind === 'project')
    .flatMap((item) => {
      const memberIds = projectMembersBySlug[item.slug] ?? [];
      const lifecycle = buildProjectLifecycle(item.slug, item.projectMode, memberIds.length);

      if (!memberIds.includes(viewer.id)) {
        return [];
      }

      return lifecycle.phaseFive.activities.map((activity) => {
        const requiredOpenRole = activity.roles.some((role) => role.filledCount < role.requiredCount);
        const extrasRole = activity.roles.find((role) => role.isExtraSlot);
        const extrasOpenRole = !!extrasRole && extrasRole.filledCount < extrasRole.requiredCount;

        return {
          id: `rail-project-activity-${item.slug}-${activity.id}`,
          subjectId: activity.id,
          kind: 'project' as const,
          title: activity.title,
          href: `${item.href}?activity=${activity.id}#activity-card-${activity.id}`,
          meta: `${item.title} · ${activity.locationLabel}`,
          createdAt: activity.startAt,
          countLabel: `${activity.committedCount}/${activity.minimumParticipants} committed`,
          viewerIsParticipating: true,
          projectMode: item.projectMode,
          projectSlug: item.slug,
          activityId: activity.id,
          activityRoleLabels: activity.roles.map((role) => role.label),
          viewerAssignedRoleLabel: activity.viewerAssignedRoleLabel,
          projectHasOpenRole: requiredOpenRole || extrasOpenRole
        } satisfies RightRailActivityItem;
      });
    });
  const eventItems = publicFeed
    .filter((item): item is PublicEventItem => item.kind === 'event')
    .map((item) => {
      const participation = eventParticipationById[item.id];
      const goingUserIds = participation?.goingUserIds ?? [];
      const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
      const memberCount = new Set([...(creatorId ? [creatorId] : []), ...goingUserIds]).size;
      const latestUpdate = latestEventUpdateForSlug(item.slug);
      const viewerIsParticipating = !!viewer && (goingUserIds.includes(viewer.id) || creatorId === viewer.id);

      return {
        id: `rail-${item.id}`,
        subjectId: item.id,
        kind: 'event',
        title: item.title,
        href: latestUpdate ? buildUpdateHref(item.href, latestUpdate.id) : item.href,
        meta: latestUpdate ? latestUpdate.title : item.locationLabel,
        createdAt: latestUpdate?.createdAt ?? item.scheduledAt ?? item.lastActivityAt,
        timeLabel: item.timeLabel,
        countLabel: `${memberCount} going`,
        viewerIsParticipating
      } satisfies RightRailActivityItem;
    })
    .filter((item) => item.viewerIsParticipating);

  return [...projectItems, ...eventItems].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
}

function buildSettingsFixture(): SettingsPageData | null {
  return currentViewer() ? settingsState : null;
}

function buildNotificationsFixture(): NotificationsPageData | null {
  const viewer = currentViewer();

  if (!viewer) {
    return null;
  }

  const existingHrefs = new Set(notificationsState.map((item) => item.href));
  const memberProjectNotifications: NotificationItem[] = Object.entries(projectMembersBySlug)
    .filter(([, memberIds]) => memberIds.includes(viewer.id))
    .map(([slug]) => {
      const project = findPublicProjectItem(slug);
      const latestUpdate = latestProjectUpdateForSlug(slug);

      if (!project || !latestUpdate || latestUpdate.authorUsername === viewer.username) {
        return null;
      }

      return {
        id: `notification-project-member-update-${slug}-${latestUpdate.id}`,
        kind: 'project' as const,
        surface: 'public' as const,
        subjectKind: 'project' as const,
        projectMode: project.projectMode,
        title: `${project.title} posted an update`,
        body: latestUpdate.body,
        href: buildUpdateHref(project.href, latestUpdate.id),
        createdAt: latestUpdate.createdAt,
        isUnread: !readNotificationHrefs.has(buildUpdateHref(project.href, latestUpdate.id)),
        channelTags: project.channelTags,
        communityTags: project.communityTags
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item)
    .filter((item) => !existingHrefs.has(item.href));

  return {
    viewer,
    items: [...memberProjectNotifications, ...notificationsState]
      .map((item) => ({
        ...item,
        isUnread: item.isUnread && !readNotificationHrefs.has(item.href)
      }))
      .sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  };
}

function buildMessagesFixture(): MessagesPageData | null {
  const viewer = currentViewer();

  return viewer
    ? {
        viewer,
        threads: messageThreadsState,
        suggestedContacts: buildSuggestedMessageContacts(viewer.id),
        activeThreadId: messageThreadsState[0]?.id ?? null
      }
    : null;
}

function buildSearchCorpus(): SearchResultItem[] {
  const publicFeed = buildPublicFeedFixture();

  return [
    ...publicFeed.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      summary:
        item.kind === 'project'
          ? item.summary
          : item.kind === 'thread'
            ? item.body
            : item.description,
      href: item.href,
      meta:
        item.kind === 'project'
          ? item.stage
          : item.kind === 'thread'
            ? item.authorUsername
            : item.timeLabel
    })),
    ...channelDirectory.map((item) => ({
      id: `channel-${item.slug}`,
      kind: 'channel' as const,
      title: item.label,
      summary: 'Topic-based discovery surface for tagged projects, threads, and events.',
      href: item.href,
      meta: 'Channel'
    })),
    ...communityDirectory.map((item) => ({
      id: `community-${item.slug}`,
      kind: 'community' as const,
      title: item.label,
      summary: 'People-centered coordination surface that can hold tagged work and events.',
      href: item.href,
      meta: 'Community'
    })),
    ...users.map((item) => ({
      id: `profile-${item.username}`,
      kind: 'profile' as const,
      title: item.username,
      summary: item.bio ?? 'Profile surface',
      href: `/profile/${item.username}`,
      meta: `${followerIdsFor(item.id).length} followers · ${followingIdsFor(item.id).length} follows`
    }))
  ];
}

function findPublicProjectItem(slug: string): PublicProjectItem | null {
  return (
    buildPublicFeedFixture().find(
      (item): item is PublicProjectItem => item.kind === 'project' && item.slug === slug
    ) ?? null
  );
}

function findPublicThreadItem(slug: string): PublicThreadItem | null {
  return (
    buildPublicFeedFixture().find(
      (item): item is PublicThreadItem => item.kind === 'thread' && item.slug === slug
    ) ?? null
  );
}

function findPublicEventItem(slug: string): PublicEventItem | null {
  return (
    buildPublicFeedFixture().find(
      (item): item is PublicEventItem => item.kind === 'event' && item.slug === slug
    ) ?? null
  );
}

function findPersonalPostItem(id: string): PersonalPostItem | null {
  return socialPostsBase.map(buildSocialPostItem).find((item) => item.id === id) ?? null;
}

export function getBootstrapFixture(): BootstrapPayload {
  return {
    viewer: currentViewer(),
    featureFlags: {
      assets: false,
      funding: false,
      platform: true
    },
    unreadCounts: buildUnreadCounts(),
    directory: {
      platform: platformDirectory,
      channels: channelDirectory,
      communities: communityDirectory
    },
    activityRail: buildRightRailItems()
  };
}

export function getPublicFeedFixture() {
  return buildPublicFeedFixture();
}

export function getPersonalFeedFixture() {
  return buildPersonalFeedFixture();
}

export function getSettingsFixture() {
  return buildSettingsFixture();
}

export function updateMockSettings(input: SettingsUpdateInput) {
  if (!settingsState) {
    return;
  }

  settingsState = {
    ...settingsState,
    ...input
  };
  settingsState.requireFollowApproval = settingsState.hidePersonalFeedFromNonFollowers;
  syncViewerProfileFromSettings();
  persistSettingsState();
}

export function hydrateMockClientState() {
  return hydratePersistedSettingsState();
}

export function findChannelScopeFixture(slug: string): ScopePageData | null {
  return buildChannelScopeFixtures().find((item) => item.slug === slug) ?? null;
}

export function findCommunityScopeFixture(slug: string): ScopePageData | null {
  return buildCommunityScopeFixtures().find((item) => item.slug === slug) ?? null;
}

export function getPlatformScopeFixture() {
  return buildPlatformScopeFixture();
}

export function findProfileFixture(username: string): ProfilePageData | null {
  return buildProfileFixture(username);
}

export function findNotificationsFixture(): NotificationsPageData | null {
  return buildNotificationsFixture();
}

export function findMessagesFixture(): MessagesPageData | null {
  return buildMessagesFixture();
}

export function buildSearchFixture(query: string): SearchPageData {
  const normalizedQuery = query.trim().toLowerCase();
  const corpus = buildSearchCorpus();
  const results = normalizedQuery
    ? corpus.filter((item) =>
        [item.title, item.summary, item.meta].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        )
      )
    : corpus.slice(0, 8);

  return {
    query,
    suggestedQueries: ['repair', 'mutual aid', 'retrofit', 'tool library'],
    results
  };
}

export function findProjectFixture(slug: string): ProjectPageData | null {
  const item = findPublicProjectItem(slug);
  const extras = projectDetailExtras[slug];
  const memberState = buildProjectMemberState(slug);

  if (!item || !extras) {
    return null;
  }

  const lifecycle = buildProjectLifecycle(
    slug,
    item.projectMode,
    memberState.projectManagers.length + memberState.members.length
  );

  return {
    ...item,
    overview: extras.overview,
    lifecycle,
    updates: extras.updates,
    projectManagers: memberState.projectManagers,
    members: memberState.members,
    viewerIsMember: memberState.viewerIsMember,
    viewerCanToggleMembership: memberState.viewerCanToggleMembership,
    viewerCanToggleManagerNomination: memberState.viewerCanToggleManagerNomination,
    viewerIsManagerCandidate: memberState.viewerIsManagerCandidate,
    viewerIsProjectManager: memberState.viewerIsProjectManager,
    discussionNote: extras.discussionNote,
    discussion: commentsBySubjectId[item.id] ?? []
  };
}

export function findThreadFixture(slug: string): ThreadPageData | null {
  const item = findPublicThreadItem(slug);

  if (!item) {
    return null;
  }

  return {
    ...item,
    discussionNote: threadDiscussionNotes[slug] ?? 'Discussion stays visible here.',
    discussion: commentsBySubjectId[item.id] ?? []
  };
}

export function findPostFixture(id: string): PostPageData | null {
  const item = findPersonalPostItem(id);

  if (!item) {
    return null;
  }

  if (item.audience === 'followers' && !viewerCanSeeFollowersPosts(item.author.id)) {
    return null;
  }

  return {
    id: item.id,
    authorUsername: item.author.username,
    body: item.body,
    audience: item.audience,
    voteCount: item.voteCount,
    activeVote: item.activeVote,
    commentCount: item.commentCount,
    createdAt: item.createdAt,
    discussionNote: postDiscussionNotes[item.id] ?? 'Personal post discussion stays threaded here.',
    discussion: commentsBySubjectId[item.id] ?? []
  };
}

export function findEventFixture(slug: string): EventPageData | null {
  const item = findPublicEventItem(slug);
  const extras = eventDetailExtras[slug];
  const participation = eventParticipationById[item?.id ?? ''];
  const memberState = item ? buildEventMemberState(item) : null;

  if (!item || !extras || !memberState) {
    return null;
  }

  return {
    ...item,
    memberCount: memberState.memberCount,
    attendanceNote: extras.attendanceNote,
    agenda: extras.agenda,
    updates: extras.updates,
    attendees: (participation?.goingUserIds ?? []).map((userId) => userById(userId)?.username ?? '').filter(Boolean),
    invitedUsernames: (participation?.invitedUserIds ?? [])
      .map((userId) => userById(userId)?.username ?? '')
      .filter(Boolean),
    eventManagers: memberState.eventManagers,
    members: memberState.members,
    viewerIsGoing: memberState.viewerIsGoing,
    viewerCanToggleGoing: memberState.viewerCanToggleGoing,
    viewerCanToggleManagerNomination: memberState.viewerCanToggleManagerNomination,
    viewerIsManagerCandidate: memberState.viewerIsManagerCandidate,
    viewerIsEventManager: memberState.viewerIsEventManager,
    viewerCanInviteEventManagers: memberState.viewerCanInviteEventManagers,
    availableManagerInvitees: memberState.availableManagerInvitees,
    discussionNote: extras.discussionNote,
    discussion: commentsBySubjectId[item.id] ?? []
  };
}

function updateCommentVote(comments: DetailComment[], commentId: string, nextVote: VoteDirection): boolean {
  for (const comment of comments) {
    if (comment.id === commentId) {
      comment.voteCount += nextVote - comment.activeVote;
      comment.activeVote = nextVote;
      return true;
    }

    if (updateCommentVote(comment.replies, commentId, nextVote)) {
      return true;
    }
  }

  return false;
}

function appendReply(comments: DetailComment[], parentId: string, nextComment: DetailComment): boolean {
  for (const comment of comments) {
    if (comment.id === parentId) {
      comment.replies = [nextComment, ...comment.replies];
      return true;
    }

    if (appendReply(comment.replies, parentId, nextComment)) {
      return true;
    }
  }

  return false;
}

export function setMockVote(targetId: string, nextVote: VoteDirection) {
  let updatedComment = false;

  for (const comments of Object.values(commentsBySubjectId)) {
    if (updateCommentVote(comments, targetId, nextVote)) {
      updatedComment = true;
      break;
    }
  }

  const confidence = confidenceState.get(targetId);

  if (confidence) {
    if (confidence.activeVote === 1) {
      confidence.upVotes -= 1;
    } else if (confidence.activeVote === -1) {
      confidence.downVotes -= 1;
    }

    if (nextVote === 1) {
      confidence.upVotes += 1;
    } else if (nextVote === -1) {
      confidence.downVotes += 1;
    }

    confidence.activeVote = nextVote;
  }

  const vote = voteState.get(targetId);

  if (vote) {
    vote.voteCount += nextVote - vote.activeVote;
    vote.activeVote = nextVote;
  }

  if (updatedComment) {
    return;
  }
}

export function toggleMockEventGoing(eventId: string) {
  const viewer = currentViewer();
  const participation = eventParticipationById[eventId];
  const event = publicFeedBase.find(
    (item): item is PublicEventItem => item.kind === 'event' && item.id === eventId
  );
  const creatorId = event ? userByUsername(event.createdByUsername)?.id ?? null : null;
  const viewerCanToggle =
    !!viewer &&
    !!participation &&
    !!event &&
    (!event.isPrivate || participation.invitedUserIds.includes(viewer.id) || participation.goingUserIds.includes(viewer.id) || creatorId === viewer.id);

  if (!viewerCanToggle || !viewer || !participation || !event) {
    return;
  }

  if (participation.goingUserIds.includes(viewer.id)) {
    participation.goingUserIds = participation.goingUserIds.filter((userId) => userId !== viewer.id);

    if (eventManagersBySlug[event.slug]) {
      eventManagersBySlug[event.slug].managerIds = eventManagersBySlug[event.slug].managerIds.filter(
        (userId) => userId !== viewer.id
      );
      eventManagersBySlug[event.slug].candidateIds = eventManagersBySlug[event.slug].candidateIds.filter(
        (userId) => userId !== viewer.id
      );
    }

    if (event.isPrivate && !participation.invitedUserIds.includes(viewer.id)) {
      participation.invitedUserIds = [...participation.invitedUserIds, viewer.id];
    }

    return;
  }

  participation.goingUserIds = [...participation.goingUserIds, viewer.id];
  participation.invitedUserIds = participation.invitedUserIds.filter((userId) => userId !== viewer.id);
}

export function toggleMockProjectMembership(slug: string) {
  const viewer = currentViewer();

  if (!viewer) {
    return;
  }

  const memberIds = projectMembersBySlug[slug] ?? [];
  const viewerIsMember = memberIds.includes(viewer.id);

  if (viewerIsMember) {
    projectMembersBySlug[slug] = memberIds.filter((userId) => userId !== viewer.id);

    if (projectManagersBySlug[slug]) {
      projectManagersBySlug[slug].managerIds = projectManagersBySlug[slug].managerIds.filter(
        (userId) => userId !== viewer.id
      );
      projectManagersBySlug[slug].candidateIds = projectManagersBySlug[slug].candidateIds.filter(
        (userId) => userId !== viewer.id
      );
    }

    return;
  }

  projectMembersBySlug[slug] = [viewer.id, ...memberIds];
}

function ensureProjectWorkflowState(slug: string) {
  const workflow =
    projectWorkflowStateBySlug[slug] ??
    (projectWorkflowStateBySlug[slug] = {
      signalCount: 0,
      signalUserIds: [],
      values: [],
      phaseTwoPlans: [],
      phaseThreePlans: [],
      phaseFiveActivities: [],
      serviceRequests: [],
      revertHistory: []
    });

  workflow.serviceRequests ??= [];
  workflow.revertHistory ??= [];

  return workflow;
}

function projectModeForSlug(slug: string) {
  return findPublicProjectItem(slug)?.projectMode ?? 'productive';
}

function rawProjectPlansForPhase(
  slug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>
) {
  const workflow = ensureProjectWorkflowState(slug);

  return phaseId === 'phase-2' ? workflow.phaseTwoPlans : workflow.phaseThreePlans;
}

function canViewerManageProjectPhase(slug: string) {
  return buildProjectMemberState(slug).viewerIsProjectManager;
}

function canViewerEditProjectPhase(slug: string, phaseId: ProjectLifecyclePhaseId) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];

  return !!viewer && memberIds.includes(viewer.id) && projectLifecycleBySlug[slug]?.currentPhaseId === phaseId;
}

function canViewerEditProjectActivityCommitment(slug: string) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];

  return !!viewer && memberIds.includes(viewer.id);
}

function canViewerCreateProjectActivity(slug: string) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];
  const projectMode = projectModeForSlug(slug);

  if (!viewer || projectLifecycleBySlug[slug]?.currentPhaseId !== activityPhaseIdForProject(projectMode)) {
    return false;
  }

  if (projectMode === 'personal-service') {
    return canViewerManageProjectPhase(slug);
  }

  return memberIds.includes(viewer.id);
}

function canViewerSubmitProjectServiceRequest(slug: string) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);
  const lifecycle = buildProjectLifecycle(slug, projectMode, (projectMembersBySlug[slug] ?? []).length);

  return !!viewer && !!lifecycle.requestSystem?.enabled && projectLifecycleBySlug[slug]?.currentPhaseId === activityPhaseIdForProject(projectMode);
}

function canViewerReviewProjectServiceRequests(slug: string) {
  const projectMode = projectModeForSlug(slug);
  const lifecycle = buildProjectLifecycle(slug, projectMode, (projectMembersBySlug[slug] ?? []).length);

  return canViewerManageProjectPhase(slug) && !!lifecycle.requestSystem?.enabled;
}

function updateProjectPlanValueVoteMap(
  slug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  valueId: string,
  viewerId: string,
  vote: ProjectApprovalVote | null
) {
  const plan = rawProjectPlansForPhase(slug, phaseId).find((item) => item.id === planId);

  if (!plan) {
    return;
  }

  const votes = plan.valueVotesByValueId[valueId] ?? (plan.valueVotesByValueId[valueId] = {});

  if (!vote) {
    delete votes[viewerId];
    return;
  }

  votes[viewerId] = vote;
}

function updateProjectPlanOverallVoteMap(
  slug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  viewerId: string,
  vote: ProjectApprovalVote | null
) {
  const plan = rawProjectPlansForPhase(slug, phaseId).find((item) => item.id === planId);

  if (!plan) {
    return;
  }

  if (!vote) {
    delete plan.overallVotesByUserId[viewerId];
    return;
  }

  plan.overallVotesByUserId[viewerId] = vote;
}

export function toggleMockProjectDemandSignal(slug: string) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);

  if (!viewer || !supportsProjectDemandSignals(projectModeForSlug(slug))) {
    return;
  }

  if (workflow.signalUserIds.includes(viewer.id)) {
    workflow.signalUserIds = workflow.signalUserIds.filter((userId) => userId !== viewer.id);
    workflow.signalCount = Math.max(0, workflow.signalCount - 1);
    return;
  }

  workflow.signalUserIds = [viewer.id, ...workflow.signalUserIds];
  workflow.signalCount += 1;
}

export function addMockProjectValue(slug: string, label: string) {
  const viewer = currentViewer();
  const trimmed = label.trim();
  const workflow = ensureProjectWorkflowState(slug);

  if (!viewer || !trimmed || !canViewerEditProjectPhase(slug, 'phase-1')) {
    return;
  }

  workflow.values = [
    {
      id: `project-value-${slug}-${Date.now()}`,
      label: trimmed,
      authorUsername: viewer.username,
      votesByUserId: {
        [viewer.id]: 4
      }
    },
    ...workflow.values
  ];
}

export function setMockProjectValueImportance(
  slug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const value = workflow.values.find((item) => item.id === valueId);

  if (!viewer || !value || !canViewerEditProjectPhase(slug, 'phase-1')) {
    return;
  }

  value.votesByUserId[viewer.id] = importance;
}

export function addMockProjectProductionPlan(slug: string, input: ProjectProductionPlanInput) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const values = workflow.values;
  const description = input.description.trim();
  const totalCostLabel = input.totalCostLabel.trim();
  const planPhases = input.planPhases
    .map((phase, index) => ({
      id: `plan-phase-${slug}-${Date.now()}-${index}`,
      title: phase.title.trim(),
      details: phase.details.trim(),
      materialsLabel: phase.materialsLabel.trim(),
      costLabel: phase.costLabel.trim()
    }))
    .filter(
      (phase) => phase.title && phase.details && phase.materialsLabel && phase.costLabel
    );

  if (
    !viewer ||
    !canViewerEditProjectPhase(slug, 'phase-2') ||
    !input.title.trim() ||
    !description ||
    !totalCostLabel ||
    planPhases.length === 0
  ) {
    return;
  }

  const phaseDetailsSummary = planPhases.map((phase) => `${phase.title}: ${phase.details}`).join(' ');
  const phaseMaterialSummary = planPhases
    .map((phase) => `${phase.materialsLabel} (${phase.costLabel})`)
    .join(' ');

  workflow.phaseTwoPlans = [
    {
      id: `production-plan-${slug}-${Date.now()}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      createdAt: new Date().toISOString(),
      description,
      planPhases,
      outputSummary: description,
      materialsSummary: phaseDetailsSummary,
      totalCostLabel,
      acquisitionsSummary: phaseMaterialSummary,
      overallVotesByUserId: {
        [viewer.id]: 'yes'
      },
      valueVotesByValueId: Object.fromEntries(
        values.map((value) => [value.id, { [viewer.id]: 'yes' as ProjectApprovalVote }])
      )
    },
    ...workflow.phaseTwoPlans
  ];
}

export function addMockProjectDistributionPlan(slug: string, input: ProjectDistributionPlanInput) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const values = workflow.values;
  const description = input.description.trim();
  const totalCostLabel = input.totalCostLabel.trim();
  const planPhases = input.planPhases
    .map((phase, index) => ({
      id: `plan-phase-${slug}-${Date.now()}-${index}`,
      title: phase.title.trim(),
      details: phase.details.trim(),
      materialsLabel: phase.materialsLabel.trim(),
      costLabel: phase.costLabel.trim()
    }))
    .filter(
      (phase) => phase.title && phase.details && phase.materialsLabel && phase.costLabel
    );

  if (
    !viewer ||
    !canViewerEditProjectPhase(slug, 'phase-3') ||
    !input.title.trim() ||
    !description ||
    !totalCostLabel ||
    planPhases.length === 0
  ) {
    return;
  }

  const phaseDetailsSummary = planPhases.map((phase) => `${phase.title}: ${phase.details}`).join(' ');
  const phaseMaterialSummary = planPhases
    .map((phase) => `${phase.materialsLabel} (${phase.costLabel})`)
    .join(' ');

  workflow.phaseThreePlans = [
    {
      id: `distribution-plan-${slug}-${Date.now()}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      createdAt: new Date().toISOString(),
      description,
      totalCostLabel,
      planPhases,
      distributionSummary: description,
      accessSummary: phaseDetailsSummary,
      reserveSummary: phaseMaterialSummary,
      requestSystemEnabled: input.requestSystemEnabled ?? false,
      overallVotesByUserId: {
        [viewer.id]: 'yes'
      },
      valueVotesByValueId: Object.fromEntries(
        values.map((value) => [value.id, { [viewer.id]: 'yes' as ProjectApprovalVote }])
      )
    },
    ...workflow.phaseThreePlans
  ];
}

export function setMockProjectPlanValueVote(
  slug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();

  if (!viewer || !canViewerEditProjectPhase(slug, phaseId)) {
    return;
  }

  updateProjectPlanValueVoteMap(slug, phaseId, planId, valueId, viewer.id, vote);
}

export function setMockProjectPlanOverallVote(
  slug: string,
  phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  planId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();

  if (!viewer || !canViewerEditProjectPhase(slug, phaseId)) {
    return;
  }

  updateProjectPlanOverallVoteMap(slug, phaseId, planId, viewer.id, vote);
}

export function addMockProjectActivity(slug: string, input: ProjectActivityInput) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const roleRequirements = input.roleRequirements
    .map((role) => ({
      label: role.label.trim(),
      requiredCount: Math.max(1, Number(role.requiredCount) || 1)
    }))
    .filter((role) => role.label);
  const minimumParticipants = roleRequirements.reduce(
    (total, role) => total + role.requiredCount,
    0
  );
  const maximumParticipants = Math.max(input.maximumParticipants, minimumParticipants, 1);
  const now = new Date().toISOString();
  const project = findPublicProjectItem(slug);

  if (
    !viewer ||
    !canViewerCreateProjectActivity(slug) ||
    !input.title.trim() ||
    !input.scheduledAt.trim() ||
    !input.endsAt.trim() ||
    !input.locationLabel.trim() ||
    !input.note.trim() ||
    roleRequirements.length === 0 ||
    minimumParticipants < 1 ||
    new Date(input.endsAt).getTime() <= new Date(input.scheduledAt).getTime()
  ) {
    return;
  }

  workflow.phaseFiveActivities = [
    {
      id: `project-activity-${slug}-${Date.now()}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      scheduledAt: input.scheduledAt.trim(),
      endsAt: input.endsAt.trim(),
      locationLabel: input.locationLabel.trim(),
      minimumParticipants,
      maximumParticipants,
      linkedPlanPhaseId: input.linkedPlanPhaseId ?? null,
      roles: roleRequirements.map((role, index) => ({
        label: role.label,
        requiredCount: role.requiredCount,
        assignedUsernames: index === 0 ? [viewer.username] : []
      })),
      extraAssignedUsernames: [],
      note: input.note.trim()
    },
    ...workflow.phaseFiveActivities
  ];

  if (project) {
    notificationsState.unshift({
      id: `notification-project-activity-${slug}-${Date.now()}`,
      kind: 'project',
      surface: 'public',
      subjectKind: 'project',
      projectMode: project.projectMode,
      actorUsername: viewer.username,
      actionLabel: 'scheduled activity',
      title: `${project.title}`,
      body: `${viewer.username} scheduled ${input.title.trim()} for ${new Date(input.scheduledAt).toLocaleString()} to ${new Date(input.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      href: `/projects/${slug}`,
      createdAt: now,
      isUnread: true,
      channelTags: project.channelTags,
      communityTags: project.communityTags
    });
  }
}

export function setMockProjectActivityCommitment(
  slug: string,
  activityId: string,
  roleLabel: string | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const activity = workflow.phaseFiveActivities.find((item) => item.id === activityId);

  if (!viewer || !activity || !canViewerEditProjectActivityCommitment(slug)) {
    return;
  }

  for (const role of activity.roles) {
    role.assignedUsernames = role.assignedUsernames.filter((username) => username !== viewer.username);
  }
  activity.extraAssignedUsernames = (activity.extraAssignedUsernames ?? []).filter(
    (username) => username !== viewer.username
  );

  if (!roleLabel) {
    return;
  }

  const maximumParticipants = Math.max(activity.maximumParticipants ?? 0, activity.minimumParticipants, 1);
  const committedCount = Array.from(
    new Set([
      ...activity.roles.flatMap((role) => role.assignedUsernames),
      ...(activity.extraAssignedUsernames ?? [])
    ])
  ).length;

  if (committedCount >= maximumParticipants) {
    return;
  }

  if (roleLabel === 'Extras') {
    const extraCapacity = Math.max(maximumParticipants - activity.minimumParticipants, 0);
    const extraAssignedUsernames = activity.extraAssignedUsernames ?? [];

    if (extraCapacity < 1 || extraAssignedUsernames.length >= extraCapacity) {
      return;
    }

    activity.extraAssignedUsernames = [...extraAssignedUsernames, viewer.username];
    return;
  }

  const targetRole = activity.roles.find((role) => role.label === roleLabel);

  if (!targetRole) {
    return;
  }

  targetRole.assignedUsernames = [...targetRole.assignedUsernames, viewer.username];
}

export function addMockProjectServiceRequest(slug: string, title: string, body: string) {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const workflow = ensureProjectWorkflowState(slug);
  const serviceRequests = workflow.serviceRequests ?? [];

  if (!trimmedTitle || !trimmedBody || !canViewerSubmitProjectServiceRequest(slug)) {
    return;
  }

  workflow.serviceRequests = [
    {
      id: `project-service-request-${slug}-${Date.now()}`,
      title: trimmedTitle,
      body: trimmedBody,
      createdAt: new Date().toISOString(),
      status: 'open'
    },
    ...serviceRequests
  ];
}

export function setMockProjectServiceRequestStatus(
  slug: string,
  requestId: string,
  status: ProjectServiceRequestStatus
) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = (workflow.serviceRequests ?? []).find((item) => item.id === requestId);

  if (!request || !canViewerReviewProjectServiceRequests(slug)) {
    return;
  }

  request.status = status;
}

export function advanceMockProjectPhase(slug: string) {
  const config = projectLifecycleBySlug[slug];
  const projectMode = findPublicProjectItem(slug)?.projectMode ?? 'productive';

  if (!config || !canViewerManageProjectPhase(slug)) {
    return;
  }

  const lifecycle = buildProjectLifecycle(slug, projectMode, (projectMembersBySlug[slug] ?? []).length);

  switch (config.currentPhaseId) {
    case 'phase-1':
      if (projectMode !== 'personal-service' && lifecycle.phaseOne.values.length === 0) {
        return;
      }
      break;
    case 'phase-2':
      if (!lifecycle.phaseTwo.winningPlanId) {
        return;
      }
      break;
    case 'phase-3':
      if (!lifecycle.phaseThree.winningPlanId) {
        return;
      }
      break;
    default:
      break;
  }

  const nextPhaseId = nextProjectPhaseId(config.currentPhaseId, projectMode);

  if (!nextPhaseId) {
    return;
  }

  config.currentPhaseId = nextPhaseId;
}

export function revertMockProjectPhase(
  slug: string,
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
  reason: string
) {
  const config = projectLifecycleBySlug[slug];
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);
  const trimmedReason = reason.trim();

  if (!config || !viewer || !trimmedReason || !canViewerManageProjectPhase(slug)) {
    return;
  }

  if (!revertableProjectPhaseIds(projectMode, config.currentPhaseId).includes(targetPhaseId)) {
    return;
  }

  config.currentPhaseId = targetPhaseId;
  const workflow = ensureProjectWorkflowState(slug);

  ensureProjectWorkflowState(slug).revertHistory = [
    {
      id: `project-revert-${slug}-${Date.now()}`,
      targetPhaseId,
      reason: trimmedReason,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString()
    },
    ...(workflow.revertHistory ?? [])
  ];
}

export function toggleMockProjectManagerNomination(slug: string) {
  const viewer = currentViewer();

  if (!viewer) {
    return;
  }

  const memberIds = projectMembersBySlug[slug] ?? [];

  if (!memberIds.includes(viewer.id)) {
    return;
  }

  const managerConfig =
    projectManagersBySlug[slug] ??
    (projectManagersBySlug[slug] = {
      managerIds: [],
      candidateIds: [],
      confidenceTargetIdsByUserId: {}
    });
  const viewerIsManager = managerConfig.managerIds.includes(viewer.id);
  const viewerIsCandidate = managerConfig.candidateIds.includes(viewer.id);

  if (viewerIsManager) {
    managerConfig.managerIds = managerConfig.managerIds.filter((userId) => userId !== viewer.id);
    return;
  }

  if (viewerIsCandidate) {
    managerConfig.candidateIds = managerConfig.candidateIds.filter((userId) => userId !== viewer.id);
    return;
  }

  const confidenceTargetId =
    managerConfig.confidenceTargetIdsByUserId[viewer.id] ??
    `confidence-project-manager-${slug}-${viewer.id}`;

  managerConfig.confidenceTargetIdsByUserId[viewer.id] = confidenceTargetId;

  if (!confidenceState.has(confidenceTargetId)) {
    seedConfidenceTarget(confidenceTargetId, 0, 0, 0);
  }

  managerConfig.candidateIds = [viewer.id, ...managerConfig.candidateIds];
}

export function toggleMockEventManagerNomination(slug: string) {
  const viewer = currentViewer();
  const event = publicFeedBase.find(
    (item): item is PublicEventItem => item.kind === 'event' && item.slug === slug
  );

  if (!viewer || !event || event.isPrivate) {
    return;
  }

  const participation = eventParticipationById[event.id] ?? { goingUserIds: [], invitedUserIds: [] };

  if (!participation.goingUserIds.includes(viewer.id)) {
    return;
  }

  const managerConfig =
    eventManagersBySlug[slug] ??
    (eventManagersBySlug[slug] = {
      managerIds: [],
      candidateIds: [],
      confidenceTargetIdsByUserId: {}
    });
  const viewerIsManager = managerConfig.managerIds.includes(viewer.id);
  const viewerIsCandidate = managerConfig.candidateIds.includes(viewer.id);

  if (viewerIsManager) {
    managerConfig.managerIds = managerConfig.managerIds.filter((userId) => userId !== viewer.id);
    return;
  }

  if (viewerIsCandidate) {
    managerConfig.candidateIds = managerConfig.candidateIds.filter((userId) => userId !== viewer.id);
    return;
  }

  const confidenceTargetId =
    managerConfig.confidenceTargetIdsByUserId[viewer.id] ??
    `confidence-event-manager-${slug}-${viewer.id}`;

  managerConfig.confidenceTargetIdsByUserId[viewer.id] = confidenceTargetId;

  if (!confidenceState.has(confidenceTargetId)) {
    seedConfidenceTarget(confidenceTargetId, 0, 0, 0);
  }

  managerConfig.candidateIds = [viewer.id, ...managerConfig.candidateIds];
}

export function inviteMockEventManager(slug: string, userId: string) {
  const viewer = currentViewer();
  const event = publicFeedBase.find(
    (item): item is PublicEventItem => item.kind === 'event' && item.slug === slug
  );

  if (!viewer || !event || !event.isPrivate) {
    return;
  }

  const creatorId = userByUsername(event.createdByUsername)?.id;

  if (!creatorId || viewer.id !== creatorId || !userById(userId)) {
    return;
  }

  const participation =
    eventParticipationById[event.id] ??
    (eventParticipationById[event.id] = { goingUserIds: [], invitedUserIds: [] });
  const managerConfig =
    eventManagersBySlug[slug] ??
    (eventManagersBySlug[slug] = {
      managerIds: [creatorId],
      candidateIds: [],
      confidenceTargetIdsByUserId: {}
    });

  if (!participation.goingUserIds.includes(userId)) {
    participation.goingUserIds = [...participation.goingUserIds, userId];
  }

  participation.invitedUserIds = participation.invitedUserIds.filter((inviteeId) => inviteeId !== userId);
  managerConfig.candidateIds = managerConfig.candidateIds.filter((candidateId) => candidateId !== userId);

  if (!managerConfig.managerIds.includes(userId)) {
    managerConfig.managerIds = [userId, ...managerConfig.managerIds];
  }
}

export function toggleMockScopeMembership(kind: ScopeKind, slug: string) {
  const viewer = currentViewer();
  const membership = scopeMembershipByKey[scopeMembershipKey(kind, slug)];

  if (!viewer || !membership) {
    return;
  }

  const viewerIsMember = membership.memberIds.includes(viewer.id);

  if (!viewerIsMember && membership.joinPolicy === 'invite_only') {
    return;
  }

  membership.memberIds = viewerIsMember
    ? membership.memberIds.filter((userId) => userId !== viewer.id)
    : [viewer.id, ...membership.memberIds];
}

function extractInviteToken(inviteValue: string) {
  const trimmed = inviteValue.trim();

  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/[?&]invite=([^&#]+)/i);

  if (match) {
    return decodeURIComponent(match[1]);
  }

  return trimmed;
}

export function redeemMockScopeInvite(kind: ScopeKind, slug: string, inviteValue: string) {
  const viewer = currentViewer();
  const membership = scopeMembershipByKey[scopeMembershipKey(kind, slug)];
  const inviteToken = extractInviteToken(inviteValue);

  if (!viewer || !membership || membership.joinPolicy !== 'invite_only' || !membership.inviteToken) {
    return false;
  }

  if (!inviteToken || inviteToken !== membership.inviteToken) {
    return false;
  }

  if (!membership.memberIds.includes(viewer.id)) {
    membership.memberIds = [viewer.id, ...membership.memberIds];
  }

  return true;
}

export function addMockComment(subjectId: string, body: string, parentId?: string) {
  const viewer = currentViewer();
  const trimmed = body.trim();

  if (!viewer || !trimmed) {
    return;
  }

  const comments = commentsBySubjectId[subjectId] ?? [];
  commentsBySubjectId[subjectId] = comments;

  const comment: DetailComment = {
    id: `comment-${subjectId}-${Date.now()}`,
    authorUsername: viewer.username,
    body: trimmed,
    createdAt: new Date().toISOString(),
    voteCount: 1,
    activeVote: 1,
    replies: []
  };

  seedVoteTarget(comment.id, comment.voteCount, comment.activeVote);

  if (parentId) {
    if (!appendReply(comments, parentId, comment)) {
      comments.unshift(comment);
    }
    return;
  }

  comments.unshift(comment);
}

export function addMockProjectUpdate(slug: string, title: string, body: string) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const memberState = buildProjectMemberState(slug);

  if (!viewer || !extras || !trimmedTitle || !trimmedBody || !memberState.viewerIsProjectManager) {
    return;
  }

  extras.updates = [
    {
      id: `project-update-${slug}-${Date.now()}`,
      title: trimmedTitle,
      body: trimmedBody,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString()
    },
    ...extras.updates
  ];
}

export function addMockEventUpdate(slug: string, title: string, body: string) {
  const viewer = currentViewer();
  const event = publicFeedBase.find(
    (item): item is PublicEventItem => item.kind === 'event' && item.slug === slug
  );
  const extras = eventDetailExtras[slug];
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const memberState = event ? buildEventMemberState(event) : null;

  if (!viewer || !event || !extras || !trimmedTitle || !trimmedBody || !memberState?.viewerIsEventManager) {
    return;
  }

  extras.updates = [
    {
      id: `event-update-${slug}-${Date.now()}`,
      title: trimmedTitle,
      body: trimmedBody,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString()
    },
    ...extras.updates
  ];
}

export function markMockNotificationRead(notificationId: string) {
  const item = notificationsState.find((notification) => notification.id === notificationId);

  if (item) {
    item.isUnread = false;
    readNotificationHrefs.add(item.href);
    return;
  }

  const hydratedItem = buildNotificationsFixture()?.items.find((notification) => notification.id === notificationId);

  if (hydratedItem) {
    readNotificationHrefs.add(hydratedItem.href);
  }
}

export function markAllMockNotificationsRead() {
  const hydratedItems = buildNotificationsFixture()?.items ?? [];

  for (const item of hydratedItems) {
    readNotificationHrefs.add(item.href);
  }

  for (const item of notificationsState) {
    item.isUnread = false;
  }
}

export function markMockMessageThreadRead(threadId: string) {
  const thread = messageThreadsState.find((item) => item.id === threadId);

  if (thread) {
    thread.unreadCount = 0;
  }
}

export function sendMockMessage(threadId: string, body: string) {
  const viewer = currentViewer();
  const thread = messageThreadsState.find((item) => item.id === threadId);
  const trimmed = body.trim();

  if (!viewer || !thread || !trimmed) {
    return;
  }

  const createdAt = new Date().toISOString();
  thread.messages.push({
    id: `${threadId}-${Date.now()}`,
    sender: viewer,
    body: trimmed,
    createdAt,
    isOwn: true
  });
  thread.preview = trimmed;
  thread.lastMessageAt = createdAt;
  thread.unreadCount = 0;
  moveMessageThreadToFront(thread.id);
}

export function startMockMessageThread(participantUsername: string, body: string) {
  const viewer = currentViewer();
  const participant = userByUsername(participantUsername);
  const trimmed = body.trim();

  if (!viewer || !participant || participant.id === viewer.id || !trimmed) {
    return null;
  }

  let thread = messageThreadsState.find((item) => item.participant.id === participant.id);

  if (!thread) {
    thread = {
      id: `dm-${participant.username}`,
      participant,
      preview: '',
      lastMessageAt: '',
      unreadCount: 0,
      messages: []
    };
    messageThreadsState.unshift(thread);
  }

  const createdAt = new Date().toISOString();
  thread.messages.push({
    id: `${thread.id}-${Date.now()}`,
    sender: viewer,
    body: trimmed,
    createdAt,
    isOwn: true
  });
  thread.preview = trimmed;
  thread.lastMessageAt = createdAt;
  thread.unreadCount = 0;
  moveMessageThreadToFront(thread.id);

  return thread.id;
}