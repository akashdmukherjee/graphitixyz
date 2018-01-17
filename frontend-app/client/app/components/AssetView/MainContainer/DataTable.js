import React from 'react';
import cssModules from 'react-css-modules';
import ReactDataGrid from 'react-data-grid';
import styles from './index.styl';

class DataTable extends React.Component {
  static propTypes = {
    width: React.PropTypes.number,
    height: React.PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.columns = [];
    this.state = {
      originalRows: [],
      rows: [],
    };

    this.rowGetter = this.rowGetter.bind(this);
    this.handleGridSort = this.handleGridSort.bind(this);
  }

  componentDidMount() {
    this.setUpGrid(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const { width, height, getDataResult } = nextProps;
    if (width && height && getDataResult) {
      this.setUpGrid(nextProps);
    }
  }

  setUpGrid = ({ getDataResult, width, height }) => {
    // console.info(getDataResult);
    let dataResult = getDataResult;
    if (!getDataResult) {
      dataResult = [];
      this.columns = dataResult;
    } else {
      this.columns = Object.keys(dataResult[0]).map(data => ({
        key: data,
        name: data,
        value: data,
      }));
    }
    const originalRows = this.createRows(dataResult);
    const rows = originalRows.slice(0);
    this.setState({
      originalRows,
      rows,
      width,
      height,
    });
  };

  createRows(getDataResult) {
    const rows = [];
    getDataResult.forEach(data => {
      const row = {};
      Object.keys(data).forEach(key => {
        row[key] = data[key];
      });
      rows.push(row);
    });
    return rows;
  }

  handleGridSort(sortColumn, sortDirection) {
    const comparer = (a, b) => {
      if (sortDirection === 'ASC') {
        return a[sortColumn] > b[sortColumn] ? 1 : -1;
      } else if (sortDirection === 'DESC') {
        return a[sortColumn] < b[sortColumn] ? 1 : -1;
      }
      return 1;
    };

    const rows = sortDirection === 'NONE'
      ? this.state.originalRows.slice(0)
      : this.state.rows.sort(comparer);

    this.setState({ rows });
  }

  rowGetter(i) {
    return this.state.rows[i];
  }

  render() {
    const { width, height, rows } = this.state;
    // console.info(`DataTable width: ${width} height: ${height}`);
    return (
      <div styleName="main-container-wrapper">
        {width && height
          ? <ReactDataGrid
            onGridSort={this.handleGridSort}
            columns={this.columns}
            rowGetter={this.rowGetter}
            rowsCount={rows.length}
            minWidth={width}
            minHeight={height}
          />
          : null}
      </div>
    );
  }
}

export default cssModules(DataTable, styles);
