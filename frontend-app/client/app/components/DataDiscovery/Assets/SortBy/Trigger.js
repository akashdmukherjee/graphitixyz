import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './trigger.styl';

const Trigger = ({ label, onClick }) => {
  return (
    <div styleName="SortBy-trigger">
      <div styleName="label">Sort By: </div>
      <div styleName="trigger" onClick={onClick}>
        {label} <i className="icon-arrow-down" />
      </div>
    </div>
  );
};

export default cssModules(Trigger, styles);
