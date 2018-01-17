import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import ReactTooltip from 'react-tooltip';
import styles from './tablesExplorer.styl';
import ListWrapper from '../../../common/ListWrapper';
import Collapsible from '../../../common/Collapsible';

const generateRandomId = () => Math.random().toString().slice(3, 10);

class TablesExplorer extends Component {
  static propTypes = {
    dataSource: PropTypes.arrayOf(PropTypes.object),
  };

  static defaultProps = {
    dataSource: ['uencbv', 'asdas', 'mvhsl', 'sadmdsfmsk'],
  };

  constructor(props) {
    super(props);
    this.state = {
      dataList: this.constructDataList(),
    };
  }

  constructDataList() {
    const { dataSource } = this.props;
    return dataSource.map(tableName => ({
      id: generateRandomId(),
      name: tableName,
      selected: false,
    }));
  }

  render() {
    const { styles, ...listWrapperProps } = this.props;
    return (
      <ListWrapper {...listWrapperProps}>
        {this.renderTablesList()}
      </ListWrapper>
    );
  }

  renderColumnNames() {
    const columnNames = ['name', 'gender', 'designation', 'salary'];
    return columnNames.map(columnName => (
      <li styleName="columnname">
        <span>{columnName}</span>
        <i className="fa fa-plus-square-o" data-tip data-for={columnName}>
          <ReactTooltip id={columnName} type="dark" effect="solid" multiline>
            <div style={{ textAlign: 'center' }}>
              Add <span style={{ color: '#f26450' }}>{columnName}</span>
              <br />
              <span style={{ lineHeight: 1.7 }}>
                to SQL Editor
              </span>
            </div>
          </ReactTooltip>
        </i>

      </li>
    ));
  }

  renderTablesList() {
    const { dataList } = this.state;
    return dataList.map(data => (
      <Collapsible
        key={data.id}
        triggerText={data.name}
        style={{
          trigger: {
            backgroundColor: '#fff',
          },
        }}
        renderRightIcon={name => (
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
                <span style={{ lineHeight: 1.7 }}>
                  to SQL Editor
                </span>
              </div>
            </ReactTooltip>
          </i>
        )}
        anchorIconPosition="left"
      >
        <ul styleName="columnnames">
          {this.renderColumnNames()}
        </ul>
      </Collapsible>
    ));
  }
}

export default cssModules(TablesExplorer, styles);
