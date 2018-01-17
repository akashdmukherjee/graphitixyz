import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const FilterSetTrigger = ({ onClick, label }) => (
  <div className={styles.selector} onClick={onClick}>
    <h5 className={styles.label}>
      <i className="fa fa-wrench" />
      {label}
      <i className="icon-arrow-down" />
    </h5>
  </div>
);

FilterSetTrigger.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default cssModules(FilterSetTrigger, styles);
