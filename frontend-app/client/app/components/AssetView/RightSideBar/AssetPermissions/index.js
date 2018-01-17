import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import { connect as reduxConnect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getUsersByNameSearch, checkAssetAdminAccess, updateAssetPermissions } from '../../Api';
import { closeAssetPermissionsModal } from './Actions';
import styles from './index.styl';
import SearchableInput from '../SearchableInput';
import Tag from '../../../common/Tag';

const propTypes = {
  loggedInUser: PropTypes.object,
  assetDetails: PropTypes.object,
};
const defaultProps = {
  loggedInUser: {},
  assetDetails: {},
};

class AssetPermissions extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const { assetDetails, loggedInUser } = props;
    this.state = {
      admins: '',
      authors: '',
      viewers: '',
      selectedUsers: {
        admins: assetDetails.admins,
        authors: assetDetails.authors,
        viewers: assetDetails.viewers,
      },
      dataSource: [],
      activePermisionFocus: {},
      open: false,
      fieldsChanged: false,
      assetDetails,
      loggedInUser,
    };
    this.data = {
      memberId: loggedInUser.id,
      orgId: loggedInUser.organizationId,
      assetId: assetDetails.id,
    };
  }

  componentDidMount() {
    if (this.data.memberId) {
      this.props.checkAssetAdminAccess(this.data);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { searchUserByNameResult, open, assetDetails, loggedInUser } = nextProps;
    const object = {};

    if (searchUserByNameResult !== this.props.searchUserByNameResult) {
      object.dataSource = searchUserByNameResult;
    }
    if (open !== this.props.open) {
      object.open = open;
    }
    if (assetDetails !== this.props.assetDetails) {
      object.assetDetails = assetDetails;
      this.data.assetId = assetDetails.id;
    }
    if (loggedInUser !== this.props.loggedInUser) {
      object.loggedInUser = loggedInUser;
      this.data.memberId = loggedInUser.id;
      this.data.orgId = loggedInUser.organizationId;
      this.props.checkAssetAdminAccess(this.data);
    }
    this.setState(object, () => {
      // console.info(this.state);
    });
  }

  closeModal = () => {
    this.setState({ open: false });
    this.props.onClose();
  };

  handleFieldChange = () => {
    this.setState({ fieldsChanged: true });
  };

  onChangeText = event => {
    const { getUsersByNameSearch, searchUserByNameResult, assetDetails } = this.props;
    const targetName = event.target.name;
    const targetValue = event.target.value;
    const data = {
      query: targetValue,
      ...this.data,
    };
    // console.info(targetName, targetValue);
    targetValue.length && getUsersByNameSearch(data);
    this.setState({ [targetName]: targetValue }, () => {
      // console.info(this.state);
    });
  };

  onUserSelect = (permissionName, user) => {
    const object = {
      admins: '',
      authors: '',
      viewers: '',
    };
    const { selectedUsers } = this.state;
    const index = selectedUsers[permissionName].findIndex(
      selectedUser => user.id === selectedUser.id
    );
    const newSelectedUsers = selectedUsers[permissionName];
    if (index === -1) {
      newSelectedUsers.push(user);
    }
    object.selectedUsers = {
      ...selectedUsers,
      [permissionName]: newSelectedUsers,
    };
    this.setState(object, () => {
      // console.info(this.state);
    });
    this.handleFieldChange();
  };

  onPermissionTagsClick = permissionName => {
    const activePermisionFocus = {};
    activePermisionFocus[permissionName] = true;
    this.setState({ activePermisionFocus });
  };

  onSaveChanges = () => {
    const { assetDetails, selectedUsers } = this.state;
    const data = {
      ...this.data,
      assetName: assetDetails.name,
      memberName: 'Dev',
      admins: selectedUsers.admins,
      viewers: selectedUsers.viewers,
      authors: selectedUsers.authors,
      assetType: assetDetails.assetType,
    };
    this.props.updateAssetPermissions(data);
  };

  removeMember = data => {
    // console.info(data);
    const { selectedUsers } = this.state;
    const object = {
      ...selectedUsers,
      [data.permissionName]: selectedUsers[data.permissionName].filter(user => user.id !== data.id),
    };
    this.setState({ selectedUsers: object });
    this.handleFieldChange();
  };

  renderSelectedUsers = permissionName => {
    // console.info(permissionName);
    const { selectedUsers } = this.state;
    // console.info(selectedUsers);
    if (selectedUsers[permissionName].length) {
      return selectedUsers[permissionName].map(user =>
        <Tag
          label={user.name}
          key={user.id}
          data={{ ...user, permissionName }}
          onTagCloseClick={this.removeMember}
        />
      );
    }
    return null;
  };

  render() {
    const { activePermisionFocus, dataSource, selectedUsers } = this.state;

    return (
      <div styleName={this.state.open ? 'permissions-wrapper-show' : 'permissions-wrapper-hide'}>
        <div styleName="header">
          <h5 styleName="asset-name">
            <i className="fa fa-code" /> Asset Name
          </h5>
          <div styleName="close" onClick={this.closeModal}>
            <i className="fa fa-times" />
            <span>esc</span>
          </div>
        </div>
        <div styleName="container">
          <div styleName="content">
            <div styleName="content-header">
              <h5>Member Permissions</h5>
              <button
                styleName={this.state.fieldsChanged ? 'save-btn-active' : 'save-btn-disabled'}
                onClick={this.onSaveChanges}
              >
                Save Changes
              </button>
            </div>
            <div styleName="asset-permissions-wrapper">
              <div styleName="permission-wrapper">
                <div styleName="header-admins">
                  <h5>Admins</h5>
                </div>
                <div
                  styleName="permission-tags"
                  onClick={() => this.onPermissionTagsClick('admins')}
                >
                  {selectedUsers.admins && this.renderSelectedUsers('admins')}
                  <SearchableInput
                    text={this.state.admins}
                    dataSource={dataSource}
                    name="admins"
                    focused={activePermisionFocus.admins}
                    onChangeText={this.onChangeText}
                    onUserSelect={this.onUserSelect}
                  />
                </div>
              </div>
              <div styleName="permission-wrapper">
                <div styleName="header-authors">
                  <h5>Authors</h5>
                </div>
                <div
                  styleName="permission-tags"
                  onClick={() => this.onPermissionTagsClick('authors')}
                >
                  {selectedUsers.authors && this.renderSelectedUsers('authors')}
                  <SearchableInput
                    text={this.state.authors}
                    dataSource={dataSource}
                    name="authors"
                    focused={activePermisionFocus.authors}
                    onChangeText={this.onChangeText}
                    onUserSelect={this.onUserSelect}
                  />
                </div>
              </div>
              <div styleName="permission-wrapper">
                <div styleName="header-followers">
                  <h5>Viewers</h5>
                </div>
                <div
                  styleName="permission-tags"
                  onClick={() => this.onPermissionTagsClick('viewers')}
                >
                  {selectedUsers.viewers && this.renderSelectedUsers('viewers')}
                  <SearchableInput
                    text={this.state.viewers}
                    dataSource={dataSource}
                    name="viewers"
                    focused={activePermisionFocus.viewers}
                    onChangeText={this.onChangeText}
                    onUserSelect={this.onUserSelect}
                  />
                </div>
              </div>
            </div>
            <div styleName="check-permissions">
              <input type="text" placeholder="Enter here" />
              <button>Check Permissions</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  // console.info(state);
  return {
    loggedInUser: state.orgUserVerification.loggedInUser,
    searchUserByNameResult: state.dataAssetView.searchUserByNameResult,
    assetDetails: state.dataAssetView.assetDetails,
    hasAdminAccess: state.dataAssetView.hasAdminAccess,
    assetId: state.dataAssetView.assetId,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getUsersByNameSearch,
      checkAssetAdminAccess,
      updateAssetPermissions,
      closeAssetPermissionsModal,
    },
    dispatch
  );

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  cssModules(AssetPermissions, styles)
);
