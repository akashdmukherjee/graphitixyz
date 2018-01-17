import React from 'react';
import cssModules from 'react-css-modules';
import ReactDataGrid from 'react-data-grid';
import styles from './index.styl';

class DataGrid extends React.Component {
  static propTypes = {
    width: React.PropTypes.number,
    height: React.PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.columns = [
      {
        key: 'id',
        name: 'ID',
        locked: true,
      },
      {
        key: 'task',
        name: 'Title',
        sortable: true,
      },
      {
        key: 'priority',
        name: 'Priority',
        sortable: true,
      },
      {
        key: 'issueType',
        name: 'Issue Type',
        sortable: true,
      },
      {
        key: 'complete',
        name: '% Complete',
        sortable: true,
      },
      {
        key: 'startDate',
        name: 'Start Date',
        sortable: true,
      },
      {
        key: 'completeDate',
        name: 'Expected Complete',
        sortable: true,
      },
    ];

    const originalRows = this.createRows(10000);
    const rows = originalRows.slice(0);
    const { width, height } = this.props;
    this.state = {
      originalRows,
      rows,
      width,
      height,
    };

    this.rowGetter = this.rowGetter.bind(this);
    this.handleGridSort = this.handleGridSort.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { width, height } = nextProps;
    if (width && height) {
      this.setState({
        width,
        height,
      });
    }
  }

  getRandomDate(start, end) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    ).toLocaleDateString();
  }

  createRows() {
    const rows = [];
    for (let i = 1; i < 1000; i++) {
      rows.push({
        id: i,
        task: `Task ${i}`,
        complete: Math.min(100, Math.round(Math.random() * 110)),
        priority: ['Critical', 'High', 'Medium', 'Low'][
          Math.floor(Math.random() * 3 + 1)
        ],
        issueType: ['Bug', 'Improvement', 'Epic', 'Story'][
          Math.floor(Math.random() * 3 + 1)
        ],
        startDate: this.getRandomDate(new Date(2015, 3, 1), new Date()),
        completeDate: this.getRandomDate(new Date(), new Date(2016, 0, 1)),
      });
    }

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
    // console.info(`DataGrid width: ${width} height: ${height}`);
    return (
      <div styleName="main-container-wrapper">
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

export default cssModules(DataGrid, styles);
