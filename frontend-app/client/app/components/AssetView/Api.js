import axios from 'axios';
import uuidV4 from 'uuid';
import querystring from 'querystring';
import {
  columnNamesOfAnAsset,
  uniqueValuesOfColumnName,
  generateQueryAndGetDataResult,
  receiveMiniInfoAboutFilters,
  receiveNormalfilterInformationBasedOnId,
  savedNormalFilterSet,
} from './Filters/Actions';
import {
  testDataConnection,
  saveDataConnection,
  updateDataConnection,
  allConnectionsForUser,
} from './DataConnector/Actions';
import {
  searchUserByNameResult,
  hasAmdinAccess,
  assetPermissionsUpdated,
} from './RightSideBar/AssetPermissions/Actions';
import { relatedAssetsData } from './RelatedAssets/Actions';
import {
  assetUserAccessibilty,
  assetDetails,
  dataSetUploaded,
  dataSetAssetCreated,
  sqlAssetCreated,
  discoverabilityScore,
  chartAssetCreated,
} from './Actions';
import {
  queryData,
  tableNamesFromConnector,
  sqlAsset,
  sqlContent,
  sqlContentUpdate,
  columnNamesOfTable,
  accessibleDataAssets,
} from './SQLAssetView/Actions';
import { chartData, chartAssetDetails, chartAssetUpdated } from './ChartView/Actions';
import { assetDeleted, saveAssetDetailsChanges } from './RightSideBar/Actions';
import { dashboardChartAssetDetails, dashboardChartData } from './DashboardView/Actions';
import { connectorServiceHost, userServiceHost, assetServiceHost } from '../../serviceHosts';

import injestionOperationTypes from './injestionOperationTypes';

axios.defaults.withCredentials = true;

