import { browser } from '$app/environment';
import {
  isPersonalServiceProject,
  projectSubjectLabel,
  projectSubtypeLabel,
  projectSubtypeOptions,
  projectFeedPhaseLabel,
  supportsProjectDemandSignals,
  supportsProjectPlanning
} from '$lib/features/projects/projectMode';
import {
  calculateRequiredVotes,
  calculateGovernanceQuorum,
  GOVERNANCE_APPROVAL_THRESHOLD_PERCENT
} from '$lib/services/governance/rules';
import type {
  BootstrapPayload,
  RightRailActivityItem,
  ScopeDirectoryItem,
  ViewerSummary
} from '$lib/types/bootstrap';
import type {
  AssetAttachedRecord,
  AssetContainedUnitRecord,
  AssetGovernanceData,
  AssetGovernanceVoteSummary,
  AssetProjectReference,
  LandAssetRecord,
  PlatformAssetsPageData
} from '$lib/types/assets';
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
  DecisionHistoryEntry,
  DecisionHistoryEntryKind,
  DecisionHistoryFieldChange,
  DecisionHistoryStatus,
  DetailComment,
  DetailMember,
  DetailUpdate,
  EventPlan,
  EventPlanInput,
  EventPlanPhaseItem,
  EventPlanSchedule,
  EventPlanScheduleInput,
  EventLifecycleData,
  EventLifecyclePhase,
  EventLifecyclePhaseChangeRequest,
  EventLifecyclePhaseId,
  EventPageData,
  GovernanceSignalSummary,
  GovernanceSignalType,
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
  ProjectPhaseChangeRequestOptions,
  ProjectConversionTarget,
  ProjectConversionTargetInput,
  ProjectLifecycleRevertEntry,
  EventEditRequest,
  EventUpdateRequest,
  ProjectAcquisitionBundle,
  ProjectAcquisitionConfirmationFrame,
  ProjectAcquisitionExecutionFrame,
  ProjectAcquisitionExecutionInput,
  ProjectAcquisitionPendingAsset,
  ProjectAcquisitionPlanBundle,
  ProjectAcquisitionPlanBundleInput,
  ProjectEditRequest,
  ProjectAcquisitionPreviewFund,
  ProjectAcquisitionPreviewItem,
  ProjectAcquisitionPurchaseRow,
  ProjectAcquisitionPurchaseRowInput,
  ProjectAcquisitionServiceDestinationType,
  ProjectInventoryFrameData,
  ProjectLinkCandidate,
  ProjectManualLinkRequest,
  ProjectManualLinkVoteState,
  ProjectUpdateRequest,
  ProjectLinksFrameData,
  ProjectPlanPhaseItem,
  ProjectPlanValueAssessment,
  ProjectPlanVoteSummary,
  ProjectPageData,
  ProjectPhaseFourData,
  ProjectPlaceholderSection,
  ProjectRequestFrame,
  ProjectProductionPlan,
  ProjectProductionPlanInput,
  ProjectRoleMember,
  ProjectSoftwareBlockedPullRequest,
  ProjectSoftwareMergeCapabilityChangeRequest,
  ProjectSoftwareMergeCapabilityMember,
  ProjectSoftwareRepositoryRecord,
  ProjectSoftwareRepositoryReplacementRequest,
  ProjectSoftwareGovernanceData,
  ProjectSoftwarePullRequest,
  ProjectSoftwarePullRequestInput,
  ProjectSoftwareMergeCapabilityChangeInput,
  ProjectSoftwareRepositoryReplacementInput,
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
  ProjectSubtype,
  PersonalFeedItem,
  PersonalPostItem,
  PublicEventItem,
  PublicFeedItem,
  PublicProjectItem,
  PublicThreadItem,
  TagRef,
  VoteDirection
} from '$lib/types/feed';
import {
  eventActivityFitsSchedule,
  eventScheduleIsValid,
  eventScheduleStartsInFuture
} from '$lib/utils/eventSchedule';
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

const WEEKLY_ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const BOARD_GRACE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const BOARD_STANDING_VOTE_CLEAR_WINDOW_MS = 100 * 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString();
}

const lastMeaningfulActionAtByUserId: Record<string, string> = {
  'viewer-1': isoDaysAgo(1),
  'user-rowan': isoDaysAgo(2),
  'user-tool': isoDaysAgo(4),
  'user-mika': isoDaysAgo(5),
  'user-ember': isoDaysAgo(11)
};

const boardStandingGraceStartedAtByTargetId: Record<string, string> = {};
const syntheticConfidenceVoteLastActiveAtByUserId: Record<string, string> = {};
const platformBoardState: {
  seatedUserIds: string[];
  confidenceTargetIdsByUserId: Record<string, string>;
} = {
  seatedUserIds: ['user-mika', 'user-ember'],
  confidenceTargetIdsByUserId: {}
};
const activePlatformBoardUserIds = new Set<string>(platformBoardState.seatedUserIds);

const seededProjectSubtypeBySlug: Record<string, ProjectSubtype> = {
  'release-governance': 'software',
  'tool-library-land-stewardship': 'asset-management',
  'tool-library-storage': 'asset-management',
  'east-market-land-stewardship': 'asset-management',
  'east-market-cold-storage': 'asset-management',
  'retrofit-materials-shed-service': 'asset-management'
};

const seededSoftwareRepositoryUrlByProjectSlug: Record<string, string> = {
  'platform-release-governance-round': 'https://code.social-production.example/platform/release-governance'
};

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

function buildContainedAssetUnits(
  assetTitle: string,
  seeds: Array<
    Pick<AssetContainedUnitRecord, 'statusLabel' | 'locationLabel' | 'summary'> & {
      currentBorrowerLabel?: string | null;
    }
  >
): AssetContainedUnitRecord[] {
  return seeds.map((seed, index) => ({
    id: `${assetTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-unit-${index + 1}`,
    label: `${assetTitle} ${index + 1}`,
    statusLabel: seed.statusLabel,
    locationLabel: seed.locationLabel,
    summary: seed.summary,
    currentBorrowerLabel: seed.currentBorrowerLabel ?? null
  }));
}

const platformAssetsFixture: PlatformAssetsPageData = {
  featureOpen: false,
  intro:
    'Assets stays under the platform because land, storage, and collective funds need public stewardship before they become live means of production in common.',
  featureFrames: [
    {
      id: 'asset-provenance',
      title: 'Asset provenance',
      body:
        'Every asset page is framed to carry a permanent custody and status history once live asset operations open.',
      statusLabel: 'Frame only'
    },
    {
      id: 'borrowing-and-requests',
      title: 'Borrowing and request flows',
      body:
        'Borrowing requests, project-use requests, and delivery coordination will live as separate modules attached to asset and project detail surfaces.',
      statusLabel: 'Frame only'
    },
    {
      id: 'non-land-assets',
      title: 'Non-land asset records',
      body:
        'Land records are live as placeholders now, while non-land asset pages are framed to slot into the same detail architecture later without route churn.',
      statusLabel: 'Frame only'
    }
  ],
  landAssets: [
    {
      id: 'land-tool-library-campus',
      slug: 'tool-library-campus',
      title: 'Tool Library Campus Lot',
      locationLabel: 'North side tool library block',
      sizeLabel: '0.0028 km2',
      statusLabel: 'Closed preview',
      stewardshipNote:
        'This land record groups the workshop building, open repair yard, and adjacent storage area under one stewardship record so collective services can attach cleanly.',
      currentCustodianLabel: 'Platform stewardship preview',
      homeLandAssetLabel: 'Tool Library Campus Lot',
      historySummary:
        'Full provenance, borrowing, damage, and custody history will be recorded here once the live asset registry opens.',
      governance: buildAssetGovernanceData('land-tool-library-campus'),
      attachedAssets: [
        {
          id: 'asset-tool-library-workbench-set',
          slug: 'workshop-bench-set',
          title: 'Workshop bench set',
          typeLabel: 'Non-land asset preview',
          statusLabel: 'Fake preview asset',
          custodyLabel: 'Held under Tool Library Campus Lot',
          summary:
            'A seeded preview of a shared workshop-bench asset record that would return to this land asset when not checked out to active work.',
          locationLabel: 'Tool Library workshop floor',
          currentCustodianLabel: 'Tool Library Land Stewardship Service',
          homeLandAssetLabel: 'Tool Library Campus Lot',
          parentLandAssetSlug: 'tool-library-campus',
          parentLandAssetTitle: 'Tool Library Campus Lot',
          stewardshipNote:
            'This seeded non-land asset represents shared fixed work surfaces that return to the workshop floor between repair and teaching sessions.',
          historySummary:
            'A full attachment, borrowing, damage, and maintenance history will appear here once the non-land registry opens.',
          governance: buildAssetGovernanceData('asset-tool-library-workbench-set'),
          requestFrames: [
            {
              id: 'asset-use',
              title: 'Workshop-use request preview',
              body:
                'Fake preview only: repair and teaching projects would request this bench set here before scheduling hands-on sessions.',
              statusLabel: 'Fake preview'
            },
            {
              id: 'delivery',
              title: 'Bench transfer preview',
              body:
                'Fake preview only: any temporary move of these benches to another site would record a delivery handoff here.',
              statusLabel: 'Fake preview'
            }
          ],
          detailSections: [
            {
              id: 'maintenance-history',
              title: 'Maintenance history',
              body:
                'This section is reserved for bench repairs, surface resurfacing, and any safety checks tied to the shared workshop set.',
              statusLabel: 'Fake preview'
            },
            {
              id: 'use-log',
              title: 'Use log',
              body:
                'Confirmed project-use sessions, teaching blocks, and return timestamps will be listed here once the registry opens.',
              statusLabel: 'Fake preview'
            }
          ],
          managementProjects: [
            {
              id: 'asset-project-tool-library-land-stewardship-bench',
              title: 'Tool Library Land Stewardship Service',
              projectMode: 'collective-service',
              relationshipLabel: 'Primary stewardship service',
              statusLabel: 'Preview seed',
              summary:
                'The land stewardship service remains responsible for physical upkeep and placement of the workshop bench set.',
              href: null
            }
          ],
          storageProjects: [
            {
              id: 'asset-project-tool-library-storage-bench',
              title: 'Tool Library Storage Facility Service',
              projectMode: 'collective-service',
              relationshipLabel: 'Overflow storage when not installed',
              statusLabel: 'Preview seed',
              summary:
                'Overflow bench parts and replacement surfaces are held by the storage service when they are not on the floor.',
              href: null
            }
          ],
          linkedProjects: [
            {
              id: 'project-repair-cafe-bench-use',
              title: 'Repair Cafe Shift Grid',
              projectMode: 'collective-service',
              relationshipLabel: 'Current user of this shared work surface',
              statusLabel: 'Existing project',
              summary:
                'Repair-cafe shifts depend on this bench set for intake triage and hands-on repair work.',
              href: '/projects/repair-cafe-shift-grid'
            }
          ],
          href: '/platform/assets/tool-library-campus/attached/workshop-bench-set'
        },
        {
          id: 'asset-tool-library-intake-carts',
          slug: 'repair-intake-cart',
          title: 'Repair intake cart',
          typeLabel: 'Asset',
          quantityLabel: 'x 5',
          totalQuantity: 5,
          availableQuantity: 3,
          containedUnits: buildContainedAssetUnits('Repair intake cart', [
            {
              statusLabel: 'Available',
              locationLabel: 'Tool Library front room',
              summary: 'Ready for intake or handoff use today.'
            },
            {
              statusLabel: 'Available',
              locationLabel: 'Tool Library front room',
              summary: 'Ready for intake or handoff use today.'
            },
            {
              statusLabel: 'Available',
              locationLabel: 'Tool Library intake lane',
              summary: 'Held near the intake lane for heavy-dropoff days.'
            },
            {
              statusLabel: 'Borrowed',
              locationLabel: 'Neighborhood cleanup route',
              summary: 'Currently out on a cleanup run and expected back next week.',
              currentBorrowerLabel: 'patchbay'
            },
            {
              statusLabel: 'Reserved',
              locationLabel: 'Tool Library front room',
              summary: 'Held back for overlapping childcare check-in coverage.'
            }
          ]),
          statusLabel: 'Fake preview asset',
          custodyLabel: 'Assigned to Tool Library Storage Facility Service',
          summary:
            'A seeded preview of rolling intake carts that could be borrowed between the repair floor and the front-room check-in service.',
          locationLabel: 'Tool Library front room and intake lane',
          currentCustodianLabel: 'Tool Library Storage Facility Service',
          homeLandAssetLabel: 'Tool Library Campus Lot',
          parentLandAssetSlug: 'tool-library-campus',
          parentLandAssetTitle: 'Tool Library Campus Lot',
          stewardshipNote:
            'These rolling carts move between front-room intake and workshop staging while still tracing back to the tool-library land record.',
          historySummary:
            'A full movement, damage, and return history will appear here once attached asset tracking is live.',
          governance: buildAssetGovernanceData('asset-tool-library-intake-carts'),
          requestFrames: [
            {
              id: 'borrowing',
              title: 'Cart borrowing preview',
              body:
                'Fake preview only: members would request temporary cart use here when moving heavy repair intake between rooms.',
              statusLabel: 'Fake preview'
            },
            {
              id: 'delivery',
              title: 'Intake handoff preview',
              body:
                'Fake preview only: delivery-style handoffs between the front room and workshop floor would be recorded here.',
              statusLabel: 'Fake preview'
            }
          ],
          detailSections: [
            {
              id: 'movement-log',
              title: 'Movement log',
              body:
                'This section will record where each cart moved, who moved it, and when it returned to intake or storage.',
              statusLabel: 'Fake preview'
            },
            {
              id: 'repair-log',
              title: 'Repair log',
              body:
                'Wheel replacements, handle repairs, and condition checks will appear here once the non-land asset registry opens.',
              statusLabel: 'Fake preview'
            }
          ],
          managementProjects: [],
          storageProjects: [
            {
              id: 'asset-project-tool-library-storage-carts',
              title: 'Tool Library Storage Facility Service',
              projectMode: 'collective-service',
              relationshipLabel: 'Primary storage service',
              statusLabel: 'Preview seed',
              summary:
                'The storage service keeps custody of the intake carts when they are not in circulation.',
              href: null
            }
          ],
          linkedProjects: [
            {
              id: 'project-childcare-checkin-carts',
              title: 'Childcare Check-in Desk Service',
              projectMode: 'collective-service',
              relationshipLabel: 'Occasional shared front-room use',
              statusLabel: 'Existing project',
              summary:
                'The front-room service can temporarily borrow carts when intake materials need to move quickly during overlapping events.',
              href: '/projects/childcare-checkin-desk-service'
            }
          ],
          href: '/platform/assets/tool-library-campus/attached/repair-intake-cart'
        }
      ],
      requestFrames: [
        {
          id: 'borrowing',
          title: 'Borrowing preview for this site',
          body:
            'Fake preview only: individual borrowers would request attached non-land assets here, with expected return dates and steward follow-up visible on the record.',
          statusLabel: 'Fake preview'
        },
        {
          id: 'asset-use',
          title: 'Project-use asset request preview',
          body:
            'Fake preview only: projects needing workshop space or attached equipment would send availability requests here before their plans became voteable.',
          statusLabel: 'Fake preview'
        },
        {
          id: 'delivery',
          title: 'Delivery handoff preview',
          body:
            'Fake preview only: delivery services would record pickup and return handoffs here when assets moved between sites.',
          statusLabel: 'Fake preview'
        }
      ],
      detailSections: [
        {
          id: 'provenance-history',
          title: 'Provenance history',
          body:
            'This section is reserved for the permanent chronological record of transfers, borrowing, damage, and stewardship changes tied to this land asset.',
          statusLabel: 'Frame only'
        },
        {
          id: 'attached-assets',
          title: 'Attached non-land assets',
          body:
            'Non-land assets that live on or return to this site will appear here as individual records with their own detail pages.',
          statusLabel: 'Frame only'
        },
        {
          id: 'requests',
          title: 'Requests and borrowing',
          body:
            'Borrowing requests, project-use requests, and delivery handoffs will be grouped here once those coordination and governance flows are active.',
          statusLabel: 'Frame only'
        }
      ],
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
      sizeLabel: '0.0053 km2',
      statusLabel: 'Closed preview',
      stewardshipNote:
        'This lot ties together retrofit staging space, a future shared cold-storage pad, and pickup lanes that multiple neighborhood services already depend on.',
      currentCustodianLabel: 'Platform stewardship preview',
      homeLandAssetLabel: 'East Market Commons Lot',
      historySummary:
        'Full provenance, borrowing, damage, and custody history will be recorded here once the live asset registry opens.',
      governance: buildAssetGovernanceData('land-east-market-commons'),
      attachedAssets: [
        {
          id: 'asset-east-market-cold-racks',
          slug: 'cold-storage-rack-set',
          title: 'Cold-storage rack set',
          typeLabel: 'Non-land asset preview',
          statusLabel: 'Fake preview asset',
          custodyLabel: 'Assigned to East Market Cold Storage Service',
          summary:
            'A seeded preview of insulated storage racks that would stay attached to this site when not checked out for project use.',
          locationLabel: 'East Market cold pad',
          currentCustodianLabel: 'East Market Cold Storage Service',
          homeLandAssetLabel: 'East Market Commons Lot',
          parentLandAssetSlug: 'east-market-commons',
          parentLandAssetTitle: 'East Market Commons Lot',
          stewardshipNote:
            'These racks stay under commons custody but can be reserved by storage and distribution work that depends on temporary cold holding.',
          historySummary:
            'A full availability, condition, and transfer history will appear here once attached asset pages are live.',
          governance: buildAssetGovernanceData('asset-east-market-cold-racks'),
          requestFrames: [
            {
              id: 'asset-use',
              title: 'Cold-storage use preview',
              body:
                'Fake preview only: projects needing temporary cold holding would request rack access here before scheduling pickups.',
              statusLabel: 'Fake preview'
            },
            {
              id: 'delivery',
              title: 'Cold-chain handoff preview',
              body:
                'Fake preview only: pickup and return handoffs for cold-storage runs would be tracked here.',
              statusLabel: 'Fake preview'
            }
          ],
          detailSections: [
            {
              id: 'temperature-log',
              title: 'Temperature and condition log',
              body:
                'This section will record maintenance checks, temperature incidents, and cleaning rounds for the shared rack set.',
              statusLabel: 'Fake preview'
            },
            {
              id: 'reservation-history',
              title: 'Reservation history',
              body:
                'Approved cold-storage reservations and project-use windows will appear here once the registry opens.',
              statusLabel: 'Fake preview'
            }
          ],
          managementProjects: [],
          storageProjects: [
            {
              id: 'asset-project-east-market-cold-racks-storage',
              title: 'East Market Cold Storage Service',
              projectMode: 'collective-service',
              relationshipLabel: 'Primary storage service',
              statusLabel: 'Preview seed',
              summary:
                'The cold-storage service keeps custody of the rack set and manages availability windows for shared use.',
              href: null
            }
          ],
          linkedProjects: [
            {
              id: 'project-ride-coordination-cold-racks',
              title: 'Neighborhood Ride Coordination Service',
              projectMode: 'collective-service',
              relationshipLabel: 'Supports cooled pickup windows',
              statusLabel: 'Existing project',
              summary:
                'Dispatch work at East Market can route time-sensitive pickups through this rack set before riders depart.',
              href: '/projects/neighborhood-ride-coordination-service'
            }
          ],
          href: '/platform/assets/east-market-commons/attached/cold-storage-rack-set'
        },
        {
          id: 'asset-east-market-retrofit-tables',
          slug: 'retrofit-staging-tables',
          title: 'Retrofit staging table',
          typeLabel: 'Asset',
          quantityLabel: 'x 6',
          totalQuantity: 6,
          availableQuantity: 4,
          containedUnits: buildContainedAssetUnits('Retrofit staging table', [
            {
              statusLabel: 'Available',
              locationLabel: 'East Market staging shed',
              summary: 'Ready for build-day staging.'
            },
            {
              statusLabel: 'Available',
              locationLabel: 'East Market staging shed',
              summary: 'Ready for build-day staging.'
            },
            {
              statusLabel: 'Available',
              locationLabel: 'East Market staging shed',
              summary: 'Ready for build-day staging.'
            },
            {
              statusLabel: 'Available',
              locationLabel: 'East Market retrofit pad',
              summary: 'Already set near the active build lane.'
            },
            {
              statusLabel: 'Reserved',
              locationLabel: 'East Market retrofit pad',
              summary: 'Assigned to the next hallway air-sealing setup window.'
            },
            {
              statusLabel: 'Maintenance',
              locationLabel: 'Retrofit Materials Shed Service',
              summary: 'Waiting on a clamp replacement before it returns to the active set.'
            }
          ]),
          statusLabel: 'Fake preview asset',
          custodyLabel: 'Held under East Market Commons Lot',
          summary:
            'A seeded preview of shared staging tables that could move between retrofit and delivery work while keeping a permanent provenance record.',
          locationLabel: 'East Market staging shed',
          currentCustodianLabel: 'East Market Land Stewardship Service',
          homeLandAssetLabel: 'East Market Commons Lot',
          parentLandAssetSlug: 'east-market-commons',
          parentLandAssetTitle: 'East Market Commons Lot',
          stewardshipNote:
            'These staging tables return to the commons lot between build-day use, deliveries, and storage reshuffles.',
          historySummary:
            'A full movement and maintenance history will appear here once attached asset pages are live.',
          governance: buildAssetGovernanceData('asset-east-market-retrofit-tables'),
          requestFrames: [
            {
              id: 'asset-use',
              title: 'Build-day use preview',
              body:
                'Fake preview only: productive projects would reserve these tables here before staging install kits and safety gear.',
              statusLabel: 'Fake preview'
            },
            {
              id: 'borrowing',
              title: 'Short-term borrowing preview',
              body:
                'Fake preview only: short internal loans between East Market services would be recorded here with expected return timing.',
              statusLabel: 'Fake preview'
            }
          ],
          detailSections: [
            {
              id: 'movement-log',
              title: 'Movement log',
              body:
                'This section will record when the tables move from storage to staging and back again after productive work closes.',
              statusLabel: 'Fake preview'
            },
            {
              id: 'condition-log',
              title: 'Condition log',
              body:
                'Surface wear, repairs, and replacement-part swaps will appear here once the registry opens.',
              statusLabel: 'Fake preview'
            }
          ],
          managementProjects: [
            {
              id: 'asset-project-east-market-land-staging-tables',
              title: 'East Market Land Stewardship Service',
              projectMode: 'collective-service',
              relationshipLabel: 'Primary stewardship service',
              statusLabel: 'Preview seed',
              summary:
                'The land stewardship service manages where the staging tables live when they are not assigned to productive work.',
              href: null
            }
          ],
          storageProjects: [
            {
              id: 'asset-project-east-market-material-shed-tables',
              title: 'Retrofit Materials Shed Service',
              projectMode: 'collective-service',
              relationshipLabel: 'Primary storage service',
              statusLabel: 'Preview seed',
              summary:
                'The materials shed service keeps replacement legs, clamps, and protective coverings for the shared tables.',
              href: null
            }
          ],
          linkedProjects: [
            {
              id: 'project-air-sealing-tables',
              title: 'Hallway Air-Sealing Build Day',
              projectMode: 'productive',
              relationshipLabel: 'Current productive user',
              statusLabel: 'Existing project',
              summary:
                'The current build day uses these staging tables for tools, safety checks, and material sorting.',
              href: '/projects/hallway-air-sealing-build-day'
            }
          ],
          href: '/platform/assets/east-market-commons/attached/retrofit-staging-tables'
        }
      ],
      requestFrames: [
        {
          id: 'borrowing',
          title: 'Borrowing preview for this site',
          body:
            'Fake preview only: individual borrowers would request attached non-land assets here, with expected return dates and steward follow-up visible on the record.',
          statusLabel: 'Fake preview'
        },
        {
          id: 'asset-use',
          title: 'Project-use asset request preview',
          body:
            'Fake preview only: projects needing cold storage, staging space, or site access would send availability requests here before plans advanced.',
          statusLabel: 'Fake preview'
        },
        {
          id: 'delivery',
          title: 'Delivery handoff preview',
          body:
            'Fake preview only: delivery services would record pickup and return handoffs here when assets moved between East Market and other sites.',
          statusLabel: 'Fake preview'
        }
      ],
      detailSections: [
        {
          id: 'provenance-history',
          title: 'Provenance history',
          body:
            'This section is reserved for the permanent chronological record of transfers, borrowing, damage, and stewardship changes tied to this land asset.',
          statusLabel: 'Frame only'
        },
        {
          id: 'attached-assets',
          title: 'Attached non-land assets',
          body:
            'Non-land assets that live on or return to this site will appear here as individual records with their own detail pages.',
          statusLabel: 'Frame only'
        },
        {
          id: 'requests',
          title: 'Requests and borrowing',
          body:
            'Borrowing requests, project-use requests, and delivery handoffs will be grouped here once those coordination and governance flows are active.',
          statusLabel: 'Frame only'
        }
      ],
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

type ExplicitAssetServiceProjectSeed = {
  slug: string;
  title: string;
  authorUsername: string;
  projectSubtype: Extract<ProjectSubtype, 'asset-management'>;
  summary: string;
  locationLabel: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  memberIds: string[];
  createdAt: string;
  lastActivityAt: string;
  updateTitle: string;
  updateBody: string;
  activityScheduledAt: string;
  activityEndsAt: string;
  activityNote: string;
};

const explicitAssetServiceProjectSeeds: ExplicitAssetServiceProjectSeed[] = [
  {
    slug: 'tool-library-land-stewardship',
    title: 'Tool Library Land Stewardship Service',
    authorUsername: 'toolorbit',
    projectSubtype: 'asset-management',
    summary:
      'A live stewardship surface for access windows, upkeep work, and custody rules across the Tool Library Campus Lot.',
    locationLabel: 'Tool Library Campus Lot',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    memberIds: ['viewer-1', 'user-tool', 'user-rowan', 'user-mika'],
    createdAt: '2026-04-26T13:20:00Z',
    lastActivityAt: '2026-05-01T15:10:00Z',
    updateTitle: 'Weekly site walk published',
    updateBody:
      'The next stewardship walk now pairs surface cleanup with a cart-placement review so attached assets stop drifting between intake and repair zones.',
    activityScheduledAt: '2026-05-03T15:00:00Z',
    activityEndsAt: '2026-05-03T17:00:00Z',
    activityNote:
      'Stewards are checking access routes, surface wear, and where shared carts should return after use.'
  },
  {
    slug: 'tool-library-storage',
    title: 'Tool Library Storage Facility Service',
    authorUsername: 'rowanloop',
    projectSubtype: 'asset-management',
    summary:
      'An active storage service for intake shelves, overflow bins, and shared asset custody across the Tool Library campus.',
    locationLabel: 'Tool Library campus outbuilding',
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    memberIds: ['viewer-1', 'user-tool', 'user-rowan', 'user-mika'],
    createdAt: '2026-04-27T12:10:00Z',
    lastActivityAt: '2026-05-01T16:25:00Z',
    updateTitle: 'Overflow shelf labels tightened',
    updateBody:
      'Shelf labels now match the intake cart and bench-part custody notes so members can tell what is requestable versus reserve stock at a glance.',
    activityScheduledAt: '2026-05-04T17:00:00Z',
    activityEndsAt: '2026-05-04T19:00:00Z',
    activityNote:
      'This intake window rechecks tagged shelves, reserve stock, and which requests need linked delivery support.'
  },
  {
    slug: 'east-market-land-stewardship',
    title: 'East Market Land Stewardship Service',
    authorUsername: 'rowanloop',
    projectSubtype: 'asset-management',
    summary:
      'A live stewardship surface for scheduling, upkeep, and on-land asset placement across the East Market Commons Lot.',
    locationLabel: 'East Market Commons Lot',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    memberIds: ['viewer-1', 'user-rowan', 'user-mika', 'user-ember'],
    createdAt: '2026-04-27T09:50:00Z',
    lastActivityAt: '2026-05-01T12:20:00Z',
    updateTitle: 'Staging layout review reopened',
    updateBody:
      'The next stewardship round now includes where retrofit tables should sit between build days so the lot stays readable to both storage and activity crews.',
    activityScheduledAt: '2026-05-03T12:00:00Z',
    activityEndsAt: '2026-05-03T14:00:00Z',
    activityNote:
      'Stewards are checking access lanes, table placement, and cold-pad clearance before the next build cycle.'
  },
  {
    slug: 'east-market-cold-storage',
    title: 'East Market Cold Storage Service',
    authorUsername: 'rowanloop',
    projectSubtype: 'asset-management',
    summary:
      'An active storage service for shared cold-holding gear, reserve stock, and request handoff at the East Market cold pad.',
    locationLabel: 'East Market cold pad',
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    memberIds: ['viewer-1', 'user-rowan', 'user-ember'],
    createdAt: '2026-04-28T10:30:00Z',
    lastActivityAt: '2026-05-01T18:05:00Z',
    updateTitle: 'Pickup reserve shelf kept open',
    updateBody:
      'One reserve shelf now stays open for urgent chilled handoffs so regular requests do not consume the full rack set.',
    activityScheduledAt: '2026-05-04T18:00:00Z',
    activityEndsAt: '2026-05-04T20:00:00Z',
    activityNote:
      'The cold-storage intake window confirms available rack space, reserve stock, and any linked delivery handoff needed for pickups.'
  },
  {
    slug: 'retrofit-materials-shed-service',
    title: 'Retrofit Materials Shed Service',
    authorUsername: 'patchbay',
    projectSubtype: 'asset-management',
    summary:
      'An active storage service for retrofit materials, staging tables, and protective gear held on the East Market lot.',
    locationLabel: 'East Market staging shed',
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    memberIds: ['viewer-1', 'user-rowan', 'user-tool', 'user-mika'],
    createdAt: '2026-04-28T14:15:00Z',
    lastActivityAt: '2026-05-01T17:15:00Z',
    updateTitle: 'Table reserve count posted',
    updateBody:
      'The shed now shows how many retrofit staging tables are immediately requestable versus held back for the next build day.',
    activityScheduledAt: '2026-05-04T16:00:00Z',
    activityEndsAt: '2026-05-04T18:00:00Z',
    activityNote:
      'This handoff window rechecks tables, protective coverings, and which outgoing requests need a delivery service linked in.'
  }
];

const assetServiceProjectHrefByTitle = Object.fromEntries(
  explicitAssetServiceProjectSeeds.map((seed) => [seed.title, `/projects/${seed.slug}`])
);

function explicitAssetServiceApprovalVotes(memberIds: string[]) {
  return Object.fromEntries(memberIds.map((userId) => [userId, 'yes' as const]));
}

function explicitAssetServiceSignalVotes(memberIds: string[]) {
  return Object.fromEntries(memberIds.map((userId) => [userId, 4]));
}

function explicitAssetServiceMemberUsernames(memberIds: string[]) {
  return memberIds
    .map((userId) => userById(userId)?.username)
    .filter((username): username is string => !!username);
}

function explicitAssetServiceValueLabel(seed: ExplicitAssetServiceProjectSeed) {
  return `Keep land access, shared asset custody, pickup timing, and reserve stock legible through ${seed.title}.`;
}

function explicitAssetServiceProjectStatus(seed: ExplicitAssetServiceProjectSeed) {
  return `${seed.title} is already coordinating live custody, handoff, and stewardship work for ${seed.locationLabel}.`;
}

function buildExplicitAssetServiceActivity(seed: ExplicitAssetServiceProjectSeed): RawProjectActivity {
  const memberUsernames = explicitAssetServiceMemberUsernames(seed.memberIds);

  return {
    id: `project-activity-${seed.slug}-1`,
    title: `${seed.title} coordination window`,
    authorUsername: seed.authorUsername,
    scheduledAt: seed.activityScheduledAt,
    endsAt: seed.activityEndsAt,
    locationLabel: seed.locationLabel,
    minimumParticipants: 2,
    linkedPlanPhaseId: `production-plan-${seed.slug}-1-phase-1`,
    roles: [
      {
        label: 'Asset coordination',
        requiredCount: 1,
        assignedUsernames: memberUsernames.slice(0, 1)
      },
      {
        label: 'Inventory handling',
        requiredCount: 1,
        assignedUsernames: memberUsernames.slice(1, 2)
      }
    ],
    note: seed.activityNote
  };
}

const explicitAssetServiceProjectFeedItems: PublicProjectItem[] = explicitAssetServiceProjectSeeds.map((seed) => ({
  kind: 'project',
  id: `project-${seed.slug}`,
  slug: seed.slug,
  href: `/projects/${seed.slug}`,
  createdAt: seed.createdAt,
  title: seed.title,
  authorUsername: seed.authorUsername,
  projectMode: 'collective-service',
  projectSubtype: seed.projectSubtype,
  summary: seed.summary,
  channelTags: seed.channelTags,
  communityTags: seed.communityTags,
  stage: 'Activity',
  locationLabel: seed.locationLabel,
  voteCount: seed.memberIds.length * 7,
  activeVote: 1,
  signalCount: seed.memberIds.length * 12,
  commentCount: 0,
  memberCount: seed.memberIds.length,
  lastActivityAt: seed.lastActivityAt
}));

const explicitAssetServiceProjectMembersBySlug = Object.fromEntries(
  explicitAssetServiceProjectSeeds.map((seed) => [seed.slug, seed.memberIds])
);

const explicitAssetServiceProjectRoleConfigsBySlug = Object.fromEntries(
  explicitAssetServiceProjectSeeds.map((seed) => [
    seed.slug,
    {
      managerIds: [seed.memberIds[1] ?? seed.memberIds[0]],
      candidateIds: [],
      confidenceTargetIdsByUserId: {}
    }
  ])
);

const explicitAssetServiceProjectLifecycleBySlug = Object.fromEntries(
  explicitAssetServiceProjectSeeds.map((seed) => [
    seed.slug,
    {
      currentPhaseId: 'phase-5',
      phases: {
        'phase-5': {
          projectStatus: explicitAssetServiceProjectStatus(seed)
        },
        'phase-6': {
          projectStatus:
            'This service stays open while the linked land or attached assets still need active stewardship and request handling.'
        }
      }
    }
  ])
);

const explicitAssetServiceProjectWorkflowBySlug = Object.fromEntries(
  explicitAssetServiceProjectSeeds.map((seed) => {
    const valueId = `value-${seed.slug}-1`;
    const approvalVotes = explicitAssetServiceApprovalVotes(seed.memberIds);

    return [
      seed.slug,
      {
        signalCount: seed.memberIds.length * 12,
        signalUserIds: seed.memberIds,
        values: [
          {
            id: valueId,
            label: explicitAssetServiceValueLabel(seed),
            authorUsername: seed.authorUsername,
            votesByUserId: explicitAssetServiceSignalVotes(seed.memberIds)
          }
        ],
        phaseTwoPlans: [
          {
            id: `production-plan-${seed.slug}-1`,
            title: `${seed.title} operating model`,
            authorUsername: seed.authorUsername,
            createdAt: seed.createdAt,
            outputSummary: seed.summary,
            materialsSummary:
              'Needs recurring coordination windows, clear custody notes, and visible request rules so land and non-land assets stay legible.',
            totalCostLabel: '$0 direct spend',
            acquisitionsSummary:
              'Uses already-held land and asset records that are seeded directly through the adapter-backed mock data.',
            overallVotesByUserId: approvalVotes,
            valueVotesByValueId: {
              [valueId]: approvalVotes
            }
          }
        ],
        phaseThreePlans: [
          {
            id: `distribution-plan-${seed.slug}-1`,
            title: 'Asset management access and handoff flow',
            authorUsername: seed.authorUsername,
            createdAt: seed.lastActivityAt,
            distributionSummary:
              `Keep land access, asset custody, and request handling visible through one asset-management surface for ${seed.locationLabel}.`,
            accessSummary:
              'Members can request site use, asset use, or handoff support directly from this project page, with service members coordinating the resulting work.',
            reserveSummary:
              'Keep a small reserve buffer and one visible coordination window so urgent requests do not consume the full inventory.',
            requestSystemEnabled: true,
            requestMode: 'both',
            allowOffScheduleRequests: true,
            overallVotesByUserId: approvalVotes,
            valueVotesByValueId: {
              [valueId]: approvalVotes
            }
          }
        ],
        phaseFiveActivities: [buildExplicitAssetServiceActivity(seed)],
        serviceRequests: []
      }
    ];
  })
);

const explicitAssetServiceProjectDetailExtras: Record<string, ProjectDetailExtra> = Object.fromEntries(
  explicitAssetServiceProjectSeeds.map((seed) => [
    seed.slug,
    {
      overview: seed.summary,
      updates: [
        {
          id: `project-update-${seed.slug}-1`,
          title: seed.updateTitle,
          body: seed.updateBody,
          authorUsername: seed.authorUsername,
          createdAt: seed.lastActivityAt
        }
      ],
      discussionNote:
        `Use chat to coordinate site access, asset custody, reserve stock, and any handoff work tied to ${seed.locationLabel}.`,
      discussion: []
    }
  ])
);

function buildAssetGovernanceVoteSummary(
  eligibleVoterCount: number,
  yesCount: number,
  noCount: number,
  note: string
): AssetGovernanceVoteSummary {
  const votesRequired =
    eligibleVoterCount <= 0
      ? 0
      : Math.ceil((eligibleVoterCount * GOVERNANCE_APPROVAL_THRESHOLD_PERCENT) / 100);
  const approvalPercent = yesCount + noCount <= 0 ? 0 : Math.round((yesCount / (yesCount + noCount)) * 100);
  const votesRemaining = Math.max(votesRequired - (yesCount + noCount), 0);

  return {
    yesCount,
    noCount,
    eligibleVoterCount,
    approvalPercent,
    votesRequired,
    votesRemaining,
    statusLabel:
      yesCount >= votesRequired
        ? 'Approved'
        : votesRemaining === 0 && yesCount < votesRequired
          ? 'Rejected'
          : 'Pending',
    note
  };
}

function emptyAssetGovernanceData(): AssetGovernanceData {
  return {
    availabilityRequests: [],
    borrowingPolicies: [],
    borrowingRequests: [],
    deliveryRequests: [],
    provenanceTimeline: []
  };
}

function buildAssetGovernanceData(assetId: string): AssetGovernanceData {
  switch (assetId) {
    case 'land-tool-library-campus':
      return {
        availabilityRequests: [
          {
            id: 'availability-tool-library-benches-approved',
            assetLabel: 'Workshop bench set',
            title: 'Repair cafe workshop-use window',
            statusLabel: 'Approved availability',
            requestingPartyLabel: 'Repair Cafe Shift Grid',
            requestedAtLabel: 'Opened May 2',
            timeframeLabel: 'May 9 to May 30 repair shifts',
            managingProjectLabel: 'Tool Library Land Stewardship Service',
            summary:
              'The stewardship team confirmed that the fixed bench set stays reserved for recurring repair-cafe intake and triage blocks this month.',
            outcomeNote:
              'Approved requests unlock the linked plan or shift scheduling without needing a second availability check.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              0,
              'The site stewards cleared the required threshold for recurring repair-cafe use.'
            )
          },
          {
            id: 'availability-tool-library-carts-pending',
            assetLabel: 'Repair intake carts',
            title: 'Front-room overlap request',
            statusLabel: 'Pending availability vote',
            requestingPartyLabel: 'Childcare Check-in Desk Service',
            requestedAtLabel: 'Opened May 14',
            timeframeLabel: 'Two overlapping event mornings next week',
            managingProjectLabel: 'Tool Library Storage Facility Service',
            summary:
              'The childcare desk requested two carts during overlapping intake windows so supplies can move between the front room and workshop.',
            outcomeNote:
              'The request stays pending until the storage service decides whether enough carts remain available for repair intake.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              1,
              0,
              'One more yes vote would clear the storage-service threshold.'
            )
          }
        ],
        borrowingPolicies: [
          {
            id: 'policy-tool-library-benches',
            assetLabel: 'Workshop bench set',
            statusLabel: 'Active policy',
            policyLabel: 'Project use only',
            managingProjectLabel: 'Tool Library Land Stewardship Service',
            decidedAtLabel: 'Last changed Apr 29',
            summary:
              'The fixed bench set stays reserved for project or service work because the benches are installed infrastructure, not portable library items.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              3,
              0,
              'All seeded land stewards supported keeping the bench set in project-use-only custody.'
            )
          },
          {
            id: 'policy-tool-library-carts',
            assetLabel: 'Repair intake carts',
            statusLabel: 'Active policy',
            policyLabel: 'Individual borrowing permitted',
            managingProjectLabel: 'Tool Library Storage Facility Service',
            decidedAtLabel: 'Last changed May 3',
            summary:
              'The rolling carts can be borrowed directly when members need to move materials between the front room, workshop floor, and nearby pickup lane.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              1,
              'The storage team approved individual borrowing with one dissent about cart wear.'
            )
          }
        ],
        borrowingRequests: [
          {
            id: 'borrowing-tool-library-carts-active',
            assetLabel: 'Repair intake carts',
            title: 'Community cleanup cart loan',
            statusLabel: 'Borrowed by individual',
            borrowerLabel: 'patchbay',
            requestedAtLabel: 'Requested May 11',
            expectedReturnLabel: 'Due back May 18',
            purpose: 'Move donated repair items from the alley drop-off to the intake room during the neighborhood cleanup.',
            currentCustodyLabel: 'Currently in patchbay custody',
            coordinationNote:
              'Storage stewards coordinated pickup at the front room and asked for a photo on return so wheel condition stays visible on the record.'
          },
          {
            id: 'borrowing-tool-library-carts-overdue',
            assetLabel: 'Repair intake carts',
            title: 'Overflow event cart return',
            statusLabel: 'Overdue return',
            borrowerLabel: 'quietember',
            requestedAtLabel: 'Requested Apr 28',
            expectedReturnLabel: 'Due back May 4',
            purpose: 'Move childcare sign-in bins during a crowded mutual-aid pickup window.',
            currentCustodyLabel: 'Still assigned to quietember',
            coordinationNote:
              'The storage team is still messaging the borrower directly. No penalty applies, but the overdue state remains public until the cart returns.',
            responsiblePartyLabel: 'quietember'
          }
        ],
        deliveryRequests: [
          {
            id: 'delivery-tool-library-benches-completed',
            assetLabel: 'Workshop bench set',
            title: 'Bench parts return from overflow storage',
            statusLabel: 'Completed delivery',
            requesterLabel: 'Tool Library Land Stewardship Service',
            requestedAtLabel: 'Requested May 1',
            neededByLabel: 'Completed May 2',
            originLabel: 'Tool Library Storage Facility Service',
            destinationLabel: 'Tool Library workshop floor',
            assignedVolunteerLabel: 'toolorbit',
            summary:
              'Replacement surfaces and brackets were returned from overflow storage so the bench set could be reopened for repair shifts.'
          }
        ],
        provenanceTimeline: [
          {
            id: 'provenance-tool-library-land-1',
            title: 'Land stewardship record created',
            statusLabel: 'Land record opened',
            happenedAtLabel: 'Apr 25',
            actorLabel: 'platform stewardship preview',
            summary: 'The campus lot was entered as the home land record for workshop, intake, and overflow storage assets.',
            locationLabel: 'Tool Library Campus Lot',
            custodyLabel: 'Platform stewardship preview'
          },
          {
            id: 'provenance-tool-library-land-2',
            title: 'Bench surfaces returned from storage',
            statusLabel: 'Completed delivery',
            happenedAtLabel: 'May 2',
            actorLabel: 'toolorbit',
            summary: 'Overflow bench surfaces returned from storage and were reinstalled on the workshop floor.',
            locationLabel: 'Tool Library workshop floor',
            custodyLabel: 'Tool Library Land Stewardship Service'
          },
          {
            id: 'provenance-tool-library-land-3',
            title: 'Intake cart marked overdue',
            statusLabel: 'Overdue custody state',
            happenedAtLabel: 'May 4',
            actorLabel: 'Tool Library Storage Facility Service',
            summary: 'One intake cart remained off-site past its expected return and now shows an overdue public custody state.',
            locationLabel: 'Borrower off-site use',
            custodyLabel: 'quietember'
          }
        ]
      };
    case 'asset-tool-library-workbench-set':
      return {
        availabilityRequests: [
          {
            id: 'availability-bench-set-approved',
            assetLabel: 'Workshop bench set',
            title: 'Repair cafe bench reservation',
            statusLabel: 'Approved availability',
            requestingPartyLabel: 'Repair Cafe Shift Grid',
            requestedAtLabel: 'Opened May 2',
            timeframeLabel: 'Recurring Friday repair shifts',
            managingProjectLabel: 'Tool Library Land Stewardship Service',
            summary:
              'The bench set was approved for recurring repair-cafe use after stewards confirmed no conflicting workshop maintenance windows.',
            outcomeNote: 'The approved request now appears as active project use on the asset record.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              0,
              'The stewardship vote cleared the threshold for recurring use.'
            )
          }
        ],
        borrowingPolicies: [
          {
            id: 'policy-bench-set',
            assetLabel: 'Workshop bench set',
            statusLabel: 'Active policy',
            policyLabel: 'Project use only',
            managingProjectLabel: 'Tool Library Land Stewardship Service',
            decidedAtLabel: 'Last changed Apr 29',
            summary: 'The bench set stays in project custody because it is installed workshop infrastructure.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              3,
              0,
              'All seeded stewards supported the project-use-only policy.'
            )
          }
        ],
        borrowingRequests: [],
        deliveryRequests: [
          {
            id: 'delivery-bench-set-return',
            assetLabel: 'Workshop bench set',
            title: 'Bench surface return from overflow storage',
            statusLabel: 'Completed delivery',
            requesterLabel: 'Tool Library Land Stewardship Service',
            requestedAtLabel: 'Requested May 1',
            neededByLabel: 'Completed May 2',
            originLabel: 'Overflow shelf zone',
            destinationLabel: 'Workshop floor',
            assignedVolunteerLabel: 'toolorbit',
            summary: 'Replacement surfaces returned from storage and were reinstalled before the next repair shift opened.'
          }
        ],
        provenanceTimeline: [
          {
            id: 'provenance-bench-1',
            title: 'Bench set entered into common custody',
            statusLabel: 'Asset registered',
            happenedAtLabel: 'Apr 25',
            actorLabel: 'platform stewardship preview',
            summary: 'The fixed workshop benches were entered as a permanent shared asset under the tool-library land record.',
            locationLabel: 'Tool Library workshop floor',
            custodyLabel: 'Tool Library Land Stewardship Service'
          },
          {
            id: 'provenance-bench-2',
            title: 'Repair-cafe use window confirmed',
            statusLabel: 'Project use approved',
            happenedAtLabel: 'May 2',
            actorLabel: 'Tool Library Land Stewardship Service',
            summary: 'The stewardship vote cleared recurring repair-cafe use for the current month.',
            locationLabel: 'Tool Library workshop floor',
            custodyLabel: 'Repair Cafe Shift Grid'
          }
        ]
      };
    case 'asset-tool-library-intake-carts':
      return {
        availabilityRequests: [
          {
            id: 'availability-carts-pending',
            assetLabel: 'Repair intake carts',
            title: 'Childcare overlap request',
            statusLabel: 'Pending availability vote',
            requestingPartyLabel: 'Childcare Check-in Desk Service',
            requestedAtLabel: 'Opened May 14',
            timeframeLabel: 'Two front-room event mornings',
            managingProjectLabel: 'Tool Library Storage Facility Service',
            summary: 'The childcare desk asked to reserve two carts during overlapping intake windows while repair intake stays active.',
            outcomeNote: 'The request remains pending until the storage team confirms enough carts stay on site for repair intake.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              1,
              0,
              'One more yes vote would approve the overlap request.'
            )
          }
        ],
        borrowingPolicies: [
          {
            id: 'policy-carts',
            assetLabel: 'Repair intake carts',
            statusLabel: 'Active policy',
            policyLabel: 'Individual borrowing permitted',
            managingProjectLabel: 'Tool Library Storage Facility Service',
            decidedAtLabel: 'Last changed May 3',
            summary: 'Portable carts can be borrowed directly when members need to move shared materials between nearby rooms or pickup lanes.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              1,
              'The storage team approved borrowing with one dissent about wear and tear.'
            )
          }
        ],
        borrowingRequests: [
          {
            id: 'borrowing-carts-active',
            assetLabel: 'Repair intake carts',
            title: 'Community cleanup cart loan',
            statusLabel: 'Borrowed by individual',
            borrowerLabel: 'patchbay',
            requestedAtLabel: 'Requested May 11',
            expectedReturnLabel: 'Due back May 18',
            purpose: 'Move donated repair items from the alley drop-off to the intake room during a neighborhood cleanup.',
            currentCustodyLabel: 'Currently in patchbay custody',
            coordinationNote: 'Storage stewards coordinated pickup at the front room and asked for a photo on return to confirm wheel condition.'
          },
          {
            id: 'borrowing-carts-overdue',
            assetLabel: 'Repair intake carts',
            title: 'Overlapping event overflow cart',
            statusLabel: 'Overdue return',
            borrowerLabel: 'quietember',
            requestedAtLabel: 'Requested Apr 28',
            expectedReturnLabel: 'Due back May 4',
            purpose: 'Move check-in bins during a crowded mutual-aid pickup window.',
            currentCustodyLabel: 'Still assigned to quietember',
            coordinationNote: 'The storage team is still coordinating a return directly with the borrower. The overdue state remains public until the cart returns.',
            responsiblePartyLabel: 'quietember'
          }
        ],
        deliveryRequests: [
          {
            id: 'delivery-carts-handoff',
            assetLabel: 'Repair intake carts',
            title: 'Front-room to workshop handoff',
            statusLabel: 'Completed delivery',
            requesterLabel: 'Tool Library Storage Facility Service',
            requestedAtLabel: 'Requested May 6',
            neededByLabel: 'Completed May 6',
            originLabel: 'Tool Library front room',
            destinationLabel: 'Workshop floor',
            assignedVolunteerLabel: 'samira.l',
            summary: 'Two carts moved from check-in to the workshop floor for a heavy repair-intake day.'
          }
        ],
        provenanceTimeline: [
          {
            id: 'provenance-carts-1',
            title: 'Borrowing policy switched to direct borrowing',
            statusLabel: 'Borrowing policy approved',
            happenedAtLabel: 'May 3',
            actorLabel: 'Tool Library Storage Facility Service',
            summary: 'The storage team approved direct individual borrowing for the portable carts.',
            locationLabel: 'Tool Library front room',
            custodyLabel: 'Tool Library Storage Facility Service'
          },
          {
            id: 'provenance-carts-2',
            title: 'Cart loan opened for cleanup run',
            statusLabel: 'Borrowed by individual',
            happenedAtLabel: 'May 11',
            actorLabel: 'patchbay',
            summary: 'A cart left storage for a neighborhood cleanup and remains in active borrower custody until return.',
            locationLabel: 'Borrower off-site use',
            custodyLabel: 'patchbay'
          },
          {
            id: 'provenance-carts-3',
            title: 'Second cart marked overdue',
            statusLabel: 'Overdue custody state',
            happenedAtLabel: 'May 4',
            actorLabel: 'Tool Library Storage Facility Service',
            summary: 'A second cart remained off-site past its due date and is now publicly marked overdue.',
            locationLabel: 'Borrower off-site use',
            custodyLabel: 'quietember'
          }
        ]
      };
    case 'land-east-market-commons':
      return {
        availabilityRequests: [
          {
            id: 'availability-east-market-cold-racks-approved',
            assetLabel: 'Cold-storage rack set',
            title: 'Cooled pickup lane request',
            statusLabel: 'Approved availability',
            requestingPartyLabel: 'Neighborhood Ride Coordination Service',
            requestedAtLabel: 'Opened May 7',
            timeframeLabel: 'Twice-weekly cooled pickup windows',
            managingProjectLabel: 'East Market Cold Storage Service',
            summary: 'The cold-storage service approved recurring rack access so ride coordination can stage temperature-sensitive pickups.',
            outcomeNote: 'The approved request keeps dispatch visible and unlocks cooled pickup scheduling without another asset vote.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              0,
              'Cold-storage stewards approved the cooled pickup window.'
            )
          },
          {
            id: 'availability-east-market-staging-pending',
            assetLabel: 'Retrofit staging tables',
            title: 'Next build-day staging request',
            statusLabel: 'Pending availability vote',
            requestingPartyLabel: 'Hallway Air-Sealing Build Day',
            requestedAtLabel: 'Opened May 16',
            timeframeLabel: 'Next sealing block and cleanup night',
            managingProjectLabel: 'East Market Land Stewardship Service',
            summary: 'The build day requested staging-table use for another seal-and-check round plus the follow-up cleanup block.',
            outcomeNote: 'The request will decide whether the next build-day plan can stay on the current in-house table path or must revise toward new purchases.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              1,
              1,
              'The land stewards still need one more yes vote to clear the request.'
            )
          }
        ],
        borrowingPolicies: [
          {
            id: 'policy-east-market-cold-racks',
            assetLabel: 'Cold-storage rack set',
            statusLabel: 'Active policy',
            policyLabel: 'Project use only',
            managingProjectLabel: 'East Market Cold Storage Service',
            decidedAtLabel: 'Last changed May 5',
            summary: 'The rack set stays in project custody because temperature handling needs stewarded service windows.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              3,
              0,
              'All seeded cold-storage stewards backed the project-use-only policy.'
            )
          },
          {
            id: 'policy-east-market-tables',
            assetLabel: 'Retrofit staging tables',
            statusLabel: 'Active policy',
            policyLabel: 'Individual borrowing permitted',
            managingProjectLabel: 'East Market Land Stewardship Service',
            decidedAtLabel: 'Last changed May 8',
            summary: 'Portable staging tables can be borrowed directly when neighborhood work needs short setup windows outside project activity.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              1,
              'The land stewards approved portable-table borrowing with one caution about return timing.'
            )
          }
        ],
        borrowingRequests: [
          {
            id: 'borrowing-east-market-tables-active',
            assetLabel: 'Retrofit staging tables',
            title: 'Weekend retrofit prep loan',
            statusLabel: 'Borrowed by individual',
            borrowerLabel: 'rowanloop',
            requestedAtLabel: 'Requested May 12',
            expectedReturnLabel: 'Due back May 19',
            purpose: 'Set up temporary prep surfaces for neighborhood insulation-kit sorting.',
            currentCustodyLabel: 'Currently in rowanloop custody',
            coordinationNote: 'The land stewardship team logged the pickup and asked for a return photo before the next build-day staging request closes.'
          }
        ],
        deliveryRequests: [
          {
            id: 'delivery-east-market-cold-route',
            assetLabel: 'Cold-storage rack set',
            title: 'Commons-to-pickup lane cold-chain transfer',
            statusLabel: 'Completed delivery',
            requesterLabel: 'Neighborhood Ride Coordination Service',
            requestedAtLabel: 'Requested May 9',
            neededByLabel: 'Completed May 10',
            originLabel: 'East Market cold pad',
            destinationLabel: 'East Market pickup lane',
            assignedVolunteerLabel: 'quietember',
            summary: 'A delivery-style handoff moved the rack set into cooled pickup position and then returned it to storage after dispatch closed.'
          }
        ],
        provenanceTimeline: [
          {
            id: 'provenance-east-market-land-1',
            title: 'Commons lot entered as land record',
            statusLabel: 'Land record opened',
            happenedAtLabel: 'Apr 24',
            actorLabel: 'platform stewardship preview',
            summary: 'The commons lot was entered as the home record for cold storage, staging tables, and pickup-lane infrastructure.',
            locationLabel: 'East Market Commons Lot',
            custodyLabel: 'Platform stewardship preview'
          },
          {
            id: 'provenance-east-market-land-2',
            title: 'Cold-chain route completed',
            statusLabel: 'Completed delivery',
            happenedAtLabel: 'May 10',
            actorLabel: 'quietember',
            summary: 'The cold-storage rack set moved from the commons pad to the pickup lane and returned after the cooled dispatch window closed.',
            locationLabel: 'East Market pickup lane',
            custodyLabel: 'Neighborhood Ride Coordination Service'
          }
        ]
      };
    case 'asset-east-market-cold-racks':
      return {
        availabilityRequests: [
          {
            id: 'availability-cold-racks-approved',
            assetLabel: 'Cold-storage rack set',
            title: 'Recurring cooled pickup request',
            statusLabel: 'Approved availability',
            requestingPartyLabel: 'Neighborhood Ride Coordination Service',
            requestedAtLabel: 'Opened May 7',
            timeframeLabel: 'Twice-weekly pickup windows',
            managingProjectLabel: 'East Market Cold Storage Service',
            summary: 'The rack set was approved for recurring cooled pickup windows so dispatch can stage temperature-sensitive orders.',
            outcomeNote: 'The approved request now appears as active project use for dispatch work.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              0,
              'The storage service approved recurring rack use.'
            )
          }
        ],
        borrowingPolicies: [
          {
            id: 'policy-cold-racks',
            assetLabel: 'Cold-storage rack set',
            statusLabel: 'Active policy',
            policyLabel: 'Project use only',
            managingProjectLabel: 'East Market Cold Storage Service',
            decidedAtLabel: 'Last changed May 5',
            summary: 'The rack set stays in service-managed custody because cold handling and cleaning need stewarded oversight.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              3,
              0,
              'All seeded cold-storage stewards backed the project-use-only policy.'
            )
          }
        ],
        borrowingRequests: [],
        deliveryRequests: [
          {
            id: 'delivery-cold-racks',
            assetLabel: 'Cold-storage rack set',
            title: 'Pickup lane cold-chain run',
            statusLabel: 'Completed delivery',
            requesterLabel: 'Neighborhood Ride Coordination Service',
            requestedAtLabel: 'Requested May 9',
            neededByLabel: 'Completed May 10',
            originLabel: 'East Market cold pad',
            destinationLabel: 'East Market pickup lane',
            assignedVolunteerLabel: 'quietember',
            summary: 'The rack set moved to the pickup lane for dispatch and then returned to the cold pad after the run completed.'
          }
        ],
        provenanceTimeline: [
          {
            id: 'provenance-cold-racks-1',
            title: 'Rack set assigned to cold-storage service',
            statusLabel: 'Custody assigned',
            happenedAtLabel: 'Apr 30',
            actorLabel: 'East Market Cold Storage Service',
            summary: 'The rack set entered ongoing cold-storage custody after the service staged the commons pad.',
            locationLabel: 'East Market cold pad',
            custodyLabel: 'East Market Cold Storage Service'
          },
          {
            id: 'provenance-cold-racks-2',
            title: 'Dispatch route completed',
            statusLabel: 'Completed delivery',
            happenedAtLabel: 'May 10',
            actorLabel: 'quietember',
            summary: 'The rack set temporarily moved into dispatch custody during the cooled pickup window and then returned to storage.',
            locationLabel: 'East Market pickup lane',
            custodyLabel: 'Neighborhood Ride Coordination Service'
          }
        ]
      };
    case 'asset-east-market-retrofit-tables':
      return {
        availabilityRequests: [
          {
            id: 'availability-staging-tables-pending',
            assetLabel: 'Retrofit staging tables',
            title: 'Next sealing block staging request',
            statusLabel: 'Pending availability vote',
            requestingPartyLabel: 'Hallway Air-Sealing Build Day',
            requestedAtLabel: 'Opened May 16',
            timeframeLabel: 'Next sealing block plus cleanup night',
            managingProjectLabel: 'East Market Land Stewardship Service',
            summary: 'The productive build day requested table access for the next staging and cleanup run.',
            outcomeNote: 'This request determines whether the next round can stay on in-house tables or must revise toward purchase or a different shared asset.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              1,
              1,
              'The request still needs one more yes vote from land stewards.'
            )
          }
        ],
        borrowingPolicies: [
          {
            id: 'policy-staging-tables',
            assetLabel: 'Retrofit staging tables',
            statusLabel: 'Active policy',
            policyLabel: 'Individual borrowing permitted',
            managingProjectLabel: 'East Market Land Stewardship Service',
            decidedAtLabel: 'Last changed May 8',
            summary: 'Portable staging tables can be borrowed directly for short neighborhood work windows when no project holds them.',
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              1,
              'The land stewards approved borrowing with one caution about quick returns.'
            )
          }
        ],
        borrowingRequests: [
          {
            id: 'borrowing-staging-tables-active',
            assetLabel: 'Retrofit staging tables',
            title: 'Weekend prep-table loan',
            statusLabel: 'Borrowed by individual',
            borrowerLabel: 'rowanloop',
            requestedAtLabel: 'Requested May 12',
            expectedReturnLabel: 'Due back May 19',
            purpose: 'Set up temporary prep surfaces for neighborhood insulation-kit sorting.',
            currentCustodyLabel: 'Currently in rowanloop custody',
            coordinationNote: 'The stewardship team logged the pickup and expects a return photo before the next build-day use window closes.'
          }
        ],
        deliveryRequests: [
          {
            id: 'delivery-staging-tables-scheduled',
            assetLabel: 'Retrofit staging tables',
            title: 'Return from materials shed',
            statusLabel: 'Scheduled delivery',
            requesterLabel: 'Hallway Air-Sealing Build Day',
            requestedAtLabel: 'Requested May 17',
            neededByLabel: 'Needed by May 20',
            originLabel: 'Retrofit Materials Shed Service',
            destinationLabel: 'East Market retrofit staging area',
            assignedVolunteerLabel: 'Awaiting volunteer',
            summary: 'The next sealing round needs the tables moved back from the materials shed before setup begins.'
          }
        ],
        provenanceTimeline: [
          {
            id: 'provenance-staging-tables-1',
            title: 'Tables entered land stewardship custody',
            statusLabel: 'Asset registered',
            happenedAtLabel: 'Apr 28',
            actorLabel: 'East Market Land Stewardship Service',
            summary: 'The shared staging tables were entered under commons custody for rotating build-day and neighborhood use.',
            locationLabel: 'East Market staging shed',
            custodyLabel: 'East Market Land Stewardship Service'
          },
          {
            id: 'provenance-staging-tables-2',
            title: 'Weekend prep loan opened',
            statusLabel: 'Borrowed by individual',
            happenedAtLabel: 'May 12',
            actorLabel: 'rowanloop',
            summary: 'Two staging tables left the commons lot for a short neighborhood prep window and remain in borrower custody.',
            locationLabel: 'Borrower off-site use',
            custodyLabel: 'rowanloop'
          }
        ]
      };
    default:
      return emptyAssetGovernanceData();
  }
}

