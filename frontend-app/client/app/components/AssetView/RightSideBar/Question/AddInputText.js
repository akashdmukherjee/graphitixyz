import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './addInputText.styl';

const AddInputText = ({ placeholder, buttonText }) => {
  return (
    <div styleName="AddInputText-wrapper">
      <input
        type="text"
        placeholder={placeholder} 
      />
      <button>{buttonText}</button>
    </div>
  );
};

export default cssModules(AddInputText, styles);
