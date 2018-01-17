import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import validator from 'validator';
import { connect as reduxConnect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { browserHistory } from 'react-router';
// all custom exports
import {
  verifyOrgAndUser,
  loginUser,
  forgotPassword,
  memberSignUp,
  orgSignUp,
  loginUserGoogleAuth,
} from './Api';
import styles from './login.styl';
import GettingStarted from './GettingStarted';
import AboutYourOrg from './AboutYourOrg';
import AboutYou from './AboutYou';
import Logo from './Logo';
import LoginPage from './LoginPage';
import ForgotPassword from './ForgotPassword';

import './googleSignIn';

// start Google Auth app only when all resources are loaded
window.onload = function () {
  window.startGoogleAuthApp();
};

class Login extends Component {
  static propTypes() {
    return {
      verifyOrgAndUser: React.PropTypes.func,
      orgName: React.PropTypes.string,
      loginUser: React.PropTypes.func.isRequired,
      forgotPassword: React.PropTypes.func.isRequired,
      userSignUp: React.PropTypes.func.isRequired,
      orgSignUp: React.PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      fullName: '',
      password: '',
      loginPassword: '',
      confirmPassword: '',
      phone: '',
      isValidEmail: null,
      accountType: 'work',
      apiCallStarted: false,
      pages: {
        1: true,
        2: false,
        3: false,
      },
      showLogin: false,
      showOrgRegistration: false,
      orgSize: 0,
      serviceValue: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.onForgotPassword = this.onForgotPassword.bind(this);
    this.onForgotPasswordSubmit = this.onForgotPasswordSubmit.bind(this);
    this.onLoginSubmit = this.onLoginSubmit.bind(this);
    this.onMemberSignUp = this.onMemberSignUp.bind(this);
    this.onOrgSignUp = this.onOrgSignUp.bind(this);
  }

  componentDidMount() {
    window.addEventListener('message', this.handleMessage);
  }

  componentWillReceiveProps(nextProps) {
    // console.info('CWRP', props, this.props);
    const { loggedInUser, org, user, orgSignedUp, userSignedUp } = nextProps;
    if (loggedInUser !== this.props.loggedInUser) {
      if (loggedInUser) {
        const { location } = this.props;
        const redirectPath = location.query.redirect || '/discovery';
        browserHistory.push(redirectPath);
      } else {
        this.setState({ loggedInUser });
      }
    }
    if (orgSignedUp !== this.props.orgSignedUp) {
      this.setState({ orgSignedUp });
    }
    if (userSignedUp !== this.state.userSignedUp) {
      this.setState({ userSignedUp });
    }
    if (org !== this.state.org) {
      this.setState({ org });
    }
    if (user !== this.state.user) {
      this.setState({ user });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage);
  }

  handleMessage = e => {
    const { type, data } = e.data;
    if (type === 'LOG_IN_GOOGLE_AUTH') {
      this.props.loginUserGoogleAuth(data);
    }
  };

  // handleChange will dynamically handle all input fields in login Component
  handleChange(event) {
    // // console.info('Event', [event.target.name], event.target.value);
    this.setState({ [event.target.name]: event.target.value });
  }

  handleFocus(event) {
    const type = event.target.name;
    const value = event.target.value;
    // // console.info(type, value);
    this.clearActiveValidators(type, value);
  }

  handleBlur(event) {
    const type = event.target.name;
    const value = event.target.value;
    // // console.info(type, value);
    this.isValid(type, value);
  }

  handleNext(event) {
    const page = parseInt(event.target.name, 10);
    if (page === 3) return;
    if (page === 1) {
      this.verifyOrgAndUser();
    }
  }

  verifyOrgAndUser() {
    const email = this.state.email;
    const isValidEmail = this.state.isValidEmail;
    if (email && isValidEmail) {
      this.props.verifyOrgAndUser(email);
      const orgDetails = this.orgDetails(this.state.email);
      this.setState({
        isValidEmail: null,
        apiCallStarted: true,
        continueWithWorkEmail: false,
        ...orgDetails,
      });
    }
  }

  handleSelectChange(name, value) {
    const option = {};
    option[name] = value;
    this.setState(option);
  }

  clearActiveValidators(type, value) {
    if (validator.isEmpty(value)) return;
    if (type === 'email' && !this.state.isValidEmail) {
      this.setState({ isValidEmail: null });
    }
  }

  // isValid performs all form validation
  isValid(type, value) {
    // // console.info(type, value);
    if (validator.isEmpty(value)) return;
    if (type === 'email') {
      this.setState({
        isValidEmail: validator.isEmail(value) || validator.isEmpty(value),
      });
    }
  }

  onForgotPassword() {
    // // console.info('ForgotPassword');
    this.setState({ isForgotPassword: true });
  }

  onForgotPasswordSubmit() {
    this.props.forgotPassword({
      emailAddress: this.state.email,
    });
  }

  onLoginSubmit() {
    this.props.loginUser({
      emailAddress: this.state.email,
      password: this.state.loginPassword,
    });
  }

  onMemberSignUp() {
    const { email: emailAddress, fullName, password, org, orgSignedUp } = this.state;
    const orgDetails = org || orgSignedUp;
    const organizationId = orgDetails.orgId;
    this.props.memberSignUp({
      emailAddress,
      fullName,
      password,
      organizationId,
    });
  }

  onOrgSignUp() {
    // // console.info(this.state);
    const serviceValue = this.state.serviceValue.map(service => service.value);
    this.props.orgSignUp({
      name: this.state.orgName,
      dnsDomain: `@${this.state.dnsDomain}`,
      interestedFeatures: serviceValue,
    });
  }

  orgDetails(email) {
    let domain;
    let subdomain;
    let orgName = this.state.orgName;
    let dnsDomain = this.state.dnsDomain;
    if (!orgName || !dnsDomain) {
      subdomain = email.match(/@(.*)/i);
      // // console.info(subdomain);
      domain = subdomain[1].replace(subdomain[1].split('.')[1], '');
      if (subdomain) {
        orgName = subdomain[1];
        dnsDomain = `${domain}graphiti.xyz`;
      }
    }
    return { orgName, dnsDomain };
  }

  handleGoogleAuthSignIn = e => {
    googleAuthSignInClicked = true;
    e.preventDefault();
    e.stopPropagation();
  };

  handleContinueWithWorkEmailClick = () => {
    this.setState({ continueWithWorkEmail: true });
  };

  render() {
    let Page;
    let BigImageStyleName = 'image-container';
    const {
      org,
      orgSignedUp,
      user,
      loggedInUser,
      apiCallStarted,
      isForgotPassword,
      continueWithWorkEmail,
    } = this.state;

    Page = (
      <GettingStarted
        email={this.state.email}
        handleChange={this.handleChange}
        isValidEmail={this.state.isValidEmail}
        accountType={this.state.accountType}
        continueWithWorkEmail={continueWithWorkEmail}
        handleBlur={this.handleBlur}
        handleFocus={this.handleFocus}
        handleNext={this.handleNext}
        error={this.state.error}
        onGoogleAuthSignIn={this.handleGoogleAuthSignIn}
        onContinueWithWorkEmailClick={this.handleContinueWithWorkEmailClick}
      />
    );
    BigImageStyleName = 'image-bg-1';

    if (org && user) {
      Page = (
        <LoginPage
          email={this.state.email}
          password={this.state.loginPassword}
          loggedInUser={loggedInUser}
          handleChange={this.handleChange}
          onLoginSubmit={this.onLoginSubmit}
          onForgotPassword={this.onForgotPassword}
        />
      );
      BigImageStyleName = 'image-bg-2';
    }

    if (!user && !org && apiCallStarted) {
      Page = (
        <AboutYourOrg
          email={this.state.email}
          orgSize={this.state.orgSize}
          serviceValue={this.state.serviceValue}
          handleChange={this.handleChange}
          isValidEmail={this.state.isValidEmail}
          accountType={this.state.accountType}
          handleBlur={this.handleBlur}
          handleFocus={this.handleFocus}
          onOrgSignUp={this.onOrgSignUp}
          handleSelectChange={this.handleSelectChange}
          dnsDomain={this.state.dnsDomain}
          orgName={this.state.orgName}
          error={this.state.error}
        />
      );
      BigImageStyleName = 'image-bg-2';
    }
    if ((org || orgSignedUp) && !user) {
      Page = (
        <AboutYou
          email={this.state.email}
          fullName={this.state.fullName}
          password={this.state.password}
          phone={this.state.phone}
          handleChange={this.handleChange}
          isValidEmail={this.state.isValidEmail}
          accountType={this.state.accountType}
          userSignedUp={this.state.userSignedUp}
          handleBlur={this.handleBlur}
          handleFocus={this.handleFocus}
          onMemberSignUp={this.onMemberSignUp}
        />
      );
      BigImageStyleName = 'image-bg-3';
    }
    if (isForgotPassword) {
      Page = (
        <ForgotPassword
          email={this.state.email}
          onForgotPasswordSubmit={this.onForgotPasswordSubmit}
        />
      );
    }

    return (
      <div styleName="main-container">
        <Logo />
        <div styleName="login-container">
          {Page}
        </div>
        {isForgotPassword ? null : <div styleName={BigImageStyleName} />}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  ...state.orgUserVerification,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      verifyOrgAndUser,
      loginUser,
      forgotPassword,
      memberSignUp,
      orgSignUp,
      loginUserGoogleAuth,
    },
    dispatch
  );

export default reduxConnect(mapStateToProps, mapDispatchToProps)(cssModules(Login, styles));