type DynamicScopePageMeta = {
  description: string;
  note?: string;
  badges: string[];
  emptyFeedText: string;
};

const createdChannelScopeMetaBySlug: Record<string, DynamicScopePageMeta> = {};
const createdCommunityScopeMetaBySlug: Record<string, DynamicScopePageMeta> = {};

const clientStateStorageKey = 'social-production.web.client-state';
const createdProjectSlugs = new Set<string>();

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
    profileImageUrl: viewer.profileImageUrl ?? '',
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
    normalized.profileImageUrl = viewer.profileImageUrl ?? normalized.profileImageUrl;
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
  viewer.profileImageUrl = settings.profileImageUrl.trim() ? settings.profileImageUrl.trim() : undefined;
}

function snapshotCreatedProjects() {
  return [...createdProjectSlugs]
    .map((slug) => {
      const item = publicFeedBase.find(
        (entry): entry is PublicProjectItem => entry.kind === 'project' && entry.slug === slug
      );

      if (!item) {
        return null;
      }

      return {
        slug,
        item,
        lifecycle: projectLifecycleBySlug[slug],
        workflow: projectWorkflowStateBySlug[slug],
        members: projectMembersBySlug[slug] ?? [],
        membershipSince: projectMembershipSinceBySlug[slug] ?? {},
        detailExtra: projectDetailExtras[slug],
        comments: commentsBySubjectId[item.id] ?? []
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);
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
        settingsByUserId,
        createdProjects: snapshotCreatedProjects()
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
      createdProjects?: Array<{
        slug?: string;
        item?: PublicProjectItem;
        lifecycle?: ProjectLifecycleConfig;
        workflow?: ProjectWorkflowState;
        members?: string[];
        membershipSince?: Record<string, string>;
        detailExtra?: ProjectDetailExtra;
        comments?: DetailComment[];
      }>;
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

    if (Array.isArray(persisted.createdProjects)) {
      for (const entry of persisted.createdProjects) {
        const slug = entry?.slug;
        const item = entry?.item;

        if (!slug || !item || item.kind !== 'project') {
          continue;
        }

        const existingIndex = publicFeedBase.findIndex(
          (publicItem) => publicItem.kind === 'project' && publicItem.slug === slug
        );

        if (existingIndex === -1) {
          publicFeedBase.unshift(item);
        } else {
          publicFeedBase[existingIndex] = item;
        }

        if (entry.lifecycle) {
          projectLifecycleBySlug[slug] = entry.lifecycle;
        }

        if (entry.workflow) {
          projectWorkflowStateBySlug[slug] = entry.workflow;
        }

        projectMembersBySlug[slug] = Array.isArray(entry.members)
          ? entry.members.filter((member): member is string => typeof member === 'string')
          : projectMembersBySlug[slug] ?? [];

        projectMembershipSinceBySlug[slug] =
          entry.membershipSince && typeof entry.membershipSince === 'object'
            ? entry.membershipSince
            : projectMembershipSinceBySlug[slug] ?? {};

        if (entry.detailExtra) {
          projectDetailExtras[slug] = entry.detailExtra;
        }

        commentsBySubjectId[item.id] = Array.isArray(entry.comments)
          ? entry.comments
          : commentsBySubjectId[item.id] ?? [];

        seedVoteTarget(item.id, item.voteCount, item.activeVote);
        createdProjectSlugs.add(slug);
      }
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
    memberCount: 0,
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
  ...explicitAssetServiceProjectFeedItems,
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
  'rowan-after-school-device-checks': ['viewer-1', 'user-rowan', 'user-mika'],
  ...explicitAssetServiceProjectMembersBySlug
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

const projectRoleConfigsBySlug: Record<string, RoleConfig> = {
  ...explicitAssetServiceProjectRoleConfigsBySlug,
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
    currentPhaseId: 'activity',
    signalCount: 3,
    signalUserIds: ['viewer-1', 'user-tool', 'user-rowan'],
    oppositionSignalCount: 1,
    oppositionSignalUserIds: ['user-ember'],
    eventValues: [
      {
        id: 'event-value-swap-1',
        label: 'Should welcome first-time neighbors clearly',
        authorUsername: 'patchbay',
        votesByUserId: {
          'viewer-1': 9,
          'user-tool': 8,
          'user-rowan': 10,
          'user-mika': 8
        }
      },
      {
        id: 'event-value-swap-2',
        label: 'Should turn repair stories into concrete volunteer roles',
        authorUsername: 'toolorbit',
        votesByUserId: {
          'viewer-1': 8,
          'user-tool': 10,
          'user-rowan': 9,
          'user-mika': 7
        }
      },
      {
        id: 'event-value-swap-3',
        label: 'Should keep the swap table and repair help easy to navigate',
        authorUsername: 'rowanloop',
        votesByUserId: {
          'viewer-1': 7,
          'user-tool': 9,
          'user-rowan': 8,
          'user-mika': 8
        }
      }
    ],
    eventPlans: [
      {
        id: 'event-plan-swap-1',
        title: 'Tool Library Spring Swap and Repair Night',
        authorUsername: 'toolorbit',
        createdAt: '2026-04-29T18:45:00Z',
        description:
          'An open spring repair-and-swap night with a clear welcome point, repair story circle, and volunteer signup round that turns interest into actual roles.',
        demandSignalSnapshot: 3,
        demandConsiderationNote:
          'The plan keeps the social format people asked for, but adds clear intake, volunteer roles, and a closing signup pass so the demand signal becomes real coordination.',
        locationLabel: 'Tool Library Courtyard',
        schedule: {
          mode: 'date',
          startDate: '2026-05-01',
          startTimeLabel: '18:00',
          finishTimeLabel: '21:00'
        },
        overallVotesByUserId: {
          'viewer-1': 'yes',
          'user-tool': 'yes',
          'user-rowan': 'yes'
        },
        valueVotesByValueId: {
          '__demand-signal__': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          },
          'event-value-swap-1': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          },
          'event-value-swap-2': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          },
          'event-value-swap-3': {
            'viewer-1': 'yes',
            'user-tool': 'yes',
            'user-rowan': 'yes'
          }
        },
        planPhases: [
          {
            id: 'event-plan-swap-1-phase-1',
            title: 'Arrival and swap table',
            details:
              'Open the courtyard, set the swap table, and make sure new arrivals can see where tools, snacks, and volunteer signups live.'
          },
          {
            id: 'event-plan-swap-1-phase-2',
            title: 'Repair story circle',
            details:
              'Gather short repair stories, route people toward hands-on help, and keep a running note of what tools need extra coverage.'
          },
          {
            id: 'event-plan-swap-1-phase-3',
            title: 'Summer signup round',
            details:
              'Close with volunteer signups for summer repair nights and a clear handoff for follow-up requests.'
          }
        ]
      }
    ],
    eventActivities: [
      {
        id: 'event-activity-swap-setup',
        title: 'Courtyard setup and welcome table',
        authorUsername: 'toolorbit',
        scheduledAt: '2026-05-01T18:00:00Z',
        endsAt: '2026-05-01T18:45:00Z',
        locationLabel: 'Tool Library Courtyard',
        minimumParticipants: 3,
        linkedPlanPhaseId: 'event-plan-swap-1-phase-1',
        roles: [
          {
            label: 'Setup lead',
            requiredCount: 1,
            assignedUsernames: ['toolorbit']
          },
          {
            label: 'Welcome table',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          },
          {
            label: 'Snack and swap runner',
            requiredCount: 1,
            maximumCount: 2,
            assignedUsernames: ['rowanloop']
          }
        ],
        note:
          'Set the tables, arrival signs, and first-time visitor welcome point before the swap opens.'
      },
      {
        id: 'event-activity-swap-story-circle',
        title: 'Repair story circle and volunteer signup',
        authorUsername: 'patchbay',
        scheduledAt: '2026-05-01T20:00:00Z',
        endsAt: '2026-05-01T20:45:00Z',
        locationLabel: 'Tool Library Courtyard',
        minimumParticipants: 3,
        linkedPlanPhaseId: 'event-plan-swap-1-phase-3',
        roles: [
          {
            label: 'Facilitator',
            requiredCount: 1,
            assignedUsernames: ['patchbay']
          },
          {
            label: 'Signup table',
            requiredCount: 1,
            maximumCount: 2,
            assignedUsernames: ['toolorbit']
          },
          {
            label: 'Note taker',
            requiredCount: 1,
            assignedUsernames: []
          }
        ],
        note:
          'Collect the volunteer follow-up list and make sure unanswered repair needs are captured before everyone leaves.'
      }
    ],
    updateRequests: [],
    editRequests: [],
    phaseChangeRequests: [],
    decisionHistory: []
  },
  'retrofit-night-walk': {
    editorUserIds: ['user-mika', 'user-rowan'],
    currentPhaseId: 'activity',
    signalCount: 0,
    signalUserIds: [],
    oppositionSignalCount: 0,
    oppositionSignalUserIds: [],
    eventValues: [],
    eventPlans: [
      {
        id: 'event-plan-walk-1',
        title: 'Retrofit Night Walk Pilot Route',
        authorUsername: 'mika',
        createdAt: '2026-04-29T19:10:00Z',
        description:
          'An invite-only night walk covering the first retrofit cluster, access constraints, and the pilot readiness check for three buildings.',
        demandConsiderationNote:
          'The editor group kept the route tight so the walk produces concrete access notes before the first pilot install round.',
        locationLabel: 'East corner staging point',
        schedule: {
          mode: 'range',
          startDate: '2026-05-02',
          endDate: '2026-05-04',
          startTimeLabel: '20:00',
          finishTimeLabel: '21:15'
        },
        overallVotesByUserId: {
          'user-mika': 'yes',
          'user-rowan': 'yes'
        },
        valueVotesByValueId: {},
        planPhases: [
          {
            id: 'event-plan-walk-1-phase-1',
            title: 'Access walk',
            details:
              'Walk the first cluster together, flag entry constraints, and record which buildings are ready for the pilot.'
          },
          {
            id: 'event-plan-walk-1-phase-2',
            title: 'Constraint capture',
            details:
              'Group notes on wiring, lighting, and access so the follow-up work order can be drafted immediately after the walk.'
          }
        ]
      }
    ],
    eventActivities: [
      {
        id: 'event-activity-walk-route-a',
        title: 'First cluster access walk',
        authorUsername: 'mika',
        scheduledAt: '2026-05-02T20:00:00Z',
        endsAt: '2026-05-02T20:40:00Z',
        locationLabel: 'East corner staging point',
        minimumParticipants: 2,
        linkedPlanPhaseId: 'event-plan-walk-1-phase-1',
        roles: [
          {
            label: 'Route lead',
            requiredCount: 1,
            assignedUsernames: ['mika']
          },
          {
            label: 'Access note taker',
            requiredCount: 1,
            assignedUsernames: ['rowanloop']
          }
        ],
        note:
          'Walk the first building cluster and capture access blockers before the light drops further.'
      },
      {
        id: 'event-activity-walk-wrap',
        title: 'Pilot readiness wrap-up',
        authorUsername: 'rowanloop',
        scheduledAt: '2026-05-02T20:45:00Z',
        endsAt: '2026-05-02T21:15:00Z',
        locationLabel: 'East corner staging point',
        minimumParticipants: 2,
        linkedPlanPhaseId: 'event-plan-walk-1-phase-2',
        roles: [
          {
            label: 'Summary lead',
            requiredCount: 1,
            assignedUsernames: ['rowanloop']
          },
          {
            label: 'Constraint checker',
            requiredCount: 1,
            assignedUsernames: ['mika']
          }
        ],
        note:
          'Confirm which buildings are ready for the pilot and what still needs a follow-up visit.'
      }
    ],
    updateRequests: [],
    editRequests: [],
    phaseChangeRequests: [],
    decisionHistory: []
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

const platformProductivePhaseBlueprints: Array<
  Omit<ProjectLifecyclePhase, 'progressState' | 'betaLocked' | 'projectStatus'>
> = [
  {
    id: 'phase-1',
    order: 1,
    shortLabel: 'Proposal',
    title: 'Proposal',
    summary:
      'Platform productive projects open with demand, opposition, and value ranking from weekly active users.',
    mechanics: [
      'Weekly active users can support or oppose advancement while the project values are ranked.',
      'The platform vote context continues through every later governance step.',
      'Values stay visible in later planning and execution reviews.'
    ]
  },
  {
    id: 'phase-2',
    order: 2,
    shortLabel: 'Plan',
    title: 'Production Plan',
    summary:
      'The platform decides the concrete working plan here, including software repositories when the subtype is software.',
    mechanics: [
      'Plans still need quorum and the shared approval threshold from weekly active users.',
      'Software plans should attach the official repository URL that later pull requests target.',
      'The winning plan becomes the basis for activity and execution review.'
    ]
  },
  {
    id: 'phase-5',
    order: 3,
    shortLabel: 'Activity',
    title: 'Activity',
    summary:
      'The platform carries out the approved plan here through concrete work, requests, and operating activity.',
    mechanics: [
      'Activities stay visible as live work items tied back to the approved plan.',
      'Platform software work uses governed pull requests inside this activity phase.',
      'The board can later send the project back to planning if the working plan breaks down.'
    ]
  },
  {
    id: 'phase-6',
    order: 4,
    shortLabel: 'Execution',
    title: 'Pending Execution Review',
    summary:
      'Finished platform work pauses here so execution can be confirmed before the project is formally closed.',
    mechanics: [
      'This step holds the project open while execution evidence is reviewed.',
      'Software work uses merge recording and later confirmation rather than closing immediately.',
      'If execution fails or drifts, the project can return to planning.'
    ]
  },
  {
    id: 'phase-7',
    order: 5,
    shortLabel: 'Closed',
    title: 'Closed',
    summary: 'The project remains visible as a completed platform record after execution is confirmed.',
    mechanics: [
      'Closure preserves the full planning and execution history.',
      'Later rounds should start as new proposals instead of silently changing a closed project.',
      'Conversion or follow-on work can still link back to this record.'
    ]
  }
];

const platformCollectiveServicePhaseBlueprints: Array<
  Omit<ProjectLifecyclePhase, 'progressState' | 'betaLocked' | 'projectStatus'>
> = [
  {
    id: 'phase-1',
    order: 1,
    shortLabel: 'Proposal',
    title: 'Proposal',
    summary:
      'Platform collective services begin with the same proposal, support, opposition, and value ranking model as other platform work.',
    mechanics: [
      'Weekly active users decide whether the proposal should advance.',
      'Values remain the shared standard for later service requests and changes.',
      'This is still a governed platform surface, not an ordinary service signup flow.'
    ]
  },
  {
    id: 'phase-2',
    order: 2,
    shortLabel: 'Plan',
    title: 'Operations Plan',
    summary:
      'The platform decides the working operating plan here, without a separate access-plan phase.',
    mechanics: [
      'Operations plans still describe cadence, staffing, and the software or service surface being maintained.',
      'Platform collective services skip the old access-plan step entirely.',
      'The winning plan becomes the basis for governed requests during activity.'
    ]
  },
  {
    id: 'phase-5',
    order: 3,
    shortLabel: 'Activity',
    title: 'Activity',
    summary:
      'Governed work requests happen here while the approved platform service plan is being carried out.',
    mechanics: [
      'Platform requests remain governance decisions rather than ordinary booking requests.',
      'Software subtypes use pull requests, merge recording, and confirmation votes here.',
      'The board can return the project to planning if the operating model no longer works.'
    ]
  },
  {
    id: 'phase-6',
    order: 4,
    shortLabel: 'Closed',
    title: 'Closed',
    summary:
      'The platform service can close after the governed activity concludes, while keeping the full record visible.',
    mechanics: [
      'Ongoing service without material change should stay in activity instead of closing.',
      'Closure preserves the history of the operating plan and governed requests.',
      'A later redesign should reopen as a fresh proposal or return to planning first.'
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

function projectLifecyclePhaseBlueprintsForProject(
  slug: string,
  projectMode: ProjectMode,
  currentSubtype: ProjectSubtype | null = currentProjectSubtypeForGovernance(slug)
) {
  if (usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype)) {
    return platformProductivePhaseBlueprints;
  }

  return projectLifecyclePhaseBlueprintsForMode(projectMode);
}

function closePhaseIdForProjectSlug(
  slug: string,
  projectMode: ProjectMode,
  currentSubtype: ProjectSubtype | null = currentProjectSubtypeForGovernance(slug)
) {
  if (usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype)) {
    return 'phase-7' as const;
  }

  return closePhaseIdForProject(projectMode);
}

function nextProjectPhaseIdForSlug(
  slug: string,
  currentPhaseId: ProjectLifecyclePhaseId,
  projectMode: ProjectMode,
  currentSubtype: ProjectSubtype | null = currentProjectSubtypeForGovernance(slug)
): ProjectLifecyclePhaseId | null {
  if (!usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype)) {
    return nextProjectPhaseId(currentPhaseId, projectMode);
  }

  switch (currentPhaseId) {
    case 'phase-1':
      return 'phase-2';
    case 'phase-2':
      return 'phase-5';
    case 'phase-5':
      return 'phase-6';
    case 'phase-6':
      return 'phase-7';
    default:
      return null;
  }
}

function revertableProjectPhaseIdsForSlug(
  slug: string,
  projectMode: ProjectMode,
  currentPhaseId: ProjectLifecyclePhaseId,
  currentSubtype: ProjectSubtype | null = currentProjectSubtypeForGovernance(slug)
) {
  if (!usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype)) {
    return revertableProjectPhaseIds(projectMode, currentPhaseId);
  }

  if (currentPhaseId === 'phase-5' || currentPhaseId === 'phase-6' || currentPhaseId === 'phase-7') {
    return ['phase-2'] as Array<Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>>;
  }

  return [] as Array<Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>>;
}

function requestableProjectPhaseTargetIdsForSlug(
  slug: string,
  currentPhaseId: ProjectLifecyclePhaseId,
  projectMode: ProjectMode,
  currentSubtype: ProjectSubtype | null = currentProjectSubtypeForGovernance(slug)
) {
  const nextPhaseId = nextProjectPhaseIdForSlug(slug, currentPhaseId, projectMode, currentSubtype);

  return [
    ...(nextPhaseId ? [nextPhaseId] : []),
    ...revertableProjectPhaseIdsForSlug(slug, projectMode, currentPhaseId, currentSubtype)
  ];
}

function phaseOrderForProjectSlug(
  slug: string,
  projectMode: ProjectMode,
  phaseId: ProjectLifecyclePhaseId,
  currentSubtype: ProjectSubtype | null = currentProjectSubtypeForGovernance(slug)
) {
  return (
    projectLifecyclePhaseBlueprintsForProject(slug, projectMode, currentSubtype).find(
      (phase) => phase.id === phaseId
    )?.order ?? 0
  );
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
  ...explicitAssetServiceProjectLifecycleBySlug,
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

type RawProjectAcquisitionBundle = {
  id: string;
  title: string;
  destinationType: ProjectAcquisitionServiceDestinationType;
  existingServiceProjectSlug?: string;
  newServiceTitle?: string;
  note?: string;
};

type RawProjectAcquisitionPurchaseRow = {
  id: string;
  title: string;
  costLabel: string;
  purchaseHref: string;
  destinationBundleId: string;
  note?: string;
};

type RawProjectAcquisitionPendingAsset = {
  id: string;
  title: string;
  destinationBundleId: string;
  destinationLabel: string;
  note: string;
};

type RawProjectAcquisitionExecution = {
  proofLabel: string;
  note: string;
  recordedAt: string;
  recordedByUsername: string;
  pendingAssets: RawProjectAcquisitionPendingAsset[];
};

type RawProjectAcquisitionState = {
  confirmationVotesByUserId: Record<string, ProjectApprovalVote>;
  execution?: RawProjectAcquisitionExecution | null;
};

type RawProductionPlan = RawProjectPlanBase & {
  projectSubtype?: ProjectSubtype;
  description?: string;
  repositoryUrl?: string;
  planPhases?: RawPlanPhase[];
  outputSummary: string;
  materialsSummary: string;
  totalCostLabel: string;
  acquisitionsSummary: string;
  acquisitionBundles?: RawProjectAcquisitionBundle[];
  purchaseRows?: RawProjectAcquisitionPurchaseRow[];
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
  closeOutcome?: 'close' | 'convert';
  conversionTarget?: ProjectConversionTargetInput | null;
};

type RawProjectUpdateRequest = {
  id: string;
  body: string;
  authorUsername: string;
  createdAt: string;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawProjectEditRequest = {
  id: string;
  title: string;
  description: string;
  authorUsername: string;
  createdAt: string;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawProjectPullRequestRequest = {
  id: string;
  title: string;
  summary: string;
  pullRequestId: string;
  pullRequestUrl: string;
  authorUsername: string;
  createdAt: string;
  confirmationCreatedAt?: string;
  stage: 'approval' | 'awaiting-merge' | 'confirmation' | 'confirmed' | 'rejected' | 'replaced';
  votesByUserId: Record<string, ProjectApprovalVote>;
  mergeId?: string | null;
  mergedByUsername?: string | null;
};

type RawProjectMergeCapabilityChangeRequest = {
  id: string;
  targetUserId: string;
  action: 'grant' | 'revoke';
  authorUsername: string;
  createdAt: string;
  status: DecisionHistoryStatus;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawProjectRepositoryReplacementRequest = {
  id: string;
  repositoryUrl: string;
  previousRepositoryUrl: string;
  reason: string;
  relatedPullRequestId: string;
  authorUsername: string;
  createdAt: string;
  status: DecisionHistoryStatus;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawProjectRepositoryRecord = {
  id: string;
  repositoryUrl: string;
  previousRepositoryUrl: string;
  reason: string;
  relatedPullRequestId: string;
  replacedAt: string;
  replacedByUsername: string;
};

type RawEventUpdateRequest = {
  id: string;
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

type RawEventPhaseChangeRequest = {
  id: string;
  targetPhaseId: EventLifecyclePhaseId;
  reason: string;
  authorUsername: string;
  createdAt: string;
  votesByUserId: Record<string, ProjectApprovalVote>;
};

type RawEventPlanPhase = {
  id: string;
  title: string;
  details: string;
};

type RawEventPlan = RawProjectPlanBase & {
  description?: string;
  locationLabel?: string;
  schedule?: EventPlanScheduleInput;
  planPhases?: RawEventPlanPhase[];
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
  oppositionSignalUserIds?: string[];
  oppositionSignalCount?: number;
  values: RawProjectValue[];
  phaseTwoPlans: RawProductionPlan[];
  phaseThreePlans: RawDistributionPlan[];
  phaseFiveActivities: RawProjectActivity[];
  softwarePullRequests?: RawProjectPullRequestRequest[];
  softwareMergeCapabilityUserIds?: string[];
  softwareMergeCapabilityChangeRequests?: RawProjectMergeCapabilityChangeRequest[];
  softwareRepositoryUrlOverride?: string;
  softwareRepositoryReplacementRequests?: RawProjectRepositoryReplacementRequest[];
  softwareRepositoryHistory?: RawProjectRepositoryRecord[];
  serviceRequests?: RawProjectServiceRequest[];
  requestSystemEnabled?: boolean;
  requestSystemOverride?: RawProjectRequestSystemSettings;
  requestSettingsChangeRequests?: RawProjectServiceRequestSettingsChangeRequest[];
  serviceHistoryCompletions?: Record<string, RawProjectServiceHistoryCompletion>;
  revertHistory?: RawProjectRevertEntry[];
  phaseChangeRequests?: RawProjectPhaseChangeRequest[];
  updateRequests?: RawProjectUpdateRequest[];
  editRequests?: RawProjectEditRequest[];
  acquisition?: RawProjectAcquisitionState;
  decisionHistory?: RawDecisionHistoryEntry[];
  availabilitySummary?: string;
  travelRadiusLabel?: string;
  serviceRequestMode?: 'calendar' | 'direct' | 'both';
};

type EventWorkflowState = {
  editorUserIds: string[];
  currentPhaseId?: EventLifecyclePhaseId;
  signalCount?: number;
  signalUserIds?: string[];
  oppositionSignalCount?: number;
  oppositionSignalUserIds?: string[];
  eventValues?: RawProjectValue[];
  eventPlans?: RawEventPlan[];
  eventActivities?: RawProjectActivity[];
  phaseChangeRequests?: RawEventPhaseChangeRequest[];
  updateRequests?: RawEventUpdateRequest[];
  editRequests?: RawEventEditRequest[];
  decisionHistory?: RawDecisionHistoryEntry[];
  liveTitleOverride?: string;
  liveDescriptionOverride?: string;
};

type RawDecisionHistoryPayload =
  | {
      type: 'phase-change';
      changeKind: 'advance' | 'return' | 'close';
      fromPhaseId: ProjectLifecyclePhaseId | EventLifecyclePhaseId;
      toPhaseId: ProjectLifecyclePhaseId | EventLifecyclePhaseId;
      reason: string;
      closeOutcome?: 'close' | 'convert';
      conversionTarget?: ProjectConversionTargetInput | null;
    }
  | {
      type: 'update';
      body: string;
      appliedUpdateId?: string | null;
    }
  | {
      type: 'edit';
      changes: DecisionHistoryFieldChange[];
    }
  | {
      type: 'settings-change';
      reason: string;
      previousSettings: RawProjectRequestSystemSettings;
      proposedSettings: RawProjectRequestSystemSettings;
    }
  | {
      type: 'pull-request';
      title: string;
      summary: string;
      pullRequestId: string;
      pullRequestUrl: string;
      mergeId?: string | null;
      repositoryUrl?: string | null;
    }
  | {
      type: 'merge-capability';
      action: 'grant' | 'revoke';
      targetUsername: string;
    }
  | {
      type: 'repository-replacement';
      repositoryUrl: string;
      previousRepositoryUrl?: string | null;
      reason: string;
      relatedPullRequestId?: string | null;
    };

type RawDecisionHistoryEntry = {
  id: string;
  entityKind: 'project' | 'event';
  kind: DecisionHistoryEntryKind;
  createdAt: string;
  authorUsername: string;
  status: DecisionHistoryStatus;
  approvalThresholdPercent: number;
  payload: RawDecisionHistoryPayload;
  finalVotesByUserId?: Record<string, ProjectApprovalVote>;
  finalEligibleVoterCount?: number;
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

const phaseChangeApprovalThresholdPercent = GOVERNANCE_APPROVAL_THRESHOLD_PERCENT;

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
  ...explicitAssetServiceProjectWorkflowBySlug,
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
    },
    phaseChangeRequests: [
      {
        id: 'project-phase-change-hallway-air-sealing-convert',
        targetPhaseId: 'phase-6',
        reason:
          'Close the one-off build day and reopen the work as a standing support service so repeat weatherization requests inherit the current kits and coordination notes.',
        authorUsername: 'patchbay',
        createdAt: '2026-05-01T09:20:00Z',
        closeOutcome: 'convert',
        conversionTarget: {
          projectMode: 'collective-service',
          projectSubtype: 'standard'
        },
        votesByUserId: {
          'viewer-1': 'yes'
        }
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
  ) ?? null;

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
  const governanceQuorum = calculateGovernanceQuorum(memberCount);
  const votes = Object.values(votesByUserId);
  const yesCount = votes.filter((vote) => vote === 'yes').length;
  const noCount = votes.filter((vote) => vote === 'no').length;
  const totalVotes = yesCount + noCount;
  const approvalPercent = totalVotes === 0 ? 0 : Math.round((yesCount / totalVotes) * 100);
  const votesRequired = governanceQuorum.votesRequired;
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
    quorumThresholdPercent:
      memberCount > 0 ? governanceQuorum.quorumThresholdPercent : quorumThresholdPercent,
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

function conversionEntryPhaseIdForTarget(projectMode: ProjectMode): ProjectLifecyclePhaseId {
  return projectMode === 'personal-service' ? 'phase-1' : 'phase-1';
}

function conversionEntryPhaseLabelForTarget(projectMode: ProjectMode) {
  return projectMode === 'personal-service' ? 'Activity' : 'Proposal';
}

function buildProjectConversionTarget(
  target: ProjectConversionTargetInput | null | undefined
): ProjectConversionTarget | null {
  if (!target) {
    return null;
  }

  return {
    ...target,
    projectModeLabel: projectSubjectLabel(target.projectMode),
    projectSubtypeLabel: projectSubtypeLabel(target.projectSubtype),
    entryPhaseId: conversionEntryPhaseIdForTarget(target.projectMode),
    entryPhaseLabel: conversionEntryPhaseLabelForTarget(target.projectMode)
  };
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
        request.targetPhaseId === closePhaseIdForProjectSlug(slug, projectMode) &&
        targetOrder > currentPhaseOrder
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
        closeOutcome: request.closeOutcome,
        conversionTarget: buildProjectConversionTarget(request.conversionTarget),
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
        description: request.description,
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

function buildEventPhaseChangeRequests(
  slug: string,
  event: PublicEventItem,
  quorumThresholdPercent: number,
  eligibleVoterCount: number
) {
  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const fromPhaseId = workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event);

  return (workflow.phaseChangeRequests ?? [])
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        eligibleVoterCount
      );

      return {
        id: request.id,
        targetPhaseId: request.targetPhaseId,
        targetPhaseLabel: eventPhaseTitle(request.targetPhaseId),
        reason: request.reason,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        kind: eventPhaseChangeKind(event, fromPhaseId, request.targetPhaseId),
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies EventLifecyclePhaseChangeRequest;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function buildEventLifecycle(slug: string, event: PublicEventItem): EventLifecycleData {
  const creatorId = userByUsername(event.createdByUsername)?.id ?? null;
  const workflow = ensureEventWorkflowState(slug, creatorId);
  const viewer = currentViewer();
  const memberState = buildEventMemberState(event);
  const voteContextPopulation = eventGovernancePopulation(event, memberState.eligibleVoterCount);
  const quorum = calculateGovernanceQuorum(voteContextPopulation);
  const phaseOneValues = buildEventValues(slug);
  const signalSummary = buildEventSignalSummary(event);
  const phaseTwo = buildEventPlans(
    slug,
    event,
    phaseOneValues,
    quorum.quorumThresholdPercent,
    voteContextPopulation
  );
  const currentPhaseId = (() => {
    const configuredPhaseId = workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event);

    if ((configuredPhaseId === 'activity' || configuredPhaseId === 'closed') && !phaseTwo.winningPlanId) {
      return 'event-plan' as EventLifecyclePhaseId;
    }

    return configuredPhaseId;
  })();
  workflow.currentPhaseId = currentPhaseId;
  const selectablePlanPhases = buildSelectableEventActivityPlanPhases(phaseTwo);
  const activity =
    currentPhaseId === 'activity' || currentPhaseId === 'closed'
      ? buildEventActivityState(slug, selectablePlanPhases)
      : { activities: [] as ProjectActivityItem[] };
  const phaseChangeRequests = buildEventPhaseChangeRequests(
    slug,
    event,
    quorum.quorumThresholdPercent,
    voteContextPopulation
  );
  const revertablePhaseIds = revertableEventPhaseIds(event, currentPhaseId);
  const previousPhaseId = eventPreviousPhaseId(event, currentPhaseId);
  const nextPhaseId = eventNextPhaseId(event, currentPhaseId);

  return {
    currentPhaseId,
    quorumThresholdPercent: quorum.quorumThresholdPercent,
    quorumVotesRequired: quorum.votesRequired,
    voteContextLabel: eventVoteContextLabel(event),
    voteContextPopulation,
    phases: eventPhaseBlueprintsForItem(event, currentPhaseId),
    phaseOne: {
      values: phaseOneValues,
      viewerCanSignalDemand: !event.isPrivate && !!viewer,
      viewerHasDemandSignal: !event.isPrivate && !!viewer && !!workflow.signalUserIds?.includes(viewer.id),
      viewerCanSignalOpposition: !event.isPrivate && !!viewer,
      viewerHasOppositionSignal:
        !event.isPrivate && !!viewer && !!workflow.oppositionSignalUserIds?.includes(viewer.id),
      signalSummary,
      viewerCanAddValue: canViewerEditEventPhase(slug, 'proposal'),
      viewerCanVoteOnValues: canViewerEditEventPhase(slug, 'proposal')
    },
    phaseTwo: {
      plans: phaseTwo.plans,
      winningPlanId: phaseTwo.winningPlanId,
      viewerCanSubmitPlans: canViewerEditEventPhase(slug, 'event-plan'),
      viewerCanVoteOnPlans: canViewerEditEventPhase(slug, 'event-plan')
    },
    activity: {
      activities: activity.activities,
      viewerCanCreateActivities: canViewerCreateEventActivity(slug),
      selectablePlanPhases
    },
    viewerCanRequestPhaseChanges: canViewerRequestEventPhaseChange(slug),
    viewerCanVoteOnPhaseChanges: canViewerVoteOnEventPhaseChange(slug),
    phaseChangeRequests,
    revertablePhaseIds,
    previousPhaseId,
    previousPhaseLabel: previousPhaseId ? eventPhaseTitle(previousPhaseId) : null,
    nextPhaseId,
    nextPhaseLabel: nextPhaseId ? eventPhaseTitle(nextPhaseId) : null
  };
}

function eventPlanScheduledAt(schedule: EventPlanSchedule) {
  if (!schedule.startDate) {
    return undefined;
  }

  return `${schedule.startDate}T${schedule.startTimeLabel?.trim() || '18:00'}:00Z`;
}

function buildEffectiveEventPresentation(
  item: PublicEventItem,
  lifecycle?: Pick<EventLifecycleData, 'phaseTwo' | 'currentPhaseId'>
) {
  const workflow = eventWorkflowStateBySlug[item.slug];
  const eventLifecycle =
    lifecycle ??
    (() => {
      const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
      const participation = eventParticipationById[item.id] ?? { goingUserIds: [], invitedUserIds: [] };
      const memberIds = Array.from(
        new Set([...(creatorId ? [creatorId] : []), ...participation.goingUserIds])
      );
      const editorIds = item.isPrivate
        ? Array.from(
            new Set((workflow?.editorUserIds ?? (creatorId ? [creatorId] : [])).filter((userId) => memberIds.includes(userId)))
          )
        : [];
      const eligibleVoterCount = item.isPrivate ? editorIds.length : memberIds.length;
      const voteContextPopulation = eventGovernancePopulation(item, eligibleVoterCount);
      const quorumThresholdPercent = calculateGovernanceQuorum(voteContextPopulation).quorumThresholdPercent;
      const plans = (workflow?.eventPlans ?? []).map((plan) => ({
        id: plan.id,
        title: plan.title,
        description: plan.description?.trim() || plan.title,
        locationLabel: plan.locationLabel?.trim() || item.locationLabel,
        schedule: normalizeEventPlanSchedule(plan.schedule),
        overallApproval: buildProjectVoteSummary(
          plan.overallVotesByUserId,
          quorumThresholdPercent,
          voteContextPopulation
        )
      }));
      const winningPlan = [...plans]
        .filter((plan) => plan.overallApproval.meetsQuorum)
        .sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];
      const configuredPhaseId = workflow?.currentPhaseId ?? defaultEventCurrentPhaseId(item);
      const currentPhaseId =
        (configuredPhaseId === 'activity' || configuredPhaseId === 'closed') && !winningPlan
          ? ('event-plan' as EventLifecyclePhaseId)
          : configuredPhaseId;

      return {
        phaseTwo: {
          plans,
          winningPlanId: winningPlan?.id ?? null
        },
        currentPhaseId
      };
    })();
  const winningPlan = eventLifecycle.phaseTwo.plans.find(
    (plan) => plan.id === eventLifecycle.phaseTwo.winningPlanId
  );

  if (
    !winningPlan ||
    (eventLifecycle.currentPhaseId !== 'activity' && eventLifecycle.currentPhaseId !== 'closed')
  ) {
    return {
      title: item.title,
      description: item.description,
      scheduledAt: item.scheduledAt,
      timeLabel: item.timeLabel,
      locationLabel: item.locationLabel
    };
  }

  return {
    title: workflow?.liveTitleOverride ?? winningPlan.title,
    description: workflow?.liveDescriptionOverride ?? winningPlan.description,
    scheduledAt: eventPlanScheduledAt(winningPlan.schedule) ?? item.scheduledAt,
    timeLabel: winningPlan.schedule.label,
    locationLabel: winningPlan.locationLabel.trim() || item.locationLabel
  };
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
  const committedUsernames = uniqueUsernames(activity.roles.flatMap((role) => role.assignedUsernames));
  const committedCount = committedUsernames.length;
  const statusTone =
    committedCount >= minimumParticipants
      ? 'green'
      : committedUsernames.some((username) => username !== activity.authorUsername)
        ? 'yellow'
        : 'red';

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

function buildEventValues(slug: string): ProjectValueItem[] {
  const workflow = eventWorkflowStateBySlug[slug];
  const viewer = currentViewer();

  if (!workflow) {
    return [];
  }

  return (workflow.eventValues ?? [])
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

function buildEventValueAssessments(
  values: ProjectValueItem[],
  votesByValueId: Record<string, Record<string, ProjectApprovalVote>>,
  quorumThresholdPercent: number,
  eligibleVoterCount: number,
  includeDemandAssessment: boolean,
  authorUsername: string
) {
  return [
    ...(includeDemandAssessment
      ? [
          {
            valueId: demandSignalAssessmentValueId,
            valueLabel: 'Demand signal considered',
            ...buildProjectVoteSummary(
              votesByValueId[demandSignalAssessmentValueId] ?? defaultDemandVotesForAuthor(authorUsername),
              quorumThresholdPercent,
              eligibleVoterCount
            )
          }
        ]
      : []),
    ...values.map((value) => ({
      valueId: value.id,
      valueLabel: value.label,
      ...buildProjectVoteSummary(votesByValueId[value.id] ?? {}, quorumThresholdPercent, eligibleVoterCount)
    }))
  ] satisfies ProjectPlanValueAssessment[];
}

function buildEventPlanPhases(plan: RawEventPlan) {
  if (plan.planPhases?.length) {
    return plan.planPhases.map((phase, index) => ({
      ...phase,
      title: phase.title.trim() || `Stage ${index + 1}`
    })) satisfies EventPlanPhaseItem[];
  }

  return [
    {
      id: `${plan.id}-phase-1`,
      title: 'Stage 1',
      details: plan.description?.trim() || 'No stage details were recorded for this event plan.'
    }
  ] satisfies EventPlanPhaseItem[];
}

function formatEventPlanScheduleDate(date: string) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());

  if (!parts) {
    return date.trim();
  }

  const monthLabels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  return `${Number(parts[3])} ${monthLabels[Number(parts[2]) - 1]} ${parts[1]}`;
}

function formatEventPlanScheduleTime(time: string) {
  const parts = /^(\d{2}):(\d{2})$/.exec(time.trim());

  if (!parts) {
    return time.trim();
  }

  return `${Number(parts[1])}:${parts[2]}`;
}

function eventPlanScheduleBoundaryLabel(date: string, time: string) {
  const dateLabel = formatEventPlanScheduleDate(date);
  const timeLabel = time ? formatEventPlanScheduleTime(time) : '';

  return timeLabel ? `${timeLabel} ${dateLabel}` : dateLabel;
}

function normalizeEventPlanSchedule(schedule?: EventPlanScheduleInput | null): EventPlanSchedule {
  const startDate = schedule?.startDate?.trim() ?? '';
  const endDate = schedule?.endDate?.trim() ?? '';
  const startTimeLabel = schedule?.startTimeLabel?.trim() ?? '';
  const finishTimeLabel = schedule?.finishTimeLabel?.trim() ?? '';

  if (schedule?.mode === 'range' && startDate && endDate && endDate >= startDate) {
    return {
      mode: 'range',
      startDate,
      endDate,
      startTimeLabel: startTimeLabel || null,
      finishTimeLabel: finishTimeLabel || null,
      label: `${eventPlanScheduleBoundaryLabel(startDate, startTimeLabel)} - ${eventPlanScheduleBoundaryLabel(endDate, finishTimeLabel)}`
    };
  }

  if ((schedule?.mode === 'date' || schedule?.mode === 'range') && startDate) {
    return {
      mode: 'date',
      startDate,
      endDate: null,
      startTimeLabel: startTimeLabel || null,
      finishTimeLabel: finishTimeLabel || null,
      label:
        startTimeLabel || finishTimeLabel
          ? `${eventPlanScheduleBoundaryLabel(startDate, startTimeLabel)} - ${eventPlanScheduleBoundaryLabel(startDate, finishTimeLabel)}`
          : formatEventPlanScheduleDate(startDate)
    };
  }

  return {
    mode: 'any-day',
    startDate: null,
    endDate: null,
    startTimeLabel: startTimeLabel || null,
    finishTimeLabel: finishTimeLabel || null,
    label:
      startTimeLabel || finishTimeLabel
        ? `Any day · ${formatEventPlanScheduleTime(startTimeLabel)} - ${formatEventPlanScheduleTime(finishTimeLabel)}`
        : 'Any day'
  };
}

function buildEventPlans(
  slug: string,
  event: PublicEventItem,
  values: ProjectValueItem[],
  quorumThresholdPercent: number,
  eligibleVoterCount: number
) {
  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const plans = (workflow.eventPlans ?? []).map((plan) => ({
    id: plan.id,
    title: plan.title,
    authorUsername: plan.authorUsername,
    createdAt: plan.createdAt,
    description: plan.description?.trim() || plan.title,
    demandSignalSnapshot: event.isPrivate ? null : plan.demandSignalSnapshot ?? null,
    demandConsiderationNote:
      plan.demandConsiderationNote?.trim() || 'Legacy plan. No demand note was recorded when this plan was created.',
    locationLabel: plan.locationLabel?.trim() || 'Location will be set before activity begins.',
    schedule: normalizeEventPlanSchedule(plan.schedule),
    planPhases: buildEventPlanPhases(plan),
    valueAssessments: buildEventValueAssessments(
      values,
      plan.valueVotesByValueId,
      quorumThresholdPercent,
      eligibleVoterCount,
      !event.isPrivate,
      plan.authorUsername
    ),
    overallApproval: buildProjectVoteSummary(plan.overallVotesByUserId, quorumThresholdPercent, eligibleVoterCount),
    isLeading: false
  } satisfies EventPlan));
  const winningPlan = [...plans]
    .filter((plan) => plan.overallApproval.meetsQuorum)
    .sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];

  return {
    plans: plans.map((plan) => ({ ...plan, isLeading: plan.id === winningPlan?.id })),
    winningPlanId: winningPlan?.id ?? null
  };
}

function buildSelectableEventActivityPlanPhases(phaseTwo: { plans: EventPlan[]; winningPlanId: string | null }) {
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);

  return [
    ...(winningPlan?.planPhases.map((phase, index) => ({
      id: phase.id,
      label: `${winningPlan.title} · ${/^stage\s+\d+$/i.test(phase.title) ? phase.title : `Stage ${index + 1}: ${phase.title}`}`
    })) ?? [])
  ] satisfies ProjectActivityPlanPhaseOption[];
}

function buildEventActivityState(
  slug: string,
  selectablePlanPhases: ProjectActivityPlanPhaseOption[]
) {
  const event = findPublicEventItem(slug);
  const workflow = eventWorkflowStateBySlug[slug];
  const viewerUsername = currentViewer()?.username ?? null;
  const planPhaseLabelById = new Map(selectablePlanPhases.map((option) => [option.id, option.label]));

  if (!workflow || !event) {
    return {
      activities: [] as ProjectActivityItem[]
    };
  }

  const now = Date.now();
  const scheduledActivities = [...(workflow.eventActivities ?? [])]
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())
    .map((activity) => buildProjectActivityItemFromRaw(activity, planPhaseLabelById, viewerUsername));

  return {
    activities: scheduledActivities
      .filter((activity) => new Date(activity.endAt).getTime() >= now)
      .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
  };
}

function resolvedProjectSubtype(slug: string, subtype?: ProjectSubtype | null) {
  return subtype ?? seededProjectSubtypeBySlug[slug] ?? 'standard';
}

function currentProjectSubtypeForLifecycle(
  slug: string,
  phaseTwo: { plans: ProjectProductionPlan[]; winningPlanId: string | null }
) {
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);

  if (winningPlan) {
    return winningPlan.projectSubtype;
  }

  return seededProjectSubtypeBySlug[slug] ?? null;
}

function currentProjectSubtypeForGovernance(slug: string) {
  const memberCount = projectGovernancePopulation(slug, (projectMembersBySlug[slug] ?? []).length);
  const phaseTwo = buildProductionPlans(
    slug,
    buildProjectValues(slug),
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );

  return currentProjectSubtypeForLifecycle(slug, phaseTwo);
}

function usesPlatformPendingExecutionLifecycle(
  slug: string,
  projectMode: ProjectMode,
  currentSubtype: ProjectSubtype | null = currentProjectSubtypeForGovernance(slug)
) {
  return isPlatformTaggedProject(slug) && projectMode === 'productive' && currentSubtype === 'software';
}

function buildSoftwareDefaultDistributionPlan(
  slug: string,
  projectMode: ProjectMode,
  selectedSubtype: ProjectSubtype | null,
  phaseTwo: { plans: ProjectProductionPlan[]; winningPlanId: string | null }
) {
  if (selectedSubtype !== 'software') {
    return null;
  }

  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  const projectItem = findPublicProjectItem(slug);
  const repositoryUrl = resolvedSoftwareRepositoryUrl(slug, phaseTwo);

  return {
    id: `software-default-plan-${slug}`,
    title: projectMode === 'collective-service' ? 'Default software access plan' : 'Default software release plan',
    authorUsername: winningPlan?.authorUsername ?? projectItem?.authorUsername ?? 'system',
    createdAt: winningPlan?.createdAt ?? projectItem?.createdAt ?? '2026-01-01T00:00:00Z',
    description:
      'Software subtypes follow the default open-source path in this phase. The codebase stays publicly inspectable and the work remains shareable under AGPL-style rules.',
    repositoryUrl,
    demandSignalSnapshot: null,
    demandConsiderationNote:
      'Software proposals use the default open-source release path here, so no separate distribution or access vote is required in this mock.',
    totalCostLabel: 'No additional release gate',
    planPhases: [
      {
        id: `software-default-plan-${slug}-phase-1`,
        title: 'Open release',
        details:
          'The default software path keeps the repository visible and the released code available under AGPL-style terms.',
        materialsLabel: 'Repository + public issue history',
        costLabel: 'No extra gate'
      }
    ],
    distributionSummary:
      projectMode === 'collective-service'
        ? 'The software service stays available through the default open-source access rules.'
        : 'The software project ships through the default open-source release rules.',
    accessSummary:
      'Repository access, merge discussion, and release notes stay visible through the same public software surface.',
    reserveSummary: 'AGPL-style sharing is on by default in this mock phase.',
    requestSystemEnabled: false,
    requestMode: 'both' as const,
    allowOffScheduleRequests: false,
    valueAssessments: [],
    overallApproval: buildProjectVoteSummary({}, 0, 0),
    isLeading: true
  } satisfies ProjectDistributionPlan;
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

function availableAssetManagementServiceOptionsForProject(slug: string): ProjectLinkCandidate[] {
  return publicFeedBase.reduce<ProjectLinkCandidate[]>((options, item) => {
    if (item.kind !== 'project' || item.projectMode !== 'collective-service') {
      return options;
    }

    if (resolvedProjectSubtype(item.slug, item.projectSubtype ?? null) !== 'asset-management') {
      return options;
    }

    options.push({
      slug: item.slug,
      title: item.title,
      href: item.href
    });

    return options;
  }, []);
}

function acquisitionBundleDestinationLabel(bundle: RawProjectAcquisitionBundle) {
  if (bundle.destinationType === 'existing-service') {
    return (
      findPublicProjectItem(bundle.existingServiceProjectSlug ?? '')?.title ??
      'Existing asset-management service'
    );
  }

  return bundle.newServiceTitle?.trim() || 'New asset-management service';
}

function buildProjectAcquisitionPlanBundles(plan: RawProductionPlan): ProjectAcquisitionPlanBundle[] {
  return (plan.acquisitionBundles ?? []).map((bundle) => ({
    id: bundle.id,
    title: bundle.title,
    destinationType: bundle.destinationType,
    destinationLabel: acquisitionBundleDestinationLabel(bundle),
    existingServiceProjectSlug: bundle.existingServiceProjectSlug ?? null,
    newServiceTitle: bundle.newServiceTitle ?? null,
    note:
      bundle.note?.trim() ||
      (bundle.destinationType === 'existing-service'
        ? 'This bundle routes its resulting inventory into an existing asset-management service.'
        : 'This bundle creates a new asset-management service only after confirmed execution.')
  }));
}

function buildProjectAcquisitionPurchaseRows(plan: RawProductionPlan): ProjectAcquisitionPurchaseRow[] {
  const destinationLabelByBundleId = new Map(
    buildProjectAcquisitionPlanBundles(plan).map((bundle) => [bundle.id, bundle.destinationLabel])
  );

  return (plan.purchaseRows ?? []).map((purchaseRow) => ({
    id: purchaseRow.id,
    title: purchaseRow.title,
    costLabel: purchaseRow.costLabel,
    purchaseHref: purchaseRow.purchaseHref,
    destinationBundleId: purchaseRow.destinationBundleId,
    destinationLabel:
      destinationLabelByBundleId.get(purchaseRow.destinationBundleId) ?? 'Unassigned asset-management service',
    note:
      purchaseRow.note?.trim() ||
      'This purchase row becomes a pending asset entry during board execution and waits for member confirmation before going live.'
  }));
}

function canViewerEditProductionPlan(slug: string, plan: RawProductionPlan) {
  const viewer = currentViewer();
  const currentPhaseId = projectLifecycleBySlug[slug]?.currentPhaseId;
  const hasIntermediateStage = projectModeForSlug(slug) === 'productive';

  return (
    !!viewer &&
    hasIntermediateStage &&
    currentPhaseId === 'phase-3' &&
    plan.authorUsername === viewer.username
  );
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
    projectSubtype: resolvedProjectSubtype(slug, plan.projectSubtype),
    projectSubtypeLabel: projectSubtypeLabel(resolvedProjectSubtype(slug, plan.projectSubtype)),
    repositoryUrl: plan.repositoryUrl?.trim() || seededSoftwareRepositoryUrlByProjectSlug[slug] || null,
    demandSignalSnapshot: plan.demandSignalSnapshot ?? null,
    demandConsiderationNote:
      plan.demandConsiderationNote?.trim() || 'Legacy plan. No demand note was recorded when this plan was created.',
    planPhases: buildProductionPlanPhases(plan),
    outputSummary: plan.outputSummary,
    materialsSummary: plan.materialsSummary,
    totalCostLabel: plan.totalCostLabel,
    acquisitionsSummary: plan.acquisitionsSummary,
    acquisitionBundles: buildProjectAcquisitionPlanBundles(plan),
    purchaseRows: buildProjectAcquisitionPurchaseRows(plan),
    valueAssessments: buildProjectValueAssessments(
      values,
      plan.valueVotesByValueId,
      plan.valueVotesByValueId[demandSignalAssessmentValueId] ?? defaultDemandVotesForAuthor(plan.authorUsername),
      quorumThresholdPercent,
      memberCount
    ),
    overallApproval: buildProjectVoteSummary(plan.overallVotesByUserId, quorumThresholdPercent, memberCount),
    isLeading: false,
    viewerCanEdit: canViewerEditProductionPlan(slug, plan)
  }));
  const winningPlan = [...plans]
    .filter((plan) => plan.overallApproval.meetsQuorum)
    .sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];

  return {
    plans: plans.map((plan) => ({ ...plan, isLeading: plan.id === winningPlan?.id })),
    winningPlanId: winningPlan?.id ?? null
  };
}

