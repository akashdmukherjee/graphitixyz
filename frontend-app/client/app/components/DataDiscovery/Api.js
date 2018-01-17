import axios from 'axios';
import { assetUploaded } from './AssetUpload/Actions';
import {
  searchAssetResult,
  searchAssetAutocompleteResult,
} from './Search/Actions';
import {
  getAllAssetTagsResult,
  memberTeams,
  teamMembers,
} from './SideBar/Actions';
import {
  connectorServiceHost,
  searchServiceHost,
  userServiceHost,
} from '../../serviceHosts';
import { searchUsersResult } from './Actions';
const uuidV4 = require('uuid/v4');
axios.defaults.withCredentials = true;

export const searchTextInSolr = data => dispatch => {
  const url = `${searchServiceHost}/search/asset`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': uuidV4(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
      params: data.urlParams,
    })
    .then(result => {
      // console.info(result);
      dispatch(searchAssetResult(result.data));
    })
    .catch(error => {
      console.info(error);
    });
};

export const getAllAssetTags = data => dispatch => {
  const url = `${searchServiceHost}/search/asset/tags`;
  // console.info(urlParams);
  axios
    .get(url, {
      headers: {
        'graphiti-tid': uuidV4(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    })
    .then(result => {
      dispatch(getAllAssetTagsResult(result.data));
    })
    .catch(error => {
      console.info(error);
    });
};

export const getSearchAutocomplete = data => dispatch => {
  const url = `${searchServiceHost}/search/asset/autocomplete`;
  const urlParams = {
    query: data.query,
  };
  axios
    .get(url, {
      headers: {
        'graphiti-tid': uuidV4(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
      params: urlParams,
    })
    .then(result => {
      dispatch(searchAssetAutocompleteResult(result.data));
    })
    .catch(error => {
      console.info(error);
    });
};

export const searchUsersByName = data => dispatch => {
  /**
   * header:
   * onlyMembers: @Boolean
   */
  const url = `${userServiceHost}/user?q=${data.query}`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': uuidV4(),
        orgId: data.orgId,
        memberId: data.memberId,
        ...data.headers,
      },
    })
    .then(result => {
      dispatch(searchUsersResult(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

// Teams
export const createTeam = data => dispatch => {
  const url = `${userServiceHost}/team`;
  axios
    .post(
      url,
    {
      ...data.body,
    },
    {
      headers: {
        'graphiti-tid': uuidV4(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {
      console.info(result);
    })
    .catch(error => {
      console.info(error);
    });
};

export const getMemberTeams = data => dispatch => {
  const url = `${userServiceHost}/member/${data.memberId}/teams`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': uuidV4(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(memberTeams(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const getTeamMembers = data => dispatch => {
  const url = `${userServiceHost}/team/${data.teamId}/members`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': uuidV4(),
        orgId: data.orgId,
        memberId: data.memberId,
      },
    })
    .then(result => {
      dispatch(teamMembers(result.data));
    })
    .catch(error => {
      // console.error(error);
    });
};

export const updateTeam = data => dispatch => {
  const url = `${userServiceHost}/team/${data.teamId}/member`;
  axios
    .put(
      url,
      { ...data.body },
    {
      headers: {
        'graphiti-tid': Math.random(),
        memberId: data.memberId,
        orgId: data.orgId,
      },
    }
    )
    .then(result => {})
    .catch(error => {});
};
