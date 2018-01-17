import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Button from '../../Button';
import EditableList from '../../../common/EditableList';
import TablesExplorer from './TablesExplorer';

const generateRandomId = () => Math.random().toString().slice(3, 10);

class DataSetPanel extends React.Component {
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    const { assetId, apiData } = props;
    this.state = {
      openSchemasList: false,
      openTablesExplorerList: false,
    };
    this.data = { ...apiData, assetId };
  }

  componentDidMount() {}

  render() {
    return (
      <div styleName="DataSetPanel-wrapper">
        {this.renderSchemasList()}
        {this.renderTablesExplorer()}
        <div styleName="action-btns">
          <Button
            styleClassName="btn-down"
            style={{
              marginRight: 5,
            }}
          >
            <i className="fa fa-angle-down" />
          </Button>
          <Button styleClassName="btn-save">
            <i className="fa fa-floppy-o" />
            <span className="bindi">.</span>
          </Button>
        </div>
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
            this.setState({
              openSchemasList: !openSchemasList,
              openTablesExplorerList: false,
            });
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
          headerName="Schemas"
          buttonText="Add"
          caretPosition="left"
          open={openSchemasList}
          hasHeaderInputRow={false}
          style={{
            left: 0,
          }}
          onVisibilityChanged={({ open }) => {
            this.state.openSchemasList = open;
          }}
        />
      </div>
    );
  }

  renderTablesExplorer() {
    const { openTablesExplorerList } = this.state;
    return (
      <div styleName="content">
        <div
          styleName="selector"
          onClick={e => {
            this.setState({
              openTablesExplorerList: !openTablesExplorerList,
              openSchemasList: false,
            });
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
        <TablesExplorer
          open={openTablesExplorerList}
          caretPosition="left"
          style={{
            left: 0,
          }}
          onVisibilityChanged={({ open }) => {
            this.state.openTablesExplorerList = open;
          }}
        />
      </div>
    );
  }
}

export default cssModules(DataSetPanel, styles);
