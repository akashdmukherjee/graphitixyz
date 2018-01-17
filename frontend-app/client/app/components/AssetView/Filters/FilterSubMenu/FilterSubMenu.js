import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import DateTime from 'react-datetime';
import styles from './Types/submenu.styl';
import Selectable from './Types/Selectable';
import Conditional, { Types } from './Types/Conditional';
import moment from 'moment';
import Rheostat from 'rheostat';
import ReactTooltip from 'react-tooltip';
import './Types/slider.css';
import 'react-datetime/css/react-datetime.css';
import './Types/Date/react-datetime.css';
import * as Criteria from '../Menus/criteria';

const sliderHandle = props => {
  return (
    <div {...props} data-tip data-for={`handle-${props['data-handle-key']}`}>
      <ReactTooltip
        id={`handle-${props['data-handle-key']}`}
        type="dark"
        effect="solid"
        multiline
      >
        <span>
          {props['aria-valuenow']}
        </span>
      </ReactTooltip>
    </div>
  );
};

const dateFormat = {
  timestamp: 'YYYY/MM/DD HH:mm:ss',
  date: 'YYYY/MM/DD',
};
/**
 * TODO: Refactor FilterSubMenu into their respective DataTypes
 */
class FilterSubMenu extends React.Component {
  static propTypes = {
    appliedConditionals: PropTypes.object,
    type: PropTypes.string,
    selectables: PropTypes.arrayOf(PropTypes.object).isRequired,
    conditionals: PropTypes.arrayOf(PropTypes.object).isRequired,
    activeConditional: PropTypes.object,
    onCriteriaClick: PropTypes.func,
    onCriteriaValueChange: PropTypes.func,
    filterName: React.PropTypes.string.isRequired,
    conditionalType: React.PropTypes.string,
    onConditionalClick: React.PropTypes.func,
    onFiltersApplied: React.PropTypes.func,
    dateFeatures: React.PropTypes.arrayOf(React.PropTypes.object),
  };

  static defaultProps = {
    activeConditional: null,
    appliedConditionals: {},
    selectables: [],
    onCriteriaValueChange: () => null,
    onCriteriaClick: () => null,
  };

  constructor(props) {
    super(props);
    const {
      conditionals,
      dateFeatures,
      selectables,
      activeConditional,
      appliedConditionals,
    } = props;
    if (dateFeatures) {
      dateFeatures[0].active = true;
    }

    const dateState = {
      activeDateFeature: dateFeatures && dateFeatures[0],
      dateFeatures,
      dateConditionals: conditionals &&
        dateFeatures &&
        conditionals[dateFeatures[0].conditionalType],
      date: moment(),
      startDate: null,
      endDate: null,
    };
    let sliderValues = [1, 50];
    let sliderMinValue = sliderValues[0];
    let sliderMaxValue = sliderValues[1];
    if (dateState.activeDateFeature && dateState.activeDateFeature.slider) {
      sliderValues = dateState.activeDateFeature.sliderValues;
      sliderMinValue = sliderValues[0];
      sliderMaxValue = sliderValues[1];
    }
    this.state = {
      conditionals: this.updateConditionals(),
      selectables,
      noneSelected: false,
      sliderValues,
      enterKeyPressedOnInput: false,
      focused: false,
      focusedInput: null,
      appliedConditionals,
      sliderMinValue,
      sliderMaxValue,
      conditionalInputs: this.constructConditionalInputs(),
      currentNumberOfConditionalInputs: (activeConditional &&
        activeConditional.numberOfInputs) ||
        0,
      activeConditional,
      hideInputs: false,
      ...dateState,
    };
    // slider input values need to be a property
    // so that we can do a force render
    this.sliderInputValues = [1, 50];
    // this.conditionalInputs = this.constructConditionalInputs();
  }

  componentWillReceiveProps(nextProps) {
    const { selectables, activeConditional, appliedConditionals } = nextProps;

    if (selectables !== this.props.selectables) {
      // console.info(selectables);
      this.setState({ selectables });
    }
  }

  /**
   * constructConditionalInputs if there's an activeConditional in this.props with numberOfInputs > 0
   */
  constructConditionalInputs = () => {
    const { activeConditional, filterName, appliedConditionals } = this.props;
    const conditionalInputs = {};
    if (activeConditional && activeConditional.numberOfInputs) {
      for (let i = 0; i < activeConditional.numberOfInputs; ++i) {
        const inputAndKeyName = `${filterName}-${activeConditional.value}-${i}`;
        conditionalInputs[inputAndKeyName] =
          appliedConditionals[filterName][activeConditional.value][i];
      }
    }
    return conditionalInputs;
  };

