// This is the first page when site is loaded

import React from 'react';
import cssModules from 'react-css-modules';
import styles from './gettingStarted.styl';
import './googleSignInButton.css';

const AccountTypes = {
  WORK: 'work',
  OPEN: 'open',
};

const GettingStarted = props => {
  const {
    email,
    error,
    handleChange,
    isValidEmail,
    accountType,
    handleBlur,
    handleFocus,
    handleNext,
    onGoogleAuthSignIn,
    continueWithWorkEmail,
    onContinueWithWorkEmailClick,
  } = props;

  let Icon;
  let ValidationMessage = null;

  if (isValidEmail !== null || error) {
    Icon = isValidEmail
      ? <i className="fa fa-check" styleName="input-icon-correct" />
      : <i className="fa fa-times" styleName="input-icon-error" />;
    if (!isValidEmail || error) {
      ValidationMessage = error
        ? <small styleName="error">
            {error.message}
            <br />
          </small>
        : <small styleName="error">
            {email} is not a valid email.<br />
          </small>;
    }
  }

  return (
    <div>
      <div styleName="top-headings">
        <h2 styleName="text-intro">
          Getting started
          <span style={{ fontWeight: 'normal' }}> with</span>
          <span styleName="company-name"> graphiti</span>
        </h2>
      </div>
      <div id="gSignInWrapper">
        <div id="gSignInBtn">
          <span className="buttonText">
            <i className="fa fa-google" /> Continue with Google
          </span>
        </div>
        <div>
          {continueWithWorkEmail
            ? null
            : <h5 styleName="continueWithWorkEmail">
                You can also
                <span onClick={onContinueWithWorkEmailClick}> continue with work email</span>
              </h5>}
        </div>
      </div>
      {continueWithWorkEmail ? <hr styleName="hr" /> : null}
      {continueWithWorkEmail
        ? <div styleName="email-form">
            <div styleName="inp-field">
              <h2 styleName="input-label">Work Email:</h2>
              <input
                type="text"
                autoComplete="off"
                styleName="inp-field-gpt"
                placeholder="brian@amazon.com"
                name="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
              {Icon}
              <div styleName="subtext">
                {ValidationMessage}
                <small>Enter your work email for exclusive private environment</small>
              </div>
            </div>
            <div styleName="button-wrapper">
              <button name="1" styleName="btn-gpt" onClick={handleNext}>
                NEXT
              </button>
            </div>
          </div>
        : null}
      {/* <div className="g-signin2" data-onsuccess="onSignIn" onClick={onGoogleAuthSignIn} /> */}
    </div>
  );
};

GettingStarted.propTypes = {
  email: React.PropTypes.string.isRequired,
  error: React.PropTypes.object,
  handleChange: React.PropTypes.func.isRequired,
  handleBlur: React.PropTypes.func.isRequired,
  handleFocus: React.PropTypes.func.isRequired,
  handleNext: React.PropTypes.func.isRequired,
  isValidEmail: React.PropTypes.bool,
  accountType: React.PropTypes.string.isRequired,
};

export default cssModules(GettingStarted, styles);
