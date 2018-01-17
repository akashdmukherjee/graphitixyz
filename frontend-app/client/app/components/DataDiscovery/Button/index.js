import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const Button = ({ text, onClick }) => (
  <button styleName="button" onClick={onClick}>
    {text}
  </button>
);

Button.defaultProps = {
  onClick: null,
};

Button.propTypes = {
  text: React.PropTypes.string.isRequired,
  onClick: React.PropTypes.func,
};

export default cssModules(Button, styles);