function resolvedSoftwareRepositoryUrl(
  slug: string,
  phaseTwo: { plans: ProjectProductionPlan[]; winningPlanId: string | null }
) {
  const workflow = readProjectWorkflowState(slug);
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);

  return (
    workflow?.softwareRepositoryUrlOverride?.trim() ||
    winningPlan?.repositoryUrl?.trim() ||
    seededSoftwareRepositoryUrlByProjectSlug[slug] ||
    `https://code.social-production.example/projects/${slug}`
  );
}

function detailMemberFromUsername(username: string) {
  const user = userByUsername(username);

  if (user) {
    return toDetailMember(user.id);
  }

  return {
    id: `user-${username}`,
    username
  } satisfies DetailMember;
}

function projectMergeCapabilityChangeDecisionId(requestId: string) {
  return `${requestId}-decision`;
}

function projectRepositoryReplacementDecisionId(requestId: string) {
  return `${requestId}-decision`;
}

function resolvedProjectSoftwareMergeCapabilityUserIds(
  slug: string,
  phaseTwo: { plans: ProjectProductionPlan[]; winningPlanId: string | null }
) {
  if (isPlatformTaggedProject(slug)) {
    return buildPlatformBoardRoster().activeMembers.map((member) => member.id);
  }

  const workflow = readProjectWorkflowState(slug);
  const configuredUserIds = Array.from(new Set(workflow?.softwareMergeCapabilityUserIds ?? []));

  if (configuredUserIds.length > 0) {
    return configuredUserIds;
  }

  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  const defaultHolderId = winningPlan ? userByUsername(winningPlan.authorUsername)?.id ?? null : null;

  return defaultHolderId ? [defaultHolderId] : [];
}

function buildProjectSoftwareMergeCapabilityMembers(
  slug: string,
  phaseTwo: { plans: ProjectProductionPlan[]; winningPlanId: string | null }
) {
  const workflow = readProjectWorkflowState(slug);

  if (isPlatformTaggedProject(slug)) {
    return buildPlatformBoardRoster().activeMembers.map((member) => ({
      ...toDetailMember(member.id),
      sourceLabel: 'Platform board standing'
    }));
  }

  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  const defaultHolderId = winningPlan ? userByUsername(winningPlan.authorUsername)?.id ?? null : null;
  const configuredIds = workflow?.softwareMergeCapabilityUserIds ?? [];

  return resolvedProjectSoftwareMergeCapabilityUserIds(slug, phaseTwo).map((userId) => ({
    ...toDetailMember(userId),
    sourceLabel:
      configuredIds.length === 0 && defaultHolderId === userId
        ? 'Accepted plan author'
        : 'Merge capability vote'
  }));
}

function softwarePullRequestStageLabel(stage: RawProjectPullRequestRequest['stage']) {
  switch (stage) {
    case 'approval':
      return 'Approval vote';
    case 'awaiting-merge':
      return 'Awaiting merge record';
    case 'confirmation':
      return 'Merge confirmation vote';
    case 'rejected':
      return 'Rejected';
    case 'replaced':
      return 'Superseded by repository replacement';
    default:
      return 'Confirmed';
  }
}

function projectMergeCapabilityActionLabel(action: 'grant' | 'revoke') {
  return action === 'grant' ? 'Grant merge capability' : 'Revoke merge capability';
}

function projectPullRequestApprovalDecisionId(requestId: string) {
  return `${requestId}-approval`;
}

function projectPullRequestConfirmationDecisionId(requestId: string) {
  return `${requestId}-confirmation`;
}

function currentProjectPullRequestDecisionId(request: RawProjectPullRequestRequest) {
  switch (request.stage) {
    case 'approval':
      return projectPullRequestApprovalDecisionId(request.id);
    case 'confirmation':
      return projectPullRequestConfirmationDecisionId(request.id);
    default:
      return null;
  }
}

