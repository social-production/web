type FeatureFlags = {
  assets?: boolean;
};

export const phaseOneDeferredFeatures = {
  assets: true,
  inventory: true,
  assetManagementSubtype: true,
} as const;

export function isAssetsSurfaceEnabled(featureFlags?: FeatureFlags) {
  return !phaseOneDeferredFeatures.assets && Boolean(featureFlags?.assets);
}

export function isInventorySurfaceEnabled() {
  return !phaseOneDeferredFeatures.inventory;
}

export function isAssetManagementSubtypeEnabled() {
  return !phaseOneDeferredFeatures.assetManagementSubtype;
}
