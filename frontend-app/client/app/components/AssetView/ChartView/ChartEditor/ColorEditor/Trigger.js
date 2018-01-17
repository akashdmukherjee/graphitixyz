import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './trigger.styl';

const Trigger = ({ onClick }) => <div onClick={onClick} styleName="icon-color" />;

Trigger.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default cssModules(Trigger, styles);
