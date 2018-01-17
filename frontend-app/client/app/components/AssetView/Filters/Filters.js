import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styles from './filters.styl';
import Filter from './Filter';
import Button from '../Button';
import { Menus, Menu } from '../../common/Menus';
import * as Types from './types';
import * as SQLFunction from './Menus/sqlFunction';
import {
  getColumnNamesOfAnAsset,
  getUniqueValuesOfColumnName,
  getFilterSetsMiniInfoOfAnAsset,
  getNormalFilterInformationBasedOnId,
  saveNormalFilterSet,
  updateFilterSetName,
} from '../Api';
import { setSQLCapability } from './Actions';
import EditablePopUpComponent from '../../common/EditablePopUpComponent';
import FilterSetTrigger from './FilterSetTrigger';
import popUpHOC from '../../common/popUpHOC';

const generateRandomId = () => Math.random().toString().slice(3, 10);

const filterPlaceholders = {
  filterBy: 'Apply Filters',
  showColumns: 'Show Columns',
  sortBy: 'Sort By',
};

const filterSetType = {
  SQL_ONLY_FILTER: 'SQL_ONLY_FILTER',
  NORMAL_FILTER: 'NORMAL_FILTER',
};

const filtersWrapperStyle = {};

const editableListStyle = {
  left: 0,
  top: 10,
};

const filterSetSaveStyle = {
  marginRight: 10,
};

const FilterSetList = popUpHOC(FilterSetTrigger, EditablePopUpComponent);