export const getColumnNamesOfAnAsset = data => dispatch => {
  const url = `${connectorServiceHost}/cache/dataAsset/${data.assetId}/columnNames`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {
      dispatch(columnNamesOfAnAsset(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getUniqueValuesOfColumnName = data => dispatch => {
  const url = `${connectorServiceHost}/cache/dataAsset/${data.assetId}/${data.columnName}/uniqueValues`;
  const newSQLCapability = { ...data.sqlCapability };
  /**
     * this is a temporary solution since backend handles only null
     * not empty arrays so sanitize it from here
     */
  if (
    newSQLCapability.filters &&
    newSQLCapability.filters.appliedFilters &&
    newSQLCapability.filters.appliedFilters.length === 0
  ) {
    newSQLCapability.filters = null;
  }
  if (newSQLCapability.columnOrders && newSQLCapability.columnOrders.length === 0) {
    newSQLCapability.columnOrders = null;
  }
  if (
    newSQLCapability.selectColumnsAndFunctions &&
    newSQLCapability.selectColumnsAndFunctions.length === 0
  ) {
    newSQLCapability.selectColumnsAndFunctions = null;
  }
  axios
    .post(
      url,
    {
      ...newSQLCapability,
    },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {
      dispatch(uniqueValuesOfColumnName(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getDiscoverabilityScore = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}/discoverabilityScore`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
        commitDiscoverabilityScore: true,
      },
    })
    .then(result => {
      dispatch(discoverabilityScore(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const generateQueryAndGetData = data => dispatch => {
  const url = `${connectorServiceHost}/cache/dataAsset/${data.assetId}/generateQueryAndGetData`;
  axios
    .post(
      url,
    {
      ...data.sqlCapability,
    },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
        isDistinct: data.isDistinct,
      },
    }
    )
    .then(result => {
      dispatch(generateQueryAndGetDataResult(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getUsersByNameSearch = data => dispatch => {
  const url = `${userServiceHost}/user?q=${data.query}`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
      },
    })
    .then(result => {
      dispatch(searchUserByNameResult(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getAssetDetails = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
        assetId: data.assetId,
      },
    })
    .then(result => {
      dispatch(assetDetails(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getRelatedAssetsData = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}/flowdetails`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(relatedAssetsData(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const checkAssetUserAccessibility = data => dispatch => {
  const url = `${assetServiceHost}/asset/checkUserAccessibility/${data.assetId}`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(assetUserAccessibilty(result.data));
    })
    .catch(error => {
      const { status } = error.response;
      if (status === 404) {
        dispatch(assetUserAccessibilty({ hasUserAccess: false }));
      }
    });
};

export const checkAssetAdminAccess = data => dispatch => {
  const url = `${assetServiceHost}/asset/checkAdminAccess/${data.assetId}`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(hasAmdinAccess(result.data));
    })
    .catch(error => {
      const { status } = error.response;
      if (status === 404) {
        dispatch(hasAmdinAccess({ hasAdminAccess: false }));
      }
    });
};

export const updateAssetPermissions = data => dispatch => {
  const url = `${assetServiceHost}/asset/permissions`;
  axios
    .put(
      url,
    {
      ...data,
    },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {
      dispatch(assetPermissionsUpdated({ assetPermissionsUpdated: true }));
    })
    .catch(error => {
      // console.error(error);
      dispatch(assetPermissionsUpdated({ assetPermissionsUpdated: false }));
    });
};

export const deleteAsset = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}`;
  axios
    .delete(url, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(assetDeleted(true));
    })
    .catch(error => {
      // console.error(error);
      dispatch(assetDeleted(false));
    });
};

export const getFilterSetsMiniInfoOfAnAsset = data => dispatch => {
  const url = `${assetServiceHost}/asset/dataset/${data.assetId}/filtersMiniInformation`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(receiveMiniInfoAboutFilters(result.data));
    })
    .catch(error => {
      const { status } = error.response;
      if (status === 404) {
        // TODO
      }
    });
};

export const getNormalFilterInformationBasedOnId = data => dispatch => {
  const url = `${assetServiceHost}/asset/dataset/${data.assetId}/sqlCapability/${data.filterSetId}`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(receiveNormalfilterInformationBasedOnId(result.data));
    })
    .catch(error => {
      const { status } = error.response;
      if (status === 404) {
        // TODO
      }
    });
};

export const saveNormalFilterSet = data => dispatch => {
  const url = `${assetServiceHost}/asset/dataset/${data.assetId}/sqlCapability`;
  axios
    .put(
      url,
    {
      ...data.sqlCapability,
    },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {
      dispatch(
        savedNormalFilterSet({
          filterSetId: result.data,
          filterSetName: data.sqlCapability.filterSetName,
        })
      );
    })
    .catch(error => {
      // console.error(error);
    });
};

export const updateFilterSetName = data => dispatch => {
  const url = `${assetServiceHost}/asset/dataset/${data.assetId}/filter/${data.filterSetId}/filterName`;
  axios
    .put(url, data.filterSetName, {
      headers: {
        'graphiti-tid': Math.random(),
        'Content-Type': 'text/plain',
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {})
    .catch(error => {
      // console.error(error);
    });
};

export const testDatabaseConnection = data => dispatch => {
  const url = `${connectorServiceHost}/connection/testConnection`;
  axios
    .post(
      url,
      { ...data.connectionDetailsObject },
    {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    }
    )
    .then(result => {
      dispatch(testDataConnection(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const saveDatabaseConnection = data => dispatch => {
  const url = `${connectorServiceHost}/connection`;
  axios
    .post(
      url,
      { ...data.connectionDetailsObject },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
      },
    }
    )
    .then(result => {
      dispatch(saveDataConnection(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const updateDatabaseConnection = data => dispatch => {
  const url = `${connectorServiceHost}/connection/${data.connectionDetailsObject.id}`;
  axios
    .put(
      url,
      { ...data.connectionDetailsObject },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
      },
    }
    )
    .then(result => {
      dispatch(updateDataConnection({ connectionUpdateStatus: true }));
    })
    .catch(error => {
      dispatch(updateDataConnection({ connectionUpdateStatus: false }));
    });
};

export const getAllConnectionsForUser = data => dispatch => {
  const url = `${connectorServiceHost}/connection`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(allConnectionsForUser(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getTableNamesFromConnector = data => dispatch => {
  const url = `${connectorServiceHost}/connection/${data.connectionId}/tables`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {
      dispatch(tableNamesFromConnector(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getQueryData = data => dispatch => {
  const url = `${connectorServiceHost}/connection/${data.connectionId}/data`;
  axios
    .post(
      url,
      { ...data.body },
    {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
        operationType: data.operationType,
      },
    }
    )
    .then(result => {
      if (data.operationType === injestionOperationTypes.ONLY_DATA_ATTACH_TO_SQL) {
        dispatch(dataSetAssetCreated(result.data));
        dispatch(queryData(result.data.data));
      } else if (data.operationType === injestionOperationTypes.ONLY_SQL) {
        dispatch(sqlAssetCreated(result.data));
      } else if (data.operationType === injestionOperationTypes.NO_SQL_NO_DATA) {
        dispatch(queryData(result.data.data));
      }
    })
    .catch(error => {
      // console.error(error);
    });
};

export const updateQueryData = data => dispatch => {
  const url = `${connectorServiceHost}/connection/${data.connectionId}/data`;
  axios
    .put(
      url,
      { ...data.body },
    {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
        assetId: data.assetId,
        operationType: data.operationType,
      },
    }
    )
    .then(result => {
      console.info(result.data);
      dispatch(dataSetAssetCreated(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const updateAssetDetails = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}?type=FIELD_UPDATE_ONLY`;
  axios
    .put(
      url,
      { ...data },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {
      dispatch(saveAssetDetailsChanges({ assetDetailsUpdateStatus: true }));
      getDiscoverabilityScore(data)(dispatch);
    })
    .catch(error => {
      dispatch(saveAssetDetailsChanges({ assetDetailsUpdateStatus: false }));
    });
};

export const addAssetFavorite = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}/makeFavorite`;
  axios
    .put(
      url,
      { ...data },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {})
    .catch(error => {});
};

export const deleteAssetFavorite = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}/removeFavorite`;
  axios
    .put(
      url,
      { ...data },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {})
    .catch(error => {});
};

export const addAssetEndorsement = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}/addEndorsement?endorsementType=${data.endorsementType}`;
  axios
    .put(
      url,
      { ...data },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
        endorsementType: data.endorsementType,
      },
    }
    )
    .then(result => {
      getDiscoverabilityScore(data)(dispatch);
    })
    .catch(error => {});
};

export const deleteAssetEndorsement = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}/removeEndorsement?endorsementType=${data.endorsementType}`;
  axios
    .put(
      url,
      { ...data },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {
      getDiscoverabilityScore(data)(dispatch);
    })
    .catch(error => {});
};

