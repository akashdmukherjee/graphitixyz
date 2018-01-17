import React, { Component, PropTypes } from 'react';
import Rheostat from 'rheostat';
import cssModules from 'react-css-modules';
import ReactTooltip from 'react-tooltip';
import Conditional, { Types } from '../Conditional';
import styles from '../submenu.styl';
import * as Criteria from '../../../Menus/criteria';
import conditionals from './conditionals';
import '../slider.css';

const sliderHandle = props => {
  return (
    <div {...props} data-tip data-for={`handle-${props['data-handle-key']}`}>
      <ReactTooltip id={`handle-${props['data-handle-key']}`} type="dark" effect="solid" multiline>
        <span>
          {props['aria-valuenow']}
        </span>
      </ReactTooltip>
    </div>
  );
};

const generateRandomId = () => Math.random().toString().slice(3, 10);

class NumericFilterBy extends Component {
  static propTypes = {
    appliedConditionals: PropTypes.object,
    sliderValues: PropTypes.arrayOf(PropTypes.number),
    sliderMinMaxValues: PropTypes.arrayOf(PropTypes.number),
    activeConditional: PropTypes.object,
    filterName: PropTypes.string.isRequired,
    onFiltersApplied: PropTypes.func,
    type: PropTypes.string.isRequired,
  };

  static defaultProps = {
    activeConditional: null,
    appliedConditionals: {},
    sliderValues: [1, 100],
    sliderMinMaxValues: [1, 100],
  };

  constructor(props) {
    super(props);
    const { appliedConditionals, activeConditional, sliderValues, sliderMinMaxValues } = props;
    this.state = {
      appliedConditionals,
      activeConditional,
      sliderValues,
      sliderMinMaxValues,
      sliderInputValues: sliderValues,
      conditionals: this.updateConditionals(),
    };
    this.sliderInputValues = [];
  }

  updateConditionals = () => {
    const { activeConditional } = this.props;
    const conditionalsSlice = conditionals.slice(0);
    if (!activeConditional) return conditionalsSlice;
    return conditionalsSlice.map(conditional => {
      const conditionalObject = { ...conditional };
      if (conditionalObject.text === activeConditional.text) {
        conditionalObject.active = true;
      }
      return conditionalObject;
    });
  };

  onSliderValuesUpdated = obj => {
    const { filterName } = this.props;
    const { sliderValues, appliedConditionals, activeConditional } = this.state;
    const conditionalValue = activeConditional.value;
    activeConditional && (appliedConditionals[filterName][conditionalValue] = obj.values);
    if (obj.values.length === 1) {
      obj.values.push(sliderValues[1]);
    }
    this.setState({ sliderValues: obj.values, appliedConditionals });
  };

  onSliderInputChange = event => {
    const targetName = event.target.name;
    const targetValue = event.target.value;
    const sliderValues = this.state.sliderValues;
    // ////console.info(this, targetName, targetValue);
    if (targetName === 'first') {
      // sliderValues[0] = targetValue;
      this.sliderInputValues[0] = targetValue.length ? parseFloat(targetValue) : 0;
      sliderValues[0] = this.sliderInputValues[0];
    } else if (targetName === 'second') {
      // sliderValues[1] = targetValue;
      this.sliderInputValues[1] = targetValue.length ? parseFloat(targetValue) : 0;
      sliderValues[1] = this.sliderInputValues[1];
    }
    this.setState({ sliderValues });
  };

