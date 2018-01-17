import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './trigger.styl';

const Trigger = ({ onClick, label }) => {
  return (
    <div styleName="FilterByTags-trigger" onClick={onClick}>
      <h5>Tags</h5>
      <div>{label}</div>
    </div>
  );
};

export default cssModules(Trigger, styles);
