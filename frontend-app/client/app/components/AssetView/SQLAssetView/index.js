import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { browserHistory } from 'react-router';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import DataConnectionPanel from './DataConnectionPanel';
import DataTable from '../MainContainer/DataTable';
import SQLEditor from '../../common/SQLEditor/SQLEditor';
import Button from '../../common/Button';
import {
  connectionSelectionStepDone as connectionSelectionStepDoneAction,
  newAssetNameEntered as newAssetNameEnteredAction,
  selectedConnection as selectedConnectionAction,
} from './Actions';
import {
  getTableNamesFromConnector,
  getQueryData,
  getSQLAsset,
  getSQLContent,
  updateSQLContent,
  getColumnNamesOfTable,
  getAllConnectionsForUser,
  updateQueryData,
  createRelatedAsset,
  updateRelatedAsset,
  getDataAssets,
  getColumnNamesOfAnAsset,
  getRelatedAssetsData,
} from '../Api';
import DataAssetCreationModal from './DataAssetCreationModal';
import injestionOperationTypes from '../injestionOperationTypes';

// import worker files
// for SQLEditor autocompletion
import workerMessageTypes from '../../common/SQLEditor/workerMessageTypes';

const sourceOptions = {
  GRAPHITI: 'GRAPHITI',
  EXTERNAL: 'EXTERNAL',
};
const assetTypes = {
  SQL: 'SQL',
  DATASET: 'DATASET',
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
const propTypes = {
  assetDetails: PropTypes.object,
  usingInModal: PropTypes.bool,
  apiData: PropTypes.object.isRequired,
  createdSQLAsset: PropTypes.object,
  createdDataSet: PropTypes.object,
  assetType: PropTypes.string.isRequired,
  selectedConnection: PropTypes.object,
  assetId: PropTypes.string.isRequired,
  isNewAsset: PropTypes.bool.isRequired,
  sqlContent: PropTypes.string,
  assetUserAccessibility: PropTypes.object,
  getQueryData: PropTypes.func.isRequired,
  getTableNamesFromConnector: PropTypes.func.isRequired,
  getSQLAsset: PropTypes.func.isRequired,
  getSQLContent: PropTypes.func.isRequired,
  getRelatedAssetsData: PropTypes.func.isRequired,
  updateSQLContent: PropTypes.func.isRequired,
  getAllConnectionsForUser: PropTypes.func.isRequired,
  onSaveClick: PropTypes.func,
};
const defaultProps = {
  assetDetails: defaultAssetDetails,
  usingInModal: false,
  selectedConnection: {},
  createdSQLAsset: {},
  createdDataSet: {},
  assetUserAccessibility: {},
  onSaveClick: () => null,
};

const style = {
  saveAsDataSetButton: {
    margin: 10,
    marginTop: 0,
  },
};

const generateRandomId = () => Math.random().toString().slice(3, 10);
const defaultSql = `SELECT 'abc' as column_2 /*, <column_2>, <column_3>, SUM(<column_4>)*/
/*FROM <table_name>*/
WHERE 1=1 /* AND <column_1> = 'some value'*/`;

class SQLAssetView extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const {
      selectedConnection,
      assetDetails,
      assetUserAccessibility,
      assetId,
      isNewAsset,
      apiData,
    } = props;
    const assetDetailsCopy = isNewAsset ? defaultAssetDetails : assetDetails;
    // use this to force SQLEditor rerender to update its dimensions
    // TODO: Imporove this
    this.defaultSQLEditorKey = generateRandomId();
    this.state = {
      showDataGrid: false,
      sqlCode: isNewAsset ? defaultSql : null,
      key: this.defaultSQLEditorKey,
      ranOnce: false,
      selectedConnection: isNewAsset ? {} : selectedConnection,
      assetDetails: assetDetailsCopy,
      assetId,
      isNewAsset,
      assetUserAccessibility: isNewAsset ? {} : assetUserAccessibility,
      isDirty: false,
      isDirtyDataSet: false,
    };

    this.data = { ...apiData };
    this.selectedSource = sourceOptions.GRAPHITI;
  }

  componentDidMount() {
    if (this.data.memberId) {
      this.callComponentMountApis();
    }

    // call dimensions calculation at last
    // after all of the rendering is done properly
    setTimeout(() => {
      const { width, height } = findDOMNode(this.sqlAssetView).getBoundingClientRect();
      // console.info(width, height);
      this.setState({ width, height });
    }, 0);
  }

  componentWillReceiveProps(nextProps) {
    const {
      selectedConnection,
      queryData,
      assetDetails,
      sqlContent,
      createdSQLAsset,
      accessibleDataAssets,
      relatedAssetsData,
    } = nextProps;
    const object = {};

    if (selectedConnection !== this.props.selectedConnection && selectedConnection.id) {
      object.selectedConnection = selectedConnection;
      this.props.getTableNamesFromConnector({
        ...this.data,
        connectionId: selectedConnection.id,
      });
      this.selectedSource = null;
      window.postMessage(
        { type: workerMessageTypes.CONNECTION_ID, data: selectedConnection.id },
        '*'
      );
    }
    if (queryData !== this.props.queryData) {
      object.queryData = queryData;
      object.showDataGrid = true;
      if (this.state.key === this.defaultSQLEditorKey) {
        object.key = generateRandomId();
      }
    }
    if (assetDetails !== this.props.assetDetails) {
      object.assetDetails = assetDetails;
      this.data.assetId = assetDetails.id;
    }
    if (accessibleDataAssets !== this.props.accessibleDataAssets) {
      object.accessibleDataAssets = accessibleDataAssets;
    }
    if (sqlContent !== this.props.sqlContent) {
      object.sqlCode = sqlContent;
    }
    if (createdSQLAsset !== this.props.createdSQLAsset) {
      if (!createdSQLAsset.sqlAssetId) return;
      this.data.assetId = createdSQLAsset.sqlAssetId;
      browserHistory.replace(`/asset/${this.data.assetId}`);
      this.props.getRelatedAssetsData(this.data);
      object.isNewAsset = false;
      object.isDirtyDataSet = Object.keys(createdSQLAsset).length > 0;
    }
    if (relatedAssetsData !== this.props.relatedAssetsData) {
      // console.info(relatedAssetsData.children, relatedAssetsData.children[0].name);
      /**
       * if there is no outflow or type: 'DATASET'
       * then this sqlAsset has unsaved DataSet and show Save Button
       */
      if (relatedAssetsData && relatedAssetsData.children && relatedAssetsData.children.length) {
        relatedAssetsData.children.forEach(data => {
          object.isDirtyDataSet = true;
          if (data.name === 'outflow') {
            const outflowChildren = data.children;
            outflowChildren.forEach(asset => {
              if (asset.type === 'DATASET') {
                object.isDirtyDataSet = false;
                return;
              }
            });
          }
        });
      } else {
        object.isDirtyDataSet = true;
      }
    }
    this.setState(object, () => {
      // console.info(this.state);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.apiData !== this.props.apiData) {
      this.callComponentMountApis();
    }
  }

  callComponentMountApis() {
    if (!this.props.isNewAsset) {
      this.props.getSQLAsset({ ...this.data });
      this.props.getSQLContent({ ...this.data });
      this.props.getRelatedAssetsData({ ...this.data });
    }
  }

  handleEditorValueChange = sqlCode => {
    this.state.sqlCode = sqlCode;
    if (!this.state.isDirty) {
      this.setState({ isDirty: true });
    }
  };

  // if there's selectedSource then it's Graphiti DataSet
  // so call corresponding API
  handleRunClick = selectedSource => {
    this.selectedSource = selectedSource || this.selectedSource;
    if (this.selectedSource === sourceOptions.GRAPHITI) {
      this.callCreateRelatedAsset(injestionOperationTypes.NO_SQL_NO_DATA);
    } else {
      this.callGetQueryData(injestionOperationTypes.NO_SQL_NO_DATA);
    }
    this.setState({ ranOnce: true });
  };

  handleSaveClick = selectedSource => {
    this.selectedSource = selectedSource || this.selectedSource;
    const { isNewAsset, sqlCode, selectedConnection, ranOnce, isDirty } = this.state;
    const { assetType, onSaveClick } = this.props;
    if (!ranOnce) return;
    const data = {
      ...this.data,
      query: sqlCode,
      connectionId: selectedConnection.id,
    };

    if (assetType === assetTypes.DATASET) {
      onSaveClick(data);
      return;
    }
    if (isNewAsset) {
      if (this.selectedSource === sourceOptions.GRAPHITI) {
        this.callCreateRelatedAsset(injestionOperationTypes.ONLY_SQL);
      } else {
        this.callGetQueryData(injestionOperationTypes.ONLY_SQL);
      }
    } else {
      if (this.selectedSource === sourceOptions.GRAPHITI) {
        this.callUpdateRelatedAsset(injestionOperationTypes.ONLY_SQL);
      } else {
        this.props.updateSQLContent(data);
      }
    }
    if (isDirty) {
      this.setState({ isDirty: false });
    }
  };

  callGetQueryData = operationType => {
    const { sqlCode, selectedConnection, assetDetails } = this.state;
    const data = {
      ...this.data,
      connectionId: selectedConnection.id,
      operationType,
      body: {
        sqlAssetName: assetDetails.name,
        query: sqlCode,
      },
    };
    this.props.getQueryData(data);
  };

  callUpdateQueryData = dataAssetName => {
    const { sqlCode, selectedConnection } = this.state;
    const data = {
      ...this.data,
      connectionId: selectedConnection.id,
      operationType: injestionOperationTypes.ONLY_DATA_ATTACH_TO_SQL,
      body: {
        dataAssetName,
        query: sqlCode,
      },
    };
    this.props.updateQueryData(data);
  };

  callCreateRelatedAsset = operationType => {
    const { sqlCode, assetDetails } = this.state;
    const data = {
      ...this.data,
      operationType,
      body: {
        sqlAssetName: assetDetails.name,
        query: sqlCode,
      },
    };
    this.props.createRelatedAsset(data);
  };

  callUpdateRelatedAsset = (operationType, name) => {
    const { sqlCode } = this.state;
    const data = {
      ...this.data,
      operationType,
      body: {
        query: sqlCode,
      },
    };
    if (name) {
      data.body.dataAssetName = name;
    }
    this.props.updateRelatedAsset(data);
  };

  handleSaveAsDataSet = () => {
    const { assetType } = this.props;
    if (assetType === assetTypes.SQL) {
      this.dataSetAssetCreationModal.toggle();
    }
  };

  handleAssetNameEntered = name => {
    if (this.selectedSource === sourceOptions.GRAPHITI) {
      this.callUpdateRelatedAsset(injestionOperationTypes.ONLY_DATA_ATTACH_TO_SQL, name);
    } else {
      this.callUpdateQueryData(name);
    }
  };

  handleEditorMount = () => {
    const { selectedConnection } = this.state;
    // postMessage connectionId
    window.postMessage(
      { type: workerMessageTypes.CONNECTION_ID, data: selectedConnection.id },
      '*'
    );
  };

  handleDataAssetCreationModalClose = () => {
    this.setState({ isDirtyDataSet: false });
  };

  render() {
    /*eslint-disable*/
    const {
      styles,
      onSaveClick,
      createdSQLAsset,
      createdDataSet,
      accessibleDataAssets,
      ...restProps
    } = this.props;
    /*eslint-enable*/
    const {
      sqlCode,
      width,
      height,
      queryData,
      showDataGrid,
      key,
      openModal,
      isDirty,
      isDirtyDataSet,
    } = this.state;
    const sqlEditorHeight = (showDataGrid ? height / 2 : height) - 64;
    return (
      <div
        styleName="SQLAssetView-wrapper"
        ref={_ref => {
          this.sqlAssetView = _ref;
        }}
      >
        <DataConnectionPanel
          onRunClick={this.handleRunClick}
          onSaveClick={this.handleSaveClick}
          isDirty={isDirty}
          accessibleDataAssets={this.state.accessibleDataAssets}
          {...restProps}
        />
        <SQLEditor
          key={key}
          value={sqlCode}
          apiData={this.data}
          wrapperStyle={{
            width: '98%',
            height: sqlEditorHeight,
            margin: 10,
          }}
          height={sqlEditorHeight}
          onChange={this.handleEditorValueChange}
          onMount={this.handleEditorMount}
        />
        {isDirtyDataSet && showDataGrid
          ? <Button
            styleClassName="btn-fav"
            style={style.saveAsDataSetButton}
            onClick={this.handleSaveAsDataSet}
          >
              Save as DataSet Asset
            </Button>
          : null}
        {showDataGrid
          ? <DataTable width={width} height={height} getDataResult={queryData} />
          : null}
        <DataAssetCreationModal
          ref={_ref => {
            this.dataSetAssetCreationModal = _ref;
          }}
          createdDataSet={createdDataSet}
          onAssetNameEntered={this.handleAssetNameEntered}
          apiData={this.data}
          onClose={this.handleDataAssetCreationModalClose}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    connectionSelectionStepDone,
    assetDetails,
    newAssetNameEntered,
    selectedConnection,
    queryData,
    tableNames,
    sqlAsset,
    sqlContent,
    columnNamesOfTable,
    createdSQLAsset,
    createdDataSet,
    accessibleDataAssets,
    relatedAssetsData,
  } = state.dataAssetView;
  return {
    connectionSelectionStepDone,
    newAssetNameEntered,
    selectedConnection,
    queryData,
    tableNames,
    sqlAsset,
    sqlContent,
    assetDetails,
    columnNamesOfTable,
    createdSQLAsset,
    createdDataSet,
    accessibleDataAssets,
    relatedAssetsData,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      connectionSelectionStepDoneAction,
      newAssetNameEnteredAction,
      selectedConnectionAction,
      getTableNamesFromConnector,
      getQueryData,
      getSQLAsset,
      getSQLContent,
      updateSQLContent,
      getColumnNamesOfTable,
      getAllConnectionsForUser,
      updateQueryData,
      createRelatedAsset,
      updateRelatedAsset,
      getDataAssets,
      getColumnNamesOfAnAsset,
      getRelatedAssetsData,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(SQLAssetView, styles));
