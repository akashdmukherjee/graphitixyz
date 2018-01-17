export const COLUMN_NAMES_OF_AN_ASSET = 'COLUMN_NAMES_OF_AN_ASSET';
export const UNIQUE_VALUES_OF_COLUMN_NAME = 'UNIQUE_VALUES_OF_COLUMN_NAME';
export const GENERATE_QUERY_AND_GET_DATE_RESULT =
  'GENERATE_QUERY_AND_GET_DATE_RESULT';
export const EXPAND_FILTERS_AND_SHOW_SQL_EDITOR =
  'EXPAND_FILTERS_AND_SHOW_SQL_EDITOR';
export const SET_SQL_CAPABILITY = 'SET_SQL_CAPABILITY';
export const RECEIVE_MINI_INFO_ABOUT_FILTERS =
  'RECEIVE_MINI_INFO_ABOUT_FILTERS';
export const RECEIVE_NORMAL_FILTER_INFO_BASED_ON_ID =
  'RECEIVE_NORMAL_FILTER_INFO_BASED_ON_ID';
export const SAVED_NORMAL_FILTER_SET = 'SAVED_NORMAL_FILTER_SET';

export const columnNamesOfAnAsset = data => {
  return {
    type: COLUMN_NAMES_OF_AN_ASSET,
    data,
  };
};

export const uniqueValuesOfColumnName = data => {
  return {
    type: UNIQUE_VALUES_OF_COLUMN_NAME,
    data,
  };
};

export const generateQueryAndGetDataResult = data => {
  return {
    type: GENERATE_QUERY_AND_GET_DATE_RESULT,
    data,
  };
};

export const expandFiltersAndShowSQLEditor = data => {
  return {
    type: EXPAND_FILTERS_AND_SHOW_SQL_EDITOR,
    data,
  };
};

export const setSQLCapability = data => {
  return {
    type: SET_SQL_CAPABILITY,
    data,
  };
};

export const receiveMiniInfoAboutFilters = data => {
  return {
    type: RECEIVE_MINI_INFO_ABOUT_FILTERS,
    data,
  };
};

export const receiveNormalfilterInformationBasedOnId = data => {
  return {
    type: RECEIVE_NORMAL_FILTER_INFO_BASED_ON_ID,
    data,
  };
};

export const savedNormalFilterSet = data => {
  return {
    type: SAVED_NORMAL_FILTER_SET,
    data,
  };
};
