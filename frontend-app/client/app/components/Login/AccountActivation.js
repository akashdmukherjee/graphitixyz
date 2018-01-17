import React from 'react';
import cssModules from 'react-css-modules';
import { browserHistory } from 'react-router';
import styles from './accountActivation.styl';
import { activateMember, resendVerificationLink, updatePassword } from './Api';
import Logo from './Logo';

const actionTypes = {
  RESET: 'reset',
  ACTIVATE: 'activate',
};

class AccountActivation extends React.Component {
  constructor(props) {
    super(props);
    const { path } = props.route;
    this.state = {
      successful: null,
      passwordsMatched: true,
    };
    this.actionType =
      path.indexOf(actionTypes.RESET) !== -1 ? actionTypes.RESET : actionTypes.ACTIVATE;
    this.passwordInputs = {};
    this.memberId = props.routeParams.id;
  }

  componentDidMount() {
    const key = this.props.location.query.key;
    if (this.actionType === actionTypes.ACTIVATE) {
      activateMember({
        memberId: this.memberId,
        key,
      })
        .then(() => this.setState({ successful: true }))
        .catch(() => this.setState({ successful: false }));
    }
  }

  onResendVerificationLink = () => {
    resendVerificationLink({
      id: this.props.routeParams.id,
    });
  };

  handleInputChange = ({ target }) => {
    const { name, value } = target;
    this.passwordInputs[name] = value;
  };

  handleSubmit = () => {
    const { newPassword, confirmPassword } = this.passwordInputs;
    if (newPassword !== confirmPassword) {
      this.setState({ passwordsMatched: false });
      return;
    }
    updatePassword({
      newPassword: this.passwordInputs.newPassword,
      memberId: this.memberId,
    }).then(() => {
      browserHistory.replace('/login');
    });
  };

  render() {
    const { passwordsMatched, done } = this.state;
    let Page = '';

    if (this.actionType === actionTypes.ACTIVATE) {
      if (this.state.successful === null) {
        Page = <span styleName="status">Verifying account...</span>;
      } else {
        Page = this.state.successful
          ? <span styleName="status">
              Account verification successful.{' '}
              <a href="/login" styleName="status-link">
                Log In
              </a>
            </span>
          : <span styleName="status">
              Your link has expired.
              <a onClick={this.onResendVerificationLink} styleName="status-link">
                {' '}Resend verification link{' '}
              </a>
            </span>;
      }
    }

    return (
      <div>
        <Logo />
        <div>
          <div styleName="top-headings">
            {this.actionType === actionTypes.ACTIVATE
              ? <h3 styleName="text-intro" style={{ paddingTop: 200 }}>
                  Account <span style={{ fontWeight: 100 }}> verification</span>
                  <br />
                  <span style={{ fontWeight: 100, fontSize: 18 }}>{Page}</span>
                </h3>
              : <h3 styleName="text-intro" style={{ paddingTop: 100, paddingBottom: 50 }}>
                  Set <span style={{ fontWeight: 100 }}> New Password</span>
                  <br />
                </h3>}
          </div>
          {this.actionType === actionTypes.RESET
            ? <div styleName="email-form">
                <div styleName="inp-field">
                  <h2 styleName="input-label">New Password:</h2>
                  <input
                    type="password"
                    autoComplete="off"
                    styleName="inp-field-gpt"
                    name="newPassword"
                    onChange={this.handleInputChange}
                  />
                </div>
                <div styleName="inp-field">
                  <h2 styleName="input-label">Confirm Password:</h2>
                  <input
                    type="password"
                    autoComplete="off"
                    styleName="inp-field-gpt"
                    name="confirmPassword"
                    onChange={this.handleInputChange}
                  />
                </div>
                {passwordsMatched
                  ? null
                  : <h5 style={{ fontWeight: 400, marginTop: 15, color: 'crimson' }}>
                      Passwords are different
                    </h5>}
                <div styleName="button-wrapper" style={{ marginTop: 30 }}>
                  <button styleName="btn-gpt" onClick={this.handleSubmit}>
                    SUBMIT
                  </button>
                </div>
              </div>
            : null}
        </div>
        {this.actionType === actionTypes.RESET
          ? <div style={{ marginTop: 20 }}>
              <h5 style={{ textAlign: 'center', fontWeight: 400, color: '#736f6f' }}>
                Already have an account?
                <a style={{ textDecoration: 'none', color: '#0fa2e2' }} href="/login">
                  {' '}Log In Here
                </a>
              </h5>
            </div>
          : null}
      </div>
    );
  }
}

export default cssModules(AccountActivation, styles);