function buildProjectSoftwareGovernance(
  slug: string,
  projectMode: ProjectMode,
  currentSubtype: ProjectSubtype | null,
  phaseTwo: { plans: ProjectProductionPlan[]; winningPlanId: string | null },
  quorumThresholdPercent: number,
  memberCount: number
): ProjectSoftwareGovernanceData | null {
  if (currentSubtype !== 'software' || projectMode === 'personal-service' || !phaseTwo.winningPlanId) {
    return null;
  }

  const workflow = readProjectWorkflowState(slug);
  const repositoryUrl = resolvedSoftwareRepositoryUrl(slug, phaseTwo);
  const mergeCapabilityMembers = buildProjectSoftwareMergeCapabilityMembers(slug, phaseTwo);
  const mergeCapabilityMemberIds = new Set(mergeCapabilityMembers.map((member) => member.id));
  const viewer = currentViewer();
  const viewerCanRecordMerge =
    !!viewer && mergeCapabilityMembers.some((member) => member.id === viewer.id);
  const availableMergeCapabilityCandidates = isPlatformTaggedProject(slug)
    ? []
    : (projectMembersBySlug[slug] ?? [])
        .filter((userId) => !mergeCapabilityMemberIds.has(userId))
        .map((userId) => toDetailMember(userId));
  const pullRequests = [...(workflow?.softwarePullRequests ?? [])]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((request) => {
      const voteSummary =
        request.stage === 'approval' || request.stage === 'confirmation'
          ? buildProjectVoteSummary(request.votesByUserId, quorumThresholdPercent, memberCount)
          : null;

      return {
        id: request.id,
        decisionId: currentProjectPullRequestDecisionId(request),
        title: request.title,
        summary: request.summary,
        pullRequestId: request.pullRequestId,
        pullRequestUrl: request.pullRequestUrl,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        stage: request.stage,
        stageLabel: softwarePullRequestStageLabel(request.stage),
        mergeId: request.mergeId ?? null,
        mergedByUsername: request.mergedByUsername ?? null,
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: voteSummary ? phaseChangePassesApprovalThreshold(voteSummary) : false,
        canStillPass: voteSummary
          ? thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
          : true,
        viewerCanRecordMerge: viewerCanRecordMerge && request.stage === 'awaiting-merge'
      } satisfies ProjectSoftwarePullRequest;
    });
  const mergeCapabilityChangeRequests = [...(workflow?.softwareMergeCapabilityChangeRequests ?? [])]
    .filter((request) => request.status === 'open')
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        memberCount
      );

      return {
        id: request.id,
        decisionId: projectMergeCapabilityChangeDecisionId(request.id),
        action: request.action,
        actionLabel: projectMergeCapabilityActionLabel(request.action),
        targetMember: toDetailMember(request.targetUserId),
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies ProjectSoftwareMergeCapabilityChangeRequest;
    });
  const replaceablePullRequests = pullRequests
    .filter(
      (request): request is ProjectSoftwarePullRequest & ProjectSoftwareBlockedPullRequest =>
        request.stage === 'awaiting-merge' || request.stage === 'rejected'
    )
    .map((request) => ({
      id: request.id,
      title: request.title,
      pullRequestId: request.pullRequestId,
      stage: request.stage,
      stageLabel: request.stageLabel
    }));
  const repositoryReplacementRequests = [...(workflow?.softwareRepositoryReplacementRequests ?? [])]
    .filter((request) => request.status === 'open')
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((request) => {
      const voteSummary = buildProjectVoteSummary(
        request.votesByUserId,
        quorumThresholdPercent,
        memberCount
      );

      return {
        id: request.id,
        decisionId: projectRepositoryReplacementDecisionId(request.id),
        repositoryUrl: request.repositoryUrl,
        previousRepositoryUrl: request.previousRepositoryUrl,
        reason: request.reason,
        relatedPullRequestId: request.relatedPullRequestId,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
        voteSummary,
        passesApprovalThreshold: phaseChangePassesApprovalThreshold(voteSummary),
        canStillPass: thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)
      } satisfies ProjectSoftwareRepositoryReplacementRequest;
    });
  const repositoryHistory = [...(workflow?.softwareRepositoryHistory ?? [])]
    .sort((left, right) => new Date(right.replacedAt).getTime() - new Date(left.replacedAt).getTime())
    .map((record) => ({
      id: record.id,
      repositoryUrl: record.repositoryUrl,
      previousRepositoryUrl: record.previousRepositoryUrl,
      reason: record.reason,
      relatedPullRequestId: record.relatedPullRequestId,
      replacedAt: record.replacedAt,
      replacedByUsername: record.replacedByUsername
    } satisfies ProjectSoftwareRepositoryRecord));

  return {
    repositoryUrl,
    licenseLabel: 'AGPL v3 by default',
    mergeCapabilityMembers,
    availableMergeCapabilityCandidates,
    mergeCapabilityChangeRequests,
    repositoryReplacementRequests,
    replaceablePullRequests,
    repositoryHistory,
    pullRequests,
    viewerCanCreatePullRequests: canViewerEditProjectPhase(slug, 'phase-5'),
    viewerCanRequestMergeCapabilityChanges:
      !isPlatformTaggedProject(slug) && canViewerVoteOnProjectPullRequest(slug),
    viewerCanRequestRepositoryReplacement:
      replaceablePullRequests.length > 0 && canViewerVoteOnProjectPullRequest(slug)
  };
}

function buildDistributionPlans(
  slug: string,
  values: ProjectValueItem[],
  quorumThresholdPercent: number,
  memberCount: number,
  phaseTwo?: { plans: ProjectProductionPlan[]; winningPlanId: string | null }
) {
  const workflow = readProjectWorkflowState(slug);

  if (!workflow) {
    return {
      plans: [] as ProjectDistributionPlan[],
      winningPlanId: null as string | null
    };
  }

  const phaseTwoState =
    phaseTwo ?? buildProductionPlans(slug, values, quorumThresholdPercent, memberCount);
  const selectedSubtype = currentProjectSubtypeForLifecycle(slug, phaseTwoState);
  const projectMode = findPublicProjectItem(slug)?.projectMode ?? 'productive';

  if (selectedSubtype === 'software') {
    const defaultPlan = buildSoftwareDefaultDistributionPlan(
      slug,
      projectMode,
      selectedSubtype,
      phaseTwoState
    );

    return {
      plans: defaultPlan ? [defaultPlan] : [],
      winningPlanId: defaultPlan?.id ?? null
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

type DecisionHistoryLiveState = {
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
  canVote: boolean;
};

function projectLifecyclePhaseTitle(
  slug: string,
  projectMode: ProjectMode,
  phaseId: ProjectLifecyclePhaseId
) {
  return (
    projectLifecyclePhaseBlueprintsForProject(slug, projectMode).find((phase) => phase.id === phaseId)?.title ??
    phaseId
  );
}

function buildResolvedDecisionHistoryVoteSummary(entry: RawDecisionHistoryEntry) {
  if (!entry.finalVotesByUserId || entry.finalEligibleVoterCount == null) {
    return null;
  }

  return buildProjectVoteSummary(
    entry.finalVotesByUserId,
    calculateProjectQuorumThreshold(entry.finalEligibleVoterCount),
    entry.finalEligibleVoterCount
  );
}

function defaultEventCurrentPhaseId(event: PublicEventItem) {
  return event.isPrivate ? 'event-plan' : 'proposal';
}

function eventPhaseOrder(event: PublicEventItem, phaseId: EventLifecyclePhaseId) {
  if (event.isPrivate) {
    switch (phaseId) {
      case 'event-plan':
        return 1;
      case 'activity':
        return 2;
      case 'closed':
        return 3;
      default:
        return 0;
    }
  }

  switch (phaseId) {
    case 'proposal':
      return 1;
    case 'event-plan':
      return 2;
    case 'activity':
      return 3;
    case 'closed':
      return 4;
    default:
      return 0;
  }
}

function eventPhaseTitle(phaseId: EventLifecyclePhaseId) {
  switch (phaseId) {
    case 'proposal':
      return 'Proposal';
    case 'event-plan':
      return 'Event Plan';
    case 'activity':
      return 'Activity';
    default:
      return 'Closed';
  }
}

function isEventPhaseId(
  phaseId: ProjectLifecyclePhaseId | EventLifecyclePhaseId
): phaseId is EventLifecyclePhaseId {
  return (
    phaseId === 'proposal' ||
    phaseId === 'event-plan' ||
    phaseId === 'activity' ||
    phaseId === 'closed'
  );
}

function buildDecisionHistoryPayload(
  payload: RawDecisionHistoryPayload,
  projectMode: ProjectMode | null,
  projectSlug: string | null = null
): DecisionHistoryEntry['payload'] {
  switch (payload.type) {
    case 'phase-change':
      return {
        type: 'phase-change',
        changeKind: payload.changeKind,
        fromPhaseId: payload.fromPhaseId,
        fromPhaseLabel: projectMode && projectSlug
          ? projectLifecyclePhaseTitle(projectSlug, projectMode, payload.fromPhaseId as ProjectLifecyclePhaseId)
          : isEventPhaseId(payload.fromPhaseId)
            ? eventPhaseTitle(payload.fromPhaseId)
            : payload.fromPhaseId,
        toPhaseId: payload.toPhaseId,
        toPhaseLabel: projectMode && projectSlug
          ? projectLifecyclePhaseTitle(projectSlug, projectMode, payload.toPhaseId as ProjectLifecyclePhaseId)
          : isEventPhaseId(payload.toPhaseId)
            ? eventPhaseTitle(payload.toPhaseId)
            : payload.toPhaseId,
        reason: payload.reason,
        closeOutcome: payload.closeOutcome,
        conversionTarget: buildProjectConversionTarget(payload.conversionTarget)
      };
    case 'settings-change':
      return {
        type: 'settings-change',
        reason: payload.reason,
        previousSettings: buildProjectRequestSettingsHistorySnapshot(
          projectMode ?? 'collective-service',
          payload.previousSettings
        ),
        proposedSettings: buildProjectRequestSettingsHistorySnapshot(
          projectMode ?? 'collective-service',
          payload.proposedSettings
        )
      };
    case 'update':
      return {
        type: 'update',
        body: payload.body,
        appliedUpdateId: payload.appliedUpdateId ?? null
      };
    case 'pull-request':
      return {
        type: 'pull-request',
        title: payload.title,
        summary: payload.summary,
        pullRequestId: payload.pullRequestId,
        pullRequestUrl: payload.pullRequestUrl,
        mergeId: payload.mergeId ?? null,
        repositoryUrl: payload.repositoryUrl ?? null
      };
    case 'merge-capability':
      return {
        type: 'merge-capability',
        action: payload.action,
        actionLabel: projectMergeCapabilityActionLabel(payload.action),
        targetUsername: payload.targetUsername
      };
    case 'repository-replacement':
      return {
        type: 'repository-replacement',
        repositoryUrl: payload.repositoryUrl,
        previousRepositoryUrl: payload.previousRepositoryUrl ?? null,
        reason: payload.reason,
        relatedPullRequestId: payload.relatedPullRequestId ?? null
      };
    default:
      return {
        type: 'edit',
        changes: payload.changes
      };
  }
}

function buildDecisionHistoryEntryFromRecord(
  entry: RawDecisionHistoryEntry,
  openStateById: Map<string, DecisionHistoryLiveState>,
  projectMode: ProjectMode | null,
  projectSlug: string | null = null
) {
  const liveState = entry.status === 'open' ? openStateById.get(entry.id) ?? null : null;
  const voteSummary = liveState?.voteSummary ?? buildResolvedDecisionHistoryVoteSummary(entry);

  if (!voteSummary) {
    return null;
  }

  return {
    id: entry.id,
    entityKind: entry.entityKind,
    kind: entry.kind,
    kindLabel: decisionHistoryLabel(entry.kind, entry.payload),
    createdAt: entry.createdAt,
    authorUsername: entry.authorUsername,
    status: entry.status,
    approvalThresholdPercent: entry.approvalThresholdPercent,
    voteSummary,
    passesApprovalThreshold:
      liveState?.passesApprovalThreshold ?? phaseChangePassesApprovalThreshold(voteSummary),
    canStillPass:
      liveState?.canStillPass ?? thresholdVoteCanStillPass(voteSummary, entry.approvalThresholdPercent),
    canVote: liveState?.canVote ?? false,
    payload: buildDecisionHistoryPayload(entry.payload, projectMode, projectSlug)
  } satisfies DecisionHistoryEntry;
}

function buildProjectDecisionHistory(
  slug: string,
  lifecycle: ProjectLifecycleData,
  updateRequests: ProjectUpdateRequest[],
  editRequests: ProjectEditRequest[],
  viewerCanVoteOnUpdateRequests: boolean,
  viewerCanVoteOnEditRequests: boolean,
  softwareGovernance: ProjectSoftwareGovernanceData | null
) {
  const workflow = ensureProjectWorkflowState(slug);
  const projectMode = projectModeForSlug(slug);
  const openStateById = new Map<string, DecisionHistoryLiveState>();

  ensureProjectDecisionHistorySeeded(slug);

  for (const request of lifecycle.phaseChangeRequests) {
    openStateById.set(request.id, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: lifecycle.viewerCanVoteOnPhaseChanges
    });
  }

  for (const request of updateRequests) {
    openStateById.set(request.id, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: viewerCanVoteOnUpdateRequests
    });
  }

  for (const request of editRequests) {
    openStateById.set(request.id, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: viewerCanVoteOnEditRequests
    });
  }

  for (const request of lifecycle.requestSystem?.settingsChangeRequests ?? []) {
    openStateById.set(request.id, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: lifecycle.requestSystem?.viewerCanVoteOnSettingsChanges ?? false
    });
  }

  for (const request of softwareGovernance?.pullRequests ?? []) {
    if (!request.voteSummary || !request.decisionId) {
      continue;
    }

    openStateById.set(request.decisionId, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: canViewerVoteOnProjectPullRequest(slug)
    });
  }

  for (const request of softwareGovernance?.mergeCapabilityChangeRequests ?? []) {
    if (!request.voteSummary) {
      continue;
    }

    openStateById.set(request.decisionId, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: canViewerVoteOnProjectPullRequest(slug)
    });
  }

  for (const request of softwareGovernance?.repositoryReplacementRequests ?? []) {
    if (!request.voteSummary) {
      continue;
    }

    openStateById.set(request.decisionId, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: canViewerVoteOnProjectPullRequest(slug)
    });
  }

  return [...(workflow.decisionHistory ?? [])]
    .map((entry) => buildDecisionHistoryEntryFromRecord(entry, openStateById, projectMode, slug))
    .filter((entry): entry is DecisionHistoryEntry => !!entry)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function buildEventDecisionHistory(
  slug: string,
  creatorId: string | null,
  lifecycle: EventLifecycleData,
  updateRequests: EventUpdateRequest[],
  editRequests: EventEditRequest[],
  viewerCanVoteOnUpdateRequests: boolean,
  viewerCanVoteOnEditRequests: boolean
) {
  const workflow = ensureEventWorkflowState(slug, creatorId);
  const openStateById = new Map<string, DecisionHistoryLiveState>();

  ensureEventDecisionHistorySeeded(slug, creatorId);

  for (const request of lifecycle.phaseChangeRequests) {
    openStateById.set(request.id, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: lifecycle.viewerCanVoteOnPhaseChanges
    });
  }

  for (const request of updateRequests) {
    openStateById.set(request.id, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: viewerCanVoteOnUpdateRequests
    });
  }

  for (const request of editRequests) {
    openStateById.set(request.id, {
      voteSummary: request.voteSummary,
      passesApprovalThreshold: request.passesApprovalThreshold,
      canStillPass: request.canStillPass,
      canVote: viewerCanVoteOnEditRequests
    });
  }

  return [...(workflow.decisionHistory ?? [])]
    .map((entry) => buildDecisionHistoryEntryFromRecord(entry, openStateById, null, null))
    .filter((entry): entry is DecisionHistoryEntry => !!entry)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
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
  return calculateGovernanceQuorum(memberCount).quorumThresholdPercent;
}

function recordMeaningfulAction(userId: string) {
  lastMeaningfulActionAtByUserId[userId] = new Date().toISOString();
  persistClientState();
}

function platformWeeklyActiveUserIds() {
  const now = Date.now();

  return users
    .map((user) => user.id)
    .filter((userId) => {
      const lastActionAt = lastMeaningfulActionAtByUserId[userId];

      if (!lastActionAt) {
        return false;
      }

      return now - new Date(lastActionAt).getTime() <= WEEKLY_ACTIVE_WINDOW_MS;
    });
}

function platformWeeklyActiveUserCount() {
  return platformWeeklyActiveUserIds().length;
}

function projectGovernancePopulation(slug: string, memberCount: number) {
  return isPlatformTaggedProject(slug) ? platformWeeklyActiveUserCount() : memberCount;
}

function projectVoteContextLabel(slug: string) {
  return isPlatformTaggedProject(slug) ? 'weekly active users' : 'project members';
}

function buildProjectSignalSummary(slug: string): GovernanceSignalSummary | null {
  const workflow = readProjectWorkflowState(slug);
  const viewer = currentViewer();

  if (!workflow || !supportsProjectDemandSignals(projectModeForSlug(slug))) {
    return null;
  }

  const demandUserIds = uniqueUserIds(workflow.signalUserIds);
  const oppositionUserIds = uniqueUserIds(workflow.oppositionSignalUserIds ?? []);
  const demandCount = Math.max(workflow.signalCount, demandUserIds.length);
  const oppositionCount = Math.max(workflow.oppositionSignalCount ?? 0, oppositionUserIds.length);
  const totalCount = demandCount + oppositionCount;
  const signalRatioPercent = totalCount === 0 ? 0 : Math.round((demandCount / totalCount) * 100);
  const voteContextPopulation = projectGovernancePopulation(slug, buildProjectMemberState(slug).memberCount);
  const requiredDemandCount = isPlatformTaggedProject(slug)
    ? calculateRequiredVotes(voteContextPopulation)
    : 0;
  const viewerSignal = viewer
    ? demandUserIds.includes(viewer.id)
      ? 'demand'
      : oppositionUserIds.includes(viewer.id)
        ? 'opposition'
        : null
    : null;
  const ratioRequirementMet = totalCount > 0 && demandCount / totalCount > 0.66;
  const demandRequirementMet = requiredDemandCount === 0 || demandCount >= requiredDemandCount;

  return {
    demandCount,
    oppositionCount,
    totalCount,
    viewerSignal,
    signalRatioPercent,
    ratioRequirementMet,
    requiredDemandCount,
    demandRequirementMet,
    advancementUnlocked: ratioRequirementMet && demandRequirementMet,
    usesPlatformVoteContext: isPlatformTaggedProject(slug),
    voteContextLabel: projectVoteContextLabel(slug),
    voteContextPopulation
  };
}

function isPlatformTaggedEvent(subject: string | PublicEventItem) {
  const event = typeof subject === 'string' ? findPublicEventItem(subject) : subject;

  return !!event && event.channelTags.some((tag) => tag.slug === platform.slug);
}

function eventVoteContextLabel(event: PublicEventItem) {
  if (isPlatformTaggedEvent(event)) {
    return 'weekly active users';
  }

  return event.isPrivate ? 'event editors' : 'event members';
}

function eventGovernancePopulation(event: PublicEventItem, eligibleVoterCount: number) {
  return isPlatformTaggedEvent(event) ? platformWeeklyActiveUserCount() : eligibleVoterCount;
}

function eventNextPhaseId(
  event: PublicEventItem,
  currentPhaseId: EventLifecyclePhaseId
): EventLifecyclePhaseId | null {
  if (event.isPrivate) {
    switch (currentPhaseId) {
      case 'event-plan':
        return 'activity';
      case 'activity':
        return 'closed';
      default:
        return null;
    }
  }

  switch (currentPhaseId) {
    case 'proposal':
      return 'event-plan';
    case 'event-plan':
      return 'activity';
    case 'activity':
      return 'closed';
    default:
      return null;
  }
}

function revertableEventPhaseIds(
  event: PublicEventItem,
  currentPhaseId: EventLifecyclePhaseId
) {
  if (event.isPrivate) {
    if (currentPhaseId === 'activity' || currentPhaseId === 'closed') {
      return ['event-plan'] as EventLifecyclePhaseId[];
    }

    return [] as EventLifecyclePhaseId[];
  }

  if (currentPhaseId === 'event-plan') {
    return ['proposal'] as EventLifecyclePhaseId[];
  }

  if (currentPhaseId === 'activity' || currentPhaseId === 'closed') {
    return ['proposal', 'event-plan'] as EventLifecyclePhaseId[];
  }

  return [] as EventLifecyclePhaseId[];
}

function eventPreviousPhaseId(
  event: PublicEventItem,
  currentPhaseId: EventLifecyclePhaseId
): EventLifecyclePhaseId | null {
  const revertablePhaseIds = revertableEventPhaseIds(event, currentPhaseId);

  return revertablePhaseIds[revertablePhaseIds.length - 1] ?? null;
}

function requestableEventPhaseTargetIds(
  event: PublicEventItem,
  currentPhaseId: EventLifecyclePhaseId
) {
  const nextPhaseId = eventNextPhaseId(event, currentPhaseId);
  const revertablePhaseIds = revertableEventPhaseIds(event, currentPhaseId);

  return [...(nextPhaseId ? [nextPhaseId] : []), ...revertablePhaseIds];
}

function eventPhaseChangeKind(
  event: PublicEventItem,
  fromPhaseId: EventLifecyclePhaseId,
  toPhaseId: EventLifecyclePhaseId
) {
  const fromOrder = eventPhaseOrder(event, fromPhaseId);
  const toOrder = eventPhaseOrder(event, toPhaseId);

  if (toPhaseId === 'closed' && toOrder > fromOrder) {
    return 'close';
  }

  return toOrder > fromOrder ? 'advance' : 'return';
}

function buildEventSignalSummary(event: PublicEventItem): GovernanceSignalSummary | null {
  if (event.isPrivate) {
    return null;
  }

  const creatorId = userByUsername(event.createdByUsername)?.id ?? null;
  const workflow = ensureEventWorkflowState(event.slug, creatorId);
  const viewer = currentViewer();
  const demandUserIds = uniqueUserIds(workflow.signalUserIds ?? []);
  const oppositionUserIds = uniqueUserIds(workflow.oppositionSignalUserIds ?? []);
  const demandCount = Math.max(workflow.signalCount ?? 0, demandUserIds.length);
  const oppositionCount = Math.max(workflow.oppositionSignalCount ?? 0, oppositionUserIds.length);
  const totalCount = demandCount + oppositionCount;
  const memberState = buildEventMemberState(event);
  const voteContextPopulation = eventGovernancePopulation(event, memberState.eligibleVoterCount);
  const requiredDemandCount = isPlatformTaggedEvent(event)
    ? calculateRequiredVotes(voteContextPopulation)
    : 0;
  const viewerSignal = viewer
    ? demandUserIds.includes(viewer.id)
      ? 'demand'
      : oppositionUserIds.includes(viewer.id)
        ? 'opposition'
        : null
    : null;
  const ratioRequirementMet = totalCount > 0 && demandCount / totalCount > 0.66;
  const demandRequirementMet = requiredDemandCount === 0 || demandCount >= requiredDemandCount;

  return {
    demandCount,
    oppositionCount,
    totalCount,
    viewerSignal,
    signalRatioPercent: totalCount === 0 ? 0 : Math.round((demandCount / totalCount) * 100),
    ratioRequirementMet,
    requiredDemandCount,
    demandRequirementMet,
    advancementUnlocked: ratioRequirementMet && demandRequirementMet,
    usesPlatformVoteContext: isPlatformTaggedEvent(event),
    voteContextLabel: eventVoteContextLabel(event),
    voteContextPopulation
  };
}

