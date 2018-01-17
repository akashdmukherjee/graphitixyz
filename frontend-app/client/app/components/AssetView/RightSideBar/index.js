import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import { browserHistory } from 'react-router';
import styles from './index.styl';
import Button from '../Button'; // TODO: Refactor this later
import Tag from '../../common/Tag';
import TagsInput from './TagsInput';
import AssetPermissions from './AssetPermissions';
import ReactTooltip from 'react-tooltip';
import ProgressBar from '../ProgressBar';
import Modal from './Modal';
import TrustImage from '../../../images/Trust.png';
import TrustGreyImage from '../../../images/Trust_Grey.png';
import DeprecateImage from '../../../images/Deprecate.png';
import DeprecateGreyImage from '../../../images/Deprecate_Grey.png';
import ErrorImage from '../../../images/Error.png';
import ErrorGreyImage from '../../../images/Error_Grey.png';
import Notes from './Notes';
import Faq from './Faq';
import { Menus, Menu } from './PrivacyMenus';
import DescriptionInput from './DescriptionInput';
import { newAssetNameEntered as newAssetNameEnteredAction } from '../SQLAssetView/Actions';
import { updateAssetDetails } from './Actions';
import {
  deleteAsset,
  updateAssetDetails as callUpdateAssetDetails,
  addAssetEndorsement,
  addAssetFavorite,
  deleteAssetEndorsement,
  deleteAssetFavorite,
  addFAQ,
  addNote,
} from '../Api';
import { getAllAssetTags } from '../../DataDiscovery/Api';

const endorsementTypes = {
  trusted: 'trusted',
  erroneous: 'erroneous',
  deprecated: 'deprecated',
};

const defaultAssetDetails = {
  admins: [],
  authors: [],
  viewers: [],
  erroneous: [],
  trusted: [],
  deprecated: [],
  favorites: [],
  tags: [],
  name: 'Untitled Asset',
};

const endorsementImages = {
  Trust: TrustImage,
  TrustGrey: TrustGreyImage,
  Deprecate: DeprecateImage,
  DeprecateGrey: DeprecateGreyImage,
  Error: ErrorImage,
  ErrorGrey: ErrorGreyImage,
  names: {
    Trust: 'Trust',
    TrustGrey: 'TrustGrey',
    Deprecate: 'Deprecate',
    DeprecateGrey: 'DeprecateGrey',
    Error: 'Error',
    ErrorGrey: 'ErrorGrey',
  },
};

const propTypes = {
  assetDetails: PropTypes.object,
  tags: PropTypes.arrayOf(PropTypes.string),
  isNewAsset: PropTypes.bool.isRequired,
  assetId: PropTypes.string.isRequired,
  usingInModal: PropTypes.bool,
  loggedInUser: PropTypes.object,
  showFixedLayer: PropTypes.bool.isRequired,
  connectionSelectionStepDone: PropTypes.bool,
  assetUserAccessibility: PropTypes.object,
  createdDataSet: PropTypes.object,
  createdSQLAsset: PropTypes.object,
  uploadedDataSet: PropTypes.object,
  callUpdateAssetDetails: PropTypes.func,
  onAssetNameEntered: PropTypes.func,
  addNote: PropTypes.func.isRequired,
  addFAQ: PropTypes.func.isRequired,
  onRelatedAssetsClick: PropTypes.func.isRequired,
};

const defaultProps = {
  assetDetails: defaultAssetDetails,
  tags: [],
  loggedInUser: {},
  usingInModal: false,
  assetUserAccessibility: {},
  connectionSelectionStepDone: null,
  createdDataSet: null,
  createdSQLAsset: null,
  uploadedDataSet: null,
  callUpdateAssetDetails: () => null,
  onAssetNameEntered: () => null,
};

const tagStyle = {
  tagWrapper: {
    marginRight: 8,
    marginTop: 3,
    marginBottom: 3,
  },
};

