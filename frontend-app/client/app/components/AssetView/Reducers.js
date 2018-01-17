import {
  COLUMN_NAMES_OF_AN_ASSET,
  UNIQUE_VALUES_OF_COLUMN_NAME,
  GENERATE_QUERY_AND_GET_DATE_RESULT,
  EXPAND_FILTERS_AND_SHOW_SQL_EDITOR,
  SET_SQL_CAPABILITY,
  RECEIVE_MINI_INFO_ABOUT_FILTERS,
  RECEIVE_NORMAL_FILTER_INFO_BASED_ON_ID,
  SAVED_NORMAL_FILTER_SET,
} from './Filters/Actions';
import {
  SEARCH_USER_BY_NAME_RESULT,
  HAS_ADMIN_ACCESS,
  CLOSE_ASSET_PERMISSIONS_MODAL,
} from './RightSideBar/AssetPermissions/Actions';
import { ASSET_DELETED, UPDATE_ASSET_DETAILS } from './RightSideBar/Actions';
import { OPEN_ASSET_PERMISSIONS_MODAL } from './TopNavBar/Actions';
import { RELATED_ASSETS_DATA } from './RelatedAssets/Actions';
import {
  TEST_DATA_CONNECTION,
  SAVE_DATA_CONNECTION,
  UPDATE_DATA_CONNECTION,
  ALL_CONNECTION,
} from './DataConnector/Actions';
import {
  CONNECTION_SELECTION_STEP_DONE,
  NEW_ASSET_NAME_ENTERED,
  QUERY_DATA,
  TABLE_NAMES_FROM_CONNECTOR,
  SELECTED_CONNECTION,
  SQL_CONTENT,
  SQL_ASSET,
  COLUMN_NAMES_OF_TABLE,
  ACCESSIBLE_DATA_ASSETS,
} from './SQLAssetView/Actions';
import {
  CHART_DATA,
  CHART_ASSET_DETAILS,
  CHART_ASSET_UPDATED,
  CHART_ASSET_CREATION_STARTED,
} from './ChartView/Actions';
import { DASHBOARD_CHART_ASSET_DETAILS, DASHBOARD_CHART_DATA } from './DashboardView/Actions';
import { DELETE_ASSET_VIEW_STATE } from '../Actions';
import {
  ASSET_USER_ACCESSIBILITY,
  CURRENT_ASSET_ID,
  ASSET_DETAILS,
  DATASET_UPLOADED,
  DATASET_ASSET_CREATED,
  DISCOVERABILITY_SCORE,
  SQL_ASSET_CREATED,
  CHART_ASSET_CREATED,
} from './Actions';