  updateConditionals = () => {
    const { conditionals, activeConditional } = this.props;
    if (!activeConditional) return conditionals;
    // console.info(activeConditional);
    return conditionals.map(conditional => {
      // console.info(conditional, activeConditional);
      if (conditional.text === activeConditional.text) {
        conditional.active = true;
      }
      return conditional;
    });
  };

  onConditionalClick = (event, activeConditional) => {
    event.stopPropagation();
    const {
      conditionals: stateConditionals,
      selectables,
      appliedConditionals,
    } = this.state;
    const {
      selectables: propsSelectables,
      filterName,
      activeConditional: propsActiveConditional,
    } = this.props;
    const conditionals = stateConditionals.map(conditional => {
      const object = Object.assign({}, conditional);
      if (conditional.text === activeConditional.text) {
        object.active = true;
      } else {
        object.active = false;
      }
      return object;
    });
    // console.info(appliedConditionals);
    const conditionalValue = activeConditional.value;
    /**
     * construct appliedConditionals
     * appliedConditionals : {
     *    columnName: {
     *      criteria: values @Array
     *    }
     * }
     * check if there is appliedConditionals in this.props
     */
    if (!appliedConditionals[filterName]) {
      appliedConditionals[filterName] = {};
    }
    if (!appliedConditionals[filterName][conditionalValue]) {
      appliedConditionals[filterName][conditionalValue] = [];
    }
    if (
      conditionalValue === Criteria.IS_NULL ||
      conditionalValue === Criteria.IS_NOT_NULL ||
      conditionalValue === Criteria.IS_EMPTY ||
      conditionalValue === Criteria.IS_NOT_EMPTY
    ) {
      appliedConditionals[filterName][conditionalValue] = null;
    }
    /**
     * update currentNumberOfConditionalInputs
     */
    let currentNumberOfConditionalInputs = 0;
    if (activeConditional && activeConditional.numberOfInputs) {
      currentNumberOfConditionalInputs = activeConditional.numberOfInputs;
    }

    let newSelectables = propsSelectables;
    let newConditionalInputs = {};
    if (propsActiveConditional) {
      /**
     * if there is activeConditional in this.props and props.activeConditional.text === activeConditional.text,
     * then selectables should not be refreshed since we need to remember what was selected in FilterTag
     */
      if (propsActiveConditional.text !== activeConditional.text) {
        newSelectables = selectables.map(selectable => ({
          ...selectable,
          checked: false,
        }));
      }
      /**
     * conditionalInputs update logic
     */
      const propsActiveConditionalCriteria = propsActiveConditional.value;
      if (
        propsActiveConditional.text === activeConditional.text &&
        propsActiveConditional.value === conditionalValue &&
        (propsActiveConditionalCriteria === Criteria.CONTAINS ||
          propsActiveConditionalCriteria === Criteria.DOES_NOT_CONTAIN ||
          propsActiveConditionalCriteria === Criteria.ENDS_WITH ||
          propsActiveConditionalCriteria === Criteria.STARTS_WITH)
      ) {
        // console.info('match', propsActiveConditional, activeConditional);
        newConditionalInputs = this.constructConditionalInputs();
        currentNumberOfConditionalInputs =
          propsActiveConditional.numberOfInputs;
      }
    }
    // When a Conditional is clicked, refresh Selactables also
    this.setState(
      {
        activeConditional,
        conditionals,
        appliedConditionals,
        selectables: newSelectables,
        conditionalInputs: newConditionalInputs,
        currentNumberOfConditionalInputs,
      },
      () => {
        // console.info(this.state, this.props);
      }
    );
  };

