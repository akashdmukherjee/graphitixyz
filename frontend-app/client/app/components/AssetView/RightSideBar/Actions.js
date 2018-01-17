export const ASSET_DELETED = 'ASSET_DELETED';
export const UPDATE_ASSET_DETAILS = 'UPDATE_ASSET_DETAILS';
export const SAVE_ASSET_DETAILS_CHANGES = 'SAVE_CHANGES';
export const CALL_GET_DISCOVERABILITY_SCORE = 'CALL_GET_DISCOVERABILITY_SCORE';

export const assetDeleted = data => ({
  type: ASSET_DELETED,
  data,
});

export const updateAssetDetails = data => ({
  type: UPDATE_ASSET_DETAILS,
  data,
});

export const saveAssetDetailsChanges = data => ({
  type: SAVE_ASSET_DETAILS_CHANGES,
  data,
});

export const callGetDiscoverabilityScore = data => ({
  type: CALL_GET_DISCOVERABILITY_SCORE,
  data,
});
