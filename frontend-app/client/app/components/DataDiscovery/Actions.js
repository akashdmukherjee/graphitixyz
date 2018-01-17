export const SEARCH_USERS_RESULT = 'SEARCH_USERS_RESULT';
export const PROFILE_CHANGED = 'PROFILE_CHANGED';
export const SORT_BY_CHANGED = 'SORT_BY_CHANGED';

export const searchUsersResult = data => ({
  type: SEARCH_USERS_RESULT,
  data,
});

export const profileChanged = data => ({
  type: PROFILE_CHANGED,
  data,
});

export const sortByChanged = data => ({
  type: SORT_BY_CHANGED,
  data,
});
