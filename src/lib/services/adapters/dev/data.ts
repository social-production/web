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
import type { PlatformAssetsPageData } from '$lib/types/assets';
import type {
  AuthResult,
  PersonalFeedPreferences,
  OnboardingPageData,
  ProfilePageData,
  PublicFeedPreferences,
  SignInInput,
  SignUpInput,
  SettingsPageData,
  SettingsUpdateInput
} from '$lib/types/account';
import type {
  ContentReportReason,
  ContentReportSummary,
  ContentReportVote,
  DetailComment,
  DetailMember,
  DetailUpdate,
  EventPageData,
  PostPageData,
  ProjectActivityPlanPhaseOption,
  ProjectServiceHistoryCompletionChoice,
  ProjectServiceHistoryCompletionRole,
  ProjectServiceHistoryCompletionState,
  ProjectServiceHistoryItem,
  ProjectActivityItem,
  ProjectActivityInput,
  ProjectApprovalVote,
  ProjectDistributionPlan,
  ProjectDistributionPlanInput,
  ProjectImportanceVoteValue,
  ProjectLifecycleData,
  ProjectLifecyclePhaseChangeRequest,
  ProjectLifecyclePhase,
  ProjectLifecyclePhaseId,
  ProjectLifecycleRevertEntry,
  EventEditRequest,
  EventUpdateRequest,
  ProjectEditRequest,
  ProjectUpdateRequest,
  ProjectPlanPhaseItem,
  ProjectPlanValueAssessment,
  ProjectPlanVoteSummary,
  ProjectPageData,
  ProjectProductionPlan,
  ProjectProductionPlanInput,
  ProjectRoleMember,
  ProjectServiceRequestInput,
  ProjectServiceRequestItem,
  ProjectServiceRequestMode,
  ProjectServiceRequestPlanInput,
  ProjectServiceRequestSettings,
  ProjectServiceRequestSettingsChangeInput,
  ProjectServiceRequestSettingsChangeRequest,
  ProjectServiceRequestStatus,
  ProjectServiceHistoryState,
  ShareTargetResult,
  ProjectValueItem,
  ThreadPageData
} from '$lib/types/detail';
import type {
  CreateGroupMessageInput,
  MessageConversation,
  MessageLinkedChat,
  MessageConversationResult,
  MessagesPageData,
  NotificationItem,
  NotificationsPageData
} from '$lib/types/inbox';
import type {
  CreateChannelInput,
  CreateCommunityInput,
  CreateEventInput,
  CreatePostInput,
  CreateProjectInput,
  CreateResult,
  CreateThreadInput,
  PostBodyLink,
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
import { canProjectVoteStillPass } from '$lib/utils/projectVotes';
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

const usersById = new Map<string, ViewerSummary>();
const usersByUsername = new Map<string, ViewerSummary>();

function rebuildUserIndexes() {
  usersById.clear();
  usersByUsername.clear();

  for (const user of users) {
    usersById.set(user.id, user);
    usersByUsername.set(user.username.trim().toLowerCase(), user);
  }
}

rebuildUserIndexes();

let credentialsByUserId: Record<string, string> = {
  'viewer-1': 'patchbay123'
};

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

let followsByUserId: Record<string, string[]> = {
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

const platformAssetsFixture: PlatformAssetsPageData = {
  featureOpen: false,
  intro:
    'Assets stays under the platform because land, storage, and collective funds need public stewardship before they become live means of production in common.',
  landAssets: [
    {
      id: 'land-tool-library-campus',
      slug: 'tool-library-campus',
      title: 'Tool Library Campus Lot',
      locationLabel: 'North side tool library block',
      acreageLabel: '0.7 acres',
      stewardshipNote:
        'This land record groups the workshop building, open repair yard, and adjacent storage area under one stewardship record so collective services can attach cleanly.',
      managementProjects: [
        {
          id: 'asset-project-tool-library-land-stewardship',
          title: 'Tool Library Land Stewardship Service',
          projectMode: 'collective-service',
          relationshipLabel: 'Primary land management',
          statusLabel: 'Preview seed',
          summary:
            'Collective stewardship work for maintenance windows, access rules, and shared site upgrades tied to the tool library land asset.',
          href: null
        }
      ],
      storageProjects: [
        {
          id: 'asset-project-tool-library-storage',
          title: 'Tool Library Storage Facility Service',
          projectMode: 'collective-service',
          relationshipLabel: 'Storage facility on site',
          statusLabel: 'Preview seed',
          summary:
            'Collective storage service for intake shelves, overflow bins, and shared material custody on the campus lot.',
          href: null
        }
      ],
      linkedProjects: [
        {
          id: 'project-repair-cafe',
          title: 'Repair Cafe Shift Grid',
          projectMode: 'collective-service',
          relationshipLabel: 'Uses workshop floor on this land',
          statusLabel: 'Existing project',
          summary:
            'Active repair-cafe shifts depend on the workshop floor and shared intake area attached to this land asset.',
          href: '/projects/repair-cafe-shift-grid'
        },
        {
          id: 'project-childcare-checkin-desk',
          title: 'Childcare Check-in Desk Service',
          projectMode: 'collective-service',
          relationshipLabel: 'Uses front room on this land',
          statusLabel: 'Existing project',
          summary:
            'The current childcare check-in desk depends on front-room access within this same site.',
          href: '/projects/childcare-checkin-desk-service'
        }
      ]
    },
    {
      id: 'land-east-market-commons',
      slug: 'east-market-commons',
      title: 'East Market Commons Lot',
      locationLabel: 'East Market retrofit and pickup cluster',
      acreageLabel: '1.3 acres',
      stewardshipNote:
        'This lot ties together retrofit staging space, a future shared cold-storage pad, and pickup lanes that multiple neighborhood services already depend on.',
      managementProjects: [
        {
          id: 'asset-project-east-market-land-stewardship',
          title: 'East Market Land Stewardship Service',
          projectMode: 'collective-service',
          relationshipLabel: 'Primary land management',
          statusLabel: 'Preview seed',
          summary:
            'Collective stewardship for maintenance, scheduling, and site-use agreements across the East Market land record.',
          href: null
        }
      ],
      storageProjects: [
        {
          id: 'asset-project-east-market-cold-storage',
          title: 'East Market Cold Storage Service',
          projectMode: 'collective-service',
          relationshipLabel: 'Storage facility on site',
          statusLabel: 'Preview seed',
          summary:
            'Cold-storage stewardship service for shared food custody and reserve handling on the commons lot.',
          href: null
        },
        {
          id: 'asset-project-east-market-material-shed',
          title: 'Retrofit Materials Shed Service',
          projectMode: 'collective-service',
          relationshipLabel: 'Storage facility on site',
          statusLabel: 'Preview seed',
          summary:
            'Shared storage service for retrofit materials, staging tables, and neighborhood build inventory on the lot.',
          href: null
        }
      ],
      linkedProjects: [
        {
          id: 'project-ride-coordination-land-link',
          title: 'Neighborhood Ride Coordination Service',
          projectMode: 'collective-service',
          relationshipLabel: 'Uses pickup lane and dispatch table on this land',
          statusLabel: 'Existing project',
          summary:
            'The active ride desk uses the pickup lane and visible dispatch area attached to the commons lot.',
          href: '/projects/neighborhood-ride-coordination-service'
        },
        {
          id: 'project-air-sealing-land-link',
          title: 'Hallway Air-Sealing Build Day',
          projectMode: 'productive',
          relationshipLabel: 'Uses retrofit staging area on this land',
          statusLabel: 'Existing project',
          summary:
            'The active build-day staging tables and materials layout sit on this commons lot once acquisition closes.',
          href: '/projects/hallway-air-sealing-build-day'
        }
      ]
    }
  ],
  funds: [
    {
      id: 'fund-east-market-cold-storage',
      slug: 'east-market-cold-storage-fund',
      title: 'East Market Cold Storage Fund',
      summary:
        'Collective fund round to secure shared cold-storage equipment and convert it into a nonprofit-held commons asset for the East Market lot.',
      progressPercent: 62,
      raisedLabel: '$18,600',
      targetLabel: '$30,000',
      status: 'active',
      executionNote:
        'Board members will eventually execute the real purchase with the nonprofit bank account, then convert the asset into the registry once the acquisition surface opens.',
      linkedAssetTitles: ['East Market Commons Lot'],
      projectHref: '/projects/east-market-cold-storage-acquisition-round'
    },
    {
      id: 'fund-tool-library-shed-conversion',
      slug: 'tool-library-shed-conversion-fund',
      title: 'Tool Library Storage Shed Conversion Fund',
      summary:
        'Completed fund round for converting an existing outbuilding into shared intake and overflow storage under collective stewardship.',
      progressPercent: 100,
      raisedLabel: '$12,400',
      targetLabel: '$12,400',
      status: 'completed',
      executionNote:
        'Funds are complete, but board members still need to execute the purchase and convert the resulting storage asset into the platform registry.',
      linkedAssetTitles: ['Tool Library Campus Lot'],
      projectHref: '/projects/tool-library-shed-conversion-round'
    }
  ]
};

type DynamicScopePageMeta = {
  description: string;
  note?: string;
  badges: string[];
  emptyFeedText: string;
};

const createdChannelScopeMetaBySlug: Record<string, DynamicScopePageMeta> = {};
const createdCommunityScopeMetaBySlug: Record<string, DynamicScopePageMeta> = {};

const clientStateStorageKey = 'social-production.web.client-state';

function createDefaultPublicFeedPreferences(): PublicFeedPreferences {
  return {
    scope: 'home',
    filter: 'all',
    sort: 'popular',
    window: 'all'
  };
}

function createDefaultPersonalFeedPreferences(): PersonalFeedPreferences {
  return {
    scope: 'following',
    filter: 'all',
    sort: 'popular',
    window: 'all'
  };
}

function createDefaultSettingsState(
  viewer: ViewerSummary
): SettingsPageData {
  return {
    profileUsername: viewer.username,
    profileBio: viewer.bio ?? '',
    appearanceThemeMode: 'light',
    defaultFeed: 'public',
    publicFeedPreferences: createDefaultPublicFeedPreferences(),
    personalFeedPreferences: createDefaultPersonalFeedPreferences(),
    hidePublicActivityFromPersonalFeeds: false,
    hidePersonalFeedFromNonFollowers: false,
    requireFollowApproval: false
  };
}

function normalizeSettingsState(
  viewer: ViewerSummary,
  settings?: Partial<SettingsPageData> | null
): SettingsPageData {
  const defaults = createDefaultSettingsState(viewer);

  return {
    ...defaults,
    ...settings,
    publicFeedPreferences: {
      ...defaults.publicFeedPreferences,
      ...(settings?.publicFeedPreferences ?? {})
    },
    personalFeedPreferences: {
      ...defaults.personalFeedPreferences,
      ...(settings?.personalFeedPreferences ?? {})
    },
    requireFollowApproval: settings?.hidePersonalFeedFromNonFollowers ?? false
  };
}

let settingsByUserId: Record<string, SettingsPageData> = currentViewer()
  ? {
      [activeViewer().id]: createDefaultSettingsState(activeViewer())
    }
  : {};

function currentSettingsState() {
  const viewer = currentViewer();

  if (!viewer) {
    return null;
  }

  const existing = settingsByUserId[viewer.id];

  if (existing) {
    const normalized = normalizeSettingsState(viewer, existing);
    normalized.profileUsername = viewer.username;
    settingsByUserId[viewer.id] = normalized;
    return normalized;
  }

  const created = createDefaultSettingsState(viewer);
  settingsByUserId[viewer.id] = created;
  return created;
}

function settingsForUser(userId: string) {
  return settingsByUserId[userId] ?? null;
}

function syncViewerProfileFromSettings(userId?: string | null) {
  const viewer = userById(userId ?? mockSessionFixture.currentViewerId);
  const settings = viewer ? settingsByUserId[viewer.id] : null;

  if (!viewer || !settings) {
    return;
  }

  viewer.bio = settings.profileBio.trim() ? settings.profileBio.trim() : undefined;
}

function persistClientState() {
  if (!browser) {
    return;
  }

  try {
    window.localStorage.setItem(
      clientStateStorageKey,
      JSON.stringify({
        currentViewerId: mockSessionFixture.currentViewerId,
        users,
        credentialsByUserId,
        followsByUserId,
        scopeMembershipByKey,
        settingsByUserId
      })
    );
  } catch {
    return;
  }
}

function hydratePersistedClientState() {
  if (!browser) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(clientStateStorageKey);

    if (!raw) {
      return false;
    }

    const persisted = JSON.parse(raw) as {
      currentViewerId?: string | null;
      users?: ViewerSummary[];
      credentialsByUserId?: Record<string, string>;
      followsByUserId?: Record<string, string[]>;
      scopeMembershipByKey?: Record<
        string,
        {
          memberIds?: string[];
          joinPolicy?: 'open' | 'invite_only';
          hiddenFeedCopy?: string;
          inviteToken?: string;
        }
      >;
      settingsByUserId?: Record<string, SettingsPageData>;
    };

    if (Array.isArray(persisted.users)) {
      users.splice(0, users.length, ...persisted.users);
      rebuildUserIndexes();
    }

    if (persisted.credentialsByUserId && typeof persisted.credentialsByUserId === 'object') {
      credentialsByUserId = {
        ...credentialsByUserId,
        ...persisted.credentialsByUserId
      };
    }

    if (persisted.followsByUserId && typeof persisted.followsByUserId === 'object') {
      followsByUserId = Object.fromEntries(
        Object.entries(persisted.followsByUserId).map(([userId, followedIds]) => [
          userId,
          Array.isArray(followedIds) ? followedIds.filter((value): value is string => typeof value === 'string') : []
        ])
      );
    }

    if (persisted.scopeMembershipByKey && typeof persisted.scopeMembershipByKey === 'object') {
      Object.assign(
        scopeMembershipByKey,
        Object.fromEntries(
          Object.entries(persisted.scopeMembershipByKey).map(([key, membership]) => [
            key,
            {
              ...scopeMembershipByKey[key],
              ...membership,
              memberIds: Array.isArray(membership?.memberIds)
                ? membership.memberIds.filter((value): value is string => typeof value === 'string')
                : scopeMembershipByKey[key]?.memberIds ?? []
            }
          ])
        )
      );
    }

    if (persisted.settingsByUserId && typeof persisted.settingsByUserId === 'object') {
      settingsByUserId = Object.fromEntries(
        Object.entries(persisted.settingsByUserId).map(([userId, settings]) => [
          userId,
          normalizeSettingsState(userById(userId) ?? patchbayUser, settings)
        ])
      );
    }

    mockSessionFixture.currentViewerId =
      typeof persisted.currentViewerId === 'string' || persisted.currentViewerId === null
        ? persisted.currentViewerId
        : mockSessionFixture.currentViewerId;

    if (mockSessionFixture.currentViewerId && !userById(mockSessionFixture.currentViewerId)) {
      mockSessionFixture.currentViewerId = null;
    }

    Object.keys(settingsByUserId).forEach((userId) => syncViewerProfileFromSettings(userId));
    currentSettingsState();

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
    locationLabel: 'Platform coordination room',
    voteCount: 29,
    activeVote: 1,
    signalCount: 41,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T11:10:00Z'
  },
  {
    kind: 'project',
    id: 'project-bike-light-tuneups',
    slug: 'patchbay-bike-light-tuneups',
    href: '/projects/patchbay-bike-light-tuneups',
    createdAt: '2026-04-30T18:25:00Z',
    title: 'Patchbay Evening Bike-Light Tuneups',
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
      'This personal service wrapped and is now marked closed; request history remains visible but no new scheduling is active.',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: 'Closed',
    locationLabel: 'East Market school commons',
    voteCount: 21,
    activeVote: 0,
    signalCount: 33,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T18:50:00Z'
  },
  {
    kind: 'project',
    id: 'project-fridge-route',
    slug: 'community-fridge-restock-route',
    href: '/projects/community-fridge-restock-route',
    createdAt: '2026-04-27T14:10:00Z',
    title: 'Community Fridge Restock Route',
    authorUsername: 'rowanloop',
    projectMode: 'collective-service',
    summary:
      'A neighborhood restock service that already settled its operating model and is now voting on route priorities, handoff windows, and request coverage.',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: 'Planning',
    locationLabel: 'East Market fridge loop',
    voteCount: 38,
    activeVote: 1,
    signalCount: 48,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T14:40:00Z'
  },
  {
    kind: 'project',
    id: 'project-east-market-cold-storage-acquisition',
    slug: 'east-market-cold-storage-acquisition-round',
    href: '/projects/east-market-cold-storage-acquisition-round',
    createdAt: '2026-04-30T15:15:00Z',
    title: 'East Market Cold Storage Acquisition Round',
    authorUsername: 'rowanloop',
    projectMode: 'collective-service',
    summary:
      'A collective-service acquisition round that already settled its operating path and is now pooling contributions for shared cold-storage equipment on the East Market lot.',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: 'Acquisition',
    locationLabel: 'East Market cold-storage pad',
    voteCount: 34,
    activeVote: 1,
    signalCount: 49,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T20:10:00Z'
  },
  {
    kind: 'project',
    id: 'project-tool-library-shed-conversion-acquisition',
    slug: 'tool-library-shed-conversion-round',
    href: '/projects/tool-library-shed-conversion-round',
    createdAt: '2026-04-30T15:40:00Z',
    title: 'Tool Library Shed Conversion Acquisition Round',
    authorUsername: 'toolorbit',
    projectMode: 'collective-service',
    summary:
      'A collective-service acquisition round that is converting an existing outbuilding into shared intake and overflow storage before the service shifts can open.',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: 'Acquisition',
    locationLabel: 'Tool Library campus outbuilding',
    voteCount: 29,
    activeVote: 1,
    signalCount: 41,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T20:25:00Z'
  },
  {
    kind: 'project',
    id: 'project-repair-cafe',
    slug: 'repair-cafe-shift-grid',
    href: '/projects/repair-cafe-shift-grid',
    createdAt: '2026-04-27T16:00:00Z',
    title: 'Repair Cafe Shift Grid',
    authorUsername: 'toolorbit',
    projectMode: 'collective-service',
    summary:
      'A live repair-cafe service with approved operating and access plans, now coordinating concrete shift blocks and contingent volunteer roles.',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: 'Activity',
    locationLabel: 'Tool Library repair floor',
    voteCount: 44,
    activeVote: 1,
    signalCount: 63,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T16:55:00Z'
  },
  {
    kind: 'project',
    id: 'project-neighborhood-ride-coordination',
    slug: 'neighborhood-ride-coordination-service',
    href: '/projects/neighborhood-ride-coordination-service',
    createdAt: '2026-04-30T12:20:00Z',
    title: 'Neighborhood Ride Coordination Service',
    authorUsername: 'quietember',
    projectMode: 'collective-service',
    summary:
      'A collective service in activity phase using direct requests without calendar slot booking so members can submit needs as they arise.',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: 'Activity',
    locationLabel: 'East Market dispatch desk',
    voteCount: 31,
    activeVote: 1,
    signalCount: 44,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T19:10:00Z'
  },
  {
    kind: 'project',
    id: 'project-childcare-checkin-desk',
    slug: 'childcare-checkin-desk-service',
    href: '/projects/childcare-checkin-desk-service',
    createdAt: '2026-04-30T12:45:00Z',
    title: 'Childcare Check-in Desk Service',
    authorUsername: 'toolorbit',
    projectMode: 'collective-service',
    summary:
      'A collective service in activity phase with both calendar booking and direct requests enabled for testing blended request flow.',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: 'Activity',
    locationLabel: 'Tool Library front room',
    voteCount: 36,
    activeVote: 1,
    signalCount: 52,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T19:30:00Z'
  },
  {
    kind: 'project',
    id: 'project-blade-sharpening',
    slug: 'tool-library-blade-sharpening-service',
    href: '/projects/tool-library-blade-sharpening-service',
    createdAt: '2026-04-26T19:25:00Z',
    title: 'Tool Library Blade Sharpening Service',
    authorUsername: 'toolorbit',
    projectMode: 'collective-service',
    summary:
      'A completed pilot that converted into an ongoing sharpening service, with recurring intake and pickup still coordinated through the project surface.',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: 'Closed',
    locationLabel: 'Tool Library intake shelf',
    voteCount: 32,
    activeVote: 1,
    signalCount: 36,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T15:10:00Z'
  },
  {
    kind: 'project',
    id: 'project-insulation-kits',
    slug: 'neighborhood-insulation-kit-round',
    href: '/projects/neighborhood-insulation-kit-round',
    createdAt: '2026-04-28T11:30:00Z',
    title: 'Neighborhood Insulation Kit Round',
    authorUsername: 'patchbay',
    projectMode: 'productive',
    summary:
      'A productive build round that completed demand ranking and is now choosing the final production model for the first kit batch.',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: 'Planning',
    locationLabel: 'East Market staging table',
    voteCount: 47,
    activeVote: 1,
    signalCount: 69,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T16:20:00Z'
  },
  {
    kind: 'project',
    id: 'project-battery-share',
    slug: 'community-solar-battery-share',
    href: '/projects/community-solar-battery-share',
    createdAt: '2026-04-27T10:20:00Z',
    title: 'Community Solar Battery Share',
    authorUsername: 'rowanloop',
    projectMode: 'productive',
    summary:
      'A productive energy project that already picked its build model and is now deciding reserve rules, overflow windows, and shared access priorities.',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: 'Planning',
    locationLabel: 'Community energy shed',
    voteCount: 41,
    activeVote: 1,
    signalCount: 54,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T16:45:00Z'
  },
  {
    kind: 'project',
    id: 'project-air-sealing',
    slug: 'hallway-air-sealing-build-day',
    href: '/projects/hallway-air-sealing-build-day',
    createdAt: '2026-04-28T15:45:00Z',
    title: 'Hallway Air-Sealing Build Day',
    authorUsername: 'toolorbit',
    projectMode: 'productive',
    summary:
      'A productive project already in contingent scheduling, where each build block only activates once every required role is filled.',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: 'Activity',
    locationLabel: 'North hall stairwell',
    voteCount: 35,
    activeVote: 1,
    signalCount: 46,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T17:05:00Z'
  },
  {
    kind: 'project',
    id: 'project-weatherization-wrap',
    slug: 'block-weatherization-pilot-wrap',
    href: '/projects/block-weatherization-pilot-wrap',
    createdAt: '2026-04-26T14:35:00Z',
    title: 'Block Weatherization Pilot Wrap',
    authorUsername: 'mika',
    projectMode: 'productive',
    summary:
      'A completed productive pilot that is now documenting completion notes, carry-forward lessons, and possible conversion paths for the next round.',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: 'Closed',
    locationLabel: 'East Market retrofit block',
    voteCount: 28,
    activeVote: 0,
    signalCount: 31,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T17:30:00Z'
  },
  {
    kind: 'project',
    id: 'project-ride-desk',
    slug: 'mutual-aid-ride-request-desk',
    href: '/projects/mutual-aid-ride-request-desk',
    createdAt: '2026-04-28T09:15:00Z',
    title: 'Mutual Aid Ride Request Desk',
    authorUsername: 'quietember',
    projectMode: 'collective-service',
    summary:
      'A collective service still in demand signalling, collecting route demand and value priorities before operations and access planning open.',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: 'Proposal',
    locationLabel: 'Clinic and school pickup lanes',
    voteCount: 24,
    activeVote: 1,
    signalCount: 39,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: '2026-04-30T18:00:00Z'
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
  'east-market-cold-storage-acquisition-round': ['viewer-1', 'user-rowan', 'user-mika'],
  'tool-library-shed-conversion-round': ['viewer-1', 'user-tool', 'user-rowan'],
  'repair-cafe-shift-grid': ['viewer-1', 'user-tool', 'user-rowan', 'user-mika'],
  'neighborhood-ride-coordination-service': ['viewer-1', 'user-rowan', 'user-ember'],
  'childcare-checkin-desk-service': ['viewer-1', 'user-tool', 'user-rowan'],
  'tool-library-blade-sharpening-service': ['viewer-1', 'user-tool', 'user-mika'],
  'neighborhood-insulation-kit-round': ['viewer-1', 'user-rowan', 'user-mika'],
  'community-solar-battery-share': ['viewer-1', 'user-rowan', 'user-mika'],
  'hallway-air-sealing-build-day': ['viewer-1', 'user-tool', 'user-rowan'],
  'block-weatherization-pilot-wrap': ['viewer-1', 'user-mika', 'user-ember'],
  'mutual-aid-ride-request-desk': ['viewer-1', 'user-rowan', 'user-ember'],
  'patchbay-bike-light-tuneups': ['viewer-1', 'user-tool'],
  'rowan-after-school-device-checks': ['viewer-1', 'user-rowan', 'user-mika']
};

function seedMembershipSinceBySlug(
  membersBySlug: Record<string, string[]>,
  seededAt = '2026-01-01T00:00:00Z'
) {
  return Object.fromEntries(
    Object.entries(membersBySlug).map(([slug, memberIds]) => [
      slug,
      Object.fromEntries(memberIds.map((userId) => [userId, seededAt]))
    ])
  ) as Record<string, Record<string, string>>;
}

const projectMembershipSinceBySlug: Record<string, Record<string, string>> = seedMembershipSinceBySlug(
  projectMembersBySlug
);

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
  'community-fridge-restock-route': {
    managerIds: ['user-rowan'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'east-market-cold-storage-acquisition-round': {
    managerIds: ['user-rowan'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'tool-library-shed-conversion-round': {
    managerIds: ['user-tool'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'repair-cafe-shift-grid': {
    managerIds: ['user-tool'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'neighborhood-ride-coordination-service': {
    managerIds: ['user-ember'],
    candidateIds: [],
    confidenceTargetIdsByUserId: {}
  },
  'childcare-checkin-desk-service': {
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

const eventWorkflowStateBySlug: Record<string, EventWorkflowState> = {
  'tool-library-spring-swap-social': {
    editorUserIds: ['user-tool'],
    updateRequests: [],
    editRequests: []
  },
  'retrofit-night-walk': {
    editorUserIds: ['user-mika'],
    updateRequests: [],
    editRequests: []
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
    title: 'Closed or Converted',
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
    title: 'Closed',
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
    title: 'Activity',
    summary:
      'A personal service opens directly into a visible calendar where the creator posts availability and other people request a slot.',
    mechanics: [
      'The creator adds availability blocks to the calendar instead of repeating the full service description again here.',
      'Other users can click an available date on the calendar to request a specific time, title, and message.',
      'Accepted requests remove the matching availability from the calendar so the remaining open time stays legible.'
    ]
  },
  {
    id: 'phase-2',
    order: 2,
    shortLabel: 'Phase 2',
    title: 'Closed',
    summary:
      'The personal service can close cleanly here, while still leaving a note about why it closed or where the work moved next.',
    mechanics: [
      'The creator must leave a closure note when the service closes so the history still explains what happened.',
      'If the service needs more people or formal planning, it can convert into a collective service or productive project.',
      'There is no quorum or planning vote in this personal service path.'
    ]
  }
];

function personalServicePhaseBlueprintsForRequestMode(mode: 'calendar' | 'direct' | 'both') {
  if (mode === 'calendar') {
    return personalServicePhaseBlueprints;
  }

  return personalServicePhaseBlueprints.map((phase) =>
    phase.id === 'phase-1'
      ? {
          ...phase,
          title: 'Activity',
          summary:
            mode === 'both'
              ? 'A personal service can keep calendar slot booking and direct written requests open at the same time.'
              : 'A personal service can open directly into written requests when the work does not need bookable calendar slots.',
          mechanics:
            mode === 'both'
              ? [
                  'The creator can post availability on the calendar while also accepting unscheduled direct requests.',
                  'Requesters can either click a calendar slot for a time-bound request or send a direct written request.',
                  'Accepted slot-based requests still remove matching availability so open time remains legible.'
                ]
              : [
                  'People use the request button to describe what they need and what they expect from the service.',
                  'The creator reviews incoming requests, replies in messages, and accepts or declines each request privately.',
                  'The service description carries expectations in this mode, so there is no public availability calendar.'
                ]
        }
      : phase
  );
}

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
  'east-market-cold-storage-acquisition-round': {
    currentPhaseId: 'phase-4',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus:
          'The service already established demand and shared values around common cold storage before planning opened.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus:
          'The operating plan is settled, including the equipment footprint and stewardship roles needed once the storage service goes live.'
      },
      'phase-3': {
        progressState: 'complete',
        projectStatus:
          'Access rules for shared storage use are approved, so the project can now focus on acquisition and conversion.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus:
          'This preview round is actively pooling contributions and vendor quotes so the cold-storage equipment can be purchased and converted into the East Market asset registry at the close of acquisition.'
      },
      'phase-5': {
        projectStatus:
          'Once acquisition closes and the equipment is converted into the registry, managers can schedule the first stewardship and handoff shifts.'
      },
      'phase-6': {
        projectStatus:
          'The project can close after the first operating cycle or convert into an ongoing shared storage service.'
      }
    }
  },
  'tool-library-shed-conversion-round': {
    currentPhaseId: 'phase-4',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus:
          'Demand and shared values are already clear for a dedicated intake and overflow storage shed on the campus lot.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus:
          'The conversion plan is approved, including the intake shelving, power work, and stewardship roles the storage service will need.'
      },
      'phase-3': {
        progressState: 'complete',
        projectStatus:
          'Access and reserve rules are approved, so the round can move into acquisition and contractor coordination.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus:
          'This preview round is already funded and now waits on board execution, contractor booking, and conversion into the Tool Library asset registry before activity can start.'
      },
      'phase-5': {
        projectStatus:
          'Once the shed is converted into a registered shared asset, managers can open concrete intake and overflow service shifts.'
      },
      'phase-6': {
        projectStatus:
          'The project can close after the first operating cycle or convert into a standing storage service.'
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
  'neighborhood-ride-coordination-service': {
    currentPhaseId: 'phase-5',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus: 'Demand and value ranking are complete for this service.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus: 'Operations planning is complete.'
      },
      'phase-3': {
        progressState: 'complete',
        projectStatus: 'Access planning approved direct request intake without calendar booking.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus: 'Acquisition remains locked in beta.'
      },
      'phase-5': {
        projectStatus: 'The service is active with direct request intake and no calendar slot requirement.'
      },
      'phase-6': {
        projectStatus: 'Managers can close this service after the current run completes.'
      }
    }
  },
  'childcare-checkin-desk-service': {
    currentPhaseId: 'phase-5',
    phases: {
      'phase-1': {
        progressState: 'complete',
        projectStatus: 'Demand and value ranking are complete for this service.'
      },
      'phase-2': {
        progressState: 'complete',
        projectStatus: 'Operations planning is complete.'
      },
      'phase-3': {
        progressState: 'complete',
        projectStatus: 'Access planning approved both calendar booking and direct request intake.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus: 'Acquisition remains locked in beta.'
      },
      'phase-5': {
        projectStatus: 'The service is active with both calendar availability and direct requests enabled.'
      },
      'phase-6': {
        projectStatus: 'Managers can close this service after the current run completes.'
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
        projectStatus: 'When the creator stops running this service, it can be marked closed or converted.'
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

function createProjectLifecycleConfig(projectMode: ProjectMode): ProjectLifecycleConfig {
  if (projectMode === 'personal-service') {
    return {
      currentPhaseId: 'phase-1',
      phases: {
        'phase-1': {
          projectStatus:
            'This personal service is active with calendar-based availability and direct request intake managed by the creator.'
        },
        'phase-2': {
          projectStatus:
            'When this service stops running, the creator closes it here with a note for the historical record.'
        }
      }
    };
  }

  return {
    currentPhaseId: 'phase-1',
    phases: {
      'phase-1': {
        projectStatus:
          'This project is still collecting demand, ranked values, and early member interest before planning opens.'
      },
      'phase-2': {
        projectStatus:
          projectMode === 'collective-service'
            ? 'Operations planning opens here once the proposal has enough shared direction to define how the service should run.'
            : 'Production planning opens here once the proposal has enough shared direction to define the work concretely.'
      },
      'phase-3': {
        projectStatus:
          projectMode === 'collective-service'
            ? 'Access planning opens after an operations plan wins quorum and members need to define how requests and access should work.'
            : 'Distribution planning opens after a production plan wins quorum.'
      },
      'phase-4': {
        betaLocked: true,
        projectStatus: 'Acquisition remains visible in the lifecycle but stays unavailable in this beta.'
      },
      'phase-5': {
        projectStatus: 'Scheduling and role-based activities open after planning resolves.'
      },
      'phase-6': {
        projectStatus: 'The project can close after the first round or convert into an ongoing service.'
      }
    }
  };
}

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
  demandSignalSnapshot?: number;
  demandConsiderationNote?: string;
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
  requestMode?: 'calendar' | 'direct' | 'both';
  allowOffScheduleRequests?: boolean;
};

const demandSignalAssessmentValueId = '__demand-signal__';

type RawProjectServiceRequest = {
  id: string;
  title: string;
  body: string;
  requesterUsername: string;
  createdAt: string;
  status: ProjectServiceRequestStatus;
  scheduledAt?: string;
  endsAt?: string;
  linkedActivityId?: string | null;
};

type RawProjectRequestSystemSettings = {
  enabled: boolean;
  requestMode: ProjectServiceRequestMode;
  allowOffScheduleRequests: boolean;
};

type RawProjectServiceRequestSettingsChangeRequest = {
  id: string;
  reason: string;
  authorUsername: string;
  createdAt: string;
  proposedSettings: RawProjectRequestSystemSettings;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawProjectServiceHistoryCompletion = {
  requesterSelectionsByUsername?: Record<string, ProjectServiceHistoryCompletionChoice>;
  participantSelectionsByUsername?: Record<string, ProjectServiceHistoryCompletionChoice>;
  requesterDoneByUsernames?: string[];
  participantDoneByUsernames?: string[];
};

type RawProjectRevertEntry = {
  id: string;
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>;
  reason: string;
  authorUsername: string;
  createdAt: string;
};

type RawProjectPhaseChangeRequest = {
  id: string;
  targetPhaseId: ProjectLifecyclePhaseId;
  reason: string;
  authorUsername: string;
  createdAt: string;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawProjectUpdateRequest = {
  id: string;
  title: string;
  body: string;
  authorUsername: string;
  createdAt: string;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawProjectEditRequest = {
  id: string;
  title: string;
  summary: string;
  overview: string;
  authorUsername: string;
  createdAt: string;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawEventUpdateRequest = {
  id: string;
  title: string;
  body: string;
  authorUsername: string;
  createdAt: string;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawEventEditRequest = {
  id: string;
  title: string;
  description: string;
  authorUsername: string;
  createdAt: string;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawProjectActivity = {
  id: string;
  title: string;
  authorUsername: string;
  scheduledAt: string;
  endsAt?: string;
  locationLabel: string;
  minimumParticipants: number;
  linkedPlanPhaseId?: string | null;
  linkedRequestId?: string | null;
  roles: Array<{
    label: string;
    requiredCount: number;
    maximumCount?: number;
    assignedUsernames: string[];
  }>;
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
  requestSystemEnabled?: boolean;
  requestSystemOverride?: RawProjectRequestSystemSettings;
  requestSettingsChangeRequests?: RawProjectServiceRequestSettingsChangeRequest[];
  serviceHistoryCompletions?: Record<string, RawProjectServiceHistoryCompletion>;
  revertHistory?: RawProjectRevertEntry[];
  phaseChangeRequests?: RawProjectPhaseChangeRequest[];
  updateRequests?: RawProjectUpdateRequest[];
  editRequests?: RawProjectEditRequest[];
  availabilitySummary?: string;
  travelRadiusLabel?: string;
  serviceRequestMode?: 'calendar' | 'direct' | 'both';
};

type EventWorkflowState = {
  editorUserIds: string[];
  updateRequests?: RawEventUpdateRequest[];
  editRequests?: RawEventEditRequest[];
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

const phaseChangeApprovalThresholdPercent = 70;

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
  'east-market-cold-storage-acquisition-round': {
    signalCount: 49,
    signalUserIds: ['viewer-1', 'user-rowan', 'user-mika'],
    values: [
      {
        id: 'value-east-market-cold-storage-1',
        label: 'Keep shared cold storage publicly stewarded so reserve handling stays accountable.',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 4,
          'user-mika': 4
        }
      },
      {
        id: 'value-east-market-cold-storage-2',
        label: 'Make the acquisition handoff legible before the equipment becomes a common asset.',
        authorUsername: 'mika',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 3,
          'user-mika': 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-east-market-cold-storage-1',
        title: 'Shared walk-in cooler plus intake rail',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-30T15:20:00Z',
        outputSummary:
          'Install one shared cold-storage unit with a visible intake rail and steward rotation for reserve handling.',
        materialsSummary:
          'Needs the cooler unit, intake shelving, one monitoring station, and steward setup time.',
        totalCostLabel: '$30,000 target',
        acquisitionsSummary: 'Depends on the acquisition round closing and the equipment being executed through the nonprofit account.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-east-market-cold-storage-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          },
          'value-east-market-cold-storage-2': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-east-market-cold-storage-1',
        title: 'Stewarded reserve windows',
        authorUsername: 'mika',
        createdAt: '2026-04-30T15:35:00Z',
        distributionSummary:
          'Open stewarded reserve windows first, then release overflow storage time once the day reserve is set.',
        accessSummary:
          'Shared storage stays visible and stewarded, with reserve handling logged before overflow use opens wider.',
        reserveSummary: 'Keep one reserve shelf zone for urgent food preservation and accessibility needs.',
        requestSystemEnabled: false,
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-mika': 'yes'
        },
        valueVotesByValueId: {
          'value-east-market-cold-storage-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          },
          'value-east-market-cold-storage-2': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-mika': 'yes'
          }
        }
      }
    ],
    phaseFiveActivities: []
  },
  'tool-library-shed-conversion-round': {
    signalCount: 41,
    signalUserIds: ['viewer-1', 'user-tool', 'user-rowan'],
    values: [
      {
        id: 'value-tool-library-shed-1',
        label: 'Keep intake and overflow storage visible enough that members can tell what is entering common custody.',
        authorUsername: 'toolorbit',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 4,
          'user-rowan': 4
        }
      },
      {
        id: 'value-tool-library-shed-2',
        label: 'Finish the acquisition handoff before any storage shifts are scheduled against the site.',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 4,
          'user-rowan': 3
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-tool-library-shed-1',
        title: 'Convert the campus outbuilding into intake storage',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-30T15:45:00Z',
        outputSummary:
          'Convert the existing outbuilding into a shared intake and overflow shed with labeled custody zones.',
        materialsSummary:
          'Needs shelving, lighting, electrical work, and lockable intake handoff points.',
        totalCostLabel: '$12,400 raised',
        acquisitionsSummary: 'Funding is complete and now waits on board execution plus contractor coordination.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes'
        },
        valueVotesByValueId: {
          'value-tool-library-shed-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          },
          'value-tool-library-shed-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-tool-library-shed-1',
        title: 'Stewarded intake windows',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-30T15:58:00Z',
        distributionSummary:
          'Use stewarded intake windows and tagged overflow bins so stored materials never lose custody clarity.',
        accessSummary:
          'Shared storage opens through visible stewarded windows first, with overflow retrieval handled in tagged pickup windows.',
        reserveSummary: 'Keep one locked reserve shelf for urgent replacements and accessibility equipment.',
        requestSystemEnabled: false,
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes'
        },
        valueVotesByValueId: {
          'value-tool-library-shed-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          },
          'value-tool-library-shed-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
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
        requestSystemEnabled: true,
        requestMode: 'both',
        allowOffScheduleRequests: true,
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
        id: 'project-activity-repair-0',
        title: 'Tuesday repair cafe kickoff',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-01T18:00:00Z',
        endsAt: '2026-05-01T21:00:00Z',
        locationLabel: 'Tool Library workshop floor',
        minimumParticipants: 2,
        linkedPlanPhaseId: 'production-plan-repair-1-phase-1',
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
          }
        ],
        note: 'Initial floor layout and queue test for the repair night workflow.'
      },
      {
        id: 'project-activity-repair-1',
        title: 'Thursday repair cafe shift',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-05T18:00:00Z',
        endsAt: '2026-05-05T21:00:00Z',
        locationLabel: 'Tool Library workshop floor',
        minimumParticipants: 3,
        linkedPlanPhaseId: 'production-plan-repair-1-phase-1',
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
            assignedUsernames: ['rowanloop']
          }
        ],
        note: 'This shift opened with all three floor roles covered.'
      },
      {
        id: 'project-activity-repair-2',
        title: 'Next Thursday repair cafe shift',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-21T18:00:00Z',
        endsAt: '2026-05-21T21:00:00Z',
        locationLabel: 'Tool Library workshop floor',
        minimumParticipants: 3,
        linkedPlanPhaseId: 'production-plan-repair-1-phase-1',
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
        note: 'The next shift stays tentative until the final queue role is filled.'
      }
    ],
    serviceHistoryCompletions: {
      'activity:project-activity-repair-0': {
        participantSelectionsByUsername: {
          patchbay: 'completed',
          toolorbit: 'completed'
        }
      },
      'activity:project-activity-repair-1': {
        participantSelectionsByUsername: {
          patchbay: 'completed',
          toolorbit: 'completed',
          rowanloop: 'uncompleted'
        }
      }
    }
  },
  'neighborhood-ride-coordination-service': {
    signalCount: 44,
    signalUserIds: ['viewer-1', 'user-rowan', 'user-ember'],
    values: [
      {
        id: 'value-ride-coordination-1',
        label: 'Keep urgent ride support requestable without waiting for fixed slots.',
        authorUsername: 'quietember',
        votesByUserId: {
          'viewer-1': 4,
          'user-rowan': 4,
          'user-ember': 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-ride-coordination-1',
        title: 'Dispatch desk with rotating coordinator',
        authorUsername: 'quietember',
        createdAt: '2026-04-30T12:25:00Z',
        outputSummary: 'Keep one dispatcher on rotation and assign rides by request urgency and route overlap.',
        materialsSummary: 'Needs one dispatch lead and one backup contact each day.',
        totalCostLabel: '$0 direct spend',
        acquisitionsSummary: 'Uses existing volunteer time and local transport capacity.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-ember': 'yes'
        },
        valueVotesByValueId: {
          'value-ride-coordination-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-ember': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-ride-coordination-1',
        title: 'Direct intake only',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-30T12:35:00Z',
        distributionSummary: 'Take requests directly and dispatch by urgency without public slot booking.',
        accessSummary: 'Members submit written requests any time and coordinators match available drivers.',
        reserveSummary: 'Keep a small reserve for urgent medical and safety rides.',
        requestSystemEnabled: true,
        requestMode: 'direct',
        allowOffScheduleRequests: true,
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-rowan': 'yes',
          'user-ember': 'yes'
        },
        valueVotesByValueId: {
          'value-ride-coordination-1': {
            'viewer-1': 'yes',
            'user-rowan': 'yes',
            'user-ember': 'yes'
          }
        }
      }
    ],
    phaseFiveActivities: [],
    serviceRequests: [
      {
        id: 'service-request-ride-coordination-1',
        title: 'Clinic pickup support',
        body: 'Need a one-way ride for a 3 PM clinic appointment with short notice.',
        requesterUsername: 'patchbay',
        createdAt: '2026-04-30T19:05:00Z',
        status: 'open'
      }
    ]
  },
  'childcare-checkin-desk-service': {
    signalCount: 52,
    signalUserIds: ['viewer-1', 'user-tool', 'user-rowan'],
    values: [
      {
        id: 'value-childcare-checkin-1',
        label: 'Support both planned booking and last-minute help requests.',
        authorUsername: 'toolorbit',
        votesByUserId: {
          'viewer-1': 4,
          'user-tool': 4,
          'user-rowan': 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: 'production-plan-childcare-checkin-1',
        title: 'Check-in desk with rotating greeter',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-30T12:50:00Z',
        outputSummary: 'Run a visible check-in desk with one greeter and one support backup each block.',
        materialsSummary: 'Needs one check-in lead plus rotating support.',
        totalCostLabel: '$0 direct spend',
        acquisitionsSummary: 'Uses existing shared room and volunteer rotation.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes'
        },
        valueVotesByValueId: {
          'value-childcare-checkin-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-childcare-checkin-1',
        title: 'Calendar and direct requests',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-30T13:00:00Z',
        distributionSummary: 'Keep bookable check-in blocks while allowing direct written requests.',
        accessSummary: 'Users can book listed slots or send direct requests when plans change.',
        reserveSummary: 'Leave one reserve slot per block for urgent childcare coverage.',
        requestSystemEnabled: true,
        requestMode: 'both',
        allowOffScheduleRequests: true,
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes'
        },
        valueVotesByValueId: {
          'value-childcare-checkin-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          }
        }
      }
    ],
    phaseFiveActivities: [
      {
        id: 'project-activity-childcare-checkin-1',
        title: 'Morning check-in desk',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-04T08:30:00Z',
        locationLabel: 'Tool Library front room',
        minimumParticipants: 2,
        roles: [
          {
            label: 'Desk lead',
            requiredCount: 1,
            assignedUsernames: ['toolorbit']
          },
          {
            label: 'Family support runner',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          }
        ],
        note: 'Open block with one reserve slot for urgent requests.'
      }
    ],
    serviceRequests: [
      {
        id: 'service-request-childcare-checkin-1',
        title: 'Friday morning drop-in support',
        body: 'Need coverage for a short early shift and can confirm details in chat.',
        requesterUsername: 'rowanloop',
        createdAt: '2026-04-30T19:25:00Z',
        status: 'open',
        scheduledAt: '2026-05-04T08:30:00Z',
        endsAt: '2026-05-04T09:00:00Z'
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
    phaseTwoPlans: [
      {
        id: 'production-plan-airseal-1',
        title: 'Hallway prep and sealing runbook',
        authorUsername: 'toolorbit',
        createdAt: '2026-05-02T15:15:00Z',
        outputSummary: 'Stage materials by hallway, seal priority gaps first, and leave a verification sweep before wrap-up.',
        materialsSummary: 'Requires labeled sealant kits, masking bundles, ladders, and one staged cleanup station per hallway.',
        totalCostLabel: '$320 pooled materials',
        acquisitionsSummary: 'Buy sealant refills and masking materials in one batch before the install block opens.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes'
        },
        valueVotesByValueId: {
          'value-airseal-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          },
          'value-airseal-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: 'distribution-plan-airseal-1',
        title: 'Hallway-by-hallway access and verification order',
        authorUsername: 'rowanloop',
        createdAt: '2026-05-05T17:00:00Z',
        distributionSummary: 'Open each hallway in a fixed order so staged materials and installers move in one direction without doubling back.',
        accessSummary: 'Residents get hallway-specific timing notices, then each block reopens only after the smoke check passes.',
        reserveSummary: 'Keep one flex hour at the end of the week for units that fail the first verification sweep.',
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes'
        },
        valueVotesByValueId: {
          'value-airseal-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          },
          'value-airseal-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          }
        }
      }
    ],
    phaseFiveActivities: [
      {
        id: 'project-activity-airseal-0',
        title: 'Material staging and masking pass',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-10T09:00:00Z',
        endsAt: '2026-05-10T12:00:00Z',
        locationLabel: 'Tool Library annex workshop',
        minimumParticipants: 2,
        roles: [
          {
            label: 'Prep lead',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          },
          {
            label: 'Material runner',
            requiredCount: 1,
            assignedUsernames: ['toolorbit']
          }
        ],
        note: 'Past prep block that staged masking and sealant bundles for the main install round.'
      },
      {
        id: 'project-activity-airseal-1',
        title: 'Saturday hallway sealing block',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-18T10:00:00Z',
        endsAt: '2026-05-18T14:00:00Z',
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
            assignedUsernames: ['toolorbit', 'rowanloop']
          }
        ],
        note: 'This session only activates when all required install roles are filled.'
      },
      {
        id: 'project-activity-airseal-2',
        title: 'Smoke check and touch-up round',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-22T17:30:00Z',
        endsAt: '2026-05-22T19:00:00Z',
        locationLabel: 'East Market north hall',
        minimumParticipants: 2,
        roles: [
          {
            label: 'Seal check lead',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          },
          {
            label: 'Smoke test support',
            requiredCount: 1,
            assignedUsernames: []
          }
        ],
        note: 'Follow-up verification round with one remaining support slot still open.'
      }
    ],
    serviceHistoryCompletions: {
      'activity:project-activity-airseal-0': {
        participantSelectionsByUsername: {
          patchbay: 'completed',
          toolorbit: 'completed'
        }
      }
    }
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
        title: 'Available',
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
        requesterUsername: 'toolorbit',
        createdAt: '2026-04-30T18:30:00Z',
        status: 'open',
        scheduledAt: '2026-05-03T18:30:00Z',
        endsAt: '2026-05-03T19:00:00Z'
      }
    ],
    serviceRequestMode: 'both',
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
        requesterUsername: 'patchbay',
        createdAt: '2026-04-26T16:10:00Z',
        status: 'accepted',
        scheduledAt: '2026-04-27T15:00:00Z',
        endsAt: '2026-04-27T15:30:00Z'
      },
      {
        id: 'service-request-device-checks-2',
        title: 'Charging-port replacement',
        body: 'Declined because replacement part was not available in the closing week.',
        requesterUsername: 'mika',
        createdAt: '2026-04-26T16:50:00Z',
        status: 'declined',
        scheduledAt: '2026-04-27T16:00:00Z',
        endsAt: '2026-04-27T17:00:00Z'
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

function normalizeUsernameInput(username: string) {
  return username.trim().replace(/^@+/, '').toLowerCase();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(baseValue: string) {
  const fallback = 'new-surface';
  const baseSlug = slugify(baseValue) || fallback;
  let candidate = baseSlug;
  let suffix = 2;

  while (publicFeedBase.some((item) => item.slug === candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function uniqueScopeSlug(baseValue: string, kind: Extract<ScopeKind, 'channel' | 'community'>) {
  const fallback = kind === 'channel' ? 'new-channel' : 'new-community';
  const baseSlug = slugify(baseValue) || fallback;
  const directory = kind === 'channel' ? channelDirectory : communityDirectory;
  let candidate = baseSlug;
  let suffix = 2;

  while (
    directory.some((item) => item.slug === candidate) ||
    (kind === 'channel' && platform.slug === candidate)
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function uniquePostId(baseValue: string) {
  const fallback = 'post';
  const baseId = `post-${slugify(baseValue) || fallback}`;
  let candidate = baseId;
  let suffix = 2;

  while (socialPostsBase.some((post) => post.id === candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function uniqueUserId(baseValue: string) {
  const fallback = 'member';
  const baseId = `user-${slugify(baseValue) || fallback}`;
  let candidate = baseId;
  let suffix = 2;

  while (usersById.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function projectLocationLabel(locationLabel: string) {
  const trimmed = locationLabel.trim();

  return trimmed || 'Location to be confirmed';
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

  if (projectMode === 'personal-service') {
    if (currentPhaseId === 'phase-2') {
      return 'Closed';
    }

    return 'Activity';
  }

  return projectFeedPhaseLabel(projectMode, currentPhaseId) ?? fallback;
}

function projectAuthorForSlug(slug: string) {
  const project = publicFeedBase.find(
    (item): item is PublicProjectItem => item.kind === 'project' && item.slug === slug
  );

  return project ? userByUsername(project.authorUsername) : null;
}

function isProjectCreator(slug: string, userId?: string | null) {
  const authorId = projectAuthorForSlug(slug)?.id;

  return !!userId && !!authorId && userId === authorId;
}

function personalServiceFollowerCount(slug: string) {
  const authorId = projectAuthorForSlug(slug)?.id;
  const memberIds = projectMembersBySlug[slug] ?? [];

  return authorId ? memberIds.filter((userId) => userId !== authorId).length : memberIds.length;
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
  const votesRequired =
    memberCount <= 0
      ? 0
      : Math.min(memberCount, Math.max(1, Math.ceil((memberCount * quorumThresholdPercent) / 100)));
  const votesRemaining = Math.max(votesRequired - totalVotes, 0);
  const remainingEligibleVotes = Math.max(memberCount - totalVotes, 0);

  return {
    yesCount,
    noCount,
    totalVotes,
    approvalPercent,
    activeVote: viewer ? votesByUserId[viewer.id] ?? null : null,
    meetsQuorum: votesRequired > 0 && totalVotes >= votesRequired,
    eligibleVoterCount: memberCount,
    quorumThresholdPercent,
    votesRequired,
    votesRemaining,
    remainingEligibleVotes
  };
}

function thresholdVoteCanStillPass(
  voteSummary: ProjectPlanVoteSummary,
  approvalThresholdPercent: number
) {
  return canProjectVoteStillPass(voteSummary, approvalThresholdPercent);
}

function phaseChangePassesApprovalThreshold(voteSummary: ProjectPlanVoteSummary) {
  return voteSummary.approvalPercent >= phaseChangeApprovalThresholdPercent;
}

function buildProjectPhaseChangeRequests(
  slug: string,
  projectMode: ProjectMode,
  currentPhaseId: ProjectLifecyclePhaseId,
  phaseBlueprints: Array<Pick<ProjectLifecyclePhase, 'id' | 'order' | 'title'>>,
  quorumThresholdPercent: number,
  memberCount: number
) {
  const workflow = readProjectWorkflowState(slug);
  const currentPhaseOrder =
    phaseBlueprints.find((phase) => phase.id === currentPhaseId)?.order ?? 1;

  if (!workflow) {
    return [] as ProjectLifecyclePhaseChangeRequest[];
  }

  return (workflow.phaseChangeRequests ?? [])
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        memberCount
      );
      const targetPhase = phaseBlueprints.find((phase) => phase.id === request.targetPhaseId);
      const targetOrder = targetPhase?.order ?? currentPhaseOrder;
      const kind =
        request.targetPhaseId === closePhaseIdForProject(projectMode) && targetOrder > currentPhaseOrder
          ? 'close'
          : targetOrder > currentPhaseOrder
            ? 'advance'
            : 'return';

      return {
        id: request.id,
        targetPhaseId: request.targetPhaseId,
        targetPhaseLabel: targetPhase?.title ?? request.targetPhaseId,
        reason: request.reason,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        kind,
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies ProjectLifecyclePhaseChangeRequest;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function buildProjectUpdateRequests(
  slug: string,
  quorumThresholdPercent: number,
  memberCount: number
) {
  const workflow = readProjectWorkflowState(slug);

  if (!workflow) {
    return [] as ProjectUpdateRequest[];
  }

  return (workflow.updateRequests ?? [])
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        memberCount
      );

      return {
        id: request.id,
        title: request.title,
        body: request.body,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies ProjectUpdateRequest;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function buildProjectEditRequests(
  slug: string,
  quorumThresholdPercent: number,
  memberCount: number
) {
  const workflow = readProjectWorkflowState(slug);

  if (!workflow) {
    return [] as ProjectEditRequest[];
  }

  return (workflow.editRequests ?? [])
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        memberCount
      );

      return {
        id: request.id,
        title: request.title,
        summary: request.summary,
        overview: request.overview,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies ProjectEditRequest;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function buildEventUpdateRequests(
  slug: string,
  quorumThresholdPercent: number,
  eligibleVoterCount: number
) {
  const workflow = eventWorkflowStateBySlug[slug];

  if (!workflow) {
    return [] as EventUpdateRequest[];
  }

  return (workflow.updateRequests ?? [])
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        eligibleVoterCount
      );

      return {
        id: request.id,
        title: request.title,
        body: request.body,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies EventUpdateRequest;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function buildEventEditRequests(
  slug: string,
  quorumThresholdPercent: number,
  eligibleVoterCount: number
) {
  const workflow = eventWorkflowStateBySlug[slug];

  if (!workflow) {
    return [] as EventEditRequest[];
  }

  return (workflow.editRequests ?? [])
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        eligibleVoterCount
      );

      return {
        id: request.id,
        title: request.title,
        description: request.description,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies EventEditRequest;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function uniqueUsernames(usernames: string[]) {
  return Array.from(new Set(usernames.filter(Boolean)));
}

function rawProjectActivityEndTime(activity: RawProjectActivity) {
  const activityStart = new Date(activity.scheduledAt).getTime();

  return activity.endsAt
    ? new Date(activity.endsAt).getTime()
    : activityStart + 60 * 60 * 1000;
}

function rawProjectActivityEndAt(activity: RawProjectActivity) {
  return new Date(rawProjectActivityEndTime(activity)).toISOString();
}

function projectServiceHistoryIdForActivity(activity: RawProjectActivity) {
  return activity.linkedRequestId ? `request:${activity.linkedRequestId}` : `activity:${activity.id}`;
}

function projectServiceHistoryIdForRequest(requestId: string) {
  return `request:${requestId}`;
}

function buildProjectActivityItemFromRaw(
  activity: RawProjectActivity,
  planPhaseLabelById: Map<string, string>,
  viewerUsername: string | null
) {
  const minimumParticipants = activity.roles.reduce(
    (total, role) => total + role.requiredCount,
    0
  );
  const normalizedMaximumCounts = activity.roles.map((role) =>
    role.maximumCount != null ? Math.max(role.maximumCount, role.requiredCount) : undefined
  );
  const maximumParticipants = normalizedMaximumCounts.every((count) => count != null)
    ? normalizedMaximumCounts.reduce((total, count) => total + (count ?? 0), 0)
    : undefined;
  const startAt = activity.scheduledAt;
  const endAt = rawProjectActivityEndAt(activity);
  const viewerAssignedRoleLabel =
    activity.roles.find((role) => viewerUsername && role.assignedUsernames.includes(viewerUsername))?.label ??
    null;
  const roles = activity.roles.map((role) => ({
    label: role.label,
    filledCount: role.assignedUsernames.length,
    requiredCount: role.requiredCount,
    maximumCount:
      role.maximumCount != null ? Math.max(role.maximumCount, role.requiredCount) : undefined,
    isViewerAssigned: !!viewerUsername && role.assignedUsernames.includes(viewerUsername)
  }));
  const committedCount = uniqueUsernames(activity.roles.flatMap((role) => role.assignedUsernames)).length;
  const statusTone =
    committedCount >= minimumParticipants ? 'green' : committedCount > 1 ? 'yellow' : 'red';

  return {
    id: activity.id,
    title: activity.title,
    authorUsername: activity.authorUsername,
    scheduledAt: startAt,
    startAt,
    endAt,
    locationLabel: activity.locationLabel,
    minimumParticipants,
    maximumParticipants,
    committedCount,
    viewerAssignedRoleLabel,
    linkedPlanPhaseLabel: activity.linkedPlanPhaseId
      ? planPhaseLabelById.get(activity.linkedPlanPhaseId) ?? null
      : null,
    statusTone,
    roles,
    note: activity.note,
    isActive: rawProjectActivityIsActive(activity)
  } satisfies ProjectActivityItem;
}

function buildProjectActivityItemFromRequestWindow(
  request: RawProjectServiceRequest,
  project: PublicProjectItem,
  viewerUsername: string | null,
  statusTone: ProjectActivityItem['statusTone'],
  serviceCommitted: boolean
) {
  const startAt = request.scheduledAt ?? request.createdAt;
  const endAt =
    request.endsAt ??
    new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString();
  const viewerIsAssigned = serviceCommitted && viewerUsername === project.authorUsername;

  return {
    id: `accepted-service-${request.id}`,
    title: request.title,
    authorUsername: request.requesterUsername,
    scheduledAt: startAt,
    startAt,
    endAt,
    locationLabel: project.locationLabel,
    minimumParticipants: 1,
    maximumParticipants: 1,
    committedCount: serviceCommitted ? 1 : 0,
    viewerAssignedRoleLabel: viewerIsAssigned ? 'Service lead' : null,
    linkedPlanPhaseLabel: null,
    statusTone,
    roles: [
      {
        label: 'Service lead',
        filledCount: serviceCommitted ? 1 : 0,
        requiredCount: 1,
        maximumCount: 1,
        isViewerAssigned: viewerIsAssigned
      }
    ],
    note: request.body,
    isActive: serviceCommitted
  } satisfies ProjectActivityItem;
}

function buildProjectActivityItemFromAcceptedRequest(
  request: RawProjectServiceRequest,
  project: PublicProjectItem,
  viewerUsername: string | null
) {
  return buildProjectActivityItemFromRequestWindow(request, project, viewerUsername, 'green', true);
}

function buildProjectActivityItemFromUnansweredRequest(
  request: RawProjectServiceRequest,
  project: PublicProjectItem,
  viewerUsername: string | null
) {
  return buildProjectActivityItemFromRequestWindow(request, project, viewerUsername, 'red', false);
}

function normalizeHistorySelectionMap(
  selectionsByUsername?: Record<string, ProjectServiceHistoryCompletionChoice>,
  completedUsernames: string[] = []
) {
  const normalizedSelections = { ...(selectionsByUsername ?? {}) };

  for (const username of uniqueUsernames(completedUsernames)) {
    normalizedSelections[username] ??= 'completed';
  }

  return normalizedSelections;
}

function normalizeRawServiceHistoryCompletion(completion?: RawProjectServiceHistoryCompletion | null) {
  return {
    requesterSelectionsByUsername: normalizeHistorySelectionMap(
      completion?.requesterSelectionsByUsername,
      completion?.requesterDoneByUsernames ?? []
    ),
    participantSelectionsByUsername: normalizeHistorySelectionMap(
      completion?.participantSelectionsByUsername,
      completion?.participantDoneByUsernames ?? []
    )
  };
}

function buildServiceHistoryCompletionState(
  label: string,
  eligibleUsernames: string[],
  completionSelectionsByUsername: Record<string, ProjectServiceHistoryCompletionChoice> | undefined,
  viewerUsername: string | null
) {
  const eligible = uniqueUsernames(eligibleUsernames);
  const filteredSelections = Object.fromEntries(
    Object.entries(completionSelectionsByUsername ?? {}).filter(
      ([username, selection]) =>
        eligible.includes(username) && (selection === 'completed' || selection === 'uncompleted')
    )
  );
  const completedCount = Object.values(filteredSelections).filter(
    (selection) => selection === 'completed'
  ).length;
  const uncompletedCount = Object.values(filteredSelections).filter(
    (selection) => selection === 'uncompleted'
  ).length;
  const viewerCanSet = !!viewerUsername && eligible.includes(viewerUsername);
  const viewerSelection = viewerCanSet && viewerUsername ? filteredSelections[viewerUsername] ?? null : null;

  return {
    label,
    totalEligible: eligible.length,
    completedCount,
    uncompletedCount,
    pendingCount: Math.max(eligible.length - completedCount - uncompletedCount, 0),
    viewerCanSet,
    viewerSelection,
    doneCount: completedCount,
    viewerCanToggle: viewerCanSet,
    viewerHasMarkedDone: viewerSelection === 'completed'
  } satisfies ProjectServiceHistoryCompletionState;
}

function projectServiceHistoryStateMeta(historyState: ProjectServiceHistoryState) {
  switch (historyState) {
    case 'unanswered-request':
      return {
        label: 'Unanswered request',
        description: 'This requested time passed without being accepted or turned into a scheduled activity.'
      };
    case 'request-only':
      return {
        label: 'Request only',
        description: 'This request moved into history without turning into a planned activity.'
      };
    case 'planned-activity':
      return {
        label: 'Planned activity',
        description: 'This request became a planned activity but did not reach the required commitment.'
      };
    case 'committed-activity':
      return {
        label: 'Committed activity',
        description: 'This request became a planned activity and reached the required commitment.'
      };
    default:
      return {
        label: 'Self planned activity',
        description: 'This activity was created directly by the project instead of coming from a request.'
      };
  }
}

function aggregateProjectServiceHistoryCompletion(
  requesterCompletion: ProjectServiceHistoryCompletionState | null,
  participantCompletion: ProjectServiceHistoryCompletionState
) {
  const completionGroups = [requesterCompletion, participantCompletion].filter(
    (group): group is ProjectServiceHistoryCompletionState => group !== null
  );
  const totalEligible = completionGroups.reduce((total, group) => total + group.totalEligible, 0);
  const completedCount = completionGroups.reduce((total, group) => total + group.completedCount, 0);
  const uncompletedCount = completionGroups.reduce(
    (total, group) => total + group.uncompletedCount,
    0
  );

  if (totalEligible > 0 && completedCount === totalEligible) {
    return {
      aggregateCompletionState: 'completed' as const,
      aggregateCompletionLabel: 'Completed',
      aggregateCompletionTone: 'complete' as const
    };
  }

  if (totalEligible > 0 && uncompletedCount === totalEligible) {
    return {
      aggregateCompletionState: 'uncompleted' as const,
      aggregateCompletionLabel: 'Uncompleted',
      aggregateCompletionTone: 'uncompleted' as const
    };
  }

  return {
    aggregateCompletionState: 'mixed' as const,
    aggregateCompletionLabel: 'Mixed',
    aggregateCompletionTone: 'mixed' as const
  };
}

function canViewerSeePersonalServiceRequestHistory(
  slug: string,
  request: RawProjectServiceRequest
) {
  const viewer = currentViewer();

  return !!viewer && (isProjectCreator(slug, viewer.id) || viewer.username === request.requesterUsername);
}

function canViewerSeePastServiceRequestHistory(
  slug: string,
  projectMode: ProjectMode,
  request: RawProjectServiceRequest
) {
  if (projectMode === 'personal-service') {
    return canViewerSeePersonalServiceRequestHistory(slug, request);
  }

  return canViewerReviewProjectServiceRequests(slug);
}

function baseProjectRequestSettingsForProject(
  slug: string,
  projectMode: ProjectMode,
  phaseThree?: { plans: ProjectDistributionPlan[]; winningPlanId: string | null }
) {
  const workflow = readProjectWorkflowState(slug);

  if (projectMode === 'personal-service') {
    const requestMode = workflow?.serviceRequestMode ?? 'calendar';

    return {
      enabled: workflow?.requestSystemEnabled ?? true,
      requestMode,
      allowOffScheduleRequests: requestMode === 'both'
    } satisfies RawProjectRequestSystemSettings;
  }

  if (projectMode !== 'collective-service') {
    return {
      enabled: false,
      requestMode: 'calendar',
      allowOffScheduleRequests: false
    } satisfies RawProjectRequestSystemSettings;
  }

  const memberCount = (projectMembersBySlug[slug] ?? []).length;
  const resolvedPhaseThree =
    phaseThree ??
    buildDistributionPlans(
      slug,
      buildProjectValues(slug),
      calculateProjectQuorumThreshold(memberCount),
      memberCount
    );
  const activeAccessPlan = resolvedPhaseThree.plans.find(
    (plan) => plan.id === resolvedPhaseThree.winningPlanId
  );

  return {
    enabled: activeAccessPlan?.requestSystemEnabled ?? false,
    requestMode: activeAccessPlan?.requestMode ?? 'both',
    allowOffScheduleRequests: activeAccessPlan?.allowOffScheduleRequests ?? false
  } satisfies RawProjectRequestSystemSettings;
}

function resolvedProjectRequestSettingsForProject(
  slug: string,
  projectMode: ProjectMode,
  phaseThree?: { plans: ProjectDistributionPlan[]; winningPlanId: string | null }
) {
  const workflow = readProjectWorkflowState(slug);
  const baseSettings = baseProjectRequestSettingsForProject(slug, projectMode, phaseThree);
  const override = workflow?.requestSystemOverride;

  if (!override) {
    return baseSettings;
  }

  return {
    enabled: override.enabled,
    requestMode: override.requestMode,
    allowOffScheduleRequests:
      projectMode === 'personal-service'
        ? override.requestMode === 'both'
        : override.allowOffScheduleRequests
  } satisfies RawProjectRequestSystemSettings;
}

function projectRequestSettingsSummary(
  projectMode: ProjectMode,
  settings: RawProjectRequestSystemSettings
) {
  if (!settings.enabled) {
    return 'Requests are currently turned off.';
  }

  if (projectMode === 'personal-service') {
    switch (settings.requestMode) {
      case 'direct':
        return 'Requests are direct only.';
      case 'both':
        return 'Requests can use listed availability or direct written intake.';
      default:
        return 'Requests can only use the creator\'s listed availability.';
    }
  }

  switch (settings.requestMode) {
    case 'direct':
      return 'Requests are direct only.';
    case 'both':
      return settings.allowOffScheduleRequests
        ? 'Requests can use listed activity windows or be made off-schedule.'
        : 'Requests can be written, but they still need an existing activity window.';
    default:
      return 'Requests can only use already scheduled activity windows.';
  }
}

function buildProjectRequestSettings(
  slug: string,
  projectMode: ProjectMode,
  phaseThree?: { plans: ProjectDistributionPlan[]; winningPlanId: string | null }
) {
  const settings = resolvedProjectRequestSettingsForProject(slug, projectMode, phaseThree);

  return {
    ...settings,
    summary: projectRequestSettingsSummary(projectMode, settings)
  } satisfies ProjectServiceRequestSettings;
}

function projectRequestSettingsSignature(settings: RawProjectRequestSystemSettings) {
  return [
    settings.enabled ? 'enabled' : 'disabled',
    settings.requestMode,
    settings.allowOffScheduleRequests ? 'off-schedule' : 'scheduled-only'
  ].join(':');
}

function projectRequestSettingsMatch(
  left: RawProjectRequestSystemSettings,
  right: RawProjectRequestSystemSettings
) {
  return projectRequestSettingsSignature(left) === projectRequestSettingsSignature(right);
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
  demandVotesByUserId: Record<string, ProjectApprovalVote>,
  quorumThresholdPercent: number,
  memberCount: number
) {
  return [
    {
      valueId: demandSignalAssessmentValueId,
      valueLabel: 'Demand signal considered',
      ...buildProjectVoteSummary(demandVotesByUserId, quorumThresholdPercent, memberCount)
    },
    ...values.map((value) => ({
      valueId: value.id,
      valueLabel: value.label,
      ...buildProjectVoteSummary(votesByValueId[value.id] ?? {}, quorumThresholdPercent, memberCount)
    }))
  ] satisfies ProjectPlanValueAssessment[];
}

function defaultDemandVotesForAuthor(authorUsername: string) {
  const authorId = userByUsername(authorUsername)?.id ?? null;

  return authorId
    ? {
        [authorId]: 'yes' as ProjectApprovalVote
      }
    : {};
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
    demandSignalSnapshot: plan.demandSignalSnapshot ?? null,
    demandConsiderationNote:
      plan.demandConsiderationNote?.trim() || 'Legacy plan. No demand note was recorded when this plan was created.',
    planPhases: buildProductionPlanPhases(plan),
    outputSummary: plan.outputSummary,
    materialsSummary: plan.materialsSummary,
    totalCostLabel: plan.totalCostLabel,
    acquisitionsSummary: plan.acquisitionsSummary,
    valueAssessments: buildProjectValueAssessments(
      values,
      plan.valueVotesByValueId,
      plan.valueVotesByValueId[demandSignalAssessmentValueId] ?? defaultDemandVotesForAuthor(plan.authorUsername),
      quorumThresholdPercent,
      memberCount
    ),
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
    demandSignalSnapshot: plan.demandSignalSnapshot ?? null,
    demandConsiderationNote:
      plan.demandConsiderationNote?.trim() || 'Legacy plan. No demand note was recorded when this plan was created.',
    totalCostLabel: plan.totalCostLabel ?? 'No direct cost',
    planPhases: buildDistributionPlanPhases(plan),
    distributionSummary: plan.distributionSummary,
    accessSummary: plan.accessSummary,
    reserveSummary: plan.reserveSummary,
    requestSystemEnabled: plan.requestSystemEnabled ?? false,
    requestMode: plan.requestMode ?? 'both',
    allowOffScheduleRequests: plan.allowOffScheduleRequests ?? false,
    valueAssessments: buildProjectValueAssessments(
      values,
      plan.valueVotesByValueId,
      plan.valueVotesByValueId[demandSignalAssessmentValueId] ?? defaultDemandVotesForAuthor(plan.authorUsername),
      quorumThresholdPercent,
      memberCount
    ),
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

function buildProjectServiceHistoryItemFromActivity(
  activity: RawProjectActivity,
  workflow: ProjectWorkflowState,
  planPhaseLabelById: Map<string, string>,
  viewerUsername: string | null
) {
  const linkedRequest = activity.linkedRequestId
    ? (workflow.serviceRequests ?? []).find((request) => request.id === activity.linkedRequestId) ?? null
    : null;
  const completionId = projectServiceHistoryIdForActivity(activity);
  const completion = normalizeRawServiceHistoryCompletion(
    workflow.serviceHistoryCompletions?.[completionId]
  );
  const participantUsernames = uniqueUsernames(
    activity.roles.flatMap((role) => role.assignedUsernames)
  );
  const historyState: ProjectServiceHistoryState = linkedRequest
    ? rawProjectActivityIsActive(activity)
      ? 'committed-activity'
      : 'planned-activity'
    : 'self-planned';
  const historyStateMeta = projectServiceHistoryStateMeta(historyState);
  const requesterCompletion = linkedRequest
    ? buildServiceHistoryCompletionState(
        'Requester completion',
        [linkedRequest.requesterUsername],
        completion.requesterSelectionsByUsername,
        viewerUsername
      )
    : null;
  const participantCompletion = buildServiceHistoryCompletionState(
    linkedRequest ? 'Service completion' : 'Participant completion',
    participantUsernames,
    completion.participantSelectionsByUsername,
    viewerUsername
  );

  return {
    id: completionId,
    source: linkedRequest ? 'request' : 'self-planned',
    requestId: linkedRequest?.id ?? null,
    requesterUsername: linkedRequest?.requesterUsername ?? null,
    activity: buildProjectActivityItemFromRaw(activity, planPhaseLabelById, viewerUsername),
    historyState,
    historyStateLabel: historyStateMeta.label,
    historyStateDescription: historyStateMeta.description,
    ...aggregateProjectServiceHistoryCompletion(requesterCompletion, participantCompletion),
    requesterCompletion,
    participantCompletion
  } satisfies ProjectServiceHistoryItem;
}

function buildProjectServiceHistoryItemFromAcceptedRequest(
  request: RawProjectServiceRequest,
  workflow: ProjectWorkflowState,
  project: PublicProjectItem,
  viewerUsername: string | null
) {
  const completionId = projectServiceHistoryIdForRequest(request.id);
  const completion = normalizeRawServiceHistoryCompletion(
    workflow.serviceHistoryCompletions?.[completionId]
  );
  const historyState = 'request-only' as const;
  const historyStateMeta = projectServiceHistoryStateMeta(historyState);
  const requesterCompletion = buildServiceHistoryCompletionState(
    'Requester completion',
    [request.requesterUsername],
    completion.requesterSelectionsByUsername,
    viewerUsername
  );
  const participantCompletion = buildServiceHistoryCompletionState(
    'Service completion',
    [project.authorUsername],
    completion.participantSelectionsByUsername,
    viewerUsername
  );

  return {
    id: completionId,
    source: 'request',
    requestId: request.id,
    requesterUsername: request.requesterUsername,
    activity: buildProjectActivityItemFromAcceptedRequest(request, project, viewerUsername),
    historyState,
    historyStateLabel: historyStateMeta.label,
    historyStateDescription: historyStateMeta.description,
    ...aggregateProjectServiceHistoryCompletion(requesterCompletion, participantCompletion),
    requesterCompletion,
    participantCompletion
  } satisfies ProjectServiceHistoryItem;
}

function buildProjectServiceHistoryItemFromUnansweredRequest(
  request: RawProjectServiceRequest,
  workflow: ProjectWorkflowState,
  project: PublicProjectItem,
  viewerUsername: string | null
) {
  const completionId = projectServiceHistoryIdForRequest(request.id);
  const completion = normalizeRawServiceHistoryCompletion(
    workflow.serviceHistoryCompletions?.[completionId]
  );
  const historyState = 'unanswered-request' as const;
  const historyStateMeta = projectServiceHistoryStateMeta(historyState);
  const participantCompletion = buildServiceHistoryCompletionState(
    'Service completion',
    [],
    completion.participantSelectionsByUsername,
    viewerUsername
  );

  return {
    id: completionId,
    source: 'request',
    requestId: request.id,
    requesterUsername: request.requesterUsername,
    activity: buildProjectActivityItemFromUnansweredRequest(request, project, viewerUsername),
    historyState,
    historyStateLabel: historyStateMeta.label,
    historyStateDescription: historyStateMeta.description,
    aggregateCompletionState: 'uncompleted' as const,
    aggregateCompletionLabel: 'Unanswered',
    aggregateCompletionTone: 'uncompleted' as const,
    requesterCompletion: null,
    participantCompletion
  } satisfies ProjectServiceHistoryItem;
}

function rawProjectServiceRequestHasEnded(request: RawProjectServiceRequest) {
  return !!request.endsAt && new Date(request.endsAt).getTime() < Date.now();
}

function buildProjectPhaseFiveState(
  slug: string,
  projectMode: ProjectMode,
  selectablePlanPhases: ProjectActivityPlanPhaseOption[]
) {
  const workflow = readProjectWorkflowState(slug);
  const viewerUsername = currentViewer()?.username ?? null;
  const planPhaseLabelById = new Map(selectablePlanPhases.map((option) => [option.id, option.label]));
  const project = publicFeedBase.find(
    (item): item is PublicProjectItem => item.kind === 'project' && item.slug === slug
  );

  if (!workflow || !project) {
    return {
      activities: [] as ProjectActivityItem[],
      history: [] as ProjectServiceHistoryItem[]
    };
  }

  const now = Date.now();
  const scheduledActivities = [...workflow.phaseFiveActivities]
    .sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
    )
    .map((activity) => ({
      activity,
      item: buildProjectActivityItemFromRaw(activity, planPhaseLabelById, viewerUsername)
    }));

  const liveActivities = scheduledActivities
    .filter(({ activity }) => rawProjectActivityEndTime(activity) >= now)
    .map(({ item }) => item);
  const history: ProjectServiceHistoryItem[] = scheduledActivities
    .filter(({ activity }) => rawProjectActivityEndTime(activity) < now)
    .map(({ activity }) =>
      buildProjectServiceHistoryItemFromActivity(
        activity,
        workflow,
        planPhaseLabelById,
        viewerUsername
      )
    );

  for (const request of workflow.serviceRequests ?? []) {
    const resolvedStatus = resolveProjectServiceRequestStatus(request, workflow.phaseFiveActivities);

    if (request.linkedActivityId || !canViewerSeePastServiceRequestHistory(slug, projectMode, request)) {
      continue;
    }

    if (resolvedStatus === 'accepted') {
      const activityItem = buildProjectActivityItemFromAcceptedRequest(request, project, viewerUsername);

      if (new Date(activityItem.endAt).getTime() < now) {
        history.push(
          buildProjectServiceHistoryItemFromAcceptedRequest(
            request,
            workflow,
            project,
            viewerUsername
          )
        );
      } else {
        liveActivities.push(activityItem);
      }

      continue;
    }

    if (resolvedStatus === 'open' && rawProjectServiceRequestHasEnded(request)) {
      history.push(
        buildProjectServiceHistoryItemFromUnansweredRequest(
          request,
          workflow,
          project,
          viewerUsername
        )
      );
    }
  }

  return {
    activities: liveActivities.sort(
      (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
    ),
    history: history.sort(
      (left, right) => new Date(right.activity.endAt).getTime() - new Date(left.activity.endAt).getTime()
    )
  };
}

function buildProjectServiceRequestSettingsChangeRequests(
  slug: string,
  projectMode: ProjectMode
) {
  if (projectMode === 'personal-service') {
    return [] as ProjectServiceRequestSettingsChangeRequest[];
  }

  const workflow = readProjectWorkflowState(slug);
  const eligibleVoterCount = requestSettingsEligibleVoterCount(slug, projectMode);
  const quorumThresholdPercent = calculateProjectQuorumThreshold(eligibleVoterCount);

  return [...(workflow?.requestSettingsChangeRequests ?? [])]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        eligibleVoterCount
      );

      return {
        id: request.id,
        reason: request.reason,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        proposedSettings: {
          ...request.proposedSettings,
          summary: projectRequestSettingsSummary(projectMode, request.proposedSettings)
        },
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies ProjectServiceRequestSettingsChangeRequest;
    });
}

function buildProjectServiceRequestState(
  slug: string,
  projectMode: ProjectMode,
  viewerCanSubmitRequests: boolean,
  viewerCanReviewRequests: boolean,
  requiresSchedule: boolean,
  phaseThree?: { plans: ProjectDistributionPlan[]; winningPlanId: string | null }
) {
  const workflow = readProjectWorkflowState(slug);
  const settings = buildProjectRequestSettings(slug, projectMode, phaseThree);
  const settingsChangeRequests = buildProjectServiceRequestSettingsChangeRequests(slug, projectMode);

  if (!workflow) {
    return {
      enabled: settings.enabled,
      requestCount: 0,
      requests: [] as ProjectServiceRequestItem[],
      viewerCanSubmitRequests,
      viewerCanReviewRequests,
      viewerCanRequestSettingsChanges: canViewerRequestProjectServiceRequestSettingsChange(slug),
      viewerCanVoteOnSettingsChanges: canViewerVoteOnProjectServiceRequestSettingsChange(slug),
      requiresSchedule,
      settings,
      settingsChangeRequests
    };
  }

  const liveRequests = (workflow.serviceRequests ?? []).filter(
    (request) =>
      resolveProjectServiceRequestStatus(request, workflow.phaseFiveActivities) === 'open' &&
      !rawProjectServiceRequestHasEnded(request)
  );

  return {
    enabled: settings.enabled,
    requestCount: liveRequests.length,
    requests: liveRequests.map((request) => ({
      id: request.id,
      title: request.title,
      body: request.body,
      requesterUsername: request.requesterUsername,
      createdAt: request.createdAt,
      status: resolveProjectServiceRequestStatus(request, workflow.phaseFiveActivities),
      scheduledAt: request.scheduledAt,
      endsAt: request.endsAt,
      linkedActivityId: request.linkedActivityId ?? null
    })),
    viewerCanSubmitRequests,
    viewerCanReviewRequests,
    viewerCanRequestSettingsChanges: canViewerRequestProjectServiceRequestSettingsChange(slug),
    viewerCanVoteOnSettingsChanges: canViewerVoteOnProjectServiceRequestSettingsChange(slug),
    requiresSchedule,
    settings,
    settingsChangeRequests
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

function requestableProjectPhaseTargetIds(
  currentPhaseId: ProjectLifecyclePhaseId,
  projectMode: ProjectMode
) {
  const nextPhaseId = nextProjectPhaseId(currentPhaseId, projectMode);

  return [
    ...(nextPhaseId ? [nextPhaseId] : []),
    ...revertableProjectPhaseIds(projectMode, currentPhaseId)
  ];
}

function phaseOrderForProjectMode(projectMode: ProjectMode, phaseId: ProjectLifecyclePhaseId) {
  return projectLifecyclePhaseBlueprintsForMode(projectMode).find((phase) => phase.id === phaseId)?.order ?? 0;
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

function closePhaseIdForProject(projectMode: ProjectMode) {
  return isPersonalServiceProject(projectMode) ? 'phase-2' : 'phase-6';
}

function revertableProjectPhaseIds(
  projectMode: ProjectMode,
  currentPhaseId: ProjectLifecyclePhaseId
) {
  if (projectMode === 'personal-service') {
    return currentPhaseId === 'phase-2'
      ? (['phase-1'] as Array<Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>>)
      : ([] as Array<Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>>);
  }

  if (currentPhaseId === 'phase-3') {
    return ['phase-2'] as Array<Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>>;
  }

  if (currentPhaseId === 'phase-5' || currentPhaseId === 'phase-6') {
    return ['phase-2', 'phase-3'] as Array<Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>>;
  }

  return [] as Array<Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>>;
}

function buildProjectLifecycleNotes(
  projectMode: ProjectMode,
  quorumThresholdPercent: number,
  requestSystemEnabled: boolean,
  personalServiceRequestModeValue: 'calendar' | 'direct' | 'both' = 'calendar'
) {
  if (projectMode === 'personal-service') {
    return [
      {
        title: 'Members join the chat',
        body: 'Joining a personal service keeps its updates and linked chat attached without needing a separate member or manager list.'
      },
      {
        title:
          personalServiceRequestModeValue === 'calendar'
            ? 'Calendar-first requests'
            : personalServiceRequestModeValue === 'both'
              ? 'Calendar and direct requests'
              : 'Direct written requests',
        body:
          personalServiceRequestModeValue === 'calendar'
            ? 'The calendar is the working surface here: the creator posts availability, and requesters choose a date and time directly from it.'
            : personalServiceRequestModeValue === 'both'
              ? 'This service keeps time-slot booking and direct written requests open together so people can use either path.'
              : 'This service takes direct written requests instead of time-slot booking, so request details and messages do the coordination.'
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
      {
        title: `Phase changes need ${phaseChangeApprovalThresholdPercent}% approval`,
        body: 'Any project member can request a phase change, but the request only executes once quorum is met and the approval rating reaches the required threshold.'
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
  const personalServiceRequestModeValue =
    projectMode === 'personal-service' ? personalServiceRequestMode(slug) : 'calendar';
  const personalServiceCalendarMode =
    projectMode === 'personal-service' && personalServiceRequestModeValue !== 'direct';
  const phaseBlueprints =
    projectMode === 'personal-service'
      ? personalServicePhaseBlueprintsForRequestMode(personalServiceRequestModeValue)
      : projectLifecyclePhaseBlueprintsForMode(projectMode);
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
  const activityPhaseId = activityPhaseIdForProject(projectMode);
  const activityPhaseOrder =
    phaseBlueprints.find((phase) => phase.id === activityPhaseId)?.order ?? Number.POSITIVE_INFINITY;
  const phaseFiveState =
    currentPhaseOrder >= activityPhaseOrder
      ? buildProjectPhaseFiveState(slug, projectMode, selectablePlanPhases)
      : {
          activities: [] as ProjectActivityItem[],
          history: [] as ProjectServiceHistoryItem[]
        };
  const requestSystemEnabled = requestSystemEnabledForProject(slug, projectMode, phaseThree);
  const collectiveRequestMode =
    projectMode === 'collective-service'
      ? collectiveRequestModeForProject(slug, phaseThree)
      : 'both';
  const collectiveAllowOffScheduleRequests =
    projectMode === 'collective-service'
      ? collectiveAllowOffScheduleRequestsForProject(slug, phaseThree)
      : false;
  const requestRequiresSchedule =
    projectMode === 'personal-service'
      ? personalServiceRequestModeValue === 'calendar'
      : projectMode === 'collective-service'
        ? collectiveRequestMode === 'calendar' ||
          (collectiveRequestMode === 'both' && !collectiveAllowOffScheduleRequests)
        : false;
  const requestSystem =
    projectMode === 'productive'
      ? null
      : buildProjectServiceRequestState(
          slug,
          projectMode,
          requestSystemEnabled && canViewerSubmitProjectServiceRequest(slug),
          canViewerReviewProjectServiceRequests(slug),
          requestRequiresSchedule,
          phaseThree
        );
  const personalService =
    projectMode === 'personal-service'
      ? {
          availabilitySummary:
            workflow?.availabilitySummary ??
            (personalServiceCalendarMode
              ? 'The service creator will keep a direct availability schedule visible here.'
              : 'Requests are handled directly through the service description and messages.'),
          travelRadiusLabel: workflow?.travelRadiusLabel,
          usesCalendar: personalServiceCalendarMode,
          requestMode: personalServiceRequestModeValue
        }
      : null;
  const revertablePhaseIds = revertableProjectPhaseIds(projectMode, config.currentPhaseId);
  const phaseChangeRequests = buildProjectPhaseChangeRequests(
    slug,
    projectMode,
    config.currentPhaseId,
    phaseBlueprints,
    quorumThresholdPercent,
    memberCount
  );
  const viewerCanRequestPhaseChanges =
    projectMode !== 'personal-service' &&
    memberState.viewerIsMember &&
    requestableProjectPhaseTargetIds(config.currentPhaseId, projectMode).length > 0;
  const viewerCanVoteOnPhaseChanges =
    projectMode !== 'personal-service' && memberState.viewerIsMember;
  const canAdvancePhaseNow = nextPhaseId ? canAdvanceMockProjectPhaseNow(slug, projectMode) : false;

  return {
    projectMode,
    supportsDemandSignals,
    supportsPlanning,
    currentPhaseId: config.currentPhaseId,
    quorumThresholdPercent,
    notes: buildProjectLifecycleNotes(
      projectMode,
      quorumThresholdPercent,
      requestSystemEnabled,
      personalServiceRequestModeValue
    ),
    viewerCanRequestPhaseChanges,
    viewerCanVoteOnPhaseChanges,
    phaseChangeRequests,
    viewerCanAdvancePhase:
      projectMode === 'personal-service' &&
      memberState.viewerIsProjectManager &&
      !!nextPhaseId &&
      canAdvancePhaseNow,
    nextPhaseId,
    nextPhaseLabel: nextPhaseId
      ? phaseBlueprints.find((phase) => phase.id === nextPhaseId)?.title ?? null
      : null,
    viewerCanRevertPhase:
      projectMode === 'personal-service' &&
      memberState.viewerIsProjectManager &&
      revertablePhaseIds.length > 0,
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
      activities: phaseFiveState.activities,
      history: phaseFiveState.history,
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
  'east-market-cold-storage-acquisition-round': {
    overview:
      'This round is already through operations and access planning and now exists to make the acquisition handoff legible before the resulting cold-storage equipment is converted into the East Market commons asset record.',
    updates: [
      {
        id: 'project-update-east-market-cold-storage-1',
        title: 'Vendor shortlist narrowed',
        body: 'Board review narrowed the cold-room shortlist to two vendors that can deliver within the current acquisition window.',
        authorUsername: 'rowanloop',
        createdAt: '2026-04-30T20:10:00Z'
      }
    ],
    discussionNote:
      'Use chat to track vendor questions, funding edge cases, and the asset-conversion handoff before the storage service opens.',
    discussion: []
  },
  'tool-library-shed-conversion-round': {
    overview:
      'This round is already funded and now keeps the contractor handoff, board execution, and future asset conversion visible before the storage shed becomes a live registered service site.',
    updates: [
      {
        id: 'project-update-tool-library-shed-1',
        title: 'Electrical scope confirmed',
        body: 'The conversion scope now includes one dedicated outlet run and a lockable intake shelf zone for shared storage handoff.',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-30T20:25:00Z'
      }
    ],
    discussionNote:
      'Use chat to coordinate contractor timing, board execution, and the final asset-registry conversion checklist.',
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
  'neighborhood-ride-coordination-service': {
    overview:
      'This collective service is active with direct request intake only, so members can request support without selecting calendar slots.',
    updates: [
      {
        id: 'project-update-ride-coordination-1',
        title: 'Direct intake is live',
        body: 'Coordinators are now handling requests through direct intake while dispatch windows stay flexible.',
        authorUsername: 'quietember',
        createdAt: '2026-04-30T19:10:00Z'
      }
    ],
    discussionNote: 'Use chat to coordinate direct-request details and dispatch handoffs.',
    discussion: []
  },
  'childcare-checkin-desk-service': {
    overview:
      'This collective service is active with both calendar booking and direct requests so members can use either path.',
    updates: [
      {
        id: 'project-update-childcare-checkin-1',
        title: 'Mixed request flow enabled',
        body: 'Members can now choose either calendar slots or direct requests for childcare check-in support.',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-30T19:30:00Z'
      }
    ],
    discussionNote: 'Use chat to coordinate booking details and direct request follow-ups.',
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

const eventGoingSinceById: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(eventParticipationById).map(([eventId, participation]) => [
    eventId,
    Object.fromEntries(participation.goingUserIds.map((userId) => [userId, '2026-01-01T00:00:00Z']))
  ])
);

const eventInvitedSinceById: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(eventParticipationById).map(([eventId, participation]) => [
    eventId,
    Object.fromEntries(participation.invitedUserIds.map((userId) => [userId, '2026-01-01T00:00:00Z']))
  ])
);

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

type MockReportTargetKind = 'subject' | 'comment' | 'direct-message' | 'group-message';

type MockContentReport = {
  id: string;
  subjectId: string;
  targetId: string;
  targetKind: MockReportTargetKind;
  reason: ContentReportReason;
  description: string;
  reporterUserId: string;
  reportedAuthorUserId: string | null;
  eligibleUserIds: string[];
  votesByUserId: Record<string, ContentReportVote>;
  createdAt: string;
  resolution: 'open' | 'hidden' | 'removed';
};

const contentReportsByTargetId: Record<string, MockContentReport> = {};

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
        actionLabel: 'replied to your post',
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
        actorUsername: 'patchbay',
        actionLabel: 'updated',
        title: 'Neighborhood Heat Pump Pilot',
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
        actorUsername: 'mika',
        actionLabel: 'updated',
        title: 'Platform Release Governance Round',
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
        actorUsername: 'toolorbit',
        actionLabel: 'updated',
        title: 'Tool Library Spring Swap Social',
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
        actorUsername: 'mika',
        actionLabel: 'invited',
        title: 'Retrofit Night Walk',
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
const sharedNotificationsByUserId: Record<string, NotificationItem[]> = {};

function buildDefaultMessageConversations(viewer: ViewerSummary): MessageConversation[] {
  if (viewer.id !== patchbayUser.id) {
    return [];
  }

  return [
    {
      id: 'group-laundry-audit',
      kind: 'group',
      title: 'Laundry Room Audit',
      participants: [
        viewer,
        userById('user-rowan') ?? patchbayUser,
        userById('user-tool') ?? patchbayUser
      ],
      preview: 'toolorbit: I can bring the voltage meter and the spare bins.',
      lastMessageAt: '2026-04-30T10:12:00Z',
      unreadCount: 2,
      messages: [
        {
          id: 'group-laundry-audit-1',
          sender: userById('user-rowan') ?? patchbayUser,
          body: 'Let us keep the final checklist in here instead of scattering it across comments.',
          createdAt: '2026-04-30T09:56:00Z',
          isOwn: false
        },
        {
          id: 'group-laundry-audit-2',
          sender: viewer,
          body: 'Good. I can fold the parts list and the volunteer timing into one note.',
          createdAt: '2026-04-30T10:04:00Z',
          isOwn: true
        },
        {
          id: 'group-laundry-audit-3',
          sender: userById('user-tool') ?? patchbayUser,
          body: 'I can bring the voltage meter and the spare bins.',
          createdAt: '2026-04-30T10:12:00Z',
          isOwn: false
        }
      ]
    },
    {
      id: 'dm-rowan',
      kind: 'direct',
      title: (userById('user-rowan') ?? patchbayUser).username,
      participants: [viewer, userById('user-rowan') ?? patchbayUser],
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
          sender: viewer,
          body: 'Yes. I can check the item names and the rough labor notes before noon.',
          createdAt: '2026-04-30T09:18:00Z',
          isOwn: true
        }
      ]
    },
    {
      id: 'dm-toolorbit',
      kind: 'direct',
      title: (userById('user-tool') ?? patchbayUser).username,
      participants: [viewer, userById('user-tool') ?? patchbayUser],
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
          sender: viewer,
          body: 'I can cover chargers if the intake desk is already staffed.',
          createdAt: '2026-04-29T21:04:00Z',
          isOwn: true
        }
      ]
    }
  ];
}

const messageConversationsByUserId: Record<string, MessageConversation[]> = currentViewer()
  ? {
      [activeViewer().id]: buildDefaultMessageConversations(activeViewer())
    }
  : {};

function currentMessageConversationsState() {
  const viewer = currentViewer();

  if (!viewer) {
    return [];
  }

  const existing = messageConversationsByUserId[viewer.id];

  if (existing) {
    return existing;
  }

  const created = buildDefaultMessageConversations(viewer);
  messageConversationsByUserId[viewer.id] = created;
  return created;
}

function messageConversationsStateForUser(userId: string) {
  const existing = messageConversationsByUserId[userId];

  if (existing) {
    return existing;
  }

  const viewer = userById(userId);

  if (!viewer) {
    return [] as MessageConversation[];
  }

  const created = buildDefaultMessageConversations(viewer);
  messageConversationsByUserId[userId] = created;
  return created;
}

function buildSuggestedMessageContacts(viewerId: string) {
  const viewer = userById(viewerId);
  const conversations = messageConversationsByUserId[viewerId] ?? (viewer ? buildDefaultMessageConversations(viewer) : []);
  const relatedIds = new Set([...followingIdsFor(viewerId), ...followerIdsFor(viewerId)]);

  for (const conversation of conversations) {
    for (const participant of conversation.participants) {
      relatedIds.add(participant.id);
    }
  }

  relatedIds.delete(viewerId);

  return Array.from(relatedIds)
    .map((userId) => userById(userId))
    .filter((user): user is ViewerSummary => !!user)
    .sort((left, right) => left.username.localeCompare(right.username));
}

function buildShareContacts() {
  const viewer = currentViewer();

  return viewer
    ? buildSuggestedMessageContacts(viewer.id).map((contact) => toDetailMember(contact.id))
    : [];
}

function scopeLabelsForViewer(
  item: Pick<PublicProjectItem | PublicEventItem, 'channelTags' | 'communityTags'>,
  viewerId: string
) {
  const labels = new Set<string>();

  for (const tag of item.channelTags) {
    if (tag.slug === platform.slug) {
      if (readScopeMembership('platform', platform.slug).memberIds.includes(viewerId)) {
        labels.add(tag.label);
      }

      continue;
    }

    if (readScopeMembership('channel', tag.slug).memberIds.includes(viewerId)) {
      labels.add(tag.label);
    }
  }

  for (const tag of item.communityTags) {
    if (readScopeMembership('community', tag.slug).memberIds.includes(viewerId)) {
      labels.add(tag.label);
    }
  }

  return Array.from(labels);
}

function okShareTargetResult(): ShareTargetResult {
  return { ok: true };
}

function errorShareTargetResult(error: string): ShareTargetResult {
  return {
    ok: false,
    error
  };
}

function pushUserNotification(userId: string, notification: NotificationItem) {
  const existing = sharedNotificationsByUserId[userId] ?? [];
  sharedNotificationsByUserId[userId] = [notification, ...existing];
}

function moveConversationListItemToFront(
  conversations: MessageConversation[],
  conversationId: string
) {
  const conversationIndex = conversations.findIndex((item) => item.id === conversationId);

  if (conversationIndex <= 0) {
    return;
  }

  const [conversation] = conversations.splice(conversationIndex, 1);
  conversations.unshift(conversation);
}

function moveMessageConversationToFront(conversationId: string) {
  moveConversationListItemToFront(currentMessageConversationsState(), conversationId);
}

function moveMessageConversationToFrontForUser(userId: string, conversationId: string) {
  moveConversationListItemToFront(messageConversationsStateForUser(userId), conversationId);
}

function ensureDirectConversationForUser(userId: string, participantId: string) {
  const viewer = userById(userId);
  const participant = userById(participantId);

  if (!viewer || !participant) {
    return null;
  }

  const conversations = messageConversationsStateForUser(userId);
  let conversation = conversations.find(
    (item) => item.kind === 'direct' && item.participants.some((member) => member.id === participantId)
  );

  if (!conversation) {
    conversation = {
      id: `dm-${viewer.username}-${participant.username}`,
      kind: 'direct',
      title: participant.username,
      participants: [viewer, participant],
      preview: '',
      lastMessageAt: '',
      unreadCount: 0,
      messages: []
    };
    conversations.unshift(conversation);
  } else {
    conversation.title = participant.username;
    conversation.participants = [viewer, participant];
  }

  return conversation;
}

function appendDirectMessageForUsers(senderId: string, recipientId: string, body: string) {
  const sender = userById(senderId);
  const trimmed = body.trim();

  if (!sender || !trimmed) {
    return;
  }

  const senderConversation = ensureDirectConversationForUser(senderId, recipientId);
  const recipientConversation = ensureDirectConversationForUser(recipientId, senderId);

  if (!senderConversation || !recipientConversation) {
    return;
  }

  const createdAt = new Date().toISOString();
  const preview = summarizeChatPreview(trimmed);

  senderConversation.messages.push({
    id: buildConversationMessageId(senderConversation.id),
    sender,
    body: trimmed,
    createdAt,
    isOwn: true
  });
  recipientConversation.messages.push({
    id: buildConversationMessageId(recipientConversation.id),
    sender,
    body: trimmed,
    createdAt,
    isOwn: false
  });
  senderConversation.preview = preview;
  recipientConversation.preview = preview;
  senderConversation.lastMessageAt = createdAt;
  recipientConversation.lastMessageAt = createdAt;
  senderConversation.unreadCount = 0;
  recipientConversation.unreadCount += 1;
  moveMessageConversationToFrontForUser(senderId, senderConversation.id);
  moveMessageConversationToFrontForUser(recipientId, recipientConversation.id);
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

function createDefaultScopeMeta(
  kind: Extract<ScopeKind, 'channel' | 'community'>,
  description: string,
  joinPolicy: 'open' | 'invite_only'
): DynamicScopePageMeta {
  const isChannel = kind === 'channel';

  return {
    description,
    note:
      !isChannel && joinPolicy === 'invite_only'
        ? 'This community is invite-only right now, so only members can see the feed.'
        : undefined,
    badges: isChannel
      ? ['Topic channel']
      : [joinPolicy === 'invite_only' ? 'Invite-only community' : 'Open community'],
    emptyFeedText: isChannel
      ? 'No content matches this channel right now.'
      : 'No content matches this community right now.'
  };
}

const platformBoardConfidenceTargetIdsByUserId: Record<string, string> = {
  'user-mika': 'confidence-stewardship-user-mika',
  'user-ember': 'confidence-stewardship-user-ember'
};

const platformBoardMemberIds = Object.keys(platformBoardConfidenceTargetIdsByUserId);

function buildPlatformBoardMembers() {
  return platformBoardMemberIds.map((userId) =>
    toScopeMember(userId, platformBoardConfidenceTargetIdsByUserId[userId])
  );
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

  if (url.pathname.startsWith('/projects/') || url.pathname.startsWith('/events/')) {
    url.searchParams.set('tab', 'chat');
    url.searchParams.set('comment', commentId);
    url.hash = '';

    return `${url.pathname}${url.search}`;
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

function latestCommentBody(comments: DetailComment[]): string | null {
  let latestBody: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  const visit = (items: DetailComment[]) => {
    for (const comment of items) {
      const commentTime = new Date(comment.createdAt).getTime();

      if (!Number.isNaN(commentTime) && commentTime > latestTime) {
        latestTime = commentTime;
        latestBody = comment.body;
      }

      visit(comment.replies);
    }
  };

  visit(comments);

  return latestBody;
}

function latestComment(comments: DetailComment[]): DetailComment | null {
  let latestCommentItem: DetailComment | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  const visit = (items: DetailComment[]) => {
    for (const comment of items) {
      const commentTime = new Date(comment.createdAt).getTime();

      if (!Number.isNaN(commentTime) && commentTime > latestTime) {
        latestTime = commentTime;
        latestCommentItem = comment;
      }

      visit(comment.replies);
    }
  };

  visit(comments);

  return latestCommentItem;
}

function summarizeChatPreview(text: string, authorUsername?: string) {
  const normalized = text.trim();
  const prefixed = authorUsername ? `${authorUsername}: ${normalized}` : normalized;

  if (prefixed.length <= 96) {
    return prefixed;
  }

  return `${prefixed.slice(0, 93).trimEnd()}...`;
}

function buildLinkedChats(viewer: ViewerSummary): MessageLinkedChat[] {
  const publicFeed = buildPublicFeedFixture();
  const projectChats = publicFeed
    .filter((item): item is PublicProjectItem => item.kind === 'project')
    .filter((item) => (projectMembersBySlug[item.slug] ?? []).includes(viewer.id))
    .map((item) => {
      const rawComments = commentsBySubjectId[item.id] ?? [];
      const latestCommentItem = latestComment(rawComments);
      const lastMessageAt =
        newestTimestamp(latestCommentTimestamp(rawComments), item.lastActivityAt, item.createdAt) ??
        item.createdAt;

      return {
        id: `linked-project-chat-${item.slug}`,
        kind: 'project' as const,
        subjectId: item.id,
        title: item.title,
        href: item.href,
        meta: `${item.stage} · ${item.locationLabel}`,
        preview: latestCommentItem
          ? summarizeChatPreview(latestCommentItem.body, latestCommentItem.authorUsername)
          : 'No messages yet.',
        lastMessageAt,
        comments: mapCommentsWithReports(rawComments)
      } satisfies MessageLinkedChat;
    });
  const eventChats = publicFeed
    .filter((item): item is PublicEventItem => item.kind === 'event')
    .filter((item) => {
      const participation = eventParticipationById[item.id] ?? { goingUserIds: [], invitedUserIds: [] };
      const creatorId = userByUsername(item.createdByUsername)?.id ?? null;

      return (
        creatorId === viewer.id ||
        participation.goingUserIds.includes(viewer.id) ||
        participation.invitedUserIds.includes(viewer.id)
      );
    })
    .map((item) => {
      const rawComments = commentsBySubjectId[item.id] ?? [];
      const latestCommentItem = latestComment(rawComments);
      const lastMessageAt =
        newestTimestamp(latestCommentTimestamp(rawComments), item.lastActivityAt, item.createdAt) ??
        item.createdAt;

      return {
        id: `linked-event-chat-${item.slug}`,
        kind: 'event' as const,
        subjectId: item.id,
        title: item.title,
        href: item.href,
        meta: `${item.locationLabel} · ${item.timeLabel}`,
        preview: latestCommentItem
          ? summarizeChatPreview(latestCommentItem.body, latestCommentItem.authorUsername)
          : 'No messages yet.',
        lastMessageAt,
        comments: mapCommentsWithReports(rawComments)
      } satisfies MessageLinkedChat;
    });

  return [...projectChats, ...eventChats].sort(
    (left, right) => +new Date(right.lastMessageAt) - +new Date(left.lastMessageAt)
  );
}

function meetsConfidenceThreshold(confidenceRatio?: number, reviewCount?: number) {
  return !!reviewCount && (confidenceRatio ?? 0) >= 70;
}

function countComments(comments: DetailComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}

function uniqueUserIds(userIds: Array<string | null | undefined>) {
  return Array.from(new Set(userIds.filter((userId): userId is string => !!userId)));
}

function collectCommentAuthorIds(comments: DetailComment[]): string[] {
  return comments.flatMap((comment) => {
    const authorId = userByUsername(comment.authorUsername)?.id;

    return authorId ? [authorId, ...collectCommentAuthorIds(comment.replies)] : collectCommentAuthorIds(comment.replies);
  });
}

function userCanSeePersonalFeedForViewer(viewerUserId: string, profileUserId: string) {
  const profileSettings = settingsForUser(profileUserId);

  if (!profileSettings?.hidePersonalFeedFromNonFollowers) {
    return true;
  }

  return viewerUserId === profileUserId || followingIdsFor(viewerUserId).includes(profileUserId);
}

function userCanSeeFollowersPostsForViewer(viewerUserId: string, profileUserId: string) {
  return (
    userCanSeePersonalFeedForViewer(viewerUserId, profileUserId) &&
    (viewerUserId === profileUserId || followingIdsFor(viewerUserId).includes(profileUserId))
  );
}

function findRawPublicFeedItemById(subjectId: string) {
  return publicFeedBase.find((item) => item.id === subjectId) ?? null;
}

function findRawSocialPostById(subjectId: string) {
  return socialPostsBase.find((item) => item.id === subjectId) ?? null;
}

function resolveSubjectAuthorUserId(subjectId: string) {
  const publicItem = findRawPublicFeedItemById(subjectId);

  if (publicItem) {
    return publicItem.kind === 'event'
      ? userByUsername(publicItem.createdByUsername)?.id ?? null
      : userByUsername(publicItem.authorUsername)?.id ?? null;
  }

  return findRawSocialPostById(subjectId)?.author.id ?? null;
}

function buildDiscussionEligibleVoterIds(subjectId: string, excludedUserId: string | null) {
  const publicItem = findRawPublicFeedItemById(subjectId);

  if (publicItem?.kind === 'thread') {
    return users.map((user) => user.id).filter((userId) => userId !== excludedUserId);
  }

  const socialPost = findRawSocialPostById(subjectId);

  if (socialPost) {
    return users
      .filter((user) =>
        socialPost.audience === 'followers'
          ? userCanSeeFollowersPostsForViewer(user.id, socialPost.author.id)
          : userCanSeePersonalFeedForViewer(user.id, socialPost.author.id)
      )
      .map((user) => user.id)
      .filter((userId) => userId !== excludedUserId);
  }

  return uniqueUserIds([
    ...collectCommentAuthorIds(commentsBySubjectId[subjectId] ?? []),
    currentViewer()?.id ?? null
  ]).filter((userId) => userId !== excludedUserId);
}

function buildEligibleVoterIdsForSubject(subjectId: string, excludedUserId: string | null) {
  const publicItem = findRawPublicFeedItemById(subjectId);

  if (publicItem?.kind === 'project') {
    const memberState = buildProjectMemberState(publicItem.slug);

    return uniqueUserIds([
      ...memberState.projectManagers.map((member) => member.id),
      ...memberState.members.map((member) => member.id)
    ]).filter((userId) => userId !== excludedUserId);
  }

  if (publicItem?.kind === 'event') {
    const memberState = buildEventMemberState(publicItem);

    return uniqueUserIds([
      ...memberState.eventEditors.map((member) => member.id),
      ...memberState.members.map((member) => member.id)
    ]).filter((userId) => userId !== excludedUserId);
  }

  return buildDiscussionEligibleVoterIds(subjectId, excludedUserId);
}

function findConversationForReportSubject(subjectId: string) {
  return currentMessageConversationsState().find((conversation) => conversation.id === subjectId) ?? null;
}

function resolveReportTargetContext(subjectId: string, targetId: string) {
  const conversation = findConversationForReportSubject(subjectId);

  if (conversation) {
    const message = conversation.messages.find((entry) => entry.id === targetId);

    if (message) {
      return {
        targetKind: conversation.kind === 'direct' ? ('direct-message' as const) : ('group-message' as const),
        authorUserId: message.sender.id,
        eligibleUserIds: uniqueUserIds(conversation.participants.map((participant) => participant.id)).filter(
          (userId) => userId !== message.sender.id
        )
      };
    }
  }

  const comment = findCommentById(commentsBySubjectId[subjectId] ?? [], targetId);

  if (comment) {
    const authorUserId = userByUsername(comment.authorUsername)?.id ?? null;

    return {
      targetKind: 'comment' as const,
      authorUserId,
      eligibleUserIds: buildEligibleVoterIdsForSubject(subjectId, authorUserId)
    };
  }

  const authorUserId = resolveSubjectAuthorUserId(targetId);

  if (targetId === subjectId && (findRawPublicFeedItemById(targetId) || findRawSocialPostById(targetId))) {
    return {
      targetKind: 'subject' as const,
      authorUserId,
      eligibleUserIds: buildEligibleVoterIdsForSubject(subjectId, authorUserId)
    };
  }

  return null;
}

function reportAgeMs(createdAt: string | null | undefined) {
  if (!createdAt) {
    return 0;
  }

  const parsed = new Date(createdAt).getTime();

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(Date.now() - parsed, 0);
}

function spamAgeRatioBoost(ageMs: number) {
  const dayMs = 24 * 60 * 60 * 1000;

  if (ageMs < dayMs) {
    return 0;
  }

  if (ageMs < dayMs * 7) {
    return 0.1;
  }

  if (ageMs < dayMs * 30) {
    return 0.2;
  }

  if (ageMs < dayMs * 180) {
    return 0.3;
  }

  return 0.4;
}

function spamEngagementRatioBoost(engagementScore: number) {
  if (engagementScore < 2) {
    return 0;
  }

  if (engagementScore < 8) {
    return 0.05;
  }

  if (engagementScore < 20) {
    return 0.1;
  }

  if (engagementScore < 50) {
    return 0.15;
  }

  return 0.2;
}

function reportSpamSignals(report: MockContentReport) {
  const publicItem = findRawPublicFeedItemById(report.targetId);

  if (publicItem) {
    return {
      createdAt: publicItem.createdAt,
      engagementScore: Math.abs(publicItem.voteCount) + publicItem.commentCount * 2
    };
  }

  const socialPost = findRawSocialPostById(report.targetId);

  if (socialPost) {
    return {
      createdAt: socialPost.createdAt,
      engagementScore: Math.abs(socialPost.voteCount) + socialPost.commentCount * 2
    };
  }

  const comment = findCommentById(commentsBySubjectId[report.subjectId] ?? [], report.targetId);

  if (comment) {
    return {
      createdAt: comment.createdAt,
      engagementScore: Math.abs(comment.voteCount) + countComments(comment.replies) * 2
    };
  }

  const conversation = findConversationForReportSubject(report.subjectId);
  const message = conversation?.messages.find((entry) => entry.id === report.targetId) ?? null;

  if (message) {
    return {
      createdAt: message.createdAt,
      engagementScore: 0
    };
  }

  return {
    createdAt: null,
    engagementScore: 0
  };
}

function reportVotesRequired(report: MockContentReport) {
  const eligibleCount = Math.max(report.eligibleUserIds.length, 1);

  if (report.reason === 'serious-harm') {
    return Math.max(1, Math.ceil(eligibleCount * 0.5));
  }

  const { createdAt, engagementScore } = reportSpamSignals(report);
  const requiredRatio = Math.min(
    0.95,
    0.5 + spamAgeRatioBoost(reportAgeMs(createdAt)) + spamEngagementRatioBoost(engagementScore)
  );

  return Math.max(1, Math.min(eligibleCount, Math.ceil(eligibleCount * requiredRatio)));
}

function reportVoteCounts(report: MockContentReport) {
  const votes = Object.values(report.votesByUserId);

  return {
    yesCount: votes.filter((vote) => vote === 'yes').length,
    noCount: votes.filter((vote) => vote === 'no').length
  };
}

function reportRemainingVotes(report: MockContentReport) {
  const { yesCount, noCount } = reportVoteCounts(report);

  return Math.max(report.eligibleUserIds.length - yesCount - noCount, 0);
}

function reportIsApproved(report: MockContentReport) {
  const { yesCount, noCount } = reportVoteCounts(report);

  return yesCount >= reportVotesRequired(report) && yesCount > noCount;
}

function reportCanStillPass(report: MockContentReport) {
  const { yesCount, noCount } = reportVoteCounts(report);
  const maxPossibleYes = yesCount + reportRemainingVotes(report);

  return maxPossibleYes >= reportVotesRequired(report) && maxPossibleYes > noCount;
}

function updateConversationAfterMessageRemoval(conversation: MessageConversation) {
  const latestMessage = conversation.messages[conversation.messages.length - 1] ?? null;

  conversation.preview = latestMessage
    ? summarizeChatPreview(
        latestMessage.body,
        conversation.kind === 'group' ? latestMessage.sender.username : undefined
      )
    : 'No messages yet.';
  conversation.lastMessageAt = latestMessage?.createdAt ?? '';
  conversation.unreadCount = Math.min(conversation.unreadCount, conversation.messages.length);
}

function removeMessageFromConversations(targetId: string) {
  for (const conversations of Object.values(messageConversationsByUserId)) {
    for (const conversation of conversations) {
      const messageIndex = conversation.messages.findIndex((message) => message.id === targetId);

      if (messageIndex === -1) {
        continue;
      }

      conversation.messages.splice(messageIndex, 1);
      updateConversationAfterMessageRemoval(conversation);
    }
  }
}

function removeCommentById(comments: DetailComment[], commentId: string): boolean {
  const commentIndex = comments.findIndex((comment) => comment.id === commentId);

  if (commentIndex !== -1) {
    comments.splice(commentIndex, 1);
    return true;
  }

  return comments.some((comment) => removeCommentById(comment.replies, commentId));
}

function reconcileContentReport(report: MockContentReport) {
  if (!reportIsApproved(report)) {
    report.resolution = 'open';

    if (!reportCanStillPass(report)) {
      delete contentReportsByTargetId[report.targetId];
    }

    return;
  }

  if (report.targetKind === 'subject') {
    report.resolution = 'open';
    return;
  }

  if (report.targetKind === 'group-message' || report.reason === 'serious-harm') {
    report.resolution = 'hidden';
    return;
  }

  report.resolution = 'removed';

  if (report.targetKind === 'comment') {
    removeCommentById(commentsBySubjectId[report.subjectId] ?? [], report.targetId);
  }
}

function buildContentReportSummary(targetId: string): ContentReportSummary | null {
  const report = contentReportsByTargetId[targetId];

  if (!report) {
    return null;
  }

  const viewerId = currentViewer()?.id ?? null;
  const { yesCount, noCount } = reportVoteCounts(report);

  return {
    id: report.id,
    subjectId: report.subjectId,
    targetId: report.targetId,
    reason: report.reason,
    description: report.description,
    createdAt: report.createdAt,
    authorUsername: userById(report.reporterUserId)?.username ?? patchbayUser.username,
    resolution: report.resolution,
    voteSummary: {
      yesCount,
      noCount,
      activeVote: viewerId ? report.votesByUserId[viewerId] ?? null : null,
      eligibleVoterCount: report.eligibleUserIds.length,
      votesRequired: reportVotesRequired(report)
    }
  };
}

function mapCommentsWithReports(comments: DetailComment[]): DetailComment[] {
  return comments.map((comment) => ({
    ...comment,
    report: buildContentReportSummary(comment.id),
    replies: mapCommentsWithReports(comment.replies)
  }));
}

function conversationWithReports(conversation: MessageConversation): MessageConversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      report: buildContentReportSummary(message.id)
    }))
  };
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
    messages: currentMessageConversationsState().reduce((sum, conversation) => sum + conversation.unreadCount, 0)
  };
}

function readVoteTarget(id: string, fallbackCount: number, fallbackVote: VoteDirection) {
  return voteState.get(id) ?? {
    voteCount: fallbackCount,
    activeVote: fallbackVote
  };
}

function projectFundProgressForSlug(slug: string) {
  if (projectLifecycleBySlug[slug]?.currentPhaseId !== 'phase-4') {
    return undefined;
  }

  const fund = platformAssetsFixture.funds.find((entry) => entry.projectHref === `/projects/${slug}`);

  if (!fund) {
    return undefined;
  }

  return {
    title: fund.title,
    progressPercent: fund.progressPercent,
    raisedLabel: fund.raisedLabel,
    targetLabel: fund.targetLabel,
    status: fund.status
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
      const memberCount =
        item.projectMode === 'personal-service'
          ? personalServiceFollowerCount(item.slug)
          : projectMembersBySlug[item.slug]?.length ?? item.memberCount;
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
        lastActivityAt,
        fundProgress: projectFundProgressForSlug(item.slug)
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
    communityTags: item.communityTags,
    subjectFundProgress: item.kind === 'project' ? item.fundProgress : undefined
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
      href: buildCommentHref(subject.href, comment.id),
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
    linkedSubjects: post.linkedSubjects ?? detectPostBodyLinks(post.body),
    voteCount: vote.voteCount,
    commentCount
  } satisfies PersonalPostItem;
}

function detectPostBodyLinks(body: string): PostBodyLink[] {
  const normalizedBody = body.toLowerCase();
  const seenLabels = new Set<string>();

  return publicFeedBase
    .filter((item): item is PublicProjectItem | PublicEventItem => item.kind === 'project' || item.kind === 'event')
    .map((item) => ({
      kind: item.kind,
      label: item.title,
      href: item.href
    }))
    .sort((left, right) => right.label.length - left.label.length)
    .filter((link) => {
      const key = link.label.toLowerCase();

      if (seenLabels.has(key) || !normalizedBody.includes(key)) {
        return false;
      }

      seenLabels.add(key);
      return true;
    });
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
    .map((item) => ({
      ...buildPublicActivityItem(item),
      feedSource: 'following'
    }) satisfies PersonalFeedItem);
  const commentActivities = buildPublicCommentActivities(publicFeed).filter(
    (item) => followedIds.has(item.author.id) && !shouldHidePublicActivityFromPersonalFeeds(item.author.id)
  ).map((item) => ({
    ...item,
    feedSource: 'following'
  }) satisfies PersonalFeedItem);

  const followerPosts = socialPostsBase
    .filter((post) => followedIds.has(post.author.id))
    .map((post) => ({
      ...buildSocialPostItem(post),
      feedSource: 'following'
    }) satisfies PersonalFeedItem);
  const discoveryPosts = socialPostsBase
    .filter((post) => post.audience === 'public')
    .filter((post) => !followedIds.has(post.author.id))
    .filter((post) => viewerCanSeePersonalFeed(post.author.id))
    .map((post) => ({
      ...buildSocialPostItem(post),
      feedSource: 'discovery'
    }) satisfies PersonalFeedItem);

  return [...followerPosts, ...publicActivities, ...commentActivities, ...discoveryPosts].sort(
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

function buildBootstrapDirectory() {
  const viewer = currentViewer();
  const viewerHasPlatformMembership =
    !!viewer && readScopeMembership('platform', platform.slug).memberIds.includes(viewer.id);

  return {
    platform: viewerHasPlatformMembership ? platformDirectory : null,
    channels: viewer
      ? channelDirectory.filter((item) => readScopeMembership('channel', item.slug).memberIds.includes(viewer.id))
      : [],
    communities: viewer
      ? communityDirectory.filter((item) => readScopeMembership('community', item.slug).memberIds.includes(viewer.id))
      : []
  };
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
  const projectMode = projectModeForSlug(slug);

  if (projectMode === 'personal-service') {
    const creator = projectAuthorForSlug(slug);
    const followerIds = creator ? memberIds.filter((userId) => userId !== creator.id) : memberIds;

    return {
      memberCount: followerIds.length,
      projectManagers: creator ? [toProjectRoleMember(creator.id)] : [],
      members: followerIds.map((userId) => toProjectRoleMember(userId)),
      viewerIsMember: !!viewer && !!creator && viewer.id !== creator.id && followerIds.includes(viewer.id),
      viewerCanToggleMembership: !!viewer && !!creator && viewer.id !== creator.id,
      viewerCanToggleManagerNomination: false,
      viewerIsManagerCandidate: false,
      viewerIsProjectManager: !!viewer && !!creator && viewer.id === creator.id
    };
  }

  return {
    memberCount: memberIds.length,
    projectManagers: [],
    members: memberIds.map((userId) => toProjectRoleMember(userId)),
    viewerIsMember: !!viewer && memberIds.includes(viewer.id),
    viewerCanToggleMembership: !!viewer,
    viewerCanToggleManagerNomination: false,
    viewerIsManagerCandidate: false,
    viewerIsProjectManager: false
  };
}

function isPlatformTaggedProject(slug: string) {
  const project = findPublicProjectItem(slug);

  return !!project && project.channelTags.some((tag) => tag.slug === platform.slug);
}

function buildEventMemberState(item: PublicEventItem) {
  const viewer = currentViewer();
  const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
  const participation =
    eventParticipationById[item.id] ??
    (eventParticipationById[item.id] = { goingUserIds: [], invitedUserIds: [] });
  const workflow = ensureEventWorkflowState(item.slug, creatorId);
  const memberIds = Array.from(
    new Set([...(creatorId ? [creatorId] : []), ...participation.goingUserIds])
  );
  const editorIds = item.isPrivate
    ? Array.from(new Set(workflow.editorUserIds.filter((userId) => memberIds.includes(userId))))
    : [];
  const editorIdSet = new Set(editorIds);
  const viewerIsGoing = !!viewer && (memberIds.includes(viewer.id) || viewer.id === creatorId);
  const viewerCanToggleGoing =
    !!viewer && (!item.isPrivate || viewerIsGoing || participation.invitedUserIds.includes(viewer.id));
  const viewerHasEventEditAccess =
    !!viewer && (item.isPrivate ? editorIdSet.has(viewer.id) : memberIds.includes(viewer.id));
  const viewerCanManageEditors = !!viewer && !!creatorId && item.isPrivate && viewer.id === creatorId;

  return {
    eventEditors: item.isPrivate ? editorIds.map((userId) => toProjectRoleMember(userId)) : [],
    members: memberIds
      .filter((userId) => !item.isPrivate || !editorIdSet.has(userId))
      .map((userId) => toProjectRoleMember(userId)),
    memberCount: memberIds.length,
    eligibleVoterCount: item.isPrivate ? editorIds.length : memberIds.length,
    viewerIsGoing,
    viewerCanToggleGoing,
    viewerHasEventEditAccess,
    viewerCanManageEditors,
    availableEditorInvitees:
      viewerCanManageEditors
        ? memberIds
            .filter((userId) => userId !== creatorId && !editorIdSet.has(userId))
            .map((userId) => toDetailMember(userId))
        : []
  };
}

function buildScopeStats(feed: PublicFeedItem[], memberCount: number): ScopeStats {
  return {
    projects: feed.filter((item) => item.kind === 'project').length,
    threads: feed.filter((item) => item.kind === 'thread').length,
    events: feed.filter((item) => item.kind === 'event').length,
    members: memberCount
  };
}

function buildChannelScopeFixtures(): ScopePageData[] {
  const publicFeed = buildPublicFeedFixture();
  const housingFeed = filterByTag(publicFeed, housingBuild.slug, 'channel');
  const housingMembership = buildScopeMembershipState('channel', housingBuild.slug);
  const mutualAidFeed = filterByTag(publicFeed, mutualAid.slug, 'channel');
  const mutualAidMembership = buildScopeMembershipState('channel', mutualAid.slug);

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
      emptyFeedText: 'No content matches this channel right now.',
      membership: housingMembership,
      feed: housingFeed,
      stats: buildScopeStats(housingFeed, housingMembership.memberCount)
    },
    {
      kind: 'channel',
      slug: mutualAid.slug,
      title: mutualAid.label,
      description:
        'Channels stay broad enough to gather repair work, local coordination, and standalone events without flattening them into one card type.',
      badges: ['Topic channel'],
      emptyFeedText: 'No content matches this channel right now.',
      membership: mutualAidMembership,
      feed: mutualAidFeed,
      stats: buildScopeStats(mutualAidFeed, mutualAidMembership.memberCount)
    }
  ];
}

function buildCommunityScopeFixtures(): ScopePageData[] {
  const publicFeed = buildPublicFeedFixture();
  const eastMarketFeed = filterByTag(publicFeed, eastMarket.slug, 'community');
  const eastMarketMembership = buildScopeMembershipState('community', eastMarket.slug);
  const toolLibraryFeed = filterByTag(publicFeed, toolLibrary.slug, 'community');
  const toolLibraryMembership = buildScopeMembershipState('community', toolLibrary.slug);

  return [
    {
      kind: 'community',
      slug: eastMarket.slug,
      title: eastMarket.label,
      description:
        'Communities stay people-centered while keeping tagged projects and discussion visible without turning into topic channels.',
      badges: ['Open community'],
      emptyFeedText: 'No content matches this community right now.',
      membership: eastMarketMembership,
      feed: eastMarketFeed,
      stats: buildScopeStats(eastMarketFeed, eastMarketMembership.memberCount)
    },
    {
      kind: 'community',
      slug: toolLibrary.slug,
      title: toolLibrary.label,
      description:
        'This community holds the social coordination around the tool library while keeping its projects, threads, and events visible together.',
      note: 'This one is closed right now, so the feed stays locked unless you already have access.',
      badges: ['Invite-only community'],
      emptyFeedText: 'No content matches this community right now.',
      membership: toolLibraryMembership,
      feed: toolLibraryFeed,
      stats: buildScopeStats(toolLibraryFeed, toolLibraryMembership.memberCount)
    }
  ];
}

function buildPlatformScopeFixture(): ScopePageData {
  const publicFeed = buildPublicFeedFixture();
  const platformFeed = filterByTag(publicFeed, platform.slug, 'channel');
  const platformMembership = buildScopeMembershipState('platform', platform.slug);
  const boardMembers = buildPlatformBoardMembers();

  return {
    kind: 'platform',
    slug: platform.slug,
    title: platform.label,
    description:
      'Platform keeps software governance and collective coordination public without turning the people involved into permanent profile roles.',
    note:
      'All users can read and post threads here. Coordination stays visible, but usernames stay just usernames.',
    badges: ['Collective governance'],
    boardNote:
      'Board members should keep at least 70% positive confidence to stay in role, so the confidence vote stays visible here.',
    emptyFeedText: 'No platform-tagged work is visible yet.',
    membership: platformMembership,
    feed: platformFeed,
    boardMembers: boardMembers,
    stats: buildScopeStats(platformFeed, platformMembership.memberCount)
  };
}

function buildDynamicScopeFixture(
  kind: Extract<ScopeKind, 'channel' | 'community'>,
  slug: string,
  meta: DynamicScopePageMeta
): ScopePageData | null {
  const directory = kind === 'channel' ? channelDirectory : communityDirectory;
  const directoryItem = directory.find((item) => item.slug === slug);

  if (!directoryItem) {
    return null;
  }

  const publicFeed = buildPublicFeedFixture();
  const feed = filterByTag(publicFeed, slug, kind);
  const membership = buildScopeMembershipState(kind, slug);

  return {
    kind,
    slug,
    title: directoryItem.label,
    description: meta.description,
    note: meta.note,
    badges: meta.badges,
    emptyFeedText: meta.emptyFeedText,
    membership,
    feed,
    stats: buildScopeStats(feed, membership.memberCount)
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
      const scopeLabels = scopeLabelsForViewer(item, viewer.id);
      const lifecycle = buildProjectLifecycle(item.slug, item.projectMode, memberIds.length);
      const viewerIsDirectMember = memberIds.includes(viewer.id);
      const activityPhaseId = activityPhaseIdForProject(item.projectMode);

      if (!viewerIsDirectMember && scopeLabels.length === 0) {
        return [];
      }

      if (lifecycle.currentPhaseId !== activityPhaseId) {
        return [];
      }

      const sourceLabel = viewerIsDirectMember
        ? item.projectMode === 'personal-service'
          ? isProjectCreator(item.slug, viewer.id)
            ? 'Your service'
            : 'Member'
          : 'Project member'
        : `Via ${scopeLabels[0]}`;

      return lifecycle.phaseFive.activities.map((activity) => {
        const hasOpenRole = activity.roles.some(
          (role) => role.maximumCount == null || role.filledCount < role.maximumCount
        );

        return {
          id: `rail-project-activity-${item.slug}-${activity.id}`,
          subjectId: activity.id,
          kind: 'project' as const,
          title: activity.title,
          href: `${item.href}?activity=${activity.id}#activity-card-${activity.id}`,
          meta: `${item.title} · ${activity.locationLabel}`,
          createdAt: activity.startAt,
          countLabel: `${sourceLabel} · ${activity.committedCount}/${activity.minimumParticipants} committed`,
          viewerIsParticipating: true,
          projectMode: item.projectMode,
          projectSlug: item.slug,
          activityId: activity.id,
          activityRoleLabels: activity.roles.map((role) => role.label),
          viewerAssignedRoleLabel: activity.viewerAssignedRoleLabel,
          projectHasOpenRole: hasOpenRole
        } satisfies RightRailActivityItem;
      });
    });
  const requestItems = publicFeed
    .filter((item): item is PublicProjectItem => item.kind === 'project')
    .flatMap((item) => {
      if (item.projectMode === 'productive') {
        return [];
      }

      const memberIds = projectMembersBySlug[item.slug] ?? [];
      const lifecycle = buildProjectLifecycle(item.slug, item.projectMode, memberIds.length);
      const requestSystem = lifecycle.requestSystem;
      const viewerIsDirectMember = memberIds.includes(viewer.id);
      const activityPhaseId = activityPhaseIdForProject(item.projectMode);
      const viewerCanSeeRequests = item.projectMode === 'personal-service'
        ? isProjectCreator(item.slug, viewer.id)
        : viewerIsDirectMember;

      if (!viewerCanSeeRequests || lifecycle.currentPhaseId !== activityPhaseId || !requestSystem?.viewerCanReviewRequests) {
        return [];
      }

      return requestSystem.requests.map((request) => ({
        id: `rail-project-request-${item.slug}-${request.id}`,
        subjectId: request.id,
        kind: 'request' as const,
        title: request.title,
        href: `${item.href}?request=${request.id}#request-card-${request.id}`,
        meta: `${item.title} · ${request.requesterUsername}`,
        createdAt: request.createdAt,
        countLabel: formatServiceRequestWindow(request.scheduledAt, request.endsAt) || 'Open request',
        projectMode: item.projectMode,
        projectSlug: item.slug,
        requestId: request.id,
        requesterUsername: request.requesterUsername
      } satisfies RightRailActivityItem));
    });
  const eventItems = publicFeed
    .filter((item): item is PublicEventItem => item.kind === 'event')
    .flatMap((item) => {
      const participation = eventParticipationById[item.id];
      const goingUserIds = participation?.goingUserIds ?? [];
      const invitedUserIds = participation?.invitedUserIds ?? [];
      const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
      const scopeLabels = scopeLabelsForViewer(item, viewer.id);
      const memberCount = new Set([...(creatorId ? [creatorId] : []), ...goingUserIds]).size;
      const latestUpdate = latestEventUpdateForSlug(item.slug);
      const viewerIsParticipating = !!viewer && (goingUserIds.includes(viewer.id) || creatorId === viewer.id);
      const viewerIsInvited = invitedUserIds.includes(viewer.id);

      if (!viewerIsParticipating && !viewerIsInvited && scopeLabels.length === 0) {
        return [];
      }

      const sourceLabel = creatorId === viewer.id
        ? 'Hosted by you'
        : viewerIsParticipating
          ? 'Going'
          : viewerIsInvited
            ? 'Invited'
            : `Via ${scopeLabels[0]}`;

      return [{
        id: `rail-${item.id}`,
        subjectId: item.id,
        kind: 'event',
        title: item.title,
        href: item.href,
        meta: item.locationLabel,
        createdAt: latestUpdate?.createdAt ?? item.scheduledAt ?? item.lastActivityAt,
        timeLabel: item.timeLabel,
        countLabel: `${sourceLabel} · ${memberCount} going`,
        viewerIsParticipating
      } satisfies RightRailActivityItem];
    });

  return [...projectItems, ...eventItems, ...requestItems].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
}

function buildSettingsFixture(): SettingsPageData | null {
  const settings = currentSettingsState();

  return settings ? { ...settings } : null;
}

function buildNotificationsFixture(): NotificationsPageData | null {
  const viewer = currentViewer();

  if (!viewer) {
    return null;
  }

  const baseNotifications = viewer.id === patchbayUser.id ? notificationsState : [];
  const sharedNotifications = sharedNotificationsByUserId[viewer.id] ?? [];
  const existingHrefs = new Set(
    [...sharedNotifications, ...baseNotifications].map((item) => item.href)
  );
  const memberProjectNotifications: NotificationItem[] = Object.entries(projectMembersBySlug)
    .filter(([, memberIds]) => memberIds.includes(viewer.id))
    .map(([slug]) => {
      const project = findPublicProjectItem(slug);
      const latestUpdate = latestProjectUpdateForSlug(slug);
      const joinedAt = projectMembershipSinceBySlug[slug]?.[viewer.id];

      if (!project || !latestUpdate || latestUpdate.authorUsername === viewer.username) {
        return null;
      }

      if (joinedAt && new Date(latestUpdate.createdAt).getTime() < new Date(joinedAt).getTime()) {
        return null;
      }

      return {
        id: `notification-project-member-update-${slug}-${latestUpdate.id}`,
        kind: 'project' as const,
        surface: 'public' as const,
        subjectKind: 'project' as const,
        projectMode: project.projectMode,
        actorUsername: latestUpdate.authorUsername,
        actionLabel: 'updated',
        title: project.title,
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
  const memberEventNotifications: NotificationItem[] = buildPublicFeedFixture()
    .filter((item): item is PublicEventItem => item.kind === 'event')
    .map((event): NotificationItem | null => {
      const participation = eventParticipationById[event.id];

      if (!participation) {
        return null;
      }

      const viewerInEvent =
        participation.goingUserIds.includes(viewer.id) || participation.invitedUserIds.includes(viewer.id);

      if (!viewerInEvent) {
        return null;
      }

      const latestUpdate = latestEventUpdateForSlug(event.slug);

      if (!latestUpdate || latestUpdate.authorUsername === viewer.username) {
        return null;
      }

      const goingSince = eventGoingSinceById[event.id]?.[viewer.id];
      const invitedSince = eventInvitedSinceById[event.id]?.[viewer.id];
      const membershipSince = [goingSince, invitedSince]
        .filter((value): value is string => !!value)
        .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];

      if (
        membershipSince &&
        new Date(latestUpdate.createdAt).getTime() < new Date(membershipSince).getTime()
      ) {
        return null;
      }

      return {
        id: `notification-event-member-update-${event.slug}-${latestUpdate.id}`,
        kind: 'event' as const,
        surface: 'public' as const,
        subjectKind: 'event' as const,
        actorUsername: latestUpdate.authorUsername,
        actionLabel: 'updated',
        title: event.title,
        body: latestUpdate.body,
        href: buildUpdateHref(event.href, latestUpdate.id),
        createdAt: latestUpdate.createdAt,
        isUnread: !readNotificationHrefs.has(buildUpdateHref(event.href, latestUpdate.id)),
        channelTags: event.channelTags,
        communityTags: event.communityTags
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item)
    .filter((item) => !existingHrefs.has(item.href));

  return {
    viewer,
    items: [
      ...sharedNotifications,
      ...memberProjectNotifications,
      ...memberEventNotifications,
      ...baseNotifications
    ]
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
  const conversations = currentMessageConversationsState().map(conversationWithReports);

  return viewer
    ? {
        viewer,
        conversations,
        linkedChats: buildLinkedChats(viewer),
        suggestedContacts: buildSuggestedMessageContacts(viewer.id),
        activeConversationId: null
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
    directory: buildBootstrapDirectory(),
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
  const settings = currentSettingsState();
  const viewer = currentViewer();

  if (!settings || !viewer) {
    return;
  }

  settingsByUserId[viewer.id] = {
    ...settings,
    ...input
  };
  settingsByUserId[viewer.id].requireFollowApproval =
    settingsByUserId[viewer.id].hidePersonalFeedFromNonFollowers;
  syncViewerProfileFromSettings(viewer.id);

  persistClientState();
}

export function hydrateMockClientState() {
  return hydratePersistedClientState();
}

export function findChannelScopeFixture(slug: string): ScopePageData | null {
  return (
    buildChannelScopeFixtures().find((item) => item.slug === slug) ??
    buildDynamicScopeFixture('channel', slug, createdChannelScopeMetaBySlug[slug]) ??
    null
  );
}

export function findCommunityScopeFixture(slug: string): ScopePageData | null {
  return (
    buildCommunityScopeFixtures().find((item) => item.slug === slug) ??
    buildDynamicScopeFixture('community', slug, createdCommunityScopeMetaBySlug[slug]) ??
    null
  );
}

export function getPlatformScopeFixture() {
  return buildPlatformScopeFixture();
}

export function getPlatformAssetsFixture() {
  return platformAssetsFixture;
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

  const shareContacts = buildShareContacts();

  const lifecycle = buildProjectLifecycle(
    slug,
    item.projectMode,
    memberState.projectManagers.length + memberState.members.length
  );
  const updateRequests = buildProjectUpdateRequests(
    slug,
    lifecycle.quorumThresholdPercent,
    memberState.projectManagers.length + memberState.members.length
  );
  const editRequests = buildProjectEditRequests(
    slug,
    lifecycle.quorumThresholdPercent,
    memberState.projectManagers.length + memberState.members.length
  );
  const report = buildContentReportSummary(item.id);
  const isRemovedByReport = false;

  return {
    ...item,
    overview: extras.overview,
    lifecycle,
    updates: extras.updates,
    updateRequests: updateRequests,
    viewerCanRequestUpdate: canViewerRequestProjectUpdate(slug),
    viewerCanVoteOnUpdateRequests: canViewerVoteOnProjectUpdate(slug),
    editRequests: editRequests,
    viewerCanRequestEdit: canViewerRequestProjectEdit(slug),
    viewerCanVoteOnEditRequests: canViewerVoteOnProjectEdit(slug),
    projectManagers: memberState.projectManagers,
    members: memberState.members,
    viewerIsMember: memberState.viewerIsMember,
    viewerCanToggleMembership: memberState.viewerCanToggleMembership,
    viewerCanShare: !!currentViewer(),
    viewerCanToggleManagerNomination: memberState.viewerCanToggleManagerNomination,
    viewerIsManagerCandidate: memberState.viewerIsManagerCandidate,
    viewerIsProjectManager: memberState.viewerIsProjectManager,
    shareContacts,
    report,
    isRemovedByReport,
    commentCount: countComments(commentsBySubjectId[item.id] ?? []),
    discussionNote: extras.discussionNote,
    discussion: mapCommentsWithReports(commentsBySubjectId[item.id] ?? [])
  };
}

export function findThreadFixture(slug: string): ThreadPageData | null {
  const item = findPublicThreadItem(slug);

  if (!item) {
    return null;
  }

  const report = buildContentReportSummary(item.id);
  const isRemovedByReport = false;

  return {
    ...item,
    body: item.body,
    commentCount: countComments(commentsBySubjectId[item.id] ?? []),
    report,
    isRemovedByReport,
    discussionNote: threadDiscussionNotes[slug] ?? 'Discussion stays visible here.',
    discussion: mapCommentsWithReports(commentsBySubjectId[item.id] ?? [])
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

  const report = buildContentReportSummary(item.id);
  const isRemovedByReport = false;

  return {
    id: item.id,
    authorUsername: item.author.username,
    body: item.body,
    linkedSubjects: item.linkedSubjects,
    audience: item.audience,
    voteCount: item.voteCount,
    activeVote: item.activeVote,
    commentCount: countComments(commentsBySubjectId[item.id] ?? []),
    createdAt: item.createdAt,
    report,
    isRemovedByReport,
    discussionNote: postDiscussionNotes[item.id] ?? 'Personal post discussion stays threaded here.',
    discussion: mapCommentsWithReports(commentsBySubjectId[item.id] ?? [])
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

  const shareContacts = buildShareContacts();
  const quorumThresholdPercent = calculateProjectQuorumThreshold(memberState.eligibleVoterCount);
  const updateRequests = buildEventUpdateRequests(
    slug,
    quorumThresholdPercent,
    memberState.eligibleVoterCount
  );
  const editRequests = buildEventEditRequests(
    slug,
    quorumThresholdPercent,
    memberState.eligibleVoterCount
  );
  const report = buildContentReportSummary(item.id);
  const isRemovedByReport = false;

  return {
    ...item,
    memberCount: memberState.memberCount,
    description: item.description,
    attendanceNote: extras.attendanceNote,
    agenda: extras.agenda,
    updates: extras.updates,
    updateRequests: updateRequests,
    viewerCanRequestUpdate: canViewerRequestEventUpdate(slug),
    viewerCanVoteOnUpdateRequests: canViewerVoteOnEventUpdate(slug),
    editRequests: editRequests,
    viewerCanRequestEdit: canViewerRequestEventEdit(slug),
    viewerCanVoteOnEditRequests: canViewerVoteOnEventEdit(slug),
    attendees: (participation?.goingUserIds ?? []).map((userId) => userById(userId)?.username ?? '').filter(Boolean),
    invitedUsernames: (participation?.invitedUserIds ?? [])
      .map((userId) => userById(userId)?.username ?? '')
      .filter(Boolean),
    eventEditors: memberState.eventEditors,
    members: memberState.members,
    viewerIsGoing: memberState.viewerIsGoing,
    viewerCanToggleGoing: memberState.viewerCanToggleGoing,
    viewerHasEventEditAccess: memberState.viewerHasEventEditAccess,
    viewerCanManageEditors: memberState.viewerCanManageEditors,
    viewerCanShare: !!currentViewer(),
    availableEditorInvitees: memberState.availableEditorInvitees,
    shareContacts,
    report,
    isRemovedByReport,
    commentCount: countComments(commentsBySubjectId[item.id] ?? []),
    discussionNote: extras.discussionNote,
    discussion: mapCommentsWithReports(commentsBySubjectId[item.id] ?? [])
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

  const workflow = ensureEventWorkflowState(event.slug, creatorId);

  if (participation.goingUserIds.includes(viewer.id)) {
    participation.goingUserIds = participation.goingUserIds.filter((userId) => userId !== viewer.id);
    delete (eventGoingSinceById[eventId] ?? {})[viewer.id];

    if (creatorId !== viewer.id) {
      removeUserFromEventRequestVotes(event.slug, viewer.id);

      if (event.isPrivate) {
        workflow.editorUserIds = workflow.editorUserIds.filter((userId) => userId !== viewer.id);
      }
    }

    if (event.isPrivate && !participation.invitedUserIds.includes(viewer.id)) {
      participation.invitedUserIds = [...participation.invitedUserIds, viewer.id];
      eventInvitedSinceById[eventId] = {
        ...(eventInvitedSinceById[eventId] ?? {}),
        [viewer.id]: new Date().toISOString()
      };
    }

    return;
  }

  participation.goingUserIds = [...participation.goingUserIds, viewer.id];
  participation.invitedUserIds = participation.invitedUserIds.filter((userId) => userId !== viewer.id);
  delete (eventInvitedSinceById[eventId] ?? {})[viewer.id];
  eventGoingSinceById[eventId] = {
    ...(eventGoingSinceById[eventId] ?? {}),
    [viewer.id]: new Date().toISOString()
  };
}

export function toggleMockProjectMembership(slug: string) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);

  if (!viewer) {
    return;
  }

  if (projectMode === 'personal-service' && isProjectCreator(slug, viewer.id)) {
    return;
  }

  const memberIds = projectMembersBySlug[slug] ?? [];
  const viewerIsMember = memberIds.includes(viewer.id);

  if (viewerIsMember) {
    projectMembersBySlug[slug] = memberIds.filter((userId) => userId !== viewer.id);
    delete (projectMembershipSinceBySlug[slug] ?? {})[viewer.id];

    if (projectManagersBySlug[slug] && projectMode !== 'personal-service') {
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
  projectMembershipSinceBySlug[slug] = {
    ...(projectMembershipSinceBySlug[slug] ?? {}),
    [viewer.id]: new Date().toISOString()
  };
}

function ensureProjectMembership(slug: string, userId: string) {
  const memberIds = projectMembersBySlug[slug] ?? [];

  if (!memberIds.includes(userId)) {
    projectMembersBySlug[slug] = [userId, ...memberIds];
    projectMembershipSinceBySlug[slug] = {
      ...(projectMembershipSinceBySlug[slug] ?? {}),
      [userId]: new Date().toISOString()
    };
  }
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
      requestSettingsChangeRequests: [],
      serviceHistoryCompletions: {},
      revertHistory: [],
      phaseChangeRequests: [],
      updateRequests: [],
      editRequests: []
    });

  workflow.serviceRequests ??= [];
  workflow.requestSettingsChangeRequests ??= [];
  workflow.serviceHistoryCompletions ??= {};
  workflow.revertHistory ??= [];
  workflow.phaseChangeRequests ??= [];
  workflow.updateRequests ??= [];
  workflow.editRequests ??= [];

  return workflow;
}

function ensureEventWorkflowState(slug: string, creatorId: string | null = null) {
  const workflow =
    eventWorkflowStateBySlug[slug] ??
    (eventWorkflowStateBySlug[slug] = {
      editorUserIds: creatorId ? [creatorId] : [],
      updateRequests: [],
      editRequests: []
    });

  workflow.editorUserIds = Array.from(
    new Set([...(creatorId ? [creatorId] : []), ...(workflow.editorUserIds ?? [])])
  );
  workflow.updateRequests ??= [];
  workflow.editRequests ??= [];

  return workflow;
}

function removeUserFromEventRequestVotes(slug: string, userId: string) {
  const workflow = eventWorkflowStateBySlug[slug];

  if (!workflow) {
    return;
  }

  for (const request of workflow.updateRequests ?? []) {
    delete request.votesByUserId[userId];
  }

  for (const request of workflow.editRequests ?? []) {
    delete request.votesByUserId[userId];
  }
}

function canViewerRequestProjectPhaseChange(slug: string) {
  if (projectModeForSlug(slug) === 'personal-service') {
    return false;
  }

  const memberState = buildProjectMemberState(slug);

  return memberState.viewerIsMember;
}

function canViewerVoteOnProjectPhaseChange(slug: string) {
  return canViewerRequestProjectPhaseChange(slug);
}

function canViewerRequestProjectUpdate(slug: string) {
  if (projectModeForSlug(slug) === 'personal-service') {
    return false;
  }

  return buildProjectMemberState(slug).viewerIsMember;
}

function canViewerVoteOnProjectUpdate(slug: string) {
  return canViewerRequestProjectUpdate(slug);
}

function canViewerRequestProjectEdit(slug: string) {
  if (projectModeForSlug(slug) === 'personal-service') {
    return false;
  }

  return buildProjectMemberState(slug).viewerIsMember;
}

function canViewerVoteOnProjectEdit(slug: string) {
  return canViewerRequestProjectEdit(slug);
}

function canViewerRequestEventUpdate(slug: string) {
  const event = findPublicEventItem(slug);

  return !!event && buildEventMemberState(event).viewerHasEventEditAccess;
}

function canViewerVoteOnEventUpdate(slug: string) {
  return canViewerRequestEventUpdate(slug);
}

function canViewerRequestEventEdit(slug: string) {
  const event = findPublicEventItem(slug);

  return !!event && buildEventMemberState(event).viewerHasEventEditAccess;
}

function canViewerVoteOnEventEdit(slug: string) {
  return canViewerRequestEventEdit(slug);
}

function projectModeForSlug(slug: string) {
  return findPublicProjectItem(slug)?.projectMode ?? 'productive';
}

function requestSettingsEligibleVoterCount(
  slug: string,
  projectMode = projectModeForSlug(slug)
) {
  if (projectMode === 'personal-service') {
    return findPublicProjectItem(slug) ? 1 : 0;
  }

  const memberState = buildProjectMemberState(slug);

  return memberState.projectManagers.length + memberState.members.length;
}

function requestSystemEnabledForProject(
  slug: string,
  projectMode: ProjectMode,
  phaseThree?: { plans: ProjectDistributionPlan[]; winningPlanId: string | null }
) {
  return resolvedProjectRequestSettingsForProject(slug, projectMode, phaseThree).enabled;
}

function collectiveRequestModeForProject(
  slug: string,
  phaseThree?: { plans: ProjectDistributionPlan[]; winningPlanId: string | null }
) {
  return resolvedProjectRequestSettingsForProject(slug, 'collective-service', phaseThree).requestMode;
}

function collectiveAllowOffScheduleRequestsForProject(
  slug: string,
  phaseThree?: { plans: ProjectDistributionPlan[]; winningPlanId: string | null }
) {
  return resolvedProjectRequestSettingsForProject(
    slug,
    'collective-service',
    phaseThree
  ).allowOffScheduleRequests;
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
  const projectMode = projectModeForSlug(slug);

  return !!viewer && projectLifecycleBySlug[slug]?.currentPhaseId === activityPhaseIdForProject(projectMode);
}

function canViewerRequestProjectServiceRequestSettingsChange(slug: string) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);

  if (!viewer || projectLifecycleBySlug[slug]?.currentPhaseId !== activityPhaseIdForProject(projectMode)) {
    return false;
  }

  if (projectMode === 'personal-service') {
    return isProjectCreator(slug, viewer.id);
  }

  const memberState = buildProjectMemberState(slug);

  return memberState.viewerIsMember;
}

function canViewerVoteOnProjectServiceRequestSettingsChange(slug: string) {
  if (projectModeForSlug(slug) === 'personal-service') {
    return false;
  }

  return canViewerRequestProjectServiceRequestSettingsChange(slug);
}

function canViewerCreateProjectActivity(slug: string) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];
  const projectMode = projectModeForSlug(slug);

  if (!viewer || projectLifecycleBySlug[slug]?.currentPhaseId !== activityPhaseIdForProject(projectMode)) {
    return false;
  }

  if (projectMode === 'personal-service') {
    return personalServiceUsesCalendar(slug) && canViewerManageProjectPhase(slug);
  }

  return memberIds.includes(viewer.id);
}

function canViewerSubmitProjectServiceRequest(slug: string) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);
  const requestSystemEnabled = requestSystemEnabledForProject(slug, projectMode);

  return (
    !!viewer &&
    requestSystemEnabled &&
    projectLifecycleBySlug[slug]?.currentPhaseId === activityPhaseIdForProject(projectMode) &&
    !(projectMode === 'personal-service' && isProjectCreator(slug, viewer.id))
  );
}

function canViewerReviewProjectServiceRequests(slug: string) {
  const projectMode = projectModeForSlug(slug);

  if (projectLifecycleBySlug[slug]?.currentPhaseId !== activityPhaseIdForProject(projectMode)) {
    return false;
  }

  if (projectMode === 'collective-service') {
    return !!currentViewer();
  }

  if (projectMode === 'personal-service') {
    return canViewerManageProjectPhase(slug);
  }

  return buildProjectMemberState(slug).viewerIsMember;
}

function findOverlappingPersonalServiceAvailabilityIndex(
  activities: RawProjectActivity[],
  scheduledAt: string,
  endsAt: string
) {
  const requestStart = new Date(scheduledAt).getTime();
  const requestEnd = new Date(endsAt).getTime();

  return activities.findIndex((activity) => {
    const activityStart = new Date(activity.scheduledAt).getTime();
    const activityEnd = activity.endsAt
      ? new Date(activity.endsAt).getTime()
      : activityStart + 60 * 60 * 1000;

    return requestStart < activityEnd && requestEnd > activityStart;
  });
}

function personalServiceUsesCalendar(slug: string) {
  return personalServiceRequestMode(slug) !== 'direct';
}

function personalServiceRequestMode(slug: string) {
  return resolvedProjectRequestSettingsForProject(slug, 'personal-service').requestMode;
}

function formatServiceRequestWindow(start?: string, end?: string) {
  if (!start || !end) {
    return '';
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} to ${endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function normalizeProjectActivityRoleRequirements(roleRequirements: ProjectActivityInput['roleRequirements']) {
  return roleRequirements
    .map((role) => {
      const requiredCount = Math.max(1, Number(role.requiredCount) || 1);
      const parsedMaximumCount = Number(role.maximumCount);

      return {
        label: role.label.trim(),
        requiredCount,
        maximumCount: Number.isFinite(parsedMaximumCount)
          ? Math.max(requiredCount, Math.floor(parsedMaximumCount))
          : undefined
      };
    })
    .filter((role) => role.label);
}

function minimumParticipantsForRawActivity(activity: RawProjectActivity) {
  return activity.roles.reduce((total, role) => total + role.requiredCount, 0);
}

function rawProjectActivityIsActive(activity: RawProjectActivity) {
  const committedCount = activity.roles.reduce((total, role) => total + role.assignedUsernames.length, 0);

  return (
    committedCount >= minimumParticipantsForRawActivity(activity) &&
    activity.roles.every((role) => role.assignedUsernames.length >= role.requiredCount)
  );
}

function resolveProjectServiceRequestStatus(
  request: RawProjectServiceRequest,
  activities: RawProjectActivity[]
): ProjectServiceRequestStatus {
  if (!request.linkedActivityId) {
    return request.status;
  }

  const linkedActivity = activities.find((activity) => activity.id === request.linkedActivityId);

  if (!linkedActivity) {
    return request.status;
  }

  return rawProjectActivityIsActive(linkedActivity) ? 'accepted' : 'planned';
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
  const demandConsiderationNote = input.demandConsiderationNote.trim();
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
    !demandConsiderationNote ||
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
      demandSignalSnapshot: workflow.signalCount,
      demandConsiderationNote,
      planPhases,
      outputSummary: description,
      materialsSummary: phaseDetailsSummary,
      totalCostLabel,
      acquisitionsSummary: phaseMaterialSummary,
      overallVotesByUserId: {
        [viewer.id]: 'yes'
      },
      valueVotesByValueId: Object.fromEntries(
        [
          [demandSignalAssessmentValueId, { [viewer.id]: 'yes' as ProjectApprovalVote }],
          ...values.map((value) => [value.id, { [viewer.id]: 'yes' as ProjectApprovalVote }])
        ]
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
  const demandConsiderationNote = input.demandConsiderationNote.trim();
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
    !demandConsiderationNote ||
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
      demandSignalSnapshot: workflow.signalCount,
      demandConsiderationNote,
      totalCostLabel,
      planPhases,
      distributionSummary: description,
      accessSummary: phaseDetailsSummary,
      reserveSummary: phaseMaterialSummary,
      requestSystemEnabled: input.requestSystemEnabled ?? false,
      requestMode: input.requestMode ?? 'both',
      allowOffScheduleRequests: input.allowOffScheduleRequests ?? false,
      overallVotesByUserId: {
        [viewer.id]: 'yes'
      },
      valueVotesByValueId: Object.fromEntries(
        [
          [demandSignalAssessmentValueId, { [viewer.id]: 'yes' as ProjectApprovalVote }],
          ...values.map((value) => [value.id, { [viewer.id]: 'yes' as ProjectApprovalVote }])
        ]
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
  const roleRequirements = normalizeProjectActivityRoleRequirements(input.roleRequirements);
  const minimumParticipants = roleRequirements.reduce(
    (total, role) => total + role.requiredCount,
    0
  );
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
      linkedPlanPhaseId: input.linkedPlanPhaseId ?? null,
      linkedRequestId: null,
      roles: roleRequirements.map((role, index) => ({
        label: role.label,
        requiredCount: role.requiredCount,
        maximumCount: role.maximumCount,
        assignedUsernames: index === 0 ? [viewer.username] : []
      })),
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

  if (!roleLabel) {
    return;
  }

  const targetRole = activity.roles.find((role) => role.label === roleLabel);

  if (!targetRole) {
    return;
  }

  const maximumCount =
    targetRole.maximumCount != null
      ? Math.max(targetRole.maximumCount, targetRole.requiredCount)
      : undefined;

  if (maximumCount != null && targetRole.assignedUsernames.length >= maximumCount) {
    return;
  }

  ensureProjectMembership(slug, viewer.id);

  targetRole.assignedUsernames = [...targetRole.assignedUsernames, viewer.username];
}

export function addMockProjectServiceRequest(slug: string, input: ProjectServiceRequestInput) {
  const viewer = currentViewer();
  const trimmedTitle = input.title.trim();
  const trimmedBody = input.body.trim();
  const trimmedScheduledAt = input.scheduledAt?.trim();
  const trimmedEndsAt = input.endsAt?.trim();
  const workflow = ensureProjectWorkflowState(slug);
  const serviceRequests = workflow.serviceRequests ?? [];
  const projectMode = projectModeForSlug(slug);
  const personalRequestMode =
    projectMode === 'personal-service' ? personalServiceRequestMode(slug) : 'calendar';
  const usesCalendar = projectMode === 'personal-service' ? personalServiceUsesCalendar(slug) : false;
  const collectiveRequestMode =
    projectMode === 'collective-service' ? collectiveRequestModeForProject(slug) : 'both';
  const collectiveAllowOffScheduleRequests =
    projectMode === 'collective-service' ? collectiveAllowOffScheduleRequestsForProject(slug) : false;

  if (!viewer || !trimmedTitle || !trimmedBody || !canViewerSubmitProjectServiceRequest(slug)) {
    return;
  }

  if (
    projectMode === 'personal-service' &&
    personalRequestMode === 'calendar' &&
    (!trimmedScheduledAt ||
      !trimmedEndsAt ||
      new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime())
  ) {
    return;
  }

  if (
    projectMode === 'personal-service' &&
    personalRequestMode === 'both' &&
    trimmedScheduledAt &&
    trimmedEndsAt &&
    new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime()
  ) {
    return;
  }

  if (
    projectMode === 'collective-service' &&
    (!trimmedScheduledAt ||
      !trimmedEndsAt ||
      new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime())
  ) {
    return;
  }

  if (
    projectMode === 'collective-service' &&
    collectiveRequestMode === 'calendar' &&
    (!trimmedScheduledAt ||
      !trimmedEndsAt ||
      new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime())
  ) {
    return;
  }

  if (
    projectMode === 'collective-service' &&
    collectiveRequestMode === 'both' &&
    trimmedScheduledAt &&
    trimmedEndsAt &&
    new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime()
  ) {
    return;
  }

  if (
    projectMode === 'collective-service' &&
    collectiveRequestMode === 'both' &&
    !collectiveAllowOffScheduleRequests &&
    (!trimmedScheduledAt || !trimmedEndsAt)
  ) {
    return;
  }

  if (
    projectMode === 'personal-service' &&
    personalRequestMode !== 'direct' &&
    trimmedScheduledAt &&
    trimmedEndsAt &&
    findOverlappingPersonalServiceAvailabilityIndex(
      workflow.phaseFiveActivities,
      trimmedScheduledAt,
      trimmedEndsAt
    ) < 0
  ) {
    return;
  }

  if (
    projectMode === 'collective-service' &&
    collectiveRequestMode !== 'direct' &&
    (!collectiveAllowOffScheduleRequests || collectiveRequestMode === 'calendar') &&
    trimmedScheduledAt &&
    trimmedEndsAt &&
    findOverlappingPersonalServiceAvailabilityIndex(
      workflow.phaseFiveActivities,
      trimmedScheduledAt,
      trimmedEndsAt
    ) < 0
  ) {
    return;
  }

  const createdAt = new Date().toISOString();

  workflow.serviceRequests = [
    {
      id: `project-service-request-${slug}-${Date.now()}`,
      title: trimmedTitle,
      body: trimmedBody,
      requesterUsername: viewer.username,
      createdAt,
      status: 'open',
      scheduledAt: trimmedScheduledAt || undefined,
      endsAt: trimmedEndsAt || undefined,
      linkedActivityId: null
    },
    ...serviceRequests
  ];

  if (projectMode === 'personal-service' && !isProjectCreator(slug, viewer.id)) {
    const memberIds = projectMembersBySlug[slug] ?? [];

    if (!memberIds.includes(viewer.id)) {
      projectMembersBySlug[slug] = [...memberIds, viewer.id];
    }

    const project = findPublicProjectItem(slug);
    const creator = project ? userByUsername(project.authorUsername) : null;

    if (project && creator && creator.id !== viewer.id) {
      const requestWindow = formatServiceRequestWindow(trimmedScheduledAt, trimmedEndsAt);
      const notificationBody =
        usesCalendar && requestWindow
          ? `${viewer.username} requested \"${trimmedTitle}\" for ${requestWindow}.`
          : `${viewer.username} requested \"${trimmedTitle}\".`;

      pushUserNotification(creator.id, {
        id: `notification-project-request-${slug}-${creator.id}-${Date.now()}`,
        kind: 'project',
        surface: 'public',
        subjectKind: 'project',
        projectMode: project.projectMode,
        actorUsername: viewer.username,
        actionLabel: 'Requested',
        title: project.title,
        body: notificationBody,
        href: project.href,
        createdAt,
        isUnread: true,
        channelTags: project.channelTags,
        communityTags: project.communityTags
      });

      appendDirectMessageForUsers(
        viewer.id,
        creator.id,
        usesCalendar && requestWindow
          ? `Requested \"${trimmedTitle}\" for ${requestWindow}. ${trimmedBody}`
          : `Requested \"${trimmedTitle}\". ${trimmedBody}`
      );
    }
  }
}

export function planMockProjectServiceRequest(
  slug: string,
  requestId: string,
  input: ProjectServiceRequestPlanInput
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = (workflow.serviceRequests ?? []).find((item) => item.id === requestId);
  const roleRequirements = normalizeProjectActivityRoleRequirements(input.roleRequirements);
  const minimumParticipants = roleRequirements.reduce(
    (total, role) => total + role.requiredCount,
    0
  );

  if (
    !viewer ||
    !request ||
    request.status !== 'open' ||
    !request.scheduledAt ||
    !request.endsAt ||
    !canViewerReviewProjectServiceRequests(slug) ||
    !input.title.trim() ||
    !input.locationLabel.trim() ||
    !input.note.trim() ||
    roleRequirements.length === 0 ||
    minimumParticipants < 1
  ) {
    return;
  }

  const activityId = `project-activity-request-${slug}-${Date.now()}`;

  workflow.phaseFiveActivities = [
    {
      id: activityId,
      title: input.title.trim(),
      authorUsername: viewer.username,
      scheduledAt: request.scheduledAt,
      endsAt: request.endsAt,
      locationLabel: input.locationLabel.trim(),
      minimumParticipants,
      linkedPlanPhaseId: input.linkedPlanPhaseId ?? null,
      linkedRequestId: request.id,
      roles: roleRequirements.map((role) => ({
        label: role.label,
        requiredCount: role.requiredCount,
        maximumCount: role.maximumCount,
        assignedUsernames: []
      })),
      note: input.note.trim()
    },
    ...workflow.phaseFiveActivities
  ];

  request.status = 'planned';
  request.linkedActivityId = activityId;
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

  const wasOpen = request.status === 'open';
  request.status = status;

  if (
    wasOpen &&
    status === 'accepted' &&
    projectModeForSlug(slug) === 'personal-service' &&
    personalServiceUsesCalendar(slug) &&
    request.scheduledAt &&
    request.endsAt
  ) {
    const slotIndex = findOverlappingPersonalServiceAvailabilityIndex(
      workflow.phaseFiveActivities,
      request.scheduledAt,
      request.endsAt
    );

    if (slotIndex >= 0) {
      workflow.phaseFiveActivities = workflow.phaseFiveActivities.filter(
        (_, index) => index !== slotIndex
      );
    }
  }
}

function maybeApplyApprovedProjectServiceRequestSettingsChange(slug: string, requestId: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.requestSettingsChangeRequests?.find((item) => item.id === requestId);
  const projectMode = projectModeForSlug(slug);

  if (!request) {
    return;
  }

  const eligibleVoterCount = requestSettingsEligibleVoterCount(slug, projectMode);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(eligibleVoterCount),
    eligibleVoterCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    workflow.requestSettingsChangeRequests = (workflow.requestSettingsChangeRequests ?? []).filter(
      (item) => item.id !== requestId
    );
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  workflow.requestSystemOverride = {
    enabled: request.proposedSettings.enabled,
    requestMode: request.proposedSettings.requestMode,
    allowOffScheduleRequests:
      projectMode === 'personal-service'
        ? request.proposedSettings.requestMode === 'both'
        : request.proposedSettings.allowOffScheduleRequests
  };
  workflow.requestSettingsChangeRequests = (workflow.requestSettingsChangeRequests ?? []).filter(
    (item) => item.id !== requestId
  );
}

function buildProjectServiceHistoryItemById(slug: string, historyId: string) {
  const projectMode = projectModeForSlug(slug);
  const memberCount = (projectMembersBySlug[slug] ?? []).length;
  const quorumThresholdPercent = calculateProjectQuorumThreshold(memberCount);
  const values = buildProjectValues(slug);
  const phaseTwo = buildProductionPlans(slug, values, quorumThresholdPercent, memberCount);
  const phaseThree = buildDistributionPlans(slug, values, quorumThresholdPercent, memberCount);
  const selectablePlanPhases = buildSelectableActivityPlanPhases(phaseTwo, phaseThree);

  return (
    buildProjectPhaseFiveState(slug, projectMode, selectablePlanPhases).history.find(
      (item) => item.id === historyId
    ) ?? null
  );
}

export function requestMockProjectServiceRequestSettingsChange(
  slug: string,
  input: ProjectServiceRequestSettingsChangeInput
) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);

  if (!viewer || !canViewerRequestProjectServiceRequestSettingsChange(slug)) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);

  const proposedSettings = {
    enabled: input.enabled,
    requestMode: input.requestMode,
    allowOffScheduleRequests:
      projectMode === 'personal-service' ? input.requestMode === 'both' : input.allowOffScheduleRequests
  } satisfies RawProjectRequestSystemSettings;
  const currentSettings = resolvedProjectRequestSettingsForProject(slug, projectMode);

  if (projectRequestSettingsMatch(currentSettings, proposedSettings)) {
    return;
  }

  if (projectMode === 'personal-service') {
    workflow.requestSystemOverride = proposedSettings;
    workflow.requestSettingsChangeRequests = [];
    return;
  }

  const trimmedReason = input.reason.trim();

  if (!trimmedReason) {
    return;
  }

  if (
    (workflow.requestSettingsChangeRequests ?? []).some(
      (request) =>
        projectRequestSettingsSignature(request.proposedSettings) ===
        projectRequestSettingsSignature(proposedSettings)
    )
  ) {
    return;
  }

  const createdAt = new Date().toISOString();
  const requestId = `project-request-settings-${slug}-${Date.now()}`;
  workflow.requestSettingsChangeRequests = [
    {
      id: requestId,
      reason: trimmedReason,
      authorUsername: viewer.username,
      createdAt,
      proposedSettings,
      votesByUserId: {
        [viewer.id]: 'yes'
      }
    },
    ...(workflow.requestSettingsChangeRequests ?? [])
  ];

  maybeApplyApprovedProjectServiceRequestSettingsChange(slug, requestId);
}

export function setMockProjectServiceRequestSettingsChangeVote(
  slug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.requestSettingsChangeRequests?.find((item) => item.id === requestId);

  if (!viewer || !request || !canViewerVoteOnProjectServiceRequestSettingsChange(slug)) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedProjectServiceRequestSettingsChange(slug, requestId);
}

export function setMockProjectServiceHistoryCompletion(
  slug: string,
  historyId: string,
  role: ProjectServiceHistoryCompletionRole,
  selection?: ProjectServiceHistoryCompletionChoice
) {
  const viewer = currentViewer();

  if (!viewer || !selection) {
    return;
  }

  const historyItem = buildProjectServiceHistoryItemById(slug, historyId);

  if (!historyItem) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);
  const existingCompletion = normalizeRawServiceHistoryCompletion(
    workflow.serviceHistoryCompletions?.[historyId]
  );
  const completion =
    workflow.serviceHistoryCompletions?.[historyId] ??
    (workflow.serviceHistoryCompletions![historyId] = {
      requesterSelectionsByUsername: {},
      participantSelectionsByUsername: {}
    });

  completion.requesterSelectionsByUsername = existingCompletion.requesterSelectionsByUsername;
  completion.participantSelectionsByUsername = existingCompletion.participantSelectionsByUsername;
  delete completion.requesterDoneByUsernames;
  delete completion.participantDoneByUsernames;

  if (role === 'requester') {
    if (!historyItem.requesterCompletion?.viewerCanToggle) {
      return;
    }

    completion.requesterSelectionsByUsername ??= {};
    completion.requesterSelectionsByUsername[viewer.username] = selection;
    return;
  }

  if (!historyItem.participantCompletion.viewerCanToggle) {
    return;
  }

  completion.participantSelectionsByUsername ??= {};
  completion.participantSelectionsByUsername[viewer.username] = selection;
}

export function advanceMockProjectPhase(slug: string, closeNote?: string) {
  const config = projectLifecycleBySlug[slug];
  const viewer = currentViewer();
  const projectMode = findPublicProjectItem(slug)?.projectMode ?? 'productive';
  const trimmedCloseNote = closeNote?.trim() ?? '';
  const closingPhaseId = closePhaseIdForProject(projectMode);

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

  if (nextPhaseId === closingPhaseId && !trimmedCloseNote) {
    return;
  }

  config.currentPhaseId = nextPhaseId;

  if (nextPhaseId === closingPhaseId && trimmedCloseNote && viewer && projectDetailExtras[slug]) {
    projectDetailExtras[slug].updates = [
      {
        id: `project-update-close-${slug}-${Date.now()}`,
        title: 'Closure note',
        body: trimmedCloseNote,
        authorUsername: viewer.username,
        createdAt: new Date().toISOString()
      },
      ...projectDetailExtras[slug].updates
    ];
  }
}

export function revertMockProjectPhase(
  slug: string,
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>,
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

  if (projectDetailExtras[slug]) {
    projectDetailExtras[slug].updates = [
      {
        id: `project-update-return-${slug}-${Date.now()}`,
        title: 'Return note',
        body: trimmedReason,
        authorUsername: viewer.username,
        createdAt: new Date().toISOString()
      },
      ...projectDetailExtras[slug].updates
    ];
  }
}

export function toggleMockProjectManagerNomination(slug: string) {
  const viewer = currentViewer();

  if (!viewer || isPlatformTaggedProject(slug)) {
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

  persistClientState();
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

export function signInMockAccount(input: SignInInput): AuthResult {
  const username = normalizeUsernameInput(input.username);
  const password = input.password.trim();
  const user = userByUsername(username);

  if (!username || !password) {
    return {
      ok: false,
      error: 'Enter both a username and password.'
    };
  }

  if (!user || credentialsByUserId[user.id] !== password) {
    return {
      ok: false,
      error: 'That username and password do not match this mock account list.'
    };
  }

  mockSessionFixture.currentViewerId = user.id;
  currentSettingsState();
  persistClientState();

  return { ok: true };
}

export function signOutMockAccount() {
  mockSessionFixture.currentViewerId = null;
  persistClientState();
}

export function signUpMockAccount(input: SignUpInput): AuthResult {
  const username = normalizeUsernameInput(input.username);
  const password = input.password.trim();
  const profileBio = input.profileBio?.trim() ?? '';

  if (!username || !password) {
    return {
      ok: false,
      error: 'Choose both a username and password.'
    };
  }

  if (userByUsername(username)) {
    return {
      ok: false,
      error: 'That username is already taken in the mock data.'
    };
  }

  const user: ViewerSummary = {
    id: uniqueUserId(username),
    username,
    bio: profileBio || undefined
  };

  users.push(user);
  rebuildUserIndexes();
  followsByUserId[user.id] = [];
  credentialsByUserId[user.id] = password;
  settingsByUserId[user.id] = {
    ...createDefaultSettingsState(user),
    profileBio
  };
  mockSessionFixture.currentViewerId = user.id;
  syncViewerProfileFromSettings(user.id);
  persistClientState();

  return { ok: true };
}

function createProjectDiscussionNote(input: CreateProjectInput) {
  if (input.channelTags.some((tag) => tag.slug === platform.slug)) {
    return 'Platform-tagged project chat stays attached here so governance coordination stays visible without turning into a generic thread.';
  }

  if (input.projectMode === 'personal-service') {
    return 'Use chat here to coordinate requests, timing, and service follow-up without splitting the work across separate surfaces.';
  }

  return 'Use chat here to keep planning, coordination, and follow-up attached to the project itself.';
}

function createProjectOverview(input: CreateProjectInput) {
  const pieces = [input.summary.trim()];

  if (input.note?.trim()) {
    pieces.push(input.note.trim());
  }

  return pieces.join(' ');
}

export function createMockProject(input: CreateProjectInput): CreateResult {
  const viewer = currentViewer();
  const title = input.title.trim();
  const summary = input.summary.trim();
  const locationLabel = projectLocationLabel(input.locationLabel);
  const channelTags = input.channelTags;
  const communityTags = input.communityTags;
  const isPlatformProject = channelTags.some((tag) => tag.slug === platform.slug);

  if (!viewer) {
    return {
      ok: false,
      error: 'Sign in before creating a project.'
    };
  }

  if (!title || !summary || channelTags.length === 0) {
    return {
      ok: false,
      error: 'Projects need a title, summary, and at least one channel tag.'
    };
  }

  if (isPlatformProject && !platformBoardMemberIds.includes(viewer.id)) {
    return {
      ok: false,
      error: 'Only current board members can create platform-tagged projects.'
    };
  }

  const slug = uniqueSlug(title);
  const createdAt = new Date().toISOString();
  const id = `project-${slug}`;
  const confidenceTargetId = `confidence-project-manager-${slug}-${viewer.id}`;

  publicFeedBase.unshift({
    kind: 'project',
    id,
    slug,
    href: `/projects/${slug}`,
    createdAt,
    title,
    authorUsername: viewer.username,
    projectMode: input.projectMode,
    summary,
    channelTags,
    communityTags,
    stage: input.projectMode === 'personal-service' ? 'Activity' : 'Proposal',
    locationLabel,
    voteCount: 0,
    activeVote: 0,
    signalCount: 0,
    commentCount: 0,
    memberCount: 1,
    lastActivityAt: createdAt
  });

  projectLifecycleBySlug[slug] = createProjectLifecycleConfig(input.projectMode);
  projectWorkflowStateBySlug[slug] = {
    signalCount: 0,
    signalUserIds: [],
    values: [],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: [],
    serviceRequests: [],
    requestSystemEnabled: input.projectMode === 'personal-service' ? true : undefined,
    requestSettingsChangeRequests: [],
    serviceHistoryCompletions: {},
    revertHistory: [],
    phaseChangeRequests: [],
    availabilitySummary:
      input.projectMode === 'personal-service' && input.serviceRequestMode !== 'direct'
        ? 'Availability will be coordinated directly through this service page.'
        : undefined,
    travelRadiusLabel:
      input.projectMode === 'personal-service' && input.serviceRequestMode !== 'direct'
        ? locationLabel
        : undefined,
    serviceRequestMode:
      input.projectMode === 'personal-service' ? input.serviceRequestMode ?? 'both' : undefined
  };
  projectMembersBySlug[slug] = [viewer.id];
  projectMembershipSinceBySlug[slug] = {
    [viewer.id]: createdAt
  };

  if (input.projectMode !== 'personal-service') {
    projectManagersBySlug[slug] = {
      managerIds: [viewer.id],
      candidateIds: [],
      confidenceTargetIdsByUserId: {
        [viewer.id]: confidenceTargetId
      }
    };
  }

  projectDetailExtras[slug] = {
    overview: createProjectOverview(input),
    updates: [],
    discussionNote: createProjectDiscussionNote(input),
    discussion: []
  };
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);

  if (input.projectMode !== 'personal-service') {
    seedConfidenceTarget(confidenceTargetId, 0, 0, 0);
  }

  return {
    ok: true,
    slug
  };
}

export function createMockThread(input: CreateThreadInput): CreateResult {
  const viewer = currentViewer();
  const title = input.title.trim();
  const body = input.body.trim();
  const tags = [...input.channelTags, ...input.communityTags];

  if (!viewer) {
    return {
      ok: false,
      error: 'Sign in before creating a thread.'
    };
  }

  if (!title || !body || tags.length === 0) {
    return {
      ok: false,
      error: 'Threads need a title, opening post, and at least one discovery tag.'
    };
  }

  const slug = uniqueSlug(title);
  const createdAt = new Date().toISOString();
  const id = `thread-${slug}`;

  publicFeedBase.unshift({
    kind: 'thread',
    id,
    slug,
    href: `/threads/${slug}`,
    createdAt,
    title,
    body,
    authorUsername: viewer.username,
    channelTags: input.channelTags,
    communityTags: input.communityTags,
    voteCount: 0,
    activeVote: 0,
    commentCount: 0,
    lastActivityAt: createdAt
  });
  threadDiscussionNotes[slug] =
    input.channelTags.some((tag) => tag.slug === platform.slug)
      ? 'Platform threads stay open to regular users, even while platform-tagged projects stay board-created.'
      : 'Discussion stays visible here so replies and follow-up notes remain attached to the original question.';
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);

  return {
    ok: true,
    slug
  };
}

export function createMockEvent(input: CreateEventInput): CreateResult {
  const viewer = currentViewer();
  const title = input.title.trim();
  const description = input.description.trim();
  const startTimeLabel = input.startTimeLabel.trim();
  const finishTimeLabel = input.finishTimeLabel.trim();
  const locationLabel = input.locationLabel.trim();

  if (!viewer) {
    return {
      ok: false,
      error: 'Sign in before creating an event.'
    };
  }

  if (!title || !description || !startTimeLabel || !finishTimeLabel || !locationLabel) {
    return {
      ok: false,
      error: 'Events need a title, description, start time, finish time, and location.'
    };
  }

  const invitedUserIds: string[] = [];

  for (const username of Array.from(new Set(input.invitedUsernames.map((value) => value.trim()).filter(Boolean)))) {
    const user = userByUsername(username);

    if (!user) {
      return {
        ok: false,
        error: `Could not find @${username}.`
      };
    }

    if (user.id !== viewer.id) {
      invitedUserIds.push(user.id);
    }
  }

  const privateCommunityOnly =
    input.channelTags.length === 0 &&
    input.communityTags.length === 1 &&
    readScopeMembership('community', input.communityTags[0].slug).joinPolicy === 'invite_only';
  const personalInviteOnly =
    input.channelTags.length === 0 && input.communityTags.length === 0 && invitedUserIds.length > 0;
  const isPrivate = privateCommunityOnly || personalInviteOnly;
  const slug = uniqueSlug(title);
  const createdAt = new Date().toISOString();
  const id = `event-${slug}`;

  publicFeedBase.unshift({
    kind: 'event',
    id,
    slug,
    href: `/events/${slug}`,
    createdAt,
    title,
    description,
    isPrivate,
    scheduledAt: createdAt,
    channelTags: input.channelTags,
    communityTags: input.communityTags,
    createdByUsername: viewer.username,
    timeLabel: `${startTimeLabel} to ${finishTimeLabel}`,
    locationLabel,
    voteCount: 0,
    activeVote: 0,
    commentCount: 0,
    goingCount: 1,
    lastActivityAt: createdAt
  });
  eventDetailExtras[slug] = {
    attendanceNote: isPrivate
      ? 'This event stays private because it is invite-only or lives only inside a closed community.'
      : 'This event stays discoverable through its tags, so people can find it without turning it into a project.',
    agenda: [],
    updates: [],
    discussionNote: isPrivate
      ? 'Private event chat stays live here so logistics and follow-up questions stay inside the invited group.'
      : 'Event chat stays live here so logistics and follow-up notes stay immediate instead of forum-like.',
    discussion: []
  };
  eventParticipationById[id] = {
    goingUserIds: [viewer.id],
    invitedUserIds
  };
  eventGoingSinceById[id] = {
    [viewer.id]: createdAt
  };
  eventInvitedSinceById[id] = Object.fromEntries(
    invitedUserIds.map((userId) => [userId, createdAt])
  );
  eventWorkflowStateBySlug[slug] = {
    editorUserIds: [viewer.id],
    updateRequests: [],
    editRequests: []
  };
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);

  return {
    ok: true,
    slug
  };
}

export function createMockPost(input: CreatePostInput): CreateResult {
  const viewer = currentViewer();
  const body = input.body.trim();

  if (!viewer) {
    return {
      ok: false,
      error: 'Sign in before posting.'
    };
  }

  if (!body) {
    return {
      ok: false,
      error: 'Posts need body copy before they can be published.'
    };
  }

  const id = uniquePostId(body.slice(0, 48));
  const createdAt = new Date().toISOString();

  socialPostsBase.unshift({
    kind: 'post',
    id,
    href: `/posts/${id}`,
    author: viewer,
    audience: input.audience,
    voteTargetId: id,
    body,
    linkedSubjects: detectPostBodyLinks(body),
    voteCount: 0,
    activeVote: 0,
    commentCount: 0,
    createdAt
  });
  postDiscussionNotes[id] =
    input.audience === 'public'
      ? 'Public personal posts still keep their own reply surface so discussion does not disappear into the feed.'
      : 'Follower posts still keep a real discussion surface so replies stay visible to the people who can see them.';
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);

  return {
    ok: true,
    id
  };
}

export function createMockChannel(input: CreateChannelInput): CreateResult {
  const viewer = currentViewer();
  const name = input.name.trim();
  const description = input.description.trim();

  if (!viewer) {
    return {
      ok: false,
      error: 'Sign in before creating a channel.'
    };
  }

  if (!name || !description) {
    return {
      ok: false,
      error: 'Channels need a name and description.'
    };
  }

  const slug = uniqueScopeSlug(name, 'channel');
  channelDirectory.unshift({
    slug,
    label: name,
    href: `/channels/${slug}`
  });
  scopeMembershipByKey[scopeMembershipKey('channel', slug)] = {
    memberIds: [viewer.id],
    joinPolicy: 'open'
  };
  createdChannelScopeMetaBySlug[slug] = createDefaultScopeMeta(
    'channel',
    description,
    'open'
  );

  return {
    ok: true,
    slug
  };
}

export function createMockCommunity(input: CreateCommunityInput): CreateResult {
  const viewer = currentViewer();
  const name = input.name.trim();
  const description = input.description.trim();

  if (!viewer) {
    return {
      ok: false,
      error: 'Sign in before creating a community.'
    };
  }

  if (!name || !description) {
    return {
      ok: false,
      error: 'Communities need a name and description.'
    };
  }

  const slug = uniqueScopeSlug(name, 'community');
  communityDirectory.unshift({
    slug,
    label: name,
    href: `/communities/${slug}`
  });
  scopeMembershipByKey[scopeMembershipKey('community', slug)] = {
    memberIds: [viewer.id],
    joinPolicy: input.joinPolicy,
    inviteToken: input.joinPolicy === 'invite_only' ? `${slug}-invite` : undefined,
    hiddenFeedCopy:
      input.joinPolicy === 'invite_only'
        ? 'This closed community only shows its feed to members. Join with an invite link before the work and discussion unlock here.'
        : undefined
  };
  createdCommunityScopeMetaBySlug[slug] = createDefaultScopeMeta(
    'community',
    description,
    input.joinPolicy
  );

  return {
    ok: true,
    slug
  };
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

export function submitMockReport(subjectId: string, targetId: string, reason: string, details: string) {
  const viewer = currentViewer();
  const trimmedReason = reason.trim() as ContentReportReason;
  const trimmedDetails = details.trim();

  if (
    !viewer ||
    !subjectId.trim() ||
    !targetId.trim() ||
    (trimmedReason !== 'spam' && trimmedReason !== 'serious-harm')
  ) {
    return;
  }

  const existingReport = contentReportsByTargetId[targetId];

  if (existingReport) {
    if (existingReport.resolution !== 'removed' && existingReport.eligibleUserIds.includes(viewer.id)) {
      existingReport.votesByUserId[viewer.id] = 'yes';
      reconcileContentReport(existingReport);
    }

    return;
  }

  const context = resolveReportTargetContext(subjectId, targetId);

  if (!context || context.authorUserId === viewer.id) {
    return;
  }

  if (context.targetKind === 'direct-message') {
    removeMessageFromConversations(targetId);
    return;
  }

  const createdAt = new Date().toISOString();
  const report: MockContentReport = {
    id: `report-${targetId}-${Date.now()}`,
    subjectId,
    targetId,
    targetKind: context.targetKind,
    reason: trimmedReason,
    description: trimmedDetails,
    reporterUserId: viewer.id,
    reportedAuthorUserId: context.authorUserId,
    eligibleUserIds: context.eligibleUserIds,
    votesByUserId: context.eligibleUserIds.includes(viewer.id)
      ? {
          [viewer.id]: 'yes'
        }
      : {},
    createdAt,
    resolution: 'open'
  };

  contentReportsByTargetId[targetId] = report;
  reconcileContentReport(report);
}

export function setMockReportVote(targetId: string, vote: ContentReportVote) {
  const viewer = currentViewer();
  const report = contentReportsByTargetId[targetId];

  if (
    !viewer ||
    !report ||
    report.resolution === 'removed' ||
    !report.eligibleUserIds.includes(viewer.id)
  ) {
    return;
  }

  report.votesByUserId[viewer.id] = vote;
  reconcileContentReport(report);
}

export function addMockProjectUpdate(slug: string, title: string, body: string) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const trimmedBody = body.trim();
  const nextTitle = resolvedUpdateTitle(title, body);
  const memberState = buildProjectMemberState(slug);
  const projectMode = projectModeForSlug(slug);

  if (
    !viewer ||
    !extras ||
    !trimmedBody ||
    projectMode !== 'personal-service' ||
    !memberState.viewerIsProjectManager
  ) {
    return;
  }

  extras.updates = [
    {
      id: `project-update-${slug}-${Date.now()}`,
      title: nextTitle,
      body: trimmedBody,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString()
    },
    ...extras.updates
  ];
}

function resolvedUpdateTitle(title: string, body: string) {
  const trimmedTitle = title.trim();

  if (trimmedTitle) {
    return trimmedTitle;
  }

  const normalizedBody = body.trim().replace(/\s+/g, ' ');

  if (normalizedBody.length <= 72) {
    return normalizedBody;
  }

  return `${normalizedBody.slice(0, 69).trimEnd()}...`;
}

function applyProjectDetailsChange(
  slug: string,
  title: string,
  summary: string,
  overview: string,
  updatedAt = new Date().toISOString()
) {
  const item = findPublicProjectItem(slug);
  const extras = projectDetailExtras[slug];

  if (!item || !extras) {
    return false;
  }

  item.title = title;
  item.summary = summary;
  item.lastActivityAt = updatedAt;
  extras.overview = overview;

  return true;
}

function maybeApplyApprovedProjectUpdate(slug: string, requestId: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.updateRequests?.find((item) => item.id === requestId);
  const extras = projectDetailExtras[slug];

  if (!request || !extras) {
    return;
  }

  const memberState = buildProjectMemberState(slug);
  const memberCount = memberState.projectManagers.length + memberState.members.length;
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  extras.updates = [
    {
      id: `project-update-${slug}-${Date.now()}`,
      title: request.title,
      body: request.body,
      authorUsername: request.authorUsername,
      createdAt: new Date().toISOString()
    },
    ...extras.updates
  ];
  workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
}

function maybeApplyApprovedProjectEdit(slug: string, requestId: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.editRequests?.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  const memberState = buildProjectMemberState(slug);
  const memberCount = memberState.projectManagers.length + memberState.members.length;
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  applyProjectDetailsChange(
    slug,
    request.title,
    request.summary,
    request.overview,
    new Date().toISOString()
  );
  workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
}

export function updateMockProjectDetails(
  slug: string,
  title: string,
  summary: string,
  overview: string
) {
  const viewer = currentViewer();
  const trimmedTitle = title.trim();
  const trimmedSummary = summary.trim();
  const trimmedOverview = overview.trim();

  if (
    !viewer ||
    projectModeForSlug(slug) !== 'personal-service' ||
    !trimmedTitle ||
    !trimmedSummary ||
    !trimmedOverview ||
    !isProjectCreator(slug, viewer.id)
  ) {
    return;
  }

  applyProjectDetailsChange(
    slug,
    trimmedTitle,
    trimmedSummary,
    trimmedOverview,
    new Date().toISOString()
  );
}

function applyEventDetailsChange(
  slug: string,
  title: string,
  description: string,
  updatedAt = new Date().toISOString()
) {
  const event = findPublicEventItem(slug);

  if (!event) {
    return false;
  }

  event.title = title;
  event.description = description;
  event.lastActivityAt = updatedAt;

  return true;
}

function maybeApplyApprovedEventUpdate(slug: string, requestId: string) {
  const event = findPublicEventItem(slug);
  const extras = eventDetailExtras[slug];

  if (!event || !extras) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const request = workflow.updateRequests?.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  const memberState = buildEventMemberState(event);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberState.eligibleVoterCount),
    memberState.eligibleVoterCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  const createdAt = new Date().toISOString();
  extras.updates = [
    {
      id: `event-update-${slug}-${Date.now()}`,
      title: request.title,
      body: request.body,
      authorUsername: request.authorUsername,
      createdAt
    },
    ...extras.updates
  ];
  event.lastActivityAt = createdAt;
  workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
}

function maybeApplyApprovedEventEdit(slug: string, requestId: string) {
  const event = findPublicEventItem(slug);

  if (!event) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const request = workflow.editRequests?.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  const memberState = buildEventMemberState(event);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberState.eligibleVoterCount),
    memberState.eligibleVoterCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  applyEventDetailsChange(slug, request.title, request.description, new Date().toISOString());
  workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
}

export function requestMockEventUpdate(slug: string, title: string, body: string) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const extras = eventDetailExtras[slug];
  const trimmedBody = body.trim();
  const nextTitle = resolvedUpdateTitle(title, body);

  if (!viewer || !event || !extras || !trimmedBody || !canViewerRequestEventUpdate(slug)) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const requestId = `event-update-request-${slug}-${Date.now()}`;
  workflow.updateRequests = [
    {
      id: requestId,
      title: nextTitle,
      body: trimmedBody,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString(),
      votesByUserId: {
        [viewer.id]: 'yes'
      }
    },
    ...(workflow.updateRequests ?? [])
  ];

  maybeApplyApprovedEventUpdate(slug, requestId);
}

export function setMockEventUpdateVote(
  slug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);

  if (!viewer || !event || !canViewerVoteOnEventUpdate(slug)) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const request = workflow.updateRequests?.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedEventUpdate(slug, requestId);
}

export function requestMockEventEdit(slug: string, title: string, description: string) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (
    !viewer ||
    !event ||
    !trimmedTitle ||
    !trimmedDescription ||
    !canViewerRequestEventEdit(slug)
  ) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const requestId = `event-edit-request-${slug}-${Date.now()}`;
  workflow.editRequests = [
    {
      id: requestId,
      title: trimmedTitle,
      description: trimmedDescription,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString(),
      votesByUserId: {
        [viewer.id]: 'yes'
      }
    },
    ...(workflow.editRequests ?? [])
  ];

  maybeApplyApprovedEventEdit(slug, requestId);
}

export function setMockEventEditVote(
  slug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);

  if (!viewer || !event || !canViewerVoteOnEventEdit(slug)) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const request = workflow.editRequests?.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedEventEdit(slug, requestId);
}

export function grantMockEventEditAccess(slug: string, userId: string) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const creatorId = event ? userByUsername(event.createdByUsername)?.id ?? null : null;

  if (!viewer || !event || !event.isPrivate || !creatorId || viewer.id !== creatorId || userId === creatorId) {
    return;
  }

  const memberState = buildEventMemberState(event);

  if (!memberState.members.some((member) => member.id === userId)) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, creatorId);
  workflow.editorUserIds = Array.from(new Set([...workflow.editorUserIds, userId]));
}

export function revokeMockEventEditAccess(slug: string, userId: string) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const creatorId = event ? userByUsername(event.createdByUsername)?.id ?? null : null;

  if (!viewer || !event || !event.isPrivate || !creatorId || viewer.id !== creatorId || userId === creatorId) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, creatorId);

  if (!workflow.editorUserIds.includes(userId)) {
    return;
  }

  workflow.editorUserIds = workflow.editorUserIds.filter((editorId) => editorId !== userId);
  removeUserFromEventRequestVotes(slug, userId);
}

export function shareMockProjectWithUser(slug: string, username: string): ShareTargetResult {
  const viewer = currentViewer();
  const targetUser = userByUsername(username);
  const project = findPublicProjectItem(slug);

  if (!viewer) {
    return errorShareTargetResult('Sign in to share projects.');
  }

  if (!project) {
    return errorShareTargetResult('That project could not be found.');
  }

  if (!targetUser || targetUser.id === viewer.id) {
    return errorShareTargetResult('Choose another user.');
  }

  pushUserNotification(targetUser.id, {
    id: `notification-project-share-${slug}-${targetUser.id}-${Date.now()}`,
    kind: 'project',
    surface: 'public',
    subjectKind: 'project',
    projectMode: project.projectMode,
    actorUsername: viewer.username,
    actionLabel: 'Shared',
    title: project.title,
    body: `${viewer.username} shared this project with you.`,
    href: project.href,
    createdAt: new Date().toISOString(),
    isUnread: true,
    channelTags: project.channelTags,
    communityTags: project.communityTags
  });

  return okShareTargetResult();
}

export function shareMockEventWithUser(slug: string, username: string): ShareTargetResult {
  const viewer = currentViewer();
  const targetUser = userByUsername(username);
  const event = findPublicEventItem(slug);

  if (!viewer) {
    return errorShareTargetResult('Sign in to invite or share events.');
  }

  if (!event) {
    return errorShareTargetResult('That event could not be found.');
  }

  if (!targetUser || targetUser.id === viewer.id) {
    return errorShareTargetResult('Choose another user.');
  }

  const participation =
    eventParticipationById[event.id] ??
    (eventParticipationById[event.id] = { goingUserIds: [], invitedUserIds: [] });

  if (
    !participation.goingUserIds.includes(targetUser.id) &&
    !participation.invitedUserIds.includes(targetUser.id)
  ) {
    participation.invitedUserIds = [targetUser.id, ...participation.invitedUserIds];
    eventInvitedSinceById[event.id] = {
      ...(eventInvitedSinceById[event.id] ?? {}),
      [targetUser.id]: new Date().toISOString()
    };
  }

  pushUserNotification(targetUser.id, {
    id: `notification-event-share-${slug}-${targetUser.id}-${Date.now()}`,
    kind: 'event',
    surface: 'public',
    subjectKind: 'event',
    actorUsername: viewer.username,
    actionLabel: event.isPrivate ? 'Invited' : 'Shared',
    title: event.title,
    body: event.isPrivate
      ? `${viewer.username} invited you to this event.`
      : `${viewer.username} shared this event with you.`,
    href: event.href,
    createdAt: new Date().toISOString(),
    isUnread: true,
    channelTags: event.channelTags,
    communityTags: event.communityTags
  });

  return okShareTargetResult();
}

function okConversationResult(conversationId?: string): MessageConversationResult {
  return conversationId ? { ok: true, conversationId } : { ok: true };
}

function errorConversationResult(error: string): MessageConversationResult {
  return { ok: false, error };
}

function normalizeConversationTitle(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function buildConversationId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function buildConversationMessageId(conversationId: string) {
  return `${conversationId}-${Date.now()}`;
}

function findCurrentConversation(conversationId: string) {
  return currentMessageConversationsState().find((item) => item.id === conversationId);
}

function normalizeConversationUsernames(usernames: string[]) {
  return Array.from(new Set(usernames.map((value) => normalizeUsernameInput(value)).filter(Boolean)));
}

export function markMockNotificationRead(notificationId: string) {
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

export function markMockConversationRead(conversationId: string) {
  const conversation = findCurrentConversation(conversationId);

  if (conversation) {
    conversation.unreadCount = 0;
  }
}

export function sendMockMessage(conversationId: string, body: string) {
  const viewer = currentViewer();
  const conversation = findCurrentConversation(conversationId);
  const trimmed = body.trim();

  if (!viewer || !conversation || !trimmed) {
    return;
  }

  const createdAt = new Date().toISOString();
  conversation.messages.push({
    id: buildConversationMessageId(conversationId),
    sender: viewer,
    body: trimmed,
    createdAt,
    isOwn: true
  });
  conversation.preview = summarizeChatPreview(
    trimmed,
    conversation.kind === 'group' ? viewer.username : undefined
  );
  conversation.lastMessageAt = createdAt;
  conversation.unreadCount = 0;
  moveMessageConversationToFront(conversation.id);
}

export function startMockDirectMessage(participantUsername: string, body: string): MessageConversationResult {
  const viewer = currentViewer();
  const participant = userByUsername(participantUsername);
  const trimmed = body.trim();
  const conversations = currentMessageConversationsState();

  if (!viewer) {
    return errorConversationResult('Sign in to send messages.');
  }

  if (!participant || participant.id === viewer.id) {
    return errorConversationResult('Choose another person to message.');
  }

  if (!trimmed) {
    return errorConversationResult('Write a message before sending it.');
  }

  let conversation = conversations.find(
    (item) => item.kind === 'direct' && item.participants.some((member) => member.id === participant.id)
  );

  if (!conversation) {
    conversation = {
      id: `dm-${participant.username}`,
      kind: 'direct',
      title: participant.username,
      participants: [viewer, participant],
      preview: '',
      lastMessageAt: '',
      unreadCount: 0,
      messages: []
    };
    conversations.unshift(conversation);
  }

  const createdAt = new Date().toISOString();
  conversation.messages.push({
    id: buildConversationMessageId(conversation.id),
    sender: viewer,
    body: trimmed,
    createdAt,
    isOwn: true
  });
  conversation.preview = summarizeChatPreview(trimmed);
  conversation.lastMessageAt = createdAt;
  conversation.unreadCount = 0;
  moveMessageConversationToFront(conversation.id);
  return okConversationResult(conversation.id);
}

export function createMockGroupConversation(
  input: CreateGroupMessageInput
): MessageConversationResult {
  const viewer = currentViewer();
  const title = normalizeConversationTitle(input.title);
  const body = input.body.trim();

  if (!viewer) {
    return errorConversationResult('Sign in to start a group chat.');
  }

  if (!title) {
    return errorConversationResult('Name the group chat before creating it.');
  }

  if (!body) {
    return errorConversationResult('Write the first message for the group chat.');
  }

  const memberUsernames = normalizeConversationUsernames(input.memberUsernames);
  const members = memberUsernames
    .map((username) => userByUsername(username))
    .filter((member): member is ViewerSummary => !!member && member.id !== viewer.id);

  if (members.length < 2) {
    return errorConversationResult('Choose at least two other people for a group chat.');
  }

  const createdAt = new Date().toISOString();
  const conversationId = buildConversationId('group');
  const conversation: MessageConversation = {
    id: conversationId,
    kind: 'group',
    title,
    participants: [viewer, ...members],
    preview: summarizeChatPreview(body, viewer.username),
    lastMessageAt: createdAt,
    unreadCount: 0,
    messages: [
      {
        id: buildConversationMessageId(conversationId),
        sender: viewer,
        body,
        createdAt,
        isOwn: true
      }
    ]
  };

  currentMessageConversationsState().unshift(conversation);
  return okConversationResult(conversation.id);
}

export function renameMockGroupConversation(
  conversationId: string,
  title: string
): MessageConversationResult {
  const conversation = findCurrentConversation(conversationId);
  const nextTitle = normalizeConversationTitle(title);

  if (!conversation || conversation.kind !== 'group') {
    return errorConversationResult('That group chat no longer exists.');
  }

  if (!nextTitle) {
    return errorConversationResult('Group chats need a name.');
  }

  conversation.title = nextTitle;
  return okConversationResult(conversation.id);
}

export function addMockGroupConversationMember(
  conversationId: string,
  username: string
): MessageConversationResult {
  const viewer = currentViewer();
  const conversation = findCurrentConversation(conversationId);
  const member = userByUsername(username);

  if (!viewer || !conversation || conversation.kind !== 'group') {
    return errorConversationResult('That group chat no longer exists.');
  }

  if (!member || member.id === viewer.id) {
    return errorConversationResult('Choose someone else to add.');
  }

  if (conversation.participants.some((participant) => participant.id === member.id)) {
    return errorConversationResult('That person is already in the group chat.');
  }

  conversation.participants = [...conversation.participants, member];
  return okConversationResult(conversation.id);
}

export function removeMockGroupConversationMember(
  conversationId: string,
  username: string
): MessageConversationResult {
  const viewer = currentViewer();
  const conversation = findCurrentConversation(conversationId);
  const member = userByUsername(username);

  if (!viewer || !conversation || conversation.kind !== 'group') {
    return errorConversationResult('That group chat no longer exists.');
  }

  if (!member || member.id === viewer.id) {
    return errorConversationResult('Leave the current viewer in the group chat.');
  }

  if (!conversation.participants.some((participant) => participant.id === member.id)) {
    return errorConversationResult('That person is not in the group chat.');
  }

  if (conversation.participants.length <= 3) {
    return errorConversationResult('Keep at least three people in a group chat.');
  }

  conversation.participants = conversation.participants.filter((participant) => participant.id !== member.id);
  return okConversationResult(conversation.id);
}

function canAdvanceMockProjectPhaseNow(slug: string, projectMode: ProjectMode) {
  const config = projectLifecycleBySlug[slug];

  if (!config) {
    return false;
  }

  if (projectMode === 'personal-service') {
    return !!nextProjectPhaseId(config.currentPhaseId, projectMode);
  }

  const memberCount = (projectMembersBySlug[slug] ?? []).length;
  const values = buildProjectValues(slug);

  switch (config.currentPhaseId) {
    case 'phase-1':
      return values.length > 0;
    case 'phase-2':
      return !!buildProductionPlans(
        slug,
        values,
        calculateProjectQuorumThreshold(memberCount),
        memberCount
      ).winningPlanId;
    case 'phase-3':
      return !!buildDistributionPlans(
        slug,
        values,
        calculateProjectQuorumThreshold(memberCount),
        memberCount
      ).winningPlanId;
    default:
      return !!nextProjectPhaseId(config.currentPhaseId, projectMode);
  }
}

function applyApprovedProjectPhaseChange(
  slug: string,
  targetPhaseId: ProjectLifecyclePhaseId,
  reason: string,
  authorUsername: string
) {
  const config = projectLifecycleBySlug[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedReason = reason.trim();

  if (!config || !trimmedReason) {
    return;
  }

  const currentPhaseId = config.currentPhaseId;
  config.currentPhaseId = targetPhaseId;

  if (
    ['phase-1', 'phase-2', 'phase-3'].includes(targetPhaseId) &&
    phaseOrderForProjectMode(projectMode, targetPhaseId) < phaseOrderForProjectMode(projectMode, currentPhaseId)
  ) {
    const workflow = ensureProjectWorkflowState(slug);
    workflow.revertHistory = [
      {
        id: `project-revert-${slug}-${Date.now()}`,
        targetPhaseId: targetPhaseId as Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>,
        reason: trimmedReason,
        authorUsername,
        createdAt: new Date().toISOString()
      },
      ...(workflow.revertHistory ?? [])
    ];

    if (projectDetailExtras[slug]) {
      projectDetailExtras[slug].updates = [
        {
          id: `project-update-return-${slug}-${Date.now()}`,
          title: 'Return note',
          body: trimmedReason,
          authorUsername,
          createdAt: new Date().toISOString()
        },
        ...projectDetailExtras[slug].updates
      ];
    }
  }

  if (targetPhaseId === closePhaseIdForProject(projectMode) && projectDetailExtras[slug]) {
    projectDetailExtras[slug].updates = [
      {
        id: `project-update-close-${slug}-${Date.now()}`,
        title: 'Closure note',
        body: trimmedReason,
        authorUsername,
        createdAt: new Date().toISOString()
      },
      ...projectDetailExtras[slug].updates
    ];
  }
}

function maybeApplyApprovedProjectPhaseChange(slug: string, requestId: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.phaseChangeRequests?.find((item) => item.id === requestId);
  const config = projectLifecycleBySlug[slug];
  const projectMode = projectModeForSlug(slug);

  if (!request || !config) {
    return;
  }

  const memberState = buildProjectMemberState(slug);
  const memberCount = memberState.projectManagers.length + memberState.members.length;
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    workflow.phaseChangeRequests = (workflow.phaseChangeRequests ?? []).filter(
      (item) => item.id !== requestId
    );
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  const requestableTargets = requestableProjectPhaseTargetIds(config.currentPhaseId, projectMode);
  const nextPhaseId = nextProjectPhaseId(config.currentPhaseId, projectMode);

  if (!requestableTargets.includes(request.targetPhaseId)) {
    return;
  }

  if (request.targetPhaseId === nextPhaseId && !canAdvanceMockProjectPhaseNow(slug, projectMode)) {
    return;
  }

  applyApprovedProjectPhaseChange(slug, request.targetPhaseId, request.reason, request.authorUsername);
  workflow.phaseChangeRequests = (workflow.phaseChangeRequests ?? []).filter(
    (item) => item.id !== requestId
  );
}

export function requestMockProjectPhaseChange(
  slug: string,
  targetPhaseId: ProjectLifecyclePhaseId,
  reason: string
) {
  const viewer = currentViewer();
  const config = projectLifecycleBySlug[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedReason = reason.trim();

  if (!viewer || !config || !trimmedReason || !canViewerRequestProjectPhaseChange(slug)) {
    return;
  }

  const requestableTargets = requestableProjectPhaseTargetIds(config.currentPhaseId, projectMode);
  const nextPhaseId = nextProjectPhaseId(config.currentPhaseId, projectMode);

  if (!requestableTargets.includes(targetPhaseId)) {
    return;
  }

  if (targetPhaseId === nextPhaseId && !canAdvanceMockProjectPhaseNow(slug, projectMode)) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);

  if ((workflow.phaseChangeRequests ?? []).some((request) => request.targetPhaseId === targetPhaseId)) {
    return;
  }

  const createdAt = new Date().toISOString();
  const requestId = `project-phase-change-${slug}-${Date.now()}`;
  workflow.phaseChangeRequests = [
    {
      id: requestId,
      targetPhaseId,
      reason: trimmedReason,
      authorUsername: viewer.username,
      createdAt,
      votesByUserId: {
        [viewer.id]: 'yes'
      }
    },
    ...(workflow.phaseChangeRequests ?? [])
  ];

  maybeApplyApprovedProjectPhaseChange(slug, requestId);
}

export function requestMockProjectUpdate(slug: string, title: string, body: string) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedBody = body.trim();
  const nextTitle = resolvedUpdateTitle(title, body);

  if (
    !viewer ||
    !extras ||
    projectMode === 'personal-service' ||
    !trimmedBody ||
    !canViewerRequestProjectUpdate(slug)
  ) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);
  const requestId = `project-update-request-${slug}-${Date.now()}`;
  workflow.updateRequests = [
    {
      id: requestId,
      title: nextTitle,
      body: trimmedBody,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString(),
      votesByUserId: {
        [viewer.id]: 'yes'
      }
    },
    ...(workflow.updateRequests ?? [])
  ];

  maybeApplyApprovedProjectUpdate(slug, requestId);
}

export function requestMockProjectEdit(
  slug: string,
  title: string,
  summary: string,
  overview: string
) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedTitle = title.trim();
  const trimmedSummary = summary.trim();
  const trimmedOverview = overview.trim();

  if (
    !viewer ||
    !extras ||
    projectMode === 'personal-service' ||
    !trimmedTitle ||
    !trimmedSummary ||
    !trimmedOverview ||
    !canViewerRequestProjectEdit(slug)
  ) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);
  const requestId = `project-edit-request-${slug}-${Date.now()}`;
  workflow.editRequests = [
    {
      id: requestId,
      title: trimmedTitle,
      summary: trimmedSummary,
      overview: trimmedOverview,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString(),
      votesByUserId: {
        [viewer.id]: 'yes'
      }
    },
    ...(workflow.editRequests ?? [])
  ];

  maybeApplyApprovedProjectEdit(slug, requestId);
}

export function setMockProjectPhaseChangeVote(
  slug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.phaseChangeRequests?.find((item) => item.id === requestId);

  if (!viewer || !request || !canViewerVoteOnProjectPhaseChange(slug)) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedProjectPhaseChange(slug, requestId);
}

export function setMockProjectUpdateVote(
  slug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.updateRequests?.find((item) => item.id === requestId);

  if (!viewer || !request || !canViewerVoteOnProjectUpdate(slug)) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedProjectUpdate(slug, requestId);
}

export function setMockProjectEditVote(
  slug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.editRequests?.find((item) => item.id === requestId);

  if (!viewer || !request || !canViewerVoteOnProjectEdit(slug)) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedProjectEdit(slug, requestId);
}