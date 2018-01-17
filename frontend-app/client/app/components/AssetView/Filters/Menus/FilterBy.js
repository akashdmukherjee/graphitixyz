import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import { StringFilterBy, DateFilterBy, NumericFilterBy } from '../FilterSubMenu';
import * as Types from '../types';
import * as SQLFunction from './sqlFunction';
import constructAppliedFilters from '../constructAppliedFilters';

const generateRandomId = () => Math.random().toString().slice(3, 10);

class FilterByMenus extends Component {
  static propTypes = {
    getUniqueValuesOfColumnName: PropTypes.func.isRequired,
    onFiltersApplied: PropTypes.func.isRequired,
    onFilterSelection: PropTypes.func,
    columnNamesOfAnAsset: PropTypes.object,
    uniqueValuesOfColumnName: PropTypes.object,
    sqlCapability: PropTypes.object,
    filterName: PropTypes.string,
    apiData: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const { sqlCapability, columnNamesOfAnAsset } = props;
    this.state = {
      openMenus: false,
      openSubMenus: null,
      currentFilter: null,
      appliedFilters: null,
      appliedConditionals: {},
      sqlCapability,
      uniqueValuesOfColumnName: props.uniqueValuesOfColumnName,
      menus: this.constructMenus(columnNamesOfAnAsset),
    };
  }

  componentWillReceiveProps(nextProps) {
    /**
     * TODO: refactor, loggedInUser/assetId may be null
     * handle here
     */
    const {
      openMenus,
      openSubMenus,
      removedTagLabel,
      uniqueValuesOfColumnName,
      columnNamesOfAnAsset,
      sqlCapability,
    } = nextProps;
    const object = {};
    if (!this.isInvalid(openMenus)) {
      object.openMenus = openMenus;
    }
    if (!this.isInvalid(openSubMenus)) {
      object.openSubMenus = openSubMenus;
    }
    if (!this.isInvalid(removedTagLabel)) {
      // object.removedTagLabel = removedTagLabel;
      this.refreshAppliedConditionals(removedTagLabel);
    }
    if (uniqueValuesOfColumnName !== this.props.uniqueValuesOfColumnName) {
      object.uniqueValuesOfColumnName = uniqueValuesOfColumnName;
    }
    if (sqlCapability !== this.props.sqlCapability) {
      object.sqlCapability = sqlCapability;
    }
    if (columnNamesOfAnAsset !== this.props.columnNamesOfAnAsset) {
      object.menus = this.constructMenus(columnNamesOfAnAsset);
    }
    // //console.info(nextProps, object);
    this.setState(object);
  }

  onColumnClick = (event, menuName) => {
    event.stopPropagation();
    // //console.info(menuName, data, this.props);
    this.callGetUniqueValuesOfColumnName(menuName);
    const openSubMenus = {};
    const object = {};
    openSubMenus[menuName] = true;
    if (!this.state.openSubMenus || this.state.openSubMenus[menuName] === undefined) {
      object.openSubMenus = openSubMenus;
    }
    const currentFilter = {
      columnName: menuName,
      criteria: null,
    };

    /**
     * highlight currently clicked columnName
     */
    object.menus = this.state.menus.slice(0).map(menu => {
      const menuObject = { ...menu };
      if (menu.columnName === menuName) {
        menuObject.active = true;
      } else {
        menuObject.active = false;
      }
      return menuObject;
    });

    object.currentFilter = currentFilter;
    this.setState({ ...object });
  };

  /**
   * construct a single appliedFilter object
   */
  constructAppliedFilter = (columnName, data) => {
    const columnNamesOfAnAsset = this.props.columnNamesOfAnAsset;

    return {
      appliedFilter: constructAppliedFilters(columnName, data, columnNamesOfAnAsset),
    };
  };

  onFiltersApplied = data => {
    // //console.info(data);
    if (!data) {
      return;
    }
    // console.info('FilterBy onFiltersApplied', data);
    const { currentFilter, menus } = this.state;
    const { columnName } = currentFilter;
    const { onFilterSelection, onFiltersApplied } = this.props;
    // const sqlCapability = this.constructSqlCapability();
    // onFilterSelection({ ...sqlCapability, filterType: Types.FILTER_BY });
    // this.callGetUniqueValuesOfColumnName(columnName);
    const object = this.constructAppliedFilter(columnName, data.appliedConditionals);
    object.filterType = Types.FILTER_BY;
    // console.info('appliedFilter', object);
    onFilterSelection(object);
    // reset menus
    this.state.menus = menus.slice(0).map(menu => ({ ...menu, active: false }));
    /**
     * call this to handle open/close of SubMenu from Filter component
     */
    onFiltersApplied();
  };

