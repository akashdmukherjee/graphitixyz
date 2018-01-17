import React from 'react';
import cssModules from 'react-css-modules';
import styles from './selectable.styl';

const Selectable = ({ label, onSelectChange, checked, keyName }) => {
  return (
    <div styleName="selectable">
      <input
        type="checkbox"
        styleName="checkbox-custom"
        name={label}
        id={keyName}
        value={label}
        onChange={onSelectChange}
        checked={checked || false}
      />
      <label styleName="checkbox-custom-label" htmlFor={keyName}>
        {label}
      </label>
    </div>
  );
};

Selectable.propTypes = {
  label: React.PropTypes.string.isRequired,
  onSelectChange: React.PropTypes.func.isRequired,
};

export default cssModules(Selectable, styles);
