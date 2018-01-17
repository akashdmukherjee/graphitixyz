import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Button from '../../Button';
import EditableList from '../../../common/EditableList';
import Modal from '../../../common/Modal';
import Explorer from './Explorer';
import { Connector } from '../../DataConnector';
import ConnectionsPopUp from './ConnectionsPopUp';

const assetTypes = {
  SQL: 'SQL',
  DATASET: 'DATASET',
};

const sourceOptions = {
  GRAPHITI: 'GRAPHITI',
  EXTERNAL: 'EXTERNAL',
};

const propTypes = {
  apiData: PropTypes.object.isRequired,
  showFixedLayer: PropTypes.bool.isRequired,
  usingInModal: PropTypes.bool.isRequired,
  isDirty: PropTypes.bool.isRequired,
  isNewAsset: PropTypes.bool.isRequired,
  assetType: PropTypes.string.isRequired,
  assetId: PropTypes.string.isRequired,
  newAssetNameEntered: PropTypes.bool,
  sqlAsset: PropTypes.object,
  connectionSelectionStepDone: PropTypes.bool,
  tableNames: PropTypes.arrayOf(PropTypes.string),
  allConnections: PropTypes.arrayOf(PropTypes.object),
  accessibleDataAssets: PropTypes.arrayOf(PropTypes.object),
  connectionSelectionStepDoneAction: PropTypes.func,
  onRunClick: PropTypes.func,
  onSaveClick: PropTypes.func,
  onSwitchClick: PropTypes.func,
  onSourceSelection: PropTypes.func,
  selectedConnectionAction: PropTypes.func.isRequired,
};
const defaultProps = {
  allConnections: [],
  accessibleDataAssets: [],
  tableNames: [],
  sqlAsset: null,
  connectionSelectionStepDoneAction: () => null,
  onRunClick: () => null,
  onSaveClick: () => null,
  onSourceSelection: null,
};

const editableListStyle = {
  left: 0,
  top: 70,
};

