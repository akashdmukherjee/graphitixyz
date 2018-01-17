/**
 * Higher Order Composite Tag Component
 */
import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Tag from '../../../common/Tag';
import { StringFilterBy, DateFilterBy, NumericFilterBy } from '../FilterSubMenu';
import { ShowColumnsSubMenu, SortBySubMenu } from '../FilterSubMenu/Columns';
import * as FilterType from '../types';
import * as Criteria from '../Menus/criteria';
import * as SQLFunction from '../Menus/sqlFunction';
import constructAppliedFilters from '../constructAppliedFilters';
import getDateFeatures from '../FilterSubMenu/Types/Date/features';
import { conditionals as NumericConditionals } from '../FilterSubMenu/Types/Numeric/conditionals';
import { conditionals as DateConditionals } from '../FilterSubMenu/Types/Date/conditionals';
import { Types as DataTypes } from '../FilterSubMenu/Types/Conditional';

class FilterTag extends React.Component {
  static propTypes = {
    ...Tag.propTypes,
    sqlCapability: PropTypes.object.isRequired,
    apiData: PropTypes.object.isRequired,
    onFilterTagClick: PropTypes.func,
  };

  static defaultProps = {
    onFilterTagClick: () => null,
  };

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  componentDidMount() {
    this.component = window.addEventListener('click', this.onDOMClick);
  }

  componentWillReceiveProps(nextProps) {
    const { uniqueValuesOfColumnName } = nextProps;
    if (uniqueValuesOfColumnName !== this.props.uniqueValuesOfColumnName) {
      this.setState({ uniqueValuesOfColumnName });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMClick);
  }

  onDOMClick = () => {
    const target = event.target;
    /**
     * if clicked outside this component
     * hide the component
     * also if filter-tags are open close them
     */
    if (target !== this.filterTag && !this.filterTag.contains(target)) {
      this.setState({ visible: false });
    }
  };

  onFilterTagClick = event => {
    // console.info('FTClick', this.props);
    const { onFilterTagClick, data } = this.props;
    this.setState({ visible: !this.state.visible });
    this.callGetUniqueValuesOfColumnName(data.columnName);
    onFilterTagClick(data);
  };

  /**
   * when apply button is clicked
   * onFilterSelection instead of onFiltersApplied
   * so that sqlCapability can be constructed
   */
  onFiltersApplied = data => {
    const {
      onFilterSelection,
      type: filterType,
      data: tagData,
      columnNamesOfAnAsset,
      onFiltersApplied,
    } = this.props;
    const { columnName } = tagData;
    if (filterType === FilterType.FILTER_BY) {
      const appliedFilter = constructAppliedFilters(
        columnName,
        data.appliedConditionals,
        columnNamesOfAnAsset
      );
      const [appliedFilterObject] = appliedFilter;
      appliedFilterObject.id = tagData.id;
      onFilterSelection({
        appliedFilter,
        filterType,
      });
    } else if (filterType === FilterType.SHOW_COLUMNS) {
      onFilterSelection({ ...data, id: tagData.id });
    } else if (filterType === FilterType.SORT_BY) {
      onFilterSelection({ ...data, id: tagData.id });
    }

    // call this to close any open menus or submenus
    onFiltersApplied();
    this.setState({ visible: false });
  };

  callGetUniqueValuesOfColumnName = columnName => {
    const { getUniqueValuesOfColumnName, apiData } = this.props;
    /**
     * constrcuct a new sqlCapability since uniqueValuesOfColumnName requires this
     * and FilterTag SubMenu doesn't need to use the sqlCapability in Filters's state
     * since this is used to update the Filter
     */
    const newSQLCapability = {
      selectColumnsAndFunctions: [
        {
          columnName,
          sqlFunction: SQLFunction.NULL,
        },
      ],
    };
    const data = {
      ...apiData,
      columnName,
      sqlCapability: newSQLCapability,
    };
    getUniqueValuesOfColumnName(data);
  };