// SQLAssetView
export const getSQLContent = data => dispatch => {
  const url = `${assetServiceHost}/asset/sqlAsset/${data.assetId}/sqlContent`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {
      console.info('SQLContent', result.data.sqlContent);
      dispatch(sqlContent(result.data.sqlContent));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getSQLAsset = data => dispatch => {
  const url = `${assetServiceHost}/asset/sqlAsset/${data.assetId}`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {
      dispatch(sqlAsset(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const updateSQLContent = data => dispatch => {
  const url = `${connectorServiceHost}/connection/${data.connectionId}/data`;
  axios
    .put(
      url,
      { query: data.query },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
        assetId: data.assetId,
        operationType: injestionOperationTypes.ONLY_SQL,
      },
    }
    )
    .then(result => {
      dispatch(sqlContentUpdate({ sqlContentUpdateStatus: true }));
    })
    .catch(error => {
      dispatch(sqlContentUpdate({ sqlContentUpdateStatus: false }));
    });
};

// FAQ and Note
// /ext/asset/{assetId}/faq
export const addFAQ = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}/faq`;
  axios
    .post(
      url,
    {
      question: data.question,
      answer: data.answer,
    },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {})
    .catch(error => {
      // console.error(error);
    });
};

export const addNote = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.assetId}/note`;
  axios
    .post(
      url,
      { content: data.content },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {})
    .catch(error => {
      // console.error(error);
    });
};

export const getColumnNamesOfTable = data => dispatch => {
  const url = `${connectorServiceHost}/connection/${data.connectionId}/table/${data.tableName}/columns`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {
      dispatch(columnNamesOfTable({ tableName: data.tableName, ...result.data }));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const uploadAssetFile = data => dispatch => {
  const url = `${connectorServiceHost}/data/upload`;
  const formData = new FormData();
  formData.append('typeOfFile', 'csv');
  formData.append('dataAssetName', data.assetName);
  formData.append('file', data.file);
  let percentCompleted;
  const config = {
    onUploadProgress(progressEvent) {
      percentCompleted = Math.round(progressEvent.loaded * 100 / progressEvent.total);
      console.info(percentCompleted);
    },
  };
  axios
    .post(
      url,
      formData,
    {
      headers: {
        'graphiti-tid': uuidV4(),
        memberId: data.memberId,
        orgId: data.orgId,
        'Content-Type': 'multipart/form-data',
      },
    },
      config
    )
    .then(result => {
      dispatch(dataSetUploaded(result.data));
    })
    .catch(error => {
      console.info(error);
    });
};

export const createRelatedAsset = data => dispatch => {
  const url = `${connectorServiceHost}/relatedAsset`;
  axios
    .post(
      url,
      { ...data.body },
    {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
        operationType: data.operationType,
      },
    }
    )
    .then(result => {
      if (data.operationType === injestionOperationTypes.ONLY_DATA_ATTACH_TO_SQL) {
        dispatch(dataSetAssetCreated(result.data));
        dispatch(queryData(result.data.data.data));
      } else if (data.operationType === injestionOperationTypes.ONLY_SQL) {
        dispatch(sqlAssetCreated(result.data));
      } else if (data.operationType === injestionOperationTypes.NO_SQL_NO_DATA) {
        dispatch(queryData(result.data.data.data));
      }
    })
    .catch(error => {
      // console.error(error);
    });
};

export const updateRelatedAsset = data => dispatch => {
  const url = `${connectorServiceHost}/relatedAsset/sqlAsset/${data.assetId}`;
  axios
    .put(
      url,
      { ...data.body },
    {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
        operationType: data.operationType,
      },
    }
    )
    .then(result => {
      console.info(result.data);
      dispatch(dataSetAssetCreated(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getDataAssets = data => dispatch => {
  const url = `${assetServiceHost}/asset/${data.memberId}/accessibleDataAssets`;
  return axios
    .get(url, {
      headers: {
        'graphiti-tid': uuidV4(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {
      dispatch(accessibleDataAssets(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

const convertRequestBodyArrayToQueryString = function (obj) {
  const body = {};
  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      body[key] = obj[key];
    } else if (typeof obj[key] === 'string' || obj[key].constructor === Boolean || obj[key].constructor === Number) {
      body[key] = obj[key];
    } else {
      // change columnName to field_name
      const newArray = obj[key].map(data => ({ ...data, field_name: data.columnName }));
      body[key] = JSON.stringify(newArray);
    }
  }
  return body;
};

// Chart APIs
// /chartAsset/getData
export const getChartData = (data, comingFromDashboard, assetId) => dispatch => {
  // assetId is needed for dashboardChartData, nothing else
  const body = convertRequestBodyArrayToQueryString(data.chartConfig);
  const url = `${connectorServiceHost}/chartAsset/getData`;
  axios
    .post(url, body, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
        sourceDataAssetId: data.sourceDataAssetId,
      },
    })
    .then(result => {
      if (!!comingFromDashboard) {
        dispatch(dashboardChartData({ ...result.data, id: assetId }));
      } else {
        dispatch(chartData(result.data));
      }
    })
    .catch(error => {
      console.error(error);
    });
};

export const createChartAsset = data => dispatch => {
  const chartConfigs = convertRequestBodyArrayToQueryString(data.chartConfigs);
  const body = {
    memberId: data.memberId,
    assetName: data.assetName,
    assetType: 'CHART',
    sourceAssetIds: data.sourceAssetIds,
    chartConfigs,
  };
  const url = `${assetServiceHost}/asset/chartAsset`;
  axios
    .post(url, body, {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(chartAssetCreated(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

// /asset/chartAsset/{assetId}

export const getChartAssetDetails = (data, comingFromDashboard) => dispatch => {
  const url = `${assetServiceHost}/asset/chartAsset/${data.assetId}`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {
      // use seperate action for chartAssetDetails request
      // coming from DashboardView
      if (!!comingFromDashboard === false) {
        dispatch(chartAssetDetails(result.data));
      } else {
        dispatch(dashboardChartAssetDetails(result.data));
      }
    })
    .catch(error => {
      console.error(error);
    });
};

// use this variable to make props in
// ChartView change so that update/save status can be manipulated
let isChartAssetUpdated = false;
export const updateChartAsset = data => dispatch => {
  const body = convertRequestBodyArrayToQueryString(data.chartConfigs);
  const url = `${assetServiceHost}/asset/chartAsset/${data.assetId}`;
  isChartAssetUpdated = !isChartAssetUpdated;
  axios
    .put(
      url,
      { chartConfigs: body },
    {
      headers: {
        'graphiti-tid': Math.random(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    }
    )
    .then(result => {
      // console.info(result.data);
      dispatch(chartAssetUpdated({ chartAssetUpdated: isChartAssetUpdated }));
    })
    .catch(error => {
      // console.error(error);
      dispatch(chartAssetUpdated({ chartAssetUpdated: isChartAssetUpdated }));
    });
};
