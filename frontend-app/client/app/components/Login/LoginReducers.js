import {
  ORG_USER_VERIFIED,
  ERROR_OCCURRED,
  USER_LOGGED_IN,
  FORGOT_PASSWORD_SUBMITTED,
  USER_SIGNED_UP,
  ORG_SIGNED_UP,
  LOGGED_IN_USER,
} from './LoginActions';

export function orgUserVerification(
  state = {},
  action
) {
  let error;
  switch (action.type) {
    case ERROR_OCCURRED:
      error = action.error.response.data;
      // Organization exists:
      //  User not exists => Ask for credentials
      //  User exists => Ask for password
      return { ...state, ...{ error: action.error.response.data } };
    case ORG_USER_VERIFIED:
      // Check if user exists
      return { ...state, ...action.data };
    case USER_LOGGED_IN:
      return { ...state, ...action.data };
    case LOGGED_IN_USER:
      return { ...state, ...action.data };
    case USER_SIGNED_UP:
      return { ...state, ...{ userSignedUp: action.data } };
    case ORG_SIGNED_UP:
      return { ...state, ...{ orgSignedUp: action.data } };
    case FORGOT_PASSWORD_SUBMITTED:
      return { ...state, ...{ forgotPasswordSubmitted: action.data } };
    default:
      return state;
  }
}
