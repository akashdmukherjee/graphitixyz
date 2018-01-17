import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import Column from './Column';
import styles from './showColumns.styl';
import * as FilterType from '../../types';
import * as SQLFunction from '../../Menus/sqlFunction';

class ShowColumnsSubMenu extends Component {
  static propTypes = {
    columnName: PropTypes.string.isRequired,
    activeMenu: PropTypes.object,
    onSQLFunctionSelect: PropTypes.func,
    onFiltersApplied: PropTypes.func,
    dataType: PropTypes.string,
  };

  static menus = [
    {
      text: 'RAW',
      active: false,
    },
    {
      text: 'MIN',
      active: false,
    },
    {
      text: 'MAX',
      active: false,
    },
    {
      text: 'COUNT',
      active: false,
    },
  ];

  constructor(props) {
    super(props);
    this.state = {
      menus: this.updateMenuList(),
    };
  }

  componentWillReceiveProps(nextProps) {
    // console.info('SM', nextProps);
  }

  onMenuClick = (event, activeMenu) => {
    const { columnName, onFiltersApplied } = this.props;
    /**
     * in case we need to remember the state
     * uncomment the below code
     **/
    // const menus = this.state.menus.map(menu => {
    //   const object = Object.assign({}, menu);
    //   if (menu.text === activeMenu.text) {
    //     object.active = !menu.active;
    //   } else {
    //     object.active = false;
    //   }
    //   return object;
    // });

    // reset menus at its original state after it's applied
    // we dont need to maintain this
    const menus = ShowColumnsSubMenu.menus.slice(0);
    const object = {
      ...activeMenu,
      columnName,
      filterType: FilterType.SHOW_COLUMNS,
    };
    onFiltersApplied(object);
    this.setState({ menus });
  };

  updateMenuList = () => {
    // if there is an activeMenu in props,
    // then update the menus list
    const { activeMenu } = this.props;
    // console.info('activeMenu:', activeMenu);
    const constructedMenus = this.constructMenuList();
    if (!activeMenu) return constructedMenus;
    const updatedMenus = constructedMenus.map(menu => {
      return menu.text === activeMenu.criteria ||
        (menu.text === 'RAW' && activeMenu.criteria === SQLFunction.NULL) // handle case where RAW is SQLFunction.NULL
        ? { ...menu, active: true }
        : menu;
    });
    return updatedMenus;
  };

  constructMenuList = () => {
    const { dataType } = this.props;
    let menuList = ShowColumnsSubMenu.menus;
    if (
      dataType &&
      dataType.toLowerCase() !== 'string' &&
      dataType.toLowerCase() !== 'date' &&
      dataType.toLowerCase() !== 'timestamp'
    ) {
      menuList = menuList.concat([
        {
          text: 'AVG',
          active: false,
        },
        {
          text: 'SUM',
          active: false,
        },
      ]);
    }
    return menuList;
  };

  renderMenus = () => {
    return this.state.menus.map(menu => (
      <Column {...menu} key={menu.text} onClick={this.onMenuClick} />
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

export default cssModules(ShowColumnsSubMenu, styles);
