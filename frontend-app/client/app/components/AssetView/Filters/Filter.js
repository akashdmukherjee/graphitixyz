import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './filter.styl';
import { FilterByMenus, ShowColumnsMenus, SortByMenus } from './Menus';
import * as FilterType from './types';
import FilterTag from './FilterTag';

class Filter extends React.Component {
  static propTypes = {
    sqlCapability: PropTypes.object,
    expandFilters: PropTypes.bool.isRequired,
    onFilterSelection: PropTypes.func,
  };

  static defaultProps = {
    sqlCapability: {},
    onFilterSelection: () => null,
  };

  constructor(props) {
    super(props);
    this.state = {
      isFilterClicked: false,
      appliedFilters: {},
      sqlCapability: props.sqlCapability,
      openFilterTags: false,
      filterTags: [],
    };
  }

  componentDidMount() {
    this.element = ReactDOM.findDOMNode(this);
    window.addEventListener('click', this.onDOMClick);
    /**
     * construct necessary filter tags from here using sqlCapability
     */
    this.constructFilterTagsFromSQLCapability();
  }

  componentWillReceiveProps(nextProps) {
    const { sqlCapability } = nextProps;
    // console.info(
    //   sqlCapability,
    //   this.props.sqlCapability,
    //   sqlCapability !== this.props.sqlCapability
    // );
    if (sqlCapability !== this.props.sqlCapability) {
      this.setState({ sqlCapability, filterTags: [] }, () => {
        // console.info('Update State', this.state);
        this.constructFilterTagsFromSQLCapability();
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMClick);
  }

  constructFilterTagsFromSQLCapability() {
    const { sqlCapability } = this.state;
    if (sqlCapability) {
      this.constructFilterTags();
    }
  }

  onDOMClick = event => {
    // console.info(event, event.target, typeof event.target.className);
    // handle click on SVG
    // which returns className as an object { }
    if (typeof event.target.className === 'object') {
      this.onClickedAway();
      return;
    }

    if (this.element !== event.target && !this.element.contains(event.target)) {
      // console.info(
      //   this.element,
      //   event.target,
      //   event.target.className,
      //   this.element.contains(event.target)
      // );
      this.onClickedAway();
    }
  };

  onClickedAway = () => {
    // console.info('onClickedAway');
    this.setState(
      {
        openMenus: false,
        openSubMenus: false,
        openFilterTags: false,
      },
      () => {
        this.state.openSubMenus = undefined;
      }
    );
  };

  onFilterAddClick = () => {
    this.setState({ openMenus: true });
  };
  // This convention is better than writing bind
  // for each method in constructor
  // the arrow function resolves the function
  // `this` scope automatically
  onFilterClick = e => {
    const { filterTags, openFilterTags } = this.state;
    if (filterTags && filterTags.length) {
      this.setState({ openFilterTags: !openFilterTags });
    } else {
      this.onFilterAddClick();
    }
  };

  onFiltersApplied = data => {
    // console.info('Filter onFiltersApplied', data);
    // close Menus and Sumenus if there's any open
    this.onClickedAway();
  };

  /**
   * constructFilterTags from sqlCapability
   */
  constructFilterTags = () => {
    // console.info('constructFilterTags');
    const { type: filterType, columnNamesOfAnAsset } = this.props;
    const sqlCapability = Object.assign({}, this.state.sqlCapability);
    // console.info(columnNamesOfAnAsset);
    const filterTags = this.state.filterTags.slice(0);
    // tagObject = {
    //   id: null,
    //   columnName: null,
    //   criteria: null,
    //   values: null,
    //   dataType: null,
    //   filterType: type,
    // };
    if (FilterType.SHOW_COLUMNS === filterType) {
      const selectColumnsAndFunctions = sqlCapability.selectColumnsAndFunctions || [];
      selectColumnsAndFunctions.forEach(selectColumnsAndFunction => {
        const filterTagObject = {
          id: selectColumnsAndFunction.id,
          filterType,
        };
        filterTagObject.columnName = selectColumnsAndFunction.columnName;
        filterTagObject.criteria =
          selectColumnsAndFunction.text || selectColumnsAndFunction.sqlFunction;
        filterTags.push(filterTagObject);
      });
    } else if (FilterType.SORT_BY === filterType) {
      const columnOrders = sqlCapability.columnOrders || [];
      columnOrders.forEach(columnOrder => {
        const filterTagObject = {
          id: columnOrder.id,
          filterType,
        };
        filterTagObject.columnName = columnOrder.columnName;
        filterTagObject.criteria = columnOrder.text || columnOrder.order;
        filterTags.push(filterTagObject);
      });
    } else {
      const filters = sqlCapability.filters;
      // console.info(object);
      /**
       * type: data {
       *    filters: {
       *      appliedFilters: {
       *      }
       *    }
       *    filterType: @String
       *  }
       * construct filter tags for FilterByMenus
       * First extract `filter` key from `data` object
       * then check if there is valid `appliedFilters`{array of objects}
       * then loop through `appliedFilters` and construct filter tags.
       */
      // console.info(object);
      if (filters && filters.appliedFilters.length) {
        filters.appliedFilters.forEach(filter => {
          filterTags.push({ ...filter, filterType });
        });
      }
    }
    this.setState({ filterTags }, () => {
      // console.info(this.state.filterTags);
    });
  };

  renderFilterTags = () => {
    const { filterTags } = this.state;
    const { styles, ...filterProps } = this.props;
    // console.info(filterTags);
    return filterTags.map(filterTag =>
      <FilterTag
        label={filterTag.columnName}
        key={filterTag.id}
        data={{ ...filterTag }}
        onFiltersApplied={this.onFiltersApplied}
        {...filterProps}
        onTagCloseClick={this.onTagCloseClick}
      />
    );
  };

  renderMenus = () => {
    const {
      type,
      getUniqueValuesOfColumnName,
      uniqueValuesOfColumnName,
      columnNamesOfAnAsset,
      onFilterSelection,
      apiData,
    } = this.props;
    const { openMenus, openSubMenus, removedTagLabel, filterTags, sqlCapability } = this.state;
    if (type === FilterType.FILTER_BY) {
      return (
        <FilterByMenus
          openMenus={openMenus}
          openSubMenus={openSubMenus}
          columnNamesOfAnAsset={columnNamesOfAnAsset}
          getUniqueValuesOfColumnName={getUniqueValuesOfColumnName}
          uniqueValuesOfColumnName={uniqueValuesOfColumnName}
          apiData={apiData}
          sqlCapability={sqlCapability}
          removedTagLabel={removedTagLabel}
          onFilterSelection={onFilterSelection}
          onFiltersApplied={this.onFiltersApplied}
        />
      );
    } else if (type === FilterType.SHOW_COLUMNS) {
      return (
        <ShowColumnsMenus
          openMenus={openMenus}
          openSubMenus={openSubMenus}
          columnNamesOfAnAsset={columnNamesOfAnAsset}
          removedTagLabel={removedTagLabel}
          onFilterSelection={onFilterSelection}
          onFiltersApplied={this.onFiltersApplied}
        />
      );
    } else if (type === FilterType.SORT_BY) {
      return (
        <SortByMenus
          openMenus={openMenus}
          openSubMenus={openSubMenus}
          columnNamesOfAnAsset={columnNamesOfAnAsset}
          filterTags={filterTags}
          removedTagLabel={removedTagLabel}
          onFilterSelection={onFilterSelection}
          onFiltersApplied={this.onFiltersApplied}
        />
      );
    }
    return null;
  };

  onTagCloseClick = data => {
    const { onFilterTagCloseClick, type: filterType } = this.props;
    onFilterTagCloseClick({
      ...data,
      filterType,
    });
  };

  renderFilterTagsStatus() {
    const { filterTags } = this.state;
    const filterTagsLength = filterTags.length;
    const plural = filterTagsLength > 1 ? 's' : '';
    const { placeholder, type } = this.props;
    let filterStatus = '';
    if (type === FilterType.FILTER_BY) {
      filterStatus = `${filterTagsLength} Filter${plural} Applied`;
    } else if (type === FilterType.SHOW_COLUMNS) {
      filterStatus = `Showing ${filterTagsLength} Field${plural}`;
    } else if (type === FilterType.SORT_BY) {
      filterStatus = `Sorted By ${filterTagsLength} Field${plural}`;
    }
    return (
      <div
        styleName={filterTagsLength ? 'filter-status' : 'filter-status-empty'}
        className="filter-by"
        onClick={this.onFilterClick}
      >
        <h5>
          {filterTagsLength ? filterStatus : placeholder}
        </h5>
        {filterTagsLength ? <i className="icon-arrow-down" /> : null}
      </div>
    );
  }

  render() {
    const { name, expandFilters } = this.props;
    const { openFilterTags } = this.state;
    const style = {
      filterTags: {},
    };

    if (expandFilters) {
      style.filterTags.whiteSpace = 'normal';
      style.filterTags.height = '92%';
      style.filterTags.overflow = 'scroll';
    }

    return (
      <div styleName="filter-wrapper">
        <div styleName="filter">
          <div styleName="add" onClick={this.onFilterAddClick} className="filter-by">
            +
          </div>
          {this.renderFilterTagsStatus()}
          <div
            styleName="filter-tags-wrapper"
            style={{
              display: openFilterTags ? 'block' : 'none',
            }}
          >
            <div styleName="filter-tags" style={style.filterTags}>
              {this.renderFilterTags()}
            </div>
          </div>
        </div>
        <div style={{ display: this.state.openMenus ? 'block' : 'none' }}>
          {this.renderMenus()}
        </div>
      </div>
    );
  }
}

Filter.propTypes = {
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

export default cssModules(Filter, styles);