export const dataAssetView = (state = {}, action) => {
  const data = action.data;
  switch (action.type) {
    case COLUMN_NAMES_OF_AN_ASSET:
      return Object.assign({}, state, { columnNamesOfAnAsset: action.data });
    case UNIQUE_VALUES_OF_COLUMN_NAME:
      return Object.assign({}, state, {
        uniqueValuesOfColumnName: action.data,
      });
    case GENERATE_QUERY_AND_GET_DATE_RESULT:
      return Object.assign({}, state, { getDataResult: action.data });
    case EXPAND_FILTERS_AND_SHOW_SQL_EDITOR:
      return Object.assign({}, state, { expandFilters: action.data });
    case SEARCH_USER_BY_NAME_RESULT:
      return Object.assign({}, state, { searchUserByNameResult: action.data });
    case ASSET_DETAILS:
      return Object.assign({}, state, { assetDetails: action.data });
    case RELATED_ASSETS_DATA:
      return Object.assign({}, state, { relatedAssetsData: action.data });
    case ASSET_USER_ACCESSIBILITY:
      return Object.assign({}, state, {
        assetUserAccessibility: { ...action.data },
      });
    case HAS_ADMIN_ACCESS:
      return Object.assign({}, state, { ...action.data });
    case CURRENT_ASSET_ID:
      return Object.assign({}, state, { ...action.data });
    case OPEN_ASSET_PERMISSIONS_MODAL:
      return Object.assign({}, state, { openAssetPermissionsModal: true });
    case CLOSE_ASSET_PERMISSIONS_MODAL:
      return Object.assign({}, state, { openAssetPermissionsModal: false });
    case ASSET_DELETED:
      return Object.assign({}, state, { assetDeletionStatus: action.data });
    case SET_SQL_CAPABILITY:
      return Object.assign({}, state, { sqlCapability: { ...action.data } });
    case RECEIVE_MINI_INFO_ABOUT_FILTERS:
      return Object.assign({}, state, { miniInfoOfFilters: action.data });
    case RECEIVE_NORMAL_FILTER_INFO_BASED_ON_ID:
      return Object.assign({}, state, { normalFilterInfo: action.data });
    case SAVED_NORMAL_FILTER_SET:
      return Object.assign({}, state, { savedFilterSet: action.data });
    case TEST_DATA_CONNECTION:
      return Object.assign({}, state, { ...action.data });
    case SAVE_DATA_CONNECTION:
      return Object.assign({}, state, {
        selectedConnection: {
          ...state.selectedConnection,
          id: action.data.connectionId,
        },
      });
    case UPDATE_DATA_CONNECTION:
      return Object.assign({}, state, { ...action.data });
    case ALL_CONNECTION:
      return Object.assign({}, state, { allConnections: action.data });
    case TABLE_NAMES_FROM_CONNECTOR:
      return Object.assign({}, state, { ...action.data });
    case SELECTED_CONNECTION:
      return Object.assign({}, state, { selectedConnection: action.data });
    case QUERY_DATA:
      return Object.assign({}, state, { queryData: action.data });
    case CONNECTION_SELECTION_STEP_DONE:
      return Object.assign({}, state, {
        connectionSelectionStepDone: action.data,
      });
    case NEW_ASSET_NAME_ENTERED:
      return Object.assign({}, state, {
        newAssetNameEntered: action.data,
        connectionSelectionStepDone: false,
      });
    case UPDATE_ASSET_DETAILS:
      return Object.assign({}, state, { assetDetails: action.data });
    case SQL_CONTENT:
      return Object.assign({}, state, { sqlContent: action.data });
    case SQL_ASSET:
      return Object.assign({}, state, { sqlAsset: action.data });
    case COLUMN_NAMES_OF_TABLE:
      return Object.assign({}, state, {
        columnNamesOfTable: { ...action.data },
      });
    case DATASET_UPLOADED:
      return Object.assign({}, state, {
        uploadedDataSet: { ...action.data },
      });
    case DATASET_ASSET_CREATED:
      return Object.assign({}, state, {
        createdDataSet: { ...action.data },
      });
    case DISCOVERABILITY_SCORE:
      return Object.assign({}, state, {
        discoverabilityScore: action.data,
      });
    case SQL_ASSET_CREATED:
      return Object.assign({}, state, { createdSQLAsset: action.data });
    case CHART_ASSET_CREATED:
      return Object.assign({}, state, { createdChartAsset: action.data });
    case CHART_ASSET_UPDATED:
      return Object.assign({}, state, Object.assign({}, action.data));
    case CHART_ASSET_CREATION_STARTED:
      return Object.assign({}, state, { chartAssetCreationStarted: true });
    case ACCESSIBLE_DATA_ASSETS:
      return Object.assign({}, state, {
        accessibleDataAssets: action.data.accessibleDataAssetInformation,
      });
    case CHART_DATA:
      return Object.assign({}, state, {
        chartData: action.data,
      });
    case DASHBOARD_CHART_ASSET_DETAILS:
      const dashboardChartAssetDetails = state.dashboardChartAssetDetails || {};
      return Object.assign({}, state, {
        dashboardChartAssetDetails: {
          ...dashboardChartAssetDetails,
          [data.id]: data,
        },
      });
    case DASHBOARD_CHART_DATA:
      const dashboardChartData = state.dashboardChartData || {};
      return Object.assign({}, state, {
        dashboardChartData: {
          ...dashboardChartData,
          [data.id]: data,
        },
      });
    case CHART_ASSET_DETAILS:
      return Object.assign({}, state, {
        chartAssetDetails: action.data,
      });
    case DELETE_ASSET_VIEW_STATE:
      return {};
    default:
      return state;
  }
};