  callGetUniqueValuesOfColumnName = columnName => {
    const { getUniqueValuesOfColumnName, apiData } = this.props;
    const { sqlCapability } = this.state;
    const newSQLCapability = Object.assign({}, sqlCapability);
    /**
     * delete old selectColumnsAndFunctions
     * since they are irrelevant in getting uniqueValuesOfColumnName
     * and construct a new one
     */
    delete newSQLCapability.selectColumnsAndFunctions;
    newSQLCapability.selectColumnsAndFunctions = [
      {
        columnName,
        sqlFunction: SQLFunction.NULL,
      },
    ];
    const data = {
      ...apiData,
      columnName,
      sqlCapability: newSQLCapability,
    };
    getUniqueValuesOfColumnName(data);
  };

  constructMenus(columnNamesOfAnAsset) {
    if (columnNamesOfAnAsset === undefined || columnNamesOfAnAsset === null) {
      return [];
    }

    return Object.keys(columnNamesOfAnAsset).map(columnName => ({
      id: generateRandomId(),
      columnName,
      dataType: columnNamesOfAnAsset[columnName],
      active: false,
    }));
  }

  renderMenus = () => {
    const { openSubMenus, menus } = this.state;
    return menus.map(menuData =>
      <li key={menuData.columnName}>
        <a
          styleName={menuData.active ? 'active' : null}
          onClick={e => this.onColumnClick(e, menuData.columnName)}
        >
          {menuData.columnName}
          <i className="icon-arrow-right" styleName={'arrow-right'} />
        </a>
        <div
          styleName={
            openSubMenus && openSubMenus[menuData.columnName]
              ? 'filter-submenus-wrapper-open'
              : 'filter-submenus-wrapper-close'
          }
        >
          <div styleName="filter-submenus">
            {this.renderCorrespondingSubMenu(menuData.dataType, menuData.columnName)}
          </div>
        </div>
      </li>
    );
  };

  isInvalid = property => {
    return property === undefined || property === null;
  };

  renderCorrespondingSubMenu = (dataType, filterName) => {
    const { uniqueValuesOfColumnName } = this.state;
    const type = dataType.toLowerCase();
    if (type === 'string') {
      return (
        <StringFilterBy
          filterName={filterName}
          selectables={uniqueValuesOfColumnName && uniqueValuesOfColumnName[filterName]}
          onFiltersApplied={this.onFiltersApplied}
        />
      );
    } else if (type === 'integer' || type === 'decimal') {
      return (
        <NumericFilterBy
          filterName={filterName}
          onFiltersApplied={this.onFiltersApplied}
          type={type}
        />
      );
    } else if (type === 'timestamp') {
      return (
        <DateFilterBy
          filterName={filterName}
          selectables={uniqueValuesOfColumnName && uniqueValuesOfColumnName[filterName]}
          onFiltersApplied={this.onFiltersApplied}
          type="timestamp"
        />
      );
    } else if (type === 'date') {
      return (
        <DateFilterBy
          filterName={filterName}
          selectables={uniqueValuesOfColumnName && uniqueValuesOfColumnName[filterName]}
          onFiltersApplied={this.onFiltersApplied}
          type="date"
        />
      );
    }
  };

  refreshAppliedConditionals = removedTagLabel => {
    // console.info('AppliedConditionals refreshed');
    const { appliedConditionals } = this.state;
    delete appliedConditionals[removedTagLabel];
    this.setState({ appliedConditionals });
  };

  render() {
    const { openMenus } = this.state;
    return (
      <div
        styleName={openMenus ? 'filter-menus-wrapper-open' : 'filter-menus-wrapper-close'}
        ref={_ref => {
          this.filterByMenus = _ref;
        }}
      >
        <ul styleName="filter-menus">
          {this.renderMenus()}
        </ul>
      </div>
    );
  }
}

export default cssModules(FilterByMenus, styles);
