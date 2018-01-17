export const CHART_DATA = 'CHART_DATA';
export const CHART_ASSET_DETAILS = 'CHART_ASSET_DETAILS';
export const CHART_ASSET_UPDATED = 'CHART_ASSET_UPDATED';
export const CHART_ASSET_CREATION_STARTED = 'CHART_ASSET_CREATION_STARTED';

export const chartData = data => ({
  type: CHART_DATA,
  data,
});

export const chartAssetDetails = data => ({
  type: CHART_ASSET_DETAILS,
  data,
});

export const chartAssetUpdated = data => ({
  type: CHART_ASSET_UPDATED,
  data,
});

export const chartAssetCreationStarted = data => ({
  type: CHART_ASSET_CREATION_STARTED,
  data,
});
