import React from 'react';
import cssModules from 'react-css-modules';
import styles from './forgotPassword.styl';

class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonClicked: false,
    };
  }

  onSubmit(cb) {
    this.setState({ buttonClicked: true });
    if (cb) cb();
  }

  render() {
    const { email, onForgotPasswordSubmit } = this.props;

    let Page;

    if (!this.state.buttonClicked) {
      Page = (
        <div>
          <div>
            <div styleName="top-headings">
              <h2 styleName="text-intro" style={{ marginBottom: 40 }}>
                Forgot <span style={{ fontWeight: 100 }}> your password?</span>
                <br />
                <span style={{ fontWeight: 200, fontSize: 20 }}>
                  We'll email you instructions on how to reset your password
                </span>
              </h2>
            </div>
            <div styleName="email-form">
              <div styleName="inp-field">
                <h2 styleName="input-label">Email:</h2>
                <input type="text" autoComplete="off" styleName="inp-field-gpt" name="email" />
              </div>
              <div styleName="button-wrapper" style={{ marginTop: 30 }}>
                <button styleName="btn-gpt" onClick={() => this.onSubmit(onForgotPasswordSubmit)}>
                  SUBMIT
                </button>
              </div>
            </div>
          </div>
          <hr styleName="hr" />
          <div style={{ marginTop: 20 }}>
            <h5 style={{ textAlign: 'center', fontWeight: 400, color: '#736f6f' }}>
              Already have an account?
              <a style={{ textDecoration: 'none', color: '#0fa2e2' }} href="/login">
                {' '}Log In Here
              </a>
            </h5>
          </div>
        </div>
      );
    } else {
      Page = (
        <div>
          <div styleName="top-headings">
            <h2 styleName="text-intro" style={{ marginBottom: 20 }}>
              Password <span style={{ fontWeight: 100 }}> Recovery</span>
            </h2>
            <h2 style={{ marginBottom: 150 }}>
              <span style={{ fontWeight: 200, fontSize: 20, color: '#6b6b6b', marginTop: 30 }}>
                Instructions for accessing your account has been sent to
                <br />
                <span style={{ color: '#333' }}>{email}</span>
              </span>
            </h2>
          </div>
        </div>
      );
    }

    return (
      <div>
        {Page}
      </div>
    );
  }
}

ForgotPassword.propTypes = {
  email: React.PropTypes.string.isRequired,
  onForgotPasswordSubmit: React.PropTypes.func.isRequired,
};

export default cssModules(ForgotPassword, styles);
