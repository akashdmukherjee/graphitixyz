import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import ListWrapper from '../../../../common/ListWrapper';
import Field from '../../../../common/Field';
import PlotFieldSubMenu from '../PlotFieldSubMenu';

const iconNames = {
  string: 'fa fa-font',
  date: 'fa fa-calendar-o',
  timestamp: 'fa fa-calendar-o',
  integer: 'fa fa-hashtag',
};

class PlotFieldSelector extends Component {
  static propTypes = {
    columnNamesOfAnAsset: PropTypes.object,
    searchText: PropTypes.string,
    open: PropTypes.bool,
    onItemSelect: PropTypes.func,
  };

  static defaultProps = {
    columnNamesOfAnAsset: {},
    searchText: undefined,
    open: false,
    onItemSelect: () => null,
  };

  constructor(props) {
    super(props);
    const { columnNamesOfAnAsset } = props;
    this.state = {
      columnNamesOfAnAsset,
    };
  }

  render() {
    const { open } = this.props;
    if (!open) return null;
    return (
      <ListWrapper
        open
        showCaret={false}
        style={{
          left: 0,
          width: 150,
          boxShadow: '0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.24)',
        }}
      >
        <ul styleName="PlotFieldSelector-list">
          {this.renderList()}
        </ul>
      </ListWrapper>
    );
  }

  renderList() {
    const { columnNamesOfAnAsset } = this.state;
    const { searchText, onItemSelect } = this.props;
    const columnNames = Object.keys(columnNamesOfAnAsset);
    const pattern = new RegExp(`${searchText}`, 'i');
    const filteredList = columnNames.filter(
      columnName => columnName.match(pattern) !== null
    );
    return filteredList.map(columnName => (
      <div styleName="PlotFieldSelector-item">
        <Field
          text={columnName}
          data={{
            columnName,
            dataType: columnNamesOfAnAsset[columnName].toLowerCase(),
          }}
          hasDropdown={false}
          rightIcon={false}
          style={{
            field: {
              cursor: 'pointer',
            },
          }}
          transformLeftIconName={rowData => iconNames[rowData.dataType]}
          onFieldClick={(e, data) => onItemSelect(data)}
        />
      </div>
    ));
  }
}

export default cssModules(PlotFieldSelector, styles);
