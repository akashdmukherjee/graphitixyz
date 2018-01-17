import axios from 'axios';
import uuidV4 from 'uuid';
import { connectorServiceHost, assetServiceHost } from '../../../serviceHosts';

axios.defaults.withCredentials = true;

export const getColumnNamesOfAnAsset = data => {
  const url = `${connectorServiceHost}/cache/dataAsset/${data.assetId}/columnNames`;
  return axios.get(url, {
    headers: {
      'graphiti-tid': uuidV4(),
      memberId: data.memberId,
      orgId: data.orgId,
    },
  });
};

export const getUniqueValuesOfColumnName = data => {
  const url = `${connectorServiceHost}/cache/dataAsset/${data.assetId}/${data.columnName}/uniqueValues`;
  const newSQLCapability = { ...data.sqlCapability };

  return axios.post(
    url,
    {
      ...newSQLCapability,
    },
    {
      headers: {
        'graphiti-tid': uuidV4(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
  );
};

export const getTableNamesFromConnector = data => {
  const url = `${connectorServiceHost}/connection/${data.connectionId}/tables`;
  return axios.get(url, {
    headers: {
      'graphiti-tid': uuidV4(),
      memberId: data.memberId,
      orgId: data.orgId,
    },
  });
};

export const getColumnNamesOfTable = data => {
  const url = `${connectorServiceHost}/connection/${data.connectionId}/table/${data.tableName}/columns`;
  return axios.get(url, {
    headers: {
      'graphiti-tid': uuidV4(),
      memberId: data.memberId,
      orgId: data.orgId,
    },
  });
};

export const getDataAssets = data => {
  const url = `${assetServiceHost}/asset/${data.memberId}/accessibleDataAssets`;
  return axios.get(url, {
    headers: {
      'graphiti-tid': uuidV4(),
      memberId: data.memberId,
      orgId: data.orgId,
    },
  });
};
