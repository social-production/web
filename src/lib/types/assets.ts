import type { ProjectMode } from '$lib/types/feed';

export interface AssetProjectReference {
  id: string;
  title: string;
  projectMode: ProjectMode;
  relationshipLabel: string;
  statusLabel: string;
  summary: string;
  href?: string | null;
}

export interface LandAssetRecord {
  id: string;
  slug: string;
  title: string;
  locationLabel: string;
  acreageLabel: string;
  stewardshipNote: string;
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
  landAssets: LandAssetRecord[];
  funds: CollectiveFundRecord[];
}