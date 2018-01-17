export const SEARCH_USER_BY_NAME_RESULT = 'SEARCH_USER_BY_NAME_RESULT';
export const HAS_ADMIN_ACCESS = 'HAS_ADMIN_ACCESS';
export const ASSET_PERMISSIONS_UPDATED = 'ASSET_PERMISSIONS_UPDATED';
export const CLOSE_ASSET_PERMISSIONS_MODAL = 'CLOSE_ASSET_PERMISSIONS_MODAL';

export const searchUserByNameResult = (data) => {
  return {
    type: SEARCH_USER_BY_NAME_RESULT,
    data,
  };
};

export const hasAmdinAccess = (data) => {
  return {
    type: HAS_ADMIN_ACCESS,
    data,
  };
};

export const assetPermissionsUpdated = (data) => {
  return {
    type: ASSET_PERMISSIONS_UPDATED,
    data,
  };
};

export const closeAssetPermissionsModal = () => {
  return {
    type: CLOSE_ASSET_PERMISSIONS_MODAL,
  };
};
