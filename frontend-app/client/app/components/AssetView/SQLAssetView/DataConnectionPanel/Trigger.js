import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './trigger.styl';

const propTypes = {
  data: PropTypes.object,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

const defaultProps = {
  data: {},
};

const Trigger = ({ onClick, label, data }) => {
  return (
    <div
      styleName="selector"
      onClick={onClick}
      style={
        data.showFixedLayer && !data.connectionSelectionStepDone
          ? {
            backgroundColor: '#fff',
            zIndex: 7,
          }
          : null
      }
    >
      <div styleName="text-icons">
        <i className="fa fa-plug" />
        <h5 styleName="label">
          {label}
        </h5>
        <i className="icon-arrow-down" />
      </div>
    </div>
  );
};

Trigger.propTypes = propTypes;
Trigger.defaultProps = defaultProps;

export default cssModules(Trigger, styles);
