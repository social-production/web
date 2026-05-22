import type { ProjectInventoryFrameData } from '$lib/types/detail';
import type { ProjectMode, PublicProjectItem } from '$lib/types/feed';

export interface AssetProjectReference {
  id: string;
  title: string;
  projectMode: ProjectMode;
  relationshipLabel: string;
  statusLabel: string;
  summary: string;
  href?: string | null;
  publicItem?: PublicProjectItem | null;
}

export interface AssetPlaceholderSection {
  id: string;
  title: string;
  body: string;
  statusLabel?: string;
}

export interface AssetRequestFrame {
  id: 'borrowing' | 'delivery' | 'asset-use';
  title: string;
  body: string;
  statusLabel?: string;
}

export interface AssetGovernanceVoteSummary {
  yesCount: number;
  noCount: number;
  eligibleVoterCount: number;
  approvalPercent: number;
  votesRequired: number;
  votesRemaining: number;
  statusLabel: string;
  note: string;
}

export interface AssetAvailabilityRequestRecord {
  id: string;
  assetLabel: string;
  title: string;
  statusLabel: string;
  requestingPartyLabel: string;
  requestedAtLabel: string;
  timeframeLabel: string;
  managingProjectLabel: string;
  summary: string;
  outcomeNote: string;
  voteSummary: AssetGovernanceVoteSummary | null;
}

export interface AssetBorrowingPolicyRecord {
  id: string;
  assetLabel: string;
  statusLabel: string;
  policyLabel: string;
  managingProjectLabel: string;
  decidedAtLabel: string;
  summary: string;
  voteSummary: AssetGovernanceVoteSummary;
}

export interface AssetBorrowingLifecycleRecord {
  id: string;
  assetLabel: string;
  title: string;
  statusLabel: string;
  borrowerLabel: string;
  requestedAtLabel: string;
  expectedReturnLabel: string;
  purpose: string;
  currentCustodyLabel: string;
  coordinationNote: string;
  responsiblePartyLabel?: string;
}

export interface AssetDeliveryLifecycleRecord {
  id: string;
  assetLabel: string;
  title: string;
  statusLabel: string;
  requesterLabel: string;
  requestedAtLabel: string;
  neededByLabel: string;
  originLabel: string;
  destinationLabel: string;
  assignedVolunteerLabel: string;
  summary: string;
}

export interface AssetProvenanceEntry {
  id: string;
  title: string;
  statusLabel: string;
  happenedAtLabel: string;
  actorLabel: string;
  actorHref?: string | null;
  summary: string;
  locationLabel: string;
  locationHref?: string | null;
  custodyLabel: string;
  referenceLabel?: string;
  referenceHref?: string | null;
}

export interface AssetGovernanceData {
  availabilityRequests: AssetAvailabilityRequestRecord[];
  borrowingPolicies: AssetBorrowingPolicyRecord[];
  borrowingRequests: AssetBorrowingLifecycleRecord[];
  deliveryRequests: AssetDeliveryLifecycleRecord[];
  provenanceTimeline: AssetProvenanceEntry[];
}

export interface AssetContainedUnitRecord {
  id: string;
  label: string;
  statusLabel: string;
  locationLabel: string;
  summary: string;
  currentBorrowerLabel?: string | null;
}

export interface AssetAttachedRecord {
  id: string;
  slug: string;
  title: string;
  typeLabel: string;
  quantityLabel?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  containedUnits?: AssetContainedUnitRecord[];
  statusLabel: string;
  custodyLabel: string;
  summary: string;
  locationLabel: string;
  currentLocationLabel?: string;
  currentLocationHref?: string | null;
  currentBorrowerLabel?: string | null;
  currentCustodianLabel: string;
  homeLandAssetLabel: string;
  parentLandAssetSlug: string;
  parentLandAssetTitle: string;
  stewardshipNote: string;
  historySummary: string;
  governance: AssetGovernanceData;
  requestFrames: AssetRequestFrame[];
  detailSections: AssetPlaceholderSection[];
  managementProjects: AssetProjectReference[];
  storageProjects: AssetProjectReference[];
  linkedProjects: AssetProjectReference[];
  href?: string | null;
}

export interface LandAssetRecord {
  id: string;
  slug: string;
  title: string;
  locationLabel: string;
  sizeLabel: string;
  statusLabel: string;
  stewardshipNote: string;
  currentCustodianLabel: string;
  homeLandAssetLabel: string;
  historySummary: string;
  attachedAssets: AssetAttachedRecord[];
  inventoryFrame?: ProjectInventoryFrameData | null;
  governance: AssetGovernanceData;
  requestFrames: AssetRequestFrame[];
  detailSections: AssetPlaceholderSection[];
  managementProjects: AssetProjectReference[];
  storageProjects: AssetProjectReference[];
  linkedProjects: AssetProjectReference[];
}

export interface CollectiveFundRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  progressPercent: number;
  raisedLabel: string;
  targetLabel: string;
  status: 'active' | 'completed';
  executionNote: string;
  linkedAssetTitles: string[];
  projectHref?: string | null;
}

export interface PlatformAssetsPageData {
  featureOpen: boolean;
  intro: string;
  featureFrames: AssetPlaceholderSection[];
  landAssets: LandAssetRecord[];
  funds: CollectiveFundRecord[];
}