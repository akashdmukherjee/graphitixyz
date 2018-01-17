import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import Rheostat from 'rheostat';
import ReactTooltip from 'react-tooltip';
import moment from 'moment';
import DateTime from 'react-datetime';
import styles from '../submenu.styl';
import Conditional, { Types, DateConditionals } from '../Conditional';
import conditionals from './conditionals';
import getDateFeatures from './features';
import '../slider.css';
import 'react-datetime/css/react-datetime.css';
import './react-datetime.css';

const dateFormat = {
  timestamp: 'YYYY/MM/DD HH:mm:ss',
  date: 'YYYY/MM/DD',
};

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

class DateFilterBy extends React.Component {
  static propTypes = {
    sliderValues: PropTypes.arrayOf(PropTypes.number),
  };
  static defaultProps = {
    sliderValues: [],
  };
  constructor(props) {
    super(props);
    const {
      type,
      activeDateFeature,
      activeConditional,
      sliderValues,
      appliedConditionals,
    } = props;
    this.dateFeatures = getDateFeatures(type);
    if (this.dateFeatures) {
      this.dateFeatures[0].active = true;
    }

    const dateState = {
      activeDateFeature: activeDateFeature || this.dateFeatures[0],
      dateFeatures: this.updateDateFeatures(this.dateFeatures),
      dateConditionals: this.updateDateConditionals(this.dateFeatures),
      appliedConditionals,
      activeConditional,
      date: moment(),
      startDate: null,
      endDate: null,
    };
    let sliderMinMaxValues = [1, 50];
    if (dateState.activeDateFeature && dateState.activeDateFeature.slider) {
      sliderMinMaxValues = dateState.activeDateFeature.sliderMinMaxValues;
      sliderValues[0] = sliderMinMaxValues[0];
    }
    this.state = {
      sliderMinMaxValues,
      sliderValues,
      hideInputs: false,
      focused: false,
      dateSelected: false,
      focusedInput: null,
      ...dateState,
    };
  }

  updateDateFeatures = dateFeatures => {
    const dateFeaturesCopy = dateFeatures.slice(0);
    const { activeDateFeature } = this.props;
    if (!activeDateFeature) {
      return dateFeatures;
    }
    // console.info(
    //   'Date Features:',
    //   appliedConditionals,
    //   activeConditional,
    //   dateFeatureMatch
    // );
    return dateFeaturesCopy.map(dateFeature => {
      const dateFeatureCopy = { ...dateFeature, active: false };
      if (dateFeatureCopy.text === activeDateFeature.text) {
        dateFeatureCopy.active = true;
      }
      return dateFeatureCopy;
    });
  };

  updateDateConditionals = dateFeatures => {
    let { activeConditional, activeDateFeature } = this.props;
    const conditionalsCopy = { ...conditionals };
    if (!activeConditional && !activeDateFeature) {
      return conditionalsCopy[dateFeatures[0].conditionalType].slice(0);
    }
    const dateConditionals = conditionalsCopy[
      activeDateFeature.conditionalType
    ].slice(0);
    return dateConditionals.map(dateConditional => {
      const dateConditionalCopy = { ...dateConditional, active: false };
      if (dateConditionalCopy.text === activeConditional.text) {
        dateConditionalCopy.active = true;
      }
      return dateConditionalCopy;
    });
  };

  onsliderValuesUpdated = obj => {
    const { filterName } = this.props;
    const {
      sliderValues,
      appliedConditionals,
      activeDateFeature,
      activeConditional,
    } = this.state;
    const conditionalValue = activeConditional.value;
    activeConditional &&
      (appliedConditionals[filterName][conditionalValue][
        activeDateFeature.value
      ] = obj.values.slice(0, obj.values.length));
    if (obj.values.length === 1) {
      obj.values.push(sliderValues[1]);
    }
    console.info(conditionalValue, obj);
    this.setState({ sliderValues: obj.values, appliedConditionals });
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
    const { filterName, sliderValues } = this.props;
    const dateFeatureValue = activeDateFeature.value;
    if (!appliedConditionals[filterName]) {
      appliedConditionals[filterName] = {};
    }
    if (
      dateFeatureValue && !appliedConditionals[filterName][dateFeatureValue]
    ) {
      appliedConditionals[filterName][dateFeatureValue] = {};
    }
    let sliderMinMaxValues;
    if (activeDateFeature.slider && activeDateFeature.sliderMinMaxValues) {
      sliderMinMaxValues = activeDateFeature.sliderMinMaxValues;
      sliderValues[0] = sliderMinMaxValues[0];
    }
    // ////console.info(activeDateFeature);
    this.setState({
      activeDateFeature,
      appliedConditionals,
      sliderMinMaxValues,
      sliderValues,
      dateConditionals: conditionals[activeDateFeature.conditionalType],
      dateFeatures,
      hideInputs: stateDateFeatures.text !== activeDateFeature.text,
    });
  };

