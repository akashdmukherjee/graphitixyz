import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import { connect as reduxConnect } from 'react-redux';
import ReactTooltip from 'react-tooltip';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import {
  searchTextInSolr,
  getAllAssetTags,
  getSearchAutocomplete,
  searchUsersByName,
  getTeamMembers,
} from './Api';
import { addAssetFavorite, deleteAssetFavorite } from '../AssetView/Api';
import { sortByChanged } from './Actions';
import ListPreview from './ListPreview';
import Loader from '../common/Loader';
/*
* getLoggedInUserDetails is in Login/Api
* since Project is structured according to features
* every feature is dependent on Login functionalities
*/
import { getLoggedInUserDetails } from '../Login/Api';
import actionMenus from './SideBar/actionMenus';

import './index.css';
import styles from './index.styl';
import Search from './Search';
import SideBar from './SideBar';
import Assets from './Assets';
import profileTypes from './profileTypes';

const CREATED_DATE = 'createdTimestamp';

class DataDiscovery extends Component {
  static propTypes = {
    loggedInUser: PropTypes.object,
    assets: PropTypes.object,
    getAllAssetTags: PropTypes.func.isRequired,
    searchTextInSolr: PropTypes.func.isRequired,
    getSearchAutocomplete: PropTypes.func.isRequired,
    getLoggedInUserDetails: PropTypes.func.isRequired,
    getTeamMembers: PropTypes.func.isRequired,
    searchUsersByName: PropTypes.func.isRequired,
    addAssetFavorite: PropTypes.func.isRequired,
    deleteAssetFavorite: PropTypes.func.isRequired,
    sortByChanged: PropTypes.func.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    const { loggedInUser } = props;
    this.state = {
      open: false,
      loggedInUser: props.loggedInUser,
      profile: null,
      activeTags: [],
      isAssetsLoading: true,
    };
    this.lastSearchedText = '';
    this.data = {
      orgId: loggedInUser && loggedInUser.organizationId,
      memberId: loggedInUser && loggedInUser.id,
    };
  }

  componentDidMount() {
    const { loggedInUser } = this.state;
    if (loggedInUser) {
      this.props.getAllAssetTags(this.data);
      this.onSearchText({ searchText: '*:*', sortBy: CREATED_DATE });
    } else {
      this.props.getLoggedInUserDetails();
    }
  }

  componentWillReceiveProps(nextProps) {
    // console.info(nextProps, this.props);
    const { assets, loggedInUser, profile, teamMembers, activeTags } = nextProps;

    const state = {};

    if (assets && this.props.assets !== assets) {
      state.assets = assets;
      state.isAssetsLoading = false;
    }
    if (loggedInUser !== this.state.loggedInUser) {
      state.loggedInUser = loggedInUser;
      if (!this.data.memberId) {
        this.data.memberId = loggedInUser.id;
        this.data.orgId = loggedInUser.organizationId;
        this.props.getAllAssetTags(this.data);
        this.onSearchText({ searchText: '*:*', sortBy: CREATED_DATE });
      }
    }
    if (profile !== this.props.profile) {
      const searchData = {
        searchText: '*:*',
        authors: profile.id,
      };
      if (profile.profileType === profileTypes.PERSONAL) {
        delete searchData.authors;
      } else {
        this.props.getTeamMembers({ ...this.data, teamId: profile.id });
      }
      this.onSearchText(searchData);
      this.setState({ profile });
    }
    if (teamMembers !== this.props.teamMembers) {
      state.teamMembers = teamMembers;
    }
    if (activeTags !== this.props.activeTags) {
      state.activeTags = activeTags;
      this.onSearchText({
        tags: activeTags,
      });
    }

    this.setState(state);
  }

  onSearchText = ({ searchText, authors, tags, sortBy, getMyFavorites }) => {
    const urlParams = {
      query: searchText || '*:*',
      sortBy,
    };
    if (authors && authors.length) {
      urlParams.authors = authors;
    }
    if (tags && typeof tags !== 'string' && tags.length) {
      urlParams.tags = tags.join(',');
    }
    if (getMyFavorites === true) {
      urlParams.getMyFavorites = getMyFavorites;
    }
    const apiData = {
      ...this.data,
      urlParams,
    };
    this.props.searchTextInSolr(apiData);
  };

