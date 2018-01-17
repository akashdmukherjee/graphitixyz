export const GET_ALL_ASSET_TAGS_RESULT = 'GET_ALL_ASSET_TAGS_RESULT';
export const SET_ACTIVE_TAGS = 'SET_ACTIVE_TAGS';
export const MEMBER_TEAMS = 'MEMBER_TEAMS';
export const TEAM_MEMBERS = 'TEAM_MEMBERS';

export const getAllAssetTagsResult = data => ({
  type: GET_ALL_ASSET_TAGS_RESULT,
  data,
});

export const setActiveTags = data => ({
  type: SET_ACTIVE_TAGS,
  data,
});

export const memberTeams = data => ({
  type: MEMBER_TEAMS,
  data,
});

export const teamMembers = data => ({
  type: TEAM_MEMBERS,
  data,
});
