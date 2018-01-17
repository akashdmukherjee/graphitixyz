import React from 'react';
import cssModules from 'react-css-modules';
import styles from './gettingStarted.styl';

const LoginPage = props => {
  const { email, password, handleChange, loggedInUser, onLoginSubmit, onForgotPassword } = props;
  return (
    <div>
      <div styleName="top-headings">
        <h2 styleName="text-intro" style={{ marginBottom: 40 }}>
          Welcome <span style={{ fontWeight: 100 }}> Back</span>
        </h2>
      </div>
      <div styleName="email-form">
        {loggedInUser === null
          ? <h5 style={{ color: 'crimson' }}>Invalid email or password</h5>
          : null}
        <div styleName="inp-field">
          <h2 styleName="input-label">Email:</h2>
          <input
            type="text"
            autoComplete="off"
            styleName="inp-field-gpt-disabled"
            name="email"
            value={email}
            disabled
          />
        </div>
        <div styleName="inp-field">
          <h2 styleName="input-label">Password:</h2>
          <input
            type="password"
            autoComplete="off"
            styleName="inp-field-gpt"
            name="loginPassword"
            value={password}
            onChange={handleChange}
          />
        </div>
        <div styleName="button-wrapper" style={{ marginTop: 30 }}>
          <button name="1" styleName="btn-gpt" onClick={onLoginSubmit}>
            LOG IN
          </button>
        </div>
        <div styleName="inp-field">
          <h2
            styleName="input-label"
            style={{ textAlign: 'center', marginTop: 40, cursor: 'pointer' }}
            onClick={onForgotPassword}
          >
            Forgot password?
          </h2>
        </div>
      </div>
    </div>
  );
};

LoginPage.propTypes = {
  email: React.PropTypes.string.isRequired,
  onForgotPassword: React.PropTypes.func.isRequired,
  onLoginSubmit: React.PropTypes.func.isRequired,
};

export default cssModules(LoginPage, styles);