  onInputChange = event => {
    const targetName = event.target.name;
    const targetValue = event.target.value;
    const targetType = event.target.type;
    const targetChecked = event.target.checked;
    const filterName = this.props.filterName;
    const {
      activeConditional,
      appliedConditionals,
      conditionalInputs,
    } = this.state;
    const conditionalValue = activeConditional.value;
    console.info(filterName, targetName, targetValue, targetChecked);
    if (targetType === 'checkbox') {
      const appliedConditionalValue =
        appliedConditionals[filterName][conditionalValue];
      if (targetChecked && appliedConditionalValue) {
        appliedConditionalValue.push(targetValue);
      } else {
        appliedConditionals[filterName][
          conditionalValue
        ] = appliedConditionalValue.filter(
          filterConditionalValue => filterConditionalValue !== targetValue
        );
      }
      /**
       * only a single Criteria is allowed in an appliedConditionals
       */
      // console.info(appliedConditionals, appliedConditionals[filterName]);
      this.setState({ appliedConditionals });
    } else {
      conditionalInputs[targetName] = targetValue;
      this.setState({ conditionalInputs }, () => {
        // console.info(conditionalInputs);
      });
    }
  };

  onInputBlur = event => {
    const filterName = this.props.filterName;
    const {
      activeConditional,
      appliedConditionals,
      conditionalInputs,
    } = this.state;
    const conditionalValue = activeConditional.value;
    const appliedConditionalValue =
      appliedConditionals[filterName][conditionalValue];
    // console.info(appliedConditionals, appliedConditionals[filterName]);
    if (appliedConditionalValue) {
      appliedConditionals[filterName][conditionalValue] = Object.keys(
        conditionalInputs
      ).map(key => conditionalInputs[key]);
    }
    this.setState({ appliedConditionals }, () => {
      // console.info(this.state);
    });
  };