  onDateConditionalClick = (event, activeConditional) => {
    event.nativeEvent.stopImmediatePropagation();
    const {
      dateConditionals: stateDateConditionals,
      activeDateFeature,
      date,
    } = this.state;
    const { type } = this.props;
    // let noneSelected = this.state.noneSelected;
    const dateConditionals = stateDateConditionals
      .slice(0)
      .map(dateConditional => {
        const object = Object.assign({}, dateConditional);
        if (dateConditional.text === activeConditional.text) {
          object.active = !dateConditional.active;
        } else {
          object.active = false;
        }
        return object;
      });
    const appliedConditionals = {};
    const filterName = this.props.filterName;
    const conditionalValue = activeConditional.value;
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
        appliedConditionals[filterName][conditionalValue] = [
          date.format(dateFormat[type]),
        ];
      }
    }
    this.setState({
      activeConditional,
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
      activeConditional,
    } = this.state;
    const { type } = this.props;
    if (appliedConditionals && activeDateFeature) {
      // console.info(activeDateFeature.value, activeConditional.value, appliedConditionals);
      if (activeDateFeature.value) {
        appliedConditionals[this.props.filterName][activeConditional.value][
          activeDateFeature.value
        ] = date.format(dateFormat[type]);
      } else {
        appliedConditionals[this.props.filterName][activeConditional.value] = [
          date.format(dateFormat[type]),
        ];
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
    // console.info(
    //   'FSM onDateFiltersApplied',
    //   appliedConditionals,
    //   activeDateFeature,
    //   propsAppliedConditionals
    // );
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
    // reset state after it's applied
    const conditionalsCopy = { ...conditionals };
    this.state.appliedConditionals = {};
    this.state.activeConditional = null;
    this.state.activeDateFeature = { ...this.dateFeatures[0] };
    this.state.dateConditionals = conditionalsCopy[
      this.dateFeatures[0].conditionalType
    ].slice(0);

    onFiltersApplied(object);
  };

  render() {
    const { filterName, type } = this.props;
    const { activeConditional, hideInputs } = this.state;

    let inputsClassName = 'inputs';
    if (
      !activeConditional ||
      (activeConditional && activeConditional.noInput) ||
      hideInputs
    ) {
      inputsClassName = 'inputs-hide';
    } else if (
      type === Types.DATE &&
      activeConditional &&
      activeConditional.numberOfMonths === 2
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
          <button styleName="apply-btn" onClick={this.onDateFiltersAppplied}>
            Apply
          </button>
        </div>
        <div styleName="conditionals-wrapper" key={filterName}>
          <div styleName="conditionals">
            {this.renderDateFeatures()}
          </div>
          <div styleName="date-conditionals">
            {this.renderDateConditionals()}
          </div>
          <div styleName={inputsClassName}>
            {this.renderDatePicker()}
          </div>
        </div>

      </div>
    );
  }

  renderSlider = () => {
    const {
      activeConditional,
      activeDateFeature,
      sliderValues,
      sliderMinMaxValues,
      enterKeyPressedOnInput,
    } = this.state;
    const { appliedConditionals } = this.props;
    let currentActiveConditional = activeConditional;
    // console.info(sliderMinMaxValues, currentActiveConditional);
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
                min={sliderMinMaxValues[0]}
                max={sliderMinMaxValues[1]}
                values={values}
                handle={sliderHandle}
                onValuesUpdated={this.onsliderValuesUpdated}
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
              value={values[0]}
              onChange={this.onSliderInputChange}
              onKeyPress={this.onSliderInputChange}
            />
            {values.length > 1
              ? <input
                type="text"
                name="second"
                value={values[1]}
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

  renderDatePicker = () => {
    const {
      activeConditional,
      activeDateFeature,
      date: singleDate,
      startDate,
      endDate,
    } = this.state;
    if (
      activeConditional === undefined ||
      activeConditional === null ||
      activeConditional.noInput
    ) {
      return null;
    }
    if (activeDateFeature.slider) {
      return this.renderSlider();
    }

    if (activeConditional.numberOfMonths === 1) {
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

  renderDateFeatures = () => {
    const { dateFeatures } = this.state;
    const { type } = this.props;
    return dateFeatures.map(dateFeature => (
      <Conditional
        key={dateFeature.value}
        conditional={dateFeature}
        conditionalType={type}
        onClick={this.onDateFeatureClick}
        active={dateFeature.active}
      />
    ));
  };

  renderDateConditionals = () => {
    const { activeDateFeature, dateConditionals } = this.state;
    if (activeDateFeature === null || activeDateFeature === undefined) {
      return null;
    }
    const { type } = this.props;
    return dateConditionals.map(conditional => (
      <Conditional
        key={conditional.value}
        conditional={conditional}
        type={type}
        onClick={this.onDateConditionalClick}
        active={conditional.active}
      />
    ));
  };
}

export default cssModules(DateFilterBy, styles);