function eventPhaseBlueprintsForItem(
  event: PublicEventItem,
  currentPhaseId: EventLifecyclePhaseId
): EventLifecyclePhase[] {
  const publicBlueprints = [
    {
      id: 'proposal',
      order: 1,
      shortLabel: 'Proposal',
      title: 'Proposal',
      summary: 'Demand, opposition, and member-ranked values decide whether the event should move into planning.',
      mechanics: [
        'Demand and opposition stay visible throughout the event lifecycle.',
        'Members can add proposal values and rank their importance during proposal.',
        'Planning only opens after support is high enough and members vote to advance.'
      ],
      eventStatus:
        'This event is still in proposal and needs enough support to open its shared event plan phase.'
    },
    {
      id: 'event-plan',
      order: 2,
      shortLabel: 'Plan',
      title: 'Event Plan',
      summary:
        'Members submit event plans, vote on how well each plan satisfies proposal demand and values, and select the plan that should run.',
      mechanics: [
        'Any event member can submit a plan during the planning phase.',
        'Members can approve more than one plan and vote on how well each plan satisfies the proposal values.',
        'When a plan clears approval and quorum, members can vote to advance into activity.'
      ],
      eventStatus:
        'This event is in its planning phase. An accepted plan becomes the live event title and description when activity opens.'
    },
    {
      id: 'activity',
      order: 3,
      shortLabel: 'Activity',
      title: 'Activity',
      summary:
        'The accepted plan is now live, and members can schedule multiple concrete activities with role minimums on the shared calendar.',
      mechanics: [
        'The accepted event plan becomes the live event framing for the activity phase.',
        'Members can schedule multiple activities that map back to stages in the accepted plan.',
        'Each activity can define role minimums so members can coordinate what is needed.'
      ],
      eventStatus:
        'This event is active. The accepted event plan is live, and activities can be scheduled directly from it.'
    },
    {
      id: 'closed',
      order: 4,
      shortLabel: 'Closed',
      title: 'Closed',
      summary: 'The event stays visible as history after it closes.',
      mechanics: [
        'Closed events remain visible with their plan, activities, and decision history.',
        'No new lifecycle work opens once the event is closed.'
      ],
      eventStatus: 'This event is closed and kept as part of the event record.'
    }
  ] as const;
  const privateBlueprints = [
    {
      id: 'event-plan',
      order: 1,
      shortLabel: 'Plan',
      title: 'Event Plan',
      summary:
        'The creator and any granted editors shape the private event plan before the event runs or closes.',
      mechanics: [
        'Private events do not use public proposal signalling.',
        'The creator can grant editor access so planning work can be shared deliberately.',
        'The accepted plan becomes the live event framing when the private event is active.'
      ],
      eventStatus:
        'This private event is in planning. The creator and invited editors control the event plan.'
    },
    {
      id: 'activity',
      order: 2,
      shortLabel: 'Activity',
      title: 'Activity',
      summary:
        'The private event plan is live, and activities can be scheduled directly from the agreed plan.',
      mechanics: [
        'Private-event activities can still be broken into multiple scheduled pieces.',
        'Role minimums stay visible so invited members know what participation is needed.',
        'The creator keeps control of private-event lifecycle decisions.'
      ],
      eventStatus:
        'This private event is active. The accepted plan is live and activities can be scheduled from it.'
    },
    {
      id: 'closed',
      order: 3,
      shortLabel: 'Closed',
      title: 'Closed',
      summary: 'The private event stays visible as a record after it closes.',
      mechanics: [
        'Closed private events keep their plan, activities, and history visible to the permitted audience.',
        'No new lifecycle work opens once the event is closed.'
      ],
      eventStatus: 'This private event is closed and preserved as part of the event record.'
    }
  ] as const;
  const blueprints = event.isPrivate ? privateBlueprints : publicBlueprints;
  const currentOrder = blueprints.find((phase) => phase.id === currentPhaseId)?.order ?? 1;

  return blueprints.map((phase) => ({
    ...phase,
    mechanics: [...phase.mechanics],
    progressState:
      phase.id === currentPhaseId ? 'current' : phase.order < currentOrder ? 'complete' : 'upcoming'
  }));
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
  quorumVotesRequired: number,
  voteContextPopulation: number,
  voteContextLabel: string,
  requestSystemEnabled: boolean,
  usesPlatformLifecycle: boolean,
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
      title: `Current quorum: ${quorumVotesRequired} ${quorumVotesRequired === 1 ? 'vote' : 'votes'} required`,
      body:
        voteContextPopulation <= 0
          ? `No eligible ${voteContextLabel} are recorded yet, so quorum will start counting once someone becomes active in this vote context.`
          : `This now follows the governance formula from governance-rules.md and currently requires ${quorumVotesRequired} of ${voteContextPopulation} eligible ${voteContextLabel} to cast a vote before a result is valid.`
      },
      {
        title: `Phase changes need ${phaseChangeApprovalThresholdPercent}% approval`,
        body: 'Any eligible participant can request a phase change, but the request only executes once quorum is met and the approval rating reaches the required threshold.'
    },
    ...(projectMode === 'collective-service'
      ? [
          {
            title: usesPlatformLifecycle
              ? 'Activity requests stay governed'
              : requestSystemEnabled
                ? 'Requests are enabled'
                : 'Requests are optional',
            body: usesPlatformLifecycle
              ? 'Platform collective services use governed in-activity requests here instead of the old member-managed booking flow.'
              : requestSystemEnabled
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
  const personalServiceRequestModeValue =
    projectMode === 'personal-service' ? personalServiceRequestMode(slug) : 'calendar';
  const personalServiceCalendarMode =
    projectMode === 'personal-service' && personalServiceRequestModeValue !== 'direct';
  const supportsDemandSignals = supportsProjectDemandSignals(projectMode);
  const supportsPlanning = supportsProjectPlanning(projectMode);
  const values = buildProjectValues(slug);
  const voteContextPopulation = projectGovernancePopulation(slug, memberCount);
  const voteContextLabel = projectVoteContextLabel(slug);
  const quorum = supportsPlanning
    ? calculateGovernanceQuorum(voteContextPopulation)
    : { quorumThresholdPercent: 0, votesRequired: 0 };
  const quorumThresholdPercent = quorum.quorumThresholdPercent;
  const quorumVotesRequired = quorum.votesRequired;
  const memberState = buildProjectMemberState(slug);
  const signalSummary = buildProjectSignalSummary(slug);
  const phaseTwo = supportsPlanning
    ? buildProductionPlans(slug, values, quorumThresholdPercent, voteContextPopulation)
    : { plans: [] as ProjectProductionPlan[], winningPlanId: null as string | null };
  const currentSubtype = currentProjectSubtypeForLifecycle(slug, phaseTwo);
  const currentSubtypeLabel = currentSubtype ? projectSubtypeLabel(currentSubtype) : null;
  const projectItem = findPublicProjectItem(slug);
  const usesPlatformLifecycle = usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype);
  const phaseThree = supportsPlanning
    ? usesPlatformLifecycle
      ? { plans: [] as ProjectDistributionPlan[], winningPlanId: null as string | null }
      : buildDistributionPlans(slug, values, quorumThresholdPercent, voteContextPopulation, phaseTwo)
    : { plans: [] as ProjectDistributionPlan[], winningPlanId: null as string | null };
  const phaseBlueprints =
    projectMode === 'personal-service'
      ? personalServicePhaseBlueprintsForRequestMode(personalServiceRequestModeValue)
      : projectLifecyclePhaseBlueprintsForProject(slug, projectMode, currentSubtype);
  const normalizedCurrentPhaseId = (() => {
    if (projectMode === 'personal-service') {
      return config.currentPhaseId;
    }

    if (usesPlatformLifecycle && (config.currentPhaseId === 'phase-3' || config.currentPhaseId === 'phase-4')) {
      return phaseTwo.winningPlanId ? ('phase-5' as ProjectLifecyclePhaseId) : ('phase-2' as ProjectLifecyclePhaseId);
    }

    const currentOrder = phaseOrderForProjectSlug(slug, projectMode, config.currentPhaseId);
    const phaseTwoOrder = phaseOrderForProjectSlug(slug, projectMode, 'phase-2');
    const phaseThreeOrder = phaseOrderForProjectSlug(slug, projectMode, 'phase-3');

    if (currentOrder > phaseTwoOrder && phaseTwoOrder > 0 && !phaseTwo.winningPlanId) {
      return 'phase-2' as ProjectLifecyclePhaseId;
    }

    if (
      phaseThreeOrder > 0 &&
      currentOrder > phaseThreeOrder &&
      !usesPlatformLifecycle &&
      !phaseThree.winningPlanId
    ) {
      return 'phase-3' as ProjectLifecyclePhaseId;
    }

    return config.currentPhaseId;
  })();
  config.currentPhaseId = normalizedCurrentPhaseId;
  const currentPhaseOrder =
    phaseBlueprints.find((phase) => phase.id === config.currentPhaseId)?.order ?? 1;
  const nextPhaseId = nextProjectPhaseIdForSlug(slug, config.currentPhaseId, projectMode, currentSubtype);
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
  const softwareGovernance = buildProjectSoftwareGovernance(
    slug,
    projectMode,
    currentSubtype,
    phaseTwo,
    quorumThresholdPercent,
    voteContextPopulation
  );
  const revertablePhaseIds = revertableProjectPhaseIdsForSlug(slug, projectMode, config.currentPhaseId);
  const phaseChangeRequests = buildProjectPhaseChangeRequests(
    slug,
    projectMode,
    config.currentPhaseId,
    phaseBlueprints,
    quorumThresholdPercent,
    voteContextPopulation
  );
  const viewerCanRequestPhaseChanges =
    projectMode !== 'personal-service' &&
    canViewerRequestProjectPhaseChange(slug) &&
    requestableProjectPhaseTargetIdsForSlug(slug, config.currentPhaseId, projectMode).length > 0;
  const viewerCanVoteOnPhaseChanges =
    projectMode !== 'personal-service' && canViewerVoteOnProjectPhaseChange(slug);
  const canAdvancePhaseNow = nextPhaseId ? canAdvanceMockProjectPhaseNow(slug, projectMode) : false;
  const phaseFour = projectItem
    ? buildProjectPhaseFourPreview(
        slug,
        projectItem,
        currentSubtype,
        phaseTwo,
        quorumThresholdPercent,
        voteContextPopulation
      )
    : null;

  return {
    projectMode,
    currentSubtype,
    currentSubtypeLabel,
    usesPlatformLifecycle,
    supportsDemandSignals,
    supportsPlanning,
    currentPhaseId: config.currentPhaseId,
    quorumThresholdPercent,
    quorumVotesRequired,
    voteContextLabel,
    voteContextPopulation,
    notes: buildProjectLifecycleNotes(
      projectMode,
      quorumVotesRequired,
      voteContextPopulation,
      voteContextLabel,
      requestSystemEnabled,
      usesPlatformLifecycle,
      personalServiceRequestModeValue
    ),
    viewerCanRequestPhaseChanges,
    viewerCanVoteOnPhaseChanges,
    phaseChangeRequests,
    viewerCanAdvancePhase:
      projectMode === 'personal-service' &&
      memberState.viewerIsMember &&
      !!nextPhaseId &&
      canAdvancePhaseNow,
    nextPhaseId,
    nextPhaseLabel: nextPhaseId
      ? phaseBlueprints.find((phase) => phase.id === nextPhaseId)?.title ?? null
      : null,
    viewerCanRevertPhase:
      projectMode === 'personal-service' &&
      memberState.viewerIsMember &&
      revertablePhaseIds.length > 0,
    revertablePhaseIds,
    revertHistory: buildProjectRevertHistory(slug),
    requestSystem,
    personalService,
    phaseOne: {
      values,
      viewerCanSignalDemand: supportsDemandSignals && !!viewer,
      viewerHasDemandSignal: supportsDemandSignals && !!viewer && !!workflow?.signalUserIds.includes(viewer.id),
      viewerCanSignalOpposition: supportsDemandSignals && !!viewer,
      viewerHasOppositionSignal:
        supportsDemandSignals && !!viewer && !!workflow?.oppositionSignalUserIds?.includes(viewer.id),
      signalSummary,
      viewerCanAddValue: supportsPlanning && canViewerEditProjectPhase(slug, 'phase-1'),
      viewerCanVoteOnValues: supportsPlanning && canViewerEditProjectPhase(slug, 'phase-1'),
      availabilitySummary: personalService?.availabilitySummary,
      travelRadiusLabel: personalService?.travelRadiusLabel
    },
    phaseTwo: {
      plans: phaseTwo.plans,
      winningPlanId: phaseTwo.winningPlanId,
      viewerCanSubmitPlans: supportsPlanning && canViewerEditProjectPhase(slug, 'phase-2'),
      viewerCanVoteOnPlans: supportsPlanning && canViewerEditProjectPhase(slug, 'phase-2'),
      availableAssetManagementServices: availableAssetManagementServiceOptionsForProject(slug)
    },
    phaseThree: {
      plans: phaseThree.plans,
      winningPlanId: phaseThree.winningPlanId,
      viewerCanSubmitPlans:
        supportsPlanning &&
        !usesPlatformLifecycle &&
        currentSubtype !== 'software' &&
        canViewerEditProjectPhase(slug, 'phase-3'),
      viewerCanVoteOnPlans:
        supportsPlanning &&
        !usesPlatformLifecycle &&
        currentSubtype !== 'software' &&
        canViewerEditProjectPhase(slug, 'phase-3'),
      requestSystemEnabled
    },
    phaseFour,
    phaseFive: {
      activities: phaseFiveState.activities,
      history: phaseFiveState.history,
      viewerCanCreateActivities: canViewerCreateProjectActivity(slug),
      selectablePlanPhases,
      softwareGovernance
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

type ProjectDetailExtra = {
  overview: string;
  updates: DetailUpdate[];
  discussionNote: string;
  discussion: DetailComment[];
};

const projectDetailExtras: Record<string, ProjectDetailExtra> = {
  ...explicitAssetServiceProjectDetailExtras,
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

type ConfidenceVoteLedger = {
  votesByUserId: Record<string, VoteDirection>;
};

const voteState = new Map<string, { voteCount: number; activeVote: VoteDirection }>();
const confidenceState = new Map<string, ConfidenceVoteLedger>();

function seedVoteTarget(id: string, voteCount: number, activeVote: VoteDirection) {
  voteState.set(id, { voteCount, activeVote });
}

function createSyntheticConfidenceVoterId(targetId: string, direction: string, index: number) {
  return `confidence-voter-${targetId}-${direction}-${index}`;
}

function setSyntheticConfidenceVoterLastActiveAt(userId: string, lastActiveAt: string) {
  syntheticConfidenceVoteLastActiveAtByUserId[userId] = lastActiveAt;
}

function lastConfidenceVoterActionAt(userId: string) {
  return lastMeaningfulActionAtByUserId[userId] ?? syntheticConfidenceVoteLastActiveAtByUserId[userId] ?? null;
}

function isConfidenceVoteCounted(userId: string) {
  const lastActionAt = lastConfidenceVoterActionAt(userId);

  if (!lastActionAt) {
    return false;
  }

  return Date.now() - new Date(lastActionAt).getTime() < BOARD_STANDING_VOTE_CLEAR_WINDOW_MS;
}

function setConfidenceVotes(targetId: string, votesByUserId: Record<string, VoteDirection>) {
  confidenceState.set(targetId, { votesByUserId });

  const viewer = currentViewer();
  let upVotes = 0;
  let downVotes = 0;

  for (const [userId, vote] of Object.entries(votesByUserId)) {
    if (!isConfidenceVoteCounted(userId)) {
      continue;
    }

    if (vote === 1) {
      upVotes += 1;
    } else if (vote === -1) {
      downVotes += 1;
    }
  }

  seedVoteTarget(targetId, upVotes - downVotes, viewer ? votesByUserId[viewer.id] ?? 0 : 0);
}

function seedConfidenceTarget(
  id: string,
  upVotes: number,
  downVotes: number,
  activeVote: VoteDirection
) {
  const votesByUserId: Record<string, VoteDirection> = {};
  let remainingUpVotes = upVotes;
  let remainingDownVotes = downVotes;

  if (activeVote === 1) {
    votesByUserId['viewer-1'] = 1;
    remainingUpVotes = Math.max(0, remainingUpVotes - 1);
  } else if (activeVote === -1) {
    votesByUserId['viewer-1'] = -1;
    remainingDownVotes = Math.max(0, remainingDownVotes - 1);
  }

  for (let index = 0; index < remainingUpVotes; index += 1) {
    const voterId = createSyntheticConfidenceVoterId(id, 'yes', index);
    votesByUserId[voterId] = 1;
    setSyntheticConfidenceVoterLastActiveAt(voterId, isoDaysAgo(30));
  }

  for (let index = 0; index < remainingDownVotes; index += 1) {
    const voterId = createSyntheticConfidenceVoterId(id, 'no', index);
    votesByUserId[voterId] = -1;
    setSyntheticConfidenceVoterLastActiveAt(voterId, isoDaysAgo(30));
  }

  setConfidenceVotes(id, votesByUserId);
}

function seedBoardConfidenceTarget(
  id: string,
  seed: {
    activeYesUserIds: string[];
    activeNoUserIds: string[];
    archivedYesCount: number;
    archivedNoCount: number;
  }
) {
  const votesByUserId: Record<string, VoteDirection> = {};

  for (const userId of seed.activeYesUserIds) {
    votesByUserId[userId] = 1;
  }

  for (const userId of seed.activeNoUserIds) {
    votesByUserId[userId] = -1;
  }

  for (let index = 0; index < seed.archivedYesCount; index += 1) {
    const voterId = createSyntheticConfidenceVoterId(id, 'yes-archived', index);
    votesByUserId[voterId] = 1;
    setSyntheticConfidenceVoterLastActiveAt(voterId, isoDaysAgo(140));
  }

  for (let index = 0; index < seed.archivedNoCount; index += 1) {
    const voterId = createSyntheticConfidenceVoterId(id, 'no-archived', index);
    votesByUserId[voterId] = -1;
    setSyntheticConfidenceVoterLastActiveAt(voterId, isoDaysAgo(140));
  }

  setConfidenceVotes(id, votesByUserId);
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

seedBoardConfidenceTarget(ensurePlatformBoardConfidenceTargetId('user-mika'), {
  activeYesUserIds: ['viewer-1', 'user-rowan', 'user-tool', 'user-mika'],
  activeNoUserIds: ['user-ember'],
  archivedYesCount: 17,
  archivedNoCount: 4
});

seedBoardConfidenceTarget(ensurePlatformBoardConfidenceTargetId('user-ember'), {
  activeYesUserIds: ['viewer-1', 'user-rowan', 'user-ember'],
  activeNoUserIds: ['user-tool'],
  archivedYesCount: 14,
  archivedNoCount: 5
});

seedBoardConfidenceTarget(ensurePlatformBoardConfidenceTargetId('user-rowan'), {
  activeYesUserIds: ['viewer-1', 'user-tool'],
  activeNoUserIds: ['user-mika'],
  archivedYesCount: 6,
  archivedNoCount: 2
});

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
        body: 'You joined the event, and toolorbit confirmed the snack table and swap table are set.',
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

function viewerHasEventScopeAccess(
  item: Pick<PublicEventItem, 'channelTags' | 'communityTags'>,
  viewerId: string
) {
  return scopeLabelsForViewer(item, viewerId).length > 0;
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

function ensurePlatformBoardConfidenceTargetId(userId: string) {
  const existing = platformBoardState.confidenceTargetIdsByUserId[userId];

  if (existing) {
    return existing;
  }

  const targetId = `confidence-stewardship-${userId}`;
  platformBoardState.confidenceTargetIdsByUserId[userId] = targetId;

  if (!confidenceState.has(targetId)) {
    setConfidenceVotes(targetId, {});
  }

  if (!voteState.has(targetId)) {
    seedVoteTarget(targetId, 0, 0);
  }

  return targetId;
}

function platformBoardMemberUserIds() {
  return readScopeMembership('platform', platform.slug).memberIds;
}

function platformBoardConfidenceTargetUserId(targetId: string) {
  const directMatch = Object.entries(platformBoardState.confidenceTargetIdsByUserId).find(
    ([, candidateTargetId]) => candidateTargetId === targetId
  );

  if (directMatch) {
    return directMatch[0];
  }

  for (const userId of platformBoardMemberUserIds()) {
    if (ensurePlatformBoardConfidenceTargetId(userId) === targetId) {
      return userId;
    }
  }

  return null;
}

function isPlatformBoardConfidenceTarget(targetId: string) {
  return platformBoardConfidenceTargetUserId(targetId) !== null;
}

function buildConfidenceVoteSnapshot(confidenceTargetId?: string) {
  const confidence = confidenceTargetId ? readConfidenceTarget(confidenceTargetId) : null;
  const viewer = currentViewer();

  if (!confidenceTargetId || !confidence) {
    return null;
  }

  let upVotes = 0;
  let downVotes = 0;

  for (const [userId, vote] of Object.entries(confidence.votesByUserId)) {
    if (!isConfidenceVoteCounted(userId)) {
      continue;
    }

    if (vote === 1) {
      upVotes += 1;
    } else if (vote === -1) {
      downVotes += 1;
    }
  }

  return {
    upVotes,
    downVotes,
    reviewCount: upVotes + downVotes,
    activeVote: viewer ? confidence.votesByUserId[viewer.id] ?? 0 : 0
  };
}

function buildBoardStandingFields(confidenceTargetId?: string) {
  const snapshot = buildConfidenceVoteSnapshot(confidenceTargetId);
  const reviewCount = snapshot?.reviewCount;
  const confidenceRatio =
    snapshot && reviewCount ? Math.round((snapshot.upVotes / reviewCount) * 100) : undefined;
  const boardUserId = confidenceTargetId ? platformBoardConfidenceTargetUserId(confidenceTargetId) : null;

  if (
    !confidenceTargetId ||
    !boardUserId ||
    !isPlatformBoardConfidenceTarget(confidenceTargetId) ||
    reviewCount === undefined ||
    confidenceRatio === undefined
  ) {
    return {
      confidenceVotesRequired: undefined,
      confidenceWeeklyActiveUserCount: undefined,
      confidenceStandingState: undefined,
      confidenceGraceEndsAt: undefined
    };
  }

  const confidenceWeeklyActiveUserCount = platformWeeklyActiveUserCount();
  const confidenceVotesRequired = calculateRequiredVotes(confidenceWeeklyActiveUserCount);

  if (
    reviewCount >= confidenceVotesRequired &&
    confidenceRatio >= GOVERNANCE_APPROVAL_THRESHOLD_PERCENT
  ) {
    activePlatformBoardUserIds.add(boardUserId);
    delete boardStandingGraceStartedAtByTargetId[confidenceTargetId];

    return {
      confidenceVotesRequired,
      confidenceWeeklyActiveUserCount,
      confidenceStandingState: 'active' as const,
      confidenceGraceEndsAt: undefined
    };
  }

  if (
    activePlatformBoardUserIds.has(boardUserId) &&
    confidenceRatio >= GOVERNANCE_APPROVAL_THRESHOLD_PERCENT &&
    reviewCount > 0
  ) {
    const graceStartedAt =
      boardStandingGraceStartedAtByTargetId[confidenceTargetId] ??
      (boardStandingGraceStartedAtByTargetId[confidenceTargetId] = new Date().toISOString());
    const confidenceGraceEndsAt = new Date(
      new Date(graceStartedAt).getTime() + BOARD_GRACE_WINDOW_MS
    ).toISOString();

    if (new Date(confidenceGraceEndsAt).getTime() > Date.now()) {
      return {
        confidenceVotesRequired,
        confidenceWeeklyActiveUserCount,
        confidenceStandingState: 'grace' as const,
        confidenceGraceEndsAt
      };
    }
  }

  activePlatformBoardUserIds.delete(boardUserId);
  delete boardStandingGraceStartedAtByTargetId[confidenceTargetId];

  return {
    confidenceVotesRequired,
    confidenceWeeklyActiveUserCount,
    confidenceStandingState: 'below-threshold' as const,
    confidenceGraceEndsAt: undefined
  };
}

function buildConfidenceFields(confidenceTargetId?: string) {
  const snapshot = buildConfidenceVoteSnapshot(confidenceTargetId);
  const reviewCount = snapshot?.reviewCount;
  const confidenceRatio =
    snapshot && reviewCount ? Math.round((snapshot.upVotes / reviewCount) * 100) : undefined;

  return {
    confidenceTargetId,
    confidenceVoteCount: snapshot ? snapshot.upVotes - snapshot.downVotes : undefined,
    confidenceActiveVote: snapshot?.activeVote,
    confidenceUpVotes: snapshot?.upVotes,
    confidenceDownVotes: snapshot?.downVotes,
    confidenceRatio,
    confidenceReviewCount: reviewCount,
    ...buildBoardStandingFields(confidenceTargetId)
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

function buildPlatformBoardRoster() {
  const activeMembers: ScopeMemberSummary[] = [];
  const candidates: ScopeMemberSummary[] = [];

  for (const userId of platformBoardMemberUserIds()) {
    const member = toScopeMember(userId, ensurePlatformBoardConfidenceTargetId(userId));

    if (member.confidenceStandingState === 'active' || member.confidenceStandingState === 'grace') {
      activeMembers.push(member);
    } else {
      candidates.push(member);
    }
  }

  return {
    activeMembers,
    candidates
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
  confidenceTargetId?: string
): ProjectRoleMember {
  const user = userById(userId) ?? patchbayUser;

  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
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
  return !!reviewCount && (confidenceRatio ?? 0) >= GOVERNANCE_APPROVAL_THRESHOLD_PERCENT;
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
      const effectivePresentation = buildEffectiveEventPresentation(item);

      return {
        ...item,
        ...effectivePresentation,
        voteCount: vote.voteCount,
        activeVote: vote.activeVote,
        commentCount,
        memberCount: participation?.goingUserIds.length ?? item.memberCount,
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

type AssetServiceProjectSeed = {
  reference: AssetProjectReference;
  locationLabel: string;
};

function assetServiceProjectSlug(reference: AssetProjectReference) {
  return reference.id.replace(/^asset-project-/, '');
}

function assetServiceProjectSubtype(reference: AssetProjectReference): ProjectSubtype | null {
  return 'asset-management';
}

function buildAssetServiceProjectSeeds(): AssetServiceProjectSeed[] {
  const seeds = platformAssetsFixture.landAssets.flatMap((landAsset) => [
    ...landAsset.managementProjects.map((reference) => ({
      reference,
      locationLabel: landAsset.title
    })),
    ...landAsset.storageProjects.map((reference) => ({
      reference,
      locationLabel: landAsset.title
    })),
    ...landAsset.attachedAssets.flatMap((asset) => [
      ...asset.managementProjects.map((reference) => ({
        reference,
        locationLabel: asset.parentLandAssetTitle
      })),
      ...asset.storageProjects.map((reference) => ({
        reference,
        locationLabel: asset.parentLandAssetTitle
      }))
    ])
  ]);
  const seen = new Set<string>();

  return seeds.filter(({ reference }) => {
    if (reference.href || !reference.id.startsWith('asset-project-')) {
      return false;
    }

    const slug = assetServiceProjectSlug(reference);

    if (seen.has(slug)) {
      return false;
    }

    seen.add(slug);
    return true;
  });
}

function buildAssetServiceProjectFeedItems(): PublicProjectItem[] {
  return buildAssetServiceProjectSeeds().map(({ reference, locationLabel }, index) => {
    const slug = assetServiceProjectSlug(reference);
    const createdAt = `2026-04-${String(18 + index).padStart(2, '0')}T12:00:00Z`;

    return {
      kind: 'project',
      id: `project-${reference.id}`,
      slug,
      href: `/projects/${slug}`,
      createdAt,
      title: reference.title,
      authorUsername: 'patchbay',
      projectMode: reference.projectMode,
      projectSubtype: assetServiceProjectSubtype(reference),
      summary: reference.summary,
      channelTags: [],
      communityTags: [],
      stage: 'Activity',
      locationLabel,
      voteCount: 0,
      activeVote: 0,
      signalCount: 0,
      commentCount: 0,
      memberCount: 4,
      lastActivityAt: createdAt
    } satisfies PublicProjectItem;
  });
}

function generatedAssetServiceProjectBySlug(slug: string) {
  return buildAssetServiceProjectFeedItems().find((item) => item.slug === slug) ?? null;
}

function isGeneratedAssetServiceProjectSlug(slug: string) {
  return generatedAssetServiceProjectBySlug(slug) !== null;
}

function generatedAssetServiceMemberIds(slug: string) {
  if (slug.includes('tool-library')) {
    return ['viewer-1', 'user-tool', 'user-mika'];
  }

  if (slug.includes('east-market')) {
    return ['viewer-1', 'user-rowan', 'user-ember'];
  }

  return ['viewer-1', 'user-mika', 'user-rowan'];
}

function generatedAssetServiceProjectStatus(item: PublicProjectItem) {
  const subtypeLabel = item.projectSubtype ? projectSubtypeLabel(item.projectSubtype) : 'collective service';

  return `${item.title} is already in active ${subtypeLabel.toLowerCase()} work, so requests can be submitted directly from this project page.`;
}

function ensureGeneratedAssetServiceProjectState(slug: string) {
  const item = generatedAssetServiceProjectBySlug(slug);

  if (!item) {
    return null;
  }

  if (item.projectSubtype) {
    seededProjectSubtypeBySlug[slug] = item.projectSubtype;
  }

  const memberIds = generatedAssetServiceMemberIds(slug);

  projectMembersBySlug[slug] ??= memberIds;
  projectMembershipSinceBySlug[slug] ??= Object.fromEntries(
    memberIds.map((userId, index) => [userId, `2026-04-${String(10 + index).padStart(2, '0')}T12:00:00Z`])
  );
  projectLifecycleBySlug[slug] ??= {
    currentPhaseId: 'phase-5',
    phases: {
      'phase-5': {
        projectStatus: generatedAssetServiceProjectStatus(item)
      },
      'phase-6': {
        projectStatus:
          'This asset service can stay open as long as the underlying land asset or attached asset still needs active stewardship.'
      }
    }
  };

  const workflow = ensureProjectWorkflowState(slug);

  workflow.requestSystemOverride ??= {
    enabled: true,
    requestMode: 'both',
    allowOffScheduleRequests: true
  };
  workflow.requestSystemEnabled ??= true;

  return item;
}

function buildGeneratedProjectDetailExtra(item: PublicProjectItem): ProjectDetailExtra {
  const subtypeLabel = item.projectSubtype ? projectSubtypeLabel(item.projectSubtype) : 'collective service';

  return {
    overview: item.summary,
    updates: [],
    discussionNote: `This seeded ${subtypeLabel.toLowerCase()} page exists so asset relationships can open a real project surface during the demo.`,
    discussion: []
  };
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
  const latestAuthor = userById(post.author.id);

  return {
    ...post,
    author: {
      ...post.author,
      profileImageUrl: latestAuthor?.profileImageUrl ?? post.author.profileImageUrl
    },
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
      ? channelDirectory
          .filter((item) => readScopeMembership('channel', item.slug).memberIds.includes(viewer.id))
          .map((item) => ({ ...item }))
      : [],
    communities: viewer
      ? communityDirectory
          .filter((item) => readScopeMembership('community', item.slug).memberIds.includes(viewer.id))
          .map((item) => ({
            ...item,
            visibility:
              readScopeMembership('community', item.slug).joinPolicy === 'invite_only'
                ? ('private' as const)
                : ('public' as const)
          }))
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
      members: followerIds.map((userId) => toProjectRoleMember(userId)),
      viewerIsMember: !!viewer && !!creator && viewer.id !== creator.id && followerIds.includes(viewer.id),
      viewerCanToggleMembership: !!viewer && !!creator && viewer.id !== creator.id
    };
  }

  return {
    memberCount: memberIds.length,
    members: memberIds.map((userId) => toProjectRoleMember(userId)),
    viewerIsMember: !!viewer && memberIds.includes(viewer.id),
    viewerCanToggleMembership: !!viewer
  };
}

function isPlatformTaggedProject(slug: string) {
  const project = findPublicProjectItem(slug);

  return !!project && project.channelTags.some((tag) => tag.slug === platform.slug);
}

function canViewerParticipateInPlatformProjectGovernance(slug: string) {
  return !!currentViewer() && isPlatformTaggedProject(slug);
}

function canViewerParticipateInPlatformEventGovernance(slug: string) {
  const event = findPublicEventItem(slug);

  return !!event && !event.isPrivate && !!currentViewer() && isPlatformTaggedEvent(event);
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
  const viewerIsMember = !!viewer && (memberIds.includes(viewer.id) || viewer.id === creatorId);
  const viewerHasScopeAccess = !!viewer && viewerHasEventScopeAccess(item, viewer.id);
  const viewerCanToggleMembership =
    !!viewer && (!item.isPrivate || viewerIsMember || participation.invitedUserIds.includes(viewer.id) || viewerHasScopeAccess);
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
    viewerIsMember,
    viewerCanToggleMembership,
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
  const boardRoster = buildPlatformBoardRoster();

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
      'Board members stay in role by keeping at least 66% approval with enough standing votes to meet platform quorum, so the confidence vote stays visible here.',
    emptyFeedText: 'No platform-tagged work is visible yet.',
    membership: platformMembership,
    feed: platformFeed,
    boardMembers: boardRoster.activeMembers,
    boardCandidates: boardRoster.candidates,
    boardFeatureFrames: [
      {
        id: 'platform-execution-records',
        title: 'Execution records',
        body:
          'Board execution evidence, confirmation history, and rejected execution records will live here once those later-phase flows are active.',
        statusLabel: 'Frame only'
      },
      {
        id: 'acquisition-handoffs',
        title: 'Acquisition handoffs',
        body:
          'When acquisition opens, board-triggered purchase handoffs and confirmation votes will slot into this panel without changing the route structure.',
        statusLabel: 'Frame only'
      },
      {
        id: 'platform-software-execution',
        title: 'Platform software execution',
        body:
          'Platform-specific pending execution and merge handoff records will appear here when that implementation lands.',
        statusLabel: 'Frame only'
      }
    ],
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
          hasOpenRole
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
  const voteItems: RightRailActivityItem[] = [];

  for (const item of publicFeed.filter((entry): entry is PublicProjectItem => entry.kind === 'project')) {
    const memberIds = projectMembersBySlug[item.slug] ?? [];

    if (!memberIds.includes(viewer.id)) {
      continue;
    }

    const projectFixture = findProjectFixture(item.slug);

    if (!projectFixture) {
      continue;
    }

    const openVotes = projectFixture.history.filter((entry) => entry.status === 'open' && entry.canVote);

    for (const decision of openVotes) {
      voteItems.push({
        id: `rail-project-vote-${item.slug}-${decision.id}`,
        subjectId: decision.id,
        kind: 'vote',
        title: decision.kindLabel,
        href: `${item.href}?tab=history&decision=${decision.id}#decision-${decision.id}`,
        meta: `${item.title} · ${decision.voteSummary.yesCount} yes / ${decision.voteSummary.noCount} no`,
        createdAt: decision.createdAt,
        countLabel: `${decision.voteSummary.votesRemaining} votes needed`,
        projectMode: item.projectMode,
        projectSlug: item.slug,
        voteEntityKind: 'project',
        voteKindLabel: decision.kindLabel,
        voteTargetId: decision.id
      });
    }
  }

  const eventItems: RightRailActivityItem[] = publicFeed
    .filter((item): item is PublicEventItem => item.kind === 'event')
    .flatMap<RightRailActivityItem>((item) => {
      const participation = eventParticipationById[item.id];
      const goingUserIds = participation?.goingUserIds ?? [];
      const invitedUserIds = participation?.invitedUserIds ?? [];
      const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
      const scopeLabels = scopeLabelsForViewer(item, viewer.id);
      const lifecycle = buildEventLifecycle(item.slug, item);
      const viewerIsParticipating = !!viewer && (goingUserIds.includes(viewer.id) || creatorId === viewer.id);
      const viewerIsInvited = invitedUserIds.includes(viewer.id);

      if (!viewerIsParticipating && !viewerIsInvited && scopeLabels.length === 0) {
        return [];
      }

      const sourceLabel = viewerIsParticipating || viewerIsInvited
        ? 'Project member'
        : `Via ${scopeLabels[0]}`;

      if (lifecycle.currentPhaseId !== 'activity' || lifecycle.activity.activities.length === 0) {
        return [];
      }

      return lifecycle.activity.activities.map((activity): RightRailActivityItem => {
        const hasOpenRole = activity.roles.some(
          (role) => role.maximumCount == null || role.filledCount < role.maximumCount
        );

        return {
          id: `rail-event-activity-${item.slug}-${activity.id}`,
          subjectId: activity.id,
          kind: 'event' as const,
          title: activity.title,
          href: `${item.href}?activity=${activity.id}#event-activity-${activity.id}`,
          meta: `${item.title} · ${activity.locationLabel}`,
          createdAt: activity.startAt,
          countLabel: `${sourceLabel} · ${activity.committedCount}/${activity.minimumParticipants} committed`,
          viewerIsParticipating,
          eventSlug: item.slug,
          activityId: activity.id,
          activityRoleLabels: activity.roles.map((role) => role.label),
          viewerAssignedRoleLabel: activity.viewerAssignedRoleLabel,
          hasOpenRole
        } satisfies RightRailActivityItem;
      });
    });

  for (const item of publicFeed.filter((entry): entry is PublicEventItem => entry.kind === 'event')) {
    const eventFixture = findEventFixture(item.slug);

    if (!eventFixture) {
      continue;
    }

    const openVotes = eventFixture.history.filter((entry) => entry.status === 'open' && entry.canVote);

    for (const decision of openVotes) {
      voteItems.push({
        id: `rail-event-vote-${item.slug}-${decision.id}`,
        subjectId: decision.id,
        kind: 'vote',
        title: decision.kindLabel,
        href: `${item.href}?tab=history&decision=${decision.id}#decision-${decision.id}`,
        meta: `${item.title} · ${decision.voteSummary.yesCount} yes / ${decision.voteSummary.noCount} no`,
        createdAt: decision.createdAt,
        countLabel: `${decision.voteSummary.votesRemaining} votes needed`,
        eventSlug: item.slug,
        voteEntityKind: 'event',
        voteKindLabel: decision.kindLabel,
        voteTargetId: decision.id
      });
    }
  }

  return [...projectItems, ...eventItems, ...requestItems, ...voteItems].sort(
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
  return buildPublicFeedFixture().find(
    (item): item is PublicProjectItem => item.kind === 'project' && item.slug === slug
  ) ?? null;
}

function publicProjectFromHref(href?: string | null): PublicProjectItem | null {
  if (!href || !href.startsWith('/projects/')) {
    return null;
  }

  return findPublicProjectItem(href.slice('/projects/'.length));
}

function normalizedAssetProjectHref(reference: AssetProjectReference) {
  return (
    reference.href ??
    assetServiceProjectHrefByTitle[reference.title] ??
    (reference.id.startsWith('asset-project-') ? `/projects/${assetServiceProjectSlug(reference)}` : null)
  );
}

function hydrateAssetProjectReference(reference: AssetProjectReference): AssetProjectReference {
  const href = normalizedAssetProjectHref(reference);

  return {
    ...reference,
    href,
    publicItem: publicProjectFromHref(href)
  };
}

function currentBorrowerLabel(asset: AssetAttachedRecord) {
  const activeBorrow = asset.governance.borrowingRequests.find(
    (request) =>
      request.statusLabel.toLowerCase().includes('borrowed') ||
      request.statusLabel.toLowerCase().includes('overdue')
  );

  return activeBorrow?.responsiblePartyLabel ?? activeBorrow?.borrowerLabel ?? null;
}

function currentLocationDetails(asset: AssetAttachedRecord) {
  const currentProject = [...asset.linkedProjects, ...asset.managementProjects, ...asset.storageProjects].find(
    (project) => project.title === asset.currentCustodianLabel
  );

  return {
    currentLocationLabel: currentProject?.title ?? asset.homeLandAssetLabel,
    currentLocationHref: currentProject?.href ?? `/platform/assets/${asset.parentLandAssetSlug}`,
    currentBorrowerLabel: currentBorrowerLabel(asset)
  };
}

function hydrateAttachedAsset(asset: AssetAttachedRecord): AssetAttachedRecord {
  return {
    ...asset,
    managementProjects: asset.managementProjects.map(hydrateAssetProjectReference),
    storageProjects: asset.storageProjects.map(hydrateAssetProjectReference),
    linkedProjects: asset.linkedProjects.map(hydrateAssetProjectReference),
    ...currentLocationDetails(asset)
  };
}

function hydrateLandAsset(asset: LandAssetRecord): LandAssetRecord {
  const managementProjects = asset.managementProjects.map(hydrateAssetProjectReference);
  const storageProjects = asset.storageProjects.map(hydrateAssetProjectReference);
  const linkedProjects = asset.linkedProjects.map(hydrateAssetProjectReference);
  const attachedAssets = asset.attachedAssets.map(hydrateAttachedAsset);
  const inventoryProject = managementProjects[0]?.publicItem ?? null;

  return {
    ...asset,
    managementProjects,
    storageProjects,
    linkedProjects,
    attachedAssets,
    inventoryFrame: inventoryProject ? buildProjectInventoryFrame(inventoryProject) : null
  };
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
  const viewer = currentViewer();

  return {
    viewer,
    featureFlags: {
      assets: false,
      funding: false,
      platform: true
    },
    unreadCounts: buildUnreadCounts(),
    directory: buildBootstrapDirectory(),
    suggestedContacts: viewer ? buildSuggestedMessageContacts(viewer.id) : [],
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
  return {
    ...platformAssetsFixture,
    landAssets: platformAssetsFixture.landAssets.map(hydrateLandAsset)
  };
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
  const extras = item ? projectDetailExtras[slug] ?? buildGeneratedProjectDetailExtra(item) : null;
  const memberState = buildProjectMemberState(slug);

  if (!item || !extras) {
    return null;
  }

  const shareContacts = buildShareContacts();
  const governancePopulation = projectGovernancePopulation(slug, memberState.memberCount);

  const lifecycle = buildProjectLifecycle(
    slug,
    item.projectMode,
    memberState.memberCount
  );
  const updateRequests = buildProjectUpdateRequests(
    slug,
    lifecycle.quorumThresholdPercent,
    governancePopulation
  );
  const editRequests = buildProjectEditRequests(
    slug,
    lifecycle.quorumThresholdPercent,
    governancePopulation
  );
  const history = buildProjectDecisionHistory(
    slug,
    lifecycle,
    updateRequests,
    editRequests,
    canViewerVoteOnProjectUpdate(slug),
    canViewerVoteOnProjectEdit(slug),
    lifecycle.phaseFive.softwareGovernance
  );
  const report = buildContentReportSummary(item.id);
  const isRemovedByReport = false;
  const linksFrame = buildProjectLinksFrame(item);
  const inventoryFrame = buildProjectInventoryFrame(item);
  const { summary: _summary, ...projectItem } = item;

  return {
    ...projectItem,
    projectSubtype: lifecycle.currentSubtype ?? projectItem.projectSubtype ?? null,
    description: extras.overview,
    lifecycle,
    updates: extras.updates,
    updateRequests: updateRequests,
    viewerCanRequestUpdate: canViewerRequestProjectUpdate(slug),
    viewerCanVoteOnUpdateRequests: canViewerVoteOnProjectUpdate(slug),
    editRequests: editRequests,
    viewerCanRequestEdit: canViewerRequestProjectEdit(slug),
    viewerCanVoteOnEditRequests: canViewerVoteOnProjectEdit(slug),
    linksFrame,
    inventoryFrame,
    history,
    members: memberState.members,
    viewerIsMember: memberState.viewerIsMember,
    viewerCanToggleMembership: memberState.viewerCanToggleMembership,
    viewerCanShare: !!currentViewer(),
    shareContacts,
    report,
    isRemovedByReport,
    commentCount: countComments(commentsBySubjectId[item.id] ?? []),
    discussionNote: extras.discussionNote,
    discussion: mapCommentsWithReports(commentsBySubjectId[item.id] ?? [])
  };
}

function buildProjectPlaceholderSections(
  sections: Array<{ id: string; title: string; body: string; statusLabel?: string }>
): ProjectPlaceholderSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    body: section.body,
    statusLabel: section.statusLabel ?? 'Frame only'
  }));
}

function buildProjectRequestFrames(
  context: 'links' | 'inventory',
  item: PublicProjectItem
): ProjectRequestFrame[] {
  if (context === 'links') {
    return [
      {
        id: 'asset-use',
        title: 'Asset-use link preview',
        body:
          'Fake preview only: approved in-house asset requests will create auto-links here so members can see which stewardship or storage project confirmed the dependency.',
        statusLabel: 'Fake preview'
      },
      {
        id: 'delivery',
        title: 'Delivery link preview',
        body:
          item.projectMode === 'collective-service'
            ? 'Fake preview only: completed delivery runs will create links here so service work and asset movement stay connected in the production network.'
            : 'Fake preview only: completed delivery runs will create links here when this project depends on transport between sites.',
        statusLabel: 'Fake preview'
      }
    ];
  }

  const frames: ProjectRequestFrame[] = [
    {
      id: 'borrowing',
      title: 'Borrowing request preview',
      body:
        'Fake preview only: borrowing requests for assets managed by this project will appear here with intended return dates and current custodian labels.',
      statusLabel: 'Fake preview'
    },
    {
      id: 'asset-use',
      title: 'Asset-use request preview',
      body:
        'Fake preview only: plans needing in-house equipment or site access will send availability requests here before they become fully voteable.',
      statusLabel: 'Fake preview'
    }
  ];

  if (item.projectMode === 'collective-service') {
    frames.push({
      id: 'delivery',
      title: 'Delivery coordination preview',
      body:
        'Fake preview only: delivery and transfer coordination records will appear here for service projects that move assets between sites.',
      statusLabel: 'Fake preview'
    });
  }

  return frames;
}

function projectFrameLink(
  currentItem: PublicProjectItem,
  targetSlug: string,
  relationshipLabel: string,
  summary: string,
  fallbackTitle: string
) {
  const target = findPublicProjectItem(targetSlug);

  return {
    id: `${currentItem.slug}-${targetSlug}`,
    title: target?.title ?? fallbackTitle,
    relationshipLabel,
    summary,
    href: target?.href ?? null,
    publicItem: target
  };
}

function manualProjectLinkPairKey(leftSlug: string, rightSlug: string) {
  return [leftSlug, rightSlug].sort().join('::');
}

function manualProjectLinkVotesForSlug(request: MockProjectManualLinkState, slug: string) {
  return request.sourceProjectSlug === slug ? request.sourceVotesByUserId : request.targetVotesByUserId;
}

function manualProjectLinkOtherSlug(request: MockProjectManualLinkState, slug: string) {
  return request.sourceProjectSlug === slug ? request.targetProjectSlug : request.sourceProjectSlug;
}

function manualProjectLinkVoteCounts(votesByUserId: Record<string, ProjectApprovalVote>) {
  return Object.values(votesByUserId).reduce(
    (totals, vote) => {
      if (vote === 'yes') {
        totals.yesCount += 1;
      }

      if (vote === 'no') {
        totals.noCount += 1;
      }

      return totals;
    },
    { yesCount: 0, noCount: 0 }
  );
}

function manualProjectLinkVoteStateForSlug(
  request: MockProjectManualLinkState,
  slug: string,
  viewerId?: string | null
) {
  const project = findPublicProjectItem(slug);
  const votesByUserId = manualProjectLinkVotesForSlug(request, slug);
  const { yesCount, noCount } = manualProjectLinkVoteCounts(votesByUserId);
  const voteState = buildProjectManualLinkVoteState(
    project?.title ?? slug,
    (projectMembersBySlug[slug] ?? []).length,
    yesCount,
    noCount
  );

  return {
    ...voteState,
    viewerCanVote: !!viewerId && (projectMembersBySlug[slug] ?? []).includes(viewerId),
    viewerVote: viewerId ? votesByUserId[viewerId] ?? null : null
  };
}

function manualProjectLinkApprovedOnBothSides(request: MockProjectManualLinkState) {
  const sourceState = manualProjectLinkVoteStateForSlug(request, request.sourceProjectSlug);
  const targetState = manualProjectLinkVoteStateForSlug(request, request.targetProjectSlug);

  return sourceState.statusLabel === 'Approved' && targetState.statusLabel === 'Approved';
}

function manualProjectLinkStatusLabel(
  currentSide: ProjectManualLinkVoteState,
  otherSide: ProjectManualLinkVoteState
) {
  if (currentSide.statusLabel === 'Approved' && otherSide.statusLabel === 'Approved') {
    return 'Approved on both sides';
  }

  if (currentSide.statusLabel === 'Blocked') {
    return 'Blocked on this project side';
  }

  if (otherSide.statusLabel === 'Blocked') {
    return 'Blocked on linked project side';
  }

  if (currentSide.statusLabel === 'Approved' && otherSide.statusLabel !== 'Approved') {
    return 'Pending counterpart vote';
  }

  return 'Active vote';
}

function buildProjectManualLinkRequestFromState(
  currentItem: PublicProjectItem,
  request: MockProjectManualLinkState
): ProjectManualLinkRequest {
  const viewerId = currentViewer()?.id ?? null;
  const targetSlug = manualProjectLinkOtherSlug(request, currentItem.slug);
  const target = findPublicProjectItem(targetSlug);
  const proposer = userById(request.proposedByUserId);
  const thisProjectVote = manualProjectLinkVoteStateForSlug(request, currentItem.slug, viewerId);
  const otherProjectVote = manualProjectLinkVoteStateForSlug(request, targetSlug);

  return {
    id: request.id,
    title: target?.title ?? targetSlug,
    relationshipLabel: request.relationshipLabel,
    summary: request.summary,
    statusLabel: manualProjectLinkStatusLabel(thisProjectVote, otherProjectVote),
    proposedByUsername: proposer?.username ?? 'unknown',
    createdAtLabel: `Opened ${projectFrameDateLabel(request.createdAt)}`,
    targetProjectHref: target?.href ?? null,
    thisProjectVote,
    otherProjectVote
  };
}

function buildLinkableProjects(currentItem: PublicProjectItem) {
  return buildPublicFeedFixture()
    .filter((item): item is PublicProjectItem => item.kind === 'project' && item.slug !== currentItem.slug)
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      href: item.href
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function buildProjectManualLinkVoteState(
  projectTitle: string,
  memberCount: number,
  yesCount: number,
  noCount: number
): ProjectManualLinkVoteState {
  const approvalsRequired =
    memberCount <= 0 ? 0 : Math.ceil((memberCount * GOVERNANCE_APPROVAL_THRESHOLD_PERCENT) / 100);
  const approvalPercent = memberCount <= 0 ? 0 : Math.round((yesCount / memberCount) * 100);
  const approvalsRemaining = Math.max(approvalsRequired - yesCount, 0);
  const remainingPossibleYes = Math.max(memberCount - noCount, 0);

  if (approvalsRequired <= 0) {
    return {
      projectTitle,
      yesCount,
      noCount,
      memberCount,
      approvalsRequired,
      approvalsRemaining,
      approvalPercent,
      statusLabel: 'No voters seeded',
      resultNote: 'This fake preview does not yet have seeded members for the approval side.'
    };
  }

  if (yesCount >= approvalsRequired) {
    return {
      projectTitle,
      yesCount,
      noCount,
      memberCount,
      approvalsRequired,
      approvalsRemaining,
      approvalPercent,
      statusLabel: 'Approved',
      resultNote: `This side cleared the ${GOVERNANCE_APPROVAL_THRESHOLD_PERCENT}% membership threshold.`
    };
  }

  if (remainingPossibleYes < approvalsRequired) {
    return {
      projectTitle,
      yesCount,
      noCount,
      memberCount,
      approvalsRequired,
      approvalsRemaining,
      approvalPercent,
      statusLabel: 'Blocked',
      resultNote: `Even unanimous remaining yes votes would not reach ${approvalsRequired} approvals.`
    };
  }

  return {
    projectTitle,
    yesCount,
    noCount,
    memberCount,
    approvalsRequired,
    approvalsRemaining,
    approvalPercent,
    statusLabel: 'Pending',
    resultNote: `${approvalsRemaining} more yes vote${approvalsRemaining === 1 ? '' : 's'} needed on this side.`
  };
}

function buildProjectManualLinkRequest(
  currentItem: PublicProjectItem,
  targetSlug: string,
  fallbackTitle: string,
  relationshipLabel: string,
  summary: string,
  statusLabel: string,
  proposedByUsername: string,
  createdAtLabel: string,
  currentVotes: { yesCount: number; noCount: number },
  targetVotes: { yesCount: number; noCount: number }
): ProjectManualLinkRequest {
  const target = findPublicProjectItem(targetSlug);
  const targetTitle = target?.title ?? fallbackTitle;

  return {
    id: `${currentItem.slug}-${targetSlug}-manual-link-request`,
    title: targetTitle,
    relationshipLabel,
    summary,
    statusLabel,
    proposedByUsername,
    createdAtLabel,
    targetProjectHref: target?.href ?? null,
    thisProjectVote: buildProjectManualLinkVoteState(
      currentItem.title,
      currentItem.memberCount,
      currentVotes.yesCount,
      currentVotes.noCount
    ),
    otherProjectVote: buildProjectManualLinkVoteState(
      targetTitle,
      target?.memberCount ?? 0,
      targetVotes.yesCount,
      targetVotes.noCount
    )
  };
}

function relatedLandAssetSlugForProject(item: PublicProjectItem) {
  return item.slug.includes('ride') || item.slug.includes('hallway') || item.slug.includes('retrofit')
    ? 'east-market-commons'
    : 'tool-library-campus';
}

function relatedLandAssetHrefForProject(item: PublicProjectItem) {
  return `/platform/assets/${relatedLandAssetSlugForProject(item)}`;
}

function relatedLandAssetForProject(item: PublicProjectItem) {
  return (
    platformAssetsFixture.landAssets.find((asset) => asset.slug === relatedLandAssetSlugForProject(item)) ?? null
  );
}

function findAttachedAssetsForProjectSlug(slug: string) {
  const projectHref = `/projects/${slug}`;

  return platformAssetsFixture.landAssets.flatMap((landAsset) =>
    landAsset.attachedAssets.filter((asset) =>
      [...asset.linkedProjects, ...asset.managementProjects, ...asset.storageProjects].some(
        (project) => normalizedAssetProjectHref(project) === projectHref
      )
    )
  );
}

function buildInventoryAssetFromAttachedAsset(asset: (typeof platformAssetsFixture.landAssets)[number]['attachedAssets'][number]) {
  const borrowingPolicy = asset.governance.borrowingPolicies[0] ?? null;
  const availability = asset.governance.availabilityRequests[0] ?? null;
  const latestHistory = asset.governance.provenanceTimeline[asset.governance.provenanceTimeline.length - 1] ?? null;

  return {
    id: asset.id,
    title: asset.title,
    statusLabel: asset.statusLabel,
    custodyLabel: asset.custodyLabel,
    summary: asset.summary,
    locationLabel: asset.currentLocationLabel ?? asset.locationLabel,
    quantity: asset.totalQuantity,
    availableQuantity: asset.availableQuantity,
    quantityLabel: asset.quantityLabel,
    borrowingPolicyLabel: borrowingPolicy?.policyLabel,
    availabilityLabel: availability?.statusLabel,
    governanceNote: borrowingPolicy?.summary ?? availability?.summary ?? undefined,
    historyLabel: latestHistory ? `${latestHistory.happenedAtLabel} · ${latestHistory.title}` : undefined,
    href: asset.href ?? null
  };
}

function buildInventoryAssetFromLandAsset(asset: (typeof platformAssetsFixture.landAssets)[number]) {
  const borrowingPolicy = asset.governance.borrowingPolicies[0] ?? null;
  const availability = asset.governance.availabilityRequests[0] ?? null;
  const latestHistory = asset.governance.provenanceTimeline[asset.governance.provenanceTimeline.length - 1] ?? null;

  return {
    id: asset.id,
    title: asset.title,
    statusLabel: asset.statusLabel,
    custodyLabel: asset.currentCustodianLabel,
    summary: `${asset.sizeLabel} · ${asset.locationLabel}`,
    locationLabel: asset.locationLabel,
    borrowingPolicyLabel: borrowingPolicy?.policyLabel,
    availabilityLabel: availability?.statusLabel,
    governanceNote: borrowingPolicy?.summary ?? availability?.summary ?? undefined,
    historyLabel: latestHistory ? `${latestHistory.happenedAtLabel} · ${latestHistory.title}` : asset.historySummary,
    href: `/platform/assets/${asset.slug}`
  };
}

function buildFallbackProjectInventoryAssets(item: PublicProjectItem) {
  const assetHref = relatedLandAssetHrefForProject(item);
  const custodyLabel =
    relatedLandAssetSlugForProject(item) === 'east-market-commons'
      ? 'Held under East Market Commons Lot'
      : 'Held under Tool Library Campus Lot';

  if (item.projectMode === 'collective-service') {
    return [
      {
        id: `${item.slug}-asset-intake-kit`,
        title: 'Shared intake kit',
        statusLabel: 'Fake preview asset',
        custodyLabel,
        summary:
          'A seeded preview asset showing how service-managed equipment will appear once collective inventory goes live.',
        borrowingPolicyLabel: 'Project use only',
        availabilityLabel: 'Preview availability only',
        governanceNote:
          'Real borrowing policy votes and availability decisions are now seeded on asset pages first and can be mapped here as more service records open.',
        historyLabel: 'Preview history only',
        href: assetHref
      },
      {
        id: `${item.slug}-asset-mobile-cart`,
        title: 'Mobile coordination cart',
        statusLabel: 'Fake preview asset',
        custodyLabel,
        summary:
          'A seeded preview asset showing how mobile service equipment can stay attached to a land record while moving between active shifts.',
        borrowingPolicyLabel: 'Individual borrowing permitted',
        availabilityLabel: 'Preview availability only',
        governanceNote:
          'Real borrowing and delivery lifecycle records are now seeded on linked asset pages and will roll into inventory as those service records deepen.',
        historyLabel: 'Preview history only',
        href: assetHref
      }
    ];
  }

  return [
    {
      id: `${item.slug}-asset-staging-tables`,
      title: 'Staging table set',
      statusLabel: 'Fake preview asset',
      custodyLabel,
      summary:
        'A seeded preview of a collectively held work surface that this project would check out for active production or build-day work.',
      borrowingPolicyLabel: 'Project use only',
      availabilityLabel: 'Preview availability only',
      governanceNote:
        'Real availability approvals now live on seeded asset pages so productive plans can show the pending-vs-approved path through the adapter.',
      historyLabel: 'Preview history only',
      href: assetHref
    },
    {
      id: `${item.slug}-asset-tool-cache`,
      title: 'Shared tool cache',
      statusLabel: 'Fake preview asset',
      custodyLabel,
      summary:
        'A seeded preview of repair and install tools that would remain in common ownership while being assigned to this project during activity.',
      borrowingPolicyLabel: 'Project use only',
      availabilityLabel: 'Preview availability only',
      governanceNote:
        'Borrowing and delivery lifecycle records now live on seeded asset pages and will replace these fallback summaries as more attached assets are linked directly.',
      historyLabel: 'Preview history only',
      href: assetHref
    }
  ];
}

function buildProjectInventoryAssetGroups(item: PublicProjectItem) {
  const landAsset = relatedLandAssetForProject(item);
  const linkedAssets = findAttachedAssetsForProjectSlug(item.slug);
  const onLandAssets =
    linkedAssets.length > 0
      ? linkedAssets.map((asset) => buildInventoryAssetFromAttachedAsset(asset))
      : buildFallbackProjectInventoryAssets(item);
  const landAssets = landAsset ? [buildInventoryAssetFromLandAsset(landAsset)] : [];
  const landGroupTitle = landAssets.length === 1 ? 'Land asset' : 'Land assets';
  const assetGroupTitle =
    item.projectMode === 'collective-service' && item.projectSubtype === 'asset-management'
      ? onLandAssets.length === 1
        ? 'Managed asset'
        : 'Managed assets'
      : onLandAssets.length === 1
        ? 'Asset'
        : 'Assets';

  return [
    {
      id: `${item.slug}-land-group`,
      kind: 'land-asset' as const,
      title: landGroupTitle,
      assets: landAssets
    },
    {
      id: `${item.slug}-asset-group`,
      kind: 'asset' as const,
      title: assetGroupTitle,
      assets: onLandAssets
    }
  ];
}

function buildProjectPhaseFourPreview(
  slug: string,
  item: PublicProjectItem,
  currentSubtype: ProjectSubtype | null,
  phaseTwo: { plans: ProjectProductionPlan[]; winningPlanId: string | null },
  quorumThresholdPercent: number,
  memberCount: number
): ProjectPhaseFourData | null {
  if (item.projectMode === 'personal-service') {
    return null;
  }

  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId) ?? null;
  const acquisitionState = readProjectWorkflowState(slug)?.acquisition;
  const fundState = projectFundProgressForSlug(slug);
  const assetHref = relatedLandAssetHrefForProject(item);
  const confirmationVoteSummary = acquisitionState?.execution
    ? buildProjectVoteSummary(
        acquisitionState.confirmationVotesByUserId,
        quorumThresholdPercent,
        memberCount
      )
    : null;
  const confirmationApproved =
    confirmationVoteSummary !== null &&
    confirmationVoteSummary.meetsQuorum &&
    phaseChangePassesApprovalThreshold(confirmationVoteSummary);
  const confirmationRejected =
    confirmationVoteSummary !== null &&
    !thresholdVoteCanStillPass(confirmationVoteSummary, phaseChangeApprovalThresholdPercent);
  const viewerCanRecordExecution =
    viewerIsActivePlatformBoardMember() &&
    projectLifecycleBySlug[slug]?.currentPhaseId === 'phase-4' &&
    fundState?.status === 'completed' &&
    (winningPlan?.purchaseRows.length ?? 0) > 0;
  const purchaseStatusLabel = acquisitionState?.execution
    ? confirmationApproved
      ? 'Confirmed'
      : confirmationRejected
        ? 'Execution rejected'
        : 'Pending confirmation'
    : fundState?.status === 'completed'
      ? 'Awaiting board execution'
      : 'Awaiting funding';
  const bundleStatusLabel = acquisitionState?.execution
    ? confirmationApproved
      ? 'Confirmed'
      : confirmationRejected
        ? 'Rejected execution'
        : 'Waiting on confirmation vote'
    : fundState?.status === 'completed'
      ? 'Ready for execution'
      : 'Waiting for funding';
  const fund: ProjectAcquisitionPreviewFund | null = fundState
    ? {
        title: fundState.title,
        progressPercent: fundState.progressPercent,
        raisedLabel: fundState.raisedLabel,
        targetLabel: fundState.targetLabel,
        statusLabel: fundState.status === 'completed' ? 'Fund complete' : 'Funding open',
        note:
          fundState.status === 'completed'
            ? 'The collective fund is complete. The next adapter-backed step is board execution with proof, followed by member confirmation.'
            : 'The collective fund is still open. Once it is complete, board members can record execution against the approved purchase rows.'
      }
    : winningPlan?.purchaseRows.length
      ? {
          title: `${item.title} acquisition round`,
          progressPercent: 0,
          raisedLabel: 'Fund not opened yet',
          targetLabel: winningPlan.totalCostLabel,
          statusLabel: 'Waiting for funding',
          note:
            'The winning plan now carries real purchase rows. A collective fund can open against that itemized list before board execution begins.'
        }
      : null;
  const bundles: ProjectAcquisitionBundle[] = (winningPlan?.acquisitionBundles ?? []).map((bundle) => ({
    id: bundle.id,
    title: bundle.title,
    destinationType: bundle.destinationType,
    destinationLabel: bundle.destinationLabel,
    statusLabel: bundleStatusLabel,
    note: bundle.note
  }));
  const existingAssets: ProjectAcquisitionPreviewItem[] = assetHref
    ? currentSubtype === 'software'
      ? [
          {
            id: `${item.slug}-existing-ci-runner`,
            title: 'Shared CI runner slot',
            sourceLabel: 'Existing collective infrastructure',
            costLabel: 'No new purchase required',
            statusLabel: 'Confirmed in PENDING',
            note:
              'This row stays separate from the purchase list because it is already held collectively and only needed intake approval during PENDING.',
            href: assetHref
          }
        ]
      : [
          {
            id: `${item.slug}-existing-site-access`,
            title: 'Site access and floor space',
            sourceLabel: 'Existing collective land asset',
            costLabel: 'No new purchase required',
            statusLabel: 'Confirmed in PENDING',
            note:
              'This row stays separate from the purchase list because the land access is already collectively held and only needed intake approval during PENDING.',
            href: assetHref
          }
        ]
    : [];
  const purchaseTargets: ProjectAcquisitionPreviewItem[] = (winningPlan?.purchaseRows ?? []).map((purchaseRow) => ({
    id: purchaseRow.id,
    title: purchaseRow.title,
    sourceLabel: 'Approved plan purchase row',
    costLabel: purchaseRow.costLabel,
    statusLabel: purchaseStatusLabel,
    note:
      purchaseRow.note ||
      (purchaseRow.destinationLabel
        ? `This purchase row is routed to ${purchaseRow.destinationLabel} once execution and confirmation complete.`
        : 'This purchase row is attached to the current winning plan.'),
    href: null,
    purchaseHref: purchaseRow.purchaseHref,
    destinationBundleId: purchaseRow.destinationBundleId,
    destinationLabel: purchaseRow.destinationLabel
  }));
  const execution: ProjectAcquisitionExecutionFrame | null = acquisitionState?.execution
    ? {
        statusLabel: confirmationApproved
          ? 'Confirmed by members'
          : confirmationRejected
            ? 'Rejected by members'
            : 'Board execution recorded',
        boardActionLabel: `Recorded by ${acquisitionState.execution.recordedByUsername}`,
        proofLabel: acquisitionState.execution.proofLabel,
        note: acquisitionState.execution.note,
        recordedByUsername: acquisitionState.execution.recordedByUsername,
        recordedAt: acquisitionState.execution.recordedAt
      }
    : null;
  const confirmation: ProjectAcquisitionConfirmationFrame | null = confirmationVoteSummary
    ? {
        statusLabel: confirmationApproved
          ? 'Confirmed'
          : confirmationRejected
            ? 'Rejected'
            : 'Awaiting confirmation',
        note: confirmationApproved
          ? 'The confirmation vote has passed. The pending asset entries are ready for final inventory handoff.'
          : confirmationRejected
            ? 'The confirmation vote can no longer pass. Board members can record a corrected execution and restart confirmation.'
            : 'Project members now confirm or reject the recorded execution before the pending asset entries become live inventory.',
        voteSummary: confirmationVoteSummary,
        viewerCanVote: canViewerEditProjectPhase(slug, 'phase-4')
      }
    : null;
  const pendingAssets: ProjectAcquisitionPendingAsset[] = (acquisitionState?.execution?.pendingAssets ?? []).map(
    (pendingAsset) => ({
      id: pendingAsset.id,
      title: pendingAsset.title,
      statusLabel: confirmationApproved
        ? 'Confirmed'
        : confirmationRejected
          ? 'Rejected'
          : 'Pending confirmation',
      destinationLabel: pendingAsset.destinationLabel,
      note: pendingAsset.note
    })
  );
  const phaseLabel = purchaseTargets.length === 0
    ? 'No acquisition rows'
    : acquisitionState?.execution
      ? confirmationApproved
        ? 'Confirmed'
        : confirmationRejected
          ? 'Rejected'
          : 'Confirmation'
      : fundState?.status === 'completed'
        ? 'Execution'
        : 'Funding';

  return {
    intro:
      'Acquisition sits between the final planning phase and activity whenever an approved plan still needs collectively held means of production.',
    previewNote:
      purchaseTargets.length > 0
        ? 'The accepted production or operations plan now supplies the itemized purchase rows, bundle routing, execution proof, and confirmation state for this phase.'
        : 'The current winning plan does not contain any purchase rows, so acquisition stays informational for now.',
    phaseLabel,
    fund,
    existingAssets,
    purchaseTargets,
    bundles,
    execution,
    confirmation,
    pendingAssets,
    viewerCanRecordExecution,
    placeholderSections: buildProjectPlaceholderSections(
      purchaseTargets.length === 0
        ? [
            {
              id: 'no-purchases',
              title: 'No acquisition purchase rows',
              body:
                'Edit the accepted production or operations plan to add purchase rows and destination bundles if this work still needs collectively funded means of production.',
              statusLabel: 'No acquisition needed yet'
            }
          ]
        : [
            {
              id: 'pending-routing',
              title: 'PENDING routing',
              body:
                'Bundles targeting an existing asset-management service stay in PENDING until that service agrees to absorb the resulting inventory. Bundles targeting a new service draft do not block voteability on their own.',
              statusLabel: 'Active rule'
            }
          ]
    )
  };
}

type SeededProjectConversionLineageSeed = {
  predecessorSlug: string;
  successorSlug: string;
  successorTitle: string;
  summary: string;
  inventoryNote: string;
  permanenceNote: string;
  statusLabel: string;
};

const seededProjectConversionLineageBySlug: Record<string, SeededProjectConversionLineageSeed> = {
  'block-weatherization-pilot-wrap': {
    predecessorSlug: 'block-weatherization-pilot-wrap',
    successorSlug: 'east-market-weatherization-maintenance-service',
    successorTitle: 'East Market Weatherization Maintenance Service',
    summary:
      'This productive pilot closed after the build cycle and now stays permanently linked to the follow-on collective service that carries the maintenance and repeat work.',
    inventoryNote:
      'The successor record inherits the pilot inventory framing so the ladders, seal kits, and measurement tools stay attached to the continuing service history.',
    permanenceNote:
      'This predecessor/successor relationship is governance-created and permanent. It cannot be removed through the manual link process.',
    statusLabel: 'Converted project'
  }
};

const seededProjectConversionSuccessorPreviewBySlug: Record<
  string,
  { successorSlug: string; successorTitle: string; inventoryNote: string; summary: string }
> = {
  'hallway-air-sealing-build-day': {
    successorSlug: 'east-market-weatherization-support-service',
    successorTitle: 'East Market Weatherization Support Service',
    inventoryNote:
      'If this close vote passes, the follow-on service will inherit the current tool kits, safety gear, and role notes as its starting inventory frame.',
    summary:
      'The current proposal would close the one-off build day and reopen the work as a standing collective service for repeat support and maintenance.'
  }
};

type MockProjectManualLinkState = {
  id: string;
  sourceProjectSlug: string;
  targetProjectSlug: string;
  relationshipLabel: string;
  summary: string;
  proposedByUserId: string;
  createdAt: string;
  sourceVotesByUserId: Record<string, ProjectApprovalVote>;
  targetVotesByUserId: Record<string, ProjectApprovalVote>;
};

let manualProjectLinkRequestsState: MockProjectManualLinkState[] = [
  {
    id: 'manual-link-repair-ride-approved',
    sourceProjectSlug: 'repair-cafe-shift-grid',
    targetProjectSlug: 'neighborhood-ride-coordination-service',
    relationshipLabel: 'Member-approved relationship',
    summary:
      'The repair floor and ride desk approved a standing link so bulky repair pickups can trigger the related ride coordination handoff when needed.',
    proposedByUserId: 'user-tool',
    createdAt: '2026-05-10T14:00:00Z',
    sourceVotesByUserId: {
      'viewer-1': 'yes',
      'user-tool': 'yes',
      'user-rowan': 'yes'
    },
    targetVotesByUserId: {
      'viewer-1': 'yes',
      'user-rowan': 'yes',
      'user-ember': 'yes'
    }
  },
  {
    id: 'manual-link-land-repair-pending',
    sourceProjectSlug: 'tool-library-land-stewardship',
    targetProjectSlug: 'repair-cafe-shift-grid',
    relationshipLabel: 'Pending shared-resource coordination',
    summary:
      'This request would keep the land stewardship service and repair floor visibly linked whenever space-use and attached-asset placement decisions overlap.',
    proposedByUserId: 'user-rowan',
    createdAt: '2026-05-16T11:30:00Z',
    sourceVotesByUserId: {
      'viewer-1': 'yes',
      'user-rowan': 'yes',
      'user-tool': 'yes'
    },
    targetVotesByUserId: {
      'viewer-1': 'yes',
      'user-tool': 'yes',
      'user-rowan': 'no'
    }
  },
  {
    id: 'manual-link-storage-childcare-blocked',
    sourceProjectSlug: 'tool-library-storage',
    targetProjectSlug: 'childcare-checkin-desk-service',
    relationshipLabel: 'Blocked handoff relationship',
    summary:
      'The proposed storage-to-check-in relationship failed because the linked project rejected the standing coordination path for overlapping front-room handoffs.',
    proposedByUserId: 'user-tool',
    createdAt: '2026-05-14T09:15:00Z',
    sourceVotesByUserId: {
      'viewer-1': 'yes',
      'user-tool': 'yes',
      'user-rowan': 'yes'
    },
    targetVotesByUserId: {
      'viewer-1': 'no',
      'user-tool': 'no',
      'user-rowan': 'yes'
    }
  }
];

function projectFrameDateLabel(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(iso));
}

function projectConversionWorkflowStatus(request: ProjectLifecyclePhaseChangeRequest) {
  if (request.voteSummary.meetsQuorum && request.passesApprovalThreshold) {
    return 'Approved threshold reached';
  }

  if (!request.canStillPass) {
    return 'Blocked by vote math';
  }

  return 'Pending close vote';
}

function buildProjectConversionWorkflow(
  item: PublicProjectItem,
  requests: ProjectLifecyclePhaseChangeRequest[]
) {
  return requests
    .filter(
      (request) => request.kind === 'close' && request.closeOutcome === 'convert' && request.conversionTarget
    )
    .map((request) => {
      const target = request.conversionTarget;

      if (!target) {
        return null;
      }

      const preview = seededProjectConversionSuccessorPreviewBySlug[item.slug];

      return {
        id: request.id,
        title: `Convert into ${target.projectModeLabel}`,
        statusLabel: projectConversionWorkflowStatus(request),
        requestedByUsername: request.authorUsername,
        createdAtLabel: `Opened ${projectFrameDateLabel(request.createdAt)}`,
        outcomeLabel: `${target.projectModeLabel} · ${target.projectSubtypeLabel}`,
        summary: preview?.summary ?? request.reason,
        inventoryNote:
          preview?.inventoryNote ??
          `If approved, the successor starts in ${target.entryPhaseLabel} with the current inventory framing carried forward.`,
        canVote: canViewerVoteOnProjectPhaseChange(item.slug),
        voteSummary: request.voteSummary,
        approvalThresholdPercent: request.approvalThresholdPercent,
        target,
        predecessor: {
          id: `${item.slug}-conversion-predecessor`,
          title: item.title,
          relationshipLabel: 'Closing project',
          summary: 'This is the current project record that would close if the conversion vote passes.',
          href: item.href
        },
        successor: preview
          ? projectFrameLink(
              item,
              preview.successorSlug,
              'Planned successor',
              preview.summary,
              preview.successorTitle
            )
          : null
      };
        })
        .filter((item): item is NonNullable<typeof item> => !!item);
}

function buildProjectConversionLineage(item: PublicProjectItem) {
  const seed = seededProjectConversionLineageBySlug[item.slug];

  if (!seed) {
    return null;
  }

  return {
    title: 'Conversion lineage',
    statusLabel: seed.statusLabel,
    summary: seed.summary,
    permanenceNote: seed.permanenceNote,
    inventoryNote: seed.inventoryNote,
    predecessor: {
      id: `${seed.predecessorSlug}-conversion-lineage-predecessor`,
      title: item.title,
      relationshipLabel: 'Historical predecessor',
      summary: 'This closed productive record remains permanently visible as the predecessor in the governed conversion chain.',
      href: item.href
    },
    successor: projectFrameLink(
      item,
      seed.successorSlug,
      'Converted successor',
      'This follow-on service keeps the inherited inventory and governance history visible after the original project closed.',
      seed.successorTitle
    )
  };
}

function buildProjectLinksFrame(item: PublicProjectItem): ProjectLinksFrameData {
  const candidateTargets = [
    'repair-cafe-shift-grid',
    'childcare-checkin-desk-service',
    'neighborhood-ride-coordination-service',
    'hallway-air-sealing-build-day'
  ].filter((slug) => slug !== item.slug);

  const seededManualLinkRequests: ProjectManualLinkRequest[] = [
    buildProjectManualLinkRequest(
      item,
      candidateTargets[0] ?? 'repair-cafe-shift-grid',
      'Repair cafe shift grid',
      'Pending shared-resource coordination',
      'This project has already cleared its own threshold, but the linked project still needs more member approvals before the relationship can go live.',
      'Pending counterpart vote',
      'avery.n',
      'Opened 2 days ago',
      { yesCount: Math.max(Math.ceil(item.memberCount * 0.67), 1), noCount: item.memberCount > 3 ? 1 : 0 },
      { yesCount: 2, noCount: 1 }
    ),
    buildProjectManualLinkRequest(
      item,
      candidateTargets[2] ?? candidateTargets[1] ?? 'neighborhood-ride-coordination-service',
      'Neighborhood ride coordination service',
      'Member-approved relationship',
      'Both project memberships cleared the required threshold, so this request now appears above as an active manual link in the production graph.',
      'Approved on both sides',
      'samira.l',
      'Approved this week',
      {
        yesCount: Math.max(Math.ceil(item.memberCount * 0.75), 1),
        noCount: item.memberCount > 4 ? 1 : 0
      },
      { yesCount: 5, noCount: 1 }
    ),
    buildProjectManualLinkRequest(
      item,
      candidateTargets[1] ?? 'childcare-checkin-desk-service',
      'Childcare check-in desk service',
      'Blocked handoff relationship',
      'The linked project accumulated enough no votes that the request can no longer reach the required approval threshold there.',
      'Blocked on linked project side',
      'jules.p',
      'Closed yesterday',
      { yesCount: Math.max(Math.ceil(item.memberCount * 0.67), 1), noCount: 0 },
      { yesCount: 1, noCount: 3 }
    )
  ];
  const stateManualLinks = manualProjectLinkRequestsState
    .filter(
      (request) =>
        (request.sourceProjectSlug === item.slug || request.targetProjectSlug === item.slug) &&
        manualProjectLinkApprovedOnBothSides(request)
    )
    .map((request) => {
      const targetSlug = manualProjectLinkOtherSlug(request, item.slug);

      return projectFrameLink(
        item,
        targetSlug,
        request.relationshipLabel,
        request.summary,
        findPublicProjectItem(targetSlug)?.title ?? targetSlug
      );
    });
  const stateManualLinkRequests = manualProjectLinkRequestsState
    .filter(
      (request) =>
        (request.sourceProjectSlug === item.slug || request.targetProjectSlug === item.slug) &&
        !manualProjectLinkApprovedOnBothSides(request)
    )
    .map((request) => buildProjectManualLinkRequestFromState(item, request));
  const config = projectLifecycleBySlug[item.slug];
  const currentSubtype = currentProjectSubtypeForGovernance(item.slug);
  const memberCount = projectGovernancePopulation(item.slug, (projectMembersBySlug[item.slug] ?? []).length);
  const phaseChangeRequests = config
    ? buildProjectPhaseChangeRequests(
        item.slug,
        item.projectMode,
        config.currentPhaseId,
        projectLifecyclePhaseBlueprintsForProject(item.slug, item.projectMode, currentSubtype),
        calculateProjectQuorumThreshold(memberCount),
        memberCount
      )
    : [];
  const conversionWorkflow = buildProjectConversionWorkflow(item, phaseChangeRequests);
  const conversionLineage = buildProjectConversionLineage(item);

  return {
    projectSlug: item.slug,
    intro:
      'Links will show how this project connects to upstream work, downstream work, approved asset-use relationships, deliveries, and future project conversions.',
    autoLinks: [
      projectFrameLink(
        item,
        candidateTargets[0] ?? 'repair-cafe-shift-grid',
        'Auto link · approved shared resource dependency',
        'Fake preview only: this link shows how an approved in-house asset request could automatically connect two projects.',
        'Shared resource dependency'
      ),
      projectFrameLink(
        item,
        candidateTargets[1] ?? 'childcare-checkin-desk-service',
        'Auto link · completed delivery route',
        'Fake preview only: this link shows how completed delivery work could automatically stitch projects together in the network view.',
        'Completed delivery route'
      )
    ],
    manualLinks: [
      projectFrameLink(
        item,
        candidateTargets[2] ?? 'neighborhood-ride-coordination-service',
        'Manual proposal · member-approved relationship',
        'Fake preview only: this is how a member-proposed relationship would appear after both projects approve the link.',
        'Member-approved relationship'
      ),
      ...stateManualLinks
    ],
    manualLinkRequests: [...stateManualLinkRequests, ...seededManualLinkRequests],
    linkableProjects: buildLinkableProjects(item),
    viewerCanProposeLinks: !!currentViewer() && (projectMembersBySlug[item.slug] ?? []).includes(currentViewer()!.id),
    conversionNote:
      'If this project is later converted into another project type, that lineage will stay visible here as a permanent link.',
    conversionWorkflow,
    conversionLineage,
    requestFrames: buildProjectRequestFrames('links', item),
    placeholderSections: buildProjectPlaceholderSections([
      {
        id: 'auto-links',
        title: 'Auto-created links',
        body:
          'Approved asset-use requests, completed deliveries, and future project conversions will create links here automatically once those flows are live.'
      },
      {
        id: 'production-network',
        title: 'Network tracing',
        body:
          'Direct predecessors, direct successors, and longer production-network chains will all be framed in this tab as dedicated sections rather than mixed into overview copy.'
      },
      {
        id: 'conversion-lineage',
        title: 'Conversion lineage',
        body:
          'When a project converts into a new type, the predecessor and successor records stay linked here permanently so the production history remains visible.',
        statusLabel: 'Fake preview'
      }
    ])
  };
}

function buildProjectInventoryFrame(item: PublicProjectItem): ProjectInventoryFrameData | null {
  if (item.projectMode === 'personal-service') {
    return null;
  }

  const values = buildProjectValues(item.slug);
  const voteContextPopulation = projectGovernancePopulation(
    item.slug,
    (projectMembersBySlug[item.slug] ?? []).length
  );
  const phaseTwo = buildProductionPlans(
    item.slug,
    values,
    calculateProjectQuorumThreshold(voteContextPopulation),
    voteContextPopulation
  );

  const intro =
    item.projectMode === 'productive'
      ? 'Inventory will list collectively held means of production attached to this project once acquisition and asset operations open.'
      : 'Inventory will list the assets this service manages or keeps in custody once asset operations open.';

  return {
    projectSlug: item.slug,
    intro,
    statusLabel: 'Fake preview inventory',
    assetGroups: buildProjectInventoryAssetGroups(item),
    canRequestAssets:
      item.projectMode === 'collective-service' &&
      item.projectSubtype === 'asset-management' &&
      canViewerSubmitProjectServiceRequest(item.slug),
    requestFrames: buildProjectRequestFrames('inventory', item),
    acquisitionPreview: buildProjectPhaseFourPreview(
      item.slug,
      item,
      item.projectSubtype ?? null,
      phaseTwo,
      calculateProjectQuorumThreshold(voteContextPopulation),
      voteContextPopulation
    ),
    placeholderSections: buildProjectPlaceholderSections([
      {
        id: 'managed-assets',
        title: 'Managed assets',
        body:
          'Land management, storage, and acquisition-backed project assets will appear here as individual records with current custody and status once the asset registry is live.'
      },
      {
        id: 'borrowing-policy',
        title: 'Borrowing policy votes',
        body:
          'Projects that manage assets will get per-asset borrowing-policy votes here so members can decide what is available for individual borrowing and what stays project-use only.'
      },
      {
        id: 'asset-requests',
        title: 'Asset-use requests',
        body:
          'Approved plans that depend on in-house assets will route request and availability decisions through this tab once those governance flows are implemented.'
      },
      {
        id: 'acquisition-handoff',
        title: 'Acquisition handoff',
        body:
          'Fake preview only: once acquisition is confirmed, this tab will show how newly acquired items land in project inventory and the wider asset registry.',
        statusLabel: 'Fake preview'
      }
    ])
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
    authorProfileImageUrl:
      userById(item.author.id)?.profileImageUrl ?? item.author.profileImageUrl ?? null,
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
  const lifecycle = buildEventLifecycle(slug, item);
  const effectivePresentation = buildEffectiveEventPresentation(item, lifecycle);
  const signalSummary = lifecycle.phaseOne.signalSummary;
  const quorumThresholdPercent = lifecycle.quorumThresholdPercent;
  const updateRequests = buildEventUpdateRequests(
    slug,
    quorumThresholdPercent,
    lifecycle.voteContextPopulation
  );
  const editRequests = buildEventEditRequests(
    slug,
    quorumThresholdPercent,
    lifecycle.voteContextPopulation
  );
  const history = buildEventDecisionHistory(
    slug,
    userByUsername(item.createdByUsername)?.id ?? null,
    lifecycle,
    updateRequests,
    editRequests,
    canViewerVoteOnEventUpdate(slug),
    canViewerVoteOnEventEdit(slug)
  );
  const report = buildContentReportSummary(item.id);
  const isRemovedByReport = false;

  return {
    ...item,
    ...effectivePresentation,
    memberCount: memberState.memberCount,
    signalSummary,
    lifecycle,
    attendanceNote: extras.attendanceNote,
    agenda: extras.agenda,
    updates: extras.updates,
    updateRequests: updateRequests,
    viewerCanRequestUpdate: canViewerRequestEventUpdate(slug),
    viewerCanVoteOnUpdateRequests: canViewerVoteOnEventUpdate(slug),
    editRequests: editRequests,
    viewerCanRequestEdit: canViewerRequestEventEdit(slug),
    viewerCanVoteOnEditRequests: canViewerVoteOnEventEdit(slug),
    history,
    attendees: (participation?.goingUserIds ?? []).map((userId) => userById(userId)?.username ?? '').filter(Boolean),
    invitedUsernames: (participation?.invitedUserIds ?? [])
      .map((userId) => userById(userId)?.username ?? '')
      .filter(Boolean),
    eventEditors: memberState.eventEditors,
    members: memberState.members,
    viewerIsMember: memberState.viewerIsMember,
    viewerCanToggleMembership: memberState.viewerCanToggleMembership,
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
  const viewer = currentViewer();
  let updatedComment = false;

  for (const comments of Object.values(commentsBySubjectId)) {
    if (updateCommentVote(comments, targetId, nextVote)) {
      updatedComment = true;
      break;
    }
  }

  const confidence = confidenceState.get(targetId);

  if (confidence) {
    if (!viewer) {
      return;
    }

    if (nextVote) {
      confidence.votesByUserId[viewer.id] = nextVote;
    } else {
      delete confidence.votesByUserId[viewer.id];
    }

    setConfidenceVotes(targetId, confidence.votesByUserId);
    recordMeaningfulAction(viewer.id);

    const vote = voteState.get(targetId);

    if (vote) {
      const snapshot = buildConfidenceVoteSnapshot(targetId);
      vote.voteCount = snapshot ? snapshot.upVotes - snapshot.downVotes : 0;
      vote.activeVote = snapshot?.activeVote ?? 0;
    }

    return;
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

export function toggleMockEventMembership(eventSlug: string) {
  const viewer = currentViewer();
  const event = publicFeedBase.find(
    (item): item is PublicEventItem => item.kind === 'event' && item.slug === eventSlug
  );
  const eventId = event?.id;
  const participation = eventId ? eventParticipationById[eventId] : undefined;
  const creatorId = event ? userByUsername(event.createdByUsername)?.id ?? null : null;
  const viewerHasScopeAccess = !!viewer && !!event && viewerHasEventScopeAccess(event, viewer.id);
  const viewerCanToggle =
    !!viewer &&
    !!participation &&
    !!event &&
    (!event.isPrivate ||
      participation.invitedUserIds.includes(viewer.id) ||
      participation.goingUserIds.includes(viewer.id) ||
      creatorId === viewer.id ||
      viewerHasScopeAccess);

  if (!viewerCanToggle || !viewer || !participation || !event) {
    return;
  }

  const workflow = ensureEventWorkflowState(event.slug, creatorId);

  if (participation.goingUserIds.includes(viewer.id)) {
    participation.goingUserIds = participation.goingUserIds.filter((userId) => userId !== viewer.id);
    delete (eventGoingSinceById[event.id] ?? {})[viewer.id];

    if (creatorId !== viewer.id) {
      removeUserFromEventRequestVotes(event.slug, viewer.id);

      if (event.isPrivate) {
        workflow.editorUserIds = workflow.editorUserIds.filter((userId) => userId !== viewer.id);
      }
    }

    if (event.isPrivate && !participation.invitedUserIds.includes(viewer.id) && !viewerHasScopeAccess) {
      participation.invitedUserIds = [...participation.invitedUserIds, viewer.id];
      eventInvitedSinceById[event.id] = {
        ...(eventInvitedSinceById[event.id] ?? {}),
        [viewer.id]: new Date().toISOString()
      };
    }

    recordMeaningfulAction(viewer.id);

    return;
  }

  participation.goingUserIds = [...participation.goingUserIds, viewer.id];
  participation.invitedUserIds = participation.invitedUserIds.filter((userId) => userId !== viewer.id);
  delete (eventInvitedSinceById[event.id] ?? {})[viewer.id];
  eventGoingSinceById[event.id] = {
    ...(eventGoingSinceById[event.id] ?? {}),
    [viewer.id]: new Date().toISOString()
  };
  recordMeaningfulAction(viewer.id);
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

    return;
  }

  projectMembersBySlug[slug] = [viewer.id, ...memberIds];
  projectMembershipSinceBySlug[slug] = {
    ...(projectMembershipSinceBySlug[slug] ?? {}),
    [viewer.id]: new Date().toISOString()
  };
  recordMeaningfulAction(viewer.id);
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
      oppositionSignalUserIds: [],
      oppositionSignalCount: 0,
      values: [],
      phaseTwoPlans: [],
      phaseThreePlans: [],
      phaseFiveActivities: [],
      softwarePullRequests: [],
      softwareMergeCapabilityChangeRequests: [],
      softwareRepositoryReplacementRequests: [],
      softwareRepositoryHistory: [],
      serviceRequests: [],
      requestSettingsChangeRequests: [],
      serviceHistoryCompletions: {},
      revertHistory: [],
      phaseChangeRequests: [],
      updateRequests: [],
      editRequests: [],
      decisionHistory: []
    });

  workflow.serviceRequests ??= [];
  workflow.softwarePullRequests ??= [];
  workflow.softwareMergeCapabilityChangeRequests ??= [];
  workflow.softwareRepositoryReplacementRequests ??= [];
  workflow.softwareRepositoryHistory ??= [];
  workflow.oppositionSignalUserIds ??= [];
  workflow.oppositionSignalCount ??= workflow.oppositionSignalUserIds.length;
  workflow.requestSettingsChangeRequests ??= [];
  workflow.serviceHistoryCompletions ??= {};
  workflow.revertHistory ??= [];
  workflow.phaseChangeRequests ??= [];
  workflow.updateRequests ??= [];
  workflow.editRequests ??= [];
  workflow.decisionHistory ??= [];

  return workflow;
}

function ensureEventWorkflowState(slug: string, creatorId: string | null = null) {
  const event = findPublicEventItem(slug);
  const workflow =
    eventWorkflowStateBySlug[slug] ??
    (eventWorkflowStateBySlug[slug] = {
      editorUserIds: creatorId ? [creatorId] : [],
      currentPhaseId: event?.isPrivate ? 'event-plan' : 'proposal',
      signalCount: 0,
      signalUserIds: [],
      oppositionSignalCount: 0,
      oppositionSignalUserIds: [],
      eventValues: [],
      eventPlans: [],
      eventActivities: [],
      phaseChangeRequests: [],
      updateRequests: [],
      editRequests: [],
      decisionHistory: []
    });

  workflow.editorUserIds = Array.from(
    new Set([...(creatorId ? [creatorId] : []), ...(workflow.editorUserIds ?? [])])
  );
  workflow.currentPhaseId ??= event?.isPrivate ? 'event-plan' : 'proposal';
  workflow.signalCount ??= workflow.signalUserIds?.length ?? 0;
  workflow.signalUserIds ??= [];
  workflow.oppositionSignalUserIds ??= [];
  workflow.oppositionSignalCount ??= workflow.oppositionSignalUserIds.length;
  workflow.eventValues ??= [];
  workflow.eventPlans ??= [];
  workflow.eventActivities ??= [];
  workflow.phaseChangeRequests ??= [];
  workflow.updateRequests ??= [];
  workflow.editRequests ??= [];
  workflow.decisionHistory ??= [];

  return workflow;
}

function decisionHistoryLabel(kind: DecisionHistoryEntryKind, payload: RawDecisionHistoryPayload) {
  if ((kind === 'project-phase-change' || kind === 'event-phase-change') && payload.type === 'phase-change') {
    switch (payload.changeKind) {
      case 'close':
        return payload.closeOutcome === 'convert' ? 'Convert decision' : 'Close decision';
      case 'return':
        return 'Return decision';
      default:
        return 'Advance decision';
    }
  }

  switch (kind) {
    case 'project-pull-request-approval':
      return 'Pull request approval';
    case 'project-pull-request-confirmation':
      return 'Merge confirmation';
    case 'project-merge-capability-change':
      return payload.type === 'merge-capability'
        ? projectMergeCapabilityActionLabel(payload.action)
        : 'Merge capability decision';
    case 'project-repository-replacement':
      return 'Repository replacement';
    case 'project-request-settings-change':
      return 'Settings decision';
    case 'project-update':
    case 'event-update':
      return 'Update decision';
    default:
      return 'Edit decision';
  }
}

function projectPhaseChangeKind(
  slug: string,
  projectMode: ProjectMode,
  fromPhaseId: ProjectLifecyclePhaseId,
  toPhaseId: ProjectLifecyclePhaseId
) {
  const fromOrder = phaseOrderForProjectSlug(slug, projectMode, fromPhaseId);
  const toOrder = phaseOrderForProjectSlug(slug, projectMode, toPhaseId);

  if (toPhaseId === closePhaseIdForProjectSlug(slug, projectMode) && toOrder > fromOrder) {
    return 'close';
  }

  return toOrder > fromOrder ? 'advance' : 'return';
}

function buildDecisionHistoryFieldChanges(
  previousTitle: string,
  nextTitle: string,
  previousDescription: string,
  nextDescription: string
) {
  const changes: DecisionHistoryFieldChange[] = [];

  if (previousTitle !== nextTitle) {
    changes.push({
      label: 'Title',
      before: previousTitle,
      after: nextTitle
    });
  }

  if (previousDescription !== nextDescription) {
    changes.push({
      label: 'Description',
      before: previousDescription,
      after: nextDescription
    });
  }

  if (changes.length > 0) {
    return changes;
  }

  return [
    {
      label: 'Title',
      before: previousTitle,
      after: nextTitle
    },
    {
      label: 'Description',
      before: previousDescription,
      after: nextDescription
    }
  ];
}

function copyVotesByUserId(votesByUserId: Record<string, ProjectApprovalVote>) {
  return { ...votesByUserId };
}

function upsertDecisionHistoryEntry(
  entries: RawDecisionHistoryEntry[],
  entry: RawDecisionHistoryEntry | null
) {
  if (!entry || entries.some((item) => item.id === entry.id)) {
    return;
  }

  entries.unshift(entry);
}

function buildProjectRequestSettingsHistorySnapshot(
  projectMode: ProjectMode,
  settings: RawProjectRequestSystemSettings
): ProjectServiceRequestSettings {
  return {
    ...settings,
    summary: projectRequestSettingsSummary(projectMode, settings)
  };
}

function buildProjectPhaseChangeHistoryEntry(
  slug: string,
  request: RawProjectPhaseChangeRequest
): RawDecisionHistoryEntry | null {
  const config = projectLifecycleBySlug[slug];
  const projectMode = projectModeForSlug(slug);

  if (!config) {
    return null;
  }

  return {
    id: request.id,
    entityKind: 'project',
    kind: 'project-phase-change',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'phase-change',
      changeKind: projectPhaseChangeKind(slug, projectMode, config.currentPhaseId, request.targetPhaseId),
      fromPhaseId: config.currentPhaseId,
      toPhaseId: request.targetPhaseId,
      reason: request.reason,
      closeOutcome: request.closeOutcome,
      conversionTarget: request.conversionTarget ?? null
    }
  };
}

function buildProjectPullRequestHistoryRepositoryUrl(slug: string) {
  const memberCount = projectGovernancePopulation(slug, (projectMembersBySlug[slug] ?? []).length);
  const phaseTwo = buildProductionPlans(
    slug,
    buildProjectValues(slug),
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );

  return resolvedSoftwareRepositoryUrl(slug, phaseTwo);
}

function buildProjectPullRequestHistoryEntry(
  slug: string,
  request: RawProjectPullRequestRequest
): RawDecisionHistoryEntry | null {
  if (request.stage !== 'approval' && request.stage !== 'confirmation') {
    return null;
  }

  return {
    id:
      request.stage === 'approval'
        ? projectPullRequestApprovalDecisionId(request.id)
        : projectPullRequestConfirmationDecisionId(request.id),
    entityKind: 'project',
    kind:
      request.stage === 'approval'
        ? 'project-pull-request-approval'
        : 'project-pull-request-confirmation',
    createdAt: request.stage === 'confirmation' ? request.confirmationCreatedAt ?? request.createdAt : request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'pull-request',
      title: request.title,
      summary: request.summary,
      pullRequestId: request.pullRequestId,
      pullRequestUrl: request.pullRequestUrl,
      mergeId: request.mergeId ?? null,
      repositoryUrl: buildProjectPullRequestHistoryRepositoryUrl(slug)
    }
  };
}

function buildProjectMergeCapabilityChangeHistoryEntry(
  request: RawProjectMergeCapabilityChangeRequest
): RawDecisionHistoryEntry {
  return {
    id: projectMergeCapabilityChangeDecisionId(request.id),
    entityKind: 'project',
    kind: 'project-merge-capability-change',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'merge-capability',
      action: request.action,
      targetUsername: userById(request.targetUserId)?.username ?? request.targetUserId
    }
  };
}

function buildProjectRepositoryReplacementHistoryEntry(
  request: RawProjectRepositoryReplacementRequest
): RawDecisionHistoryEntry {
  return {
    id: projectRepositoryReplacementDecisionId(request.id),
    entityKind: 'project',
    kind: 'project-repository-replacement',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'repository-replacement',
      repositoryUrl: request.repositoryUrl,
      previousRepositoryUrl: request.previousRepositoryUrl,
      reason: request.reason,
      relatedPullRequestId: request.relatedPullRequestId
    }
  };
}

function buildProjectUpdateHistoryEntry(request: RawProjectUpdateRequest): RawDecisionHistoryEntry {
  return {
    id: request.id,
    entityKind: 'project',
    kind: 'project-update',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'update',
      body: request.body,
      appliedUpdateId: null
    }
  };
}

function buildProjectEditHistoryEntry(
  slug: string,
  request: RawProjectEditRequest
): RawDecisionHistoryEntry | null {
  const item = findPublicProjectItem(slug);
  const extras = projectDetailExtras[slug];

  if (!item || !extras) {
    return null;
  }

  return {
    id: request.id,
    entityKind: 'project',
    kind: 'project-edit',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'edit',
      changes: buildDecisionHistoryFieldChanges(
        item.title,
        request.title,
        extras.overview,
        request.description
      )
    }
  };
}

function buildProjectRequestSettingsHistoryEntry(
  slug: string,
  request: RawProjectServiceRequestSettingsChangeRequest
): RawDecisionHistoryEntry {
  const projectMode = projectModeForSlug(slug);
  const currentSettings = resolvedProjectRequestSettingsForProject(slug, projectMode);

  return {
    id: request.id,
    entityKind: 'project',
    kind: 'project-request-settings-change',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'settings-change',
      reason: request.reason,
      previousSettings: currentSettings,
      proposedSettings: request.proposedSettings
    }
  };
}

function buildEventUpdateHistoryEntry(request: RawEventUpdateRequest): RawDecisionHistoryEntry {
  return {
    id: request.id,
    entityKind: 'event',
    kind: 'event-update',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'update',
      body: request.body,
      appliedUpdateId: null
    }
  };
}

function buildEventEditHistoryEntry(
  slug: string,
  request: RawEventEditRequest
): RawDecisionHistoryEntry | null {
  const event = findPublicEventItem(slug);

  if (!event) {
    return null;
  }

  const effectivePresentation = buildEffectiveEventPresentation(event);

  return {
    id: request.id,
    entityKind: 'event',
    kind: 'event-edit',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'edit',
      changes: buildDecisionHistoryFieldChanges(
        effectivePresentation.title,
        request.title,
        effectivePresentation.description,
        request.description
      )
    }
  };
}

