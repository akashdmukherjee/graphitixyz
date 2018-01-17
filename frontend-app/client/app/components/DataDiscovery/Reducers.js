import { SEARCH_ASSET_RESULT, SEARCH_ASSET_AUTOCOMPLETE_RESULT } from './Search/Actions';
import {
  GET_ALL_ASSET_TAGS_RESULT,
  SET_ACTIVE_TAGS,
  MEMBER_TEAMS,
  TEAM_MEMBERS,
} from './SideBar/Actions';
import { DELETE_DISCOVERY_STATE } from '../Actions';
import { SEARCH_USERS_RESULT, PROFILE_CHANGED, SORT_BY_CHANGED } from './Actions';

export const dataDiscovery = (state = { activeTags: [] }, action) => {
  switch (action.type) {
    case SEARCH_ASSET_RESULT:
      return Object.assign({}, state, { searchResult: action.data || {} });
    case GET_ALL_ASSET_TAGS_RESULT:
      return Object.assign({}, state, { ...action.data });
    case SEARCH_ASSET_AUTOCOMPLETE_RESULT:
      return Object.assign({}, state, { autocomplete: action.data });
    case SEARCH_USERS_RESULT:
      return { ...state, ...{ searchUsersResult: action.data } };
    case SET_ACTIVE_TAGS:
      return {
        ...state,
        ...{ activeTags: action.data },
      };
    case MEMBER_TEAMS:
      return { ...state, ...{ memberTeams: action.data.teams } };
    case TEAM_MEMBERS:
      return { ...state, ...{ teamMembers: action.data } };
    case PROFILE_CHANGED:
      return { ...state, ...{ profile: action.data } };
    case SORT_BY_CHANGED:
      return { ...state, ...{ sortBy: action.data } };
    case DELETE_DISCOVERY_STATE:
      return {};
    default:
      return state;
  }
};
