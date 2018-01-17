import axios from 'axios';
import {
  orgUserVerified,
  userLoggedIn,
  forgotPasswordSubmitted,
  userSignedUp,
  orgSignedUp,
  loggedInUser,
} from './LoginActions';
import { userServiceHost } from '../../serviceHosts';

const uuidV4 = require('uuid/v4');
axios.defaults.withCredentials = true;

const verifyOrg = email => {
  const url = `${userServiceHost}/org/verifyOrganization`;
  return axios.get(url, {
    params: { email },
    headers: { 'graphiti-tid': uuidV4() },
  });
};

const verifyUser = email => {
  const url = `${userServiceHost}/member/exists`;
  return axios.get(url, {
    params: { email },
    headers: { 'graphiti-tid': uuidV4() },
  });
};

export const verifyOrgAndUser = email => dispatch =>
  verifyOrg(email)
    .then(result => {
      // console.info(result);
      verifyUser(email)
        .then(response => {
          // console.info(response);
          dispatch(
            orgUserVerified({
              org: result.data,
              user: response.data,
            })
          );
        })
        .catch(error => {
          // // console.error(error);
          dispatch(
            orgUserVerified({
              org: result.data,
              user: null,
            })
          );
        });
    })
    .catch(error => {
      // console.error(error);
      dispatch(
        orgUserVerified({
          org: null,
          user: null,
        })
      );
    });

export const loginUser = data => dispatch => {
  const url = `${userServiceHost}/member/signIn`;
  axios
    .post(url, JSON.stringify(data), {
      headers: {
        'graphiti-tid': uuidV4(),
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })
    .then(result => {
      // console.info(result);
      dispatch(userLoggedIn({ loggedInUser: result.data }));
    })
    .catch(error => {
      // console.error(error.response);
      dispatch(userLoggedIn({ loggedInUser: null }));
    });
};

export const loginUserGoogleAuth = data => dispatch => {
  const url = `${userServiceHost}/member/signInThirdPartyAuth`;
  axios
    .post(url, JSON.stringify(data), {
      headers: {
        'graphiti-tid': uuidV4(),
        'Content-Type': 'application/json',
      },
    })
    .then(result => {
      // console.info(result);
      dispatch(userLoggedIn({ loggedInUser: result.data }));
    })
    .catch(error => {
      // console.error(error.response);
      dispatch(userLoggedIn({ loggedInUser: null }));
    });
};

export const forgotPassword = data => dispatch => {
  // // console.info(data);
  const url = `${userServiceHost}/member/resetPassword`;
  axios
    .post(url, JSON.stringify(data), {
      headers: {
        'graphiti-tid': uuidV4(),
        'Content-Type': 'application/json',
      },
    })
    .then(result => {
      // // console.info(result);
      dispatch(forgotPasswordSubmitted(result.data));
    })
    .catch(error => {
      // // console.error(error.response);
      dispatch(forgotPasswordSubmitted(null));
    });
};

export const memberSignUp = data => dispatch => {
  // // console.info(data);
  const url = `${userServiceHost}/member/signUp`;
  axios
    .post(url, JSON.stringify(data), {
      headers: {
        'graphiti-tid': uuidV4(),
        'Content-Type': 'application/json',
      },
    })
    .then(result => {
      // console.info(result);
      dispatch(userSignedUp(result.data));
    })
    .catch(error => {
      // console.error(error.response);
      dispatch(userSignedUp(null));
    });
};

export const orgSignUp = data => dispatch => {
  // console.info(data);
  const url = `${userServiceHost}/org`;
  axios
    .post(url, JSON.stringify(data), {
      headers: {
        'graphiti-tid': uuidV4(),
        'Content-Type': 'application/json',
      },
    })
    .then(result => {
      // console.info(result);
      dispatch(orgSignedUp(result.data));
    })
    .catch(error => {
      // console.error(error.response);
      dispatch(orgSignedUp(null));
    });
};

export const activateMember = data => {
  const url = `${userServiceHost}/member/activate`;
  return axios.put(url, JSON.stringify(data), {
    headers: {
      'graphiti-tid': uuidV4(),
      'Content-Type': 'application/json',
    },
  });
};

export const resendVerificationLink = data => {
  const url = `${userServiceHost}/member/resendVerificationLink`;
  return axios.post(url, JSON.stringify(data), {
    headers: {
      'graphiti-tid': uuidV4(),
      'Content-Type': 'application/json',
    },
  });
};

export const updatePassword = data => {
  const url = `${userServiceHost}/member/updatePassword`;
  return axios.put(url, JSON.stringify(data), {
    headers: {
      'graphiti-tid': uuidV4(),
      'Content-Type': 'application/json',
    },
  });
};

// required details are picked up from cookies
export const getLoggedInUserDetails = () => dispatch => {
  const url = `${userServiceHost}/member`;
  axios
    .get(url, {
      headers: {
        'graphiti-tid': Math.random(),
      },
    })
    .then(result => {
      dispatch(loggedInUser({ loggedInUser: result.data }));
    })
    .catch(error => {
      // console.error(error);
      dispatch(loggedInUser({ loggedInUser: null }));
    });
};