function buildEventPhaseChangeHistoryEntry(
  slug: string,
  request: RawEventPhaseChangeRequest
): RawDecisionHistoryEntry | null {
  const event = findPublicEventItem(slug);
  const workflow = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? '')?.id ?? null);
  const fromPhaseId = event ? workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event) : 'proposal';

  if (!event) {
    return null;
  }

  return {
    id: request.id,
    entityKind: 'event',
    kind: 'event-phase-change',
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: 'open',
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: 'phase-change',
      changeKind: eventPhaseChangeKind(event, fromPhaseId, request.targetPhaseId),
      fromPhaseId,
      toPhaseId: request.targetPhaseId,
      reason: request.reason
    }
  };
}

function ensureProjectDecisionHistorySeeded(slug: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const history = (workflow.decisionHistory ??= []);

  for (const request of workflow.requestSettingsChangeRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildProjectRequestSettingsHistoryEntry(slug, request));
  }

  for (const request of workflow.phaseChangeRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildProjectPhaseChangeHistoryEntry(slug, request));
  }

  for (const request of workflow.updateRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildProjectUpdateHistoryEntry(request));
  }

  for (const request of workflow.editRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildProjectEditHistoryEntry(slug, request));
  }

  for (const request of workflow.softwarePullRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildProjectPullRequestHistoryEntry(slug, request));
  }

  for (const request of workflow.softwareMergeCapabilityChangeRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildProjectMergeCapabilityChangeHistoryEntry(request));
  }

  for (const request of workflow.softwareRepositoryReplacementRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildProjectRepositoryReplacementHistoryEntry(request));
  }
}

