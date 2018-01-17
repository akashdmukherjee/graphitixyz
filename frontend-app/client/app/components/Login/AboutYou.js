import React from 'react';
import cssModules from 'react-css-modules';

import styles from './aboutYou.styl';

const AboutYou = props => {
  const {
    email,
    fullName,
    phone,
    password,
    handleChange,
    isValidEmail,
    userSignedUp,
    handleBlur,
    handleFocus,
    onMemberSignUp,
  } = props;
  let Icon;
  let ValidationMessage;

  if (isValidEmail !== null) {
    Icon = isValidEmail
      ? <i className="fa fa-check" styleName="input-icon-correct" />
      : <i className="fa fa-times" styleName="input-icon-error" />;
    ValidationMessage = isValidEmail
      ? null
      : <small styleName="error">
          {email} is not a valid email.<br />
        </small>;
  }
  if (userSignedUp) {
    return <h5>An activation link has been sent to your email. Please verify and login.</h5>;
  }

  return (
    <div>
      <div styleName="top-headings">
        <h2 styleName="text-intro">
          <span style={{ fontWeight: 'normal' }}>About </span>
          You
        </h2>
        <h3 styleName="text-sub-intro">Help us serve you better</h3>
      </div>
      <div styleName="email-form">
        <div styleName="inp-field">
          <h2 styleName="input-label">Full Name:</h2>
          <input
            type="text"
            autoComplete="off"
            styleName="inp-field-gpt"
            placeholder=""
            name="fullName"
            value={fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        </div>
        <div styleName="inp-field">
          <h2 styleName="input-label">Phone:</h2>
          <input
            type="tel"
            autoComplete="off"
            styleName="inp-field-gpt"
            name="phone"
            value={phone}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        </div>
        <div styleName="inp-field">
          <h2 styleName="input-label">Password:</h2>
          <input
            type="password"
            autoComplete="off"
            styleName="inp-field-gpt"
            name="password"
            value={password}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
          {Icon}
          <div styleName="subtext">
            {ValidationMessage}
            <small>Passwords must be at least 6 characters long.</small>
          </div>
        </div>
        <div styleName="inp-field" style={{ marginTop: 25 }}>
          <input type="checkbox" name="subscribe" id="subscribe" />
          <label htmlFor="subscribe" styleName="input-label-dark">
            Subscribe to Graphiti newsletters.
          </label>
        </div>
        <div styleName="button-wrapper">
          <button name="3" styleName="btn-gpt" onClick={onMemberSignUp}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
};

AboutYou.propTypes = {
  email: React.PropTypes.string.isRequired,
  fullName: React.PropTypes.string.isRequired,
  phone: React.PropTypes.string.isRequired,
  password: React.PropTypes.string.isRequired,
  userSignedUp: React.PropTypes.object.isRequired,
  handleChange: React.PropTypes.func.isRequired,
  handleBlur: React.PropTypes.func.isRequired,
  onMemberSignUp: React.PropTypes.func.isRequired,
  handleFocus: React.PropTypes.func.isRequired,
  isValidEmail: React.PropTypes.bool,
  accountType: React.PropTypes.string.isRequired,
};

export default cssModules(AboutYou, styles);