class DataConnectionPanel extends React.Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    const {
      showFixedLayer,
      allConnections,
      tableNames,
      selectedConnection,
      assetId,
      isNewAsset,
      apiData,
      accessibleDataAssets,
      isDirty,
    } = props;

    this.selectedSource = isNewAsset ? null : sourceOptions.GRAPHITI;

    this.state = {
      openSchemasList: false,
      openTablesExplorerList: false,
      showFixedLayer,
      openDataConnectorModal: false,
      allConnections: isNewAsset ? [] : allConnections,
      isDirty,
      tableNames: isNewAsset ? [] : tableNames,
      selectedConnection: isNewAsset ? {} : selectedConnection,
      assetId,
      ranOnce: false,
      selectedSource: this.selectedSource,
      accessibleDataAssets,
    };
    this.data = apiData;
    this.connectionName = '';
  }

  componentDidMount() {
    this.callAPIs();
    const { isNewAsset, showFixedLayer } = this.props;
    if (isNewAsset && showFixedLayer) {
      setTimeout(() => {
        this.connectionsList.show();
      }, 0);
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      connectionSelectionStepDone,
      allConnections,
      newAssetNameEntered,
      tableNames,
      sqlAsset,
      selectedConnection,
      assetId,
      accessibleDataAssets,
      isDirty,
    } = nextProps;
    const object = {};
    if (allConnections !== this.props.allConnections) {
      object.allConnections = allConnections;
      if (this.props.sqlAsset) {
        this.props.selectedConnectionAction(
          allConnections.find(connection => connection.id === sqlAsset.connectionId)
        );
      }
    }
    if (connectionSelectionStepDone !== this.props.connectionSelectionStepDone) {
      object.connectionSelectionStepDone = connectionSelectionStepDone;
      this.connectionsList.hide();
    }
    if (newAssetNameEntered !== this.props.newAssetNameEntered) {
      object.newAssetNameEntered = newAssetNameEntered;
      this.connectionsList.hide();
    }
    if (tableNames !== this.props.tableNames) {
      object.tableNames = tableNames;
    }
    if (sqlAsset !== this.props.sqlAsset) {
      object.sqlAsset = sqlAsset;
      if (this.props.allConnections) {
        this.props.selectedConnectionAction(
          allConnections.find(connection => connection.id === sqlAsset.connectionId)
        );
      }
    }
    if (selectedConnection !== this.props.selectedConnection) {
      object.selectedConnection = selectedConnection;
      if (selectedConnection && Object.keys(selectedConnection).length) {
        this.selectedSource = sourceOptions.EXTERNAL;
        object.selectedSource = sourceOptions.EXTERNAL;
      } else {
        this.selectedSource = sourceOptions.GRAPHITI;
        object.selectedSource = sourceOptions.GRAPHITI;
      }
    }
    if (assetId !== this.props.assetId) {
      object.assetId = assetId;
    }
    if (accessibleDataAssets !== this.props.accessibleDataAssets) {
      object.accessibleDataAssets = accessibleDataAssets;
    }
    if (isDirty !== this.props.isDirty) {
      object.isDirty = isDirty;
    }
    this.setState(object);
  }

  callAPIs() {
    // we need to check which source has
    // been selected and call this
    // according to the selected source
    // i.e GRAPhiti DataSets or External source
    if (this.selectedSource === null || this.selectedSource === sourceOptions.GRAPHITI) {
      this.props.getDataAssets({ ...this.data });
    }
    this.props.getAllConnectionsForUser({ ...this.data });
  }

  handleHeaderButtonClick = itemData => {
    this.connectionName = itemData.name;
    this.setState({ openDataConnectorModal: true });
  };

  handleSwitchClick = itemData => {
    const { showFixedLayer } = this.state;
    const { onSwitchClick } = this.props;
    this.connectionsList.toggle();
    this.props.selectedConnectionAction(itemData);
    if (onSwitchClick) {
      onSwitchClick();
      return;
    }
    if (showFixedLayer) {
      this.props.connectionSelectionStepDoneAction(true);
    }
  };

  handleSaveClick = () => {
    const { onSaveClick } = this.props;
    onSaveClick(this.selectedSource);
    this.setState({ isDirty: false });
  };

  onDataConnectorCancelClick = () => {
    this.setState({ openDataConnectorModal: false });
  };

  onDataConnectorConnectClick = () => {
    const { connectionSelectionStepDoneAction } = this.props;
    connectionSelectionStepDoneAction(true);
    this.setState({
      openDataConnectorModal: false,
    });
  };

  handleEditConnectionClick = itemData => {
    // console.info(itemData);
    this.setState({
      selectedConnection: itemData,
      openDataConnectorModal: true,
    });
  };

  handleGetColumnNames = clickedData => {
    const { selectedConnection, selectedSource } = this.state;
    const { name } = clickedData;
    const data = {
      ...this.data,
      connectionId: selectedConnection.id,
      tableName: name,
    };
    const isExternalSourceActive = selectedSource === sourceOptions.EXTERNAL;
    if (isExternalSourceActive) {
      this.props.getColumnNamesOfTable(data);
    } else {
      data.assetId = clickedData.id;
      this.props.getColumnNamesOfAnAsset(data);
    }
  };

  handleRunClick = () => {
    const { onRunClick } = this.props;
    onRunClick(this.selectedSource);
    this.setState({ ranOnce: true });
  };

  handleConnectionListSourceSelection = selectedOption => {
    this.connectionsList.hide();
    const { onSourceSelection, usingInModal } = this.props;
    // it's opened using normal create sqlAsset
    if (!!usingInModal === false) {
      this.props.connectionSelectionStepDoneAction(true);
    } else {
      if (onSourceSelection) {
        onSourceSelection(selectedOption);
      }
    }
    this.selectedSource = selectedOption;
  };

  handleConnectionSaveClick = selectedConnection => {
    if (selectedConnection.id === null || selectedConnection.id === undefined) return;
    const allConnections = [...this.state.allConnections, selectedConnection];
    this.setState({ allConnections });
  };

  render() {
    const { isNewAsset, assetType } = this.props;
    return (
      <div styleName="connection-panel-wrapper">
        {this.renderConnectionsList()}
        {this.renderTablesExplorer()}
        <div styleName="action-btns">
          <Button styleClassName="btn-run" text="Run" onClick={this.handleRunClick}>
            <i className="fa fa-play" />
          </Button>
          {isNewAsset && assetType === assetTypes.DATASET
            ? null
            : <Button
              styleClassName="btn-down"
              style={{
                marginRight: 5,
              }}
            >
                <i className="fa fa-table" />
              </Button>}
          {this.renderSaveButton()}
        </div>
        {this.renderDataConnectorModal()}
      </div>
    );
  }

  renderSaveButton() {
    const { ranOnce, isDirty } = this.state;
    const { isNewAsset, assetType } = this.props;
    return isNewAsset && assetType === assetTypes.DATASET
      ? <Button
        styleClassName={`btn-save-dataset${ranOnce ? '-active' : ''}`}
        onClick={this.handleSaveClick}
      >
          Save as DataSet
        </Button>
      : <Button styleClassName="btn-save" onClick={this.handleSaveClick}>
          <i className="fa fa-floppy-o" />
          {isDirty ? <span className="bindi">.</span> : null}
        </Button>;
  }

  renderConnectionsList() {
    const {
      showFixedLayer,
      allConnections,
      connectionSelectionStepDone,
      selectedConnection,
      selectedSource,
    } = this.state;
    const { isNewAsset } = this.props;
    let dataSource;
    if (isNewAsset) {
      dataSource = allConnections.slice(0);
      if (selectedConnection) {
        dataSource = dataSource.map(connection => {
          if (connection.id === selectedConnection.id) {
            return { ...connection, selected: true };
          }
          return { ...connection, selected: false };
        });
      }
    } else {
      dataSource = [{ ...selectedConnection, selected: true }];
    }

    return (
      <div styleName="content">
        <ConnectionsPopUp
          ref={_ref => {
            this.connectionsList = _ref;
          }}
          label="Connection"
          activeSource={selectedSource}
          triggerData={{
            showFixedLayer,
            connectionSelectionStepDone,
          }}
          isNewAsset={isNewAsset}
          headerName="Connections"
          buttonText="Add"
          caretPosition="left"
          dataSource={dataSource}
          hasHeaderInputRow={isNewAsset}
          style={editableListStyle}
          onHeaderButtonClick={this.handleHeaderButtonClick}
          transformDynamicListItemLabel={itemData => itemData.connectionName}
          onSwitchClick={this.handleSwitchClick}
          onEditItemClick={this.handleEditConnectionClick}
          onSourceSelection={this.handleConnectionListSourceSelection}
        />
      </div>
    );
  }

  renderSchemasList() {
    const { openSchemasList } = this.state;
    return (
      <div styleName="content">
        <div
          styleName="selector"
          onClick={e => {
            this.tablesExplorerList.tablesExplorer.hide();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          <div styleName="text-icons">
            <h5 styleName="label" style={{ paddingLeft: 10 }}>
              Schema
            </h5>
            <i className="icon-arrow-down" />
          </div>
        </div>

        <EditableList
          ref={_ref => {
            this.schemasList = _ref;
          }}
          headerName="Schemas"
          buttonText="Add"
          caretPosition="left"
          open={openSchemasList}
          hasHeaderInputRow={false}
          style={{
            left: 0,
          }}
        />
      </div>
    );
  }

  renderTablesExplorer() {
    const { openTablesExplorerList, tableNames, selectedSource, accessibleDataAssets } = this.state;
    const isExternalSourceActive = selectedSource === sourceOptions.EXTERNAL;
    let dataSource = [];
    if (isExternalSourceActive) {
      dataSource = tableNames;
    } else {
      dataSource = accessibleDataAssets;
    }

    return (
      <div styleName="content">
        <div
          styleName="selector"
          onClick={e => {
            this.tablesExplorerList.tablesExplorer.toggle();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          <div styleName="text-icons">
            <h5 styleName="label" style={{ paddingLeft: 10 }}>
              Explore Tables
            </h5>
            <i className="icon-arrow-down" />
          </div>
        </div>
        <Explorer
          ref={_ref => {
            this.tablesExplorerList = _ref;
          }}
          open={openTablesExplorerList}
          caretPosition="left"
          dataSource={dataSource}
          style={{
            left: 0,
          }}
          onClick={this.handleGetColumnNames}
        />
      </div>
    );
  }

  renderDataConnectorModal = () => {
    const { openDataConnectorModal, selectedConnection } = this.state;
    /*eslint-disable*/
    const { styles, selectedConnection: propsSelectedConnection, ...connectorProps } = this.props;
    /*eslint-enable*/
    return (
      <Modal
        open={openDataConnectorModal}
        onClose={() => this.setState({ openDataConnectorModal: false })}
        modalName="Data Connector"
        header="New Connection"
      >
        <Connector
          connectionName={this.connectionName}
          selectedConnection={selectedConnection}
          {...connectorProps}
          onConnectClick={this.onDataConnectorConnectClick}
          onSaveConnection={this.handleConnectionSaveClick}
        />
      </Modal>
    );
  };
}

export default cssModules(DataConnectionPanel, styles);
