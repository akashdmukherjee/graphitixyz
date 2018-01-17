import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { connect as reduxConnect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ProgressBar from 'react-progressbar.js';
import styles from './index.styl';
import TopNavBar from './TopNavBar';
import RightSideBar from './RightSideBar';
import {
  checkAssetUserAccessibility,
  getAssetDetails,
  getQueryData,
  getAllConnectionsForUser,
  uploadAssetFile,
  getDiscoverabilityScore,
  createChartAsset,
} from './Api';
import { currentAssetId } from './Actions';
import { connectionSelectionStepDone as connectionSelectionStepDoneAction } from './SQLAssetView/Actions';
import { chartAssetCreationStarted } from './ChartView/Actions';
import { expandFiltersAndShowSQLEditor } from './Filters/Actions';
import { getLoggedInUserDetails } from '../Login/Api';
import SQLAssetView from './SQLAssetView';
import DataAssetView from './DataAssetView';
import ChartView from './ChartView';
import AssetCreationModal from './AssetCreationModal';
import TreeDiagram from './RelatedAssets/TreeDiagram';
import injestionOperationTypes from './injestionOperationTypes';
import DashboardView from './DashboardView';
import GridLines from './DashboardView/GridLines';
import Loader from '../common/Loader';

const assetTypes = {
  SQL: 'SQL',
  DATASET: 'DATASET',
  CHART: 'CHART',
  DASHBOARD: 'DASHBOARD',
};

const sourceTypes = {
  SQL: 'SQL',
  FILE: 'FILE',
};

const containerStyle = {
  width: '400px',
  height: '16px',
  margin: '20px',
};
const loaderStyle = {
  height: '100vh',
  width: '100vw',
};
const options = {
  duration: 1400,
  color: '#f26450',
  trailColor: '#eee',
  svgStyle: { width: '100%', height: '100%' },
  easing: 'easeInOut',
};
const Line = ProgressBar.Line;
const untitledAsset = 'untitled';
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

class AssetView extends React.Component {
  static propTypes = {
    loggedInUser: PropTypes.object,
    location: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    assetUserAccessibility: PropTypes.object,
    assetDetails: PropTypes.object,
    getDataResult: PropTypes.arrayOf(PropTypes.any),
    allConnections: PropTypes.arrayOf(PropTypes.any),
    newAssetNameEntered: PropTypes.bool,
    connectionSelectionStepDone: PropTypes.bool,
    uploadAssetFile: PropTypes.func.isRequired,
    getAssetDetails: PropTypes.func.isRequired,
    currentAssetId: PropTypes.func.isRequired,
    checkAssetUserAccessibility: PropTypes.func.isRequired,
    getLoggedInUserDetails: PropTypes.func.isRequired,
    getAllConnectionsForUser: PropTypes.func.isRequired,
    connectionSelectionStepDoneAction: PropTypes.func.isRequired,
  };

  static defaultProps = {
    assetUserAccessibility: {},
    assetDetails: defaultAssetDetails,
    loggedInUser: {},
    sqlCapability: {},
    getDataResult: [],
    newAssetNameEntered: false,
    connectionSelectionStepDone: false,
  };

  constructor(props) {
    super(props);
    const { loggedInUser, params, assetDetails, assetUserAccessibility } = props;
    const assetId = params.assetId;
    // get assetType for new untitled asset or from backend for already created assets
    this.assetType = (props.location.state && props.location.state.assetType) || null;
    const isNewAsset = assetId.match(/untitled/) !== null;

    this.data = {
      orgId: loggedInUser.organizationId,
      memberId: loggedInUser.id,
      assetId,
    };
    this.state = {
      isSideBarOpened:
        this.assetType !== assetTypes.CHART && this.assetType !== assetTypes.DASHBOARD,
      showSubMenus: false,
      assetDetails: isNewAsset ? {} : assetDetails,
      assetId,
      loggedInUser,
      isNewAsset,
      showFixedLayer:
        assetId === untitledAsset &&
        this.assetType !== assetTypes.CHART &&
        this.assetType !== assetTypes.DASHBOARD,
      assetUserAccessibility,
      isAssetLoading: !isNewAsset,
      isFileUploading: false,
      data: this.data,
      showRelatedAssetsGraph: false,
    };
    this.onMenuClick = this.onMenuClick.bind(this);
    this.rightSideBar = null;

    // Chart Asset related variables
    this.chartConfig = null;
    this.sourceAssetIds = null;
  }

  componentDidMount() {
    const { loggedInUser, isNewAsset } = this.state;
    if (loggedInUser.id) {
      // check if user has access on this asset
      if (!isNewAsset) {
        this.props.getAssetDetails({ ...this.data });
        this.props.checkAssetUserAccessibility({ ...this.data });
      }
    } else {
      this.props.getLoggedInUserDetails();
    }
    this.props.currentAssetId({ assetId: this.data.assetId });
  }

  componentWillReceiveProps(nextProps) {
    const { assetUserAccessibility, assetDetails, loggedInUser, newAssetNameEntered } = nextProps;
    const object = {};
    if (assetDetails !== this.props.assetDetails) {
      object.assetDetails = assetDetails;
      if (assetDetails.assetType && !this.assetType) {
        this.assetType = assetDetails.assetType;
      }
    }
    if (loggedInUser && loggedInUser !== this.props.loggedInUser) {
      object.loggedInUser = loggedInUser;
      this.data.memberId = loggedInUser.id;
      this.data.orgId = loggedInUser.organizationId;
      object.data = this.data;
      if (!this.state.isNewAsset) {
        this.props.getAssetDetails({ ...this.data });
        this.props.checkAssetUserAccessibility({ ...this.data });
      }
    }
    if (newAssetNameEntered !== this.props.newAssetNameEntered) {
      object.newAssetNameEntered = newAssetNameEntered;

      // a new assetName has been entered in RightSideBar
      // call corresponding save/create API's accpording to assetType
      if (newAssetNameEntered) {
        object.showFixedLayer = false;
        /**
         * check here if it's a file upload for untitled assets
         * during the DATASET creation flow
         */
        const { isNewAsset, file } = this.state;
        if (isNewAsset && file) {
          const data = { ...this.data, ...newAssetNameEntered };
          this.props.uploadAssetFile({ ...data, file });
          // object.showFixedLayer = true;
          object.isLoading = true;
        } else if (isNewAsset && this.state.sqlAssetApiData) {
          this.callGetQueryData(newAssetNameEntered);
        } else if (isNewAsset && this.assetType === assetTypes.CHART) {
          const data = {
            ...this.data,
            assetName: newAssetNameEntered.assetName,
            chartConfigs: this.chartConfig,
            sourceAssetIds: this.sourceAssetIds,
          };
          this.props.createChartAsset(data);
          this.props.chartAssetCreationStarted();
        }
      }
    }
    if (assetUserAccessibility !== this.props.assetUserAccessibility) {
      object.assetUserAccessibility = assetUserAccessibility;
      if (assetUserAccessibility.userHasAccess) {
        this.props.getDiscoverabilityScore(this.data);
      }
      this.setState({ isAssetLoading: false, isDirty: false });
    }
    this.setState(object);
  }

  callGetQueryData = ({ assetName }) => {
    const { sqlAssetApiData } = this.state;
    const { query, connectionId } = sqlAssetApiData;
    const data = {
      ...sqlAssetApiData,
      connectionId,
      operationType: injestionOperationTypes.BOTH_SQL_AND_DATA,
      body: {
        sqlAssetName: assetName,
        query,
      },
    };
    this.props.getQueryData(data);
  };

  onMenuClick() {
    this.setState({
      isSideBarOpened: !this.state.isSideBarOpened,
    });
  }

  isInvalid = property => property === undefined || property === null;

  handleFileSelect = e => {
    // const { loggedInUser } = this.props;
    const file = e.target.files[0];
    // const data = {
    //   memberId: loggedInUser.id,
    //   orgId: loggedInUser.organizationId,
    // };
    /**
     * now active fixedLayer
     * and highlight only the asset name input
     * which is triggered by connectionSelectionStepDone
     * in SQLAssetView, let's just re-use this
     */
    this.props.connectionSelectionStepDoneAction(true);
    this.setState({
      file,
      showFixedLayer: true,
    });
    // this.props.uploadAssetFile({ ...data, file });
  };

  handleSaveClick = data => {
    // console.info(data);
    this.props.connectionSelectionStepDoneAction(true);
    this.setState({ sqlAssetApiData: data });
  };

  handleRelatedAssetsClick = () => {
    this.setState({ showRelatedAssetsGraph: !this.state.showRelatedAssetsGraph });
  };

  handleChartSaveClick = ({ chartConfig, sourceDataAssetId }) => {
    this.chartConfig = chartConfig;
    this.sourceAssetIds = [sourceDataAssetId];
    this.setState({ isSideBarOpened: !this.state.isSideBarOpened }, () => {
      this.rightSideBar.getWrappedInstance().toggleAssetNameEditable();
    });
  };

  render() {
    const {
      isSideBarOpened,
      assetDetails,
      showFixedLayer,
      assetUserAccessibility,
      assetId,
      isFileUploading,
      isAssetLoading,
      isNewAsset,
      data,
      showRelatedAssetsGraph,
    } = this.state;
    const { allConnections, loggedInUser } = this.props;
    if (isAssetLoading) {
      return (
        <div style={loaderStyle}>
          <Loader />
        </div>
      );
    }
    let message = '';
    if (!isAssetLoading && !assetUserAccessibility.userHasAccess && !isNewAsset) {
      message = "You don't have access permissions to this Asset.";
    }

    if (assetUserAccessibility.userHasAccess || (isNewAsset && data.memberId)) {
      const displayValue = showRelatedAssetsGraph ? 'none' : 'block';
      return (
        <div styleName="dav-main-wrapper">
          {showFixedLayer || isFileUploading
            ? <div
              styleName="fixed-layer"
              onClick={e => {
                e.stopPropagation();
              }}
            />
            : null}
          {/*
          * open AssetCreationModal only when assetType is DATASET
          * and it's new Asset
          */}
          {this.assetType === assetTypes.DATASET && isNewAsset
            ? <AssetCreationModal
              assetId={assetId}
              apiData={data}
              isNewAsset={isNewAsset}
              assetType={this.assetType}
              showFixedLayer={showFixedLayer}
              allConnections={allConnections}
              loggedInUser={loggedInUser}
              assetUserAccessibility={assetUserAccessibility}
              onFileSelect={this.handleFileSelect}
              onSaveClick={this.handleSaveClick}
            />
            : null}
          <div styleName="top-navbar">
            <TopNavBar
              assetDetails={assetDetails}
              onMenuClick={this.onMenuClick}
              isSideBarOpened={isSideBarOpened}
            />
          </div>
          <div styleName="main-container">
            {isFileUploading
              ? <div
                style={{
                  position: 'absolute',
                  borderRadius: 3,
                  top: 0,
                  left: 0,
                  width: 'calc(100% - 250px)',
                  height: '100%',
                  zIndex: 5,
                  backgroundColor: '#fff',
                }}
              >
                  <div
                    style={{
                      position: 'relative',
                    }}
                  >
                    <div>
                      <Line
                        initialAnimate
                        progress={0.7}
                        containerStyle={containerStyle}
                        options={options}
                        containerClassName={'.progressbar'}
                      />
                    </div>
                    <div>
                      You can either wait while your data loads or{' '}
                      <a>explore other data assets on graphiti</a>
                    </div>
                  </div>
                </div>
              : null}

            <div
              styleName="content"
              style={{
                overflow:
                  this.assetType !== assetTypes.CHART && this.assetType !== assetTypes.DASHBOARD
                    ? null
                    : 'scroll',
              }}
            >
              {this.assetType === assetTypes.CHART
                ? <div
                  style={{
                    display: displayValue,
                    width: '100%',
                    height: '100%',
                  }}
                >
                    <ChartView
                      apiData={data}
                      assetId={assetId}
                      isNewAsset={isNewAsset}
                      isSideBarOpened={isSideBarOpened}
                      onSaveChartClick={this.handleChartSaveClick}
                    />
                  </div>
                : null}
              {this.assetType === assetTypes.DATASET
                ? <div
                  style={{
                    display: displayValue,
                    width: '100%',
                    height: '100%',
                  }}
                >
                    <DataAssetView
                      assetId={assetId}
                      apiData={data}
                      isNewAsset={isNewAsset}
                      isSideBarOpened={isSideBarOpened}
                    />
                  </div>
                : null}
              {this.assetType === assetTypes.SQL
                ? <div
                  style={{
                    display: displayValue,
                    width: '100%',
                    height: '100%',
                  }}
                >
                    <SQLAssetView
                      apiData={data}
                      assetId={assetId}
                      assetType={this.assetType}
                      isNewAsset={isNewAsset}
                      showFixedLayer={showFixedLayer}
                      allConnections={allConnections}
                      assetUserAccessibility={assetUserAccessibility}
                    />
                  </div>
                : null}
              {this.assetType === assetTypes.DASHBOARD
                ? <div
                  style={{
                    display: displayValue,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fafafa',
                    overflowY: 'scroll',
                  }}
                >
                    <GridLines />
                    <DashboardView apiData={data} />
                  </div>
                : null}
              {showRelatedAssetsGraph ? <TreeDiagram apiData={this.data} /> : null}
            </div>

            {/* <ChartView />*/}
            <div styleName={isSideBarOpened ? 'right-sidebar-open' : 'right-sidebar-close'}>
              <RightSideBar
                ref={_ref => {
                  this.rightSideBar = _ref;
                }}
                assetId={assetId}
                isNewAsset={isNewAsset}
                assetDetails={assetDetails}
                showFixedLayer={showFixedLayer}
                assetUserAccessibility={assetUserAccessibility}
                onRelatedAssetsClick={this.handleRelatedAssetsClick}
              />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <h5>
          {message}
        </h5>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    assetDetails,
    assetUserAccessibility,
    connectionSelectionStepDone,
    newAssetNameEntered,
    allConnections,
  } = state.dataAssetView;
  return {
    loggedInUser: state.orgUserVerification.loggedInUser,
    assetDetails,
    assetUserAccessibility,
    connectionSelectionStepDone,
    newAssetNameEntered,
    allConnections,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      expandFiltersAndShowSQLEditor,
      checkAssetUserAccessibility,
      currentAssetId,
      getAssetDetails,
      getLoggedInUserDetails,
      getAllConnectionsForUser,
      uploadAssetFile,
      connectionSelectionStepDoneAction,
      getQueryData,
      getDiscoverabilityScore,
      createChartAsset,
      chartAssetCreationStarted,
    },
    dispatch
  );

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  cssModules(AssetView, styles, { allowMultiple: true })
);
