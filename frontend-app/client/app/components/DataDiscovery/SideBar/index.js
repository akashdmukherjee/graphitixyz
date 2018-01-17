import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import { Link } from 'react-router';
import styles from './index.styl';
import { Menus, Menu } from '../../common/Menus';
import TeamManagement from './TeamManagement';
import ReactTooltip from 'react-tooltip';
import ProfileMenuList from './ProfileMenuList';
import './tooltip.css';
import { profileChanged, activeTags } from '../Actions';
import { searchUsersByName, createTeam, getMemberTeams, getTeamMembers, updateTeam } from '../Api';
import profileTypes from '../profileTypes';
import actionMenus from './actionMenus';

class SideBar extends Component {
  static propTypes = {
    memberTeams: PropTypes.arrayOf(PropTypes.object),
    teamMembers: PropTypes.arrayOf(PropTypes.object),
    loggedInUser: PropTypes.object,
    tags: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    children: PropTypes.any,
    open: PropTypes.bool,
    onNewAssetClick: PropTypes.func.isRequired,
    onFileSelect: PropTypes.func.isRequired,
  };

  static defaultProps = {
    loggedInUser: {},
    tags: [],
    memberTeams: [],
    teamMembers: [],
  };

  menus = [
    {
      name: actionMenus.RECENT,
      icon: 'icon-clock',
    },
    // {
    //   name: actionMenus.FREQUENT,
    //   icon: 'icon-loop',
    // },
    {
      name: actionMenus.FAVORITED,
      icon: 'icon-star',
    },
    {
      name: actionMenus.MY_ASSETS,
      icon: 'icon-user',
    },
  ];

  constructor(props) {
    super(props);
    const { loggedInUser, memberTeams, teamMembers } = props;
    this.state = {
      activeTags: [],
      fieldsChanged: false,
      selectedTeam: {},
      selectedProfile: {},
      profileMenuListDataSource: [],
      openProfileMenuList: false,
      triggerData: {
        memberName: loggedInUser.fullName,
        companyName: loggedInUser.emailAddress,
      },
      loggedInUser,
      memberTeams,
      teamMembers,
      updateTeamMembers: false,
      menus: this.menus,
    };
    this.selectedTeamForEdit = {};
  }

