export const ORG_VERIFIED = 'ORG_VERIFIED';
export const USER_VERIFIED = 'USER_VERIFIED';
export const ORG_USER_VERIFIED = 'ORG_USER_VERIFIED';
export const ERROR_OCCURRED = 'ERROR_OCCURRED';
export const USER_LOGGED_IN = 'USER_LOGGED_IN';
export const USER_SIGNED_UP = 'USER_SIGNED_UP';
export const ORG_SIGNED_UP = 'ORG_SIGNED_UP';
export const FORGOT_PASSWORD_SUBMITTED = 'FORGOT_PASSWORD_SUBMITTED';
export const LOGGED_IN_USER = 'LOGGED_IN_USER';
export const LOGGED_IN_USER_THIRD_PARTY = 'LOGGED_IN_USER_THIRD_PARTY';

export function orgVerified(data) {
  return {
    type: ORG_VERIFIED,
    data,
  };
}

export function orgUserVerified(data) {
  return {
    type: ORG_USER_VERIFIED,
    data,
  };
}

export function errorOccurred(error) {
  return {
    type: ERROR_OCCURRED,
    error,
  };
}

export function userSignedUp(data) {
  return {
    type: USER_SIGNED_UP,
    data,
  };
}

export function userLoggedIn(data) {
  return {
    type: USER_LOGGED_IN,
    data,
  };
}

export function forgotPasswordSubmitted(data) {
  return {
    type: FORGOT_PASSWORD_SUBMITTED,
    data,
  };
}

export function orgSignedUp(data) {
  return {
    type: ORG_SIGNED_UP,
    data,
  };
}

export function loggedInUser(data) {
  return {
    type: LOGGED_IN_USER,
    data,
  };
}
