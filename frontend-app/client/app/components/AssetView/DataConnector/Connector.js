import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import Select from '../../common/Select';
import styles from './connector.styl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { testDatabaseConnection, saveDatabaseConnection, updateDatabaseConnection } from '../Api';
import { selectedConnection as selectedConnectionAction } from './Actions';

const defaultPassword = 'GRAPHITI-DEFAULT';
const dbTypes = {
  MYSQL: 'MYSQL',
  POSTGRES: 'POSTGRESQL',
  ORACLE: 'ORACLEDB',
};

const propTypes = {
  apiData: PropTypes.object,
  connectionName: PropTypes.string,
  selectedConnection: PropTypes.object,
};

const defaultProps = {
  connectionName: '',
  selectedConnection: {
    connectionName: '',
    databaseType: dbTypes.MYSQL,
  },
};

class Connector extends React.Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const { apiData, connectionName, selectedConnection } = this.props;
    this.state = {
      selectedConnection: {
        ...selectedConnection,
        connectionName,
      },
      isDirty: false,
      statusOfConnectionCheck: null,
      selectItems: this.constructSelectItems(selectedConnection),
    };
    this.data = apiData;
  }

  componentWillReceiveProps(nextProps) {
    const {
      allConnections,
      statusOfConnectionCheck,
      connectionName,
      selectedConnection,
    } = nextProps;
    const object = {};
    if (allConnections !== this.props.allConnections) {
      object.allConnections = allConnections;
    }
    if (statusOfConnectionCheck !== this.props.statusOfConnectionCheck) {
      object.statusOfConnectionCheck = statusOfConnectionCheck;
    }
    if (connectionName !== this.props.connectionName) {
      object.selectedConnection = {
        ...this.state.selectedConnection,
        connectionName,
      };
    }
    if (selectedConnection !== this.props.selectedConnection) {
      object.selectedConnection = selectedConnection;
      object.selectItems = this.constructSelectItems(selectedConnection);
      this.props.onSaveConnection(selectedConnection);
    }
    this.setState(object);
  }

  constructSelectItems = selectedConnection => {
    /**
     * dbTypes has different KEY and VALUE
     * just for formatting
     * we need to manipulate this to decide which one to show as text
     * and which one goes to backend
     */
    const selectedDBType = selectedConnection.databaseType;
    const dbTypesKeys = Object.keys(dbTypes);
    const matchIndex = dbTypesKeys.findIndex(key => dbTypes[key] === selectedDBType);
    let selectItems = dbTypesKeys
      .map(dbName => ({
        text: dbName,
      }))
      .slice(0);
    if (matchIndex !== -1) {
      selectItems.splice(matchIndex, 1);
      const dbKey = dbTypesKeys.find(key => dbTypes[key] === selectedDBType);
      selectItems = [{ text: dbKey }, ...selectItems];
    }
    return selectItems;
  };

  onTextChange = event => {
    const targetName = event.target.name;
    const targetValue = event.target.value;
    const { selectedConnection } = this.state;
    // console.log(targetName, targetValue);
    let isDirty = false;
    if (selectedConnection.id) {
      isDirty = true;
    }
    this.setState({
      selectedConnection: {
        ...selectedConnection,
        [targetName]: targetValue,
      },
      isDirty,
    });
  };

  onConnectClick = () => {
    const connectionDetailsObject = this.state.selectedConnection;
    // If there is no change in password then dont send anything
    if (connectionDetailsObject.password === defaultPassword) {
      connectionDetailsObject.password = null;
    }
    const data = {
      ...this.data,
      connectionDetailsObject,
    };
    this.props.testDatabaseConnection(data);
  };

  onDoneClick = () => {
    const { selectedConnection: connectionDetailsObject, isDirty } = this.state;
    const data = {
      ...this.data,
      connectionDetailsObject,
    };
    if (isDirty) {
      data.connectionDetailsObject.password = defaultPassword;
      this.props.updateDatabaseConnection(data);
    } else if (
      (connectionDetailsObject.id && !connectionDetailsObject.id.length) ||
      !connectionDetailsObject.id
    ) {
      this.props.saveDatabaseConnection(data);
    }
    this.props.selectedConnectionAction(connectionDetailsObject);
    this.props.onConnectClick();
  };

  handleDBTypeSelect = data => {
    const { selectedConnection } = this.state;
    // console.info(data);
    const newSelectedConnection = {
      ...selectedConnection,
      databaseType: dbTypes[data.text],
    };
    this.setState({ selectedConnection: newSelectedConnection });
  };

  renderDBTypes = () => {
    const { selectItems } = this.state;
    return <Select items={selectItems} onOptionSelect={this.handleDBTypeSelect} />;
  };

  renderConnectionStatus() {
    const { statusOfConnectionCheck } = this.state;
    if (statusOfConnectionCheck === null || statusOfConnectionCheck === undefined) {
      return null;
    }
    return (
      <small
        styleName="connection-status"
        style={{
          color: statusOfConnectionCheck ? '#00b8a9' : '#f6416c',
        }}
      >
        {`Connection is ${statusOfConnectionCheck ? 'Valid' : 'Invalid'}`}
      </small>
    );
  }

  render() {
    const { selectedConnection, isDirty } = this.state;
    return (
      <div styleName="Data-connector">
        <form
          onSubmit={event => {
            event.preventDefault();
            return false;
          }}
        >
          <label>
            <span>Type</span>
            {this.renderDBTypes()}
          </label>
          <label>
            <span>Name</span>

            <input
              type="text"
              name="connectionName"
              onChange={this.onTextChange}
              value={selectedConnection.connectionName}
            />
          </label>
          <div>
            <label>
              <span>Host</span>

              <input
                type="text"
                name="serverUrl"
                value={selectedConnection.serverUrl}
                onChange={this.onTextChange}
              />
            </label>
            <label>
              <span>Port</span>

              <input
                type="text"
                name="port"
                onChange={this.onTextChange}
                value={selectedConnection.port}
              />
            </label>
          </div>
          <label>
            <span>User</span>

            <input
              type="text"
              name="username"
              onChange={this.onTextChange}
              value={selectedConnection.username}
            />
          </label>
          <label>
            <span>Password</span>

            <input
              type="password"
              name="password"
              onChange={this.onTextChange}
              value={selectedConnection.password}
            />
          </label>
          <label>
            <span>Database</span>

            <input
              type="text"
              name="databaseName"
              onChange={this.onTextChange}
              value={selectedConnection.databaseName}
            />
          </label>
          <div styleName="btn-wrapper">
            {/* <button styleName="cancel" onClick={onCancelClick}>Cancel</button>*/}
            <button styleName="submit" type="submit" onClick={this.onDoneClick}>
              {isDirty ? 'Update' : 'Save'}
            </button>
            <button styleName="submit" type="submit" onClick={this.onConnectClick}>
              Test Connection
            </button>
            {this.renderConnectionStatus()}
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { statusOfConnectionCheck } = state.dataAssetView;
  return {
    statusOfConnectionCheck,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      testDatabaseConnection,
      saveDatabaseConnection,
      updateDatabaseConnection,
      selectedConnectionAction,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Connector, styles));