class Filters extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    uploadedDataSet: PropTypes.object,
    apiData: PropTypes.object.isRequired,
    loggedInUser: PropTypes.object,
    assetId: PropTypes.string.isRequired,
    isNewAsset: PropTypes.bool.isRequired,
    uniqueValuesOfColumnName: PropTypes.object,
    miniInfoOfFilters: PropTypes.object,
    normalFilterInfo: PropTypes.object,
    columnNamesOfAnAsset: PropTypes.object,
    getUniqueValuesOfColumnName: PropTypes.func.isRequired,
    onFiltersExpand: PropTypes.func.isRequired,
    onRefreshData: PropTypes.func.isRequired,
    getNormalFilterInformationBasedOnId: PropTypes.func.isRequired,
    getFilterSetsMiniInfoOfAnAsset: PropTypes.func.isRequired,
    getColumnNamesOfAnAsset: PropTypes.func.isRequired,
    updateFilterSetName: PropTypes.func.isRequired,
    saveNormalFilterSet: PropTypes.func.isRequired,
    setSQLCapability: PropTypes.func.isRequired,
  };

  static defaultProps = {
    style: {},
    uploadedDataSet: null,
    loggedInUser: {},
    miniInfoOfFilters: null,
    normalFilterInfo: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      expandFilters: false,
      sqlCapability: null,
      hasSavedFilterSets: false,
      selectedFilterSet: {
        name: 'Untitled Filter Set',
        id: null,
      },
      filterSetList: [],
      isDirty: false,
      openFilterSetList: false,
    };
    this.filterSetName = '';
    this.data = props.apiData;
    this.currentEditingItem = null;
    this.lastFilterSetMatchIndex = null;
  }

  componentDidMount() {
    if (!this.props.isNewAsset) {
      this.props.getFilterSetsMiniInfoOfAnAsset({ ...this.data });
      this.props.getColumnNamesOfAnAsset({ ...this.data });
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      sqlCapability,
      miniInfoOfFilters,
      normalFilterInfo,
      uploadedDataSet,
      createdDataSet,
      savedFilterSet,
    } = nextProps;
    const object = {};
    if (sqlCapability !== this.props.sqlCapability) {
      // update sqlCapability by assigning id's to all filters
      // it's just an internal sqlCapability state with id's
      // we need to remove id's later
      const newSQLCapability = this.updateSQLCapabilityWithIds({
        ...sqlCapability,
      });
      object.sqlCapability = newSQLCapability;
    }
    if (miniInfoOfFilters !== this.props.miniInfoOfFilters) {
      if (miniInfoOfFilters && Object.keys(miniInfoOfFilters).length === 0) {
        this.props.onRefreshData();
      } else {
        object.miniInfoOfFilters = miniInfoOfFilters;
        object.hasSavedFilterSets = true;
        const { normalFilter, sqlOnlyFilter, defaultFilterId } = miniInfoOfFilters;
        let filterSetList = [];
        if (normalFilter && normalFilter.length > 0) {
          // Now interate over normalFilter to check if the defaultFilterId matches
          // to any of the objects in normalFilter
          let interestedIndex = normalFilter.findIndex(filter => filter.id === defaultFilterId);
          // if interestedIndex= -1 then initialize to 0
          if (interestedIndex === -1) {
            interestedIndex = 0;
          }
          filterSetList = [...filterSetList, ...normalFilter];
          object.filterSetList = filterSetList;
          object.selectedFilterSet = normalFilter[interestedIndex];
        } else if (sqlOnlyFilter && sqlOnlyFilter.length > 0) {
          let interestedIndex = sqlOnlyFilter.findIndex(filter => filter.id === defaultFilterId);
          // if interestedIndex= -1 then initialize to 0
          if (interestedIndex === -1) {
            interestedIndex = 0;
          }
          filterSetList = [...filterSetList, ...sqlOnlyFilter];
          object.filterSetList = filterSetList;
          object.selectedFilterSet = sqlOnlyFilter[interestedIndex];
        }
        this.props.getNormalFilterInformationBasedOnId({
          ...this.data,
          filterSetId: object.selectedFilterSet.id,
        });
      }
    }
    if (normalFilterInfo !== this.props.normalFilterInfo) {
      object.normalFilterInfo = normalFilterInfo;
      object.sqlCapability = this.updateSQLCapabilityWithIds(normalFilterInfo);
      object.selectedFilterSet = normalFilterInfo;
    }
    if (uploadedDataSet !== this.props.uploadedDataSet) {
      this.data.assetId = uploadedDataSet.assetId;
      this.props.getColumnNamesOfAnAsset(this.data);
    }
    if (createdDataSet !== this.props.createdDataSet) {
      this.data.assetId = createdDataSet.dataSetAssetId;
      this.props.getColumnNamesOfAnAsset(this.data);
    }
    if (savedFilterSet !== this.props.savedFilterSet) {
      const filterSetList = this.state.filterSetList.slice(0);

      const sqlCapabilityCopy = { ...this.state.sqlCapability };
      /**
       * search currently saved FilterSet in FilterSetList
       * and update its id with filterSetId from backend
       */
      const filterSetMatchIndex = filterSetList.findIndex(
        filterSet => filterSet.name === savedFilterSet.filterSetName
      );
      if (filterSetMatchIndex !== -1) {
        // if there is lastFilterSetMatchIndex
        // then reset selected
        if (this.lastFilterSetMatchIndex !== null) {
          filterSetList[this.lastFilterSetMatchIndex].selected = false;
        }
        filterSetList[filterSetMatchIndex].id = savedFilterSet.filterSetId;
        // we need this just to reset selected of previously selected filterSet
        this.lastFilterSetMatchIndex = filterSetMatchIndex;
      } else {
        filterSetList.push({
          id: savedFilterSet.filterSetId,
          name: this.filterSetName,
          selected: true,
        });
        sqlCapabilityCopy.filterSetName = this.filterSetName;
        this.lastFilterSetMatchIndex = 0;
      }
      sqlCapabilityCopy.filterSetId = savedFilterSet.filterSetId;
      object.selectedFilterSet = sqlCapabilityCopy;
      object.filterSetList = filterSetList;
    }

    this.setState(object);
  }

  updateSQLCapabilityWithIds = sqlCapability => {
    const newSQLCapability = {
      ...sqlCapability,
      selectColumnsAndFunctions: [],
      filters: {
        appliedFilters: [],
      },
      columnOrders: [],
    };
    const updateIds = items =>
      items.map(item => {
        if (!item.id) {
          item.id = generateRandomId();
        }
        return item;
      });

    const appliedFilters = sqlCapability.filters && sqlCapability.filters.appliedFilters;
    const selectColumnsAndFunctions = sqlCapability.selectColumnsAndFunctions;
    const columnOrders = sqlCapability.columnOrders;
    if (appliedFilters) {
      newSQLCapability.filters.appliedFilters = updateIds(appliedFilters);
    }
    if (selectColumnsAndFunctions) {
      newSQLCapability.selectColumnsAndFunctions = updateIds(selectColumnsAndFunctions);
    }
    if (columnOrders) {
      newSQLCapability.columnOrders = updateIds(columnOrders);
    }
    return newSQLCapability;
  };

  /**
 * construct final sqlCapability after a filter is selected
 * here we need to check if it's going to be an update or an append
 * to the list of appliedFilters for  filterType: FILTER_BY
 */
  onFilterSelection = data => {
    console.info('onFilterSelection data:', data);
    let sqlCapability;
    if (data.filterType === Types.SHOW_COLUMNS) {
      sqlCapability = this.constructSelectColumnsAndFunctions({ ...data });
    } else if (data.filterType === Types.SORT_BY) {
      sqlCapability = this.constructColumnOrders({ ...data });
    } else if (data.filterType === Types.FILTER_BY) {
      sqlCapability = this.constructAppliedFilters({ ...data });
    }
    this.props.setSQLCapability({ ...sqlCapability });
    this.setState({ sqlCapability, isDirty: true }, () => {
      // console.info('Updated sqlCapability', this.state.sqlCapability);
    });
  };

  constructAppliedFilters = data => {
    const appliedFilterObject = Object.assign({}, data.appliedFilter[0]);
    if (!appliedFilterObject.id) {
      appliedFilterObject.id = generateRandomId();
    }
    delete appliedFilterObject.filterType;
    let sqlCapability = Object.assign({}, this.state.sqlCapability);
    if (sqlCapability) {
      if (!sqlCapability.filters) {
        sqlCapability.filters = {
          appliedFilters: [],
        };
      }
      let appliedFilters = sqlCapability.filters.appliedFilters.slice(0);
      const matchAppliedFilterIndex = appliedFilters.findIndex(
        appliedFilter => appliedFilter.id === appliedFilterObject.id
      );
      /**
       * if there is a match with id then update appliedFilters
       * else append it
       */
      if (matchAppliedFilterIndex !== -1) {
        appliedFilters[matchAppliedFilterIndex] = appliedFilterObject;
      } else {
        appliedFilters = appliedFilters.concat(appliedFilterObject);
      }
      // console.info(newAppliedFilters);
      sqlCapability.filters.appliedFilters = appliedFilters;
    } else {
      sqlCapability = {
        filters: {
          appliedFilters: [appliedFilterObject],
        },
      };
    }
    return sqlCapability;
  };

  constructColumnOrders = data => {
    const columnOrderObject = { ...data };
    const sqlCapability = { ...this.state.sqlCapability } || {};
    const columnOrders = sqlCapability.columnOrders || [];
    if (!columnOrderObject.id) {
      columnOrderObject.id = generateRandomId();
    }
    const matchColumnOrderIndex = columnOrders.findIndex(
      columnOrder => columnOrder.id === columnOrderObject.id
    );
    const object = {
      id: columnOrderObject.id,
      columnName: columnOrderObject.columnName,
      order: columnOrderObject.text || columnOrderObject.order,
    };
    if (matchColumnOrderIndex !== -1) {
      columnOrders[matchColumnOrderIndex] = object;
    } else {
      columnOrders.push(object);
    }
    sqlCapability.columnOrders = columnOrders;
    return sqlCapability;
  };

  constructSelectColumnsAndFunctions = data => {
    const selectColumnsAndFunctionObject = { ...data };
    const sqlCapability = { ...this.state.sqlCapability };
    const selectColumnsAndFunctions = sqlCapability.selectColumnsAndFunctions || [];
    const groupByColumns = [];
    if (!selectColumnsAndFunctionObject.id) {
      selectColumnsAndFunctionObject.id = generateRandomId();
    }
    const matchSelectColumnFunctionIndex = selectColumnsAndFunctions.findIndex(
      selectColumnsAndFunction => selectColumnsAndFunction.id === selectColumnsAndFunctionObject.id
    );

    /**
     * if there's already a selectColumnsAndFunction with same id
     * then update the object
     */
    if (matchSelectColumnFunctionIndex !== -1) {
      selectColumnsAndFunctions[matchSelectColumnFunctionIndex] = selectColumnsAndFunctionObject;
    } else {
      if (data.text === SQLFunction.RAW) {
        selectColumnsAndFunctions.push({
          columnName: selectColumnsAndFunctionObject.columnName,
          id: selectColumnsAndFunctionObject.id,
          sqlFunction: SQLFunction.NULL,
        });
        /**
         * if there's anything in groupByColumns which is not in selectColumnsAndFunctions,
         * add them in selectColumnsAndFunctions too
         */
        if (sqlCapability.groupByColumns) {
          selectColumnsAndFunctions.forEach(selectColumnsAndFunction => {
            groupByColumns.push(selectColumnsAndFunction.columnName);
          });
          sqlCapability.groupByColumns = groupByColumns;
        }
      } else {
        selectColumnsAndFunctions.push({
          columnName: selectColumnsAndFunctionObject.columnName,
          id: selectColumnsAndFunctionObject.id,
          sqlFunction: selectColumnsAndFunctionObject.text,
        });
        selectColumnsAndFunctions.forEach(selectColumnsAndFunction => {
          groupByColumns.push(selectColumnsAndFunction.columnName);
        });
        sqlCapability.groupByColumns = groupByColumns;
      }
    }
    sqlCapability.selectColumnsAndFunctions = selectColumnsAndFunctions;
    // console.info(sqlCapability);
    return sqlCapability;
  };

  onFilterTagCloseClick = ({ ...tagData, filterType }) => {
    console.info(filterType, tagData);
    const { sqlCapability } = this.state;
    const newSQLCapability = { ...sqlCapability };
    const { selectColumnsAndFunctions, filters, columnOrders, groupByColumns } = newSQLCapability;
    // remove tagData by id
    if (Types.SHOW_COLUMNS === filterType) {
      let newSelectColumnsAndFunctions =
        selectColumnsAndFunctions && this.deleteItemInArray(selectColumnsAndFunctions, tagData);
      /**
     * backend crashes if there is any filters: selectColumnsAndFunctions/appliedFilters/columnOrders
     * with length 0
     * fix it here for now
     */
      if (newSelectColumnsAndFunctions && newSelectColumnsAndFunctions.length === 0) {
        newSelectColumnsAndFunctions = null;
      }
      newSQLCapability.selectColumnsAndFunctions = newSelectColumnsAndFunctions;
    }
    if (Types.FILTER_BY === filterType) {
      const newAppliedFilters = filters && this.deleteItemInArray(filters.appliedFilters, tagData);
      const newGroupByColumns = groupByColumns && this.deleteItemInArray(groupByColumns, tagData);
      if (newAppliedFilters && newAppliedFilters.length) {
        newSQLCapability.filters.appliedFilters = newAppliedFilters;
      } else {
        delete newSQLCapability.filters;
      }
      newSQLCapability.groupByColumns = newGroupByColumns || null;
    }
    if (Types.SORT_BY === filterType) {
      let newColumnOrders = columnOrders && this.deleteItemInArray(columnOrders, tagData);
      if (newColumnOrders && newColumnOrders.length === 0) {
        newColumnOrders = null;
      }
      newSQLCapability.columnOrders = newColumnOrders || null;
    }
    // sqlCapability has updated, refresh data
    this.props.setSQLCapability(newSQLCapability);
    this.setState(
      {
        sqlCapability: newSQLCapability,
        isDirty: true,
      },
      () => {
        // console.info(this.state);
      }
    );
  };

  onFiltersExpand = () => {
    // this.setState({ expandFilters: !this.state.expandFilters });
    this.props.onFiltersExpand();
  };

  onFilterSetMenuClick = selectedFilterSet => {
    // Here we have to make and API call to get
    // details of a filter(either SQLCapability or just SQLOnlyFilter)
    this.setState({
      selectedFilterSet,
    });
    this.props.getNormalFilterInformationBasedOnId({
      ...this.data,
      filterSetId: selectedFilterSet.id,
    });
  };

  handleUpdateFilterSetName = filterSetName => {
    const selectedFilterSet = { ...this.state.selectedFilterSet };
    const data = {
      ...this.data,
      filterSetId: this.currentEditingItem.id,
      filterSetName,
    };
    this.props.updateFilterSetName(data);
    this.filterSetList.toggle();
    // update selectedFilterSet name
    // if currentEditingItem's id is same as selectedFilterSet ID
    if (selectedFilterSet.filterSetId === this.currentEditingItem.id) {
      selectedFilterSet.filterSetName = filterSetName;
      const filterSetList = this.state.filterSetList.slice(0);
      // update filterSetList
      this.setState({
        selectedFilterSet,
        filterSetList: filterSetList.map(filterSet => ({
          ...filterSet,
          name: filterSet.id === selectedFilterSet.filterSetId ? filterSetName : filterSet.name,
        })),
      });
    }
  };

  handleFilterSetSaveClick = e => {
    const { filterSetList, isDirty } = this.state;
    // The selected filter will have the ID of the selectedFilter(be it SQLOnlyFilter or NormalFilter)
    if (filterSetList.length) {
      if (isDirty) {
        this.saveFilterSet();
      }
      return;
    }
    e.nativeEvent.stopImmediatePropagation();
    /**
     * call show() of popUpHOC
     * which handles the internal open/close state of popUpHOC
     */
    this.filterSetList.show();
  };

  resetFilterInputs = () => {
    // set the selectedFilterSet to null
    // reset the sqlCapability in the state
    this.state.selectedFilterSet = null;
    this.state.sqlCapability = {};
  };

  renderFilterSetMenus() {
    const { selectedFilterSet, miniInfoOfFilters } = this.state;
    let filterSetList = [];
    let menusClassName = 'FilterSet';
    if (miniInfoOfFilters) {
      const { normalFilter, sqlOnlyFilter } = miniInfoOfFilters;
      if (normalFilter) {
        filterSetList = [...filterSetList, ...normalFilter];
      }
      if (sqlOnlyFilter) {
        filterSetList = [...filterSetList, ...sqlOnlyFilter];
      }
    }
    /**
     * if there's no filter set there will be a default FilterSet
     * with name as Untitled and this will be the default selected Filterset
     */
    const defaultFilterSet = {
      type: 'NORMAL_FILTER',
      id: generateRandomId(),
      name: 'Untitled Filter Set',
    };
    if (filterSetList.length === 0) {
      // TODO: type should be set according to the current Asset Type
      filterSetList.push(defaultFilterSet);
      this.state.selectedFilterSet = defaultFilterSet;
      menusClassName = `${menusClassName} empty`;
    }
    const label = (selectedFilterSet && selectedFilterSet.name) || defaultFilterSet.name;
    return (
      <Menus label={label} className={menusClassName}>
        <Menu text="New Exploration Set" onClick={this.resetFilterInputs} textButton />
        {filterSetList.map(filterSet =>
          <Menu
            editable
            onMenuUpdate={this.updateFilterSetName}
            data={filterSet}
            text={filterSet.name}
            onClick={this.onFilterSetMenuClick}
          />
        )}
      </Menus>
    );
  }

  deleteItemInArray = (array, item) => {
    const arraySlice = array.slice(0);
    if (typeof arraySlice[0] === 'object') {
      return arraySlice.filter(element => element.id !== item.id);
    }
    return arraySlice.filter(element => element !== item);
  };

  handleFilterSetListSwitchClick = data => {
    this.props.getNormalFilterInformationBasedOnId({
      ...this.data,
      filterSetId: data.id,
    });
    this.filterSetList.hide();
  };

  setFilterSetListRef = _ref => {
    this.filterSetList = _ref;
  };

  handleFilterSetListHeaderInputBlur = value => {
    this.filterSetName = value;
    const { filterSetList } = this.state;

    // if filterSetList is empty then
    // we need to create a new FilterSet
    // which will be directly inserted to the filterSetList
    // without any matching lastFilterSetMatchIndex
    // [refer: componentWillReceiveProps => savedFilterSet]
    if (filterSetList.length) {
      const sqlCapability = {
        filterSetName: this.filterSetName,
      };

      this.setState({
        sqlCapability,
        selectedFilterSet: sqlCapability,
        filterSetList: [...filterSetList, { name: this.filterSetName }],
        isDirty: true,
      });
      this.props.setSQLCapability(this.data);
    } else {
      this.saveFilterSet();
    }

    this.filterSetList.hide();
  };

  saveFilterSet() {
    const sqlCapability = { ...this.state.sqlCapability };
    // if there is no filterSetName in SQLCapability
    // this is going to be a save else an update
    if (!sqlCapability.filterSetName) {
      sqlCapability.filterSetName = this.filterSetName;
    }
    this.props.saveNormalFilterSet({
      ...this.data,
      sqlCapability,
    });
    this.setState({
      isDirty: false,
    });
  }

  handleTransformIconName = rowData => {
    if (rowData.type === filterSetType.NORMAL_FILTER) {
      return 'icon-wrench';
    }
    return 'fa fa-code';
  };

  handleFilterSetListHeaderButtonClick = ({ name }) => {
    this.handleFilterSetListHeaderInputBlur(name);
  };

  handleFilterSetEditClick = itemData => {
    // console.info(itemData);
    this.currentEditingItem = itemData;
  };

  render() {
    const { styles, ...filterProps } = this.props;
    const {
      expandFilters,
      sqlCapability,
      isDirty,
      openFilterSetList,
      selectedFilterSet,
      filterSetList,
    } = this.state;
    if (expandFilters) {
      filtersWrapperStyle.flex = 1;
    }
    return (
      <div styleName="filters-wrapper" style={filtersWrapperStyle}>
        <div styleName="filtersets-wrapper">
          <Button
            styleClassName="btn-save"
            style={filterSetSaveStyle}
            onClick={this.handleFilterSetSaveClick}
          >
            <i className="fa fa-floppy-o" />
            {isDirty ? <span className="bindi">.</span> : null}
          </Button>
          <div styleName="filtersets">
            <FilterSetList
              open={openFilterSetList}
              placeholder="Enter Filter Set Name"
              label={selectedFilterSet.filterSetName || 'Untitled Filter Set'}
              dataSource={filterSetList.map(filterSet => ({
                ...filterSet,
                selected: filterSet.id === selectedFilterSet.filterSetId,
              }))}
              onItemInputDone={this.handleUpdateFilterSetName}
              onEditItemClick={this.handleFilterSetEditClick}
              caretPosition="left"
              buttonText={`${filterSetList.length ? 'New' : 'Save'}`}
              showListIcon
              headerName="Filter Set"
              style={editableListStyle}
              onSwitchClick={this.handleFilterSetListSwitchClick}
              ref={this.setFilterSetListRef}
              transformIconName={this.handleTransformIconName}
              onVisibilityChanged={this.handleFilterSetsListVisibilityChanged}
              onHeaderInputBlur={this.handleFilterSetListHeaderInputBlur}
              onHeaderButtonClick={this.handleFilterSetListHeaderButtonClick}
            />
          </div>
        </div>
        <Filter
          name="Filter By"
          placeholder={filterPlaceholders.filterBy}
          type="FILTER_BY"
          sqlCapability={sqlCapability}
          expandFilters={expandFilters}
          {...filterProps}
          onFilterSelection={this.onFilterSelection}
          onFilterTagCloseClick={this.onFilterTagCloseClick}
        />
        <Filter
          name="Show Columns"
          placeholder={filterPlaceholders.showColumns}
          type="SHOW_COLUMNS"
          sqlCapability={sqlCapability}
          expandFilters={expandFilters}
          {...filterProps}
          onFilterSelection={this.onFilterSelection}
          onFilterTagCloseClick={this.onFilterTagCloseClick}
        />
        <Filter
          name="Sort By"
          placeholder={filterPlaceholders.sortBy}
          type="SORT_BY"
          sqlCapability={sqlCapability}
          expandFilters={expandFilters}
          {...filterProps}
          onFilterSelection={this.onFilterSelection}
          onFilterTagCloseClick={this.onFilterTagCloseClick}
        />
        <div styleName="action-btns">
          <Button
            styleClassName="btn-down"
            style={{
              marginRight: 5,
            }}
            onClick={this.onFiltersExpand}
          >
            <i className="fa fa-code" />
          </Button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    uniqueValuesOfColumnName,
    columnNamesOfAnAsset,
    filtersets,
    miniInfoOfFilters,
    normalFilterInfo,
    savedFilterSet,
    createdDataSet,
    uploadedDataSet,
  } = state.dataAssetView;
  return {
    uniqueValuesOfColumnName,
    columnNamesOfAnAsset,
    filtersets,
    miniInfoOfFilters,
    normalFilterInfo,
    savedFilterSet,
    createdDataSet,
    uploadedDataSet,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getColumnNamesOfAnAsset,
      getUniqueValuesOfColumnName,
      setSQLCapability,
      getFilterSetsMiniInfoOfAnAsset,
      getNormalFilterInformationBasedOnId,
      saveNormalFilterSet,
      updateFilterSetName,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Filters, styles));
