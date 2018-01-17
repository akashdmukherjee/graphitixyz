import React from 'react';
import PropTypes from 'prop-types';
import Rheostat from 'rheostat';
import ReactTooltip from 'react-tooltip';
import './slider.css';

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

const Slider = ({ min, max, values, onSliderValuesUpdated }) => {
  return (
    <Rheostat
      min={min}
      max={max}
      values={values}
      onChange={onSliderValuesUpdated}
      algorithm={{
        getPosition(value, min, max) {
          const position = (value - min) / (max - min) * 100;
          return position;
        },

        getValue(pos, min, max) {
          const decimal = parseFloat(pos / 100).toFixed(2);

          if (pos === 0) {
            return min;
          } else if (pos === 100) {
            return max;
          }
          return (max - min) * decimal + min;
        },
      }}
      className={'rheostat'}
    />
  );
};

export default Slider;