  onConditionalClick = (event, activeConditional) => {
    event.stopPropagation();
    const { conditionals: stateConditionals, appliedConditionals, sliderValues } = this.state;
    const { filterName } = this.props;
    const newConditionals = stateConditionals.slice(0).map(conditional => {
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
     */

    /**
     * clear out appliedConditionals on each conditional click
     * since we just need only the currently clicked conditional and its values
     */
    appliedConditionals[filterName] = {};
    appliedConditionals[filterName][conditionalValue] = sliderValues;

    if (
      conditionalValue === Criteria.IS_NULL ||
      conditionalValue === Criteria.IS_NOT_NULL ||
      conditionalValue === Criteria.IS_EMPTY ||
      conditionalValue === Criteria.IS_NOT_EMPTY
    ) {
      appliedConditionals[filterName][conditionalValue] = null;
    }
    // When a Conditional is clicked, refresh Selactables also
    this.setState(
      {
        activeConditional,
        conditionals: newConditionals,
        appliedConditionals,
      },
      () => {
        // console.info(this.state, this.props);
      }
    );
  };

  onFiltersApplied = () => {
    const {
      filterName,
      onFiltersApplied,
      appliedConditionals: propsAppliedConditionals,
    } = this.props;
    const { appliedConditionals } = this.state;
    let object = {
      appliedConditionals: {},
    };
    const currentColumnAppliedConditional = Object.assign({}, appliedConditionals[filterName]);
    const currentColumnAppliedConditionalCriterias = Object.keys(currentColumnAppliedConditional);
    /**
     * if appliedConditionals from props is not equal to appliedConditionals in state
     * then remove the criteria from state appliedConditionals
     */
    const propsColumnAppliedConditional = Object.assign({}, propsAppliedConditionals[filterName]);
    const propsAppliedConditionalsCriterias = Object.keys(propsColumnAppliedConditional);
    if (
      currentColumnAppliedConditionalCriterias.indexOf(propsAppliedConditionalsCriterias[0]) !==
        -1 &&
      currentColumnAppliedConditionalCriterias.length > 1
    ) {
      delete currentColumnAppliedConditional[propsAppliedConditionalsCriterias[0]];
    }
    /**
     * deep copy all appliedConditionals keys
     */
    currentColumnAppliedConditionalCriterias.forEach(key => {
      if (currentColumnAppliedConditional.hasOwnProperty(key)) {
        object.appliedConditionals[key] = currentColumnAppliedConditional[key];
      }
      if (currentColumnAppliedConditional[key] && !currentColumnAppliedConditional[key].length) {
        object = null;
      }
    });
    // reset state after it's applied
    this.state.appliedConditionals = {};
    this.state.activeConditional = null;
    this.state.conditionals = conditionals.slice(0);

    onFiltersApplied(object);
  };

  render() {
    const { filterName } = this.props;
    const { activeConditional, hideInputs } = this.state;

    let inputsClassName = 'inputs';
    if ((activeConditional && activeConditional.noInput) || !activeConditional || hideInputs) {
      inputsClassName = 'inputs-hide';
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
            <h5 styleName="value">
              {filterName}
            </h5>
          </div>
          <button styleName="apply-btn" onClick={this.onFiltersApplied}>
            Apply
          </button>
        </div>
        <div styleName="conditionals-wrapper" key={filterName}>
          <div styleName="conditionals">
            {this.renderConditionals()}
          </div>
          <div styleName={inputsClassName}>
            {this.renderSlider()}
          </div>
        </div>
      </div>
    );
  }
  renderSlider = () => {
    const {
      activeConditional,
      sliderValues,
      enterKeyPressedOnInput,
      sliderMinMaxValues,
    } = this.state;
    if (activeConditional && activeConditional.slider) {
      let values = sliderValues.slice(0, activeConditional.numberOfHandles);
      // check if it's `BETWEEN` conditional {numberOfHandles = 2}, so we need to have two values
      if (activeConditional.numberOfHandles === 2) {
        values = sliderValues.length === 2 ? [...sliderValues] : [...sliderMinMaxValues];
      }
      // console.info(values);
      return (
        <div styleName="slider-wrapper">
          <div styleName="slider">
            {activeConditional.numberOfHandles > 0 || enterKeyPressedOnInput
              ? <Rheostat
                min={sliderMinMaxValues[0]}
                max={sliderMinMaxValues[1]}
                values={values}
                handle={sliderHandle}
                onValuesUpdated={this.onSliderValuesUpdated}
                className={`rheostat ${activeConditional.rheostatBehaviour
                    ? activeConditional.rheostatBehaviour
                    : ''}`}
              />
              : null}
          </div>
          <div
            styleName={`slider-inputs${activeConditional.rheostatBehaviour
              ? `-${activeConditional.rheostatBehaviour}`
              : ''}`}
          >
            <input type="text" name="first" value={values[0]} onChange={this.onSliderInputChange} />
            {values.length > 1
              ? <input
                type="text"
                name="second"
                value={values[1]}
                onChange={this.onSliderInputChange}
              />
              : null}
          </div>
        </div>
      );
    }
    return null;
  };

  renderConditionals = () => {
    const conditionalsSlice = this.state.conditionals.slice(0);
    return conditionalsSlice.map(conditional => {
      const keyName = `${this.props.filterName}-${conditional.text}-${generateRandomId()}`;
      return (
        <Conditional
          key={keyName}
          type={this.props.type}
          conditional={conditional}
          onClick={this.onConditionalClick}
          active={conditional.active}
          keyName={keyName}
        />
      );
    });
  };
}

export default cssModules(NumericFilterBy, styles);