function ensureEventDecisionHistorySeeded(slug: string, creatorId: string | null = null) {
  const workflow = ensureEventWorkflowState(slug, creatorId);
  const history = (workflow.decisionHistory ??= []);

  for (const request of workflow.phaseChangeRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildEventPhaseChangeHistoryEntry(slug, request));
  }

  for (const request of workflow.updateRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildEventUpdateHistoryEntry(request));
  }

  for (const request of workflow.editRequests ?? []) {
    upsertDecisionHistoryEntry(history, buildEventEditHistoryEntry(slug, request));
  }
}

function finalizeDecisionHistoryEntry(
  entries: RawDecisionHistoryEntry[],
  entryId: string,
  status: DecisionHistoryStatus,
  votesByUserId: Record<string, ProjectApprovalVote>,
  eligibleVoterCount: number,
  updatePayload?: (payload: RawDecisionHistoryPayload) => void
) {
  const entry = entries.find((item) => item.id === entryId);

  if (!entry) {
    return;
  }

  entry.status = status;
  entry.finalVotesByUserId = copyVotesByUserId(votesByUserId);
  entry.finalEligibleVoterCount = eligibleVoterCount;

  if (updatePayload) {
    updatePayload(entry.payload);
  }
}

function finalizeProjectDecisionHistoryEntry(
  slug: string,
  entryId: string,
  status: DecisionHistoryStatus,
  votesByUserId: Record<string, ProjectApprovalVote>,
  eligibleVoterCount: number,
  updatePayload?: (payload: RawDecisionHistoryPayload) => void
) {
  const workflow = ensureProjectWorkflowState(slug);
  ensureProjectDecisionHistorySeeded(slug);
  finalizeDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    entryId,
    status,
    votesByUserId,
    eligibleVoterCount,
    updatePayload
  );
}

function finalizeEventDecisionHistoryEntry(
  slug: string,
  entryId: string,
  status: DecisionHistoryStatus,
  votesByUserId: Record<string, ProjectApprovalVote>,
  eligibleVoterCount: number,
  creatorId: string | null,
  updatePayload?: (payload: RawDecisionHistoryPayload) => void
) {
  const workflow = ensureEventWorkflowState(slug, creatorId);
  ensureEventDecisionHistorySeeded(slug, creatorId);
  finalizeDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    entryId,
    status,
    votesByUserId,
    eligibleVoterCount,
    updatePayload
  );
}

function removeUserFromEventRequestVotes(slug: string, userId: string) {
  const workflow = eventWorkflowStateBySlug[slug];

  if (!workflow) {
    return;
  }

  const username = userById(userId)?.username ?? null;

  for (const request of workflow.phaseChangeRequests ?? []) {
    delete request.votesByUserId[userId];
  }

  for (const request of workflow.updateRequests ?? []) {
    delete request.votesByUserId[userId];
  }

  for (const request of workflow.editRequests ?? []) {
    delete request.votesByUserId[userId];
  }

  for (const plan of workflow.eventPlans ?? []) {
    delete plan.overallVotesByUserId[userId];
    for (const votesByUserId of Object.values(plan.valueVotesByValueId)) {
      delete votesByUserId[userId];
    }
  }

  if (!username) {
    return;
  }

  for (const activity of workflow.eventActivities ?? []) {
    for (const role of activity.roles) {
      role.assignedUsernames = role.assignedUsernames.filter((assigned) => assigned !== username);
    }
  }
}

function ensureEventMembership(slug: string, userId: string) {
  const event = findPublicEventItem(slug);

  if (!event) {
    return;
  }

  const creatorId = userByUsername(event.createdByUsername)?.id ?? null;

  if (creatorId === userId) {
    return;
  }

  const participation =
    eventParticipationById[event.id] ??
    (eventParticipationById[event.id] = { goingUserIds: [], invitedUserIds: [] });
  const viewerIsInvited = participation.invitedUserIds.includes(userId);

  if (event.isPrivate && !viewerIsInvited && !participation.goingUserIds.includes(userId)) {
    return;
  }

  if (!participation.goingUserIds.includes(userId)) {
    participation.goingUserIds = [userId, ...participation.goingUserIds];
  }

  participation.invitedUserIds = participation.invitedUserIds.filter((invitedUserId) => invitedUserId !== userId);
  delete (eventInvitedSinceById[event.id] ?? {})[userId];
  eventGoingSinceById[event.id] = {
    ...(eventGoingSinceById[event.id] ?? {}),
    [userId]: new Date().toISOString()
  };
}

function canViewerEditEventPhase(slug: string, phaseId: Extract<EventLifecyclePhaseId, 'proposal' | 'event-plan'>) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);

  if (!viewer || !event) {
    return false;
  }

  const currentPhaseId =
    ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null).currentPhaseId ??
    defaultEventCurrentPhaseId(event);

  if (currentPhaseId !== phaseId) {
    return false;
  }

  if (!event.isPrivate && canViewerParticipateInPlatformEventGovernance(slug)) {
    return true;
  }

  return buildEventMemberState(event).viewerHasEventEditAccess;
}

function canViewerRequestProjectPhaseChange(slug: string) {
  if (projectModeForSlug(slug) === 'personal-service') {
    return false;
  }

  if (canViewerParticipateInPlatformProjectGovernance(slug)) {
    return true;
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

  if (canViewerParticipateInPlatformProjectGovernance(slug)) {
    return true;
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

  if (canViewerParticipateInPlatformProjectGovernance(slug)) {
    return true;
  }

  return buildProjectMemberState(slug).viewerIsMember;
}

function canViewerVoteOnProjectEdit(slug: string) {
  return canViewerRequestProjectEdit(slug);
}

function canViewerRequestEventUpdate(slug: string) {
  const event = findPublicEventItem(slug);

  if (!event) {
    return false;
  }

  if (!event.isPrivate && canViewerParticipateInPlatformEventGovernance(slug)) {
    return true;
  }

  return buildEventMemberState(event).viewerHasEventEditAccess;
}

function canViewerRequestEventPhaseChange(slug: string) {
  const event = findPublicEventItem(slug);

  if (!event) {
    return false;
  }

  if (canViewerParticipateInPlatformEventGovernance(slug)) {
    return true;
  }

  return buildEventMemberState(event).viewerHasEventEditAccess;
}

function canViewerVoteOnEventPhaseChange(slug: string) {
  return canViewerRequestEventPhaseChange(slug);
}

function canViewerVoteOnEventUpdate(slug: string) {
  return canViewerRequestEventUpdate(slug);
}

function canViewerRequestEventEdit(slug: string) {
  const event = findPublicEventItem(slug);

  if (!event) {
    return false;
  }

  if (!event.isPrivate && canViewerParticipateInPlatformEventGovernance(slug)) {
    return true;
  }

  return buildEventMemberState(event).viewerHasEventEditAccess;
}

function canViewerVoteOnEventEdit(slug: string) {
  return canViewerRequestEventEdit(slug);
}

function canViewerCreateEventActivity(slug: string) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);

  if (!viewer || !event) {
    return false;
  }

  const currentPhaseId =
    ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null).currentPhaseId ??
    defaultEventCurrentPhaseId(event);

  return currentPhaseId === 'activity' && buildEventMemberState(event).viewerIsMember;
}

function canViewerEditEventActivityCommitment(slug: string) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);

  if (!viewer || !event) {
    return false;
  }

  const currentPhaseId =
    ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null).currentPhaseId ??
    defaultEventCurrentPhaseId(event);

  return currentPhaseId === 'activity' && buildEventMemberState(event).viewerCanToggleMembership;
}

function canAdvanceMockEventPhaseNow(slug: string) {
  const event = findPublicEventItem(slug);

  if (!event) {
    return false;
  }

  const currentPhaseId =
    ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null).currentPhaseId ??
    defaultEventCurrentPhaseId(event);

  const memberState = buildEventMemberState(event);
  const voteContextPopulation = eventGovernancePopulation(event, memberState.eligibleVoterCount);
  const phaseTwo = buildEventPlans(
    slug,
    event,
    buildEventValues(slug),
    calculateProjectQuorumThreshold(voteContextPopulation),
    voteContextPopulation
  );

  switch (currentPhaseId) {
    case 'proposal':
      return buildEventSignalSummary(event)?.advancementUnlocked ?? false;
    case 'event-plan':
      return !!phaseTwo.winningPlanId;
    case 'activity':
      return true;
    default:
      return false;
  }
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

  return projectGovernancePopulation(slug, memberState.memberCount);
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

function viewerIsActivePlatformBoardMember() {
  const viewer = currentViewer();

  return !!viewer && buildPlatformBoardRoster().activeMembers.some((member) => member.id === viewer.id);
}

function normalizeProjectAcquisitionBundles(
  slug: string,
  bundles: ProjectAcquisitionPlanBundleInput[] | undefined,
  timestamp: number
) {
  const validServiceSlugs = new Set(
    availableAssetManagementServiceOptionsForProject(slug).map((option) => option.slug)
  );

  const normalized: RawProjectAcquisitionBundle[] = [];

  (bundles ?? []).forEach((bundle, index) => {
      const title = bundle.title.trim();
      const destinationType = bundle.destinationType;
      const existingServiceProjectSlug = bundle.existingServiceProjectSlug?.trim() ?? '';
      const newServiceTitle = bundle.newServiceTitle?.trim() ?? '';
      const note = bundle.note?.trim() ?? '';

      if (!title) {
        return;
      }

      if (destinationType === 'existing-service' && !validServiceSlugs.has(existingServiceProjectSlug)) {
        return;
      }

      if (destinationType === 'new-service' && !newServiceTitle) {
        return;
      }

      normalized.push({
        id: bundle.id?.trim() || `acquisition-bundle-${slug}-${timestamp}-${index}`,
        title,
        destinationType,
        existingServiceProjectSlug:
          destinationType === 'existing-service' ? existingServiceProjectSlug : undefined,
        newServiceTitle: destinationType === 'new-service' ? newServiceTitle : undefined,
        note
      });
    });

  return normalized;
}

function normalizeProjectAcquisitionPurchaseRows(
  slug: string,
  purchaseRows: ProjectAcquisitionPurchaseRowInput[] | undefined,
  bundleIds: Set<string>,
  timestamp: number
) {
  const normalized: RawProjectAcquisitionPurchaseRow[] = [];

  (purchaseRows ?? []).forEach((purchaseRow, index) => {
      const title = purchaseRow.title.trim();
      const costLabel = purchaseRow.costLabel.trim();
      const purchaseHref = purchaseRow.purchaseHref.trim();
      const destinationBundleId = purchaseRow.destinationBundleId.trim();
      const note = purchaseRow.note?.trim() ?? '';

      if (!title || !costLabel || !purchaseHref || !bundleIds.has(destinationBundleId)) {
        return;
      }

      normalized.push({
        id: purchaseRow.id?.trim() || `acquisition-purchase-${slug}-${timestamp}-${index}`,
        title,
        costLabel,
        purchaseHref,
        destinationBundleId,
        note
      });
    });

  return normalized;
}

function acquisitionSummaryFromPurchaseRows(
  bundles: RawProjectAcquisitionBundle[],
  purchaseRows: RawProjectAcquisitionPurchaseRow[],
  fallbackSummary: string
) {
  if (purchaseRows.length === 0) {
    return fallbackSummary;
  }

  const destinationLabelByBundleId = new Map(
    bundles.map((bundle) => [bundle.id, acquisitionBundleDestinationLabel(bundle)])
  );

  return purchaseRows
    .map(
      (purchaseRow) =>
        `${purchaseRow.title} (${purchaseRow.costLabel}) -> ${destinationLabelByBundleId.get(purchaseRow.destinationBundleId) ?? 'Unassigned asset-management service'}`
    )
    .join('; ');
}

function canViewerManageProjectPhase(slug: string) {
  return buildProjectMemberState(slug).viewerIsMember;
}

function canViewerEditProjectPhase(slug: string, phaseId: ProjectLifecyclePhaseId) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];

  return (
    !!viewer &&
    (memberIds.includes(viewer.id) || canViewerParticipateInPlatformProjectGovernance(slug)) &&
    projectLifecycleBySlug[slug]?.currentPhaseId === phaseId
  );
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

function updateEventPlanValueVoteMap(
  slug: string,
  planId: string,
  valueId: string,
  viewerId: string,
  vote: ProjectApprovalVote | null
) {
  const event = findPublicEventItem(slug);
  const plan = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? '')?.id ?? null)
    .eventPlans?.find((item) => item.id === planId);

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

function updateEventPlanOverallVoteMap(
  slug: string,
  planId: string,
  viewerId: string,
  vote: ProjectApprovalVote | null
) {
  const event = findPublicEventItem(slug);
  const plan = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? '')?.id ?? null)
    .eventPlans?.find((item) => item.id === planId);

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
  setMockProjectSignal(slug, 'demand');
}

function hydratedSignalCount(count: number | undefined, userIds: string[]) {
  return Math.max(count ?? 0, uniqueUserIds(userIds).length);
}

export function setMockProjectSignal(slug: string, signal: GovernanceSignalType) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);

  if (!viewer || !supportsProjectDemandSignals(projectModeForSlug(slug))) {
    return;
  }

  const demandUserIds = uniqueUserIds(workflow.signalUserIds);
  const oppositionUserIds = uniqueUserIds(workflow.oppositionSignalUserIds ?? []);
  const demandActive = demandUserIds.includes(viewer.id);
  const oppositionActive = oppositionUserIds.includes(viewer.id);
  const demandCount = hydratedSignalCount(workflow.signalCount, demandUserIds);
  const oppositionCount = hydratedSignalCount(workflow.oppositionSignalCount, oppositionUserIds);

  workflow.signalUserIds = demandUserIds.filter((userId) => userId !== viewer.id);
  workflow.signalCount = Math.max(demandCount - (demandActive ? 1 : 0), 0);
  workflow.oppositionSignalUserIds = oppositionUserIds.filter((userId) => userId !== viewer.id);
  workflow.oppositionSignalCount = Math.max(oppositionCount - (oppositionActive ? 1 : 0), 0);

  if ((signal === 'demand' && demandActive) || (signal === 'opposition' && oppositionActive)) {
    recordMeaningfulAction(viewer.id);
    return;
  }

  if (signal === 'demand') {
    workflow.signalUserIds = [viewer.id, ...workflow.signalUserIds];
    workflow.signalCount += 1;
  } else {
    workflow.oppositionSignalUserIds = [viewer.id, ...(workflow.oppositionSignalUserIds ?? [])];
    workflow.oppositionSignalCount = (workflow.oppositionSignalCount ?? 0) + 1;
  }

  recordMeaningfulAction(viewer.id);
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
  recordMeaningfulAction(viewer.id);
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
  recordMeaningfulAction(viewer.id);
}