  handleKeyPressOnInput = event => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      this.onInputBlur(event);
      this.addAnotherConditionalInput();
      event.target.blur();
    }
  };

  upsertItemInArray = (array, item) => {
    const arraySlice = array.slice();
    const index = arraySlice.findIndex(value => value === item);
    if (index === -1) {
      arraySlice.push(item);
    } else {
      arraySlice[index] = item;
    }
    return arraySlice;
  };

  onSliderValuesUpdated = obj => {
    const { filterName } = this.props;
    const {
      sliderValues,
      appliedConditionals,
      activeConditional,
      activeDateFeature,
      activeDateConditional,
    } = this.state;
    const conditionalValue = activeConditional
      ? activeConditional.value
      : activeDateConditional.value;
    activeDateConditional &&
      (appliedConditionals[filterName][conditionalValue][
        activeDateFeature.value
      ] = obj.values.slice(0, obj.values.length));
    activeConditional &&
      (appliedConditionals[filterName][conditionalValue] = obj.values);
    if (obj.values.length === 1) {
      obj.values.push(sliderValues[1]);
    }
    console.info(conditionalValue, obj);
    this.setState({ sliderValues: obj.values, appliedConditionals });
  };

  onSliderInputChange = event => {
    const targetName = event.target.name;
    const targetValue = event.target.value;
    const sliderValues = this.state.sliderValues;
    // ////console.info(this, targetName, targetValue);
    if (targetName === 'first') {
      // sliderValues[0] = targetValue;
      this.sliderInputValues[0] = targetValue.length
        ? parseFloat(targetValue)
        : 0;
      sliderValues[0] = this.sliderInputValues[0];
    } else if (targetName === 'second') {
      // sliderValues[1] = targetValue;
      this.sliderInputValues[1] = targetValue.length
        ? parseFloat(targetValue)
        : 0;
      sliderValues[1] = this.sliderInputValues[1];
    }
    this.setState({ sliderValues });
    // Update values on Enter key pressed
    // if (event.key === 'Enter') {
    //   sliderValues = this.sliderInputValues;
    //   this.setState({
    //     sliderValues,
    //     enterKeyPressedOnInput: true,
    //   }, () => {
    //     this.state.enterKeyPressedOnInput = false;
    //   });
    // }
  };

  addAnotherConditionalInput = () => {
    let { currentNumberOfConditionalInputs } = this.state;
    currentNumberOfConditionalInputs += 1;
    this.setState({ currentNumberOfConditionalInputs });
  };

  renderSlider = () => {
    const {
      activeConditional,
      activeDateConditional,
      activeDateFeature,
      sliderValues,
      enterKeyPressedOnInput,
      sliderMinValue,
      sliderMaxValue,
    } = this.state;
    let currentActiveConditional = activeConditional;
    if (activeDateConditional) {
      currentActiveConditional = activeDateConditional;
    }
    // console.info(sliderValues, currentActiveConditional);
    if (
      (currentActiveConditional && currentActiveConditional.slider) ||
      (activeDateFeature && activeDateFeature.slider)
    ) {
      const values = sliderValues.slice(
        0,
        currentActiveConditional.numberOfHandles
      );
      // console.info(values);
      return (
        <div styleName="slider-wrapper">
          <div styleName="slider">
            {currentActiveConditional.numberOfHandles > 0 ||
              enterKeyPressedOnInput
              ? <Rheostat
                min={sliderMinValue}
                max={sliderMaxValue}
                values={values}
                handle={sliderHandle}
                onValuesUpdated={this.onSliderValuesUpdated}
                className={`rheostat ${currentActiveConditional.rheostatBehaviour ? currentActiveConditional.rheostatBehaviour : ''}`}
              />
              : null}
          </div>
          <div
            styleName={`slider-inputs${currentActiveConditional.rheostatBehaviour ? `-${currentActiveConditional.rheostatBehaviour}` : ''}`}
          >
            <input
              type="text"
              name="first"
              value={sliderValues[0]}
              onChange={this.onSliderInputChange}
              onKeyPress={this.onSliderInputChange}
            />
            {values.length > 1
              ? <input
                type="text"
                name="second"
                value={sliderValues[1]}
                onChange={this.onSliderInputChange}
                onKeyPress={this.onSliderInputChange}
              />
              : null}
          </div>
        </div>
      );
    }
    return null;
  };

  renderConditionals = () => {
    const { conditionalType } = this.props;
    const conditionals = this.state.conditionals.map(conditional => {
      /**
       * TODO: Improve this, shouldn't rely on Math.random
       */
      const keyName = `${this.props.filterName}-${conditional.text}-${Math.random()}`;
      return (
        <Conditional
          key={keyName}
          type={conditionalType}
          conditional={conditional}
          onClick={this.onConditionalClick}
          active={conditional.active}
          keyName={keyName}
        />
      );
    });
    return conditionals;
  };

  renderConditionalInputs = () => {
    const {
      activeConditional,
      noneSelected,
      conditionalInputs,
      currentNumberOfConditionalInputs,
    } = this.state;
    const ConditionalInputs = [];
    if (activeConditional) {
      for (let i = 0; i < currentNumberOfConditionalInputs; ++i) {
        const inputAndKeyName = `${this.props.filterName}-${activeConditional.value}-${i}`;
        ConditionalInputs.push(
          <input
            key={inputAndKeyName}
            name={inputAndKeyName}
            value={conditionalInputs[inputAndKeyName]}
            type="text"
            placeholder={activeConditional.inputTypeText}
            styleName="conditional-input"
            onChange={this.onInputChange}
            onBlur={this.onInputBlur}
            onKeyPress={this.handleKeyPressOnInput}
          />
        );
      }
    }

    if (ConditionalInputs.length && !noneSelected) {
      return (
        <div styleName="conditional-inputs">
          {ConditionalInputs}
          <a
            styleName="add-another-value"
            onClick={this.addAnotherConditionalInput}
          >
            Add another value
          </a>
        </div>
      );
    }
    return null;
  };

  renderDateFeatures = () => {
    const { dateFeatures } = this.state;
    const { conditionalType } = this.props;
    return dateFeatures.map(dateFeature => (
      <Conditional
        key={dateFeature.value}
        conditional={dateFeature}
        conditionalType={conditionalType}
        onClick={this.onDateFeatureClick}
        active={dateFeature.active}
      />
    ));
  };

  renderDateConditionals = () => {
    const { activeDateFeature } = this.state;
    if (activeDateFeature === null || activeDateFeature === undefined) {
      return null;
    }
    const { dateConditionals } = this.state;
    const { conditionalType } = this.props;
    return dateConditionals.map(conditional => (
      <Conditional
        key={conditional.value}
        conditional={conditional}
        type={conditionalType}
        onClick={this.onDateConditionalClick}
        active={conditional.active}
      />
    ));
  };

  onDateFeatureClick = (event, activeDateFeature) => {
    event.nativeEvent.stopImmediatePropagation();
    const stateDateFeatures = [...this.state.dateFeatures];
    // let noneSelected = this.state.noneSelected;
    const dateFeatures = stateDateFeatures.map(dateFeature => {
      const object = Object.assign({}, dateFeature);
      if (dateFeature.text === activeDateFeature.text) {
        object.active = !dateFeature.active;
      } else {
        object.active = false;
      }
      return object;
    });
    const appliedConditionals = {};
    const filterName = this.props.filterName;
    const dateFeatureValue = activeDateFeature.value;
    if (!appliedConditionals[filterName]) {
      appliedConditionals[filterName] = {};
    }
    if (
      dateFeatureValue && !appliedConditionals[filterName][dateFeatureValue]
    ) {
      appliedConditionals[filterName][dateFeatureValue] = {};
    } else {
      appliedConditionals[filterName][dateFeatureValue] = [];
    }
    let sliderValues;
    let sliderMinValue;
    let sliderMaxValue;
    if (activeDateFeature.slider && activeDateFeature.sliderValues) {
      sliderValues = activeDateFeature.sliderValues;
      sliderMinValue = sliderValues[0];
      sliderMaxValue = sliderValues[1];
    }
    // ////console.info(activeDateFeature);
    this.setState({
      activeDateFeature,
      appliedConditionals,
      sliderValues,
      sliderMinValue,
      sliderMaxValue,
      dateConditionals: this.state.conditionals[
        activeDateFeature.conditionalType
      ],
      dateFeatures,
      hideInputs: stateDateFeatures.text !== activeDateFeature.text,
    });
  };

  onDateConditionalClick = (event, activeDateConditional) => {
    event.nativeEvent.stopImmediatePropagation();
    const {
      dateConditionals: stateDateConditionals,
      activeDateFeature,
      date,
    } = this.state;
    const { type } = this.props;
    // let noneSelected = this.state.noneSelected;
    const dateConditionals = stateDateConditionals.map(dateConditional => {
      const object = Object.assign({}, dateConditional);
      if (dateConditional.text === activeDateConditional.text) {
        object.active = !dateConditional.active;
      } else {
        object.active = false;
      }
      return object;
    });
    const appliedConditionals = {};
    const filterName = this.props.filterName;
    const conditionalValue = activeDateConditional.value;
    if (!appliedConditionals[filterName]) {
      appliedConditionals[filterName] = {};
    }
    if (!appliedConditionals[filterName][conditionalValue]) {
      appliedConditionals[filterName][conditionalValue] = {};
      if (activeDateFeature.value) {
        appliedConditionals[filterName][conditionalValue][
          activeDateFeature.value
        ] = [];
      } else {
        appliedConditionals[filterName][conditionalValue] = [date.format(dateFormat[type])];
      }
    }
    this.setState({
      activeDateConditional,
      appliedConditionals,
      dateConditionals,
      hideInputs: false,
    });
  };

  onDateChange = (date, propertyName) => {
    const object = {
      dateSelected: true,
    };
    object[propertyName] = date;
    const {
      appliedConditionals,
      activeDateFeature,
      activeDateConditional,
    } = this.state;
    const { type } = this.props;
    if (appliedConditionals && activeDateFeature) {
      // console.info(activeDateFeature.value, activeDateConditional.value, appliedConditionals);
      if (activeDateFeature.value) {
        appliedConditionals[this.props.filterName][activeDateConditional.value][
          activeDateFeature.value
        ] = date.format(dateFormat[type]);
      } else {
        appliedConditionals[this.props.filterName][
          activeDateConditional.value
        ] = [date.format(dateFormat[type])];
      }
      object.appliedConditionals = appliedConditionals;
    }
    this.setState(object, () => {
      // //console.info(this.state);
    });
  };

  onDatesChange = ({ startDate, endDate }) => {
    // //console.info(this, startDate, endDate);
    this.setState({ startDate, endDate });
  };

  onFocusedInputChange = focusedInput => {
    // //console.info(focusedInput);
    this.setState({ focusedInput });
  };

  onFocusedChange = ({ focused }) => {
    // //console.info(focused);
    this.setState({ focused });
  };

  renderSeperator = () => {
    return (
      <div styleName="seperator">
        <hr />
        <span>or</span>
      </div>
    );
  };

  renderDatePicker = () => {
    const {
      activeDateConditional,
      activeDateFeature,
      date: singleDate,
      startDate,
      endDate,
    } = this.state;
    if (
      activeDateConditional === undefined ||
      activeDateConditional === null ||
      activeDateConditional.noInput
    ) {
      return null;
    }
    if (activeDateFeature.slider) {
      return this.renderSlider();
    }

    if (activeDateConditional.numberOfMonths === 1) {
      return (
        <div styleName="dt-wrapper">
          <ul>
            <li>
              <input type="radio" name="date-select" id="curr-date" />
              <label htmlFor="curr-date">
                <div styleName="label-content">
                  Current Date
                </div>
              </label>
            </li>
            <li>
              <input type="radio" name="date-select" id="date-selector" />
              <label htmlFor="date-selector">
                <div styleName="label-content">
                  <DateTime
                    inputProps={{
                      placeholder: 'Select Date',
                    }}
                    value={singleDate}
                    onChange={date => {
                      this.onDateChange(date, 'date');
                    }}
                    className={this.state.dateSelected ? 'active' : false}
                    timeFormat={
                      activeDateFeature &&
                        activeDateFeature.text === 'Full Date'
                    }
                  />
                </div>
              </label>
            </li>
          </ul>
        </div>
      );
    }

    return (
      <div styleName="dt-wrapper">
        <ul>
          <li>
            <input type="radio" name="between" id="date-inputs" />
            <label htmlFor="date-inputs">
              <div styleName="label-content">
                <div styleName="dates-wrapper">
                  <DateTime
                    inputProps={{
                      placeholder: 'Start Date',
                    }}
                    value={startDate}
                    onChange={date => {
                      this.onDateChange(date, 'startDate');
                    }}
                    className={this.state.dateSelected ? 'active' : null}
                    timeFormat={
                      activeDateFeature &&
                        activeDateFeature.text === 'Full Date'
                    }
                  />
                  <DateTime
                    inputProps={{
                      placeholder: 'End Date',
                    }}
                    value={endDate}
                    onChange={date => {
                      this.onDateChange(date, 'endDate');
                    }}
                    className={
                      this.state.dateSelected ? 'active endDate' : 'endDate'
                    }
                    timeFormat={
                      activeDateFeature &&
                        activeDateFeature.text === 'Full Date'
                    }
                  />
                </div>
              </div>
            </label>
          </li>
          <li>
            <input type="radio" name="between" id="nextDays" />
            <label htmlFor="nextDays">
              <div styleName="label-content">
                <div styleName="days-selector">
                  <span styleName="type">Next</span>
                  <span><input placeholder="" /></span>
                  <span styleName="days">days</span>
                </div>
              </div>
            </label>
          </li>
          <li>
            <input type="radio" name="between" id="prevDays" />
            <label htmlFor="prevDays">
              <div styleName="label-content">
                <div styleName="days-selector">
                  <span styleName="type">Previous</span>
                  <span><input placeholder="" /></span>
                  <span styleName="days">days</span>
                </div>
              </div>
            </label>
          </li>
        </ul>
      </div>
    );
  };

  onSelectableSelect = (event, data) => {
    // //console.info(data);
    event.stopPropagation();
  };

  renderSelectables = () => {
    const {
      activeConditional,
      noneSelected,
      appliedConditionals,
      selectables,
    } = this.state;
    const { filterName } = this.props;
    // console.info(activeConditional, appliedConditionals);
    // console.info(
    //   selectables,
    //   filterName,
    //   activeConditional,
    //   noneSelected,
    //   appliedConditionals
    // );
    if (
      selectables &&
      selectables.length &&
      activeConditional &&
      activeConditional.selectables &&
      !noneSelected
    ) {
      let updatedSelectables = selectables;
      const activeConditionalValue = appliedConditionals[filterName][
        activeConditional.value
      ].slice(0);
      if (activeConditionalValue && activeConditionalValue.length) {
        updatedSelectables = selectables.map(selectable => {
          const object = Object.assign({}, selectable);
          const index = activeConditionalValue.findIndex(
            conditionalValue => conditionalValue === object.text
          );
          if (index !== -1) {
            object.checked = true;
          }
          // ////console.info(selectable, index);
          return object;
        });
      }
      const Selectables = updatedSelectables.map(selectable => {
        const keyName = `${filterName}-${activeConditional.value}-${selectable.text}`;
        return (
          <Selectable
            keyName={keyName}
            key={keyName}
            label={selectable.text}
            onSelectChange={this.onInputChange}
            checked={selectable.checked}
          />
        );
      });
      return (
        <div styleName="multi-select">
          {Selectables}
        </div>
      );
    }
    return null;
  };

  onFiltersApplied = () => {
    const {
      filterName,
      onFiltersApplied,
      appliedConditionals: propsAppliedConditionals,
      type,
    } = this.props;
    if (type === 'date') {
      this.onDateFiltersAppplied();
      return;
    }
    const { appliedConditionals } = this.state;
    let object = {
      appliedConditionals: {},
    };
    const currentColumnAppliedConditional = Object.assign(
      {},
      appliedConditionals[filterName]
    );
    const currentColumnAppliedConditionalCriterias = Object.keys(
      currentColumnAppliedConditional
    );
    /**
     * if appliedConditionals from props is not equal to appliedConditionals in state
     * then remove the criteria from state appliedConditionals
     */
    const propsColumnAppliedConditional = Object.assign(
      {},
      propsAppliedConditionals[filterName]
    );
    const propsAppliedConditionalsCriterias = Object.keys(
      propsColumnAppliedConditional
    );
    if (
      currentColumnAppliedConditionalCriterias.indexOf(
        propsAppliedConditionalsCriterias[0]
      ) !== -1 && currentColumnAppliedConditionalCriterias.length > 1
    ) {
      delete currentColumnAppliedConditional[
        propsAppliedConditionalsCriterias[0]
      ];
    }
    /**
     * deep copy all appliedConditionals keys
     */
    currentColumnAppliedConditionalCriterias.forEach(key => {
      if (currentColumnAppliedConditional.hasOwnProperty(key)) {
        object.appliedConditionals[key] = currentColumnAppliedConditional[key];
      }
      if (
        currentColumnAppliedConditional[key] &&
        !currentColumnAppliedConditional[key].length
      ) {
        object = null;
      }
    });
    this.state.appliedConditionals = {};
    this.state.activeConditional = null;
    onFiltersApplied(object);
  };

  /**
   * handle date and timestamp Apply Filters
   */
  onDateFiltersAppplied = () => {
    const {
      filterName,
      onFiltersApplied,
      appliedConditionals: propsAppliedConditionals,
    } = this.props;
    const { appliedConditionals, activeDateFeature } = this.state;
    const object = {
      appliedConditionals: {},
    };
    console.info(
      'FSM onDateFiltersApplied',
      appliedConditionals,
      activeDateFeature,
      propsAppliedConditionals
    );
    const currentColumnAppliedConditional = Object.assign(
      {},
      appliedConditionals[filterName]
    );
    const currentColumnAppliedConditionalCriterias = Object.keys(
      currentColumnAppliedConditional
    );
    /**
     * deep copy all appliedConditionals keys
     */
    object.appliedConditionals = currentColumnAppliedConditional;
    onFiltersApplied(object);
  }

  render() {
    const { filterName, conditionalType } = this.props;
    const { activeConditional, activeDateConditional, hideInputs } = this.state;

    let inputsClassName = 'inputs';
    if (
      (activeConditional && activeConditional.noInput) ||
      (!activeConditional && !activeDateConditional) ||
      (activeDateConditional && activeDateConditional.noInput) ||
      hideInputs
    ) {
      inputsClassName = 'inputs-hide';
    } else if (
      conditionalType === Types.DATE &&
      activeDateConditional &&
      activeDateConditional.numberOfMonths === 2
    ) {
      inputsClassName = 'inputs-date';
    }

    return (
      <div
        styleName="submenu-wrapper"
        ref={_ref => {
          this.filterBySubMenu = _ref;
        }}
        onClick={e => {
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        <div styleName="header">
          <div styleName="labels">
            <h5 styleName="label">Filter On:</h5>
            <h5 styleName="value">{filterName}</h5>
          </div>
          <button styleName="apply-btn" onClick={this.onFiltersApplied}>
            Apply
          </button>
        </div>
        <div styleName="conditionals-wrapper" key={filterName}>
          <div styleName="conditionals">
            {conditionalType === Types.DATE
              ? this.renderDateFeatures()
              : this.renderConditionals()}
          </div>
          {conditionalType === Types.DATE
            ? <div styleName="date-conditionals">
                {this.renderDateConditionals()}
              </div>
            : null}
          <div styleName={inputsClassName}>
            {this.renderSelectables()}
            {this.renderConditionalInputs()}
            {conditionalType === Types.DATE
              ? this.renderDatePicker()
              : this.renderSlider()}
          </div>
        </div>

      </div>
    );
  }
}

export default cssModules(FilterSubMenu, styles);
