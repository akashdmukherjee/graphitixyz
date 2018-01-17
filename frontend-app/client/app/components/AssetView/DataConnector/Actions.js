export const SAVE_DATA_CONNECTION = 'SAVE_DATA_CONNECTION';
export const UPDATE_DATA_CONNECTION = 'UPDATE_DATA_CONNECTION';
export const TEST_DATA_CONNECTION = 'TEST_DATA_CONNECTION';
export const ALL_CONNECTION = 'ALL_CONNECTION';

export const testDataConnection = data => {
  return {
    type: TEST_DATA_CONNECTION,
    data,
  };
};

export const saveDataConnection = data => {
  return {
    type: SAVE_DATA_CONNECTION,
    data,
  };
};

export const updateDataConnection = data => {
  return {
    type: UPDATE_DATA_CONNECTION,
    data,
  };
};

export const allConnectionsForUser = data => {
  return {
    type: ALL_CONNECTION,
    data,
  };
};