export function addMockProjectProductionPlan(slug: string, input: ProjectProductionPlanInput) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const projectMode = projectModeForSlug(slug);
  const allowedSubtypes = projectSubtypeOptions(projectMode)
    .filter((option) => !option.disabled)
    .map((option) => option.value);
  const values = workflow.values;
  const description = input.description.trim();
  const repositoryUrl = input.repositoryUrl?.trim() ?? '';
  const demandConsiderationNote = input.demandConsiderationNote.trim();
  const totalCostLabel = input.totalCostLabel.trim();
  const timestamp = Date.now();
  const planPhases = input.planPhases
    .map((phase, index) => ({
      id: `plan-phase-${slug}-${timestamp}-${index}`,
      title: phase.title.trim(),
      details: phase.details.trim(),
      materialsLabel: phase.materialsLabel.trim(),
      costLabel: phase.costLabel.trim()
    }))
    .filter((phase) => phase.title && phase.details && phase.costLabel);
  const acquisitionBundles = normalizeProjectAcquisitionBundles(slug, input.acquisitionBundles, timestamp);
  const purchaseRows = normalizeProjectAcquisitionPurchaseRows(
    slug,
    input.purchaseRows,
    new Set(acquisitionBundles.map((bundle) => bundle.id)),
    timestamp
  );

  if (
    !viewer ||
    !canViewerEditProjectPhase(slug, 'phase-2') ||
    !input.title.trim() ||
    !allowedSubtypes.includes(input.projectSubtype) ||
    !description ||
    (input.projectSubtype === 'software' && !repositoryUrl) ||
    !demandConsiderationNote ||
    !totalCostLabel ||
    planPhases.length === 0 ||
    acquisitionBundles.length !== (input.acquisitionBundles?.length ?? 0) ||
    purchaseRows.length !== (input.purchaseRows?.length ?? 0)
  ) {
    return false;
  }

  const phaseDetailsSummary = planPhases.map((phase) => `${phase.title}: ${phase.details}`).join(' ');
  const phaseMaterialSummary = planPhases
    .map((phase) => `${phase.materialsLabel || 'No materials listed'} (${phase.costLabel})`)
    .join(' ');

  workflow.phaseTwoPlans = [
    {
      id: `production-plan-${slug}-${timestamp}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      createdAt: new Date().toISOString(),
      description,
      projectSubtype: input.projectSubtype,
      repositoryUrl: input.projectSubtype === 'software' ? repositoryUrl : undefined,
      demandSignalSnapshot: workflow.signalCount,
      demandConsiderationNote,
      planPhases,
      outputSummary: input.outputSummary?.trim() || description,
      materialsSummary: input.materialsSummary?.trim() || phaseDetailsSummary,
      totalCostLabel,
      acquisitionsSummary: acquisitionSummaryFromPurchaseRows(
        acquisitionBundles,
        purchaseRows,
        input.acquisitionsSummary?.trim() || phaseMaterialSummary
      ),
      acquisitionBundles,
      purchaseRows,
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
  recordMeaningfulAction(viewer.id);
  return true;
}

export function updateMockProjectProductionPlan(
  slug: string,
  planId: string,
  input: ProjectProductionPlanInput
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const existingPlanIndex = workflow.phaseTwoPlans.findIndex((plan) => plan.id === planId);
  const existingPlan = existingPlanIndex >= 0 ? workflow.phaseTwoPlans[existingPlanIndex] : null;
  const projectMode = projectModeForSlug(slug);
  const allowedSubtypes = projectSubtypeOptions(projectMode)
    .filter((option) => !option.disabled)
    .map((option) => option.value);
  const description = input.description.trim();
  const repositoryUrl = input.repositoryUrl?.trim() ?? '';
  const demandConsiderationNote = input.demandConsiderationNote.trim();
  const totalCostLabel = input.totalCostLabel.trim();
  const timestamp = Date.now();
  const planPhases = input.planPhases
    .map((phase, index) => ({
      id: `plan-phase-${slug}-${timestamp}-${index}`,
      title: phase.title.trim(),
      details: phase.details.trim(),
      materialsLabel: phase.materialsLabel.trim(),
      costLabel: phase.costLabel.trim()
    }))
    .filter((phase) => phase.title && phase.details && phase.costLabel);
  const acquisitionBundles = normalizeProjectAcquisitionBundles(slug, input.acquisitionBundles, timestamp);
  const purchaseRows = normalizeProjectAcquisitionPurchaseRows(
    slug,
    input.purchaseRows,
    new Set(acquisitionBundles.map((bundle) => bundle.id)),
    timestamp
  );

  if (
    !viewer ||
    !existingPlan ||
    existingPlan.authorUsername !== viewer.username ||
    !canViewerEditProjectPhase(slug, 'phase-2') ||
    !input.title.trim() ||
    !allowedSubtypes.includes(input.projectSubtype) ||
    !description ||
    (input.projectSubtype === 'software' && !repositoryUrl) ||
    !demandConsiderationNote ||
    !totalCostLabel ||
    planPhases.length === 0 ||
    acquisitionBundles.length !== (input.acquisitionBundles?.length ?? 0) ||
    purchaseRows.length !== (input.purchaseRows?.length ?? 0)
  ) {
    return false;
  }

  const phaseDetailsSummary = planPhases.map((phase) => `${phase.title}: ${phase.details}`).join(' ');
  const phaseMaterialSummary = planPhases
    .map((phase) => `${phase.materialsLabel || 'No materials listed'} (${phase.costLabel})`)
    .join(' ');

  workflow.phaseTwoPlans[existingPlanIndex] = {
    ...existingPlan,
    title: input.title.trim(),
    description,
    projectSubtype: input.projectSubtype,
    repositoryUrl: input.projectSubtype === 'software' ? repositoryUrl : undefined,
    demandSignalSnapshot: workflow.signalCount,
    demandConsiderationNote,
    planPhases,
    outputSummary: input.outputSummary?.trim() || description,
    materialsSummary: input.materialsSummary?.trim() || phaseDetailsSummary,
    totalCostLabel,
    acquisitionsSummary: acquisitionSummaryFromPurchaseRows(
      acquisitionBundles,
      purchaseRows,
      input.acquisitionsSummary?.trim() || phaseMaterialSummary
    ),
    acquisitionBundles,
    purchaseRows,
    overallVotesByUserId: {
      [viewer.id]: 'yes'
    },
    valueVotesByValueId: Object.fromEntries(
      [
        [demandSignalAssessmentValueId, { [viewer.id]: 'yes' as ProjectApprovalVote }],
        ...workflow.values.map((value) => [value.id, { [viewer.id]: 'yes' as ProjectApprovalVote }])
      ]
    )
  };

  recordMeaningfulAction(viewer.id);
  return true;
}

export function addMockProjectDistributionPlan(slug: string, input: ProjectDistributionPlanInput) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const values = buildProjectValues(slug);
  const governancePopulation = projectGovernancePopulation(slug, (projectMembersBySlug[slug] ?? []).length);
  const phaseTwo = buildProductionPlans(
    slug,
    values,
    calculateProjectQuorumThreshold(governancePopulation),
    governancePopulation
  );
  const currentSubtype = currentProjectSubtypeForLifecycle(slug, phaseTwo);
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
    .filter((phase) => phase.title && phase.details && phase.costLabel);

  if (
    !viewer ||
    currentSubtype === 'software' ||
    !canViewerEditProjectPhase(slug, 'phase-3') ||
    !input.title.trim() ||
    !description ||
    !demandConsiderationNote ||
    !totalCostLabel ||
    planPhases.length === 0
  ) {
    return false;
  }

  const phaseDetailsSummary = planPhases.map((phase) => `${phase.title}: ${phase.details}`).join(' ');
  const phaseMaterialSummary = planPhases
    .map((phase) => `${phase.materialsLabel || 'No materials listed'} (${phase.costLabel})`)
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
  recordMeaningfulAction(viewer.id);
  return true;
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

export function recordMockProjectAcquisitionExecution(
  slug: string,
  input: ProjectAcquisitionExecutionInput
) {
  const viewer = currentViewer();
  const projectItem = findPublicProjectItem(slug);
  const proofLabel = input.proofLabel.trim();
  const note = input.note?.trim() ?? '';

  if (
    !viewer ||
    !projectItem ||
    !viewerIsActivePlatformBoardMember() ||
    projectLifecycleBySlug[slug]?.currentPhaseId !== 'phase-4' ||
    projectFundProgressForSlug(slug)?.status !== 'completed' ||
    !proofLabel
  ) {
    return false;
  }

  const values = buildProjectValues(slug);
  const voteContextPopulation = projectGovernancePopulation(slug, (projectMembersBySlug[slug] ?? []).length);
  const phaseTwo = buildProductionPlans(
    slug,
    values,
    calculateProjectQuorumThreshold(voteContextPopulation),
    voteContextPopulation
  );
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);

  if (!winningPlan || winningPlan.purchaseRows.length === 0) {
    return false;
  }

  const workflow = ensureProjectWorkflowState(slug);
  const recordedAt = new Date().toISOString();

  workflow.acquisition = {
    confirmationVotesByUserId: {},
    execution: {
      proofLabel,
      note:
        note ||
        'Board execution recorded. The resulting pending asset entries now wait for member confirmation before going live.',
      recordedAt,
      recordedByUsername: viewer.username,
      pendingAssets: winningPlan.purchaseRows.map((purchaseRow, index) => ({
        id: `pending-asset-${slug}-${Date.now()}-${index}`,
        title: purchaseRow.title,
        destinationBundleId: purchaseRow.destinationBundleId,
        destinationLabel: purchaseRow.destinationLabel,
        note:
          purchaseRow.note ||
          'This pending asset entry was created from a recorded execution and waits for member confirmation before inventory handoff.'
      }))
    }
  };

  recordMeaningfulAction(viewer.id);
  return true;
}

export function setMockProjectAcquisitionConfirmationVote(
  slug: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);

  if (!viewer || !workflow.acquisition?.execution || !canViewerEditProjectPhase(slug, 'phase-4')) {
    return;
  }

  if (!vote) {
    delete workflow.acquisition.confirmationVotesByUserId[viewer.id];
  } else {
    workflow.acquisition.confirmationVotesByUserId[viewer.id] = vote;
  }

  recordMeaningfulAction(viewer.id);
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

export function createMockProjectManualLinkRequest(
  projectSlug: string,
  targetProjectSlug: string,
  relationshipLabel: string,
  summary: string
) {
  const viewer = currentViewer();
  const trimmedRelationshipLabel = relationshipLabel.trim();
  const trimmedSummary = summary.trim();
  const sourceProject = findPublicProjectItem(projectSlug);
  const targetProject = findPublicProjectItem(targetProjectSlug);

  if (
    !viewer ||
    !sourceProject ||
    !targetProject ||
    projectSlug === targetProjectSlug ||
    !trimmedRelationshipLabel ||
    !trimmedSummary ||
    !(projectMembersBySlug[projectSlug] ?? []).includes(viewer.id)
  ) {
    return;
  }

  const nextPairKey = manualProjectLinkPairKey(projectSlug, targetProjectSlug);

  if (
    manualProjectLinkRequestsState.some(
      (request) => manualProjectLinkPairKey(request.sourceProjectSlug, request.targetProjectSlug) === nextPairKey
    )
  ) {
    return;
  }

  manualProjectLinkRequestsState = [
    {
      id: `manual-link-${projectSlug}-${targetProjectSlug}-${Date.now()}`,
      sourceProjectSlug: projectSlug,
      targetProjectSlug,
      relationshipLabel: trimmedRelationshipLabel,
      summary: trimmedSummary,
      proposedByUserId: viewer.id,
      createdAt: new Date().toISOString(),
      sourceVotesByUserId: {
        [viewer.id]: 'yes'
      },
      targetVotesByUserId: {}
    },
    ...manualProjectLinkRequestsState
  ];
  recordMeaningfulAction(viewer.id);
}

export function setMockProjectManualLinkVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const request = manualProjectLinkRequestsState.find((entry) => entry.id === requestId);

  if (
    !viewer ||
    !request ||
    (request.sourceProjectSlug !== projectSlug && request.targetProjectSlug !== projectSlug) ||
    !(projectMembersBySlug[projectSlug] ?? []).includes(viewer.id)
  ) {
    return;
  }

  const votesByUserId =
    request.sourceProjectSlug === projectSlug ? request.sourceVotesByUserId : request.targetVotesByUserId;

  if (!vote) {
    delete votesByUserId[viewer.id];
  } else {
    votesByUserId[viewer.id] = vote;
  }

  recordMeaningfulAction(viewer.id);
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
    finalizeProjectDecisionHistoryEntry(
      slug,
      requestId,
      'rejected',
      request.votesByUserId,
      eligibleVoterCount
    );
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
  finalizeProjectDecisionHistoryEntry(
    slug,
    requestId,
    'approved',
    request.votesByUserId,
    eligibleVoterCount
  );
  workflow.requestSettingsChangeRequests = (workflow.requestSettingsChangeRequests ?? []).filter(
    (item) => item.id !== requestId
  );
}

function buildProjectServiceHistoryItemById(slug: string, historyId: string) {
  const projectMode = projectModeForSlug(slug);
  const memberCount = (projectMembersBySlug[slug] ?? []).length;
  const governancePopulation = projectGovernancePopulation(slug, memberCount);
  const quorumThresholdPercent = calculateProjectQuorumThreshold(governancePopulation);
  const values = buildProjectValues(slug);
  const phaseTwo = buildProductionPlans(slug, values, quorumThresholdPercent, governancePopulation);
  const phaseThree = buildDistributionPlans(
    slug,
    values,
    quorumThresholdPercent,
    governancePopulation,
    phaseTwo
  );
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
  const request: RawProjectServiceRequestSettingsChangeRequest = {
    id: requestId,
    reason: trimmedReason,
    authorUsername: viewer.username,
    createdAt,
    proposedSettings,
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };
  workflow.requestSettingsChangeRequests = [
    request,
    ...(workflow.requestSettingsChangeRequests ?? [])
  ];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectRequestSettingsHistoryEntry(slug, request)
  );

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
  const closingPhaseId = closePhaseIdForProjectSlug(slug, projectMode);

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

  const nextPhaseId = nextProjectPhaseIdForSlug(slug, config.currentPhaseId, projectMode);

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

  if (!revertableProjectPhaseIdsForSlug(slug, projectMode, config.currentPhaseId).includes(targetPhaseId)) {
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

function createProjectDescription(input: CreateProjectInput) {
  const pieces = [input.description.trim()];

  if (input.note?.trim()) {
    pieces.push(input.note.trim());
  }

  return pieces.join(' ');
}

export function createMockProject(input: CreateProjectInput): CreateResult {
  const viewer = currentViewer();
  const title = input.title.trim();
  const description = input.description.trim();
  const locationLabel = projectLocationLabel(input.locationLabel);
  const channelTags = input.channelTags;
  const communityTags = input.communityTags;
  const validChannelSlugs = new Set(channelDirectory.map((item) => item.slug));
  const validCommunitySlugs = new Set(communityDirectory.map((item) => item.slug));
  const isPlatformProject = channelTags.some((tag) => tag.slug === platform.slug);

  if (!viewer) {
    return {
      ok: false,
      error: 'Sign in before creating a project.'
    };
  }

  if (!title || !description || channelTags.length === 0) {
    return {
      ok: false,
      error: 'Projects need a title, description, and at least one channel tag.'
    };
  }

  if (
    channelTags.some((tag) => !validChannelSlugs.has(tag.slug)) ||
    communityTags.some((tag) => !validCommunitySlugs.has(tag.slug))
  ) {
    return {
      ok: false,
      error: 'Projects can only use real channel and community tags.'
    };
  }

  if (input.projectMode === 'personal-service' && isPlatformProject) {
    return {
      ok: false,
      error: 'Personal service projects cannot use the platform channel.'
    };
  }

  const slug = uniqueSlug(title);
  const createdAt = new Date().toISOString();
  const id = `project-${slug}`;

  publicFeedBase.unshift({
    kind: 'project',
    id,
    slug,
    href: `/projects/${slug}`,
    createdAt,
    title,
    authorUsername: viewer.username,
    projectMode: input.projectMode,
    summary: summarizeOverviewForFeed(description),
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
    oppositionSignalUserIds: [],
    oppositionSignalCount: 0,
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

  projectDetailExtras[slug] = {
    overview: createProjectDescription(input),
    updates: [],
    discussionNote: createProjectDiscussionNote(input),
    discussion: []
  };
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);
  createdProjectSlugs.add(slug);
  persistClientState();
  recordMeaningfulAction(viewer.id);

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
      ? 'Platform threads stay open to regular users, and platform-tagged projects can also be proposed by any signed-in user.'
      : 'Discussion stays visible here so replies and follow-up notes remain attached to the original question.';
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);
  recordMeaningfulAction(viewer.id);

  return {
    ok: true,
    slug
  };
}

export function createMockEvent(input: CreateEventInput): CreateResult {
  const viewer = currentViewer();
  const title = input.title.trim();
  const description = input.description.trim();

  if (!viewer) {
    return {
      ok: false,
      error: 'Sign in before creating an event.'
    };
  }

  if (!title || !description) {
    return {
      ok: false,
      error: 'Events need a title and a proposal description.'
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

  if (!isPrivate && input.channelTags.length === 0) {
    return {
      ok: false,
      error: 'Public events need at least one channel tag. Only private events can omit channels.'
    };
  }

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
    channelTags: input.channelTags,
    communityTags: input.communityTags,
    createdByUsername: viewer.username,
    timeLabel: '',
    locationLabel: '',
    voteCount: 0,
    activeVote: 0,
    commentCount: 0,
    memberCount: 1,
    lastActivityAt: createdAt
  });
  eventDetailExtras[slug] = {
    attendanceNote: isPrivate
      ? 'This private event starts as a proposal for the invited or tagged audience. Schedule and location are added once the plan is approved.'
      : 'This event starts as a proposal that stays discoverable through its tags. Schedule and location are added once the plan is approved.',
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
    currentPhaseId: isPrivate ? 'event-plan' : 'proposal',
    signalCount: 0,
    signalUserIds: [],
    oppositionSignalCount: 0,
    oppositionSignalUserIds: [],
    eventValues: [],
    eventPlans: [],
    eventActivities: [],
    phaseChangeRequests: [],
    updateRequests: [],
    editRequests: [],
    decisionHistory: []
  };
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);
  recordMeaningfulAction(viewer.id);

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
  recordMeaningfulAction(viewer.id);

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

export function addMockProjectUpdate(slug: string, _title: string, body: string) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const trimmedBody = body.trim();
  const memberState = buildProjectMemberState(slug);
  const projectMode = projectModeForSlug(slug);

  if (
    !viewer ||
    !extras ||
    !trimmedBody ||
    projectMode !== 'personal-service' ||
    !memberState.viewerIsMember
  ) {
    return;
  }

  extras.updates = [
    {
      id: `project-update-${slug}-${Date.now()}`,
      title: '',
      body: trimmedBody,
      authorUsername: viewer.username,
      createdAt: new Date().toISOString()
    },
    ...extras.updates
  ];
}

function applyProjectDetailsChange(
  slug: string,
  title: string,
  description: string,
  updatedAt = new Date().toISOString()
) {
  const item = findPublicProjectItem(slug);
  const extras = projectDetailExtras[slug];

  if (!item || !extras) {
    return false;
  }

  item.title = title;
  item.summary = summarizeOverviewForFeed(description);
  item.lastActivityAt = updatedAt;
  extras.overview = description;

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
  const memberCount = projectGovernancePopulation(slug, memberState.memberCount);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeProjectDecisionHistoryEntry(slug, requestId, 'rejected', request.votesByUserId, memberCount);
    workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  const updateId = `project-update-${slug}-${Date.now()}`;
  extras.updates = [
    {
      id: updateId,
      title: '',
      body: request.body,
      authorUsername: request.authorUsername,
      createdAt: new Date().toISOString()
    },
    ...extras.updates
  ];
  finalizeProjectDecisionHistoryEntry(
    slug,
    requestId,
    'approved',
    request.votesByUserId,
    memberCount,
    (payload) => {
      if (payload.type === 'update') {
        payload.appliedUpdateId = updateId;
      }
    }
  );
  workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
}

function maybeApplyApprovedProjectEdit(slug: string, requestId: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.editRequests?.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  const memberState = buildProjectMemberState(slug);
  const memberCount = projectGovernancePopulation(slug, memberState.memberCount);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeProjectDecisionHistoryEntry(slug, requestId, 'rejected', request.votesByUserId, memberCount);
    workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  applyProjectDetailsChange(
    slug,
    request.title,
    request.description,
    new Date().toISOString()
  );
  finalizeProjectDecisionHistoryEntry(slug, requestId, 'approved', request.votesByUserId, memberCount);
  workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
}

function canViewerVoteOnProjectPullRequest(slug: string) {
  const viewer = currentViewer();

  if (!viewer) {
    return false;
  }

  if (isPlatformTaggedProject(slug)) {
    return canViewerParticipateInPlatformProjectGovernance(slug);
  }

  return (projectMembersBySlug[slug] ?? []).includes(viewer.id);
}

function canViewerRecordProjectPullRequestMerge(slug: string) {
  const project = findPublicProjectItem(slug);

  if (!project) {
    return false;
  }

  const lifecycle = buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length);
  const viewer = currentViewer();

  return (
    !!viewer &&
    !!lifecycle.phaseFive.softwareGovernance?.mergeCapabilityMembers.some((member) => member.id === viewer.id)
  );
}

function findProjectPullRequestByDecisionId(
  workflow: ProjectWorkflowState,
  decisionId: string
) {
  return (workflow.softwarePullRequests ?? []).find((request) => {
    switch (request.stage) {
      case 'approval':
        return projectPullRequestApprovalDecisionId(request.id) === decisionId;
      case 'confirmation':
        return projectPullRequestConfirmationDecisionId(request.id) === decisionId;
      default:
        return false;
    }
  });
}

function findProjectMergeCapabilityChangeByDecisionId(
  workflow: ProjectWorkflowState,
  decisionId: string
) {
  return (workflow.softwareMergeCapabilityChangeRequests ?? []).find(
    (request) => request.status === 'open' && projectMergeCapabilityChangeDecisionId(request.id) === decisionId
  );
}

function findProjectRepositoryReplacementByDecisionId(
  workflow: ProjectWorkflowState,
  decisionId: string
) {
  return (workflow.softwareRepositoryReplacementRequests ?? []).find(
    (request) => request.status === 'open' && projectRepositoryReplacementDecisionId(request.id) === decisionId
  );
}

function buildProjectSoftwareDecisionVoteSummary(
  slug: string,
  votesByUserId: Record<string, ProjectApprovalVote>
) {
  const memberState = buildProjectMemberState(slug);
  const memberCount = projectGovernancePopulation(slug, memberState.memberCount);

  return {
    memberCount,
    voteSummary: buildProjectVoteSummary(
      votesByUserId,
      calculateProjectQuorumThreshold(memberCount),
      memberCount
    )
  };
}

function maybeApplyApprovedProjectPullRequest(slug: string, requestId: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.softwarePullRequests?.find((item) => item.id === requestId);

  if (!request || (request.stage !== 'approval' && request.stage !== 'confirmation')) {
    return;
  }

  const memberState = buildProjectMemberState(slug);
  const memberCount = projectGovernancePopulation(slug, memberState.memberCount);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );
  const decisionId =
    request.stage === 'approval'
      ? projectPullRequestApprovalDecisionId(request.id)
      : projectPullRequestConfirmationDecisionId(request.id);

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeProjectDecisionHistoryEntry(
      slug,
      decisionId,
      'rejected',
      request.votesByUserId,
      memberCount,
      (payload) => {
        if (payload.type === 'pull-request') {
          payload.mergeId = request.mergeId ?? null;
        }
      }
    );
    request.stage = 'rejected';
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  finalizeProjectDecisionHistoryEntry(
    slug,
    decisionId,
    'approved',
    request.votesByUserId,
    memberCount,
    (payload) => {
      if (payload.type === 'pull-request') {
        payload.mergeId = request.mergeId ?? null;
      }
    }
  );

  if (request.stage === 'approval') {
    request.stage = 'awaiting-merge';
    request.votesByUserId = {};
    return;
  }

  request.stage = 'confirmed';
  request.votesByUserId = {};
}

function maybeApplyApprovedProjectMergeCapabilityChange(slug: string, requestId: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.softwareMergeCapabilityChangeRequests?.find(
    (item) => item.id === requestId && item.status === 'open'
  );

  if (!request) {
    return;
  }

  const { memberCount, voteSummary } = buildProjectSoftwareDecisionVoteSummary(
    slug,
    request.votesByUserId
  );
  const decisionId = projectMergeCapabilityChangeDecisionId(request.id);

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeProjectDecisionHistoryEntry(slug, decisionId, 'rejected', request.votesByUserId, memberCount);
    request.status = 'rejected';
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  finalizeProjectDecisionHistoryEntry(slug, decisionId, 'approved', request.votesByUserId, memberCount);

  const project = findPublicProjectItem(slug);
  const lifecycle = project
    ? buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length)
    : null;
  const currentUserIds = lifecycle?.phaseFive.softwareGovernance?.mergeCapabilityMembers.map(
    (member) => member.id
  ) ?? [];

  workflow.softwareMergeCapabilityUserIds =
    request.action === 'grant'
      ? Array.from(new Set([request.targetUserId, ...currentUserIds]))
      : currentUserIds.filter((userId) => userId !== request.targetUserId);
  request.status = 'approved';
  request.votesByUserId = {};
}

function maybeApplyApprovedProjectRepositoryReplacement(slug: string, requestId: string) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.softwareRepositoryReplacementRequests?.find(
    (item) => item.id === requestId && item.status === 'open'
  );

  if (!request) {
    return;
  }

  const { memberCount, voteSummary } = buildProjectSoftwareDecisionVoteSummary(
    slug,
    request.votesByUserId
  );
  const decisionId = projectRepositoryReplacementDecisionId(request.id);

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeProjectDecisionHistoryEntry(slug, decisionId, 'rejected', request.votesByUserId, memberCount);
    request.status = 'rejected';
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  finalizeProjectDecisionHistoryEntry(slug, decisionId, 'approved', request.votesByUserId, memberCount);
  workflow.softwareRepositoryUrlOverride = request.repositoryUrl;
  workflow.softwareRepositoryHistory = [
    {
      id: request.id,
      repositoryUrl: request.repositoryUrl,
      previousRepositoryUrl: request.previousRepositoryUrl,
      reason: request.reason,
      relatedPullRequestId: request.relatedPullRequestId,
      replacedAt: new Date().toISOString(),
      replacedByUsername: request.authorUsername
    },
    ...(workflow.softwareRepositoryHistory ?? []).filter((entry) => entry.id !== request.id)
  ];

  const relatedPullRequest = workflow.softwarePullRequests?.find(
    (item) => item.id === request.relatedPullRequestId
  );

  if (relatedPullRequest && (relatedPullRequest.stage === 'awaiting-merge' || relatedPullRequest.stage === 'rejected')) {
    relatedPullRequest.stage = 'replaced';
  }

  if (!isPlatformTaggedProject(slug)) {
    const requesterId = userByUsername(request.authorUsername)?.id ?? null;

    if (requesterId) {
      workflow.softwareMergeCapabilityUserIds = [requesterId];
    }
  }

  request.status = 'approved';
  request.votesByUserId = {};
}

export function addMockProjectPullRequest(slug: string, input: ProjectSoftwarePullRequestInput) {
  const viewer = currentViewer();
  const project = findPublicProjectItem(slug);
  const lifecycle = project
    ? buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length)
    : null;
  const trimmedTitle = input.title.trim();
  const trimmedSummary = input.summary.trim();
  const trimmedPullRequestId = input.pullRequestId.trim();
  const trimmedPullRequestUrl = input.pullRequestUrl.trim();

  if (
    !viewer ||
    !project ||
    !lifecycle?.phaseFive.softwareGovernance ||
    lifecycle.currentPhaseId !== activityPhaseIdForProject(project.projectMode) ||
    !trimmedTitle ||
    !trimmedSummary ||
    !trimmedPullRequestId ||
    !trimmedPullRequestUrl ||
    !lifecycle.phaseFive.softwareGovernance.viewerCanCreatePullRequests
  ) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);

  if (
    (workflow.softwarePullRequests ?? []).some(
      (request) => request.pullRequestId === trimmedPullRequestId || request.pullRequestUrl === trimmedPullRequestUrl
    )
  ) {
    return;
  }

  const request: RawProjectPullRequestRequest = {
    id: `project-pull-request-${slug}-${Date.now()}`,
    title: trimmedTitle,
    summary: trimmedSummary,
    pullRequestId: trimmedPullRequestId,
    pullRequestUrl: trimmedPullRequestUrl,
    authorUsername: viewer.username,
    createdAt: new Date().toISOString(),
    stage: 'approval',
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };

  workflow.softwarePullRequests = [request, ...(workflow.softwarePullRequests ?? [])];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectPullRequestHistoryEntry(slug, request)
  );
  maybeApplyApprovedProjectPullRequest(slug, request.id);
}

export function setMockProjectPullRequestVote(
  slug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = findProjectPullRequestByDecisionId(workflow, decisionId);

  if (!viewer || !request || !canViewerVoteOnProjectPullRequest(slug)) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedProjectPullRequest(slug, request.id);
}

export function requestMockProjectMergeCapabilityChange(
  slug: string,
  input: ProjectSoftwareMergeCapabilityChangeInput
) {
  const viewer = currentViewer();
  const project = findPublicProjectItem(slug);
  const lifecycle = project
    ? buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length)
    : null;
  const governance = lifecycle?.phaseFive.softwareGovernance;

  if (
    !viewer ||
    !project ||
    !governance ||
    !governance.viewerCanRequestMergeCapabilityChanges ||
    isPlatformTaggedProject(slug)
  ) {
    return;
  }

  const targetUserId = input.targetUserId.trim();
  const action = input.action;
  const currentHolderIds = new Set(governance.mergeCapabilityMembers.map((member) => member.id));

  if (!targetUserId) {
    return;
  }

  if (action === 'grant' && !governance.availableMergeCapabilityCandidates.some((member) => member.id === targetUserId)) {
    return;
  }

  if (action === 'revoke' && (!currentHolderIds.has(targetUserId) || governance.mergeCapabilityMembers.length <= 1)) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);

  if (
    (workflow.softwareMergeCapabilityChangeRequests ?? []).some(
      (request) =>
        request.status === 'open' && request.targetUserId === targetUserId && request.action === action
    )
  ) {
    return;
  }

  const request: RawProjectMergeCapabilityChangeRequest = {
    id: `project-merge-capability-${slug}-${Date.now()}`,
    targetUserId,
    action,
    authorUsername: viewer.username,
    createdAt: new Date().toISOString(),
    status: 'open',
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };

  workflow.softwareMergeCapabilityChangeRequests = [
    request,
    ...(workflow.softwareMergeCapabilityChangeRequests ?? [])
  ];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectMergeCapabilityChangeHistoryEntry(request)
  );
  maybeApplyApprovedProjectMergeCapabilityChange(slug, request.id);
}

export function setMockProjectMergeCapabilityChangeVote(
  slug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = findProjectMergeCapabilityChangeByDecisionId(workflow, decisionId);

  if (!viewer || !request || !canViewerVoteOnProjectPullRequest(slug)) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedProjectMergeCapabilityChange(slug, request.id);
}

export function requestMockProjectRepositoryReplacement(
  slug: string,
  input: ProjectSoftwareRepositoryReplacementInput
) {
  const viewer = currentViewer();
  const project = findPublicProjectItem(slug);
  const lifecycle = project
    ? buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length)
    : null;
  const governance = lifecycle?.phaseFive.softwareGovernance;
  const trimmedRepositoryUrl = input.repositoryUrl.trim();
  const trimmedReason = input.reason.trim();
  const relatedPullRequestId = input.relatedPullRequestId.trim();

  if (
    !viewer ||
    !project ||
    !governance ||
    !governance.viewerCanRequestRepositoryReplacement ||
    !trimmedRepositoryUrl ||
    !trimmedReason ||
    !relatedPullRequestId ||
    trimmedRepositoryUrl === governance.repositoryUrl
  ) {
    return;
  }

  if (!governance.replaceablePullRequests.some((request) => request.id === relatedPullRequestId)) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);

  if (
    (workflow.softwareRepositoryReplacementRequests ?? []).some(
      (request) =>
        request.status === 'open' &&
        (request.relatedPullRequestId === relatedPullRequestId || request.repositoryUrl === trimmedRepositoryUrl)
    )
  ) {
    return;
  }

  const request: RawProjectRepositoryReplacementRequest = {
    id: `project-repository-replacement-${slug}-${Date.now()}`,
    repositoryUrl: trimmedRepositoryUrl,
    previousRepositoryUrl: governance.repositoryUrl,
    reason: trimmedReason,
    relatedPullRequestId,
    authorUsername: viewer.username,
    createdAt: new Date().toISOString(),
    status: 'open',
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };

  workflow.softwareRepositoryReplacementRequests = [
    request,
    ...(workflow.softwareRepositoryReplacementRequests ?? [])
  ];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectRepositoryReplacementHistoryEntry(request)
  );
  maybeApplyApprovedProjectRepositoryReplacement(slug, request.id);
}

export function setMockProjectRepositoryReplacementVote(
  slug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = findProjectRepositoryReplacementByDecisionId(workflow, decisionId);

  if (!viewer || !request || !canViewerVoteOnProjectPullRequest(slug)) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  maybeApplyApprovedProjectRepositoryReplacement(slug, request.id);
}

export function recordMockProjectPullRequestMerge(
  slug: string,
  requestId: string,
  mergeId: string
) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.softwarePullRequests?.find((item) => item.id === requestId);
  const trimmedMergeId = mergeId.trim();

  if (
    !viewer ||
    !request ||
    request.stage !== 'awaiting-merge' ||
    !trimmedMergeId ||
    !canViewerRecordProjectPullRequestMerge(slug)
  ) {
    return;
  }

  request.stage = 'confirmation';
  request.mergeId = trimmedMergeId;
  request.mergedByUsername = viewer.username;
  request.confirmationCreatedAt = new Date().toISOString();
  request.votesByUserId = {
    [viewer.id]: 'yes'
  };

  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectPullRequestHistoryEntry(slug, request)
  );
  maybeApplyApprovedProjectPullRequest(slug, request.id);
}

export function updateMockProjectDetails(
  slug: string,
  title: string,
  description: string
) {
  const viewer = currentViewer();
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (
    !viewer ||
    projectModeForSlug(slug) !== 'personal-service' ||
    !trimmedTitle ||
    !trimmedDescription ||
    !isProjectCreator(slug, viewer.id)
  ) {
    return;
  }

  applyProjectDetailsChange(slug, trimmedTitle, trimmedDescription, new Date().toISOString());
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

function applyApprovedEventPhaseChange(
  slug: string,
  targetPhaseId: EventLifecyclePhaseId,
  reason: string,
  authorUsername: string
) {
  const event = findPublicEventItem(slug);
  const extras = eventDetailExtras[slug];

  if (!event) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const updatedAt = new Date().toISOString();
  const currentPhaseId = workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event);

  if (currentPhaseId === 'event-plan' && targetPhaseId === 'activity') {
    const memberState = buildEventMemberState(event);
    const eligibleVoterCount = eventGovernancePopulation(event, memberState.eligibleVoterCount);
    const phaseTwo = buildEventPlans(
      slug,
      event,
      buildEventValues(slug),
      calculateProjectQuorumThreshold(eligibleVoterCount),
      eligibleVoterCount
    );
    const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);

    if (winningPlan) {
      delete workflow.liveTitleOverride;
      delete workflow.liveDescriptionOverride;
      applyEventDetailsChange(slug, winningPlan.title, winningPlan.description, updatedAt);
    }
  }

  workflow.currentPhaseId = targetPhaseId;
  event.lastActivityAt = updatedAt;

  if (targetPhaseId === 'closed' && extras) {
    extras.updates = [
      {
        id: `event-close-${slug}-${Date.now()}`,
        title: 'Closure note',
        body: reason.trim(),
        authorUsername,
        createdAt: updatedAt
      },
      ...extras.updates
    ];
  }
}

function maybeApplyApprovedEventPhaseChange(slug: string, requestId: string) {
  const event = findPublicEventItem(slug);

  if (!event) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const request = workflow.phaseChangeRequests?.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  const memberState = buildEventMemberState(event);
  const eligibleVoterCount = eventGovernancePopulation(event, memberState.eligibleVoterCount);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(eligibleVoterCount),
    eligibleVoterCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeEventDecisionHistoryEntry(
      slug,
      requestId,
      'rejected',
      request.votesByUserId,
      eligibleVoterCount,
      userByUsername(event.createdByUsername)?.id ?? null
    );
    workflow.phaseChangeRequests = (workflow.phaseChangeRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  const currentPhaseId = workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event);
  const nextPhaseId = eventNextPhaseId(event, currentPhaseId);

  if (request.targetPhaseId === nextPhaseId && !canAdvanceMockEventPhaseNow(slug)) {
    return;
  }

  applyApprovedEventPhaseChange(slug, request.targetPhaseId, request.reason, request.authorUsername);
  finalizeEventDecisionHistoryEntry(
    slug,
    requestId,
    'approved',
    request.votesByUserId,
    eligibleVoterCount,
    userByUsername(event.createdByUsername)?.id ?? null
  );
  workflow.phaseChangeRequests = (workflow.phaseChangeRequests ?? []).filter((item) => item.id !== requestId);
}

export function setMockEventSignal(slug: string, signal: GovernanceSignalType) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);

  if (!viewer || !event || event.isPrivate) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const demandUserIds = uniqueUserIds(workflow.signalUserIds ?? []);
  const oppositionUserIds = uniqueUserIds(workflow.oppositionSignalUserIds ?? []);
  const demandActive = demandUserIds.includes(viewer.id);
  const oppositionActive = oppositionUserIds.includes(viewer.id);
  const demandCount = hydratedSignalCount(workflow.signalCount, demandUserIds);
  const oppositionCount = hydratedSignalCount(workflow.oppositionSignalCount, oppositionUserIds);

  workflow.signalUserIds = demandUserIds.filter((userId) => userId !== viewer.id);
  workflow.signalCount = Math.max(demandCount - (demandActive ? 1 : 0), 0);
  workflow.oppositionSignalUserIds = oppositionUserIds.filter((userId) => userId !== viewer.id);
  workflow.oppositionSignalCount = Math.max(oppositionCount - (oppositionActive ? 1 : 0), 0);

  if ((signal === 'demand' && demandActive) || (signal === 'opposition' && oppositionActive)) {
    recordMeaningfulAction(viewer.id);
    return;
  }

  if (signal === 'demand') {
    workflow.signalUserIds = [viewer.id, ...(workflow.signalUserIds ?? [])];
    workflow.signalCount += 1;
  } else {
    workflow.oppositionSignalUserIds = [viewer.id, ...(workflow.oppositionSignalUserIds ?? [])];
    workflow.oppositionSignalCount = (workflow.oppositionSignalCount ?? 0) + 1;
  }

  recordMeaningfulAction(viewer.id);
}

export function addMockEventValue(slug: string, label: string) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const trimmed = label.trim();

  if (!viewer || !event || !trimmed || !canViewerEditEventPhase(slug, 'proposal')) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  workflow.eventValues = [
    {
      id: `event-value-${slug}-${Date.now()}`,
      label: trimmed,
      authorUsername: viewer.username,
      votesByUserId: {
        [viewer.id]: 4
      }
    },
    ...(workflow.eventValues ?? [])
  ];
  recordMeaningfulAction(viewer.id);
}

export function setMockEventValueImportance(
  slug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const workflow = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? '')?.id ?? null);
  const value = workflow.eventValues?.find((item) => item.id === valueId);

  if (!viewer || !event || !value || !canViewerEditEventPhase(slug, 'proposal')) {
    return;
  }

  value.votesByUserId[viewer.id] = importance;
  recordMeaningfulAction(viewer.id);
}

export function addMockEventPlan(slug: string, input: EventPlanInput) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const description = input.description.trim();
  const demandConsiderationNote = input.demandConsiderationNote.trim();
  const locationLabel = input.locationLabel.trim();
  const scheduleMode = input.schedule?.mode ?? 'any-day';
  const scheduleStartDate = input.schedule?.startDate?.trim() ?? '';
  const scheduleEndDate = input.schedule?.endDate?.trim() ?? '';
  const scheduleStartTimeLabel = input.schedule?.startTimeLabel?.trim() ?? '';
  const scheduleFinishTimeLabel = input.schedule?.finishTimeLabel?.trim() ?? '';
  const scheduleIsValid = eventScheduleIsValid(input.schedule);
  const scheduleStartsInFuture = eventScheduleStartsInFuture(input.schedule);
  const timestamp = Date.now();
  const planPhases = input.planPhases
    .map((phase, index) => ({
      id: `event-plan-phase-${slug}-${timestamp}-${index}`,
      title: phase.title.trim(),
      details: phase.details.trim()
    }))
    .filter((phase) => phase.title && phase.details);

  if (
    !viewer ||
    !event ||
    !canViewerEditEventPhase(slug, 'event-plan') ||
    !input.title.trim() ||
    !description ||
    !demandConsiderationNote ||
    !locationLabel ||
    !scheduleStartTimeLabel ||
    !scheduleFinishTimeLabel ||
    scheduleMode === 'any-day' ||
    (scheduleMode === 'date' && !scheduleStartDate) ||
    (scheduleMode === 'range' && (!scheduleStartDate || !scheduleEndDate)) ||
    !scheduleIsValid ||
    !scheduleStartsInFuture ||
    planPhases.length === 0
  ) {
    return false;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const values = buildEventValues(slug);

  workflow.eventPlans = [
    {
      id: `event-plan-${slug}-${timestamp}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      createdAt: new Date().toISOString(),
      description,
      locationLabel,
      schedule:
        scheduleMode === 'date'
          ? {
              mode: 'date',
              startDate: scheduleStartDate,
              startTimeLabel: scheduleStartTimeLabel,
              finishTimeLabel: scheduleFinishTimeLabel
            }
          : {
              mode: 'range',
              startDate: scheduleStartDate,
              endDate: scheduleEndDate,
              startTimeLabel: scheduleStartTimeLabel,
              finishTimeLabel: scheduleFinishTimeLabel
            },
      demandSignalSnapshot: event.isPrivate ? undefined : workflow.signalCount ?? 0,
      demandConsiderationNote,
      planPhases,
      overallVotesByUserId: {
        [viewer.id]: 'yes'
      },
      valueVotesByValueId: Object.fromEntries([
        ...(!event.isPrivate
          ? [[demandSignalAssessmentValueId, { [viewer.id]: 'yes' as ProjectApprovalVote }]]
          : []),
        ...values.map((value) => [value.id, { [viewer.id]: 'yes' as ProjectApprovalVote }])
      ])
    },
    ...(workflow.eventPlans ?? [])
  ];
  recordMeaningfulAction(viewer.id);
  return true;
}

export function setMockEventPlanValueVote(
  slug: string,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();

  if (!viewer || !canViewerEditEventPhase(slug, 'event-plan')) {
    return;
  }

  updateEventPlanValueVoteMap(slug, planId, valueId, viewer.id, vote);
  recordMeaningfulAction(viewer.id);
}

export function setMockEventPlanOverallVote(
  slug: string,
  planId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();

  if (!viewer || !canViewerEditEventPhase(slug, 'event-plan')) {
    return;
  }

  updateEventPlanOverallVoteMap(slug, planId, viewer.id, vote);
  recordMeaningfulAction(viewer.id);
}

export function addMockEventActivity(slug: string, input: ProjectActivityInput) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const roleRequirements = normalizeProjectActivityRoleRequirements(input.roleRequirements);
  const minimumParticipants = roleRequirements.reduce((total, role) => total + role.requiredCount, 0);
  const workflow = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? '')?.id ?? null);
  const now = new Date().toISOString();
  const eligibleVoterCount = event ? eventGovernancePopulation(event, buildEventMemberState(event).eligibleVoterCount) : 0;
  const phaseTwo = event
    ? buildEventPlans(
        slug,
        event,
        buildEventValues(slug),
        calculateProjectQuorumThreshold(eligibleVoterCount),
        eligibleVoterCount
      )
    : { plans: [] as EventPlan[], winningPlanId: null as string | null };
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId) ?? null;

  if (
    !viewer ||
    !event ||
    !winningPlan ||
    !canViewerCreateEventActivity(slug) ||
    !input.title.trim() ||
    !input.scheduledAt.trim() ||
    !input.endsAt.trim() ||
    !input.locationLabel.trim() ||
    !input.note.trim() ||
    roleRequirements.length === 0 ||
    minimumParticipants < 1 ||
    !eventActivityFitsSchedule(winningPlan.schedule, input.scheduledAt.trim(), input.endsAt.trim())
  ) {
    return;
  }

  workflow.eventActivities = [
    {
      id: `event-activity-${slug}-${Date.now()}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      scheduledAt: input.scheduledAt.trim(),
      endsAt: input.endsAt.trim(),
      locationLabel: input.locationLabel.trim(),
      minimumParticipants,
      linkedPlanPhaseId: input.linkedPlanPhaseId ?? null,
      roles: roleRequirements.map((role, index) => ({
        label: role.label,
        requiredCount: role.requiredCount,
        maximumCount: role.maximumCount,
        assignedUsernames: index === 0 ? [viewer.username] : []
      })),
      note: input.note.trim()
    },
    ...(workflow.eventActivities ?? [])
  ];
  ensureEventMembership(slug, viewer.id);
  event.lastActivityAt = now;
  recordMeaningfulAction(viewer.id);
}

export function setMockEventActivityCommitment(
  slug: string,
  activityId: string,
  roleLabel: string | null
) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const workflow = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? '')?.id ?? null);
  const activity = workflow.eventActivities?.find((item) => item.id === activityId);

  if (!viewer || !event || !activity || !canViewerEditEventActivityCommitment(slug)) {
    return;
  }

  for (const role of activity.roles) {
    role.assignedUsernames = role.assignedUsernames.filter((username) => username !== viewer.username);
  }

  if (!roleLabel) {
    event.lastActivityAt = new Date().toISOString();
    recordMeaningfulAction(viewer.id);
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

  ensureEventMembership(slug, viewer.id);
  targetRole.assignedUsernames = [...targetRole.assignedUsernames, viewer.username];
  event.lastActivityAt = new Date().toISOString();
  recordMeaningfulAction(viewer.id);
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
  const eligibleVoterCount = eventGovernancePopulation(event, memberState.eligibleVoterCount);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(eligibleVoterCount),
    eligibleVoterCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeEventDecisionHistoryEntry(
      slug,
      requestId,
      'rejected',
      request.votesByUserId,
      eligibleVoterCount,
      userByUsername(event.createdByUsername)?.id ?? null
    );
    workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  const createdAt = new Date().toISOString();
  const updateId = `event-update-${slug}-${Date.now()}`;
  extras.updates = [
    {
      id: updateId,
      title: '',
      body: request.body,
      authorUsername: request.authorUsername,
      createdAt
    },
    ...extras.updates
  ];
  event.lastActivityAt = createdAt;
  finalizeEventDecisionHistoryEntry(
    slug,
    requestId,
    'approved',
    request.votesByUserId,
    eligibleVoterCount,
    userByUsername(event.createdByUsername)?.id ?? null,
    (payload) => {
      if (payload.type === 'update') {
        payload.appliedUpdateId = updateId;
      }
    }
  );
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
  const eligibleVoterCount = eventGovernancePopulation(event, memberState.eligibleVoterCount);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(eligibleVoterCount),
    eligibleVoterCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeEventDecisionHistoryEntry(
      slug,
      requestId,
      'rejected',
      request.votesByUserId,
      eligibleVoterCount,
      userByUsername(event.createdByUsername)?.id ?? null
    );
    workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  workflow.liveTitleOverride = request.title;
  workflow.liveDescriptionOverride = request.description;
  applyEventDetailsChange(slug, request.title, request.description, new Date().toISOString());
  finalizeEventDecisionHistoryEntry(
    slug,
    requestId,
    'approved',
    request.votesByUserId,
    eligibleVoterCount,
    userByUsername(event.createdByUsername)?.id ?? null
  );
  workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
}

export function requestMockEventUpdate(slug: string, body: string) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const extras = eventDetailExtras[slug];
  const trimmedBody = body.trim();

  if (!viewer || !event || !extras || !trimmedBody || !canViewerRequestEventUpdate(slug)) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const requestId = `event-update-request-${slug}-${Date.now()}`;
  const request: RawEventUpdateRequest = {
    id: requestId,
    body: trimmedBody,
    authorUsername: viewer.username,
    createdAt: new Date().toISOString(),
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };
  workflow.updateRequests = [
    request,
    ...(workflow.updateRequests ?? [])
  ];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildEventUpdateHistoryEntry(request));
  recordMeaningfulAction(viewer.id);

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

  recordMeaningfulAction(viewer.id);

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
  const request: RawEventEditRequest = {
    id: requestId,
    title: trimmedTitle,
    description: trimmedDescription,
    authorUsername: viewer.username,
    createdAt: new Date().toISOString(),
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };
  workflow.editRequests = [
    request,
    ...(workflow.editRequests ?? [])
  ];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildEventEditHistoryEntry(slug, request));
  recordMeaningfulAction(viewer.id);

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

  recordMeaningfulAction(viewer.id);

  maybeApplyApprovedEventEdit(slug, requestId);
}

export function requestMockEventPhaseChange(
  slug: string,
  targetPhaseId: EventLifecyclePhaseId,
  reason: string
) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const trimmedReason = reason.trim();

  if (!viewer || !event || !trimmedReason || !canViewerRequestEventPhaseChange(slug)) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const currentPhaseId = workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event);
  const nextPhaseId = eventNextPhaseId(event, currentPhaseId);
  const requestableTargetIds = requestableEventPhaseTargetIds(event, currentPhaseId);

  if (!targetPhaseId || !requestableTargetIds.includes(targetPhaseId)) {
    return;
  }

  if (targetPhaseId === nextPhaseId && !canAdvanceMockEventPhaseNow(slug)) {
    return;
  }

  const requestId = `event-phase-change-${slug}-${Date.now()}`;
  const request: RawEventPhaseChangeRequest = {
    id: requestId,
    targetPhaseId,
    reason: trimmedReason,
    authorUsername: viewer.username,
    createdAt: new Date().toISOString(),
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };
  workflow.phaseChangeRequests = [request, ...(workflow.phaseChangeRequests ?? [])];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildEventPhaseChangeHistoryEntry(slug, request));
  recordMeaningfulAction(viewer.id);
  maybeApplyApprovedEventPhaseChange(slug, requestId);
}

export function setMockEventPhaseChangeVote(
  slug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);

  if (!viewer || !event || !canViewerVoteOnEventPhaseChange(slug)) {
    return;
  }

  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const request = workflow.phaseChangeRequests?.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  if (vote) {
    request.votesByUserId[viewer.id] = vote;
  } else {
    delete request.votesByUserId[viewer.id];
  }

  recordMeaningfulAction(viewer.id);
  maybeApplyApprovedEventPhaseChange(slug, requestId);
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
    return !!nextProjectPhaseIdForSlug(slug, config.currentPhaseId, projectMode);
  }

  const memberCount = (projectMembersBySlug[slug] ?? []).length;
  const values = buildProjectValues(slug);
  const signalSummary = buildProjectSignalSummary(slug);
  const governancePopulation = projectGovernancePopulation(slug, memberCount);

  switch (config.currentPhaseId) {
    case 'phase-1':
      return signalSummary?.advancementUnlocked ?? false;
    case 'phase-2':
      return !!buildProductionPlans(
        slug,
        values,
        calculateProjectQuorumThreshold(governancePopulation),
        governancePopulation
      ).winningPlanId;
    case 'phase-3': {
      const phaseTwo = buildProductionPlans(
        slug,
        values,
        calculateProjectQuorumThreshold(governancePopulation),
        governancePopulation
      );

      return !!buildDistributionPlans(
        slug,
        values,
        calculateProjectQuorumThreshold(governancePopulation),
        governancePopulation,
        phaseTwo
      ).winningPlanId;
    }
    default:
      return !!nextProjectPhaseIdForSlug(slug, config.currentPhaseId, projectMode);
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
    phaseOrderForProjectSlug(slug, projectMode, targetPhaseId) <
      phaseOrderForProjectSlug(slug, projectMode, currentPhaseId)
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

  if (targetPhaseId === closePhaseIdForProjectSlug(slug, projectMode) && projectDetailExtras[slug]) {
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
  const memberCount = projectGovernancePopulation(slug, memberState.memberCount);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );

  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeProjectDecisionHistoryEntry(slug, requestId, 'rejected', request.votesByUserId, memberCount);
    workflow.phaseChangeRequests = (workflow.phaseChangeRequests ?? []).filter(
      (item) => item.id !== requestId
    );
    return;
  }

  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }

  const requestableTargets = requestableProjectPhaseTargetIdsForSlug(
    slug,
    config.currentPhaseId,
    projectMode
  );
  const nextPhaseId = nextProjectPhaseIdForSlug(slug, config.currentPhaseId, projectMode);

  if (!requestableTargets.includes(request.targetPhaseId)) {
    return;
  }

  if (request.targetPhaseId === nextPhaseId && !canAdvanceMockProjectPhaseNow(slug, projectMode)) {
    return;
  }

  applyApprovedProjectPhaseChange(slug, request.targetPhaseId, request.reason, request.authorUsername);
  finalizeProjectDecisionHistoryEntry(slug, requestId, 'approved', request.votesByUserId, memberCount);
  workflow.phaseChangeRequests = (workflow.phaseChangeRequests ?? []).filter(
    (item) => item.id !== requestId
  );
}

export function requestMockProjectPhaseChange(
  slug: string,
  targetPhaseId: ProjectLifecyclePhaseId,
  reason: string,
  options?: ProjectPhaseChangeRequestOptions
) {
  const viewer = currentViewer();
  const config = projectLifecycleBySlug[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedReason = reason.trim();
  const closeOutcome = options?.closeOutcome;
  const conversionTarget = options?.conversionTarget ?? null;

  if (!viewer || !config || !trimmedReason || !canViewerRequestProjectPhaseChange(slug)) {
    return;
  }

  const requestableTargets = requestableProjectPhaseTargetIdsForSlug(
    slug,
    config.currentPhaseId,
    projectMode
  );
  const nextPhaseId = nextProjectPhaseIdForSlug(slug, config.currentPhaseId, projectMode);

  if (!requestableTargets.includes(targetPhaseId)) {
    return;
  }

  if (targetPhaseId === nextPhaseId && !canAdvanceMockProjectPhaseNow(slug, projectMode)) {
    return;
  }

  if (closeOutcome === 'convert' && !conversionTarget) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);

  if ((workflow.phaseChangeRequests ?? []).some((request) => request.targetPhaseId === targetPhaseId)) {
    return;
  }

  const createdAt = new Date().toISOString();
  const requestId = `project-phase-change-${slug}-${Date.now()}`;
  const request: RawProjectPhaseChangeRequest = {
    id: requestId,
    targetPhaseId,
    reason: trimmedReason,
    authorUsername: viewer.username,
    createdAt,
    closeOutcome,
    conversionTarget,
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };
  workflow.phaseChangeRequests = [
    request,
    ...(workflow.phaseChangeRequests ?? [])
  ];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectPhaseChangeHistoryEntry(slug, request)
  );

  maybeApplyApprovedProjectPhaseChange(slug, requestId);
}

export function requestMockProjectUpdate(slug: string, body: string) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedBody = body.trim();

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
  const request: RawProjectUpdateRequest = {
    id: requestId,
    body: trimmedBody,
    authorUsername: viewer.username,
    createdAt: new Date().toISOString(),
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };
  workflow.updateRequests = [
    request,
    ...(workflow.updateRequests ?? [])
  ];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildProjectUpdateHistoryEntry(request));

  maybeApplyApprovedProjectUpdate(slug, requestId);
}

export function requestMockProjectEdit(
  slug: string,
  title: string,
  description: string
) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (
    !viewer ||
    !extras ||
    projectMode === 'personal-service' ||
    !trimmedTitle ||
    !trimmedDescription ||
    !canViewerRequestProjectEdit(slug)
  ) {
    return;
  }

  const workflow = ensureProjectWorkflowState(slug);
  const requestId = `project-edit-request-${slug}-${Date.now()}`;
  const request: RawProjectEditRequest = {
    id: requestId,
    title: trimmedTitle,
    description: trimmedDescription,
    authorUsername: viewer.username,
    createdAt: new Date().toISOString(),
    votesByUserId: {
      [viewer.id]: 'yes'
    }
  };
  workflow.editRequests = [
    request,
    ...(workflow.editRequests ?? [])
  ];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildProjectEditHistoryEntry(slug, request));

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