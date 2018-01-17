import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import MonacoEditor from 'react-monaco-editor';
import styles from './assetCreator.styl';
import DataTable from '../../AssetView/MainContainer/DataTable';
import SQLEditor from '../../common/SQLEditor/SQLEditor';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getTableNamesFromConnector, getQueryData } from '../Api';

const memberId = '7c42ee95-18b0-4018-8720-af8aae5ac519';
const orgId = 'ce24b899-9357-4412-ab29-f0e32cc5b5fd';

class AssetCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      key: Math.random(),
      tableNames: [],
      sqlAssetName: '',
      code: '',
    };
  }

  componentDidMount() {}

  componentWillReceiveProps(nextProps) {
    const { selectedConnection, tableNames, queryData } = nextProps;
    const object = {};
    if (selectedConnection !== this.props.selectedConnection) {
      const data = {
        orgId,
        memberId,
        connectionId: selectedConnection.id,
      };
      this.props.getTableNamesFromConnector(data);
      object.selectedConnection = selectedConnection;
    }
    if (tableNames !== this.props.tableNames) {
      object.tableNames = tableNames;
    }
    if (queryData !== this.props.queryData) {
      object.queryData = queryData;
    }
    this.setState(object);
  }

  renderTableList() {
    const { tableNames } = this.state;
    return (
      <div styleName="table-list">
        <h5>Select Table</h5>
        <ul>
          {tableNames.map(tableName => (
            <li>
              <h5><i className="fa fa-table" />{tableName}</h5>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  onSQLEditorValueChange = code => {
    // console.info(code);
    this.setState({ code });
  };

  onTextChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  onRunClick = () => {
    this.setState({ key: Math.random() });
    this.callGetQueryData(false);
  };

  callGetQueryData = injestDataToCache => {
    const { sqlAssetName, code, selectedConnection } = this.state;
    const data = {
      orgId,
      memberId,
      connectionId: selectedConnection.id,
      injestDataToCache,
      body: {
        sqlAssetName,
        query: code,
      },
    };
    this.props.getQueryData(data);
  };

  onCreateAssetClick = () => {
    this.callGetQueryData(true);
  };

  render() {
    const { key, code, sqlAssetName, queryData } = this.state;
    return (
      <div styleName="asset-creator-wrapper">
        <div styleName="header">
          <button onClick={this.onCreateAssetClick}>Create Asset</button>
          <input
            id="sqlAssetName"
            type="text"
            name="sqlAssetName"
            value={sqlAssetName}
            placeholder="SQL Asset Name"
            onChange={this.onTextChange}
          />
        </div>
        <div styleName="body">
          {this.renderTableList()}
          <div styleName="asset-editor">
            <div styleName="header-btn-wrapper">
              <h5>Write Query</h5>
              <button onClick={this.onRunClick}>
                Run
              </button>
            </div>
            <SQLEditor
              key={key}
              style={{ width: '80%' }}
              value={code}
              onChange={this.onSQLEditorValueChange}
            />
            <div styleName="data-preview">
              {queryData
                ? <DataTable
                  width={400}
                  height={230}
                  getDataResult={queryData}
                />
                : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    selectedConnection: state.dataDiscovery.selectedConnection,
    tableNames: state.dataDiscovery.tableNames,
    queryData: state.dataDiscovery.queryData,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getTableNamesFromConnector,
      getQueryData,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(
  cssModules(AssetCreator, styles)
);
