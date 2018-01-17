import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const Button = ({ text, onClick, style, children, styleClassName }) => (
  <button onClick={onClick} styleName={styleClassName} style={style}>
    {children} {text}
  </button>
);

export default cssModules(Button, styles);
