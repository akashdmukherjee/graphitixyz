// change grid step component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import { connect as reduxConnect } from 'react-redux';
import {
  changeCanvasGridStep,
} from './GridStepSwitcherActions';
import style from './grid-step-switcher.styl';

const GridStepSwitcher = (props) => {
  const {
    canvasGridStep,
    colorType,
  } = props;
  const handleChangeGridStep = (e) => {
    e.preventDefault();
    const num = parseFloat(e.currentTarget['grid-step'].value);
    if (!isNaN(num) && typeof num === 'number') {
      props.changeCanvasGridStep(num);
    }
  };
  return (
    <form onSubmit={handleChangeGridStep} styleName="grid-size-switcher">
      <input
        type="text"
        name="grid-step"
        styleName="menu-input-text"
        placeholder={canvasGridStep}
      />
      <button type="submit" styleName={colorType === 'black' ? 'menu-button-black' : 'menu-button'}>
        <i className="fa fa-check" aria-hidden="true"></i>
      </button>
    </form>
  );
};

GridStepSwitcher.propTypes = {
  canvasGridStep: React.PropTypes.number.isRequired,
  colorType: React.PropTypes.string,
  changeCanvasGridStep: React.PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  canvasGridStep: state.canvasGridStep,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({
  changeCanvasGridStep,
}, dispatch);

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  cssModules(GridStepSwitcher, style)
);
