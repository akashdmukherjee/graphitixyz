// TODO: discuss this with Geetish
window.onload = function () {
  // even though gapi is available in the scope
  // after loading all the resources
  // still it's not signing out
  // so defer this call for 1sec
  // TODO: find a better approach
  // setTimeout(function () {
  //   const auth2 = gapi.auth2.getAuthInstance();
  //   // console.info(auth2);
  //   auth2.signOut();
  // }, 800);
};

window.startGoogleAuthApp = function () {
  window.gapi.load('auth2', function () {
    // Retrieve the singleton for the GoogleAuth library and set up the client.
    window.auth2 = gapi.auth2.init({
      client_id: '156015404188-7rd2v2qqf40k0vp9g811i33qdqte1bet.apps.googleusercontent.com',
      cookiepolicy: 'single_host_origin',
    });
    attachSignin(document.getElementById('gSignInBtn'));
  });
};

const onSignInSuccess = function (googleUser) {
  const profile = googleUser.getBasicProfile();
  const name = profile.getName();
  const emailAddress = profile.getEmail();
  const idTokenString = googleUser.getAuthResponse().id_token;

  postMessage(
    {
      type: 'LOG_IN_GOOGLE_AUTH',
      data: {
        name,
        emailAddress,
        idTokenString,
      },
    },
    '*'
  );
};

window.attachSignin = function (element) {
  auth2.attachClickHandler(element, {}, onSignInSuccess, function (error) {
    console.error(error);
  });
};