  updateConditionalValues() {
    const { data } = this.props;
    const { uniqueValuesOfColumnName } = this.state;
    const { values, columnName } = data;
    if (!values) {
      return [];
    }
    /**
     * combine selectables and conditional input values
     * with values from FilterTag data
     */
    let selectables = [];
    let checked;
    if (uniqueValuesOfColumnName) {
      selectables = uniqueValuesOfColumnName[columnName].map(uniqueValue => {
        const tagValueIndex = values.findIndex(value => value === uniqueValue);
        checked = false;
        if (tagValueIndex !== -1) {
          checked = true;
        }
        return {
          text: uniqueValue,
          checked,
        };
      });
    }
    // console.info(selectables);
    return selectables;
  }

  getActiveDateFeatureName = (appliedConditionals, activeConditional) => {
    const { data } = this.props;
    // console.info('getActiveDateFeatureName', data.columnName, appliedConditionals, activeConditional);
    /**
     * extract DateFeature from appliedConditionals sqlFunction
     */
    const features = {
      Date: 'Date',
      Year: 'Year',
      Quarter: 'Quarter',
      Month: 'Month',
      Day: 'Day',
      Hour: 'Hour',
      Minute: 'Minute',
      Second: 'Second',
    };
    let dateFeatureMatch;
    if (appliedConditionals && activeConditional) {
      const [appliedConditionalsSQLFunctionName] = Object.keys(
        appliedConditionals[data.columnName][activeConditional.value]
      );
      if (appliedConditionalsSQLFunctionName.match(/year/i)) {
        dateFeatureMatch = features.Year;
      } else if (appliedConditionalsSQLFunctionName.match(/quarter/i)) {
        dateFeatureMatch = features.Quarter;
      } else if (appliedConditionalsSQLFunctionName.match(/month/i)) {
        dateFeatureMatch = features.Month;
      } else if (appliedConditionalsSQLFunctionName.match(/day/i)) {
        dateFeatureMatch = features.Day;
      } else if (appliedConditionalsSQLFunctionName.match(/hour/i)) {
        dateFeatureMatch = features.Hour;
      } else if (appliedConditionalsSQLFunctionName.match(/minute/i)) {
        dateFeatureMatch = features.Minute;
      } else if (appliedConditionalsSQLFunctionName.match(/second/i)) {
        dateFeatureMatch = features.Second;
      }
    }
    return dateFeatureMatch;
  };

  getActiveDateFeature = (dataType, appliedConditionals, activeConditional) => {
    const dateFeatures = getDateFeatures(dataType);
    const matchIndex = dateFeatures.findIndex(
      dateFeature => dateFeature.text === this.getActiveDateFeatureName(appliedConditionals, activeConditional)
    );
    if (matchIndex !== -1) {
      return dateFeatures[matchIndex];
    }
    return dateFeatures[0];
  };

