import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import Column from './Column';
import styles from './showColumns.styl';
import * as FilterType from '../../types';

class SortBySubMenu extends Component {
  static menus = [
    {
      text: 'ASC',
      active: false,
    },
    {
      text: 'DESC',
      active: false,
    },
  ];

  static propTypes = {
    activeMenu: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      menus: this.updateMenuList(),
      resetMenus: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { resetMenus } = nextProps;
    if (resetMenus !== undefined && resetMenus === null) {
      this.setState({ resetMenus });
    }
  }

  onMenuClick = (event, activeMenu) => {
    const { columnName, onFiltersApplied } = this.props;
    // const menus = this.state.menus.map(menu => {
    //   const object = Object.assign({}, menu);
    //   if (object.text === activeMenu.text) {
    //     object.active = !object.active;
    //   } else {
    //     object.active = false;
    //   }
    //   return object;
    // });

    const menus = SortBySubMenu.menus.slice(0);
    const object = {
      ...activeMenu,
      columnName,
      filterType: FilterType.SORT_BY,
    };
    onFiltersApplied(object);
    this.setState({ menus });
  };

  updateMenuList = () => {
    const { activeMenu } = this.props;
    const constructedMenus = SortBySubMenu.menus;
    if (!activeMenu) return constructedMenus;
    return constructedMenus.map(
      menu =>
        (menu.text === activeMenu.criteria ? { ...menu, active: true } : menu)
    );
  };

  resetMenus = () => {
    const { resetMenus, menus } = this.state;
    if (resetMenus) {
      this.setState({ menus: menus.map(menu => ({ ...menu, active: false })) });
    }
  };

  renderMenus = () => {
    return this.state.menus.map(menu => (
      <Column key={menu.text} {...menu} onClick={this.onMenuClick} />
    ));
  };

  render() {
    const { columnName } = this.props;
    return (
      <div styleName="submenu-wrapper">
        <div styleName="label-wrapper">
          <h5>View Of: <span>{columnName}</span></h5>
        </div>
        {this.renderMenus()}
      </div>
    );
  }
}

export default cssModules(SortBySubMenu, styles);
