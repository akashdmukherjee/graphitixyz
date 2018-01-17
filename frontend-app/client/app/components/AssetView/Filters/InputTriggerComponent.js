import React from 'react';
import cssModules from 'react-css-modules';
import styles from './filter.styl';

const InputTriggerComponent = ({ toggleMenus, placeholder }) => (
  <div styleName="filter">
    <div styleName="add" onClick={toggleMenus}>+</div>
    <input
      type="text"
      placeholder={placeholder}
      value=""
      onFocus={toggleMenus}
    />
  </div>
);

InputTriggerComponent.propTypes = {
  toggleMenus: React.PropTypes.func.isRequired,
  placeholder: React.PropTypes.string.isRequired,
};

export default cssModules(InputTriggerComponent, styles);
