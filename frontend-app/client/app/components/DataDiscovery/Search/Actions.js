export const SEARCH_ASSET_RESULT = 'SEARCH_ASSET_RESULT';
export const SEARCH_ASSET_AUTOCOMPLETE_RESULT =
  'SEARCH_ASSET_AUTOCOMPLETE_RESULT';

export const searchAssetResult = data => ({
  type: SEARCH_ASSET_RESULT,
  data,
});

export const searchAssetAutocompleteResult = data => ({
  type: SEARCH_ASSET_AUTOCOMPLETE_RESULT,
  data,
});
