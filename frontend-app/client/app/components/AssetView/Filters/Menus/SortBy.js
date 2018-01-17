import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import { SortBySubMenu } from '../FilterSubMenu/Columns';
import * as Types from '../types';

class SortByMenus extends Component {
  constructor(props) {
    super(props);
    const { columnNamesOfAnAsset, filterTags } = props;
    this.state = {
      openMenus: false,
      openSubMenus: null,
      menus: [],
      filterTags,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { openMenus, openSubMenus, columnNamesOfAnAsset } = nextProps;
    if (
      (!this.isInvalid(openMenus) ||
        !this.isInvalid(openSubMenus) ||
        !this.isInvalid(columnNamesOfAnAsset)) &&
      openMenus !== this.state.openMenus
    ) {
      this.setState({
        openMenus,
        openSubMenus,
        menus: this.constructMenus(),
      });
    }
  }

  constructMenus = () => {
    const { columnNamesOfAnAsset, filterTags } = this.props;
    if (columnNamesOfAnAsset && filterTags) {
      const menus = Object.keys(columnNamesOfAnAsset).map(key => {
        const index = filterTags.findIndex(
          filterTag => filterTag.columnName === key
        );
        const object = {
          text: key,
          active: false,
        };
        if (index !== -1) {
          object.active = true;
        }
        return object;
      });
      return menus;
    }
    return [];
  };

  onMenuClick = (event, menuName) => {
    event.nativeEvent.stopImmediatePropagation();
    const { openSubMenus, menus } = this.state;
    const object = {};
    // object.menus = menus.map(menu => ({ ...menu, active: menu.text === menuName }));
    if (!openSubMenus || openSubMenus[menuName] === undefined) {
      object.openSubMenus = {};
      object.openSubMenus[menuName] = true;
    }
    this.setState(object);
  };

  onFiltersApplied = data => {
    // console.info(data);
    const { onFiltersApplied, onFilterSelection } = this.props;
    this.setState({ openMenus: false }, () => {
      // console.info(this.state);
    });
    data.filterType = Types.SORT_BY;
    onFilterSelection(data);
    onFiltersApplied();
  };

  isInvalid = property => {
    return property === undefined || property === null;
  };

  renderMenus = () => {
    const { openSubMenus, menus } = this.state;
    // console.info(menus);
    return menus.map(menu => (
      <li
        key={menu.text}
        onClick={e => {
          !menu.active && this.onMenuClick(e, menu.text);
        }}
        styleName={menu.active ? 'menu-disabled' : null}
      >
        <a>
          {menu.text}
          <i className="icon-arrow-right" styleName={'arrow-right'} />
        </a>
        <div
          styleName={
            openSubMenus && openSubMenus[menu.text]
              ? 'filter-submenus-wrapper-open'
              : 'filter-submenus-wrapper-close'
          }
        >
          <div styleName="filter-submenus">
            <SortBySubMenu
              columnName={menu.text}
              onFiltersApplied={this.onFiltersApplied}
            />
          </div>
        </div>
      </li>
    ));
  };

  render() {
    const { openMenus } = this.state;
    return (
      <div
        styleName={
          openMenus ? 'filter-menus-wrapper-open' : 'filter-menus-wrapper-close'
        }
      >
        <ul styleName="filter-menus">
          {this.renderMenus()}
        </ul>
      </div>
    );
  }
}

export default cssModules(SortByMenus, styles);
