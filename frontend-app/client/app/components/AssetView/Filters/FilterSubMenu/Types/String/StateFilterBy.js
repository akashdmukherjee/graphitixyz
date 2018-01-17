import React, { PropTypes, Component } from 'react';
import Conditional, { Types } from '../Conditional';
import cssModules from 'react-css-modules';
import styles from '../submenu.styl';
import Selectable from '../Selectable';
import conditionals from './conditionals';
import * as Criteria from '../../../Menus/criteria';

const generateRandomId = () => Math.random().toString().slice(3, 10);

class StringFilterBy extends Component {
  constructor(props) {
    super(props);
    const { selectables, appliedConditionals, activeConditional } = props;

    this.state = {
      selectables: this.constructSelectables(selectables),
      appliedConditionals,
      activeConditional,
      conditionals: this.updateConditionals(),
      noneSelected: false,
      enterKeyPressedOnInput: false,
      focused: false,
      focusedInput: null,
      conditionalInputs: this.constructConditionalInputs(),
      currentNumberOfConditionalInputs: (activeConditional &&
        activeConditional.numberOfInputs) ||
        0,
      hideInputs: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { selectables } = nextProps;

    if (selectables !== this.props.selectables) {
      // console.info(selectables);
      this.setState(
        { selectables: this.constructSelectables(selectables) },
        () => {
          // console.info('State:', this.state.selectables);
        }
      );
    }
  }

  constructSelectables = selectables => {
    const { selectablesManipulation } = this.props;
    let Selectables = selectables && selectables.slice(0);
    // selectablesManipulation: false, then don't construct a selectables array with checked logic
    // then constructed selectables from outside the component needs to be passed down as prop
    // default value is true
    if (selectables && selectablesManipulation) {
      // selectables, selectables.hasOwnProperty(filterName), filterName);
      Selectables = Selectables.map(selectable => ({
        text: selectable,
        checked: false,
      }));
    }
    // console.info('selectables', Selectables);
    return Selectables;
  };

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
    const { activeConditional } = this.props;
    const conditionalsSlice = conditionals.slice(0);
    return conditionalsSlice.map(conditional => {
      const conditionalObject = { ...conditional };
      if (
        activeConditional && conditionalObject.text === activeConditional.text
      ) {
        conditionalObject.active = true;
      }
      return conditionalObject;
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
     * check if there is appliedConditionals in this.props
     */
    // if (!appliedConditionals[filterName]) {
    //   appliedConditionals[filterName] = {};
    // }
    // if (!appliedConditionals[filterName][conditionalValue]) {
    //   appliedConditionals[filterName][conditionalValue] = [];
    // }
    appliedConditionals[filterName] = {};
    appliedConditionals[filterName][conditionalValue] = [];
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

    let newSelectables = selectables;
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
        conditionals: newConditionals,
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
    // console.info(filterName, targetName, targetValue, targetChecked);
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

  addAnotherConditionalInput = () => {
    let { currentNumberOfConditionalInputs } = this.state;
    currentNumberOfConditionalInputs += 1;
    this.setState({ currentNumberOfConditionalInputs });
  };

  onSelectableSelect = (event, data) => {
    // //console.info(data);
    event.stopPropagation();
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
    // reset state
    this.state.appliedConditionals = {};
    this.state.conditionals = conditionals.slice(0);
    this.state.activeConditional = null;
    onFiltersApplied(object);
  };

  render() {
    const { filterName, conditionalType } = this.props;
    const { activeConditional, hideInputs } = this.state;

    let inputsClassName = 'inputs';
    if (
      (activeConditional && activeConditional.noInput) ||
      !activeConditional ||
      hideInputs
    ) {
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
            <h5 styleName="value">{filterName}</h5>
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
            {activeConditional ? this.renderSelectables() : null}
            {this.renderConditionalInputs()}
          </div>
        </div>

      </div>
    );
  }

  renderConditionals = () => {
    const { conditionalType } = this.props;
    return this.state.conditionals.map(conditional => {
      /**
       * TODO: Improve this, shouldn't rely on Math.random
       */
      const keyName = `${this.props.filterName}-${conditional.text}`;
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
}

StringFilterBy.propTypes = {
  selectables: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.string])
  ),
  selectablesManipulation: PropTypes.bool,
  appliedConditionals: PropTypes.object,
  type: PropTypes.string,
  activeConditional: PropTypes.object,
  filterName: PropTypes.string.isRequired,
  onFiltersApplied: PropTypes.func,
};

StringFilterBy.defaultProps = {
  selectablesManipulation: true,
  activeConditional: null,
  appliedConditionals: {},
};

export default cssModules(StringFilterBy, styles);