  renderFilterSubMenu() {
    const {
      data,
      styles,
      onFiltersApplied,
      ...filterSubMenuProps,
    } = this.props;
    const { filterType, dataType, columnName, criteria, values, sqlFunction } = data;
    const selectables = this.updateConditionalValues();
    let type;
    if (dataType) {
      type = dataType.toLowerCase();
    } else {
      type = filterSubMenuProps.columnNamesOfAnAsset[columnName].toLowerCase();
    }
    /**
     * activeConditional and appliedConditionals required
     * to populate in FilterSubMenu
     * Conditional Component has three properties: selectables @boolean, noInput @boolean, numberOfInputs @integer
     */
    let activeConditional = {
      text: Criteria.Text[criteria],
      value: criteria,
      active: true,
    };
    if (
      criteria === Criteria.CONTAINS ||
      criteria === Criteria.DOES_NOT_CONTAIN ||
      criteria === Criteria.ENDS_WITH ||
      criteria === Criteria.STARTS_WITH
    ) {
      activeConditional.numberOfInputs = values.length;
    } else if (
      criteria === Criteria.IS_NULL ||
      criteria === Criteria.IS_NOT_NULL ||
      criteria === Criteria.IS_EMPTY ||
      criteria === Criteria.IS_NOT_EMPTY
    ) {
      activeConditional.noInput = true;
    } else if (type === DataTypes.STRING) {
      activeConditional.selectables = true;
    } else if (type === DataTypes.INTEGER || type === DataTypes.DECIMAL) {
      /**
       * we need to get the properties of activeConditional from Numeric conditionals
       * so that it can be rendered properly
       */
      const matchConditionalIndex = NumericConditionals.findIndex(
        conditional => conditional.value === activeConditional.value
      );
      activeConditional = NumericConditionals[matchConditionalIndex];
    }
    const appliedConditionals = {
      [columnName]: {},
    };
    let activeDateFeature;
    let sliderValues;
    if (type === DataTypes.DATE || type === DataTypes.TIMESTAMP) {
      if (sqlFunction.match(/^date/)) {
        appliedConditionals[columnName][criteria] = values;
      } else {
        appliedConditionals[columnName][criteria] = { [sqlFunction]: values };
      }
      activeDateFeature = this.getActiveDateFeature(type, appliedConditionals, activeConditional);
      /**
       * get the conditional properties for currently activeDateFeature
       * and make it activeConditional
       */
      const matchConditionalIndex = DateConditionals[activeDateFeature.conditionalType].findIndex(
        conditional => conditional.value === activeConditional.value
      );
      activeConditional = DateConditionals[activeDateFeature.conditionalType][matchConditionalIndex];
      // it's not a `Date` feature so there might be sliderValues
      if (activeDateFeature.value) {
        sliderValues = values;
      }
    } else {
      appliedConditionals[columnName][criteria] = values;
      if (activeConditional.slider) {
        sliderValues = values.slice(0, activeConditional.numberOfHandles);
      }
    }

    // console.info('FilterTagData', data, activeConditional, appliedConditionals);
    if (filterType === FilterType.FILTER_BY) {
      if (type === DataTypes.STRING) {
        return (
          <StringFilterBy
            selectables={selectables}
            activeConditional={activeConditional}
            appliedConditionals={appliedConditionals}
            selectablesManipulation={false}
            onFiltersApplied={this.onFiltersApplied}
            {...filterSubMenuProps}
            filterName={columnName}
          />
        );
      } else if (type === DataTypes.INTEGER || type === DataTypes.DECIMAL) {
        return (
          <NumericFilterBy
            filterName={columnName}
            activeConditional={activeConditional}
            appliedConditionals={appliedConditionals}
            sliderValues={sliderValues}
            onFiltersApplied={this.onFiltersApplied}
          />
        );
      } else if (type === DataTypes.TIMESTAMP) {
        return (
          <DateFilterBy
            selectables={selectables}
            filterName={columnName}
            appliedConditionals={appliedConditionals}
            activeConditional={activeConditional}
            activeDateFeature={activeDateFeature}
            sliderValues={sliderValues}
            onFiltersApplied={this.onFiltersApplied}
            type={DataTypes.TIMESTAMP}
          />
        );
      } else if (type === DataTypes.DATE) {
        return (
          <DateFilterBy
            selectables={selectables}
            filterName={columnName}
            appliedConditionals={appliedConditionals}
            activeDateFeature={activeDateFeature}
            activeConditional={activeConditional}
            sliderValues={sliderValues}
            onFiltersApplied={this.onFiltersApplied}
            type={DataTypes.DATE}
          />
        );
      }
    } else if (filterType === FilterType.SHOW_COLUMNS) {
      return (
        <ShowColumnsSubMenu
          activeMenu={data}
          columnName={columnName}
          dataType={dataType}
          onFiltersApplied={this.onFiltersApplied}
        />
      );
    } else if (filterType === FilterType.SORT_BY) {
      return (
        <SortBySubMenu
          activeMenu={data}
          columnName={columnName}
          dataType={dataType}
          onFiltersApplied={this.onFiltersApplied}
        />
      );
    }
    return null;
  }

  render() {
    const tagStyle = {
      tagWrapper: {
        marginTop: 5,
        width: '100%',
        position: 'relative',
      },
      close: {
        position: 'absolute',
        right: 9,
        top: 6,
      },
    };

    /**
     * styles from props for current Component overrides all imported Component's styles
     * so we need to include this during the destructure of this.props
     */
    const {
      onFilterTagClick,
      styles,
      style,
      onTagClick,
      ...tagProps,
    } = this.props;
    const { visible } = this.state;
    return (
      <div styleName="filter-tag" ref={_ref => this.filterTag = _ref}>
        <Tag
          style={tagStyle}
          gptRed
          onTagClick={this.onFilterTagClick}
          {...tagProps}
        />
        <div styleName="submenu">
          {visible ? this.renderFilterSubMenu() : null}
        </div>
        {/* <div styleName="triangle" />*/}
      </div>
    );
  }
}

export default cssModules(FilterTag, styles);
