import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const Button = ({
  text,
  onClick,
  style,
  children,
  styleClassName,
  isIconLeftAligned,
}) => (
  <button onClick={onClick} styleName={styleClassName} style={style}>
    {isIconLeftAligned ? children : null}
    {text}
    {isIconLeftAligned ? null : children}
  </button>
);
Button.propTypes = {
  text: PropTypes.string.isRequired,
  style: PropTypes.object,
  styleClassName: PropTypes.string,
  isIconLeftAligned: PropTypes.bool,
  children: PropTypes.any,
  onClick: PropTypes.func,
};

Button.defaultProps = {
  isIconLeftAligned: true,
};

export default cssModules(Button, styles);
