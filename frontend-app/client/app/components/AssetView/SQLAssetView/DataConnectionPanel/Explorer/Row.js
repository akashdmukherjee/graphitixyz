import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import ReactTooltip from 'react-tooltip';
import styles from './row.styl';
import Collapsible from '../../../../common/Collapsible';

const propTypes = {
  open: PropTypes.bool,
  data: PropTypes.object.isRequired,
  columnNamesOfTable: PropTypes.object,
  columnNamesOfAnAsset: PropTypes.object,
  onClick: PropTypes.func.isRequired,
};

const defaultProps = {
  open: false,
  columnNamesOfTable: {
    tableName: '',
    columnNames: [],
  },
  columnNamesOfAnAsset: {},
};

class Row extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const { open, columnNamesOfTable, columnNamesOfAnAsset } = props;
    this.state = {
      open,
      columnNamesOfTable,
      columnNamesOfAnAsset,
      isLoading: false,
    };
  }

  componentDidMount() {
    const { open, data, onClick } = this.props;
    if (open) {
      onClick(data);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { columnNamesOfTable, columnNamesOfAnAsset } = nextProps;
    const stateObject = {};
    if (columnNamesOfTable !== this.props.columnNamesOfTable) {
      this.setState({
        columnNamesOfTable,
        open: columnNamesOfTable.tableName.match(this.props.data.name) !== null,
        isLoading: false,
      });
    }
    if (columnNamesOfAnAsset !== this.props.columnNamesOfAnAsset) {
      this.setState({
        columnNamesOfAnAsset,
        isLoading: false,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { isLoading, open, columnNamesOfTable } = this.state;
    if (
      isLoading !== nextState.isLoading ||
      open !== nextState.open ||
      columnNamesOfTable !== nextState.columnNamesOfTable
    ) {
      return true;
    }
    return false;
  }

  handleTableNameClick = () => {
    // console.info(name);
    const { data, columnNamesOfTable, onClick } = this.props;
    onClick(data);
    this.setState({
      isLoading: columnNamesOfTable.tableName.match(data.name) === null,
    });
  };

  renderColumnNames() {
    const { columnNamesOfTable, columnNamesOfAnAsset } = this.state;
    let columnNames = columnNamesOfTable.columnNames;
    if (columnNamesOfAnAsset && Object.keys(columnNamesOfAnAsset).length) {
      columnNames = Object.keys(columnNamesOfAnAsset);
    }
    return columnNames.map(columnName =>
      <li styleName="columnname">
        <span>
          {columnName}
        </span>
        <i className="fa fa-plus-square-o" data-tip data-for={columnName}>
          <ReactTooltip id={columnName} type="dark" effect="solid" multiline>
            <div style={{ textAlign: 'center' }}>
              Add <span style={{ color: '#f26450' }}>{columnName}</span>
              <br />
              <span style={{ lineHeight: 1.7 }}>to SQL Editor</span>
            </div>
          </ReactTooltip>
        </i>
      </li>
    );
  }

  render() {
    const { open, isLoading } = this.state;
    const { data } = this.props;
    return (
      <Collapsible
        isOpen={open}
        triggerText={data.name}
        style={{
          trigger: {
            backgroundColor: '#fff',
          },
        }}
        renderRightIcon={name =>
          <i
            className="fa fa-plus-square-o"
            styleName="Collapsible-right-icon"
            data-tip
            data-for={name}
            style={{
              position: 'absolute',
              right: 10,
            }}
          >
            <ReactTooltip id={name} type="dark" effect="solid" multiline>
              <div style={{ textAlign: 'center' }}>
                Add <span style={{ color: '#f26450' }}>{name}</span>
                <br />
                <span style={{ lineHeight: 1.7 }}>to SQL Editor</span>
              </div>
            </ReactTooltip>
          </i>}
        anchorIconPosition="left"
        onClick={this.handleTableNameClick}
      >
        {isLoading
          ? <h5 styleName="loading">Loading...</h5>
          : <ul styleName="columnnames">
              {this.renderColumnNames(data.name)}
            </ul>}
      </Collapsible>
    );
  }
}

const mapStateToProps = state => ({
  columnNamesOfTable: state.dataAssetView.columnNamesOfTable,
  columnNamesOfAnAsset: state.dataAssetView.columnNamesOfAnAsset,
});

export default connect(mapStateToProps)(cssModules(Row, styles));
