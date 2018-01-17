import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { browserHistory } from 'react-router';
import cssModules from 'react-css-modules';
import Filters from '../Filters/Filters';
import MainContainer from '../MainContainer';
import SQLEditor from '../../common/SQLEditor/SQLEditor';
import styles from './index.styl';
import { getAssetDetails, getQueryData, generateQueryAndGetData } from '../Api';
const propTypes = {
  assetId: PropTypes.string.isRequired,
  isNewAsset: PropTypes.bool.isRequired,
  apiData: PropTypes.object.isRequired,
  isSideBarOpened: PropTypes.bool.isRequired,
  sqlCapability: PropTypes.object,
  normalFilterInfo: PropTypes.object,
  getDataResult: PropTypes.arrayOf(PropTypes.object),
  getAssetDetails: PropTypes.func.isRequired,
  getQueryData: PropTypes.func.isRequired,
  generateQueryAndGetData: PropTypes.func.isRequired,
};

const defaultProps = {
  getDataResult: [],
  sqlCapability: {},
  normalFilterInfo: null,
};

class DataAssetView extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    const { isNewAsset, sqlCapability, isSideBarOpened, apiData } = props;
    this.state = {
      isDirty: false,
      getDataResult: null,
      expandFilters: false,
      sqlCapability: isNewAsset ? null : sqlCapability,
      isSideBarOpened,
    };
    this.data = apiData;
  }

  componentWillReceiveProps(nextProps) {
    // console.info(nextProps);
    const {
      getDataResult,
      sqlCapability,
      uploadedDataSet,
      createdDataSet,
      isSideBarOpened,
      normalFilterInfo,
    } = nextProps;
    const object = {};
    if (isSideBarOpened !== this.props.isSideBarOpened) {
      object.isSideBarOpened = isSideBarOpened;
    }
    if (getDataResult !== this.props.getDataResult) {
      object.getDataResult = getDataResult;
    }
    if (sqlCapability !== this.props.sqlCapability) {
      // console.info('sqlCapability changed:', sqlCapability);
      this.setState({ sqlCapability, isDirty: false }, () => {
        /**
         * if sqlCapability from nextProps !== props sqlCapability
         * call generateQueryAndGetData
         */
        this.onRefreshDataButtonClick();
      });
    }
    if (normalFilterInfo !== this.props.normalFilterInfo) {
      this.setState({ sqlCapability: normalFilterInfo }, () => {
        this.onRefreshDataButtonClick();
      });
    }
    if (uploadedDataSet !== this.props.uploadedDataSet) {
      object.uploadedDataSet = uploadedDataSet;
      const { assetId } = uploadedDataSet;
      // after dataset is created, get asset details
      // and get all data for the created asset
      // and replace the `untitled` path param with created `assetId`
      this.data.assetId = assetId;
      this.props.getAssetDetails({ ...this.data });
      this.onRefreshDataButtonClick();
      browserHistory.replace(`/asset/${assetId}`);
      object.assetId = assetId;
    }
    if (createdDataSet !== this.props.createdDataSet) {
      object.createdDataSet = createdDataSet;
      const { dataSetAssetId } = createdDataSet;
      // after dataset is created, get asset details
      // and get all data for the created asset
      // and replace the `untitled` path param with created `assetId`
      this.data.assetId = dataSetAssetId;
      this.props.getAssetDetails({ ...this.data });
      this.onRefreshDataButtonClick();
      browserHistory.replace(`/asset/${dataSetAssetId}`);
      object.assetId = dataSetAssetId;
    }
    this.setState(object);
  }

  onRefreshDataButtonClick = sqlCapabilityParam => {
    const { sqlCapability } = this.state;
    const assetId = this.data.assetId;
    const newSQLCapability = sqlCapabilityParam || sqlCapability;
    const newSQLCapabilityCopy = { ...newSQLCapability };
    /**
     * this is a temporary solution since backend handles only null
     * not empty arrays so sanitize it from here
     */
    if (
      newSQLCapabilityCopy.filters &&
      newSQLCapabilityCopy.filters.appliedFilters &&
      newSQLCapabilityCopy.filters.appliedFilters.length === 0
    ) {
      newSQLCapabilityCopy.filters = null;
    }
    if (newSQLCapabilityCopy.columnOrders && newSQLCapabilityCopy.columnOrders.length === 0) {
      newSQLCapabilityCopy.columnOrders = null;
    }
    if (
      newSQLCapabilityCopy.selectColumnsAndFunctions &&
      newSQLCapabilityCopy.selectColumnsAndFunctions.length === 0
    ) {
      newSQLCapabilityCopy.selectColumnsAndFunctions = null;
    }
    const apiData = {
      ...this.data,
      assetId,
      isDistinct: false,
      sqlCapability: newSQLCapabilityCopy,
    };
    this.props.generateQueryAndGetData(apiData);
  };

  onFiltersExpand = () => {
    this.setState({ expandFilters: !this.state.expandFilters });
  };

  render() {
    const { isSideBarOpened, getDataResult, isDirty, expandFilters } = this.state;
    const { assetId, isNewAsset, apiData } = this.props;
    return (
      <div styleName="DataAssetView-wrapper">
        <Filters
          assetId={assetId}
          apiData={this.data}
          isNewAsset={isNewAsset}
          onFiltersExpand={this.onFiltersExpand}
          onRefreshData={this.onRefreshDataButtonClick}
        />
        {expandFilters
          ? <div styleName="sql-editor-wrapper">
              <SQLEditor
                style={{
                  width: '98%',
                  height: '95%',
                  margin: 10,
                }}
              />
            </div>
          : null}
        <div styleName={`sql-preview-wrapper ${expandFilters ? 'expand' : ''}`}>
          <div styleName="wrapper">
            <div styleName={`line ${expandFilters ? 'expand' : ''}`} />
            <div styleName={`sql-preview ${expandFilters ? 'expand' : ''}`} />
          </div>
        </div>
        <MainContainer
          apiData={apiData}
          isSideBarOpened={isSideBarOpened}
          getDataResult={getDataResult}
          onRefreshDataButtonClick={this.onRefreshDataButtonClick}
          isDirty={isDirty}
          expandFilters={false}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    uploadedDataSet,
    createdDataSet,
    getDataResult,
    sqlCapability,
    normalFilterInfo,
  } = state.dataAssetView;
  return {
    uploadedDataSet,
    createdDataSet,
    getDataResult,
    sqlCapability,
    normalFilterInfo,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getAssetDetails,
      getQueryData,
      generateQueryAndGetData,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(DataAssetView, styles));