  onSearchTextChange = searchText => {
    const trimmedSearchText = searchText.trim();
    // console.info(searchText, trimmedSearchText, this.lastSearchedText);
    if (this.lastSearchedText !== trimmedSearchText && trimmedSearchText.length > 2) {
      const data = {
        ...this.data,
        query: trimmedSearchText,
      };
      this.props.getSearchAutocomplete(data);
      this.lastSearchedText = trimmedSearchText;
    }
  };

  onAuthorsSearchTextChange = text => {
    const data = {
      ...this.data,
      query: text,
    };
    this.props.searchUsersByName(data);
  };

  handleClick = () => this.setState({ open: true });

  handleModalClose = () => this.setState({ open: false });

  handleActionMenuClick = data => {
    if (actionMenus.RECENT === data.name) {
      this.onSearchText({
        sortBy: CREATED_DATE,
      });
    } else if (actionMenus.MY_ASSETS === data.name) {
      this.onSearchText({
        authors: this.data.memberId,
      });
    } else if (actionMenus.FAVORITED === data.name) {
      this.onSearchText({
        getMyFavorites: true,
      });
    }
    this.assetsList.showLoading();
  };

  renderNewAssetCreatorButtons() {
    return (
      <div styleName="new-asset-buttons">
        <div styleName="row">
          <h5 styleName="label-lg">Getting Started with Graphiti</h5>
          <h5 styleName="label-sm">You have no data assets yet. Let's change that!</h5>
        </div>
        <div styleName="row">
          <div styleName="image-btn" data-tip data-for="image-sql">
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
    const { assets, loggedInUser, isAssetsLoading } = this.state;
    const { tags } = this.props;

    return (
      <div styleName="main-wrapper">
        <div styleName="sidebar">
          <SideBar
            tags={tags}
            loggedInUser={loggedInUser}
            onActionMenuClick={this.handleActionMenuClick}
            onNewAssetClick={this.handleClick}
            onFileSelect={this.onFileSelect}
          />
        </div>
        <div styleName="main-container">
          {/* TODO: refactor autocomplete/authorsAutocomplete*/}
          <div styleName="search">
            <Search
              onSearchText={this.onSearchText}
              onSearchTextChange={this.onSearchTextChange}
              onAuthorsSearchTextChange={this.onAuthorsSearchTextChange}
            />
          </div>
          <div styleName="assets">
            {/* {this.renderTeamProfile()} */}
            {!isAssetsLoading && assets.assets.length
              ? <Assets
                ref={_ref => {
                  this.assetsList = _ref;
                }}
                userData={this.data}
                addAssetFavorite={this.props.addAssetFavorite}
                deleteAssetFavorite={this.props.deleteAssetFavorite}
                sortByChanged={this.props.sortByChanged}
                data={assets}
              />
              : null}
            {!isAssetsLoading && !assets.assets.length ? this.renderNewAssetCreatorButtons() : null}
            {isAssetsLoading ? <Loader /> : null}
          </div>
        </div>
      </div>
    );
  }

  renderTeamProfile() {
    const { profile, teamMembers } = this.state;
    if (!profile || (profile && profile.profileType === profileTypes.PERSONAL)) {
      return null;
    }
    return (
      <div styleName="team-profile">
        <div styleName="cover-image">
          <h5>Collaborate, govern, discover</h5>
        </div>
        <div className="footer">
          <ListPreview label="Members" users={teamMembers} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    assets: state.dataDiscovery.searchResult,
    profile: state.dataDiscovery.profile,
    teamMembers: state.dataDiscovery.teamMembers,
    activeTags: state.dataDiscovery.activeTags,
    /*
     * loggedInUser may be from orgUserVerification state {true when login is done from Login page}
     * or dataDiscovery state {true}
     */
    loggedInUser: state.orgUserVerification.loggedInUser || state.dataDiscovery.loggedInUser,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      searchTextInSolr,
      getAllAssetTags,
      getSearchAutocomplete,
      searchUsersByName,
      getLoggedInUserDetails,
      addAssetFavorite,
      deleteAssetFavorite,
      getTeamMembers,
      sortByChanged,
    },
    dispatch
  );

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  cssModules(DataDiscovery, styles, { allowMultiple: true })
);
