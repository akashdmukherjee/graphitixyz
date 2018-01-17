import React from 'react';
import ReactDataGrid from 'react-data-grid';
import './index.css';

export default class DataGrid extends React.Component {
  static propTypes = {
    width: React.PropTypes.number,
    height: React.PropTypes.number,
  };

  static defaultProps = {
    width: 100,
    height: 100,
  };

  constructor(props) {
    super(props);
    this.columns = [];
    this.state = {
      originalRows: [],
      rows: [],
      width: props.width,
      height: props.height,
    };

    this.rowGetter = this.rowGetter.bind(this);
    this.handleGridSort = this.handleGridSort.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      const { clientWidth: width, clientHeight: height } = this.dataGrid;
      console.info(width, height);
      this.setState({ width, height }, () => {
        this.setUpGrid();
      });
    }, 0);
  }

  componentWillReceiveProps(nextProps) {
    // const { dataSource } = nextProps;
    // if (dataSource) {
    //   this.setUpGrid(dataSource);
    // }
  }

  setUpGrid = dataSource => {
    // console.info(dataSource);
    let dataResult = dataSource || this.props.dataSource;
    if (!dataSource) {
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
    });
  };

  createRows(dataSource) {
    const rows = [];
    dataSource.forEach(data => {
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

    const rows =
      sortDirection === 'NONE' ? this.state.originalRows.slice(0) : this.state.rows.sort(comparer);

    this.setState({ rows });
  }

  rowGetter(i) {
    return this.state.rows[i];
  }

  render() {
    const { width, height, rows } = this.state;
    // console.info(`DataTable width: ${width} height: ${height}`);
    return (
      <div
        ref={_ref => {
          this.dataGrid = _ref;
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <ReactDataGrid
          onGridSort={this.handleGridSort}
          columns={this.columns}
          rowGetter={this.rowGetter}
          rowsCount={rows.length}
          minWidth={width}
          minHeight={height}
        />
      </div>
    );
  }
}
