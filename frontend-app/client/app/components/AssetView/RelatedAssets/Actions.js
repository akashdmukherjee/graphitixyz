export const RELATED_ASSETS_DATA = 'RELATED_ASSETS_DATA';

export const relatedAssetsData = (data) => {
  return {
    type: RELATED_ASSETS_DATA,
    data,
  };
};