const fixedLayerStyle = {
  zIndex: 9,
  backgroundColor: 'rgba(0,0,0,0.3)',
  width: '100%',
  height: '100%',
  position: 'absolute',
  transition: 'all 0.25s ease-in-out',
};

const updateTypes = {
  FIELD_UPDATE_ONLY: 'FIELD_UPDATE_ONLY',
  ENDORSEMENT: 'ENDORSEMENT',
  FAVORITE: 'FAVORITE',
};

const permissionTypes = {
  ADMIN: 'ADMIN',
  AUTHOR: 'AUTHOR',
  VIEWER: 'VIEWER',
};

class RightSideBar extends React.Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  static dataSource = [
    {
      name: 'Akash Mukherjee',
      email: 'akash@graphiti.xyz',
      id: '12414132',
    },
    {
      name: 'Geetish Nayak',
      email: 'geetish@graphiti.xyz',
      id: '12414142',
    },
    {
      name: 'George Lee',
      email: 'glee@graphiti.xyz',
      id: '22414142',
    },
    {
      name: 'Devajit Asem',
      email: 'asemd@graphiti.xyz',
      id: '42414142',
    },
    {
      name: 'Akash Kumar',
      email: 'akashk@graphiti.xyz',
      id: '62414142',
    },
    {
      name: 'Katey Harrison',
      email: 'katey@graphiti.xyz',
      id: '52414142',
    },
    {
      name: 'Geetish Nayak',
      email: 'nayakg@graphiti.xyz',
      id: '82414142',
    },
    {
      name: 'Akash Deep Mukherjee',
      email: 'adm@graphiti.xyz',
      id: '83014142',
    },
  ];

  constructor(props) {
    super(props);
    const {
      loggedInUser,
      showFixedLayer,
      assetDetails,
      assetUserAccessibility,
      assetId,
      isNewAsset,
    } = props;
    const assetDetailsCopy = isNewAsset ? defaultAssetDetails : assetDetails;
    this.data = {
      orgId: loggedInUser.organizationId,
      memberId: loggedInUser.id,
      memberName: loggedInUser.fullName,
      assetId,
    };
    this.state = {
      selectedUsers: [RightSideBar.dataSource[0]],
      assetFavorited: this.isAssetFavorited(assetDetailsCopy),
      openPermissionsModal: false,
      openDiscoverabilityModal: false,
      shareAsset: false,
      shareUrlCopied: false,
      loggedInUser,
      showFixedLayer,
      isDirty: false,
      assetDetails: assetDetailsCopy,
      discoverabilityScore: 1,
      editDescription: !assetDetailsCopy.asset_description,
      editAssetName: false,
      descriptionHovered: false,
      assetFieldsToBeUpdated: {},
      assetUserAccessibility,
      canEditFields:
        assetUserAccessibility.permissionType === permissionTypes.ADMIN ||
        assetUserAccessibility.permissionType === permissionTypes.AUTHOR ||
        isNewAsset,
      assetId,
      isRightSideBarDisabled: isNewAsset, // disable RightSideBar if it is a new Asset
    };
  }

  componentDidMount() {
    if (this.data.memberId) {
      this.props.getAllAssetTags({ ...this.data });
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      loggedInUser,
      assetDeletionStatus,
      connectionSelectionStepDone,
      showFixedLayer,
      assetDetails,
      discoverabilityScore,
      uploadedDataSet,
      createdDataSet,
      createdSQLAsset,
      createdChartAsset,
    } = nextProps;
    const object = {};
    if (loggedInUser !== this.props.loggedInUser) {
      object.loggedInUser = loggedInUser;
      this.data.orgId = loggedInUser.organizationId;
      this.data.memberId = loggedInUser.id;
      this.data.memberName = loggedInUser.fullName;
      this.props.getAllAssetTags({ ...this.data });
    }
    if (assetDeletionStatus) {
      browserHistory.replace('/discovery');
    }
    if (connectionSelectionStepDone !== this.props.connectionSelectionStepDone) {
      object.connectionSelectionStepDone = connectionSelectionStepDone;
    }
    if (showFixedLayer !== this.props.showFixedLayer) {
      object.showFixedLayer = showFixedLayer;
    }
    if (assetDetails !== this.props.assetDetails) {
      object.assetDetails = assetDetails;
      this.data.assetId = assetDetails.id;
      object.editDescription = !assetDetails.asset_description;
      object.assetFavorited = this.isAssetFavorited(assetDetails);
    }
    if (discoverabilityScore !== this.props.discoverabilityScore) {
      object.discoverabilityScore = discoverabilityScore;
    }
    if (uploadedDataSet !== this.props.uploadedDataSet) {
      if (!uploadedDataSet) return;
      this.data.assetId = uploadedDataSet.assetId;
      object.isRightSideBarDisabled = false;
    }
    if (createdDataSet !== this.props.createdDataSet) {
      if (!createdDataSet) return;
      // if there is createdSQLAsset then asset is created
      // from /asset/untitled and there's no need to
      // override assetId
      if (!createdSQLAsset) {
        this.data.assetId = createdDataSet.dataSetAssetId;
        object.isRightSideBarDisabled = false;
      }
    }
    if (createdSQLAsset !== this.props.createdSQLAsset) {
      if (!createdSQLAsset) return;
      this.data.assetId = createdSQLAsset.sqlAssetId;
      object.isRightSideBarDisabled = false;
    }
    if (createdChartAsset !== this.props.createdChartAsset) {
      if (!createdChartAsset) return;
      this.data.assetId = createdChartAsset.chartAssetId;
      object.isRightSideBarDisabled = false;
    }

    this.setState(object);
  }

  componentDidUpdate(prevProps, prevState) {
    const { connectionSelectionStepDone } = prevState;
    if (connectionSelectionStepDone !== this.state.connectionSelectionStepDone) {
      if (this.assetNameInput) {
        this.assetNameInput.focus();
        this.assetNameInput.select();
      }
    }
  }

  disableRightSideBar = () => {
    this.setState({ isRightSideBarDisabled: true });
  }

  enableRightSideBar = () => {
    this.setState({ isRightSideBarDisabled: false });
  }

  isAssetFavorited(assetDetails) {
    const favorites = assetDetails.favorites || [];
    return favorites.findIndex(favorite => favorite.id === this.data.memberId) !== -1;
  }

  onAssetFavoriteClick = () => {
    const assetDetails = { ...this.state.assetDetails };
    const user = {
      id: this.data.memberId,
      name: this.data.memberName,
    };
    assetDetails.favorites = this.pushItemInArray(
      assetDetails.favorites || [],
      user,
      updateTypes.FAVORITE
    );
    this.setState({
      assetFavorited: !this.state.assetFavorited,
      assetDetails,
      assetFieldsToBeUpdated: {
        favorites: assetDetails.favorites,
      },
    });
  };

  onPermissionsModalClose = () => {
    this.setState({ openPermissionsModal: false });
  };

  handleEndorsementClick = endorsement => {
    const assetDetails = { ...this.state.assetDetails };
    const { trusted, erroneous, deprecated } = assetDetails;

    const endorsedUser = { id: this.data.memberId, name: this.data.memberName };
    if (endorsement === endorsementTypes.trusted) {
      assetDetails.trusted = this.pushItemInArray(
        trusted || [],
        endorsedUser,
        updateTypes.ENDORSEMENT,
        endorsement
      );
    } else if (endorsement === endorsementTypes.erroneous) {
      assetDetails.erroneous = this.pushItemInArray(
        erroneous || [],
        endorsedUser,
        updateTypes.ENDORSEMENT,
        endorsement
      );
    } else if (endorsement === endorsementTypes.deprecated) {
      assetDetails.deprecated = this.pushItemInArray(
        deprecated || [],
        endorsedUser,
        updateTypes.ENDORSEMENT,
        endorsement
      );
    }
    this.setState({ assetDetails });
  };

  pushItemInArray = (array, item, updateType, endorsementType) => {
    const arraySlice = array.slice(0);
    const matchIndex = array.findIndex(arrayItem => arrayItem.id === item.id);
    if (matchIndex === -1) {
      if (updateType === updateTypes.ENDORSEMENT) {
        this.props.addAssetEndorsement({ ...this.data, endorsementType });
      } else if (updateType === updateTypes.FAVORITE) {
        this.props.addAssetFavorite({ ...this.data });
      }
      return [...arraySlice, item];
    }

    if (updateType === updateTypes.ENDORSEMENT) {
      this.props.deleteAssetEndorsement({ ...this.data, endorsementType });
    } else if (updateType === updateTypes.FAVORITE) {
      this.props.deleteAssetFavorite({ ...this.data });
    }
    arraySlice.splice(matchIndex, 1);
    return arraySlice;
  };

  onUserSelect = user => {
    let { selectedUsers } = this.state;
    let isUserAlreadySelected = false;

    for (const selectedUser of selectedUsers) {
      if (selectedUser.email === user.email) {
        isUserAlreadySelected = true;
      }
    }

    if (!isUserAlreadySelected) {
      selectedUsers = selectedUsers.concat(user);
      this.setState({
        selectedUsers,
      });
    }
  };

  privacyMenusTriggerComponent = ({ toggleMenus }) => {
    return (
      <Button styleClassName="btn-privacy" onClick={toggleMenus}>
        <i className="fa fa-lock" />
      </Button>
    );
  };

  onPermissionsButtonClick = () => {
    this.setState({ openPermissionsModal: true });
  };

  onAssetDelete = () => {
    const { loggedInUser } = this.state;
    if (loggedInUser) {
      this.props.deleteAsset({ ...this.data });
    }
  };

  handleInputChange = e => {
    const { value } = e.target;
    const { assetDetails } = this.state;
    const assetFieldsToBeUpdated = {};
    // this can be mutated without any side effects
    // AssetUsers => name
    // AssetDetailedInformation => assetName
    assetFieldsToBeUpdated.assetName = value;

    this.setState({
      assetDetails: {
        ...assetDetails,
        name: value,
      },
      assetFieldsToBeUpdated,
    });
  };

  handleInputKeyPress = event => {
    const { showFixedLayer } = this.state;
    // this is just a hack for `enter` keyCode
    // where keyCode is 0 instead of 13
    if (event.keyCode === 13 || event.charCode === 13) {
      if (showFixedLayer) {
        const { usingInModal, onAssetNameEntered } = this.props;
        // if using inside a modal then there is no need to trigger a redux action
        if (usingInModal) {
          onAssetNameEntered(event.target.value);
        } else {
          this.props.newAssetNameEnteredAction({
            assetName: this.state.assetDetails.name,
          });
        }
        this.props.updateAssetDetails({ ...this.state.assetDetails });
      } else {
        this.setState({ editAssetName: false });
        // once enter is pressed on asset name input
        // call the update asset
        // same will be done on each field that needs an update
        this.updateAsset();
      }
    }
  };

  handleDescriptionChange = ({ value }) => {
    const assetDetails = { ...this.state.assetDetails };
    const assetFieldsToBeUpdated = {};
    assetFieldsToBeUpdated.asset_description = value;
    assetDetails.asset_description = value;
    this.setState({
      isDirty: true,
      assetDetails,
      assetFieldsToBeUpdated,
    });
  };

  handleDescriptionSaveClick = () => {
    this.updateAsset();
    this.setState({ editDescription: false });
  };

  handleTagSelect = tag => {
    const assetDetails = { ...this.state.assetDetails };
    const assetFieldsToBeUpdated = {};
    assetDetails.tags = [...assetDetails.tags, tag];
    assetFieldsToBeUpdated.tags = assetDetails.tags;
    this.setState({ assetDetails, isDirty: true, assetFieldsToBeUpdated }, () => {
      this.updateAsset();
    });
  };

  updateAsset = () => {
    const { assetFieldsToBeUpdated } = this.state;
    this.props.callUpdateAssetDetails({
      ...this.data,
      ...assetFieldsToBeUpdated,
    });
  };

  handleMouseEnter = () => {
    const { descriptionHovered, editDescription } = this.state;
    if (!descriptionHovered && !editDescription) {
      this.setState({ descriptionHovered: !descriptionHovered });
    }
  };

  handleMouseLeave = () => {
    const { descriptionHovered } = this.state;
    if (descriptionHovered) {
      this.setState({ descriptionHovered: !descriptionHovered });
    }
  };

  // accessible instance method
  makeAssetNameEditable = () => {
    this.setState({ connectionSelectionStepDone: true, showFixedLayer: true });
  };

  makeAssetNameUneditable = () => {
    this.setState({ connectionSelectionStepDone: false, showFixedLayer: false });
  };

  toggleAssetNameEditable = () => {
    const { connectionSelectionStepDone, showFixedLayer } = this.state;
    this.setState({ connectionSelectionStepDone: !connectionSelectionStepDone, showFixedLayer: !showFixedLayer });
  }

  render() {
    const {
      assetFavorited,
      showFixedLayer,
      connectionSelectionStepDone,
      discoverabilityScore,
      assetDetails,
      editAssetName,
      canEditFields,
      isRightSideBarDisabled,
    } = this.state;
    const { tags, isNewAsset, onRelatedAssetsClick } = this.props;
    /*eslint-disable*/
    const { asset_description, name } = assetDetails;
    /*eslint-enable*/
    fixedLayerStyle.zIndex = isRightSideBarDisabled ? 9 : -1;
    fixedLayerStyle.opacity = isRightSideBarDisabled ? 1 : 0;
    return (
      <div
        style={{
          height: '100%',
        }}
      >
        <div styleName="rsb-main-wrapper">
          <div style={fixedLayerStyle} />
          <div
            styleName="asset-name"
            style={{
              zIndex: showFixedLayer && connectionSelectionStepDone ? 10 : null,
            }}
          >
            {((showFixedLayer && connectionSelectionStepDone) || editAssetName) &&
            (canEditFields || isNewAsset)
              ? <input
                ref={_ref => {
                  this.assetNameInput = _ref;
                }}
                type="text"
                value={name}
                styleName="asset-name-input"
                name="assetName"
                onChange={this.handleInputChange}
                onKeyPress={this.handleInputKeyPress}
              />
              : <h5>
                  {name}
                </h5>}
            {canEditFields
              ? <span
                styleName="asset-name-edit-icon"
                onClick={() => {
                  this.setState({ editAssetName: true }, () => {
                    this.assetNameInput.focus();
                    this.assetNameInput.select();
                  });
                }}
              >
                  <i className="icon-pencil" />
                </span>
              : null}
          </div>
          <div styleName="social-btns">
            <Button
              text="Favorite"
              styleClassName={assetFavorited ? 'btn-fav-active' : 'btn-fav'}
              onClick={this.onAssetFavoriteClick}
            >
              <i
                className={`fa fa-star${assetFavorited ? '' : '-o'}`}
                styleName={assetFavorited ? 'animated-star' : null}
              />
            </Button>
            <Button
              text="Members"
              styleClassName="btn-permissions"
              onClick={this.onPermissionsButtonClick}
            >
              <i className="fa fa-users" />
            </Button>
            <div styleName="privacy-wrapper">
              <Menus triggerComponent={this.privacyMenusTriggerComponent}>
                <Menu text="Company Wide" subtext="Viewable by all" iconName="fa-university" />
                <Menu text="Private" subtext="Searchable by all" iconName="fa-lock" />
                <Menu text="Secret" subtext="Not searchable" iconName="fa-user-secret" />
              </Menus>
            </div>
          </div>
          <div styleName="favorite-status">
            {this.renderFavorites()}
          </div>
          <div styleName="discoverability">
            <h5>
              DISCOVERABILITY SCORE{' '}
              <span data-tip data-for="discoverability" styleName="icon">
                <i className="icon-question" />
                <ReactTooltip id="discoverability" type="dark" effect="solid" multiline>
                  <span>Discoverablility</span>
                </ReactTooltip>
              </span>
            </h5>
            <div styleName="progress-bar">
              <ProgressBar score={discoverabilityScore} />
            </div>
          </div>
          {this.renderDescription()}
          <div styleName="tags">
            {this.renderTags()}
            <TagsInput tags={tags} onTagSelect={this.handleTagSelect} />
          </div>
          {this.renderEndorsements()}
          <div styleName="help-btns">
            <Button
              text="FAQs"
              styleClassName={'btn-faq'}
              onClick={() => {
                this.setState({ openFAQModal: true });
              }}
            >
              <i className="fa fa-question-circle" />
            </Button>
            <Button
              text="Notes"
              styleClassName={'btn-notes'}
              onClick={() => {
                this.setState({ openNotesModal: true });
              }}
            >
              <i className="fa fa-comments" />
            </Button>
            <Button styleClassName="btn-delete" onClick={this.onAssetDelete}>
              <i className="fa fa-trash" />
            </Button>
          </div>
          <div styleName="footer-btn">
            <Button
              text="Related Assets"
              styleClassName="btn-related-assets"
              onClick={onRelatedAssetsClick}
            >
              {/* <i className="icon-share" />*/}
            </Button>
          </div>
        </div>
        <AssetPermissions
          open={this.state.openPermissionsModal}
          onClose={this.onPermissionsModalClose}
        />
        {this.renderNotesModal()}
        {this.renderFAQModal()}
      </div>
    );
  }

  renderDescription() {
    const { assetDetails, editDescription, descriptionHovered, canEditFields } = this.state;
    const { asset_description } = assetDetails;
    return (
      <div
        styleName="description"
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        {descriptionHovered && canEditFields
          ? <span
            styleName="description-edit-icon"
            onClick={() => {
              this.setState({
                editDescription: true,
                descriptionHovered: false,
              });
            }}
          >
              <i className="icon-pencil" />
            </span>
          : null}
        {editDescription && canEditFields
          ? <span styleName="description-save-icon" onClick={this.handleDescriptionSaveClick}>
              <i className="icon-check" />
            </span>
          : null}
        <h5>DESCRIPTION</h5>
        {/*eslint-disable*/}
        {asset_description && !editDescription ? asset_description : null}
        {editDescription && canEditFields
          ? <DescriptionInput
              value={asset_description || ''}
              onValueChanged={this.handleDescriptionChange}
            />
          : null}
        {/*eslint-enable*/}
      </div>
    );
  }

  removeTag = tagToBeRemoved => {
    const { assetDetails } = this.state;
    const { tags } = assetDetails;
    const newTags = tags.filter(tagName => tagName !== tagToBeRemoved);
    const newAssetDetails = Object.assign({}, assetDetails);
    newAssetDetails.tags = newTags;
    // make an api call to update the tags
    this.props.callUpdateAssetDetails({ ...this.data, ...newAssetDetails });
    this.setState({ assetDetails: newAssetDetails });
  };

  renderTags() {
    const { assetDetails } = this.state;
    if (assetDetails.tags.length) {
      return assetDetails.tags.map(tag =>
        <Tag style={tagStyle} label={tag} key={tag} interactive onTagCloseClick={this.removeTag} />
      );
    }
    return null;
  }

  renderEndorsements() {
    const { activeEndorsements, assetDetails } = this.state;
    const { trusted, deprecated, erroneous } = assetDetails;
    return (
      <div styleName="endorsements">
        <div styleName="container">
          <div styleName="endorsement">
            <h5 styleName="endorsement-name">Trusted</h5>
            {this.renderEndorsementImage({
              imageName: trusted.length
                ? endorsementImages.names.Trust
                : endorsementImages.names.TrustGrey,
              onClick: () => this.handleEndorsementClick(endorsementTypes.trusted),
            })}
            <h5 styleName="endorsement-number">
              {trusted.length} People
            </h5>
          </div>
          <div styleName="endorsement">
            <h5 styleName="endorsement-name">Erroneous</h5>
            {this.renderEndorsementImage({
              imageName: erroneous.length
                ? endorsementImages.names.Error
                : endorsementImages.names.ErrorGrey,
              onClick: () => this.handleEndorsementClick(endorsementTypes.erroneous),
            })}
            <h5 styleName="endorsement-number">
              {erroneous.length} People
            </h5>
          </div>
          <div styleName="endorsement">
            <h5 styleName="endorsement-name">Deprecated</h5>
            {this.renderEndorsementImage({
              imageName: deprecated.length
                ? endorsementImages.names.Deprecate
                : endorsementImages.names.DeprecateGrey,
              onClick: () => this.handleEndorsementClick(endorsementTypes.deprecated),
            })}
            <h5 styleName="endorsement-number">
              {deprecated.length} People
            </h5>
          </div>
        </div>
      </div>
    );
  }

  renderEndorsementImage = ({ imageName, onClick }) => {
    return (
      <img
        src={endorsementImages[imageName]}
        role="presentation"
        styleName="endorsement-image"
        onClick={onClick}
      />
    );
  };

  renderFAQModal = () => {
    const { assetDetails, assetUserAccessibility } = this.state;
    return (
      <Modal
        open={this.state.openFAQModal}
        modalName="Asset Name"
        header="FAQs"
        onClose={() => {
          this.setState({ openFAQModal: false });
        }}
      >
        <Faq
          {...this.data}
          faqs={assetDetails.faqs}
          assetUserAccessibility={assetUserAccessibility}
          addFAQ={this.props.addFAQ}
        />
      </Modal>
    );
  };

  renderNotesModal = () => {
    const { assetDetails, assetUserAccessibility } = this.state;
    return (
      <Modal
        modalName="Asset Name"
        header="Notes"
        open={this.state.openNotesModal}
        onClose={() => {
          this.setState({ openNotesModal: false });
        }}
      >
        <Notes
          {...this.data}
          assetUserAccessibility={assetUserAccessibility}
          notes={assetDetails.notes}
          addNote={this.props.addNote}
        />
      </Modal>
    );
  };

  renderFavorites() {
    const { favorites } = this.state.assetDetails;
    if (favorites === null || favorites === undefined) return null;
    const favoritesLength = favorites.length;
    if (favoritesLength === 0) {
      return null;
    }
    return (
      <p>
        <i className="fa fa-star-o"> </i> {`Favorited by ${favorites[0].name}`}
        {favoritesLength > 1 ? ' and ' : null}
        {favoritesLength > 1
          ? <span>
              {favoritesLength - 1} others
            </span>
          : null}
      </p>
    );
  }
}

const mapStateToProps = state => ({
  assetDeletionStatus: state.dataAssetView.assetDeletionStatus,
  loggedInUser: state.orgUserVerification.loggedInUser,
  connectionSelectionStepDone: state.dataAssetView.connectionSelectionStepDone,
  assetDetails: state.dataAssetView.assetDetails,
  discoverabilityScore: state.dataAssetView.discoverabilityScore,
  tags: state.dataDiscovery.tags,
  uploadedDataSet: state.dataAssetView.uploadedDataSet,
  createdDataSet: state.dataAssetView.createdDataSet,
  createdSQLAsset: state.dataAssetView.createdSQLAsset,
  createdChartAsset: state.dataAssetView.createdChartAsset,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      deleteAsset,
      newAssetNameEnteredAction,
      updateAssetDetails,
      callUpdateAssetDetails,
      addAssetEndorsement,
      addAssetFavorite,
      deleteAssetEndorsement,
      deleteAssetFavorite,
      addFAQ,
      addNote,
      getAllAssetTags,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(
  cssModules(RightSideBar, styles)
);