  componentDidMount() {
    const { loggedInUser } = this.props;
    if (loggedInUser.id) {
      this.props.getMemberTeams({
        memberId: loggedInUser.id,
        orgId: loggedInUser.organizationId,
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    // console.info(nextProps, this.props);
    const { loggedInUser, memberTeams } = nextProps;
    const object = {};
    if (loggedInUser !== this.props.loggedInUser) {
      this.props.getMemberTeams({
        memberId: loggedInUser.id,
        orgId: loggedInUser.organizationId,
      });
      object.loggedInUser = loggedInUser;
    }
    if (memberTeams !== this.props.memberTeams) {
      const defaultProfile = {
        profileType: profileTypes.PERSONAL,
        id: loggedInUser.id,
        name: 'Personal',
        editable: false,
      };
      const profileMenuListDataSource = [
        defaultProfile,
        ...memberTeams.map(team => ({
          ...team,
          profileType: profileTypes.TEAM,
        })),
      ];
      object.triggerData = {
        memberName: loggedInUser.fullName,
        companyName: loggedInUser.emailAddress,
        ...defaultProfile,
      };
      object.selectedProfile = defaultProfile;
      object.profileMenuListDataSource = profileMenuListDataSource;
      object.memberTeams = memberTeams;
    }
    this.setState(object);
  }

  onTeamClick = team => {
    this.setState({ selectedTeam: team });
  };

  onProfileMenuClick = e => {
    // we need to stop this event from bubbling up to the parent i.e window
    // 'cause ListWrapper component listens for onClick on window
    // and call onDOMClick and onClickedAway
    // refer ListWrapper in `common` directory
    e.nativeEvent.stopImmediatePropagation();
    this.setState({ openProfileMenuList: !this.state.openProfileMenuList });
  };

  handleEditItemClick = itemData => {
    // console.info(itemData);
    const { loggedInUser } = this.props;
    this.selectedTeamForEdit = { ...itemData };
    this.props.getTeamMembers({
      memberId: loggedInUser.id,
      orgId: loggedInUser.organizationId,
      teamId: itemData.id,
    });
    this.setState({
      openTeamManagementModal: !this.state.openTeamManagementModal,
      updateTeamMembers: true,
    });
  };

  handleHeaderButtonClick = itemData => {
    this.selectedTeamForEdit = { ...itemData };
    // console.info(itemData);
    this.setState({
      openTeamManagementModal: true,
    });
  };

  handleSwitchClick = itemData => {
    console.info(itemData);
    this.props.profileChanged({ ...itemData });
    this.setState({
      selectedProfile: itemData,
      triggerData: { ...this.state.triggerData, ...itemData },
    });
    this.profileMenuList.handleTriggerClick();
  };

  handleActionMenuClick = data => {
    const { onActionMenuClick } = this.props;
    onActionMenuClick && onActionMenuClick(data);
  };

  renderActionMenus = () => {
    const { menus } = this.state;
    return (
      <div styleName="action-menus">
        {menus.map((menu, index) =>
          <a tabIndex={index} onClick={() => this.handleActionMenuClick(menu)}>
            <i className={menu.icon} /> {menu.name}
          </a>
        )}
      </div>
    );
  };

  renderProfileMenu = () => {
    const {
      memberTeams,
      loggedInUser,
      selectedProfile,
      profileMenuListDataSource,
      triggerData,
    } = this.state;
    if (!loggedInUser && !memberTeams) return null;
    return (
      <ProfileMenuList
        label={loggedInUser.fullName}
        triggerData={triggerData}
        ref={_ref => {
          this.profileMenuList = _ref;
        }}
        headerName="Team"
        buttonText="Add"
        caretPosition="middle"
        style={{
          left: 10,
          top: '14%',
        }}
        showListIcon
        hasFixedList
        dataSource={profileMenuListDataSource.map(profile => ({
          ...profile,
          selected: profile.id === selectedProfile.id,
        }))}
        fixedListDataSource={[
          {
            text: 'Settings',
          },
          {
            text: 'Logout',
          },
        ]}
        transformIconName={itemData =>
          itemData.profileType === profileTypes.PERSONAL ? 'icon-user' : 'icon-grid'}
        onSwitchClick={this.handleSwitchClick}
        transformFixedListIconName={itemData => {
          if (itemData.text === 'Settings') {
            return 'icon-settings';
          }
          return 'icon-lock';
        }}
        onEditItemClick={this.handleEditItemClick}
        onHeaderButtonClick={this.handleHeaderButtonClick}
        injectFixedListItemChildren={itemData => {
          if (itemData.text === 'Settings') {
            return (
              <Menus
                wrapperStyle={{
                  position: 'absolute',
                  top: 0,
                  left: '97%',
                  width: 160,
                }}
              >
                <Menu text="Edit Profile" />
                <Menu text="Invite Teammates" seperator />
                <Menu text="Upgrade" textButton />
                <Menu text="Billing" />
              </Menus>
            );
          }
          return null;
        }}
      />
    );
  };

  renderNewAssetCreatorButtons() {
    return (
      <div styleName="new-asset-buttons">
        <div styleName="row">
          <div
            styleName="image-btn"
            data-tip
            data-class="sql-tooltip-caret"
            data-offset="{'left': 51, 'top': 51}"
            data-for="image-sql"
          >
            <Link
              to={{
                pathname: '/asset/untitled',
                state: {
                  assetType: 'SQL',
                },
              }}
            >
              <div styleName="image sql">
                <ReactTooltip id="image-sql" type="dark" effect="solid" multiline>
                  <div style={{ textAlign: 'center' }}>Create SQL Asset</div>
                </ReactTooltip>
              </div>
              <div styleName="icon-circle">+</div>
            </Link>
          </div>
          <div styleName="image-btn" data-tip data-for="image-dataset">
            <Link
              to={{
                pathname: '/asset/untitled',
                state: {
                  assetType: 'DATASET',
                },
              }}
            >
              <div styleName="image dataset">
                <ReactTooltip id="image-dataset" type="dark" effect="solid" multiline>
                  <div style={{ textAlign: 'center' }}>Create DataSet Asset</div>
                </ReactTooltip>
              </div>
              <div styleName="icon-circle">+</div>
            </Link>
          </div>
        </div>
        <div styleName="row">
          <div styleName="image-btn" data-tip data-for="image-chart">
            <Link
              to={{
                pathname: '/asset/untitled',
                state: {
                  assetType: 'CHART',
                },
              }}
            >
              <div styleName="image chart">
                <ReactTooltip id="image-chart" type="dark" effect="solid" multiline>
                  <div style={{ textAlign: 'center' }}>Create Chart Asset</div>
                </ReactTooltip>
              </div>
              <div styleName="icon-circle">+</div>
            </Link>
          </div>
          <div styleName="image-btn" data-tip data-for="image-dashboard">
            <Link
              to={{
                pathname: '/asset/untitled',
                state: {
                  assetType: 'DASHBOARD',
                },
              }}
            >
              <div styleName="image dashboard">
                <ReactTooltip id="image-dashboard" type="dark" effect="solid" multiline>
                  <div style={{ textAlign: 'center' }}>Create Dashboard Asset</div>
                </ReactTooltip>
              </div>
              <div styleName="icon-circle">+</div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { onFileSelect, searchUsersResult, searchUsersByName } = this.props;
    const {
      selectedTeam,
      loggedInUser,
      openTeamManagementModal,
      updateTeamMembers,
      memberTeams,
    } = this.state;

    return (
      <div styleName="sidebar-wrapper">
        {this.renderProfileMenu()}
        {this.renderNewAssetCreatorButtons()}
        {this.renderActionMenus()}
        <div styleName="footer-wrapper">
          <button styleName="footer">
            <i className="icon-book-open" />
            <span>Documentation</span>
          </button>
        </div>
        {openTeamManagementModal
          ? <TeamManagement
            name={this.selectedTeamForEdit.name}
            teamId={this.selectedTeamForEdit.id}
            open={openTeamManagementModal}
            loggedInUser={loggedInUser}
            updateTeamMembers={updateTeamMembers}
            teamMembers={this.props.teamMembers}
            createTeam={this.props.createTeam}
            updateTeam={this.props.updateTeam}
            searchUsersResult={searchUsersResult}
            searchUsersByName={searchUsersByName}
            onClose={() => this.setState({ openTeamManagementModal: false })}
          />
          : null}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  searchUsersResult: state.dataDiscovery.searchUsersResult,
  loggedInUser: state.orgUserVerification.loggedInUser,
  memberTeams: state.dataDiscovery.memberTeams || [],
  teamMembers: state.dataDiscovery.teamMembers || [],
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      searchUsersByName,
      createTeam,
      updateTeam,
      getMemberTeams,
      getTeamMembers,
      profileChanged,
      activeTags,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(
  cssModules(SideBar, styles, { allowMultiple: true })
);
