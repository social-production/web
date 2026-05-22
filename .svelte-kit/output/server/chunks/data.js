function isProductiveProject(mode) {
  return mode === "productive";
}
function isCollectiveServiceProject(mode) {
  return mode === "collective-service";
}
function isPersonalServiceProject(mode) {
  return mode === "personal-service";
}
function supportsProjectDemandSignals(mode) {
  return mode !== "personal-service";
}
function supportsProjectPlanning(mode) {
  return mode !== "personal-service";
}
function projectSubjectLabel(mode) {
  switch (mode) {
    case "productive":
      return "Productive";
    case "collective-service":
      return "Collective Service";
    case "personal-service":
      return "Personal Service";
  }
}
function projectFeedPhaseLabel(mode, phaseId) {
  if (mode === "personal-service") {
    switch (phaseId) {
      case "phase-1":
        return "Calendar";
      case "phase-2":
        return "Closed";
      default:
        return "Calendar";
    }
  }
  switch (phaseId) {
    case "phase-1":
      return "Proposal";
    case "phase-2":
      return "Planning";
    case "phase-3":
      return "Planning";
    case "phase-4":
      return "Acquisition";
    case "phase-5":
      return "Activity";
    case "phase-6":
      return "Closed";
  }
}
function projectSubtypeLabel(subtype) {
  switch (subtype) {
    case "software":
      return "Software";
    case "delivery":
      return "Delivery";
    case "land-management":
      return "Land management";
    case "storage":
      return "Storage";
    default:
      return "Standard";
  }
}
function projectSubtypeOptions(mode) {
  if (mode === "personal-service") {
    return [];
  }
  if (mode === "productive") {
    return [
      {
        value: "standard",
        label: "Standard project",
        description: "Use the ordinary productive project path."
      },
      {
        value: "software",
        label: "Software project",
        description: "Use software-specific governance with the default open-source release path."
      }
    ];
  }
  return [
    {
      value: "standard",
      label: "Standard service",
      description: "Use the ordinary collective-service path."
    },
    {
      value: "software",
      label: "Software service",
      description: "Use the software service path with the default open-source release rules."
    },
    {
      value: "delivery",
      label: "Delivery",
      description: "Use the normal collective-service lifecycle with delivery-specific request fields."
    },
    {
      value: "land-management",
      label: "Land management",
      description: "Use the normal collective-service lifecycle with land and asset request flows."
    },
    {
      value: "storage",
      label: "Storage",
      description: "Use the normal collective-service lifecycle with storage request flows."
    }
  ];
}
const GOVERNANCE_APPROVAL_THRESHOLD_PERCENT = 66;
function normalizePopulation(population) {
  if (!Number.isFinite(population)) {
    return 0;
  }
  return Math.max(Math.floor(population), 0);
}
function calculateMarginOfError(population) {
  if (population < 100) {
    return 0.1 - 0.03 * (population - 1) / 99;
  }
  if (population < 500) {
    return 0.07 - 0.02 * (population - 100) / 400;
  }
  return Math.max(0.02, 0.05 - 0.03 * Math.log10(population / 500) / Math.log10(2e3));
}
function calculateRequiredVotes(population) {
  const normalizedPopulation = normalizePopulation(population);
  if (normalizedPopulation <= 0) {
    return 0;
  }
  const marginOfError = calculateMarginOfError(normalizedPopulation);
  const baseSampleSize = 0.9604 / marginOfError ** 2;
  const cochran = Math.ceil(
    baseSampleSize / (1 + (baseSampleSize - 1) / normalizedPopulation)
  );
  return Math.min(Math.ceil(0.75 * normalizedPopulation), cochran);
}
function calculateGovernanceQuorum(population) {
  const normalizedPopulation = normalizePopulation(population);
  const votesRequired = calculateRequiredVotes(normalizedPopulation);
  return {
    votesRequired,
    quorumThresholdPercent: normalizedPopulation <= 0 ? 0 : Math.round(votesRequired / normalizedPopulation * 100)
  };
}
const DAY_START_TIME = "00:00";
const DAY_END_TIME = "23:59";
function normalizeDateInput(value) {
  const trimmed = value?.trim() ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}
function normalizeTimeInput(value, fallback) {
  const trimmed = value?.trim() ?? "";
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : fallback;
}
function buildLocalDateTimeValue(date, time, fallbackTime = DAY_START_TIME) {
  const normalizedDate = normalizeDateInput(date);
  if (!normalizedDate) {
    return null;
  }
  return `${normalizedDate}T${normalizeTimeInput(time, fallbackTime)}`;
}
function parseLocalDateTimeValue(value) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatLocalDateTimeValue(date) {
  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
function eventScheduleBounds(schedule) {
  const startDate = normalizeDateInput(schedule?.startDate);
  const fallbackEndDate = schedule?.mode === "range" ? normalizeDateInput(schedule?.endDate) || startDate : startDate;
  const startLocal = buildLocalDateTimeValue(startDate, schedule?.startTimeLabel, DAY_START_TIME);
  const endLocal = buildLocalDateTimeValue(fallbackEndDate, schedule?.finishTimeLabel, DAY_END_TIME);
  return {
    startDate: startDate || null,
    endDate: fallbackEndDate || null,
    startLocal,
    endLocal,
    start: parseLocalDateTimeValue(startLocal),
    end: parseLocalDateTimeValue(endLocal)
  };
}
function eventScheduleDayBounds(schedule, isoDay) {
  const normalizedDay = normalizeDateInput(isoDay);
  const scheduleBounds = eventScheduleBounds(schedule);
  if (!normalizedDay || !scheduleBounds.startDate || !scheduleBounds.endDate || normalizedDay < scheduleBounds.startDate || normalizedDay > scheduleBounds.endDate) {
    return null;
  }
  const startLocal = buildLocalDateTimeValue(
    normalizedDay,
    normalizedDay === scheduleBounds.startDate ? schedule?.startTimeLabel : DAY_START_TIME,
    DAY_START_TIME
  );
  const endLocal = buildLocalDateTimeValue(
    normalizedDay,
    normalizedDay === scheduleBounds.endDate ? schedule?.finishTimeLabel : DAY_END_TIME,
    DAY_END_TIME
  );
  return {
    startLocal,
    endLocal,
    start: parseLocalDateTimeValue(startLocal),
    end: parseLocalDateTimeValue(endLocal)
  };
}
function eventScheduleIsValid(schedule) {
  const bounds = eventScheduleBounds(schedule);
  return !!bounds.start && !!bounds.end && bounds.end.getTime() > bounds.start.getTime();
}
function eventScheduleStartsInFuture(schedule, now = /* @__PURE__ */ new Date()) {
  const bounds = eventScheduleBounds(schedule);
  return !!bounds.start && bounds.start.getTime() >= now.getTime();
}
function eventActivityFitsSchedule(schedule, scheduledAt, endsAt) {
  const bounds = eventScheduleBounds(schedule);
  const scheduledStart = parseLocalDateTimeValue(scheduledAt);
  const scheduledEnd = parseLocalDateTimeValue(endsAt);
  if (!bounds.start || !bounds.end || !scheduledStart || !scheduledEnd) {
    return false;
  }
  return scheduledEnd.getTime() > scheduledStart.getTime() && scheduledStart.getTime() >= bounds.start.getTime() && scheduledEnd.getTime() <= bounds.end.getTime();
}
function suggestedEventActivityWindow(schedule, isoDay) {
  const dayBounds = eventScheduleDayBounds(schedule, isoDay);
  if (!dayBounds?.startLocal || !dayBounds?.endLocal || !dayBounds.start || !dayBounds.end) {
    return {
      scheduledAt: "",
      endsAt: ""
    };
  }
  const suggestedEnd = new Date(
    Math.min(dayBounds.start.getTime() + 60 * 60 * 1e3, dayBounds.end.getTime())
  );
  return {
    scheduledAt: dayBounds.startLocal,
    endsAt: suggestedEnd.getTime() > dayBounds.start.getTime() ? formatLocalDateTimeValue(suggestedEnd) : dayBounds.endLocal
  };
}
function minimumAdditionalYesVotesNeeded(voteSummary, approvalThresholdPercent) {
  const quorumVotesRequired = voteSummary.votesRequired;
  const remainingEligibleVotes = Math.max(voteSummary.remainingEligibleVotes, 0);
  if (quorumVotesRequired <= 0) {
    return 0;
  }
  for (let additionalYesVotes = 0; additionalYesVotes <= remainingEligibleVotes; additionalYesVotes += 1) {
    const votesAfterYes = voteSummary.totalVotes + additionalYesVotes;
    const extraVotesNeededForQuorum = Math.max(quorumVotesRequired - votesAfterYes, 0);
    if (additionalYesVotes + extraVotesNeededForQuorum > remainingEligibleVotes) {
      continue;
    }
    const finalTotalVotes = votesAfterYes + extraVotesNeededForQuorum;
    const finalYesVotes = voteSummary.yesCount + additionalYesVotes;
    if (finalTotalVotes > 0 && finalYesVotes * 100 >= approvalThresholdPercent * finalTotalVotes) {
      return additionalYesVotes;
    }
  }
  return null;
}
function canProjectVoteStillPass(voteSummary, approvalThresholdPercent) {
  return minimumAdditionalYesVotesNeeded(voteSummary, approvalThresholdPercent) !== null;
}
function formatProjectVoteRequirement(voteSummary, approvalThresholdPercent) {
  const additionalYesVotesNeeded = minimumAdditionalYesVotesNeeded(voteSummary, approvalThresholdPercent) ?? 0;
  const requiredLabel = additionalYesVotesNeeded === 1 ? "vote" : "votes";
  const remainingLabel = voteSummary.remainingEligibleVotes === 1 ? "vote" : "votes";
  return `${approvalThresholdPercent}% approval needed - ${additionalYesVotesNeeded} ${requiredLabel} required with ${voteSummary.remainingEligibleVotes} ${remainingLabel} remaining`;
}
function formatProjectVoteSummary(voteSummary) {
  return `${voteSummary.approvalPercent}% approval · ${voteSummary.yesCount} yes · ${voteSummary.noCount} no`;
}
const patchbayUser = {
  id: "viewer-1",
  username: "patchbay",
  bio: "Repair rounds, heat planning, and neighborhood logistics."
};
const users = [
  patchbayUser,
  {
    id: "user-rowan",
    username: "rowanloop",
    bio: "Laundry fixes, walkthrough notes, and block-level scheduling."
  },
  {
    id: "user-tool",
    username: "toolorbit",
    bio: "Tool library intake, chargers, and volunteer night coverage."
  },
  {
    id: "user-mika",
    username: "mika",
    bio: "Release notes, accessibility checks, and public-facing coordination."
  },
  {
    id: "user-ember",
    username: "quietember",
    bio: "Neighborhood mapping, facilitation, and follow-up summaries."
  }
];
const usersById = /* @__PURE__ */ new Map();
const usersByUsername = /* @__PURE__ */ new Map();
const WEEKLY_ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1e3;
const BOARD_GRACE_WINDOW_MS = 14 * 24 * 60 * 60 * 1e3;
const BOARD_STANDING_VOTE_CLEAR_WINDOW_MS = 100 * 24 * 60 * 60 * 1e3;
function isoDaysAgo(days) {
  const value = /* @__PURE__ */ new Date();
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString();
}
const lastMeaningfulActionAtByUserId = {
  "viewer-1": isoDaysAgo(1),
  "user-rowan": isoDaysAgo(2),
  "user-tool": isoDaysAgo(4),
  "user-mika": isoDaysAgo(5),
  "user-ember": isoDaysAgo(11)
};
const boardStandingGraceStartedAtByTargetId = {};
const syntheticConfidenceVoteLastActiveAtByUserId = {};
const platformBoardState = {
  seatedUserIds: ["user-mika", "user-ember"],
  confidenceTargetIdsByUserId: {}
};
const activePlatformBoardUserIds = new Set(platformBoardState.seatedUserIds);
const seededProjectSubtypeBySlug = {
  "release-governance": "software",
  "tool-library-land-stewardship": "land-management",
  "tool-library-storage": "storage",
  "east-market-land-stewardship": "land-management",
  "east-market-cold-storage": "storage",
  "retrofit-materials-shed-service": "storage"
};
const seededSoftwareRepositoryUrlByProjectSlug = {
  "platform-release-governance-round": "https://code.social-production.example/platform/release-governance"
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
let credentialsByUserId = {
  "viewer-1": "patchbay123"
};
const mockSessionFixture = {
  currentViewerId: "viewer-1"
};
function userById(id) {
  if (!id) {
    return null;
  }
  return usersById.get(id) ?? null;
}
function userByUsername(username) {
  return usersByUsername.get(username.trim().toLowerCase()) ?? null;
}
function currentViewer() {
  return userById(mockSessionFixture.currentViewerId);
}
function activeViewer() {
  return currentViewer() ?? patchbayUser;
}
function followingIdsFor(userId) {
  return followsByUserId[userId] ?? [];
}
function followerIdsFor(userId) {
  return Object.entries(followsByUserId).filter(([, followedIds]) => followedIds.includes(userId)).map(([id]) => id);
}
function viewerCanSeeFollowersPosts(profileUserId) {
  const viewer = currentViewer();
  return viewerCanSeePersonalFeed(profileUserId) && !!viewer && (viewer.id === profileUserId || followingIdsFor(viewer.id).includes(profileUserId));
}
function shouldHidePublicActivityFromPersonalFeeds(userId) {
  return settingsForUser(userId)?.hidePublicActivityFromPersonalFeeds ?? false;
}
let followsByUserId = {
  "viewer-1": ["user-rowan", "user-tool", "user-mika"],
  "user-rowan": ["viewer-1", "user-mika"],
  "user-tool": ["viewer-1"],
  "user-mika": ["viewer-1", "user-rowan"],
  "user-ember": ["viewer-1"]
};
const housingBuild = {
  slug: "housing-build",
  label: "Housing & Build",
  kind: "channel"
};
const mutualAid = {
  slug: "mutual-aid",
  label: "Mutual Aid",
  kind: "channel"
};
const eastMarket = {
  slug: "east-market-makers",
  label: "East Market Makers",
  kind: "community"
};
const toolLibrary = {
  slug: "tool-library-crew",
  label: "Tool Library Crew",
  kind: "community"
};
const platform = {
  slug: "platform",
  label: "Platform",
  kind: "channel"
};
const platformDirectory = {
  slug: "platform",
  label: "Platform",
  href: "/platform"
};
const channelDirectory = [
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
const communityDirectory = [
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
function buildContainedAssetUnits(assetTitle, seeds) {
  return seeds.map((seed, index) => ({
    id: `${assetTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-unit-${index + 1}`,
    label: `${assetTitle} ${index + 1}`,
    statusLabel: seed.statusLabel,
    locationLabel: seed.locationLabel,
    summary: seed.summary,
    currentBorrowerLabel: seed.currentBorrowerLabel ?? null
  }));
}
const platformAssetsFixture = {
  featureOpen: false,
  intro: "Assets stays under the platform because land, storage, and collective funds need public stewardship before they become live means of production in common.",
  featureFrames: [
    {
      id: "asset-provenance",
      title: "Asset provenance",
      body: "Every asset page is framed to carry a permanent custody and status history once live asset operations open.",
      statusLabel: "Frame only"
    },
    {
      id: "borrowing-and-requests",
      title: "Borrowing and request flows",
      body: "Borrowing requests, project-use requests, and delivery coordination will live as separate modules attached to asset and project detail surfaces.",
      statusLabel: "Frame only"
    },
    {
      id: "non-land-assets",
      title: "Non-land asset records",
      body: "Land records are live as placeholders now, while non-land asset pages are framed to slot into the same detail architecture later without route churn.",
      statusLabel: "Frame only"
    }
  ],
  landAssets: [
    {
      id: "land-tool-library-campus",
      slug: "tool-library-campus",
      title: "Tool Library Campus Lot",
      locationLabel: "North side tool library block",
      acreageLabel: "0.28 ha",
      statusLabel: "Closed preview",
      stewardshipNote: "This land record groups the workshop building, open repair yard, and adjacent storage area under one stewardship record so collective services can attach cleanly.",
      currentCustodianLabel: "Platform stewardship preview",
      homeLandAssetLabel: "Tool Library Campus Lot",
      historySummary: "Full provenance, borrowing, damage, and custody history will be recorded here once the live asset registry opens.",
      governance: buildAssetGovernanceData("land-tool-library-campus"),
      attachedAssets: [
        {
          id: "asset-tool-library-workbench-set",
          slug: "workshop-bench-set",
          title: "Workshop bench set",
          typeLabel: "Non-land asset preview",
          statusLabel: "Fake preview asset",
          custodyLabel: "Held under Tool Library Campus Lot",
          summary: "A seeded preview of a shared workshop-bench asset record that would return to this land asset when not checked out to active work.",
          locationLabel: "Tool Library workshop floor",
          currentCustodianLabel: "Tool Library Land Stewardship Service",
          homeLandAssetLabel: "Tool Library Campus Lot",
          parentLandAssetSlug: "tool-library-campus",
          parentLandAssetTitle: "Tool Library Campus Lot",
          stewardshipNote: "This seeded non-land asset represents shared fixed work surfaces that return to the workshop floor between repair and teaching sessions.",
          historySummary: "A full attachment, borrowing, damage, and maintenance history will appear here once the non-land registry opens.",
          governance: buildAssetGovernanceData("asset-tool-library-workbench-set"),
          requestFrames: [
            {
              id: "asset-use",
              title: "Workshop-use request preview",
              body: "Fake preview only: repair and teaching projects would request this bench set here before scheduling hands-on sessions.",
              statusLabel: "Fake preview"
            },
            {
              id: "delivery",
              title: "Bench transfer preview",
              body: "Fake preview only: any temporary move of these benches to another site would record a delivery handoff here.",
              statusLabel: "Fake preview"
            }
          ],
          detailSections: [
            {
              id: "maintenance-history",
              title: "Maintenance history",
              body: "This section is reserved for bench repairs, surface resurfacing, and any safety checks tied to the shared workshop set.",
              statusLabel: "Fake preview"
            },
            {
              id: "use-log",
              title: "Use log",
              body: "Confirmed project-use sessions, teaching blocks, and return timestamps will be listed here once the registry opens.",
              statusLabel: "Fake preview"
            }
          ],
          managementProjects: [
            {
              id: "asset-project-tool-library-land-stewardship-bench",
              title: "Tool Library Land Stewardship Service",
              projectMode: "collective-service",
              relationshipLabel: "Primary stewardship service",
              statusLabel: "Preview seed",
              summary: "The land stewardship service remains responsible for physical upkeep and placement of the workshop bench set.",
              href: null
            }
          ],
          storageProjects: [
            {
              id: "asset-project-tool-library-storage-bench",
              title: "Tool Library Storage Facility Service",
              projectMode: "collective-service",
              relationshipLabel: "Overflow storage when not installed",
              statusLabel: "Preview seed",
              summary: "Overflow bench parts and replacement surfaces are held by the storage service when they are not on the floor.",
              href: null
            }
          ],
          linkedProjects: [
            {
              id: "project-repair-cafe-bench-use",
              title: "Repair Cafe Shift Grid",
              projectMode: "collective-service",
              relationshipLabel: "Current user of this shared work surface",
              statusLabel: "Existing project",
              summary: "Repair-cafe shifts depend on this bench set for intake triage and hands-on repair work.",
              href: "/projects/repair-cafe-shift-grid"
            }
          ],
          href: "/platform/assets/tool-library-campus/attached/workshop-bench-set"
        },
        {
          id: "asset-tool-library-intake-carts",
          slug: "repair-intake-cart",
          title: "Repair intake cart",
          typeLabel: "Asset",
          quantityLabel: "x 5",
          totalQuantity: 5,
          availableQuantity: 3,
          containedUnits: buildContainedAssetUnits("Repair intake cart", [
            {
              statusLabel: "Available",
              locationLabel: "Tool Library front room",
              summary: "Ready for intake or handoff use today."
            },
            {
              statusLabel: "Available",
              locationLabel: "Tool Library front room",
              summary: "Ready for intake or handoff use today."
            },
            {
              statusLabel: "Available",
              locationLabel: "Tool Library intake lane",
              summary: "Held near the intake lane for heavy-dropoff days."
            },
            {
              statusLabel: "Borrowed",
              locationLabel: "Neighborhood cleanup route",
              summary: "Currently out on a cleanup run and expected back next week.",
              currentBorrowerLabel: "patchbay"
            },
            {
              statusLabel: "Reserved",
              locationLabel: "Tool Library front room",
              summary: "Held back for overlapping childcare check-in coverage."
            }
          ]),
          statusLabel: "Fake preview asset",
          custodyLabel: "Assigned to Tool Library Storage Facility Service",
          summary: "A seeded preview of rolling intake carts that could be borrowed between the repair floor and the front-room check-in service.",
          locationLabel: "Tool Library front room and intake lane",
          currentCustodianLabel: "Tool Library Storage Facility Service",
          homeLandAssetLabel: "Tool Library Campus Lot",
          parentLandAssetSlug: "tool-library-campus",
          parentLandAssetTitle: "Tool Library Campus Lot",
          stewardshipNote: "These rolling carts move between front-room intake and workshop staging while still tracing back to the tool-library land record.",
          historySummary: "A full movement, damage, and return history will appear here once attached asset tracking is live.",
          governance: buildAssetGovernanceData("asset-tool-library-intake-carts"),
          requestFrames: [
            {
              id: "borrowing",
              title: "Cart borrowing preview",
              body: "Fake preview only: members would request temporary cart use here when moving heavy repair intake between rooms.",
              statusLabel: "Fake preview"
            },
            {
              id: "delivery",
              title: "Intake handoff preview",
              body: "Fake preview only: delivery-style handoffs between the front room and workshop floor would be recorded here.",
              statusLabel: "Fake preview"
            }
          ],
          detailSections: [
            {
              id: "movement-log",
              title: "Movement log",
              body: "This section will record where each cart moved, who moved it, and when it returned to intake or storage.",
              statusLabel: "Fake preview"
            },
            {
              id: "repair-log",
              title: "Repair log",
              body: "Wheel replacements, handle repairs, and condition checks will appear here once the non-land asset registry opens.",
              statusLabel: "Fake preview"
            }
          ],
          managementProjects: [],
          storageProjects: [
            {
              id: "asset-project-tool-library-storage-carts",
              title: "Tool Library Storage Facility Service",
              projectMode: "collective-service",
              relationshipLabel: "Primary storage service",
              statusLabel: "Preview seed",
              summary: "The storage service keeps custody of the intake carts when they are not in circulation.",
              href: null
            }
          ],
          linkedProjects: [
            {
              id: "project-childcare-checkin-carts",
              title: "Childcare Check-in Desk Service",
              projectMode: "collective-service",
              relationshipLabel: "Occasional shared front-room use",
              statusLabel: "Existing project",
              summary: "The front-room service can temporarily borrow carts when intake materials need to move quickly during overlapping events.",
              href: "/projects/childcare-checkin-desk-service"
            }
          ],
          href: "/platform/assets/tool-library-campus/attached/repair-intake-cart"
        }
      ],
      requestFrames: [
        {
          id: "borrowing",
          title: "Borrowing preview for this site",
          body: "Fake preview only: individual borrowers would request attached non-land assets here, with expected return dates and steward follow-up visible on the record.",
          statusLabel: "Fake preview"
        },
        {
          id: "asset-use",
          title: "Project-use asset request preview",
          body: "Fake preview only: projects needing workshop space or attached equipment would send availability requests here before their plans became voteable.",
          statusLabel: "Fake preview"
        },
        {
          id: "delivery",
          title: "Delivery handoff preview",
          body: "Fake preview only: delivery services would record pickup and return handoffs here when assets moved between sites.",
          statusLabel: "Fake preview"
        }
      ],
      detailSections: [
        {
          id: "provenance-history",
          title: "Provenance history",
          body: "This section is reserved for the permanent chronological record of transfers, borrowing, damage, and stewardship changes tied to this land asset.",
          statusLabel: "Frame only"
        },
        {
          id: "attached-assets",
          title: "Attached non-land assets",
          body: "Non-land assets that live on or return to this site will appear here as individual records with their own detail pages.",
          statusLabel: "Frame only"
        },
        {
          id: "requests",
          title: "Requests and borrowing",
          body: "Borrowing requests, project-use requests, and delivery handoffs will be grouped here once those coordination and governance flows are active.",
          statusLabel: "Frame only"
        }
      ],
      managementProjects: [
        {
          id: "asset-project-tool-library-land-stewardship",
          title: "Tool Library Land Stewardship Service",
          projectMode: "collective-service",
          relationshipLabel: "Primary land management",
          statusLabel: "Preview seed",
          summary: "Collective stewardship work for maintenance windows, access rules, and shared site upgrades tied to the tool library land asset.",
          href: null
        }
      ],
      storageProjects: [
        {
          id: "asset-project-tool-library-storage",
          title: "Tool Library Storage Facility Service",
          projectMode: "collective-service",
          relationshipLabel: "Storage facility on site",
          statusLabel: "Preview seed",
          summary: "Collective storage service for intake shelves, overflow bins, and shared material custody on the campus lot.",
          href: null
        }
      ],
      linkedProjects: [
        {
          id: "project-repair-cafe",
          title: "Repair Cafe Shift Grid",
          projectMode: "collective-service",
          relationshipLabel: "Uses workshop floor on this land",
          statusLabel: "Existing project",
          summary: "Active repair-cafe shifts depend on the workshop floor and shared intake area attached to this land asset.",
          href: "/projects/repair-cafe-shift-grid"
        },
        {
          id: "project-childcare-checkin-desk",
          title: "Childcare Check-in Desk Service",
          projectMode: "collective-service",
          relationshipLabel: "Uses front room on this land",
          statusLabel: "Existing project",
          summary: "The current childcare check-in desk depends on front-room access within this same site.",
          href: "/projects/childcare-checkin-desk-service"
        }
      ]
    },
    {
      id: "land-east-market-commons",
      slug: "east-market-commons",
      title: "East Market Commons Lot",
      locationLabel: "East Market retrofit and pickup cluster",
      acreageLabel: "0.53 ha",
      statusLabel: "Closed preview",
      stewardshipNote: "This lot ties together retrofit staging space, a future shared cold-storage pad, and pickup lanes that multiple neighborhood services already depend on.",
      currentCustodianLabel: "Platform stewardship preview",
      homeLandAssetLabel: "East Market Commons Lot",
      historySummary: "Full provenance, borrowing, damage, and custody history will be recorded here once the live asset registry opens.",
      governance: buildAssetGovernanceData("land-east-market-commons"),
      attachedAssets: [
        {
          id: "asset-east-market-cold-racks",
          slug: "cold-storage-rack-set",
          title: "Cold-storage rack set",
          typeLabel: "Non-land asset preview",
          statusLabel: "Fake preview asset",
          custodyLabel: "Assigned to East Market Cold Storage Service",
          summary: "A seeded preview of insulated storage racks that would stay attached to this site when not checked out for project use.",
          locationLabel: "East Market cold pad",
          currentCustodianLabel: "East Market Cold Storage Service",
          homeLandAssetLabel: "East Market Commons Lot",
          parentLandAssetSlug: "east-market-commons",
          parentLandAssetTitle: "East Market Commons Lot",
          stewardshipNote: "These racks stay under commons custody but can be reserved by storage and distribution work that depends on temporary cold holding.",
          historySummary: "A full availability, condition, and transfer history will appear here once attached asset pages are live.",
          governance: buildAssetGovernanceData("asset-east-market-cold-racks"),
          requestFrames: [
            {
              id: "asset-use",
              title: "Cold-storage use preview",
              body: "Fake preview only: projects needing temporary cold holding would request rack access here before scheduling pickups.",
              statusLabel: "Fake preview"
            },
            {
              id: "delivery",
              title: "Cold-chain handoff preview",
              body: "Fake preview only: pickup and return handoffs for cold-storage runs would be tracked here.",
              statusLabel: "Fake preview"
            }
          ],
          detailSections: [
            {
              id: "temperature-log",
              title: "Temperature and condition log",
              body: "This section will record maintenance checks, temperature incidents, and cleaning rounds for the shared rack set.",
              statusLabel: "Fake preview"
            },
            {
              id: "reservation-history",
              title: "Reservation history",
              body: "Approved cold-storage reservations and project-use windows will appear here once the registry opens.",
              statusLabel: "Fake preview"
            }
          ],
          managementProjects: [],
          storageProjects: [
            {
              id: "asset-project-east-market-cold-racks-storage",
              title: "East Market Cold Storage Service",
              projectMode: "collective-service",
              relationshipLabel: "Primary storage service",
              statusLabel: "Preview seed",
              summary: "The cold-storage service keeps custody of the rack set and manages availability windows for shared use.",
              href: null
            }
          ],
          linkedProjects: [
            {
              id: "project-ride-coordination-cold-racks",
              title: "Neighborhood Ride Coordination Service",
              projectMode: "collective-service",
              relationshipLabel: "Supports cooled pickup windows",
              statusLabel: "Existing project",
              summary: "Dispatch work at East Market can route time-sensitive pickups through this rack set before riders depart.",
              href: "/projects/neighborhood-ride-coordination-service"
            }
          ],
          href: "/platform/assets/east-market-commons/attached/cold-storage-rack-set"
        },
        {
          id: "asset-east-market-retrofit-tables",
          slug: "retrofit-staging-tables",
          title: "Retrofit staging table",
          typeLabel: "Asset",
          quantityLabel: "x 6",
          totalQuantity: 6,
          availableQuantity: 4,
          containedUnits: buildContainedAssetUnits("Retrofit staging table", [
            {
              statusLabel: "Available",
              locationLabel: "East Market staging shed",
              summary: "Ready for build-day staging."
            },
            {
              statusLabel: "Available",
              locationLabel: "East Market staging shed",
              summary: "Ready for build-day staging."
            },
            {
              statusLabel: "Available",
              locationLabel: "East Market staging shed",
              summary: "Ready for build-day staging."
            },
            {
              statusLabel: "Available",
              locationLabel: "East Market retrofit pad",
              summary: "Already set near the active build lane."
            },
            {
              statusLabel: "Reserved",
              locationLabel: "East Market retrofit pad",
              summary: "Assigned to the next hallway air-sealing setup window."
            },
            {
              statusLabel: "Maintenance",
              locationLabel: "Retrofit Materials Shed Service",
              summary: "Waiting on a clamp replacement before it returns to the active set."
            }
          ]),
          statusLabel: "Fake preview asset",
          custodyLabel: "Held under East Market Commons Lot",
          summary: "A seeded preview of shared staging tables that could move between retrofit and delivery work while keeping a permanent provenance record.",
          locationLabel: "East Market staging shed",
          currentCustodianLabel: "East Market Land Stewardship Service",
          homeLandAssetLabel: "East Market Commons Lot",
          parentLandAssetSlug: "east-market-commons",
          parentLandAssetTitle: "East Market Commons Lot",
          stewardshipNote: "These staging tables return to the commons lot between build-day use, deliveries, and storage reshuffles.",
          historySummary: "A full movement and maintenance history will appear here once attached asset pages are live.",
          governance: buildAssetGovernanceData("asset-east-market-retrofit-tables"),
          requestFrames: [
            {
              id: "asset-use",
              title: "Build-day use preview",
              body: "Fake preview only: productive projects would reserve these tables here before staging install kits and safety gear.",
              statusLabel: "Fake preview"
            },
            {
              id: "borrowing",
              title: "Short-term borrowing preview",
              body: "Fake preview only: short internal loans between East Market services would be recorded here with expected return timing.",
              statusLabel: "Fake preview"
            }
          ],
          detailSections: [
            {
              id: "movement-log",
              title: "Movement log",
              body: "This section will record when the tables move from storage to staging and back again after productive work closes.",
              statusLabel: "Fake preview"
            },
            {
              id: "condition-log",
              title: "Condition log",
              body: "Surface wear, repairs, and replacement-part swaps will appear here once the registry opens.",
              statusLabel: "Fake preview"
            }
          ],
          managementProjects: [
            {
              id: "asset-project-east-market-land-staging-tables",
              title: "East Market Land Stewardship Service",
              projectMode: "collective-service",
              relationshipLabel: "Primary stewardship service",
              statusLabel: "Preview seed",
              summary: "The land stewardship service manages where the staging tables live when they are not assigned to productive work.",
              href: null
            }
          ],
          storageProjects: [
            {
              id: "asset-project-east-market-material-shed-tables",
              title: "Retrofit Materials Shed Service",
              projectMode: "collective-service",
              relationshipLabel: "Primary storage service",
              statusLabel: "Preview seed",
              summary: "The materials shed service keeps replacement legs, clamps, and protective coverings for the shared tables.",
              href: null
            }
          ],
          linkedProjects: [
            {
              id: "project-air-sealing-tables",
              title: "Hallway Air-Sealing Build Day",
              projectMode: "productive",
              relationshipLabel: "Current productive user",
              statusLabel: "Existing project",
              summary: "The current build day uses these staging tables for tools, safety checks, and material sorting.",
              href: "/projects/hallway-air-sealing-build-day"
            }
          ],
          href: "/platform/assets/east-market-commons/attached/retrofit-staging-tables"
        }
      ],
      requestFrames: [
        {
          id: "borrowing",
          title: "Borrowing preview for this site",
          body: "Fake preview only: individual borrowers would request attached non-land assets here, with expected return dates and steward follow-up visible on the record.",
          statusLabel: "Fake preview"
        },
        {
          id: "asset-use",
          title: "Project-use asset request preview",
          body: "Fake preview only: projects needing cold storage, staging space, or site access would send availability requests here before plans advanced.",
          statusLabel: "Fake preview"
        },
        {
          id: "delivery",
          title: "Delivery handoff preview",
          body: "Fake preview only: delivery services would record pickup and return handoffs here when assets moved between East Market and other sites.",
          statusLabel: "Fake preview"
        }
      ],
      detailSections: [
        {
          id: "provenance-history",
          title: "Provenance history",
          body: "This section is reserved for the permanent chronological record of transfers, borrowing, damage, and stewardship changes tied to this land asset.",
          statusLabel: "Frame only"
        },
        {
          id: "attached-assets",
          title: "Attached non-land assets",
          body: "Non-land assets that live on or return to this site will appear here as individual records with their own detail pages.",
          statusLabel: "Frame only"
        },
        {
          id: "requests",
          title: "Requests and borrowing",
          body: "Borrowing requests, project-use requests, and delivery handoffs will be grouped here once those coordination and governance flows are active.",
          statusLabel: "Frame only"
        }
      ],
      managementProjects: [
        {
          id: "asset-project-east-market-land-stewardship",
          title: "East Market Land Stewardship Service",
          projectMode: "collective-service",
          relationshipLabel: "Primary land management",
          statusLabel: "Preview seed",
          summary: "Collective stewardship for maintenance, scheduling, and site-use agreements across the East Market land record.",
          href: null
        }
      ],
      storageProjects: [
        {
          id: "asset-project-east-market-cold-storage",
          title: "East Market Cold Storage Service",
          projectMode: "collective-service",
          relationshipLabel: "Storage facility on site",
          statusLabel: "Preview seed",
          summary: "Cold-storage stewardship service for shared food custody and reserve handling on the commons lot.",
          href: null
        },
        {
          id: "asset-project-east-market-material-shed",
          title: "Retrofit Materials Shed Service",
          projectMode: "collective-service",
          relationshipLabel: "Storage facility on site",
          statusLabel: "Preview seed",
          summary: "Shared storage service for retrofit materials, staging tables, and neighborhood build inventory on the lot.",
          href: null
        }
      ],
      linkedProjects: [
        {
          id: "project-ride-coordination-land-link",
          title: "Neighborhood Ride Coordination Service",
          projectMode: "collective-service",
          relationshipLabel: "Uses pickup lane and dispatch table on this land",
          statusLabel: "Existing project",
          summary: "The active ride desk uses the pickup lane and visible dispatch area attached to the commons lot.",
          href: "/projects/neighborhood-ride-coordination-service"
        },
        {
          id: "project-air-sealing-land-link",
          title: "Hallway Air-Sealing Build Day",
          projectMode: "productive",
          relationshipLabel: "Uses retrofit staging area on this land",
          statusLabel: "Existing project",
          summary: "The active build-day staging tables and materials layout sit on this commons lot once acquisition closes.",
          href: "/projects/hallway-air-sealing-build-day"
        }
      ]
    }
  ],
  funds: [
    {
      id: "fund-east-market-cold-storage",
      slug: "east-market-cold-storage-fund",
      title: "East Market Cold Storage Fund",
      summary: "Collective fund round to secure shared cold-storage equipment and convert it into a nonprofit-held commons asset for the East Market lot.",
      progressPercent: 62,
      raisedLabel: "$18,600",
      targetLabel: "$30,000",
      status: "active",
      executionNote: "Board members will eventually execute the real purchase with the nonprofit bank account, then convert the asset into the registry once the acquisition surface opens.",
      linkedAssetTitles: ["East Market Commons Lot"],
      projectHref: "/projects/east-market-cold-storage-acquisition-round"
    },
    {
      id: "fund-tool-library-shed-conversion",
      slug: "tool-library-shed-conversion-fund",
      title: "Tool Library Storage Shed Conversion Fund",
      summary: "Completed fund round for converting an existing outbuilding into shared intake and overflow storage under collective stewardship.",
      progressPercent: 100,
      raisedLabel: "$12,400",
      targetLabel: "$12,400",
      status: "completed",
      executionNote: "Funds are complete, but board members still need to execute the purchase and convert the resulting storage asset into the platform registry.",
      linkedAssetTitles: ["Tool Library Campus Lot"],
      projectHref: "/projects/tool-library-shed-conversion-round"
    }
  ]
};
const explicitAssetServiceProjectSeeds = [
  {
    slug: "tool-library-land-stewardship",
    title: "Tool Library Land Stewardship Service",
    authorUsername: "toolorbit",
    projectSubtype: "land-management",
    summary: "A live stewardship surface for access windows, upkeep work, and custody rules across the Tool Library Campus Lot.",
    locationLabel: "Tool Library Campus Lot",
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    memberIds: ["viewer-1", "user-tool", "user-rowan", "user-mika"],
    createdAt: "2026-04-26T13:20:00Z",
    lastActivityAt: "2026-05-01T15:10:00Z",
    updateTitle: "Weekly site walk published",
    updateBody: "The next stewardship walk now pairs surface cleanup with a cart-placement review so attached assets stop drifting between intake and repair zones.",
    activityScheduledAt: "2026-05-03T15:00:00Z",
    activityEndsAt: "2026-05-03T17:00:00Z",
    activityNote: "Stewards are checking access routes, surface wear, and where shared carts should return after use."
  },
  {
    slug: "tool-library-storage",
    title: "Tool Library Storage Facility Service",
    authorUsername: "rowanloop",
    projectSubtype: "storage",
    summary: "An active storage service for intake shelves, overflow bins, and shared asset custody across the Tool Library campus.",
    locationLabel: "Tool Library campus outbuilding",
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    memberIds: ["viewer-1", "user-tool", "user-rowan", "user-mika"],
    createdAt: "2026-04-27T12:10:00Z",
    lastActivityAt: "2026-05-01T16:25:00Z",
    updateTitle: "Overflow shelf labels tightened",
    updateBody: "Shelf labels now match the intake cart and bench-part custody notes so members can tell what is requestable versus reserve stock at a glance.",
    activityScheduledAt: "2026-05-04T17:00:00Z",
    activityEndsAt: "2026-05-04T19:00:00Z",
    activityNote: "This intake window rechecks tagged shelves, reserve stock, and which requests need linked delivery support."
  },
  {
    slug: "east-market-land-stewardship",
    title: "East Market Land Stewardship Service",
    authorUsername: "rowanloop",
    projectSubtype: "land-management",
    summary: "A live stewardship surface for scheduling, upkeep, and on-land asset placement across the East Market Commons Lot.",
    locationLabel: "East Market Commons Lot",
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    memberIds: ["viewer-1", "user-rowan", "user-mika", "user-ember"],
    createdAt: "2026-04-27T09:50:00Z",
    lastActivityAt: "2026-05-01T12:20:00Z",
    updateTitle: "Staging layout review reopened",
    updateBody: "The next stewardship round now includes where retrofit tables should sit between build days so the lot stays readable to both storage and activity crews.",
    activityScheduledAt: "2026-05-03T12:00:00Z",
    activityEndsAt: "2026-05-03T14:00:00Z",
    activityNote: "Stewards are checking access lanes, table placement, and cold-pad clearance before the next build cycle."
  },
  {
    slug: "east-market-cold-storage",
    title: "East Market Cold Storage Service",
    authorUsername: "rowanloop",
    projectSubtype: "storage",
    summary: "An active storage service for shared cold-holding gear, reserve stock, and request handoff at the East Market cold pad.",
    locationLabel: "East Market cold pad",
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    memberIds: ["viewer-1", "user-rowan", "user-ember"],
    createdAt: "2026-04-28T10:30:00Z",
    lastActivityAt: "2026-05-01T18:05:00Z",
    updateTitle: "Pickup reserve shelf kept open",
    updateBody: "One reserve shelf now stays open for urgent chilled handoffs so regular requests do not consume the full rack set.",
    activityScheduledAt: "2026-05-04T18:00:00Z",
    activityEndsAt: "2026-05-04T20:00:00Z",
    activityNote: "The cold-storage intake window confirms available rack space, reserve stock, and any linked delivery handoff needed for pickups."
  },
  {
    slug: "retrofit-materials-shed-service",
    title: "Retrofit Materials Shed Service",
    authorUsername: "patchbay",
    projectSubtype: "storage",
    summary: "An active storage service for retrofit materials, staging tables, and protective gear held on the East Market lot.",
    locationLabel: "East Market staging shed",
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    memberIds: ["viewer-1", "user-rowan", "user-tool", "user-mika"],
    createdAt: "2026-04-28T14:15:00Z",
    lastActivityAt: "2026-05-01T17:15:00Z",
    updateTitle: "Table reserve count posted",
    updateBody: "The shed now shows how many retrofit staging tables are immediately requestable versus held back for the next build day.",
    activityScheduledAt: "2026-05-04T16:00:00Z",
    activityEndsAt: "2026-05-04T18:00:00Z",
    activityNote: "This handoff window rechecks tables, protective coverings, and which outgoing requests need a delivery service linked in."
  }
];
const assetServiceProjectHrefByTitle = Object.fromEntries(
  explicitAssetServiceProjectSeeds.map((seed) => [seed.title, `/projects/${seed.slug}`])
);
function explicitAssetServiceApprovalVotes(memberIds) {
  return Object.fromEntries(memberIds.map((userId) => [userId, "yes"]));
}
function explicitAssetServiceSignalVotes(memberIds) {
  return Object.fromEntries(memberIds.map((userId) => [userId, 4]));
}
function explicitAssetServiceMemberUsernames(memberIds) {
  return memberIds.map((userId) => userById(userId)?.username).filter((username) => !!username);
}
function explicitAssetServiceValueLabel(seed) {
  return seed.projectSubtype === "land-management" ? `Keep access, upkeep, and attached-asset placement legible across ${seed.locationLabel}.` : `Keep shared asset custody, pickup timing, and reserve stock legible through ${seed.title}.`;
}
function explicitAssetServiceProjectStatus(seed) {
  return seed.projectSubtype === "land-management" ? `${seed.title} is already coordinating live stewardship work for ${seed.locationLabel}.` : `${seed.title} is already handling live storage requests and custody for ${seed.locationLabel}.`;
}
function buildExplicitAssetServiceActivity(seed) {
  const memberUsernames = explicitAssetServiceMemberUsernames(seed.memberIds);
  return {
    id: `project-activity-${seed.slug}-1`,
    title: seed.projectSubtype === "land-management" ? `${seed.locationLabel} stewardship walk` : `${seed.title} intake window`,
    authorUsername: seed.authorUsername,
    scheduledAt: seed.activityScheduledAt,
    endsAt: seed.activityEndsAt,
    locationLabel: seed.locationLabel,
    minimumParticipants: 2,
    linkedPlanPhaseId: `production-plan-${seed.slug}-1-phase-1`,
    roles: [
      {
        label: seed.projectSubtype === "land-management" ? "Site steward" : "Intake steward",
        requiredCount: 1,
        assignedUsernames: memberUsernames.slice(0, 1)
      },
      {
        label: seed.projectSubtype === "land-management" ? "Maintenance support" : "Storage handoff",
        requiredCount: 1,
        assignedUsernames: memberUsernames.slice(1, 2)
      }
    ],
    note: seed.activityNote
  };
}
const explicitAssetServiceProjectFeedItems = explicitAssetServiceProjectSeeds.map((seed) => ({
  kind: "project",
  id: `project-${seed.slug}`,
  slug: seed.slug,
  href: `/projects/${seed.slug}`,
  createdAt: seed.createdAt,
  title: seed.title,
  authorUsername: seed.authorUsername,
  projectMode: "collective-service",
  projectSubtype: seed.projectSubtype,
  summary: seed.summary,
  channelTags: seed.channelTags,
  communityTags: seed.communityTags,
  stage: "Activity",
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
const explicitAssetServiceProjectManagersBySlug = Object.fromEntries(
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
      currentPhaseId: "phase-5",
      phases: {
        "phase-5": {
          projectStatus: explicitAssetServiceProjectStatus(seed)
        },
        "phase-6": {
          projectStatus: "This service stays open while the linked land or attached assets still need active stewardship and request handling."
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
            title: seed.projectSubtype === "land-management" ? `${seed.locationLabel} stewardship operating model` : `${seed.title} operating model`,
            authorUsername: seed.authorUsername,
            createdAt: seed.createdAt,
            outputSummary: seed.summary,
            materialsSummary: seed.projectSubtype === "land-management" ? "Needs recurring site walks, clear upkeep notes, and visible custody rules for attached assets on the land." : "Needs intake windows, labeled shelves, and reserve stock rules so requestable assets do not disappear into ad hoc handoffs.",
            totalCostLabel: "$0 direct spend",
            acquisitionsSummary: "Uses already-held land and asset records that are seeded directly through the adapter-backed mock data.",
            overallVotesByUserId: approvalVotes,
            valueVotesByValueId: {
              [valueId]: approvalVotes
            }
          }
        ],
        phaseThreePlans: [
          {
            id: `distribution-plan-${seed.slug}-1`,
            title: seed.projectSubtype === "land-management" ? "Access and custody rules" : "Request and pickup flow",
            authorUsername: seed.authorUsername,
            createdAt: seed.lastActivityAt,
            distributionSummary: seed.projectSubtype === "land-management" ? `Keep land access, upkeep, and attached-asset placement visible through one shared service surface for ${seed.locationLabel}.` : `Handle storage requests through one visible intake surface so shared assets at ${seed.locationLabel} stay legible.`,
            accessSummary: seed.projectSubtype === "land-management" ? "Members can request site-use changes or on-land asset moves directly from this project page, with stewards coordinating the resulting work." : "Members can request stored assets directly from this project page, and stewards can either arrange pickup or route the handoff through a linked delivery service.",
            reserveSummary: seed.projectSubtype === "land-management" ? "Keep one stewardship window open each cycle for urgent repairs, accessibility changes, or safety cleanup." : "Keep a small reserve buffer so urgent replacements and accessibility requests do not consume the full shelf.",
            requestSystemEnabled: true,
            requestMode: "both",
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
const explicitAssetServiceProjectDetailExtras = Object.fromEntries(
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
      discussionNote: seed.projectSubtype === "land-management" ? `Use chat to coordinate site access, upkeep windows, and where attached assets should sit across ${seed.locationLabel}.` : `Use chat to coordinate storage handoffs, reserve stock, and whether requests at ${seed.locationLabel} should be picked up directly or linked to a delivery service.`,
      discussion: []
    }
  ])
);
function buildAssetGovernanceVoteSummary(eligibleVoterCount, yesCount, noCount, note) {
  const votesRequired = Math.ceil(eligibleVoterCount * GOVERNANCE_APPROVAL_THRESHOLD_PERCENT / 100);
  const approvalPercent = yesCount + noCount <= 0 ? 0 : Math.round(yesCount / (yesCount + noCount) * 100);
  const votesRemaining = Math.max(votesRequired - (yesCount + noCount), 0);
  return {
    yesCount,
    noCount,
    eligibleVoterCount,
    approvalPercent,
    votesRequired,
    votesRemaining,
    statusLabel: yesCount >= votesRequired ? "Approved" : votesRemaining === 0 && yesCount < votesRequired ? "Rejected" : "Pending",
    note
  };
}
function emptyAssetGovernanceData() {
  return {
    availabilityRequests: [],
    borrowingPolicies: [],
    borrowingRequests: [],
    deliveryRequests: [],
    provenanceTimeline: []
  };
}
function buildAssetGovernanceData(assetId) {
  switch (assetId) {
    case "land-tool-library-campus":
      return {
        availabilityRequests: [
          {
            id: "availability-tool-library-benches-approved",
            assetLabel: "Workshop bench set",
            title: "Repair cafe workshop-use window",
            statusLabel: "Approved availability",
            requestingPartyLabel: "Repair Cafe Shift Grid",
            requestedAtLabel: "Opened May 2",
            timeframeLabel: "May 9 to May 30 repair shifts",
            managingProjectLabel: "Tool Library Land Stewardship Service",
            summary: "The stewardship team confirmed that the fixed bench set stays reserved for recurring repair-cafe intake and triage blocks this month.",
            outcomeNote: "Approved requests unlock the linked plan or shift scheduling without needing a second availability check.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              0,
              "The site stewards cleared the required threshold for recurring repair-cafe use."
            )
          },
          {
            id: "availability-tool-library-carts-pending",
            assetLabel: "Repair intake carts",
            title: "Front-room overlap request",
            statusLabel: "Pending availability vote",
            requestingPartyLabel: "Childcare Check-in Desk Service",
            requestedAtLabel: "Opened May 14",
            timeframeLabel: "Two overlapping event mornings next week",
            managingProjectLabel: "Tool Library Storage Facility Service",
            summary: "The childcare desk requested two carts during overlapping intake windows so supplies can move between the front room and workshop.",
            outcomeNote: "The request stays pending until the storage service decides whether enough carts remain available for repair intake.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              1,
              0,
              "One more yes vote would clear the storage-service threshold."
            )
          }
        ],
        borrowingPolicies: [
          {
            id: "policy-tool-library-benches",
            assetLabel: "Workshop bench set",
            statusLabel: "Active policy",
            policyLabel: "Project use only",
            managingProjectLabel: "Tool Library Land Stewardship Service",
            decidedAtLabel: "Last changed Apr 29",
            summary: "The fixed bench set stays reserved for project or service work because the benches are installed infrastructure, not portable library items.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              3,
              0,
              "All seeded land stewards supported keeping the bench set in project-use-only custody."
            )
          },
          {
            id: "policy-tool-library-carts",
            assetLabel: "Repair intake carts",
            statusLabel: "Active policy",
            policyLabel: "Individual borrowing permitted",
            managingProjectLabel: "Tool Library Storage Facility Service",
            decidedAtLabel: "Last changed May 3",
            summary: "The rolling carts can be borrowed directly when members need to move materials between the front room, workshop floor, and nearby pickup lane.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              1,
              "The storage team approved individual borrowing with one dissent about cart wear."
            )
          }
        ],
        borrowingRequests: [
          {
            id: "borrowing-tool-library-carts-active",
            assetLabel: "Repair intake carts",
            title: "Community cleanup cart loan",
            statusLabel: "Borrowed by individual",
            borrowerLabel: "patchbay",
            requestedAtLabel: "Requested May 11",
            expectedReturnLabel: "Due back May 18",
            purpose: "Move donated repair items from the alley drop-off to the intake room during the neighborhood cleanup.",
            currentCustodyLabel: "Currently in patchbay custody",
            coordinationNote: "Storage stewards coordinated pickup at the front room and asked for a photo on return so wheel condition stays visible on the record."
          },
          {
            id: "borrowing-tool-library-carts-overdue",
            assetLabel: "Repair intake carts",
            title: "Overflow event cart return",
            statusLabel: "Overdue return",
            borrowerLabel: "quietember",
            requestedAtLabel: "Requested Apr 28",
            expectedReturnLabel: "Due back May 4",
            purpose: "Move childcare sign-in bins during a crowded mutual-aid pickup window.",
            currentCustodyLabel: "Still assigned to quietember",
            coordinationNote: "The storage team is still messaging the borrower directly. No penalty applies, but the overdue state remains public until the cart returns.",
            responsiblePartyLabel: "quietember"
          }
        ],
        deliveryRequests: [
          {
            id: "delivery-tool-library-benches-completed",
            assetLabel: "Workshop bench set",
            title: "Bench parts return from overflow storage",
            statusLabel: "Completed delivery",
            requesterLabel: "Tool Library Land Stewardship Service",
            requestedAtLabel: "Requested May 1",
            neededByLabel: "Completed May 2",
            originLabel: "Tool Library Storage Facility Service",
            destinationLabel: "Tool Library workshop floor",
            assignedVolunteerLabel: "toolorbit",
            summary: "Replacement surfaces and brackets were returned from overflow storage so the bench set could be reopened for repair shifts."
          }
        ],
        provenanceTimeline: [
          {
            id: "provenance-tool-library-land-1",
            title: "Land stewardship record created",
            statusLabel: "Land record opened",
            happenedAtLabel: "Apr 25",
            actorLabel: "platform stewardship preview",
            summary: "The campus lot was entered as the home land record for workshop, intake, and overflow storage assets.",
            locationLabel: "Tool Library Campus Lot",
            custodyLabel: "Platform stewardship preview"
          },
          {
            id: "provenance-tool-library-land-2",
            title: "Bench surfaces returned from storage",
            statusLabel: "Completed delivery",
            happenedAtLabel: "May 2",
            actorLabel: "toolorbit",
            summary: "Overflow bench surfaces returned from storage and were reinstalled on the workshop floor.",
            locationLabel: "Tool Library workshop floor",
            custodyLabel: "Tool Library Land Stewardship Service"
          },
          {
            id: "provenance-tool-library-land-3",
            title: "Intake cart marked overdue",
            statusLabel: "Overdue custody state",
            happenedAtLabel: "May 4",
            actorLabel: "Tool Library Storage Facility Service",
            summary: "One intake cart remained off-site past its expected return and now shows an overdue public custody state.",
            locationLabel: "Borrower off-site use",
            custodyLabel: "quietember"
          }
        ]
      };
    case "asset-tool-library-workbench-set":
      return {
        availabilityRequests: [
          {
            id: "availability-bench-set-approved",
            assetLabel: "Workshop bench set",
            title: "Repair cafe bench reservation",
            statusLabel: "Approved availability",
            requestingPartyLabel: "Repair Cafe Shift Grid",
            requestedAtLabel: "Opened May 2",
            timeframeLabel: "Recurring Friday repair shifts",
            managingProjectLabel: "Tool Library Land Stewardship Service",
            summary: "The bench set was approved for recurring repair-cafe use after stewards confirmed no conflicting workshop maintenance windows.",
            outcomeNote: "The approved request now appears as active project use on the asset record.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              0,
              "The stewardship vote cleared the threshold for recurring use."
            )
          }
        ],
        borrowingPolicies: [
          {
            id: "policy-bench-set",
            assetLabel: "Workshop bench set",
            statusLabel: "Active policy",
            policyLabel: "Project use only",
            managingProjectLabel: "Tool Library Land Stewardship Service",
            decidedAtLabel: "Last changed Apr 29",
            summary: "The bench set stays in project custody because it is installed workshop infrastructure.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              3,
              0,
              "All seeded stewards supported the project-use-only policy."
            )
          }
        ],
        borrowingRequests: [],
        deliveryRequests: [
          {
            id: "delivery-bench-set-return",
            assetLabel: "Workshop bench set",
            title: "Bench surface return from overflow storage",
            statusLabel: "Completed delivery",
            requesterLabel: "Tool Library Land Stewardship Service",
            requestedAtLabel: "Requested May 1",
            neededByLabel: "Completed May 2",
            originLabel: "Overflow shelf zone",
            destinationLabel: "Workshop floor",
            assignedVolunteerLabel: "toolorbit",
            summary: "Replacement surfaces returned from storage and were reinstalled before the next repair shift opened."
          }
        ],
        provenanceTimeline: [
          {
            id: "provenance-bench-1",
            title: "Bench set entered into common custody",
            statusLabel: "Asset registered",
            happenedAtLabel: "Apr 25",
            actorLabel: "platform stewardship preview",
            summary: "The fixed workshop benches were entered as a permanent shared asset under the tool-library land record.",
            locationLabel: "Tool Library workshop floor",
            custodyLabel: "Tool Library Land Stewardship Service"
          },
          {
            id: "provenance-bench-2",
            title: "Repair-cafe use window confirmed",
            statusLabel: "Project use approved",
            happenedAtLabel: "May 2",
            actorLabel: "Tool Library Land Stewardship Service",
            summary: "The stewardship vote cleared recurring repair-cafe use for the current month.",
            locationLabel: "Tool Library workshop floor",
            custodyLabel: "Repair Cafe Shift Grid"
          }
        ]
      };
    case "asset-tool-library-intake-carts":
      return {
        availabilityRequests: [
          {
            id: "availability-carts-pending",
            assetLabel: "Repair intake carts",
            title: "Childcare overlap request",
            statusLabel: "Pending availability vote",
            requestingPartyLabel: "Childcare Check-in Desk Service",
            requestedAtLabel: "Opened May 14",
            timeframeLabel: "Two front-room event mornings",
            managingProjectLabel: "Tool Library Storage Facility Service",
            summary: "The childcare desk asked to reserve two carts during overlapping intake windows while repair intake stays active.",
            outcomeNote: "The request remains pending until the storage team confirms enough carts stay on site for repair intake.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              1,
              0,
              "One more yes vote would approve the overlap request."
            )
          }
        ],
        borrowingPolicies: [
          {
            id: "policy-carts",
            assetLabel: "Repair intake carts",
            statusLabel: "Active policy",
            policyLabel: "Individual borrowing permitted",
            managingProjectLabel: "Tool Library Storage Facility Service",
            decidedAtLabel: "Last changed May 3",
            summary: "Portable carts can be borrowed directly when members need to move shared materials between nearby rooms or pickup lanes.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              1,
              "The storage team approved borrowing with one dissent about wear and tear."
            )
          }
        ],
        borrowingRequests: [
          {
            id: "borrowing-carts-active",
            assetLabel: "Repair intake carts",
            title: "Community cleanup cart loan",
            statusLabel: "Borrowed by individual",
            borrowerLabel: "patchbay",
            requestedAtLabel: "Requested May 11",
            expectedReturnLabel: "Due back May 18",
            purpose: "Move donated repair items from the alley drop-off to the intake room during a neighborhood cleanup.",
            currentCustodyLabel: "Currently in patchbay custody",
            coordinationNote: "Storage stewards coordinated pickup at the front room and asked for a photo on return to confirm wheel condition."
          },
          {
            id: "borrowing-carts-overdue",
            assetLabel: "Repair intake carts",
            title: "Overlapping event overflow cart",
            statusLabel: "Overdue return",
            borrowerLabel: "quietember",
            requestedAtLabel: "Requested Apr 28",
            expectedReturnLabel: "Due back May 4",
            purpose: "Move check-in bins during a crowded mutual-aid pickup window.",
            currentCustodyLabel: "Still assigned to quietember",
            coordinationNote: "The storage team is still coordinating a return directly with the borrower. The overdue state remains public until the cart returns.",
            responsiblePartyLabel: "quietember"
          }
        ],
        deliveryRequests: [
          {
            id: "delivery-carts-handoff",
            assetLabel: "Repair intake carts",
            title: "Front-room to workshop handoff",
            statusLabel: "Completed delivery",
            requesterLabel: "Tool Library Storage Facility Service",
            requestedAtLabel: "Requested May 6",
            neededByLabel: "Completed May 6",
            originLabel: "Tool Library front room",
            destinationLabel: "Workshop floor",
            assignedVolunteerLabel: "samira.l",
            summary: "Two carts moved from check-in to the workshop floor for a heavy repair-intake day."
          }
        ],
        provenanceTimeline: [
          {
            id: "provenance-carts-1",
            title: "Borrowing policy switched to direct borrowing",
            statusLabel: "Borrowing policy approved",
            happenedAtLabel: "May 3",
            actorLabel: "Tool Library Storage Facility Service",
            summary: "The storage team approved direct individual borrowing for the portable carts.",
            locationLabel: "Tool Library front room",
            custodyLabel: "Tool Library Storage Facility Service"
          },
          {
            id: "provenance-carts-2",
            title: "Cart loan opened for cleanup run",
            statusLabel: "Borrowed by individual",
            happenedAtLabel: "May 11",
            actorLabel: "patchbay",
            summary: "A cart left storage for a neighborhood cleanup and remains in active borrower custody until return.",
            locationLabel: "Borrower off-site use",
            custodyLabel: "patchbay"
          },
          {
            id: "provenance-carts-3",
            title: "Second cart marked overdue",
            statusLabel: "Overdue custody state",
            happenedAtLabel: "May 4",
            actorLabel: "Tool Library Storage Facility Service",
            summary: "A second cart remained off-site past its due date and is now publicly marked overdue.",
            locationLabel: "Borrower off-site use",
            custodyLabel: "quietember"
          }
        ]
      };
    case "land-east-market-commons":
      return {
        availabilityRequests: [
          {
            id: "availability-east-market-cold-racks-approved",
            assetLabel: "Cold-storage rack set",
            title: "Cooled pickup lane request",
            statusLabel: "Approved availability",
            requestingPartyLabel: "Neighborhood Ride Coordination Service",
            requestedAtLabel: "Opened May 7",
            timeframeLabel: "Twice-weekly cooled pickup windows",
            managingProjectLabel: "East Market Cold Storage Service",
            summary: "The cold-storage service approved recurring rack access so ride coordination can stage temperature-sensitive pickups.",
            outcomeNote: "The approved request keeps dispatch visible and unlocks cooled pickup scheduling without another asset vote.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              0,
              "Cold-storage stewards approved the cooled pickup window."
            )
          },
          {
            id: "availability-east-market-staging-pending",
            assetLabel: "Retrofit staging tables",
            title: "Next build-day staging request",
            statusLabel: "Pending availability vote",
            requestingPartyLabel: "Hallway Air-Sealing Build Day",
            requestedAtLabel: "Opened May 16",
            timeframeLabel: "Next sealing block and cleanup night",
            managingProjectLabel: "East Market Land Stewardship Service",
            summary: "The build day requested staging-table use for another seal-and-check round plus the follow-up cleanup block.",
            outcomeNote: "The request will decide whether the next build-day plan can stay on the current in-house table path or must revise toward new purchases.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              1,
              1,
              "The land stewards still need one more yes vote to clear the request."
            )
          }
        ],
        borrowingPolicies: [
          {
            id: "policy-east-market-cold-racks",
            assetLabel: "Cold-storage rack set",
            statusLabel: "Active policy",
            policyLabel: "Project use only",
            managingProjectLabel: "East Market Cold Storage Service",
            decidedAtLabel: "Last changed May 5",
            summary: "The rack set stays in project custody because temperature handling needs stewarded service windows.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              3,
              0,
              "All seeded cold-storage stewards backed the project-use-only policy."
            )
          },
          {
            id: "policy-east-market-tables",
            assetLabel: "Retrofit staging tables",
            statusLabel: "Active policy",
            policyLabel: "Individual borrowing permitted",
            managingProjectLabel: "East Market Land Stewardship Service",
            decidedAtLabel: "Last changed May 8",
            summary: "Portable staging tables can be borrowed directly when neighborhood work needs short setup windows outside project activity.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              1,
              "The land stewards approved portable-table borrowing with one caution about return timing."
            )
          }
        ],
        borrowingRequests: [
          {
            id: "borrowing-east-market-tables-active",
            assetLabel: "Retrofit staging tables",
            title: "Weekend retrofit prep loan",
            statusLabel: "Borrowed by individual",
            borrowerLabel: "rowanloop",
            requestedAtLabel: "Requested May 12",
            expectedReturnLabel: "Due back May 19",
            purpose: "Set up temporary prep surfaces for neighborhood insulation-kit sorting.",
            currentCustodyLabel: "Currently in rowanloop custody",
            coordinationNote: "The land stewardship team logged the pickup and asked for a return photo before the next build-day staging request closes."
          }
        ],
        deliveryRequests: [
          {
            id: "delivery-east-market-cold-route",
            assetLabel: "Cold-storage rack set",
            title: "Commons-to-pickup lane cold-chain transfer",
            statusLabel: "Completed delivery",
            requesterLabel: "Neighborhood Ride Coordination Service",
            requestedAtLabel: "Requested May 9",
            neededByLabel: "Completed May 10",
            originLabel: "East Market cold pad",
            destinationLabel: "East Market pickup lane",
            assignedVolunteerLabel: "quietember",
            summary: "A delivery-style handoff moved the rack set into cooled pickup position and then returned it to storage after dispatch closed."
          }
        ],
        provenanceTimeline: [
          {
            id: "provenance-east-market-land-1",
            title: "Commons lot entered as land record",
            statusLabel: "Land record opened",
            happenedAtLabel: "Apr 24",
            actorLabel: "platform stewardship preview",
            summary: "The commons lot was entered as the home record for cold storage, staging tables, and pickup-lane infrastructure.",
            locationLabel: "East Market Commons Lot",
            custodyLabel: "Platform stewardship preview"
          },
          {
            id: "provenance-east-market-land-2",
            title: "Cold-chain route completed",
            statusLabel: "Completed delivery",
            happenedAtLabel: "May 10",
            actorLabel: "quietember",
            summary: "The cold-storage rack set moved from the commons pad to the pickup lane and returned after the cooled dispatch window closed.",
            locationLabel: "East Market pickup lane",
            custodyLabel: "Neighborhood Ride Coordination Service"
          }
        ]
      };
    case "asset-east-market-cold-racks":
      return {
        availabilityRequests: [
          {
            id: "availability-cold-racks-approved",
            assetLabel: "Cold-storage rack set",
            title: "Recurring cooled pickup request",
            statusLabel: "Approved availability",
            requestingPartyLabel: "Neighborhood Ride Coordination Service",
            requestedAtLabel: "Opened May 7",
            timeframeLabel: "Twice-weekly pickup windows",
            managingProjectLabel: "East Market Cold Storage Service",
            summary: "The rack set was approved for recurring cooled pickup windows so dispatch can stage temperature-sensitive orders.",
            outcomeNote: "The approved request now appears as active project use for dispatch work.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              0,
              "The storage service approved recurring rack use."
            )
          }
        ],
        borrowingPolicies: [
          {
            id: "policy-cold-racks",
            assetLabel: "Cold-storage rack set",
            statusLabel: "Active policy",
            policyLabel: "Project use only",
            managingProjectLabel: "East Market Cold Storage Service",
            decidedAtLabel: "Last changed May 5",
            summary: "The rack set stays in service-managed custody because cold handling and cleaning need stewarded oversight.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              3,
              0,
              "All seeded cold-storage stewards backed the project-use-only policy."
            )
          }
        ],
        borrowingRequests: [],
        deliveryRequests: [
          {
            id: "delivery-cold-racks",
            assetLabel: "Cold-storage rack set",
            title: "Pickup lane cold-chain run",
            statusLabel: "Completed delivery",
            requesterLabel: "Neighborhood Ride Coordination Service",
            requestedAtLabel: "Requested May 9",
            neededByLabel: "Completed May 10",
            originLabel: "East Market cold pad",
            destinationLabel: "East Market pickup lane",
            assignedVolunteerLabel: "quietember",
            summary: "The rack set moved to the pickup lane for dispatch and then returned to the cold pad after the run completed."
          }
        ],
        provenanceTimeline: [
          {
            id: "provenance-cold-racks-1",
            title: "Rack set assigned to cold-storage service",
            statusLabel: "Custody assigned",
            happenedAtLabel: "Apr 30",
            actorLabel: "East Market Cold Storage Service",
            summary: "The rack set entered ongoing cold-storage custody after the service staged the commons pad.",
            locationLabel: "East Market cold pad",
            custodyLabel: "East Market Cold Storage Service"
          },
          {
            id: "provenance-cold-racks-2",
            title: "Dispatch route completed",
            statusLabel: "Completed delivery",
            happenedAtLabel: "May 10",
            actorLabel: "quietember",
            summary: "The rack set temporarily moved into dispatch custody during the cooled pickup window and then returned to storage.",
            locationLabel: "East Market pickup lane",
            custodyLabel: "Neighborhood Ride Coordination Service"
          }
        ]
      };
    case "asset-east-market-retrofit-tables":
      return {
        availabilityRequests: [
          {
            id: "availability-staging-tables-pending",
            assetLabel: "Retrofit staging tables",
            title: "Next sealing block staging request",
            statusLabel: "Pending availability vote",
            requestingPartyLabel: "Hallway Air-Sealing Build Day",
            requestedAtLabel: "Opened May 16",
            timeframeLabel: "Next sealing block plus cleanup night",
            managingProjectLabel: "East Market Land Stewardship Service",
            summary: "The productive build day requested table access for the next staging and cleanup run.",
            outcomeNote: "This request determines whether the next round can stay on in-house tables or must revise toward purchase or a different shared asset.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              1,
              1,
              "The request still needs one more yes vote from land stewards."
            )
          }
        ],
        borrowingPolicies: [
          {
            id: "policy-staging-tables",
            assetLabel: "Retrofit staging tables",
            statusLabel: "Active policy",
            policyLabel: "Individual borrowing permitted",
            managingProjectLabel: "East Market Land Stewardship Service",
            decidedAtLabel: "Last changed May 8",
            summary: "Portable staging tables can be borrowed directly for short neighborhood work windows when no project holds them.",
            voteSummary: buildAssetGovernanceVoteSummary(
              3,
              2,
              1,
              "The land stewards approved borrowing with one caution about quick returns."
            )
          }
        ],
        borrowingRequests: [
          {
            id: "borrowing-staging-tables-active",
            assetLabel: "Retrofit staging tables",
            title: "Weekend prep-table loan",
            statusLabel: "Borrowed by individual",
            borrowerLabel: "rowanloop",
            requestedAtLabel: "Requested May 12",
            expectedReturnLabel: "Due back May 19",
            purpose: "Set up temporary prep surfaces for neighborhood insulation-kit sorting.",
            currentCustodyLabel: "Currently in rowanloop custody",
            coordinationNote: "The stewardship team logged the pickup and expects a return photo before the next build-day use window closes."
          }
        ],
        deliveryRequests: [
          {
            id: "delivery-staging-tables-scheduled",
            assetLabel: "Retrofit staging tables",
            title: "Return from materials shed",
            statusLabel: "Scheduled delivery",
            requesterLabel: "Hallway Air-Sealing Build Day",
            requestedAtLabel: "Requested May 17",
            neededByLabel: "Needed by May 20",
            originLabel: "Retrofit Materials Shed Service",
            destinationLabel: "East Market retrofit staging area",
            assignedVolunteerLabel: "Awaiting volunteer",
            summary: "The next sealing round needs the tables moved back from the materials shed before setup begins."
          }
        ],
        provenanceTimeline: [
          {
            id: "provenance-staging-tables-1",
            title: "Tables entered land stewardship custody",
            statusLabel: "Asset registered",
            happenedAtLabel: "Apr 28",
            actorLabel: "East Market Land Stewardship Service",
            summary: "The shared staging tables were entered under commons custody for rotating build-day and neighborhood use.",
            locationLabel: "East Market staging shed",
            custodyLabel: "East Market Land Stewardship Service"
          },
          {
            id: "provenance-staging-tables-2",
            title: "Weekend prep loan opened",
            statusLabel: "Borrowed by individual",
            happenedAtLabel: "May 12",
            actorLabel: "rowanloop",
            summary: "Two staging tables left the commons lot for a short neighborhood prep window and remain in borrower custody.",
            locationLabel: "Borrower off-site use",
            custodyLabel: "rowanloop"
          }
        ]
      };
    default:
      return emptyAssetGovernanceData();
  }
}
const createdChannelScopeMetaBySlug = {};
const createdCommunityScopeMetaBySlug = {};
function createDefaultPublicFeedPreferences() {
  return {
    scope: "home",
    filter: "all",
    sort: "popular",
    window: "all"
  };
}
function createDefaultPersonalFeedPreferences() {
  return {
    scope: "following",
    filter: "all",
    sort: "popular",
    window: "all"
  };
}
function createDefaultSettingsState(viewer) {
  return {
    profileUsername: viewer.username,
    profileBio: viewer.bio ?? "",
    appearanceThemeMode: "light",
    defaultFeed: "public",
    publicFeedPreferences: createDefaultPublicFeedPreferences(),
    personalFeedPreferences: createDefaultPersonalFeedPreferences(),
    hidePublicActivityFromPersonalFeeds: false,
    hidePersonalFeedFromNonFollowers: false,
    requireFollowApproval: false
  };
}
function normalizeSettingsState(viewer, settings) {
  const defaults = createDefaultSettingsState(viewer);
  return {
    ...defaults,
    ...settings,
    publicFeedPreferences: {
      ...defaults.publicFeedPreferences,
      ...settings?.publicFeedPreferences ?? {}
    },
    personalFeedPreferences: {
      ...defaults.personalFeedPreferences,
      ...settings?.personalFeedPreferences ?? {}
    },
    requireFollowApproval: settings?.hidePersonalFeedFromNonFollowers ?? false
  };
}
let settingsByUserId = currentViewer() ? {
  [activeViewer().id]: createDefaultSettingsState(activeViewer())
} : {};
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
function settingsForUser(userId) {
  return settingsByUserId[userId] ?? null;
}
function syncViewerProfileFromSettings(userId) {
  const viewer = userById(userId ?? mockSessionFixture.currentViewerId);
  const settings = viewer ? settingsByUserId[viewer.id] : null;
  if (!viewer || !settings) {
    return;
  }
  viewer.bio = settings.profileBio.trim() ? settings.profileBio.trim() : void 0;
}
function hydratePersistedClientState() {
  {
    return false;
  }
}
function viewerCanSeePersonalFeed(profileUserId) {
  const profileSettings = settingsForUser(profileUserId);
  if (!profileSettings?.hidePersonalFeedFromNonFollowers) {
    return true;
  }
  const viewer = currentViewer();
  return !!viewer && (viewer.id === profileUserId || followingIdsFor(viewer.id).includes(profileUserId));
}
const publicFeedBase = [
  {
    kind: "project",
    id: "project-heat-pump",
    slug: "neighborhood-heat-pump-pilot",
    href: "/projects/neighborhood-heat-pump-pilot",
    createdAt: "2026-04-28T16:40:00Z",
    title: "Neighborhood Heat Pump Pilot",
    authorUsername: "patchbay",
    projectMode: "productive",
    summary: "Research a first retrofit round and keep demand, labor interest, and vendor questions visible before planning locks.",
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: "Demand Signalling",
    locationLabel: "East Market retrofit cluster",
    voteCount: 84,
    activeVote: 1,
    signalCount: 124,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T09:30:00Z"
  },
  {
    kind: "thread",
    id: "thread-shared-laundry",
    slug: "shared-laundry-repair-round",
    href: "/threads/shared-laundry-repair-round",
    createdAt: "2026-04-29T13:20:00Z",
    title: "Shared Laundry Repair Round",
    body: "Should the first repair round focus on three machines in one building, or spread parts and labor across the block?",
    authorUsername: "rowanloop",
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    voteCount: 34,
    activeVote: 0,
    commentCount: 0,
    lastActivityAt: "2026-04-30T07:20:00Z"
  },
  {
    kind: "event",
    id: "event-tool-audit",
    slug: "tool-library-spring-swap-social",
    href: "/events/tool-library-spring-swap-social",
    createdAt: "2026-04-28T18:00:00Z",
    title: "Tool Library Spring Swap Social",
    description: "An open evening for snacks, a tool swap table, repair stories, and summer volunteer signups.",
    isPrivate: false,
    scheduledAt: "2026-05-01T19:00:00Z",
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    createdByUsername: "toolorbit",
    timeLabel: "Thu 7:00 PM to 9:00 PM",
    locationLabel: "Tool Library Courtyard",
    voteCount: 12,
    activeVote: 1,
    commentCount: 0,
    goingCount: 0,
    lastActivityAt: "2026-04-29T20:15:00Z"
  },
  {
    kind: "project",
    id: "project-release-governance",
    slug: "platform-release-governance-round",
    href: "/projects/platform-release-governance-round",
    createdAt: "2026-04-29T17:30:00Z",
    title: "Platform Release Governance Round",
    authorUsername: "quietember",
    projectMode: "collective-service",
    summary: "Review the next public web release, moderation defaults, and accessibility blockers before shipping.",
    channelTags: [platform],
    communityTags: [],
    stage: "Planning",
    locationLabel: "Platform coordination room",
    voteCount: 29,
    activeVote: 1,
    signalCount: 41,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T11:10:00Z"
  },
  {
    kind: "project",
    id: "project-bike-light-tuneups",
    slug: "patchbay-bike-light-tuneups",
    href: "/projects/patchbay-bike-light-tuneups",
    createdAt: "2026-04-30T18:25:00Z",
    title: "Patchbay Evening Bike-Light Tuneups",
    authorUsername: "patchbay",
    projectMode: "personal-service",
    summary: "A personal service currently running with open request intake and direct scheduling for evening bike-light tuneups.",
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: "Activity",
    locationLabel: "Tool Library side bench",
    voteCount: 18,
    activeVote: 1,
    signalCount: 27,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T18:25:00Z"
  },
  {
    kind: "project",
    id: "project-device-checks-closed",
    slug: "rowan-after-school-device-checks",
    href: "/projects/rowan-after-school-device-checks",
    createdAt: "2026-04-30T18:50:00Z",
    title: "Rowan After School Device Checks",
    authorUsername: "rowanloop",
    projectMode: "personal-service",
    summary: "This personal service wrapped and is now marked closed; request history remains visible but no new scheduling is active.",
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: "Closed",
    locationLabel: "East Market school commons",
    voteCount: 21,
    activeVote: 0,
    signalCount: 33,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T18:50:00Z"
  },
  {
    kind: "project",
    id: "project-fridge-route",
    slug: "community-fridge-restock-route",
    href: "/projects/community-fridge-restock-route",
    createdAt: "2026-04-27T14:10:00Z",
    title: "Community Fridge Restock Route",
    authorUsername: "rowanloop",
    projectMode: "collective-service",
    summary: "A neighborhood restock service that already settled its operating model and is now voting on route priorities, handoff windows, and request coverage.",
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: "Planning",
    locationLabel: "East Market fridge loop",
    voteCount: 38,
    activeVote: 1,
    signalCount: 48,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T14:40:00Z"
  },
  {
    kind: "project",
    id: "project-east-market-cold-storage-acquisition",
    slug: "east-market-cold-storage-acquisition-round",
    href: "/projects/east-market-cold-storage-acquisition-round",
    createdAt: "2026-04-30T15:15:00Z",
    title: "East Market Cold Storage Acquisition Round",
    authorUsername: "rowanloop",
    projectMode: "collective-service",
    summary: "A collective-service acquisition round that already settled its operating path and is now pooling contributions for shared cold-storage equipment on the East Market lot.",
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: "Acquisition",
    locationLabel: "East Market cold-storage pad",
    voteCount: 34,
    activeVote: 1,
    signalCount: 49,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T20:10:00Z"
  },
  {
    kind: "project",
    id: "project-tool-library-shed-conversion-acquisition",
    slug: "tool-library-shed-conversion-round",
    href: "/projects/tool-library-shed-conversion-round",
    createdAt: "2026-04-30T15:40:00Z",
    title: "Tool Library Shed Conversion Acquisition Round",
    authorUsername: "toolorbit",
    projectMode: "collective-service",
    summary: "A collective-service acquisition round that is converting an existing outbuilding into shared intake and overflow storage before the service shifts can open.",
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: "Acquisition",
    locationLabel: "Tool Library campus outbuilding",
    voteCount: 29,
    activeVote: 1,
    signalCount: 41,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T20:25:00Z"
  },
  {
    kind: "project",
    id: "project-repair-cafe",
    slug: "repair-cafe-shift-grid",
    href: "/projects/repair-cafe-shift-grid",
    createdAt: "2026-04-27T16:00:00Z",
    title: "Repair Cafe Shift Grid",
    authorUsername: "toolorbit",
    projectMode: "collective-service",
    summary: "A live repair-cafe service with approved operating and access plans, now coordinating concrete shift blocks and contingent volunteer roles.",
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: "Activity",
    locationLabel: "Tool Library repair floor",
    voteCount: 44,
    activeVote: 1,
    signalCount: 63,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T16:55:00Z"
  },
  {
    kind: "project",
    id: "project-neighborhood-ride-coordination",
    slug: "neighborhood-ride-coordination-service",
    href: "/projects/neighborhood-ride-coordination-service",
    createdAt: "2026-04-30T12:20:00Z",
    title: "Neighborhood Ride Coordination Service",
    authorUsername: "quietember",
    projectMode: "collective-service",
    summary: "A collective service in activity phase using direct requests without calendar slot booking so members can submit needs as they arise.",
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: "Activity",
    locationLabel: "East Market dispatch desk",
    voteCount: 31,
    activeVote: 1,
    signalCount: 44,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T19:10:00Z"
  },
  {
    kind: "project",
    id: "project-childcare-checkin-desk",
    slug: "childcare-checkin-desk-service",
    href: "/projects/childcare-checkin-desk-service",
    createdAt: "2026-04-30T12:45:00Z",
    title: "Childcare Check-in Desk Service",
    authorUsername: "toolorbit",
    projectMode: "collective-service",
    summary: "A collective service in activity phase with both calendar booking and direct requests enabled for testing blended request flow.",
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: "Activity",
    locationLabel: "Tool Library front room",
    voteCount: 36,
    activeVote: 1,
    signalCount: 52,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T19:30:00Z"
  },
  ...explicitAssetServiceProjectFeedItems,
  {
    kind: "project",
    id: "project-blade-sharpening",
    slug: "tool-library-blade-sharpening-service",
    href: "/projects/tool-library-blade-sharpening-service",
    createdAt: "2026-04-26T19:25:00Z",
    title: "Tool Library Blade Sharpening Service",
    authorUsername: "toolorbit",
    projectMode: "collective-service",
    summary: "A completed pilot that converted into an ongoing sharpening service, with recurring intake and pickup still coordinated through the project surface.",
    channelTags: [mutualAid],
    communityTags: [toolLibrary],
    stage: "Closed",
    locationLabel: "Tool Library intake shelf",
    voteCount: 32,
    activeVote: 1,
    signalCount: 36,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T15:10:00Z"
  },
  {
    kind: "project",
    id: "project-insulation-kits",
    slug: "neighborhood-insulation-kit-round",
    href: "/projects/neighborhood-insulation-kit-round",
    createdAt: "2026-04-28T11:30:00Z",
    title: "Neighborhood Insulation Kit Round",
    authorUsername: "patchbay",
    projectMode: "productive",
    summary: "A productive build round that completed demand ranking and is now choosing the final production model for the first kit batch.",
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: "Planning",
    locationLabel: "East Market staging table",
    voteCount: 47,
    activeVote: 1,
    signalCount: 69,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T16:20:00Z"
  },
  {
    kind: "project",
    id: "project-battery-share",
    slug: "community-solar-battery-share",
    href: "/projects/community-solar-battery-share",
    createdAt: "2026-04-27T10:20:00Z",
    title: "Community Solar Battery Share",
    authorUsername: "rowanloop",
    projectMode: "productive",
    summary: "A productive energy project that already picked its build model and is now deciding reserve rules, overflow windows, and shared access priorities.",
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: "Planning",
    locationLabel: "Community energy shed",
    voteCount: 41,
    activeVote: 1,
    signalCount: 54,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T16:45:00Z"
  },
  {
    kind: "project",
    id: "project-air-sealing",
    slug: "hallway-air-sealing-build-day",
    href: "/projects/hallway-air-sealing-build-day",
    createdAt: "2026-04-28T15:45:00Z",
    title: "Hallway Air-Sealing Build Day",
    authorUsername: "toolorbit",
    projectMode: "productive",
    summary: "A productive project already in contingent scheduling, where each build block only activates once every required role is filled.",
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: "Activity",
    locationLabel: "North hall stairwell",
    voteCount: 35,
    activeVote: 1,
    signalCount: 46,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T17:05:00Z"
  },
  {
    kind: "project",
    id: "project-weatherization-wrap",
    slug: "block-weatherization-pilot-wrap",
    href: "/projects/block-weatherization-pilot-wrap",
    createdAt: "2026-04-26T14:35:00Z",
    title: "Block Weatherization Pilot Wrap",
    authorUsername: "mika",
    projectMode: "productive",
    summary: "A completed productive pilot that is now documenting completion notes, carry-forward lessons, and possible conversion paths for the next round.",
    channelTags: [housingBuild],
    communityTags: [eastMarket],
    stage: "Closed",
    locationLabel: "East Market retrofit block",
    voteCount: 28,
    activeVote: 0,
    signalCount: 31,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T17:30:00Z"
  },
  {
    kind: "project",
    id: "project-ride-desk",
    slug: "mutual-aid-ride-request-desk",
    href: "/projects/mutual-aid-ride-request-desk",
    createdAt: "2026-04-28T09:15:00Z",
    title: "Mutual Aid Ride Request Desk",
    authorUsername: "quietember",
    projectMode: "collective-service",
    summary: "A collective service still in demand signalling, collecting route demand and value priorities before operations and access planning open.",
    channelTags: [mutualAid],
    communityTags: [eastMarket],
    stage: "Proposal",
    locationLabel: "Clinic and school pickup lanes",
    voteCount: 24,
    activeVote: 1,
    signalCount: 39,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: "2026-04-30T18:00:00Z"
  }
];
const socialPostsBase = [
  {
    kind: "post",
    id: "post-spare-filters",
    href: "/posts/post-spare-filters",
    author: patchbayUser,
    audience: "followers",
    voteTargetId: "post-spare-filters",
    body: "I found six spare intake filters after cleanup. If anyone needs them for the pilot, I can bring them Saturday.",
    voteCount: 15,
    activeVote: 1,
    commentCount: 0,
    createdAt: "2026-04-30T08:05:00Z"
  },
  {
    kind: "post",
    id: "post-rowan-checklist",
    href: "/posts/post-rowan-checklist",
    author: userById("user-rowan") ?? patchbayUser,
    audience: "followers",
    voteTargetId: "post-rowan-checklist",
    body: "I cleaned up the laundry-room checklist so the first repair night has fewer duplicate steps.",
    voteCount: 11,
    activeVote: 0,
    commentCount: 0,
    createdAt: "2026-04-29T18:35:00Z"
  },
  {
    kind: "post",
    id: "post-mika-brief",
    href: "/posts/post-mika-brief",
    author: userById("user-mika") ?? patchbayUser,
    audience: "followers",
    voteTargetId: "post-mika-brief",
    body: "Drafting a shorter release brief so people can track changes without reading every thread.",
    voteCount: 8,
    activeVote: 0,
    commentCount: 0,
    createdAt: "2026-04-29T15:10:00Z"
  }
];
const publicCommentActivitySeeds = [
  {
    id: "activity-comment-project-heat-pump",
    subjectId: "project-heat-pump",
    commentId: "comment-project-heat-pump-1"
  },
  {
    id: "activity-comment-thread-shared-laundry",
    subjectId: "thread-shared-laundry",
    commentId: "comment-thread-shared-2"
  }
];
const projectMembersBySlug = {
  "neighborhood-heat-pump-pilot": ["viewer-1", "user-rowan", "user-mika"],
  "platform-release-governance-round": ["user-mika", "user-ember"],
  "community-fridge-restock-route": ["viewer-1", "user-rowan", "user-tool"],
  "east-market-cold-storage-acquisition-round": ["viewer-1", "user-rowan", "user-mika"],
  "tool-library-shed-conversion-round": ["viewer-1", "user-tool", "user-rowan"],
  "repair-cafe-shift-grid": ["viewer-1", "user-tool", "user-rowan", "user-mika"],
  "neighborhood-ride-coordination-service": ["viewer-1", "user-rowan", "user-ember"],
  "childcare-checkin-desk-service": ["viewer-1", "user-tool", "user-rowan"],
  "tool-library-blade-sharpening-service": ["viewer-1", "user-tool", "user-mika"],
  "neighborhood-insulation-kit-round": ["viewer-1", "user-rowan", "user-mika"],
  "community-solar-battery-share": ["viewer-1", "user-rowan", "user-mika"],
  "hallway-air-sealing-build-day": ["viewer-1", "user-tool", "user-rowan"],
  "block-weatherization-pilot-wrap": ["viewer-1", "user-mika", "user-ember"],
  "mutual-aid-ride-request-desk": ["viewer-1", "user-rowan", "user-ember"],
  "patchbay-bike-light-tuneups": ["viewer-1", "user-tool"],
  "rowan-after-school-device-checks": ["viewer-1", "user-rowan", "user-mika"],
  ...explicitAssetServiceProjectMembersBySlug
};
function seedMembershipSinceBySlug(membersBySlug, seededAt = "2026-01-01T00:00:00Z") {
  return Object.fromEntries(
    Object.entries(membersBySlug).map(([slug, memberIds]) => [
      slug,
      Object.fromEntries(memberIds.map((userId) => [userId, seededAt]))
    ])
  );
}
const projectMembershipSinceBySlug = seedMembershipSinceBySlug(
  projectMembersBySlug
);
const scopeMembershipByKey = {
  "channel:housing-build": {
    memberIds: ["viewer-1", "user-rowan", "user-mika"],
    joinPolicy: "open"
  },
  "channel:mutual-aid": {
    memberIds: ["viewer-1", "user-rowan", "user-tool"],
    joinPolicy: "open"
  },
  "community:east-market-makers": {
    memberIds: ["viewer-1", "user-rowan", "user-mika"],
    joinPolicy: "open"
  },
  "community:tool-library-crew": {
    memberIds: ["user-tool"],
    joinPolicy: "invite_only",
    inviteToken: "tool-library-circle",
    hiddenFeedCopy: "This closed community only shows its feed to members. Join with an invite link before the work and discussion unlock here."
  },
  "platform:platform": {
    memberIds: ["viewer-1", "user-rowan", "user-tool", "user-mika", "user-ember"],
    joinPolicy: "open"
  }
};
({
  ...explicitAssetServiceProjectManagersBySlug
});
const eventWorkflowStateBySlug = {
  "tool-library-spring-swap-social": {
    editorUserIds: ["user-tool"],
    currentPhaseId: "activity",
    signalCount: 3,
    signalUserIds: ["viewer-1", "user-tool", "user-rowan"],
    oppositionSignalCount: 1,
    oppositionSignalUserIds: ["user-ember"],
    eventValues: [
      {
        id: "event-value-swap-1",
        label: "Should welcome first-time neighbors clearly",
        authorUsername: "patchbay",
        votesByUserId: {
          "viewer-1": 9,
          "user-tool": 8,
          "user-rowan": 10,
          "user-mika": 8
        }
      },
      {
        id: "event-value-swap-2",
        label: "Should turn repair stories into concrete volunteer roles",
        authorUsername: "toolorbit",
        votesByUserId: {
          "viewer-1": 8,
          "user-tool": 10,
          "user-rowan": 9,
          "user-mika": 7
        }
      },
      {
        id: "event-value-swap-3",
        label: "Should keep the swap table and repair help easy to navigate",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 7,
          "user-tool": 9,
          "user-rowan": 8,
          "user-mika": 8
        }
      }
    ],
    eventPlans: [
      {
        id: "event-plan-swap-1",
        title: "Tool Library Spring Swap and Repair Night",
        authorUsername: "toolorbit",
        createdAt: "2026-04-29T18:45:00Z",
        description: "An open spring repair-and-swap night with a clear welcome point, repair story circle, and volunteer signup round that turns interest into actual roles.",
        demandSignalSnapshot: 3,
        demandConsiderationNote: "The plan keeps the social format people asked for, but adds clear intake, volunteer roles, and a closing signup pass so the demand signal becomes real coordination.",
        locationLabel: "Tool Library Courtyard",
        schedule: {
          mode: "date",
          startDate: "2026-05-01",
          startTimeLabel: "18:00",
          finishTimeLabel: "21:00"
        },
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes"
        },
        valueVotesByValueId: {
          "__demand-signal__": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          },
          "event-value-swap-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          },
          "event-value-swap-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          },
          "event-value-swap-3": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          }
        },
        planPhases: [
          {
            id: "event-plan-swap-1-phase-1",
            title: "Arrival and swap table",
            details: "Open the courtyard, set the swap table, and make sure new arrivals can see where tools, snacks, and volunteer signups live."
          },
          {
            id: "event-plan-swap-1-phase-2",
            title: "Repair story circle",
            details: "Gather short repair stories, route people toward hands-on help, and keep a running note of what tools need extra coverage."
          },
          {
            id: "event-plan-swap-1-phase-3",
            title: "Summer signup round",
            details: "Close with volunteer signups for summer repair nights and a clear handoff for follow-up requests."
          }
        ]
      }
    ],
    eventActivities: [
      {
        id: "event-activity-swap-setup",
        title: "Courtyard setup and welcome table",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-01T18:00:00Z",
        endsAt: "2026-05-01T18:45:00Z",
        locationLabel: "Tool Library Courtyard",
        minimumParticipants: 3,
        linkedPlanPhaseId: "event-plan-swap-1-phase-1",
        roles: [
          {
            label: "Setup lead",
            requiredCount: 1,
            assignedUsernames: ["toolorbit"]
          },
          {
            label: "Welcome table",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Snack and swap runner",
            requiredCount: 1,
            maximumCount: 2,
            assignedUsernames: ["rowanloop"]
          }
        ],
        note: "Set the tables, arrival signs, and first-time visitor welcome point before the swap opens."
      },
      {
        id: "event-activity-swap-story-circle",
        title: "Repair story circle and volunteer signup",
        authorUsername: "patchbay",
        scheduledAt: "2026-05-01T20:00:00Z",
        endsAt: "2026-05-01T20:45:00Z",
        locationLabel: "Tool Library Courtyard",
        minimumParticipants: 3,
        linkedPlanPhaseId: "event-plan-swap-1-phase-3",
        roles: [
          {
            label: "Facilitator",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Signup table",
            requiredCount: 1,
            maximumCount: 2,
            assignedUsernames: ["toolorbit"]
          },
          {
            label: "Note taker",
            requiredCount: 1,
            assignedUsernames: []
          }
        ],
        note: "Collect the volunteer follow-up list and make sure unanswered repair needs are captured before everyone leaves."
      }
    ],
    updateRequests: [],
    editRequests: [],
    phaseChangeRequests: [],
    decisionHistory: []
  },
  "retrofit-night-walk": {
    editorUserIds: ["user-mika", "user-rowan"],
    currentPhaseId: "activity",
    signalCount: 0,
    signalUserIds: [],
    oppositionSignalCount: 0,
    oppositionSignalUserIds: [],
    eventValues: [],
    eventPlans: [
      {
        id: "event-plan-walk-1",
        title: "Retrofit Night Walk Pilot Route",
        authorUsername: "mika",
        createdAt: "2026-04-29T19:10:00Z",
        description: "An invite-only night walk covering the first retrofit cluster, access constraints, and the pilot readiness check for three buildings.",
        demandConsiderationNote: "The editor group kept the route tight so the walk produces concrete access notes before the first pilot install round.",
        locationLabel: "East corner staging point",
        schedule: {
          mode: "range",
          startDate: "2026-05-02",
          endDate: "2026-05-04",
          startTimeLabel: "20:00",
          finishTimeLabel: "21:15"
        },
        overallVotesByUserId: {
          "user-mika": "yes",
          "user-rowan": "yes"
        },
        valueVotesByValueId: {},
        planPhases: [
          {
            id: "event-plan-walk-1-phase-1",
            title: "Access walk",
            details: "Walk the first cluster together, flag entry constraints, and record which buildings are ready for the pilot."
          },
          {
            id: "event-plan-walk-1-phase-2",
            title: "Constraint capture",
            details: "Group notes on wiring, lighting, and access so the follow-up work order can be drafted immediately after the walk."
          }
        ]
      }
    ],
    eventActivities: [
      {
        id: "event-activity-walk-route-a",
        title: "First cluster access walk",
        authorUsername: "mika",
        scheduledAt: "2026-05-02T20:00:00Z",
        endsAt: "2026-05-02T20:40:00Z",
        locationLabel: "East corner staging point",
        minimumParticipants: 2,
        linkedPlanPhaseId: "event-plan-walk-1-phase-1",
        roles: [
          {
            label: "Route lead",
            requiredCount: 1,
            assignedUsernames: ["mika"]
          },
          {
            label: "Access note taker",
            requiredCount: 1,
            assignedUsernames: ["rowanloop"]
          }
        ],
        note: "Walk the first building cluster and capture access blockers before the light drops further."
      },
      {
        id: "event-activity-walk-wrap",
        title: "Pilot readiness wrap-up",
        authorUsername: "rowanloop",
        scheduledAt: "2026-05-02T20:45:00Z",
        endsAt: "2026-05-02T21:15:00Z",
        locationLabel: "East corner staging point",
        minimumParticipants: 2,
        linkedPlanPhaseId: "event-plan-walk-1-phase-2",
        roles: [
          {
            label: "Summary lead",
            requiredCount: 1,
            assignedUsernames: ["rowanloop"]
          },
          {
            label: "Constraint checker",
            requiredCount: 1,
            assignedUsernames: ["mika"]
          }
        ],
        note: "Confirm which buildings are ready for the pilot and what still needs a follow-up visit."
      }
    ],
    updateRequests: [],
    editRequests: [],
    phaseChangeRequests: [],
    decisionHistory: []
  }
};
const productiveProjectPhaseBlueprints = [
  {
    id: "phase-1",
    order: 1,
    shortLabel: "Phase 1",
    title: "Proposal & Demand Signalling",
    summary: "A productive project begins as a tagged proposal with demand signalling and member-ranked values that carry into every later decision.",
    mechanics: [
      "A member proposes the project with the required channel tags and any relevant community tags.",
      "Members can add value criteria such as accessibility, local sourcing, or making use of unused space.",
      "Each value is voted on by importance, and that ranked list stays visible through the whole lifecycle."
    ]
  },
  {
    id: "phase-2",
    order: 2,
    shortLabel: "Phase 2",
    title: "Production Plan",
    summary: "Members submit concrete plans for what will be produced or built, then vote on how well each plan satisfies the Phase 1 values.",
    mechanics: [
      "Each plan spells out the output, required inputs, materials, costs, and any specific acquisitions needed.",
      "Members vote yes or no on whether a plan meets each value, then cast an overall approval vote.",
      "Any member can vote on multiple plans; the highest approval above quorum wins."
    ]
  },
  {
    id: "phase-3",
    order: 3,
    shortLabel: "Phase 3",
    title: "Distribution Plan",
    summary: "Once the work itself is defined, members decide how the output will be distributed or accessed.",
    mechanics: [
      "Distribution plans explain who receives the output, in what proportions, and under what access rules.",
      "Members use the same quorum-based approval model as Phase 2, and can vote across multiple options.",
      "The highest-rated plan above quorum becomes the project’s active distribution plan."
    ]
  },
  {
    id: "phase-4",
    order: 4,
    shortLabel: "Phase 4",
    title: "Funding & Resource Acquisition",
    summary: "After both plans are approved, the project would normally activate funding and resource acquisition.",
    mechanics: [
      "The community fund opens once production and distribution planning have both passed.",
      "Members can contribute funds or source required inputs from existing platform asset holdings.",
      "In beta this phase stays visible in the lifecycle but remains locked and unavailable."
    ],
    note: "This phase is part of the target model, but the current beta skips acquisition tooling entirely."
  },
  {
    id: "phase-5",
    order: 5,
    shortLabel: "Phase 5",
    title: "Scheduling & Activity",
    summary: "Project managers schedule concrete activities that only activate when every required role is filled.",
    mechanics: [
      "Activities specify dates, times, roles needed, and the minimum participants required.",
      "The activity only activates once all required roles are filled, using a contingent commitment model.",
      "Managers can return the project to Phase 2 or Phase 3 with a stated reason if the current plans no longer hold."
    ]
  },
  {
    id: "phase-6",
    order: 6,
    shortLabel: "Phase 6",
    title: "Closed or Converted",
    summary: "A finished project can close cleanly or convert into a new ongoing project type without losing its planning history.",
    mechanics: [
      "Project managers can mark the work complete once the agreed plan has been carried out.",
      "Managers can also return the project to Phase 2 or Phase 3 with a stated reason if a later problem appears.",
      "The project keeps its history, values, and follow-on coordination visible after completion or conversion."
    ]
  }
];
const collectiveServicePhaseBlueprints = [
  {
    id: "phase-1",
    order: 1,
    shortLabel: "Phase 1",
    title: "Proposal & Demand Signalling",
    summary: "A collective service starts as a tagged proposal with demand signalling and shared service values.",
    mechanics: [
      "At least one channel tag is required so the service proposal enters a working context immediately.",
      "Members rank the values that later operations and access plans should be judged against.",
      "Demand signalling stays open through the full cycle so members can keep signalling ongoing need."
    ]
  },
  {
    id: "phase-2",
    order: 2,
    shortLabel: "Phase 2",
    title: "Operations Plan",
    summary: "Members propose and vote on the operating model that should shape how the service actually runs.",
    mechanics: [
      "Operations plans describe the working cadence, staffing, capacity, and practical service flow.",
      "Members vote on whether each plan satisfies the Phase 1 values and then cast an overall approval vote.",
      "The highest approval above quorum becomes the active operations plan."
    ]
  },
  {
    id: "phase-3",
    order: 3,
    shortLabel: "Phase 3",
    title: "Access Plan",
    summary: "Once the operating model is clear, members decide how people access the service and whether requests should be enabled.",
    mechanics: [
      "Access plans define eligibility, scheduling rules, limits, reserve handling, and the optional request system.",
      "Members use the same quorum-based approval model as Phase 2, and can vote across multiple options.",
      "The highest-rated plan above quorum becomes the active access plan for the service cycle."
    ]
  },
  {
    id: "phase-4",
    order: 4,
    shortLabel: "Phase 4",
    title: "Funding & Resource Acquisition",
    summary: "Once operations and access are approved, the service would normally activate any needed funding or shared resources.",
    mechanics: [
      "Community fund support and asset sourcing would open here once both plans have passed.",
      "In beta this phase remains visible but locked, so current service cycles skip directly into scheduling.",
      "Distribution is never based on labor contribution alone; access still follows the approved plan."
    ],
    note: "This phase remains visible for the full model, but beta currently skips acquisition tooling."
  },
  {
    id: "phase-5",
    order: 5,
    shortLabel: "Phase 5",
    title: "Scheduling & Service Activity",
    summary: "Members schedule service activities here. Any enabled request system stays visible as ongoing demand.",
    mechanics: [
      "Any project member can schedule a concrete service session and assign role-based slots.",
      "If the access plan enabled requests, members can see the active request count and submit new requests here.",
      "Managers can send the service back to Phase 2 or Phase 3 with a stated reason if the current plan needs revision."
    ]
  },
  {
    id: "phase-6",
    order: 6,
    shortLabel: "Phase 6",
    title: "Closed",
    summary: "A collective service can close here, or return to planning if the current approach needs revision.",
    mechanics: [
      "Managers can close the service once the scheduled activity is complete.",
      "If the service is continuing without changes, it should stay in Phase 5 rather than advancing here.",
      "Managers can return the service to Phase 2 or Phase 3 with a stated reason if the plan needs updating."
    ]
  }
];
const platformProductivePhaseBlueprints = [
  {
    id: "phase-1",
    order: 1,
    shortLabel: "Proposal",
    title: "Proposal",
    summary: "Platform productive projects open with demand, opposition, and value ranking from weekly active users.",
    mechanics: [
      "Weekly active users can support or oppose advancement while the project values are ranked.",
      "The platform vote context continues through every later governance step.",
      "Values stay visible in later planning and execution reviews."
    ]
  },
  {
    id: "phase-2",
    order: 2,
    shortLabel: "Plan",
    title: "Production Plan",
    summary: "The platform decides the concrete working plan here, including software repositories when the subtype is software.",
    mechanics: [
      "Plans still need quorum and the shared approval threshold from weekly active users.",
      "Software plans should attach the official repository URL that later pull requests target.",
      "The winning plan becomes the basis for activity and execution review."
    ]
  },
  {
    id: "phase-5",
    order: 3,
    shortLabel: "Activity",
    title: "Activity",
    summary: "The platform carries out the approved plan here through concrete work, requests, and operating activity.",
    mechanics: [
      "Activities stay visible as live work items tied back to the approved plan.",
      "Platform software work uses governed pull requests inside this activity phase.",
      "The board can later send the project back to planning if the working plan breaks down."
    ]
  },
  {
    id: "phase-6",
    order: 4,
    shortLabel: "Execution",
    title: "Pending Execution Review",
    summary: "Finished platform work pauses here so execution can be confirmed before the project is formally closed.",
    mechanics: [
      "This step holds the project open while execution evidence is reviewed.",
      "Software work uses merge recording and later confirmation rather than closing immediately.",
      "If execution fails or drifts, the project can return to planning."
    ]
  },
  {
    id: "phase-7",
    order: 5,
    shortLabel: "Closed",
    title: "Closed",
    summary: "The project remains visible as a completed platform record after execution is confirmed.",
    mechanics: [
      "Closure preserves the full planning and execution history.",
      "Later rounds should start as new proposals instead of silently changing a closed project.",
      "Conversion or follow-on work can still link back to this record."
    ]
  }
];
const personalServicePhaseBlueprints = [
  {
    id: "phase-1",
    order: 1,
    shortLabel: "Phase 1",
    title: "Activity",
    summary: "A personal service opens directly into a visible calendar where the creator posts availability and other people request a slot.",
    mechanics: [
      "The creator adds availability blocks to the calendar instead of repeating the full service description again here.",
      "Other users can click an available date on the calendar to request a specific time, title, and message.",
      "Accepted requests remove the matching availability from the calendar so the remaining open time stays legible."
    ]
  },
  {
    id: "phase-2",
    order: 2,
    shortLabel: "Phase 2",
    title: "Closed",
    summary: "The personal service can close cleanly here, while still leaving a note about why it closed or where the work moved next.",
    mechanics: [
      "The creator must leave a closure note when the service closes so the history still explains what happened.",
      "If the service needs more people or formal planning, it can convert into a collective service or productive project.",
      "There is no quorum or planning vote in this personal service path."
    ]
  }
];
function personalServicePhaseBlueprintsForRequestMode(mode) {
  if (mode === "calendar") {
    return personalServicePhaseBlueprints;
  }
  return personalServicePhaseBlueprints.map(
    (phase) => phase.id === "phase-1" ? {
      ...phase,
      title: "Activity",
      summary: mode === "both" ? "A personal service can keep calendar slot booking and direct written requests open at the same time." : "A personal service can open directly into written requests when the work does not need bookable calendar slots.",
      mechanics: mode === "both" ? [
        "The creator can post availability on the calendar while also accepting unscheduled direct requests.",
        "Requesters can either click a calendar slot for a time-bound request or send a direct written request.",
        "Accepted slot-based requests still remove matching availability so open time remains legible."
      ] : [
        "People use the request button to describe what they need and what they expect from the service.",
        "The creator reviews incoming requests, replies in messages, and accepts or declines each request privately.",
        "The service description carries expectations in this mode, so there is no public availability calendar."
      ]
    } : phase
  );
}
function projectLifecyclePhaseBlueprintsForMode(projectMode) {
  if (projectMode === "collective-service") {
    return collectiveServicePhaseBlueprints;
  }
  if (projectMode === "personal-service") {
    return personalServicePhaseBlueprints;
  }
  return productiveProjectPhaseBlueprints;
}
function projectLifecyclePhaseBlueprintsForProject(slug, projectMode, currentSubtype = currentProjectSubtypeForGovernance(slug)) {
  if (usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype)) {
    return platformProductivePhaseBlueprints;
  }
  return projectLifecyclePhaseBlueprintsForMode(projectMode);
}
function closePhaseIdForProjectSlug(slug, projectMode, currentSubtype = currentProjectSubtypeForGovernance(slug)) {
  if (usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype)) {
    return "phase-7";
  }
  return closePhaseIdForProject(projectMode);
}
function nextProjectPhaseIdForSlug(slug, currentPhaseId, projectMode, currentSubtype = currentProjectSubtypeForGovernance(slug)) {
  if (!usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype)) {
    return nextProjectPhaseId(currentPhaseId, projectMode);
  }
  switch (currentPhaseId) {
    case "phase-1":
      return "phase-2";
    case "phase-2":
      return "phase-5";
    case "phase-5":
      return "phase-6";
    case "phase-6":
      return "phase-7";
    default:
      return null;
  }
}
function revertableProjectPhaseIdsForSlug(slug, projectMode, currentPhaseId, currentSubtype = currentProjectSubtypeForGovernance(slug)) {
  if (!usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype)) {
    return revertableProjectPhaseIds(projectMode, currentPhaseId);
  }
  if (currentPhaseId === "phase-5" || currentPhaseId === "phase-6" || currentPhaseId === "phase-7") {
    return ["phase-2"];
  }
  return [];
}
function requestableProjectPhaseTargetIdsForSlug(slug, currentPhaseId, projectMode, currentSubtype = currentProjectSubtypeForGovernance(slug)) {
  const nextPhaseId = nextProjectPhaseIdForSlug(slug, currentPhaseId, projectMode, currentSubtype);
  return [
    ...nextPhaseId ? [nextPhaseId] : [],
    ...revertableProjectPhaseIdsForSlug(slug, projectMode, currentPhaseId, currentSubtype)
  ];
}
function phaseOrderForProjectSlug(slug, projectMode, phaseId, currentSubtype = currentProjectSubtypeForGovernance(slug)) {
  return projectLifecyclePhaseBlueprintsForProject(slug, projectMode, currentSubtype).find(
    (phase) => phase.id === phaseId
  )?.order ?? 0;
}
const projectLifecycleBySlug = {
  ...explicitAssetServiceProjectLifecycleBySlug,
  "neighborhood-heat-pump-pilot": {
    currentPhaseId: "phase-1",
    phases: {
      "phase-1": {
        projectStatus: "This pilot is still collecting values, demand, and likely retrofit buildings before any plan vote opens."
      },
      "phase-2": {
        projectStatus: "No production plan has gone to vote yet. Project managers will open submissions once the Phase 1 value ranking stabilizes."
      },
      "phase-3": {
        projectStatus: "Distribution options stay parked until a production plan wins quorum and gives members something concrete to distribute."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Funding and acquisitions are intentionally unavailable in this beta, so any plan here must either wait for a later release or skip to no-cost activity work."
      },
      "phase-5": {
        projectStatus: "Managers can schedule walkthroughs and low-cost prep activities later, but only after the planning path is clear."
      },
      "phase-6": {
        projectStatus: "If the pilot succeeds it can either close after the first retrofit round or convert into an ongoing neighborhood retrofit service."
      }
    }
  },
  "platform-release-governance-round": {
    currentPhaseId: "phase-2",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "The initial release-governance proposal already has a shared purpose and value set, so this phase is treated as complete."
      },
      "phase-2": {
        projectStatus: "Members are still shaping the actual release process, acceptance criteria, and accessibility gates that should define the working plan."
      },
      "phase-3": {
        projectStatus: "Distribution here means deciding how release outputs, notes, and access should be shared once the working plan is approved."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Funding and asset acquisition are out of scope for this beta surface, so the release round keeps that step visible but unavailable."
      },
      "phase-5": {
        projectStatus: "Once the working plan is approved, managers can schedule concrete release tasks, review windows, and handoff activities."
      },
      "phase-6": {
        projectStatus: "This governance round can close after the release or convert into an ongoing platform service if the practice needs to persist."
      }
    }
  },
  "community-fridge-restock-route": {
    currentPhaseId: "phase-3",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "Demand and core values are already clear enough that the route moved out of proposal and into real planning."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "The working restock model passed the production vote and now gives the group something concrete to distribute."
      },
      "phase-3": {
        projectStatus: "Members are deciding which households and pickup windows should get first priority in the weekly route."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "No funding tooling is available in beta, so the route stays focused on volunteer labor and existing donated stock."
      },
      "phase-5": {
        projectStatus: "Once the distribution model lands, managers can schedule concrete restock runs and handoff windows."
      },
      "phase-6": {
        projectStatus: "If the route stabilizes it can convert into an ongoing neighborhood service instead of closing."
      }
    }
  },
  "east-market-cold-storage-acquisition-round": {
    currentPhaseId: "phase-4",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "The service already established demand and shared values around common cold storage before planning opened."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "The operating plan is settled, including the equipment footprint and stewardship roles needed once the storage service goes live."
      },
      "phase-3": {
        progressState: "complete",
        projectStatus: "Access rules for shared storage use are approved, so the project can now focus on acquisition and conversion."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "This preview round is actively pooling contributions and vendor quotes so the cold-storage equipment can be purchased and converted into the East Market asset registry at the close of acquisition."
      },
      "phase-5": {
        projectStatus: "Once acquisition closes and the equipment is converted into the registry, managers can schedule the first stewardship and handoff shifts."
      },
      "phase-6": {
        projectStatus: "The project can close after the first operating cycle or convert into an ongoing shared storage service."
      }
    }
  },
  "tool-library-shed-conversion-round": {
    currentPhaseId: "phase-4",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "Demand and shared values are already clear for a dedicated intake and overflow storage shed on the campus lot."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "The conversion plan is approved, including the intake shelving, power work, and stewardship roles the storage service will need."
      },
      "phase-3": {
        progressState: "complete",
        projectStatus: "Access and reserve rules are approved, so the round can move into acquisition and contractor coordination."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "This preview round is already funded and now waits on board execution, contractor booking, and conversion into the Tool Library asset registry before activity can start."
      },
      "phase-5": {
        projectStatus: "Once the shed is converted into a registered shared asset, managers can open concrete intake and overflow service shifts."
      },
      "phase-6": {
        projectStatus: "The project can close after the first operating cycle or convert into a standing storage service."
      }
    }
  },
  "repair-cafe-shift-grid": {
    currentPhaseId: "phase-5",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "The cafe already has a shared purpose and value set, so proposal work is complete."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "The working repair-cafe plan is settled and no longer competing with alternatives."
      },
      "phase-3": {
        progressState: "complete",
        projectStatus: "The access and intake model has already been approved, so the project can move into concrete scheduling."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "The current repair-cafe round avoids any funding or asset acquisition requirements that would depend on the locked beta phase."
      },
      "phase-5": {
        projectStatus: "Managers are scheduling real shifts now, and each activity only activates once the needed roles are filled."
      },
      "phase-6": {
        projectStatus: "If the shift grid keeps working, the project can either close after the pilot month or convert into an ongoing service."
      }
    }
  },
  "neighborhood-ride-coordination-service": {
    currentPhaseId: "phase-5",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "Demand and value ranking are complete for this service."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "Operations planning is complete."
      },
      "phase-3": {
        progressState: "complete",
        projectStatus: "Access planning approved direct request intake without calendar booking."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Acquisition remains locked in beta."
      },
      "phase-5": {
        projectStatus: "The service is active with direct request intake and no calendar slot requirement."
      },
      "phase-6": {
        projectStatus: "Managers can close this service after the current run completes."
      }
    }
  },
  "childcare-checkin-desk-service": {
    currentPhaseId: "phase-5",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "Demand and value ranking are complete for this service."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "Operations planning is complete."
      },
      "phase-3": {
        progressState: "complete",
        projectStatus: "Access planning approved both calendar booking and direct request intake."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Acquisition remains locked in beta."
      },
      "phase-5": {
        projectStatus: "The service is active with both calendar availability and direct requests enabled."
      },
      "phase-6": {
        projectStatus: "Managers can close this service after the current run completes."
      }
    }
  },
  "tool-library-blade-sharpening-service": {
    currentPhaseId: "phase-6",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "The original sharpening pilot already established strong demand and a clear value ranking."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "The service workflow was approved and tested in the pilot round."
      },
      "phase-3": {
        progressState: "complete",
        projectStatus: "Pickup, turnaround, and member access rules are already in place from the pilot phase."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "The service converted without needing platform funding, so the locked acquisition phase remains informational only."
      },
      "phase-5": {
        progressState: "complete",
        projectStatus: "Recurring intake and sharpening shifts were used during the pilot and continue under the converted service model."
      },
      "phase-6": {
        projectStatus: "The project has already converted into an ongoing service, so completion here means continuing the work in its service form."
      }
    }
  },
  "neighborhood-insulation-kit-round": {
    currentPhaseId: "phase-2",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "Demand and ranked values are complete, so this project is now choosing its production path."
      },
      "phase-2": {
        projectStatus: "Members are voting on the first insulation-kit production run and role assignments."
      },
      "phase-3": {
        projectStatus: "Distribution opens once a production plan wins quorum."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Acquisition remains locked in beta."
      },
      "phase-5": {
        projectStatus: "Scheduling starts after planning closes."
      },
      "phase-6": {
        projectStatus: "The project can close after the build round or convert into ongoing service work."
      }
    }
  },
  "community-solar-battery-share": {
    currentPhaseId: "phase-3",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "Initial demand and values are complete."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "A production model has already passed vote."
      },
      "phase-3": {
        projectStatus: "Members are now choosing access and reserve rules for battery use windows."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Acquisition remains locked in beta."
      },
      "phase-5": {
        projectStatus: "Scheduling starts once the access plan is approved."
      },
      "phase-6": {
        projectStatus: "The project can close or convert after the first outage season."
      }
    }
  },
  "hallway-air-sealing-build-day": {
    currentPhaseId: "phase-5",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "Demand and values were completed in an earlier round."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "Production scope is approved."
      },
      "phase-3": {
        progressState: "complete",
        projectStatus: "Distribution and access criteria are approved."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Acquisition remains locked in beta."
      },
      "phase-5": {
        projectStatus: "Managers are now coordinating contingent role-based activities."
      },
      "phase-6": {
        projectStatus: "Once the sessions finish, the project can be completed or rolled forward."
      }
    }
  },
  "block-weatherization-pilot-wrap": {
    currentPhaseId: "phase-6",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "Demand and values are complete."
      },
      "phase-2": {
        progressState: "complete",
        projectStatus: "Production planning is complete."
      },
      "phase-3": {
        progressState: "complete",
        projectStatus: "Distribution planning is complete."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Acquisition remained locked throughout this pilot."
      },
      "phase-5": {
        progressState: "complete",
        projectStatus: "All planned activity sessions are complete."
      },
      "phase-6": {
        projectStatus: "The project is in completion review with conversion notes logged for future rounds."
      }
    }
  },
  "mutual-aid-ride-request-desk": {
    currentPhaseId: "phase-1",
    phases: {
      "phase-1": {
        projectStatus: "The service is still collecting demand and ranking values before operations planning opens."
      },
      "phase-2": {
        projectStatus: "Operations planning has not opened yet."
      },
      "phase-3": {
        projectStatus: "Access planning and request-system setup follow operations approval."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Acquisition remains locked in beta."
      },
      "phase-5": {
        projectStatus: "Service scheduling starts once planning phases complete."
      },
      "phase-6": {
        projectStatus: "Managers can close or cycle once the first service window completes."
      }
    }
  },
  "patchbay-bike-light-tuneups": {
    currentPhaseId: "phase-1",
    phases: {
      "phase-1": {
        projectStatus: "This personal service is active with open requests and direct scheduling by the creator."
      },
      "phase-2": {
        projectStatus: "When the creator stops running this service, it can be marked closed or converted."
      }
    }
  },
  "rowan-after-school-device-checks": {
    currentPhaseId: "phase-2",
    phases: {
      "phase-1": {
        progressState: "complete",
        projectStatus: "The personal service previously ran with active scheduling and requests."
      },
      "phase-2": {
        projectStatus: "The service is complete and no longer accepts new requests."
      }
    }
  }
};
function createProjectLifecycleConfig(projectMode) {
  if (projectMode === "personal-service") {
    return {
      currentPhaseId: "phase-1",
      phases: {
        "phase-1": {
          projectStatus: "This personal service is active with calendar-based availability and direct request intake managed by the creator."
        },
        "phase-2": {
          projectStatus: "When this service stops running, the creator closes it here with a note for the historical record."
        }
      }
    };
  }
  return {
    currentPhaseId: "phase-1",
    phases: {
      "phase-1": {
        projectStatus: "This project is still collecting demand, ranked values, and early member interest before planning opens."
      },
      "phase-2": {
        projectStatus: projectMode === "collective-service" ? "Operations planning opens here once the proposal has enough shared direction to define how the service should run." : "Production planning opens here once the proposal has enough shared direction to define the work concretely."
      },
      "phase-3": {
        projectStatus: projectMode === "collective-service" ? "Access planning opens after an operations plan wins quorum and members need to define how requests and access should work." : "Distribution planning opens after a production plan wins quorum."
      },
      "phase-4": {
        betaLocked: true,
        projectStatus: "Acquisition remains visible in the lifecycle but stays unavailable in this beta."
      },
      "phase-5": {
        projectStatus: "Scheduling and role-based activities open after planning resolves."
      },
      "phase-6": {
        projectStatus: "The project can close after the first round or convert into an ongoing service."
      }
    }
  };
}
const demandSignalAssessmentValueId = "__demand-signal__";
const importanceVoteLabels = {
  1: "Unnecessary",
  2: "Very low importance",
  3: "Low importance",
  4: "Light importance",
  5: "Moderate importance",
  6: "Useful",
  7: "Important",
  8: "High priority",
  9: "Near required",
  10: "Required"
};
const phaseChangeApprovalThresholdPercent = GOVERNANCE_APPROVAL_THRESHOLD_PERCENT;
function normalizeLegacyImportanceVote(vote) {
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
function migrateLegacyImportanceVotes(workflowStates) {
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
const projectWorkflowStateBySlug = {
  ...explicitAssetServiceProjectWorkflowBySlug,
  "neighborhood-heat-pump-pilot": {
    signalCount: 124,
    signalUserIds: ["viewer-1", "user-rowan"],
    values: [
      {
        id: "value-heat-pump-1",
        label: "Keep the first retrofit round small enough to actually finish.",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 4,
          "user-mika": 3
        }
      },
      {
        id: "value-heat-pump-2",
        label: "Prioritize buildings where neighbors already want to participate.",
        authorUsername: "patchbay",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 3,
          "user-mika": 4
        }
      },
      {
        id: "value-heat-pump-3",
        label: "Keep vendor comparisons readable enough for non-specialists to follow.",
        authorUsername: "mika",
        votesByUserId: {
          "viewer-1": 3,
          "user-rowan": 2,
          "user-mika": 4
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: []
  },
  "platform-release-governance-round": {
    signalCount: 18,
    signalUserIds: ["user-ember", "user-mika"],
    values: [
      {
        id: "value-release-1",
        label: "Shipping should stay accessible by keyboard before any release is considered ready.",
        authorUsername: "quietember",
        votesByUserId: {
          "user-ember": 4,
          "user-mika": 4
        }
      },
      {
        id: "value-release-2",
        label: "Every release note should point back to the exact work surfaces it is summarizing.",
        authorUsername: "patchbay",
        votesByUserId: {
          "user-ember": 4,
          "user-mika": 3
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-release-1",
        title: "Accessibility gate plus linked release notes",
        authorUsername: "mika",
        createdAt: "2026-04-30T09:55:00Z",
        outputSummary: "Ship a release checklist that blocks deployment until keyboard, focus, and linked work-surface notes are complete.",
        materialsSummary: "Needs a compact checklist, keyboard pass, focus pass, linked release note template, and a final review window.",
        totalCostLabel: "$0 direct spend",
        acquisitionsSummary: "Uses existing maintainers, issue queues, and release tooling already on hand.",
        overallVotesByUserId: {
          "user-ember": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-release-1": {
            "user-ember": "yes",
            "user-mika": "yes"
          },
          "value-release-2": {
            "user-ember": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [],
    phaseFiveActivities: [
      {
        id: "project-activity-release-1",
        title: "Final release review window",
        authorUsername: "quietember",
        scheduledAt: "2026-05-04T17:30:00Z",
        locationLabel: "Remote review session",
        minimumParticipants: 2,
        roles: [
          {
            label: "Accessibility reviewer",
            requiredCount: 1,
            assignedUsernames: ["mika"]
          },
          {
            label: "Release signoff",
            requiredCount: 1,
            assignedUsernames: ["quietember"]
          }
        ],
        note: "Only activates when both the accessibility review and the final signoff slots are filled."
      }
    ]
  },
  "community-fridge-restock-route": {
    signalCount: 47,
    signalUserIds: ["viewer-1", "user-rowan", "user-tool"],
    values: [
      {
        id: "value-fridge-1",
        label: "Keep the route predictable enough that fridge volunteers can actually sustain it week to week.",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 4,
          "user-tool": 3
        }
      },
      {
        id: "value-fridge-2",
        label: "Prioritize households and pickup points with the least flexible food access first.",
        authorUsername: "patchbay",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 4,
          "user-tool": 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-fridge-1",
        title: "Weekly two-stop restock run",
        authorUsername: "rowanloop",
        createdAt: "2026-04-29T19:40:00Z",
        outputSummary: "Run a predictable two-stop restock each week with one neighborhood prep slot and one visible handoff window.",
        materialsSummary: "Needs donated food intake, volunteer prep, cooler checks, and one driver or cart team.",
        totalCostLabel: "$0 direct spend",
        acquisitionsSummary: "Uses the existing fridge network and already-donated food streams.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-tool": "yes"
        },
        valueVotesByValueId: {
          "value-fridge-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-tool": "yes"
          },
          "value-fridge-2": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-tool": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-fridge-1",
        title: "Neighborhood-first pickup windows",
        authorUsername: "patchbay",
        createdAt: "2026-04-30T11:20:00Z",
        distributionSummary: "Hold one early pickup window for nearby households and one later overflow window for anyone still waiting.",
        accessSummary: "Nearby households get first priority, but any unclaimed food opens to the wider route by the end of the evening.",
        reserveSummary: "Keep a small emergency reserve for same-day need reports before opening overflow pickup.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-tool": "no"
        },
        valueVotesByValueId: {
          "value-fridge-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-tool": "yes"
          },
          "value-fridge-2": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-tool": "no"
          }
        }
      }
    ],
    phaseFiveActivities: []
  },
  "east-market-cold-storage-acquisition-round": {
    signalCount: 49,
    signalUserIds: ["viewer-1", "user-rowan", "user-mika"],
    values: [
      {
        id: "value-east-market-cold-storage-1",
        label: "Keep shared cold storage publicly stewarded so reserve handling stays accountable.",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 4,
          "user-mika": 4
        }
      },
      {
        id: "value-east-market-cold-storage-2",
        label: "Make the acquisition handoff legible before the equipment becomes a common asset.",
        authorUsername: "mika",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 3,
          "user-mika": 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-east-market-cold-storage-1",
        title: "Shared walk-in cooler plus intake rail",
        authorUsername: "rowanloop",
        createdAt: "2026-04-30T15:20:00Z",
        outputSummary: "Install one shared cold-storage unit with a visible intake rail and steward rotation for reserve handling.",
        materialsSummary: "Needs the cooler unit, intake shelving, one monitoring station, and steward setup time.",
        totalCostLabel: "$30,000 target",
        acquisitionsSummary: "Depends on the acquisition round closing and the equipment being executed through the nonprofit account.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-east-market-cold-storage-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          },
          "value-east-market-cold-storage-2": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-east-market-cold-storage-1",
        title: "Stewarded reserve windows",
        authorUsername: "mika",
        createdAt: "2026-04-30T15:35:00Z",
        distributionSummary: "Open stewarded reserve windows first, then release overflow storage time once the day reserve is set.",
        accessSummary: "Shared storage stays visible and stewarded, with reserve handling logged before overflow use opens wider.",
        reserveSummary: "Keep one reserve shelf zone for urgent food preservation and accessibility needs.",
        requestSystemEnabled: false,
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-east-market-cold-storage-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          },
          "value-east-market-cold-storage-2": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseFiveActivities: []
  },
  "tool-library-shed-conversion-round": {
    signalCount: 41,
    signalUserIds: ["viewer-1", "user-tool", "user-rowan"],
    values: [
      {
        id: "value-tool-library-shed-1",
        label: "Keep intake and overflow storage visible enough that members can tell what is entering common custody.",
        authorUsername: "toolorbit",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 4,
          "user-rowan": 4
        }
      },
      {
        id: "value-tool-library-shed-2",
        label: "Finish the acquisition handoff before any storage shifts are scheduled against the site.",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 4,
          "user-rowan": 3
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-tool-library-shed-1",
        title: "Convert the campus outbuilding into intake storage",
        authorUsername: "toolorbit",
        createdAt: "2026-04-30T15:45:00Z",
        outputSummary: "Convert the existing outbuilding into a shared intake and overflow shed with labeled custody zones.",
        materialsSummary: "Needs shelving, lighting, electrical work, and lockable intake handoff points.",
        totalCostLabel: "$12,400 raised",
        acquisitionsSummary: "Funding is complete and now waits on board execution plus contractor coordination.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes"
        },
        valueVotesByValueId: {
          "value-tool-library-shed-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          },
          "value-tool-library-shed-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-tool-library-shed-1",
        title: "Stewarded intake windows",
        authorUsername: "rowanloop",
        createdAt: "2026-04-30T15:58:00Z",
        distributionSummary: "Use stewarded intake windows and tagged overflow bins so stored materials never lose custody clarity.",
        accessSummary: "Shared storage opens through visible stewarded windows first, with overflow retrieval handled in tagged pickup windows.",
        reserveSummary: "Keep one locked reserve shelf for urgent replacements and accessibility equipment.",
        requestSystemEnabled: false,
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes"
        },
        valueVotesByValueId: {
          "value-tool-library-shed-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          },
          "value-tool-library-shed-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          }
        }
      }
    ],
    phaseFiveActivities: []
  },
  "repair-cafe-shift-grid": {
    signalCount: 36,
    signalUserIds: ["viewer-1", "user-tool", "user-rowan", "user-mika"],
    values: [
      {
        id: "value-repair-1",
        label: "Keep the repair floor legible so newcomers can find the right table without staff bottlenecks.",
        authorUsername: "toolorbit",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 4,
          "user-rowan": 3,
          "user-mika": 3
        }
      },
      {
        id: "value-repair-2",
        label: "Only schedule sessions that already have enough roles filled to actually open on time.",
        authorUsername: "mika",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 4,
          "user-rowan": 4,
          "user-mika": 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-repair-1",
        title: "Two-table repair night model",
        authorUsername: "toolorbit",
        createdAt: "2026-04-28T17:20:00Z",
        outputSummary: "Run the cafe with one intake table and one active repair table so tools and repairs do not collapse into one queue.",
        materialsSummary: "Needs an intake lead, bench support, triage checklist, and simple signage for arrivals.",
        totalCostLabel: "$0 direct spend",
        acquisitionsSummary: "Uses the existing workshop room, tools, and volunteer time already available.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-repair-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          },
          "value-repair-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-repair-1",
        title: "Intake by visible queue",
        authorUsername: "rowanloop",
        createdAt: "2026-04-29T14:40:00Z",
        distributionSummary: "Use a visible queue board so arrivals can see the current order and decide whether to wait or return later.",
        accessSummary: "Every arrival can join the queue, but the board shows repair categories so quick fixes are not buried under larger jobs.",
        reserveSummary: "Keep one overflow slot open for urgent mobility or safety-related repairs.",
        requestSystemEnabled: true,
        requestMode: "both",
        allowOffScheduleRequests: true,
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-repair-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          },
          "value-repair-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseFiveActivities: [
      {
        id: "project-activity-repair-0",
        title: "Tuesday repair cafe kickoff",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-01T18:00:00Z",
        endsAt: "2026-05-01T21:00:00Z",
        locationLabel: "Tool Library workshop floor",
        minimumParticipants: 2,
        linkedPlanPhaseId: "production-plan-repair-1-phase-1",
        roles: [
          {
            label: "Intake table",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Bench repair support",
            requiredCount: 1,
            assignedUsernames: ["toolorbit"]
          }
        ],
        note: "Initial floor layout and queue test for the repair night workflow."
      },
      {
        id: "project-activity-repair-1",
        title: "Thursday repair cafe shift",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-05T18:00:00Z",
        endsAt: "2026-05-05T21:00:00Z",
        locationLabel: "Tool Library workshop floor",
        minimumParticipants: 3,
        linkedPlanPhaseId: "production-plan-repair-1-phase-1",
        roles: [
          {
            label: "Intake table",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Bench repair support",
            requiredCount: 1,
            assignedUsernames: ["toolorbit"]
          },
          {
            label: "Queue board runner",
            requiredCount: 1,
            assignedUsernames: ["rowanloop"]
          }
        ],
        note: "This shift opened with all three floor roles covered."
      },
      {
        id: "project-activity-repair-2",
        title: "Next Thursday repair cafe shift",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-21T18:00:00Z",
        endsAt: "2026-05-21T21:00:00Z",
        locationLabel: "Tool Library workshop floor",
        minimumParticipants: 3,
        linkedPlanPhaseId: "production-plan-repair-1-phase-1",
        roles: [
          {
            label: "Intake table",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Bench repair support",
            requiredCount: 1,
            assignedUsernames: ["toolorbit"]
          },
          {
            label: "Queue board runner",
            requiredCount: 1,
            assignedUsernames: []
          }
        ],
        note: "The next shift stays tentative until the final queue role is filled."
      }
    ],
    serviceHistoryCompletions: {
      "activity:project-activity-repair-0": {
        participantSelectionsByUsername: {
          patchbay: "completed",
          toolorbit: "completed"
        }
      },
      "activity:project-activity-repair-1": {
        participantSelectionsByUsername: {
          patchbay: "completed",
          toolorbit: "completed",
          rowanloop: "uncompleted"
        }
      }
    }
  },
  "neighborhood-ride-coordination-service": {
    signalCount: 44,
    signalUserIds: ["viewer-1", "user-rowan", "user-ember"],
    values: [
      {
        id: "value-ride-coordination-1",
        label: "Keep urgent ride support requestable without waiting for fixed slots.",
        authorUsername: "quietember",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 4,
          "user-ember": 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-ride-coordination-1",
        title: "Dispatch desk with rotating coordinator",
        authorUsername: "quietember",
        createdAt: "2026-04-30T12:25:00Z",
        outputSummary: "Keep one dispatcher on rotation and assign rides by request urgency and route overlap.",
        materialsSummary: "Needs one dispatch lead and one backup contact each day.",
        totalCostLabel: "$0 direct spend",
        acquisitionsSummary: "Uses existing volunteer time and local transport capacity.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-ember": "yes"
        },
        valueVotesByValueId: {
          "value-ride-coordination-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-ember": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-ride-coordination-1",
        title: "Direct intake only",
        authorUsername: "rowanloop",
        createdAt: "2026-04-30T12:35:00Z",
        distributionSummary: "Take requests directly and dispatch by urgency without public slot booking.",
        accessSummary: "Members submit written requests any time and coordinators match available drivers.",
        reserveSummary: "Keep a small reserve for urgent medical and safety rides.",
        requestSystemEnabled: true,
        requestMode: "direct",
        allowOffScheduleRequests: true,
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-ember": "yes"
        },
        valueVotesByValueId: {
          "value-ride-coordination-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-ember": "yes"
          }
        }
      }
    ],
    phaseFiveActivities: [],
    serviceRequests: [
      {
        id: "service-request-ride-coordination-1",
        title: "Clinic pickup support",
        body: "Need a one-way ride for a 3 PM clinic appointment with short notice.",
        requesterUsername: "patchbay",
        createdAt: "2026-04-30T19:05:00Z",
        status: "open"
      }
    ]
  },
  "childcare-checkin-desk-service": {
    signalCount: 52,
    signalUserIds: ["viewer-1", "user-tool", "user-rowan"],
    values: [
      {
        id: "value-childcare-checkin-1",
        label: "Support both planned booking and last-minute help requests.",
        authorUsername: "toolorbit",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 4,
          "user-rowan": 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-childcare-checkin-1",
        title: "Check-in desk with rotating greeter",
        authorUsername: "toolorbit",
        createdAt: "2026-04-30T12:50:00Z",
        outputSummary: "Run a visible check-in desk with one greeter and one support backup each block.",
        materialsSummary: "Needs one check-in lead plus rotating support.",
        totalCostLabel: "$0 direct spend",
        acquisitionsSummary: "Uses existing shared room and volunteer rotation.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes"
        },
        valueVotesByValueId: {
          "value-childcare-checkin-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-childcare-checkin-1",
        title: "Calendar and direct requests",
        authorUsername: "rowanloop",
        createdAt: "2026-04-30T13:00:00Z",
        distributionSummary: "Keep bookable check-in blocks while allowing direct written requests.",
        accessSummary: "Users can book listed slots or send direct requests when plans change.",
        reserveSummary: "Leave one reserve slot per block for urgent childcare coverage.",
        requestSystemEnabled: true,
        requestMode: "both",
        allowOffScheduleRequests: true,
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes"
        },
        valueVotesByValueId: {
          "value-childcare-checkin-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          }
        }
      }
    ],
    phaseFiveActivities: [
      {
        id: "project-activity-childcare-checkin-1",
        title: "Morning check-in desk",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-04T08:30:00Z",
        locationLabel: "Tool Library front room",
        minimumParticipants: 2,
        roles: [
          {
            label: "Desk lead",
            requiredCount: 1,
            assignedUsernames: ["toolorbit"]
          },
          {
            label: "Family support runner",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          }
        ],
        note: "Open block with one reserve slot for urgent requests."
      }
    ],
    serviceRequests: [
      {
        id: "service-request-childcare-checkin-1",
        title: "Friday morning drop-in support",
        body: "Need coverage for a short early shift and can confirm details in chat.",
        requesterUsername: "rowanloop",
        createdAt: "2026-04-30T19:25:00Z",
        status: "open",
        scheduledAt: "2026-05-04T08:30:00Z",
        endsAt: "2026-05-04T09:00:00Z"
      }
    ]
  },
  "tool-library-blade-sharpening-service": {
    signalCount: 52,
    signalUserIds: ["viewer-1", "user-tool", "user-mika"],
    values: [
      {
        id: "value-sharpening-1",
        label: "Keep turnaround times clear so members know exactly when their tools will be ready again.",
        authorUsername: "toolorbit",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 4,
          "user-mika": 3
        }
      },
      {
        id: "value-sharpening-2",
        label: "Preserve a simple intake path so the service stays lightweight instead of becoming workshop bureaucracy.",
        authorUsername: "mika",
        votesByUserId: {
          "viewer-1": 3,
          "user-tool": 4,
          "user-mika": 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-sharpening-1",
        title: "Weekly intake plus weekend sharpening block",
        authorUsername: "toolorbit",
        createdAt: "2026-04-27T19:00:00Z",
        outputSummary: "Take blades during the week, sharpen them in a weekend block, and return them in the next pickup window.",
        materialsSummary: "Needs one intake steward, one sharpening lead, tracking tags, and one pickup handoff window.",
        totalCostLabel: "$0 direct spend",
        acquisitionsSummary: "Relies on the existing sharpening bench and volunteer labor already proven in the pilot.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-sharpening-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-mika": "yes"
          },
          "value-sharpening-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-sharpening-1",
        title: "Tagged pickup windows",
        authorUsername: "mika",
        createdAt: "2026-04-28T12:10:00Z",
        distributionSummary: "Return sharpened tools through tagged pickup windows with a fallback shelf for members who miss the main slot.",
        accessSummary: "Members get a clear pickup window first, then unclaimed completed work moves to the labeled fallback shelf.",
        reserveSummary: "Keep one emergency slot for tools needed for accessibility or urgent household work.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-sharpening-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-mika": "yes"
          },
          "value-sharpening-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseFiveActivities: [
      {
        id: "project-activity-sharpening-1",
        title: "Weekly intake and sharpening shift",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-02T17:00:00Z",
        locationLabel: "Tool Library bench room",
        minimumParticipants: 2,
        roles: [
          {
            label: "Intake desk",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Sharpening bench",
            requiredCount: 1,
            assignedUsernames: ["toolorbit"]
          }
        ],
        note: "This recurring shift is the service form the original pilot converted into."
      }
    ]
  },
  "neighborhood-insulation-kit-round": {
    signalCount: 61,
    signalUserIds: ["viewer-1", "user-rowan", "user-mika"],
    values: [
      {
        id: "value-insulation-1",
        label: "Prioritize buildings with immediate draft and heat loss risk.",
        authorUsername: "patchbay",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 4,
          "user-mika": 3
        }
      },
      {
        id: "value-insulation-2",
        label: "Keep assembly steps simple enough for first-time volunteers.",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 3,
          "user-mika": 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-insulation-1",
        title: "Two-evening prep plus one weekend install block",
        authorUsername: "patchbay",
        createdAt: "2026-04-30T16:20:00Z",
        outputSummary: "Build and install one round of insulation kits across three priority hallways.",
        materialsSummary: "Needs measured cut lists, prep tables, and one install team per hallway.",
        totalCostLabel: "$0 direct spend",
        acquisitionsSummary: "Uses donated materials and existing tool inventory.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-insulation-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          },
          "value-insulation-2": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [],
    phaseFiveActivities: []
  },
  "community-solar-battery-share": {
    signalCount: 54,
    signalUserIds: ["viewer-1", "user-rowan"],
    values: [
      {
        id: "value-battery-1",
        label: "Prioritize outage-sensitive households first.",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 4,
          "user-mika": 3
        }
      },
      {
        id: "value-battery-2",
        label: "Keep handoff times predictable so swaps do not fail mid-week.",
        authorUsername: "mika",
        votesByUserId: {
          "viewer-1": 3,
          "user-rowan": 4,
          "user-mika": 4
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-battery-1",
        title: "Shared battery prep and maintenance cadence",
        authorUsername: "rowanloop",
        createdAt: "2026-04-30T15:55:00Z",
        outputSummary: "Run a predictable prep, charge, and maintenance loop for shared battery kits.",
        materialsSummary: "Needs one prep steward, one diagnostics check, and a weekly charge window.",
        totalCostLabel: "$0 direct spend",
        acquisitionsSummary: "Relies on existing kit stock and maintenance tools.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-battery-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          },
          "value-battery-2": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-battery-1",
        title: "Tiered outage access windows",
        authorUsername: "mika",
        createdAt: "2026-04-30T16:45:00Z",
        distributionSummary: "Use priority windows for outage-sensitive households, then open overflow pickup.",
        accessSummary: "Priority tiers open first, then remaining slots become first-come once reserve is set.",
        reserveSummary: "Keep one reserve unit per day for urgent medical and accessibility needs.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-rowan": "yes",
          "user-mika": "yes"
        },
        valueVotesByValueId: {
          "value-battery-1": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          },
          "value-battery-2": {
            "viewer-1": "yes",
            "user-rowan": "yes",
            "user-mika": "yes"
          }
        }
      }
    ],
    phaseFiveActivities: []
  },
  "hallway-air-sealing-build-day": {
    signalCount: 39,
    signalUserIds: ["viewer-1", "user-tool"],
    values: [
      {
        id: "value-airseal-1",
        label: "Only schedule install windows that already have full role coverage.",
        authorUsername: "toolorbit",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 4,
          "user-rowan": 3
        }
      },
      {
        id: "value-airseal-2",
        label: "Keep prep and install materials staged by hallway to reduce downtime.",
        authorUsername: "patchbay",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 3,
          "user-rowan": 3
        }
      }
    ],
    phaseTwoPlans: [
      {
        id: "production-plan-airseal-1",
        title: "Hallway prep and sealing runbook",
        authorUsername: "toolorbit",
        createdAt: "2026-05-02T15:15:00Z",
        outputSummary: "Stage materials by hallway, seal priority gaps first, and leave a verification sweep before wrap-up.",
        materialsSummary: "Requires labeled sealant kits, masking bundles, ladders, and one staged cleanup station per hallway.",
        totalCostLabel: "$320 pooled materials",
        acquisitionsSummary: "Buy sealant refills and masking materials in one batch before the install block opens.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes"
        },
        valueVotesByValueId: {
          "value-airseal-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          },
          "value-airseal-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          }
        }
      }
    ],
    phaseThreePlans: [
      {
        id: "distribution-plan-airseal-1",
        title: "Hallway-by-hallway access and verification order",
        authorUsername: "rowanloop",
        createdAt: "2026-05-05T17:00:00Z",
        distributionSummary: "Open each hallway in a fixed order so staged materials and installers move in one direction without doubling back.",
        accessSummary: "Residents get hallway-specific timing notices, then each block reopens only after the smoke check passes.",
        reserveSummary: "Keep one flex hour at the end of the week for units that fail the first verification sweep.",
        overallVotesByUserId: {
          "viewer-1": "yes",
          "user-tool": "yes",
          "user-rowan": "yes"
        },
        valueVotesByValueId: {
          "value-airseal-1": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          },
          "value-airseal-2": {
            "viewer-1": "yes",
            "user-tool": "yes",
            "user-rowan": "yes"
          }
        }
      }
    ],
    phaseFiveActivities: [
      {
        id: "project-activity-airseal-0",
        title: "Material staging and masking pass",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-10T09:00:00Z",
        endsAt: "2026-05-10T12:00:00Z",
        locationLabel: "Tool Library annex workshop",
        minimumParticipants: 2,
        roles: [
          {
            label: "Prep lead",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Material runner",
            requiredCount: 1,
            assignedUsernames: ["toolorbit"]
          }
        ],
        note: "Past prep block that staged masking and sealant bundles for the main install round."
      },
      {
        id: "project-activity-airseal-1",
        title: "Saturday hallway sealing block",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-18T10:00:00Z",
        endsAt: "2026-05-18T14:00:00Z",
        locationLabel: "Tool Library annex workshop",
        minimumParticipants: 3,
        roles: [
          {
            label: "Prep lead",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Install team",
            requiredCount: 2,
            assignedUsernames: ["toolorbit", "rowanloop"]
          }
        ],
        note: "This session only activates when all required install roles are filled."
      },
      {
        id: "project-activity-airseal-2",
        title: "Smoke check and touch-up round",
        authorUsername: "toolorbit",
        scheduledAt: "2026-05-22T17:30:00Z",
        endsAt: "2026-05-22T19:00:00Z",
        locationLabel: "East Market north hall",
        minimumParticipants: 2,
        roles: [
          {
            label: "Seal check lead",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          },
          {
            label: "Smoke test support",
            requiredCount: 1,
            assignedUsernames: []
          }
        ],
        note: "Follow-up verification round with one remaining support slot still open."
      }
    ],
    serviceHistoryCompletions: {
      "activity:project-activity-airseal-0": {
        participantSelectionsByUsername: {
          patchbay: "completed",
          toolorbit: "completed"
        }
      }
    },
    phaseChangeRequests: [
      {
        id: "project-phase-change-hallway-air-sealing-convert",
        targetPhaseId: "phase-6",
        reason: "Close the one-off build day and reopen the work as a standing support service so repeat weatherization requests inherit the current kits and coordination notes.",
        authorUsername: "patchbay",
        createdAt: "2026-05-01T09:20:00Z",
        closeOutcome: "convert",
        conversionTarget: {
          projectMode: "collective-service",
          projectSubtype: "standard"
        },
        votesByUserId: {
          "viewer-1": "yes"
        }
      }
    ]
  },
  "block-weatherization-pilot-wrap": {
    signalCount: 66,
    signalUserIds: ["viewer-1", "user-rowan", "user-mika"],
    values: [
      {
        id: "value-weather-wrap-1",
        label: "Preserve a clean handoff note so the next cycle starts from real evidence.",
        authorUsername: "mika",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 3,
          "user-mika": 4
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: []
  },
  "mutual-aid-ride-request-desk": {
    signalCount: 41,
    signalUserIds: ["viewer-1", "user-rowan", "user-ember"],
    values: [
      {
        id: "value-ride-1",
        label: "Make same-day ride requests visible and fair.",
        authorUsername: "quietember",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 3,
          "user-ember": 4
        }
      },
      {
        id: "value-ride-2",
        label: "Keep dispatcher workload small enough for one coordinator.",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 3,
          "user-rowan": 4,
          "user-ember": 4
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: []
  },
  "patchbay-bike-light-tuneups": {
    signalCount: 27,
    signalUserIds: ["viewer-1", "user-tool"],
    values: [
      {
        id: "value-bike-light-1",
        label: "Keep appointments short and evening-friendly.",
        authorUsername: "patchbay",
        votesByUserId: {
          "viewer-1": 4,
          "user-tool": 3
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: [
      {
        id: "project-activity-bike-light-1",
        title: "Available",
        authorUsername: "patchbay",
        scheduledAt: "2026-05-03T18:30:00Z",
        locationLabel: "Tool Library side bench",
        minimumParticipants: 1,
        roles: [
          {
            label: "Service lead",
            requiredCount: 1,
            assignedUsernames: ["patchbay"]
          }
        ],
        note: "Personal service session managed directly by the creator."
      }
    ],
    serviceRequests: [
      {
        id: "service-request-bike-light-1",
        title: "Rear light wiring check",
        body: "Need a quick wiring check before early-morning commute shifts.",
        requesterUsername: "toolorbit",
        createdAt: "2026-04-30T18:30:00Z",
        status: "open",
        scheduledAt: "2026-05-03T18:30:00Z",
        endsAt: "2026-05-03T19:00:00Z"
      }
    ],
    serviceRequestMode: "both",
    availabilitySummary: "Weeknights after 6 PM, plus Saturday mornings by request.",
    travelRadiusLabel: "Within 2 km of Tool Library"
  },
  "rowan-after-school-device-checks": {
    signalCount: 33,
    signalUserIds: ["viewer-1", "user-rowan", "user-mika"],
    values: [
      {
        id: "value-device-checks-1",
        label: "Keep check-ins fast so students can leave with working devices the same day.",
        authorUsername: "rowanloop",
        votesByUserId: {
          "viewer-1": 4,
          "user-rowan": 4,
          "user-mika": 3
        }
      }
    ],
    phaseTwoPlans: [],
    phaseThreePlans: [],
    phaseFiveActivities: [],
    serviceRequests: [
      {
        id: "service-request-device-checks-1",
        title: "Screen cable reseat",
        body: "Closed with successful fix during the final service week.",
        requesterUsername: "patchbay",
        createdAt: "2026-04-26T16:10:00Z",
        status: "accepted",
        scheduledAt: "2026-04-27T15:00:00Z",
        endsAt: "2026-04-27T15:30:00Z"
      },
      {
        id: "service-request-device-checks-2",
        title: "Charging-port replacement",
        body: "Declined because replacement part was not available in the closing week.",
        requesterUsername: "mika",
        createdAt: "2026-04-26T16:50:00Z",
        status: "declined",
        scheduledAt: "2026-04-27T16:00:00Z",
        endsAt: "2026-04-27T17:00:00Z"
      }
    ],
    availabilitySummary: "Service concluded after spring session.",
    travelRadiusLabel: "No active travel radius"
  }
};
migrateLegacyImportanceVotes(projectWorkflowStateBySlug);
function summarizeOverviewForFeed(overview, maxLength = 170) {
  const trimmed = overview.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}
function normalizeUsernameInput(username) {
  return username.trim().replace(/^@+/, "").toLowerCase();
}
function slugify(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function uniqueSlug(baseValue) {
  const fallback = "new-surface";
  const baseSlug = slugify(baseValue) || fallback;
  let candidate = baseSlug;
  let suffix = 2;
  while (publicFeedBase.some((item) => item.slug === candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
function uniqueScopeSlug(baseValue, kind) {
  const fallback = kind === "channel" ? "new-channel" : "new-community";
  const baseSlug = slugify(baseValue) || fallback;
  const directory = kind === "channel" ? channelDirectory : communityDirectory;
  let candidate = baseSlug;
  let suffix = 2;
  while (directory.some((item) => item.slug === candidate) || kind === "channel" && platform.slug === candidate) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
function uniquePostId(baseValue) {
  const fallback = "post";
  const baseId = `post-${slugify(baseValue) || fallback}`;
  let candidate = baseId;
  let suffix = 2;
  while (socialPostsBase.some((post) => post.id === candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
function uniqueUserId(baseValue) {
  const fallback = "member";
  const baseId = `user-${slugify(baseValue) || fallback}`;
  let candidate = baseId;
  let suffix = 2;
  while (usersById.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
function projectLocationLabel(locationLabel) {
  const trimmed = locationLabel.trim();
  return trimmed || "Location to be confirmed";
}
function summarizeProjectCardCopy(text, maxLength = 108) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}
function stageLabelForProject(slug, fallback, projectMode) {
  const currentPhaseId = projectLifecycleBySlug[slug]?.currentPhaseId;
  if (!currentPhaseId) {
    return fallback;
  }
  if (projectMode === "personal-service") {
    if (currentPhaseId === "phase-2") {
      return "Closed";
    }
    return "Activity";
  }
  return projectFeedPhaseLabel(projectMode, currentPhaseId) ?? fallback;
}
function projectAuthorForSlug(slug) {
  const project = publicFeedBase.find(
    (item) => item.kind === "project" && item.slug === slug
  ) ?? null;
  return project ? userByUsername(project.authorUsername) : null;
}
function isProjectCreator(slug, userId) {
  const authorId = projectAuthorForSlug(slug)?.id;
  return !!userId && !!authorId && userId === authorId;
}
function personalServiceFollowerCount(slug) {
  const authorId = projectAuthorForSlug(slug)?.id;
  const memberIds = projectMembersBySlug[slug] ?? [];
  return authorId ? memberIds.filter((userId) => userId !== authorId).length : memberIds.length;
}
function readProjectWorkflowState(slug) {
  return projectWorkflowStateBySlug[slug];
}
function importanceLabelFromScore(score) {
  if (score <= 0) {
    return "No rating";
  }
  const roundedScore = Math.max(1, Math.min(10, Math.round(score)));
  return importanceVoteLabels[roundedScore];
}
function buildProjectVoteSummary(votesByUserId, quorumThresholdPercent, memberCount) {
  const viewer = currentViewer();
  const governanceQuorum = calculateGovernanceQuorum(memberCount);
  const votes = Object.values(votesByUserId);
  const yesCount = votes.filter((vote) => vote === "yes").length;
  const noCount = votes.filter((vote) => vote === "no").length;
  const totalVotes = yesCount + noCount;
  const approvalPercent = totalVotes === 0 ? 0 : Math.round(yesCount / totalVotes * 100);
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
    quorumThresholdPercent: memberCount > 0 ? governanceQuorum.quorumThresholdPercent : quorumThresholdPercent,
    votesRequired,
    votesRemaining,
    remainingEligibleVotes
  };
}
function thresholdVoteCanStillPass(voteSummary, approvalThresholdPercent) {
  return canProjectVoteStillPass(voteSummary, approvalThresholdPercent);
}
function phaseChangePassesApprovalThreshold(voteSummary) {
  return voteSummary.approvalPercent >= phaseChangeApprovalThresholdPercent;
}
function conversionEntryPhaseIdForTarget(projectMode) {
  return projectMode === "personal-service" ? "phase-1" : "phase-1";
}
function conversionEntryPhaseLabelForTarget(projectMode) {
  return projectMode === "personal-service" ? "Activity" : "Proposal";
}
function buildProjectConversionTarget(target) {
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
function buildProjectPhaseChangeRequests(slug, projectMode, currentPhaseId, phaseBlueprints, quorumThresholdPercent, memberCount) {
  const workflow = readProjectWorkflowState(slug);
  const currentPhaseOrder = phaseBlueprints.find((phase) => phase.id === currentPhaseId)?.order ?? 1;
  if (!workflow) {
    return [];
  }
  return (workflow.phaseChangeRequests ?? []).map((request) => {
    const voteSummary = buildProjectVoteSummary(
      request.votesByUserId,
      quorumThresholdPercent,
      memberCount
    );
    const targetPhase = phaseBlueprints.find((phase) => phase.id === request.targetPhaseId);
    const targetOrder = targetPhase?.order ?? currentPhaseOrder;
    const kind = request.targetPhaseId === closePhaseIdForProjectSlug(slug, projectMode) && targetOrder > currentPhaseOrder ? "close" : targetOrder > currentPhaseOrder ? "advance" : "return";
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
    };
  }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
function buildProjectUpdateRequests(slug, quorumThresholdPercent, memberCount) {
  const workflow = readProjectWorkflowState(slug);
  if (!workflow) {
    return [];
  }
  return (workflow.updateRequests ?? []).map((request) => {
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
    };
  }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
function buildProjectEditRequests(slug, quorumThresholdPercent, memberCount) {
  const workflow = readProjectWorkflowState(slug);
  if (!workflow) {
    return [];
  }
  return (workflow.editRequests ?? []).map((request) => {
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
    };
  }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
function buildEventUpdateRequests(slug, quorumThresholdPercent, eligibleVoterCount) {
  const workflow = eventWorkflowStateBySlug[slug];
  if (!workflow) {
    return [];
  }
  return (workflow.updateRequests ?? []).map((request) => {
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
    };
  }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
function buildEventEditRequests(slug, quorumThresholdPercent, eligibleVoterCount) {
  const workflow = eventWorkflowStateBySlug[slug];
  if (!workflow) {
    return [];
  }
  return (workflow.editRequests ?? []).map((request) => {
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
    };
  }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
function buildEventPhaseChangeRequests(slug, event, quorumThresholdPercent, eligibleVoterCount) {
  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const fromPhaseId = workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event);
  return (workflow.phaseChangeRequests ?? []).map((request) => {
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
    };
  }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
function buildEventLifecycle(slug, event) {
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
    if ((configuredPhaseId === "activity" || configuredPhaseId === "closed") && !phaseTwo.winningPlanId) {
      return "event-plan";
    }
    return configuredPhaseId;
  })();
  workflow.currentPhaseId = currentPhaseId;
  const selectablePlanPhases = buildSelectableEventActivityPlanPhases(phaseTwo);
  const activity = currentPhaseId === "activity" || currentPhaseId === "closed" ? buildEventActivityState(slug, selectablePlanPhases) : { activities: [] };
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
      viewerHasOppositionSignal: !event.isPrivate && !!viewer && !!workflow.oppositionSignalUserIds?.includes(viewer.id),
      signalSummary,
      viewerCanAddValue: canViewerEditEventPhase(slug, "proposal"),
      viewerCanVoteOnValues: canViewerEditEventPhase(slug, "proposal")
    },
    phaseTwo: {
      plans: phaseTwo.plans,
      winningPlanId: phaseTwo.winningPlanId,
      viewerCanSubmitPlans: canViewerEditEventPhase(slug, "event-plan"),
      viewerCanVoteOnPlans: canViewerEditEventPhase(slug, "event-plan")
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
function eventPlanScheduledAt(schedule) {
  if (!schedule.startDate) {
    return void 0;
  }
  return `${schedule.startDate}T${schedule.startTimeLabel?.trim() || "18:00"}:00Z`;
}
function buildEffectiveEventPresentation(item, lifecycle) {
  const workflow = eventWorkflowStateBySlug[item.slug];
  const eventLifecycle = lifecycle ?? (() => {
    const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
    const participation = eventParticipationById[item.id] ?? { goingUserIds: [] };
    const memberIds = Array.from(
      /* @__PURE__ */ new Set([...creatorId ? [creatorId] : [], ...participation.goingUserIds])
    );
    const editorIds = item.isPrivate ? Array.from(
      new Set((workflow?.editorUserIds ?? (creatorId ? [creatorId] : [])).filter((userId) => memberIds.includes(userId)))
    ) : [];
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
    const winningPlan2 = [...plans].filter((plan) => plan.overallApproval.meetsQuorum).sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];
    const configuredPhaseId = workflow?.currentPhaseId ?? defaultEventCurrentPhaseId(item);
    const currentPhaseId = (configuredPhaseId === "activity" || configuredPhaseId === "closed") && !winningPlan2 ? "event-plan" : configuredPhaseId;
    return {
      phaseTwo: {
        plans,
        winningPlanId: winningPlan2?.id ?? null
      },
      currentPhaseId
    };
  })();
  const winningPlan = eventLifecycle.phaseTwo.plans.find(
    (plan) => plan.id === eventLifecycle.phaseTwo.winningPlanId
  );
  if (!winningPlan || eventLifecycle.currentPhaseId !== "activity" && eventLifecycle.currentPhaseId !== "closed") {
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
function uniqueUsernames(usernames) {
  return Array.from(new Set(usernames.filter(Boolean)));
}
function rawProjectActivityEndTime(activity) {
  const activityStart = new Date(activity.scheduledAt).getTime();
  return activity.endsAt ? new Date(activity.endsAt).getTime() : activityStart + 60 * 60 * 1e3;
}
function rawProjectActivityEndAt(activity) {
  return new Date(rawProjectActivityEndTime(activity)).toISOString();
}
function projectServiceHistoryIdForActivity(activity) {
  return activity.linkedRequestId ? `request:${activity.linkedRequestId}` : `activity:${activity.id}`;
}
function projectServiceHistoryIdForRequest(requestId) {
  return `request:${requestId}`;
}
function buildProjectActivityItemFromRaw(activity, planPhaseLabelById, viewerUsername) {
  const minimumParticipants = activity.roles.reduce(
    (total, role) => total + role.requiredCount,
    0
  );
  const normalizedMaximumCounts = activity.roles.map(
    (role) => role.maximumCount != null ? Math.max(role.maximumCount, role.requiredCount) : void 0
  );
  const maximumParticipants = normalizedMaximumCounts.every((count) => count != null) ? normalizedMaximumCounts.reduce((total, count) => total + (count ?? 0), 0) : void 0;
  const startAt = activity.scheduledAt;
  const endAt = rawProjectActivityEndAt(activity);
  const viewerAssignedRoleLabel = activity.roles.find((role) => viewerUsername && role.assignedUsernames.includes(viewerUsername))?.label ?? null;
  const roles = activity.roles.map((role) => ({
    label: role.label,
    filledCount: role.assignedUsernames.length,
    requiredCount: role.requiredCount,
    maximumCount: role.maximumCount != null ? Math.max(role.maximumCount, role.requiredCount) : void 0,
    isViewerAssigned: !!viewerUsername && role.assignedUsernames.includes(viewerUsername)
  }));
  const committedUsernames = uniqueUsernames(activity.roles.flatMap((role) => role.assignedUsernames));
  const committedCount = committedUsernames.length;
  const statusTone = committedCount >= minimumParticipants ? "green" : committedUsernames.some((username) => username !== activity.authorUsername) ? "yellow" : "red";
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
    linkedPlanPhaseLabel: activity.linkedPlanPhaseId ? planPhaseLabelById.get(activity.linkedPlanPhaseId) ?? null : null,
    statusTone,
    roles,
    note: activity.note,
    isActive: rawProjectActivityIsActive(activity)
  };
}
function buildProjectActivityItemFromRequestWindow(request, project, viewerUsername, statusTone, serviceCommitted) {
  const startAt = request.scheduledAt ?? request.createdAt;
  const endAt = request.endsAt ?? new Date(new Date(startAt).getTime() + 60 * 60 * 1e3).toISOString();
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
    viewerAssignedRoleLabel: viewerIsAssigned ? "Service lead" : null,
    linkedPlanPhaseLabel: null,
    statusTone,
    roles: [
      {
        label: "Service lead",
        filledCount: serviceCommitted ? 1 : 0,
        requiredCount: 1,
        maximumCount: 1,
        isViewerAssigned: viewerIsAssigned
      }
    ],
    note: request.body,
    isActive: serviceCommitted
  };
}
function buildProjectActivityItemFromAcceptedRequest(request, project, viewerUsername) {
  return buildProjectActivityItemFromRequestWindow(request, project, viewerUsername, "green", true);
}
function buildProjectActivityItemFromUnansweredRequest(request, project, viewerUsername) {
  return buildProjectActivityItemFromRequestWindow(request, project, viewerUsername, "red", false);
}
function normalizeHistorySelectionMap(selectionsByUsername, completedUsernames = []) {
  const normalizedSelections = { ...selectionsByUsername ?? {} };
  for (const username of uniqueUsernames(completedUsernames)) {
    normalizedSelections[username] ??= "completed";
  }
  return normalizedSelections;
}
function normalizeRawServiceHistoryCompletion(completion) {
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
function buildServiceHistoryCompletionState(label, eligibleUsernames, completionSelectionsByUsername, viewerUsername) {
  const eligible = uniqueUsernames(eligibleUsernames);
  const filteredSelections = Object.fromEntries(
    Object.entries(completionSelectionsByUsername ?? {}).filter(
      ([username, selection]) => eligible.includes(username) && (selection === "completed" || selection === "uncompleted")
    )
  );
  const completedCount = Object.values(filteredSelections).filter(
    (selection) => selection === "completed"
  ).length;
  const uncompletedCount = Object.values(filteredSelections).filter(
    (selection) => selection === "uncompleted"
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
    viewerHasMarkedDone: viewerSelection === "completed"
  };
}
function projectServiceHistoryStateMeta(historyState) {
  switch (historyState) {
    case "unanswered-request":
      return {
        label: "Unanswered request",
        description: "This requested time passed without being accepted or turned into a scheduled activity."
      };
    case "request-only":
      return {
        label: "Request only",
        description: "This request moved into history without turning into a planned activity."
      };
    case "planned-activity":
      return {
        label: "Planned activity",
        description: "This request became a planned activity but did not reach the required commitment."
      };
    case "committed-activity":
      return {
        label: "Committed activity",
        description: "This request became a planned activity and reached the required commitment."
      };
    default:
      return {
        label: "Self planned activity",
        description: "This activity was created directly by the project instead of coming from a request."
      };
  }
}
function aggregateProjectServiceHistoryCompletion(requesterCompletion, participantCompletion) {
  const completionGroups = [requesterCompletion, participantCompletion].filter(
    (group) => group !== null
  );
  const totalEligible = completionGroups.reduce((total, group) => total + group.totalEligible, 0);
  const completedCount = completionGroups.reduce((total, group) => total + group.completedCount, 0);
  const uncompletedCount = completionGroups.reduce(
    (total, group) => total + group.uncompletedCount,
    0
  );
  if (totalEligible > 0 && completedCount === totalEligible) {
    return {
      aggregateCompletionState: "completed",
      aggregateCompletionLabel: "Completed",
      aggregateCompletionTone: "complete"
    };
  }
  if (totalEligible > 0 && uncompletedCount === totalEligible) {
    return {
      aggregateCompletionState: "uncompleted",
      aggregateCompletionLabel: "Uncompleted",
      aggregateCompletionTone: "uncompleted"
    };
  }
  return {
    aggregateCompletionState: "mixed",
    aggregateCompletionLabel: "Mixed",
    aggregateCompletionTone: "mixed"
  };
}
function canViewerSeePersonalServiceRequestHistory(slug, request) {
  const viewer = currentViewer();
  return !!viewer && (isProjectCreator(slug, viewer.id) || viewer.username === request.requesterUsername);
}
function canViewerSeePastServiceRequestHistory(slug, projectMode, request) {
  if (projectMode === "personal-service") {
    return canViewerSeePersonalServiceRequestHistory(slug, request);
  }
  return canViewerReviewProjectServiceRequests(slug);
}
function baseProjectRequestSettingsForProject(slug, projectMode, phaseThree) {
  const workflow = readProjectWorkflowState(slug);
  if (projectMode === "personal-service") {
    const requestMode = workflow?.serviceRequestMode ?? "calendar";
    return {
      enabled: workflow?.requestSystemEnabled ?? true,
      requestMode,
      allowOffScheduleRequests: requestMode === "both"
    };
  }
  if (projectMode !== "collective-service") {
    return {
      enabled: false,
      requestMode: "calendar",
      allowOffScheduleRequests: false
    };
  }
  const memberCount = (projectMembersBySlug[slug] ?? []).length;
  const resolvedPhaseThree = phaseThree ?? buildDistributionPlans(
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
    requestMode: activeAccessPlan?.requestMode ?? "both",
    allowOffScheduleRequests: activeAccessPlan?.allowOffScheduleRequests ?? false
  };
}
function resolvedProjectRequestSettingsForProject(slug, projectMode, phaseThree) {
  const workflow = readProjectWorkflowState(slug);
  const baseSettings = baseProjectRequestSettingsForProject(slug, projectMode, phaseThree);
  const override = workflow?.requestSystemOverride;
  if (!override) {
    return baseSettings;
  }
  return {
    enabled: override.enabled,
    requestMode: override.requestMode,
    allowOffScheduleRequests: projectMode === "personal-service" ? override.requestMode === "both" : override.allowOffScheduleRequests
  };
}
function projectRequestSettingsSummary(projectMode, settings) {
  if (!settings.enabled) {
    return "Requests are currently turned off.";
  }
  if (projectMode === "personal-service") {
    switch (settings.requestMode) {
      case "direct":
        return "Requests are direct only.";
      case "both":
        return "Requests can use listed availability or direct written intake.";
      default:
        return "Requests can only use the creator's listed availability.";
    }
  }
  switch (settings.requestMode) {
    case "direct":
      return "Requests are direct only.";
    case "both":
      return settings.allowOffScheduleRequests ? "Requests can use listed activity windows or be made off-schedule." : "Requests can be written, but they still need an existing activity window.";
    default:
      return "Requests can only use already scheduled activity windows.";
  }
}
function buildProjectRequestSettings(slug, projectMode, phaseThree) {
  const settings = resolvedProjectRequestSettingsForProject(slug, projectMode, phaseThree);
  return {
    ...settings,
    summary: projectRequestSettingsSummary(projectMode, settings)
  };
}
function projectRequestSettingsSignature(settings) {
  return [
    settings.enabled ? "enabled" : "disabled",
    settings.requestMode,
    settings.allowOffScheduleRequests ? "off-schedule" : "scheduled-only"
  ].join(":");
}
function projectRequestSettingsMatch(left, right) {
  return projectRequestSettingsSignature(left) === projectRequestSettingsSignature(right);
}
function buildProjectValues(slug) {
  const workflow = readProjectWorkflowState(slug);
  const viewer = currentViewer();
  if (!workflow) {
    return [];
  }
  return workflow.values.map((value) => {
    const votes = Object.values(value.votesByUserId);
    const voteCount = votes.length;
    const importanceScore = voteCount === 0 ? 0 : Number((votes.reduce((sum, vote) => sum + vote, 0) / voteCount).toFixed(1));
    return {
      id: value.id,
      label: value.label,
      authorUsername: value.authorUsername,
      voteCount,
      importanceScore,
      importanceLabel: importanceLabelFromScore(importanceScore),
      activeImportanceVote: viewer ? value.votesByUserId[viewer.id] ?? 0 : 0
    };
  }).sort((left, right) => right.importanceScore - left.importanceScore || right.voteCount - left.voteCount);
}
function buildProjectValueAssessments(values, votesByValueId, demandVotesByUserId, quorumThresholdPercent, memberCount) {
  return [
    {
      valueId: demandSignalAssessmentValueId,
      valueLabel: "Demand signal considered",
      ...buildProjectVoteSummary(demandVotesByUserId, quorumThresholdPercent, memberCount)
    },
    ...values.map((value) => ({
      valueId: value.id,
      valueLabel: value.label,
      ...buildProjectVoteSummary(votesByValueId[value.id] ?? {}, quorumThresholdPercent, memberCount)
    }))
  ];
}
function defaultDemandVotesForAuthor(authorUsername) {
  const authorId = userByUsername(authorUsername)?.id ?? null;
  return authorId ? {
    [authorId]: "yes"
  } : {};
}
function buildEventValues(slug) {
  const workflow = eventWorkflowStateBySlug[slug];
  const viewer = currentViewer();
  if (!workflow) {
    return [];
  }
  return (workflow.eventValues ?? []).map((value) => {
    const votes = Object.values(value.votesByUserId);
    const voteCount = votes.length;
    const importanceScore = voteCount === 0 ? 0 : Number((votes.reduce((sum, vote) => sum + vote, 0) / voteCount).toFixed(1));
    return {
      id: value.id,
      label: value.label,
      authorUsername: value.authorUsername,
      voteCount,
      importanceScore,
      importanceLabel: importanceLabelFromScore(importanceScore),
      activeImportanceVote: viewer ? value.votesByUserId[viewer.id] ?? 0 : 0
    };
  }).sort((left, right) => right.importanceScore - left.importanceScore || right.voteCount - left.voteCount);
}
function buildEventValueAssessments(values, votesByValueId, quorumThresholdPercent, eligibleVoterCount, includeDemandAssessment, authorUsername) {
  return [
    ...includeDemandAssessment ? [
      {
        valueId: demandSignalAssessmentValueId,
        valueLabel: "Demand signal considered",
        ...buildProjectVoteSummary(
          votesByValueId[demandSignalAssessmentValueId] ?? defaultDemandVotesForAuthor(authorUsername),
          quorumThresholdPercent,
          eligibleVoterCount
        )
      }
    ] : [],
    ...values.map((value) => ({
      valueId: value.id,
      valueLabel: value.label,
      ...buildProjectVoteSummary(votesByValueId[value.id] ?? {}, quorumThresholdPercent, eligibleVoterCount)
    }))
  ];
}
function buildEventPlanPhases(plan) {
  if (plan.planPhases?.length) {
    return plan.planPhases.map((phase, index) => ({
      ...phase,
      title: phase.title.trim() || `Stage ${index + 1}`
    }));
  }
  return [
    {
      id: `${plan.id}-phase-1`,
      title: "Stage 1",
      details: plan.description?.trim() || "No stage details were recorded for this event plan."
    }
  ];
}
function formatEventPlanScheduleDate(date) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!parts) {
    return date.trim();
  }
  const monthLabels = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  return `${Number(parts[3])} ${monthLabels[Number(parts[2]) - 1]} ${parts[1]}`;
}
function formatEventPlanScheduleTime(time) {
  const parts = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!parts) {
    return time.trim();
  }
  return `${Number(parts[1])}:${parts[2]}`;
}
function eventPlanScheduleBoundaryLabel(date, time) {
  const dateLabel = formatEventPlanScheduleDate(date);
  const timeLabel = time ? formatEventPlanScheduleTime(time) : "";
  return timeLabel ? `${timeLabel} ${dateLabel}` : dateLabel;
}
function normalizeEventPlanSchedule(schedule) {
  const startDate = schedule?.startDate?.trim() ?? "";
  const endDate = schedule?.endDate?.trim() ?? "";
  const startTimeLabel = schedule?.startTimeLabel?.trim() ?? "";
  const finishTimeLabel = schedule?.finishTimeLabel?.trim() ?? "";
  if (schedule?.mode === "range" && startDate && endDate && endDate >= startDate) {
    return {
      mode: "range",
      startDate,
      endDate,
      startTimeLabel: startTimeLabel || null,
      finishTimeLabel: finishTimeLabel || null,
      label: `${eventPlanScheduleBoundaryLabel(startDate, startTimeLabel)} - ${eventPlanScheduleBoundaryLabel(endDate, finishTimeLabel)}`
    };
  }
  if ((schedule?.mode === "date" || schedule?.mode === "range") && startDate) {
    return {
      mode: "date",
      startDate,
      endDate: null,
      startTimeLabel: startTimeLabel || null,
      finishTimeLabel: finishTimeLabel || null,
      label: startTimeLabel || finishTimeLabel ? `${eventPlanScheduleBoundaryLabel(startDate, startTimeLabel)} - ${eventPlanScheduleBoundaryLabel(startDate, finishTimeLabel)}` : formatEventPlanScheduleDate(startDate)
    };
  }
  return {
    mode: "any-day",
    startDate: null,
    endDate: null,
    startTimeLabel: startTimeLabel || null,
    finishTimeLabel: finishTimeLabel || null,
    label: startTimeLabel || finishTimeLabel ? `Any day · ${formatEventPlanScheduleTime(startTimeLabel)} - ${formatEventPlanScheduleTime(finishTimeLabel)}` : "Any day"
  };
}
function buildEventPlans(slug, event, values, quorumThresholdPercent, eligibleVoterCount) {
  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const plans = (workflow.eventPlans ?? []).map((plan) => ({
    id: plan.id,
    title: plan.title,
    authorUsername: plan.authorUsername,
    createdAt: plan.createdAt,
    description: plan.description?.trim() || plan.title,
    demandSignalSnapshot: event.isPrivate ? null : plan.demandSignalSnapshot ?? null,
    demandConsiderationNote: plan.demandConsiderationNote?.trim() || "Legacy plan. No demand note was recorded when this plan was created.",
    locationLabel: plan.locationLabel?.trim() || "Location will be set before activity begins.",
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
  }));
  const winningPlan = [...plans].filter((plan) => plan.overallApproval.meetsQuorum).sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];
  return {
    plans: plans.map((plan) => ({ ...plan, isLeading: plan.id === winningPlan?.id })),
    winningPlanId: winningPlan?.id ?? null
  };
}
function buildSelectableEventActivityPlanPhases(phaseTwo) {
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  return [
    ...winningPlan?.planPhases.map((phase, index) => ({
      id: phase.id,
      label: `${winningPlan.title} · ${/^stage\s+\d+$/i.test(phase.title) ? phase.title : `Stage ${index + 1}: ${phase.title}`}`
    })) ?? []
  ];
}
function buildEventActivityState(slug, selectablePlanPhases) {
  const event = findPublicEventItem(slug);
  const workflow = eventWorkflowStateBySlug[slug];
  const viewerUsername = currentViewer()?.username ?? null;
  const planPhaseLabelById = new Map(selectablePlanPhases.map((option) => [option.id, option.label]));
  if (!workflow || !event) {
    return {
      activities: []
    };
  }
  const now = Date.now();
  const scheduledActivities = [...workflow.eventActivities ?? []].sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()).map((activity) => buildProjectActivityItemFromRaw(activity, planPhaseLabelById, viewerUsername));
  return {
    activities: scheduledActivities.filter((activity) => new Date(activity.endAt).getTime() >= now).sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
  };
}
function resolvedProjectSubtype(slug, subtype) {
  return subtype ?? seededProjectSubtypeBySlug[slug] ?? "standard";
}
function currentProjectSubtypeForLifecycle(slug, phaseTwo) {
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  if (winningPlan) {
    return winningPlan.projectSubtype;
  }
  return seededProjectSubtypeBySlug[slug] ?? null;
}
function currentProjectSubtypeForGovernance(slug) {
  const memberCount = projectGovernancePopulation(slug, (projectMembersBySlug[slug] ?? []).length);
  const phaseTwo = buildProductionPlans(
    slug,
    buildProjectValues(slug),
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );
  return currentProjectSubtypeForLifecycle(slug, phaseTwo);
}
function usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype = currentProjectSubtypeForGovernance(slug)) {
  return isPlatformTaggedProject(slug) && projectMode === "productive" && currentSubtype === "software";
}
function buildSoftwareDefaultDistributionPlan(slug, projectMode, selectedSubtype, phaseTwo) {
  if (selectedSubtype !== "software") {
    return null;
  }
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  const projectItem = findPublicProjectItem(slug);
  return {
    id: `software-default-plan-${slug}`,
    title: projectMode === "collective-service" ? "Default software access plan" : "Default software release plan",
    authorUsername: winningPlan?.authorUsername ?? projectItem?.authorUsername ?? "system",
    createdAt: winningPlan?.createdAt ?? projectItem?.createdAt ?? "2026-01-01T00:00:00Z",
    description: "Software subtypes follow the default open-source path in this phase. The codebase stays publicly inspectable and the work remains shareable under AGPL-style rules.",
    demandSignalSnapshot: null,
    demandConsiderationNote: "Software proposals use the default open-source release path here, so no separate distribution or access vote is required in this mock.",
    totalCostLabel: "No additional release gate",
    planPhases: [
      {
        id: `software-default-plan-${slug}-phase-1`,
        title: "Open release",
        details: "The default software path keeps the repository visible and the released code available under AGPL-style terms.",
        materialsLabel: "Repository + public issue history",
        costLabel: "No extra gate"
      }
    ],
    distributionSummary: projectMode === "collective-service" ? "The software service stays available through the default open-source access rules." : "The software project ships through the default open-source release rules.",
    accessSummary: "Repository access, merge discussion, and release notes stay visible through the same public software surface.",
    reserveSummary: "AGPL-style sharing is on by default in this mock phase.",
    requestSystemEnabled: false,
    requestMode: "both",
    allowOffScheduleRequests: false,
    valueAssessments: [],
    overallApproval: buildProjectVoteSummary({}, 0, 0),
    isLeading: true
  };
}
function buildProductionPlanPhases(plan) {
  if (plan.planPhases?.length) {
    return plan.planPhases.map((phase, index) => ({
      ...phase,
      title: phase.title.trim() || `Stage ${index + 1}`
    }));
  }
  return [
    {
      id: `${plan.id}-phase-1`,
      title: "Stage 1",
      details: plan.materialsSummary,
      materialsLabel: plan.acquisitionsSummary,
      costLabel: plan.totalCostLabel
    }
  ];
}
function buildDistributionPlanPhases(plan) {
  if (plan.planPhases?.length) {
    return plan.planPhases.map((phase, index) => ({
      ...phase,
      title: phase.title.trim() || `Stage ${index + 1}`
    }));
  }
  return [
    {
      id: `${plan.id}-phase-1`,
      title: "Stage 1",
      details: plan.accessSummary,
      materialsLabel: plan.reserveSummary,
      costLabel: plan.totalCostLabel ?? "No direct cost"
    }
  ];
}
function buildProductionPlans(slug, values, quorumThresholdPercent, memberCount) {
  const workflow = readProjectWorkflowState(slug);
  if (!workflow) {
    return {
      plans: [],
      winningPlanId: null
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
    demandConsiderationNote: plan.demandConsiderationNote?.trim() || "Legacy plan. No demand note was recorded when this plan was created.",
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
  const winningPlan = [...plans].filter((plan) => plan.overallApproval.meetsQuorum).sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];
  return {
    plans: plans.map((plan) => ({ ...plan, isLeading: plan.id === winningPlan?.id })),
    winningPlanId: winningPlan?.id ?? null
  };
}
function resolvedSoftwareRepositoryUrl(slug, phaseTwo) {
  const workflow = readProjectWorkflowState(slug);
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  return workflow?.softwareRepositoryUrlOverride?.trim() || winningPlan?.repositoryUrl?.trim() || seededSoftwareRepositoryUrlByProjectSlug[slug] || `https://code.social-production.example/projects/${slug}`;
}
function projectMergeCapabilityChangeDecisionId(requestId) {
  return `${requestId}-decision`;
}
function projectRepositoryReplacementDecisionId(requestId) {
  return `${requestId}-decision`;
}
function resolvedProjectSoftwareMergeCapabilityUserIds(slug, phaseTwo) {
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
function buildProjectSoftwareMergeCapabilityMembers(slug, phaseTwo) {
  const workflow = readProjectWorkflowState(slug);
  if (isPlatformTaggedProject(slug)) {
    return buildPlatformBoardRoster().activeMembers.map((member) => ({
      ...toDetailMember(member.id),
      sourceLabel: "Platform board standing"
    }));
  }
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  const defaultHolderId = winningPlan ? userByUsername(winningPlan.authorUsername)?.id ?? null : null;
  const configuredIds = workflow?.softwareMergeCapabilityUserIds ?? [];
  return resolvedProjectSoftwareMergeCapabilityUserIds(slug, phaseTwo).map((userId) => ({
    ...toDetailMember(userId),
    sourceLabel: configuredIds.length === 0 && defaultHolderId === userId ? "Accepted plan author" : "Merge capability vote"
  }));
}
function softwarePullRequestStageLabel(stage) {
  switch (stage) {
    case "approval":
      return "Approval vote";
    case "awaiting-merge":
      return "Awaiting merge record";
    case "confirmation":
      return "Merge confirmation vote";
    case "rejected":
      return "Rejected";
    case "replaced":
      return "Superseded by repository replacement";
    default:
      return "Confirmed";
  }
}
function projectMergeCapabilityActionLabel(action) {
  return action === "grant" ? "Grant merge capability" : "Revoke merge capability";
}
function projectPullRequestApprovalDecisionId(requestId) {
  return `${requestId}-approval`;
}
function projectPullRequestConfirmationDecisionId(requestId) {
  return `${requestId}-confirmation`;
}
function currentProjectPullRequestDecisionId(request) {
  switch (request.stage) {
    case "approval":
      return projectPullRequestApprovalDecisionId(request.id);
    case "confirmation":
      return projectPullRequestConfirmationDecisionId(request.id);
    default:
      return null;
  }
}
function buildProjectSoftwareGovernance(slug, projectMode, currentSubtype, phaseTwo, quorumThresholdPercent, memberCount) {
  if (currentSubtype !== "software" || projectMode === "personal-service" || !phaseTwo.winningPlanId) {
    return null;
  }
  const workflow = readProjectWorkflowState(slug);
  const repositoryUrl = resolvedSoftwareRepositoryUrl(slug, phaseTwo);
  const mergeCapabilityMembers = buildProjectSoftwareMergeCapabilityMembers(slug, phaseTwo);
  const mergeCapabilityMemberIds = new Set(mergeCapabilityMembers.map((member) => member.id));
  const viewer = currentViewer();
  const viewerCanRecordMerge = !!viewer && mergeCapabilityMembers.some((member) => member.id === viewer.id);
  const availableMergeCapabilityCandidates = isPlatformTaggedProject(slug) ? [] : (projectMembersBySlug[slug] ?? []).filter((userId) => !mergeCapabilityMemberIds.has(userId)).map((userId) => toDetailMember(userId));
  const pullRequests = [...workflow?.softwarePullRequests ?? []].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).map((request) => {
    const voteSummary = request.stage === "approval" || request.stage === "confirmation" ? buildProjectVoteSummary(request.votesByUserId, quorumThresholdPercent, memberCount) : null;
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
      canStillPass: voteSummary ? thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent) : true,
      viewerCanRecordMerge: viewerCanRecordMerge && request.stage === "awaiting-merge"
    };
  });
  const mergeCapabilityChangeRequests = [...workflow?.softwareMergeCapabilityChangeRequests ?? []].filter((request) => request.status === "open").sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).map((request) => {
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
    };
  });
  const replaceablePullRequests = pullRequests.filter(
    (request) => request.stage === "awaiting-merge" || request.stage === "rejected"
  ).map((request) => ({
    id: request.id,
    title: request.title,
    pullRequestId: request.pullRequestId,
    stage: request.stage,
    stageLabel: request.stageLabel
  }));
  const repositoryReplacementRequests = [...workflow?.softwareRepositoryReplacementRequests ?? []].filter((request) => request.status === "open").sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).map((request) => {
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
    };
  });
  const repositoryHistory = [...workflow?.softwareRepositoryHistory ?? []].sort((left, right) => new Date(right.replacedAt).getTime() - new Date(left.replacedAt).getTime()).map((record) => ({
    id: record.id,
    repositoryUrl: record.repositoryUrl,
    previousRepositoryUrl: record.previousRepositoryUrl,
    reason: record.reason,
    relatedPullRequestId: record.relatedPullRequestId,
    replacedAt: record.replacedAt,
    replacedByUsername: record.replacedByUsername
  }));
  return {
    repositoryUrl,
    licenseLabel: "AGPL v3 by default",
    mergeCapabilityMembers,
    availableMergeCapabilityCandidates,
    mergeCapabilityChangeRequests,
    repositoryReplacementRequests,
    replaceablePullRequests,
    repositoryHistory,
    pullRequests,
    viewerCanCreatePullRequests: canViewerEditProjectPhase(slug, "phase-5"),
    viewerCanRequestMergeCapabilityChanges: !isPlatformTaggedProject(slug) && canViewerVoteOnProjectPullRequest(slug),
    viewerCanRequestRepositoryReplacement: replaceablePullRequests.length > 0 && canViewerVoteOnProjectPullRequest(slug)
  };
}
function buildDistributionPlans(slug, values, quorumThresholdPercent, memberCount, phaseTwo) {
  const workflow = readProjectWorkflowState(slug);
  if (!workflow) {
    return {
      plans: [],
      winningPlanId: null
    };
  }
  const phaseTwoState = phaseTwo ?? buildProductionPlans(slug, values, quorumThresholdPercent, memberCount);
  const selectedSubtype = currentProjectSubtypeForLifecycle(slug, phaseTwoState);
  const projectMode = findPublicProjectItem(slug)?.projectMode ?? "productive";
  if (selectedSubtype === "software") {
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
    demandConsiderationNote: plan.demandConsiderationNote?.trim() || "Legacy plan. No demand note was recorded when this plan was created.",
    totalCostLabel: plan.totalCostLabel ?? "No direct cost",
    planPhases: buildDistributionPlanPhases(plan),
    distributionSummary: plan.distributionSummary,
    accessSummary: plan.accessSummary,
    reserveSummary: plan.reserveSummary,
    requestSystemEnabled: plan.requestSystemEnabled ?? false,
    requestMode: plan.requestMode ?? "both",
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
  const winningPlan = [...plans].filter((plan) => plan.overallApproval.meetsQuorum).sort((left, right) => right.overallApproval.approvalPercent - left.overallApproval.approvalPercent)[0];
  return {
    plans: plans.map((plan) => ({ ...plan, isLeading: plan.id === winningPlan?.id })),
    winningPlanId: winningPlan?.id ?? null
  };
}
function buildSelectableActivityPlanPhases(phaseTwo, phaseThree) {
  const winningProduction = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId);
  return [
    ...winningProduction?.planPhases.map((phase, index) => ({
      id: phase.id,
      label: `${winningProduction.title} · ${/^stage\s+\d+$/i.test(phase.title) ? phase.title : `Stage ${index + 1}: ${phase.title}`}`
    })) ?? []
  ];
}
function buildProjectServiceHistoryItemFromActivity(activity, workflow, planPhaseLabelById, viewerUsername) {
  const linkedRequest = activity.linkedRequestId ? (workflow.serviceRequests ?? []).find((request) => request.id === activity.linkedRequestId) ?? null : null;
  const completionId = projectServiceHistoryIdForActivity(activity);
  const completion = normalizeRawServiceHistoryCompletion(
    workflow.serviceHistoryCompletions?.[completionId]
  );
  const participantUsernames = uniqueUsernames(
    activity.roles.flatMap((role) => role.assignedUsernames)
  );
  const historyState = linkedRequest ? rawProjectActivityIsActive(activity) ? "committed-activity" : "planned-activity" : "self-planned";
  const historyStateMeta = projectServiceHistoryStateMeta(historyState);
  const requesterCompletion = linkedRequest ? buildServiceHistoryCompletionState(
    "Requester completion",
    [linkedRequest.requesterUsername],
    completion.requesterSelectionsByUsername,
    viewerUsername
  ) : null;
  const participantCompletion = buildServiceHistoryCompletionState(
    linkedRequest ? "Service completion" : "Participant completion",
    participantUsernames,
    completion.participantSelectionsByUsername,
    viewerUsername
  );
  return {
    id: completionId,
    source: linkedRequest ? "request" : "self-planned",
    requestId: linkedRequest?.id ?? null,
    requesterUsername: linkedRequest?.requesterUsername ?? null,
    activity: buildProjectActivityItemFromRaw(activity, planPhaseLabelById, viewerUsername),
    historyState,
    historyStateLabel: historyStateMeta.label,
    historyStateDescription: historyStateMeta.description,
    ...aggregateProjectServiceHistoryCompletion(requesterCompletion, participantCompletion),
    requesterCompletion,
    participantCompletion
  };
}
function buildProjectServiceHistoryItemFromAcceptedRequest(request, workflow, project, viewerUsername) {
  const completionId = projectServiceHistoryIdForRequest(request.id);
  const completion = normalizeRawServiceHistoryCompletion(
    workflow.serviceHistoryCompletions?.[completionId]
  );
  const historyState = "request-only";
  const historyStateMeta = projectServiceHistoryStateMeta(historyState);
  const requesterCompletion = buildServiceHistoryCompletionState(
    "Requester completion",
    [request.requesterUsername],
    completion.requesterSelectionsByUsername,
    viewerUsername
  );
  const participantCompletion = buildServiceHistoryCompletionState(
    "Service completion",
    [project.authorUsername],
    completion.participantSelectionsByUsername,
    viewerUsername
  );
  return {
    id: completionId,
    source: "request",
    requestId: request.id,
    requesterUsername: request.requesterUsername,
    activity: buildProjectActivityItemFromAcceptedRequest(request, project, viewerUsername),
    historyState,
    historyStateLabel: historyStateMeta.label,
    historyStateDescription: historyStateMeta.description,
    ...aggregateProjectServiceHistoryCompletion(requesterCompletion, participantCompletion),
    requesterCompletion,
    participantCompletion
  };
}
function buildProjectServiceHistoryItemFromUnansweredRequest(request, workflow, project, viewerUsername) {
  const completionId = projectServiceHistoryIdForRequest(request.id);
  const completion = normalizeRawServiceHistoryCompletion(
    workflow.serviceHistoryCompletions?.[completionId]
  );
  const historyState = "unanswered-request";
  const historyStateMeta = projectServiceHistoryStateMeta(historyState);
  const participantCompletion = buildServiceHistoryCompletionState(
    "Service completion",
    [],
    completion.participantSelectionsByUsername,
    viewerUsername
  );
  return {
    id: completionId,
    source: "request",
    requestId: request.id,
    requesterUsername: request.requesterUsername,
    activity: buildProjectActivityItemFromUnansweredRequest(request, project, viewerUsername),
    historyState,
    historyStateLabel: historyStateMeta.label,
    historyStateDescription: historyStateMeta.description,
    aggregateCompletionState: "uncompleted",
    aggregateCompletionLabel: "Unanswered",
    aggregateCompletionTone: "uncompleted",
    requesterCompletion: null,
    participantCompletion
  };
}
function rawProjectServiceRequestHasEnded(request) {
  return !!request.endsAt && new Date(request.endsAt).getTime() < Date.now();
}
function buildProjectPhaseFiveState(slug, projectMode, selectablePlanPhases) {
  const workflow = readProjectWorkflowState(slug);
  const viewerUsername = currentViewer()?.username ?? null;
  const planPhaseLabelById = new Map(selectablePlanPhases.map((option) => [option.id, option.label]));
  const project = publicFeedBase.find(
    (item) => item.kind === "project" && item.slug === slug
  );
  if (!workflow || !project) {
    return {
      activities: [],
      history: []
    };
  }
  const now = Date.now();
  const scheduledActivities = [...workflow.phaseFiveActivities].sort(
    (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
  ).map((activity) => ({
    activity,
    item: buildProjectActivityItemFromRaw(activity, planPhaseLabelById, viewerUsername)
  }));
  const liveActivities = scheduledActivities.filter(({ activity }) => rawProjectActivityEndTime(activity) >= now).map(({ item }) => item);
  const history = scheduledActivities.filter(({ activity }) => rawProjectActivityEndTime(activity) < now).map(
    ({ activity }) => buildProjectServiceHistoryItemFromActivity(
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
    if (resolvedStatus === "accepted") {
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
    if (resolvedStatus === "open" && rawProjectServiceRequestHasEnded(request)) {
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
function buildProjectServiceRequestSettingsChangeRequests(slug, projectMode) {
  if (projectMode === "personal-service") {
    return [];
  }
  const workflow = readProjectWorkflowState(slug);
  const eligibleVoterCount = requestSettingsEligibleVoterCount(slug, projectMode);
  const quorumThresholdPercent = calculateProjectQuorumThreshold(eligibleVoterCount);
  return [...workflow?.requestSettingsChangeRequests ?? []].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).map((request) => {
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
    };
  });
}
function projectLifecyclePhaseTitle(slug, projectMode, phaseId) {
  return projectLifecyclePhaseBlueprintsForProject(slug, projectMode).find((phase) => phase.id === phaseId)?.title ?? phaseId;
}
function buildResolvedDecisionHistoryVoteSummary(entry) {
  if (!entry.finalVotesByUserId || entry.finalEligibleVoterCount == null) {
    return null;
  }
  return buildProjectVoteSummary(
    entry.finalVotesByUserId,
    calculateProjectQuorumThreshold(entry.finalEligibleVoterCount),
    entry.finalEligibleVoterCount
  );
}
function defaultEventCurrentPhaseId(event) {
  return event.isPrivate ? "event-plan" : "proposal";
}
function eventPhaseOrder(event, phaseId) {
  if (event.isPrivate) {
    switch (phaseId) {
      case "event-plan":
        return 1;
      case "activity":
        return 2;
      case "closed":
        return 3;
      default:
        return 0;
    }
  }
  switch (phaseId) {
    case "proposal":
      return 1;
    case "event-plan":
      return 2;
    case "activity":
      return 3;
    case "closed":
      return 4;
    default:
      return 0;
  }
}
function eventPhaseTitle(phaseId) {
  switch (phaseId) {
    case "proposal":
      return "Proposal";
    case "event-plan":
      return "Event Plan";
    case "activity":
      return "Activity";
    default:
      return "Closed";
  }
}
function isEventPhaseId(phaseId) {
  return phaseId === "proposal" || phaseId === "event-plan" || phaseId === "activity" || phaseId === "closed";
}
function buildDecisionHistoryPayload(payload, projectMode, projectSlug = null) {
  switch (payload.type) {
    case "phase-change":
      return {
        type: "phase-change",
        changeKind: payload.changeKind,
        fromPhaseId: payload.fromPhaseId,
        fromPhaseLabel: projectMode && projectSlug ? projectLifecyclePhaseTitle(projectSlug, projectMode, payload.fromPhaseId) : isEventPhaseId(payload.fromPhaseId) ? eventPhaseTitle(payload.fromPhaseId) : payload.fromPhaseId,
        toPhaseId: payload.toPhaseId,
        toPhaseLabel: projectMode && projectSlug ? projectLifecyclePhaseTitle(projectSlug, projectMode, payload.toPhaseId) : isEventPhaseId(payload.toPhaseId) ? eventPhaseTitle(payload.toPhaseId) : payload.toPhaseId,
        reason: payload.reason,
        closeOutcome: payload.closeOutcome,
        conversionTarget: buildProjectConversionTarget(payload.conversionTarget)
      };
    case "settings-change":
      return {
        type: "settings-change",
        reason: payload.reason,
        previousSettings: buildProjectRequestSettingsHistorySnapshot(
          projectMode ?? "collective-service",
          payload.previousSettings
        ),
        proposedSettings: buildProjectRequestSettingsHistorySnapshot(
          projectMode ?? "collective-service",
          payload.proposedSettings
        )
      };
    case "update":
      return {
        type: "update",
        body: payload.body,
        appliedUpdateId: payload.appliedUpdateId ?? null
      };
    case "pull-request":
      return {
        type: "pull-request",
        title: payload.title,
        summary: payload.summary,
        pullRequestId: payload.pullRequestId,
        pullRequestUrl: payload.pullRequestUrl,
        mergeId: payload.mergeId ?? null,
        repositoryUrl: payload.repositoryUrl ?? null
      };
    case "merge-capability":
      return {
        type: "merge-capability",
        action: payload.action,
        actionLabel: projectMergeCapabilityActionLabel(payload.action),
        targetUsername: payload.targetUsername
      };
    case "repository-replacement":
      return {
        type: "repository-replacement",
        repositoryUrl: payload.repositoryUrl,
        previousRepositoryUrl: payload.previousRepositoryUrl ?? null,
        reason: payload.reason,
        relatedPullRequestId: payload.relatedPullRequestId ?? null
      };
    default:
      return {
        type: "edit",
        changes: payload.changes
      };
  }
}
function buildDecisionHistoryEntryFromRecord(entry, openStateById, projectMode, projectSlug = null) {
  const liveState = entry.status === "open" ? openStateById.get(entry.id) ?? null : null;
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
    passesApprovalThreshold: liveState?.passesApprovalThreshold ?? phaseChangePassesApprovalThreshold(voteSummary),
    canStillPass: liveState?.canStillPass ?? thresholdVoteCanStillPass(voteSummary, entry.approvalThresholdPercent),
    canVote: liveState?.canVote ?? false,
    payload: buildDecisionHistoryPayload(entry.payload, projectMode, projectSlug)
  };
}
function buildProjectDecisionHistory(slug, lifecycle, updateRequests, editRequests, viewerCanVoteOnUpdateRequests, viewerCanVoteOnEditRequests, softwareGovernance) {
  const workflow = ensureProjectWorkflowState(slug);
  const projectMode = projectModeForSlug(slug);
  const openStateById = /* @__PURE__ */ new Map();
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
  return [...workflow.decisionHistory ?? []].map((entry) => buildDecisionHistoryEntryFromRecord(entry, openStateById, projectMode, slug)).filter((entry) => !!entry).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
function buildEventDecisionHistory(slug, creatorId, lifecycle, updateRequests, editRequests, viewerCanVoteOnUpdateRequests, viewerCanVoteOnEditRequests) {
  const workflow = ensureEventWorkflowState(slug, creatorId);
  const openStateById = /* @__PURE__ */ new Map();
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
  return [...workflow.decisionHistory ?? []].map((entry) => buildDecisionHistoryEntryFromRecord(entry, openStateById, null, null)).filter((entry) => !!entry).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
function buildProjectServiceRequestState(slug, projectMode, viewerCanSubmitRequests, viewerCanReviewRequests, requiresSchedule, phaseThree) {
  const workflow = readProjectWorkflowState(slug);
  const settings = buildProjectRequestSettings(slug, projectMode, phaseThree);
  const settingsChangeRequests = buildProjectServiceRequestSettingsChangeRequests(slug, projectMode);
  if (!workflow) {
    return {
      enabled: settings.enabled,
      requestCount: 0,
      requests: [],
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
    (request) => resolveProjectServiceRequestStatus(request, workflow.phaseFiveActivities) === "open" && !rawProjectServiceRequestHasEnded(request)
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
function buildProjectRevertHistory(slug) {
  const workflow = readProjectWorkflowState(slug);
  if (!workflow) {
    return [];
  }
  return (workflow.revertHistory ?? []).map((entry) => ({
    id: entry.id,
    targetPhaseId: entry.targetPhaseId,
    reason: entry.reason,
    authorUsername: entry.authorUsername,
    createdAt: entry.createdAt
  }));
}
function nextProjectPhaseId(currentPhaseId, projectMode) {
  if (projectMode === "personal-service") {
    switch (currentPhaseId) {
      case "phase-1":
        return "phase-2";
      default:
        return null;
    }
  }
  switch (currentPhaseId) {
    case "phase-1":
      return "phase-2";
    case "phase-2":
      return "phase-3";
    case "phase-3":
      return "phase-5";
    case "phase-5":
      return "phase-6";
    default:
      return null;
  }
}
function calculateProjectQuorumThreshold(memberCount) {
  return calculateGovernanceQuorum(memberCount).quorumThresholdPercent;
}
function recordMeaningfulAction(userId) {
  lastMeaningfulActionAtByUserId[userId] = (/* @__PURE__ */ new Date()).toISOString();
}
function platformWeeklyActiveUserIds() {
  const now = Date.now();
  return users.map((user) => user.id).filter((userId) => {
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
function projectGovernancePopulation(slug, memberCount) {
  return isPlatformTaggedProject(slug) ? platformWeeklyActiveUserCount() : memberCount;
}
function projectVoteContextLabel(slug) {
  return isPlatformTaggedProject(slug) ? "weekly active users" : "project members";
}
function buildProjectSignalSummary(slug) {
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
  const signalRatioPercent = totalCount === 0 ? 0 : Math.round(demandCount / totalCount * 100);
  const voteContextPopulation = projectGovernancePopulation(slug, buildProjectMemberState(slug).memberCount);
  const requiredDemandCount = isPlatformTaggedProject(slug) ? calculateRequiredVotes(voteContextPopulation) : 0;
  const viewerSignal = viewer ? demandUserIds.includes(viewer.id) ? "demand" : oppositionUserIds.includes(viewer.id) ? "opposition" : null : null;
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
function isPlatformTaggedEvent(subject) {
  const event = typeof subject === "string" ? findPublicEventItem(subject) : subject;
  return !!event && event.channelTags.some((tag) => tag.slug === platform.slug);
}
function eventVoteContextLabel(event) {
  if (isPlatformTaggedEvent(event)) {
    return "weekly active users";
  }
  return event.isPrivate ? "event editors" : "event members";
}
function eventGovernancePopulation(event, eligibleVoterCount) {
  return isPlatformTaggedEvent(event) ? platformWeeklyActiveUserCount() : eligibleVoterCount;
}
function eventNextPhaseId(event, currentPhaseId) {
  if (event.isPrivate) {
    switch (currentPhaseId) {
      case "event-plan":
        return "activity";
      case "activity":
        return "closed";
      default:
        return null;
    }
  }
  switch (currentPhaseId) {
    case "proposal":
      return "event-plan";
    case "event-plan":
      return "activity";
    case "activity":
      return "closed";
    default:
      return null;
  }
}
function revertableEventPhaseIds(event, currentPhaseId) {
  if (event.isPrivate) {
    if (currentPhaseId === "activity" || currentPhaseId === "closed") {
      return ["event-plan"];
    }
    return [];
  }
  if (currentPhaseId === "event-plan") {
    return ["proposal"];
  }
  if (currentPhaseId === "activity" || currentPhaseId === "closed") {
    return ["proposal", "event-plan"];
  }
  return [];
}
function eventPreviousPhaseId(event, currentPhaseId) {
  const revertablePhaseIds = revertableEventPhaseIds(event, currentPhaseId);
  return revertablePhaseIds[revertablePhaseIds.length - 1] ?? null;
}
function requestableEventPhaseTargetIds(event, currentPhaseId) {
  const nextPhaseId = eventNextPhaseId(event, currentPhaseId);
  const revertablePhaseIds = revertableEventPhaseIds(event, currentPhaseId);
  return [...nextPhaseId ? [nextPhaseId] : [], ...revertablePhaseIds];
}
function eventPhaseChangeKind(event, fromPhaseId, toPhaseId) {
  const fromOrder = eventPhaseOrder(event, fromPhaseId);
  const toOrder = eventPhaseOrder(event, toPhaseId);
  if (toPhaseId === "closed" && toOrder > fromOrder) {
    return "close";
  }
  return toOrder > fromOrder ? "advance" : "return";
}
function buildEventSignalSummary(event) {
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
  const requiredDemandCount = isPlatformTaggedEvent(event) ? calculateRequiredVotes(voteContextPopulation) : 0;
  const viewerSignal = viewer ? demandUserIds.includes(viewer.id) ? "demand" : oppositionUserIds.includes(viewer.id) ? "opposition" : null : null;
  const ratioRequirementMet = totalCount > 0 && demandCount / totalCount > 0.66;
  const demandRequirementMet = requiredDemandCount === 0 || demandCount >= requiredDemandCount;
  return {
    demandCount,
    oppositionCount,
    totalCount,
    viewerSignal,
    signalRatioPercent: totalCount === 0 ? 0 : Math.round(demandCount / totalCount * 100),
    ratioRequirementMet,
    requiredDemandCount,
    demandRequirementMet,
    advancementUnlocked: ratioRequirementMet && demandRequirementMet,
    usesPlatformVoteContext: isPlatformTaggedEvent(event),
    voteContextLabel: eventVoteContextLabel(event),
    voteContextPopulation
  };
}
function eventPhaseBlueprintsForItem(event, currentPhaseId) {
  const publicBlueprints = [
    {
      id: "proposal",
      order: 1,
      shortLabel: "Proposal",
      title: "Proposal",
      summary: "Demand, opposition, and member-ranked values decide whether the event should move into planning.",
      mechanics: [
        "Demand and opposition stay visible throughout the event lifecycle.",
        "Members can add proposal values and rank their importance during proposal.",
        "Planning only opens after support is high enough and members vote to advance."
      ],
      eventStatus: "This event is still in proposal and needs enough support to open its shared event plan phase."
    },
    {
      id: "event-plan",
      order: 2,
      shortLabel: "Plan",
      title: "Event Plan",
      summary: "Members submit event plans, vote on how well each plan satisfies proposal demand and values, and select the plan that should run.",
      mechanics: [
        "Any event member can submit a plan during the planning phase.",
        "Members can approve more than one plan and vote on how well each plan satisfies the proposal values.",
        "When a plan clears approval and quorum, members can vote to advance into activity."
      ],
      eventStatus: "This event is in its planning phase. An accepted plan becomes the live event title and description when activity opens."
    },
    {
      id: "activity",
      order: 3,
      shortLabel: "Activity",
      title: "Activity",
      summary: "The accepted plan is now live, and members can schedule multiple concrete activities with role minimums on the shared calendar.",
      mechanics: [
        "The accepted event plan becomes the live event framing for the activity phase.",
        "Members can schedule multiple activities that map back to stages in the accepted plan.",
        "Each activity can define role minimums so members can coordinate what is needed."
      ],
      eventStatus: "This event is active. The accepted event plan is live, and activities can be scheduled directly from it."
    },
    {
      id: "closed",
      order: 4,
      shortLabel: "Closed",
      title: "Closed",
      summary: "The event stays visible as history after it closes.",
      mechanics: [
        "Closed events remain visible with their plan, activities, and decision history.",
        "No new lifecycle work opens once the event is closed."
      ],
      eventStatus: "This event is closed and kept as part of the event record."
    }
  ];
  const privateBlueprints = [
    {
      id: "event-plan",
      order: 1,
      shortLabel: "Plan",
      title: "Event Plan",
      summary: "The creator and any granted editors shape the private event plan before the event runs or closes.",
      mechanics: [
        "Private events do not use public proposal signalling.",
        "The creator can grant editor access so planning work can be shared deliberately.",
        "The accepted plan becomes the live event framing when the private event is active."
      ],
      eventStatus: "This private event is in planning. The creator and invited editors control the event plan."
    },
    {
      id: "activity",
      order: 2,
      shortLabel: "Activity",
      title: "Activity",
      summary: "The private event plan is live, and activities can be scheduled directly from the agreed plan.",
      mechanics: [
        "Private-event activities can still be broken into multiple scheduled pieces.",
        "Role minimums stay visible so invited members know what participation is needed.",
        "The creator keeps control of private-event lifecycle decisions."
      ],
      eventStatus: "This private event is active. The accepted plan is live and activities can be scheduled from it."
    },
    {
      id: "closed",
      order: 3,
      shortLabel: "Closed",
      title: "Closed",
      summary: "The private event stays visible as a record after it closes.",
      mechanics: [
        "Closed private events keep their plan, activities, and history visible to the permitted audience.",
        "No new lifecycle work opens once the event is closed."
      ],
      eventStatus: "This private event is closed and preserved as part of the event record."
    }
  ];
  const blueprints = event.isPrivate ? privateBlueprints : publicBlueprints;
  const currentOrder = blueprints.find((phase) => phase.id === currentPhaseId)?.order ?? 1;
  return blueprints.map((phase) => ({
    ...phase,
    mechanics: [...phase.mechanics],
    progressState: phase.id === currentPhaseId ? "current" : phase.order < currentOrder ? "complete" : "upcoming"
  }));
}
function activityPhaseIdForProject(projectMode) {
  return isPersonalServiceProject(projectMode) ? "phase-1" : "phase-5";
}
function closePhaseIdForProject(projectMode) {
  return isPersonalServiceProject(projectMode) ? "phase-2" : "phase-6";
}
function revertableProjectPhaseIds(projectMode, currentPhaseId) {
  if (projectMode === "personal-service") {
    return currentPhaseId === "phase-2" ? ["phase-1"] : [];
  }
  if (currentPhaseId === "phase-3") {
    return ["phase-2"];
  }
  if (currentPhaseId === "phase-5" || currentPhaseId === "phase-6") {
    return ["phase-2", "phase-3"];
  }
  return [];
}
function buildProjectLifecycleNotes(projectMode, quorumVotesRequired, voteContextPopulation, voteContextLabel, requestSystemEnabled, usesPlatformLifecycle, personalServiceRequestModeValue = "calendar") {
  if (projectMode === "personal-service") {
    return [
      {
        title: "Members join the chat",
        body: "Joining a personal service keeps its updates and linked chat attached without needing a separate member or manager list."
      },
      {
        title: personalServiceRequestModeValue === "calendar" ? "Calendar-first requests" : personalServiceRequestModeValue === "both" ? "Calendar and direct requests" : "Direct written requests",
        body: personalServiceRequestModeValue === "calendar" ? "The calendar is the working surface here: the creator posts availability, and requesters choose a date and time directly from it." : personalServiceRequestModeValue === "both" ? "This service keeps time-slot booking and direct written requests open together so people can use either path." : "This service takes direct written requests instead of time-slot booking, so request details and messages do the coordination."
      }
    ];
  }
  return [
    {
      title: "Values carry forward",
      body: "Values added in Phase 1 stay visible and should be referenced again when members judge later plans."
    },
    {
      title: "Demand signalling stays open",
      body: "Members can keep expressing demand and interest throughout the full lifecycle, not just during proposal."
    },
    {
      title: `Current quorum: ${quorumVotesRequired} ${quorumVotesRequired === 1 ? "vote" : "votes"} required`,
      body: voteContextPopulation <= 0 ? `No eligible ${voteContextLabel} are recorded yet, so quorum will start counting once someone becomes active in this vote context.` : `This now follows the governance formula from governance-rules.md and currently requires ${quorumVotesRequired} of ${voteContextPopulation} eligible ${voteContextLabel} to cast a vote before a result is valid.`
    },
    {
      title: `Phase changes need ${phaseChangeApprovalThresholdPercent}% approval`,
      body: "Any eligible participant can request a phase change, but the request only executes once quorum is met and the approval rating reaches the required threshold."
    },
    ...projectMode === "collective-service" ? [
      {
        title: usesPlatformLifecycle ? "Activity requests stay governed" : requestSystemEnabled ? "Requests are enabled" : "Requests are optional",
        body: usesPlatformLifecycle ? "Platform collective services use governed in-activity requests here instead of the old member-managed booking flow." : requestSystemEnabled ? "The current access plan enabled service requests, so users can keep adding requests during active service." : "Collective service requests stay off until an access plan explicitly enables them."
      }
    ] : []
  ];
}
function buildProjectLifecycle(slug, projectMode, memberCount) {
  const config = projectLifecycleBySlug[slug] ?? projectLifecycleBySlug["neighborhood-heat-pump-pilot"];
  const workflow = readProjectWorkflowState(slug);
  const viewer = currentViewer();
  const personalServiceRequestModeValue = projectMode === "personal-service" ? personalServiceRequestMode(slug) : "calendar";
  const personalServiceCalendarMode = projectMode === "personal-service" && personalServiceRequestModeValue !== "direct";
  const supportsDemandSignals = supportsProjectDemandSignals(projectMode);
  const supportsPlanning = supportsProjectPlanning(projectMode);
  const values = buildProjectValues(slug);
  const voteContextPopulation = projectGovernancePopulation(slug, memberCount);
  const voteContextLabel = projectVoteContextLabel(slug);
  const quorum = supportsPlanning ? calculateGovernanceQuorum(voteContextPopulation) : { quorumThresholdPercent: 0, votesRequired: 0 };
  const quorumThresholdPercent = quorum.quorumThresholdPercent;
  const quorumVotesRequired = quorum.votesRequired;
  const memberState = buildProjectMemberState(slug);
  const signalSummary = buildProjectSignalSummary(slug);
  const phaseTwo = supportsPlanning ? buildProductionPlans(slug, values, quorumThresholdPercent, voteContextPopulation) : { plans: [], winningPlanId: null };
  const currentSubtype = currentProjectSubtypeForLifecycle(slug, phaseTwo);
  const currentSubtypeLabel = currentSubtype ? projectSubtypeLabel(currentSubtype) : null;
  const projectItem = findPublicProjectItem(slug);
  const usesPlatformLifecycle = usesPlatformPendingExecutionLifecycle(slug, projectMode, currentSubtype);
  const phaseThree = supportsPlanning ? usesPlatformLifecycle ? { plans: [], winningPlanId: null } : buildDistributionPlans(slug, values, quorumThresholdPercent, voteContextPopulation, phaseTwo) : { plans: [], winningPlanId: null };
  const phaseBlueprints = projectMode === "personal-service" ? personalServicePhaseBlueprintsForRequestMode(personalServiceRequestModeValue) : projectLifecyclePhaseBlueprintsForProject(slug, projectMode, currentSubtype);
  const normalizedCurrentPhaseId = (() => {
    if (projectMode === "personal-service") {
      return config.currentPhaseId;
    }
    if (usesPlatformLifecycle && (config.currentPhaseId === "phase-3" || config.currentPhaseId === "phase-4")) {
      return phaseTwo.winningPlanId ? "phase-5" : "phase-2";
    }
    const currentOrder = phaseOrderForProjectSlug(slug, projectMode, config.currentPhaseId);
    const phaseTwoOrder = phaseOrderForProjectSlug(slug, projectMode, "phase-2");
    const phaseThreeOrder = phaseOrderForProjectSlug(slug, projectMode, "phase-3");
    if (currentOrder > phaseTwoOrder && phaseTwoOrder > 0 && !phaseTwo.winningPlanId) {
      return "phase-2";
    }
    if (phaseThreeOrder > 0 && currentOrder > phaseThreeOrder && !usesPlatformLifecycle && !phaseThree.winningPlanId) {
      return "phase-3";
    }
    return config.currentPhaseId;
  })();
  config.currentPhaseId = normalizedCurrentPhaseId;
  const currentPhaseOrder = phaseBlueprints.find((phase) => phase.id === config.currentPhaseId)?.order ?? 1;
  const nextPhaseId = nextProjectPhaseIdForSlug(slug, config.currentPhaseId, projectMode, currentSubtype);
  const selectablePlanPhases = buildSelectableActivityPlanPhases(phaseTwo);
  const activityPhaseId = activityPhaseIdForProject(projectMode);
  const activityPhaseOrder = phaseBlueprints.find((phase) => phase.id === activityPhaseId)?.order ?? Number.POSITIVE_INFINITY;
  const phaseFiveState = currentPhaseOrder >= activityPhaseOrder ? buildProjectPhaseFiveState(slug, projectMode, selectablePlanPhases) : {
    activities: [],
    history: []
  };
  const requestSystemEnabled = requestSystemEnabledForProject(slug, projectMode, phaseThree);
  const collectiveRequestMode = projectMode === "collective-service" ? collectiveRequestModeForProject(slug, phaseThree) : "both";
  const collectiveAllowOffScheduleRequests = projectMode === "collective-service" ? collectiveAllowOffScheduleRequestsForProject(slug, phaseThree) : false;
  const requestRequiresSchedule = projectMode === "personal-service" ? personalServiceRequestModeValue === "calendar" : projectMode === "collective-service" ? collectiveRequestMode === "calendar" || collectiveRequestMode === "both" && !collectiveAllowOffScheduleRequests : false;
  const requestSystem = projectMode === "productive" ? null : buildProjectServiceRequestState(
    slug,
    projectMode,
    requestSystemEnabled && canViewerSubmitProjectServiceRequest(slug),
    canViewerReviewProjectServiceRequests(slug),
    requestRequiresSchedule,
    phaseThree
  );
  const personalService = projectMode === "personal-service" ? {
    availabilitySummary: workflow?.availabilitySummary ?? (personalServiceCalendarMode ? "The service creator will keep a direct availability schedule visible here." : "Requests are handled directly through the service description and messages."),
    travelRadiusLabel: workflow?.travelRadiusLabel,
    usesCalendar: personalServiceCalendarMode,
    requestMode: personalServiceRequestModeValue
  } : null;
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
  const viewerCanRequestPhaseChanges = projectMode !== "personal-service" && canViewerRequestProjectPhaseChange(slug) && requestableProjectPhaseTargetIdsForSlug(slug, config.currentPhaseId, projectMode).length > 0;
  const viewerCanVoteOnPhaseChanges = projectMode !== "personal-service" && canViewerVoteOnProjectPhaseChange(slug);
  const canAdvancePhaseNow = nextPhaseId ? canAdvanceMockProjectPhaseNow(slug, projectMode) : false;
  const phaseFour = projectItem ? buildProjectPhaseFourPreview(projectItem, currentSubtype) : null;
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
    viewerCanAdvancePhase: projectMode === "personal-service" && memberState.viewerIsProjectManager && !!nextPhaseId && canAdvancePhaseNow,
    nextPhaseId,
    nextPhaseLabel: nextPhaseId ? phaseBlueprints.find((phase) => phase.id === nextPhaseId)?.title ?? null : null,
    viewerCanRevertPhase: projectMode === "personal-service" && memberState.viewerIsProjectManager && revertablePhaseIds.length > 0,
    revertablePhaseIds,
    revertHistory: buildProjectRevertHistory(slug),
    requestSystem,
    personalService,
    phaseOne: {
      values,
      viewerCanSignalDemand: supportsDemandSignals && !!viewer,
      viewerHasDemandSignal: supportsDemandSignals && !!viewer && !!workflow?.signalUserIds.includes(viewer.id),
      viewerCanSignalOpposition: supportsDemandSignals && !!viewer,
      viewerHasOppositionSignal: supportsDemandSignals && !!viewer && !!workflow?.oppositionSignalUserIds?.includes(viewer.id),
      signalSummary,
      viewerCanAddValue: supportsPlanning && canViewerEditProjectPhase(slug, "phase-1"),
      viewerCanVoteOnValues: supportsPlanning && canViewerEditProjectPhase(slug, "phase-1"),
      availabilitySummary: personalService?.availabilitySummary,
      travelRadiusLabel: personalService?.travelRadiusLabel
    },
    phaseTwo: {
      plans: phaseTwo.plans,
      winningPlanId: phaseTwo.winningPlanId,
      viewerCanSubmitPlans: supportsPlanning && canViewerEditProjectPhase(slug, "phase-2"),
      viewerCanVoteOnPlans: supportsPlanning && canViewerEditProjectPhase(slug, "phase-2")
    },
    phaseThree: {
      plans: phaseThree.plans,
      winningPlanId: phaseThree.winningPlanId,
      viewerCanSubmitPlans: supportsPlanning && !usesPlatformLifecycle && currentSubtype !== "software" && canViewerEditProjectPhase(slug, "phase-3"),
      viewerCanVoteOnPlans: supportsPlanning && !usesPlatformLifecycle && currentSubtype !== "software" && canViewerEditProjectPhase(slug, "phase-3"),
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
      const progressState = phaseConfig?.betaLocked ? "locked" : phase.id === config.currentPhaseId ? "current" : phase.order < currentPhaseOrder ? "complete" : "upcoming";
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
const projectDetailExtras = {
  ...explicitAssetServiceProjectDetailExtras,
  "neighborhood-heat-pump-pilot": {
    overview: "This project is still in demand signalling so the first pilot stays small, legible, and finishable. The goal is to keep labor needs, vendor questions, and likely building candidates visible in one place before planning hardens.",
    updates: [
      {
        id: "project-update-heat-pump-1",
        title: "First site walk proposed",
        body: "Two neighbors offered to host a Saturday walkthrough so the pilot can scope electrical constraints before formal planning.",
        authorUsername: "patchbay",
        createdAt: "2026-04-30T09:30:00Z"
      },
      {
        id: "project-update-heat-pump-2",
        title: "Vendor questions collected",
        body: "The list now separates equipment availability, maintenance burden, and noise concerns so comparisons stay readable.",
        authorUsername: "mika",
        createdAt: "2026-04-29T18:10:00Z"
      }
    ],
    discussionNote: "Project chat stays live here so planning notes, coordination, and quick follow-ups can move more like a working room than a forum thread.",
    discussion: []
  },
  "platform-release-governance-round": {
    overview: "This platform-tagged project keeps release planning public while still separating broader platform coordination from the main public feed.",
    updates: [
      {
        id: "project-update-release-1",
        title: "Accessibility fixes queued",
        body: "Keyboard and focus passes were added to the next release gate before the shipping checklist closes.",
        authorUsername: "mika",
        createdAt: "2026-04-30T10:10:00Z"
      }
    ],
    discussionNote: "This live project chat is where release blockers, moderation defaults, and quick coordination notes stay visible before the next ship date.",
    discussion: []
  },
  "community-fridge-restock-route": {
    overview: "This project is already past the core route design and is now focused on deciding how weekly fridge stock gets distributed across the neighborhood without losing clarity or fairness.",
    updates: [
      {
        id: "project-update-fridge-1",
        title: "Pickup windows narrowed",
        body: "The draft distribution plan now uses one nearby pickup window and one overflow window so volunteers can predict the route more easily.",
        authorUsername: "rowanloop",
        createdAt: "2026-04-30T11:20:00Z"
      }
    ],
    discussionNote: "Project chat stays live here so route changes, pickup questions, and volunteer coordination feel like working notes instead of forum posts.",
    discussion: []
  },
  "east-market-cold-storage-acquisition-round": {
    overview: "This round is already through operations and access planning and now exists to make the acquisition handoff legible before the resulting cold-storage equipment is converted into the East Market commons asset record.",
    updates: [
      {
        id: "project-update-east-market-cold-storage-1",
        title: "Vendor shortlist narrowed",
        body: "Board review narrowed the cold-room shortlist to two vendors that can deliver within the current acquisition window.",
        authorUsername: "rowanloop",
        createdAt: "2026-04-30T20:10:00Z"
      }
    ],
    discussionNote: "Use chat to track vendor questions, funding edge cases, and the asset-conversion handoff before the storage service opens.",
    discussion: []
  },
  "tool-library-shed-conversion-round": {
    overview: "This round is already funded and now keeps the contractor handoff, board execution, and future asset conversion visible before the storage shed becomes a live registered service site.",
    updates: [
      {
        id: "project-update-tool-library-shed-1",
        title: "Electrical scope confirmed",
        body: "The conversion scope now includes one dedicated outlet run and a lockable intake shelf zone for shared storage handoff.",
        authorUsername: "toolorbit",
        createdAt: "2026-04-30T20:25:00Z"
      }
    ],
    discussionNote: "Use chat to coordinate contractor timing, board execution, and the final asset-registry conversion checklist.",
    discussion: []
  },
  "repair-cafe-shift-grid": {
    overview: "This project is already in its activity phase, so the main work is no longer deciding what the repair cafe should be, but scheduling shifts that can actually run when the needed roles are covered.",
    updates: [
      {
        id: "project-update-repair-1",
        title: "Floor roles reopened",
        body: "One queue-runner slot is still open for Thursday, so the next shift will only activate once that final role is filled.",
        authorUsername: "toolorbit",
        createdAt: "2026-04-30T13:05:00Z"
      }
    ],
    discussionNote: "This live project chat is where last-minute role swaps, intake questions, and workshop coordination stay visible.",
    discussion: []
  },
  "tool-library-blade-sharpening-service": {
    overview: "This project completed its pilot and converted into an ongoing service, so the page now acts more like an operating surface for the continuing sharpening workflow than a one-off proposal.",
    updates: [
      {
        id: "project-update-sharpening-1",
        title: "Recurring pickup window set",
        body: "The converted service now uses the same pickup shelf each week so people can find completed tools without extra coordination overhead.",
        authorUsername: "toolorbit",
        createdAt: "2026-04-30T15:10:00Z"
      }
    ],
    discussionNote: "Service chat stays live here so intake notes, turnaround questions, and recurring workflow tweaks remain visible to the operating group.",
    discussion: []
  },
  "neighborhood-insulation-kit-round": {
    overview: "This productive project already completed demand ranking and is now deciding the final production model for the first insulation-kit round.",
    updates: [
      {
        id: "project-update-insulation-1",
        title: "Cut list template published",
        body: "A shared cut-list template was added so every hallway team can prep kits in the same format.",
        authorUsername: "patchbay",
        createdAt: "2026-04-30T16:20:00Z"
      }
    ],
    discussionNote: "Use this chat to keep production vote notes and prep details in one working room.",
    discussion: []
  },
  "community-solar-battery-share": {
    overview: "This productive project is in access planning, with members deciding reserve and overflow battery windows before scheduling begins.",
    updates: [
      {
        id: "project-update-battery-1",
        title: "Reserve policy draft posted",
        body: "A reserve draft now holds one emergency slot per day before overflow windows open.",
        authorUsername: "mika",
        createdAt: "2026-04-30T16:45:00Z"
      }
    ],
    discussionNote: "Use chat to compare access options and edge cases before the distribution vote closes.",
    discussion: []
  },
  "hallway-air-sealing-build-day": {
    overview: "This productive project is in scheduling and only activates each build block when all listed roles are filled.",
    updates: [
      {
        id: "project-update-airseal-1",
        title: "Install role still open",
        body: "One install slot remains unfilled, so the next build block has not activated yet.",
        authorUsername: "toolorbit",
        createdAt: "2026-04-30T17:05:00Z"
      }
    ],
    discussionNote: "Use chat for role swaps, setup notes, and final activation checks.",
    discussion: []
  },
  "block-weatherization-pilot-wrap": {
    overview: "This productive pilot is complete and is now documenting completion notes and conversion options for the next cycle.",
    updates: [
      {
        id: "project-update-weather-wrap-1",
        title: "Completion notes posted",
        body: "Final completion notes were posted with carry-forward items for a future neighborhood round.",
        authorUsername: "mika",
        createdAt: "2026-04-30T17:30:00Z"
      }
    ],
    discussionNote: "Use chat for completion review and conversion suggestions.",
    discussion: []
  },
  "mutual-aid-ride-request-desk": {
    overview: "This collective service is still in demand signalling and value ranking, prior to operations and access plan voting.",
    updates: [
      {
        id: "project-update-ride-1",
        title: "Demand pulse updated",
        body: "Members logged another round of demand signals for school pickup and clinic routes.",
        authorUsername: "quietember",
        createdAt: "2026-04-30T18:00:00Z"
      }
    ],
    discussionNote: "Use chat to capture operating constraints before planning opens.",
    discussion: []
  },
  "neighborhood-ride-coordination-service": {
    overview: "This collective service is active with direct request intake only, so members can request support without selecting calendar slots.",
    updates: [
      {
        id: "project-update-ride-coordination-1",
        title: "Direct intake is live",
        body: "Coordinators are now handling requests through direct intake while dispatch windows stay flexible.",
        authorUsername: "quietember",
        createdAt: "2026-04-30T19:10:00Z"
      }
    ],
    discussionNote: "Use chat to coordinate direct-request details and dispatch handoffs.",
    discussion: []
  },
  "childcare-checkin-desk-service": {
    overview: "This collective service is active with both calendar booking and direct requests so members can use either path.",
    updates: [
      {
        id: "project-update-childcare-checkin-1",
        title: "Mixed request flow enabled",
        body: "Members can now choose either calendar slots or direct requests for childcare check-in support.",
        authorUsername: "toolorbit",
        createdAt: "2026-04-30T19:30:00Z"
      }
    ],
    discussionNote: "Use chat to coordinate booking details and direct request follow-ups.",
    discussion: []
  },
  "patchbay-bike-light-tuneups": {
    overview: "This personal service is active and handles requests directly without collective planning phases.",
    updates: [
      {
        id: "project-update-bike-light-1",
        title: "Tuesday slots opened",
        body: "Two evening slots opened for quick bike-light checks this week.",
        authorUsername: "patchbay",
        createdAt: "2026-04-30T18:25:00Z"
      }
    ],
    discussionNote: "Use chat to coordinate tuneup timing and request follow-ups.",
    discussion: []
  },
  "rowan-after-school-device-checks": {
    overview: "This personal service is complete and no longer running, but its request history remains visible for reference.",
    updates: [
      {
        id: "project-update-device-checks-1",
        title: "Service closed for season",
        body: "The after-school support window closed after the final session and now shows as complete.",
        authorUsername: "rowanloop",
        createdAt: "2026-04-30T18:50:00Z"
      }
    ],
    discussionNote: "Use chat for wrap-up notes and conversion ideas if this service returns.",
    discussion: []
  }
};
const threadDiscussionNotes = {
  "shared-laundry-repair-round": "Thread detail keeps discussion first without folding nearby context back into project logistics.",
  "should-platform-publish-weekly-release-notes": "Public governance threads should stay understandable without turning into announcement-only pages."
};
const postDiscussionNotes = {
  "post-spare-filters": "Personal posts should still open into a real discussion surface so replies and follow-up notes stay visible instead of disappearing into the feed.",
  "post-rowan-checklist": "This post stays in the personal feed, but discussion still deserves the same threaded structure as public threads.",
  "post-mika-brief": "Short personal notes can still collect replies without pretending they belong in the public feed."
};
const eventDetailExtras = {
  "tool-library-spring-swap-social": {
    attendanceNote: "Standalone events stay light-weight: clear purpose, visible tags, and social coordination without pretending every gathering is a long-running project.",
    agenda: [
      "Open the swap table and shared snack spread.",
      "Collect summer volunteer signups and repair requests.",
      "Close with a short round of repair stories and next-step intros."
    ],
    updates: [
      {
        id: "event-update-swap-1",
        title: "Welcome table pinned",
        body: "The welcome table, swap table, and snack table are now mapped to the courtyard entrance so late arrivals can orient quickly.",
        authorUsername: "toolorbit",
        createdAt: "2026-04-30T12:15:00Z"
      }
    ],
    discussionNote: "Event chat stays live here so logistics, reminders, and quick coordination notes feel immediate instead of forum-like.",
    discussion: []
  },
  "retrofit-night-walk": {
    attendanceNote: "Private events stay useful when they can still carry discussion, attendance, and small planning notes without becoming a separate project surface.",
    agenda: [
      "Walk the first retrofit cluster.",
      "Flag access and wiring constraints.",
      "Confirm which buildings are ready for the first pilot round."
    ],
    updates: [
      {
        id: "event-update-walk-1",
        title: "Starting corner confirmed",
        body: "The invite list will meet at the east corner first so access notes can be captured before the light drops.",
        authorUsername: "mika",
        createdAt: "2026-04-30T08:40:00Z"
      }
    ],
    discussionNote: "Private event chat stays live here so access details and follow-up questions remain inside the invited group without turning into a public thread.",
    discussion: []
  }
};
const eventParticipationById = {
  "event-tool-audit": {
    goingUserIds: ["viewer-1", "user-tool", "user-rowan"],
    invitedUserIds: ["user-mika"]
  },
  "event-retrofit-walk": {
    goingUserIds: ["user-mika", "user-rowan"],
    invitedUserIds: ["viewer-1", "user-ember"]
  }
};
const eventGoingSinceById = Object.fromEntries(
  Object.entries(eventParticipationById).map(([eventId, participation]) => [
    eventId,
    Object.fromEntries(participation.goingUserIds.map((userId) => [userId, "2026-01-01T00:00:00Z"]))
  ])
);
const eventInvitedSinceById = Object.fromEntries(
  Object.entries(eventParticipationById).map(([eventId, participation]) => [
    eventId,
    Object.fromEntries(participation.invitedUserIds.map((userId) => [userId, "2026-01-01T00:00:00Z"]))
  ])
);
const voteState = /* @__PURE__ */ new Map();
const confidenceState = /* @__PURE__ */ new Map();
function seedVoteTarget(id, voteCount, activeVote) {
  voteState.set(id, { voteCount, activeVote });
}
function createSyntheticConfidenceVoterId(targetId, direction, index) {
  return `confidence-voter-${targetId}-${direction}-${index}`;
}
function setSyntheticConfidenceVoterLastActiveAt(userId, lastActiveAt) {
  syntheticConfidenceVoteLastActiveAtByUserId[userId] = lastActiveAt;
}
function lastConfidenceVoterActionAt(userId) {
  return lastMeaningfulActionAtByUserId[userId] ?? syntheticConfidenceVoteLastActiveAtByUserId[userId] ?? null;
}
function isConfidenceVoteCounted(userId) {
  const lastActionAt = lastConfidenceVoterActionAt(userId);
  if (!lastActionAt) {
    return false;
  }
  return Date.now() - new Date(lastActionAt).getTime() < BOARD_STANDING_VOTE_CLEAR_WINDOW_MS;
}
function setConfidenceVotes(targetId, votesByUserId) {
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
function seedConfidenceTarget(id, upVotes, downVotes, activeVote) {
  const votesByUserId = {};
  let remainingUpVotes = upVotes;
  let remainingDownVotes = downVotes;
  if (activeVote === 1) {
    votesByUserId["viewer-1"] = 1;
    remainingUpVotes = Math.max(0, remainingUpVotes - 1);
  } else if (activeVote === -1) {
    votesByUserId["viewer-1"] = -1;
    remainingDownVotes = Math.max(0, remainingDownVotes - 1);
  }
  for (let index = 0; index < remainingUpVotes; index += 1) {
    const voterId = createSyntheticConfidenceVoterId(id, "yes", index);
    votesByUserId[voterId] = 1;
    setSyntheticConfidenceVoterLastActiveAt(voterId, isoDaysAgo(30));
  }
  for (let index = 0; index < remainingDownVotes; index += 1) {
    const voterId = createSyntheticConfidenceVoterId(id, "no", index);
    votesByUserId[voterId] = -1;
    setSyntheticConfidenceVoterLastActiveAt(voterId, isoDaysAgo(30));
  }
  setConfidenceVotes(id, votesByUserId);
}
function seedBoardConfidenceTarget(id, seed) {
  const votesByUserId = {};
  for (const userId of seed.activeYesUserIds) {
    votesByUserId[userId] = 1;
  }
  for (const userId of seed.activeNoUserIds) {
    votesByUserId[userId] = -1;
  }
  for (let index = 0; index < seed.archivedYesCount; index += 1) {
    const voterId = createSyntheticConfidenceVoterId(id, "yes-archived", index);
    votesByUserId[voterId] = 1;
    setSyntheticConfidenceVoterLastActiveAt(voterId, isoDaysAgo(140));
  }
  for (let index = 0; index < seed.archivedNoCount; index += 1) {
    const voterId = createSyntheticConfidenceVoterId(id, "no-archived", index);
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
const scopeConfidenceSeeds = {
  "confidence-channel-housing-build-user-mika": { upVotes: 18, downVotes: 4, activeVote: 0 },
  "confidence-channel-housing-build-user-ember": { upVotes: 15, downVotes: 5, activeVote: 1 },
  "confidence-channel-mutual-aid-user-tool": { upVotes: 20, downVotes: 6, activeVote: 0 },
  "confidence-channel-mutual-aid-viewer-1": { upVotes: 16, downVotes: 4, activeVote: 1 },
  "confidence-community-east-market-user-mika": { upVotes: 19, downVotes: 4, activeVote: 0 },
  "confidence-community-east-market-user-ember": { upVotes: 14, downVotes: 5, activeVote: 0 },
  "confidence-community-tool-library-user-tool": { upVotes: 17, downVotes: 4, activeVote: 1 },
  "confidence-community-tool-library-user-rowan": { upVotes: 15, downVotes: 5, activeVote: 0 },
  "confidence-stewardship-user-mika": { upVotes: 21, downVotes: 5, activeVote: 1 },
  "confidence-stewardship-user-ember": { upVotes: 17, downVotes: 6, activeVote: 0 }
};
const projectManagerConfidenceSeeds = {
  "confidence-project-manager-neighborhood-heat-pump-pilot-user-rowan": {
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
seedBoardConfidenceTarget(ensurePlatformBoardConfidenceTargetId("user-mika"), {
  activeYesUserIds: ["viewer-1", "user-rowan", "user-tool", "user-mika"],
  activeNoUserIds: ["user-ember"],
  archivedYesCount: 17,
  archivedNoCount: 4
});
seedBoardConfidenceTarget(ensurePlatformBoardConfidenceTargetId("user-ember"), {
  activeYesUserIds: ["viewer-1", "user-rowan", "user-ember"],
  activeNoUserIds: ["user-tool"],
  archivedYesCount: 14,
  archivedNoCount: 5
});
seedBoardConfidenceTarget(ensurePlatformBoardConfidenceTargetId("user-rowan"), {
  activeYesUserIds: ["viewer-1", "user-tool"],
  activeNoUserIds: ["user-mika"],
  archivedYesCount: 6,
  archivedNoCount: 2
});
const commentsBySubjectId = {
  "project-heat-pump": [
    {
      id: "comment-project-heat-pump-1",
      authorUsername: "rowanloop",
      body: "Keep the first pilot on one side of the block so we can finish a real round instead of spreading people thin.",
      createdAt: "2026-04-30T07:42:00Z",
      voteCount: 16,
      activeVote: 0,
      replies: [
        {
          id: "comment-project-heat-pump-1a",
          authorUsername: "patchbay",
          body: "Agreed. I would rather finish one building cleanly than half-scope three at once.",
          createdAt: "2026-04-30T08:04:00Z",
          voteCount: 9,
          activeVote: 1,
          replies: []
        }
      ]
    },
    {
      id: "comment-project-heat-pump-2",
      authorUsername: "mika",
      body: "I added a shorter vendor questionnaire so people can compare answers without reading three separate threads.",
      createdAt: "2026-04-29T18:16:00Z",
      voteCount: 7,
      activeVote: 0,
      replies: []
    }
  ],
  "project-release-governance": [
    {
      id: "comment-project-release-1",
      authorUsername: "quietember",
      body: "The release note should link to the exact work surfaces instead of trying to summarize every change in prose.",
      createdAt: "2026-04-30T10:18:00Z",
      voteCount: 6,
      activeVote: 0,
      replies: [
        {
          id: "comment-project-release-1a",
          authorUsername: "patchbay",
          body: "Yes. Short note on top, detailed links underneath, and the rest can stay in the project tabs.",
          createdAt: "2026-04-30T10:31:00Z",
          voteCount: 5,
          activeVote: 0,
          replies: []
        }
      ]
    }
  ],
  "thread-shared-laundry": [
    {
      id: "comment-thread-shared-1",
      authorUsername: "patchbay",
      body: "I would start in one building first. Finishing a tight round gives us clearer estimates than scattering labor too early.",
      createdAt: "2026-04-30T08:02:00Z",
      voteCount: 14,
      activeVote: 0,
      replies: [
        {
          id: "comment-thread-shared-1a",
          authorUsername: "rowanloop",
          body: "That also keeps the parts list honest. We only learn the gaps once one room is actually finished.",
          createdAt: "2026-04-30T08:18:00Z",
          voteCount: 8,
          activeVote: 0,
          replies: [
            {
              id: "comment-thread-shared-1b",
              authorUsername: "toolorbit",
              body: "If the first room is tight enough, I can bring the charger bench and spare kits without turning the night into a full inventory move.",
              createdAt: "2026-04-30T08:36:00Z",
              voteCount: 5,
              activeVote: 0,
              replies: []
            }
          ]
        }
      ]
    },
    {
      id: "comment-thread-shared-2",
      authorUsername: "mika",
      body: "We should post the one-building option and the wider-block option side by side so people can compare labor assumptions directly.",
      createdAt: "2026-04-30T10:42:00Z",
      voteCount: 4,
      activeVote: 0,
      replies: []
    }
  ],
  "thread-release-notes": [
    {
      id: "comment-thread-release-1",
      authorUsername: "patchbay",
      body: "A short weekly note is enough if it links outward. The note should orient people, not replace the actual work surfaces.",
      createdAt: "2026-04-30T11:05:00Z",
      voteCount: 6,
      activeVote: 0,
      replies: []
    }
  ],
  "event-tool-audit": [
    {
      id: "comment-event-audit-1",
      authorUsername: "toolorbit",
      body: "Bring a snack if you can. We are saving one table for swaps, repair stories, and summer signups.",
      createdAt: "2026-04-29T20:32:00Z",
      voteCount: 5,
      activeVote: 0,
      replies: [
        {
          id: "comment-event-audit-1a",
          authorUsername: "patchbay",
          body: "I can bring tea and a folding card for the swap table.",
          createdAt: "2026-04-29T20:41:00Z",
          voteCount: 3,
          activeVote: 0,
          replies: []
        }
      ]
    }
  ],
  "event-retrofit-walk": [
    {
      id: "comment-event-walk-1",
      authorUsername: "mika",
      body: "This one stays private because two buildings only want the walkthrough if the first note pass stays within the invite list.",
      createdAt: "2026-04-30T08:52:00Z",
      voteCount: 2,
      activeVote: 0,
      replies: []
    }
  ],
  "post-spare-filters": [
    {
      id: "comment-post-filters-1",
      authorUsername: "rowanloop",
      body: "I can take two of them for the Saturday walkthrough if nobody needs them earlier in the week.",
      createdAt: "2026-04-30T08:24:00Z",
      voteCount: 5,
      activeVote: 0,
      replies: [
        {
          id: "comment-post-filters-1a",
          authorUsername: "patchbay",
          body: "That works. I will bring the rest in case the first building wants to swap all six at once.",
          createdAt: "2026-04-30T08:41:00Z",
          voteCount: 3,
          activeVote: 0,
          replies: []
        }
      ]
    },
    {
      id: "comment-post-filters-2",
      authorUsername: "toolorbit",
      body: "If there are extras after Saturday, keep two at the tool library intake desk so people stop improvising with mismatched sizes.",
      createdAt: "2026-04-30T09:02:00Z",
      voteCount: 4,
      activeVote: 0,
      replies: []
    }
  ],
  "post-rowan-checklist": [
    {
      id: "comment-post-checklist-1",
      authorUsername: "patchbay",
      body: "The shorter list is much better. People can actually scan it while carrying tools now.",
      createdAt: "2026-04-29T18:49:00Z",
      voteCount: 4,
      activeVote: 0,
      replies: []
    },
    {
      id: "comment-post-checklist-2",
      authorUsername: "mika",
      body: "Can you pin the breaker note near the top so nobody misses it on mobile?",
      createdAt: "2026-04-29T19:04:00Z",
      voteCount: 2,
      activeVote: 0,
      replies: []
    }
  ],
  "post-mika-brief": [
    {
      id: "comment-post-brief-1",
      authorUsername: "quietember",
      body: "Short note on top and linked work surfaces underneath would make the release rhythm much easier to follow.",
      createdAt: "2026-04-29T15:26:00Z",
      voteCount: 3,
      activeVote: 0,
      replies: []
    }
  ]
};
const contentReportsByTargetId = {};
function seedCommentVotes(comments) {
  for (const comment of comments) {
    seedVoteTarget(comment.id, comment.voteCount, comment.activeVote);
    seedCommentVotes(comment.replies);
  }
}
for (const comments of Object.values(commentsBySubjectId)) {
  seedCommentVotes(comments);
}
const notificationsState = currentViewer() ? [
  {
    id: "notification-post-filters",
    kind: "reply",
    surface: "personal",
    subjectKind: "post",
    actorUsername: "rowanloop",
    actionLabel: "replied to your post",
    title: "",
    body: "I can take two of them for the Saturday walkthrough if nobody needs them earlier in the week.",
    href: buildCommentHref("/posts/post-spare-filters", "comment-post-filters-1"),
    createdAt: "2026-04-30T08:24:00Z",
    isUnread: true,
    channelTags: [],
    communityTags: []
  },
  {
    id: "notification-project-heat-pump",
    kind: "project",
    surface: "public",
    subjectKind: "project",
    projectMode: "productive",
    actorUsername: "patchbay",
    actionLabel: "updated",
    title: "Neighborhood Heat Pump Pilot",
    body: "The first site walk is now pinned and the vendor questions were condensed into one checklist.",
    href: buildUpdateHref("/projects/neighborhood-heat-pump-pilot", "project-update-heat-pump-1"),
    createdAt: "2026-04-30T09:25:00Z",
    isUnread: true,
    channelTags: [housingBuild],
    communityTags: [eastMarket]
  },
  {
    id: "notification-project-release",
    kind: "project",
    surface: "public",
    subjectKind: "project",
    projectMode: "collective-service",
    actorUsername: "mika",
    actionLabel: "updated",
    title: "Platform Release Governance Round",
    body: "The accessibility pass is queued and the release note draft now points to the live work tabs.",
    href: buildUpdateHref("/projects/platform-release-governance-round", "project-update-release-1"),
    createdAt: "2026-04-30T10:10:00Z",
    isUnread: true,
    channelTags: [platform],
    communityTags: []
  },
  {
    id: "notification-event-audit",
    kind: "event",
    surface: "public",
    subjectKind: "event",
    actorUsername: "toolorbit",
    actionLabel: "updated",
    title: "Tool Library Spring Swap Social",
    body: "You joined the event, and toolorbit confirmed the snack table and swap table are set.",
    href: "/events/tool-library-spring-swap-social",
    createdAt: "2026-04-29T21:10:00Z",
    isUnread: false,
    channelTags: [mutualAid],
    communityTags: [toolLibrary]
  },
  {
    id: "notification-event-walk",
    kind: "event",
    surface: "public",
    subjectKind: "event",
    actorUsername: "mika",
    actionLabel: "invited",
    title: "Retrofit Night Walk",
    body: "mika added you to the invite list for the private block walkthrough on Saturday evening.",
    href: "/events/retrofit-night-walk",
    createdAt: "2026-04-30T08:40:00Z",
    isUnread: true,
    channelTags: [housingBuild],
    communityTags: [eastMarket]
  }
] : [];
const readNotificationHrefs = /* @__PURE__ */ new Set();
const sharedNotificationsByUserId = {};
function buildDefaultMessageConversations(viewer) {
  if (viewer.id !== patchbayUser.id) {
    return [];
  }
  return [
    {
      id: "group-laundry-audit",
      kind: "group",
      title: "Laundry Room Audit",
      participants: [
        viewer,
        userById("user-rowan") ?? patchbayUser,
        userById("user-tool") ?? patchbayUser
      ],
      preview: "toolorbit: I can bring the voltage meter and the spare bins.",
      lastMessageAt: "2026-04-30T10:12:00Z",
      unreadCount: 2,
      messages: [
        {
          id: "group-laundry-audit-1",
          sender: userById("user-rowan") ?? patchbayUser,
          body: "Let us keep the final checklist in here instead of scattering it across comments.",
          createdAt: "2026-04-30T09:56:00Z",
          isOwn: false
        },
        {
          id: "group-laundry-audit-2",
          sender: viewer,
          body: "Good. I can fold the parts list and the volunteer timing into one note.",
          createdAt: "2026-04-30T10:04:00Z",
          isOwn: true
        },
        {
          id: "group-laundry-audit-3",
          sender: userById("user-tool") ?? patchbayUser,
          body: "I can bring the voltage meter and the spare bins.",
          createdAt: "2026-04-30T10:12:00Z",
          isOwn: false
        }
      ]
    },
    {
      id: "dm-rowan",
      kind: "direct",
      title: (userById("user-rowan") ?? patchbayUser).username,
      participants: [viewer, userById("user-rowan") ?? patchbayUser],
      preview: "Can you sanity-check the laundry-room parts list before I post it publicly?",
      lastMessageAt: "2026-04-30T09:18:00Z",
      unreadCount: 1,
      messages: [
        {
          id: "dm-rowan-1",
          sender: userById("user-rowan") ?? patchbayUser,
          body: "Can you sanity-check the laundry-room parts list before I post it publicly?",
          createdAt: "2026-04-30T09:12:00Z",
          isOwn: false
        },
        {
          id: "dm-rowan-2",
          sender: viewer,
          body: "Yes. I can check the item names and the rough labor notes before noon.",
          createdAt: "2026-04-30T09:18:00Z",
          isOwn: true
        }
      ]
    },
    {
      id: "dm-toolorbit",
      kind: "direct",
      title: (userById("user-tool") ?? patchbayUser).username,
      participants: [viewer, userById("user-tool") ?? patchbayUser],
      preview: "Audit night still needs one more person on chargers.",
      lastMessageAt: "2026-04-29T21:04:00Z",
      unreadCount: 0,
      messages: [
        {
          id: "dm-toolorbit-1",
          sender: userById("user-tool") ?? patchbayUser,
          body: "Audit night still needs one more person on chargers.",
          createdAt: "2026-04-29T20:58:00Z",
          isOwn: false
        },
        {
          id: "dm-toolorbit-2",
          sender: viewer,
          body: "I can cover chargers if the intake desk is already staffed.",
          createdAt: "2026-04-29T21:04:00Z",
          isOwn: true
        }
      ]
    }
  ];
}
const messageConversationsByUserId = currentViewer() ? {
  [activeViewer().id]: buildDefaultMessageConversations(activeViewer())
} : {};
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
function messageConversationsStateForUser(userId) {
  const existing = messageConversationsByUserId[userId];
  if (existing) {
    return existing;
  }
  const viewer = userById(userId);
  if (!viewer) {
    return [];
  }
  const created = buildDefaultMessageConversations(viewer);
  messageConversationsByUserId[userId] = created;
  return created;
}
function buildSuggestedMessageContacts(viewerId) {
  const viewer = userById(viewerId);
  const conversations = messageConversationsByUserId[viewerId] ?? (viewer ? buildDefaultMessageConversations(viewer) : []);
  const relatedIds = /* @__PURE__ */ new Set([...followingIdsFor(viewerId), ...followerIdsFor(viewerId)]);
  for (const conversation of conversations) {
    for (const participant of conversation.participants) {
      relatedIds.add(participant.id);
    }
  }
  relatedIds.delete(viewerId);
  return Array.from(relatedIds).map((userId) => userById(userId)).filter((user) => !!user).sort((left, right) => left.username.localeCompare(right.username));
}
function buildShareContacts() {
  const viewer = currentViewer();
  return viewer ? buildSuggestedMessageContacts(viewer.id).map((contact) => toDetailMember(contact.id)) : [];
}
function scopeLabelsForViewer(item, viewerId) {
  const labels = /* @__PURE__ */ new Set();
  for (const tag of item.channelTags) {
    if (tag.slug === platform.slug) {
      if (readScopeMembership("platform", platform.slug).memberIds.includes(viewerId)) {
        labels.add(tag.label);
      }
      continue;
    }
    if (readScopeMembership("channel", tag.slug).memberIds.includes(viewerId)) {
      labels.add(tag.label);
    }
  }
  for (const tag of item.communityTags) {
    if (readScopeMembership("community", tag.slug).memberIds.includes(viewerId)) {
      labels.add(tag.label);
    }
  }
  return Array.from(labels);
}
function viewerHasEventScopeAccess(item, viewerId) {
  return scopeLabelsForViewer(item, viewerId).length > 0;
}
function okShareTargetResult() {
  return { ok: true };
}
function errorShareTargetResult(error) {
  return {
    ok: false,
    error
  };
}
function pushUserNotification(userId, notification) {
  const existing = sharedNotificationsByUserId[userId] ?? [];
  sharedNotificationsByUserId[userId] = [notification, ...existing];
}
function moveConversationListItemToFront(conversations, conversationId) {
  const conversationIndex = conversations.findIndex((item) => item.id === conversationId);
  if (conversationIndex <= 0) {
    return;
  }
  const [conversation] = conversations.splice(conversationIndex, 1);
  conversations.unshift(conversation);
}
function moveMessageConversationToFront(conversationId) {
  moveConversationListItemToFront(currentMessageConversationsState(), conversationId);
}
function moveMessageConversationToFrontForUser(userId, conversationId) {
  moveConversationListItemToFront(messageConversationsStateForUser(userId), conversationId);
}
function ensureDirectConversationForUser(userId, participantId) {
  const viewer = userById(userId);
  const participant = userById(participantId);
  if (!viewer || !participant) {
    return null;
  }
  const conversations = messageConversationsStateForUser(userId);
  let conversation = conversations.find(
    (item) => item.kind === "direct" && item.participants.some((member) => member.id === participantId)
  );
  if (!conversation) {
    conversation = {
      id: `dm-${viewer.username}-${participant.username}`,
      kind: "direct",
      title: participant.username,
      participants: [viewer, participant],
      preview: "",
      lastMessageAt: "",
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
function appendDirectMessageForUsers(senderId, recipientId, body) {
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
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
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
function formatMetaFromTags(tags) {
  return tags.map((tag) => tag.label).join(" · ");
}
function readConfidenceTarget(targetId) {
  return confidenceState.get(targetId) ?? null;
}
function ensurePlatformBoardConfidenceTargetId(userId) {
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
  return readScopeMembership("platform", platform.slug).memberIds;
}
function platformBoardConfidenceTargetUserId(targetId) {
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
function isPlatformBoardConfidenceTarget(targetId) {
  return platformBoardConfidenceTargetUserId(targetId) !== null;
}
function buildConfidenceVoteSnapshot(confidenceTargetId) {
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
function buildBoardStandingFields(confidenceTargetId) {
  const snapshot = buildConfidenceVoteSnapshot(confidenceTargetId);
  const reviewCount = snapshot?.reviewCount;
  const confidenceRatio = snapshot && reviewCount ? Math.round(snapshot.upVotes / reviewCount * 100) : void 0;
  const boardUserId = confidenceTargetId ? platformBoardConfidenceTargetUserId(confidenceTargetId) : null;
  if (!confidenceTargetId || !boardUserId || !isPlatformBoardConfidenceTarget(confidenceTargetId) || reviewCount === void 0 || confidenceRatio === void 0) {
    return {
      confidenceVotesRequired: void 0,
      confidenceWeeklyActiveUserCount: void 0,
      confidenceStandingState: void 0,
      confidenceGraceEndsAt: void 0
    };
  }
  const confidenceWeeklyActiveUserCount = platformWeeklyActiveUserCount();
  const confidenceVotesRequired = calculateRequiredVotes(confidenceWeeklyActiveUserCount);
  if (reviewCount >= confidenceVotesRequired && confidenceRatio >= GOVERNANCE_APPROVAL_THRESHOLD_PERCENT) {
    activePlatformBoardUserIds.add(boardUserId);
    delete boardStandingGraceStartedAtByTargetId[confidenceTargetId];
    return {
      confidenceVotesRequired,
      confidenceWeeklyActiveUserCount,
      confidenceStandingState: "active",
      confidenceGraceEndsAt: void 0
    };
  }
  if (activePlatformBoardUserIds.has(boardUserId) && confidenceRatio >= GOVERNANCE_APPROVAL_THRESHOLD_PERCENT && reviewCount > 0) {
    const graceStartedAt = boardStandingGraceStartedAtByTargetId[confidenceTargetId] ?? (boardStandingGraceStartedAtByTargetId[confidenceTargetId] = (/* @__PURE__ */ new Date()).toISOString());
    const confidenceGraceEndsAt = new Date(
      new Date(graceStartedAt).getTime() + BOARD_GRACE_WINDOW_MS
    ).toISOString();
    if (new Date(confidenceGraceEndsAt).getTime() > Date.now()) {
      return {
        confidenceVotesRequired,
        confidenceWeeklyActiveUserCount,
        confidenceStandingState: "grace",
        confidenceGraceEndsAt
      };
    }
  }
  activePlatformBoardUserIds.delete(boardUserId);
  delete boardStandingGraceStartedAtByTargetId[confidenceTargetId];
  return {
    confidenceVotesRequired,
    confidenceWeeklyActiveUserCount,
    confidenceStandingState: "below-threshold",
    confidenceGraceEndsAt: void 0
  };
}
function buildConfidenceFields(confidenceTargetId) {
  const snapshot = buildConfidenceVoteSnapshot(confidenceTargetId);
  const reviewCount = snapshot?.reviewCount;
  const confidenceRatio = snapshot && reviewCount ? Math.round(snapshot.upVotes / reviewCount * 100) : void 0;
  return {
    confidenceTargetId,
    confidenceVoteCount: snapshot ? snapshot.upVotes - snapshot.downVotes : void 0,
    confidenceActiveVote: snapshot?.activeVote,
    confidenceUpVotes: snapshot?.upVotes,
    confidenceDownVotes: snapshot?.downVotes,
    confidenceRatio,
    confidenceReviewCount: reviewCount,
    ...buildBoardStandingFields(confidenceTargetId)
  };
}
function toScopeMember(userId, confidenceTargetId) {
  const user = userById(userId) ?? patchbayUser;
  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    ...buildConfidenceFields(confidenceTargetId)
  };
}
function createDefaultScopeMeta(kind, description, joinPolicy) {
  const isChannel = kind === "channel";
  return {
    description,
    note: !isChannel && joinPolicy === "invite_only" ? "This community is invite-only right now, so only members can see the feed." : void 0,
    badges: isChannel ? ["Topic channel"] : [joinPolicy === "invite_only" ? "Invite-only community" : "Open community"],
    emptyFeedText: isChannel ? "No content matches this channel right now." : "No content matches this community right now."
  };
}
function buildPlatformBoardRoster() {
  const activeMembers = [];
  const candidates = [];
  for (const userId of platformBoardMemberUserIds()) {
    const member = toScopeMember(userId, ensurePlatformBoardConfidenceTargetId(userId));
    if (member.confidenceStandingState === "active" || member.confidenceStandingState === "grace") {
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
function toDetailMember(userId) {
  const user = userById(userId) ?? patchbayUser;
  return {
    id: user.id,
    username: user.username,
    bio: user.bio
  };
}
function toProjectRoleMember(userId, confidenceTargetId, isManagerCandidate = false) {
  const user = userById(userId) ?? patchbayUser;
  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    isManagerCandidate,
    ...buildConfidenceFields(confidenceTargetId)
  };
}
function buildCommentHref(href, commentId) {
  const url = new URL(href, "https://socialproduction.local");
  if (url.pathname.startsWith("/projects/") || url.pathname.startsWith("/events/")) {
    url.searchParams.set("tab", "chat");
    url.searchParams.set("comment", commentId);
    url.hash = "";
    return `${url.pathname}${url.search}`;
  }
  url.searchParams.set("comment", commentId);
  url.hash = `comment-${commentId}`;
  return `${url.pathname}${url.search}${url.hash}`;
}
function buildUpdateHref(href, updateId) {
  return `${href}?update=${updateId}#update-${updateId}`;
}
function latestProjectUpdateForSlug(slug) {
  return projectDetailExtras[slug]?.updates[0] ?? null;
}
function latestEventUpdateForSlug(slug) {
  return eventDetailExtras[slug]?.updates[0] ?? null;
}
function newestTimestamp(...values) {
  let latest = null;
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
function latestCommentTimestamp(comments) {
  return comments.reduce((latest, comment) => {
    const nestedLatest = latestCommentTimestamp(comment.replies);
    return newestTimestamp(latest, comment.createdAt, nestedLatest);
  }, null);
}
function latestComment(comments) {
  let latestCommentItem = null;
  let latestTime = Number.NEGATIVE_INFINITY;
  const visit = (items) => {
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
function summarizeChatPreview(text, authorUsername) {
  const normalized = text.trim();
  const prefixed = authorUsername ? `${authorUsername}: ${normalized}` : normalized;
  if (prefixed.length <= 96) {
    return prefixed;
  }
  return `${prefixed.slice(0, 93).trimEnd()}...`;
}
function buildLinkedChats(viewer) {
  const publicFeed = buildPublicFeedFixture();
  const projectChats = publicFeed.filter((item) => item.kind === "project").filter((item) => (projectMembersBySlug[item.slug] ?? []).includes(viewer.id)).map((item) => {
    const rawComments = commentsBySubjectId[item.id] ?? [];
    const latestCommentItem = latestComment(rawComments);
    const lastMessageAt = newestTimestamp(latestCommentTimestamp(rawComments), item.lastActivityAt, item.createdAt) ?? item.createdAt;
    return {
      id: `linked-project-chat-${item.slug}`,
      kind: "project",
      subjectId: item.id,
      title: item.title,
      href: item.href,
      meta: `${item.stage} · ${item.locationLabel}`,
      preview: latestCommentItem ? summarizeChatPreview(latestCommentItem.body, latestCommentItem.authorUsername) : "No messages yet.",
      lastMessageAt,
      comments: mapCommentsWithReports(rawComments)
    };
  });
  const eventChats = publicFeed.filter((item) => item.kind === "event").filter((item) => {
    const participation = eventParticipationById[item.id] ?? { goingUserIds: [], invitedUserIds: [] };
    const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
    return creatorId === viewer.id || participation.goingUserIds.includes(viewer.id) || participation.invitedUserIds.includes(viewer.id);
  }).map((item) => {
    const rawComments = commentsBySubjectId[item.id] ?? [];
    const latestCommentItem = latestComment(rawComments);
    const lastMessageAt = newestTimestamp(latestCommentTimestamp(rawComments), item.lastActivityAt, item.createdAt) ?? item.createdAt;
    return {
      id: `linked-event-chat-${item.slug}`,
      kind: "event",
      subjectId: item.id,
      title: item.title,
      href: item.href,
      meta: `${item.locationLabel} · ${item.timeLabel}`,
      preview: latestCommentItem ? summarizeChatPreview(latestCommentItem.body, latestCommentItem.authorUsername) : "No messages yet.",
      lastMessageAt,
      comments: mapCommentsWithReports(rawComments)
    };
  });
  return [...projectChats, ...eventChats].sort(
    (left, right) => +new Date(right.lastMessageAt) - +new Date(left.lastMessageAt)
  );
}
function countComments(comments) {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}
function uniqueUserIds(userIds) {
  return Array.from(new Set(userIds.filter((userId) => !!userId)));
}
function collectCommentAuthorIds(comments) {
  return comments.flatMap((comment) => {
    const authorId = userByUsername(comment.authorUsername)?.id;
    return authorId ? [authorId, ...collectCommentAuthorIds(comment.replies)] : collectCommentAuthorIds(comment.replies);
  });
}
function userCanSeePersonalFeedForViewer(viewerUserId, profileUserId) {
  const profileSettings = settingsForUser(profileUserId);
  if (!profileSettings?.hidePersonalFeedFromNonFollowers) {
    return true;
  }
  return viewerUserId === profileUserId || followingIdsFor(viewerUserId).includes(profileUserId);
}
function userCanSeeFollowersPostsForViewer(viewerUserId, profileUserId) {
  return userCanSeePersonalFeedForViewer(viewerUserId, profileUserId) && (viewerUserId === profileUserId || followingIdsFor(viewerUserId).includes(profileUserId));
}
function findRawPublicFeedItemById(subjectId) {
  return publicFeedBase.find((item) => item.id === subjectId) ?? null;
}
function findRawSocialPostById(subjectId) {
  return socialPostsBase.find((item) => item.id === subjectId) ?? null;
}
function resolveSubjectAuthorUserId(subjectId) {
  const publicItem = findRawPublicFeedItemById(subjectId);
  if (publicItem) {
    return publicItem.kind === "event" ? userByUsername(publicItem.createdByUsername)?.id ?? null : userByUsername(publicItem.authorUsername)?.id ?? null;
  }
  return findRawSocialPostById(subjectId)?.author.id ?? null;
}
function buildDiscussionEligibleVoterIds(subjectId, excludedUserId) {
  const publicItem = findRawPublicFeedItemById(subjectId);
  if (publicItem?.kind === "thread") {
    return users.map((user) => user.id).filter((userId) => userId !== excludedUserId);
  }
  const socialPost = findRawSocialPostById(subjectId);
  if (socialPost) {
    return users.filter(
      (user) => socialPost.audience === "followers" ? userCanSeeFollowersPostsForViewer(user.id, socialPost.author.id) : userCanSeePersonalFeedForViewer(user.id, socialPost.author.id)
    ).map((user) => user.id).filter((userId) => userId !== excludedUserId);
  }
  return uniqueUserIds([
    ...collectCommentAuthorIds(commentsBySubjectId[subjectId] ?? []),
    currentViewer()?.id ?? null
  ]).filter((userId) => userId !== excludedUserId);
}
function buildEligibleVoterIdsForSubject(subjectId, excludedUserId) {
  const publicItem = findRawPublicFeedItemById(subjectId);
  if (publicItem?.kind === "project") {
    const memberState = buildProjectMemberState(publicItem.slug);
    return uniqueUserIds([
      ...memberState.projectManagers.map((member) => member.id),
      ...memberState.members.map((member) => member.id)
    ]).filter((userId) => userId !== excludedUserId);
  }
  if (publicItem?.kind === "event") {
    const memberState = buildEventMemberState(publicItem);
    return uniqueUserIds([
      ...memberState.eventEditors.map((member) => member.id),
      ...memberState.members.map((member) => member.id)
    ]).filter((userId) => userId !== excludedUserId);
  }
  return buildDiscussionEligibleVoterIds(subjectId, excludedUserId);
}
function findConversationForReportSubject(subjectId) {
  return currentMessageConversationsState().find((conversation) => conversation.id === subjectId) ?? null;
}
function resolveReportTargetContext(subjectId, targetId) {
  const conversation = findConversationForReportSubject(subjectId);
  if (conversation) {
    const message = conversation.messages.find((entry) => entry.id === targetId);
    if (message) {
      return {
        targetKind: conversation.kind === "direct" ? "direct-message" : "group-message",
        authorUserId: message.sender.id,
        eligibleUserIds: uniqueUserIds(conversation.participants.map((participant) => participant.id)).filter(
          (userId) => userId !== message.sender.id
        )
      };
    }
  }
  const comment = findCommentById(commentsBySubjectId[subjectId] ?? [], targetId);
  if (comment) {
    const authorUserId2 = userByUsername(comment.authorUsername)?.id ?? null;
    return {
      targetKind: "comment",
      authorUserId: authorUserId2,
      eligibleUserIds: buildEligibleVoterIdsForSubject(subjectId, authorUserId2)
    };
  }
  const authorUserId = resolveSubjectAuthorUserId(targetId);
  if (targetId === subjectId && (findRawPublicFeedItemById(targetId) || findRawSocialPostById(targetId))) {
    return {
      targetKind: "subject",
      authorUserId,
      eligibleUserIds: buildEligibleVoterIdsForSubject(subjectId, authorUserId)
    };
  }
  return null;
}
function reportAgeMs(createdAt) {
  if (!createdAt) {
    return 0;
  }
  const parsed = new Date(createdAt).getTime();
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.max(Date.now() - parsed, 0);
}
function spamAgeRatioBoost(ageMs) {
  const dayMs = 24 * 60 * 60 * 1e3;
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
function spamEngagementRatioBoost(engagementScore) {
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
function reportSpamSignals(report) {
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
function reportVotesRequired(report) {
  const eligibleCount = Math.max(report.eligibleUserIds.length, 1);
  if (report.reason === "serious-harm") {
    return Math.max(1, Math.ceil(eligibleCount * 0.5));
  }
  const { createdAt, engagementScore } = reportSpamSignals(report);
  const requiredRatio = Math.min(
    0.95,
    0.5 + spamAgeRatioBoost(reportAgeMs(createdAt)) + spamEngagementRatioBoost(engagementScore)
  );
  return Math.max(1, Math.min(eligibleCount, Math.ceil(eligibleCount * requiredRatio)));
}
function reportVoteCounts(report) {
  const votes = Object.values(report.votesByUserId);
  return {
    yesCount: votes.filter((vote) => vote === "yes").length,
    noCount: votes.filter((vote) => vote === "no").length
  };
}
function reportRemainingVotes(report) {
  const { yesCount, noCount } = reportVoteCounts(report);
  return Math.max(report.eligibleUserIds.length - yesCount - noCount, 0);
}
function reportIsApproved(report) {
  const { yesCount, noCount } = reportVoteCounts(report);
  return yesCount >= reportVotesRequired(report) && yesCount > noCount;
}
function reportCanStillPass(report) {
  const { yesCount, noCount } = reportVoteCounts(report);
  const maxPossibleYes = yesCount + reportRemainingVotes(report);
  return maxPossibleYes >= reportVotesRequired(report) && maxPossibleYes > noCount;
}
function updateConversationAfterMessageRemoval(conversation) {
  const latestMessage = conversation.messages[conversation.messages.length - 1] ?? null;
  conversation.preview = latestMessage ? summarizeChatPreview(
    latestMessage.body,
    conversation.kind === "group" ? latestMessage.sender.username : void 0
  ) : "No messages yet.";
  conversation.lastMessageAt = latestMessage?.createdAt ?? "";
  conversation.unreadCount = Math.min(conversation.unreadCount, conversation.messages.length);
}
function removeMessageFromConversations(targetId) {
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
function removeCommentById(comments, commentId) {
  const commentIndex = comments.findIndex((comment) => comment.id === commentId);
  if (commentIndex !== -1) {
    comments.splice(commentIndex, 1);
    return true;
  }
  return comments.some((comment) => removeCommentById(comment.replies, commentId));
}
function reconcileContentReport(report) {
  if (!reportIsApproved(report)) {
    report.resolution = "open";
    if (!reportCanStillPass(report)) {
      delete contentReportsByTargetId[report.targetId];
    }
    return;
  }
  if (report.targetKind === "subject") {
    report.resolution = "open";
    return;
  }
  if (report.targetKind === "group-message" || report.reason === "serious-harm") {
    report.resolution = "hidden";
    return;
  }
  report.resolution = "removed";
  if (report.targetKind === "comment") {
    removeCommentById(commentsBySubjectId[report.subjectId] ?? [], report.targetId);
  }
}
function buildContentReportSummary(targetId) {
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
function mapCommentsWithReports(comments) {
  return comments.map((comment) => ({
    ...comment,
    report: buildContentReportSummary(comment.id),
    replies: mapCommentsWithReports(comment.replies)
  }));
}
function conversationWithReports(conversation) {
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
function readVoteTarget(id, fallbackCount, fallbackVote) {
  return voteState.get(id) ?? {
    voteCount: fallbackCount,
    activeVote: fallbackVote
  };
}
function projectFundProgressForSlug(slug) {
  if (projectLifecycleBySlug[slug]?.currentPhaseId !== "phase-4") {
    return void 0;
  }
  const fund = platformAssetsFixture.funds.find((entry) => entry.projectHref === `/projects/${slug}`);
  if (!fund) {
    return void 0;
  }
  return {
    title: fund.title,
    progressPercent: fund.progressPercent,
    raisedLabel: fund.raisedLabel,
    targetLabel: fund.targetLabel,
    status: fund.status
  };
}
function buildPublicFeedFixture() {
  return publicFeedBase.map((item) => {
    const vote = readVoteTarget(item.id, item.voteCount, item.activeVote);
    const commentCount = countComments(commentsBySubjectId[item.id] ?? []);
    if (item.kind === "project") {
      const overview = projectDetailExtras[item.slug]?.overview ?? item.summary;
      const workflow = readProjectWorkflowState(item.slug);
      const latestUpdate = latestProjectUpdateForSlug(item.slug);
      const memberCount = item.projectMode === "personal-service" ? personalServiceFollowerCount(item.slug) : projectMembersBySlug[item.slug]?.length ?? item.memberCount;
      const latestUpdateAt = latestUpdate?.createdAt ?? null;
      const lastActivityAt = newestTimestamp(item.createdAt, item.lastActivityAt, latestUpdateAt) ?? item.lastActivityAt;
      return {
        ...item,
        summary: summarizeProjectCardCopy(overview, 124),
        latestDescription: latestUpdate ? summarizeProjectCardCopy(latestUpdate.body, 92) : void 0,
        stage: stageLabelForProject(item.slug, item.stage, item.projectMode),
        voteCount: vote.voteCount,
        activeVote: vote.activeVote,
        commentCount,
        signalCount: workflow?.signalCount ?? item.signalCount,
        memberCount,
        lastActivityAt,
        fundProgress: projectFundProgressForSlug(item.slug)
      };
    }
    if (item.kind === "event") {
      const participation = eventParticipationById[item.id];
      const latestUpdateAt = latestEventUpdateForSlug(item.slug)?.createdAt ?? null;
      const lastActivityAt = newestTimestamp(item.createdAt, item.lastActivityAt, latestUpdateAt) ?? item.lastActivityAt;
      const effectivePresentation = buildEffectiveEventPresentation(item);
      return {
        ...item,
        ...effectivePresentation,
        voteCount: vote.voteCount,
        activeVote: vote.activeVote,
        commentCount,
        goingCount: participation?.goingUserIds.length ?? item.goingCount,
        lastActivityAt
      };
    }
    return {
      ...item,
      voteCount: vote.voteCount,
      activeVote: vote.activeVote,
      commentCount,
      lastActivityAt: item.createdAt
    };
  });
}
function assetServiceProjectSlug(reference) {
  return reference.id.replace(/^asset-project-/, "");
}
function buildGeneratedProjectDetailExtra(item) {
  const subtypeLabel = item.projectSubtype ? projectSubtypeLabel(item.projectSubtype) : "collective service";
  return {
    overview: item.summary,
    updates: [],
    discussionNote: `This seeded ${subtypeLabel.toLowerCase()} page exists so asset relationships can open a real project surface during the demo.`,
    discussion: []
  };
}
function buildPublicActivityItem(item) {
  const authorUsername = item.kind === "project" ? item.authorUsername : item.kind === "thread" ? item.authorUsername : item.createdByUsername;
  const author = userByUsername(authorUsername) ?? patchbayUser;
  const latestUpdate = item.kind === "project" ? latestProjectUpdateForSlug(item.slug) : item.kind === "event" ? latestEventUpdateForSlug(item.slug) : null;
  const isUpdated = !!latestUpdate && new Date(item.lastActivityAt).getTime() > new Date(item.createdAt).getTime();
  return {
    kind: "activity",
    id: `activity-${item.id}`,
    subjectId: item.id,
    href: isUpdated && latestUpdate ? buildUpdateHref(item.href, latestUpdate.id) : item.href,
    author,
    actionLabel: isUpdated ? "Updated" : "Created",
    subjectKind: item.kind,
    subjectProjectMode: item.kind === "project" ? item.projectMode : void 0,
    title: item.title,
    body: isUpdated && latestUpdate ? latestUpdate.body : item.kind === "project" ? item.summary : item.kind === "thread" ? item.body : item.description,
    meta: item.kind === "project" ? isUpdated && latestUpdate ? latestUpdate.title : `${item.stage} · ${item.locationLabel}` : item.kind === "thread" ? formatMetaFromTags([...item.channelTags, ...item.communityTags]) : isUpdated && latestUpdate ? latestUpdate.title : item.locationLabel,
    voteCount: item.voteCount,
    activeVote: item.activeVote,
    commentCount: item.commentCount,
    createdAt: isUpdated && latestUpdate ? latestUpdate.createdAt : item.createdAt,
    channelTags: item.channelTags,
    communityTags: item.communityTags,
    subjectFundProgress: item.kind === "project" ? item.fundProgress : void 0
  };
}
function findCommentById(comments, commentId) {
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
function buildPublicCommentActivities(publicFeed) {
  const activities = [];
  for (const seed of publicCommentActivitySeeds) {
    const subject = publicFeed.find((item) => item.id === seed.subjectId);
    const comment = findCommentById(commentsBySubjectId[seed.subjectId] ?? [], seed.commentId);
    if (!subject || !comment || subject.kind === "event") {
      continue;
    }
    const author = userByUsername(comment.authorUsername) ?? patchbayUser;
    activities.push({
      kind: "activity",
      id: seed.id,
      subjectId: subject.id,
      href: buildCommentHref(subject.href, comment.id),
      author,
      actionLabel: "Commented on",
      subjectKind: subject.kind,
      title: subject.title,
      body: comment.body,
      meta: subject.kind === "project" ? `${subject.stage} · ${subject.locationLabel}` : formatMetaFromTags([...subject.channelTags, ...subject.communityTags]),
      voteCount: subject.voteCount,
      activeVote: subject.activeVote,
      commentCount: countComments(commentsBySubjectId[seed.subjectId] ?? []),
      createdAt: comment.createdAt,
      channelTags: subject.channelTags,
      communityTags: subject.communityTags
    });
  }
  return activities;
}
function buildSocialPostItem(post) {
  const vote = readVoteTarget(post.voteTargetId, post.voteCount, post.activeVote);
  const commentCount = countComments(commentsBySubjectId[post.id] ?? []);
  return {
    ...post,
    linkedSubjects: post.linkedSubjects ?? detectPostBodyLinks(post.body),
    voteCount: vote.voteCount,
    commentCount
  };
}
function detectPostBodyLinks(body) {
  const normalizedBody = body.toLowerCase();
  const seenLabels = /* @__PURE__ */ new Set();
  return publicFeedBase.filter((item) => item.kind === "project" || item.kind === "event").map((item) => ({
    kind: item.kind,
    label: item.title,
    href: item.href
  })).sort((left, right) => right.label.length - left.label.length).filter((link) => {
    const key = link.label.toLowerCase();
    if (seenLabels.has(key) || !normalizedBody.includes(key)) {
      return false;
    }
    seenLabels.add(key);
    return true;
  });
}
function buildSocialPostsForUser(profileUserId) {
  const canSeePersonalFeed = viewerCanSeePersonalFeed(profileUserId);
  const canSeeFollowersOnly = viewerCanSeeFollowersPosts(profileUserId);
  return socialPostsBase.filter((post) => {
    if (post.author.id !== profileUserId) {
      return false;
    }
    return post.audience === "public" ? canSeePersonalFeed : canSeeFollowersOnly;
  }).map(buildSocialPostItem);
}
function buildProfileFeed(profileUserId) {
  const publicFeed = buildPublicFeedFixture();
  const publicActivities = publicFeed.filter((item) => {
    if (item.kind === "project") {
      return userByUsername(item.authorUsername)?.id === profileUserId;
    }
    if (item.kind === "thread") {
      return userByUsername(item.authorUsername)?.id === profileUserId;
    }
    return userByUsername(item.createdByUsername)?.id === profileUserId;
  }).map(buildPublicActivityItem);
  const commentActivities = buildPublicCommentActivities(publicFeed).filter(
    (item) => item.author.id === profileUserId
  );
  const followerPosts = buildSocialPostsForUser(profileUserId);
  return [...followerPosts, ...publicActivities, ...commentActivities].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
}
function buildPersonalFeedFixture() {
  const viewer = currentViewer();
  if (!viewer) {
    return [];
  }
  const followedIds = /* @__PURE__ */ new Set([viewer.id, ...followingIdsFor(viewer.id)]);
  const publicFeed = buildPublicFeedFixture();
  const publicActivities = publicFeed.filter((item) => {
    const authorId = item.kind === "project" ? userByUsername(item.authorUsername)?.id ?? "" : item.kind === "thread" ? userByUsername(item.authorUsername)?.id ?? "" : userByUsername(item.createdByUsername)?.id ?? "";
    if (!authorId || shouldHidePublicActivityFromPersonalFeeds(authorId)) {
      return false;
    }
    return followedIds.has(authorId);
  }).map((item) => ({
    ...buildPublicActivityItem(item),
    feedSource: "following"
  }));
  const commentActivities = buildPublicCommentActivities(publicFeed).filter(
    (item) => followedIds.has(item.author.id) && !shouldHidePublicActivityFromPersonalFeeds(item.author.id)
  ).map((item) => ({
    ...item,
    feedSource: "following"
  }));
  const followerPosts = socialPostsBase.filter((post) => followedIds.has(post.author.id)).map((post) => ({
    ...buildSocialPostItem(post),
    feedSource: "following"
  }));
  const discoveryPosts = socialPostsBase.filter((post) => post.audience === "public").filter((post) => !followedIds.has(post.author.id)).filter((post) => viewerCanSeePersonalFeed(post.author.id)).map((post) => ({
    ...buildSocialPostItem(post),
    feedSource: "discovery"
  }));
  return [...followerPosts, ...publicActivities, ...commentActivities, ...discoveryPosts].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
}
function filterByTag(items, slug, kind) {
  return items.filter((item) => {
    const tags = kind === "channel" ? item.channelTags : item.communityTags;
    return tags.some((tag) => tag.slug === slug);
  });
}
function scopeMembershipKey(kind, slug) {
  return `${kind}:${slug}`;
}
function readScopeMembership(kind, slug) {
  return scopeMembershipByKey[scopeMembershipKey(kind, slug)] ?? {
    memberIds: [],
    joinPolicy: "open"
  };
}
function buildBootstrapDirectory() {
  const viewer = currentViewer();
  const viewerHasPlatformMembership = !!viewer && readScopeMembership("platform", platform.slug).memberIds.includes(viewer.id);
  return {
    platform: viewerHasPlatformMembership ? platformDirectory : null,
    channels: viewer ? channelDirectory.filter((item) => readScopeMembership("channel", item.slug).memberIds.includes(viewer.id)).map((item) => ({ ...item })) : [],
    communities: viewer ? communityDirectory.filter((item) => readScopeMembership("community", item.slug).memberIds.includes(viewer.id)).map((item) => ({
      ...item,
      visibility: readScopeMembership("community", item.slug).joinPolicy === "invite_only" ? "private" : "public"
    })) : []
  };
}
function scopePath(kind, slug) {
  if (kind === "platform") {
    return "/platform";
  }
  return kind === "channel" ? `/channels/${slug}` : `/communities/${slug}`;
}
function buildScopeInviteLink(kind, slug, inviteToken) {
  return `${scopePath(kind, slug)}?invite=${encodeURIComponent(inviteToken)}`;
}
function buildScopeMembershipState(kind, slug) {
  const viewer = currentViewer();
  const membership = readScopeMembership(kind, slug);
  const viewerIsMember = !!viewer && membership.memberIds.includes(viewer.id);
  const viewerCanToggleMembership = membership.joinPolicy === "open" || viewerIsMember;
  return {
    memberCount: membership.memberIds.length,
    viewerIsMember,
    viewerCanToggleMembership,
    joinPolicy: membership.joinPolicy,
    viewerCanSeeFeed: membership.joinPolicy === "open" || viewerIsMember,
    hiddenFeedCopy: membership.hiddenFeedCopy,
    inviteLink: membership.joinPolicy === "invite_only" && viewerIsMember && membership.inviteToken ? buildScopeInviteLink(kind, slug, membership.inviteToken) : void 0
  };
}
function buildProjectMemberState(slug) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];
  const projectMode = projectModeForSlug(slug);
  if (projectMode === "personal-service") {
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
function isPlatformTaggedProject(slug) {
  const project = findPublicProjectItem(slug);
  return !!project && project.channelTags.some((tag) => tag.slug === platform.slug);
}
function canViewerParticipateInPlatformProjectGovernance(slug) {
  return !!currentViewer() && isPlatformTaggedProject(slug);
}
function canViewerParticipateInPlatformEventGovernance(slug) {
  const event = findPublicEventItem(slug);
  return !!event && !event.isPrivate && !!currentViewer() && isPlatformTaggedEvent(event);
}
function buildEventMemberState(item) {
  const viewer = currentViewer();
  const creatorId = userByUsername(item.createdByUsername)?.id ?? null;
  const participation = eventParticipationById[item.id] ?? (eventParticipationById[item.id] = { goingUserIds: [], invitedUserIds: [] });
  const workflow = ensureEventWorkflowState(item.slug, creatorId);
  const memberIds = Array.from(
    /* @__PURE__ */ new Set([...creatorId ? [creatorId] : [], ...participation.goingUserIds])
  );
  const editorIds = item.isPrivate ? Array.from(new Set(workflow.editorUserIds.filter((userId) => memberIds.includes(userId)))) : [];
  const editorIdSet = new Set(editorIds);
  const viewerIsGoing = !!viewer && (memberIds.includes(viewer.id) || viewer.id === creatorId);
  const viewerHasScopeAccess = !!viewer && viewerHasEventScopeAccess(item, viewer.id);
  const viewerCanToggleGoing = !!viewer && (!item.isPrivate || viewerIsGoing || participation.invitedUserIds.includes(viewer.id) || viewerHasScopeAccess);
  const viewerHasEventEditAccess = !!viewer && (item.isPrivate ? editorIdSet.has(viewer.id) : memberIds.includes(viewer.id));
  const viewerCanManageEditors = !!viewer && !!creatorId && item.isPrivate && viewer.id === creatorId;
  return {
    eventEditors: item.isPrivate ? editorIds.map((userId) => toProjectRoleMember(userId)) : [],
    members: memberIds.filter((userId) => !item.isPrivate || !editorIdSet.has(userId)).map((userId) => toProjectRoleMember(userId)),
    memberCount: memberIds.length,
    eligibleVoterCount: item.isPrivate ? editorIds.length : memberIds.length,
    viewerIsGoing,
    viewerCanToggleGoing,
    viewerHasEventEditAccess,
    viewerCanManageEditors,
    availableEditorInvitees: viewerCanManageEditors ? memberIds.filter((userId) => userId !== creatorId && !editorIdSet.has(userId)).map((userId) => toDetailMember(userId)) : []
  };
}
function buildScopeStats(feed, memberCount) {
  return {
    projects: feed.filter((item) => item.kind === "project").length,
    threads: feed.filter((item) => item.kind === "thread").length,
    events: feed.filter((item) => item.kind === "event").length,
    members: memberCount
  };
}
function buildChannelScopeFixtures() {
  const publicFeed = buildPublicFeedFixture();
  const housingFeed = filterByTag(publicFeed, housingBuild.slug, "channel");
  const housingMembership = buildScopeMembershipState("channel", housingBuild.slug);
  const mutualAidFeed = filterByTag(publicFeed, mutualAid.slug, "channel");
  const mutualAidMembership = buildScopeMembershipState("channel", mutualAid.slug);
  return [
    {
      kind: "channel",
      slug: housingBuild.slug,
      title: housingBuild.label,
      description: "Channel pages keep tagged projects, threads, and standalone events together while each content type stays distinct.",
      note: "Channels are topic-based discovery surfaces. They are not the same thing as communities.",
      badges: ["Topic channel"],
      emptyFeedText: "No content matches this channel right now.",
      membership: housingMembership,
      feed: housingFeed,
      stats: buildScopeStats(housingFeed, housingMembership.memberCount)
    },
    {
      kind: "channel",
      slug: mutualAid.slug,
      title: mutualAid.label,
      description: "Channels stay broad enough to gather repair work, local coordination, and standalone events without flattening them into one card type.",
      badges: ["Topic channel"],
      emptyFeedText: "No content matches this channel right now.",
      membership: mutualAidMembership,
      feed: mutualAidFeed,
      stats: buildScopeStats(mutualAidFeed, mutualAidMembership.memberCount)
    }
  ];
}
function buildCommunityScopeFixtures() {
  const publicFeed = buildPublicFeedFixture();
  const eastMarketFeed = filterByTag(publicFeed, eastMarket.slug, "community");
  const eastMarketMembership = buildScopeMembershipState("community", eastMarket.slug);
  const toolLibraryFeed = filterByTag(publicFeed, toolLibrary.slug, "community");
  const toolLibraryMembership = buildScopeMembershipState("community", toolLibrary.slug);
  return [
    {
      kind: "community",
      slug: eastMarket.slug,
      title: eastMarket.label,
      description: "Communities stay people-centered while keeping tagged projects and discussion visible without turning into topic channels.",
      badges: ["Open community"],
      emptyFeedText: "No content matches this community right now.",
      membership: eastMarketMembership,
      feed: eastMarketFeed,
      stats: buildScopeStats(eastMarketFeed, eastMarketMembership.memberCount)
    },
    {
      kind: "community",
      slug: toolLibrary.slug,
      title: toolLibrary.label,
      description: "This community holds the social coordination around the tool library while keeping its projects, threads, and events visible together.",
      note: "This one is closed right now, so the feed stays locked unless you already have access.",
      badges: ["Invite-only community"],
      emptyFeedText: "No content matches this community right now.",
      membership: toolLibraryMembership,
      feed: toolLibraryFeed,
      stats: buildScopeStats(toolLibraryFeed, toolLibraryMembership.memberCount)
    }
  ];
}
function buildPlatformScopeFixture() {
  const publicFeed = buildPublicFeedFixture();
  const platformFeed = filterByTag(publicFeed, platform.slug, "channel");
  const platformMembership = buildScopeMembershipState("platform", platform.slug);
  const boardRoster = buildPlatformBoardRoster();
  return {
    kind: "platform",
    slug: platform.slug,
    title: platform.label,
    description: "Platform keeps software governance and collective coordination public without turning the people involved into permanent profile roles.",
    note: "All users can read and post threads here. Coordination stays visible, but usernames stay just usernames.",
    badges: ["Collective governance"],
    boardNote: "Board members stay in role by keeping at least 66% approval with enough standing votes to meet platform quorum, so the confidence vote stays visible here.",
    emptyFeedText: "No platform-tagged work is visible yet.",
    membership: platformMembership,
    feed: platformFeed,
    boardMembers: boardRoster.activeMembers,
    boardCandidates: boardRoster.candidates,
    boardFeatureFrames: [
      {
        id: "platform-execution-records",
        title: "Execution records",
        body: "Board execution evidence, confirmation history, and rejected execution records will live here once those later-phase flows are active.",
        statusLabel: "Frame only"
      },
      {
        id: "acquisition-handoffs",
        title: "Acquisition handoffs",
        body: "When acquisition opens, board-triggered purchase handoffs and confirmation votes will slot into this panel without changing the route structure.",
        statusLabel: "Frame only"
      },
      {
        id: "platform-software-execution",
        title: "Platform software execution",
        body: "Platform-specific pending execution and merge handoff records will appear here when that implementation lands.",
        statusLabel: "Frame only"
      }
    ],
    stats: buildScopeStats(platformFeed, platformMembership.memberCount)
  };
}
function buildDynamicScopeFixture(kind, slug, meta) {
  const directory = kind === "channel" ? channelDirectory : communityDirectory;
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
const onboardingFixture = {
  title: "Signup / Login",
  intro: "Anonymous visitors can read public surfaces first. To post, follow people, or open create flows, sign up or log in.",
  accountModes: [
    {
      value: "signup",
      label: "Sign up",
      description: "Start a fresh username and local profile."
    },
    {
      value: "login",
      label: "Log in",
      description: "Use an existing account once authentication is wired."
    }
  ],
  starterChannels: channelDirectory.map((item) => item.label),
  starterCommunities: communityDirectory.map((item) => item.label)
};
function buildProfileFixture(username) {
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
    followers: followerIds.map((userId) => userById(userId)).filter((user) => !!user),
    following: followingIds.map((userId) => userById(userId)).filter((user) => !!user),
    canViewPersonalFeed: viewerCanSeePersonalFeed(profileUser.id),
    feed: buildProfileFeed(profileUser.id)
  };
}
function buildRightRailItems() {
  const viewer = currentViewer();
  if (!viewer) {
    return [];
  }
  const publicFeed = buildPublicFeedFixture();
  const projectItems = publicFeed.filter((item) => item.kind === "project").flatMap((item) => {
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
    const sourceLabel = viewerIsDirectMember ? item.projectMode === "personal-service" ? isProjectCreator(item.slug, viewer.id) ? "Your service" : "Member" : "Project member" : `Via ${scopeLabels[0]}`;
    return lifecycle.phaseFive.activities.map((activity) => {
      const hasOpenRole = activity.roles.some(
        (role) => role.maximumCount == null || role.filledCount < role.maximumCount
      );
      return {
        id: `rail-project-activity-${item.slug}-${activity.id}`,
        subjectId: activity.id,
        kind: "project",
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
      };
    });
  });
  const requestItems = publicFeed.filter((item) => item.kind === "project").flatMap((item) => {
    if (item.projectMode === "productive") {
      return [];
    }
    const memberIds = projectMembersBySlug[item.slug] ?? [];
    const lifecycle = buildProjectLifecycle(item.slug, item.projectMode, memberIds.length);
    const requestSystem = lifecycle.requestSystem;
    const viewerIsDirectMember = memberIds.includes(viewer.id);
    const activityPhaseId = activityPhaseIdForProject(item.projectMode);
    const viewerCanSeeRequests = item.projectMode === "personal-service" ? isProjectCreator(item.slug, viewer.id) : viewerIsDirectMember;
    if (!viewerCanSeeRequests || lifecycle.currentPhaseId !== activityPhaseId || !requestSystem?.viewerCanReviewRequests) {
      return [];
    }
    return requestSystem.requests.map((request) => ({
      id: `rail-project-request-${item.slug}-${request.id}`,
      subjectId: request.id,
      kind: "request",
      title: request.title,
      href: `${item.href}?request=${request.id}#request-card-${request.id}`,
      meta: `${item.title} · ${request.requesterUsername}`,
      createdAt: request.createdAt,
      countLabel: formatServiceRequestWindow(request.scheduledAt, request.endsAt) || "Open request",
      projectMode: item.projectMode,
      projectSlug: item.slug,
      requestId: request.id,
      requesterUsername: request.requesterUsername
    }));
  });
  const eventItems = publicFeed.filter((item) => item.kind === "event").flatMap((item) => {
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
    const sourceLabel = viewerIsParticipating || viewerIsInvited ? "Project member" : `Via ${scopeLabels[0]}`;
    if (lifecycle.currentPhaseId !== "activity" || lifecycle.activity.activities.length === 0) {
      return [];
    }
    return lifecycle.activity.activities.map((activity) => {
      const hasOpenRole = activity.roles.some(
        (role) => role.maximumCount == null || role.filledCount < role.maximumCount
      );
      return {
        id: `rail-event-activity-${item.slug}-${activity.id}`,
        subjectId: activity.id,
        kind: "event",
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
      };
    });
  });
  return [...projectItems, ...eventItems, ...requestItems].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)
  );
}
function buildSettingsFixture() {
  const settings = currentSettingsState();
  return settings ? { ...settings } : null;
}
function buildNotificationsFixture() {
  const viewer = currentViewer();
  if (!viewer) {
    return null;
  }
  const baseNotifications = viewer.id === patchbayUser.id ? notificationsState : [];
  const sharedNotifications = sharedNotificationsByUserId[viewer.id] ?? [];
  const existingHrefs = new Set(
    [...sharedNotifications, ...baseNotifications].map((item) => item.href)
  );
  const memberProjectNotifications = Object.entries(projectMembersBySlug).filter(([, memberIds]) => memberIds.includes(viewer.id)).map(([slug]) => {
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
      kind: "project",
      surface: "public",
      subjectKind: "project",
      projectMode: project.projectMode,
      actorUsername: latestUpdate.authorUsername,
      actionLabel: "updated",
      title: project.title,
      body: latestUpdate.body,
      href: buildUpdateHref(project.href, latestUpdate.id),
      createdAt: latestUpdate.createdAt,
      isUnread: !readNotificationHrefs.has(buildUpdateHref(project.href, latestUpdate.id)),
      channelTags: project.channelTags,
      communityTags: project.communityTags
    };
  }).filter((item) => !!item).filter((item) => !existingHrefs.has(item.href));
  const memberEventNotifications = buildPublicFeedFixture().filter((item) => item.kind === "event").map((event) => {
    const participation = eventParticipationById[event.id];
    if (!participation) {
      return null;
    }
    const viewerInEvent = participation.goingUserIds.includes(viewer.id) || participation.invitedUserIds.includes(viewer.id);
    if (!viewerInEvent) {
      return null;
    }
    const latestUpdate = latestEventUpdateForSlug(event.slug);
    if (!latestUpdate || latestUpdate.authorUsername === viewer.username) {
      return null;
    }
    const goingSince = eventGoingSinceById[event.id]?.[viewer.id];
    const invitedSince = eventInvitedSinceById[event.id]?.[viewer.id];
    const membershipSince = [goingSince, invitedSince].filter((value) => !!value).sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
    if (membershipSince && new Date(latestUpdate.createdAt).getTime() < new Date(membershipSince).getTime()) {
      return null;
    }
    return {
      id: `notification-event-member-update-${event.slug}-${latestUpdate.id}`,
      kind: "event",
      surface: "public",
      subjectKind: "event",
      actorUsername: latestUpdate.authorUsername,
      actionLabel: "updated",
      title: event.title,
      body: latestUpdate.body,
      href: buildUpdateHref(event.href, latestUpdate.id),
      createdAt: latestUpdate.createdAt,
      isUnread: !readNotificationHrefs.has(buildUpdateHref(event.href, latestUpdate.id)),
      channelTags: event.channelTags,
      communityTags: event.communityTags
    };
  }).filter((item) => !!item).filter((item) => !existingHrefs.has(item.href));
  return {
    viewer,
    items: [
      ...sharedNotifications,
      ...memberProjectNotifications,
      ...memberEventNotifications,
      ...baseNotifications
    ].map((item) => ({
      ...item,
      isUnread: item.isUnread && !readNotificationHrefs.has(item.href)
    })).sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  };
}
function buildMessagesFixture() {
  const viewer = currentViewer();
  const conversations = currentMessageConversationsState().map(conversationWithReports);
  return viewer ? {
    viewer,
    conversations,
    linkedChats: buildLinkedChats(viewer),
    suggestedContacts: buildSuggestedMessageContacts(viewer.id),
    activeConversationId: null
  } : null;
}
function buildSearchCorpus() {
  const publicFeed = buildPublicFeedFixture();
  return [
    ...publicFeed.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      summary: item.kind === "project" ? item.summary : item.kind === "thread" ? item.body : item.description,
      href: item.href,
      meta: item.kind === "project" ? item.stage : item.kind === "thread" ? item.authorUsername : item.timeLabel
    })),
    ...channelDirectory.map((item) => ({
      id: `channel-${item.slug}`,
      kind: "channel",
      title: item.label,
      summary: "Topic-based discovery surface for tagged projects, threads, and events.",
      href: item.href,
      meta: "Channel"
    })),
    ...communityDirectory.map((item) => ({
      id: `community-${item.slug}`,
      kind: "community",
      title: item.label,
      summary: "People-centered coordination surface that can hold tagged work and events.",
      href: item.href,
      meta: "Community"
    })),
    ...users.map((item) => ({
      id: `profile-${item.username}`,
      kind: "profile",
      title: item.username,
      summary: item.bio ?? "Profile surface",
      href: `/profile/${item.username}`,
      meta: `${followerIdsFor(item.id).length} followers · ${followingIdsFor(item.id).length} follows`
    }))
  ];
}
function findPublicProjectItem(slug) {
  return buildPublicFeedFixture().find(
    (item) => item.kind === "project" && item.slug === slug
  ) ?? null;
}
function publicProjectFromHref(href) {
  if (!href || !href.startsWith("/projects/")) {
    return null;
  }
  return findPublicProjectItem(href.slice("/projects/".length));
}
function hydrateAssetProjectReference(reference) {
  const href = reference.href ?? assetServiceProjectHrefByTitle[reference.title] ?? (reference.id.startsWith("asset-project-") ? `/projects/${assetServiceProjectSlug(reference)}` : null);
  return {
    ...reference,
    href,
    publicItem: publicProjectFromHref(href)
  };
}
function currentBorrowerLabel(asset) {
  const activeBorrow = asset.governance.borrowingRequests.find(
    (request) => request.statusLabel.toLowerCase().includes("borrowed") || request.statusLabel.toLowerCase().includes("overdue")
  );
  return activeBorrow?.responsiblePartyLabel ?? activeBorrow?.borrowerLabel ?? null;
}
function currentLocationDetails(asset) {
  const currentProject = [...asset.linkedProjects, ...asset.managementProjects, ...asset.storageProjects].find(
    (project) => project.title === asset.currentCustodianLabel
  );
  return {
    currentLocationLabel: currentProject?.title ?? asset.homeLandAssetLabel,
    currentLocationHref: currentProject?.href ?? `/platform/assets/${asset.parentLandAssetSlug}`,
    currentBorrowerLabel: currentBorrowerLabel(asset)
  };
}
function hydrateAttachedAsset(asset) {
  return {
    ...asset,
    managementProjects: asset.managementProjects.map(hydrateAssetProjectReference),
    storageProjects: asset.storageProjects.map(hydrateAssetProjectReference),
    linkedProjects: asset.linkedProjects.map(hydrateAssetProjectReference),
    ...currentLocationDetails(asset)
  };
}
function hydrateLandAsset(asset) {
  return {
    ...asset,
    managementProjects: asset.managementProjects.map(hydrateAssetProjectReference),
    storageProjects: asset.storageProjects.map(hydrateAssetProjectReference),
    linkedProjects: asset.linkedProjects.map(hydrateAssetProjectReference),
    attachedAssets: asset.attachedAssets.map(hydrateAttachedAsset)
  };
}
function findPublicThreadItem(slug) {
  return buildPublicFeedFixture().find(
    (item) => item.kind === "thread" && item.slug === slug
  ) ?? null;
}
function findPublicEventItem(slug) {
  return buildPublicFeedFixture().find(
    (item) => item.kind === "event" && item.slug === slug
  ) ?? null;
}
function findPersonalPostItem(id) {
  return socialPostsBase.map(buildSocialPostItem).find((item) => item.id === id) ?? null;
}
function getBootstrapFixture() {
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
function getPublicFeedFixture() {
  return buildPublicFeedFixture();
}
function getPersonalFeedFixture() {
  return buildPersonalFeedFixture();
}
function getSettingsFixture() {
  return buildSettingsFixture();
}
function updateMockSettings(input) {
  const settings = currentSettingsState();
  const viewer = currentViewer();
  if (!settings || !viewer) {
    return;
  }
  settingsByUserId[viewer.id] = {
    ...settings,
    ...input
  };
  settingsByUserId[viewer.id].requireFollowApproval = settingsByUserId[viewer.id].hidePersonalFeedFromNonFollowers;
  syncViewerProfileFromSettings(viewer.id);
}
function hydrateMockClientState() {
  return hydratePersistedClientState();
}
function findChannelScopeFixture(slug) {
  return buildChannelScopeFixtures().find((item) => item.slug === slug) ?? buildDynamicScopeFixture("channel", slug, createdChannelScopeMetaBySlug[slug]) ?? null;
}
function findCommunityScopeFixture(slug) {
  return buildCommunityScopeFixtures().find((item) => item.slug === slug) ?? buildDynamicScopeFixture("community", slug, createdCommunityScopeMetaBySlug[slug]) ?? null;
}
function getPlatformScopeFixture() {
  return buildPlatformScopeFixture();
}
function getPlatformAssetsFixture() {
  return {
    ...platformAssetsFixture,
    landAssets: platformAssetsFixture.landAssets.map(hydrateLandAsset)
  };
}
function findProfileFixture(username) {
  return buildProfileFixture(username);
}
function findNotificationsFixture() {
  return buildNotificationsFixture();
}
function findMessagesFixture() {
  return buildMessagesFixture();
}
function buildSearchFixture(query) {
  const normalizedQuery = query.trim().toLowerCase();
  const corpus = buildSearchCorpus();
  const results = normalizedQuery ? corpus.filter(
    (item) => [item.title, item.summary, item.meta].some(
      (value) => value.toLowerCase().includes(normalizedQuery)
    )
  ) : corpus.slice(0, 8);
  return {
    query,
    suggestedQueries: ["repair", "mutual aid", "retrofit", "tool library"],
    results
  };
}
function findProjectFixture(slug) {
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
    updateRequests,
    viewerCanRequestUpdate: canViewerRequestProjectUpdate(slug),
    viewerCanVoteOnUpdateRequests: canViewerVoteOnProjectUpdate(slug),
    editRequests,
    viewerCanRequestEdit: canViewerRequestProjectEdit(slug),
    viewerCanVoteOnEditRequests: canViewerVoteOnProjectEdit(slug),
    linksFrame,
    inventoryFrame,
    history,
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
function buildProjectPlaceholderSections(sections) {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    body: section.body,
    statusLabel: section.statusLabel ?? "Frame only"
  }));
}
function buildProjectRequestFrames(context, item) {
  if (context === "links") {
    return [
      {
        id: "asset-use",
        title: "Asset-use link preview",
        body: "Fake preview only: approved in-house asset requests will create auto-links here so members can see which stewardship or storage project confirmed the dependency.",
        statusLabel: "Fake preview"
      },
      {
        id: "delivery",
        title: "Delivery link preview",
        body: item.projectMode === "collective-service" ? "Fake preview only: completed delivery runs will create links here so service work and asset movement stay connected in the production network." : "Fake preview only: completed delivery runs will create links here when this project depends on transport between sites.",
        statusLabel: "Fake preview"
      }
    ];
  }
  const frames = [
    {
      id: "borrowing",
      title: "Borrowing request preview",
      body: "Fake preview only: borrowing requests for assets managed by this project will appear here with intended return dates and current custodian labels.",
      statusLabel: "Fake preview"
    },
    {
      id: "asset-use",
      title: "Asset-use request preview",
      body: "Fake preview only: plans needing in-house equipment or site access will send availability requests here before they become fully voteable.",
      statusLabel: "Fake preview"
    }
  ];
  if (item.projectMode === "collective-service") {
    frames.push({
      id: "delivery",
      title: "Delivery coordination preview",
      body: "Fake preview only: delivery and transfer coordination records will appear here for service projects that move assets between sites.",
      statusLabel: "Fake preview"
    });
  }
  return frames;
}
function projectFrameLink(currentItem, targetSlug, relationshipLabel, summary, fallbackTitle) {
  const target = findPublicProjectItem(targetSlug);
  return {
    id: `${currentItem.slug}-${targetSlug}`,
    title: target?.title ?? fallbackTitle,
    relationshipLabel,
    summary,
    href: target?.href ?? null
  };
}
function buildProjectManualLinkVoteState(projectTitle, memberCount, yesCount, noCount) {
  const approvalsRequired = memberCount <= 0 ? 0 : Math.ceil(memberCount * GOVERNANCE_APPROVAL_THRESHOLD_PERCENT / 100);
  const approvalPercent = memberCount <= 0 ? 0 : Math.round(yesCount / memberCount * 100);
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
      statusLabel: "No voters seeded",
      resultNote: "This fake preview does not yet have seeded members for the approval side."
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
      statusLabel: "Approved",
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
      statusLabel: "Blocked",
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
    statusLabel: "Pending",
    resultNote: `${approvalsRemaining} more yes vote${approvalsRemaining === 1 ? "" : "s"} needed on this side.`
  };
}
function buildProjectManualLinkRequest(currentItem, targetSlug, fallbackTitle, relationshipLabel, summary, statusLabel, proposedByUsername, createdAtLabel, currentVotes, targetVotes) {
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
function relatedLandAssetSlugForProject(item) {
  return item.slug.includes("ride") || item.slug.includes("hallway") || item.slug.includes("retrofit") ? "east-market-commons" : "tool-library-campus";
}
function relatedLandAssetHrefForProject(item) {
  return `/platform/assets/${relatedLandAssetSlugForProject(item)}`;
}
function relatedLandAssetForProject(item) {
  return platformAssetsFixture.landAssets.find((asset) => asset.slug === relatedLandAssetSlugForProject(item)) ?? null;
}
function findAttachedAssetsForProjectSlug(slug) {
  const projectHref = `/projects/${slug}`;
  return platformAssetsFixture.landAssets.flatMap(
    (landAsset) => landAsset.attachedAssets.filter(
      (asset) => [...asset.linkedProjects, ...asset.managementProjects, ...asset.storageProjects].some(
        (project) => project.href === projectHref
      )
    )
  );
}
function buildInventoryAssetFromAttachedAsset(asset) {
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
    governanceNote: borrowingPolicy?.summary ?? availability?.summary ?? void 0,
    historyLabel: latestHistory ? `${latestHistory.happenedAtLabel} · ${latestHistory.title}` : void 0,
    href: asset.href ?? null
  };
}
function buildInventoryAssetFromLandAsset(asset) {
  const borrowingPolicy = asset.governance.borrowingPolicies[0] ?? null;
  const availability = asset.governance.availabilityRequests[0] ?? null;
  const latestHistory = asset.governance.provenanceTimeline[asset.governance.provenanceTimeline.length - 1] ?? null;
  return {
    id: asset.id,
    title: asset.title,
    statusLabel: asset.statusLabel,
    custodyLabel: asset.currentCustodianLabel,
    summary: `${asset.acreageLabel} · ${asset.locationLabel}`,
    locationLabel: asset.locationLabel,
    borrowingPolicyLabel: borrowingPolicy?.policyLabel,
    availabilityLabel: availability?.statusLabel,
    governanceNote: borrowingPolicy?.summary ?? availability?.summary ?? void 0,
    historyLabel: latestHistory ? `${latestHistory.happenedAtLabel} · ${latestHistory.title}` : asset.historySummary,
    href: `/platform/assets/${asset.slug}`
  };
}
function buildFallbackProjectInventoryAssets(item) {
  const assetHref = relatedLandAssetHrefForProject(item);
  const custodyLabel = relatedLandAssetSlugForProject(item) === "east-market-commons" ? "Held under East Market Commons Lot" : "Held under Tool Library Campus Lot";
  if (item.projectMode === "collective-service") {
    return [
      {
        id: `${item.slug}-asset-intake-kit`,
        title: "Shared intake kit",
        statusLabel: "Fake preview asset",
        custodyLabel,
        summary: "A seeded preview asset showing how service-managed equipment will appear once collective inventory goes live.",
        borrowingPolicyLabel: "Project use only",
        availabilityLabel: "Preview availability only",
        governanceNote: "Real borrowing policy votes and availability decisions are now seeded on asset pages first and can be mapped here as more service records open.",
        historyLabel: "Preview history only",
        href: assetHref
      },
      {
        id: `${item.slug}-asset-mobile-cart`,
        title: "Mobile coordination cart",
        statusLabel: "Fake preview asset",
        custodyLabel,
        summary: "A seeded preview asset showing how mobile service equipment can stay attached to a land record while moving between active shifts.",
        borrowingPolicyLabel: "Individual borrowing permitted",
        availabilityLabel: "Preview availability only",
        governanceNote: "Real borrowing and delivery lifecycle records are now seeded on linked asset pages and will roll into inventory as those service records deepen.",
        historyLabel: "Preview history only",
        href: assetHref
      }
    ];
  }
  return [
    {
      id: `${item.slug}-asset-staging-tables`,
      title: "Staging table set",
      statusLabel: "Fake preview asset",
      custodyLabel,
      summary: "A seeded preview of a collectively held work surface that this project would check out for active production or build-day work.",
      borrowingPolicyLabel: "Project use only",
      availabilityLabel: "Preview availability only",
      governanceNote: "Real availability approvals now live on seeded asset pages so productive plans can show the pending-vs-approved path through the adapter.",
      historyLabel: "Preview history only",
      href: assetHref
    },
    {
      id: `${item.slug}-asset-tool-cache`,
      title: "Shared tool cache",
      statusLabel: "Fake preview asset",
      custodyLabel,
      summary: "A seeded preview of repair and install tools that would remain in common ownership while being assigned to this project during activity.",
      borrowingPolicyLabel: "Project use only",
      availabilityLabel: "Preview availability only",
      governanceNote: "Borrowing and delivery lifecycle records now live on seeded asset pages and will replace these fallback summaries as more attached assets are linked directly.",
      historyLabel: "Preview history only",
      href: assetHref
    }
  ];
}
function buildProjectInventoryAssetGroups(item) {
  const landAsset = relatedLandAssetForProject(item);
  const linkedAssets = findAttachedAssetsForProjectSlug(item.slug);
  const onLandAssets = linkedAssets.length > 0 ? linkedAssets.map((asset) => buildInventoryAssetFromAttachedAsset(asset)) : buildFallbackProjectInventoryAssets(item);
  const landAssets = landAsset ? [buildInventoryAssetFromLandAsset(landAsset)] : [];
  const landGroupTitle = landAssets.length === 1 ? "Land asset" : "Land assets";
  const assetGroupTitle = item.projectMode === "collective-service" && (item.projectSubtype === "land-management" || item.projectSubtype === "storage") ? onLandAssets.length === 1 ? "On land asset" : "On land assets" : onLandAssets.length === 1 ? "Asset" : "Assets";
  return [
    {
      id: `${item.slug}-land-group`,
      kind: "land-asset",
      title: landGroupTitle,
      assets: landAssets
    },
    {
      id: `${item.slug}-asset-group`,
      kind: "asset",
      title: assetGroupTitle,
      assets: onLandAssets
    }
  ];
}
function buildProjectPhaseFourPreview(item, currentSubtype) {
  if (item.projectMode === "personal-service") {
    return null;
  }
  const assetHref = relatedLandAssetHrefForProject(item);
  const fund = item.fundProgress ? {
    title: item.fundProgress.title,
    progressPercent: item.fundProgress.progressPercent,
    raisedLabel: item.fundProgress.raisedLabel,
    targetLabel: item.fundProgress.targetLabel,
    statusLabel: "Fake preview fund",
    note: "Fake preview only: this shows how a collective fund round could appear before board execution and confirmation are active."
  } : {
    title: `${item.title} acquisition round`,
    progressPercent: 61,
    raisedLabel: "$6.1k pledged",
    targetLabel: "$10k target",
    statusLabel: "Fake preview fund",
    note: "Fake preview only: this seeded fund summary shows what a collective contribution round could look like in acquisition."
  };
  const existingAssets = currentSubtype === "software" ? [
    {
      id: `${item.slug}-existing-ci-runner`,
      title: "Shared CI runner slot",
      sourceLabel: "Existing collective infrastructure",
      costLabel: "No new purchase required",
      statusLabel: "Fake preview source",
      note: "Fake preview only: this shows how already-held collective infrastructure would appear once availability requests are live.",
      href: assetHref
    }
  ] : [
    {
      id: `${item.slug}-existing-site-access`,
      title: "Site access and floor space",
      sourceLabel: "Existing collective land asset",
      costLabel: "No new purchase required",
      statusLabel: "Fake preview source",
      note: "Fake preview only: this shows how confirmed in-house site access would appear alongside items that still need collective funding.",
      href: assetHref
    }
  ];
  const purchaseTargets = currentSubtype === "software" ? [
    {
      id: `${item.slug}-purchase-hosting`,
      title: "Deployment hardware reserve",
      sourceLabel: "Collective purchase target",
      costLabel: "$2.8k",
      statusLabel: "Fake preview purchase",
      note: "Fake preview only: hardware, hosting, or other means of production can be itemized here before execution.",
      href: null
    }
  ] : [
    {
      id: `${item.slug}-purchase-material-kit`,
      title: "Material kit and fixtures",
      sourceLabel: "Collective purchase target",
      costLabel: "$3.4k",
      statusLabel: "Fake preview purchase",
      note: "Fake preview only: each item needed for the plan can be listed separately with cost and execution status here.",
      href: null
    },
    {
      id: `${item.slug}-purchase-safety-gear`,
      title: "Safety and handling gear",
      sourceLabel: "Collective purchase target",
      costLabel: "$1.2k",
      statusLabel: "Fake preview purchase",
      note: "Fake preview only: multiple purchase targets can stay visible together so members can inspect what the acquisition round covers.",
      href: null
    }
  ];
  return {
    intro: "Acquisition sits between the final planning phase and activity whenever an approved plan still needs collectively held means of production.",
    previewNote: "Fake preview only. Acquisition is not active in this beta, but this shows how collective funds, existing assets, board execution, and confirmation could appear once the feature opens.",
    fund,
    existingAssets,
    purchaseTargets,
    placeholderSections: buildProjectPlaceholderSections([
      {
        id: "board-execution",
        title: "Board execution handoff",
        body: "Fake preview only: once a fund is complete, board members would record purchase evidence and asset entries here before members cast a confirmation vote.",
        statusLabel: "Fake preview"
      },
      {
        id: "confirmation-vote",
        title: "Confirmation vote preview",
        body: "Fake preview only: members would confirm or reject the executed acquisition round here, with rejected execution affecting board standing.",
        statusLabel: "Fake preview"
      },
      {
        id: "inventory-handoff",
        title: "Inventory handoff preview",
        body: "Fake preview only: once confirmed, newly acquired assets would flow into the project inventory tab and the wider asset registry from this phase.",
        statusLabel: "Fake preview"
      }
    ])
  };
}
const seededProjectConversionLineageBySlug = {
  "block-weatherization-pilot-wrap": {
    predecessorSlug: "block-weatherization-pilot-wrap",
    successorSlug: "east-market-weatherization-maintenance-service",
    successorTitle: "East Market Weatherization Maintenance Service",
    summary: "This productive pilot closed after the build cycle and now stays permanently linked to the follow-on collective service that carries the maintenance and repeat work.",
    inventoryNote: "The successor record inherits the pilot inventory framing so the ladders, seal kits, and measurement tools stay attached to the continuing service history.",
    permanenceNote: "This predecessor/successor relationship is governance-created and permanent. It cannot be removed through the manual link process.",
    statusLabel: "Converted project"
  }
};
const seededProjectConversionSuccessorPreviewBySlug = {
  "hallway-air-sealing-build-day": {
    successorSlug: "east-market-weatherization-support-service",
    successorTitle: "East Market Weatherization Support Service",
    inventoryNote: "If this close vote passes, the follow-on service will inherit the current tool kits, safety gear, and role notes as its starting inventory frame.",
    summary: "The current proposal would close the one-off build day and reopen the work as a standing collective service for repeat support and maintenance."
  }
};
function projectFrameDateLabel(iso) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(iso));
}
function projectConversionWorkflowStatus(request) {
  if (request.voteSummary.meetsQuorum && request.passesApprovalThreshold) {
    return "Approved threshold reached";
  }
  if (!request.canStillPass) {
    return "Blocked by vote math";
  }
  return "Pending close vote";
}
function buildProjectConversionWorkflow(item, requests) {
  return requests.filter(
    (request) => request.kind === "close" && request.closeOutcome === "convert" && request.conversionTarget
  ).map((request) => {
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
      inventoryNote: preview?.inventoryNote ?? `If approved, the successor starts in ${target.entryPhaseLabel} with the current inventory framing carried forward.`,
      canVote: canViewerVoteOnProjectPhaseChange(item.slug),
      voteSummary: request.voteSummary,
      approvalThresholdPercent: request.approvalThresholdPercent,
      target,
      predecessor: {
        id: `${item.slug}-conversion-predecessor`,
        title: item.title,
        relationshipLabel: "Closing project",
        summary: "This is the current project record that would close if the conversion vote passes.",
        href: item.href
      },
      successor: preview ? projectFrameLink(
        item,
        preview.successorSlug,
        "Planned successor",
        preview.summary,
        preview.successorTitle
      ) : null
    };
  }).filter((item2) => !!item2);
}
function buildProjectConversionLineage(item) {
  const seed = seededProjectConversionLineageBySlug[item.slug];
  if (!seed) {
    return null;
  }
  return {
    title: "Conversion lineage",
    statusLabel: seed.statusLabel,
    summary: seed.summary,
    permanenceNote: seed.permanenceNote,
    inventoryNote: seed.inventoryNote,
    predecessor: {
      id: `${seed.predecessorSlug}-conversion-lineage-predecessor`,
      title: item.title,
      relationshipLabel: "Historical predecessor",
      summary: "This closed productive record remains permanently visible as the predecessor in the governed conversion chain.",
      href: item.href
    },
    successor: projectFrameLink(
      item,
      seed.successorSlug,
      "Converted successor",
      "This follow-on service keeps the inherited inventory and governance history visible after the original project closed.",
      seed.successorTitle
    )
  };
}
function buildProjectLinksFrame(item) {
  const candidateTargets = [
    "repair-cafe-shift-grid",
    "childcare-checkin-desk-service",
    "neighborhood-ride-coordination-service",
    "hallway-air-sealing-build-day"
  ].filter((slug) => slug !== item.slug);
  const manualLinkRequests = [
    buildProjectManualLinkRequest(
      item,
      candidateTargets[0] ?? "repair-cafe-shift-grid",
      "Repair cafe shift grid",
      "Pending shared-resource coordination",
      "This project has already cleared its own threshold, but the linked project still needs more member approvals before the relationship can go live.",
      "Pending counterpart vote",
      "avery.n",
      "Opened 2 days ago",
      { yesCount: Math.max(Math.ceil(item.memberCount * 0.67), 1), noCount: item.memberCount > 3 ? 1 : 0 },
      { yesCount: 2, noCount: 1 }
    ),
    buildProjectManualLinkRequest(
      item,
      candidateTargets[2] ?? candidateTargets[1] ?? "neighborhood-ride-coordination-service",
      "Neighborhood ride coordination service",
      "Member-approved relationship",
      "Both project memberships cleared the required threshold, so this request now appears above as an active manual link in the production graph.",
      "Approved on both sides",
      "samira.l",
      "Approved this week",
      {
        yesCount: Math.max(Math.ceil(item.memberCount * 0.75), 1),
        noCount: item.memberCount > 4 ? 1 : 0
      },
      { yesCount: 5, noCount: 1 }
    ),
    buildProjectManualLinkRequest(
      item,
      candidateTargets[1] ?? "childcare-checkin-desk-service",
      "Childcare check-in desk service",
      "Blocked handoff relationship",
      "The linked project accumulated enough no votes that the request can no longer reach the required approval threshold there.",
      "Blocked on linked project side",
      "jules.p",
      "Closed yesterday",
      { yesCount: Math.max(Math.ceil(item.memberCount * 0.67), 1), noCount: 0 },
      { yesCount: 1, noCount: 3 }
    )
  ];
  const config = projectLifecycleBySlug[item.slug];
  const currentSubtype = currentProjectSubtypeForGovernance(item.slug);
  const memberCount = projectGovernancePopulation(item.slug, (projectMembersBySlug[item.slug] ?? []).length);
  const phaseChangeRequests = config ? buildProjectPhaseChangeRequests(
    item.slug,
    item.projectMode,
    config.currentPhaseId,
    projectLifecyclePhaseBlueprintsForProject(item.slug, item.projectMode, currentSubtype),
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  ) : [];
  const conversionWorkflow = buildProjectConversionWorkflow(item, phaseChangeRequests);
  const conversionLineage = buildProjectConversionLineage(item);
  return {
    intro: "Links will show how this project connects to upstream work, downstream work, approved asset-use relationships, deliveries, and future project conversions.",
    autoLinks: [
      projectFrameLink(
        item,
        candidateTargets[0] ?? "repair-cafe-shift-grid",
        "Auto link · approved shared resource dependency",
        "Fake preview only: this link shows how an approved in-house asset request could automatically connect two projects.",
        "Shared resource dependency"
      ),
      projectFrameLink(
        item,
        candidateTargets[1] ?? "childcare-checkin-desk-service",
        "Auto link · completed delivery route",
        "Fake preview only: this link shows how completed delivery work could automatically stitch projects together in the network view.",
        "Completed delivery route"
      )
    ],
    manualLinks: [
      projectFrameLink(
        item,
        candidateTargets[2] ?? "neighborhood-ride-coordination-service",
        "Manual proposal · member-approved relationship",
        "Fake preview only: this is how a member-proposed relationship would appear after both projects approve the link.",
        "Member-approved relationship"
      )
    ],
    manualLinkRequests,
    conversionNote: "If this project is later converted into another project type, that lineage will stay visible here as a permanent link.",
    conversionWorkflow,
    conversionLineage,
    requestFrames: buildProjectRequestFrames("links", item),
    placeholderSections: buildProjectPlaceholderSections([
      {
        id: "auto-links",
        title: "Auto-created links",
        body: "Approved asset-use requests, completed deliveries, and future project conversions will create links here automatically once those flows are live."
      },
      {
        id: "production-network",
        title: "Network tracing",
        body: "Direct predecessors, direct successors, and longer production-network chains will all be framed in this tab as dedicated sections rather than mixed into overview copy."
      },
      {
        id: "conversion-lineage",
        title: "Conversion lineage",
        body: "When a project converts into a new type, the predecessor and successor records stay linked here permanently so the production history remains visible.",
        statusLabel: "Fake preview"
      }
    ])
  };
}
function buildProjectInventoryFrame(item) {
  if (item.projectMode === "personal-service") {
    return null;
  }
  const intro = item.projectMode === "productive" ? "Inventory will list collectively held means of production attached to this project once acquisition and asset operations open." : "Inventory will list the assets this service manages or keeps in custody once asset operations open.";
  return {
    projectSlug: item.slug,
    intro,
    statusLabel: "Fake preview inventory",
    assetGroups: buildProjectInventoryAssetGroups(item),
    canRequestAssets: item.projectMode === "collective-service" && (item.projectSubtype === "land-management" || item.projectSubtype === "storage") && canViewerSubmitProjectServiceRequest(item.slug),
    requestFrames: buildProjectRequestFrames("inventory", item),
    acquisitionPreview: buildProjectPhaseFourPreview(item, item.projectSubtype ?? null),
    placeholderSections: buildProjectPlaceholderSections([
      {
        id: "managed-assets",
        title: "Managed assets",
        body: "Land management, storage, and acquisition-backed project assets will appear here as individual records with current custody and status once the asset registry is live."
      },
      {
        id: "borrowing-policy",
        title: "Borrowing policy votes",
        body: "Projects that manage assets will get per-asset borrowing-policy votes here so members can decide what is available for individual borrowing and what stays project-use only."
      },
      {
        id: "asset-requests",
        title: "Asset-use requests",
        body: "Approved plans that depend on in-house assets will route request and availability decisions through this tab once those governance flows are implemented."
      },
      {
        id: "acquisition-handoff",
        title: "Acquisition handoff",
        body: "Fake preview only: once acquisition is confirmed, this tab will show how newly acquired items land in project inventory and the wider asset registry.",
        statusLabel: "Fake preview"
      }
    ])
  };
}
function findThreadFixture(slug) {
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
    discussionNote: threadDiscussionNotes[slug] ?? "Discussion stays visible here.",
    discussion: mapCommentsWithReports(commentsBySubjectId[item.id] ?? [])
  };
}
function findPostFixture(id) {
  const item = findPersonalPostItem(id);
  if (!item) {
    return null;
  }
  if (item.audience === "followers" && !viewerCanSeeFollowersPosts(item.author.id)) {
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
    discussionNote: postDiscussionNotes[item.id] ?? "Personal post discussion stays threaded here.",
    discussion: mapCommentsWithReports(commentsBySubjectId[item.id] ?? [])
  };
}
function findEventFixture(slug) {
  const item = findPublicEventItem(slug);
  const extras = eventDetailExtras[slug];
  const participation = eventParticipationById[item?.id ?? ""];
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
    updateRequests,
    viewerCanRequestUpdate: canViewerRequestEventUpdate(slug),
    viewerCanVoteOnUpdateRequests: canViewerVoteOnEventUpdate(slug),
    editRequests,
    viewerCanRequestEdit: canViewerRequestEventEdit(slug),
    viewerCanVoteOnEditRequests: canViewerVoteOnEventEdit(slug),
    history,
    attendees: (participation?.goingUserIds ?? []).map((userId) => userById(userId)?.username ?? "").filter(Boolean),
    invitedUsernames: (participation?.invitedUserIds ?? []).map((userId) => userById(userId)?.username ?? "").filter(Boolean),
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
function updateCommentVote(comments, commentId, nextVote) {
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
function appendReply(comments, parentId, nextComment) {
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
function setMockVote(targetId, nextVote) {
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
    const vote2 = voteState.get(targetId);
    if (vote2) {
      const snapshot = buildConfidenceVoteSnapshot(targetId);
      vote2.voteCount = snapshot ? snapshot.upVotes - snapshot.downVotes : 0;
      vote2.activeVote = snapshot?.activeVote ?? 0;
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
function toggleMockEventGoing(eventId) {
  const viewer = currentViewer();
  const participation = eventParticipationById[eventId];
  const event = publicFeedBase.find(
    (item) => item.kind === "event" && item.id === eventId
  );
  const creatorId = event ? userByUsername(event.createdByUsername)?.id ?? null : null;
  const viewerHasScopeAccess = !!viewer && !!event && viewerHasEventScopeAccess(event, viewer.id);
  const viewerCanToggle = !!viewer && !!participation && !!event && (!event.isPrivate || participation.invitedUserIds.includes(viewer.id) || participation.goingUserIds.includes(viewer.id) || creatorId === viewer.id || viewerHasScopeAccess);
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
    if (event.isPrivate && !participation.invitedUserIds.includes(viewer.id) && !viewerHasScopeAccess) {
      participation.invitedUserIds = [...participation.invitedUserIds, viewer.id];
      eventInvitedSinceById[eventId] = {
        ...eventInvitedSinceById[eventId] ?? {},
        [viewer.id]: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    recordMeaningfulAction(viewer.id);
    return;
  }
  participation.goingUserIds = [...participation.goingUserIds, viewer.id];
  participation.invitedUserIds = participation.invitedUserIds.filter((userId) => userId !== viewer.id);
  delete (eventInvitedSinceById[eventId] ?? {})[viewer.id];
  eventGoingSinceById[eventId] = {
    ...eventGoingSinceById[eventId] ?? {},
    [viewer.id]: (/* @__PURE__ */ new Date()).toISOString()
  };
  recordMeaningfulAction(viewer.id);
}
function toggleMockProjectMembership(slug) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);
  if (!viewer) {
    return;
  }
  if (projectMode === "personal-service" && isProjectCreator(slug, viewer.id)) {
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
    ...projectMembershipSinceBySlug[slug] ?? {},
    [viewer.id]: (/* @__PURE__ */ new Date()).toISOString()
  };
  recordMeaningfulAction(viewer.id);
}
function ensureProjectMembership(slug, userId) {
  const memberIds = projectMembersBySlug[slug] ?? [];
  if (!memberIds.includes(userId)) {
    projectMembersBySlug[slug] = [userId, ...memberIds];
    projectMembershipSinceBySlug[slug] = {
      ...projectMembershipSinceBySlug[slug] ?? {},
      [userId]: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
function ensureProjectWorkflowState(slug) {
  const workflow = projectWorkflowStateBySlug[slug] ?? (projectWorkflowStateBySlug[slug] = {
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
function ensureEventWorkflowState(slug, creatorId = null) {
  const event = findPublicEventItem(slug);
  const workflow = eventWorkflowStateBySlug[slug] ?? (eventWorkflowStateBySlug[slug] = {
    editorUserIds: creatorId ? [creatorId] : [],
    currentPhaseId: event?.isPrivate ? "event-plan" : "proposal",
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
    /* @__PURE__ */ new Set([...creatorId ? [creatorId] : [], ...workflow.editorUserIds ?? []])
  );
  workflow.currentPhaseId ??= event?.isPrivate ? "event-plan" : "proposal";
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
function decisionHistoryLabel(kind, payload) {
  if ((kind === "project-phase-change" || kind === "event-phase-change") && payload.type === "phase-change") {
    switch (payload.changeKind) {
      case "close":
        return payload.closeOutcome === "convert" ? "Convert decision" : "Close decision";
      case "return":
        return "Return decision";
      default:
        return "Advance decision";
    }
  }
  switch (kind) {
    case "project-pull-request-approval":
      return "Pull request approval";
    case "project-pull-request-confirmation":
      return "Merge confirmation";
    case "project-merge-capability-change":
      return payload.type === "merge-capability" ? projectMergeCapabilityActionLabel(payload.action) : "Merge capability decision";
    case "project-repository-replacement":
      return "Repository replacement";
    case "project-request-settings-change":
      return "Settings decision";
    case "project-update":
    case "event-update":
      return "Update decision";
    default:
      return "Edit decision";
  }
}
function projectPhaseChangeKind(slug, projectMode, fromPhaseId, toPhaseId) {
  const fromOrder = phaseOrderForProjectSlug(slug, projectMode, fromPhaseId);
  const toOrder = phaseOrderForProjectSlug(slug, projectMode, toPhaseId);
  if (toPhaseId === closePhaseIdForProjectSlug(slug, projectMode) && toOrder > fromOrder) {
    return "close";
  }
  return toOrder > fromOrder ? "advance" : "return";
}
function buildDecisionHistoryFieldChanges(previousTitle, nextTitle, previousDescription, nextDescription) {
  const changes = [];
  if (previousTitle !== nextTitle) {
    changes.push({
      label: "Title",
      before: previousTitle,
      after: nextTitle
    });
  }
  if (previousDescription !== nextDescription) {
    changes.push({
      label: "Description",
      before: previousDescription,
      after: nextDescription
    });
  }
  if (changes.length > 0) {
    return changes;
  }
  return [
    {
      label: "Title",
      before: previousTitle,
      after: nextTitle
    },
    {
      label: "Description",
      before: previousDescription,
      after: nextDescription
    }
  ];
}
function copyVotesByUserId(votesByUserId) {
  return { ...votesByUserId };
}
function upsertDecisionHistoryEntry(entries, entry) {
  if (!entry || entries.some((item) => item.id === entry.id)) {
    return;
  }
  entries.unshift(entry);
}
function buildProjectRequestSettingsHistorySnapshot(projectMode, settings) {
  return {
    ...settings,
    summary: projectRequestSettingsSummary(projectMode, settings)
  };
}
function buildProjectPhaseChangeHistoryEntry(slug, request) {
  const config = projectLifecycleBySlug[slug];
  const projectMode = projectModeForSlug(slug);
  if (!config) {
    return null;
  }
  return {
    id: request.id,
    entityKind: "project",
    kind: "project-phase-change",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "phase-change",
      changeKind: projectPhaseChangeKind(slug, projectMode, config.currentPhaseId, request.targetPhaseId),
      fromPhaseId: config.currentPhaseId,
      toPhaseId: request.targetPhaseId,
      reason: request.reason,
      closeOutcome: request.closeOutcome,
      conversionTarget: request.conversionTarget ?? null
    }
  };
}
function buildProjectPullRequestHistoryRepositoryUrl(slug) {
  const memberCount = projectGovernancePopulation(slug, (projectMembersBySlug[slug] ?? []).length);
  const phaseTwo = buildProductionPlans(
    slug,
    buildProjectValues(slug),
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );
  return resolvedSoftwareRepositoryUrl(slug, phaseTwo);
}
function buildProjectPullRequestHistoryEntry(slug, request) {
  if (request.stage !== "approval" && request.stage !== "confirmation") {
    return null;
  }
  return {
    id: request.stage === "approval" ? projectPullRequestApprovalDecisionId(request.id) : projectPullRequestConfirmationDecisionId(request.id),
    entityKind: "project",
    kind: request.stage === "approval" ? "project-pull-request-approval" : "project-pull-request-confirmation",
    createdAt: request.stage === "confirmation" ? request.confirmationCreatedAt ?? request.createdAt : request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "pull-request",
      title: request.title,
      summary: request.summary,
      pullRequestId: request.pullRequestId,
      pullRequestUrl: request.pullRequestUrl,
      mergeId: request.mergeId ?? null,
      repositoryUrl: buildProjectPullRequestHistoryRepositoryUrl(slug)
    }
  };
}
function buildProjectMergeCapabilityChangeHistoryEntry(request) {
  return {
    id: projectMergeCapabilityChangeDecisionId(request.id),
    entityKind: "project",
    kind: "project-merge-capability-change",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "merge-capability",
      action: request.action,
      targetUsername: userById(request.targetUserId)?.username ?? request.targetUserId
    }
  };
}
function buildProjectRepositoryReplacementHistoryEntry(request) {
  return {
    id: projectRepositoryReplacementDecisionId(request.id),
    entityKind: "project",
    kind: "project-repository-replacement",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "repository-replacement",
      repositoryUrl: request.repositoryUrl,
      previousRepositoryUrl: request.previousRepositoryUrl,
      reason: request.reason,
      relatedPullRequestId: request.relatedPullRequestId
    }
  };
}
function buildProjectUpdateHistoryEntry(request) {
  return {
    id: request.id,
    entityKind: "project",
    kind: "project-update",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "update",
      body: request.body,
      appliedUpdateId: null
    }
  };
}
function buildProjectEditHistoryEntry(slug, request) {
  const item = findPublicProjectItem(slug);
  const extras = projectDetailExtras[slug];
  if (!item || !extras) {
    return null;
  }
  return {
    id: request.id,
    entityKind: "project",
    kind: "project-edit",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "edit",
      changes: buildDecisionHistoryFieldChanges(
        item.title,
        request.title,
        extras.overview,
        request.description
      )
    }
  };
}
function buildProjectRequestSettingsHistoryEntry(slug, request) {
  const projectMode = projectModeForSlug(slug);
  const currentSettings = resolvedProjectRequestSettingsForProject(slug, projectMode);
  return {
    id: request.id,
    entityKind: "project",
    kind: "project-request-settings-change",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "settings-change",
      reason: request.reason,
      previousSettings: currentSettings,
      proposedSettings: request.proposedSettings
    }
  };
}
function buildEventUpdateHistoryEntry(request) {
  return {
    id: request.id,
    entityKind: "event",
    kind: "event-update",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "update",
      body: request.body,
      appliedUpdateId: null
    }
  };
}
function buildEventEditHistoryEntry(slug, request) {
  const event = findPublicEventItem(slug);
  if (!event) {
    return null;
  }
  const effectivePresentation = buildEffectiveEventPresentation(event);
  return {
    id: request.id,
    entityKind: "event",
    kind: "event-edit",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "edit",
      changes: buildDecisionHistoryFieldChanges(
        effectivePresentation.title,
        request.title,
        effectivePresentation.description,
        request.description
      )
    }
  };
}
function buildEventPhaseChangeHistoryEntry(slug, request) {
  const event = findPublicEventItem(slug);
  const workflow = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? "")?.id ?? null);
  const fromPhaseId = event ? workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event) : "proposal";
  if (!event) {
    return null;
  }
  return {
    id: request.id,
    entityKind: "event",
    kind: "event-phase-change",
    createdAt: request.createdAt,
    authorUsername: request.authorUsername,
    status: "open",
    approvalThresholdPercent: phaseChangeApprovalThresholdPercent,
    payload: {
      type: "phase-change",
      changeKind: eventPhaseChangeKind(event, fromPhaseId, request.targetPhaseId),
      fromPhaseId,
      toPhaseId: request.targetPhaseId,
      reason: request.reason
    }
  };
}
function ensureProjectDecisionHistorySeeded(slug) {
  const workflow = ensureProjectWorkflowState(slug);
  const history = workflow.decisionHistory ??= [];
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
function ensureEventDecisionHistorySeeded(slug, creatorId = null) {
  const workflow = ensureEventWorkflowState(slug, creatorId);
  const history = workflow.decisionHistory ??= [];
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
function finalizeDecisionHistoryEntry(entries, entryId, status, votesByUserId, eligibleVoterCount, updatePayload) {
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
function finalizeProjectDecisionHistoryEntry(slug, entryId, status, votesByUserId, eligibleVoterCount, updatePayload) {
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
function finalizeEventDecisionHistoryEntry(slug, entryId, status, votesByUserId, eligibleVoterCount, creatorId, updatePayload) {
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
function removeUserFromEventRequestVotes(slug, userId) {
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
function ensureEventMembership(slug, userId) {
  const event = findPublicEventItem(slug);
  if (!event) {
    return;
  }
  const creatorId = userByUsername(event.createdByUsername)?.id ?? null;
  if (creatorId === userId) {
    return;
  }
  const participation = eventParticipationById[event.id] ?? (eventParticipationById[event.id] = { goingUserIds: [], invitedUserIds: [] });
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
    ...eventGoingSinceById[event.id] ?? {},
    [userId]: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function canViewerEditEventPhase(slug, phaseId) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  if (!viewer || !event) {
    return false;
  }
  const currentPhaseId = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null).currentPhaseId ?? defaultEventCurrentPhaseId(event);
  if (currentPhaseId !== phaseId) {
    return false;
  }
  if (!event.isPrivate && canViewerParticipateInPlatformEventGovernance(slug)) {
    return true;
  }
  return buildEventMemberState(event).viewerHasEventEditAccess;
}
function canViewerRequestProjectPhaseChange(slug) {
  if (projectModeForSlug(slug) === "personal-service") {
    return false;
  }
  if (canViewerParticipateInPlatformProjectGovernance(slug)) {
    return true;
  }
  const memberState = buildProjectMemberState(slug);
  return memberState.viewerIsMember;
}
function canViewerVoteOnProjectPhaseChange(slug) {
  return canViewerRequestProjectPhaseChange(slug);
}
function canViewerRequestProjectUpdate(slug) {
  if (projectModeForSlug(slug) === "personal-service") {
    return false;
  }
  if (canViewerParticipateInPlatformProjectGovernance(slug)) {
    return true;
  }
  return buildProjectMemberState(slug).viewerIsMember;
}
function canViewerVoteOnProjectUpdate(slug) {
  return canViewerRequestProjectUpdate(slug);
}
function canViewerRequestProjectEdit(slug) {
  if (projectModeForSlug(slug) === "personal-service") {
    return false;
  }
  if (canViewerParticipateInPlatformProjectGovernance(slug)) {
    return true;
  }
  return buildProjectMemberState(slug).viewerIsMember;
}
function canViewerVoteOnProjectEdit(slug) {
  return canViewerRequestProjectEdit(slug);
}
function canViewerRequestEventUpdate(slug) {
  const event = findPublicEventItem(slug);
  if (!event) {
    return false;
  }
  if (!event.isPrivate && canViewerParticipateInPlatformEventGovernance(slug)) {
    return true;
  }
  return buildEventMemberState(event).viewerHasEventEditAccess;
}
function canViewerRequestEventPhaseChange(slug) {
  const event = findPublicEventItem(slug);
  if (!event) {
    return false;
  }
  if (canViewerParticipateInPlatformEventGovernance(slug)) {
    return true;
  }
  return buildEventMemberState(event).viewerHasEventEditAccess;
}
function canViewerVoteOnEventPhaseChange(slug) {
  return canViewerRequestEventPhaseChange(slug);
}
function canViewerVoteOnEventUpdate(slug) {
  return canViewerRequestEventUpdate(slug);
}
function canViewerRequestEventEdit(slug) {
  const event = findPublicEventItem(slug);
  if (!event) {
    return false;
  }
  if (!event.isPrivate && canViewerParticipateInPlatformEventGovernance(slug)) {
    return true;
  }
  return buildEventMemberState(event).viewerHasEventEditAccess;
}
function canViewerVoteOnEventEdit(slug) {
  return canViewerRequestEventEdit(slug);
}
function canViewerCreateEventActivity(slug) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  if (!viewer || !event) {
    return false;
  }
  const currentPhaseId = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null).currentPhaseId ?? defaultEventCurrentPhaseId(event);
  return currentPhaseId === "activity" && buildEventMemberState(event).viewerIsGoing;
}
function canViewerEditEventActivityCommitment(slug) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  if (!viewer || !event) {
    return false;
  }
  const currentPhaseId = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null).currentPhaseId ?? defaultEventCurrentPhaseId(event);
  return currentPhaseId === "activity" && buildEventMemberState(event).viewerCanToggleGoing;
}
function canAdvanceMockEventPhaseNow(slug) {
  const event = findPublicEventItem(slug);
  if (!event) {
    return false;
  }
  const currentPhaseId = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null).currentPhaseId ?? defaultEventCurrentPhaseId(event);
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
    case "proposal":
      return buildEventSignalSummary(event)?.advancementUnlocked ?? false;
    case "event-plan":
      return !!phaseTwo.winningPlanId;
    case "activity":
      return true;
    default:
      return false;
  }
}
function projectModeForSlug(slug) {
  return findPublicProjectItem(slug)?.projectMode ?? "productive";
}
function requestSettingsEligibleVoterCount(slug, projectMode = projectModeForSlug(slug)) {
  if (projectMode === "personal-service") {
    return findPublicProjectItem(slug) ? 1 : 0;
  }
  const memberState = buildProjectMemberState(slug);
  return projectGovernancePopulation(slug, memberState.memberCount);
}
function requestSystemEnabledForProject(slug, projectMode, phaseThree) {
  return resolvedProjectRequestSettingsForProject(slug, projectMode, phaseThree).enabled;
}
function collectiveRequestModeForProject(slug, phaseThree) {
  return resolvedProjectRequestSettingsForProject(slug, "collective-service", phaseThree).requestMode;
}
function collectiveAllowOffScheduleRequestsForProject(slug, phaseThree) {
  return resolvedProjectRequestSettingsForProject(
    slug,
    "collective-service",
    phaseThree
  ).allowOffScheduleRequests;
}
function rawProjectPlansForPhase(slug, phaseId) {
  const workflow = ensureProjectWorkflowState(slug);
  return phaseId === "phase-2" ? workflow.phaseTwoPlans : workflow.phaseThreePlans;
}
function canViewerManageProjectPhase(slug) {
  return buildProjectMemberState(slug).viewerIsProjectManager;
}
function canViewerEditProjectPhase(slug, phaseId) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];
  return !!viewer && (memberIds.includes(viewer.id) || canViewerParticipateInPlatformProjectGovernance(slug)) && projectLifecycleBySlug[slug]?.currentPhaseId === phaseId;
}
function canViewerEditProjectActivityCommitment(slug) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);
  return !!viewer && projectLifecycleBySlug[slug]?.currentPhaseId === activityPhaseIdForProject(projectMode);
}
function canViewerRequestProjectServiceRequestSettingsChange(slug) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);
  if (!viewer || projectLifecycleBySlug[slug]?.currentPhaseId !== activityPhaseIdForProject(projectMode)) {
    return false;
  }
  if (projectMode === "personal-service") {
    return isProjectCreator(slug, viewer.id);
  }
  const memberState = buildProjectMemberState(slug);
  return memberState.viewerIsMember;
}
function canViewerVoteOnProjectServiceRequestSettingsChange(slug) {
  if (projectModeForSlug(slug) === "personal-service") {
    return false;
  }
  return canViewerRequestProjectServiceRequestSettingsChange(slug);
}
function canViewerCreateProjectActivity(slug) {
  const viewer = currentViewer();
  const memberIds = projectMembersBySlug[slug] ?? [];
  const projectMode = projectModeForSlug(slug);
  if (!viewer || projectLifecycleBySlug[slug]?.currentPhaseId !== activityPhaseIdForProject(projectMode)) {
    return false;
  }
  if (projectMode === "personal-service") {
    return personalServiceUsesCalendar(slug) && canViewerManageProjectPhase(slug);
  }
  return memberIds.includes(viewer.id);
}
function canViewerSubmitProjectServiceRequest(slug) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);
  const requestSystemEnabled = requestSystemEnabledForProject(slug, projectMode);
  return !!viewer && requestSystemEnabled && projectLifecycleBySlug[slug]?.currentPhaseId === activityPhaseIdForProject(projectMode) && !(projectMode === "personal-service" && isProjectCreator(slug, viewer.id));
}
function canViewerReviewProjectServiceRequests(slug) {
  const projectMode = projectModeForSlug(slug);
  if (projectLifecycleBySlug[slug]?.currentPhaseId !== activityPhaseIdForProject(projectMode)) {
    return false;
  }
  if (projectMode === "collective-service") {
    return !!currentViewer();
  }
  if (projectMode === "personal-service") {
    return canViewerManageProjectPhase(slug);
  }
  return buildProjectMemberState(slug).viewerIsMember;
}
function findOverlappingPersonalServiceAvailabilityIndex(activities, scheduledAt, endsAt) {
  const requestStart = new Date(scheduledAt).getTime();
  const requestEnd = new Date(endsAt).getTime();
  return activities.findIndex((activity) => {
    const activityStart = new Date(activity.scheduledAt).getTime();
    const activityEnd = activity.endsAt ? new Date(activity.endsAt).getTime() : activityStart + 60 * 60 * 1e3;
    return requestStart < activityEnd && requestEnd > activityStart;
  });
}
function personalServiceUsesCalendar(slug) {
  return personalServiceRequestMode(slug) !== "direct";
}
function personalServiceRequestMode(slug) {
  return resolvedProjectRequestSettingsForProject(slug, "personal-service").requestMode;
}
function formatServiceRequestWindow(start, end) {
  if (!start || !end) {
    return "";
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString([], { month: "short", day: "numeric" })} ${startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} to ${endDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}
function normalizeProjectActivityRoleRequirements(roleRequirements) {
  return roleRequirements.map((role) => {
    const requiredCount = Math.max(1, Number(role.requiredCount) || 1);
    const parsedMaximumCount = Number(role.maximumCount);
    return {
      label: role.label.trim(),
      requiredCount,
      maximumCount: Number.isFinite(parsedMaximumCount) ? Math.max(requiredCount, Math.floor(parsedMaximumCount)) : void 0
    };
  }).filter((role) => role.label);
}
function minimumParticipantsForRawActivity(activity) {
  return activity.roles.reduce((total, role) => total + role.requiredCount, 0);
}
function rawProjectActivityIsActive(activity) {
  const committedCount = activity.roles.reduce((total, role) => total + role.assignedUsernames.length, 0);
  return committedCount >= minimumParticipantsForRawActivity(activity) && activity.roles.every((role) => role.assignedUsernames.length >= role.requiredCount);
}
function resolveProjectServiceRequestStatus(request, activities) {
  if (!request.linkedActivityId) {
    return request.status;
  }
  const linkedActivity = activities.find((activity) => activity.id === request.linkedActivityId);
  if (!linkedActivity) {
    return request.status;
  }
  return rawProjectActivityIsActive(linkedActivity) ? "accepted" : "planned";
}
function updateProjectPlanValueVoteMap(slug, phaseId, planId, valueId, viewerId, vote) {
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
function updateProjectPlanOverallVoteMap(slug, phaseId, planId, viewerId, vote) {
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
function updateEventPlanValueVoteMap(slug, planId, valueId, viewerId, vote) {
  const event = findPublicEventItem(slug);
  const plan = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? "")?.id ?? null).eventPlans?.find((item) => item.id === planId);
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
function updateEventPlanOverallVoteMap(slug, planId, viewerId, vote) {
  const event = findPublicEventItem(slug);
  const plan = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? "")?.id ?? null).eventPlans?.find((item) => item.id === planId);
  if (!plan) {
    return;
  }
  if (!vote) {
    delete plan.overallVotesByUserId[viewerId];
    return;
  }
  plan.overallVotesByUserId[viewerId] = vote;
}
function toggleMockProjectDemandSignal(slug) {
  setMockProjectSignal(slug, "demand");
}
function hydratedSignalCount(count, userIds) {
  return Math.max(count ?? 0, uniqueUserIds(userIds).length);
}
function setMockProjectSignal(slug, signal) {
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
  if (signal === "demand" && demandActive || signal === "opposition" && oppositionActive) {
    recordMeaningfulAction(viewer.id);
    return;
  }
  if (signal === "demand") {
    workflow.signalUserIds = [viewer.id, ...workflow.signalUserIds];
    workflow.signalCount += 1;
  } else {
    workflow.oppositionSignalUserIds = [viewer.id, ...workflow.oppositionSignalUserIds ?? []];
    workflow.oppositionSignalCount = (workflow.oppositionSignalCount ?? 0) + 1;
  }
  recordMeaningfulAction(viewer.id);
}
function addMockProjectValue(slug, label) {
  const viewer = currentViewer();
  const trimmed = label.trim();
  const workflow = ensureProjectWorkflowState(slug);
  if (!viewer || !trimmed || !canViewerEditProjectPhase(slug, "phase-1")) {
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
function setMockProjectValueImportance(slug, valueId, importance) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const value = workflow.values.find((item) => item.id === valueId);
  if (!viewer || !value || !canViewerEditProjectPhase(slug, "phase-1")) {
    return;
  }
  value.votesByUserId[viewer.id] = importance;
  recordMeaningfulAction(viewer.id);
}
function addMockProjectProductionPlan(slug, input) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const projectMode = projectModeForSlug(slug);
  const allowedSubtypes = projectSubtypeOptions(projectMode).filter((option) => !option.disabled).map((option) => option.value);
  const values = workflow.values;
  const description = input.description.trim();
  const repositoryUrl = input.repositoryUrl?.trim() ?? "";
  const demandConsiderationNote = input.demandConsiderationNote.trim();
  const totalCostLabel = input.totalCostLabel.trim();
  const planPhases = input.planPhases.map((phase, index) => ({
    id: `plan-phase-${slug}-${Date.now()}-${index}`,
    title: phase.title.trim(),
    details: phase.details.trim(),
    materialsLabel: phase.materialsLabel.trim(),
    costLabel: phase.costLabel.trim()
  })).filter(
    (phase) => phase.title && phase.details && phase.materialsLabel && phase.costLabel
  );
  if (!viewer || !canViewerEditProjectPhase(slug, "phase-2") || !input.title.trim() || !allowedSubtypes.includes(input.projectSubtype) || !description || input.projectSubtype === "software" && !repositoryUrl || !demandConsiderationNote || !totalCostLabel || planPhases.length === 0) {
    return false;
  }
  const phaseDetailsSummary = planPhases.map((phase) => `${phase.title}: ${phase.details}`).join(" ");
  const phaseMaterialSummary = planPhases.map((phase) => `${phase.materialsLabel} (${phase.costLabel})`).join(" ");
  workflow.phaseTwoPlans = [
    {
      id: `production-plan-${slug}-${Date.now()}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      description,
      projectSubtype: input.projectSubtype,
      repositoryUrl: input.projectSubtype === "software" ? repositoryUrl : void 0,
      demandSignalSnapshot: workflow.signalCount,
      demandConsiderationNote,
      planPhases,
      outputSummary: description,
      materialsSummary: phaseDetailsSummary,
      totalCostLabel,
      acquisitionsSummary: phaseMaterialSummary,
      overallVotesByUserId: {
        [viewer.id]: "yes"
      },
      valueVotesByValueId: Object.fromEntries(
        [
          [demandSignalAssessmentValueId, { [viewer.id]: "yes" }],
          ...values.map((value) => [value.id, { [viewer.id]: "yes" }])
        ]
      )
    },
    ...workflow.phaseTwoPlans
  ];
  recordMeaningfulAction(viewer.id);
  return true;
}
function addMockProjectDistributionPlan(slug, input) {
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
  const planPhases = input.planPhases.map((phase, index) => ({
    id: `plan-phase-${slug}-${Date.now()}-${index}`,
    title: phase.title.trim(),
    details: phase.details.trim(),
    materialsLabel: phase.materialsLabel.trim(),
    costLabel: phase.costLabel.trim()
  })).filter(
    (phase) => phase.title && phase.details && phase.materialsLabel && phase.costLabel
  );
  if (!viewer || currentSubtype === "software" || !canViewerEditProjectPhase(slug, "phase-3") || !input.title.trim() || !description || !demandConsiderationNote || !totalCostLabel || planPhases.length === 0) {
    return false;
  }
  const phaseDetailsSummary = planPhases.map((phase) => `${phase.title}: ${phase.details}`).join(" ");
  const phaseMaterialSummary = planPhases.map((phase) => `${phase.materialsLabel} (${phase.costLabel})`).join(" ");
  workflow.phaseThreePlans = [
    {
      id: `distribution-plan-${slug}-${Date.now()}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      description,
      demandSignalSnapshot: workflow.signalCount,
      demandConsiderationNote,
      totalCostLabel,
      planPhases,
      distributionSummary: description,
      accessSummary: phaseDetailsSummary,
      reserveSummary: phaseMaterialSummary,
      requestSystemEnabled: input.requestSystemEnabled ?? false,
      requestMode: input.requestMode ?? "both",
      allowOffScheduleRequests: input.allowOffScheduleRequests ?? false,
      overallVotesByUserId: {
        [viewer.id]: "yes"
      },
      valueVotesByValueId: Object.fromEntries(
        [
          [demandSignalAssessmentValueId, { [viewer.id]: "yes" }],
          ...values.map((value) => [value.id, { [viewer.id]: "yes" }])
        ]
      )
    },
    ...workflow.phaseThreePlans
  ];
  recordMeaningfulAction(viewer.id);
  return true;
}
function setMockProjectPlanValueVote(slug, phaseId, planId, valueId, vote) {
  const viewer = currentViewer();
  if (!viewer || !canViewerEditProjectPhase(slug, phaseId)) {
    return;
  }
  updateProjectPlanValueVoteMap(slug, phaseId, planId, valueId, viewer.id, vote);
}
function setMockProjectPlanOverallVote(slug, phaseId, planId, vote) {
  const viewer = currentViewer();
  if (!viewer || !canViewerEditProjectPhase(slug, phaseId)) {
    return;
  }
  updateProjectPlanOverallVoteMap(slug, phaseId, planId, viewer.id, vote);
}
function addMockProjectActivity(slug, input) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const roleRequirements = normalizeProjectActivityRoleRequirements(input.roleRequirements);
  const minimumParticipants = roleRequirements.reduce(
    (total, role) => total + role.requiredCount,
    0
  );
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const project = findPublicProjectItem(slug);
  if (!viewer || !canViewerCreateProjectActivity(slug) || !input.title.trim() || !input.scheduledAt.trim() || !input.endsAt.trim() || !input.locationLabel.trim() || !input.note.trim() || roleRequirements.length === 0 || minimumParticipants < 1 || new Date(input.endsAt).getTime() <= new Date(input.scheduledAt).getTime()) {
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
      kind: "project",
      surface: "public",
      subjectKind: "project",
      projectMode: project.projectMode,
      actorUsername: viewer.username,
      actionLabel: "scheduled activity",
      title: `${project.title}`,
      body: `${viewer.username} scheduled ${input.title.trim()} for ${new Date(input.scheduledAt).toLocaleString()} to ${new Date(input.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      href: `/projects/${slug}`,
      createdAt: now,
      isUnread: true,
      channelTags: project.channelTags,
      communityTags: project.communityTags
    });
  }
}
function setMockProjectActivityCommitment(slug, activityId, roleLabel) {
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
  const maximumCount = targetRole.maximumCount != null ? Math.max(targetRole.maximumCount, targetRole.requiredCount) : void 0;
  if (maximumCount != null && targetRole.assignedUsernames.length >= maximumCount) {
    return;
  }
  ensureProjectMembership(slug, viewer.id);
  targetRole.assignedUsernames = [...targetRole.assignedUsernames, viewer.username];
}
function addMockProjectServiceRequest(slug, input) {
  const viewer = currentViewer();
  const trimmedTitle = input.title.trim();
  const trimmedBody = input.body.trim();
  const trimmedScheduledAt = input.scheduledAt?.trim();
  const trimmedEndsAt = input.endsAt?.trim();
  const workflow = ensureProjectWorkflowState(slug);
  const serviceRequests = workflow.serviceRequests ?? [];
  const projectMode = projectModeForSlug(slug);
  const personalRequestMode = projectMode === "personal-service" ? personalServiceRequestMode(slug) : "calendar";
  const usesCalendar = projectMode === "personal-service" ? personalServiceUsesCalendar(slug) : false;
  const collectiveRequestMode = projectMode === "collective-service" ? collectiveRequestModeForProject(slug) : "both";
  const collectiveAllowOffScheduleRequests = projectMode === "collective-service" ? collectiveAllowOffScheduleRequestsForProject(slug) : false;
  if (!viewer || !trimmedTitle || !trimmedBody || !canViewerSubmitProjectServiceRequest(slug)) {
    return;
  }
  if (projectMode === "personal-service" && personalRequestMode === "calendar" && (!trimmedScheduledAt || !trimmedEndsAt || new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime())) {
    return;
  }
  if (projectMode === "personal-service" && personalRequestMode === "both" && trimmedScheduledAt && trimmedEndsAt && new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime()) {
    return;
  }
  if (projectMode === "collective-service" && (!trimmedScheduledAt || !trimmedEndsAt || new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime())) {
    return;
  }
  if (projectMode === "collective-service" && collectiveRequestMode === "calendar" && (!trimmedScheduledAt || !trimmedEndsAt || new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime())) {
    return;
  }
  if (projectMode === "collective-service" && collectiveRequestMode === "both" && trimmedScheduledAt && trimmedEndsAt && new Date(trimmedEndsAt).getTime() <= new Date(trimmedScheduledAt).getTime()) {
    return;
  }
  if (projectMode === "collective-service" && collectiveRequestMode === "both" && !collectiveAllowOffScheduleRequests && (!trimmedScheduledAt || !trimmedEndsAt)) {
    return;
  }
  if (projectMode === "personal-service" && personalRequestMode !== "direct" && trimmedScheduledAt && trimmedEndsAt && findOverlappingPersonalServiceAvailabilityIndex(
    workflow.phaseFiveActivities,
    trimmedScheduledAt,
    trimmedEndsAt
  ) < 0) {
    return;
  }
  if (projectMode === "collective-service" && collectiveRequestMode !== "direct" && (!collectiveAllowOffScheduleRequests || collectiveRequestMode === "calendar") && trimmedScheduledAt && trimmedEndsAt && findOverlappingPersonalServiceAvailabilityIndex(
    workflow.phaseFiveActivities,
    trimmedScheduledAt,
    trimmedEndsAt
  ) < 0) {
    return;
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  workflow.serviceRequests = [
    {
      id: `project-service-request-${slug}-${Date.now()}`,
      title: trimmedTitle,
      body: trimmedBody,
      requesterUsername: viewer.username,
      createdAt,
      status: "open",
      scheduledAt: trimmedScheduledAt || void 0,
      endsAt: trimmedEndsAt || void 0,
      linkedActivityId: null
    },
    ...serviceRequests
  ];
  if (projectMode === "personal-service" && !isProjectCreator(slug, viewer.id)) {
    const memberIds = projectMembersBySlug[slug] ?? [];
    if (!memberIds.includes(viewer.id)) {
      projectMembersBySlug[slug] = [...memberIds, viewer.id];
    }
    const project = findPublicProjectItem(slug);
    const creator = project ? userByUsername(project.authorUsername) : null;
    if (project && creator && creator.id !== viewer.id) {
      const requestWindow = formatServiceRequestWindow(trimmedScheduledAt, trimmedEndsAt);
      const notificationBody = usesCalendar && requestWindow ? `${viewer.username} requested "${trimmedTitle}" for ${requestWindow}.` : `${viewer.username} requested "${trimmedTitle}".`;
      pushUserNotification(creator.id, {
        id: `notification-project-request-${slug}-${creator.id}-${Date.now()}`,
        kind: "project",
        surface: "public",
        subjectKind: "project",
        projectMode: project.projectMode,
        actorUsername: viewer.username,
        actionLabel: "Requested",
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
        usesCalendar && requestWindow ? `Requested "${trimmedTitle}" for ${requestWindow}. ${trimmedBody}` : `Requested "${trimmedTitle}". ${trimmedBody}`
      );
    }
  }
}
function planMockProjectServiceRequest(slug, requestId, input) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = (workflow.serviceRequests ?? []).find((item) => item.id === requestId);
  const roleRequirements = normalizeProjectActivityRoleRequirements(input.roleRequirements);
  const minimumParticipants = roleRequirements.reduce(
    (total, role) => total + role.requiredCount,
    0
  );
  if (!viewer || !request || request.status !== "open" || !request.scheduledAt || !request.endsAt || !canViewerReviewProjectServiceRequests(slug) || !input.title.trim() || !input.locationLabel.trim() || !input.note.trim() || roleRequirements.length === 0 || minimumParticipants < 1) {
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
  request.status = "planned";
  request.linkedActivityId = activityId;
}
function setMockProjectServiceRequestStatus(slug, requestId, status) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = (workflow.serviceRequests ?? []).find((item) => item.id === requestId);
  if (!request || !canViewerReviewProjectServiceRequests(slug)) {
    return;
  }
  const wasOpen = request.status === "open";
  request.status = status;
  if (wasOpen && status === "accepted" && projectModeForSlug(slug) === "personal-service" && personalServiceUsesCalendar(slug) && request.scheduledAt && request.endsAt) {
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
function maybeApplyApprovedProjectServiceRequestSettingsChange(slug, requestId) {
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
      "rejected",
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
    allowOffScheduleRequests: projectMode === "personal-service" ? request.proposedSettings.requestMode === "both" : request.proposedSettings.allowOffScheduleRequests
  };
  finalizeProjectDecisionHistoryEntry(
    slug,
    requestId,
    "approved",
    request.votesByUserId,
    eligibleVoterCount
  );
  workflow.requestSettingsChangeRequests = (workflow.requestSettingsChangeRequests ?? []).filter(
    (item) => item.id !== requestId
  );
}
function buildProjectServiceHistoryItemById(slug, historyId) {
  const projectMode = projectModeForSlug(slug);
  const memberCount = (projectMembersBySlug[slug] ?? []).length;
  const governancePopulation = projectGovernancePopulation(slug, memberCount);
  const quorumThresholdPercent = calculateProjectQuorumThreshold(governancePopulation);
  const values = buildProjectValues(slug);
  const phaseTwo = buildProductionPlans(slug, values, quorumThresholdPercent, governancePopulation);
  buildDistributionPlans(
    slug,
    values,
    quorumThresholdPercent,
    governancePopulation,
    phaseTwo
  );
  const selectablePlanPhases = buildSelectableActivityPlanPhases(phaseTwo);
  return buildProjectPhaseFiveState(slug, projectMode, selectablePlanPhases).history.find(
    (item) => item.id === historyId
  ) ?? null;
}
function requestMockProjectServiceRequestSettingsChange(slug, input) {
  const viewer = currentViewer();
  const projectMode = projectModeForSlug(slug);
  if (!viewer || !canViewerRequestProjectServiceRequestSettingsChange(slug)) {
    return;
  }
  const workflow = ensureProjectWorkflowState(slug);
  const proposedSettings = {
    enabled: input.enabled,
    requestMode: input.requestMode,
    allowOffScheduleRequests: projectMode === "personal-service" ? input.requestMode === "both" : input.allowOffScheduleRequests
  };
  const currentSettings = resolvedProjectRequestSettingsForProject(slug, projectMode);
  if (projectRequestSettingsMatch(currentSettings, proposedSettings)) {
    return;
  }
  if (projectMode === "personal-service") {
    workflow.requestSystemOverride = proposedSettings;
    workflow.requestSettingsChangeRequests = [];
    return;
  }
  const trimmedReason = input.reason.trim();
  if (!trimmedReason) {
    return;
  }
  if ((workflow.requestSettingsChangeRequests ?? []).some(
    (request2) => projectRequestSettingsSignature(request2.proposedSettings) === projectRequestSettingsSignature(proposedSettings)
  )) {
    return;
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const requestId = `project-request-settings-${slug}-${Date.now()}`;
  const request = {
    id: requestId,
    reason: trimmedReason,
    authorUsername: viewer.username,
    createdAt,
    proposedSettings,
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.requestSettingsChangeRequests = [
    request,
    ...workflow.requestSettingsChangeRequests ?? []
  ];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectRequestSettingsHistoryEntry(slug, request)
  );
  maybeApplyApprovedProjectServiceRequestSettingsChange(slug, requestId);
}
function setMockProjectServiceRequestSettingsChangeVote(slug, requestId, vote) {
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
function setMockProjectServiceHistoryCompletion(slug, historyId, role, selection) {
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
  const completion = workflow.serviceHistoryCompletions?.[historyId] ?? (workflow.serviceHistoryCompletions[historyId] = {
    requesterSelectionsByUsername: {},
    participantSelectionsByUsername: {}
  });
  completion.requesterSelectionsByUsername = existingCompletion.requesterSelectionsByUsername;
  completion.participantSelectionsByUsername = existingCompletion.participantSelectionsByUsername;
  delete completion.requesterDoneByUsernames;
  delete completion.participantDoneByUsernames;
  if (role === "requester") {
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
function advanceMockProjectPhase(slug, closeNote) {
  const config = projectLifecycleBySlug[slug];
  const viewer = currentViewer();
  const projectMode = findPublicProjectItem(slug)?.projectMode ?? "productive";
  const trimmedCloseNote = closeNote?.trim() ?? "";
  const closingPhaseId = closePhaseIdForProjectSlug(slug, projectMode);
  if (!config || !canViewerManageProjectPhase(slug)) {
    return;
  }
  const lifecycle = buildProjectLifecycle(slug, projectMode, (projectMembersBySlug[slug] ?? []).length);
  switch (config.currentPhaseId) {
    case "phase-1":
      if (projectMode !== "personal-service" && lifecycle.phaseOne.values.length === 0) {
        return;
      }
      break;
    case "phase-2":
      if (!lifecycle.phaseTwo.winningPlanId) {
        return;
      }
      break;
    case "phase-3":
      if (!lifecycle.phaseThree.winningPlanId) {
        return;
      }
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
        title: "Closure note",
        body: trimmedCloseNote,
        authorUsername: viewer.username,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      ...projectDetailExtras[slug].updates
    ];
  }
}
function revertMockProjectPhase(slug, targetPhaseId, reason) {
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    ...workflow.revertHistory ?? []
  ];
  if (projectDetailExtras[slug]) {
    projectDetailExtras[slug].updates = [
      {
        id: `project-update-return-${slug}-${Date.now()}`,
        title: "Return note",
        body: trimmedReason,
        authorUsername: viewer.username,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      ...projectDetailExtras[slug].updates
    ];
  }
}
function toggleMockScopeMembership(kind, slug) {
  const viewer = currentViewer();
  const membership = scopeMembershipByKey[scopeMembershipKey(kind, slug)];
  if (!viewer || !membership) {
    return;
  }
  const viewerIsMember = membership.memberIds.includes(viewer.id);
  if (!viewerIsMember && membership.joinPolicy === "invite_only") {
    return;
  }
  membership.memberIds = viewerIsMember ? membership.memberIds.filter((userId) => userId !== viewer.id) : [viewer.id, ...membership.memberIds];
}
function extractInviteToken(inviteValue) {
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
function redeemMockScopeInvite(kind, slug, inviteValue) {
  const viewer = currentViewer();
  const membership = scopeMembershipByKey[scopeMembershipKey(kind, slug)];
  const inviteToken = extractInviteToken(inviteValue);
  if (!viewer || !membership || membership.joinPolicy !== "invite_only" || !membership.inviteToken) {
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
function signInMockAccount(input) {
  const username = normalizeUsernameInput(input.username);
  const password = input.password.trim();
  const user = userByUsername(username);
  if (!username || !password) {
    return {
      ok: false,
      error: "Enter both a username and password."
    };
  }
  if (!user || credentialsByUserId[user.id] !== password) {
    return {
      ok: false,
      error: "That username and password do not match this mock account list."
    };
  }
  mockSessionFixture.currentViewerId = user.id;
  currentSettingsState();
  return { ok: true };
}
function signOutMockAccount() {
  mockSessionFixture.currentViewerId = null;
}
function signUpMockAccount(input) {
  const username = normalizeUsernameInput(input.username);
  const password = input.password.trim();
  const profileBio = input.profileBio?.trim() ?? "";
  if (!username || !password) {
    return {
      ok: false,
      error: "Choose both a username and password."
    };
  }
  if (userByUsername(username)) {
    return {
      ok: false,
      error: "That username is already taken in the mock data."
    };
  }
  const user = {
    id: uniqueUserId(username),
    username,
    bio: profileBio || void 0
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
  return { ok: true };
}
function createProjectDiscussionNote(input) {
  if (input.channelTags.some((tag) => tag.slug === platform.slug)) {
    return "Platform-tagged project chat stays attached here so governance coordination stays visible without turning into a generic thread.";
  }
  if (input.projectMode === "personal-service") {
    return "Use chat here to coordinate requests, timing, and service follow-up without splitting the work across separate surfaces.";
  }
  return "Use chat here to keep planning, coordination, and follow-up attached to the project itself.";
}
function createProjectDescription(input) {
  const pieces = [input.description.trim()];
  if (input.note?.trim()) {
    pieces.push(input.note.trim());
  }
  return pieces.join(" ");
}
function createMockProject(input) {
  const viewer = currentViewer();
  const title = input.title.trim();
  const description = input.description.trim();
  const locationLabel = projectLocationLabel(input.locationLabel);
  const channelTags = input.channelTags;
  const communityTags = input.communityTags;
  const isPlatformProject = channelTags.some((tag) => tag.slug === platform.slug);
  if (!viewer) {
    return {
      ok: false,
      error: "Sign in before creating a project."
    };
  }
  if (!title || !description || channelTags.length === 0) {
    return {
      ok: false,
      error: "Projects need a title, description, and at least one channel tag."
    };
  }
  if (input.projectMode === "personal-service" && isPlatformProject) {
    return {
      ok: false,
      error: "Personal service projects cannot use the platform channel."
    };
  }
  const slug = uniqueSlug(title);
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const id = `project-${slug}`;
  publicFeedBase.unshift({
    kind: "project",
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
    stage: input.projectMode === "personal-service" ? "Activity" : "Proposal",
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
    requestSystemEnabled: input.projectMode === "personal-service" ? true : void 0,
    requestSettingsChangeRequests: [],
    serviceHistoryCompletions: {},
    revertHistory: [],
    phaseChangeRequests: [],
    availabilitySummary: input.projectMode === "personal-service" && input.serviceRequestMode !== "direct" ? "Availability will be coordinated directly through this service page." : void 0,
    travelRadiusLabel: input.projectMode === "personal-service" && input.serviceRequestMode !== "direct" ? locationLabel : void 0,
    serviceRequestMode: input.projectMode === "personal-service" ? input.serviceRequestMode ?? "both" : void 0
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
  recordMeaningfulAction(viewer.id);
  return {
    ok: true,
    slug
  };
}
function createMockThread(input) {
  const viewer = currentViewer();
  const title = input.title.trim();
  const body = input.body.trim();
  const tags = [...input.channelTags, ...input.communityTags];
  if (!viewer) {
    return {
      ok: false,
      error: "Sign in before creating a thread."
    };
  }
  if (!title || !body || tags.length === 0) {
    return {
      ok: false,
      error: "Threads need a title, opening post, and at least one discovery tag."
    };
  }
  const slug = uniqueSlug(title);
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const id = `thread-${slug}`;
  publicFeedBase.unshift({
    kind: "thread",
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
  threadDiscussionNotes[slug] = input.channelTags.some((tag) => tag.slug === platform.slug) ? "Platform threads stay open to regular users, and platform-tagged projects can also be proposed by any signed-in user." : "Discussion stays visible here so replies and follow-up notes remain attached to the original question.";
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);
  return {
    ok: true,
    slug
  };
}
function createMockEvent(input) {
  const viewer = currentViewer();
  const title = input.title.trim();
  const description = input.description.trim();
  if (!viewer) {
    return {
      ok: false,
      error: "Sign in before creating an event."
    };
  }
  if (!title || !description) {
    return {
      ok: false,
      error: "Events need a title and a proposal description."
    };
  }
  const invitedUserIds = [];
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
  const privateCommunityOnly = input.channelTags.length === 0 && input.communityTags.length === 1 && readScopeMembership("community", input.communityTags[0].slug).joinPolicy === "invite_only";
  const personalInviteOnly = input.channelTags.length === 0 && input.communityTags.length === 0 && invitedUserIds.length > 0;
  const isPrivate = privateCommunityOnly || personalInviteOnly;
  if (!isPrivate && input.channelTags.length === 0) {
    return {
      ok: false,
      error: "Public events need at least one channel tag. Only private events can omit channels."
    };
  }
  const slug = uniqueSlug(title);
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const id = `event-${slug}`;
  publicFeedBase.unshift({
    kind: "event",
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
    timeLabel: "",
    locationLabel: "",
    voteCount: 0,
    activeVote: 0,
    commentCount: 0,
    goingCount: 1,
    lastActivityAt: createdAt
  });
  eventDetailExtras[slug] = {
    attendanceNote: isPrivate ? "This private event starts as a proposal for the invited or tagged audience. Schedule and location are added once the plan is approved." : "This event starts as a proposal that stays discoverable through its tags. Schedule and location are added once the plan is approved.",
    agenda: [],
    updates: [],
    discussionNote: isPrivate ? "Private event chat stays live here so logistics and follow-up questions stay inside the invited group." : "Event chat stays live here so logistics and follow-up notes stay immediate instead of forum-like.",
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
    currentPhaseId: isPrivate ? "event-plan" : "proposal",
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
function createMockPost(input) {
  const viewer = currentViewer();
  const body = input.body.trim();
  if (!viewer) {
    return {
      ok: false,
      error: "Sign in before posting."
    };
  }
  if (!body) {
    return {
      ok: false,
      error: "Posts need body copy before they can be published."
    };
  }
  const id = uniquePostId(body.slice(0, 48));
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  socialPostsBase.unshift({
    kind: "post",
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
  postDiscussionNotes[id] = input.audience === "public" ? "Public personal posts still keep their own reply surface so discussion does not disappear into the feed." : "Follower posts still keep a real discussion surface so replies stay visible to the people who can see them.";
  commentsBySubjectId[id] = [];
  seedVoteTarget(id, 0, 0);
  return {
    ok: true,
    id
  };
}
function createMockChannel(input) {
  const viewer = currentViewer();
  const name = input.name.trim();
  const description = input.description.trim();
  if (!viewer) {
    return {
      ok: false,
      error: "Sign in before creating a channel."
    };
  }
  if (!name || !description) {
    return {
      ok: false,
      error: "Channels need a name and description."
    };
  }
  const slug = uniqueScopeSlug(name, "channel");
  channelDirectory.unshift({
    slug,
    label: name,
    href: `/channels/${slug}`
  });
  scopeMembershipByKey[scopeMembershipKey("channel", slug)] = {
    memberIds: [viewer.id],
    joinPolicy: "open"
  };
  createdChannelScopeMetaBySlug[slug] = createDefaultScopeMeta(
    "channel",
    description,
    "open"
  );
  return {
    ok: true,
    slug
  };
}
function createMockCommunity(input) {
  const viewer = currentViewer();
  const name = input.name.trim();
  const description = input.description.trim();
  if (!viewer) {
    return {
      ok: false,
      error: "Sign in before creating a community."
    };
  }
  if (!name || !description) {
    return {
      ok: false,
      error: "Communities need a name and description."
    };
  }
  const slug = uniqueScopeSlug(name, "community");
  communityDirectory.unshift({
    slug,
    label: name,
    href: `/communities/${slug}`
  });
  scopeMembershipByKey[scopeMembershipKey("community", slug)] = {
    memberIds: [viewer.id],
    joinPolicy: input.joinPolicy,
    inviteToken: input.joinPolicy === "invite_only" ? `${slug}-invite` : void 0,
    hiddenFeedCopy: input.joinPolicy === "invite_only" ? "This closed community only shows its feed to members. Join with an invite link before the work and discussion unlock here." : void 0
  };
  createdCommunityScopeMetaBySlug[slug] = createDefaultScopeMeta(
    "community",
    description,
    input.joinPolicy
  );
  return {
    ok: true,
    slug
  };
}
function addMockComment(subjectId, body, parentId) {
  const viewer = currentViewer();
  const trimmed = body.trim();
  if (!viewer || !trimmed) {
    return;
  }
  const comments = commentsBySubjectId[subjectId] ?? [];
  commentsBySubjectId[subjectId] = comments;
  const comment = {
    id: `comment-${subjectId}-${Date.now()}`,
    authorUsername: viewer.username,
    body: trimmed,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
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
function submitMockReport(subjectId, targetId, reason, details) {
  const viewer = currentViewer();
  const trimmedReason = reason.trim();
  const trimmedDetails = details.trim();
  if (!viewer || !subjectId.trim() || !targetId.trim() || trimmedReason !== "spam" && trimmedReason !== "serious-harm") {
    return;
  }
  const existingReport = contentReportsByTargetId[targetId];
  if (existingReport) {
    if (existingReport.resolution !== "removed" && existingReport.eligibleUserIds.includes(viewer.id)) {
      existingReport.votesByUserId[viewer.id] = "yes";
      reconcileContentReport(existingReport);
    }
    return;
  }
  const context = resolveReportTargetContext(subjectId, targetId);
  if (!context || context.authorUserId === viewer.id) {
    return;
  }
  if (context.targetKind === "direct-message") {
    removeMessageFromConversations(targetId);
    return;
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const report = {
    id: `report-${targetId}-${Date.now()}`,
    subjectId,
    targetId,
    targetKind: context.targetKind,
    reason: trimmedReason,
    description: trimmedDetails,
    reporterUserId: viewer.id,
    reportedAuthorUserId: context.authorUserId,
    eligibleUserIds: context.eligibleUserIds,
    votesByUserId: context.eligibleUserIds.includes(viewer.id) ? {
      [viewer.id]: "yes"
    } : {},
    createdAt,
    resolution: "open"
  };
  contentReportsByTargetId[targetId] = report;
  reconcileContentReport(report);
}
function setMockReportVote(targetId, vote) {
  const viewer = currentViewer();
  const report = contentReportsByTargetId[targetId];
  if (!viewer || !report || report.resolution === "removed" || !report.eligibleUserIds.includes(viewer.id)) {
    return;
  }
  report.votesByUserId[viewer.id] = vote;
  reconcileContentReport(report);
}
function addMockProjectUpdate(slug, _title, body) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const trimmedBody = body.trim();
  const memberState = buildProjectMemberState(slug);
  const projectMode = projectModeForSlug(slug);
  if (!viewer || !extras || !trimmedBody || projectMode !== "personal-service" || !memberState.viewerIsProjectManager) {
    return;
  }
  extras.updates = [
    {
      id: `project-update-${slug}-${Date.now()}`,
      title: "",
      body: trimmedBody,
      authorUsername: viewer.username,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    ...extras.updates
  ];
}
function applyProjectDetailsChange(slug, title, description, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
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
function maybeApplyApprovedProjectUpdate(slug, requestId) {
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
    finalizeProjectDecisionHistoryEntry(slug, requestId, "rejected", request.votesByUserId, memberCount);
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
      title: "",
      body: request.body,
      authorUsername: request.authorUsername,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    ...extras.updates
  ];
  finalizeProjectDecisionHistoryEntry(
    slug,
    requestId,
    "approved",
    request.votesByUserId,
    memberCount,
    (payload) => {
      if (payload.type === "update") {
        payload.appliedUpdateId = updateId;
      }
    }
  );
  workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
}
function maybeApplyApprovedProjectEdit(slug, requestId) {
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
    finalizeProjectDecisionHistoryEntry(slug, requestId, "rejected", request.votesByUserId, memberCount);
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
    (/* @__PURE__ */ new Date()).toISOString()
  );
  finalizeProjectDecisionHistoryEntry(slug, requestId, "approved", request.votesByUserId, memberCount);
  workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
}
function canViewerVoteOnProjectPullRequest(slug) {
  const viewer = currentViewer();
  if (!viewer) {
    return false;
  }
  if (isPlatformTaggedProject(slug)) {
    return canViewerParticipateInPlatformProjectGovernance(slug);
  }
  return (projectMembersBySlug[slug] ?? []).includes(viewer.id);
}
function canViewerRecordProjectPullRequestMerge(slug) {
  const project = findPublicProjectItem(slug);
  if (!project) {
    return false;
  }
  const lifecycle = buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length);
  const viewer = currentViewer();
  return !!viewer && !!lifecycle.phaseFive.softwareGovernance?.mergeCapabilityMembers.some((member) => member.id === viewer.id);
}
function findProjectPullRequestByDecisionId(workflow, decisionId) {
  return (workflow.softwarePullRequests ?? []).find((request) => {
    switch (request.stage) {
      case "approval":
        return projectPullRequestApprovalDecisionId(request.id) === decisionId;
      case "confirmation":
        return projectPullRequestConfirmationDecisionId(request.id) === decisionId;
      default:
        return false;
    }
  });
}
function findProjectMergeCapabilityChangeByDecisionId(workflow, decisionId) {
  return (workflow.softwareMergeCapabilityChangeRequests ?? []).find(
    (request) => request.status === "open" && projectMergeCapabilityChangeDecisionId(request.id) === decisionId
  );
}
function findProjectRepositoryReplacementByDecisionId(workflow, decisionId) {
  return (workflow.softwareRepositoryReplacementRequests ?? []).find(
    (request) => request.status === "open" && projectRepositoryReplacementDecisionId(request.id) === decisionId
  );
}
function buildProjectSoftwareDecisionVoteSummary(slug, votesByUserId) {
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
function maybeApplyApprovedProjectPullRequest(slug, requestId) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.softwarePullRequests?.find((item) => item.id === requestId);
  if (!request || request.stage !== "approval" && request.stage !== "confirmation") {
    return;
  }
  const memberState = buildProjectMemberState(slug);
  const memberCount = projectGovernancePopulation(slug, memberState.memberCount);
  const voteSummary = buildProjectVoteSummary(
    request.votesByUserId,
    calculateProjectQuorumThreshold(memberCount),
    memberCount
  );
  const decisionId = request.stage === "approval" ? projectPullRequestApprovalDecisionId(request.id) : projectPullRequestConfirmationDecisionId(request.id);
  if (!thresholdVoteCanStillPass(voteSummary, phaseChangeApprovalThresholdPercent)) {
    finalizeProjectDecisionHistoryEntry(
      slug,
      decisionId,
      "rejected",
      request.votesByUserId,
      memberCount,
      (payload) => {
        if (payload.type === "pull-request") {
          payload.mergeId = request.mergeId ?? null;
        }
      }
    );
    request.stage = "rejected";
    return;
  }
  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }
  finalizeProjectDecisionHistoryEntry(
    slug,
    decisionId,
    "approved",
    request.votesByUserId,
    memberCount,
    (payload) => {
      if (payload.type === "pull-request") {
        payload.mergeId = request.mergeId ?? null;
      }
    }
  );
  if (request.stage === "approval") {
    request.stage = "awaiting-merge";
    request.votesByUserId = {};
    return;
  }
  request.stage = "confirmed";
  request.votesByUserId = {};
}
function maybeApplyApprovedProjectMergeCapabilityChange(slug, requestId) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.softwareMergeCapabilityChangeRequests?.find(
    (item) => item.id === requestId && item.status === "open"
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
    finalizeProjectDecisionHistoryEntry(slug, decisionId, "rejected", request.votesByUserId, memberCount);
    request.status = "rejected";
    return;
  }
  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }
  finalizeProjectDecisionHistoryEntry(slug, decisionId, "approved", request.votesByUserId, memberCount);
  const project = findPublicProjectItem(slug);
  const lifecycle = project ? buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length) : null;
  const currentUserIds = lifecycle?.phaseFive.softwareGovernance?.mergeCapabilityMembers.map(
    (member) => member.id
  ) ?? [];
  workflow.softwareMergeCapabilityUserIds = request.action === "grant" ? Array.from(/* @__PURE__ */ new Set([request.targetUserId, ...currentUserIds])) : currentUserIds.filter((userId) => userId !== request.targetUserId);
  request.status = "approved";
  request.votesByUserId = {};
}
function maybeApplyApprovedProjectRepositoryReplacement(slug, requestId) {
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.softwareRepositoryReplacementRequests?.find(
    (item) => item.id === requestId && item.status === "open"
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
    finalizeProjectDecisionHistoryEntry(slug, decisionId, "rejected", request.votesByUserId, memberCount);
    request.status = "rejected";
    return;
  }
  if (!voteSummary.meetsQuorum || !phaseChangePassesApprovalThreshold(voteSummary)) {
    return;
  }
  finalizeProjectDecisionHistoryEntry(slug, decisionId, "approved", request.votesByUserId, memberCount);
  workflow.softwareRepositoryUrlOverride = request.repositoryUrl;
  workflow.softwareRepositoryHistory = [
    {
      id: request.id,
      repositoryUrl: request.repositoryUrl,
      previousRepositoryUrl: request.previousRepositoryUrl,
      reason: request.reason,
      relatedPullRequestId: request.relatedPullRequestId,
      replacedAt: (/* @__PURE__ */ new Date()).toISOString(),
      replacedByUsername: request.authorUsername
    },
    ...(workflow.softwareRepositoryHistory ?? []).filter((entry) => entry.id !== request.id)
  ];
  const relatedPullRequest = workflow.softwarePullRequests?.find(
    (item) => item.id === request.relatedPullRequestId
  );
  if (relatedPullRequest && (relatedPullRequest.stage === "awaiting-merge" || relatedPullRequest.stage === "rejected")) {
    relatedPullRequest.stage = "replaced";
  }
  if (!isPlatformTaggedProject(slug)) {
    const requesterId = userByUsername(request.authorUsername)?.id ?? null;
    if (requesterId) {
      workflow.softwareMergeCapabilityUserIds = [requesterId];
    }
  }
  request.status = "approved";
  request.votesByUserId = {};
}
function addMockProjectPullRequest(slug, input) {
  const viewer = currentViewer();
  const project = findPublicProjectItem(slug);
  const lifecycle = project ? buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length) : null;
  const trimmedTitle = input.title.trim();
  const trimmedSummary = input.summary.trim();
  const trimmedPullRequestId = input.pullRequestId.trim();
  const trimmedPullRequestUrl = input.pullRequestUrl.trim();
  if (!viewer || !project || !lifecycle?.phaseFive.softwareGovernance || lifecycle.currentPhaseId !== activityPhaseIdForProject(project.projectMode) || !trimmedTitle || !trimmedSummary || !trimmedPullRequestId || !trimmedPullRequestUrl || !lifecycle.phaseFive.softwareGovernance.viewerCanCreatePullRequests) {
    return;
  }
  const workflow = ensureProjectWorkflowState(slug);
  if ((workflow.softwarePullRequests ?? []).some(
    (request2) => request2.pullRequestId === trimmedPullRequestId || request2.pullRequestUrl === trimmedPullRequestUrl
  )) {
    return;
  }
  const request = {
    id: `project-pull-request-${slug}-${Date.now()}`,
    title: trimmedTitle,
    summary: trimmedSummary,
    pullRequestId: trimmedPullRequestId,
    pullRequestUrl: trimmedPullRequestUrl,
    authorUsername: viewer.username,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    stage: "approval",
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.softwarePullRequests = [request, ...workflow.softwarePullRequests ?? []];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectPullRequestHistoryEntry(slug, request)
  );
  maybeApplyApprovedProjectPullRequest(slug, request.id);
}
function setMockProjectPullRequestVote(slug, decisionId, vote) {
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
function requestMockProjectMergeCapabilityChange(slug, input) {
  const viewer = currentViewer();
  const project = findPublicProjectItem(slug);
  const lifecycle = project ? buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length) : null;
  const governance = lifecycle?.phaseFive.softwareGovernance;
  if (!viewer || !project || !governance || !governance.viewerCanRequestMergeCapabilityChanges || isPlatformTaggedProject(slug)) {
    return;
  }
  const targetUserId = input.targetUserId.trim();
  const action = input.action;
  const currentHolderIds = new Set(governance.mergeCapabilityMembers.map((member) => member.id));
  if (!targetUserId) {
    return;
  }
  if (action === "grant" && !governance.availableMergeCapabilityCandidates.some((member) => member.id === targetUserId)) {
    return;
  }
  if (action === "revoke" && (!currentHolderIds.has(targetUserId) || governance.mergeCapabilityMembers.length <= 1)) {
    return;
  }
  const workflow = ensureProjectWorkflowState(slug);
  if ((workflow.softwareMergeCapabilityChangeRequests ?? []).some(
    (request2) => request2.status === "open" && request2.targetUserId === targetUserId && request2.action === action
  )) {
    return;
  }
  const request = {
    id: `project-merge-capability-${slug}-${Date.now()}`,
    targetUserId,
    action,
    authorUsername: viewer.username,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "open",
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.softwareMergeCapabilityChangeRequests = [
    request,
    ...workflow.softwareMergeCapabilityChangeRequests ?? []
  ];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectMergeCapabilityChangeHistoryEntry(request)
  );
  maybeApplyApprovedProjectMergeCapabilityChange(slug, request.id);
}
function setMockProjectMergeCapabilityChangeVote(slug, decisionId, vote) {
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
function requestMockProjectRepositoryReplacement(slug, input) {
  const viewer = currentViewer();
  const project = findPublicProjectItem(slug);
  const lifecycle = project ? buildProjectLifecycle(slug, project.projectMode, (projectMembersBySlug[slug] ?? []).length) : null;
  const governance = lifecycle?.phaseFive.softwareGovernance;
  const trimmedRepositoryUrl = input.repositoryUrl.trim();
  const trimmedReason = input.reason.trim();
  const relatedPullRequestId = input.relatedPullRequestId.trim();
  if (!viewer || !project || !governance || !governance.viewerCanRequestRepositoryReplacement || !trimmedRepositoryUrl || !trimmedReason || !relatedPullRequestId || trimmedRepositoryUrl === governance.repositoryUrl) {
    return;
  }
  if (!governance.replaceablePullRequests.some((request2) => request2.id === relatedPullRequestId)) {
    return;
  }
  const workflow = ensureProjectWorkflowState(slug);
  if ((workflow.softwareRepositoryReplacementRequests ?? []).some(
    (request2) => request2.status === "open" && (request2.relatedPullRequestId === relatedPullRequestId || request2.repositoryUrl === trimmedRepositoryUrl)
  )) {
    return;
  }
  const request = {
    id: `project-repository-replacement-${slug}-${Date.now()}`,
    repositoryUrl: trimmedRepositoryUrl,
    previousRepositoryUrl: governance.repositoryUrl,
    reason: trimmedReason,
    relatedPullRequestId,
    authorUsername: viewer.username,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "open",
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.softwareRepositoryReplacementRequests = [
    request,
    ...workflow.softwareRepositoryReplacementRequests ?? []
  ];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectRepositoryReplacementHistoryEntry(request)
  );
  maybeApplyApprovedProjectRepositoryReplacement(slug, request.id);
}
function setMockProjectRepositoryReplacementVote(slug, decisionId, vote) {
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
function recordMockProjectPullRequestMerge(slug, requestId, mergeId) {
  const viewer = currentViewer();
  const workflow = ensureProjectWorkflowState(slug);
  const request = workflow.softwarePullRequests?.find((item) => item.id === requestId);
  const trimmedMergeId = mergeId.trim();
  if (!viewer || !request || request.stage !== "awaiting-merge" || !trimmedMergeId || !canViewerRecordProjectPullRequestMerge(slug)) {
    return;
  }
  request.stage = "confirmation";
  request.mergeId = trimmedMergeId;
  request.mergedByUsername = viewer.username;
  request.confirmationCreatedAt = (/* @__PURE__ */ new Date()).toISOString();
  request.votesByUserId = {
    [viewer.id]: "yes"
  };
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectPullRequestHistoryEntry(slug, request)
  );
  maybeApplyApprovedProjectPullRequest(slug, request.id);
}
function updateMockProjectDetails(slug, title, description) {
  const viewer = currentViewer();
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  if (!viewer || projectModeForSlug(slug) !== "personal-service" || !trimmedTitle || !trimmedDescription || !isProjectCreator(slug, viewer.id)) {
    return;
  }
  applyProjectDetailsChange(slug, trimmedTitle, trimmedDescription, (/* @__PURE__ */ new Date()).toISOString());
}
function applyEventDetailsChange(slug, title, description, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  const event = findPublicEventItem(slug);
  if (!event) {
    return false;
  }
  event.title = title;
  event.description = description;
  event.lastActivityAt = updatedAt;
  return true;
}
function applyApprovedEventPhaseChange(slug, targetPhaseId, reason, authorUsername) {
  const event = findPublicEventItem(slug);
  const extras = eventDetailExtras[slug];
  if (!event) {
    return;
  }
  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const currentPhaseId = workflow.currentPhaseId ?? defaultEventCurrentPhaseId(event);
  if (currentPhaseId === "event-plan" && targetPhaseId === "activity") {
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
  if (targetPhaseId === "closed" && extras) {
    extras.updates = [
      {
        id: `event-close-${slug}-${Date.now()}`,
        title: "Closure note",
        body: reason.trim(),
        authorUsername,
        createdAt: updatedAt
      },
      ...extras.updates
    ];
  }
}
function maybeApplyApprovedEventPhaseChange(slug, requestId) {
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
      "rejected",
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
    "approved",
    request.votesByUserId,
    eligibleVoterCount,
    userByUsername(event.createdByUsername)?.id ?? null
  );
  workflow.phaseChangeRequests = (workflow.phaseChangeRequests ?? []).filter((item) => item.id !== requestId);
}
function setMockEventSignal(slug, signal) {
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
  if (signal === "demand" && demandActive || signal === "opposition" && oppositionActive) {
    recordMeaningfulAction(viewer.id);
    return;
  }
  if (signal === "demand") {
    workflow.signalUserIds = [viewer.id, ...workflow.signalUserIds ?? []];
    workflow.signalCount += 1;
  } else {
    workflow.oppositionSignalUserIds = [viewer.id, ...workflow.oppositionSignalUserIds ?? []];
    workflow.oppositionSignalCount = (workflow.oppositionSignalCount ?? 0) + 1;
  }
  recordMeaningfulAction(viewer.id);
}
function addMockEventValue(slug, label) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const trimmed = label.trim();
  if (!viewer || !event || !trimmed || !canViewerEditEventPhase(slug, "proposal")) {
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
    ...workflow.eventValues ?? []
  ];
  recordMeaningfulAction(viewer.id);
}
function setMockEventValueImportance(slug, valueId, importance) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const workflow = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? "")?.id ?? null);
  const value = workflow.eventValues?.find((item) => item.id === valueId);
  if (!viewer || !event || !value || !canViewerEditEventPhase(slug, "proposal")) {
    return;
  }
  value.votesByUserId[viewer.id] = importance;
  recordMeaningfulAction(viewer.id);
}
function addMockEventPlan(slug, input) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const description = input.description.trim();
  const demandConsiderationNote = input.demandConsiderationNote.trim();
  const locationLabel = input.locationLabel.trim();
  const scheduleMode = input.schedule?.mode ?? "any-day";
  const scheduleStartDate = input.schedule?.startDate?.trim() ?? "";
  const scheduleEndDate = input.schedule?.endDate?.trim() ?? "";
  const scheduleStartTimeLabel = input.schedule?.startTimeLabel?.trim() ?? "";
  const scheduleFinishTimeLabel = input.schedule?.finishTimeLabel?.trim() ?? "";
  const scheduleIsValid = eventScheduleIsValid(input.schedule);
  const scheduleStartsInFuture = eventScheduleStartsInFuture(input.schedule);
  const timestamp = Date.now();
  const planPhases = input.planPhases.map((phase, index) => ({
    id: `event-plan-phase-${slug}-${timestamp}-${index}`,
    title: phase.title.trim(),
    details: phase.details.trim()
  })).filter((phase) => phase.title && phase.details);
  if (!viewer || !event || !canViewerEditEventPhase(slug, "event-plan") || !input.title.trim() || !description || !demandConsiderationNote || !locationLabel || !scheduleStartTimeLabel || !scheduleFinishTimeLabel || scheduleMode === "any-day" || scheduleMode === "date" && !scheduleStartDate || scheduleMode === "range" && (!scheduleStartDate || !scheduleEndDate) || !scheduleIsValid || !scheduleStartsInFuture || planPhases.length === 0) {
    return false;
  }
  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const values = buildEventValues(slug);
  workflow.eventPlans = [
    {
      id: `event-plan-${slug}-${timestamp}`,
      title: input.title.trim(),
      authorUsername: viewer.username,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      description,
      locationLabel,
      schedule: scheduleMode === "date" ? {
        mode: "date",
        startDate: scheduleStartDate,
        startTimeLabel: scheduleStartTimeLabel,
        finishTimeLabel: scheduleFinishTimeLabel
      } : {
        mode: "range",
        startDate: scheduleStartDate,
        endDate: scheduleEndDate,
        startTimeLabel: scheduleStartTimeLabel,
        finishTimeLabel: scheduleFinishTimeLabel
      },
      demandSignalSnapshot: event.isPrivate ? void 0 : workflow.signalCount ?? 0,
      demandConsiderationNote,
      planPhases,
      overallVotesByUserId: {
        [viewer.id]: "yes"
      },
      valueVotesByValueId: Object.fromEntries([
        ...!event.isPrivate ? [[demandSignalAssessmentValueId, { [viewer.id]: "yes" }]] : [],
        ...values.map((value) => [value.id, { [viewer.id]: "yes" }])
      ])
    },
    ...workflow.eventPlans ?? []
  ];
  recordMeaningfulAction(viewer.id);
  return true;
}
function setMockEventPlanValueVote(slug, planId, valueId, vote) {
  const viewer = currentViewer();
  if (!viewer || !canViewerEditEventPhase(slug, "event-plan")) {
    return;
  }
  updateEventPlanValueVoteMap(slug, planId, valueId, viewer.id, vote);
  recordMeaningfulAction(viewer.id);
}
function setMockEventPlanOverallVote(slug, planId, vote) {
  const viewer = currentViewer();
  if (!viewer || !canViewerEditEventPhase(slug, "event-plan")) {
    return;
  }
  updateEventPlanOverallVoteMap(slug, planId, viewer.id, vote);
  recordMeaningfulAction(viewer.id);
}
function addMockEventActivity(slug, input) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const roleRequirements = normalizeProjectActivityRoleRequirements(input.roleRequirements);
  const minimumParticipants = roleRequirements.reduce((total, role) => total + role.requiredCount, 0);
  const workflow = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? "")?.id ?? null);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const eligibleVoterCount = event ? eventGovernancePopulation(event, buildEventMemberState(event).eligibleVoterCount) : 0;
  const phaseTwo = event ? buildEventPlans(
    slug,
    event,
    buildEventValues(slug),
    calculateProjectQuorumThreshold(eligibleVoterCount),
    eligibleVoterCount
  ) : { plans: [], winningPlanId: null };
  const winningPlan = phaseTwo.plans.find((plan) => plan.id === phaseTwo.winningPlanId) ?? null;
  if (!viewer || !event || !winningPlan || !canViewerCreateEventActivity(slug) || !input.title.trim() || !input.scheduledAt.trim() || !input.endsAt.trim() || !input.locationLabel.trim() || !input.note.trim() || roleRequirements.length === 0 || minimumParticipants < 1 || !eventActivityFitsSchedule(winningPlan.schedule, input.scheduledAt.trim(), input.endsAt.trim())) {
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
    ...workflow.eventActivities ?? []
  ];
  ensureEventMembership(slug, viewer.id);
  event.lastActivityAt = now;
  recordMeaningfulAction(viewer.id);
}
function setMockEventActivityCommitment(slug, activityId, roleLabel) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const workflow = ensureEventWorkflowState(slug, userByUsername(event?.createdByUsername ?? "")?.id ?? null);
  const activity = workflow.eventActivities?.find((item) => item.id === activityId);
  if (!viewer || !event || !activity || !canViewerEditEventActivityCommitment(slug)) {
    return;
  }
  for (const role of activity.roles) {
    role.assignedUsernames = role.assignedUsernames.filter((username) => username !== viewer.username);
  }
  if (!roleLabel) {
    event.lastActivityAt = (/* @__PURE__ */ new Date()).toISOString();
    recordMeaningfulAction(viewer.id);
    return;
  }
  const targetRole = activity.roles.find((role) => role.label === roleLabel);
  if (!targetRole) {
    return;
  }
  const maximumCount = targetRole.maximumCount != null ? Math.max(targetRole.maximumCount, targetRole.requiredCount) : void 0;
  if (maximumCount != null && targetRole.assignedUsernames.length >= maximumCount) {
    return;
  }
  ensureEventMembership(slug, viewer.id);
  targetRole.assignedUsernames = [...targetRole.assignedUsernames, viewer.username];
  event.lastActivityAt = (/* @__PURE__ */ new Date()).toISOString();
  recordMeaningfulAction(viewer.id);
}
function maybeApplyApprovedEventUpdate(slug, requestId) {
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
      "rejected",
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
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const updateId = `event-update-${slug}-${Date.now()}`;
  extras.updates = [
    {
      id: updateId,
      title: "",
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
    "approved",
    request.votesByUserId,
    eligibleVoterCount,
    userByUsername(event.createdByUsername)?.id ?? null,
    (payload) => {
      if (payload.type === "update") {
        payload.appliedUpdateId = updateId;
      }
    }
  );
  workflow.updateRequests = (workflow.updateRequests ?? []).filter((item) => item.id !== requestId);
}
function maybeApplyApprovedEventEdit(slug, requestId) {
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
      "rejected",
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
  applyEventDetailsChange(slug, request.title, request.description, (/* @__PURE__ */ new Date()).toISOString());
  finalizeEventDecisionHistoryEntry(
    slug,
    requestId,
    "approved",
    request.votesByUserId,
    eligibleVoterCount,
    userByUsername(event.createdByUsername)?.id ?? null
  );
  workflow.editRequests = (workflow.editRequests ?? []).filter((item) => item.id !== requestId);
}
function requestMockEventUpdate(slug, body) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const extras = eventDetailExtras[slug];
  const trimmedBody = body.trim();
  if (!viewer || !event || !extras || !trimmedBody || !canViewerRequestEventUpdate(slug)) {
    return;
  }
  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const requestId = `event-update-request-${slug}-${Date.now()}`;
  const request = {
    id: requestId,
    body: trimmedBody,
    authorUsername: viewer.username,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.updateRequests = [
    request,
    ...workflow.updateRequests ?? []
  ];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildEventUpdateHistoryEntry(request));
  recordMeaningfulAction(viewer.id);
  maybeApplyApprovedEventUpdate(slug, requestId);
}
function setMockEventUpdateVote(slug, requestId, vote) {
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
function requestMockEventEdit(slug, title, description) {
  const viewer = currentViewer();
  const event = findPublicEventItem(slug);
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  if (!viewer || !event || !trimmedTitle || !trimmedDescription || !canViewerRequestEventEdit(slug)) {
    return;
  }
  const workflow = ensureEventWorkflowState(slug, userByUsername(event.createdByUsername)?.id ?? null);
  const requestId = `event-edit-request-${slug}-${Date.now()}`;
  const request = {
    id: requestId,
    title: trimmedTitle,
    description: trimmedDescription,
    authorUsername: viewer.username,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.editRequests = [
    request,
    ...workflow.editRequests ?? []
  ];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildEventEditHistoryEntry(slug, request));
  recordMeaningfulAction(viewer.id);
  maybeApplyApprovedEventEdit(slug, requestId);
}
function setMockEventEditVote(slug, requestId, vote) {
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
function requestMockEventPhaseChange(slug, targetPhaseId, reason) {
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
  const request = {
    id: requestId,
    targetPhaseId,
    reason: trimmedReason,
    authorUsername: viewer.username,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.phaseChangeRequests = [request, ...workflow.phaseChangeRequests ?? []];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildEventPhaseChangeHistoryEntry(slug, request));
  recordMeaningfulAction(viewer.id);
  maybeApplyApprovedEventPhaseChange(slug, requestId);
}
function setMockEventPhaseChangeVote(slug, requestId, vote) {
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
function grantMockEventEditAccess(slug, userId) {
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
  workflow.editorUserIds = Array.from(/* @__PURE__ */ new Set([...workflow.editorUserIds, userId]));
}
function revokeMockEventEditAccess(slug, userId) {
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
function shareMockProjectWithUser(slug, username) {
  const viewer = currentViewer();
  const targetUser = userByUsername(username);
  const project = findPublicProjectItem(slug);
  if (!viewer) {
    return errorShareTargetResult("Sign in to share projects.");
  }
  if (!project) {
    return errorShareTargetResult("That project could not be found.");
  }
  if (!targetUser || targetUser.id === viewer.id) {
    return errorShareTargetResult("Choose another user.");
  }
  pushUserNotification(targetUser.id, {
    id: `notification-project-share-${slug}-${targetUser.id}-${Date.now()}`,
    kind: "project",
    surface: "public",
    subjectKind: "project",
    projectMode: project.projectMode,
    actorUsername: viewer.username,
    actionLabel: "Shared",
    title: project.title,
    body: `${viewer.username} shared this project with you.`,
    href: project.href,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isUnread: true,
    channelTags: project.channelTags,
    communityTags: project.communityTags
  });
  return okShareTargetResult();
}
function shareMockEventWithUser(slug, username) {
  const viewer = currentViewer();
  const targetUser = userByUsername(username);
  const event = findPublicEventItem(slug);
  if (!viewer) {
    return errorShareTargetResult("Sign in to invite or share events.");
  }
  if (!event) {
    return errorShareTargetResult("That event could not be found.");
  }
  if (!targetUser || targetUser.id === viewer.id) {
    return errorShareTargetResult("Choose another user.");
  }
  const participation = eventParticipationById[event.id] ?? (eventParticipationById[event.id] = { goingUserIds: [], invitedUserIds: [] });
  if (!participation.goingUserIds.includes(targetUser.id) && !participation.invitedUserIds.includes(targetUser.id)) {
    participation.invitedUserIds = [targetUser.id, ...participation.invitedUserIds];
    eventInvitedSinceById[event.id] = {
      ...eventInvitedSinceById[event.id] ?? {},
      [targetUser.id]: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  pushUserNotification(targetUser.id, {
    id: `notification-event-share-${slug}-${targetUser.id}-${Date.now()}`,
    kind: "event",
    surface: "public",
    subjectKind: "event",
    actorUsername: viewer.username,
    actionLabel: event.isPrivate ? "Invited" : "Shared",
    title: event.title,
    body: event.isPrivate ? `${viewer.username} invited you to this event.` : `${viewer.username} shared this event with you.`,
    href: event.href,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isUnread: true,
    channelTags: event.channelTags,
    communityTags: event.communityTags
  });
  return okShareTargetResult();
}
function okConversationResult(conversationId) {
  return conversationId ? { ok: true, conversationId } : { ok: true };
}
function errorConversationResult(error) {
  return { ok: false, error };
}
function normalizeConversationTitle(value) {
  return value.trim().replace(/\s+/g, " ");
}
function buildConversationId(prefix) {
  return `${prefix}-${Date.now().toString(36)}`;
}
function buildConversationMessageId(conversationId) {
  return `${conversationId}-${Date.now()}`;
}
function findCurrentConversation(conversationId) {
  return currentMessageConversationsState().find((item) => item.id === conversationId);
}
function normalizeConversationUsernames(usernames) {
  return Array.from(new Set(usernames.map((value) => normalizeUsernameInput(value)).filter(Boolean)));
}
function markMockNotificationRead(notificationId) {
  const hydratedItem = buildNotificationsFixture()?.items.find((notification) => notification.id === notificationId);
  if (hydratedItem) {
    readNotificationHrefs.add(hydratedItem.href);
  }
}
function markAllMockNotificationsRead() {
  const hydratedItems = buildNotificationsFixture()?.items ?? [];
  for (const item of hydratedItems) {
    readNotificationHrefs.add(item.href);
  }
  for (const item of notificationsState) {
    item.isUnread = false;
  }
}
function markMockConversationRead(conversationId) {
  const conversation = findCurrentConversation(conversationId);
  if (conversation) {
    conversation.unreadCount = 0;
  }
}
function sendMockMessage(conversationId, body) {
  const viewer = currentViewer();
  const conversation = findCurrentConversation(conversationId);
  const trimmed = body.trim();
  if (!viewer || !conversation || !trimmed) {
    return;
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  conversation.messages.push({
    id: buildConversationMessageId(conversationId),
    sender: viewer,
    body: trimmed,
    createdAt,
    isOwn: true
  });
  conversation.preview = summarizeChatPreview(
    trimmed,
    conversation.kind === "group" ? viewer.username : void 0
  );
  conversation.lastMessageAt = createdAt;
  conversation.unreadCount = 0;
  moveMessageConversationToFront(conversation.id);
}
function startMockDirectMessage(participantUsername, body) {
  const viewer = currentViewer();
  const participant = userByUsername(participantUsername);
  const trimmed = body.trim();
  const conversations = currentMessageConversationsState();
  if (!viewer) {
    return errorConversationResult("Sign in to send messages.");
  }
  if (!participant || participant.id === viewer.id) {
    return errorConversationResult("Choose another person to message.");
  }
  if (!trimmed) {
    return errorConversationResult("Write a message before sending it.");
  }
  let conversation = conversations.find(
    (item) => item.kind === "direct" && item.participants.some((member) => member.id === participant.id)
  );
  if (!conversation) {
    conversation = {
      id: `dm-${participant.username}`,
      kind: "direct",
      title: participant.username,
      participants: [viewer, participant],
      preview: "",
      lastMessageAt: "",
      unreadCount: 0,
      messages: []
    };
    conversations.unshift(conversation);
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
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
function createMockGroupConversation(input) {
  const viewer = currentViewer();
  const title = normalizeConversationTitle(input.title);
  const body = input.body.trim();
  if (!viewer) {
    return errorConversationResult("Sign in to start a group chat.");
  }
  if (!title) {
    return errorConversationResult("Name the group chat before creating it.");
  }
  if (!body) {
    return errorConversationResult("Write the first message for the group chat.");
  }
  const memberUsernames = normalizeConversationUsernames(input.memberUsernames);
  const members = memberUsernames.map((username) => userByUsername(username)).filter((member) => !!member && member.id !== viewer.id);
  if (members.length < 2) {
    return errorConversationResult("Choose at least two other people for a group chat.");
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const conversationId = buildConversationId("group");
  const conversation = {
    id: conversationId,
    kind: "group",
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
function renameMockGroupConversation(conversationId, title) {
  const conversation = findCurrentConversation(conversationId);
  const nextTitle = normalizeConversationTitle(title);
  if (!conversation || conversation.kind !== "group") {
    return errorConversationResult("That group chat no longer exists.");
  }
  if (!nextTitle) {
    return errorConversationResult("Group chats need a name.");
  }
  conversation.title = nextTitle;
  return okConversationResult(conversation.id);
}
function addMockGroupConversationMember(conversationId, username) {
  const viewer = currentViewer();
  const conversation = findCurrentConversation(conversationId);
  const member = userByUsername(username);
  if (!viewer || !conversation || conversation.kind !== "group") {
    return errorConversationResult("That group chat no longer exists.");
  }
  if (!member || member.id === viewer.id) {
    return errorConversationResult("Choose someone else to add.");
  }
  if (conversation.participants.some((participant) => participant.id === member.id)) {
    return errorConversationResult("That person is already in the group chat.");
  }
  conversation.participants = [...conversation.participants, member];
  return okConversationResult(conversation.id);
}
function removeMockGroupConversationMember(conversationId, username) {
  const viewer = currentViewer();
  const conversation = findCurrentConversation(conversationId);
  const member = userByUsername(username);
  if (!viewer || !conversation || conversation.kind !== "group") {
    return errorConversationResult("That group chat no longer exists.");
  }
  if (!member || member.id === viewer.id) {
    return errorConversationResult("Leave the current viewer in the group chat.");
  }
  if (!conversation.participants.some((participant) => participant.id === member.id)) {
    return errorConversationResult("That person is not in the group chat.");
  }
  if (conversation.participants.length <= 3) {
    return errorConversationResult("Keep at least three people in a group chat.");
  }
  conversation.participants = conversation.participants.filter((participant) => participant.id !== member.id);
  return okConversationResult(conversation.id);
}
function canAdvanceMockProjectPhaseNow(slug, projectMode) {
  const config = projectLifecycleBySlug[slug];
  if (!config) {
    return false;
  }
  if (projectMode === "personal-service") {
    return !!nextProjectPhaseIdForSlug(slug, config.currentPhaseId, projectMode);
  }
  const memberCount = (projectMembersBySlug[slug] ?? []).length;
  const values = buildProjectValues(slug);
  const signalSummary = buildProjectSignalSummary(slug);
  const governancePopulation = projectGovernancePopulation(slug, memberCount);
  switch (config.currentPhaseId) {
    case "phase-1":
      return signalSummary?.advancementUnlocked ?? false;
    case "phase-2":
      return !!buildProductionPlans(
        slug,
        values,
        calculateProjectQuorumThreshold(governancePopulation),
        governancePopulation
      ).winningPlanId;
    case "phase-3": {
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
function applyApprovedProjectPhaseChange(slug, targetPhaseId, reason, authorUsername) {
  const config = projectLifecycleBySlug[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedReason = reason.trim();
  if (!config || !trimmedReason) {
    return;
  }
  const currentPhaseId = config.currentPhaseId;
  config.currentPhaseId = targetPhaseId;
  if (["phase-1", "phase-2", "phase-3"].includes(targetPhaseId) && phaseOrderForProjectSlug(slug, projectMode, targetPhaseId) < phaseOrderForProjectSlug(slug, projectMode, currentPhaseId)) {
    const workflow = ensureProjectWorkflowState(slug);
    workflow.revertHistory = [
      {
        id: `project-revert-${slug}-${Date.now()}`,
        targetPhaseId,
        reason: trimmedReason,
        authorUsername,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      ...workflow.revertHistory ?? []
    ];
    if (projectDetailExtras[slug]) {
      projectDetailExtras[slug].updates = [
        {
          id: `project-update-return-${slug}-${Date.now()}`,
          title: "Return note",
          body: trimmedReason,
          authorUsername,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        ...projectDetailExtras[slug].updates
      ];
    }
  }
  if (targetPhaseId === closePhaseIdForProjectSlug(slug, projectMode) && projectDetailExtras[slug]) {
    projectDetailExtras[slug].updates = [
      {
        id: `project-update-close-${slug}-${Date.now()}`,
        title: "Closure note",
        body: trimmedReason,
        authorUsername,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      ...projectDetailExtras[slug].updates
    ];
  }
}
function maybeApplyApprovedProjectPhaseChange(slug, requestId) {
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
    finalizeProjectDecisionHistoryEntry(slug, requestId, "rejected", request.votesByUserId, memberCount);
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
  finalizeProjectDecisionHistoryEntry(slug, requestId, "approved", request.votesByUserId, memberCount);
  workflow.phaseChangeRequests = (workflow.phaseChangeRequests ?? []).filter(
    (item) => item.id !== requestId
  );
}
function requestMockProjectPhaseChange(slug, targetPhaseId, reason, options) {
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
  if (closeOutcome === "convert" && !conversionTarget) {
    return;
  }
  const workflow = ensureProjectWorkflowState(slug);
  if ((workflow.phaseChangeRequests ?? []).some((request2) => request2.targetPhaseId === targetPhaseId)) {
    return;
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const requestId = `project-phase-change-${slug}-${Date.now()}`;
  const request = {
    id: requestId,
    targetPhaseId,
    reason: trimmedReason,
    authorUsername: viewer.username,
    createdAt,
    closeOutcome,
    conversionTarget,
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.phaseChangeRequests = [
    request,
    ...workflow.phaseChangeRequests ?? []
  ];
  upsertDecisionHistoryEntry(
    workflow.decisionHistory ?? [],
    buildProjectPhaseChangeHistoryEntry(slug, request)
  );
  maybeApplyApprovedProjectPhaseChange(slug, requestId);
}
function requestMockProjectUpdate(slug, body) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedBody = body.trim();
  if (!viewer || !extras || projectMode === "personal-service" || !trimmedBody || !canViewerRequestProjectUpdate(slug)) {
    return;
  }
  const workflow = ensureProjectWorkflowState(slug);
  const requestId = `project-update-request-${slug}-${Date.now()}`;
  const request = {
    id: requestId,
    body: trimmedBody,
    authorUsername: viewer.username,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.updateRequests = [
    request,
    ...workflow.updateRequests ?? []
  ];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildProjectUpdateHistoryEntry(request));
  maybeApplyApprovedProjectUpdate(slug, requestId);
}
function requestMockProjectEdit(slug, title, description) {
  const viewer = currentViewer();
  const extras = projectDetailExtras[slug];
  const projectMode = projectModeForSlug(slug);
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  if (!viewer || !extras || projectMode === "personal-service" || !trimmedTitle || !trimmedDescription || !canViewerRequestProjectEdit(slug)) {
    return;
  }
  const workflow = ensureProjectWorkflowState(slug);
  const requestId = `project-edit-request-${slug}-${Date.now()}`;
  const request = {
    id: requestId,
    title: trimmedTitle,
    description: trimmedDescription,
    authorUsername: viewer.username,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    votesByUserId: {
      [viewer.id]: "yes"
    }
  };
  workflow.editRequests = [
    request,
    ...workflow.editRequests ?? []
  ];
  upsertDecisionHistoryEntry(workflow.decisionHistory ?? [], buildProjectEditHistoryEntry(slug, request));
  maybeApplyApprovedProjectEdit(slug, requestId);
}
function setMockProjectPhaseChangeVote(slug, requestId, vote) {
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
function setMockProjectUpdateVote(slug, requestId, vote) {
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
function setMockProjectEditVote(slug, requestId, vote) {
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
export {
  setMockProjectUpdateVote as $,
  requestMockEventUpdate as A,
  setMockEventPhaseChangeVote as B,
  requestMockEventPhaseChange as C,
  setMockEventActivityCommitment as D,
  addMockEventActivity as E,
  setMockEventPlanOverallVote as F,
  setMockEventPlanValueVote as G,
  addMockEventPlan as H,
  setMockEventValueImportance as I,
  addMockEventValue as J,
  setMockEventSignal as K,
  addMockProjectUpdate as L,
  setMockReportVote as M,
  submitMockReport as N,
  addMockComment as O,
  setMockVote as P,
  redeemMockScopeInvite as Q,
  toggleMockScopeMembership as R,
  revertMockProjectPhase as S,
  advanceMockProjectPhase as T,
  recordMockProjectPullRequestMerge as U,
  setMockProjectRepositoryReplacementVote as V,
  setMockProjectMergeCapabilityChangeVote as W,
  setMockProjectPullRequestVote as X,
  setMockProjectEditVote as Y,
  requestMockProjectEdit as Z,
  updateMockProjectDetails as _,
  formatProjectVoteSummary as a,
  requestMockProjectUpdate as a0,
  setMockProjectPhaseChangeVote as a1,
  requestMockProjectPhaseChange as a2,
  setMockProjectServiceHistoryCompletion as a3,
  setMockProjectServiceRequestSettingsChangeVote as a4,
  requestMockProjectServiceRequestSettingsChange as a5,
  setMockProjectServiceRequestStatus as a6,
  planMockProjectServiceRequest as a7,
  addMockProjectServiceRequest as a8,
  setMockProjectActivityCommitment as a9,
  findNotificationsFixture as aA,
  findProfileFixture as aB,
  updateMockSettings as aC,
  getSettingsFixture as aD,
  signUpMockAccount as aE,
  signInMockAccount as aF,
  onboardingFixture as aG,
  getPlatformAssetsFixture as aH,
  getPlatformScopeFixture as aI,
  findCommunityScopeFixture as aJ,
  findChannelScopeFixture as aK,
  getPersonalFeedFixture as aL,
  getPublicFeedFixture as aM,
  hydrateMockClientState as aN,
  getBootstrapFixture as aO,
  signOutMockAccount as aP,
  isCollectiveServiceProject as aQ,
  projectSubtypeOptions as aR,
  isProductiveProject as aS,
  supportsProjectDemandSignals as aT,
  addMockProjectActivity as aa,
  setMockProjectPlanOverallVote as ab,
  setMockProjectPlanValueVote as ac,
  requestMockProjectRepositoryReplacement as ad,
  requestMockProjectMergeCapabilityChange as ae,
  addMockProjectPullRequest as af,
  addMockProjectDistributionPlan as ag,
  addMockProjectProductionPlan as ah,
  setMockProjectValueImportance as ai,
  addMockProjectValue as aj,
  setMockProjectSignal as ak,
  toggleMockProjectDemandSignal as al,
  toggleMockProjectMembership as am,
  toggleMockEventGoing as an,
  findEventFixture as ao,
  findPostFixture as ap,
  createMockCommunity as aq,
  createMockChannel as ar,
  createMockPost as as,
  createMockEvent as at,
  createMockThread as au,
  createMockProject as av,
  findThreadFixture as aw,
  findProjectFixture as ax,
  buildSearchFixture as ay,
  findMessagesFixture as az,
  eventActivityFitsSchedule as b,
  eventScheduleBounds as c,
  eventScheduleIsValid as d,
  eventScheduleDayBounds as e,
  formatProjectVoteRequirement as f,
  eventScheduleStartsInFuture as g,
  addMockGroupConversationMember as h,
  isPersonalServiceProject as i,
  renameMockGroupConversation as j,
  createMockGroupConversation as k,
  startMockDirectMessage as l,
  sendMockMessage as m,
  markMockConversationRead as n,
  markAllMockNotificationsRead as o,
  projectSubjectLabel as p,
  markMockNotificationRead as q,
  removeMockGroupConversationMember as r,
  suggestedEventActivityWindow as s,
  shareMockEventWithUser as t,
  shareMockProjectWithUser as u,
  revokeMockEventEditAccess as v,
  grantMockEventEditAccess as w,
  setMockEventEditVote as x,
  requestMockEventEdit as y,
  setMockEventUpdateVote as z
};
