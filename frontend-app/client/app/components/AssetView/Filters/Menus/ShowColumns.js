import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import { ShowColumnsSubMenu } from '../FilterSubMenu/Columns';
import * as Types from '../types';

const iconNames = {
  string: 'fa fa-font',
  date: 'fa fa-calendar-o',
  timestamp: 'fa fa-calendar-o',
  integer: 'fa fa-hashtag',
};

class ShowColumnsMenus extends Component {
  static propTypes = {
    columnNamesOfAnAsset: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      openMenus: false,
      openSubMenus: null,
      menus: [],
    };
  }

  componentWillReceiveProps(nextProps) {
    const { openMenus, openSubMenus, columnNamesOfAnAsset } = nextProps;
    // console.info(nextProps);
    if (
      (!this.isInvalid(openMenus) ||
        !this.isInvalid(openSubMenus) ||
        !this.isInvalid(columnNamesOfAnAsset)) &&
      openMenus !== this.state.openMenus
    ) {
      this.setState(
        {
          openMenus,
          openSubMenus,
          menus: columnNamesOfAnAsset &&
            Object.keys(columnNamesOfAnAsset).map(key => ({
              text: key,
              active: false,
              dataType: columnNamesOfAnAsset[key],
            })),
          sqlCapability: null,
        },
        () => {
          // console.info(this.state);
        }
      );
    }
  }

  onHover = (event, menuName) => {
    event.nativeEvent.stopImmediatePropagation();
    const openSubMenus = {};
    openSubMenus[menuName] = true;
    if (
      !this.state.openSubMenus ||
      this.state.openSubMenus[menuName] === undefined
    ) {
      this.setState({ openSubMenus });
    }
  };

  onFiltersApplied = data => {
    const { onFilterSelection, onFiltersApplied } = this.props;
    this.setState({ openMenus: false }, () => {
      // console.info(this.state);
    });
    data.filterType = Types.SHOW_COLUMNS;
    onFilterSelection(data);
    onFiltersApplied();
  };

  isInvalid = property => {
    return property === undefined || property === null;
  };

  renderMenus = () => {
    const { columnNamesOfAnAsset } = this.props;
    const { openSubMenus, menus } = this.state;

    if (columnNamesOfAnAsset === undefined || columnNamesOfAnAsset === null) {
      return null;
    }

    return menus.map(menu => (
      <li key={menu.text} onClick={e => this.onHover(e, menu.text)}>
        <a>
          <i
            className={iconNames[menu.dataType.toLowerCase()]}
            style={{ marginRight: 5, color: 'rgb(249, 201, 201)' }}
          />

          {menu.text}
          <i className="icon-arrow-right" styleName={'arrow-right'} />
        </a>
        <div
          key={menu.text}
          styleName={
            openSubMenus && openSubMenus[menu.text]
              ? 'filter-submenus-wrapper-open'
              : 'filter-submenus-wrapper-close'
          }
        >
          <div styleName="filter-submenus">
            <ShowColumnsSubMenu
              columnName={menu.text}
              dataType={columnNamesOfAnAsset[menu.text]}
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

export default cssModules(ShowColumnsMenus, styles);
