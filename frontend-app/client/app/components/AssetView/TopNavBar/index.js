import React from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { openAssetPermissionsModal } from './Actions';
import Button from '../Button';
import styles from './index.styl';
import UserPermissions from './UserPermissions';
import WorkingCopies from './WorkingCopies';

class TopNavBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openWorkingCopies: false,
    };
  }

  componentDidMount() {
    // register DOM event listener
    window.addEventListener('click', this.onDOMclick);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMclick);
  }

  onDOMclick = event => {
    if (this.shareDialog !== event.target && !this.shareDialog.contains(event.target)) {
      this.setState({ shareAsset: false });
    }
  };

  onShareAssetClick = () => {
    this.focusAndSelectShareUrlInput();
    this.setState({ shareAsset: !this.state.shareAsset });
  };

  focusAndSelectShareUrlInput = copy => {
    setTimeout(() => {
      this.inputShareUrl.focus();
      this.inputShareUrl.select();
      copy && document.execCommand('copy');
    }, 0);
  };

  onCopyClick = () => {
    this.focusAndSelectShareUrlInput(true);
    this.setState({ shareUrlCopied: true });
  };

  onPlusIconClick = () => {
    this.props.openAssetPermissionsModal();
  };

  renderToggleMenu = () => {
    const { isSideBarOpened } = this.props;
    const styleName = isSideBarOpened ? 'toggle-menu-open' : 'toggle-menu-close';
    return (
      <div styleName={styleName}>
        <span />
        <span />
        <span />
      </div>
    );
  };

  render() {
    const { onMenuClick, isSideBarOpened, assetDetails } = this.props;
    const { openWorkingCopies } = this.state;
    return (
      <div styleName="tnb-main-wrapper">
        <div styleName="left-wrapper">
          <div styleName="company-logo" />
          <div styleName="search-input">
            <input type="text" placeholder="Discover organizational data assets" />
            <i className="fa fa-search" />
          </div>
        </div>
        <div styleName="middle-wrapper">
          {/* <div styleName="permissions-preview">
            <UserPermissions
              label="Contributors"
              users={assetDetails.authors}
              onPlusIconClick={this.onPlusIconClick}
            />
            <UserPermissions
              label="Viewers"
              users={assetDetails.viewers}
              onPlusIconClick={this.onPlusIconClick}
            />
          </div>*/}
        </div>
        <div styleName="right-wrapper">
          {/* <div styleName="working-copies-wrapper">
            <Button
              text="Production"
              styleClassName="btn-versions"
              onClick={() =>
                this.setState({
                  openWorkingCopies: !openWorkingCopies,
                })}
              isIconLeftAligned={false}
            >
              <i className="icon-arrow-down" />
            </Button>
            {openWorkingCopies ? <WorkingCopies /> : null}
          </div>*/}
          <div
            styleName="share-wrapper"
            ref={_ref => {
              this.shareDialog = _ref;
            }}
          >
            <Button text="Share" styleClassName="btn-share" onClick={this.onShareAssetClick}>
              <i className="fa fa-share" />
            </Button>
            <div styleName={this.state.shareAsset ? 'share-dialog' : 'share-dialog-hide'}>
              <div styleName="invite">
                <h5>
                  <i className="icon-plus" /> Invite team members
                </h5>
              </div>
              <div styleName="inputs-wrapper">
                <input
                  ref={ref => {
                    this.inputShareUrl = ref;
                  }}
                  type="text"
                  value={window.location.href}
                  readOnly // change this later
                />
                <Button
                  styleClassName="btn-copy"
                  text="Copy To Clipboard"
                  data-tip
                  data-for="copy"
                  onClick={this.onCopyClick}
                />
              </div>
              <div>
                <h5>
                  <i className="fa fa-lock" /> Private only visible to members
                </h5>
              </div>
            </div>
          </div>
          <a styleName="menu-btn" onClick={onMenuClick}>
            {this.renderToggleMenu()}
          </a>
        </div>
      </div>
    );
  }
}

TopNavBar.propTypes = {
  onMenuClick: React.PropTypes.func.isRequired,
  isSideBarOpened: React.PropTypes.bool.isRequired,
  assetDetails: React.PropTypes.object.isRequired,
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openAssetPermissionsModal,
    },
    dispatch
  );

export default connect(null, mapDispatchToProps)(cssModules(TopNavBar, styles));
