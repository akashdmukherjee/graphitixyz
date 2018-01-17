export const ASSET_USER_ACCESSIBILITY = 'ASSET_USER_ACCESSIBILITY';
export const CURRENT_ASSET_ID = 'CURRENT_ASSET_ID';
export const ASSET_DETAILS = 'ASSET_DETAILS';
export const DATASET_UPLOADED = 'DATASET_UPLOADED';
export const DATASET_ASSET_CREATED = 'DATASET_ASSET_CREATED';
export const SQL_ASSET_CREATED = 'SQL_ASSET_CREATED';
export const CHART_ASSET_CREATED = 'CHART_ASSET_CREATED';
export const DISCOVERABILITY_SCORE = 'DISCOVERABILITY_SCORE';

export const assetUserAccessibilty = data => {
  return {
    type: ASSET_USER_ACCESSIBILITY,
    data,
  };
};

export const currentAssetId = data => {
  return {
    type: CURRENT_ASSET_ID,
    data,
  };
};

export const assetDetails = data => {
  return {
    type: ASSET_DETAILS,
    data,
  };
};

export const dataSetUploaded = data => ({
  type: DATASET_UPLOADED,
  data,
});

export const dataSetAssetCreated = data => ({
  type: DATASET_ASSET_CREATED,
  data,
});

export const discoverabilityScore = data => ({
  type: DISCOVERABILITY_SCORE,
  data,
});

export const sqlAssetCreated = data => ({
  type: SQL_ASSET_CREATED,
  data,
});

export const chartAssetCreated = data => ({
  type: CHART_ASSET_CREATED,
  data,
});
