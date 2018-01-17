export const CONNECTION_SELECTION_STEP_DONE = 'CONNECTION_SELECTION_STEP_DONE';
export const NEW_ASSET_NAME_ENTERED = 'NEW_ASSET_NAME_ENTERED';
export const SELECTED_CONNECTION = 'SELECTED_CONNECTION';
export const TABLE_NAMES_FROM_CONNECTOR = 'TABLE_NAMES_FROM_CONNECTOR';
export const QUERY_DATA = 'QUERY_DATA';
export const SQL_CONTENT = 'SQL_CONTENT';
export const SQL_ASSET = 'SQL_ASSET';
export const SQL_CONTENT_UPDATE = 'SQL_CONTENT_UPDATE';
export const COLUMN_NAMES_OF_TABLE = 'COLUMN_NAMES_OF_TABLE';
export const ACCESSIBLE_DATA_ASSETS = 'ACCESSIBLE_DATA_ASSETS';

export const connectionSelectionStepDone = data => ({
  type: CONNECTION_SELECTION_STEP_DONE,
  data,
});

export const newAssetNameEntered = data => ({
  type: NEW_ASSET_NAME_ENTERED,
  data,
});

export const tableNamesFromConnector = data => {
  return {
    type: TABLE_NAMES_FROM_CONNECTOR,
    data,
  };
};

export const selectedConnection = data => {
  return {
    type: SELECTED_CONNECTION,
    data,
  };
};

export const queryData = data => {
  return {
    type: QUERY_DATA,
    data,
  };
};

export const sqlContent = data => ({
  type: SQL_CONTENT,
  data,
});

export const sqlAsset = data => ({
  type: SQL_ASSET,
  data,
});

export const sqlContentUpdate = data => ({
  type: SQL_CONTENT_UPDATE,
  data,
});

export const columnNamesOfTable = data => ({
  type: COLUMN_NAMES_OF_TABLE,
  data,
});

export const accessibleDataAssets = data => ({
  type: ACCESSIBLE_DATA_ASSETS,
  data,
});
