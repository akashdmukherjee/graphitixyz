export const DASHBOARD_CHART_ASSET_DETAILS = 'DASHBOARD_CHART_ASSET_DETAILS';
export const DASHBOARD_CHART_DATA = 'DASHBOARD_CHART_DATA';

export const dashboardChartAssetDetails = data => ({
  type: DASHBOARD_CHART_ASSET_DETAILS,
  data,
});

export const dashboardChartData = data => ({
  type: DASHBOARD_CHART_DATA,
  data,
});
